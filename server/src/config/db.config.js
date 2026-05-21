const { str } = require("./env");

module.exports = {
  databaseUrl: str("DATABASE_URL", ""),
};
