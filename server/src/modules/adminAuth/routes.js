const router = require("express").Router();
const adminAuthController = require("./controller");
const { adminAuth } = require("../../middleware/adminAuth");

router.post("/login", adminAuthController.login);
router.post("/refresh", adminAuthController.refresh);
router.get("/me", adminAuth, adminAuthController.me);
router.post("/logout", adminAuthController.logout);

module.exports = router;
