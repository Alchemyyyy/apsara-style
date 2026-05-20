const db = require("../db");
const crypto = require("crypto");
const ordersRepo = require("../repositories/orders.repository");
const emailService = require("./email.service");
const notificationsService = require("./notifications.service");
const notificationPreferencesService = require("./notificationPreferences.service");
const { buildNotificationTemplate } = require("./notificationTemplates.service");

function appError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function calcSubtotal(items) {
  return items.reduce((sum, it) => {
    const price = Number(it.discount_price || it.base_price || 0);
    return sum + price * Number(it.qty || 0);
  }, 0);
}

function generateOrderCode() {
  return `AS-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

async function safeSend(promiseFactory) {
  try {
    await promiseFactory();
  } catch (err) {
    console.warn("[email] send failed:", err?.message || err);
  }
}

async function safeNotify(promiseFactory) {
  try {
    await promiseFactory();
  } catch (err) {
    console.warn("[notification] create failed:", err?.message || err);
  }
}

async function safeSendByCategory({ email, category, promiseFactory }) {
  try {
    const allowed = await notificationPreferencesService.canSendEmailByCategory({ email, category });
    if (!allowed) return;
    await safeSend(promiseFactory);
  } catch (err) {
    console.warn("[email] preference check failed:", err?.message || err);
  }
}

async function insertOrderWithCode(
  { sessionId, email, phone, subtotal, shipping_fee, total, shippingAddress },
  client
) {
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode();
    try {
      const row = await ordersRepo.insertOrder(
        {
          sessionId,
          orderCode: code,
          email,
          phone,
          subtotal,
          shippingFee: shipping_fee,
          total,
          shippingAddress,
        },
        client
      );
      return row;
    } catch (err) {
      // Retry on rare unique collision.
      if (err?.code === "23505") {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr || appError("Failed to generate order code", 500);
}

async function detailByWhere(whereSql, params) {
  const order = await ordersRepo.findOrderByWhere(whereSql, params);
  if (!order) return null;

  const items = await ordersRepo.findOrderItems(order.id);
  const statusHistory = await ordersRepo.findOrderStatusHistory(order.id);
  const returnRequests = await ordersRepo.findOrderReturnRequests(order.id);
  const returnStatusHistory = await ordersRepo.findOrderReturnStatusHistoryByOrder(order.id);

  const historyByRequest = new Map();
  for (const h of returnStatusHistory) {
    const list = historyByRequest.get(h.return_request_id) || [];
    list.push(h);
    historyByRequest.set(h.return_request_id, list);
  }

  const requestsWithHistory = returnRequests.map((r) => ({
    ...r,
    history: historyByRequest.get(r.id) || [],
  }));

  return { ...order, items, status_history: statusHistory, return_requests: requestsWithHistory };
}

const createFromCart = async ({ sessionId, email, phone, shippingAddress }) => {
  await ordersRepo.cleanupExpiredReservations();
  const cart = await ordersRepo.findCartBySession(sessionId);
  if (!cart) throw appError("Cart not found", 404);

  const items = await ordersRepo.findCartItemsByCartId(cart.id);
  if (!items.length) throw appError("Cart is empty", 400);

  // Validate stock
  for (const it of items) {
    if (it.stock <= 0) throw appError(`Out of stock: ${it.title}`, 409);
    if (it.qty > it.stock) throw appError(`Not enough stock for ${it.title} (${it.color}/${it.size})`, 409);
  }

  const subtotal = calcSubtotal(items);
  const shipping_fee = 0; // thesis: free shipping or fixed later
  const total = subtotal + shipping_fee;

  // Transaction
  await db.query("BEGIN");

  try {
    await ordersRepo.cleanupExpiredReservations(db);

    // Create guest order tied to session ownership.
    const order = await insertOrderWithCode(
      {
        sessionId,
        email,
        phone,
        subtotal,
        shipping_fee,
        total,
        shippingAddress,
      },
      db
    );

    // Insert order items
    for (const it of items) {
      const priceSnap = Number(it.discount_price || it.base_price || 0);

      await ordersRepo.insertOrderItem({
        orderId: order.id,
        productId: it.product_id,
        variantId: it.variant_id,
        titleSnapshot: it.title,
        priceSnapshot: priceSnap,
        qty: it.qty,
      }, db);

      const reservedOther = await ordersRepo.findReservedOtherQty(
        { sessionId, variantId: it.variant_id },
        db
      );

      // Decrease stock
      const stockUpdated = await ordersRepo.decrementVariantStock(
        { qty: it.qty, variantId: it.variant_id, reservedOther },
        db
      );
      if (!stockUpdated) {
        throw appError(`Not enough stock for ${it.title} (${it.color}/${it.size})`, 409);
      }
    }

    await ordersRepo.insertOrderStatusHistory({
      orderId: order.id,
      status: "pending",
      note: "Order placed",
    }, db);

    await ordersRepo.deleteReservationsBySession(sessionId, db);

    // Clear cart
    await ordersRepo.deleteCartItemsByCartId(cart.id, db);

    await db.query("COMMIT");

    // Return order with items
    const created = await detailById(order.id, sessionId);
    const tpl = buildNotificationTemplate("order_created", {
      orderCode: created?.order_code || order.order_code,
    });
    await safeNotify(() =>
      notificationsService.create({
        sessionId,
        type: "order_created",
        title: tpl.title,
        message: tpl.inAppMessage,
        meta: {
          orderId: order.id,
          orderCode: created?.order_code || order.order_code,
          userEmail: created?.email || email || null,
          templateKey: tpl.templateKey,
          templateParams: tpl.params,
        },
      })
    );
    await safeSendByCategory({
      email: created?.email,
      category: "order",
      promiseFactory: () =>
      emailService.sendOrderPlacedEmail({
        to: created?.email,
        order: created,
        template: tpl,
      })
    });
    return created;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const listBySession = async (sessionId) => {
  return ordersRepo.listOrdersBySession(sessionId);
};

const detailById = async (orderId, sessionId) => {
  return detailByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
};

const lookupByEmailAndCode = async (email, orderCode) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedCode = String(orderCode || "").trim().toUpperCase();
  if (!normalizedEmail || !normalizedCode) return null;
  return detailByWhere(`email = $1 AND order_code = $2`, [normalizedEmail, normalizedCode]);
};

const CANCELLABLE_STATUSES = new Set(["pending", "paid", "packed"]);

const cancelById = async (orderId, sessionId) => {
  const current = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!current) throw appError("Order not found", 404);

  const currentStatus = String(current.status || "").toLowerCase();
  if (currentStatus === "cancelled") {
    throw appError("Order is already cancelled", 409);
  }
  if (!CANCELLABLE_STATUSES.has(currentStatus)) {
    throw appError("Order can only be cancelled before shipment", 409);
  }

  await db.query("BEGIN");
  try {
    const items = await ordersRepo.findOrderItems(orderId, db);
    for (const it of items) {
      if (it.variant_id && Number(it.qty) > 0) {
        await ordersRepo.incrementVariantStock({ variantId: it.variant_id, qty: Number(it.qty) }, db);
      }
    }

    const updated = await ordersRepo.updateOrderStatusByIdAndSession(
      { orderId, sessionId, status: "cancelled" },
      db
    );
    if (!updated) throw appError("Order not found", 404);

    await ordersRepo.insertOrderStatusHistory(
      { orderId, status: "cancelled", note: `Customer cancelled from ${currentStatus}` },
      db
    );

    await db.query("COMMIT");
    const cancelled = await detailById(orderId, sessionId);
    const tpl = buildNotificationTemplate("order_cancelled", {
      orderCode: cancelled?.order_code || current.order_code,
    });
    await safeNotify(() =>
      notificationsService.create({
        sessionId,
        type: "order_cancelled",
        title: tpl.title,
        message: tpl.inAppMessage,
        meta: {
          orderId,
          orderCode: cancelled?.order_code || current.order_code,
          previousStatus: currentStatus,
          nextStatus: "cancelled",
          userEmail: cancelled?.email || current?.email || null,
          templateKey: tpl.templateKey,
          templateParams: tpl.params,
        },
      })
    );
    await safeSendByCategory({
      email: cancelled?.email,
      category: "order",
      promiseFactory: () =>
      emailService.sendOrderStatusChangedEmail({
        to: cancelled?.email,
        order: cancelled,
        previousStatus: currentStatus,
        nextStatus: "cancelled",
        template: tpl,
      })
    });
    return cancelled;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const RETURN_REASONS = new Set([
  "damaged",
  "wrong_item",
  "not_as_described",
  "size_issue",
  "other",
]);

const requestReturnById = async ({ orderId, sessionId, reason, note }) => {
  const order = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!order) throw appError("Order not found", 404);

  const status = String(order.status || "").toLowerCase();
  if (status !== "delivered") {
    throw appError("Return can only be requested for delivered orders", 409);
  }

  const normalizedReason = String(reason || "").trim().toLowerCase();
  if (!RETURN_REASONS.has(normalizedReason)) {
    throw appError("Invalid return reason", 400);
  }

  const activeReturn = await ordersRepo.findActiveOrderReturnRequest(orderId);
  if (activeReturn) {
    throw appError("A return request already exists for this order", 409);
  }

  const safeNote = String(note || "").trim().slice(0, 1000) || null;
  await db.query("BEGIN");
  let createdReturn = null;
  try {
    createdReturn = await ordersRepo.insertOrderReturnRequest(
      { orderId, sessionId, reason: normalizedReason, note: safeNote },
      db
    );
    await ordersRepo.insertOrderReturnStatusHistory(
      {
        returnRequestId: createdReturn.id,
        status: "requested",
        note: safeNote || "Customer requested return",
      },
      db
    );
    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }

  const refreshed = await detailById(orderId, sessionId);
  const latestReturnRequest = Array.isArray(refreshed?.return_requests)
    ? refreshed.return_requests.find((r) => r.id === createdReturn?.id) || refreshed.return_requests[0]
    : null;
  const tpl = buildNotificationTemplate("return_requested", {
    orderCode: order.order_code,
  });
  await safeSendByCategory({
    email: order?.email,
    category: "return",
    promiseFactory: () =>
    emailService.sendReturnRequestedEmail({
      to: order?.email,
      order,
      returnRequest: latestReturnRequest,
      template: tpl,
    })
  });
  await safeNotify(() =>
    notificationsService.create({
      sessionId,
      type: "return_requested",
      title: tpl.title,
      message: tpl.inAppMessage,
      meta: {
        orderId,
        orderCode: order.order_code,
        returnRequestId: latestReturnRequest?.id || null,
        reason: normalizedReason,
        userEmail: order?.email || null,
        templateKey: tpl.templateKey,
        templateParams: tpl.params,
      },
    })
  );

  return refreshed;
};

module.exports = {
  createFromCart,
  listBySession,
  detailById,
  lookupByEmailAndCode,
  cancelById,
  requestReturnById,
};
