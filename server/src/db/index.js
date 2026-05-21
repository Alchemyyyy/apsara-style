const { Pool } = require("pg");
const { databaseUrl } = require("../config/db.config");

const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};
