const router = require("express").Router();
const adminGuard = require("../middleware/adminGuard");
const adminProductsController = require("../controllers/adminProducts.controller");

router.use(adminGuard);

// Products
router.get("/products", adminProductsController.list);
router.post("/products", adminProductsController.create);
router.patch("/products/:id", adminProductsController.update);
router.delete("/products/:id", adminProductsController.remove);

// Variants (stock update)
router.patch("/variants/:id/stock", adminProductsController.updateStock);

module.exports = router;
