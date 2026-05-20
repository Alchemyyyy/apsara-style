const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const userAuth = require("../middleware/userAuth");
const {
  loginLimiter,
  socialLoginLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailCooldownLimiter,
} = require("../middleware/rateLimit");

router.post("/register", registerLimiter, authController.register);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log into the application
 *     description: Authenticate a user by verifying their email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Successfully authenticated. Returns a session cookie.
 *       401:
 *         description: Incorrect email or password.
 */
router.post("/login", loginLimiter, authController.login);
router.post("/google", socialLoginLimiter, authController.loginWithGoogle);
router.post("/facebook", socialLoginLimiter, authController.loginWithFacebook);
router.post(
  "/forgot-password",
  forgotPasswordIpLimiter,
  forgotPasswordEmailCooldownLimiter,
  authController.forgotPassword
);
router.post("/reset-password", authController.resetPassword);
router.get("/me", userAuth, authController.me);
router.patch("/me", userAuth, authController.updateMe);
router.get("/me/addresses", userAuth, authController.listMyAddresses);
router.post("/me/addresses", userAuth, authController.createMyAddress);
router.patch("/me/addresses/:id", userAuth, authController.updateMyAddress);
router.delete("/me/addresses/:id", userAuth, authController.deleteMyAddress);
router.patch("/me/addresses/:id/default", userAuth, authController.setMyDefaultAddress);
router.put("/me/password", userAuth, authController.changeMyPassword);

module.exports = router;
