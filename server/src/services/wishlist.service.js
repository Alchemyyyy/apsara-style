const wishlistRepo = require("../repositories/wishlist.repository");

const list = async (sessionId) => {
  return wishlistRepo.listBySession(sessionId);
};

const add = async (sessionId, productId) => {
  await wishlistRepo.addBySession({ sessionId, productId });

  return { success: true };
};

const remove = async (sessionId, productId) => {
  await wishlistRepo.removeBySession({ sessionId, productId });
};

module.exports = {
  list,
  add,
  remove,
};
