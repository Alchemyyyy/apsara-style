const router = require("express").Router();
const wishlistController = require("./controller");

router.get("/", wishlistController.list);
router.post("/", wishlistController.add);
router.delete("/:productId", wishlistController.remove);

module.exports = router;