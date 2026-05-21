const db = require("../../db");

function withRunner(client) {
  return client || db;
}

const cleanupExpiredReservations = async (client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM inventory_reservations WHERE expires_at <= now()`);
};

const findCartBySession = async (sessionId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`SELECT * FROM carts WHERE session_id = $1 LIMIT 1`, [sessionId]);
  return res.rows[0] || null;
};

const findCartItemsByCartId = async (cartId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      ci.id AS cart_item_id,
      ci.qty,
      pv.id AS variant_id,
      pv.stock,
      pv.size,
      pv.color,
      p.id AS product_id,
      p.title,
      p.base_price,
      p.discount_price
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ci.cart_id = $1
    `,
    [cartId]
  );
  return res.rows;
};

const insertOrder = async (
  { sessionId, orderCode, email, phone, subtotal, shippingFee, total, shippingAddress },
  client
) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    INSERT INTO orders (user_id, session_id, order_code, email, phone, status, subtotal, shipping_fee, total, shipping_address)
    VALUES (NULL, $1, $2, $3, $4, 'pending', $5, $6, $7, $8)
    RETURNING *
    `,
    [sessionId, orderCode, email, phone, subtotal, shippingFee, total, shippingAddress]
  );
  return res.rows[0] || null;
};

const insertOrderItem = async ({ orderId, productId, variantId, titleSnapshot, priceSnapshot, qty }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    INSERT INTO order_items (order_id, product_id, variant_id, title_snapshot, price_snapshot, qty)
    VALUES ($1,$2,$3,$4,$5,$6)
    `,
    [orderId, productId, variantId, titleSnapshot, priceSnapshot, qty]
  );
};

const findReservationQty = async ({ sessionId, variantId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT qty
    FROM inventory_reservations
    WHERE session_id = $1
      AND variant_id = $2
      AND expires_at > now()
    LIMIT 1
    `,
    [sessionId, variantId]
  );
  return Number(res.rows[0]?.qty || 0);
};

const findReservedOtherQty = async ({ sessionId, variantId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT COALESCE(SUM(qty),0)::int AS reserved_other
    FROM inventory_reservations
    WHERE variant_id = $1
      AND session_id <> $2
      AND expires_at > now()
    `,
    [variantId, sessionId]
  );
  return Number(res.rows[0]?.reserved_other || 0);
};

const decrementVariantStock = async ({ variantId, qty, reservedOther }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE product_variants
    SET stock = stock - $1::int
    WHERE id = $2
      AND stock >= ($1::int + $3::int)
    RETURNING stock
    `,
    [qty, variantId, reservedOther]
  );
  return res.rowCount > 0;
};

const insertOrderStatusHistory = async ({ orderId, status, note }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    INSERT INTO order_status_history (order_id, status, note)
    VALUES ($1, $2, $3)
    `,
    [orderId, status, note]
  );
};

const deleteReservationsBySession = async (sessionId, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    DELETE FROM inventory_reservations
    WHERE session_id = $1
    `,
    [sessionId]
  );
};

const deleteCartItemsByCartId = async (cartId, client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cartId]);
};

const findOrderByWhere = async (whereSql, params, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`SELECT * FROM orders WHERE ${whereSql} LIMIT 1`, params);
  return res.rows[0] || null;
};

const findOrderById = async (orderId, client) => {
  return findOrderByWhere(`id = $1`, [orderId], client);
};

const findOrderByCheckoutSessionId = async (checkoutSessionId, client) => {
  return findOrderByWhere(`checkout_session_id = $1`, [checkoutSessionId], client);
};

const findOrderItems = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      oi.id, oi.variant_id, oi.title_snapshot, oi.price_snapshot, oi.qty,
      pv.size, pv.color,
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
    `,
    [orderId]
  );
  return res.rows;
};

const findOrderStatusHistory = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, status, note, created_at
    FROM order_status_history
    WHERE order_id = $1
    ORDER BY created_at ASC
    `,
    [orderId]
  );
  return res.rows;
};

const findOrderReturnRequests = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, reason, note, status, created_at, updated_at
    FROM order_return_requests
    WHERE order_id = $1
    ORDER BY created_at DESC
    `,
    [orderId]
  );
  return res.rows;
};

