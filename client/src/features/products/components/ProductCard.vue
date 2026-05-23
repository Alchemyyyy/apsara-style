<template>
  <RouterLink class="product-card product-link h-100" :to="{ name: 'productDetail', params: { id: product.id } }">
    <div class="product-media">
      <img :src="product.hero_image || fallback" :alt="product.title" />
      <div class="media-top">
        <span v-if="hasDiscount" class="chip chip-discount">Sale</span>
        <span v-else class="chip">{{ product.gender || 'unisex' }}</span>
      </div>
    </div>

    <div class="product-body">
      <div class="title-row">
        <div class="product-title">{{ product.title }}</div>
        <button
          class="wish-inline-btn"
          :class="{ active: isWishlisted }"
          :disabled="wishlistBusy"
          :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
          @click.stop.prevent="toggleWishlist"
        >
          {{ isWishlisted ? '♥' : '♡' }}
        </button>
      </div>
      <div class="product-meta">{{ product.category_name || product.category_slug || 'new arrivals' }}</div>

      <div class="price-row">
        <div class="price-now">${{ Number(product.discount_price || product.base_price).toFixed(2) }}</div>
        <div v-if="hasDiscount" class="price-old">
          ${{ Number(product.base_price).toFixed(2) }}
        </div>
        <div v-if="hasDiscount" class="price-off">
          -{{ discountPercent }}%
        </div>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useWishlistStore } from '@/features/wishlist/store'

const props = defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['wishlist-change'])

const fallback = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'
const wishlistBusy = ref(false)
const wishlist = useWishlistStore()
const isWishlisted = computed(() => wishlist.has(props.product.id))
const hasDiscount = computed(() => {
  const base = Number(props.product.base_price || 0)
  const discount = Number(props.product.discount_price || 0)
  return Number.isFinite(base) && Number.isFinite(discount) && discount > 0 && discount < base
})
const discountPercent = computed(() => {
  const base = Number(props.product.base_price || 0)
  const discount = Number(props.product.discount_price || 0)
  if (!base || !discount || discount >= base) return 0
  return Math.round(((base - discount) / base) * 100)
})

async function ensureWishlistLoaded() {
  try {
    await wishlist.load()
  } catch (err) {
    console.error('Failed to load wishlist state', err)
  }
}

async function toggleWishlist() {
  if (wishlistBusy.value) return
  wishlistBusy.value = true
  try {
    const wishlisted = await wishlist.toggle(props.product)
    emit('wishlist-change', { productId: props.product.id, wishlisted })
  } catch (err) {
    console.error('Failed to toggle wishlist item', err)
  } finally {
    wishlistBusy.value = false
  }
}

onMounted(ensureWishlistLoaded)
</script>

<style scoped>
.product-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.product-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.1);
}

.product-media {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background: #f3f4f6;
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-media img {
  transform: scale(1.02);
}

.product-media::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.34) 0%, rgba(0, 0, 0, 0) 45%);
  pointer-events: none;
}

.media-top {
  position: absolute;
  inset: 12px 12px auto auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  z-index: 1;
}

.chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: capitalize;
  color: #fff;
  background: rgba(15, 23, 42, 0.62);
}

.chip-discount {
  background: rgba(185, 28, 28, 0.88);
}

.product-body {
  padding: 0.8rem 0.85rem 0.9rem;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.55rem;
}

.product-title {
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}

.wish-inline-btn {
  border: 0;
  background: transparent;
  color: #475569;
  font-size: 1.15rem;
  line-height: 1;
  padding: 0;
}

.wish-inline-btn:hover {
  color: #111827;
}

.wish-inline-btn.active {
  color: var(--as-gold, #c6a97a);
}

.product-meta {
  margin-top: 3px;
  font-size: 0.74rem;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: capitalize;
}

.price-row {
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.price-now {
  font-size: 1.02rem;
  font-weight: 700;
  color: #0f172a;
}

.price-old {
  font-size: 0.81rem;
  color: #6b7280;
  text-decoration: line-through;
}

.price-off {
  font-size: 0.72rem;
  font-weight: 700;
  color: #b91c1c;
  background: #fee2e2;
  border-radius: 999px;
  padding: 0.16rem 0.45rem;
}
</style>
