const { noContentOk, ok } = require("../../shared/responses");
const wishlistService = require("./service");
const { asyncHandler } = require("../../shared/errors");
const { requireValue } = require("../../shared/validation");

const list = asyncHandler(async (req, res) => {
  const data = await wishlistService.list(req.sessionId);
  ok(res, data);
});

const add = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (requireValue(res, productId, "productId") == null) return;
  const data = await wishlistService.add(req.sessionId, productId);
  ok(res, data);
});

const remove = asyncHandler(async (req, res) => {
  if (requireValue(res, req.params.productId, "productId") == null) return;
  await wishlistService.remove(req.sessionId, req.params.productId);
  noContentOk(res);
});

module.exports = {
  list,
  add,
  remove,
};
