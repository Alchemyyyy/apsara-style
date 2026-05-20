const db = require("../db");

const createEvent = async ({ sessionId, type, productId, query, meta }) => {
  const res = await db.query(
    `
    INSERT INTO events (session_id, type, product_id, query, meta)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING id, session_id, type, product_id, query, meta, created_at
    `,
    [sessionId, type, productId, query, meta]
  );
  return res.rows[0] || null;
};

module.exports = {
  createEvent,
};
