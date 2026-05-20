const adminAuditRepo = require("../repositories/adminAudit.repository");

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function parseDateOrNull(v) {
  const raw = String(v || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

function resolveSort(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "created_at_asc") return "l.created_at ASC, l.id ASC";
  return "l.created_at DESC, l.id DESC";
}

const list = async (q = {}) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 20), 100);
  const offset = (page - 1) * limit;
  const orderBy = resolveSort(q.sort);

  const params = [];
  const filters = [];
  let i = 1;

  if (q.action) {
    params.push(String(q.action).trim());
    filters.push(`l.action = $${i++}`);
  }

  if (q.entity_type) {
    params.push(String(q.entity_type).trim());
    filters.push(`l.entity_type = $${i++}`);
  }

  if (q.actor_admin_id) {
    params.push(String(q.actor_admin_id).trim());
    filters.push(`l.actor_admin_id = $${i++}`);
  }

  if (q.entity_id) {
    params.push(String(q.entity_id).trim());
    filters.push(`COALESCE(l.entity_id, '') = $${i++}`);
  }

  const fromDate = parseDateOrNull(q.from);
  if (fromDate) {
    params.push(fromDate.toISOString());
    filters.push(`l.created_at >= $${i++}::timestamptz`);
  }

  const toDate = parseDateOrNull(q.to);
  if (toDate) {
    params.push(toDate.toISOString());
    filters.push(`l.created_at <= $${i++}::timestamptz`);
  }

  if (q.q) {
    const needle = `%${String(q.q).trim()}%`;
    params.push(needle);
    filters.push(`(
      l.action ILIKE $${i}
      OR l.entity_type ILIKE $${i}
      OR COALESCE(l.entity_id, '') ILIKE $${i}
      OR COALESCE(au.full_name, '') ILIKE $${i}
      OR COALESCE(au.email, '') ILIKE $${i}
    )`);
    i += 1;
  }

  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const total = await adminAuditRepo.countAuditLogs({ whereSql, params });
  const items = await adminAuditRepo.listAuditLogs({ whereSql, params, limit, offset, orderBy });

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      sort: String(q.sort || "created_at_desc"),
    },
  };
};

module.exports = {
  list,
};
