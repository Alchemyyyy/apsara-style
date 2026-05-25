<template>
  <div class="products-page">
    <div class="container-xxl py-4 py-lg-5">
      <section class="catalog-head">
        <BrandLogo size="md" class="mb-1" />
        <div class="d-flex align-items-end justify-content-between flex-wrap gap-2">
          <h1 class="collection-title text-capitalize mb-0">{{ gender }} Collection</h1>
          <button class="btn btn-dark btn-sm d-lg-none" @click="openFilters">
            Filter & Sort
            <span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
          </button>
        </div>
      </section>

      <div class="catalog-layout">
        <aside class="filter-rail">
          <div class="rail-section">
            <div class="rail-title">Shop By Type</div>
            <div class="rail-links">
              <button class="rail-link" :class="{ active: draftCategory === '' }" @click="applyCategoryFromRail('')">All</button>
              <button
                v-for="type in categoryOptions"
                :key="`rail-${type.slug}`"
                class="rail-link"
                :class="{ active: draftCategory === type.slug }"
                @click="applyCategoryFromRail(type.slug)"
              >
                <span>{{ type.name }}</span>
                <span class="count">{{ countFor(type) }}</span>
              </button>
            </div>
          </div>

          <div class="rail-section">
            <div class="rail-title">Price</div>
            <div class="row g-2">
              <div class="col-6">
                <input class="form-control form-control-sm" v-model="draftMinPrice" inputmode="decimal" placeholder="Min" />
              </div>
              <div class="col-6">
                <input class="form-control form-control-sm" v-model="draftMaxPrice" inputmode="decimal" placeholder="Max" />
              </div>
            </div>
            <div class="quick-price-grid mt-2">
              <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('', '50')">Under $50</button>
              <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('50', '100')">$50 - $100</button>
              <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('100', '200')">$100 - $200</button>
              <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('200', '')">$200+</button>
            </div>
          </div>

          <div class="rail-section">
            <div class="form-check mb-3">
              <input id="discount-rail" v-model="draftDiscountOnly" class="form-check-input" type="checkbox" />
              <label class="form-check-label" for="discount-rail">On sale only</label>
            </div>
            <div class="d-grid gap-2">
              <button class="btn btn-dark btn-sm" :disabled="loading" @click="applyFilters">Apply Filters</button>
              <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">Reset</button>
            </div>
          </div>
        </aside>

        <main class="catalog-main">
          <section class="catalog-toolbar mb-3">
            <div class="text-muted small">
              {{ meta.total || 0 }} items
            </div>
            <div class="toolbar-actions">
              <select class="form-select form-select-sm" v-model="sort" @change="onSortDirectChange">
                <option value="recommend">Recommend</option>
                <option value="newest">New items</option>
                <option value="price_desc">Price (High First)</option>
                <option value="price_asc">Price (Low First)</option>
                <option value="discount_desc">Discount (High First)</option>
                <option value="discount_asc">Discount (Low First)</option>
              </select>
            </div>
          </section>

          <section class="filters-wrap mb-3" v-if="activeFilterCount > 0">
            <div class="filters-row">
              <div class="types-scroll active-types">
                <button v-if="selectedCategory" class="type-chip active" @click="clearSingle('category')">
                  Type: {{ selectedCategory }} ×
                </button>
                <button v-if="minPrice" class="type-chip active" @click="clearSingle('minPrice')">
                  Min: ${{ minPrice }} ×
                </button>
                <button v-if="maxPrice" class="type-chip active" @click="clearSingle('maxPrice')">
                  Max: ${{ maxPrice }} ×
                </button>
                <button v-if="sort !== 'recommend'" class="type-chip active" @click="clearSingle('sort')">
                  Sort: {{ sortLabel }} ×
                </button>
                <button v-if="discountOnly" class="type-chip active" @click="clearSingle('discount')">
                  On Sale ×
                </button>
              </div>

              <div class="controls-row">
                <button class="btn btn-outline-secondary btn-sm" @click="resetFilters">Clear All</button>
              </div>
            </div>
          </section>

          <div v-if="errorMessage" class="alert alert-danger d-flex justify-content-between align-items-center gap-2">
            <span>{{ errorMessage }}</span>
            <button class="btn btn-sm btn-outline-dark" @click="fetchProducts">Try again</button>
          </div>

          <div v-if="loading" class="row g-3 g-lg-4 mt-1">
            <div :class="productColClass" v-for="n in 9" :key="`skeleton-${n}`">
              <div class="product-skeleton" />
            </div>
          </div>

          <div v-else-if="products.length === 0" class="empty-wrap mt-3">
            <h3 class="h6 mb-1">No products found</h3>
            <p class="text-muted mb-3">Try changing filters or refresh this collection.</p>
            <div class="d-flex gap-2 justify-content-center flex-wrap">
              <button class="btn btn-dark btn-sm" @click="resetFilters">Clear Filters</button>
              <button class="btn btn-outline-dark btn-sm" @click="refresh">Refresh</button>
            </div>
          </div>

          <div v-else class="row g-3 g-lg-4 mt-1">
            <div :class="productColClass" v-for="p in products" :key="p.id">
              <ProductCard :product="p" />
            </div>
          </div>

          <div v-if="enableLoadMore && products.length > 0" class="load-more-wrap mt-4">
            <div class="text-muted small" v-if="meta.total > products.length">
              Showing {{ products.length }} of {{ meta.total }} items
            </div>
            <button
              v-if="canLoadMore"
              class="btn btn-dark btn-sm"
              :disabled="loading"
              @click="loadMore"
            >
              {{ loading ? 'Loading…' : 'Load More' }}
            </button>
          </div>

          <AppPagination
            v-if="!enableLoadMore"
            class="mt-4 mt-lg-5"
            :model-value="page"
            :total-pages="meta.totalPages || 1"
            :loading="loading"
            active-class="btn-as"
            inactive-class="btn-outline-secondary"
            nav-class="btn-outline-dark"
            @update:modelValue="onPageChange"
          />
        </main>
      </div>
    </div>

    <div v-if="filtersOpen" class="offcanvas-backdrop" @click.self="closeFilters">
      <aside class="offcanvas-panel">
        <div class="offcanvas-header">
          <h2 class="h6 mb-0">Filter Products</h2>
          <button class="btn btn-sm btn-outline-dark" @click="closeFilters">x</button>
        </div>

        <div class="offcanvas-body">
          <div class="mb-3">
            <label class="form-label">Type</label>
            <select class="form-select" v-model="draftCategory">
              <option value="">All Types</option>
              <option v-for="type in categoryOptions" :key="type.slug" :value="type.slug">
                {{ type.name }} ({{ countFor(type) }})
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Sort</label>
            <select class="form-select" v-model="draftSort">
              <option value="recommend">Recommend</option>
              <option value="newest">New items</option>
              <option value="price_desc">Price (High First)</option>
              <option value="price_asc">Price (Low First)</option>
              <option value="discount_desc">Discount (High First)</option>
              <option value="discount_asc">Discount (Low First)</option>
            </select>
          </div>

          <div class="mb-3">
            <div class="form-check">
              <input id="discount-only" v-model="draftDiscountOnly" class="form-check-input" type="checkbox" />
              <label class="form-check-label" for="discount-only">On sale only</label>
            </div>
          </div>

          <div class="mb-2">
            <label class="form-label">Price Range</label>
            <div class="row g-2">
              <div class="col-6">
                <input class="form-control" v-model="draftMinPrice" inputmode="decimal" placeholder="Min $" />
              </div>
              <div class="col-6">
                <input class="form-control" v-model="draftMaxPrice" inputmode="decimal" placeholder="Max $" />
              </div>
            </div>
          </div>

          <div class="quick-price-grid mt-2">
            <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('', '50')">Under $50</button>
            <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('50', '100')">$50 - $100</button>
            <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('100', '200')">$100 - $200</button>
            <button class="btn btn-outline-secondary btn-sm" @click="setQuickPrice('200', '')">$200+</button>
          </div>
        </div>

        <div class="offcanvas-footer">
          <button class="btn btn-outline-secondary" @click="resetFilters">Reset</button>
          <button class="btn btn-dark" :disabled="loading" @click="applyFilters">
            {{ loading ? 'Applying…' : 'Apply Filters' }}
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/shared/api/http'
import ProductCard from '@/features/products/components/ProductCard.vue'
import AppPagination from '@/shared/components/common/AppPagination.vue'

