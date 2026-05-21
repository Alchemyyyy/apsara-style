const router = require("express").Router();
const cartController = require("./controller");
const userAuth = require("../../middleware/userAuth");

router.get("/", cartController.getCart);
router.post("/reserve", cartController.refreshReservations);
router.post("/adjust-to-available", cartController.adjustToAvailable);
router.post("/claim", userAuth, cartController.claimCart);
router.post("/items", cartController.addItem);
router.patch("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

module.exports = router;
