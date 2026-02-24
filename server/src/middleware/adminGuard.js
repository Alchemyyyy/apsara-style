module.exports = function adminGuard(req, res, next) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ success: false, error: "ADMIN_KEY not set" });
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
};
