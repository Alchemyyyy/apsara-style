const { appError } = require("../../shared/errors");
const db = require("../../db");
const adminReturnsRepo = require("./repository");
const emailService = require("../../services/email.service");
const notificationsService = require("../notifications/service");
const notificationPreferencesService = require("../notifications/preferences.service");
const { buildNotificationTemplate } = require("../notifications/templates.service");

const RETURN_STATUSES = ["requested", "approved", "rejected", "resolved"];
const RETURN_TRANSITIONS = {
  requested: ["approved", "rejected"],
  approved: ["resolved", "rejected"],
  rejected: [],
  resolved: [],
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

  if (q.status && RETURN_STATUSES.includes(String(q.status).toLowerCase())) {
    params.push(String(q.status).toLowerCase());
    filters.push(`rr.status = $${i++}`);
  }

  if (q.reason) {
    params.push(String(q.reason).toLowerCase());
    filters.push(`rr.reason = $${i++}`);
  }

  if (q.q) {
    const needle = `%${String(q.q).trim()}%`;
    params.push(needle);
    filters.push(`(o.order_code ILIKE $${i} OR o.email ILIKE $${i} OR rr.id::text ILIKE $${i})`);
    i += 1;
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const total = await adminReturnsRepo.countReturns({ where, params });
  const items = await adminReturnsRepo.listReturns({ where, params, limit, offset });

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const request = await adminReturnsRepo.findReturnById(id);
  if (!request) throw appError("Return request not found", 404);
  const [items, history] = await Promise.all([
    adminReturnsRepo.listOrderItems(request.order_id),
    adminReturnsRepo.listReturnStatusHistoryByRequestId(request.id),
  ]);
  return { ...request, items, history };
};

const updateStatus = async (id, status, note) => {
  const nextStatus = String(status || "").toLowerCase();
  if (!RETURN_STATUSES.includes(nextStatus)) throw appError("Invalid return status", 400);

  const current = await adminReturnsRepo.findReturnById(id);
  if (!current) throw appError("Return request not found", 404);

  const currentStatus = String(current.status || "").toLowerCase();
  if (currentStatus === nextStatus) return current;
  const safeNote = String(note || "").trim().slice(0, 1000) || null;

  const allowed = RETURN_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw appError(`Invalid status transition: ${currentStatus} -> ${nextStatus}`, 409);
  }
  if (nextStatus === "rejected" && !safeNote) {
    throw appError("note is required when rejecting a return request", 400);
  }

  await db.query("BEGIN");
  try {
    const updated = await adminReturnsRepo.updateReturnStatus({ id, status: nextStatus }, db);
    if (!updated) throw appError("Return request not found", 404);
    await adminReturnsRepo.insertReturnStatusHistory(
      {
        returnRequestId: id,
        status: nextStatus,
        note: safeNote || `Admin updated from ${currentStatus} to ${nextStatus}`,
      },
      db
    );
    await db.query("COMMIT");
    const merged = { ...current, ...updated };
    const tpl = buildNotificationTemplate("return_status_updated", {
      orderCode: merged?.order_code || current?.order_code,
      nextStatus,
    });
    await safeNotify(() =>
      notificationsService.create({
        sessionId: merged?.session_id || current?.session_id,
        type: "return_status_updated",
        title: tpl.title,
        message: tpl.inAppMessage,
        meta: {
          orderId: merged?.order_id || current?.order_id,
          orderCode: merged?.order_code || current?.order_code,
          returnRequestId: id,
          previousStatus: currentStatus,
          nextStatus,
          userEmail: merged?.email || current?.email || null,
          templateKey: tpl.templateKey,
          templateParams: tpl.params,
        },
      })
    );
    await safeSendByCategory({
      email: merged?.email,
      category: "return",
      promiseFactory: () =>
      emailService.sendReturnStatusUpdatedEmail({
        to: merged?.email,
        order: merged,
        returnRequest: merged,
        previousStatus: currentStatus,
        nextStatus,
        statusNote: safeNote,
        template: tpl,
      })
    });
    return merged;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

module.exports = {
  RETURN_STATUSES,
  RETURN_TRANSITIONS,
  list,
  getById,
  updateStatus,
};
