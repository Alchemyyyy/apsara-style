import { adminHttp } from './adminHttp'

export async function uploadProductImages(formData, onUploadProgress) {
  const res = await adminHttp.post('/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function fetchAdminCategories() {
  const res = await adminHttp.get('/categories')
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function createAdminCategory(payload) {
  const res = await adminHttp.post('/categories', payload)
  return res.data?.data || null
}

export async function updateAdminCategory(id, payload) {
  const res = await adminHttp.patch(`/categories/${id}`, payload)
  return res.data?.data || null
}

export async function disableAdminCategory(id) {
  const res = await adminHttp.delete(`/categories/${id}`)
  return res.data?.data || null
}

export async function fetchAdminProducts(params = {}) {
  const res = await adminHttp.get('/products', { params })
  return {
    items: Array.isArray(res.data?.data) ? res.data.data : [],
    meta: res.data?.meta || { page: 1, totalPages: 1 },
  }
}

export async function fetchAdminProduct(id) {
  const res = await adminHttp.get(`/products/${id}`)
  return res.data?.data || null
}

export async function createAdminProduct(payload) {
  const res = await adminHttp.post('/products', payload)
  return res.data?.data || null
}

export async function updateAdminProduct(id, payload) {
  const res = await adminHttp.patch(`/products/${id}`, payload)
  return res.data?.data || null
}

export async function disableAdminProduct(id) {
  const res = await adminHttp.delete(`/products/${id}`)
  return res.data?.data || null
}
