const { cosine } = require("../utils/similarity");
const recommendationsRepo = require("../repositories/recommendations.repository");

function toLimit(v, def = 8) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(1, Math.min(Math.floor(n), 24));
}

async function productCardsByIds(ids) {
  if (!ids.length) return [];
  const rows = await recommendationsRepo.findProductCardsByIds(ids);

  // Preserve original order
  const map = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

const personalized = async ({ sessionId, limit }) => {
  const take = toLimit(limit, 8);

  // 1) Get recent "interest" events for this session
  // Use view_product and add_to_cart as signals
  const events = await recommendationsRepo.findRecentInterestEvents({ sessionId, limit: 30 });

  // If no history, fallback to trending
  if (events.length === 0) {
    return trending({ limit: take });
  }

  // 2) Build a small set of "seed" products (unique)
  const seedIds = [];
  const seen = new Set();
  for (const e of events) {
    if (!seen.has(e.product_id)) {
      seedIds.push(e.product_id);
      seen.add(e.product_id);
    }
    if (seedIds.length >= 6) break;
  }

  // 3) Get seed vectors
  const seedVectors = await recommendationsRepo.findVectorsByProductIds(seedIds);

  if (seedVectors.length === 0) {
    return trending({ limit: take });
  }

  // 4) Load candidate pool (all products + vectors)
  const candidates = await recommendationsRepo.listAllActiveVectors();

  // Avoid recommending items already seen in session
  const blocked = new Set(seedIds);

  // 5) Score candidates by best similarity to any seed
  const scored = [];
  for (const c of candidates) {
    if (blocked.has(c.id)) continue;

    let best = -1;
    for (const s of seedVectors) {
      const sim = cosine(s.vector, c.vector || []);
      if (sim > best) best = sim;
    }

    scored.push({ id: c.id, score: best });
  }

  scored.sort((a, b) => b.score - a.score);

  const topIds = scored.slice(0, take).map((x) => x.id);
  return await productCardsByIds(topIds);
};

const trending = async ({ limit }) => {
  const take = toLimit(limit, 8);

  // Weighted popularity: add_to_cart counts more than view_product; purchase counts most
  const rows = await recommendationsRepo.findTrendingScores(take);
  const ids = rows.map((r) => r.product_id);

  // If no events exist (rare because you seeded 10k), fallback to newest products
  if (ids.length === 0) {
    const newestIds = await recommendationsRepo.findNewestProductIds(take);
    return await productCardsByIds(newestIds);
  }

  return await productCardsByIds(ids);
};

module.exports = {
  personalized,
  trending,
};
