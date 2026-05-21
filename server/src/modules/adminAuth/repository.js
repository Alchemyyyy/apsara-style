const db = require("../../db");

function mapAdminRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    password_hash: row.password_hash,
    is_active: row.is_active,
    roles: Array.isArray(row.roles) ? row.roles.filter(Boolean) : [],
  };
}

async function findAdminByEmail(email) {
  const res = await db.query(
    `
    SELECT
      au.id,
      au.full_name,
      au.email,
      au.password_hash,
      au.is_active,
      COALESCE(array_agg(aur.role_code) FILTER (WHERE aur.role_code IS NOT NULL), '{}') AS roles
    FROM admin_users au
    LEFT JOIN admin_user_roles aur ON aur.admin_user_id = au.id
    WHERE LOWER(au.email) = LOWER($1)
    GROUP BY au.id
    LIMIT 1
    `,
    [email]
  );
  return mapAdminRow(res.rows[0]);
}

async function findAdminById(adminId) {
  const res = await db.query(
    `
    SELECT
      au.id,
      au.full_name,
      au.email,
      au.password_hash,
      au.is_active,
      COALESCE(array_agg(aur.role_code) FILTER (WHERE aur.role_code IS NOT NULL), '{}') AS roles
    FROM admin_users au
    LEFT JOIN admin_user_roles aur ON aur.admin_user_id = au.id
    WHERE au.id = $1
    GROUP BY au.id
    LIMIT 1
    `,
    [adminId]
  );
  return mapAdminRow(res.rows[0]);
}

async function touchLastLogin(adminId) {
  await db.query(
    `UPDATE admin_users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
    [adminId]
  );
}

async function createRefreshToken({ adminUserId, tokenHash, expiresAt }, client) {
  const runner = client || db;
  const res = await runner.query(
    `
    INSERT INTO admin_refresh_tokens (admin_user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, admin_user_id, token_hash, expires_at, revoked_at, created_at, last_used_at
    `,
    [adminUserId, tokenHash, expiresAt]
  );
  return res.rows[0] || null;
}

async function findRefreshTokenByHash(tokenHash) {
  const res = await db.query(
    `
    SELECT id, admin_user_id, token_hash, expires_at, revoked_at, created_at, last_used_at
    FROM admin_refresh_tokens
    WHERE token_hash = $1
    LIMIT 1
    `,
    [tokenHash]
  );
  return res.rows[0] || null;
}

async function touchRefreshTokenLastUsed(id, client) {
  const runner = client || db;
  await runner.query(`UPDATE admin_refresh_tokens SET last_used_at = now() WHERE id = $1`, [id]);
}

async function revokeRefreshTokenByHash(tokenHash, client) {
  const runner = client || db;
  await runner.query(
    `UPDATE admin_refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}

async function revokeAllRefreshTokensByAdmin(adminUserId, client) {
  const runner = client || db;
  await runner.query(
    `UPDATE admin_refresh_tokens SET revoked_at = now() WHERE admin_user_id = $1 AND revoked_at IS NULL`,
    [adminUserId]
  );
}

module.exports = {
  findAdminByEmail,
  findAdminById,
  touchLastLogin,
  createRefreshToken,
  findRefreshTokenByHash,
  touchRefreshTokenLastUsed,
  revokeRefreshTokenByHash,
  revokeAllRefreshTokensByAdmin,
};
