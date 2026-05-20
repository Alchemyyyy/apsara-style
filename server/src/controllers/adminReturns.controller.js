const adminReturnsService = require("../services/adminReturns.service");
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
    const data = await adminReturnsService.list(req.query);
    res.json({
      success: true,
      data: data.items,
      meta: data.meta,
      statuses: adminReturnsService.RETURN_STATUSES,
      transitions: adminReturnsService.RETURN_TRANSITIONS,
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await adminReturnsService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
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
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  updateStatus,
};
