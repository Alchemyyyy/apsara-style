const crypto = require("crypto");

/**
 * Simple guest session id.
 * - Reads x-session-id header if provided
 * - Otherwise generates one (returns it in response header)
 */
module.exports = function session(req, res, next) {
  const incoming = req.headers["x-session-id"];

  if (incoming && typeof incoming === "string" && incoming.length >= 8) {
    req.sessionId = incoming;
    return next();
  }

  const newId = "sess_" + crypto.randomBytes(16).toString("hex");
  req.sessionId = newId;
  res.setHeader("x-session-id", newId);
  next();
};