const props = defineProps({
  gender: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const MOBILE_BREAKPOINT = 992

const products = ref([])
const meta = ref({ page: 1, limit: 12, total: 0, totalPages: 1 })
const page = ref(1)
const sort = ref('recommend')
const loading = ref(false)
const errorMessage = ref('')
const categories = ref([])
const selectedCategory = ref('')
const minPrice = ref('')
const maxPrice = ref('')
const discountOnly = ref(false)
const filtersOpen = ref(false)
const draftCategory = ref('')
const draftSort = ref('recommend')
const draftMinPrice = ref('')
const draftMaxPrice = ref('')
const draftDiscountOnly = ref(false)
const isMobile = ref(false)
const hasHydrated = ref(false)
const productColClass = computed(() => 'col-6 col-xl-4')
const perPageLimit = computed(() => (isMobile.value ? 12 : 24))
const enableLoadMore = computed(() => isMobile.value)
const canLoadMore = computed(() => page.value < Number(meta.value?.totalPages || 1))

const categoryOptions = computed(() => {
  const seen = new Set()
  return categories.value.filter((c) => {
    const slug = String(c?.slug || '').trim().toLowerCase()
    if (!slug || seen.has(slug)) return false
    if (countFor(c) <= 0) return false
    seen.add(slug)
    return true
  })
})

function countFor(category) {
  return Number(category?.counts?.[props.gender] || 0)
}

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedCategory.value) count += 1
  if (minPrice.value) count += 1
  if (maxPrice.value) count += 1
  if (sort.value !== 'recommend') count += 1
  if (discountOnly.value) count += 1
  return count
})

