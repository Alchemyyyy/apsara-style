const cartService = require("../services/cart.service");

const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getOrCreateCart({ sessionId: req.sessionId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { variantId, qty } = req.body;
    if (!variantId) return res.status(400).json({ success: false, error: "variantId is required" });
    const parsedQty = qty == null ? 1 : Number(qty);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ success: false, error: "qty must be a positive integer" });
    }

    const data = await cartService.addItem({
      sessionId: req.sessionId,
      variantId,
      qty: parsedQty,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const itemId = req.params.itemId;
    const parsedQty = Number(qty);
    if (!Number.isInteger(parsedQty)) {
      return res.status(400).json({ success: false, error: "qty must be an integer" });
    }
    if (parsedQty < 0) {
      return res.status(400).json({ success: false, error: "qty must be >= 0" });
    }

    const data = await cartService.updateItem({
      sessionId: req.sessionId,
      itemId,
      qty: parsedQty,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const removeItem = async (req, res, next) => {
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

const refreshReservations = async (req, res, next) => {
  try {
    const data = await cartService.refreshReservations({
      sessionId: req.sessionId,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const adjustToAvailable = async (req, res, next) => {
  try {
    const data = await cartService.adjustToAvailable({
      sessionId: req.sessionId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const claimCart = async (req, res, next) => {
  try {
    const data = await cartService.claimSessionCart({
      sessionId: req.sessionId,
      userId: req.user?.id,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  refreshReservations,
  adjustToAvailable,
  claimCart,
};
