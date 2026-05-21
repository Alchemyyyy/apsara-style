const router = require("express").Router();
const { adminAuth, requireAdminRoles } = require("../../middleware/adminAuth");
const adminAnalyticsController = require("./controller");

router.use(adminAuth);
router.use(requireAdminRoles("super_admin", "ops_admin", "catalog_admin"));

router.get("/overview", adminAnalyticsController.overview);
router.get("/top-products", adminAnalyticsController.topProducts);
router.get("/top-searches", adminAnalyticsController.topSearches);

module.exports = router;
