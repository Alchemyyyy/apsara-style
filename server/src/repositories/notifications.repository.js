const db = require('../db')

function withRunner(client) {
  return client || db
}

function buildSessionWhere({ sessionId, type = null, isRead = null, dateFrom = null, dateTo = null }) {
  const params = [sessionId]
  const where = ['session_id = $1']

  if (type) {
    params.push(type)
    where.push(`type = $${params.length}`)
  }
  if (typeof isRead === 'boolean') {
    params.push(isRead)
    where.push(`is_read = $${params.length}`)
  }
  if (dateFrom) {
    params.push(dateFrom)
    where.push(`created_at >= $${params.length}::timestamptz`)
  }
  if (dateTo) {
    params.push(dateTo)
    where.push(`created_at < $${params.length}::timestamptz`)
  }

  return { whereSql: where.join(' AND '), params }
}

async function createNotification({ userId = null, sessionId = null, type, title, message, meta = {} }, client) {
  const runner = withRunner(client)
  const res = await runner.query(
    `
    INSERT INTO notifications (user_id, session_id, type, title, message, meta)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING id, user_id, session_id, type, title, message, meta, is_read, read_at, created_at
    `,
    [userId || null, sessionId || null, type, title, message, meta || {}]
  )
  return res.rows[0] || null
}

async function listBySession({ sessionId, limit = 20, offset = 0, type = null, isRead = null, dateFrom = null, dateTo = null }, client) {
  const runner = withRunner(client)
  const { whereSql, params } = buildSessionWhere({ sessionId, type, isRead, dateFrom, dateTo })
  const pageParams = [...params, limit, offset]
  const limitPos = pageParams.length - 1
  const offsetPos = pageParams.length
  const res = await runner.query(
    `
    SELECT id, user_id, session_id, type, title, message, meta, is_read, read_at, created_at
    FROM notifications
    WHERE ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    pageParams
  )
  return res.rows
}

async function countBySession({ sessionId, type = null, isRead = null, dateFrom = null, dateTo = null }, client) {
  const runner = withRunner(client)
  const { whereSql, params } = buildSessionWhere({ sessionId, type, isRead, dateFrom, dateTo })
  const res = await runner.query(
    `SELECT COUNT(*)::int AS total FROM notifications WHERE ${whereSql}`,
    params
  )
  return Number(res.rows[0]?.total || 0)
}

async function countUnreadBySession(sessionId, client) {
  const runner = withRunner(client)
  const res = await runner.query(
    `SELECT COUNT(*)::int AS total FROM notifications WHERE session_id = $1 AND is_read = false`,
    [sessionId]
  )
  return Number(res.rows[0]?.total || 0)
}

async function markReadByIdAndSession({ id, sessionId }, client) {
  const runner = withRunner(client)
  const res = await runner.query(
    `
    UPDATE notifications
    SET is_read = true,
        read_at = COALESCE(read_at, now())
    WHERE id = $1 AND session_id = $2
    RETURNING id, user_id, session_id, type, title, message, meta, is_read, read_at, created_at
    `,
    [id, sessionId]
  )
  return res.rows[0] || null
}

async function markAllReadBySession(sessionId, client) {
  const runner = withRunner(client)
  const res = await runner.query(
    `
    UPDATE notifications
    SET is_read = true,
        read_at = COALESCE(read_at, now())
    WHERE session_id = $1 AND is_read = false
    RETURNING id
    `,
    [sessionId]
  )
  return res.rowCount
}

async function clearOlderThanBySession({ sessionId, olderThanDays }, client) {
  const runner = withRunner(client)
  const res = await runner.query(
    `
    DELETE FROM notifications
    WHERE session_id = $1
      AND created_at < now() - ($2::int * interval '1 day')
    RETURNING id
    `,
    [sessionId, olderThanDays]
  )
  return res.rowCount
}

module.exports = {
  createNotification,
  listBySession,
  countBySession,
  countUnreadBySession,
  markReadByIdAndSession,
  markAllReadBySession,
  clearOlderThanBySession,
}
