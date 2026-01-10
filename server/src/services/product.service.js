const db = require("../db");

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

exports.list = async (q) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 12), 48);
  const offset = (page - 1) * limit;

  const filters = [];
  const params = [];
  let i = 1;

  // Only active
  filters.push(`p.is_active = true`);

  if (q.gender) {
    params.push(q.gender);
    filters.push(`p.gender = $${i++}`);
  }

  if (q.category) {
    // allow slug filter (women-dresses, men-shirts)
    params.push(q.category);
    filters.push(`c.slug = $${i++}`);
  }

  if (q.minPrice) {
    params.push(Number(q.minPrice));
    filters.push(`p.base_price >= $${i++}`);
  }

  if (q.maxPrice) {
    params.push(Number(q.maxPrice));
    filters.push(`p.base_price <= $${i++}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sortMap = {
    newest: "p.created_at DESC",
    price_asc: "p.base_price ASC",
    price_desc: "p.base_price DESC",
  };
  const orderBy = sortMap[q.sort] || sortMap.newest;

  // total count
  const countRes = await db.query(
    `
    SELECT COUNT(*)::int AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
    `,
    params
  );
  const total = countRes.rows[0]?.total ?? 0;

  // items
  params.push(limit, offset);
  const itemsRes = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price,
      p.tags, p.created_at,
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
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${i++} OFFSET $${i++}
    `,
    params
  );

  return {
    items: itemsRes.rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.detail = async (id) => {
  const productRes = await db.query(
    `
    SELECT
      p.*,
      c.name AS category_name,
      c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1 AND p.is_active = true
    `,
    [id]
  );

  const product = productRes.rows[0];
  if (!product) return null;

  const imagesRes = await db.query(
    `
    SELECT id, url, alt_text, sort_order
    FROM product_images
    WHERE product_id = $1
    ORDER BY sort_order ASC
    `,
    [id]
  );

  const variantsRes = await db.query(
    `
    SELECT id, size, color, sku, stock
    FROM product_variants
    WHERE product_id = $1
    ORDER BY color ASC, size ASC
    `,
    [id]
  );

  return {
    ...product,
    images: imagesRes.rows,
    variants: variantsRes.rows,
  };
};

const { cosine } = require("../utils/similarity");

exports.similar = async (productId, q) => {
  const limit = Math.min(Number(q.limit || 8), 24);

  // 1) Get source vector
  const srcRes = await db.query(
    `SELECT vector FROM product_embeddings WHERE product_id = $1`,
    [productId]
  );
  const src = srcRes.rows[0];
  if (!src) return [];

  // 2) Pull candidates (small dataset => rank in Node)
  const candRes = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price, p.tags, p.created_at,
      c.slug AS category_slug,
      pe.vector AS vector,
      (
        SELECT url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE p.is_active = true AND p.id <> $1
    `,
    [productId]
  );

  const scored = candRes.rows.map((r) => ({
    ...r,
    _score: cosine(src.vector, r.vector || []),
  }));

  scored.sort((a, b) => b._score - a._score);

  return scored.slice(0, limit).map(({ vector, _score, ...safe }) => safe);
};
