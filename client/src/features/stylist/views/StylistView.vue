<template>
  <div class="stylist-page container py-5">
    <section class="stylist-hero mb-4">
      <BrandLogo size="md" class="stylist-hero-logo" />
      <div>
        <div class="stylist-eyebrow">Style Studio</div>
        <h1 class="stylist-title">AI Styling Assistant</h1>
        <p class="stylist-subtitle mb-0">
          Describe the mood, budget, and occasion. Saby Order will build complete looks from your live catalog.
        </p>
      </div>
    </section>

    <div class="row g-4 align-items-start">
      <div class="col-lg-5">
        <div class="stylist-card request-card bg-white border rounded-4 p-4">
          <div class="section-kicker mb-3">Your Request</div>

          <label class="form-label form-label-strong">Prompt *</label>
          <textarea
            class="form-control stylist-textarea"
            rows="3"
            maxlength="500"
            v-model="form.prompt"
            placeholder="e.g. minimal office outfit in black"
          ></textarea>
          <div class="d-flex justify-content-between align-items-center gap-2 mt-2">
            <div class="prompt-examples">
              <button
                v-for="example in promptExamples"
                :key="example"
                type="button"
                class="prompt-chip"
                @click="usePromptExample(example)"
              >
                {{ example }}
              </button>
            </div>
            <span class="text-muted small flex-shrink-0">{{ promptLength }}/500</span>
          </div>

          <div class="row g-3 mt-2">
            <div class="col-6">
              <label class="form-label form-label-strong">Audience</label>
              <select class="form-select stylist-input" v-model="form.gender">
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label form-label-strong">Occasion</label>
              <select class="form-select stylist-input" v-model="form.occasion">
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
              <label class="form-label form-label-strong">Style</label>
              <select class="form-select stylist-input" v-model="form.style">
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
              <label class="form-label form-label-strong">Budget max ($)</label>
              <input class="form-control stylist-input" type="number" min="0" v-model="form.budgetMax" placeholder="120" />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>

          <button class="btn btn-as w-100 mt-4 stylist-generate-btn" @click="generate" :disabled="loading || !canGenerate">
            {{ loading ? 'Generating…' : 'Generate outfit' }}
          </button>

          <div class="text-muted small mt-3">
            Tip: add occasion, color, fit, or budget to improve the outfit.
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="stylist-card result-card bg-white border rounded-4 p-4 h-100">
          <div class="result-head mb-3">
            <div>
              <div class="section-kicker">Outfit Board</div>
              <div class="result-title">Generated looks</div>
            </div>
            <RouterLink class="btn btn-sm btn-outline-dark" :to="{ name: 'products', params: { gender: form.gender } }">
              Browse catalog
            </RouterLink>
          </div>

          <div v-if="loading" class="loading-board">
            <div class="loading-copy">Building your outfit...</div>
            <div class="loading-grid">
              <div class="loading-card" v-for="slot in 4" :key="slot"></div>
            </div>
          </div>
          <div v-else-if="!result" class="empty-board">
            <div class="empty-mark">S</div>
            <div class="empty-title">No look generated yet</div>
            <p class="empty-copy mb-0">Start with a prompt like “smart casual travel look” and the stylist will build outfit options here.</p>
          </div>

          <div v-else>
            <div class="stylist-summary mb-3">
              <span>{{ result.candidateCount || 0 }} products considered</span>
              <span v-if="currentLook?.estimatedTotal != null">Estimated total: ${{ Number(currentLook.estimatedTotal).toFixed(2) }}</span>
              <span v-if="currentLook?.isComplete">Complete look</span>
            </div>

            <div v-if="result.budgetRelaxed" class="alert alert-warning small py-2">
              No complete matches were found inside your budget, so the stylist showed the closest available products.
            </div>

            <div v-if="currentLook?.missingSlots?.length" class="alert alert-light border small py-2">
              Missing: {{ currentLook.missingSlots.join(', ') }}. Add more products in those categories to complete this look.
            </div>

            <div class="look-tabs mb-3">
              <button
                v-for="(look, idx) in result.looks"
                :key="idx"
                class="look-tab"
                :class="{ active: idx === selectedIndex }"
                @click="selectLook(idx)"
              >
                {{ look.label }}
                <span v-if="look.isComplete" class="look-dot"></span>
              </button>

              <button class="btn btn-outline-dark btn-sm ms-auto regenerate-btn" @click="generate" :disabled="loading || !canGenerate">
                Regenerate
              </button>
            </div>

            <div v-if="currentLook?.outfit?.dress" class="mb-4">
              <div class="slot-title">Dress</div>
              <ItemCard :item="currentLook.outfit.dress" />
            </div>

            <div v-else class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="slot-title">Top</div>
                <ItemCard :item="currentLook?.outfit?.top" />
              </div>
              <div class="col-md-6">
                <div class="slot-title">Bottom</div>
                <ItemCard :item="currentLook?.outfit?.bottom" />
              </div>
            </div>

            <div class="row g-3">
              <div class="col-md-6">
                <div class="slot-title">Shoes</div>
                <ItemCard :item="currentLook?.outfit?.shoes" />
              </div>
              <div class="col-md-6">
                <div class="slot-title">Outerwear <span>optional</span></div>
                <ItemCard :item="currentLook?.outfit?.outerwear" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import ItemCard from '@/features/stylist/components/StylistItemCard.vue'
import { computed, ref } from 'vue'
import { http } from '@/shared/api/http'
import { trackEvent } from '@/shared/api/events'

