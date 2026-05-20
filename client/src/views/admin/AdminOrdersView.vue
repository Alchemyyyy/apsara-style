<template>
  <AdminDashboardShell subtitle="Track status transitions and manage order operations.">
    <AdminToastStack :toasts="toasts" @close="removeToast" />
    <template #actions>
      <div class="d-flex gap-2">
        <input class="form-control" v-model="q" placeholder="Search code/email/id..." style="width: 260px" @keyup.enter="load" />
        <select class="form-select" v-model="status" style="width: 170px" @change="onFilterChange">
          <option value="">All statuses</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </template>

    <div v-if="loading" class="text-muted py-5 text-center">Loading orders…</div>

    <div v-else class="admin-panel-card admin-table-card p-3 mt-3">
      <div v-if="orders.length === 0" class="text-muted p-3">No orders found.</div>

      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Order</th>
              <th>Code</th>
              <th>Email</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td class="fw-semibold">{{ o.id.slice(0, 8).toUpperCase() }}</td>
              <td class="text-muted small">{{ o.order_code }}</td>
              <td class="text-muted small">{{ o.email }}</td>
              <td>{{ o.total_items }}</td>
              <td class="fw-semibold">${{ Number(o.total).toFixed(2) }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge border text-uppercase" :class="statusBadgeClass(o.status)">{{ o.status }}</span>
                  <select class="form-select form-select-sm" v-model="draftStatus[o.id]" style="max-width: 150px;">
                    <option v-for="s in allowedStatusesFor(o)" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
              </td>
              <td class="text-muted small">{{ new Date(o.created_at).toLocaleString() }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" @click="openOrderDetail(o)">View</button>
                  <button class="btn btn-outline-dark" :disabled="busyId === o.id || draftStatus[o.id] === o.status" @click="saveStatus(o)">
                    {{ busyId === o.id ? 'Saving…' : 'Save' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        :model-value="page"
        :total-pages="meta.totalPages || 1"
        :loading="loading"
        active-class="btn-as"
        inactive-class="btn-outline-secondary"
        nav-class="btn-outline-dark"
        @update:modelValue="onPageChange"
      />
    </div>

    <div v-if="detailOpen" class="admin-type-modal-backdrop" @click.self="closeOrderDetail">
      <div class="admin-type-modal order-detail-modal">
        <div class="admin-type-modal-header">
          <h4 class="h6 mb-0">Order {{ detail?.order_code || '' }}</h4>
          <button class="modal-close-btn" type="button" aria-label="Close" @click="closeOrderDetail">&times;</button>
        </div>

        <div v-if="detailLoading" class="admin-type-modal-body text-muted">Loading order detail...</div>
        <div v-else-if="detail" class="admin-type-modal-body">
          <div class="row g-3 mb-2">
            <div class="col-md-3">
              <div class="small text-muted">Status</div>
              <span class="badge border text-uppercase" :class="statusBadgeClass(detail.status)">{{ detail.status }}</span>
            </div>
            <div class="col-md-3">
              <div class="small text-muted">Email</div>
              <div class="fw-semibold">{{ detail.email || '-' }}</div>
            </div>
            <div class="col-md-3">
              <div class="small text-muted">Phone</div>
              <div class="fw-semibold">{{ detail.phone || '-' }}</div>
            </div>
            <div class="col-md-3">
              <div class="small text-muted">Created</div>
              <div class="fw-semibold">{{ new Date(detail.created_at).toLocaleString() }}</div>
            </div>
            <div class="col-md-4">
              <div class="small text-muted">Subtotal</div>
              <div class="fw-semibold">${{ Number(detail.subtotal || 0).toFixed(2) }}</div>
            </div>
            <div class="col-md-4">
              <div class="small text-muted">Shipping</div>
              <div class="fw-semibold">${{ Number(detail.shipping_fee || 0).toFixed(2) }}</div>
            </div>
            <div class="col-md-4">
              <div class="small text-muted">Total</div>
              <div class="fw-semibold">${{ Number(detail.total || 0).toFixed(2) }}</div>
            </div>
            <div class="col-12">
              <div class="small text-muted">Shipping Address</div>
              <div class="order-address">
                <div v-for="(line, idx) in formatShippingAddressLines(detail.shipping_address)" :key="`addr-${idx}`">{{ line }}</div>
              </div>
            </div>
          </div>

          <div class="small text-muted mb-2">Items</div>
          <div class="table-responsive mb-3">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="it in detail.items || []" :key="it.id">
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img v-if="it.hero_image" :src="it.hero_image" class="order-item-image" />
                      <div class="fw-semibold">{{ it.title_snapshot }}</div>
                    </div>
                  </td>
                  <td>{{ it.color || '-' }} / {{ it.size || '-' }}</td>
                  <td>{{ it.sku || '-' }}</td>
                  <td>{{ it.qty }}</td>
                  <td>${{ Number(it.price_snapshot || 0).toFixed(2) }}</td>
                  <td class="fw-semibold">${{ Number((Number(it.price_snapshot || 0) * Number(it.qty || 0))).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="small text-muted mb-2">Status History</div>
          <div v-if="(detail.history || []).length" class="order-history-list">
            <div v-for="h in detail.history" :key="h.id" class="order-history-item">
              <span class="badge border text-uppercase" :class="statusBadgeClass(h.status)">{{ h.status }}</span>
              <span class="text-muted small">{{ new Date(h.created_at).toLocaleString() }}</span>
              <span class="small">{{ h.note || '-' }}</span>
            </div>
          </div>
          <div v-else class="text-muted small">No status history.</div>
        </div>

        <div class="admin-type-modal-footer">
          <button class="btn btn-outline-dark btn-sm" @click="closeOrderDetail">Close</button>
        </div>
      </div>
    </div>
  </AdminDashboardShell>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/api/adminHttp'
import AdminDashboardShell from '@/components/admin/AdminDashboardShell.vue'
import AdminToastStack from '@/components/admin/AdminToastStack.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { toasts, success, error, removeToast } = useToast()
const loading = ref(false)
const busyId = ref('')
const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

const orders = ref([])
const statuses = ref(['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'])
const transitions = ref({})
const draftStatus = ref({})

const meta = ref({ page: 1, totalPages: 1 })
const page = ref(1)
const q = ref('')
const status = ref('')

function statusBadgeClass(statusValue) {
  const s = String(statusValue || '').toLowerCase()
  if (s === 'pending') return 'text-bg-secondary'
  if (s === 'paid') return 'text-bg-info'
  if (s === 'packed') return 'text-bg-primary'
  if (s === 'shipped') return 'text-bg-warning'
  if (s === 'delivered') return 'text-bg-success'
  if (s === 'cancelled') return 'text-bg-danger'
  return 'text-bg-light'
}

function allowedStatusesFor(order) {
  const current = String(order?.status || '').toLowerCase()
  const allowed = Array.isArray(transitions.value[current]) ? transitions.value[current] : []
  return [current, ...allowed.filter((s) => s !== current)]
}

function hydrateDrafts() {
  const next = {}
  for (const o of orders.value) next[o.id] = o.status
  draftStatus.value = next
}

async function load() {
  loading.value = true
  try {
    const res = await adminHttp.get('/orders', {
      params: {
        page: page.value,
        limit: 20,
        q: q.value || undefined,
        status: status.value || undefined,
      },
    })
    orders.value = res.data.data
    meta.value = res.data.meta
    if (Array.isArray(res.data.statuses) && res.data.statuses.length) statuses.value = res.data.statuses
    if (res.data.transitions && typeof res.data.transitions === 'object') transitions.value = res.data.transitions
    hydrateDrafts()
  } catch (e) {
    router.push({ name: 'adminLogin' })
  } finally {
    loading.value = false
  }
}

async function saveStatus(order) {
  const nextStatus = draftStatus.value[order.id]
  if (!nextStatus || nextStatus === order.status) return

  busyId.value = order.id
  try {
    const res = await adminHttp.patch(`/orders/${order.id}/status`, { status: nextStatus })
    const updated = res.data.data
    const idx = orders.value.findIndex((o) => o.id === updated.id)
    if (idx !== -1) {
      orders.value[idx].status = updated.status
      draftStatus.value[updated.id] = updated.status
    }
    success(`Updated order ${updated.order_code} to ${updated.status}.`)
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to update status.')
  } finally {
    busyId.value = ''
  }
}

function formatShippingAddressLines(address) {
  if (!address) return ['-']

  if (typeof address === 'string') {
    const s = address.trim()
    return s ? [s] : ['-']
  }

  const a = address || {}
  const lines = []

  const name = [a.fullName || a.full_name, a.label].filter(Boolean).join(' · ')
  if (name) lines.push(name)

  if (a.phone) lines.push(`Phone: ${a.phone}`)

  if (a.addressLine1 || a.address_line1) lines.push(a.addressLine1 || a.address_line1)
  if (a.addressLine2 || a.address_line2) lines.push(a.addressLine2 || a.address_line2)

  const city = a.city || ''
  const postal = a.postalCode || a.postal_code || ''
  const cityPostal = [city, postal].filter(Boolean).join(', ')
  if (cityPostal) lines.push(cityPostal)

  const country = a.country || ''
  if (country) lines.push(country)

  return lines.length ? lines : ['-']
}

async function openOrderDetail(order) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await adminHttp.get(`/orders/${order.id}`)
    detail.value = res.data?.data || null
  } catch (e) {
    detailOpen.value = false
    error(e?.response?.data?.error || 'Failed to load order detail.')
  } finally {
    detailLoading.value = false
  }
}

function closeOrderDetail() {
  detailOpen.value = false
  detail.value = null
}

function onFilterChange() {
  page.value = 1
  load()
}

function onPageChange(n) {
  if (!Number.isInteger(n) || n < 1 || n > Number(meta.value.totalPages || 1) || n === page.value) return
  page.value = n
  load()
}

onMounted(load)
</script>

<style scoped>
.admin-type-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1040;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.admin-type-modal {
  width: min(560px, 100%);
  background: #ffffff;
  border: 1px solid #dbe3f0;
  border-radius: 1rem;
  box-shadow: 0 24px 56px rgba(15, 23, 42, 0.3);
  overflow: hidden;
}

.admin-type-modal-header,
.admin-type-modal-footer {
  padding: 0.9rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: #f8fafc;
}

.admin-type-modal-body {
  padding: 1rem;
}

.modal-close-btn {
  border: 0;
  background: transparent;
  color: #475569;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  font-size: 1.5rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.order-detail-modal {
  width: min(980px, 96vw);
}

.order-item-image {
  width: 36px;
  height: 48px;
  object-fit: cover;
  border-radius: 0.4rem;
  border: 1px solid #e2e8f0;
}

.order-history-list {
  display: grid;
  gap: 0.5rem;
}

.order-history-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
}

.order-address {
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.6rem;
  background: #f8fafc;
  font-size: 0.82rem;
  display: grid;
  gap: 0.2rem;
}
</style>
