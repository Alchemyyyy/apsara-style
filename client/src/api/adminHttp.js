import axios from 'axios'

export const adminHttp = axios.create({
  baseURL: 'http://localhost:4000/api/admin',
  timeout: 15000,
})

// Simple: store admin key in localStorage (for thesis)
adminHttp.interceptors.request.use((config) => {
  const key = localStorage.getItem('apsara_admin_key') || ''
  if (key) config.headers['x-admin-key'] = key
  return config
})
