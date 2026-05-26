<template>
  <div v-if="item" class="stylist-item-card h-100">
    <img :src="item.hero_image || fallback" :alt="item.title" class="stylist-item-image" />
    <div class="stylist-item-body">
      <div class="stylist-item-category">{{ formatCategory(item.category_slug) }}</div>
      <div class="stylist-item-title">{{ item.title }}</div>
      <div class="stylist-item-bottom">
        <span>$ {{ price }}</span>
        <RouterLink class="btn btn-outline-dark btn-sm" :to="{ name: 'productDetail', params: { id: item.id } }">
          View
        </RouterLink>
      </div>
    </div>
  </div>

  <div v-else class="missing-item-card">
    <div>
      <div class="missing-icon">+</div>
      <div>No item found for this slot.</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, default: null },
})

const fallback = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'

const price = computed(() => {
  const value = Number(props.item?.discount_price || props.item?.base_price || 0)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
})

function formatCategory(value) {
  return String(value || 'Product')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
</script>
