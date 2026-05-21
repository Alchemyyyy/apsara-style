const { ok, okList } = require("../../shared/responses");
const productService = require("./service");
const { asyncHandler } = require("../../shared/errors");
const { fail } = require("../../shared/validation");

const list = asyncHandler(async (req, res) => {
  const data = await productService.list(req.query);
  okList(res, data);
});

const meta = asyncHandler(async (req, res) => {
  const data = await productService.meta();
  ok(res, data);
});

const detail = asyncHandler(async (req, res) => {
  const data = await productService.detail(req.params.id);
  if (!data) return fail(res, "Product not found", 404);
  ok(res, data);
});

const similar = asyncHandler(async (req, res) => {
  const data = await productService.similar(req.params.id, req.query);
  ok(res, data);
});

module.exports = {
  list,
  meta,
  detail,
  similar,
};
