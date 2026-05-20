const eventsService = require("../services/events.service");

const create = async (req, res, next) => {
  try {
    const { type, productId, query, meta } = req.body;

    if (!type) return res.status(400).json({ success: false, error: "type is required" });

    const event = await eventsService.create({
      sessionId: req.sessionId,
      type,
      productId: productId || null,
      query: query || null,
      meta: meta || {},
    });

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
};
