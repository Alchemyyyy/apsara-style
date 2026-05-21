const { ok } = require("../../shared/responses");
const stylistService = require("./service");
const { asyncHandler } = require("../../shared/errors");
const { parseInteger, requireValue } = require("../../shared/validation");

const buildOutfit = asyncHandler(async (req, res) => {
  const { prompt, gender, occasion, style, budgetMax, k } = req.body;

  if (requireValue(res, prompt, "prompt") == null) return;
  const lookCount = parseInteger(res, k, "k", { min: 1, max: 5, defaultValue: 3 });
  if (lookCount == null) return;

  const data = await stylistService.buildOutfit({
    sessionId: req.sessionId,
    prompt,
    gender: gender || null,
    occasion: occasion || null,
    style: style || null,
    budgetMax: budgetMax ? Number(budgetMax) : null,
    k: lookCount,
  });

  ok(res, data);
});

module.exports = {
  buildOutfit,
};
