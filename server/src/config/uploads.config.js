const { str } = require("./env");

const uploadStorage = str("UPLOAD_STORAGE", "local").trim().toLowerCase();
const cloudinary = {
  cloudName: str("CLOUDINARY_CLOUD_NAME", ""),
  apiKey: str("CLOUDINARY_API_KEY", ""),
  apiSecret: str("CLOUDINARY_API_SECRET", ""),
  folder: str("CLOUDINARY_FOLDER", "apsara-style/products"),
};

function isCloudinaryConfigured() {
  return Boolean(cloudinary.cloudName && cloudinary.apiKey && cloudinary.apiSecret);
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadStorage,
};
