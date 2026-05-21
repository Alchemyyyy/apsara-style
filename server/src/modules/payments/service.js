const { appError } = require("../../shared/errors");
const db = require("../../db");
const crypto = require("crypto");
const { bakong } = require("../../config/payments.config");
const ordersRepo = require("../orders/repository");
const emailService = require("../../services/email.service");
const notificationsService = require("../notifications/service");
const notificationPreferencesService = require("../notifications/preferences.service");
const { buildNotificationTemplate } = require("../notifications/templates.service");

function normalizeAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) throw appError("Invalid order amount for payment", 400);
  return Number(amount.toFixed(2));
}

function createBakongReference(orderCode) {
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `BKG-${String(orderCode || "ORDER").replace(/[^A-Z0-9-]/gi, "").slice(0, 16)}-${suffix}`;
}

function createKhqrPayload({ merchantId, merchantName, amount, currency, reference }) {
  // Starter payload for UI/QR scanning demo. Replace with official Bakong SDK payload in production.
  return [
    "khqr://pay",
    `merchant_id=${encodeURIComponent(merchantId)}`,
    `merchant_name=${encodeURIComponent(merchantName)}`,
    `amount=${encodeURIComponent(String(amount))}`,
    `currency=${encodeURIComponent(currency)}`,
    `ref=${encodeURIComponent(reference)}`,
  ].join("?");
}

function buildQrImageUrl(payload) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
}

function readHeaderCaseInsensitive(headers, name) {
  if (!headers || !name) return "";
  const target = String(name).toLowerCase();
  for (const key of Object.keys(headers)) {
    if (String(key).toLowerCase() === target) return headers[key];
  }
  return "";
}

function mapBakongStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
  if (["paid", "success", "succeeded", "complete", "completed", "settled"].includes(raw)) {
    return "paid";
  }
  if (["failed", "fail", "error", "expired", "cancelled", "canceled", "rejected"].includes(raw)) {
    return "failed";
  }
  if (!raw) return "pending";
  return "pending";
}

