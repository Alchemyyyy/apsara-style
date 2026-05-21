const db = require("../../db");

async function insertAuditLog({ actorAdminId = null, action, entityType, entityId = null, meta = {} }, client) {
  const runner = client || db;
  await runner.query(
    `
    INSERT INTO admin_audit_logs (actor_admin_id, action, entity_type, entity_id, meta)
    VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [actorAdminId, action, entityType, entityId, JSON.stringify(meta || {})]
  );
}

async function countAuditLogs({ whereSql = "", params = [] } = {}, client) {
  const runner = client || db;
  const res = await runner.query(
    `
    SELECT COUNT(*)::int AS total
    FROM admin_audit_logs l
    LEFT JOIN admin_users au ON au.id = l.actor_admin_id
    ${whereSql}
    `,
    params
  );
  return Number(res.rows[0]?.total || 0);
}

async function listAuditLogs({ whereSql = "", params = [], limit = 20, offset = 0, orderBy = "l.created_at DESC, l.id DESC" } = {}, client) {
  const runner = client || db;
  const withPage = [...params, limit, offset];
  const limitPos = withPage.length - 1;
  const offsetPos = withPage.length;
  const res = await runner.query(
    `
    SELECT
      l.id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.meta,
      l.created_at,
      l.actor_admin_id,
      au.full_name AS actor_name,
      au.email AS actor_email
    FROM admin_audit_logs l
    LEFT JOIN admin_users au ON au.id = l.actor_admin_id
    ${whereSql}
    ORDER BY ${orderBy}
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    withPage
  );
  return res.rows;
}

module.exports = {
  insertAuditLog,
  countAuditLogs,
  listAuditLogs,
};
