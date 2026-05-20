const notificationsService = require('../services/notifications.service')
const notificationStreamService = require('../services/notificationStream.service')

const list = async (req, res, next) => {
  try {
    const data = await notificationsService.listBySession({
      sessionId: req.sessionId,
      page: req.query?.page,
      limit: req.query?.limit,
      type: req.query?.type,
      isRead: req.query?.is_read,
      dateFrom: req.query?.date_from,
      dateTo: req.query?.date_to,
    })
    res.json({ success: true, data: data.items, meta: data.meta })
  } catch (err) {
    next(err)
  }
}

const markRead = async (req, res, next) => {
  try {
    const data = await notificationsService.markRead({
      sessionId: req.sessionId,
      id: req.params.id,
    })
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

const markAllRead = async (req, res, next) => {
  try {
    const data = await notificationsService.markAllRead({
      sessionId: req.sessionId,
    })
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

const clearOlderThan = async (req, res, next) => {
  try {
    const data = await notificationsService.clearOlderThan({
      sessionId: req.sessionId,
      olderThanDays: req.query?.days || req.body?.days,
    })
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

const stream = (req, res) => {
  const sessionId = req.sessionId
  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'sessionId is required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const writeEvent = (event, data = {}) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  writeEvent('connected', { sessionId, ts: Date.now() })

  const unsubscribe = notificationStreamService.subscribe(sessionId, (event, payload) => {
    writeEvent(event, payload)
  })

  const keepAlive = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    unsubscribe()
    res.end()
  })
}

module.exports = {
  list,
  markRead,
  markAllRead,
  clearOlderThan,
  stream,
}
