<template>
  <AdminDashboardShell subtitle="Review and process customer return requests.">
    <AdminToastStack :toasts="toasts" @close="removeToast" />
    <template #actions>
      <div class="d-flex gap-2">
        <input class="form-control" v-model="q" placeholder="Search code/email/request id..." style="width: 280px" @keyup.enter="load" />
        <select class="form-select" v-model="status" style="width: 170px" @change="onFilterChange">
          <option value="">All statuses</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </template>

    <div v-if="loading" class="text-muted py-5 text-center">Loading return requests…</div>

    <div v-else class="admin-panel-card admin-table-card p-3 mt-3">
      <div v-if="requests.length === 0" class="text-muted p-3">No return requests found.</div>

      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Request</th>
              <th>Order</th>
              <th>Email</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
              <th class="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r.id">
              <td class="fw-semibold">{{ shortId(r.id) }}</td>
              <td class="text-muted small">{{ r.order_code || '-' }}</td>
              <td class="text-muted small">{{ r.email || '-' }}</td>
              <td>{{ reasonLabel(r.reason) }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge border text-uppercase" :class="returnStatusBadgeClass(r.status)">{{ r.status }}</span>
                  <select class="form-select form-select-sm" v-model="draftStatus[r.id]" style="max-width: 150px;">
                    <option v-for="s in allowedStatusesFor(r)" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
              </td>
              <td class="text-muted small">{{ formatDate(r.created_at) }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" @click="openDetail(r)">View</button>
                  <button
                    class="btn btn-outline-dark"
                    :disabled="busyId === r.id || draftStatus[r.id] === r.status"
                    @click="saveStatus(r)"
                  >
                    {{ busyId === r.id ? 'Saving…' : 'Save' }}
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

    <div v-if="detailOpen" class="admin-type-modal-backdrop" @click.self="closeDetail">
      <div class="admin-type-modal order-detail-modal">
        <div class="admin-type-modal-header">
          <h4 class="h6 mb-0">Return Request {{ detail?.id ? shortId(detail.id) : '' }}</h4>
          <button class="modal-close-btn" type="button" aria-label="Close" @click="closeDetail">&times;</button>
        </div>

        <div v-if="detailLoading" class="admin-type-modal-body text-muted">Loading details...</div>
        <div v-else-if="detail" class="admin-type-modal-body">
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <div class="small text-muted">Status</div>
              <span class="badge border text-uppercase" :class="returnStatusBadgeClass(detail.status)">{{ detail.status }}</span>
            </div>
            <div class="col-md-4">
              <div class="small text-muted">Order</div>
              <div class="fw-semibold">{{ detail.order_code || '-' }}</div>
            </div>
            <div class="col-md-4">
              <div class="small text-muted">Created</div>
              <div class="fw-semibold">{{ formatDate(detail.created_at) }}</div>
            </div>
            <div class="col-md-6">
              <div class="small text-muted">Email</div>
              <div class="fw-semibold">{{ detail.email || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="small text-muted">Phone</div>
              <div class="fw-semibold">{{ detail.phone || '-' }}</div>
            </div>
            <div class="col-md-6">
              <div class="small text-muted">Reason</div>
              <div class="fw-semibold">{{ reasonLabel(detail.reason) }}</div>
            </div>
            <div class="col-md-6">
              <div class="small text-muted">Order Total</div>
              <div class="fw-semibold">${{ Number(detail.total || 0).toFixed(2) }}</div>
            </div>
            <div class="col-12">
              <div class="small text-muted">Customer note</div>
              <div class="fw-semibold">{{ detail.note || '-' }}</div>
            </div>
          </div>

          <div class="small text-muted mb-2">Order items</div>
          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Price</th>
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
                  <td>{{ it.qty }}</td>
                  <td>${{ Number(it.price_snapshot || 0).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="small text-muted mt-3 mb-2">Return Status History</div>
          <div v-if="(detail.history || []).length" class="order-history-list">
            <div v-for="h in detail.history" :key="h.id" class="order-history-item">
              <span class="badge border text-uppercase" :class="returnStatusBadgeClass(h.status)">{{ h.status }}</span>
              <span class="text-muted small">{{ formatDate(h.created_at) }}</span>
              <span class="small">{{ h.note || '-' }}</span>
            </div>
          </div>
          <div v-else class="text-muted small">No return history yet.</div>
        </div>

        <div class="admin-type-modal-footer">
          <button class="btn btn-outline-dark btn-sm" @click="closeDetail">Close</button>
        </div>
      </div>
    </div>
  </AdminDashboardShell>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { adminHttp } from '@/features/admin/api/adminHttp'
import AdminDashboardShell from '@/features/admin/components/AdminDashboardShell.vue'
import AdminToastStack from '@/features/admin/components/AdminToastStack.vue'
import AppPagination from '@/shared/components/common/AppPagination.vue'
import { useToast } from '@/shared/composables/useToast'

const { toasts, success, error, removeToast } = useToast()
const loading = ref(false)
const busyId = ref('')

const requests = ref([])
const statuses = ref(['requested', 'approved', 'rejected', 'resolved'])
const transitions = ref({})
const draftStatus = ref({})

const page = ref(1)
const q = ref('')
const status = ref('')
const meta = ref({ page: 1, totalPages: 1 })

const detailOpen = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

function shortId(id) {
  return String(id || '').slice(0, 8).toUpperCase()
}

function formatDate(value) {
  return new Date(value).toLocaleString()
}

function reasonLabel(reason) {
  const map = {
    damaged: 'Damaged item',
    wrong_item: 'Wrong item',
    not_as_described: 'Not as described',
    size_issue: 'Size issue',
    other: 'Other',
  }
  return map[String(reason || '').toLowerCase()] || reason || '-'
}

function returnStatusBadgeClass(statusValue) {
  const s = String(statusValue || '').toLowerCase()
  if (s === 'requested') return 'text-bg-secondary'
  if (s === 'approved') return 'text-bg-success'
  if (s === 'rejected') return 'text-bg-danger'
  if (s === 'resolved') return 'text-bg-primary'
  return 'text-bg-light'
}

function hydrateDrafts() {
  const next = {}
  for (const r of requests.value) next[r.id] = r.status
  draftStatus.value = next
}

function allowedStatusesFor(request) {
  const current = String(request?.status || '').toLowerCase()
  const allowed = Array.isArray(transitions.value[current]) ? transitions.value[current] : []
  return [current, ...allowed.filter((s) => s !== current)]
}

async function load() {
  loading.value = true
  try {
    const res = await adminHttp.get('/returns', {
      params: {
        page: page.value,
        limit: 20,
        q: q.value || undefined,
        status: status.value || undefined,
      },
    })
    requests.value = res.data?.data || []
    meta.value = res.data?.meta || { page: 1, totalPages: 1 }
    if (Array.isArray(res.data?.statuses) && res.data.statuses.length) statuses.value = res.data.statuses
    if (res.data?.transitions && typeof res.data.transitions === 'object') transitions.value = res.data.transitions
    hydrateDrafts()
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to load return requests.')
  } finally {
    loading.value = false
  }
}

async function saveStatus(request) {
  const nextStatus = draftStatus.value[request.id]
  if (!nextStatus || nextStatus === request.status) return

  let note = ''
  if (nextStatus === 'rejected') {
    const entered = window.prompt('Reason for rejection (required):', '')
    if (entered == null) return
    note = String(entered).trim()
    if (!note) {
      error('Rejection note is required.')
      return
    }
  } else {
    const entered = window.prompt('Add note for customer (optional):', '')
    if (entered == null) return
    note = String(entered || '').trim()
  }

  busyId.value = request.id
  try {
    const res = await adminHttp.patch(`/returns/${request.id}/status`, {
      status: nextStatus,
      note: note || undefined,
    })
    const updated = res.data?.data || null
    const idx = requests.value.findIndex((x) => x.id === request.id)
    if (idx !== -1 && updated) {
      requests.value[idx].status = updated.status
      draftStatus.value[request.id] = updated.status
    }
    if (detail.value?.id === request.id && updated) detail.value.status = updated.status
    success(`Updated return request ${shortId(request.id)} to ${nextStatus}.`)
  } catch (e) {
    error(e?.response?.data?.error || 'Failed to update return request status.')
  } finally {
    busyId.value = ''
  }
}

async function openDetail(request) {
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await adminHttp.get(`/returns/${request.id}`)
    detail.value = res.data?.data || null
  } catch (e) {
    detailOpen.value = false
    error(e?.response?.data?.error || 'Failed to load return request detail.')
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
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
  width: min(860px, 100%);
  max-height: calc(100vh - 2rem);
  overflow: auto;
  border-radius: 16px;
  border: 1px solid #d0d7e2;
  background: #fff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
}

.admin-type-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 1rem 1.1rem;
  border-bottom: 1px solid #e2e8f0;
}

.admin-type-modal-body {
  padding: 1rem 1.1rem;
}

.admin-type-modal-footer {
  padding: 0.8rem 1.1rem 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.modal-close-btn {
  border: 0;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  color: #334155;
}

.order-item-image {
  width: 34px;
  height: 44px;
  border-radius: 0.4rem;
  object-fit: cover;
}

.order-history-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 180px;
  overflow: auto;
}

.order-history-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
