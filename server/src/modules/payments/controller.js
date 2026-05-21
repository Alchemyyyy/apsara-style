const { ok } = require("../../shared/responses");
const paymentsService = require("./service");
const { asyncHandler } = require("../../shared/errors");

const createCheckoutSession = asyncHandler(async (req, res) => {
  const data = await paymentsService.createCheckoutSession({
    orderId: req.body?.orderId,
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const getOrderPaymentStatus = asyncHandler(async (req, res) => {
  const data = await paymentsService.getOrderPaymentStatus({
    orderId: req.params.orderId,
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const syncOrderPaymentStatus = asyncHandler(async (req, res) => {
  const data = await paymentsService.syncOrderPaymentStatus({
    orderId: req.params.orderId,
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const setCashOnDelivery = asyncHandler(async (req, res) => {
  const data = await paymentsService.setCashOnDelivery({
    orderId: req.params.orderId,
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const bakongWebhook = asyncHandler(async (req, res) => {
  const data = await paymentsService.processBakongWebhook({
    headers: req.headers,
    body: req.body,
  });
  ok(res, data);
});

module.exports = {
  createCheckoutSession,
  getOrderPaymentStatus,
  syncOrderPaymentStatus,
  setCashOnDelivery,
  bakongWebhook,
};
