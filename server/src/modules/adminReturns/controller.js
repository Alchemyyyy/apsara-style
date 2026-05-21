const { ok, okList } = require("../../shared/responses");
const adminReturnsService = require("./service");
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
  const data = await adminReturnsService.list(req.query);
  okList(res, data, {
    statuses: adminReturnsService.RETURN_STATUSES,
    transitions: adminReturnsService.RETURN_TRANSITIONS,
  });
});

const getById = asyncHandler(async (req, res) => {
  const data = await adminReturnsService.getById(req.params.id);
  ok(res, data);
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await adminReturnsService.updateStatus(
    req.params.id,
    req.body?.status,
    req.body?.note
  );
  await auditSafe({
    actorAdminId: req.admin?.id || null,
    action: "return.status.update",
    entityType: "order_return_request",
    entityId: req.params.id,
    meta: { status: data?.status || req.body?.status || null, note: req.body?.note || null },
  });
  ok(res, data);
});

module.exports = {
  list,
  getById,
  updateStatus,
};
