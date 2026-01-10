<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0">Checkout</h2>
      </div>
      <RouterLink class="btn btn-outline-dark" :to="{ name: 'cart' }">Back to cart</RouterLink>
    </div>

    <div class="row g-4 mt-2">
      <div class="col-lg-7">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Contact</div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Email *</label>
              <input class="form-control" v-model="form.email" type="email" placeholder="you@example.com" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone</label>
              <input class="form-control" v-model="form.phone" placeholder="012345678" />
            </div>
          </div>

          <hr class="my-4" />

          <div class="fw-semibold mb-3">Shipping address</div>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Country</label>
              <input class="form-control" v-model="form.shippingAddress.country" placeholder="Cambodia" />
            </div>
            <div class="col-md-6">
              <label class="form-label">City</label>
              <input class="form-control" v-model="form.shippingAddress.city" placeholder="Phnom Penh" />
            </div>
            <div class="col-12">
              <label class="form-label">Address line 1 *</label>
              <input class="form-control" v-model="form.shippingAddress.addressLine1" placeholder="Street, house, etc." />
            </div>
            <div class="col-12">
              <label class="form-label">Address line 2</label>
              <input class="form-control" v-model="form.shippingAddress.addressLine2" placeholder="Apartment, building..." />
            </div>
            <div class="col-md-6">
              <label class="form-label">Postal code</label>
              <input class="form-control" v-model="form.shippingAddress.postalCode" placeholder="12000" />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-4 mb-0">{{ error }}</div>

          <button class="btn btn-as w-100 mt-4" @click="placeOrder" :disabled="placing || cart.items.length === 0">
            {{ placing ? 'Placing order…' : 'Place order' }}
          </button>

          <div class="text-muted small mt-3">
            Thesis demo checkout (no payment gateway).
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Order summary</div>

          <div v-if="loading" class="text-muted">Loading cart…</div>

          <div v-else>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Items</span>
              <span>{{ cart.totals.totalItems }}</span>
            </div>

            <div class="d-flex justify-content-between mt-2">
              <span class="text-muted">Subtotal</span>
              <span class="fw-semibold">${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
            </div>

            <hr class="my-3" />

            <div class="d-flex justify-content-between">
              <span class="text-muted">Total</span>
              <span class="fw-semibold">${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
            </div>

            <div class="mt-4 small text-muted">We’ll build orders history next.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/http'
import { trackEvent } from '@/api/events' //

const router = useRouter()

const cart = ref({ items: [], totals: { subtotal: 0, totalItems: 0 } })
const loading = ref(false)
const placing = ref(false)
const error = ref('')

const form = ref({
  email: '',
  phone: '',
  shippingAddress: {
    country: 'Cambodia',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
  },
})

async function loadCart() {
  loading.value = true
  try {
    const res = await http.get('/cart')
    cart.value = res.data.data
  } finally {
    loading.value = false
  }
}

async function placeOrder() {
  error.value = ''
  if (!form.value.email) return (error.value = 'Email is required.')
  if (!form.value.shippingAddress.addressLine1) return (error.value = 'Address line 1 is required.')

  placing.value = true
  try {
    const res = await http.post('/orders', form.value)
    const orderId = res.data.data.id
    await trackEvent('purchase', { meta: { orderId } })
    // After checkout, cart is cleared by backend
    await router.push({ name: 'orderDetail', params: { id: orderId } })
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to place order.'
  } finally {
    placing.value = false
  }
}

onMounted(loadCart)
</script>
