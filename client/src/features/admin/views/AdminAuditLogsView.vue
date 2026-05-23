<template>
  <AdminDashboardShell subtitle="Review admin actions and changes across catalog, orders, and uploads.">
    <template #actions>
      <form class="admin-panel-card audit-filter-panel w-100 p-3" @submit.prevent="applyFilters">
        <div class="audit-filter-grid audit-filter-grid-top">
          <label class="audit-filter-field audit-filter-field-search">
            <span class="audit-filter-label">Search</span>
            <input
              v-model="q"
              class="form-control"
              placeholder="Action, entity, actor"
            />
          </label>

          <label class="audit-filter-field">
            <span class="audit-filter-label">Action</span>
            <input
              v-model="action"
              class="form-control"
              placeholder="product.update"
            />
          </label>

          <label class="audit-filter-field">
            <span class="audit-filter-label">Entity</span>
            <input
              v-model="entityType"
              class="form-control"
              placeholder="product"
            />
          </label>

          <label class="audit-filter-field audit-filter-field-id">
            <span class="audit-filter-label">Entity ID</span>
            <input
              v-model="entityId"
              class="form-control"
              placeholder="Optional"
            />
          </label>
        </div>

        <div class="audit-filter-grid audit-filter-grid-bottom mt-3">
          <label class="audit-filter-field audit-filter-field-preset">
            <span class="audit-filter-label">Date Range</span>
            <select class="form-select" v-model="timeRange">
              <option value="all">All time</option>
              <option value="last_24h">Last 24 hours</option>
              <option value="last_7d">Last 7 days</option>
              <option value="last_30d">Last 30 days</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label class="audit-filter-field">
            <span class="audit-filter-label">From</span>
            <input
              v-model="fromDateTime"
              class="form-control"
              type="datetime-local"
              :disabled="timeRange !== 'custom'"
            />
          </label>

          <label class="audit-filter-field">
            <span class="audit-filter-label">To</span>
            <input
              v-model="toDateTime"
              class="form-control"
              type="datetime-local"
              :disabled="timeRange !== 'custom'"
            />
          </label>

          <label class="audit-filter-field audit-filter-field-sort">
            <span class="audit-filter-label">Sort By</span>
            <select class="form-select" v-model="sort">
              <option value="created_at_desc">Newest first</option>
              <option value="created_at_asc">Oldest first</option>
            </select>
          </label>

          <div class="audit-filter-actions">
            <BaseButton variant="adminCta" size="sm" native-type="submit">Apply Filters</BaseButton>
            <BaseButton variant="secondary" size="sm" @click="resetFilters">Reset</BaseButton>
          </div>
        </div>

        <div class="audit-filter-summary mt-3">
          <div class="small text-muted">{{ resultSummary }}</div>
          <div v-if="activeFilters.length" class="audit-filter-chips">
            <span v-for="filter in activeFilters" :key="filter.label" class="audit-filter-chip">
              {{ filter.label }}
            </span>
          </div>
        </div>
      </form>
    </template>

    <div v-if="loading" class="text-muted py-5 text-center">Loading audit logs...</div>

    <div v-else class="admin-panel-card admin-table-card p-3 mt-3">
      <div v-if="logs.length === 0" class="text-muted p-3">No logs found.</div>

      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Meta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in logs" :key="row.id">
              <td class="text-muted small">{{ new Date(row.created_at).toLocaleString() }}</td>
              <td>
                <div class="fw-semibold">{{ row.actor_name || '-' }}</div>
                <div class="small text-muted">{{ row.actor_email || '-' }}</div>
              </td>
              <td><span class="badge border text-bg-light">{{ row.action }}</span></td>
              <td>
                <div class="fw-semibold">{{ row.entity_type }}</div>
                <div class="small text-muted">{{ row.entity_id || '-' }}</div>
              </td>
              <td class="small text-muted">
                <pre class="meta-preview">{{ prettyMeta(row.meta) }}</pre>
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
  </AdminDashboardShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/features/admin/api/adminHttp'
import AdminDashboardShell from '@/features/admin/components/AdminDashboardShell.vue'
import AppPagination from '@/shared/components/common/AppPagination.vue'
import BaseButton from '@/shared/components/common/BaseButton.vue'

const router = useRouter()
const loading = ref(false)
const logs = ref([])
const meta = ref({ page: 1, totalPages: 1 })
const page = ref(1)
const q = ref('')
const action = ref('')
const entityType = ref('')
const entityId = ref('')
const timeRange = ref('all')
const fromDateTime = ref('')
const toDateTime = ref('')
const sort = ref('created_at_desc')

const resultSummary = computed(() => {
  const total = Number(meta.value?.total || logs.value.length || 0)
  if (loading.value) return 'Loading results...'
  if (!total) return '0 results'
  return `${total} result${total === 1 ? '' : 's'}`
})

