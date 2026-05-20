const db = require("../db");

function withRunner(client) {
  return client || db;
}

const countOrders = async ({ where, params }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`SELECT COUNT(*)::int AS total FROM orders o ${where}`, params);
  return Number(res.rows[0]?.total || 0);
};

const listOrders = async ({ where, params, limit, offset }, client) => {
  const runner = withRunner(client);
  const withPage = [...params, limit, offset];
  const limitPos = withPage.length - 1;
  const offsetPos = withPage.length;
  const res = await runner.query(
    `
    SELECT
      o.id, o.order_code, o.email, o.phone, o.status, o.total, o.created_at,
      o.shipping_address,
      (
        SELECT COALESCE(SUM(oi.qty), 0)::int
        FROM order_items oi
        WHERE oi.order_id = o.id
      ) AS total_items
    FROM orders o
    ${where}
    ORDER BY o.created_at DESC
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    withPage
  );
  return res.rows;
};

const findOrderById = async (id, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      id,
      session_id,
      order_code,
      email,
      phone,
      status,
      subtotal,
      shipping_fee,
      total,
      shipping_address,
      created_at
    FROM orders
    WHERE id = $1
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
      oi.order_id,
      oi.product_id,
      oi.variant_id,
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

const listOrderStatusHistory = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, status, note, created_at
    FROM order_status_history
    WHERE order_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [orderId]
  );
  return res.rows;
};

const updateOrderStatus = async ({ id, status }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET status = $1
    WHERE id = $2
    RETURNING id, session_id, order_code, email, status, total, created_at
    `,
    [status, id]
  );
  return res.rows[0] || null;
};

const insertStatusHistory = async ({ orderId, status, note }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    INSERT INTO order_status_history (order_id, status, note)
    VALUES ($1, $2, $3)
    `,
    [orderId, status, note]
  );
};

module.exports = {
  countOrders,
  listOrders,
  findOrderById,
  listOrderItems,
  listOrderStatusHistory,
  updateOrderStatus,
  insertStatusHistory,
};
