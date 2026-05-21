const { ok } = require("../../shared/responses");
const cartService = require("./service");
const { asyncHandler } = require("../../shared/errors");
const { parseInteger, requireValue } = require("../../shared/validation");

const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getOrCreateCart({ sessionId: req.sessionId });
  ok(res, data);
});

const addItem = asyncHandler(async (req, res) => {
  const { variantId, qty } = req.body;
  if (requireValue(res, variantId, "variantId") == null) return;
  const parsedQty = parseInteger(res, qty, "qty", { min: 1, defaultValue: 1 });
  if (parsedQty == null) return;

  const data = await cartService.addItem({
    sessionId: req.sessionId,
    variantId,
    qty: parsedQty,
  });

  ok(res, data);
});

const updateItem = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const itemId = req.params.itemId;
  const parsedQty = parseInteger(res, qty, "qty", { min: 0 });
  if (parsedQty == null) return;

  const data = await cartService.updateItem({
    sessionId: req.sessionId,
    itemId,
    qty: parsedQty,
  });

  ok(res, data);
});

const removeItem = asyncHandler(async (req, res) => {
  const itemId = req.params.itemId;

  const data = await cartService.removeItem({
    sessionId: req.sessionId,
    itemId,
  });

  ok(res, data);
});

const refreshReservations = asyncHandler(async (req, res) => {
  const data = await cartService.refreshReservations({
    sessionId: req.sessionId,
  });

  ok(res, data);
});

const adjustToAvailable = asyncHandler(async (req, res) => {
  const data = await cartService.adjustToAvailable({
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const claimCart = asyncHandler(async (req, res) => {
  const data = await cartService.claimSessionCart({
    sessionId: req.sessionId,
    userId: req.user?.id,
  });
  ok(res, data);
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  refreshReservations,
  adjustToAvailable,
  claimCart,
};
