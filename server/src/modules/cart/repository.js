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

const findCartByUser = async (userId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `SELECT * FROM carts WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
    [userId]
  );
  return res.rows[0] || null;
};

const listUserCarts = async (userId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `SELECT * FROM carts WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC`,
    [userId]
  );
  return res.rows;
};

const createCart = async (sessionId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`INSERT INTO carts (session_id) VALUES ($1) RETURNING *`, [sessionId]);
  return res.rows[0] || null;
};

const createUserCart = async ({ sessionId, userId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `INSERT INTO carts (session_id, user_id) VALUES ($1, $2) RETURNING *`,
    [sessionId || null, userId]
  );
  return res.rows[0] || null;
};

const findCartItemsWithReservation = async ({ cartId, sessionId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      ci.id AS cart_item_id,
      ci.qty,
      pv.id AS variant_id,
      pv.size,
      pv.color,
      pv.stock,
      p.id AS product_id,
      p.title,
      p.base_price,
      p.discount_price,
      ir.expires_at AS reservation_expires_at,
      (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
    LEFT JOIN inventory_reservations ir
      ON ir.variant_id = ci.variant_id
      AND ir.session_id = $2
      AND ir.expires_at > now()
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at DESC
    `,
    [cartId, sessionId]
  );
  return res.rows;
};

const lockVariantById = async (variantId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`SELECT id, stock FROM product_variants WHERE id = $1 FOR UPDATE`, [variantId]);
  return res.rows[0] || null;
};

const findCartItemQtyByVariant = async ({ cartId, variantId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(`SELECT qty FROM cart_items WHERE cart_id = $1 AND variant_id = $2 LIMIT 1`, [cartId, variantId]);
  return Number(res.rows[0]?.qty || 0);
};

const findReservedOtherQty = async ({ variantId, sessionId }, client) => {
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

const upsertCartItem = async ({ cartId, variantId, qty }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    INSERT INTO cart_items (cart_id, product_id, variant_id, qty)
    VALUES (
      $1,
      (SELECT product_id FROM product_variants WHERE id = $2),
      $2,
      $3
    )
    ON CONFLICT (cart_id, variant_id)
    DO UPDATE SET qty = EXCLUDED.qty
    RETURNING id
    `,
    [cartId, variantId, qty]
  );
  return res.rows[0]?.id || null;
};

const upsertReservation = async (
  { sessionId, variantId, cartItemId, qty, reservationMinutes },
  client
) => {
  const runner = withRunner(client);
  await runner.query(
    `
    INSERT INTO inventory_reservations (session_id, variant_id, cart_item_id, qty, expires_at, updated_at)
    VALUES ($1, $2, $3, $4, now() + ($5 || ' minutes')::interval, now())
    ON CONFLICT (session_id, variant_id)
    DO UPDATE
    SET cart_item_id = EXCLUDED.cart_item_id,
        qty = EXCLUDED.qty,
        expires_at = EXCLUDED.expires_at,
        updated_at = now()
    `,
    [sessionId, variantId, cartItemId, qty, reservationMinutes]
  );
};

const findCartItemById = async ({ cartId, itemId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT ci.id, ci.variant_id
    FROM cart_items ci
    WHERE ci.id = $1 AND ci.cart_id = $2
    LIMIT 1
    `,
    [itemId, cartId]
  );
  return res.rows[0] || null;
};

const updateCartItemQty = async ({ cartId, itemId, qty }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    UPDATE cart_items
    SET qty = $1
    WHERE id = $2 AND cart_id = $3
    `,
    [qty, itemId, cartId]
  );
};

const findCartItemVariantId = async ({ cartId, itemId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT variant_id
    FROM cart_items
    WHERE id = $1 AND cart_id = $2
    LIMIT 1
    `,
    [itemId, cartId]
  );
  return res.rows[0]?.variant_id || null;
};

const deleteCartItem = async ({ cartId, itemId }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    DELETE FROM cart_items
    WHERE id = $1 AND cart_id = $2
    `,
    [itemId, cartId]
  );
};

const deleteReservationByVariant = async ({ sessionId, variantId }, client) => {
  const runner = withRunner(client);
  await runner.query(
    `
    DELETE FROM inventory_reservations
    WHERE session_id = $1 AND variant_id = $2
    `,
    [sessionId, variantId]
  );
};

const listSimpleCartItems = async (cartId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      ci.id AS cart_item_id,
      ci.qty,
      ci.variant_id,
      p.title,
      pv.size,
      pv.color
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ci.cart_id = $1
    `,
    [cartId]
  );
  return res.rows;
};

const listCartItemsRaw = async (cartId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, cart_id, variant_id, qty
    FROM cart_items
    WHERE cart_id = $1
    `,
    [cartId]
  );
  return res.rows;
};

const updateCartOwner = async ({ cartId, sessionId, userId }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE carts
    SET session_id = $2,
        user_id = $3,
        updated_at = now()
    WHERE id = $1
    RETURNING *
    `,
    [cartId, sessionId || null, userId || null]
  );
  return res.rows[0] || null;
};

const deleteCartById = async (cartId, client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM carts WHERE id = $1`, [cartId]);
};

const deleteCartItemById = async (itemId, client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM cart_items WHERE id = $1`, [itemId]);
};

const updateCartItemQtyById = async ({ itemId, qty }, client) => {
  const runner = withRunner(client);
  await runner.query(`UPDATE cart_items SET qty = $1 WHERE id = $2`, [qty, itemId]);
};

module.exports = {
  cleanupExpiredReservations,
  findCartBySession,
  findCartByUser,
  listUserCarts,
  createCart,
  createUserCart,
  findCartItemsWithReservation,
  lockVariantById,
  findCartItemQtyByVariant,
  findReservedOtherQty,
  upsertCartItem,
  upsertReservation,
  findCartItemById,
  updateCartItemQty,
  findCartItemVariantId,
  deleteCartItem,
  deleteReservationByVariant,
  listSimpleCartItems,
  listCartItemsRaw,
  updateCartOwner,
  deleteCartById,
  deleteCartItemById,
  updateCartItemQtyById,
};
