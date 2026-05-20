<template>
  <AdminDashboardShell subtitle="Monitor traffic, funnel conversion, and top performing products.">
    <template #actions>
      <select class="form-select" style="width: 160px" v-model="days" @change="load">
        <option :value="7">Last 7 days</option>
        <option :value="30">Last 30 days</option>
        <option :value="90">Last 90 days</option>
      </select>
    </template>

    <div v-if="loading" class="text-muted py-5 text-center">Loading analytics…</div>

    <div v-else class="row g-4 mt-2">
      <!-- Summary cards -->
      <div class="col-md-3">
        <div class="admin-panel-card p-4 h-100">
          <div class="text-muted small">Views</div>
          <div class="h3 fw-semibold mb-0">{{ summary.views || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="admin-panel-card p-4 h-100">
          <div class="text-muted small">Add to cart</div>
          <div class="h3 fw-semibold mb-0">{{ summary.add_to_cart || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="admin-panel-card p-4 h-100">
          <div class="text-muted small">Purchases</div>
          <div class="h3 fw-semibold mb-0">{{ summary.purchases || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="admin-panel-card p-4 h-100">
          <div class="text-muted small">Searches</div>
          <div class="h3 fw-semibold mb-0">{{ summary.searches || 0 }}</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="col-lg-8">
        <div class="admin-panel-card p-4">
          <div class="fw-semibold mb-3">Daily activity</div>
          <div class="analytics-chart-wrap">
            <canvas ref="chartEl"></canvas>
          </div>
        </div>
      </div>

      <!-- Order funnel -->
      <div class="col-lg-4">
        <div class="admin-panel-card p-4 h-100">
          <div class="fw-semibold mb-3">Order funnel</div>
          <div class="d-flex flex-wrap gap-2">
            <span class="badge text-bg-secondary">Pending {{ orderFunnel.pending }}</span>
            <span class="badge text-bg-info">Paid {{ orderFunnel.paid }}</span>
            <span class="badge text-bg-primary">Packed {{ orderFunnel.packed }}</span>
            <span class="badge text-bg-warning">Shipped {{ orderFunnel.shipped }}</span>
            <span class="badge text-bg-success">Delivered {{ orderFunnel.delivered }}</span>
            <span class="badge text-bg-danger">Cancelled {{ orderFunnel.cancelled }}</span>
          </div>
          <div class="small text-muted mt-3">Total orders: {{ orderFunnel.total }}</div>
          <div class="small text-muted">Delivery rate: {{ orderFunnel.deliveryRate }}%</div>
          <div class="small text-muted">Cancellation rate: {{ orderFunnel.cancelRate }}%</div>
        </div>
      </div>

      <!-- Top products -->
      <div class="col-lg-12">
        <div class="admin-panel-card p-4">
          <div class="fw-semibold mb-3">Top products</div>

          <div v-if="topProducts.length === 0" class="text-muted">No data.</div>

          <div v-else class="d-flex flex-column gap-3">
            <div v-for="p in topProducts" :key="p.id" class="d-flex gap-3 align-items-center">
              <img :src="p.hero_image" class="rounded-3" style="width:52px;height:70px;object-fit:cover;" />
              <div class="flex-grow-1">
                <div class="fw-semibold text-truncate">{{ p.title }}</div>
                <div class="text-muted small text-truncate">{{ p.category_slug }} · {{ p.gender }}</div>
              </div>
              <span class="badge text-bg-light border">{{ p.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Order status trend -->
      <div class="col-lg-12">
        <div class="admin-panel-card p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="fw-semibold">Order Status Trend</div>
            <select class="form-select form-select-sm" style="width: 170px" v-model="trendMode" @change="renderStatusChart">
              <option value="count">Count</option>
              <option value="share">Share (%)</option>
            </select>
          </div>
          <div class="analytics-chart-wrap">
            <canvas ref="statusChartEl"></canvas>
          </div>
        </div>
      </div>

      <!-- Top searches -->
      <div class="col-lg-12">
        <div class="admin-panel-card p-4">
          <div class="fw-semibold mb-3">Top searches</div>

          <div v-if="topSearches.length === 0" class="text-muted">No data.</div>

          <div v-else class="d-flex flex-wrap gap-2">
            <span v-for="s in topSearches" :key="s.q" class="badge text-bg-light border">
              {{ s.q }} · {{ s.count }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </AdminDashboardShell>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/api/adminHttp'
import { Chart } from 'chart.js/auto'
import AdminDashboardShell from '@/components/admin/AdminDashboardShell.vue'

const router = useRouter()

const days = ref(7)
const loading = ref(false)

const summary = ref({ views: 0, add_to_cart: 0, purchases: 0, searches: 0 })
const daily = ref([])
const topProducts = ref([])
const topSearches = ref([])
const orderStatusDaily = ref([])
const trendMode = ref('count')
const orderFunnel = ref({
  pending: 0,
  paid: 0,
  packed: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
  total: 0,
  deliveryRate: 0,
  cancelRate: 0,
})

const chartEl = ref(null)
const statusChartEl = ref(null)
let chart = null
let statusChart = null

function renderChart() {
  if (!chartEl.value) return
  if (chart) chart.destroy()

  const labels = daily.value.map(d => d.day)
  const views = daily.value.map(d => d.views || 0)
  const atc = daily.value.map(d => d.add_to_cart || 0)
  const purchases = daily.value.map(d => d.purchases || 0)
  const searches = daily.value.map(d => d.searches || 0)

  chart = new Chart(chartEl.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Views', data: views },
        { label: 'Add to cart', data: atc },
        { label: 'Purchases', data: purchases },
        { label: 'Searches', data: searches },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  })
}

function renderStatusChart() {
  if (!statusChartEl.value) return
  if (statusChart) statusChart.destroy()

  const labels = [...new Set(orderStatusDaily.value.map((d) => d.day))]
  const statuses = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled']
  const colors = {
    pending: '#6c757d',
    paid: '#0dcaf0',
    packed: '#0d6efd',
    shipped: '#ffc107',
    delivered: '#198754',
    cancelled: '#dc3545',
  }
  const dayTotals = Object.fromEntries(
    labels.map((day) => {
      const total = statuses.reduce((sum, s) => {
        const r = orderStatusDaily.value.find((x) => x.day === day && x.status === s)
        return sum + Number(r?.count || 0)
      }, 0)
      return [day, total]
    })
  )

  function countFor(day, status) {
    const row = orderStatusDaily.value.find((r) => r.day === day && r.status === status)
    return row ? Number(row.count || 0) : 0
  }

  const datasets = statuses.map((status) => ({
    label: status,
    data: labels.map((day) => {
      const value = countFor(day, status)
      if (trendMode.value === 'count') return value

      const dayTotal = dayTotals[day] || 0
      if (dayTotal <= 0) return 0
      return Number(((value / dayTotal) * 100).toFixed(1))
    }),
    backgroundColor: colors[status],
    stack: 'orders',
  }))

  statusChart = new Chart(statusChartEl.value, {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          max: trendMode.value === 'share' ? 100 : undefined,
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              const label = context.dataset.label || ''
              const day = context.label
              const count = countFor(day, label)
              const total = dayTotals[day] || 0

              if (trendMode.value === 'share') {
                const pct = Number(context.parsed.y || 0).toFixed(1)
                return `${label}: ${pct}% (${count}/${total})`
              }

              return `${label}: ${count}`
            },
            footer(items) {
              if (!items?.length) return ''
              const day = items[0].label
              const total = dayTotals[day] || 0
              return `Day total: ${total}`
            },
          },
        },
      },
    },
  })
}

async function load() {
  loading.value = true
  try {
    const o = await adminHttp.get('/analytics/overview', { params: { days: days.value } })
    summary.value = o.data.data.summary
    daily.value = o.data.data.daily
    orderFunnel.value = o.data.data.orderFunnel || orderFunnel.value
    orderStatusDaily.value = o.data.data.orderStatusDaily || []

    const tp = await adminHttp.get('/analytics/top-products', { params: { days: days.value, limit: 6 } })
    topProducts.value = tp.data.data

    const ts = await adminHttp.get('/analytics/top-searches', { params: { days: days.value, limit: 12 } })
    topSearches.value = ts.data.data
  } catch (e) {
    router.push({ name: 'adminLogin' })
  } finally {
    loading.value = false
    await nextTick()
    renderChart()
    renderStatusChart()
  }
}

onMounted(load)
</script>

<style scoped>
.analytics-chart-wrap {
  height: 260px;
}
</style>
