const db = require("../db");

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    password_hash: row.password_hash,
    token_version: row.token_version,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    label: row.label,
    phone: row.phone,
    country: row.country,
    city: row.city,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    postal_code: row.postal_code,
    is_default: row.is_default,
    created_at: row.created_at,
  };
}

async function findUserByEmail(email) {
  const res = await db.query(
    `
    SELECT id, full_name, email, password_hash, token_version, role, created_at, updated_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );
  return mapUser(res.rows[0]);
}

async function findUserById(id) {
  const res = await db.query(
    `
    SELECT id, full_name, email, password_hash, token_version, role, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );
  return mapUser(res.rows[0]);
}

async function createUser({ fullName, email, passwordHash }) {
  const res = await db.query(
    `
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ($1, $2, $3, 'customer')
    RETURNING id, full_name, email, password_hash, token_version, role, created_at, updated_at
    `,
    [fullName, email, passwordHash]
  );
  return mapUser(res.rows[0]);
}

async function updatePasswordHash({ userId, passwordHash }) {
  await db.query(
    `
    UPDATE users
    SET password_hash = $1, updated_at = now()
    WHERE id = $2
    `,
    [passwordHash, userId]
  );
}

async function updateUserFullName({ userId, fullName }) {
  const res = await db.query(
    `
    UPDATE users
    SET full_name = $1, updated_at = now()
    WHERE id = $2
    RETURNING id, full_name, email, password_hash, token_version, role, created_at, updated_at
    `,
    [fullName, userId]
  );
  return mapUser(res.rows[0]);
}

async function bumpUserTokenVersion(userId) {
  const res = await db.query(
    `
    UPDATE users
    SET token_version = token_version + 1, updated_at = now()
    WHERE id = $1
    RETURNING token_version
    `,
    [userId]
  );
  return Number(res.rows[0]?.token_version || 0);
}

