const authRepo = require("../repositories/auth.repository");
const { verifyUserToken } = require("../utils/userToken");

function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ success: false, error: message });
}

function parseBearerToken(authorization) {
  const value = String(authorization || "").trim();
  if (!value) return "";
  const [scheme, token] = value.split(" ");
  if (String(scheme || "").toLowerCase() !== "bearer") return "";
  return String(token || "").trim();
}

const userAuth = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) return unauthorized(res);

    const payload = verifyUserToken(token);
    const userId = String(payload?.sub || "");
    if (!userId) return unauthorized(res);

    const user = await authRepo.findUserById(userId);
    if (!user) return unauthorized(res);

    const tokenVersion = Number.isFinite(Number(payload?.tv)) ? Number(payload.tv) : 1;
    const userTokenVersion = Number(user.token_version || 1);
    if (tokenVersion !== userTokenVersion) return unauthorized(res);

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role || "customer",
    };
    next();
  } catch (err) {
    const msg = String(err?.message || "");
    if (msg === "Invalid token" || msg === "Invalid token signature" || msg === "Token expired") {
      return unauthorized(res);
    }
    next(err);
  }
};

module.exports = userAuth;
