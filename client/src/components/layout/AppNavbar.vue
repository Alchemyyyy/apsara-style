<template>
  <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
    <div class="container py-2">
      <RouterLink class="navbar-brand brand-wordmark" to="/">APSARA STYLE</RouterLink>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="nav" class="collapse navbar-collapse">
        <form class="d-flex ms-auto me-3" @submit.prevent="goSearch">
          <input class="form-control form-control-sm me-2" v-model="q" placeholder="Search…" style="width: 220px" />
          <button class="btn btn-outline-dark btn-sm" type="submit">Search</button>
        </form>
        <ul class="navbar-nav ms-auto gap-2 align-items-lg-center">
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'products', params: { gender: 'women' } }">Women</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'products', params: { gender: 'men' } }">Men</RouterLink>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#ai">AI Features</a>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'orders' }">Orders</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="btn btn-as btn-sm px-3" :to="{ name: 'cart' }">Cart</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" :to="{ name: 'stylist' }">Stylist</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const q = ref('')

function goSearch() {
  if (!q.value.trim()) return
  router.push({ name: 'search', query: { q: q.value.trim() } })
}
</script>