const promptExamples = [
  'minimal office outfit in black',
  'smart casual travel look',
  'wedding guest outfit',
]

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
const selectedIndex = ref(0)
const promptLength = computed(() => form.value.prompt.trim().length)
const canGenerate = computed(() => promptLength.value >= 3 && promptLength.value <= 500)
const currentLook = computed(() => result.value?.looks?.[selectedIndex.value] || null)

function usePromptExample(text) {
  form.value.prompt = text
  error.value = ''
}

async function generate() {
  error.value = ''
  result.value = null
  if (!form.value.prompt.trim()) return (error.value = 'Please write a prompt.')
  if (!canGenerate.value) return (error.value = 'Prompt must be between 3 and 500 characters.')

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
    selectedIndex.value = 0
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
</script>

<style scoped>
.stylist-page {
  max-width: 1180px;
}

.stylist-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  border: 1px solid var(--as-border);
  border-radius: 1.25rem;
  padding: 1.2rem;
  background: #fff;
  box-shadow: 0 14px 36px rgba(87, 48, 64, 0.05);
}

.stylist-hero-logo {
  width: 86px;
}

.stylist-eyebrow,
.section-kicker {
  color: var(--as-pink-dark);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stylist-title {
  margin: 0.15rem 0 0.35rem;
  font-size: clamp(1.7rem, 2.3vw, 2.45rem);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--as-ink);
}

.stylist-subtitle {
  max-width: 720px;
  color: #695861;
  line-height: 1.6;
}

.stylist-card {
  border-color: var(--as-border) !important;
  box-shadow: 0 12px 34px rgba(87, 48, 64, 0.06);
}

.request-card {
  position: sticky;
  top: 108px;
}

.form-label-strong {
  font-size: 0.82rem;
  font-weight: 700;
  color: #34272d;
}

.stylist-textarea,
.stylist-input {
  border-color: #ead7e0;
}

.stylist-textarea:focus,
.stylist-input:focus {
  border-color: var(--as-pink);
  box-shadow: 0 0 0 0.14rem rgba(233, 110, 165, 0.14);
}

.prompt-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.prompt-chip {
  border: 1px solid var(--as-border);
  border-radius: 999px;
  background: #fff;
  color: #6d4055;
  padding: 0.18rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 600;
}

.prompt-chip:hover {
  border-color: var(--as-pink);
  color: var(--as-pink-dark);
}

.stylist-generate-btn {
  min-height: 46px;
  font-weight: 800;
}

.result-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.result-title {
  margin-top: 0.15rem;
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--as-ink);
}

.empty-board,
.loading-board {
  min-height: 420px;
  border: 1px dashed var(--as-border);
  border-radius: 1rem;
  display: grid;
  place-items: center;
  padding: 2rem;
  text-align: center;
  color: #735d68;
}

.empty-mark {
  width: 58px;
  height: 58px;
  margin: 0 auto 0.9rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--as-blush-soft);
  color: var(--as-pink-dark);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.5rem;
  font-weight: 900;
}

.empty-title,
.loading-copy {
  font-weight: 800;
  color: var(--as-ink);
}

.empty-copy {
  max-width: 360px;
}

.loading-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.loading-card {
  height: 180px;
  border-radius: 1rem;
  background: #f7eef3;
  animation: pulse 1.1s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.45; }
  to { opacity: 1; }
}

.stylist-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.stylist-summary span {
  border: 1px solid var(--as-border);
  border-radius: 999px;
  background: var(--as-blush-soft);
  color: #6d4055;
  padding: 0.22rem 0.58rem;
  font-size: 0.78rem;
  font-weight: 700;
}

.look-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.look-tab {
  border: 1px solid var(--as-border);
  border-radius: 999px;
  background: #fff;
  color: #483840;
  min-height: 34px;
  padding: 0.32rem 0.82rem;
  font-size: 0.84rem;
  font-weight: 800;
}

.look-tab.active {
  border-color: var(--as-ink);
  background: var(--as-ink);
  color: #fff;
}

.look-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 0.35rem;
  border-radius: 999px;
  background: var(--as-pink);
}

.slot-title {
  margin-bottom: 0.5rem;
  color: #735d68;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.slot-title span {
  color: #9b8790;
  font-weight: 700;
}

:deep(.stylist-item-card) {
  border: 1px solid var(--as-border);
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 28px rgba(87, 48, 64, 0.07);
}

:deep(.stylist-item-image) {
  width: 100%;
  height: 245px;
  object-fit: cover;
  display: block;
}

:deep(.stylist-item-body) {
  padding: 0.9rem;
}

:deep(.stylist-item-category) {
  color: var(--as-pink-dark);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

:deep(.stylist-item-title) {
  margin-top: 0.2rem;
  min-height: 2.5em;
  color: var(--as-ink);
  font-weight: 800;
  line-height: 1.25;
}

:deep(.stylist-item-bottom) {
  margin-top: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  font-weight: 800;
}

:deep(.missing-item-card) {
  min-height: 180px;
  border: 1px dashed var(--as-border);
  border-radius: 1rem;
  display: grid;
  place-items: center;
  padding: 1rem;
  text-align: center;
  color: #735d68;
  background: #fff;
}

:deep(.missing-icon) {
  width: 36px;
  height: 36px;
  margin-bottom: 0.5rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--as-blush-soft);
  color: var(--as-pink-dark);
  font-weight: 900;
}

@media (max-width: 991.98px) {
  .request-card {
    position: static;
  }
}

@media (max-width: 575.98px) {
  .stylist-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .stylist-hero-logo {
    width: 100%;
  }

  .result-head {
    flex-direction: column;
  }

  .loading-grid {
    grid-template-columns: 1fr;
  }
}
</style>
