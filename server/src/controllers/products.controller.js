const productService = require("../services/product.service");

const list = async (req, res, next) => {
  try {
    const data = await productService.list(req.query);
    res.json({ success: true, data: data.items, meta: data.meta });
  } catch (err) {
    next(err);
  }
};

const meta = async (req, res, next) => {
  try {
    const data = await productService.meta();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const data = await productService.detail(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: "Product not found" });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const similar = async (req, res, next) => {
  try {
    const data = await productService.similar(req.params.id, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  meta,
  detail,
  similar,
};
