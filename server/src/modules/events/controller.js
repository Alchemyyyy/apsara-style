const { ok } = require("../../shared/responses");
const eventsService = require("./service");
const { asyncHandler } = require("../../shared/errors");
const { requireValue } = require("../../shared/validation");

const create = asyncHandler(async (req, res) => {
  const { type, productId, query, meta } = req.body;

  if (requireValue(res, type, "type") == null) return;

  const event = await eventsService.create({
    sessionId: req.sessionId,
    type,
    productId: productId || null,
    query: query || null,
    meta: meta || {},
  });

  ok(res, event);
});

module.exports = {
  create,
};
