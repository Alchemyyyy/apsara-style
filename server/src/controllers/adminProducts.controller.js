const adminProductsService = require("../services/adminProducts.service");
const adminAuditRepo = require("../repositories/adminAudit.repository");

async function auditSafe(payload) {
  try {
    await adminAuditRepo.insertAuditLog(payload);
  } catch {
    // Do not fail primary business action if audit logging fails.
  }
}

const list = async (req, res, next) => {
  try {
    const data = await adminProductsService.list(req.query);
    res.json({ success: true, data: data.items, meta: data.meta });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await adminProductsService.create(req.body);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "product.create",
      entityType: "product",
      entityId: data?.id || null,
      meta: { slug: data?.slug || null, gender: data?.gender || null },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await adminProductsService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await adminProductsService.update(req.params.id, req.body);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "product.update",
      entityType: "product",
      entityId: data?.id || req.params.id,
      meta: { fields: Object.keys(req.body || {}) },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await adminProductsService.remove(req.params.id);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "product.deactivate",
      entityType: "product",
      entityId: req.params.id,
      meta: {},
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  try {
    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ success: false, error: "stock must be an integer >= 0" });
    }
    const data = await adminProductsService.updateStock(req.params.id, stock);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "variant.stock.update",
      entityType: "variant",
      entityId: req.params.id,
      meta: { stock },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const data = await adminProductsService.listCategories(req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const data = await adminProductsService.getCategoryById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const data = await adminProductsService.createCategory(req.body);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "category.create",
      entityType: "category",
      entityId: data?.id || null,
      meta: { slug: data?.slug || null },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const data = await adminProductsService.updateCategory(req.params.id, req.body);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "category.update",
      entityType: "category",
      entityId: req.params.id,
      meta: { fields: Object.keys(req.body || {}) },
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const removeCategory = async (req, res, next) => {
  try {
    await adminProductsService.removeCategory(req.params.id);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "category.deactivate",
      entityType: "category",
      entityId: req.params.id,
      meta: {},
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  removeCategory,
  updateStock,
};
