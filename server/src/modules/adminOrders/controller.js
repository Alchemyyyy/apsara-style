const { ok, okList } = require("../../shared/responses");
const adminOrdersService = require("./service");
const adminAuditRepo = require("../adminAudit/repository");
const { asyncHandler } = require("../../shared/errors");

async function auditSafe(payload) {
  try {
    await adminAuditRepo.insertAuditLog(payload);
  } catch {
    // Do not fail primary business action if audit logging fails.
  }
}

const list = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.list(req.query);
  okList(res, data, {
    statuses: adminOrdersService.ORDER_STATUSES,
    transitions: adminOrdersService.ORDER_TRANSITIONS,
  });
});

const getById = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.getById(req.params.id);
  ok(res, data);
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await adminOrdersService.updateStatus(req.params.id, req.body?.status);
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "order.status.update",
    entityType: "order",
    entityId: req.params.id,
    meta: { status: data?.status || req.body?.status || null },
  });
  ok(res, data);
});

module.exports = {
  list,
  getById,
  updateStatus,
};
