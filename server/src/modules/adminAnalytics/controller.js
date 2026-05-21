const { ok } = require("../../shared/responses");
const analyticsService = require("./service");
const { asyncHandler } = require("../../shared/errors");

const overview = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7);
  const data = await analyticsService.overview({ days });
  ok(res, data);
});

const topProducts = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7);
  const limit = Number(req.query.limit || 10);
  const data = await analyticsService.topProducts({ days, limit });
  ok(res, data);
});

const topSearches = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 7);
  const limit = Number(req.query.limit || 10);
  const data = await analyticsService.topSearches({ days, limit });
  ok(res, data);
});

module.exports = {
  overview,
  topProducts,
  topSearches,
};
