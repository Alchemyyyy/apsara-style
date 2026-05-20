const crypto = require("crypto");

/**
 * Simple guest session id.
 * - Reads x-session-id header if provided
 * - Otherwise generates one (returns it in response header)
 */
module.exports = function session(req, res, next) {
  const incomingHeader = req.headers["x-session-id"];
  const allowQuerySid =
    typeof req.path === "string" && req.path.endsWith("/notifications/stream");
  const incomingQuery = allowQuerySid ? req.query?.sid : null;
  const incoming = incomingHeader || incomingQuery;

  if (incoming && typeof incoming === "string" && incoming.length >= 8) {
    req.sessionId = incoming;
    return next();
  }

  const newId = "sess_" + crypto.randomBytes(16).toString("hex");
  req.sessionId = newId;
  res.setHeader("x-session-id", newId);
  next();
};
