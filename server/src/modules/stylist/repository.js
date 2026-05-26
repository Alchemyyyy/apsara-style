const db = require("../../db");

const loadCandidates = async ({ gender, budgetMax }) => {
  const params = [];
  const filters = ["p.is_active = true", "p.gender IN ('women', 'men')"];
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
};

const createStylistRequestEvent = async ({ sessionId, prompt, meta }) => {
  await db.query(
    `
    INSERT INTO events (session_id, type, query, meta)
    VALUES ($1, 'stylist_request', $2, $3)
    `,
    [sessionId, prompt, meta]
  );
};

module.exports = {
  loadCandidates,
  createStylistRequestEvent,
};
