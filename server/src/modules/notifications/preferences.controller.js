const { noContentOk, ok, okList } = require("../../shared/responses");
const notificationPreferencesService = require("./preferences.service");

const getMyPreferences = async (req, res, next) => {
  try {
    const data = await notificationPreferencesService.getByUserId(req.user?.id);
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

const updateMyPreferences = async (req, res, next) => {
  try {
    const data = await notificationPreferencesService.updateByUserId(req.user?.id, req.body || {});
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyPreferences,
  updateMyPreferences,
};
