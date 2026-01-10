const db = require("../db");
const { cosine } = require("../utils/similarity");

function toLimit(v, def = 8) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(1, Math.min(Math.floor(n), 24));
}

async function productCardsByIds(ids) {
  if (!ids.length) return [];
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price, p.tags, p.created_at,
      c.slug AS category_slug,
      (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ANY($1::uuid[]) AND p.is_active = true
    `,
    [ids]
  );

  // Preserve original order
  const map = new Map(res.rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

exports.personalized = async ({ sessionId, limit }) => {
  const take = toLimit(limit, 8);

  // 1) Get recent "interest" events for this session
  // Use view_product and add_to_cart as signals
  const evRes = await db.query(
    `
    SELECT product_id, type, created_at
    FROM events
    WHERE session_id = $1
      AND product_id IS NOT NULL
      AND type IN ('view_product','add_to_cart','purchase')
    ORDER BY created_at DESC
    LIMIT 30
    `,
    [sessionId]
  );

  // If no history, fallback to trending
  if (evRes.rows.length === 0) {
    return exports.trending({ limit: take });
  }

  // 2) Build a small set of "seed" products (unique)
  const seedIds = [];
  const seen = new Set();
  for (const e of evRes.rows) {
    if (!seen.has(e.product_id)) {
      seedIds.push(e.product_id);
      seen.add(e.product_id);
    }
    if (seedIds.length >= 6) break;
  }

  // 3) Get seed vectors
  const vecRes = await db.query(
    `SELECT product_id, vector FROM product_embeddings WHERE product_id = ANY($1::uuid[])`,
    [seedIds]
  );
  const seedVectors = vecRes.rows;

  if (seedVectors.length === 0) {
    return exports.trending({ limit: take });
  }

  // 4) Load candidate pool (all products + vectors)
  const candRes = await db.query(
    `
    SELECT p.id, pe.vector
    FROM products p
    JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE p.is_active = true
    `
  );

  // Avoid recommending items already seen in session
  const blocked = new Set(seedIds);

  // 5) Score candidates by best similarity to any seed
  const scored = [];
  for (const c of candRes.rows) {
    if (blocked.has(c.id)) continue;

    let best = -1;
    for (const s of seedVectors) {
      const sim = cosine(s.vector, c.vector || []);
      if (sim > best) best = sim;
    }

    scored.push({ id: c.id, score: best });
  }

  scored.sort((a, b) => b.score - a.score);

  const topIds = scored.slice(0, take).map((x) => x.id);
  return await productCardsByIds(topIds);
};

exports.trending = async ({ limit }) => {
  const take = toLimit(limit, 8);

  // Weighted popularity: add_to_cart counts more than view_product; purchase counts most
  const res = await db.query(
    `
    SELECT
      e.product_id,
      SUM(
        CASE
          WHEN e.type = 'purchase' THEN 5
          WHEN e.type = 'add_to_cart' THEN 3
          WHEN e.type = 'view_product' THEN 1
          ELSE 0
        END
      )::int AS score
    FROM events e
    WHERE e.product_id IS NOT NULL
      AND e.type IN ('view_product','add_to_cart','purchase')
    GROUP BY e.product_id
    ORDER BY score DESC
    LIMIT $1
    `,
    [take]
  );

  const ids = res.rows.map((r) => r.product_id);

  // If no events exist (rare because you seeded 10k), fallback to newest products
  if (ids.length === 0) {
    const newest = await db.query(
      `
      SELECT id
      FROM products
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [take]
    );
    return await productCardsByIds(newest.rows.map((r) => r.id));
  }

  return await productCardsByIds(ids);
};
