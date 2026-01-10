<template>
  <section class="bg-white border-bottom">
    <div class="container py-5">
      <div class="row align-items-center g-4">
        <div class="col-lg-6">
          <div class="brand-wordmark mb-3">APSARA STYLE</div>
          <h1 class="display-6 fw-semibold">Where elegance meets intelligence.</h1>
          <p class="text-muted mt-3">
            A modern fashion store for men and women — crafted with clean design and intelligent personalization.
          </p>

          <div class="d-flex gap-2 mt-4">
            <RouterLink class="btn btn-as px-4" :to="{ name: 'products', params: { gender: 'women' } }">Shop Women</RouterLink>
            <RouterLink class="btn btn-outline-dark px-4" :to="{ name: 'products', params: { gender: 'men' } }">Shop Men</RouterLink>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card card-minimal shadow-sm">
            <img
              class="w-100"
              style="height: 420px; object-fit: cover;"
              src="https://picsum.photos/seed/apsara-hero/1200/900"
              alt="APSARA STYLE hero"
            />
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="ai" class="container py-5">
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card card-minimal shadow-sm p-4 h-100">
          <div class="fw-semibold mb-2">Smart Search</div>
          <div class="text-muted">Find what you mean, not just what you type.</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-minimal shadow-sm p-4 h-100">
          <div class="fw-semibold mb-2">Personalized Recommendations</div>
          <div class="text-muted">Curated pieces based on your taste and behavior.</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card card-minimal shadow-sm p-4 h-100">
          <div class="fw-semibold mb-2">Styling Assistant</div>
          <div class="text-muted">Build outfits confidently from our catalog.</div>
        </div>
      </div>
    </div>
  </section>

  <section class="container pb-5" v-if="recommended.length">
    <h3 class="h5 mb-3">Recommended for you</h3>
    <ProductRow :items="recommended" />
  </section>

  <section class="container pb-5" v-if="trending.length">
    <h3 class="h5 mb-3">Trending now</h3>
    <ProductRow :items="trending" />
  </section>

</template>

<script setup>
import ProductRow from '@/components/products/ProductRow.vue'
import { ref, onMounted } from 'vue'
import { http } from '@/api/http'

const trending = ref([])
const recommended = ref([])

async function load() {
  const t = await http.get('/recommendations/trending', { params: { limit: 8 } })
  trending.value = t.data.data

  const r = await http.get('/recommendations', { params: { limit: 8 } })
  recommended.value = r.data.data
}

onMounted(load)
</script>

