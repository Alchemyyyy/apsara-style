const router = require("express").Router();
const ordersController = require("./controller");

router.post("/", ordersController.create);     // checkout
router.post("/lookup", ordersController.lookup); // guest lookup by email + order code
router.patch("/:id/cancel", ordersController.cancel); // cancel order before shipped
router.post("/:id/returns", ordersController.requestReturn); // return request placeholder
router.get("/:id", ordersController.detail);   // order detail (guest by session)
router.get("/", ordersController.listMine);    // list by session

module.exports = router;
