<template>
  <div class="container py-5">
    <h2 class="h4 mb-4">My Wishlist</h2>

    <div v-if="loading">Loading...</div>

    <div v-else-if="items.length === 0" class="text-muted">Your wishlist is empty.</div>

    <div v-else class="row g-3">
      <div class="col-6 col-md-3 col-lg-3" v-for="p in items" :key="p.id">
        <ProductCard :product="p" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import ProductCard from '@/components/products/ProductCard.vue'
import { useWishlistStore } from '@/stores/wishlistStore'

const wishlist = useWishlistStore()
const items = computed(() => wishlist.items.value)
const loading = computed(() => wishlist.loading.value && !wishlist.loaded.value)

async function load() {
  await wishlist.load()
}

onMounted(load)
</script>
