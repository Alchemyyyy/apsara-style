const searchService = require("../services/search.service");

const search = async (req, res, next) => {
  try {
    const data = await searchService.search(req.query);
    res.json({ success: true, data: data.items, meta: data.meta });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  search,
};
