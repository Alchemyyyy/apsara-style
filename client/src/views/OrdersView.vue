<template>
  <div class="orders-page">
    <div class="container py-5">
      <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div class="brand-wordmark mb-1">APSARA STYLE</div>
          <h2 class="orders-title mb-1">My Orders</h2>
          <p class="text-muted mb-0">Track and manage your recent purchases.</p>
        </div>
        <RouterLink class="btn btn-outline-dark" :to="{ name: 'home' }">Continue shopping</RouterLink>
      </div>

      <div class="lookup-card p-3 mt-4">
        <div class="fw-semibold mb-2">Lookup order by email + code</div>
        <div class="row g-2">
          <div class="col-md-5">
            <input class="form-control" v-model="lookup.email" type="email" placeholder="Email used at checkout" />
          </div>
          <div class="col-md-4">
            <input class="form-control text-uppercase" v-model="lookup.orderCode" placeholder="Order code (e.g. AS-ABC123DEF4)" />
          </div>
          <div class="col-md-3">
            <button class="btn btn-outline-dark w-100" @click="lookupOrder" :disabled="lookupBusy">
              {{ lookupBusy ? 'Looking up…' : 'Lookup order' }}
            </button>
          </div>
        </div>
        <div v-if="lookupError" class="alert alert-danger mt-3 mb-0">{{ lookupError }}</div>
        <div v-if="lookupResult" class="alert alert-success mt-3 mb-0">
          Found order {{ shortOrderId(lookupResult.id) }} · code {{ lookupResult.order_code }}
          <div class="small mt-2">
            Status:
            <span class="status-pill" :class="statusBadgeClass(lookupResult.status)">{{ lookupResult.status }}</span>
            · Total: ${{ Number(lookupResult.total).toFixed(2) }} ·
            Date: {{ formatDateTime(lookupResult.created_at) }}
          </div>
        </div>

        <div v-if="lookupResult" class="lookup-detail-card p-3 mt-3">
          <div class="fw-semibold mb-3">Lookup result details</div>

          <div class="row g-3 mb-3">
            <div class="col-md-6">
              <div class="text-muted small">Email</div>
              <div class="fw-semibold">{{ lookupResult.email }}</div>
            </div>
            <div class="col-md-6">
              <div class="text-muted small">Phone</div>
              <div class="fw-semibold">{{ lookupResult.phone || '-' }}</div>
            </div>
          </div>

          <div class="text-muted small mb-1">Shipping address</div>
          <div class="small mb-3">
            <div>{{ lookupResult.shipping_address?.addressLine1 }}</div>
            <div v-if="lookupResult.shipping_address?.addressLine2">{{ lookupResult.shipping_address?.addressLine2 }}</div>
            <div>{{ lookupResult.shipping_address?.city }}, {{ lookupResult.shipping_address?.country }}</div>
            <div>{{ lookupResult.shipping_address?.postalCode }}</div>
          </div>

          <div class="table-responsive">
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
                <tr v-for="it in lookupResult.items || []" :key="it.id">
                  <td>{{ it.title_snapshot }}</td>
                  <td class="text-muted small">{{ it.color }} · {{ it.size }}</td>
                  <td>{{ it.qty }}</td>
                  <td class="text-end">${{ Number(it.price_snapshot).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-content-end gap-4 mt-3">
            <div><span class="text-muted">Subtotal:</span> ${{ Number(lookupResult.subtotal).toFixed(2) }}</div>
            <div class="fw-semibold"><span class="text-muted">Total:</span> ${{ Number(lookupResult.total).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-muted py-5 text-center">Loading your orders…</div>

      <template v-else>
        <section class="orders-overview mt-4">
          <article class="overview-card">
            <div class="overview-label">Total Orders</div>
            <div class="overview-value">{{ orders.length }}</div>
          </article>
          <article class="overview-card">
            <div class="overview-label">Open Orders</div>
            <div class="overview-value">{{ openOrderCount }}</div>
          </article>
          <article class="overview-card">
            <div class="overview-label">Completed</div>
            <div class="overview-value">{{ deliveredOrderCount }}</div>
          </article>
        </section>

        <div class="status-filter mt-4">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            class="btn btn-sm"
            :class="selectedStatus === option.value ? 'btn-dark' : 'btn-outline-dark'"
            @click="selectedStatus = option.value"
          >
            {{ option.label }} ({{ option.count }})
          </button>
        </div>

        <div class="orders-list mt-4">
          <article v-if="filteredOrders.length === 0" class="order-card order-empty">
            <div class="text-muted">No orders in this filter yet.</div>
          </article>

          <article v-for="o in filteredOrders" :key="o.id" class="order-card">
            <div class="order-head">
              <div>
                <div class="order-id">Order {{ shortOrderId(o.id) }}</div>
                <div class="order-code">Code: {{ o.order_code || '-' }}</div>
              </div>
              <span class="status-pill" :class="statusBadgeClass(o.status)">{{ o.status }}</span>
            </div>

            <div class="order-meta-grid">
              <div>
                <div class="meta-label">Date</div>
                <div class="meta-value">{{ formatDateTime(o.created_at) }}</div>
              </div>
              <div>
                <div class="meta-label">Total</div>
                <div class="meta-value">${{ Number(o.total).toFixed(2) }}</div>
              </div>
            </div>

            <div class="order-actions">
              <RouterLink class="btn btn-outline-dark btn-sm" :to="{ name: 'orderDetail', params: { id: o.id } }">
                View details
              </RouterLink>
              <RouterLink class="btn btn-dark btn-sm" :to="{ name: 'products', params: { gender: 'men' } }">
                Buy again
              </RouterLink>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { http } from '@/api/http'

const orders = ref([])
const loading = ref(false)
const selectedStatus = ref('all')
const lookupBusy = ref(false)
const lookupError = ref('')
const lookupResult = ref(null)
const lookup = ref({
  email: '',
  orderCode: '',
})

const openStatuses = ['pending', 'paid', 'packed', 'shipped']

const openOrderCount = computed(() =>
  orders.value.filter((o) => openStatuses.includes(String(o.status || '').toLowerCase())).length
)

const deliveredOrderCount = computed(() =>
  orders.value.filter((o) => String(o.status || '').toLowerCase() === 'delivered').length
)

const statusOptions = computed(() => {
  const source = orders.value.map((o) => String(o.status || '').toLowerCase())
  return [
    { value: 'all', label: 'All', count: orders.value.length },
    { value: 'open', label: 'Open', count: source.filter((s) => openStatuses.includes(s)).length },
    { value: 'delivered', label: 'Delivered', count: source.filter((s) => s === 'delivered').length },
    { value: 'cancelled', label: 'Cancelled', count: source.filter((s) => s === 'cancelled').length },
  ]
})

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') return orders.value
  if (selectedStatus.value === 'open') {
    return orders.value.filter((o) => openStatuses.includes(String(o.status || '').toLowerCase()))
  }
  return orders.value.filter((o) => String(o.status || '').toLowerCase() === selectedStatus.value)
})

function shortOrderId(id) {
  return String(id || '').slice(0, 8).toUpperCase()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString()
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

async function load() {
  loading.value = true
  try {
    const res = await http.get('/orders')
    orders.value = res.data.data
  } finally {
    loading.value = false
  }
}

async function lookupOrder() {
  lookupError.value = ''
  lookupResult.value = null
  const email = lookup.value.email.trim().toLowerCase()
  const orderCode = lookup.value.orderCode.trim().toUpperCase()
  if (!email) return (lookupError.value = 'Email is required.')
  if (!orderCode) return (lookupError.value = 'Order code is required.')

  lookupBusy.value = true
  try {
    const res = await http.post('/orders/lookup', { email, orderCode })
    lookupResult.value = res.data.data
  } catch (e) {
    lookupError.value = e?.response?.data?.error || 'Order not found.'
  } finally {
    lookupBusy.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.orders-page {
  background: linear-gradient(180deg, #fcfcfc 0%, #f6f7f9 100%);
}

.orders-title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.lookup-card,
.lookup-detail-card,
.order-card,
.overview-card {
  border: 1px solid #e7e7ea;
  border-radius: 14px;
  background: #fff;
}

.orders-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.overview-card {
  padding: 1rem 1.1rem;
}

.overview-label {
  font-size: 0.78rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.overview-value {
  margin-top: 0.2rem;
  font-size: 1.55rem;
  font-weight: 700;
}

.status-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.order-card {
  padding: 1rem;
}

.order-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 104px;
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.order-id {
  font-weight: 700;
}

.order-code {
  color: #6b7280;
  font-size: 0.84rem;
  margin-top: 0.15rem;
}

.order-meta-grid {
  margin-top: 0.85rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
}

.meta-value {
  font-weight: 600;
  margin-top: 0.15rem;
}

.order-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
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

@media (max-width: 991.98px) {
  .orders-title {
    font-size: 1.6rem;
  }

  .orders-overview {
    grid-template-columns: 1fr;
  }
}
</style>
