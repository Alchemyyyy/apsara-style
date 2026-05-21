const { ok, okList } = require("../../shared/responses");
const { asyncHandler } = require("../../shared/errors");
const notificationsService = require("./service");
const notificationStreamService = require("./stream.service");
const { fail } = require("../../shared/validation");

const list = asyncHandler(async (req, res) => {
  const data = await notificationsService.listBySession({
    sessionId: req.sessionId,
    page: req.query?.page,
    limit: req.query?.limit,
    type: req.query?.type,
    isRead: req.query?.is_read,
    dateFrom: req.query?.date_from,
    dateTo: req.query?.date_to,
  });
  okList(res, data);
});

const markRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markRead({
    sessionId: req.sessionId,
    id: req.params.id,
  });
  ok(res, data);
});

const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markAllRead({
    sessionId: req.sessionId,
  });
  ok(res, data);
});

const clearOlderThan = asyncHandler(async (req, res) => {
  const data = await notificationsService.clearOlderThan({
    sessionId: req.sessionId,
    olderThanDays: req.query?.days || req.body?.days,
  });
  ok(res, data);
});

const stream = (req, res) => {
  const sessionId = req.sessionId;
  if (!sessionId) {
    return fail(res, "sessionId is required");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const writeEvent = (event, data = {}) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  writeEvent("connected", { sessionId, ts: Date.now() });

  const unsubscribe = notificationStreamService.subscribe(sessionId, (event, payload) => {
    writeEvent(event, payload);
  });

  const keepAlive = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    unsubscribe();
    res.end();
  });
};

module.exports = {
  list,
  markRead,
  markAllRead,
  clearOlderThan,
  stream,
};