const sortLabel = computed(() => {
  if (sort.value === 'recommend') return 'Recommend'
  if (sort.value === 'newest') return 'New items'
  if (sort.value === 'price_desc') return 'Price (High First)'
  if (sort.value === 'price_asc') return 'Low to High'
  if (sort.value === 'discount_desc') return 'Discount (High First)'
  if (sort.value === 'discount_asc') return 'Discount (Low First)'
  return 'Recommend'
})

async function loadMeta() {
  try {
    const res = await http.get('/products/meta')
    categories.value = Array.isArray(res.data?.data?.categories) ? res.data.data.categories : []
  } catch {
    categories.value = []
  }
}

async function fetchProducts({ append = false } = {}) {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await http.get('/products', {
      params: {
        gender: props.gender,
        page: page.value,
        limit: perPageLimit.value,
        sort: sort.value,
        category: selectedCategory.value || undefined,
        minPrice: minPrice.value || undefined,
        maxPrice: maxPrice.value || undefined,
        discount: discountOnly.value ? 1 : undefined,
      },
    })
    const incoming = Array.isArray(res.data?.data) ? res.data.data : []
    products.value = append ? [...products.value, ...incoming] : incoming
    meta.value = res.data.meta
  } catch (err) {
    errorMessage.value = err?.response?.data?.error || 'Failed to load products.'
    products.value = []
    meta.value = { page: 1, limit: perPageLimit.value, total: 0, totalPages: 1 }
  } finally {
    loading.value = false
  }
}

function loadMore() {
  if (!canLoadMore.value || loading.value) return
  page.value += 1
}

function openFilters() {
  draftCategory.value = selectedCategory.value
  draftSort.value = sort.value
  draftMinPrice.value = minPrice.value
  draftMaxPrice.value = maxPrice.value
  draftDiscountOnly.value = discountOnly.value
  filtersOpen.value = true
}

function closeFilters() {
  filtersOpen.value = false
}

function sanitizePrice(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return ''
  return String(num)
}

function setQuickPrice(min, max) {
  draftMinPrice.value = min
  draftMaxPrice.value = max
}

