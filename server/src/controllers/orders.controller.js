const ordersService = require("../services/orders.service");

function normalizeText(value, max = 255) {
  if (value == null) return "";
  return String(value).trim().slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const create = async (req, res, next) => {
  try {
    const { email, phone, shippingAddress } = req.body;
    const normalizedEmail = normalizeText(email, 255).toLowerCase();
    const normalizedPhone = normalizeText(phone, 30) || null;

    const safeAddress = {
      country: normalizeText(shippingAddress?.country, 80),
      city: normalizeText(shippingAddress?.city, 80),
      addressLine1: normalizeText(shippingAddress?.addressLine1, 255),
      addressLine2: normalizeText(shippingAddress?.addressLine2, 255),
      postalCode: normalizeText(shippingAddress?.postalCode, 20),
    };

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, error: "email is required" });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: "email is invalid" });
    }
    if (!safeAddress.country) {
      return res.status(400).json({ success: false, error: "country is required" });
    }
    if (!safeAddress.city) {
      return res.status(400).json({ success: false, error: "city is required" });
    }
    if (!safeAddress.addressLine1) {
      return res.status(400).json({ success: false, error: "addressLine1 is required" });
    }

    const order = await ordersService.createFromCart({
      sessionId: req.sessionId,
      email: normalizedEmail,
      phone: normalizedPhone,
      shippingAddress: safeAddress,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const listMine = async (req, res, next) => {
  try {
    const orders = await ordersService.listBySession(req.sessionId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

const lookup = async (req, res, next) => {
  try {
    const email = normalizeText(req.body?.email, 255).toLowerCase();
    const orderCode = normalizeText(req.body?.orderCode, 16).toUpperCase();

    if (!email) {
      return res.status(400).json({ success: false, error: "email is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: "email is invalid" });
    }
    if (!orderCode) {
      return res.status(400).json({ success: false, error: "orderCode is required" });
    }

    const order = await ordersService.lookupByEmailAndCode(email, orderCode);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const order = await ordersService.detailById(req.params.id, req.sessionId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const order = await ordersService.cancelById(req.params.id, req.sessionId);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const reason = normalizeText(req.body?.reason, 50).toLowerCase();
    const note = normalizeText(req.body?.note, 1000);
    const order = await ordersService.requestReturnById({
      orderId: req.params.id,
      sessionId: req.sessionId,
      reason,
      note,
    });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  listMine,
  lookup,
  detail,
  cancel,
  requestReturn,
};
