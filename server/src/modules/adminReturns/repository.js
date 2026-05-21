const db = require("../../db");

function withRunner(client) {
  return client || db;
}

const countReturns = async ({ where, params }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT COUNT(*)::int AS total
    FROM order_return_requests rr
    JOIN orders o ON o.id = rr.order_id
    ${where}
    `,
    params
  );
  return Number(res.rows[0]?.total || 0);
};

const listReturns = async ({ where, params, limit, offset }, client) => {
  const runner = withRunner(client);
  const withPage = [...params, limit, offset];
  const limitPos = withPage.length - 1;
  const offsetPos = withPage.length;
  const res = await runner.query(
    `
    SELECT
      rr.id,
      rr.order_id,
      rr.session_id,
      rr.reason,
      rr.note,
      rr.status,
      rr.created_at,
      rr.updated_at,
      o.order_code,
      o.email,
      o.total,
      o.status AS order_status
    FROM order_return_requests rr
    JOIN orders o ON o.id = rr.order_id
    ${where}
    ORDER BY rr.created_at DESC
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    withPage
  );
  return res.rows;
};

const findReturnById = async (id, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      rr.id,
      rr.order_id,
      rr.session_id,
      rr.reason,
      rr.note,
      rr.status,
      rr.created_at,
      rr.updated_at,
      o.order_code,
      o.email,
      o.phone,
      o.total,
      o.status AS order_status,
      o.shipping_address
    FROM order_return_requests rr
    JOIN orders o ON o.id = rr.order_id
    WHERE rr.id = $1
    LIMIT 1
    `,
    [id]
  );
  return res.rows[0] || null;
};

const listOrderItems = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      oi.id,
      oi.title_snapshot,
      oi.price_snapshot,
      oi.qty,
      pv.size,
      pv.color,
      pv.sku,
      (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = oi.product_id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM order_items oi
    LEFT JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = $1
    ORDER BY oi.id ASC
    `,
    [orderId]
  );
  return res.rows;
};

const updateReturnStatus = async ({ id, status }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE order_return_requests
    SET status = $1,
        updated_at = now()
    WHERE id = $2
    RETURNING id, order_id, session_id, reason, note, status, created_at, updated_at
    `,
    [status, id]
  );
  return res.rows[0] || null;
};

const insertReturnStatusHistory = async ({ returnRequestId, status, note }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    INSERT INTO order_return_status_history (return_request_id, status, note)
    VALUES ($1, $2, $3)
    RETURNING id, return_request_id, status, note, created_at
    `,
    [returnRequestId, status, note || null]
  );
  return res.rows[0] || null;
};

const listReturnStatusHistoryByRequestId = async (returnRequestId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, return_request_id, status, note, created_at
    FROM order_return_status_history
    WHERE return_request_id = $1
    ORDER BY created_at ASC, id ASC
    `,
    [returnRequestId]
  );
  return res.rows;
};

module.exports = {
  countReturns,
  listReturns,
  findReturnById,
  listOrderItems,
  updateReturnStatus,
  insertReturnStatusHistory,
  listReturnStatusHistoryByRequestId,
};
