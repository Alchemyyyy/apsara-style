const { appError } = require("../../shared/errors");
const adminAuthRepo = require("./repository");
const db = require("../../db");
const crypto = require("crypto");
const { adminAccessTokenExpiresSec, adminRefreshTokenExpiresDays } = require("../../config/auth.config");
const { verifyPassword } = require("../../utils/passwordHash");
const { signAdminToken } = require("../../utils/adminToken");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function accessTokenExpiresSec() {
  return adminAccessTokenExpiresSec;
}

function refreshTokenExpiresDays() {
  return adminRefreshTokenExpiresDays;
}

function createRefreshTokenRaw() {
  return crypto.randomBytes(48).toString("base64url");
}

function hashRefreshToken(raw) {
  return crypto.createHash("sha256").update(String(raw || "")).digest("hex");
}

function buildAdminProfile(admin) {
  const roles = Array.isArray(admin.roles) ? admin.roles : [];
  return {
    id: admin.id,
    fullName: admin.full_name,
    email: admin.email,
    roles,
  };
}

async function issueAdminTokens(admin, client) {
  const roles = Array.isArray(admin.roles) ? admin.roles : [];
  if (!roles.length) throw appError("Admin account has no roles assigned", 403);

  const token = signAdminToken(
    {
      sub: admin.id,
      email: admin.email,
      roles,
    },
    { expiresInSec: accessTokenExpiresSec() }
  );

  const refreshToken = createRefreshTokenRaw();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + refreshTokenExpiresDays() * 24 * 60 * 60 * 1000);
  await adminAuthRepo.createRefreshToken(
    {
      adminUserId: admin.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    },
    client
  );

  return { token, refreshToken, admin: buildAdminProfile(admin) };
}

async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const plainPassword = String(password || "");
  if (!normalizedEmail || !plainPassword) throw appError("email and password are required", 400);

  const admin = await adminAuthRepo.findAdminByEmail(normalizedEmail);
  if (!admin || !admin.is_active) throw appError("Invalid email or password", 401);

  const ok = verifyPassword(plainPassword, admin.password_hash);
  if (!ok) throw appError("Invalid email or password", 401);

  await adminAuthRepo.touchLastLogin(admin.id);
  return issueAdminTokens(admin);
}

async function me(adminId) {
  const admin = await adminAuthRepo.findAdminById(adminId);
  if (!admin || !admin.is_active) throw appError("Unauthorized", 401);
  return buildAdminProfile(admin);
}

async function refresh({ refreshToken }) {
  const raw = String(refreshToken || "").trim();
  if (!raw) throw appError("refresh_token is required", 400);

  const tokenHash = hashRefreshToken(raw);
  const current = await adminAuthRepo.findRefreshTokenByHash(tokenHash);
  if (!current || current.revoked_at) throw appError("Invalid refresh token", 401);

  if (new Date(current.expires_at).getTime() <= Date.now()) {
    await adminAuthRepo.revokeRefreshTokenByHash(tokenHash).catch(() => {});
    throw appError("Refresh token expired", 401);
  }

  const admin = await adminAuthRepo.findAdminById(current.admin_user_id);
  if (!admin || !admin.is_active) throw appError("Unauthorized", 401);

  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    await adminAuthRepo.revokeRefreshTokenByHash(tokenHash, client);
    await adminAuthRepo.touchRefreshTokenLastUsed(current.id, client);
    const payload = await issueAdminTokens(admin, client);
    await client.query("COMMIT");
    return payload;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function logout({ adminId, refreshToken }) {
  const raw = String(refreshToken || "").trim();
  if (raw) {
    await adminAuthRepo.revokeRefreshTokenByHash(hashRefreshToken(raw)).catch(() => {});
  } else if (adminId) {
    await adminAuthRepo.revokeAllRefreshTokensByAdmin(adminId).catch(() => {});
  }

  return { loggedOut: true };
}

module.exports = {
  login,
  me,
  refresh,
  logout,
};
