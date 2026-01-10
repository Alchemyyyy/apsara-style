const db = require("../db");

async function getCartBySession(sessionId) {
  const cartRes = await db.query(`SELECT * FROM carts WHERE session_id = $1 LIMIT 1`, [sessionId]);
  return cartRes.rows[0] || null;
}

async function getCartItems(cartId) {
  const res = await db.query(
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
}

function calcSubtotal(items) {
  return items.reduce((sum, it) => {
    const price = Number(it.discount_price || it.base_price || 0);
    return sum + price * Number(it.qty || 0);
  }, 0);
}

exports.createFromCart = async ({ sessionId, email, phone, shippingAddress }) => {
  const cart = await getCartBySession(sessionId);
  if (!cart) throw new Error("Cart not found");

  const items = await getCartItems(cart.id);
  if (!items.length) throw new Error("Cart is empty");

  // Validate stock
  for (const it of items) {
    if (it.stock <= 0) throw new Error(`Out of stock: ${it.title}`);
    if (it.qty > it.stock) throw new Error(`Not enough stock for ${it.title} (${it.color}/${it.size})`);
  }

  const subtotal = calcSubtotal(items);
  const shipping_fee = 0; // thesis: free shipping or fixed later
  const total = subtotal + shipping_fee;

  // Transaction
  await db.query("BEGIN");

  try {
    // Create order (guest: user_id null, but tie to session by storing shipping_address + email)
    const orderRes = await db.query(
      `
      INSERT INTO orders (user_id, email, phone, status, subtotal, shipping_fee, total, shipping_address)
      VALUES (NULL, $1, $2, 'pending', $3, $4, $5, $6)
      RETURNING *
      `,
      [email, phone, subtotal, shipping_fee, total, shippingAddress]
    );
    const order = orderRes.rows[0];

    // Insert order items
    for (const it of items) {
      const priceSnap = Number(it.discount_price || it.base_price || 0);

      await db.query(
        `
        INSERT INTO order_items (order_id, product_id, variant_id, title_snapshot, price_snapshot, qty)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [order.id, it.product_id, it.variant_id, it.title, priceSnap, it.qty]
      );

      // Decrease stock
      await db.query(
        `UPDATE product_variants SET stock = stock - $1 WHERE id = $2`,
        [it.qty, it.variant_id]
      );
    }

    // Clear cart
    await db.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);

    await db.query("COMMIT");

    // Return order with items
    return exports.detailById(order.id, sessionId);
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

exports.listBySession = async (sessionId) => {
  // Guest session: list orders by matching email isn't stored in session.
  // Simple approach for thesis: store session_id in orders.meta if you want.
  // For now: return most recent orders (demo).
  const res = await db.query(
    `
    SELECT id, status, total, created_at, email
    FROM orders
    ORDER BY created_at DESC
    LIMIT 20
    `
  );
  return res.rows;
};

exports.detailById = async (orderId) => {
  const orderRes = await db.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await db.query(
    `
    SELECT
      oi.id, oi.title_snapshot, oi.price_snapshot, oi.qty,
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

  return { ...order, items: itemsRes.rows };
};
