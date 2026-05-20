const router = require("express").Router();
const { adminAuth, requireAdminRoles } = require("../middleware/adminAuth");
const adminProductsController = require("../controllers/adminProducts.controller");
const adminOrdersController = require("../controllers/adminOrders.controller");
const adminReturnsController = require("../controllers/adminReturns.controller");
const adminUploadsController = require("../controllers/adminUploads.controller");
const adminAuditController = require("../controllers/adminAudit.controller");

router.use(adminAuth);

// Products
router.get("/products", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.list);
router.get("/products/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.getById);
router.post("/products", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.create);
router.patch("/products/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.update);
router.delete("/products/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.remove);

// Categories (product types)
router.get("/categories", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.listCategories);
router.get("/categories/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.getCategoryById);
router.post("/categories", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.createCategory);
router.patch("/categories/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.updateCategory);
router.delete("/categories/:id", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.removeCategory);

// Variants (stock update)
router.patch("/variants/:id/stock", requireAdminRoles("super_admin", "catalog_admin"), adminProductsController.updateStock);

// Uploads
router.post("/uploads/images", requireAdminRoles("super_admin", "catalog_admin"), adminUploadsController.uploadImages);

// Orders
router.get("/orders", requireAdminRoles("super_admin", "ops_admin"), adminOrdersController.list);
router.get("/orders/:id", requireAdminRoles("super_admin", "ops_admin"), adminOrdersController.getById);
router.patch("/orders/:id/status", requireAdminRoles("super_admin", "ops_admin"), adminOrdersController.updateStatus);

// Returns
router.get("/returns", requireAdminRoles("super_admin", "ops_admin"), adminReturnsController.list);
router.get("/returns/:id", requireAdminRoles("super_admin", "ops_admin"), adminReturnsController.getById);
router.patch("/returns/:id/status", requireAdminRoles("super_admin", "ops_admin"), adminReturnsController.updateStatus);

// Audit logs
router.get("/audit-logs", requireAdminRoles("super_admin"), adminAuditController.list);

module.exports = router;
