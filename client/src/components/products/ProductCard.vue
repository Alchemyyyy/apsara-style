<template>
  <div class="card card-minimal shadow-sm h-100">
    <img
      :src="product.hero_image || fallback"
      class="w-100"
      style="height: 320px; object-fit: cover;"
      :alt="product.title"
    />
    <div class="p-3">
      <div class="fw-semibold text-truncate">{{ product.title }}</div>
      <div class="text-muted small text-truncate">{{ product.category_slug }}</div>

      <div class="mt-2 d-flex align-items-center gap-2">
        <div class="fw-semibold">
          ${{ Number(product.discount_price || product.base_price).toFixed(2) }}
        </div>
        <div v-if="product.discount_price" class="text-muted small text-decoration-line-through">
          ${{ Number(product.base_price).toFixed(2) }}
        </div>
      </div>

      <RouterLink class="btn btn-outline-dark btn-sm mt-3 w-100"
        :to="{ name: 'productDetail', params: { id: product.id } }"
      >
        View
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: { type: Object, required: true },
})

const fallback = 'https://picsum.photos/seed/apsara-fallback/900/1200'
</script>
