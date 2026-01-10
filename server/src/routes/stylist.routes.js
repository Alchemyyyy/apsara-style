const router = require("express").Router();
const stylistController = require("../controllers/stylist.controller");

router.post("/", stylistController.buildOutfit);

module.exports = router;
