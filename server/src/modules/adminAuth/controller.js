const { ok } = require("../../shared/responses");
const { asyncHandler } = require("../../shared/errors");
const adminAuthService = require("./service");
const {
  adminRefreshCookieName,
  adminRefreshCookieOptions,
  adminRefreshCookiePath,
} = require("../../config/auth.config");

function parseCookieHeader(cookieHeader = "") {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf("=");
      if (idx <= 0) return acc;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        acc[key] = value;
      }
      return acc;
    }, {});
}

function readRefreshToken(req) {
  const cookies = parseCookieHeader(req?.headers?.cookie || "");
  return String(cookies[adminRefreshCookieName] || req?.body?.refresh_token || "").trim();
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(adminRefreshCookieName, refreshToken, adminRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(adminRefreshCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: adminRefreshCookieOptions().secure,
    path: adminRefreshCookiePath,
  });
}

const login = asyncHandler(async (req, res) => {
  const data = await adminAuthService.login({
    email: req.body?.email,
    password: req.body?.password,
  });
  if (data?.refreshToken) setRefreshCookie(res, data.refreshToken);
  const responseData = { ...data };
  delete responseData.refreshToken;
  ok(res, responseData);
});

const me = asyncHandler(async (req, res) => {
  const data = await adminAuthService.me(req.admin.id);
  ok(res, data);
});

const refresh = asyncHandler(async (req, res) => {
  const data = await adminAuthService.refresh({
    refreshToken: readRefreshToken(req),
  });
  if (data?.refreshToken) setRefreshCookie(res, data.refreshToken);
  const responseData = { ...data };
  delete responseData.refreshToken;
  ok(res, responseData);
});

const logout = asyncHandler(async (req, res) => {
  const data = await adminAuthService.logout({
    adminId: req.admin?.id || null,
    refreshToken: readRefreshToken(req),
  });
  clearRefreshCookie(res);
  ok(res, data);
});

module.exports = {
  login,
  me,
  refresh,
  logout,
};
