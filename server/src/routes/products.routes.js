const router = require("express").Router();
const productsController = require("../controllers/products.controller");

router.get("/", productsController.list);
router.get("/:id", productsController.detail);
router.get("/:id/similar", productsController.similar);

module.exports = router;
