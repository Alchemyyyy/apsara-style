<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0">Admin · Analytics</h2>
      </div>

      <div class="d-flex gap-2 align-items-center">
        <select class="form-select" style="width: 160px" v-model="days" @change="load">
          <option :value="7">Last 7 days</option>
          <option :value="30">Last 30 days</option>
          <option :value="90">Last 90 days</option>
        </select>

        <RouterLink class="btn btn-outline-dark" :to="{ name: 'adminProducts' }">Products</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="text-muted py-5 text-center">Loading analytics…</div>

    <div v-else class="row g-4 mt-2">
      <!-- Summary cards -->
      <div class="col-md-3">
        <div class="bg-white border rounded-4 p-4 h-100">
          <div class="text-muted small">Views</div>
          <div class="h3 fw-semibold mb-0">{{ summary.views || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-white border rounded-4 p-4 h-100">
          <div class="text-muted small">Add to cart</div>
          <div class="h3 fw-semibold mb-0">{{ summary.add_to_cart || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-white border rounded-4 p-4 h-100">
          <div class="text-muted small">Purchases</div>
          <div class="h3 fw-semibold mb-0">{{ summary.purchases || 0 }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="bg-white border rounded-4 p-4 h-100">
          <div class="text-muted small">Searches</div>
          <div class="h3 fw-semibold mb-0">{{ summary.searches || 0 }}</div>
        </div>
      </div>

      <!-- Chart -->
      <div class="col-lg-8">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Daily activity</div>
          <div class="analytics-chart-wrap">
            <canvas ref="chartEl"></canvas>
          </div>
        </div>
      </div>

      <!-- Top products -->
      <div class="col-lg-4">
        <div class="bg-white border rounded-4 p-4">
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

      <!-- Top searches -->
      <div class="col-lg-12">
        <div class="bg-white border rounded-4 p-4">
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
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/api/adminHttp'
import { Chart } from 'chart.js/auto'

const router = useRouter()

const days = ref(7)
const loading = ref(false)

const summary = ref({ views: 0, add_to_cart: 0, purchases: 0, searches: 0 })
const daily = ref([])
const topProducts = ref([])
const topSearches = ref([])

const chartEl = ref(null)
let chart = null

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

async function load() {
  loading.value = true
  try {
    const o = await adminHttp.get('/analytics/overview', { params: { days: days.value } })
    summary.value = o.data.data.summary
    daily.value = o.data.data.daily

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
  }
}

onMounted(load)
</script>

<style scoped>
.analytics-chart-wrap {
  height: 260px;
}
</style>
