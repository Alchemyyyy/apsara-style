const analyticsService = require("../services/adminAnalytics.service");

const overview = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const data = await analyticsService.overview({ days });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const topProducts = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const limit = Number(req.query.limit || 10);
    const data = await analyticsService.topProducts({ days, limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const topSearches = async (req, res, next) => {
  try {
    const days = Number(req.query.days || 7);
    const limit = Number(req.query.limit || 10);
    const data = await analyticsService.topSearches({ days, limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  overview,
  topProducts,
  topSearches,
};
