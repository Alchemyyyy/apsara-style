<template>
  <div class="product-detail-page" v-if="product">
    <div class="container-xxl py-4 py-lg-5">
      <div class="row g-4 g-xl-5 align-items-start">
        <div class="col-lg-7">
          <div class="gallery-grid">
            <div class="thumb-rail" v-if="product.images?.length">
              <button
                v-for="img in product.images"
                :key="img.id"
                class="thumb-btn"
                :class="{ active: activeImage === img.url }"
                @click="activeImage = img.url"
                :aria-label="`View ${product.title} image`"
              >
                <img :src="img.url" :alt="product.title" />
              </button>
            </div>

            <div class="hero-image-wrap">
              <img :src="activeImage || fallback" class="hero-image" :alt="product.title" />
              <span v-if="product.discount_price" class="hero-sale-badge">Sale</span>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="purchase-panel">
            <p class="brand-line mb-1">APSARA STYLE</p>
            <p class="product-meta mb-2">{{ product.category_name }} · {{ product.gender }}</p>
            <h1 class="product-title">{{ product.title }}</h1>

            <div class="price-wrap">
              <div class="sale-price">${{ Number(product.discount_price || product.base_price).toFixed(2) }}</div>
              <div v-if="product.discount_price" class="d-flex align-items-center gap-2 flex-wrap">
                <span class="base-price">${{ Number(product.base_price).toFixed(2) }}</span>
                <span class="discount-pill">-{{ discountPercent }}%</span>
              </div>
            </div>

            <div class="option-block">
              <div class="option-title">Color: <span>{{ selectedColor || '-' }}</span></div>
              <div class="option-grid">
                <button
                  v-for="c in colors"
                  :key="c"
                  class="option-btn"
                  :class="{ active: selectedColor === c, disabled: !hasVariantsForColor(c) }"
                  :disabled="!hasVariantsForColor(c)"
                  type="button"
                  @click="selectColor(c)"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <div class="option-block">
              <div class="option-title">Size: <span>{{ selectedSize || '-' }}</span></div>
              <div class="option-grid option-grid-size">
                <button
                  v-for="s in sizes"
                  :key="s"
                  class="option-btn"
                  :class="{ active: selectedSize === s, disabled: !hasVariantsForSize(s) }"
                  :disabled="!hasVariantsForSize(s)"
                  type="button"
                  @click="selectSize(s)"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <div class="stock-note">
              <span v-if="!selectedVariant" class="text-warning">This color/size combination is unavailable.</span>
              <span v-else-if="selectedVariantStock > 0" class="text-success">In stock: {{ selectedVariantStock }}</span>
              <span v-else class="text-danger">Out of stock</span>
            </div>

            <div class="cta-row mt-3">
              <button class="btn cta-main" @click="addToCart" :disabled="!selectedVariantId || adding">
                {{ adding ? 'Adding…' : 'Add to Bag' }}
              </button>
              <button
                class="btn cta-side"
                :class="{ active: isWishlisted }"
                type="button"
                :disabled="wishlistBusy || !product"
                :aria-label="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
                @click="toggleWishlist"
              >
                {{ isWishlisted ? '♥' : '♡' }}
              </button>
            </div>

            <div class="service-boxes">
              <div class="service-box">
                <div class="service-title">Shipping</div>
                <div class="service-text">Standard delivery in 2-5 business days.</div>
              </div>
              <div class="service-box">
                <div class="service-title">Returns</div>
                <div class="service-text">Easy returns within 14 days.</div>
              </div>
            </div>

            <div class="detail-accordion">
              <details open>
                <summary>Product details</summary>
                <p>{{ product.description || 'No description yet.' }}</p>
              </details>
              <details>
                <summary>Size & fit</summary>
                <p>Regular fit. Check selected size and stock before adding to bag.</p>
              </details>
              <details>
                <summary>SKU & tags</summary>
                <p v-if="selectedVariant?.sku">SKU: {{ selectedVariant.sku }}</p>
                <p v-if="product.tags?.style?.length || product.tags?.occasion?.length">
                  {{ product.tags?.style?.join(', ') }} {{ product.tags?.occasion?.length ? `· ${product.tags.occasion.join(', ')}` : '' }}
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>

    <section class="container-xxl pb-5" v-if="similar.length">
      <h3 class="similar-title">You may also like</h3>
      <ProductRow :items="similar" />
    </section>
  </div>

  <div v-else class="container py-5 text-center text-muted">Loading product…</div>

  <Transition name="bag-modal">
    <div v-if="showBagModal" class="bag-modal-backdrop" @click.self="closeBagModal">
      <div class="bag-modal">
        <h2 class="bag-modal-title">Added to Bag</h2>
        <p class="bag-modal-text">Your selected item has been added successfully.</p>

        <div class="bag-modal-item">
          <img class="bag-modal-image" :src="activeImage || fallback" :alt="product?.title || 'Product'" />
          <div class="bag-modal-meta">
            <div class="bag-item-title">{{ product?.title }}</div>
            <div class="bag-item-sub">{{ product?.category_name }} · {{ product?.gender }}</div>
            <div class="bag-item-sub">Color: {{ selectedColor || '-' }}</div>
            <div class="bag-item-sub">Size: {{ selectedSize || '-' }}</div>
            <div v-if="selectedVariant?.sku" class="bag-item-sub">SKU: {{ selectedVariant.sku }}</div>
            <div class="bag-item-price-row">
              <span class="bag-item-price">${{ modalUnitPrice }}</span>
              <span v-if="product?.discount_price" class="bag-item-base">${{ Number(product?.base_price || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="bag-modal-summary">
          <div class="summary-row"><span>Quantity</span><strong>1</strong></div>
          <div class="summary-row"><span>Total</span><strong>${{ modalUnitPrice }}</strong></div>
        </div>

        <div class="bag-modal-actions">
          <button class="btn btn-outline-dark" type="button" @click="closeBagModal">Continue Shopping</button>
          <RouterLink class="btn btn-dark" :to="{ name: 'cart' }" @click="closeBagModal">View Bag</RouterLink>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { http } from '@/api/http'
import { trackEvent } from '@/api/events'
import ProductRow from '@/components/products/ProductRow.vue'
import { useWishlistStore } from '@/stores/wishlistStore'

const props = defineProps({
  id: { type: String, required: true },
})

const adding = ref(false)
const wishlistBusy = ref(false)
const product = ref(null)
const activeImage = ref('')
const selectedColor = ref('')
const selectedSize = ref('')
const similar = ref([])
const showBagModal = ref(false)
const fallback = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80'
const wishlist = useWishlistStore()

const variants = computed(() => product.value?.variants || [])

const colors = computed(() => [...new Set(variants.value.map(v => v.color))])
const sizes = computed(() => [...new Set(variants.value.map(v => v.size))])
const selectedVariant = computed(() =>
  variants.value.find(v => v.color === selectedColor.value && v.size === selectedSize.value) || null
)
const discountPercent = computed(() => {
  const base = Number(product.value?.base_price || 0)
  const discount = Number(product.value?.discount_price || 0)
  if (!base || !discount || discount >= base) return 0
  return Math.round(((base - discount) / base) * 100)
})
const selectedVariantStock = computed(() => Number(selectedVariant.value?.stock || 0))
const selectedVariantId = computed(() => {
  if (!selectedVariant.value) return ''
  if (selectedVariantStock.value <= 0) return ''
  return selectedVariant.value.id
})
const modalUnitPrice = computed(() => Number(product.value?.discount_price || product.value?.base_price || 0).toFixed(2))
const isWishlisted = computed(() => {
  const productId = product.value?.id
  if (!productId) return false
  return wishlist.has(productId)
})

function closeBagModal() {
  showBagModal.value = false
}

async function ensureWishlistLoaded() {
  try {
    await wishlist.load()
  } catch (err) {
    console.error('Failed to load wishlist state', err)
  }
}

async function toggleWishlist() {
  if (wishlistBusy.value || !product.value?.id) return
  wishlistBusy.value = true
  try {
    await wishlist.toggle(product.value)
  } catch (err) {
    console.error('Failed to toggle wishlist item', err)
  } finally {
    wishlistBusy.value = false
  }
}

function hasVariantsForColor(color) {
  return variants.value.some((v) => v.color === color && Number(v.stock || 0) > 0)
}

function hasVariantsForSize(size) {
  if (selectedColor.value) {
    return variants.value.some(
      (v) => v.color === selectedColor.value && v.size === size && Number(v.stock || 0) > 0
    )
  }
  return variants.value.some((v) => v.size === size && Number(v.stock || 0) > 0)
}

function selectColor(color) {
  selectedColor.value = color
}

function selectSize(size) {
  selectedSize.value = size
}

async function addToCart() {
  if (!selectedVariantId.value) return
  adding.value = true
  let success = false
  try {
    await http.post('/cart/items', { variantId: selectedVariantId.value, qty: 1 })
    success = true
  } finally {
    adding.value = false
  }

  if (success) showBagModal.value = true

  await trackEvent('add_to_cart', {
    productId: product.value.id,
    meta: { variantId: selectedVariantId.value, qty: 1 }
  }) //
}

async function load() {
  const res = await http.get(`/products/${props.id}`)
  product.value = res.data.data
  activeImage.value = product.value.images?.[0]?.url || ''
  const firstAvailable = variants.value.find((v) => Number(v.stock || 0) > 0) || variants.value[0]
  selectedColor.value = firstAvailable?.color || colors.value[0] || ''
  selectedSize.value = firstAvailable?.size || sizes.value[0] || ''

  await trackEvent('view_product', { productId: product.value.id, meta: { page: 'product_detail' } })//
  await loadSimilar()
}

async function loadSimilar() {
  const res = await http.get(`/products/${props.id}/similar`, { params: { limit: 8 } })
  similar.value = res.data.data
}

onMounted(load)
onMounted(ensureWishlistLoaded)

// ✅ reload when clicking Similar items (route param changes)
watch(
  () => props.id,
  async () => {
    // reset state so UI doesn’t show old data
    product.value = null
    activeImage.value = ''
    selectedColor.value = ''
    selectedSize.value = ''
    similar.value = []
    showBagModal.value = false
    await load()
  }
)

</script>

<style scoped>
.product-detail-page {
  background: #f7f8fa;
  min-height: 100vh;
}

.gallery-grid {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 1rem;
}

.thumb-rail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: sticky;
  top: 98px;
}

.thumb-btn {
  border: 1px solid #d9d9d9;
  border-radius: 0;
  padding: 0;
  width: 100%;
  aspect-ratio: 1 / 1.2;
  overflow: hidden;
  background: #fff;
}

.thumb-btn.active {
  border-color: #111;
}

.thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-image-wrap {
  position: relative;
  background: #f5f5f5;
  border: 1px solid #ececec;
  overflow: hidden;
}

.hero-image {
  width: 100%;
  height: min(78vh, 940px);
  object-fit: cover;
}

.hero-sale-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  background: #c81e1e;
  color: #fff;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.purchase-panel {
  background: #fff;
  border: 1px solid #e7e7e7;
  padding: 1.1rem;
  position: sticky;
  top: 96px;
}

.brand-line {
  color: #111;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.product-title {
  margin: 0;
  font-size: clamp(1.3rem, 1.9vw, 1.7rem);
  line-height: 1.2;
  font-weight: 650;
  color: #111;
}

.product-meta {
  color: #666;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.price-wrap {
  margin-top: 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
}

.sale-price {
  font-size: 1.6rem;
  line-height: 1;
  font-weight: 700;
  color: #111;
}

.base-price {
  color: #666;
  text-decoration: line-through;
}

.discount-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  border-radius: 999px;
  color: #8d1f1f;
  background: #ffe4e4;
}

