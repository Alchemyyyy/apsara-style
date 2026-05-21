const { appError } = require("../../shared/errors");
const notificationsRepo = require("./repository");
const notificationStreamService = require("./stream.service");
const notificationPreferencesService = require("./preferences.service");
const authRepo = require("../auth/repository");

function toInt(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback
}

function normalizeType(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'all') return null
  return text.slice(0, 40)
}

function normalizeReadFilter(value) {
  const text = String(value || '').trim().toLowerCase()
  if (!text || text === 'all') return null
  if (text === 'true' || text === 'read') return true
  if (text === 'false' || text === 'unread') return false
  return null
}

function normalizeIsoDate(value) {
  const text = String(value || '').trim()
  if (!text) return null
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

async function create({ userId = null, sessionId = null, type, title, message, meta = {} }, client) {
  if (!sessionId) return null
  const safeType = String(type || 'general').trim().slice(0, 40) || 'general'
  const safeTitle = String(title || 'Notification').trim().slice(0, 120) || 'Notification'
  const safeMessage = String(message || '').trim().slice(0, 1000)
  if (!safeMessage) return null
  const userEmail = String(meta?.userEmail || meta?.email || '').trim().toLowerCase()

  let resolvedUserId = userId || null
  if (!resolvedUserId && userEmail) {
    const user = await authRepo.findUserByEmail(userEmail)
    resolvedUserId = user?.id || null
  }

  const channelCategory =
    safeType.startsWith('order_')
      ? 'order'
      : safeType.startsWith('payment_')
      ? 'payment'
      : safeType.startsWith('return_')
      ? 'return'
      : safeType.startsWith('marketing_')
      ? 'marketing'
      : 'general'

  if (resolvedUserId && channelCategory !== 'general') {
    const flags = await notificationPreferencesService.getEffectiveFlagsByUserId(resolvedUserId)
    const inAppFlag =
      channelCategory === 'order'
        ? flags.order_in_app
        : channelCategory === 'payment'
        ? flags.payment_in_app
        : channelCategory === 'return'
        ? flags.return_in_app
        : flags.marketing_in_app
    if (!inAppFlag) return null
  }

  const created = await notificationsRepo.createNotification(
    {
      userId: resolvedUserId || null,
      sessionId,
      type: safeType,
      title: safeTitle,
      message: safeMessage,
      meta: meta && typeof meta === 'object' ? meta : {},
    },
    client
  )
  if (created) {
    notificationStreamService.publish(sessionId, 'notification.created', {
      notification: created,
    })
  }
  return created
}

async function listBySession({ sessionId, page, limit, type, isRead, dateFrom, dateTo }) {
  if (!sessionId) throw appError('sessionId is required', 400)
  const pageNo = Math.max(toInt(page, 1), 1)
  const perPage = Math.min(Math.max(toInt(limit, 20), 1), 50)
  const offset = (pageNo - 1) * perPage
  const normalizedType = normalizeType(type)
  const normalizedRead = normalizeReadFilter(isRead)
  const normalizedDateFrom = normalizeIsoDate(dateFrom)
  const normalizedDateTo = normalizeIsoDate(dateTo)

  const [items, total, unread, totalAll] = await Promise.all([
    notificationsRepo.listBySession({
      sessionId,
      limit: perPage,
      offset,
      type: normalizedType,
      isRead: normalizedRead,
      dateFrom: normalizedDateFrom,
      dateTo: normalizedDateTo,
    }),
    notificationsRepo.countBySession({
      sessionId,
      type: normalizedType,
      isRead: normalizedRead,
      dateFrom: normalizedDateFrom,
      dateTo: normalizedDateTo,
    }),
    notificationsRepo.countUnreadBySession(sessionId),
    notificationsRepo.countBySession({ sessionId }),
  ])

  return {
    items,
    meta: {
      page: pageNo,
      limit: perPage,
      total,
      totalPages: Math.max(Math.ceil(total / perPage), 1),
      totalAll,
      unread,
      filters: {
        type: normalizedType || 'all',
        isRead: normalizedRead == null ? 'all' : normalizedRead,
        dateFrom: normalizedDateFrom,
        dateTo: normalizedDateTo,
      },
    },
  }
}

async function markRead({ sessionId, id }) {
  if (!sessionId) throw appError('sessionId is required', 400)
  const row = await notificationsRepo.markReadByIdAndSession({ id, sessionId })
  if (!row) throw appError('Notification not found', 404)
  const unread = await notificationsRepo.countUnreadBySession(sessionId)
  const data = { notification: row, unread }
  notificationStreamService.publish(sessionId, 'notification.read', data)
  return data
}

async function markAllRead({ sessionId }) {
  if (!sessionId) throw appError('sessionId is required', 400)
  const updated = await notificationsRepo.markAllReadBySession(sessionId)
  const data = { updated, unread: 0 }
  notificationStreamService.publish(sessionId, 'notification.read_all', data)
  return data
}

async function clearOlderThan({ sessionId, olderThanDays }) {
  if (!sessionId) throw appError('sessionId is required', 400)
  const days = toInt(olderThanDays, 0)
  if (!days || days < 1) throw appError('olderThanDays must be >= 1', 400)
  const deleted = await notificationsRepo.clearOlderThanBySession({ sessionId, olderThanDays: days })
  const unread = await notificationsRepo.countUnreadBySession(sessionId)
  const data = { deleted, unread }
  notificationStreamService.publish(sessionId, 'notification.cleared', data)
  return data
}

module.exports = {
  create,
  listBySession,
  markRead,
  markAllRead,
  clearOlderThan,
}
