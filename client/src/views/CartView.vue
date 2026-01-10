<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0">Cart</h2>
      </div>
      <RouterLink class="btn btn-outline-dark" to="/">Continue shopping</RouterLink>
    </div>

    <div v-if="loading" class="text-muted py-5 text-center">Loading cart…</div>

    <div v-else class="row g-4 mt-2">
      <div class="col-lg-8">
        <div v-if="cart.items.length === 0" class="bg-white border rounded-4 p-4">
          <div class="text-muted">Your cart is empty.</div>
        </div>

        <div v-else class="d-flex flex-column gap-3">
          <div v-for="it in cart.items" :key="it.cart_item_id" class="bg-white border rounded-4 p-3">
            <div class="row g-3 align-items-center">
              <div class="col-3 col-md-2">
                <img :src="it.hero_image" class="w-100 rounded-3" style="aspect-ratio: 3/4; object-fit: cover;" />
              </div>

              <div class="col-9 col-md-6">
                <div class="fw-semibold">{{ it.title }}</div>
                <div class="text-muted small">Color: {{ it.color }} · Size: {{ it.size }}</div>
                <div class="mt-2">
                  <span class="fw-semibold">
                    ${{ Number(it.discount_price || it.base_price).toFixed(2) }}
                  </span>
                  <span v-if="it.discount_price" class="text-muted small text-decoration-line-through ms-2">
                    ${{ Number(it.base_price).toFixed(2) }}
                  </span>
                </div>
              </div>

              <div class="col-md-2">
                <label class="form-label small mb-1">Qty</label>
                <input
                  class="form-control"
                  type="number"
                  min="1"
                  :max="it.stock"
                  :value="it.qty"
                  @change="onQtyChange(it.cart_item_id, $event.target.value)"
                />
                <div class="text-muted small mt-1">Stock: {{ it.stock }}</div>
              </div>

              <div class="col-md-2 text-md-end">
                <button class="btn btn-outline-dark btn-sm" @click="remove(it.cart_item_id)" :disabled="busy">
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Order summary</div>

          <div class="d-flex justify-content-between">
            <span class="text-muted">Items</span>
            <span>{{ cart.totals.totalItems }}</span>
          </div>

          <div class="d-flex justify-content-between mt-2">
            <span class="text-muted">Subtotal</span>
            <span class="fw-semibold">${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
          </div>

          <RouterLink class="btn btn-as w-100 mt-4" :class="{ disabled: cart.items.length === 0 }" :to="{ name: 'checkout' }">
            Checkout
          </RouterLink>

          <div class="text-muted small mt-3">
            Shipping and payment will be implemented in the next step.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { http } from '@/api/http'

const cart = ref({ items: [], totals: { subtotal: 0, totalItems: 0 } })
const loading = ref(false)
const busy = ref(false)

async function loadCart() {
  loading.value = true
  try {
    const res = await http.get('/cart')
    cart.value = res.data.data
  } finally {
    loading.value = false
  }
}

async function onQtyChange(itemId, qty) {
  busy.value = true
  try {
    await http.patch(`/cart/items/${itemId}`, { qty: Number(qty) })
    await loadCart()
  } finally {
    busy.value = false
  }
}

async function remove(itemId) {
  busy.value = true
  try {
    await http.delete(`/cart/items/${itemId}`)
    await loadCart()
  } finally {
    busy.value = false
  }
}

onMounted(loadCart)
</script>
