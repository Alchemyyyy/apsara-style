const { ok } = require("../../shared/responses");
const recService = require("./service");
const { asyncHandler } = require("../../shared/errors");

const personalized = asyncHandler(async (req, res) => {
  const data = await recService.personalized({ sessionId: req.sessionId, limit: req.query.limit });
  ok(res, data);
});

const trending = asyncHandler(async (req, res) => {
  const data = await recService.trending({ limit: req.query.limit });
  ok(res, data);
});

module.exports = {
  personalized,
  trending,
};
