const wishlistService = require("../services/wishlist.service");

const list = async (req, res, next) => {
  try {
    const data = await wishlistService.list(req.sessionId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const add = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const data = await wishlistService.add(req.sessionId, productId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await wishlistService.remove(req.sessionId, req.params.productId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  add,
  remove,
};
