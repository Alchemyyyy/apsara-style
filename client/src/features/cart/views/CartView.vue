<template>
  <div class="cart-page">
    <div class="container py-5">
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <BrandLogo size="md" class="mb-1" />
          <h2 class="cart-title mb-1">Bag</h2>
          <p class="text-muted mb-0">Review your items before checkout.</p>
        </div>
        <RouterLink class="btn btn-outline-dark" to="/">Continue shopping</RouterLink>
      </div>

      <div v-if="loading" class="text-muted py-5 text-center">Loading cart…</div>

      <div v-else class="row g-4 mt-2">
        <div class="col-lg-8">
          <div v-if="cart.items.length === 0" class="cart-empty-card">
            <h5 class="mb-2">Your bag is empty</h5>
            <p class="text-muted mb-3">Looks like you haven’t added anything yet.</p>
            <RouterLink class="btn btn-dark" to="/">Start shopping</RouterLink>
          </div>

          <div v-else class="cart-item-list">
            <article v-for="it in cart.items" :key="it.cart_item_id" class="cart-item-card">
              <img :src="it.hero_image" class="cart-item-image" />

              <div class="cart-item-main">
                <h6 class="cart-item-name">{{ it.title }}</h6>
                <div class="text-muted small">Color: {{ it.color }}</div>
                <div class="text-muted small">Size: {{ it.size }}</div>
                <div class="cart-item-price mt-2">
                  <span class="fw-semibold">${{ Number(it.discount_price || it.base_price).toFixed(2) }}</span>
                  <span v-if="it.discount_price" class="text-muted text-decoration-line-through ms-2">
                    ${{ Number(it.base_price).toFixed(2) }}
                  </span>
                </div>
              </div>

              <div class="cart-item-side">
                <label class="form-label small mb-1">Qty</label>
                <input
                  class="form-control form-control-sm"
                  type="number"
                  min="1"
                  :max="it.stock"
                  :disabled="busy"
                  :value="it.qty"
                  @change="onQtyChange(it.cart_item_id, $event.target.value)"
                />
                <div class="text-muted xsmall mt-1">In stock: {{ it.stock }}</div>
                <button class="btn btn-link btn-sm text-dark p-0 mt-2" @click="remove(it.cart_item_id)" :disabled="busy">
                  Remove
                </button>
              </div>
            </article>
          </div>
        </div>

        <div class="col-lg-4">
          <aside class="summary-card">
            <h5 class="summary-title">Summary</h5>

            <div class="summary-row">
              <span>Items</span>
              <span>{{ cart.totals.totalItems }}</span>
            </div>

            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
            </div>

            <div class="summary-row">
              <span>Estimated Shipping</span>
              <span>Free</span>
            </div>

            <hr class="my-3" />

            <div class="summary-row fw-semibold">
              <span>Total</span>
              <span>${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
            </div>

            <RouterLink class="btn btn-dark w-100 mt-4" :class="{ disabled: cart.items.length === 0 }" :to="{ name: 'checkout' }">
              Checkout
            </RouterLink>

            <p class="summary-note mt-3 mb-0">
              Shipping and payment options are shown in the next step.
            </p>
          </aside>
        </div>
      </div>
    </div>

    <CartUndoBar :item="undoItem" :busy="busy" @undo="undoRemove" @close="clearUndo" />
  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { http } from '@/shared/api/http'
import { useToast } from '@/shared/composables/useToast'
import CartUndoBar from '@/features/cart/components/CartUndoBar.vue'

const cart = ref({ items: [], totals: { subtotal: 0, totalItems: 0 } })
const loading = ref(false)
const busy = ref(false)
const { error: toastError, success: toastSuccess } = useToast()
const undoItem = ref(null)
let undoTimer = null

function clearUndo() {
  if (undoTimer) {
    clearTimeout(undoTimer)
    undoTimer = null
  }
  undoItem.value = null
}

function setUndo(item) {
  clearUndo()
  undoItem.value = item
  undoTimer = setTimeout(() => {
    undoItem.value = null
    undoTimer = null
  }, 7000)
}

async function loadCart({ withLoader = true } = {}) {
  if (withLoader) loading.value = true
  try {
    const res = await http.get('/cart')
    cart.value = res.data.data
  } finally {
    if (withLoader) loading.value = false
  }
}

async function onQtyChange(itemId, qty) {
  const parsedQty = Number(qty)
  if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
    await loadCart({ withLoader: false })
    return
  }
  busy.value = true
  try {
    await http.patch(`/cart/items/${itemId}`, { qty: parsedQty })
    await loadCart({ withLoader: false })
  } finally {
    busy.value = false
  }
}

async function remove(itemId) {
  const removedItem = cart.value.items.find((it) => it.cart_item_id === itemId)
  if (!removedItem) return

  busy.value = true
  try {
    await http.delete(`/cart/items/${itemId}`)
    await loadCart({ withLoader: false })
    setUndo({
      title: removedItem.title,
      hero_image: removedItem.hero_image,
      variant_id: removedItem.variant_id,
      qty: Number(removedItem.qty || 1),
      color: removedItem.color,
      size: removedItem.size,
    })
  } finally {
    busy.value = false
  }
}

async function undoRemove() {
  if (!undoItem.value) return
  const item = undoItem.value
  busy.value = true
  try {
    await http.post('/cart/items', {
      variantId: item.variant_id,
      qty: item.qty,
    })
    await loadCart({ withLoader: false })
    toastSuccess(`${item.title} restored to bag.`)
    clearUndo()
  } catch (e) {
    toastError(e?.response?.data?.error || 'Unable to restore item.')
  } finally {
    busy.value = false
  }
}

onMounted(() => loadCart({ withLoader: true }))
onBeforeUnmount(clearUndo)
</script>

<style scoped>
.cart-page {
  background: #ffffff;
}

.cart-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.cart-item-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.cart-item-card {
  display: grid;
  grid-template-columns: 104px 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--as-border);
  border-radius: 14px;
  background: #fff;
}

.cart-item-image {
  width: 104px;
  height: 130px;
  border-radius: 10px;
  object-fit: cover;
}

.cart-item-name {
  margin-bottom: 0.35rem;
  font-weight: 600;
}

.cart-item-side {
  justify-self: end;
  width: 100%;
}

.summary-card {
  position: sticky;
  top: 96px;
  border: 1px solid var(--as-border);
  border-radius: 14px;
  background: #fff;
  padding: 1.2rem;
}

.summary-title {
  font-weight: 700;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.65rem;
}

.summary-note {
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
}

.cart-empty-card {
  border: 1px solid var(--as-border);
  border-radius: 14px;
  background: #fff;
  padding: 1.4rem;
}

.xsmall {
  font-size: 0.72rem;
}

@media (max-width: 991.98px) {
  .cart-title {
    font-size: 1.6rem;
  }

  .cart-item-card {
    grid-template-columns: 86px 1fr;
  }

  .cart-item-image {
    width: 86px;
    height: 112px;
  }

  .cart-item-side {
    grid-column: 1 / -1;
    justify-self: start;
    width: 160px;
  }

  .summary-card {
    position: static;
  }
}
</style>
