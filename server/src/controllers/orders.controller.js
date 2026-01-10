const ordersService = require("../services/orders.service");

exports.create = async (req, res, next) => {
  try {
    const { email, phone, shippingAddress } = req.body;

    if (!email) return res.status(400).json({ success: false, error: "email is required" });
    if (!shippingAddress?.addressLine1) return res.status(400).json({ success: false, error: "addressLine1 is required" });

    const order = await ordersService.createFromCart({
      sessionId: req.sessionId,
      email,
      phone: phone || null,
      shippingAddress,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const orders = await ordersService.listBySession(req.sessionId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const order = await ordersService.detailById(req.params.id, req.sessionId);
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
