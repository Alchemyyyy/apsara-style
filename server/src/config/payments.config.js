const { str } = require("./env");

const bakong = {
  merchantId: str("BAKONG_MERCHANT_ID", "APSARA-STYLE").trim(),
  merchantName: str("BAKONG_MERCHANT_NAME", "APSARA STYLE").trim(),
  currency: str("BAKONG_CURRENCY", "USD").trim().toUpperCase(),
  statusUrl: str("BAKONG_STATUS_URL", "").trim(),
  statusMethod: str("BAKONG_STATUS_METHOD", "GET").trim().toUpperCase(),
  apiKey: str("BAKONG_API_KEY", "").trim(),
  webhookSecret: str("BAKONG_WEBHOOK_SECRET", "").trim(),
};

module.exports = {
  bakong,
};
