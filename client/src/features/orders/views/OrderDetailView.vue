<template>
  <div class="order-detail-page">
    <div v-if="order" class="container py-5">
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <BrandLogo size="md" class="mb-1" />
          <h2 class="order-title mb-1">Order {{ shortOrderId(order.id) }}</h2>
          <div class="text-muted small">
            Code: <span class="fw-semibold">{{ order.order_code }}</span> ·
            Date: {{ formatDateTime(order.created_at) }}
          </div>
        </div>
        <div class="d-flex gap-2">
          <button
            v-if="canPayNow"
            class="btn btn-dark"
            :disabled="payBusy"
            @click="payNow"
          >
            {{ payBusy ? 'Redirecting…' : 'Pay now' }}
          </button>
          <button
            v-if="canCancel"
            class="btn btn-outline-danger"
            :disabled="cancelBusy"
            @click="cancelOrder"
          >
            {{ cancelBusy ? 'Cancelling…' : 'Cancel order' }}
          </button>
          <button
            v-if="canRequestReturn"
            class="btn btn-outline-dark"
            :disabled="returnBusy"
            @click="openReturnModal"
          >
            {{ returnBusy ? 'Submitting…' : 'Request return' }}
          </button>
          <RouterLink class="btn btn-outline-dark" :to="{ name: 'orders' }">All orders</RouterLink>
        </div>
      </div>

      <section class="progress-card p-3 p-md-4 mt-4">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <div class="fw-semibold">Order Progress</div>
            <div class="text-muted small">
              Current status:
              <span class="status-pill" :class="statusBadgeClass(order.status)">{{ order.status }}</span>
            </div>
          </div>
          <div class="fw-semibold">${{ Number(order.total).toFixed(2) }}</div>
        </div>

        <div class="progress-timeline mt-3">
          <div v-for="(s, index) in timelineStatuses" :key="s" class="timeline-step" :class="timelineStepClass(s)">
            <div class="timeline-node">{{ index + 1 }}</div>
            <div class="timeline-label">{{ s }}</div>
          </div>
        </div>

        <div v-if="order.status_history?.length" class="mt-4">
          <div class="text-muted small mb-2">Status history</div>
          <div class="history-list">
            <div v-for="h in order.status_history" :key="h.id" class="history-item">
              <span class="status-pill" :class="statusBadgeClass(h.status)">{{ h.status }}</span>
              <span>{{ formatDateTime(h.created_at) }}</span>
              <span v-if="h.note" class="text-muted">· {{ h.note }}</span>
            </div>
          </div>
        </div>
        <div v-if="cancelError" class="alert alert-danger mt-3 mb-0">{{ cancelError }}</div>
        <div v-if="cancelSuccess" class="alert alert-success mt-3 mb-0">{{ cancelSuccess }}</div>
        <div v-if="paymentNotice" class="alert mt-3 mb-0" :class="paymentNotice.type === 'success' ? 'alert-success' : 'alert-warning'">
          {{ paymentNotice.text }}
        </div>
        <div v-if="returnError" class="alert alert-danger mt-3 mb-0">{{ returnError }}</div>
        <div v-if="returnSuccess" class="alert alert-success mt-3 mb-0">{{ returnSuccess }}</div>
        <div v-if="latestReturnRequest" class="alert alert-info mt-3 mb-0">
          Return request:
          <span class="fw-semibold text-uppercase">{{ latestReturnRequest.status }}</span>
          · Reason: {{ returnReasonLabel(latestReturnRequest.reason) }}
          <span v-if="latestReturnNote">· Note: {{ latestReturnNote }}</span>
          <div class="small mt-1">Created: {{ formatDateTime(latestReturnRequest.created_at) }}</div>
          <div v-if="latestReturnRequest.history?.length" class="small mt-2">
            <div class="fw-semibold mb-1">Return timeline</div>
            <div class="d-flex flex-column gap-1">
              <div v-for="h in latestReturnRequest.history" :key="h.id">
                <span class="status-pill" :class="returnStatusBadgeClass(h.status)">{{ h.status }}</span>
                {{ formatDateTime(h.created_at) }}
                <span v-if="h.note" class="text-muted">· {{ h.note }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="row g-4 mt-1">
        <div class="col-lg-7">
          <section class="detail-card p-4">
            <div class="fw-semibold mb-3">Items</div>

            <div class="items-list">
              <article v-for="it in order.items" :key="it.id" class="order-item">
                <img :src="it.hero_image" :alt="it.title_snapshot" class="order-item-image" />
                <div class="order-item-main">
                  <div class="order-item-title">{{ it.title_snapshot }}</div>
                  <div class="order-item-meta">Color: {{ it.color }} · Size: {{ it.size }}</div>
                  <div class="order-item-meta">Qty: {{ it.qty }}</div>
                </div>
                <div class="order-item-price">${{ Number(it.price_snapshot).toFixed(2) }}</div>
              </article>
            </div>

            <hr class="my-4" />

            <div class="total-row">
              <span>Subtotal</span>
              <span>${{ Number(order.subtotal).toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div class="total-row fw-semibold mt-2">
              <span>Total</span>
              <span>${{ Number(order.total).toFixed(2) }}</span>
            </div>
          </section>
        </div>

        <div class="col-lg-5">
          <section class="detail-card p-4">
            <div class="fw-semibold mb-3">Shipping</div>
            <div class="small text-muted">Email</div>
            <div class="fw-semibold mb-2">{{ order.email }}</div>
            <div class="small text-muted">Phone</div>
            <div class="fw-semibold mb-3">{{ order.phone || '-' }}</div>

            <div class="small text-muted">Payment Method</div>
            <div class="fw-semibold mb-3">
              {{
                String(order.payment_provider || '').toLowerCase() === 'cod'
                  ? 'Cash on Delivery'
                  : (order.payment_provider || 'Bakong')
              }}
              · {{ String(order.payment_status || 'unpaid').toUpperCase() }}
            </div>

            <div class="small text-muted">Address</div>
            <div class="address-block mt-1">
              <div>{{ order.shipping_address?.addressLine1 }}</div>
              <div v-if="order.shipping_address?.addressLine2">{{ order.shipping_address.addressLine2 }}</div>
              <div>{{ order.shipping_address?.city }}, {{ order.shipping_address?.country }}</div>
              <div>{{ order.shipping_address?.postalCode || '-' }}</div>
            </div>

            <div class="alert alert-success mt-4 mb-0">
              Order placed successfully.
              <div class="small mt-2">
                Save your order code: <span class="fw-semibold">{{ order.order_code }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div v-if="paymentIntent" class="return-modal-backdrop" @click.self="closePaymentPanel">
        <div class="return-modal-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Bakong Payment</h5>
            <button class="btn btn-sm btn-outline-dark" :disabled="payBusy" @click="closePaymentPanel">x</button>
          </div>
          <div class="small text-muted mb-2">Reference: <span class="fw-semibold">{{ paymentIntent.paymentReference }}</span></div>
          <div class="small text-muted mb-3">Total: <span class="fw-semibold">{{ paymentIntent.currency }} {{ Number(paymentIntent.amount).toFixed(2) }}</span></div>
          <div class="text-center mb-3">
            <img :src="paymentIntent.qrImageUrl" alt="Bakong KHQR" class="bakong-qr-image" />
          </div>
          <div v-if="paymentPanelError" class="alert alert-danger py-2">{{ paymentPanelError }}</div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-dark btn-sm" :disabled="payBusy" @click="checkOrderPaymentStatus">
              {{ payBusy ? 'Checking...' : 'I have paid, check status' }}
            </button>
            <a class="btn btn-outline-dark btn-sm" :href="paymentIntent.deepLink" target="_blank" rel="noopener">Open Bakong Link</a>
          </div>
        </div>
      </div>

      <div v-if="showReturnModal" class="return-modal-backdrop" @click.self="closeReturnModal">
        <div class="return-modal-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">Request Return</h5>
            <button class="btn btn-sm btn-outline-dark" @click="closeReturnModal">x</button>
          </div>

          <div class="mb-3">
            <label class="form-label">Reason <span class="text-danger">*</span></label>
            <select class="form-select" v-model="returnForm.reason">
              <option value="">Select a reason</option>
              <option v-for="r in returnReasons" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Note (optional)</label>
            <textarea
              class="form-control"
              rows="3"
              v-model="returnForm.note"
              placeholder="Tell us more about the issue..."
            ></textarea>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-outline-dark" :disabled="returnBusy" @click="closeReturnModal">Cancel</button>
            <button class="btn btn-dark" :disabled="returnBusy" @click="submitReturnRequest">
              {{ returnBusy ? 'Submitting…' : 'Submit request' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="container py-5 text-center text-muted">Loading order…</div>
  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '@/shared/api/http'

const props = defineProps({ id: { type: String, required: true } })
const route = useRoute()
const order = ref(null)
const timelineStatuses = ['pending', 'paid', 'packed', 'shipped', 'delivered']
const cancelBusy = ref(false)
const cancelError = ref('')
const cancelSuccess = ref('')
const payBusy = ref(false)
const paymentIntent = ref(null)
const paymentPanelError = ref('')
const returnBusy = ref(false)
const returnError = ref('')
const returnSuccess = ref('')
const showReturnModal = ref(false)
const returnForm = ref({ reason: '', note: '' })
const returnReasons = [
  { value: 'damaged', label: 'Damaged item' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'size_issue', label: 'Size issue' },
  { value: 'other', label: 'Other' },
]

const canCancel = computed(() => {
  const status = String(order.value?.status || '').toLowerCase()
  return ['pending', 'paid', 'packed'].includes(status)
})

const latestReturnRequest = computed(() => {
  const list = Array.isArray(order.value?.return_requests) ? order.value.return_requests : []
  return list[0] || null
})

const hasActiveReturnRequest = computed(() => {
  const status = String(latestReturnRequest.value?.status || '').toLowerCase()
  return ['requested', 'approved'].includes(status)
})

const latestReturnNote = computed(() => {
  const history = Array.isArray(latestReturnRequest.value?.history) ? latestReturnRequest.value.history : []
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const note = String(history[i]?.note || '').trim()
    if (note) return note
  }
  const fallback = String(latestReturnRequest.value?.note || '').trim()
  return fallback || ''
})

const canRequestReturn = computed(() => {
  const status = String(order.value?.status || '').toLowerCase()
  return status === 'delivered' && !hasActiveReturnRequest.value
})

const canPayNow = computed(() => {
  const orderStatus = String(order.value?.status || '').toLowerCase()
  const paymentStatus = String(order.value?.payment_status || '').toLowerCase()
  const paymentProvider = String(order.value?.payment_provider || '').toLowerCase()
  if (orderStatus === 'cancelled') return false
  if (paymentProvider === 'cod') return false
  return paymentStatus !== 'paid'
})

const paymentNotice = computed(() => {
  const value = String(route.query?.payment || '').toLowerCase()
  if (value === 'success') return { type: 'success', text: 'Payment succeeded. Your order is confirmed.' }
  if (value === 'cancel') return { type: 'warning', text: 'Payment was cancelled. You can try again.' }
  if (value === 'cod') return { type: 'success', text: 'Order placed with Cash on Delivery. Please pay when your order arrives.' }
  return null
})
let paymentPollingTimer = null

function statusRank(s) {
  const i = timelineStatuses.indexOf(String(s || '').toLowerCase())
  return i === -1 ? -1 : i
}

function timelineStepClass(step) {
  const current = String(order.value?.status || '').toLowerCase()
  if (current === 'cancelled') {
    return step === 'pending' ? 'timeline-active' : 'timeline-inactive'
  }
  return statusRank(step) <= statusRank(current) ? 'timeline-active' : 'timeline-inactive'
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'pill-pending'
  if (s === 'paid') return 'pill-paid'
  if (s === 'packed') return 'pill-packed'
  if (s === 'shipped') return 'pill-shipped'
  if (s === 'delivered') return 'pill-delivered'
  if (s === 'cancelled') return 'pill-cancelled'
  return 'pill-default'
}

function returnStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'requested') return 'pill-pending'
  if (s === 'approved') return 'pill-delivered'
  if (s === 'rejected') return 'pill-cancelled'
  if (s === 'resolved') return 'pill-packed'
  return 'pill-default'
}

function shortOrderId(id) {
  return String(id || '').slice(0, 8).toUpperCase()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString()
}

async function load() {
  const res = await http.get(`/orders/${props.id}`)
  order.value = res.data.data
}

async function cancelOrder() {
  cancelError.value = ''
  cancelSuccess.value = ''
  if (!canCancel.value) return
  if (!window.confirm('Cancel this order? This action cannot be undone.')) return

  cancelBusy.value = true
  try {
    const res = await http.patch(`/orders/${props.id}/cancel`)
    order.value = res.data.data
    cancelSuccess.value = 'Order cancelled successfully.'
  } catch (e) {
    cancelError.value = e?.response?.data?.error || 'Failed to cancel order.'
  } finally {
    cancelBusy.value = false
  }
}

async function payNow() {
  cancelError.value = ''
  cancelSuccess.value = ''
  returnError.value = ''
  returnSuccess.value = ''
  if (!canPayNow.value) return

  payBusy.value = true
  paymentPanelError.value = ''
  try {
    const res = await http.post('/payments/checkout-session', { orderId: props.id })
    paymentIntent.value = res?.data?.data || null
    startPaymentPolling()
  } catch (e) {
    paymentPanelError.value = e?.response?.data?.error || 'Failed to initialize payment.'
  } finally {
    payBusy.value = false
  }
}

async function checkOrderPaymentStatus() {
  payBusy.value = true
  paymentPanelError.value = ''
  try {
    const res = await http.post(`/payments/orders/${props.id}/sync`)
    const status = String(res?.data?.data?.paymentStatus || '').toLowerCase()
    if (status === 'paid') {
      stopPaymentPolling()
      closePaymentPanel()
      await load()
    }
  } catch (e) {
    paymentPanelError.value = e?.response?.data?.error || 'Failed to check payment status.'
    stopPaymentPolling()
  } finally {
    payBusy.value = false
  }
}

function startPaymentPolling() {
  stopPaymentPolling()
  paymentPollingTimer = setInterval(() => {
    checkOrderPaymentStatus()
  }, 5000)
}

function stopPaymentPolling() {
  if (paymentPollingTimer) {
    clearInterval(paymentPollingTimer)
    paymentPollingTimer = null
  }
}

function closePaymentPanel() {
  stopPaymentPolling()
  paymentIntent.value = null
  paymentPanelError.value = ''
}

function returnReasonLabel(reason) {
  const found = returnReasons.find((r) => r.value === String(reason || '').toLowerCase())
  return found?.label || reason || '-'
}

function openReturnModal() {
  returnError.value = ''
  returnSuccess.value = ''
  returnForm.value = { reason: '', note: '' }
  showReturnModal.value = true
}

function closeReturnModal() {
  if (returnBusy.value) return
  showReturnModal.value = false
}

async function submitReturnRequest() {
  returnError.value = ''
  returnSuccess.value = ''
  if (!canRequestReturn.value) return
  if (!returnForm.value.reason) {
    returnError.value = 'Please select a return reason.'
    return
  }

  returnBusy.value = true
  try {
    const res = await http.post(`/orders/${props.id}/returns`, {
      reason: returnForm.value.reason,
      note: returnForm.value.note,
    })
    order.value = res.data.data
    returnSuccess.value = 'Return request submitted. Our team will contact you soon.'
    showReturnModal.value = false
  } catch (e) {
    returnError.value = e?.response?.data?.error || 'Failed to submit return request.'
  } finally {
    returnBusy.value = false
  }
}

onMounted(load)
onBeforeUnmount(stopPaymentPolling)
</script>

<style scoped>
.order-detail-page {
  background: #ffffff;
}

.order-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.progress-card,
.detail-card {
  border: 1px solid var(--as-border);
  border-radius: 14px;
  background: #fff;
}

.progress-timeline {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}

.timeline-step {
  text-align: center;
}

.timeline-node {
  width: 34px;
  height: 34px;
  margin: 0 auto 0.45rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}

.timeline-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.timeline-active .timeline-node {
  background: #111827;
  color: #fff;
  border-color: #111827;
}

.timeline-active .timeline-label {
  color: #111827;
  font-weight: 600;
}

.timeline-inactive .timeline-node {
  background: #f8fafc;
  color: #64748b;
}

.timeline-inactive .timeline-label {
  color: #64748b;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.history-item {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.order-item {
  display: grid;
  grid-template-columns: 84px 1fr auto;
  align-items: center;
  gap: 0.75rem;
}

.order-item-image {
  width: 84px;
  height: 112px;
  border-radius: 10px;
  object-fit: cover;
}

.order-item-title {
  font-weight: 600;
}

.order-item-meta {
  font-size: 0.84rem;
  color: #6b7280;
}

.order-item-price {
  font-weight: 600;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.55rem;
}

.address-block {
  color: #4b5563;
  font-size: 0.88rem;
  line-height: 1.45;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.2rem 0.62rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  border: 1px solid transparent;
}

.pill-pending {
  color: #334155;
  background: #eef2f7;
  border-color: #d6deea;
}

.pill-paid {
  color: #0c4a6e;
  background: #e0f2fe;
  border-color: #bae6fd;
}

.pill-packed {
  color: #1e3a8a;
  background: #e0e7ff;
  border-color: #c7d2fe;
}

.pill-shipped {
  color: #854d0e;
  background: #fef3c7;
  border-color: #fde68a;
}

.pill-delivered {
  color: #166534;
  background: #dcfce7;
  border-color: #bbf7d0;
}

.pill-cancelled {
  color: #991b1b;
  background: #fee2e2;
  border-color: #fecaca;
}

.pill-default {
  color: #334155;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.return-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1050;
}

.return-modal-card {
  width: min(520px, 100%);
  border-radius: 14px;
  border: 1px solid var(--as-border);
  background: #fff;
  padding: 1rem;
}

.bakong-qr-image {
  width: 280px;
  height: 280px;
  max-width: 100%;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

@media (max-width: 991.98px) {
  .order-title {
    font-size: 1.6rem;
  }

  .progress-timeline {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .order-item {
    grid-template-columns: 72px 1fr;
  }

  .order-item-image {
    width: 72px;
    height: 96px;
  }

  .order-item-price {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
