const adminAuthService = require("../services/adminAuth.service");

const ADMIN_REFRESH_COOKIE = "apsara_admin_rt";

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
  return String(cookies[ADMIN_REFRESH_COOKIE] || req?.body?.refresh_token || "").trim();
}

function refreshCookieOptions() {
  const maxAgeDays = Number(process.env.ADMIN_REFRESH_TOKEN_EXPIRES_DAYS || 14);
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/auth",
    maxAge: Math.max(1, maxAgeDays) * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(ADMIN_REFRESH_COOKIE, refreshToken, refreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(ADMIN_REFRESH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/auth",
  });
}

const login = async (req, res, next) => {
  try {
    const data = await adminAuthService.login({
      email: req.body?.email,
      password: req.body?.password,
    });
    if (data?.refreshToken) setRefreshCookie(res, data.refreshToken);
    const responseData = { ...data };
    delete responseData.refreshToken;
    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const data = await adminAuthService.me(req.admin.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const data = await adminAuthService.refresh({
      refreshToken: readRefreshToken(req),
    });
    if (data?.refreshToken) setRefreshCookie(res, data.refreshToken);
    const responseData = { ...data };
    delete responseData.refreshToken;
    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const data = await adminAuthService.logout({
      adminId: req.admin?.id || null,
      refreshToken: readRefreshToken(req),
    });
    clearRefreshCookie(res);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  me,
  refresh,
  logout,
};
