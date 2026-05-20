<template>
  <div class="home-page">
    <section class="hero-wrap">
      <div class="container py-5">
        <div class="row g-4 align-items-center">
          <div class="col-lg-6">
            <div class="hero-copy">
              <div class="eyebrow">New Season Edit</div>
              <h1 class="hero-title">Build Your Signature Look</h1>
              <p class="hero-subtitle">
                Minimal, elevated, and ready for everyday wear. Discover curated drops for women, men, and unisex wardrobes.
              </p>
              <div class="hero-cta">
                <RouterLink class="btn hero-btn hero-btn-women" :to="{ name: 'products', params: { gender: 'women' } }">Shop Women</RouterLink>
                <RouterLink class="btn hero-btn hero-btn-men" :to="{ name: 'products', params: { gender: 'men' } }">Shop Men</RouterLink>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="hero-media-grid">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80"
                alt="Featured women fashion look"
                class="hero-main-image"
              />
              <img
                src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80"
                alt="Featured men fashion detail"
                class="hero-side-image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container trust-strip">
      <div class="trust-item">
        <span class="trust-title">Fast Delivery</span>
        <span class="trust-sub">Nationwide shipping</span>
      </div>
      <div class="trust-item">
        <span class="trust-title">Easy Returns</span>
        <span class="trust-sub">Simple return process</span>
      </div>
      <div class="trust-item">
        <span class="trust-title">Secure Checkout</span>
        <span class="trust-sub">Protected payments</span>
      </div>
      <div class="trust-item">
        <span class="trust-title">Cash on Delivery</span>
        <span class="trust-sub">Pay when received</span>
      </div>
    </section>

    <section class="container collection-entry py-5">
      <div class="section-head">
        <h2 class="section-title">Shop By Audience</h2>
        <RouterLink class="section-link" :to="{ name: 'products', params: { gender: 'women' } }">View all</RouterLink>
      </div>
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <RouterLink class="audience-card audience-women" :to="{ name: 'products', params: { gender: 'women' } }">
            <span class="audience-label">Women</span>
            <span class="audience-action">Explore collection</span>
          </RouterLink>
        </div>
        <div class="col-12 col-md-4">
          <RouterLink class="audience-card audience-men" :to="{ name: 'products', params: { gender: 'men' } }">
            <span class="audience-label">Men</span>
            <span class="audience-action">Explore collection</span>
          </RouterLink>
        </div>
        <div class="col-12 col-md-4">
          <RouterLink class="audience-card audience-unisex" :to="{ name: 'products', params: { gender: 'unisex' } }">
            <span class="audience-label">Unisex</span>
            <span class="audience-action">Explore collection</span>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="container pb-4" v-if="topTypes.length">
      <div class="section-head">
        <h2 class="section-title">Popular Types</h2>
      </div>
      <div class="type-cloud">
        <RouterLink
          v-for="type in topTypes"
          :key="type.slug"
          class="type-chip"
          :to="{ name: 'products', params: { gender: 'unisex' }, query: { category: type.slug } }"
        >
          {{ type.name }}
          <span class="type-count">{{ type.total }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="container pb-5" v-if="trending.length">
      <div class="section-head">
        <h2 class="section-title">Trending Now</h2>
      </div>
      <ProductRow :items="trending" />
    </section>

    <section class="container pb-5" v-if="recommended.length">
      <div class="section-head">
        <h2 class="section-title">Recommended For You</h2>
      </div>
      <ProductRow :items="recommended" />
    </section>

    <section class="container pb-5" v-if="latest.length">
      <div class="section-head">
        <h2 class="section-title">Just Landed</h2>
      </div>
      <ProductRow :items="latest" />
    </section>
  </div>
</template>

<script setup>
import ProductRow from '@/components/products/ProductRow.vue'
import { computed, onMounted, ref } from 'vue'
import { http } from '@/api/http'

const trending = ref([])
const recommended = ref([])
const latest = ref([])
const categories = ref([])

const topTypes = computed(() =>
  categories.value
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      total: Number(c?.counts?.total || 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
)

async function load() {
  const [trendingRes, recommendedRes, latestRes, metaRes] = await Promise.allSettled([
    http.get('/recommendations/trending', { params: { limit: 8 } }),
    http.get('/recommendations', { params: { limit: 8 } }),
    http.get('/products', { params: { limit: 8, sort: 'newest' } }),
    http.get('/products/meta'),
  ])

  if (trendingRes.status === 'fulfilled') {
    trending.value = Array.isArray(trendingRes.value?.data?.data) ? trendingRes.value.data.data : []
  }
  if (recommendedRes.status === 'fulfilled') {
    recommended.value = Array.isArray(recommendedRes.value?.data?.data) ? recommendedRes.value.data.data : []
  }
  if (latestRes.status === 'fulfilled') {
    latest.value = Array.isArray(latestRes.value?.data?.data) ? latestRes.value.data.data : []
  }
  if (metaRes.status === 'fulfilled') {
    categories.value = Array.isArray(metaRes.value?.data?.data?.categories)
      ? metaRes.value.data.data.categories
      : []
  }
}

onMounted(load)
</script>

<style scoped>
.home-page {
  padding-bottom: 1.5rem;
}

.hero-wrap {
  background:
    radial-gradient(1200px 420px at 100% -10%, rgba(198, 169, 122, 0.23), rgba(198, 169, 122, 0)),
    linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%);
  border-bottom: 1px solid #e9eaec;
}

.hero-copy {
  max-width: 560px;
}

.eyebrow {
  font-size: 0.77rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 650;
}

.hero-title {
  margin-top: 0.7rem;
  margin-bottom: 0.75rem;
  font-size: clamp(2rem, 2.8vw, 3.1rem);
  line-height: 1.02;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin: 0;
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.7;
}

.hero-cta {
  margin-top: 1.6rem;
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.hero-btn {
  min-width: 132px;
  border-radius: 999px;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.hero-btn:hover {
  transform: translateY(-1px);
}

.hero-btn-women {
  background: #c6a97a;
  color: #fff;
  border: 1px solid #c6a97a;
  box-shadow: 0 10px 24px rgba(198, 169, 122, 0.35);
}

.hero-btn-women:hover {
  background: #b99b68;
  border-color: #b99b68;
  color: #fff;
}

.hero-btn-men {
  background: #fff;
  color: #0f172a;
  border: 1px solid #0f172a;
}

.hero-btn-men:hover {
  background: #0f172a;
  color: #fff;
}

.hero-media-grid {
  min-height: 440px;
  display: grid;
  grid-template-columns: 1fr 0.82fr;
  gap: 0.7rem;
}

.hero-main-image,
.hero-side-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
}

.hero-side-image {
  margin-top: 3.4rem;
}

.trust-strip {
  margin-top: 1.15rem;
  margin-bottom: 0.35rem;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  padding: 0.9rem 1rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.trust-item {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.trust-title {
  font-size: 0.84rem;
  font-weight: 650;
  color: #111827;
}

.trust-sub {
  font-size: 0.75rem;
  color: #64748b;
}

.section-head {
  margin-bottom: 0.9rem;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-title {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  margin: 0;
}

.section-link {
  font-size: 0.85rem;
  text-decoration: none;
  color: #111827;
  font-weight: 600;
}

.audience-card {
  min-height: 180px;
  border-radius: 14px;
  color: #fff;
  text-decoration: none;
  padding: 1.05rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.1rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.audience-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.22);
}

.audience-women {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.5)),
    url('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80') center/cover no-repeat;
}

.audience-men {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.54)),
    url('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80') center/cover no-repeat;
}

.audience-unisex {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.12), rgba(15, 23, 42, 0.54)),
    url('https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80') center/cover no-repeat;
}

.audience-label {
  font-size: 1.1rem;
  font-weight: 700;
}

.audience-action {
  font-size: 0.8rem;
  opacity: 0.92;
}

.type-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.45rem 0.72rem;
  font-size: 0.8rem;
  color: #0f172a;
  text-decoration: none;
  background: #fff;
}

.type-chip:hover {
  border-color: #111827;
}

.type-count {
  border-radius: 999px;
  min-width: 1.35rem;
  text-align: center;
  padding: 0.1rem 0.38rem;
  background: #f1f5f9;
  color: #334155;
  font-size: 0.72rem;
  font-weight: 700;
}

@media (max-width: 991.98px) {
  .hero-media-grid {
    min-height: 340px;
  }

  .hero-side-image {
    margin-top: 2rem;
  }

  .trust-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575.98px) {
  .hero-btn {
    flex: 1 1 auto;
  }

  .hero-media-grid {
    grid-template-columns: 1fr;
    min-height: 320px;
  }

  .hero-side-image {
    display: none;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .trust-strip {
    padding: 0.75rem;
  }
}
</style>
