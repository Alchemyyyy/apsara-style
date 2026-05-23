import axios from 'axios'
import { getSessionId, setSessionId } from './session'
import { clearUserAuthState, userToken } from '@/features/auth/store'

const USER_AUTH_NOTICE_KEY = 'apsara_user_auth_notice'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const sid = getSessionId()
  if (sid) config.headers['x-session-id'] = sid
  if (userToken.value) config.headers.Authorization = `Bearer ${userToken.value}`
  return config
})

http.interceptors.response.use(
  (res) => {
    const sid = res.headers['x-session-id']
    if (sid) setSessionId(sid)
    return res
  },
  (error) => {
    const status = Number(error?.response?.status || 0)
    const hasAuthHeader = Boolean(error?.config?.headers?.Authorization)
    const skipExpiredHandler = Boolean(error?.config?.headers?.['x-skip-auth-expired-handler'])
    if (status === 401 && hasAuthHeader && !skipExpiredHandler) {
      clearUserAuthState()
      sessionStorage.setItem(USER_AUTH_NOTICE_KEY, 'Your session expired. Please login again.')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)
