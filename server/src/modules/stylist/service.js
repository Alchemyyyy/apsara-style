const { cosine } = require("../../utils/similarity");
const { embedQueryPython } = require("../../services/embedQuery.service");
const { appError } = require("../../shared/errors");
const stylistRepo = require("./repository");

const PUBLIC_GENDERS = ["women", "men"];

const RULES = {
  women: {
    top: ["tops", "activewear", "women-tops"],
    bottom: ["pants", "skirts", "jeans", "activewear", "women-pants", "women-skirts"],
    shoes: ["shoes", "women-shoes"],
    outerwear: ["outerwear", "blazers", "women-outerwear", "women-blazers"],
    dress: ["dresses", "women-dresses"],
  },
  men: {
    top: ["shirts", "t-shirts", "tops", "activewear", "men-shirts", "men-t-shirts"],
    bottom: ["pants", "jeans", "activewear", "men-pants", "men-jeans"],
    shoes: ["shoes", "men-shoes"],
    outerwear: ["outerwear", "blazers", "men-outerwear", "men-blazers"],
  },
};

function normalizePrompt(prompt) {
  const text = String(prompt || "").trim();
  if (text.length < 3) throw appError("prompt must be at least 3 characters", 400);
  if (text.length > 500) throw appError("prompt must be <= 500 characters", 400);
  return text;
}

function normalizeGender(gender) {
  const safe = String(gender || "women").trim().toLowerCase();
  if (!PUBLIC_GENDERS.includes(safe)) throw appError("gender must be one of women|men", 400);
  return safe;
}

function normalizeBudgetMax(value) {
  if (value == null || value === "") return null;
  const budget = Number(value);
  if (!Number.isFinite(budget)) throw appError("budgetMax must be a number", 400);
  if (budget < 0) throw appError("budgetMax must be >= 0", 400);
  return budget;
}

function pickBest(scored, excludeIds, limit = 1) {
  const out = [];
  for (const p of scored) {
    if (excludeIds.has(p.id)) continue;
    out.push(p);
    excludeIds.add(p.id);
    if (out.length >= limit) break;
  }
  return out;
}

function tagMatchBoost(product, { occasion, style }) {
  let boost = 0;
  const tags = product.tags || {};
  const hasTag = (key, value) => {
    if (!value || !Array.isArray(tags[key])) return false;
    const wanted = String(value).trim().toLowerCase();
    return tags[key].some((tag) => String(tag).trim().toLowerCase() === wanted);
  };

  if (hasTag("occasion", occasion)) boost += 0.08;
  if (hasTag("style", style)) boost += 0.08;

  return boost;
}

const buildOutfit = async ({ sessionId, prompt, gender, occasion, style, budgetMax, k }) => {
  const promptText = normalizePrompt(prompt);
  const g = normalizeGender(gender);
  const maxBudget = normalizeBudgetMax(budgetMax);
  const K = Math.max(1, Math.min(Number(k || 3), 5)); // 1..5 variations
  const qVec = await embedQueryPython(promptText);

  let budgetRelaxed = false;
  let candidates = await stylistRepo.loadCandidates({ gender: g, budgetMax: maxBudget });

  if (!candidates.length && maxBudget != null) {
    candidates = await stylistRepo.loadCandidates({ gender: g, budgetMax: null });
    budgetRelaxed = true;
  }

  if (!candidates.length) {
    throw appError("No active products are available for this audience", 404);
  }

  // Score candidates with semantic similarity + tag boost
  const scoredAll = candidates
    .map((p) => {
      const sem = cosine(qVec, p.vector || []);
      const boost = tagMatchBoost(p, { occasion, style });
      return { ...p, _score: sem + boost };
    })
    .sort((a, b) => b._score - a._score);

  const rules = RULES[g] || RULES.women;

  const wantsDress =
    g === "women" &&
    (promptText.toLowerCase().includes("dress") ||
      (occasion && ["evening", "party", "wedding"].includes(occasion)));

  const clean = (p) => {
    if (!p) return null;
    const { vector, _score, ...safe } = p;
    return safe;
  };

  const pickFromCategoriesWithOffset = (allowedSlugs, excludeIds, offset, count = 1) => {
    const filtered = scoredAll.filter((p) => allowedSlugs.includes(p.category_slug) && !excludeIds.has(p.id));
    // offset shifts the "starting point" to make variations different
    const shifted = filtered.slice(offset).concat(filtered.slice(0, offset));
    return pickBest(shifted, excludeIds, count);
  };

  function buildOneVariation(variationIndex) {
    const exclude = new Set();

    // diversity: increasing offset each variation
    const baseOffset = variationIndex * 6;

    const outfit = { top: null, bottom: null, shoes: null, outerwear: null, dress: null };

    if (wantsDress) {
      outfit.dress = pickFromCategoriesWithOffset(rules.dress || [], exclude, baseOffset, 1)[0] || null;
      outfit.shoes = pickFromCategoriesWithOffset(rules.shoes || [], exclude, baseOffset + 2, 1)[0] || null;
      outfit.outerwear = pickFromCategoriesWithOffset(rules.outerwear || [], exclude, baseOffset + 4, 1)[0] || null;
    } else {
      outfit.top = pickFromCategoriesWithOffset(rules.top || [], exclude, baseOffset, 1)[0] || null;
      outfit.bottom = pickFromCategoriesWithOffset(rules.bottom || [], exclude, baseOffset + 2, 1)[0] || null;
      outfit.shoes = pickFromCategoriesWithOffset(rules.shoes || [], exclude, baseOffset + 4, 1)[0] || null;
      outfit.outerwear = pickFromCategoriesWithOffset(rules.outerwear || [], exclude, baseOffset + 6, 1)[0] || null;
    }

    const cleanOutfit = {
      dress: clean(outfit.dress),
      top: clean(outfit.top),
      bottom: clean(outfit.bottom),
      shoes: clean(outfit.shoes),
      outerwear: clean(outfit.outerwear),
    };

    const requiredSlots = cleanOutfit.dress ? ["dress", "shoes"] : ["top", "bottom", "shoes"];
    const missingSlots = requiredSlots.filter((slot) => !cleanOutfit[slot]);
    const items = Object.values(cleanOutfit).filter(Boolean);
    const estimatedTotal = items.reduce((sum, item) => {
      const price = Number(item.discount_price || item.base_price || 0);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);

    return {
      label: `Look ${variationIndex + 1}`,
      outfit: cleanOutfit,
      estimatedTotal: Number(estimatedTotal.toFixed(2)),
      missingSlots,
      isComplete: missingSlots.length === 0,
    };
  }

  const looks = [];
  for (let i = 0; i < K; i++) looks.push(buildOneVariation(i));

  // Track stylist_request event
  await stylistRepo.createStylistRequestEvent({
    sessionId,
    prompt: promptText,
    meta: { gender: g, occasion, style, budgetMax: maxBudget, budgetRelaxed, k: K },
  });

  return {
    prompt: promptText,
    gender: g,
    occasion,
    style,
    budgetMax: maxBudget,
    budgetRelaxed,
    candidateCount: candidates.length,
    looks,
  };
};

module.exports = {
  buildOutfit,
};
