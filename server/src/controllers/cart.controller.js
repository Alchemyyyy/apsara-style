const cartService = require("../services/cart.service");

exports.getCart = async (req, res, next) => {
  try {
    const data = await cartService.getOrCreateCart({ sessionId: req.sessionId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.addItem = async (req, res, next) => {
  try {
    const { variantId, qty } = req.body;
    if (!variantId) return res.status(400).json({ success: false, error: "variantId is required" });

    const data = await cartService.addItem({
      sessionId: req.sessionId,
      variantId,
      qty: Number(qty) || 1,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const itemId = req.params.itemId;

    const data = await cartService.updateItem({
      sessionId: req.sessionId,
      itemId,
      qty: Number(qty),
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.removeItem = async (req, res, next) => {
  try {
    const itemId = req.params.itemId;

    const data = await cartService.removeItem({
      sessionId: req.sessionId,
      itemId,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
