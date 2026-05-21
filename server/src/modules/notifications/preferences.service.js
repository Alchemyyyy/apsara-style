const { appError } = require("../../shared/errors");
const notificationPreferencesRepo = require("./preferences.repository");
const authRepo = require("../auth/repository");

const DEFAULTS = {
  order_in_app: true,
  order_email: true,
  payment_in_app: true,
  payment_email: true,
  return_in_app: true,
  return_email: true,
  marketing_in_app: false,
  marketing_email: false,
};

function toApiModel(row) {
  const data = row || DEFAULTS;
  return {
    inApp: {
      order: Boolean(data.order_in_app),
      payment: Boolean(data.payment_in_app),
      return: Boolean(data.return_in_app),
      marketing: Boolean(data.marketing_in_app),
    },
    email: {
      order: Boolean(data.order_email),
      payment: Boolean(data.payment_email),
      return: Boolean(data.return_email),
      marketing: Boolean(data.marketing_email),
    },
    updatedAt: data.updated_at || null,
  };
}

function toPatch(payload) {
  const source = payload && typeof payload === "object" ? payload : {};
  const inApp = source.inApp && typeof source.inApp === "object" ? source.inApp : {};
  const email = source.email && typeof source.email === "object" ? source.email : {};

  return {
    order_in_app: Boolean(inApp.order ?? DEFAULTS.order_in_app),
    order_email: Boolean(email.order ?? DEFAULTS.order_email),
    payment_in_app: Boolean(inApp.payment ?? DEFAULTS.payment_in_app),
    payment_email: Boolean(email.payment ?? DEFAULTS.payment_email),
    return_in_app: Boolean(inApp.return ?? DEFAULTS.return_in_app),
    return_email: Boolean(email.return ?? DEFAULTS.return_email),
    marketing_in_app: Boolean(inApp.marketing ?? DEFAULTS.marketing_in_app),
    marketing_email: Boolean(email.marketing ?? DEFAULTS.marketing_email),
  };
}

async function getByUserId(userId) {
  if (!userId) throw appError("userId is required", 400);
  const row = await notificationPreferencesRepo.findByUserId(userId);
  return toApiModel(row);
}

async function updateByUserId(userId, payload) {
  if (!userId) throw appError("userId is required", 400);
  const patch = toPatch(payload);
  const row = await notificationPreferencesRepo.upsertByUserId(userId, patch);
  return toApiModel(row);
}

async function getEffectiveFlagsByUserId(userId) {
  if (!userId) return { ...DEFAULTS };
  const row = await notificationPreferencesRepo.findByUserId(userId);
  if (!row) return { ...DEFAULTS };
  return {
    order_in_app: Boolean(row.order_in_app),
    order_email: Boolean(row.order_email),
    payment_in_app: Boolean(row.payment_in_app),
    payment_email: Boolean(row.payment_email),
    return_in_app: Boolean(row.return_in_app),
    return_email: Boolean(row.return_email),
    marketing_in_app: Boolean(row.marketing_in_app),
    marketing_email: Boolean(row.marketing_email),
  };
}

async function canSendEmailByCategory({ userId = null, email = "", category }) {
  const normalizedCategory = String(category || "").trim().toLowerCase();
  if (!["order", "payment", "return", "marketing"].includes(normalizedCategory)) return true;

  let resolvedUserId = userId || null;
  if (!resolvedUserId) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) return true; // guest/unknown user: keep sending
    const user = await authRepo.findUserByEmail(normalizedEmail);
    if (!user?.id) return true; // email not linked to a user record
    resolvedUserId = user.id;
  }

  const flags = await getEffectiveFlagsByUserId(resolvedUserId);
  if (normalizedCategory === "order") return Boolean(flags.order_email);
  if (normalizedCategory === "payment") return Boolean(flags.payment_email);
  if (normalizedCategory === "return") return Boolean(flags.return_email);
  return Boolean(flags.marketing_email);
}

module.exports = {
  DEFAULTS,
  getByUserId,
  updateByUserId,
  getEffectiveFlagsByUserId,
  canSendEmailByCategory,
};
