const router = require("express").Router();
const recController = require("../controllers/recommendations.controller");

router.get("/", recController.personalized);
router.get("/trending", recController.trending);

module.exports = router;
