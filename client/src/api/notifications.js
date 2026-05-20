import { http } from './http'

export async function fetchNotifications(params = {}) {
  const res = await http.get('/notifications', { params })
  return {
    items: Array.isArray(res.data?.data) ? res.data.data : [],
    meta: res.data?.meta || {},
  }
}

export async function markNotificationRead(id) {
  const res = await http.patch(`/notifications/${id}/read`)
  return res.data?.data || null
}

export async function markAllNotificationsRead() {
  const res = await http.patch('/notifications/read-all')
  return res.data?.data || null
}

export async function clearNotificationsOlderThan(days) {
  const res = await http.delete('/notifications/clear', { data: { days } })
  return res.data?.data || null
}