function syncQueryFromState() {
  router.replace({
    query: {
      ...route.query,
      category: selectedCategory.value || undefined,
      sort: sort.value !== 'recommend' ? sort.value : undefined,
      minPrice: minPrice.value || undefined,
      maxPrice: maxPrice.value || undefined,
      discount: discountOnly.value ? '1' : undefined,
    },
  })
}

function applyCategoryFromRail(slug) {
  draftCategory.value = slug
  applyFilters()
}

function applyFilters() {
  const nextMin = sanitizePrice(draftMinPrice.value)
  const nextMax = sanitizePrice(draftMaxPrice.value)

  if (nextMin && nextMax && Number(nextMin) > Number(nextMax)) {
    errorMessage.value = 'Min price cannot be greater than max price.'
    return
  }

  selectedCategory.value = String(draftCategory.value || '')
  sort.value = String(draftSort.value || 'recommend')
  minPrice.value = nextMin
  maxPrice.value = nextMax
  discountOnly.value = Boolean(draftDiscountOnly.value)

  page.value = 1
  closeFilters()
  syncQueryFromState()
}

function resetFilters() {
  draftCategory.value = ''
  draftSort.value = 'recommend'
  draftMinPrice.value = ''
  draftMaxPrice.value = ''
  selectedCategory.value = ''
  sort.value = 'recommend'
  minPrice.value = ''
  maxPrice.value = ''
  discountOnly.value = false
  page.value = 1
  errorMessage.value = ''
  router.replace({
    query: {
      ...route.query,
      category: undefined,
      sort: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      discount: undefined,
    },
  })
}

function clearSingle(name) {
  if (name === 'category') selectedCategory.value = ''
  if (name === 'sort') sort.value = 'recommend'
  if (name === 'minPrice') minPrice.value = ''
  if (name === 'maxPrice') maxPrice.value = ''
  if (name === 'discount') discountOnly.value = false
  page.value = 1
  syncQueryFromState()
}

function onSortDirectChange() {
  draftSort.value = sort.value
  page.value = 1
  syncQueryFromState()
}

function refresh() {
  page.value = 1
  fetchProducts()
}

function onPageChange(n) {
  if (!Number.isInteger(n) || n < 1 || n === page.value) return
  page.value = n
}

function updateViewportFlags() {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

watch(
  () => props.gender,
  async () => {
    page.value = 1
    selectedCategory.value = ''
    sort.value = 'recommend'
    minPrice.value = ''
    maxPrice.value = ''
    discountOnly.value = false
    await router.replace({ query: {} })
    await fetchProducts()
  }
)

watch(page, () => {
  const append = enableLoadMore.value && page.value > 1
  fetchProducts({ append })
})

watch(enableLoadMore, () => {
  if (!hasHydrated.value) return
  page.value = 1
  fetchProducts()
})

watch(
  () => [route.query.category, route.query.sort, route.query.minPrice, route.query.maxPrice, route.query.discount],
  ([categoryValue, sortValue, minValue, maxValue, discountValue]) => {
    selectedCategory.value = String(categoryValue || '')
    sort.value = String(sortValue || 'recommend')
    minPrice.value = sanitizePrice(minValue)
    maxPrice.value = sanitizePrice(maxValue)
    discountOnly.value = ["1", "true", "yes", "on"].includes(String(discountValue || '').toLowerCase())
    draftCategory.value = selectedCategory.value
    draftSort.value = sort.value
    draftMinPrice.value = minPrice.value
    draftMaxPrice.value = maxPrice.value
    draftDiscountOnly.value = discountOnly.value
    page.value = 1
    fetchProducts()
  }
)

onMounted(async () => {
  updateViewportFlags()
  window.addEventListener('resize', updateViewportFlags)
  selectedCategory.value = String(route.query.category || '')
  sort.value = String(route.query.sort || 'recommend')
  minPrice.value = sanitizePrice(route.query.minPrice)
  maxPrice.value = sanitizePrice(route.query.maxPrice)
  discountOnly.value = ["1", "true", "yes", "on"].includes(String(route.query.discount || '').toLowerCase())
  draftCategory.value = selectedCategory.value
  draftSort.value = sort.value
  draftMinPrice.value = minPrice.value
  draftMaxPrice.value = maxPrice.value
  draftDiscountOnly.value = discountOnly.value
  await loadMeta()
  await fetchProducts()
  hasHydrated.value = true
})

onUnmounted(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('resize', updateViewportFlags)
})
</script>

