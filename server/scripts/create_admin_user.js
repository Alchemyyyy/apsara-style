require("dotenv").config();
const { Client } = require("pg");
const { hashPassword } = require("../src/utils/passwordHash");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

function readArg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return String(process.argv[idx + 1]);
  return fallback;
}

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  const allowed = new Set(["super_admin", "ops_admin", "catalog_admin"]);
  return allowed.has(role) ? role : "super_admin";
}

async function main() {
  const email = readArg("email", process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
  const password = readArg("password", process.env.ADMIN_BOOTSTRAP_PASSWORD || "");
  const fullName = readArg("name", process.env.ADMIN_BOOTSTRAP_NAME || "Admin User").trim();
  const roleCode = normalizeRole(readArg("role", process.env.ADMIN_BOOTSTRAP_ROLE || "super_admin"));

  if (!email || !password) {
    console.error("Usage: node scripts/create_admin_user.js --email <email> --password <password> [--name \"Full Name\"] [--role super_admin|ops_admin|catalog_admin]");
    process.exit(1);
  }

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = hashPassword(password);
    const userRes = await client.query(
      `
      INSERT INTO admin_users (full_name, email, password_hash, is_active, updated_at)
      VALUES ($1, $2, $3, true, now())
      ON CONFLICT ((LOWER(email)))
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        is_active = true,
        updated_at = now()
      RETURNING id, email
      `,
      [fullName, email, passwordHash]
    );

    const adminId = userRes.rows[0].id;

    await client.query(`DELETE FROM admin_user_roles WHERE admin_user_id = $1`, [adminId]);
    await client.query(
      `INSERT INTO admin_user_roles (admin_user_id, role_code) VALUES ($1, $2)`,
      [adminId, roleCode]
    );

    await client.query("COMMIT");
    console.log(`Admin user ready: ${email} (${roleCode})`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});
