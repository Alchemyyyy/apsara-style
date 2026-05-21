const jwt = require("jsonwebtoken");
const { adminTokenSecret } = require("../config/token.config");

function resolveSecret() {
  return adminTokenSecret;
}

function signAdminToken(payload, options = {}) {
  const secret = options.secret || resolveSecret();
  if (!secret) throw new Error("ADMIN_TOKEN_SECRET not set");
  const expiresIn = Number(options.expiresInSec || 60 * 60 * 8);
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn });
}

function verifyAdminToken(token, options = {}) {
  const secret = options.secret || resolveSecret();
  if (!secret) throw new Error("ADMIN_TOKEN_SECRET not set");
  try {
    return jwt.verify(String(token || ""), secret, { algorithms: ["HS256"] });
  } catch (err) {
    const name = String(err?.name || "");
    if (name === "TokenExpiredError") throw new Error("Token expired");
    if (name === "JsonWebTokenError") {
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("signature")) throw new Error("Invalid token signature");
      throw new Error("Invalid token");
    }
    throw err;
  }
}

module.exports = {
  signAdminToken,
  verifyAdminToken,
};
