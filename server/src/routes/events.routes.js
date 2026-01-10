const router = require("express").Router();
const eventsController = require("../controllers/events.controller");

router.post("/", eventsController.create);

module.exports = router;
