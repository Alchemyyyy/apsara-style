<template>
  <div class="container py-5" v-if="product">
    <div class="row g-4">
      <div class="col-lg-7">
        <div class="card card-minimal shadow-sm">
          <img
            :src="activeImage || fallback"
            class="w-100"
            style="height: 640px; object-fit: cover;"
            :alt="product.title"
          />
        </div>

        <div class="d-flex gap-2 mt-3 flex-wrap">
          <button
            v-for="img in product.images"
            :key="img.id"
            class="btn btn-light border"
            style="padding: 0; width: 84px; height: 110px; overflow: hidden;"
            @click="activeImage = img.url"
          >
            <img :src="img.url" style="width: 100%; height: 100%; object-fit: cover;" />
          </button>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="brand-wordmark mb-2">APSARA STYLE</div>
        <h1 class="h3 fw-semibold">{{ product.title }}</h1>
        <div class="text-muted">{{ product.category_name }} · {{ product.gender }}</div>

        <div class="mt-3 d-flex align-items-center gap-2">
          <div class="h4 mb-0 fw-semibold">
            ${{ Number(product.discount_price || product.base_price).toFixed(2) }}
          </div>
          <div v-if="product.discount_price" class="text-muted text-decoration-line-through">
            ${{ Number(product.base_price).toFixed(2) }}
          </div>
        </div>

        <p class="text-muted mt-3">{{ product.description }}</p>

        <div class="row g-2 mt-3">
          <div class="col-6">
            <label class="form-label">Color</label>
            <select class="form-select" v-model="selectedColor">
              <option v-for="c in colors" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="col-6">
            <label class="form-label">Size</label>
            <select class="form-select" v-model="selectedSize">
              <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <button class="btn btn-as w-100 mt-4" @click="addToCart" :disabled="!selectedVariantId || adding">
          {{ adding ? 'Adding…' : 'Add to Cart' }}
        </button>

        <RouterLink class="btn btn-outline-dark w-100 mt-2" :to="{ name: 'cart' }">
          View Cart
        </RouterLink>

        <div class="mt-4 small text-muted">
          Tags: {{ product.tags?.style?.join(', ') }} · {{ product.tags?.occasion?.join(', ') }}
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container py-5 text-center text-muted">Loading product…</div>
  <section class="container pb-5" v-if="similar.length">
    <h3 class="h5 mt-5 mb-3">You may also like</h3>
    <ProductRow :items="similar" />
  </section>

</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { http } from '@/api/http'
import { trackEvent } from '@/api/events'
import ProductRow from '@/components/products/ProductRow.vue'

const props = defineProps({
  id: { type: String, required: true },
})

const adding = ref(false)
const product = ref(null)
const activeImage = ref('')
const selectedColor = ref('')
const selectedSize = ref('')
const similar = ref([])
const fallback = 'https://picsum.photos/seed/apsara-detail/900/1200'

const variants = computed(() => product.value?.variants || [])

const colors = computed(() => [...new Set(variants.value.map(v => v.color))])
const sizes = computed(() => [...new Set(variants.value.map(v => v.size))])
const selectedVariantId = computed(() => {
  const v = variants.value.find(v => v.color === selectedColor.value && v.size === selectedSize.value)
  if (!v) return ''
  if (Number(v.stock) <= 0) return ''
  return v.id
})

async function addToCart() {
  if (!selectedVariantId.value) return
  adding.value = true
  try {
    await http.post('/cart/items', { variantId: selectedVariantId.value, qty: 1 })
  } finally {
    adding.value = false
  }

  await trackEvent('add_to_cart', {
    productId: product.value.id,
    meta: { variantId: selectedVariantId.value, qty: 1 }
  }) //
}

async function load() {
  const res = await http.get(`/products/${props.id}`)
  product.value = res.data.data
  activeImage.value = product.value.images?.[0]?.url || ''
  selectedColor.value = colors.value[0] || ''
  selectedSize.value = sizes.value[0] || ''

  await trackEvent('view_product', { productId: product.value.id, meta: { page: 'product_detail' } })//
  await loadSimilar()
}

async function loadSimilar() {
  const res = await http.get(`/products/${props.id}/similar`, { params: { limit: 8 } })
  similar.value = res.data.data
}

onMounted(load)

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
    await load()
  }
)

</script>
