const router = require("express").Router();
const adminGuard = require("../middleware/adminGuard")
const adminAnalyticsController = require("../controllers/adminAnalytics.controller")

router.use(adminGuard);

router.get("/overview", adminAnalyticsController.overview);
router.get("/top-products", adminAnalyticsController.topProducts);
router.get("/top-searches", adminAnalyticsController.topSearches);

module.exports = router;
