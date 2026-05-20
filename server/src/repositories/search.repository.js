const db = require("../db");

const listSearchCandidates = async ({ where, params }) => {
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price, p.tags, p.created_at,
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
};

module.exports = {
  listSearchCandidates,
};
