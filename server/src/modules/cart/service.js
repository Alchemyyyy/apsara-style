const { appError } = require("../../shared/errors");
const db = require("../../db");
const cartRepo = require("./repository");
const RESERVATION_MINUTES = 15;

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

const getOrCreateCart = async ({ sessionId }) => {
  await cartRepo.cleanupExpiredReservations();
  let cart = await cartRepo.findCartBySession(sessionId);
  if (!cart) cart = await cartRepo.createCart(sessionId);

  const items = await cartRepo.findCartItemsWithReservation({ cartId: cart.id, sessionId });
  const totals = calcTotals(items);

  return {
    cartId: cart.id,
    sessionId,
    items,
    totals,
  };
};

const addItem = async ({ sessionId, variantId, qty }) => {
  if (qty <= 0) qty = 1;

  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    // Ensure cart exists
    let cart = await cartRepo.findCartBySession(sessionId, db);
    if (!cart) cart = await cartRepo.createCart(sessionId, db);

    const variant = await cartRepo.lockVariantById(variantId, db);
    if (!variant) throw appError("Variant not found", 404);
    if (Number(variant.stock) <= 0) throw appError("Out of stock", 409);

    const existingQty = await cartRepo.findCartItemQtyByVariant({ cartId: cart.id, variantId }, db);
    const nextQty = existingQty + Number(qty || 0);

    const reservedOther = await cartRepo.findReservedOtherQty({ variantId, sessionId }, db);
    const available = Number(variant.stock) - reservedOther;
    if (nextQty > available) {
      throw appError(`Not enough stock. Available: ${Math.max(0, available)}`, 409);
    }

    const cartItemId = await cartRepo.upsertCartItem({ cartId: cart.id, variantId, qty: nextQty }, db);

    await cartRepo.upsertReservation(
      {
        sessionId,
        variantId,
        cartItemId: cartItemId || null,
        qty: nextQty,
        reservationMinutes: RESERVATION_MINUTES,
      },
      db
    );

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  return getOrCreateCart({ sessionId });
};

const updateItem = async ({ sessionId, itemId, qty }) => {
  if (!Number.isFinite(qty)) throw appError("qty is required", 400);
  if (qty <= 0) {
    return removeItem({ sessionId, itemId });
  }

  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    // Make sure item belongs to this cart (by session)
    const cart = await cartRepo.findCartBySession(sessionId, db);
    if (!cart) {
      await db.query("COMMIT");
      return getOrCreateCart({ sessionId });
    }

    const item = await cartRepo.findCartItemById({ itemId, cartId: cart.id }, db);
    if (!item) {
      await db.query("COMMIT");
      return getOrCreateCart({ sessionId });
    }

    const variant = await cartRepo.lockVariantById(item.variant_id, db);
    if (!variant) throw appError("Variant not found", 404);

    const reservedOther = await cartRepo.findReservedOtherQty({ variantId: item.variant_id, sessionId }, db);
    const available = Number(variant.stock) - reservedOther;
    if (Number(qty) > available) {
      throw appError(`Not enough stock. Available: ${Math.max(0, available)}`, 409);
    }

    await cartRepo.updateCartItemQty({ cartId: cart.id, itemId, qty }, db);

    await cartRepo.upsertReservation(
      {
        sessionId,
        variantId: item.variant_id,
        cartItemId: itemId,
        qty,
        reservationMinutes: RESERVATION_MINUTES,
      },
      db
    );

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  return getOrCreateCart({ sessionId });
};

