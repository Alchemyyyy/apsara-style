const productRepo = require("../repositories/product.repository");
const { cosine } = require("../utils/similarity");

const VALID_GENDERS = ["men", "women", "unisex"];

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function normalizeGender(value) {
  const safe = String(value || "").trim().toLowerCase();
  if (!safe) return "";
  if (!VALID_GENDERS.includes(safe)) throw new Error("gender must be one of men|women|unisex");
  return safe;
}

function isTruthyFlag(value) {
  const v = String(value || "").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(v);
}

const list = async (q) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 12), 48);
  const offset = (page - 1) * limit;

  const filters = [];
  const params = [];
  let i = 1;

  filters.push(`p.is_active = true`);
  filters.push(`(c.id IS NULL OR c.is_active = true)`);

  if (q.gender) {
    params.push(normalizeGender(q.gender));
    filters.push(`p.gender = $${i++}`);
  }

  if (q.category) {
    params.push(String(q.category).trim().toLowerCase());
    filters.push(`c.slug = $${i++}`);
  }

  if (q.minPrice) {
    params.push(Number(q.minPrice));
    filters.push(`p.base_price >= $${i++}`);
  }

  if (q.maxPrice) {
    params.push(Number(q.maxPrice));
    filters.push(`p.base_price <= $${i++}`);
  }

  if (isTruthyFlag(q.discount)) {
    filters.push(`p.discount_price IS NOT NULL`);
    filters.push(`p.discount_price > 0`);
    filters.push(`p.discount_price < p.base_price`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sortMap = {
    recommend:
      `
      CASE
        WHEN p.discount_price IS NOT NULL
          AND p.discount_price > 0
          AND p.discount_price < p.base_price THEN 0
        ELSE 1
      END ASC,
      p.created_at DESC
      `,
    newest: "p.created_at DESC",
    price_asc: "COALESCE(p.discount_price, p.base_price) ASC, p.created_at DESC",
    price_desc: "COALESCE(p.discount_price, p.base_price) DESC, p.created_at DESC",
    discount_desc:
      `
      CASE
        WHEN p.discount_price IS NOT NULL
          AND p.discount_price > 0
          AND p.discount_price < p.base_price
        THEN (p.base_price - p.discount_price) / NULLIF(p.base_price, 0)
        ELSE 0
      END DESC,
      p.created_at DESC
      `,
    discount_asc:
      `
      CASE
        WHEN p.discount_price IS NOT NULL
          AND p.discount_price > 0
          AND p.discount_price < p.base_price
        THEN (p.base_price - p.discount_price) / NULLIF(p.base_price, 0)
        ELSE 0
      END ASC,
      p.created_at DESC
      `,
  };
  const orderBy = sortMap[q.sort] || sortMap.recommend;

  const total = await productRepo.countForList({ where, params });
  const items = await productRepo.listForCatalog({
    where,
    orderBy,
    params,
    limit,
    offset,
  });

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

const detail = async (id) => {
  const product = await productRepo.findProductDetail(id);
  if (!product) return null;

  const images = await productRepo.findProductImages(id);
  const variants = await productRepo.findProductVariants(id);

  return {
    ...product,
    images,
    variants,
  };
};

const similar = async (productId, q) => {
  const limit = Math.min(Number(q.limit || 8), 24);
  const src = await productRepo.findEmbeddingVector(productId);
  if (!src) return [];

  const candidates = await productRepo.listEmbeddingCandidates(productId);
  const scored = candidates.map((r) => ({
    ...r,
    _score: cosine(src.vector, r.vector || []),
  }));

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, limit).map(({ vector, _score, ...safe }) => safe);
};

const meta = async () => {
  const categories = await productRepo.listCatalogMeta();
  return {
    genders: VALID_GENDERS,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sort_order: c.sort_order,
      counts: {
        women: Number(c.women_count || 0),
        men: Number(c.men_count || 0),
        unisex: Number(c.unisex_count || 0),
        total: Number(c.total_count || 0),
      },
    })),
  };
};

module.exports = {
  list,
  detail,
  similar,
  meta,
};