async function findDefaultAddressByUserId(userId) {
  const res = await db.query(
    `
    SELECT
      id, user_id, label, phone, country, city,
      address_line1, address_line2, postal_code, is_default, created_at
    FROM user_addresses
    WHERE user_id = $1 AND is_default = true
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );
  return mapAddress(res.rows[0]);
}

async function listAddressesByUserId(userId) {
  const res = await db.query(
    `
    SELECT
      id, user_id, label, phone, country, city,
      address_line1, address_line2, postal_code, is_default, created_at
    FROM user_addresses
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC
    `,
    [userId]
  );
  return res.rows.map(mapAddress);
}

async function findAddressByIdForUser({ userId, addressId }) {
  const res = await db.query(
    `
    SELECT
      id, user_id, label, phone, country, city,
      address_line1, address_line2, postal_code, is_default, created_at
    FROM user_addresses
    WHERE id = $1 AND user_id = $2
    LIMIT 1
    `,
    [addressId, userId]
  );
  return mapAddress(res.rows[0]);
}

async function createAddressForUser({
  userId,
  label,
  phone,
  country,
  city,
  addressLine1,
  addressLine2,
  postalCode,
  isDefault,
}) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    if (isDefault) {
      await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [userId]);
    }
    const res = await client.query(
      `
      INSERT INTO user_addresses (
        user_id, label, phone, country, city,
        address_line1, address_line2, postal_code, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id, user_id, label, phone, country, city,
        address_line1, address_line2, postal_code, is_default, created_at
      `,
      [userId, label, phone, country, city, addressLine1, addressLine2, postalCode, Boolean(isDefault)]
    );
    await client.query("COMMIT");
    return mapAddress(res.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateAddressForUser({
  userId,
  addressId,
  label,
  phone,
  country,
  city,
  addressLine1,
  addressLine2,
  postalCode,
  isDefault,
}) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    if (isDefault) {
      await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [userId]);
    }
    const res = await client.query(
      `
      UPDATE user_addresses
      SET
        label = $1,
        phone = $2,
        country = $3,
        city = $4,
        address_line1 = $5,
        address_line2 = $6,
        postal_code = $7,
        is_default = $8
      WHERE id = $9 AND user_id = $10
      RETURNING
        id, user_id, label, phone, country, city,
        address_line1, address_line2, postal_code, is_default, created_at
      `,
      [label, phone, country, city, addressLine1, addressLine2, postalCode, Boolean(isDefault), addressId, userId]
    );
    await client.query("COMMIT");
    return mapAddress(res.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function setDefaultAddressForUser({ userId, addressId }) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    await client.query(`UPDATE user_addresses SET is_default = false WHERE user_id = $1`, [userId]);
    const res = await client.query(
      `
      UPDATE user_addresses
      SET is_default = true
      WHERE id = $1 AND user_id = $2
      RETURNING
        id, user_id, label, phone, country, city,
        address_line1, address_line2, postal_code, is_default, created_at
      `,
      [addressId, userId]
    );
    await client.query("COMMIT");
    return mapAddress(res.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteAddressForUser({ userId, addressId }) {
  const res = await db.query(
    `
    DELETE FROM user_addresses
    WHERE id = $1 AND user_id = $2
    RETURNING id
    `,
    [addressId, userId]
  );
  return Boolean(res.rows[0]?.id);
}

async function upsertDefaultAddressForUser({
  userId,
  label,
  phone,
  country,
  city,
  addressLine1,
  addressLine2,
  postalCode,
}) {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const current = await client.query(
      `
      SELECT id
      FROM user_addresses
      WHERE user_id = $1 AND is_default = true
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );

    await client.query(
      `
      UPDATE user_addresses
      SET is_default = false
      WHERE user_id = $1
      `,
      [userId]
    );

    let row;
    if (current.rows[0]?.id) {
      const updated = await client.query(
        `
        UPDATE user_addresses
        SET
          label = $1,
          phone = $2,
          country = $3,
          city = $4,
          address_line1 = $5,
          address_line2 = $6,
          postal_code = $7,
          is_default = true
        WHERE id = $8
        RETURNING
          id, user_id, label, phone, country, city,
          address_line1, address_line2, postal_code, is_default, created_at
        `,
        [label, phone, country, city, addressLine1, addressLine2, postalCode, current.rows[0].id]
      );
      row = updated.rows[0];
    } else {
      const inserted = await client.query(
        `
        INSERT INTO user_addresses (
          user_id, label, phone, country, city,
          address_line1, address_line2, postal_code, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING
          id, user_id, label, phone, country, city,
          address_line1, address_line2, postal_code, is_default, created_at
        `,
        [userId, label, phone, country, city, addressLine1, addressLine2, postalCode]
      );
      row = inserted.rows[0];
    }

    await client.query("COMMIT");
    return mapAddress(row);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteExpiredResetTokens() {
  await db.query(`DELETE FROM password_reset_tokens WHERE expires_at <= now()`);
}

async function createResetToken({ userId, tokenHash, expiresAt }) {
  const res = await db.query(
    `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id
    `,
    [userId, tokenHash, expiresAt]
  );
  return res.rows[0]?.id || null;
}

async function findValidResetToken(tokenHash) {
  const res = await db.query(
    `
    SELECT id, user_id
    FROM password_reset_tokens
    WHERE token_hash = $1
      AND used_at IS NULL
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [tokenHash]
  );
  return res.rows[0] || null;
}

async function markResetTokenUsed(id) {
  await db.query(
    `
    UPDATE password_reset_tokens
    SET used_at = now()
    WHERE id = $1
    `,
    [id]
  );
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updatePasswordHash,
  bumpUserTokenVersion,
  updateUserFullName,
  findDefaultAddressByUserId,
  listAddressesByUserId,
  findAddressByIdForUser,
  createAddressForUser,
  updateAddressForUser,
  setDefaultAddressForUser,
  deleteAddressForUser,
  upsertDefaultAddressForUser,
  deleteExpiredResetTokens,
  createResetToken,
  findValidResetToken,
  markResetTokenUsed,
};
