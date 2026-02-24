<template>
  <div class="container py-5">
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0">Admin · Products</h2>
      </div>

      <div class="d-flex gap-2">
        <input class="form-control" v-model="q" placeholder="Search title..." style="width: 240px" @keyup.enter="load" />
        <RouterLink class="btn btn-outline-dark" :to="{ name: 'adminAnalytics' }">Analytics</RouterLink>
        <button class="btn btn-outline-dark" @click="load">Search</button>
        <button class="btn btn-outline-dark" @click="logout">Logout</button>
      </div>
    </div>

    <div v-if="loading" class="text-muted py-5 text-center">Loading…</div>

    <div v-else class="bg-white border rounded-4 p-3 mt-3">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Gender</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="p in products" :key="p.id">
              <td>
                <div class="d-flex align-items-center gap-3">
                  <img :src="p.hero_image" class="rounded-3" style="width: 52px; height: 70px; object-fit: cover;" />
                  <div>
                    <div class="fw-semibold">{{ p.title }}</div>
                    <div class="text-muted small">{{ p.id.slice(0,8).toUpperCase() }}</div>
                  </div>
                </div>
              </td>
              <td class="text-capitalize">{{ p.gender }}</td>
              <td class="text-muted">{{ p.category_slug }}</td>
              <td class="fw-semibold">${{ Number(p.discount_price || p.base_price).toFixed(2) }}</td>
              <td>
                <span class="badge text-bg-light border">{{ p.total_stock }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-center gap-2 mt-4">
        <button class="btn btn-outline-dark" @click="prev" :disabled="page<=1">Prev</button>
        <button class="btn btn-as" @click="next" :disabled="page>=meta.totalPages">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/api/adminHttp'

const router = useRouter()

const loading = ref(false)
const products = ref([])
const meta = ref({ page: 1, totalPages: 1 })
const page = ref(1)
const q = ref('')

async function load() {
  loading.value = true
  try {
    const res = await adminHttp.get('/products', { params: { page: page.value, limit: 20, q: q.value || undefined } })
    products.value = res.data.data
    meta.value = res.data.meta
  } catch (e) {
    // if unauthorized, go back to login
    router.push({ name: 'adminLogin' })
  } finally {
    loading.value = false
  }
}

function next() { page.value += 1; load() }
function prev() { page.value -= 1; load() }

function logout() {
  localStorage.removeItem('apsara_admin_key')
  router.push({ name: 'adminLogin' })
}

onMounted(load)
</script>
