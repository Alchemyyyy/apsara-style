const crypto = require("crypto");

const DEFAULT_ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = "sha256";

function hashPassword(plain, options = {}) {
  const value = String(plain || "");
  if (!value) throw new Error("password required");

  const iterations = Number(options.iterations || DEFAULT_ITERATIONS);
  const salt = options.salt || crypto.randomBytes(16).toString("base64");

  const derived = crypto.pbkdf2Sync(value, Buffer.from(salt, "base64"), iterations, KEYLEN, DIGEST);
  return `pbkdf2$${iterations}$${salt}$${derived.toString("base64")}`;
}

function verifyPassword(plain, stored) {
  const value = String(plain || "");
  const token = String(stored || "");
  const parts = token.split("$");
  if (parts.length !== 4) return false;
  if (parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const hashB64 = parts[3];
  if (!Number.isFinite(iterations) || iterations <= 0 || !salt || !hashB64) return false;

  const recalculated = crypto.pbkdf2Sync(value, Buffer.from(salt, "base64"), iterations, KEYLEN, DIGEST);
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== recalculated.length) return false;

  return crypto.timingSafeEqual(expected, recalculated);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
