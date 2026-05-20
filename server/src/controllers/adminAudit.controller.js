const adminAuditService = require("../services/adminAudit.service");

const list = async (req, res, next) => {
  try {
    const data = await adminAuditService.list(req.query);
    res.json({ success: true, data: data.items, meta: data.meta });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
};

