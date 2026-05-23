const { str } = require("./env");

function buildDatabaseUrl() {
  const explicitUrl = str("DATABASE_URL", "").trim();
  if (explicitUrl) return explicitUrl;

  const host = str("DB_HOST", "").trim();
  const port = str("DB_PORT", "5432").trim();
  const database = str("DB_NAME", "").trim();
  const user = str("DB_USER", "").trim();
  const password = str("DB_PASSWORD", "");

  if (!host || !database || !user) return "";

  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgresql://${auth}@${host}:${port}/${encodeURIComponent(database)}`;
}

module.exports = {
  databaseUrl: buildDatabaseUrl(),
};
