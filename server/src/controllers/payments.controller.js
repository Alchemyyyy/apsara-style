const paymentsService = require("../services/payments.service");

const createCheckoutSession = async (req, res, next) => {
  try {
    const data = await paymentsService.createCheckoutSession({
      orderId: req.body?.orderId,
      sessionId: req.sessionId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOrderPaymentStatus = async (req, res, next) => {
  try {
    const data = await paymentsService.getOrderPaymentStatus({
      orderId: req.params.orderId,
      sessionId: req.sessionId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const syncOrderPaymentStatus = async (req, res, next) => {
  try {
    const data = await paymentsService.syncOrderPaymentStatus({
      orderId: req.params.orderId,
      sessionId: req.sessionId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const setCashOnDelivery = async (req, res, next) => {
  try {
    const data = await paymentsService.setCashOnDelivery({
      orderId: req.params.orderId,
      sessionId: req.sessionId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const bakongWebhook = async (req, res, next) => {
  try {
    const data = await paymentsService.processBakongWebhook({
      headers: req.headers,
      body: req.body,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckoutSession,
  getOrderPaymentStatus,
  syncOrderPaymentStatus,
  setCashOnDelivery,
  bakongWebhook,
};
