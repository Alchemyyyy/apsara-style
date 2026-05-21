const jwt = require("jsonwebtoken");
const { userTokenSecret } = require("../config/token.config");

function resolveSecret() {
  return userTokenSecret;
}

function signUserToken(payload, options = {}) {
  const secret = options.secret || resolveSecret();
  if (!secret) throw new Error("USER_TOKEN_SECRET not set");
  const expiresIn = Number(options.expiresInSec || 60 * 60 * 24 * 7);
  return jwt.sign(payload, secret, { algorithm: "HS256", expiresIn });
}

function verifyUserToken(token, options = {}) {
  const secret = options.secret || resolveSecret();
  if (!secret) throw new Error("USER_TOKEN_SECRET not set");
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
  signUserToken,
  verifyUserToken,
};
