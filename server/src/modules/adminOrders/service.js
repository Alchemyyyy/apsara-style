const { appError } = require("../../shared/errors");
const db = require("../../db");
const adminOrdersRepo = require("./repository");
const emailService = require("../../services/email.service");
const notificationsService = require("../notifications/service");
const notificationPreferencesService = require("../notifications/preferences.service");
const { buildNotificationTemplate } = require("../notifications/templates.service");

const ORDER_STATUSES = ["pending", "paid", "packed", "shipped", "delivered", "cancelled"];
const ORDER_TRANSITIONS = {
  pending: ["paid", "cancelled"],
  paid: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
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


const list = async (q) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 20), 100);
  const offset = (page - 1) * limit;

  const filters = [];
  const params = [];
  let i = 1;

  if (q.status && ORDER_STATUSES.includes(String(q.status).toLowerCase())) {
    params.push(String(q.status).toLowerCase());
    filters.push(`o.status = $${i++}`);
  }

  if (q.q) {
    const needle = `%${String(q.q).trim()}%`;
    params.push(needle);
    filters.push(`(o.order_code ILIKE $${i} OR o.email ILIKE $${i} OR o.id::text ILIKE $${i})`);
    i += 1;
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const total = await adminOrdersRepo.countOrders({ where, params });
  const items = await adminOrdersRepo.listOrders({ where, params, limit, offset });

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const order = await adminOrdersRepo.findOrderById(id);
  if (!order) throw appError("Order not found", 404);

  const [items, history] = await Promise.all([
    adminOrdersRepo.listOrderItems(id),
    adminOrdersRepo.listOrderStatusHistory(id),
  ]);

  return { ...order, items, history };
};

const updateStatus = async (id, status) => {
  const nextStatus = String(status || "").toLowerCase();
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw appError("Invalid order status", 400);
  }

  const current = await adminOrdersRepo.findOrderById(id);
  if (!current) throw appError("Order not found", 404);

  const currentStatus = String(current.status || "").toLowerCase();
  if (currentStatus === nextStatus) return current;

  const allowed = ORDER_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw appError(`Invalid status transition: ${currentStatus} -> ${nextStatus}`, 409);
  }

  await db.query("BEGIN");
  try {
    const order = await adminOrdersRepo.updateOrderStatus({ status: nextStatus, id }, db);
    if (!order) throw appError("Order not found", 404);

    await adminOrdersRepo.insertStatusHistory(
      { orderId: id, status: nextStatus, note: `Admin updated from ${currentStatus} to ${nextStatus}` },
      db
    );

    await db.query("COMMIT");
    const updated = await adminOrdersRepo.findOrderById(id);
    const result = String(updated?.status || "").toLowerCase() === nextStatus ? updated : order;
    const tpl = buildNotificationTemplate("order_status_updated", {
      orderCode: result?.order_code || current?.order_code,
      nextStatus,
    });
    await safeNotify(() =>
      notificationsService.create({
        sessionId: result?.session_id || current?.session_id,
        type: "order_status_updated",
        title: tpl.title,
        message: tpl.inAppMessage,
        meta: {
          orderId: id,
          orderCode: result?.order_code || current?.order_code,
          previousStatus: currentStatus,
          nextStatus,
          userEmail: result?.email || current?.email || null,
          templateKey: tpl.templateKey,
          templateParams: tpl.params,
        },
      })
    );
    await safeSendByCategory({
      email: result?.email || order?.email,
      category: "order",
      promiseFactory: () =>
      emailService.sendOrderStatusChangedEmail({
        to: result?.email || order?.email,
        order: result || order,
        previousStatus: currentStatus,
        nextStatus,
        template: tpl,
      })
    });
    return result || order;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

module.exports = {
  ORDER_STATUSES,
  ORDER_TRANSITIONS,
  list,
  getById,
  updateStatus,
};
