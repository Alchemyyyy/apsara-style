<template>
  <div class="container py-5">
    <div class="brand-wordmark mb-1">APSARA STYLE</div>
    <h2 class="h4">Search</h2>
    <div class="text-muted">Query: "{{ query }}"</div>

    <div v-if="loading" class="text-muted py-5 text-center">Searching…</div>

    <div v-else class="row g-4 mt-2">
      <div class="col-6 col-md-4 col-lg-3" v-for="p in results" :key="p.id">
        <ProductCard :product="p" />
      </div>

      <div v-if="results.length === 0" class="text-muted mt-4">
        No results.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { http } from '@/shared/api/http'
import ProductCard from '@/features/products/components/ProductCard.vue'
import { trackEvent } from '@/shared/api/events'

const route = useRoute()
const query = computed(() => route.query.q || '')

const loading = ref(false)
const results = ref([])

async function search() {
  if (!query.value) return
  loading.value = true
  try {
    const res = await http.get('/search', {
      params: { q: query.value, page: 1, limit: 24 }
    })
    results.value = res.data.data
    await trackEvent('search', { query: query.value, meta: { page: 'search_ai' } })
  } finally {
    loading.value = false
  }
}


watch(query, () => search(), { immediate: true })
</script>
