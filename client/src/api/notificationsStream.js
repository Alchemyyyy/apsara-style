import { getSessionId } from './session'

const baseUrl = 'http://localhost:4000/api/notifications/stream'

const listeners = new Set()
const statusListeners = new Set()
let source = null
let connected = false

function notifyStatus(value) {
  connected = Boolean(value)
  for (const fn of statusListeners) {
    try {
      fn(connected)
    } catch {}
  }
}

function notifyMessage(event, payload) {
  for (const fn of listeners) {
    try {
      fn(event, payload)
    } catch {}
  }
}

function connect() {
  if (source) return
  const sid = getSessionId()
  if (!sid || sid.length < 8) return
  const url = `${baseUrl}?sid=${encodeURIComponent(sid)}`
  source = new EventSource(url)

  source.addEventListener('connected', (evt) => {
    notifyStatus(true)
    try {
      notifyMessage('connected', JSON.parse(evt.data || '{}'))
    } catch {
      notifyMessage('connected', {})
    }
  })

  const handleEvent = (name) => (evt) => {
    try {
      notifyMessage(name, JSON.parse(evt.data || '{}'))
    } catch {
      notifyMessage(name, {})
    }
  }

  source.addEventListener('notification.created', handleEvent('notification.created'))
  source.addEventListener('notification.read', handleEvent('notification.read'))
  source.addEventListener('notification.read_all', handleEvent('notification.read_all'))
  source.addEventListener('notification.cleared', handleEvent('notification.cleared'))

  source.onerror = () => {
    notifyStatus(false)
  }
}

function disconnect() {
  if (!source) return
  source.close()
  source = null
  notifyStatus(false)
}

export function subscribeNotificationsStream({ onMessage, onStatus } = {}) {
  if (typeof onMessage === 'function') listeners.add(onMessage)
  if (typeof onStatus === 'function') {
    statusListeners.add(onStatus)
    onStatus(connected)
  }
  connect()

  return () => {
    if (typeof onMessage === 'function') listeners.delete(onMessage)
    if (typeof onStatus === 'function') statusListeners.delete(onStatus)
    if (!listeners.size && !statusListeners.size) {
      disconnect()
    }
  }
}