<style scoped>
.products-page {
  background: #ffffff;
  min-height: 100vh;
}

.catalog-head {
  margin-bottom: 1rem;
}

.collection-title {
  font-size: clamp(1.2rem, 2.2vw, 1.9rem);
  font-weight: 650;
  letter-spacing: -0.02em;
}

.catalog-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.2rem;
  transition: grid-template-columns 280ms ease;
}

.filter-rail {
  display: none;
  overflow: hidden;
}

.rail-section + .rail-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--as-border);
}

.rail-title {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--as-pink-dark);
  margin-bottom: 0.6rem;
}

.rail-links {
  display: grid;
  gap: 0.2rem;
}

.rail-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.45rem 0.2rem;
  border-radius: 6px;
  color: var(--as-ink);
  font-size: 0.92rem;
}

.rail-link.active {
  background: var(--as-blush-soft);
  font-weight: 600;
}

.rail-link .count {
  color: #8a7a82;
  font-size: 0.82rem;
}

.catalog-main {
  min-width: 0;
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  background: #fff;
  border: 1px solid var(--as-border);
  border-radius: 12px;
  padding: 0.7rem 0.8rem;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.toolbar-actions .form-select {
  width: 260px;
}

.filters-wrap {
  border: 1px solid var(--as-border);
  border-radius: 12px;
  background: #fff;
  padding: 0.55rem;
}

.filters-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.types-scroll {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.type-chip {
  border: 1px solid var(--as-border);
  background: #fff;
  color: var(--as-ink);
  border-radius: 999px;
  height: 34px;
  padding: 0 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.type-chip.active {
  border-color: var(--as-pink);
  background: var(--as-blush-soft);
  color: var(--as-pink-deep);
}

.active-types .type-chip {
  height: 32px;
}

.chip-count {
  margin-left: 0.2rem;
  opacity: 0.8;
}

.controls-row {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}

.product-skeleton {
  height: 470px;
  border-radius: 12px;
  border: 1px solid var(--as-border);
  background:
    linear-gradient(90deg, #fff1f6 25%, #f7ddea 37%, #fff1f6 63%);
  background-size: 400% 100%;
  animation: shimmer 1.3s ease infinite;
}

.empty-wrap {
  border: 1px dashed var(--as-border);
  border-radius: 14px;
  background: #fff;
  text-align: center;
  padding: 2.2rem 1rem;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  margin-left: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  background: #fff;
  color: var(--as-pink-deep);
}

.offcanvas-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1080;
  background: rgba(22, 17, 19, 0.45);
  display: flex;
  justify-content: flex-end;
}

.offcanvas-panel {
  width: min(420px, 92vw);
  height: 100%;
  background: #fff;
  border-left: 1px solid var(--as-border);
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 30px rgba(87, 48, 64, 0.2);
}

.offcanvas-header,
.offcanvas-footer {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.offcanvas-footer {
  border-bottom: 0;
  border-top: 1px solid #e2e8f0;
}

.offcanvas-body {
  padding: 1rem;
  overflow-y: auto;
}

.quick-price-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

.load-more-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}

@media (max-width: 991.98px) {
  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .filters-wrap {
    padding: 0.55rem;
  }

  .catalog-toolbar {
    padding: 0.6rem 0.65rem;
  }

  .toolbar-actions .form-select {
    width: 210px;
  }
}

@media (min-width: 992px) {
  .filter-rail {
    display: block;
    align-self: start;
    position: sticky;
    top: 86px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    opacity: 1;
    transform: translateX(0);
    max-width: 100%;
  }
}

@media (max-width: 767.98px) {
  .controls-row {
    width: 100%;
  }

  .controls-row .form-select,
  .controls-row .btn {
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
  }

  .toolbar-actions .form-select,
  .toolbar-actions .btn {
    width: 100%;
  }

  .catalog-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .product-skeleton {
    height: 360px;
  }
}
</style>
