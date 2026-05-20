<template>
  <div class="checkout-page">
    <div class="container py-5">
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div class="brand-wordmark mb-1">APSARA STYLE</div>
          <h2 class="checkout-title mb-1">Checkout</h2>
          <p class="text-muted mb-0">Complete your order details.</p>
        </div>
        <RouterLink class="btn btn-outline-dark" :to="{ name: 'cart' }">Back to bag</RouterLink>
      </div>

      <div class="row g-4 mt-2">
        <div class="col-lg-7">
          <section class="checkout-card p-4 p-md-4">
            <div class="section-header">
              <span class="section-step">1</span>
              <h5 class="mb-0">Contact</h5>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Email <span class="required-mark">*</span></label>
                <input class="form-control" v-model="form.email" type="email" placeholder="you@example.com" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Phone</label>
                <input class="form-control" v-model="form.phone" placeholder="012345678" />
              </div>
            </div>

            <hr class="my-4" />

            <div class="section-header">
              <span class="section-step">2</span>
              <h5 class="mb-0">Shipping Address</h5>
            </div>

            <div v-if="canManageAddresses" class="saved-address-block mt-3 mb-2">
              <label class="form-label">Saved Address</label>
              <div v-if="savedAddresses.length" class="saved-address-grid mb-2">
                <button
                  v-for="address in savedAddresses"
                  :key="address.id"
                  type="button"
                  class="saved-address-card"
                  :class="{ active: selectedAddressId === address.id }"
                  @click="chooseAddress(address)"
                >
                  <div class="saved-address-head">
                    <span class="saved-address-label">{{ address.label || 'Address' }}</span>
                    <span v-if="address.isDefault" class="saved-address-default">Default</span>
                  </div>
                  <div class="saved-address-line">{{ address.city }}, {{ address.country }}</div>
                  <div class="saved-address-line">{{ address.addressLine1 }}</div>
                  <div v-if="address.phone" class="saved-address-line">{{ address.phone }}</div>
                </button>
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-dark" type="button" @click="openAddressModal">
                  Add New Address
                </button>
              </div>
            </div>

            <div class="row g-3 mt-1">
              <div class="col-md-6">
                <label class="form-label">Country <span class="required-mark">*</span></label>
                <input class="form-control" v-model="form.shippingAddress.country" placeholder="Cambodia" />
              </div>
              <div class="col-md-6">
                <label class="form-label">City <span class="required-mark">*</span></label>
                <input class="form-control" v-model="form.shippingAddress.city" placeholder="Phnom Penh" />
              </div>
              <div class="col-12">
                <label class="form-label">Address Line 1 <span class="required-mark">*</span></label>
                <input class="form-control" v-model="form.shippingAddress.addressLine1" placeholder="Street, house, etc." />
              </div>
              <div class="col-12">
                <label class="form-label">Address Line 2</label>
                <input class="form-control" v-model="form.shippingAddress.addressLine2" placeholder="Apartment, building..." />
              </div>
              <div class="col-md-6">
                <label class="form-label">Postal Code</label>
                <input class="form-control" v-model="form.shippingAddress.postalCode" placeholder="12000" />
              </div>
            </div>

            <hr class="my-4" />

            <div class="section-header">
              <span class="section-step">3</span>
              <h5 class="mb-0">Payment Method</h5>
            </div>

            <div class="payment-method-grid mt-3">
              <button
                type="button"
                class="payment-method-card"
                :class="{ active: paymentMethod === 'bakong' }"
                @click="paymentMethod = 'bakong'"
              >
                <div class="payment-method-title">Bakong KHQR</div>
                <div class="payment-method-desc">Pay now by scanning QR.</div>
              </button>
              <button
                type="button"
                class="payment-method-card"
                :class="{ active: paymentMethod === 'cod' }"
                @click="paymentMethod = 'cod'"
              >
                <div class="payment-method-title">Cash on Delivery</div>
                <div class="payment-method-desc">Pay cash when your order arrives.</div>
              </button>
            </div>

            <div v-if="error" class="alert alert-danger mt-4 mb-0">{{ error }}</div>

            <button class="btn btn-dark w-100 mt-4 checkout-btn" @click="placeOrder" :disabled="placing || cart.items.length === 0">
              {{ placing ? placingLabel : actionButtonLabel }}
            </button>

            <div class="text-muted small mt-3">
              {{ paymentMethod === 'bakong' ? 'We will generate a Bakong KHQR for payment.' : 'You will pay cash to courier on delivery.' }}
            </div>
          </section>
        </div>

        <div class="col-lg-5">
          <aside class="summary-card">
            <h5 class="summary-title">Order Summary</h5>

            <div v-if="loading" class="text-muted">Loading cart…</div>

            <div v-else>
              <div v-if="cart.items.length > 0" class="summary-items">
                <article v-for="it in cart.items" :key="it.cart_item_id" class="summary-item">
                  <img :src="it.hero_image" :alt="it.title" class="summary-item-image" />
                  <div class="summary-item-main">
                    <div class="summary-item-title">{{ it.title }}</div>
                    <div class="summary-item-meta">{{ it.color }} / {{ it.size }}</div>
                    <div class="summary-item-meta">Qty {{ it.qty }}</div>
                  </div>
                  <div class="summary-item-price">${{ Number(it.discount_price || it.base_price).toFixed(2) }}</div>
                </article>
              </div>

              <div class="summary-row mt-3">
                <span>Items</span>
                <span>{{ cart.totals.totalItems }}</span>
              </div>
              <div class="summary-row">
                <span>Subtotal</span>
                <span>${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>

              <hr class="my-3" />

              <div class="summary-row fw-semibold">
                <span>Total</span>
                <span>${{ Number(cart.totals.subtotal).toFixed(2) }}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div v-if="paymentIntent" class="bakong-modal-backdrop" @click.self="closePaymentPanel">
        <div class="bakong-modal-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Bakong Payment</h5>
            <button class="btn btn-sm btn-outline-dark" :disabled="polling" @click="closePaymentPanel">x</button>
          </div>

          <div class="small text-muted mb-2">Order: <span class="fw-semibold">{{ paymentIntent.orderId }}</span></div>
          <div class="small text-muted mb-2">Reference: <span class="fw-semibold">{{ paymentIntent.paymentReference }}</span></div>
          <div class="small text-muted mb-3">Total: <span class="fw-semibold">{{ paymentIntent.currency }} {{ Number(paymentIntent.amount).toFixed(2) }}</span></div>

          <div class="text-center mb-3">
            <img :src="paymentIntent.qrImageUrl" alt="Bakong KHQR" class="bakong-qr-image" />
          </div>

          <div class="small text-muted mb-3">
            Scan this KHQR with your Bakong-enabled banking app.
          </div>

          <div v-if="paymentError" class="alert alert-danger py-2">{{ paymentError }}</div>
          <div v-if="paymentStatus === 'pending'" class="alert alert-warning py-2">
            Waiting for payment confirmation...
          </div>

          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-dark btn-sm" :disabled="polling" @click="checkPaymentStatus">
              {{ polling ? 'Checking...' : 'I have paid, check status' }}
            </button>
            <a class="btn btn-outline-dark btn-sm" :href="paymentIntent.deepLink" target="_blank" rel="noopener">Open Bakong Link</a>
          </div>
        </div>
      </div>

      <div v-if="addressModalOpen" class="bakong-modal-backdrop" @click.self="closeAddressModal">
        <div class="bakong-modal-card">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Add New Address</h5>
            <button class="btn btn-sm btn-outline-dark" :disabled="addressSaving" @click="closeAddressModal">x</button>
          </div>

          <div v-if="addressModalError" class="alert alert-danger py-2">{{ addressModalError }}</div>

          <div class="row g-2">
            <div class="col-md-6">
              <label class="form-label">Label</label>
              <input class="form-control" v-model.trim="addressForm.label" maxlength="50" placeholder="Home" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone <span class="required-mark">*</span></label>
              <input class="form-control" v-model.trim="addressForm.phone" maxlength="30" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Country <span class="required-mark">*</span></label>
              <input class="form-control" v-model.trim="addressForm.country" maxlength="80" />
            </div>
            <div class="col-md-6">
              <label class="form-label">City <span class="required-mark">*</span></label>
              <input class="form-control" v-model.trim="addressForm.city" maxlength="80" />
            </div>
            <div class="col-12">
              <label class="form-label">Address Line 1 <span class="required-mark">*</span></label>
              <input class="form-control" v-model.trim="addressForm.addressLine1" maxlength="255" />
            </div>
            <div class="col-12">
              <label class="form-label">Address Line 2</label>
              <input class="form-control" v-model.trim="addressForm.addressLine2" maxlength="255" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Postal Code</label>
              <input class="form-control" v-model.trim="addressForm.postalCode" maxlength="20" />
            </div>
            <div class="col-md-6 d-flex align-items-end">
              <div class="form-check mb-2">
                <input id="checkout-address-default" class="form-check-input" type="checkbox" v-model="addressForm.isDefault" />
                <label class="form-check-label" for="checkout-address-default">Set as default</label>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-outline-dark" type="button" :disabled="addressSaving" @click="closeAddressModal">Cancel</button>
            <button class="btn btn-dark" type="button" :disabled="addressSaving" @click="submitNewAddress">
              {{ addressSaving ? 'Saving...' : 'Save Address' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/http'
import { trackEvent } from '@/api/events' //
import { createMyAddress, fetchMyAddresses, fetchMyProfile } from '@/api/userAuth'

const router = useRouter()
const cart = ref({ items: [], totals: { subtotal: 0, totalItems: 0 } })
const loading = ref(false)
const placing = ref(false)
const error = ref('')
const paymentIntent = ref(null)
const paymentStatus = ref('')
const paymentError = ref('')
const polling = ref(false)
const paymentMethod = ref('bakong')
const savedAddresses = ref([])
const selectedAddressId = ref('')
const canManageAddresses = ref(false)
const addressModalOpen = ref(false)
const addressModalError = ref('')
const addressSaving = ref(false)
const addressForm = ref({
  label: 'Home',
  phone: '',
  country: 'Cambodia',
  city: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  isDefault: false,
})
let pollingTimer = null
const actionButtonLabel = computed(() =>
  paymentMethod.value === 'cod' ? 'Place order with COD' : 'Pay with Bakong'
)
const placingLabel = computed(() =>
  paymentMethod.value === 'cod' ? 'Placing order…' : 'Generating KHQR…'
)

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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function applyAddress(address) {
  if (!address) return
  if (address.phone) form.value.phone = String(address.phone)
  form.value.shippingAddress.country = String(address.country || '')
  form.value.shippingAddress.city = String(address.city || '')
  form.value.shippingAddress.addressLine1 = String(address.addressLine1 || '')
  form.value.shippingAddress.addressLine2 = String(address.addressLine2 || '')
  form.value.shippingAddress.postalCode = String(address.postalCode || '')
}

function applySelectedAddress() {
  const chosen = savedAddresses.value.find((a) => a.id === selectedAddressId.value)
  if (!chosen) return
  applyAddress(chosen)
}

function chooseAddress(address) {
  if (!address?.id) return
  selectedAddressId.value = address.id
  applyAddress(address)
}

function resetAddressForm() {
  addressForm.value = {
    label: 'Home',
    phone: form.value.phone || '',
    country: form.value.shippingAddress.country || 'Cambodia',
    city: form.value.shippingAddress.city || '',
    addressLine1: form.value.shippingAddress.addressLine1 || '',
    addressLine2: form.value.shippingAddress.addressLine2 || '',
    postalCode: form.value.shippingAddress.postalCode || '',
    isDefault: savedAddresses.value.length === 0,
  }
}

function openAddressModal() {
  addressModalError.value = ''
  resetAddressForm()
  addressModalOpen.value = true
}

function closeAddressModal() {
  if (addressSaving.value) return
  addressModalOpen.value = false
}

async function loadCart() {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get('/cart')
    cart.value = res.data.data
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to load cart.'
  } finally {
    loading.value = false
  }
}

async function loadProfileAndAddresses() {
  try {
    const [profile, addresses] = await Promise.all([fetchMyProfile(), fetchMyAddresses()])
    canManageAddresses.value = true
    if (profile?.email) form.value.email = String(profile.email)
    if (profile?.phone) form.value.phone = String(profile.phone)
    savedAddresses.value = Array.isArray(addresses) ? addresses : []

    const defaultAddress = savedAddresses.value.find((a) => a.isDefault) || null
    if (defaultAddress) {
      selectedAddressId.value = defaultAddress.id
      applyAddress(defaultAddress)
    }
  } catch {
    // Guest flow: ignore if not authenticated.
    canManageAddresses.value = false
    savedAddresses.value = []
    selectedAddressId.value = ''
  }
}

async function submitNewAddress() {
  if (addressSaving.value || !canManageAddresses.value) return
  addressSaving.value = true
  addressModalError.value = ''
  try {
    const payload = {
      label: String(addressForm.value.label || 'Home').trim(),
      phone: String(addressForm.value.phone || '').trim(),
      country: String(addressForm.value.country || '').trim(),
      city: String(addressForm.value.city || '').trim(),
      addressLine1: String(addressForm.value.addressLine1 || '').trim(),
      addressLine2: String(addressForm.value.addressLine2 || '').trim() || null,
      postalCode: String(addressForm.value.postalCode || '').trim() || null,
      isDefault: Boolean(addressForm.value.isDefault),
    }
    if (!payload.phone) throw new Error('phone is required')
    if (!payload.country) throw new Error('country is required')
    if (!payload.city) throw new Error('city is required')
    if (!payload.addressLine1) throw new Error('addressLine1 is required')

    const created = await createMyAddress(payload)
    if (!created?.id) throw new Error('Failed to create address')

    if (created.isDefault) {
      savedAddresses.value = savedAddresses.value.map((a) => ({ ...a, isDefault: false }))
    }
    savedAddresses.value = [created, ...savedAddresses.value.filter((a) => a.id !== created.id)]
    selectedAddressId.value = created.id
    applyAddress(created)
    form.value.phone = created.phone || form.value.phone
    closeAddressModal()
  } catch (e) {
    addressModalError.value = e?.response?.data?.error || e?.message || 'Failed to save address.'
  } finally {
    addressSaving.value = false
  }
}

async function placeOrder() {
  error.value = ''
  paymentError.value = ''
  const email = form.value.email.trim().toLowerCase()
  const shippingAddress = {
    country: form.value.shippingAddress.country.trim(),
    city: form.value.shippingAddress.city.trim(),
    addressLine1: form.value.shippingAddress.addressLine1.trim(),
    addressLine2: form.value.shippingAddress.addressLine2.trim(),
    postalCode: form.value.shippingAddress.postalCode.trim(),
  }

  if (!email) return (error.value = 'Email is required.')
  if (!isValidEmail(email)) return (error.value = 'Email is invalid.')
  if (!shippingAddress.country) return (error.value = 'Country is required.')
  if (!shippingAddress.city) return (error.value = 'City is required.')
  if (!shippingAddress.addressLine1) return (error.value = 'Address line 1 is required.')

  placing.value = true
  try {
    const orderRes = await http.post('/orders', {
      email,
      phone: form.value.phone.trim(),
      shippingAddress,
    })
    const orderId = orderRes.data.data.id
    await trackEvent('checkout_started', { meta: { orderId } })

    if (paymentMethod.value === 'cod') {
      await http.post(`/payments/orders/${orderId}/cod`)
      await trackEvent('purchase', { meta: { orderId, paymentMethod: 'cod' } })
      await router.push({ name: 'orderDetail', params: { id: orderId }, query: { payment: 'cod' } })
      return
    }

    const paymentRes = await http.post('/payments/checkout-session', { orderId })
    paymentIntent.value = paymentRes?.data?.data || null
    paymentStatus.value = 'pending'
    startPaymentPolling()
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to place order.'
    await loadCart()
  } finally {
    placing.value = false
  }
}

async function checkPaymentStatus() {
  if (!paymentIntent.value?.orderId) return
  polling.value = true
  paymentError.value = ''
  try {
    const res = await http.post(`/payments/orders/${paymentIntent.value.orderId}/sync`)
    const status = String(res?.data?.data?.paymentStatus || '').toLowerCase()
    paymentStatus.value = status
    if (status === 'paid') {
      stopPaymentPolling()
      await trackEvent('purchase', { meta: { orderId: paymentIntent.value.orderId } })
      await router.push({ name: 'orderDetail', params: { id: paymentIntent.value.orderId }, query: { payment: 'success' } })
    }
  } catch (e) {
    paymentError.value = e?.response?.data?.error || 'Failed to check payment status.'
    stopPaymentPolling()
  } finally {
    polling.value = false
  }
}

function startPaymentPolling() {
  stopPaymentPolling()
  pollingTimer = setInterval(() => {
    checkPaymentStatus()
  }, 5000)
}

function stopPaymentPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function closePaymentPanel() {
  stopPaymentPolling()
  paymentIntent.value = null
  paymentStatus.value = ''
  paymentError.value = ''
}

onMounted(async () => {
  await Promise.all([loadCart(), loadProfileAndAddresses()])
})
onBeforeUnmount(stopPaymentPolling)
</script>

<style scoped>
.checkout-page {
  background: linear-gradient(180deg, #fcfcfc 0%, #f6f7f9 100%);
}

.checkout-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.checkout-card,
.summary-card {
  border: 1px solid #e7e7ea;
  border-radius: 14px;
  background: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.section-step {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: #111827;
}

.required-mark {
  color: #dc2626;
}

.checkout-btn:disabled {
  opacity: 0.6;
}

.payment-method-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.payment-method-card {
  border: 1px solid #d7dde6;
  background: #fff;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  text-align: left;
  color: #111827;
}

.payment-method-card.active {
  border-color: #111827;
  box-shadow: 0 0 0 1px #111827 inset;
}

.payment-method-title {
  font-size: 0.9rem;
  font-weight: 650;
}

.payment-method-desc {
  margin-top: 0.2rem;
  font-size: 0.76rem;
  color: #64748b;
}

.saved-address-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.saved-address-card {
  border: 1px solid #d7dde6;
  background: #fff;
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  text-align: left;
  color: #111827;
}

.saved-address-card.active {
  border-color: #111827;
  box-shadow: 0 0 0 1px #111827 inset;
}

.saved-address-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
}

.saved-address-label {
  font-size: 0.86rem;
  font-weight: 650;
}

.saved-address-default {
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.12rem 0.44rem;
  background: #0f172a;
  color: #fff;
}

.saved-address-line {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.3;
}

.summary-card {
  padding: 1.1rem;
  position: sticky;
  top: 96px;
}

.summary-title {
  font-weight: 700;
  margin-bottom: 1rem;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.summary-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 0.65rem;
  align-items: center;
  padding: 0.45rem 0;
  border-bottom: 1px solid #f1f2f4;
}

.summary-item:last-child {
  border-bottom: 0;
}

.summary-item-image {
  width: 56px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.summary-item-title {
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.2;
}

.summary-item-meta {
  color: #6b7280;
  font-size: 0.78rem;
  line-height: 1.2;
}

.summary-item-price {
  font-size: 0.88rem;
  font-weight: 600;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.55rem;
}

.bakong-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1060;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.bakong-modal-card {
  width: min(480px, 100%);
  border: 1px solid #d7dde6;
  border-radius: 14px;
  background: #fff;
  padding: 1rem;
  box-shadow: 0 16px 38px rgba(15, 23, 42, 0.25);
}

.bakong-qr-image {
  width: 280px;
  height: 280px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 991.98px) {
  .checkout-title {
    font-size: 1.6rem;
  }

  .summary-card {
    position: static;
  }

  .payment-method-grid {
    grid-template-columns: 1fr;
  }
}
</style>
