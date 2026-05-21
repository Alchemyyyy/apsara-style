const { clientUrl } = require("./app.config");
const { int, str } = require("./env");

const emailMode = str("EMAIL_MODE", "disabled").trim().toLowerCase();
const smtp = {
  host: str("SMTP_HOST", ""),
  port: int("SMTP_PORT", 587),
  user: str("SMTP_USER", ""),
  pass: str("SMTP_PASS", ""),
  from: str("MAIL_FROM", "APSARA STYLE <no-reply@apsara.local>"),
};

module.exports = {
  clientUrl,
  emailMode,
  smtp,
};
