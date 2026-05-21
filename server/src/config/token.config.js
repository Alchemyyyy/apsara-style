const { str } = require("./env");

const adminTokenSecret = str("ADMIN_TOKEN_SECRET", str("ADMIN_KEY", ""));
const userTokenSecret = str("USER_TOKEN_SECRET", adminTokenSecret);

module.exports = {
  adminTokenSecret,
  userTokenSecret,
};
