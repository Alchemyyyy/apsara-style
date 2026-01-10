const db = require("../db");

async function findCartBySession(sessionId) {
  const res = await db.query(`SELECT * FROM carts WHERE session_id = $1 LIMIT 1`, [sessionId]);
  return res.rows[0] || null;
}

async function createCart(sessionId) {
  const res = await db.query(
    `INSERT INTO carts (session_id) VALUES ($1) RETURNING *`,
    [sessionId]
  );
  return res.rows[0];
}

async function getCartItems(cartId) {
  const res = await db.query(
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
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at DESC
    `,
    [cartId]
  );
  return res.rows;
}

function calcTotals(items) {
  const subtotal = items.reduce((sum, it) => {
    const price = Number(it.discount_price || it.base_price || 0);
    return sum + price * Number(it.qty || 0);
  }, 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalItems: items.reduce((sum, it) => sum + Number(it.qty || 0), 0),
  };
}

exports.getOrCreateCart = async ({ sessionId }) => {
  let cart = await findCartBySession(sessionId);
  if (!cart) cart = await createCart(sessionId);

  const items = await getCartItems(cart.id);
  const totals = calcTotals(items);

  return {
    cartId: cart.id,
    sessionId,
    items,
    totals,
  };
};

exports.addItem = async ({ sessionId, variantId, qty }) => {
  if (qty <= 0) qty = 1;

  // Ensure cart exists
  let cart = await findCartBySession(sessionId);
  if (!cart) cart = await createCart(sessionId);

  // Check stock
  const vRes = await db.query(`SELECT stock FROM product_variants WHERE id = $1`, [variantId]);
  const variant = vRes.rows[0];
  if (!variant) throw new Error("Variant not found");
  if (variant.stock <= 0) throw new Error("Out of stock");

  // Upsert cart item
  await db.query(
    `
    INSERT INTO cart_items (cart_id, product_id, variant_id, qty)
    VALUES (
      $1,
      (SELECT product_id FROM product_variants WHERE id = $2),
      $2,
      $3
    )
    ON CONFLICT (cart_id, variant_id)
    DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty
    `,
    [cart.id, variantId, qty]
  );

  return exports.getOrCreateCart({ sessionId });
};

exports.updateItem = async ({ sessionId, itemId, qty }) => {
  if (!Number.isFinite(qty)) throw new Error("qty is required");
  if (qty <= 0) {
    return exports.removeItem({ sessionId, itemId });
  }

  // Make sure item belongs to this cart (by session)
  const cart = await findCartBySession(sessionId);
  if (!cart) return exports.getOrCreateCart({ sessionId });

  await db.query(
    `
    UPDATE cart_items
    SET qty = $1
    WHERE id = $2 AND cart_id = $3
    `,
    [qty, itemId, cart.id]
  );

  return exports.getOrCreateCart({ sessionId });
};

exports.removeItem = async ({ sessionId, itemId }) => {
  const cart = await findCartBySession(sessionId);
  if (!cart) return exports.getOrCreateCart({ sessionId });

  await db.query(
    `
    DELETE FROM cart_items
    WHERE id = $1 AND cart_id = $2
    `,
    [itemId, cart.id]
  );

  return exports.getOrCreateCart({ sessionId });
};
