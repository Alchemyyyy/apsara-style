const router = require("express").Router();
const paymentsController = require("./controller");

router.post("/checkout-session", paymentsController.createCheckoutSession);
router.get("/orders/:orderId/status", paymentsController.getOrderPaymentStatus);
router.post("/orders/:orderId/sync", paymentsController.syncOrderPaymentStatus);
router.post("/orders/:orderId/cod", paymentsController.setCashOnDelivery);
router.post("/bakong/webhook", paymentsController.bakongWebhook);

module.exports = router;
