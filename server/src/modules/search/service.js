const { cosine } = require("../../utils/similarity");
const { embedQueryPython } = require("../../services/embedQuery.service");
const searchRepo = require("./repository");
const PUBLIC_GENDERS = ["women", "men"];

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function keywordScore(q, title, tags) {
  const query = (q || "").toLowerCase().trim();
  if (!query) return 0;

  const t = (title || "").toLowerCase();
  let score = 0;

  // title match boosts
  if (t.includes(query)) score += 2;

  // partial word matches
  const words = query.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (w.length < 2) continue;
    if (t.includes(w)) score += 0.5;
  }

  // tags match boost
  const tagText = JSON.stringify(tags || {}).toLowerCase();
  for (const w of words) {
    if (w.length < 3) continue;
    if (tagText.includes(w)) score += 0.3;
  }

  return score;
}

const search = async (queryParams) => {
  const q = (queryParams.q || "").trim();
  if (!q) return { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };

  const page = toInt(queryParams.page, 1);
  const limit = Math.min(toInt(queryParams.limit, 12), 48);
  const offset = (page - 1) * limit;

  // Filters
  const gender = queryParams.gender ? String(queryParams.gender).trim().toLowerCase() : null;
  if (gender && !PUBLIC_GENDERS.includes(gender)) {
    return { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } };
  }
  const category = queryParams.category || null; // category slug (women-dresses)
  const minPrice = queryParams.minPrice ? Number(queryParams.minPrice) : null;
  const maxPrice = queryParams.maxPrice ? Number(queryParams.maxPrice) : null;

  // 1) Embed query
  const qVec = await embedQueryPython(q);

  // 2) Load candidate products (with embeddings) under filters
  const params = [];
  const filters = ["p.is_active = true", "p.gender IN ('women', 'men')"];
  let i = 1;

  if (gender) {
    params.push(gender);
    filters.push(`p.gender = $${i++}`);
  }

  if (category) {
    params.push(category);
    filters.push(`c.slug = $${i++}`);
  }

  if (minPrice != null && Number.isFinite(minPrice)) {
    params.push(minPrice);
    filters.push(`p.base_price >= $${i++}`);
  }

  if (maxPrice != null && Number.isFinite(maxPrice)) {
    params.push(maxPrice);
    filters.push(`p.base_price <= $${i++}`);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  // Pull everything then rank in Node (fine for 300 products)
  const rows = await searchRepo.listSearchCandidates({ where, params });

  const scored = rows.map((row) => {
    const vec = row.vector || [];
    const sem = cosine(qVec, vec); // ~ dot if normalized
    const key = keywordScore(q, row.title, row.tags);

    // Hybrid scoring weights
    const score = (0.75 * sem) + (0.25 * (key / 3)); // keyword normalized-ish
    return { ...row, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  const total = scored.length;
  const paged = scored.slice(offset, offset + limit).map((r) => {
    // Remove vector from response
    const { vector, _score, ...safe } = r;
    return safe;
  });

  return {
    items: paged,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  search,
};
