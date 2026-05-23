import axios from 'axios'

export const adminHttp = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL || `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/admin`,
  timeout: 15000,
  withCredentials: true,
})

export const ADMIN_TOKEN_KEY = 'apsara_admin_token'
export const ADMIN_PROFILE_KEY = 'apsara_admin_profile'
const ADMIN_AUTH_NOTICE_KEY = 'apsara_admin_auth_notice'

function parseAdminProfile(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function getAdminProfile() {
  return parseAdminProfile(localStorage.getItem(ADMIN_PROFILE_KEY))
}

export function setAdminAuthState({ token, admin }) {
  const safeToken = String(token || '')
  if (safeToken) localStorage.setItem(ADMIN_TOKEN_KEY, safeToken)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)

  if (admin) localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(admin))
  else localStorage.removeItem(ADMIN_PROFILE_KEY)
}

export function clearAdminAuthState() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_PROFILE_KEY)
}

adminHttp.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise = null

async function refreshAdminAccessToken() {
  const res = await adminHttp.post(
    '/auth/refresh',
    {},
    { headers: { 'x-skip-auth-expired-handler': '1', 'x-skip-auth-refresh': '1' } }
  )
  const payload = res.data?.data || {}
  const token = String(payload.token || '')
  const admin = payload.admin || getAdminProfile()
  if (!token) throw new Error('Invalid refresh response')
  setAdminAuthState({ token, admin })
  return token
}

adminHttp.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = Number(error?.response?.status || 0)
    const url = String(error?.config?.url || '')
    const skipExpiredHandler = Boolean(error?.config?.headers?.['x-skip-auth-expired-handler'])
    const skipRefresh = Boolean(error?.config?.headers?.['x-skip-auth-refresh'])
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && !isAuthRoute && !skipRefresh) {
      const originalConfig = error.config || {}
      if (!originalConfig.__retriedWithRefresh) {
        originalConfig.__retriedWithRefresh = true
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAdminAccessToken().finally(() => {
              refreshPromise = null
            })
          }
          const nextAccessToken = await refreshPromise
          originalConfig.headers = originalConfig.headers || {}
          originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`
          return adminHttp(originalConfig)
        } catch (e) {
          console.error(e)
        }
      }
    }

    if (status === 401 && !url.includes('/auth/login') && !skipExpiredHandler) {
      clearAdminAuthState()
      sessionStorage.setItem(ADMIN_AUTH_NOTICE_KEY, 'Your admin session expired. Please login again.')
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.replace('/admin')
      }
    }
    return Promise.reject(error)
  }
)