const findOrderReturnStatusHistoryByOrder = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      h.id,
      h.return_request_id,
      h.status,
      h.note,
      h.created_at
    FROM order_return_status_history h
    JOIN order_return_requests rr ON rr.id = h.return_request_id
    WHERE rr.order_id = $1
    ORDER BY h.created_at ASC, h.id ASC
    `,
    [orderId]
  );
  return res.rows;
};

const listOrdersBySession = async (sessionId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, order_code, status, total, created_at, email
    FROM orders
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT 20
    `,
    [sessionId]
  );
  return res.rows;
};

const updateOrderStatusByIdAndSession = async ({ orderId, sessionId, status }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET status = $1
    WHERE id = $2 AND session_id = $3
    RETURNING *
    `,
    [status, orderId, sessionId]
  );
  return res.rows[0] || null;
};

const incrementVariantStock = async ({ variantId, qty }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    UPDATE product_variants
    SET stock = stock + $1
    WHERE id = $2
    `,
    [qty, variantId]
  );
};

const insertOrderReturnRequest = async ({ orderId, sessionId, reason, note }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    INSERT INTO order_return_requests (order_id, session_id, reason, note, status)
    VALUES ($1, $2, $3, $4, 'requested')
    RETURNING id, order_id, session_id, reason, note, status, created_at, updated_at
    `,
    [orderId, sessionId || null, reason, note || null]
  );
  return res.rows[0] || null;
};

const findActiveOrderReturnRequest = async (orderId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, status
    FROM order_return_requests
    WHERE order_id = $1
      AND status IN ('requested', 'approved')
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [orderId]
  );
  return res.rows[0] || null;
};

const insertOrderReturnStatusHistory = async ({ returnRequestId, status, note }, client) => {
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

const markOrderCheckoutSession = async (
  { orderId, sessionId, paymentProvider = "bakong", paymentStatus = "pending" },
  client
) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET checkout_session_id = $1,
        payment_provider = $2,
        payment_status = $3
    WHERE id = $4
    RETURNING *
    `,
    [sessionId, paymentProvider, paymentStatus, orderId]
  );
  return res.rows[0] || null;
};

const markOrderPaid = async (
  { orderId, paymentIntentId = null, checkoutSessionId = null, paymentProvider = "bakong" },
  client
) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET payment_provider = $1,
        payment_status = 'paid',
        payment_intent_id = COALESCE($2, payment_intent_id),
        checkout_session_id = COALESCE($3, checkout_session_id),
        paid_at = COALESCE(paid_at, now()),
        status = CASE WHEN status = 'pending' THEN 'paid' ELSE status END
    WHERE id = $4
    RETURNING *
    `,
    [paymentProvider, paymentIntentId, checkoutSessionId, orderId]
  );
  return res.rows[0] || null;
};

const markOrderPaymentFailed = async (
  { orderId, paymentIntentId = null, checkoutSessionId = null, paymentProvider = "bakong", failureStatus = "failed" },
  client
) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET payment_provider = $1,
        payment_status = $2,
        payment_intent_id = COALESCE($3, payment_intent_id),
        checkout_session_id = COALESCE($4, checkout_session_id)
    WHERE id = $5
    RETURNING *
    `,
    [paymentProvider, failureStatus, paymentIntentId, checkoutSessionId, orderId]
  );
  return res.rows[0] || null;
};

const markOrderCashOnDelivery = async ({ orderId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE orders
    SET payment_provider = 'cod',
        payment_status = CASE WHEN payment_status = 'paid' THEN 'paid' ELSE 'unpaid' END,
        checkout_session_id = NULL,
        payment_intent_id = NULL
    WHERE id = $1
    RETURNING *
    `,
    [orderId]
  );
  return res.rows[0] || null;
};

module.exports = {
  cleanupExpiredReservations,
  findCartBySession,
  findCartItemsByCartId,
  insertOrder,
  insertOrderItem,
  findReservationQty,
  findReservedOtherQty,
  decrementVariantStock,
  insertOrderStatusHistory,
  deleteReservationsBySession,
  deleteCartItemsByCartId,
  findOrderByWhere,
  findOrderById,
  findOrderByCheckoutSessionId,
  findOrderItems,
  findOrderStatusHistory,
  findOrderReturnRequests,
  findOrderReturnStatusHistoryByOrder,
  listOrdersBySession,
  updateOrderStatusByIdAndSession,
  incrementVariantStock,
  markOrderCheckoutSession,
  markOrderPaid,
  markOrderPaymentFailed,
  markOrderCashOnDelivery,
  insertOrderReturnRequest,
  findActiveOrderReturnRequest,
  insertOrderReturnStatusHistory,
};