const removeItem = async ({ sessionId, itemId }) => {
  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    const cart = await cartRepo.findCartBySession(sessionId, db);
    if (!cart) {
      await db.query("COMMIT");
      return getOrCreateCart({ sessionId });
    }

    const variantId = await cartRepo.findCartItemVariantId({ itemId, cartId: cart.id }, db);
    await cartRepo.deleteCartItem({ itemId, cartId: cart.id }, db);

    if (variantId) {
      await cartRepo.deleteReservationByVariant({ sessionId, variantId }, db);
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  return getOrCreateCart({ sessionId });
};

const refreshReservations = async ({ sessionId }) => {
  const failedItems = [];

  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    const cart = await cartRepo.findCartBySession(sessionId, db);
    if (!cart) {
      await db.query("COMMIT");
      const fresh = await getOrCreateCart({ sessionId });
      return { cart: fresh, failedItems };
    }

    const items = await cartRepo.listSimpleCartItems(cart.id, db);

    for (const item of items) {
      const variant = await cartRepo.lockVariantById(item.variant_id, db);
      if (!variant) continue;

      const reservedOther = await cartRepo.findReservedOtherQty({ variantId: item.variant_id, sessionId }, db);
      const available = Math.max(0, Number(variant.stock) - reservedOther);

      if (Number(item.qty) <= available) {
        await cartRepo.upsertReservation(
          {
            sessionId,
            variantId: item.variant_id,
            cartItemId: item.cart_item_id,
            qty: item.qty,
            reservationMinutes: RESERVATION_MINUTES,
          },
          db
        );
      } else {
        await cartRepo.deleteReservationByVariant({ sessionId, variantId: item.variant_id }, db);
        failedItems.push({
          cartItemId: item.cart_item_id,
          variantId: item.variant_id,
          title: item.title,
          size: item.size,
          color: item.color,
          requestedQty: Number(item.qty),
          availableQty: available,
        });
      }
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  const cart = await getOrCreateCart({ sessionId });
  return { cart, failedItems };
};

const adjustToAvailable = async ({ sessionId }) => {
  const adjustedItems = [];
  const removedItems = [];

  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    const cart = await cartRepo.findCartBySession(sessionId, db);
    if (!cart) {
      await db.query("COMMIT");
      const fresh = await getOrCreateCart({ sessionId });
      return { cart: fresh, adjustedItems, removedItems };
    }

    const items = await cartRepo.listSimpleCartItems(cart.id, db);

    for (const item of items) {
      const variant = await cartRepo.lockVariantById(item.variant_id, db);
      if (!variant) continue;

      const reservedOther = await cartRepo.findReservedOtherQty({ variantId: item.variant_id, sessionId }, db);
      const available = Math.max(0, Number(variant.stock) - reservedOther);
      const currentQty = Number(item.qty);

      if (available <= 0) {
        await cartRepo.deleteCartItemById(item.cart_item_id, db);
        await cartRepo.deleteReservationByVariant({ sessionId, variantId: item.variant_id }, db);
        removedItems.push({
          cartItemId: item.cart_item_id,
          title: item.title,
          size: item.size,
          color: item.color,
        });
        continue;
      }

      const nextQty = Math.min(currentQty, available);
      if (nextQty < currentQty) {
        await cartRepo.updateCartItemQtyById({ qty: nextQty, itemId: item.cart_item_id }, db);
        adjustedItems.push({
          cartItemId: item.cart_item_id,
          title: item.title,
          size: item.size,
          color: item.color,
          fromQty: currentQty,
          toQty: nextQty,
        });
      }

      await cartRepo.upsertReservation(
        {
          sessionId,
          variantId: item.variant_id,
          cartItemId: item.cart_item_id,
          qty: nextQty,
          reservationMinutes: RESERVATION_MINUTES,
        },
        db
      );
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  const cart = await getOrCreateCart({ sessionId });
  return { cart, adjustedItems, removedItems };
};

const claimSessionCart = async ({ sessionId, userId }) => {
  if (!sessionId) throw appError("sessionId is required", 400);
  if (!userId) throw appError("userId is required", 400);

  await db.query("BEGIN");
  try {
    await cartRepo.cleanupExpiredReservations(db);

    let targetCart = await cartRepo.findCartBySession(sessionId, db);
    if (!targetCart) {
      targetCart = await cartRepo.findCartByUser(userId, db);
    }
    if (!targetCart) {
      targetCart = await cartRepo.createUserCart({ sessionId, userId }, db);
    }

    // Ensure target cart belongs to current user+session.
    targetCart = await cartRepo.updateCartOwner(
      { cartId: targetCart.id, sessionId, userId },
      db
    );

    const userCarts = await cartRepo.listUserCarts(userId, db);
    const sourceCarts = userCarts.filter((c) => c.id !== targetCart.id);

    for (const sourceCart of sourceCarts) {
      const sourceItems = await cartRepo.listCartItemsRaw(sourceCart.id, db);
      for (const item of sourceItems) {
        const existingQty = await cartRepo.findCartItemQtyByVariant(
          { cartId: targetCart.id, variantId: item.variant_id },
          db
        );
        const mergedQty = Number(existingQty || 0) + Number(item.qty || 0);
        await cartRepo.upsertCartItem(
          { cartId: targetCart.id, variantId: item.variant_id, qty: mergedQty },
          db
        );
      }
      await cartRepo.deleteCartById(sourceCart.id, db);
    }

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  return getOrCreateCart({ sessionId });
};

module.exports = {
  getOrCreateCart,
  addItem,
  updateItem,
  removeItem,
  refreshReservations,
  adjustToAvailable,
  claimSessionCart,
};
