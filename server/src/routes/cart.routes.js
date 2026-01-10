const router = require("express").Router();
const cartController = require("../controllers/cart.controller");

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:itemId", cartController.updateItem);
router.delete("/items/:itemId", cartController.removeItem);

module.exports = router;
