import { http } from '@/shared/api/http'

export async function trackEvent(type, payload = {}) {
  try {
    await http.post('/events', {
      type,
      productId: payload.productId,
      query: payload.query,
      meta: payload.meta || {},
    })
  } catch {
    // ignore tracking errors (never block UI)
  }
}
