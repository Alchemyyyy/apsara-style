import { http } from '@/shared/api/http'

export async function addToWishlist(productId) {
  return http.post('/wishlist', { productId })
}

export async function removeFromWishlist(productId) {
  return http.delete(`/wishlist/${productId}`)
}

export async function getWishlist() {
  return http.get('/wishlist')
}