function extractBakongStatusPayload(payload) {
  const base = payload?.data && typeof payload.data === "object" ? payload.data : payload;
  return {
    reference:
      base?.reference ||
      base?.payment_reference ||
      base?.merchant_ref ||
      base?.external_reference ||
      base?.checkout_session_id ||
      null,
    status: mapBakongStatus(base?.status || base?.payment_status || base?.state || base?.result),
    rawStatus: base?.status || base?.payment_status || base?.state || base?.result || null,
    transactionId:
      base?.transaction_id ||
      base?.transactionId ||
      base?.txn_id ||
      base?.txnId ||
      base?.id ||
      null,
  };
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

async function markPaidAndHistory({ order, paymentReference = null }) {
  const currentStatus = String(order.status || "").toLowerCase();
  await db.query("BEGIN");
  try {
    const updated = await ordersRepo.markOrderPaid(
      {
        orderId: order.id,
        checkoutSessionId: paymentReference,
        paymentIntentId: paymentReference,
        paymentProvider: "bakong",
      },
      db
    );
    if (!updated) throw appError("Order not found", 404);

    if (currentStatus === "pending") {
      await ordersRepo.insertOrderStatusHistory(
        { orderId: order.id, status: "paid", note: "Payment confirmed by Bakong" },
        db
      );
    }

    await db.query("COMMIT");
    const tpl = buildNotificationTemplate("payment_paid", {
      orderCode: updated?.order_code || order?.order_code,
    });
    await safeNotify(() =>
      notificationsService.create({
        sessionId: updated?.session_id || order?.session_id,
        type: "payment_paid",
        title: tpl.title,
        message: tpl.inAppMessage,
        meta: {
          orderId: updated?.id || order?.id,
          orderCode: updated?.order_code || order?.order_code,
          paymentReference: paymentReference || null,
          userEmail: updated?.email || order?.email || null,
          templateKey: tpl.templateKey,
          templateParams: tpl.params,
        },
      })
    );
    await safeSendByCategory({
      email: updated?.email,
      category: "payment",
      promiseFactory: () =>
      emailService.sendOrderStatusChangedEmail({
        to: updated?.email,
        order: updated,
        previousStatus: currentStatus,
        nextStatus: "paid",
        template: tpl,
      })
    });
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
}

async function markFailedIfNeeded({ order, paymentReference = null }) {
  const currentPaymentStatus = String(order?.payment_status || "").toLowerCase();
  if (currentPaymentStatus === "paid" || currentPaymentStatus === "failed") return;
  const failed = await ordersRepo.markOrderPaymentFailed({
    orderId: order.id,
    checkoutSessionId: paymentReference || order.checkout_session_id || null,
    paymentIntentId: paymentReference || order.checkout_session_id || null,
    paymentProvider: "bakong",
    failureStatus: "failed",
  });
  const tpl = buildNotificationTemplate("payment_failed", {
    orderCode: failed?.order_code || order?.order_code,
  });
  await safeNotify(() =>
    notificationsService.create({
      sessionId: failed?.session_id || order?.session_id,
      type: "payment_failed",
      title: tpl.title,
      message: tpl.inAppMessage,
      meta: {
        orderId: failed?.id || order?.id,
        orderCode: failed?.order_code || order?.order_code,
        paymentReference: paymentReference || order?.checkout_session_id || null,
        userEmail: failed?.email || order?.email || null,
        templateKey: tpl.templateKey,
        templateParams: tpl.params,
      },
    })
  );
}

function buildBakongStatusRequest({ reference, orderCode = null }) {
  if (!bakong.statusUrl) return null;

  if (bakong.statusMethod === "POST") {
    return {
      url: bakong.statusUrl,
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(bakong.apiKey ? { authorization: `Bearer ${bakong.apiKey}`, "x-api-key": bakong.apiKey } : {}),
      },
      body: JSON.stringify({
        reference,
        merchant_id: bakong.merchantId,
        order_code: orderCode || null,
      }),
    };
  }

  const u = new URL(bakong.statusUrl);
  u.searchParams.set("reference", String(reference || ""));
  u.searchParams.set("merchant_id", bakong.merchantId);
  if (orderCode) u.searchParams.set("order_code", orderCode);
  return {
    url: u.toString(),
    method: "GET",
    headers: {
      ...(bakong.apiKey ? { authorization: `Bearer ${bakong.apiKey}`, "x-api-key": bakong.apiKey } : {}),
    },
  };
}

async function requestBakongStatus({ order }) {
  const reference = order?.checkout_session_id;
  if (!reference) {
    return {
      providerStatus: "pending",
      rawStatus: null,
      transactionId: null,
      reference: null,
      syncSource: "local",
      syncError: "No checkout reference found on order",
    };
  }

  const req = buildBakongStatusRequest({ reference, orderCode: order?.order_code || null });
  if (!req) {
    return {
      providerStatus: "pending",
      rawStatus: null,
      transactionId: null,
      reference,
      syncSource: "local",
      syncError: "BAKONG_STATUS_URL is not configured",
    };
  }

  const response = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  if (!response.ok) {
    throw appError(`Bakong status request failed (${response.status})`, 502);
  }

  const payload = await response.json();
  const parsed = extractBakongStatusPayload(payload);
  return {
    providerStatus: parsed.status,
    rawStatus: parsed.rawStatus,
    transactionId: parsed.transactionId,
    reference: parsed.reference || reference,
    syncSource: "bakong_api",
    syncError: null,
  };
}

const createCheckoutSession = async ({ orderId, sessionId }) => {
  if (!orderId) throw appError("orderId is required", 400);
  if (!sessionId) throw appError("sessionId is required", 400);

  const order = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!order) throw appError("Order not found", 404);
  if (String(order.status || "").toLowerCase() === "cancelled") {
    throw appError("Cancelled order cannot be paid", 409);
  }
  if (String(order.payment_status || "").toLowerCase() === "paid") {
    throw appError("Order is already paid", 409);
  }

  const amount = normalizeAmount(order.total);
  const paymentReference = createBakongReference(order.order_code);
  const khqrPayload = createKhqrPayload({
    merchantId: bakong.merchantId,
    merchantName: bakong.merchantName,
    amount,
    currency: bakong.currency,
    reference: paymentReference,
  });

  await ordersRepo.markOrderCheckoutSession({
    orderId: order.id,
    sessionId: paymentReference,
    paymentProvider: "bakong",
    paymentStatus: "pending",
  });

  return {
    orderId: order.id,
    paymentProvider: "bakong",
    paymentReference,
    paymentStatus: "pending",
    amount,
    currency: bakong.currency,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    khqrPayload,
    qrImageUrl: buildQrImageUrl(khqrPayload),
    deepLink: khqrPayload,
  };
};

const getOrderPaymentStatus = async ({ orderId, sessionId }) => {
  if (!orderId) throw appError("orderId is required", 400);
  if (!sessionId) throw appError("sessionId is required", 400);
  const order = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!order) throw appError("Order not found", 404);
  return {
    orderId: order.id,
    orderCode: order.order_code,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentProvider: order.payment_provider,
    paidAt: order.paid_at,
  };
};

