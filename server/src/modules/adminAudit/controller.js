const { okList } = require("../../shared/responses");
const adminAuditService = require("./service");
const { asyncHandler } = require("../../shared/errors");

const list = asyncHandler(async (req, res) => {
  const data = await adminAuditService.list(req.query);
  okList(res, data);
});

module.exports = {
  list,
};
