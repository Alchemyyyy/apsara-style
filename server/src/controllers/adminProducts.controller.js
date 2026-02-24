const adminProductsService = require("../services/adminProducts.service");

exports.list = async (req, res, next) => {
  try {
    const data = await adminProductsService.list(req.query);
    res.json({ success: true, data: data.items, meta: data.meta });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await adminProductsService.create(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await adminProductsService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await adminProductsService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const stock = Number(req.body.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      return res.status(400).json({ success: false, error: "stock must be >= 0" });
    }
    const data = await adminProductsService.updateStock(req.params.id, stock);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
