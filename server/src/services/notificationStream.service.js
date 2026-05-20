const listenersBySession = new Map();

function getSet(sessionId) {
  if (!listenersBySession.has(sessionId)) {
    listenersBySession.set(sessionId, new Set());
  }
  return listenersBySession.get(sessionId);
}

function subscribe(sessionId, handler) {
  if (!sessionId || typeof handler !== "function") return () => {};
  const set = getSet(sessionId);
  set.add(handler);

  return () => {
    const target = listenersBySession.get(sessionId);
    if (!target) return;
    target.delete(handler);
    if (!target.size) listenersBySession.delete(sessionId);
  };
}

function publish(sessionId, event, payload = {}) {
  if (!sessionId) return 0;
  const set = listenersBySession.get(sessionId);
  if (!set || !set.size) return 0;
  let sent = 0;
  for (const handler of set) {
    try {
      handler(event, payload);
      sent += 1;
    } catch {
      // ignore subscriber errors
    }
  }
  return sent;
}

module.exports = {
  subscribe,
  publish,
};