.product-description {
  margin: 1rem 0 0;
  color: #444;
  line-height: 1.6;
}

.option-block {
  margin-top: 1rem;
}

.option-title {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  font-weight: 650;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.55rem;
}

.option-title span {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.84rem;
  font-weight: 500;
  color: #222;
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.option-grid-size .option-btn {
  min-width: 56px;
}

.option-btn {
  border: 1px solid #cfcfcf;
  background: #fff;
  color: #111;
  border-radius: 0;
  min-height: 38px;
  padding: 0 0.9rem;
  font-size: 0.82rem;
  font-weight: 550;
}

.option-btn.active {
  border-color: #111;
  background: #111;
  color: #fff;
}

.option-btn.disabled {
  opacity: 0.38;
}

.stock-note {
  margin-top: 0.8rem;
  font-size: 0.84rem;
}

.cta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 0.45rem;
}

.cta-main {
  border-radius: 8px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  font-weight: 650;
  min-height: 48px;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.cta-main:hover:not(:disabled) {
  background: #262626;
  border-color: #262626;
  transform: translateY(-1px);
}

.cta-main:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cta-side {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #ccd4de;
  background: #fff;
  color: #1f2937;
  padding: 0;
  font-size: 1.35rem;
  line-height: 1;
  min-height: 48px;
  min-width: 48px;
  transition: border-color 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.cta-side:hover {
  border-color: #111;
  background: #f8fafc;
  color: #111;
}

.cta-side.active {
  border-color: var(--as-gold, #c6a97a);
  color: var(--as-gold, #c6a97a);
}

.bag-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.bag-modal {
  width: min(460px, 100%);
  background: #fff;
  border: 1px solid #e7e7e7;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
}

.bag-modal-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111;
}

.bag-modal-text {
  margin: 0.45rem 0 0;
  color: #475569;
  font-size: 0.9rem;
}

.bag-modal-item {
  margin-top: 0.8rem;
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  padding: 0.6rem;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 0.6rem;
  background: #f8fafc;
}

.bag-modal-image {
  width: 88px;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #dbe2ec;
  background: #fff;
}

.bag-modal-meta {
  min-width: 0;
}

.bag-item-title {
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.3;
  color: #111827;
}

.bag-item-sub {
  margin-top: 0.12rem;
  font-size: 0.78rem;
  color: #64748b;
}

.bag-item-price-row {
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.bag-item-price {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
}

.bag-item-base {
  font-size: 0.8rem;
  color: #64748b;
  text-decoration: line-through;
}

.bag-modal-summary {
  margin-top: 0.7rem;
  border: 1px solid #e6ebf2;
  border-radius: 10px;
  padding: 0.55rem 0.65rem;
  background: #fff;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #475569;
}

.summary-row + .summary-row {
  margin-top: 0.35rem;
}

.bag-modal-actions {
  margin-top: 0.95rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.bag-modal-enter-active,
.bag-modal-leave-active {
  transition: opacity 320ms ease;
}

.bag-modal-enter-active .bag-modal,
.bag-modal-leave-active .bag-modal {
  transition: transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease;
}

.bag-modal-enter-from,
.bag-modal-leave-to {
  opacity: 0;
}

.bag-modal-enter-from .bag-modal,
.bag-modal-leave-to .bag-modal {
  transform: translateY(14px) scale(0.97);
  opacity: 0;
}

.service-boxes {
  margin-top: 1rem;
  display: grid;
  gap: 0.5rem;
}

.service-box {
  border: 1px solid #ececec;
  padding: 0.7rem 0.75rem;
}

.service-title {
  font-size: 0.82rem;
  font-weight: 650;
  color: #111;
}

.service-text {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: #666;
}

.detail-accordion {
  margin-top: 1rem;
  border-top: 1px solid #ececec;
}

.detail-accordion details {
  border-bottom: 1px solid #ececec;
}

.detail-accordion summary {
  list-style: none;
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 650;
  color: #111;
  padding: 0.75rem 0;
}

.detail-accordion summary::-webkit-details-marker {
  display: none;
}

.detail-accordion p {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #555;
}

.similar-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 650;
  color: #111;
}

@media (max-width: 991.98px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .thumb-rail {
    order: 2;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    position: static;
  }

  .thumb-btn {
    width: 78px;
    min-width: 78px;
  }

  .hero-image {
    height: 560px;
  }

  .purchase-panel {
    position: static;
  }
}

@media (max-width: 575.98px) {
  .hero-image {
    height: 430px;
  }

  .purchase-panel {
    border-left: 0;
    border-right: 0;
    padding: 0.95rem 0;
  }
}
</style>