const activeFilters = computed(() => {
  const chips = []
  if (q.value.trim()) chips.push({ label: `Search: ${q.value.trim()}` })
  if (action.value.trim()) chips.push({ label: `Action: ${action.value.trim()}` })
  if (entityType.value.trim()) chips.push({ label: `Entity: ${entityType.value.trim()}` })
  if (entityId.value.trim()) chips.push({ label: `Entity ID: ${entityId.value.trim()}` })
  if (timeRange.value !== 'all') {
    const label =
      timeRange.value === 'custom'
        ? `Date: ${formatDateChip(fromDateTime.value)} to ${formatDateChip(toDateTime.value)}`
        : `Date: ${timeRangeLabel(timeRange.value)}`
    chips.push({ label })
  }
  if (sort.value === 'created_at_asc') chips.push({ label: 'Sort: Oldest first' })
  return chips
})

function toIsoOrUndefined(v) {
  const raw = String(v || '').trim()
  if (!raw) return undefined
  const d = new Date(raw)
  if (!Number.isFinite(d.getTime())) return undefined
  return d.toISOString()
}

function getRangeDates() {
  const now = new Date()
  if (timeRange.value === 'custom') {
    return {
      from: toIsoOrUndefined(fromDateTime.value),
      to: toIsoOrUndefined(toDateTime.value),
    }
  }
  if (timeRange.value === 'last_24h') {
    return { from: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), to: undefined }
  }
  if (timeRange.value === 'last_7d') {
    return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to: undefined }
  }
  if (timeRange.value === 'last_30d') {
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: undefined }
  }
  return { from: undefined, to: undefined }
}

function timeRangeLabel(value) {
  if (value === 'last_24h') return 'Last 24 hours'
  if (value === 'last_7d') return 'Last 7 days'
  if (value === 'last_30d') return 'Last 30 days'
  return 'Custom'
}

function formatDateChip(value) {
  const raw = String(value || '').trim()
  return raw || 'Any'
}

function prettyMeta(raw) {
  if (!raw || typeof raw !== 'object') return '-'
  try {
    return JSON.stringify(raw, null, 2)
  } catch {
    return '-'
  }
}

async function load() {
  loading.value = true
  try {
    const range = getRangeDates()
    const res = await adminHttp.get('/audit-logs', {
      params: {
        page: page.value,
        limit: 20,
        q: q.value || undefined,
        action: action.value || undefined,
        entity_type: entityType.value || undefined,
        entity_id: entityId.value || undefined,
        from: range.from,
        to: range.to,
        sort: sort.value || 'created_at_desc',
      },
    })
    logs.value = Array.isArray(res.data?.data) ? res.data.data : []
    meta.value = res.data?.meta || { page: 1, totalPages: 1, total: logs.value.length }
  } catch {
    router.push({ name: 'adminLogin' })
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  load()
}

function applyFilters() {
  onFilterChange()
}

function onPageChange(n) {
  if (!Number.isInteger(n) || n < 1 || n > Number(meta.value.totalPages || 1) || n === page.value) return
  page.value = n
  load()
}

function resetFilters() {
  q.value = ''
  action.value = ''
  entityType.value = ''
  entityId.value = ''
  timeRange.value = 'all'
  fromDateTime.value = ''
  toDateTime.value = ''
  sort.value = 'created_at_desc'
  onFilterChange()
}

onMounted(load)
</script>

<style scoped>
.audit-filter-panel {
  border-radius: 0.5rem;
}

.audit-filter-grid {
  display: grid;
  gap: 0.85rem 1rem;
}

.audit-filter-grid-top {
  grid-template-columns: minmax(220px, 2fr) repeat(2, minmax(180px, 1fr)) minmax(140px, 0.85fr);
}

.audit-filter-grid-bottom {
  align-items: end;
  grid-template-columns: minmax(180px, 1.1fr) repeat(2, minmax(200px, 1.2fr)) minmax(180px, 1fr) auto;
}

.audit-filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.audit-filter-label {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.audit-filter-field :is(.form-control, .form-select) {
  min-height: 44px;
}

.audit-filter-field :is(.form-control, .form-select):disabled {
  background: #f8fafc;
}

.audit-filter-actions {
  display: flex;
  align-items: end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.audit-filter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.9rem;
}

.audit-filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.audit-filter-chip {
  background: #f8fafc;
  border: 1px solid #dbe3ee;
  border-radius: 0.5rem;
  color: #334155;
  font-size: 0.82rem;
  line-height: 1.2;
  padding: 0.4rem 0.6rem;
}

.meta-preview {
  margin: 0;
  max-width: 340px;
  max-height: 130px;
  overflow: auto;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.5rem;
  white-space: pre-wrap;
}

@media (max-width: 1200px) {
  .audit-filter-grid-top,
  .audit-filter-grid-bottom {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .audit-filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .audit-filter-grid-top,
  .audit-filter-grid-bottom {
    grid-template-columns: minmax(0, 1fr);
  }

  .audit-filter-actions > .btn {
    width: 100%;
  }
}
</style>
