const { ok } = require("../../shared/responses");
const { asyncHandler } = require("../../shared/errors");
const ordersService = require("./service");
const { fail, requireEmail, requireValue } = require("../../shared/validation");

function normalizeText(value, max = 255) {
  if (value == null) return "";
  return String(value).trim().slice(0, max);
}

const create = asyncHandler(async (req, res) => {
  const { email, phone, shippingAddress } = req.body;
  const normalizedEmail = requireEmail(res, email);
  if (normalizedEmail == null) return;
  const normalizedPhone = normalizeText(phone, 30) || null;

  const safeAddress = {
    country: normalizeText(shippingAddress?.country, 80),
    city: normalizeText(shippingAddress?.city, 80),
    addressLine1: normalizeText(shippingAddress?.addressLine1, 255),
    addressLine2: normalizeText(shippingAddress?.addressLine2, 255),
    postalCode: normalizeText(shippingAddress?.postalCode, 20),
  };

  if (requireValue(res, safeAddress.country, "country") == null) return;
  if (requireValue(res, safeAddress.city, "city") == null) return;
  if (requireValue(res, safeAddress.addressLine1, "addressLine1") == null) return;

  const order = await ordersService.createFromCart({
    sessionId: req.sessionId,
    email: normalizedEmail,
    phone: normalizedPhone,
    shippingAddress: safeAddress,
  });

  ok(res, order);
});

const listMine = asyncHandler(async (req, res) => {
  const orders = await ordersService.listBySession(req.sessionId);
  ok(res, orders);
});

const lookup = asyncHandler(async (req, res) => {
  const email = requireEmail(res, req.body?.email);
  if (email == null) return;
  const orderCode = normalizeText(req.body?.orderCode, 16).toUpperCase();

  if (requireValue(res, orderCode, "orderCode") == null) return;

  const order = await ordersService.lookupByEmailAndCode(email, orderCode);
  if (!order) return fail(res, "Order not found", 404);

  ok(res, order);
});

const detail = asyncHandler(async (req, res) => {
  const order = await ordersService.detailById(req.params.id, req.sessionId);
  if (!order) return fail(res, "Order not found", 404);
  ok(res, order);
});

const cancel = asyncHandler(async (req, res) => {
  const order = await ordersService.cancelById(req.params.id, req.sessionId);
  ok(res, order);
});

const requestReturn = asyncHandler(async (req, res) => {
  const reason = normalizeText(req.body?.reason, 50).toLowerCase();
  const note = normalizeText(req.body?.note, 1000);
  const order = await ordersService.requestReturnById({
    orderId: req.params.id,
    sessionId: req.sessionId,
    reason,
    note,
  });
  ok(res, order);
});

module.exports = {
  create,
  listMine,
  lookup,
  detail,
  cancel,
  requestReturn,
};
