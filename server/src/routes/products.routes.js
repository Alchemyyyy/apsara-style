const router = require("express").Router();
const productsController = require("../controllers/products.controller");

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Get a list of products
 *     description: Retrieve a paginated list of catalog products.
 *     responses:
 *       200:
 *         description: A JSON array of product objects
 */
router.get("/", productsController.list);
router.get("/meta", productsController.meta);
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a specific product
 *     description: Retrieve details for a single product by its database ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique identifier of the product.
 *     responses:
 *       200:
 *         description: Detailed product object
 *       404:
 *         description: Product not found
 */
router.get("/:id", productsController.detail);
router.get("/:id/similar", productsController.similar);

module.exports = router;
