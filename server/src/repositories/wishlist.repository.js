const db = require("../db");

const listBySession = async (sessionId) => {
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.gender,
      p.base_price, p.discount_price,
      c.slug AS category_slug,
      (
        SELECT url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM wishlists w
    JOIN products p ON p.id = w.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE w.session_id = $1
    ORDER BY w.created_at DESC
    `,
    [sessionId]
  );
  return res.rows;
};

const addBySession = async ({ sessionId, productId }) => {
  await db.query(
    `
    INSERT INTO wishlists (session_id, product_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    `,
    [sessionId, productId]
  );
};

const removeBySession = async ({ sessionId, productId }) => {
  await db.query(
    `
    DELETE FROM wishlists
    WHERE session_id = $1 AND product_id = $2
    `,
    [sessionId, productId]
  );
};

module.exports = {
  listBySession,
  addBySession,
  removeBySession,
};
