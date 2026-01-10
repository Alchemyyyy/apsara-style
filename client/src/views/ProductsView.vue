<template>
  <div class="container py-5">
    <div class="d-flex align-items-end justify-content-between gap-3 flex-wrap">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0 text-capitalize">{{ gender }} Collection</h2>
      </div>

      <div class="d-flex gap-2">
        <select class="form-select" v-model="sort" style="width: 200px">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
        <button class="btn btn-outline-dark" @click="refresh" :disabled="loading">Refresh</button>
      </div>
    </div>

    <div class="text-muted mt-2">
      Showing page {{ page }} of {{ meta.totalPages || 1 }} ({{ meta.total || 0 }} items)
    </div>

    <div v-if="loading" class="py-5 text-center text-muted">Loading products…</div>
    <div v-else class="row g-4 mt-2">
      <div class="col-6 col-md-4 col-lg-3" v-for="p in products" :key="p.id">
        <ProductCard :product="p" />
      </div>
    </div>

    <div class="d-flex justify-content-center gap-2 mt-5">
      <button class="btn btn-outline-dark" @click="prev" :disabled="page <= 1 || loading">Prev</button>
      <button class="btn btn-as" @click="next" :disabled="page >= (meta.totalPages || 1) || loading">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { http } from '@/api/http'
import ProductCard from '@/components/products/ProductCard.vue'

const props = defineProps({
  gender: { type: String, required: true },
})

const products = ref([])
const meta = ref({ page: 1, limit: 12, total: 0, totalPages: 1 })
const page = ref(1)
const sort = ref('newest')
const loading = ref(false)

async function fetchProducts() {
  loading.value = true
  try {
    const res = await http.get('/products', {
      params: { gender: props.gender, page: page.value, limit: 12, sort: sort.value },
    })
    products.value = res.data.data
    meta.value = res.data.meta
  } finally {
    loading.value = false
  }
}

function next() {
  page.value += 1
}
function prev() {
  page.value -= 1
}
function refresh() {
  page.value = 1
  fetchProducts()
}

watch([page, sort, () => props.gender], () => fetchProducts())

onMounted(fetchProducts)
</script>
