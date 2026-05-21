const { csv, positiveInt, str } = require("./env");

const port = positiveInt("PORT", 4000);
const serverUrl = str("SERVER_URL", `http://localhost:${port}`);
const clientUrl = str("CLIENT_URL", "http://localhost:5173");
const clientOrigins = csv("CLIENT_URL", [clientUrl]);
const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  clientOrigins,
  clientUrl,
  isProduction,
  port,
  serverUrl,
};
