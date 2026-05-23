import { ref } from 'vue'
import { addToWishlist, getWishlist, removeFromWishlist } from '@/features/wishlist/api/wishlist'

const items = ref([])
const idSet = ref(new Set())
const loading = ref(false)
const loaded = ref(false)
let loadPromise = null

function applyItems(nextItems) {
  const safe = Array.isArray(nextItems) ? nextItems : []
  items.value = safe
  idSet.value = new Set(safe.map((p) => p.id))
  loaded.value = true
}

async function load(force = false) {
  if (loaded.value && !force) return items.value
  if (loadPromise) return loadPromise

  loading.value = true
  loadPromise = getWishlist()
    .then((res) => {
      applyItems(res?.data?.data || [])
      return items.value
    })
    .finally(() => {
      loading.value = false
      loadPromise = null
    })

  return loadPromise
}

function has(productId) {
  return idSet.value.has(productId)
}

async function toggle(product) {
  const productId = product?.id || product
  if (!productId) return false

  await load()

  if (idSet.value.has(productId)) {
    await removeFromWishlist(productId)
    const next = items.value.filter((p) => p.id !== productId)
    applyItems(next)
    return false
  }

  await addToWishlist(productId)
  if (product && typeof product === 'object' && !idSet.value.has(productId)) {
    applyItems([product, ...items.value])
  } else {
    idSet.value = new Set([...idSet.value, productId])
  }
  return true
}

export function useWishlistStore() {
  return {
    items,
    idSet,
    loading,
    loaded,
    load,
    has,
    toggle,
  }
}
