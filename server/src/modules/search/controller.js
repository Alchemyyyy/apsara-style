const { okList } = require("../../shared/responses");
const searchService = require("./service");
const { asyncHandler } = require("../../shared/errors");

const search = asyncHandler(async (req, res) => {
  const data = await searchService.search(req.query);
  okList(res, data);
});

module.exports = {
  search,
};
