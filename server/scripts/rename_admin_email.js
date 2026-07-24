// Rename an admin_users login email and revoke their existing sessions.
// Usage: node scripts/rename_admin_email.js --from admin@apsara.com --to admin@sabyorder.com
require("dotenv").config();
const { Pool } = require("pg");
const { databaseUrl } = require("../src/config/db.config");

function readArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : "";
}

async function main() {
  const from = readArg("from").trim().toLowerCase();
  const to = readArg("to").trim().toLowerCase();

  if (!from || !to) {
    throw new Error("Usage: node scripts/rename_admin_email.js --from <old-email> --to <new-email>");
  }
  if (!databaseUrl) {
    throw new Error("Missing DB config. Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in server/.env.");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  const updated = await pool.query(
    `UPDATE admin_users SET email = $1, updated_at = now() WHERE LOWER(email) = LOWER($2) RETURNING id, full_name, email`,
    [to, from]
  );

  if (!updated.rows.length) {
    console.log(`No admin found with email ${from}`);
    await pool.end();
    return;
  }

  const admin = updated.rows[0];
  console.log("Updated:", admin);

  await pool.query(
    `UPDATE admin_refresh_tokens SET revoked_at = now() WHERE admin_user_id = $1 AND revoked_at IS NULL`,
    [admin.id]
  );
  console.log("Revoked existing refresh tokens for this admin.");

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
