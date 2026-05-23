<template>
  <div class="row g-3">
    <div class="col-6 col-md-3 col-lg-3" v-for="p in items" :key="p.id">
      <ProductCard :product="p" />
    </div>
  </div>
</template>

<script setup>
import ProductCard from './ProductCard.vue'

defineProps({
  items: { type: Array, default: () => [] }
})
</script>
