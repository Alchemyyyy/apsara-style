const { noContentOk, ok, okList } = require("../../shared/responses");
const { asyncHandler } = require("../../shared/errors");
const adminProductsService = require("./service");
const adminAuditRepo = require("../adminAudit/repository");
const { parseInteger } = require("../../shared/validation");

async function auditSafe(payload) {
  try {
    await adminAuditRepo.insertAuditLog(payload);
  } catch {
    // Do not fail primary business action if audit logging fails.
  }
}

const list = asyncHandler(async (req, res) => {
  const data = await adminProductsService.list(req.query);
  okList(res, data);
});

const create = asyncHandler(async (req, res) => {
  const data = await adminProductsService.create(req.body);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "product.create",
    entityType: "product",
    entityId: data?.id || null,
    meta: { slug: data?.slug || null, gender: data?.gender || null },
  });
  ok(res, data);
});

const getById = asyncHandler(async (req, res) => {
  const data = await adminProductsService.getById(req.params.id);
  ok(res, data);
});

const update = asyncHandler(async (req, res) => {
  const data = await adminProductsService.update(req.params.id, req.body);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "product.update",
    entityType: "product",
    entityId: data?.id || req.params.id,
    meta: { fields: Object.keys(req.body || {}) },
  });
  ok(res, data);
});

const remove = asyncHandler(async (req, res) => {
  await adminProductsService.remove(req.params.id);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "product.deactivate",
    entityType: "product",
    entityId: req.params.id,
    meta: {},
  });
  noContentOk(res);
});

const updateStock = asyncHandler(async (req, res) => {
  const stock = parseInteger(res, req.body.stock, "stock", { min: 0 });
  if (stock == null) return;
  const data = await adminProductsService.updateStock(req.params.id, stock);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "variant.stock.update",
    entityType: "variant",
    entityId: req.params.id,
    meta: { stock },
  });
  ok(res, data);
});

const listCategories = asyncHandler(async (req, res) => {
  const data = await adminProductsService.listCategories(req.query);
  ok(res, data);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const data = await adminProductsService.getCategoryById(req.params.id);
  ok(res, data);
});

const createCategory = asyncHandler(async (req, res) => {
  const data = await adminProductsService.createCategory(req.body);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "category.create",
    entityType: "category",
    entityId: data?.id || null,
    meta: { slug: data?.slug || null },
  });
  ok(res, data);
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await adminProductsService.updateCategory(req.params.id, req.body);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "category.update",
    entityType: "category",
    entityId: req.params.id,
    meta: { fields: Object.keys(req.body || {}) },
  });
  ok(res, data);
});

const removeCategory = asyncHandler(async (req, res) => {
  await adminProductsService.removeCategory(req.params.id);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "category.deactivate",
    entityType: "category",
    entityId: req.params.id,
    meta: {},
  });
  noContentOk(res);
});

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
