import { http } from './http'
import {
  USER_PROFILE_KEY,
  USER_TOKEN_KEY,
  clearUserAuthState,
  setUserAuthState,
  userProfile,
} from '@/stores/authStore'

export { USER_TOKEN_KEY, USER_PROFILE_KEY }

export async function loginUser(payload) {
  const res = await http.post('/auth/login', payload)
  return res.data?.data || {}
}

export async function registerUser(payload) {
  const res = await http.post('/auth/register', payload)
  return res.data?.data || {}
}

export async function loginWithGoogle(payload) {
  const res = await http.post('/auth/google', payload)
  return res.data?.data || {}
}

export async function loginWithFacebook(payload) {
  const res = await http.post('/auth/facebook', payload)
  return res.data?.data || {}
}

export async function forgotPassword(payload) {
  const res = await http.post('/auth/forgot-password', payload)
  return res.data?.data || {}
}

export async function resetPassword(payload) {
  const res = await http.post('/auth/reset-password', payload)
  return res.data?.data || {}
}

export async function claimUserCart() {
  const res = await http.post('/cart/claim')
  return res.data?.data || {}
}

export async function fetchMyProfile() {
  const res = await http.get('/auth/me')
  return res.data?.data || null
}

export async function updateMyProfile(payload) {
  const res = await http.patch('/auth/me', payload)
  return res.data?.data || null
}

export async function fetchMyAddresses() {
  const res = await http.get('/auth/me/addresses')
  return Array.isArray(res.data?.data) ? res.data.data : []
}

export async function createMyAddress(payload) {
  const res = await http.post('/auth/me/addresses', payload)
  return res.data?.data || null
}

export async function updateMyAddress(addressId, payload) {
  const res = await http.patch(`/auth/me/addresses/${addressId}`, payload)
  return res.data?.data || null
}

export async function deleteMyAddress(addressId) {
  const res = await http.delete(`/auth/me/addresses/${addressId}`)
  return res.data?.data || null
}

export async function setMyDefaultAddress(addressId) {
  const res = await http.patch(`/auth/me/addresses/${addressId}/default`)
  return res.data?.data || null
}

export async function changeMyPassword(payload) {
  const res = await http.put('/auth/me/password', payload)
  return res.data?.data || null
}

export async function fetchNotificationPreferences() {
  const res = await http.get('/notifications/preferences')
  return res.data?.data || null
}

export async function updateNotificationPreferences(payload) {
  const res = await http.patch('/notifications/preferences', payload)
  return res.data?.data || null
}

export function storeUserAuth({ token, user }) {
  setUserAuthState({ token, user })
}

export function clearUserAuth() {
  clearUserAuthState()
}

export function getUserProfile() {
  return userProfile.value
}
