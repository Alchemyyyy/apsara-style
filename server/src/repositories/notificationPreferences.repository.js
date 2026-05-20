const db = require("../db");

function mapRow(row) {
  if (!row) return null;
  return {
    user_id: row.user_id,
    order_in_app: Boolean(row.order_in_app),
    order_email: Boolean(row.order_email),
    payment_in_app: Boolean(row.payment_in_app),
    payment_email: Boolean(row.payment_email),
    return_in_app: Boolean(row.return_in_app),
    return_email: Boolean(row.return_email),
    marketing_in_app: Boolean(row.marketing_in_app),
    marketing_email: Boolean(row.marketing_email),
    updated_at: row.updated_at,
  };
}

async function findByUserId(userId) {
  const res = await db.query(
    `
    SELECT
      user_id,
      order_in_app,
      order_email,
      payment_in_app,
      payment_email,
      return_in_app,
      return_email,
      marketing_in_app,
      marketing_email,
      updated_at
    FROM user_notification_preferences
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId]
  );
  return mapRow(res.rows[0] || null);
}

async function upsertByUserId(userId, patch) {
  const res = await db.query(
    `
    INSERT INTO user_notification_preferences (
      user_id,
      order_in_app,
      order_email,
      payment_in_app,
      payment_email,
      return_in_app,
      return_email,
      marketing_in_app,
      marketing_email
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id)
    DO UPDATE SET
      order_in_app = EXCLUDED.order_in_app,
      order_email = EXCLUDED.order_email,
      payment_in_app = EXCLUDED.payment_in_app,
      payment_email = EXCLUDED.payment_email,
      return_in_app = EXCLUDED.return_in_app,
      return_email = EXCLUDED.return_email,
      marketing_in_app = EXCLUDED.marketing_in_app,
      marketing_email = EXCLUDED.marketing_email,
      updated_at = now()
    RETURNING
      user_id,
      order_in_app,
      order_email,
      payment_in_app,
      payment_email,
      return_in_app,
      return_email,
      marketing_in_app,
      marketing_email,
      updated_at
    `,
    [
      userId,
      Boolean(patch.order_in_app),
      Boolean(patch.order_email),
      Boolean(patch.payment_in_app),
      Boolean(patch.payment_email),
      Boolean(patch.return_in_app),
      Boolean(patch.return_email),
      Boolean(patch.marketing_in_app),
      Boolean(patch.marketing_email),
    ]
  );
  return mapRow(res.rows[0] || null);
}

module.exports = {
  findByUserId,
  upsertByUserId,
};

