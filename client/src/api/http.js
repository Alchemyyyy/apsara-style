import axios from 'axios'
import { getSessionId, setSessionId } from './session'

export const http = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const sid = getSessionId()
  if (sid) config.headers['x-session-id'] = sid
  return config
})

http.interceptors.response.use((res) => {
  const sid = res.headers['x-session-id']
  if (sid) setSessionId(sid)
  return res
})
