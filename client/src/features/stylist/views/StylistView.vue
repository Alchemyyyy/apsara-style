<template>
  <div class="container py-5">
    <BrandLogo size="md" class="mb-1" />
    <h2 class="h4">AI Styling Assistant</h2>
    <p class="text-muted mb-4">
      Describe what you want, and Saby Order will curate a full outfit from the catalog.
    </p>

    <div class="row g-4">
      <div class="col-lg-5">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Your request</div>

          <label class="form-label">Prompt *</label>
          <textarea class="form-control" rows="3" v-model="form.prompt" placeholder="e.g. minimal office outfit in black"></textarea>

          <div class="row g-3 mt-2">
            <div class="col-6">
              <label class="form-label">Gender</label>
              <select class="form-select" v-model="form.gender">
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Occasion</label>
              <select class="form-select" v-model="form.occasion">
                <option value="">Any</option>
                <option value="office">Office</option>
                <option value="casual">Casual</option>
                <option value="evening">Evening</option>
                <option value="party">Party</option>
                <option value="travel">Travel</option>
                <option value="gym">Gym</option>
                <option value="wedding">Wedding</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Style</label>
              <select class="form-select" v-model="form.style">
                <option value="">Any</option>
                <option value="minimal">Minimal</option>
                <option value="smart-casual">Smart casual</option>
                <option value="formal">Formal</option>
                <option value="streetwear">Streetwear</option>
                <option value="classic">Classic</option>
                <option value="sporty">Sporty</option>
                <option value="modern">Modern</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Budget max ($)</label>
              <input class="form-control" type="number" min="0" v-model="form.budgetMax" placeholder="120" />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>

          <button class="btn btn-as w-100 mt-4" @click="generate" :disabled="loading">
            {{ loading ? 'Generating…' : 'Generate outfit' }}
          </button>

          <div class="text-muted small mt-3">
            Tip: try “wedding guest outfit”, “smart casual travel”, “minimal black office”.
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="bg-white border rounded-4 p-4 h-100">
          <div class="fw-semibold mb-3">Outfit</div>

          <div v-if="loading" class="text-muted py-5 text-center">Building your outfit…</div>
          <div v-else-if="!result" class="text-muted">No outfit yet. Generate one.</div>

          <div v-else>
            <div class="d-flex gap-2 mb-3 flex-wrap">
              <button
                v-for="(look, idx) in result.looks"
                :key="idx"
                class="btn btn-sm"
                :class="idx === selectedIndex ? 'btn-as' : 'btn-outline-dark'"
                @click="selectLook(idx)"
              >
                {{ look.label }}
              </button>

              <button class="btn btn-outline-dark btn-sm ms-auto" @click="generate" :disabled="loading">
                Regenerate
              </button>
            </div>

            <div v-if="currentLook?.outfit?.dress" class="mb-4">
              <div class="small text-muted mb-2">Dress</div>
              <ItemCard :item="currentLook.outfit.dress" />
            </div>

            <div v-else class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="small text-muted mb-2">Top</div>
                <ItemCard :item="currentLook?.outfit?.top" />
              </div>
              <div class="col-md-6">
                <div class="small text-muted mb-2">Bottom</div>
                <ItemCard :item="currentLook?.outfit?.bottom" />
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <div class="small text-muted mb-2">Shoes</div>
                <ItemCard :item="currentLook?.outfit?.shoes" />
              </div>
              <div class="col-md-6">
                <div class="small text-muted mb-2">Outerwear (optional)</div>
                <ItemCard :item="currentLook?.outfit?.outerwear" />
              </div>
            </div>

            <div class="mt-4">
              <RouterLink class="btn btn-outline-dark w-100" :to="{ name: 'products', params: { gender: form.gender } }">
                Browse more
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { ref } from 'vue'
import { http } from '@/shared/api/http'
import { computed } from 'vue'
import { trackEvent } from '@/shared/api/events'

const form = ref({
  prompt: '',
  gender: 'women',
  occasion: '',
  style: '',
  budgetMax: '',
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const selectedIndex = ref(0)//
const currentLook = computed(() => result.value?.looks?.[selectedIndex.value] || null)//

async function generate() {
  error.value = ''
  result.value = null
  if (!form.value.prompt.trim()) return (error.value = 'Please write a prompt.')

  loading.value = true
  try {
    const res = await http.post('/stylist', {
      prompt: form.value.prompt,
      gender: form.value.gender,
      occasion: form.value.occasion || null,
      style: form.value.style || null,
      budgetMax: form.value.budgetMax ? Number(form.value.budgetMax) : null,
      k: 3,
    })
    result.value = res.data.data
    selectedIndex.value = 0 //
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to generate outfit.'
  } finally {
    loading.value = false
  }
}

async function selectLook(idx) {
  selectedIndex.value = idx
  await trackEvent('stylist_pick', {
    meta: {
      lookIndex: idx + 1,
      prompt: form.value.prompt,
      gender: form.value.gender,
      occasion: form.value.occasion,
      style: form.value.style,
    }
  })
}

const ItemCard = {
  props: ['item'],
  template: `
    <div v-if="item" class="card card-minimal shadow-sm h-100">
      <img :src="item.hero_image" class="w-100" style="height: 260px; object-fit: cover;" />
      <div class="p-3">
        <div class="fw-semibold text-truncate">{{ item.title }}</div>
        <div class="text-muted small text-truncate">{{ item.category_slug }}</div>
        <div class="mt-2 fw-semibold">$ {{ Number(item.discount_price || item.base_price).toFixed(2) }}</div>
        <RouterLink class="btn btn-outline-dark btn-sm mt-3 w-100" :to="{ name: 'productDetail', params: { id: item.id } }">View</RouterLink>
      </div>
    </div>
    <div v-else class="text-muted">No item found.</div>
  `
}
</script>
