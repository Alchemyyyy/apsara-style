const db = require("../db");
const { cosine } = require("../utils/similarity");
const { embedQueryPython } = require("./embedQuery.service");

const RULES = {
  women: {
    top: ["women-tops"],
    bottom: ["women-pants", "women-skirts"],
    shoes: ["women-shoes"],
    outerwear: ["women-outerwear", "women-blazers"],
    dress: ["women-dresses"],
  },
  men: {
    top: ["men-shirts", "men-t-shirts"],
    bottom: ["men-pants", "men-jeans"],
    shoes: ["men-shoes"],
    outerwear: ["men-outerwear", "men-blazers"],
  },
};

function pickBest(scored, excludeIds, limit = 1) {
  const out = [];
  for (const p of scored) {
    if (excludeIds.has(p.id)) continue;
    out.push(p);
    excludeIds.add(p.id);
    if (out.length >= limit) break;
  }
  return out;
}

function tagMatchBoost(product, { occasion, style }) {
  let boost = 0;
  const tags = product.tags || {};

  if (occasion && Array.isArray(tags.occasion) && tags.occasion.includes(occasion)) boost += 0.08;
  if (style && Array.isArray(tags.style) && tags.style.includes(style)) boost += 0.08;

  return boost;
}

async function loadCandidates({ gender, budgetMax }) {
  const params = [];
  const filters = ["p.is_active = true"];
  let i = 1;

  if (gender) {
    params.push(gender);
    filters.push(`p.gender = $${i++}`);
  }

  if (budgetMax && Number.isFinite(budgetMax)) {
    params.push(budgetMax);
    filters.push(`(COALESCE(p.discount_price, p.base_price) <= $${i++})`);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.gender, p.base_price, p.discount_price, p.tags,
      c.slug AS category_slug,
      pe.vector AS vector,
      (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    JOIN product_embeddings pe ON pe.product_id = p.id
    ${where}
    `,
    params
  );

  return res.rows;
}

exports.buildOutfit = async ({ sessionId, prompt, gender, occasion, style, budgetMax, k }) => {
  const K = Math.max(1, Math.min(Number(k || 3), 5)); // 1..5 variations
  const qVec = await embedQueryPython(prompt);

  const candidates = await loadCandidates({ gender, budgetMax });

  // Score candidates with semantic similarity + tag boost
  const scoredAll = candidates
    .map((p) => {
      const sem = cosine(qVec, p.vector || []);
      const boost = tagMatchBoost(p, { occasion, style });
      return { ...p, _score: sem + boost };
    })
    .sort((a, b) => b._score - a._score);

  const g = gender || "women";
  const rules = RULES[g] || RULES.women;

  const wantsDress =
    g === "women" &&
    (prompt.toLowerCase().includes("dress") ||
      (occasion && ["evening", "party", "wedding"].includes(occasion)));

  const clean = (p) => {
    if (!p) return null;
    const { vector, _score, ...safe } = p;
    return safe;
  };

  const pickFromCategoriesWithOffset = (allowedSlugs, excludeIds, offset, count = 1) => {
    const filtered = scoredAll.filter((p) => allowedSlugs.includes(p.category_slug) && !excludeIds.has(p.id));
    // offset shifts the "starting point" to make variations different
    const shifted = filtered.slice(offset).concat(filtered.slice(0, offset));
    return pickBest(shifted, excludeIds, count);
  };

  function buildOneVariation(variationIndex) {
    const exclude = new Set();

    // diversity: increasing offset each variation
    const baseOffset = variationIndex * 6;

    const outfit = { top: null, bottom: null, shoes: null, outerwear: null, dress: null };

    if (wantsDress) {
      outfit.dress = pickFromCategoriesWithOffset(rules.dress || [], exclude, baseOffset, 1)[0] || null;
      outfit.shoes = pickFromCategoriesWithOffset(rules.shoes || [], exclude, baseOffset + 2, 1)[0] || null;
      outfit.outerwear = pickFromCategoriesWithOffset(rules.outerwear || [], exclude, baseOffset + 4, 1)[0] || null;
    } else {
      outfit.top = pickFromCategoriesWithOffset(rules.top || [], exclude, baseOffset, 1)[0] || null;
      outfit.bottom = pickFromCategoriesWithOffset(rules.bottom || [], exclude, baseOffset + 2, 1)[0] || null;
      outfit.shoes = pickFromCategoriesWithOffset(rules.shoes || [], exclude, baseOffset + 4, 1)[0] || null;
      outfit.outerwear = pickFromCategoriesWithOffset(rules.outerwear || [], exclude, baseOffset + 6, 1)[0] || null;
    }

    return {
      label: `Look ${variationIndex + 1}`,
      outfit: {
        dress: clean(outfit.dress),
        top: clean(outfit.top),
        bottom: clean(outfit.bottom),
        shoes: clean(outfit.shoes),
        outerwear: clean(outfit.outerwear),
      },
    };
  }

  const looks = [];
  for (let i = 0; i < K; i++) looks.push(buildOneVariation(i));

  // Track stylist_request event
  await db.query(
    `
    INSERT INTO events (session_id, type, query, meta)
    VALUES ($1, 'stylist_request', $2, $3)
    `,
    [sessionId, prompt, { gender: g, occasion, style, budgetMax, k: K }]
  );

  return {
    prompt,
    gender: g,
    occasion,
    style,
    budgetMax,
    looks,
  };
};

