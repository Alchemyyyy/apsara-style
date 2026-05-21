const adminAuthRepo = require("../modules/adminAuth/repository");
const { verifyAdminToken } = require("../utils/adminToken");

const ALL_ADMIN_ROLES = ["super_admin", "ops_admin", "catalog_admin"];

function unauthorized(res, message = "Unauthorized") {
  return res.status(401).json({ success: false, error: message });
}

function forbidden(res, message = "Forbidden") {
  return res.status(403).json({ success: false, error: message });
}

function parseBearerToken(authorization) {
  const value = String(authorization || "").trim();
  if (!value) return "";
  const [scheme, token] = value.split(" ");
  if (String(scheme || "").toLowerCase() !== "bearer") return "";
  return String(token || "").trim();
}

const adminAuth = async (req, res, next) => {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) return unauthorized(res);

    const payload = verifyAdminToken(token);
    const adminId = String(payload?.sub || "");
    if (!adminId) return unauthorized(res);

    const admin = await adminAuthRepo.findAdminById(adminId);
    if (!admin || !admin.is_active) return unauthorized(res);

    req.admin = {
      id: admin.id,
      fullName: admin.full_name,
      email: admin.email,
      roles: admin.roles || [],
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

function requireAdminRoles(...allowedRoles) {
  const allowed = allowedRoles.length ? allowedRoles : ALL_ADMIN_ROLES;
  return (req, res, next) => {
    const roles = Array.isArray(req.admin?.roles) ? req.admin.roles : [];
    if (roles.some((role) => allowed.includes(role))) return next();
    return forbidden(res, "Insufficient permissions");
  };
}

module.exports = {
  ALL_ADMIN_ROLES,
  adminAuth,
  requireAdminRoles,
};
