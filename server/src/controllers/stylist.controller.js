const stylistService = require("../services/stylist.service");

exports.buildOutfit = async (req, res, next) => {
  try {
    const { prompt, gender, occasion, style, budgetMax, k } = req.body;

    if (!prompt) return res.status(400).json({ success: false, error: "prompt is required" });

    const data = await stylistService.buildOutfit({
      sessionId: req.sessionId,
      prompt,
      gender: gender || null,
      occasion: occasion || null,
      style: style || null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      k: k ? Number(k) : 3,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
