const router = require("express").Router();
const notificationsController = require("./controller");
const notificationPreferencesController = require("./preferences.controller");
const userAuth = require("../../middleware/userAuth");

router.get("/", notificationsController.list);
router.get("/stream", notificationsController.stream);
router.get("/preferences", userAuth, notificationPreferencesController.getMyPreferences);
router.patch("/preferences", userAuth, notificationPreferencesController.updateMyPreferences);
router.patch("/read-all", notificationsController.markAllRead);
router.delete("/clear", notificationsController.clearOlderThan);
router.patch("/:id/read", notificationsController.markRead);

module.exports = router;
