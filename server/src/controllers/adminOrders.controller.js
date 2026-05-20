const adminOrdersService = require("../services/adminOrders.service");
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
    const data = await adminOrdersService.list(req.query);
    res.json({
      success: true,
      data: data.items,
      meta: data.meta,
      statuses: adminOrdersService.ORDER_STATUSES,
      transitions: adminOrdersService.ORDER_TRANSITIONS,
    });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await adminOrdersService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await adminOrdersService.updateStatus(req.params.id, req.body?.status);
    await auditSafe({
      actorAdminId: req.admin?.id || null,
      action: "order.status.update",
      entityType: "order",
      entityId: req.params.id,
      meta: { status: data?.status || req.body?.status || null },
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
