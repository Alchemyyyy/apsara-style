const router = require("express").Router();
const ordersController = require("../controllers/orders.controller");

router.post("/", ordersController.create);     // checkout
router.get("/:id", ordersController.detail);   // order detail (guest by session)
router.get("/", ordersController.listMine);    // list by session

module.exports = router;
