const db = require("../db");

const findProductCardsByIds = async (ids) => {
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
  return res.rows;
};

const findRecentInterestEvents = async ({ sessionId, limit }) => {
  const res = await db.query(
    `
    SELECT product_id, type, created_at
    FROM events
    WHERE session_id = $1
      AND product_id IS NOT NULL
      AND type IN ('view_product','add_to_cart','purchase')
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [sessionId, limit]
  );
  return res.rows;
};

const findVectorsByProductIds = async (ids) => {
  const res = await db.query(
    `SELECT product_id, vector FROM product_embeddings WHERE product_id = ANY($1::uuid[])`,
    [ids]
  );
  return res.rows;
};

const listAllActiveVectors = async () => {
  const res = await db.query(
    `
    SELECT p.id, pe.vector
    FROM products p
    JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE p.is_active = true
    `
  );
  return res.rows;
};

const findTrendingScores = async (limit) => {
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
    [limit]
  );
  return res.rows;
};

const findNewestProductIds = async (limit) => {
  const res = await db.query(
    `
    SELECT id
    FROM products
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [limit]
  );
  return res.rows.map((r) => r.id);
};

module.exports = {
  findProductCardsByIds,
  findRecentInterestEvents,
  findVectorsByProductIds,
  listAllActiveVectors,
  findTrendingScores,
  findNewestProductIds,
};
