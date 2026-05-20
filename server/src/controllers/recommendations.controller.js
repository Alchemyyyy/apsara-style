const recService = require("../services/recommendations.service");

const personalized = async (req, res, next) => {
  try {
    const data = await recService.personalized({ sessionId: req.sessionId, limit: req.query.limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const trending = async (req, res, next) => {
  try {
    const data = await recService.trending({ limit: req.query.limit });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  personalized,
  trending,
};
