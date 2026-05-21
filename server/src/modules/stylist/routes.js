const router = require("express").Router();
const stylistController = require("./controller");

router.post("/", stylistController.buildOutfit);

module.exports = router;
