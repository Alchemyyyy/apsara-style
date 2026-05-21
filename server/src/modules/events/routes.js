const router = require("express").Router();
const eventsController = require("./controller");

router.post("/", eventsController.create);

module.exports = router;
