const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimiter } = require("../src/middleware/rateLimit");

function runLimiter(middleware, req) {
  const res = {
    headers: {},
    set(name, value) {
      this.headers[String(name)] = String(value);
    },
  };
  return new Promise((resolve) => {
    middleware(req, res, (err) => resolve({ err, res }));
  });
}

test("createRateLimiter: allows up to max and blocks with 429 after", async () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 2,
    keyGenerator: (req) => `ip:${req.ip}`,
    message: "Too many attempts",
  });

  const originalNow = Date.now;
  Date.now = () => 1_000;
  try {
    const req = { ip: "127.0.0.1", body: {} };

    const first = await runLimiter(limiter, req);
    assert.equal(first.err, undefined);

    const second = await runLimiter(limiter, req);
    assert.equal(second.err, undefined);

    const third = await runLimiter(limiter, req);
    assert.equal(third.err?.status, 429);
    assert.equal(third.err?.message, "Too many attempts");
    assert.equal(third.res.headers["Retry-After"], "60");
  } finally {
    Date.now = originalNow;
  }
});

test("createRateLimiter: resets after window expires", async () => {
  const limiter = createRateLimiter({
    windowMs: 1_000,
    max: 1,
    keyGenerator: (req) => `ip:${req.ip}`,
    message: "Rate limited",
  });

  let now = 10_000;
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    const req = { ip: "10.0.0.8", body: {} };

    const first = await runLimiter(limiter, req);
    assert.equal(first.err, undefined);

    const second = await runLimiter(limiter, req);
    assert.equal(second.err?.status, 429);

    now = 11_001;
    const third = await runLimiter(limiter, req);
    assert.equal(third.err, undefined);
  } finally {
    Date.now = originalNow;
  }
});

test("createRateLimiter: keyGenerator can enforce per-email cooldown", async () => {
  const limiter = createRateLimiter({
    windowMs: 60_000,
    max: 1,
    keyGenerator: (req) => String(req.body?.email || "").toLowerCase(),
    message: "Please wait before requesting again.",
  });

  const originalNow = Date.now;
  Date.now = () => 42_000;
  try {
    const reqA = { ip: "127.0.0.1", body: { email: "a@example.com" } };
    const reqB = { ip: "127.0.0.1", body: { email: "b@example.com" } };

    const firstA = await runLimiter(limiter, reqA);
    assert.equal(firstA.err, undefined);

    const secondA = await runLimiter(limiter, reqA);
    assert.equal(secondA.err?.status, 429);
    assert.equal(secondA.err?.message, "Please wait before requesting again.");

    const firstB = await runLimiter(limiter, reqB);
    assert.equal(firstB.err, undefined);
  } finally {
    Date.now = originalNow;
  }
});