const syncOrderPaymentStatus = async ({ orderId, sessionId }) => {
  if (!orderId) throw appError("orderId is required", 400);
  if (!sessionId) throw appError("sessionId is required", 400);

  const order = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!order) throw appError("Order not found", 404);

  const current = String(order.payment_status || "").toLowerCase();
  if (current === "paid") {
    return {
      orderId: order.id,
      orderCode: order.order_code,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentProvider: order.payment_provider,
      paidAt: order.paid_at,
      syncSource: "local",
      providerStatus: "paid",
      rawStatus: "paid",
      transactionId: order.payment_intent_id || null,
      paymentReference: order.checkout_session_id || null,
      syncError: null,
    };
  }

  let provider;
  try {
    provider = await requestBakongStatus({ order });
  } catch (err) {
    return {
      orderId: order.id,
      orderCode: order.order_code,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentProvider: order.payment_provider,
      paidAt: order.paid_at,
      syncSource: "bakong_api",
      providerStatus: "pending",
      rawStatus: null,
      transactionId: null,
      paymentReference: order.checkout_session_id || null,
      syncError: err?.message || "Failed to sync payment status",
    };
  }

  if (provider.providerStatus === "paid") {
    await markPaidAndHistory({
      order,
      paymentReference: provider.reference || order.checkout_session_id,
    });
  } else if (provider.providerStatus === "failed") {
    await markFailedIfNeeded({
      order,
      paymentReference: provider.reference || order.checkout_session_id,
    });
  }

  const fresh = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  return {
    orderId: fresh.id,
    orderCode: fresh.order_code,
    status: fresh.status,
    paymentStatus: fresh.payment_status,
    paymentProvider: fresh.payment_provider,
    paidAt: fresh.paid_at,
    syncSource: provider.syncSource,
    providerStatus: provider.providerStatus,
    rawStatus: provider.rawStatus,
    transactionId: provider.transactionId,
    paymentReference: provider.reference,
    syncError: provider.syncError,
  };
};

const setCashOnDelivery = async ({ orderId, sessionId }) => {
  if (!orderId) throw appError("orderId is required", 400);
  if (!sessionId) throw appError("sessionId is required", 400);

  const order = await ordersRepo.findOrderByWhere(`id = $1 AND session_id = $2`, [orderId, sessionId]);
  if (!order) throw appError("Order not found", 404);

  const currentOrderStatus = String(order.status || "").toLowerCase();
  const currentPaymentStatus = String(order.payment_status || "").toLowerCase();
  if (currentOrderStatus === "cancelled") throw appError("Cancelled order cannot use COD", 409);
  if (currentPaymentStatus === "paid") throw appError("Paid order cannot use COD", 409);

  const updated = await ordersRepo.markOrderCashOnDelivery({ orderId: order.id });
  if (!updated) throw appError("Order not found", 404);

  return {
    orderId: updated.id,
    orderCode: updated.order_code,
    status: updated.status,
    paymentStatus: updated.payment_status,
    paymentProvider: updated.payment_provider,
  };
};

const processBakongWebhook = async ({ headers, body }) => {
  if (bakong.webhookSecret) {
    const provided =
      String(readHeaderCaseInsensitive(headers, "x-bakong-signature") || "").trim() ||
      String(readHeaderCaseInsensitive(headers, "x-bakong-webhook-secret") || "").trim();
    if (!provided || provided !== bakong.webhookSecret) {
      throw appError("Invalid Bakong webhook signature", 401);
    }
  }

  const parsed = extractBakongStatusPayload(body || {});
  const reference = String(parsed.reference || "").trim();
  if (!reference) throw appError("Webhook missing payment reference", 400);

  const order = await ordersRepo.findOrderByCheckoutSessionId(reference);
  if (!order) throw appError("Order not found for payment reference", 404);

  if (parsed.status === "paid") {
    await markPaidAndHistory({ order, paymentReference: reference });
  } else if (parsed.status === "failed") {
    await markFailedIfNeeded({ order, paymentReference: reference });
  }

  const fresh = await ordersRepo.findOrderById(order.id);
  return {
    orderId: fresh?.id || order.id,
    orderCode: fresh?.order_code || order.order_code,
    paymentStatus: fresh?.payment_status || order.payment_status,
    orderStatus: fresh?.status || order.status,
    paymentReference: reference,
    providerStatus: parsed.status,
    rawStatus: parsed.rawStatus,
    transactionId: parsed.transactionId,
  };
};

module.exports = {
  createCheckoutSession,
  getOrderPaymentStatus,
  syncOrderPaymentStatus,
  setCashOnDelivery,
  processBakongWebhook,
};
