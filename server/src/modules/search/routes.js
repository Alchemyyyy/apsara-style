const router = require("express").Router();
const searchController = require("./controller");

router.get("/", searchController.search);

module.exports = router;
