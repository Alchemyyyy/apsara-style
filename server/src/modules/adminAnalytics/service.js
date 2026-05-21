const analyticsRepo = require("./repository");

function clampDays(days) {
  const d = Number(days);
  if (!Number.isFinite(d)) return 7;
  return Math.max(1, Math.min(Math.floor(d), 90));
}

function clampLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return 10;
  return Math.max(1, Math.min(Math.floor(n), 50));
}

async function overview({ days }) {
  const d = clampDays(days);

  const summary = await analyticsRepo.fetchSummary(d);
  const daily = await analyticsRepo.fetchDaily(d);
  const orderStatus = await analyticsRepo.fetchOrderStatusTotals(d);
  const orderStatusDaily = await analyticsRepo.fetchOrderStatusDaily(d);

  const funnel = {
    pending: 0,
    paid: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
    deliveryRate: 0,
    cancelRate: 0,
  };

  for (const row of orderStatus) {
    const k = String(row.status || "").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(funnel, k)) {
      funnel[k] = Number(row.count || 0);
    }
  }
  funnel.total = funnel.pending + funnel.paid + funnel.packed + funnel.shipped + funnel.delivered + funnel.cancelled;
  if (funnel.total > 0) {
    funnel.deliveryRate = Number(((funnel.delivered / funnel.total) * 100).toFixed(1));
    funnel.cancelRate = Number(((funnel.cancelled / funnel.total) * 100).toFixed(1));
  }

  return {
    days: d,
    summary,
    daily,
    orderFunnel: funnel,
    orderStatusDaily,
  };
}

async function topProducts({ days, limit }) {
  const d = clampDays(days);
  const take = clampLimit(limit);

  const rows = await analyticsRepo.fetchTopProductScores({ days: d, limit: take });

  // attach product info
  const ids = rows.map((r) => r.product_id);
  if (!ids.length) return [];

  const products = await analyticsRepo.fetchProductsByIds(ids);

  const map = new Map(products.map((p) => [p.id, p]));
  return rows.map((r) => ({ ...map.get(r.product_id), score: r.score })).filter(Boolean);
}

async function topSearches({ days, limit }) {
  const d = clampDays(days);
  const take = clampLimit(limit);

  return analyticsRepo.fetchTopSearches({ days: d, limit: take });
}

module.exports = {
  overview,
  topProducts,
  topSearches,
};
