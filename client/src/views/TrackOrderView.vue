<template>
  <div class="container py-5">
    <div class="brand-wordmark mb-1">APSARA STYLE</div>
    <h2 class="h4 mb-2">Track Order</h2>
    <div class="text-muted mb-4">Enter the checkout email and order code.</div>

    <div class="bg-white border rounded-4 p-4">
      <div class="row g-2">
        <div class="col-md-5">
          <label class="form-label">Email</label>
          <input class="form-control" v-model="form.email" type="email" placeholder="you@example.com" />
        </div>
        <div class="col-md-4">
          <label class="form-label">Order code</label>
          <input class="form-control text-uppercase" v-model="form.orderCode" placeholder="AS-ABC123DEF4" />
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-as w-100" @click="lookupOrder" :disabled="loading">
            {{ loading ? 'Looking up…' : 'Track order' }}
          </button>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>
    </div>

    <div v-if="order" class="bg-white border rounded-4 p-4 mt-4">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="fw-semibold">Order {{ order.id.slice(0, 8).toUpperCase() }}</div>
          <div class="text-muted small">Code: {{ order.order_code }}</div>
        </div>
        <div class="text-end">
          <div class="badge border text-uppercase" :class="statusBadgeClass(order.status)">{{ order.status }}</div>
          <div class="small text-muted mt-1">{{ new Date(order.created_at).toLocaleString() }}</div>
        </div>
      </div>

      <hr class="my-3" />
      <div class="fw-semibold mb-2">Order progress</div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span
          v-for="s in timelineStatuses"
          :key="s"
          class="badge border"
          :class="statusClass(s)"
        >
          {{ s }}
        </span>
      </div>
      <div v-if="order.status_history?.length" class="mb-3">
        <div class="text-muted small mb-2">Status history</div>
        <div class="small d-flex flex-column gap-1">
          <div v-for="h in order.status_history" :key="h.id">
            <span class="badge border text-uppercase me-2" :class="statusBadgeClass(h.status)">{{ h.status }}</span>
            {{ new Date(h.created_at).toLocaleString() }}
            <span v-if="h.note" class="text-muted">· {{ h.note }}</span>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="text-muted small">Email</div>
          <div class="fw-semibold">{{ order.email }}</div>
        </div>
        <div class="col-md-6">
          <div class="text-muted small">Phone</div>
          <div class="fw-semibold">{{ order.phone || '-' }}</div>
        </div>
      </div>

      <div class="mt-3">
        <div class="text-muted small mb-1">Shipping address</div>
        <div class="small">
          <div>{{ order.shipping_address?.addressLine1 }}</div>
          <div v-if="order.shipping_address?.addressLine2">{{ order.shipping_address?.addressLine2 }}</div>
          <div>{{ order.shipping_address?.city }}, {{ order.shipping_address?.country }}</div>
          <div>{{ order.shipping_address?.postalCode }}</div>
        </div>
      </div>

      <div class="table-responsive mt-4">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Item</th>
              <th>Variant</th>
              <th>Qty</th>
              <th class="text-end">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in order.items || []" :key="it.id">
              <td>{{ it.title_snapshot }}</td>
              <td class="text-muted small">{{ it.color }} · {{ it.size }}</td>
              <td>{{ it.qty }}</td>
              <td class="text-end">${{ Number(it.price_snapshot).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end gap-4 mt-3">
        <div><span class="text-muted">Subtotal:</span> ${{ Number(order.subtotal).toFixed(2) }}</div>
        <div class="fw-semibold"><span class="text-muted">Total:</span> ${{ Number(order.total).toFixed(2) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { http } from '@/api/http'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const order = ref(null)
const timelineStatuses = ['pending', 'paid', 'packed', 'shipped', 'delivered']
const form = ref({
  email: '',
  orderCode: '',
})

function statusRank(s) {
  const i = timelineStatuses.indexOf(String(s || '').toLowerCase())
  return i === -1 ? -1 : i
}

function statusClass(step) {
  const current = String(order.value?.status || '').toLowerCase()
  if (current === 'cancelled') {
    return step === 'pending' ? 'text-bg-light' : 'text-bg-secondary'
  }
  return statusRank(step) <= statusRank(current) ? 'text-bg-success' : 'text-bg-light'
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'pending') return 'text-bg-secondary'
  if (s === 'paid') return 'text-bg-info'
  if (s === 'packed') return 'text-bg-primary'
  if (s === 'shipped') return 'text-bg-warning'
  if (s === 'delivered') return 'text-bg-success'
  if (s === 'cancelled') return 'text-bg-danger'
  return 'text-bg-light'
}

async function lookupOrder() {
  error.value = ''
  order.value = null

  const email = form.value.email.trim().toLowerCase()
  const orderCode = form.value.orderCode.trim().toUpperCase()
  if (!email) return (error.value = 'Email is required.')
  if (!orderCode) return (error.value = 'Order code is required.')

  loading.value = true
  try {
    const res = await http.post('/orders/lookup', { email, orderCode })
    order.value = res.data.data
  } catch (e) {
    error.value = e?.response?.data?.error || 'Order not found.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const emailQ = String(route.query.email || '').trim().toLowerCase()
  const codeQ = String(route.query.code || '').trim().toUpperCase()
  if (!emailQ && !codeQ) return

  form.value.email = emailQ
  form.value.orderCode = codeQ

  if (emailQ && codeQ) {
    await lookupOrder()
  }
})
</script>
