const notificationPreferencesService = require("../services/notificationPreferences.service");

const getMyPreferences = async (req, res, next) => {
  try {
    const data = await notificationPreferencesService.getByUserId(req.user?.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateMyPreferences = async (req, res, next) => {
  try {
    const data = await notificationPreferencesService.updateByUserId(req.user?.id, req.body || {});
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPreferences,
  updateMyPreferences,
};

