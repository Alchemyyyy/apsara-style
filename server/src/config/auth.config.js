const { positiveInt } = require("./env");
const { isProduction } = require("./app.config");

const adminRefreshCookieName = "apsara_admin_rt";
const adminRefreshCookiePath = "/api/admin/auth";
const adminAccessTokenExpiresSec = positiveInt("ADMIN_ACCESS_TOKEN_EXPIRES_SEC", 60 * 60 * 8);
const adminRefreshTokenExpiresDays = positiveInt("ADMIN_REFRESH_TOKEN_EXPIRES_DAYS", 14);

function adminRefreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: adminRefreshCookiePath,
    maxAge: adminRefreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  };
}

module.exports = {
  adminAccessTokenExpiresSec,
  adminRefreshCookieName,
  adminRefreshCookieOptions,
  adminRefreshCookiePath,
  adminRefreshTokenExpiresDays,
};
