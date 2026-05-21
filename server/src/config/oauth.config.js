const { str } = require("./env");

const googleClientIds = str("GOOGLE_CLIENT_ID", str("GOOGLE_OAUTH_CLIENT_ID", ""))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const facebook = {
  appId: str("FACEBOOK_APP_ID", "").trim(),
  appSecret: str("FACEBOOK_APP_SECRET", "").trim(),
};

module.exports = {
  facebook,
  googleClientIds,
};
