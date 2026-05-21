const { appError } = require("../shared/errors");
function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  keyGenerator,
  message = "Too many requests. Please try again later.",
}) {
  const buckets = new Map();

  function pruneExpired(now) {
    for (const [key, entry] of buckets.entries()) {
      if (entry.resetAt <= now) buckets.delete(key);
    }
  }

  return (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 1000) pruneExpired(now);

    const fallbackKey = `ip:${req.ip || "unknown"}`;
    const key = String((keyGenerator && keyGenerator(req)) || fallbackKey);

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count += 1;
    if (existing.count <= max) return next();

    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfterSec));
    return next(appError(message, 429, { retryAfterSec }));
  };
}

function authEmailKey(req) {
  const email = normalizeString(req.body?.email);
  const ip = String(req.ip || "unknown");
  return email ? `email:${email}|ip:${ip}` : `ip:${ip}`;
}

function forgotEmailKey(req) {
  const email = normalizeString(req.body?.email);
  return email || `ip:${req.ip || "unknown"}`;
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: authEmailKey,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

const socialLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => `ip:${req.ip || "unknown"}`,
  message: "Too many social login attempts. Please wait and try again.",
});

const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyGenerator: authEmailKey,
  message: "Too many registration attempts. Please wait and try again.",
});

const forgotPasswordIpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => `ip:${req.ip || "unknown"}`,
  message: "Too many password reset requests. Please wait and try again.",
});

const forgotPasswordEmailCooldownLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: forgotEmailKey,
  message: "A reset email was recently requested. Please wait 1 minute before trying again.",
});

module.exports = {
  createRateLimiter,
  loginLimiter,
  socialLoginLimiter,
  registerLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailCooldownLimiter,
};
