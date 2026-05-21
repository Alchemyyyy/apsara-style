const eventsRepo = require("./repository");

const create = async ({ sessionId, type, productId, query, meta }) => {
  return eventsRepo.createEvent({ sessionId, type, productId, query, meta });
};

module.exports = {
  create,
};
