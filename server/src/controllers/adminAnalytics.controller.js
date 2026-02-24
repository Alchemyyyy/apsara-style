const analyticsService = require("../services/adminAnalytics.service");

exports.overview = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const data = await analyticsService.overview({ days });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.topProducts = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const limit = Number(req.query.limit || 10);
    const data = await analyticsService.topProducts({ days, limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.topSearches = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const limit = Number(req.query.limit || 10);
    const data = await analyticsService.topSearches({ days, limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};