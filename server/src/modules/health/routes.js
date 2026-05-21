const router = require("express").Router();
const db = require("../../db");
const { uploadStorage } = require("../../config/uploads.config");

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API Health Check
 *     description: Returns the status of the API server to ensure the system is running.
 *     responses:
 *       200:
 *         description: Server is up and running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: ok
 *                     uptime_sec:
 *                       type: integer
 *                       example: 1234
 *                     ts:
 *                       type: string
 *                       example: "2026-04-07T03:51:00.000Z"
 *                     upload_storage:
 *                       type: string
 *                       example: "local"
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      uptime_sec: Math.round(process.uptime()),
      ts: new Date().toISOString(),
      upload_storage: uploadStorage,
    },
  });
});

router.get("/ready", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      success: true,
      data: {
        status: "ready",
        db: "ok",
        ts: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: "Service not ready",
      data: {
        status: "not_ready",
        db: "down",
      },
    });
  }
});

module.exports = router;
