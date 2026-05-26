<template>
  <nav class="navbar navbar-expand-lg sticky-top app-navbar">
    <div class="container nav-shell">
      <RouterLink class="navbar-brand brand-left mb-0" to="/">
        <BrandLogo size="nav" />
        <span class="brand-word">
          <span class="brand-word-main">Saby</span>
          <span class="brand-word-accent">Order</span>
        </span>
      </RouterLink>

      <ul class="navbar-nav d-none d-lg-flex center-nav">
        <li
          v-for="item in desktopNavItems"
          :key="item.key"
          class="nav-item center-item"
          @mouseenter="openNavMenu(item.key)"
          @mouseleave="scheduleCloseNavMenu"
        >
          <RouterLink
            class="nav-link center-link"
            :class="{ 'is-active-main': item.gender && activeGender === item.gender }"
            :to="item.to"
          >
            {{ item.label }}
          </RouterLink>

          <transition name="nav-dropdown-fade">
            <div
              v-if="hoverNav === item.key"
              class="nav-mega-dropdown"
              @mouseenter="openNavMenu(item.key)"
              @mouseleave="scheduleCloseNavMenu"
            >
              <div class="dropdown-grid">
                <div v-for="(column, idx) in dropdownColumnsFor(item)" :key="`${item.key}-col-${idx}`" class="dropdown-col">
                  <RouterLink
                    v-for="link in column"
                    :key="`${item.key}-${link.label}`"
                    class="dropdown-link"
                    :to="link.to"
                  >
                    {{ link.label }}
                  </RouterLink>
                </div>
              </div>
            </div>
          </transition>
        </li>
      </ul>

      <ul class="navbar-nav ms-auto d-none d-lg-flex flex-row align-items-center action-nav">
        <li class="nav-item">
          <form class="search-inline" @submit.prevent="goSearch">
            <div class="search-inline-wrap">
              <svg class="search-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
                <path d="M20 20L16.6 16.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <input
                class="form-control form-control-sm search-input"
                v-model="q"
                placeholder="search"
                aria-label="Search products"
              />
            </div>
          </form>
        </li>

        <li class="nav-item notification-item" ref="notificationRoot">
          <NotificationNavMenu
            :open="showNotifications"
            :loading="notificationsLoading"
            :notifications="notifications"
            :unread-count="unreadCount"
            @toggle="toggleNotifications"
            @mark-all-read="handleMarkAllNotificationsRead"
            @open-notification="openNotification"
            @close="showNotifications = false"
          />
        </li>

        <li class="nav-item">
          <RouterLink class="nav-link icon-link plain-icon d-inline-flex align-items-center justify-content-center" :to="{ name: 'wishlist' }" aria-label="Wishlist" title="Wishlist">
            <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 20C12 20 4 14.5 4 9.5C4 7 6 5 8.5 5C10.1 5 11.4 5.8 12 7C12.6 5.8 13.9 5 15.5 5C18 5 20 7 20 9.5C20 14.5 12 20 12 20Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"></path>
            </svg>
            <span class="visually-hidden">Wishlist</span>
          </RouterLink>
        </li>

        <li class="nav-item">
          <RouterLink class="nav-link icon-link plain-icon cart-link d-inline-flex align-items-center justify-content-center" :to="{ name: 'cart' }" aria-label="Cart" title="Cart">
            <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 4H6L7.5 14H18.5L20 7H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
              <circle cx="10" cy="19" r="1.6" fill="currentColor"></circle>
              <circle cx="17" cy="19" r="1.6" fill="currentColor"></circle>
            </svg>
            <span class="visually-hidden">Cart</span>
            <span v-if="cartItemCount > 0" class="cart-count-badge">{{ cartCountText }}</span>
          </RouterLink>
        </li>

        <template v-if="!isUserLoggedIn">
          <li class="nav-item">
            <RouterLink class="account-inline" :to="{ name: 'userLogin' }" aria-label="Login">
              <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"></circle>
                <path d="M4 20C5.5 16.5 8.5 15 12 15C15.5 15 18.5 16.5 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <span class="account-name">Login</span>
            </RouterLink>
          </li>
        </template>
        <template v-else>
          <li class="nav-item dropdown">
            <button
              class="btn account-inline dropdown-toggle account-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              aria-label="Account menu"
            >
              <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"></circle>
                <path d="M4 20C5.5 16.5 8.5 15 12 15C15.5 15 18.5 16.5 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              <span class="account-name">{{ displayName }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end account-menu shadow-sm">
              <li class="account-head px-3 py-2">
                <div class="small fw-semibold text-truncate">{{ displayName }}</div>
                <div class="xsmall text-muted text-truncate">{{ userEmail }}</div>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li><RouterLink class="dropdown-item" :to="{ name: 'account' }">Account</RouterLink></li>
              <li><RouterLink class="dropdown-item" :to="{ name: 'orders' }">My Orders</RouterLink></li>
              <li><RouterLink class="dropdown-item" :to="{ name: 'wishlist' }">Wishlist</RouterLink></li>
              <li><RouterLink class="dropdown-item" :to="{ name: 'trackOrder' }">Track Order</RouterLink></li>
              <li><hr class="dropdown-divider my-1"></li>
              <li><button class="dropdown-item text-danger" @click="logoutUser">Logout</button></li>
            </ul>
          </li>
        </template>
      </ul>

      <button class="navbar-toggler ms-auto nav-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-mobile">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>

    <div id="nav-mobile" class="collapse nav-mobile d-lg-none">
      <div class="container py-2">
        <form class="search-wrap d-flex w-100 mb-3" @submit.prevent="goSearch">
          <input class="form-control form-control-sm search-input-mobile" v-model="q" placeholder="Search dresses, shirts, accessories..." />
          <button class="btn btn-sm btn-outline-dark search-btn icon-only d-inline-flex align-items-center justify-content-center" type="submit" aria-label="Search" title="Search">
            <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
              <path d="M20 20L16.6 16.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <span class="visually-hidden">Search</span>
          </button>
        </form>

        <ul class="navbar-nav gap-1">
          <li class="nav-item" v-for="gender in genders" :key="`mobile-${gender}`">
            <div class="mobile-gender-block">
              <RouterLink class="nav-link fw-semibold text-capitalize" :to="{ name: 'products', params: { gender } }">{{ gender }}</RouterLink>
              <div class="mobile-type-list" v-if="typesFor(gender).length">
                <RouterLink
                  v-for="type in typesFor(gender)"
                  :key="`mobile-${gender}-${type.slug}`"
                  class="mobile-type-link"
                  :to="{ name: 'products', params: { gender }, query: { category: type.slug } }"
                >
                  {{ type.name }}
                </RouterLink>
              </div>
            </div>
          </li>

          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'catalog', query: { sort: 'newest' } }">New Arrivals</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'catalog', query: { discount: '1', sort: 'discount_desc' } }">Sale</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'stylist' }">Stylist</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'trackOrder' }">Track Order</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'notifications' }">Notifications</RouterLink></li>
          <li class="nav-item"><RouterLink class="nav-link" :to="{ name: 'wishlist' }">Wishlist</RouterLink></li>
          <li class="nav-item" v-if="isUserLoggedIn"><RouterLink class="nav-link" :to="{ name: 'account' }">Account</RouterLink></li>
          <li class="nav-item" v-if="isUserLoggedIn"><RouterLink class="nav-link" :to="{ name: 'orders' }">My Orders</RouterLink></li>
          <li class="nav-item" v-if="!isUserLoggedIn"><RouterLink class="nav-link" :to="{ name: 'userLogin' }">Login</RouterLink></li>
          <li class="nav-item" v-else><button class="btn btn-link nav-link text-danger px-0" @click="logoutUser">Logout</button></li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/shared/api/http'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/features/notifications/api/notifications'
import { subscribeNotificationsStream } from '@/features/notifications/api/notificationsStream'
import { clearUserAuthState, isUserLoggedIn, userProfile } from '@/features/auth/store'
import NotificationNavMenu from '@/features/notifications/components/NotificationNavMenu.vue'

const router = useRouter()
const route = useRoute()
const q = ref('')
const categoryMeta = ref([])
const cartItemCount = ref(0)
const notifications = ref([])
const notificationsLoading = ref(false)
const notificationsMeta = ref({})
const showNotifications = ref(false)
const notificationRoot = ref(null)
const hoverNav = ref('')
let closeMenuTimer = null
let notificationPollTimer = null
let unsubscribeNotificationStream = null
const notificationStreamConnected = ref(false)
const genders = ['women', 'men']
const desktopNavItems = [
  { key: 'women', label: "Women's", gender: 'women', to: { name: 'products', params: { gender: 'women' } } },
  { key: 'men', label: "Men's", gender: 'men', to: { name: 'products', params: { gender: 'men' } } },
  { key: 'new-arrivals', label: 'New Arrivals', to: { name: 'catalog', query: { sort: 'newest' } } },
  { key: 'sale', label: 'Sale', to: { name: 'catalog', query: { discount: '1', sort: 'discount_desc' } } },
  { key: 'stylist', label: 'Stylist', to: { name: 'stylist' } },
]
const displayName = computed(() => String(userProfile.value?.fullName || userProfile.value?.email || 'Customer'))
const userEmail = computed(() => String(userProfile.value?.email || ''))
const cartCountText = computed(() => (cartItemCount.value > 99 ? '99+' : String(cartItemCount.value)))
const unreadCount = computed(() => Number(notificationsMeta.value?.unread || 0))
const activeGender = computed(() => {
  if (route.name !== 'products') return ''
  return String(route.params?.gender || '').toLowerCase()
})

function typesFor(gender) {
  const seen = new Set()
  return categoryMeta.value.filter((item) => {
    const slug = String(item?.slug || '').trim().toLowerCase()
    if (!slug || seen.has(slug)) return false
    const hasCount = Number(item?.counts?.[gender] || 0) > 0
    if (!hasCount) return false
    seen.add(slug)
    return true
  })
}

function chunkArray(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function dropdownColumnsFor(item) {
  if (item.gender) {
    const categoryLinks = typesFor(item.gender).map((type) => ({
      label: type.name,
      to: { name: 'products', params: { gender: item.gender }, query: { category: type.slug } },
    }))
    const allLink = { label: `Shop All ${item.label}`, to: { name: 'products', params: { gender: item.gender } } }
    const links = [allLink, ...categoryLinks]
    return chunkArray(links, 6)
  }

  if (item.key === 'new-arrivals') {
    return [[
      { label: 'Just In', to: { name: 'catalog', query: { sort: 'newest' } } },
      { label: 'Women New Arrivals', to: { name: 'products', params: { gender: 'women' }, query: { sort: 'newest' } } },
      { label: 'Men New Arrivals', to: { name: 'products', params: { gender: 'men' }, query: { sort: 'newest' } } },
      { label: 'Trending Now', to: { name: 'search', query: { q: 'trending' } } },
      { label: 'Best Sellers', to: { name: 'search', query: { q: 'best seller' } } },
      { label: 'New Dresses', to: { name: 'products', params: { gender: 'women' }, query: { category: 'dresses', sort: 'newest' } } },
    ]]
  }

  if (item.key === 'sale') {
    return [[
      { label: 'All Sale Items', to: { name: 'catalog', query: { discount: '1', sort: 'discount_desc' } } },
      { label: 'Men Sale', to: { name: 'products', params: { gender: 'men' }, query: { discount: '1', sort: 'discount_desc' } } },
      { label: 'Women Sale', to: { name: 'products', params: { gender: 'women' }, query: { discount: '1', sort: 'discount_desc' } } },
    ]]
  }

  if (item.key === 'stylist') {
    return [[
      { label: 'AI Stylist', to: { name: 'stylist' } },
      { label: 'Find Your Style', to: { name: 'stylist' } },
      { label: 'Occasion Looks', to: { name: 'search', query: { q: 'occasion outfits' } } },
      { label: 'Capsule Wardrobe', to: { name: 'search', query: { q: 'capsule wardrobe' } } },
    ]]
  }

  return [[]]
}

function clearCloseTimer() {
  if (!closeMenuTimer) return
  clearTimeout(closeMenuTimer)
  closeMenuTimer = null
}

function openNavMenu(key) {
  clearCloseTimer()
  hoverNav.value = key
}

function scheduleCloseNavMenu() {
  clearCloseTimer()
  closeMenuTimer = setTimeout(() => {
    hoverNav.value = ''
    closeMenuTimer = null
  }, 140)
}

async function loadCatalogMeta() {
  try {
    const res = await http.get('/products/meta')
    categoryMeta.value = Array.isArray(res.data?.data?.categories) ? res.data.data.categories : []
  } catch {
    categoryMeta.value = []
  }
}

async function loadCartSummary() {
  try {
    const res = await http.get('/cart')
    const totalItems = Number(res.data?.data?.totals?.totalItems || 0)
    cartItemCount.value = Number.isFinite(totalItems) ? totalItems : 0
  } catch {
    cartItemCount.value = 0
  }
}

function notificationRoute(notice) {
  const meta = notice?.meta && typeof notice.meta === 'object' ? notice.meta : {}
  const orderId = meta.orderId || meta.order_id || null
  if (orderId && isUserLoggedIn.value) {
    return { name: 'orderDetail', params: { id: orderId } }
  }
  return { name: 'trackOrder' }
}

async function loadNotifications({ silent = false } = {}) {
  if (!silent) notificationsLoading.value = true
  try {
    const data = await fetchNotifications({ page: 1, limit: 12 })
    notifications.value = Array.isArray(data.items) ? data.items : []
    notificationsMeta.value = data.meta || {}
  } catch {
    if (!silent) notifications.value = []
  } finally {
    if (!silent) notificationsLoading.value = false
  }
}

function handleNotificationStreamEvent() {
  loadNotifications({ silent: true })
}

function startNotificationFallbackPoll() {
  if (notificationPollTimer) return
  notificationPollTimer = setInterval(() => {
    if (!notificationStreamConnected.value) {
      loadNotifications({ silent: true })
    }
  }, 30000)
}

function stopNotificationFallbackPoll() {
  if (!notificationPollTimer) return
  clearInterval(notificationPollTimer)
  notificationPollTimer = null
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) loadNotifications()
}

async function handleMarkAllNotificationsRead() {
  try {
    await markAllNotificationsRead()
    notifications.value = notifications.value.map((item) => ({
      ...item,
      is_read: true,
      read_at: item.read_at || new Date().toISOString(),
    }))
    notificationsMeta.value = { ...notificationsMeta.value, unread: 0 }
  } catch {}
}

async function openNotification(notice) {
  if (!notice) return
  if (!notice.is_read) {
    try {
      await markNotificationRead(notice.id)
      notifications.value = notifications.value.map((item) =>
        item.id === notice.id ? { ...item, is_read: true, read_at: item.read_at || new Date().toISOString() } : item
      )
      notificationsMeta.value = { ...notificationsMeta.value, unread: Math.max(unreadCount.value - 1, 0) }
    } catch {}
  }

  showNotifications.value = false
  router.push(notificationRoute(notice)).catch(() => {})
}

function onWindowClick(event) {
  if (!showNotifications.value) return
  const root = notificationRoot.value
  if (!root) return
  if (root.contains(event.target)) return
  showNotifications.value = false
}

function goSearch() {
  if (!q.value.trim()) return
  router.push({ name: 'search', query: { q: q.value.trim() } })
}

function logoutUser() {
  clearUserAuthState()
  cartItemCount.value = 0
  notifications.value = []
  notificationsMeta.value = {}
  showNotifications.value = false
  router.push({ name: 'home' })
}

watch(
  () => route.fullPath,
  () => {
    loadCartSummary()
    loadNotifications({ silent: true })
    hoverNav.value = ''
    showNotifications.value = false
  }
)

onMounted(() => {
  loadCatalogMeta()
  loadCartSummary()
  loadNotifications()
  window.addEventListener('click', onWindowClick)
  unsubscribeNotificationStream = subscribeNotificationsStream({
    onMessage: handleNotificationStreamEvent,
    onStatus: (connected) => {
      notificationStreamConnected.value = Boolean(connected)
    },
  })
  startNotificationFallbackPoll()
})

onUnmounted(() => {
  clearCloseTimer()
  window.removeEventListener('click', onWindowClick)
  stopNotificationFallbackPoll()
  if (typeof unsubscribeNotificationStream === 'function') unsubscribeNotificationStream()
})
</script>

<style scoped>
.app-navbar {
  border-bottom: 1px solid var(--as-border);
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(87, 48, 64, 0.06);
  backdrop-filter: blur(14px);
}

.nav-shell {
  min-height: 86px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-left {
  margin-right: 1.1rem;
  color: var(--as-black);
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
}

.brand-word {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 0.28rem;
  padding-bottom: 0.28rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.24rem;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.brand-word::after {
  content: "";
  position: absolute;
  left: 0.08rem;
  bottom: 0;
  width: 72%;
  height: 3px;
  border-radius: 999px;
  background: var(--as-pink);
}

.brand-word-main {
  color: var(--as-ink);
  text-transform: uppercase;
}

.brand-word-accent {
  color: var(--as-pink);
  font-style: italic;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(17, 24, 39, 0.16);
}

.center-nav {
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  position: relative;
}

.center-item {
  position: relative;
}

.center-link {
  color: #382a30;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 0.35rem 0.72rem;
  border-bottom: 2px solid transparent;
  transition: color 0.16s ease;
}

.center-link:hover {
  color: var(--as-pink-dark);
}

.center-link.is-active-main {
  color: var(--as-ink);
  border-bottom-color: var(--as-pink);
}

.nav-mega-dropdown {
  position: absolute;
  top: calc(100% + 0.55rem);
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border: 1px solid var(--as-border);
  border-radius: 10px;
  box-shadow: 0 18px 42px rgba(87, 48, 64, 0.12);
  min-width: 480px;
  padding: 0.9rem 1rem;
  z-index: 30;
}

.dropdown-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.dropdown-col {
  display: grid;
  gap: 0.28rem;
}

.dropdown-link {
  color: #46363d;
  text-decoration: none;
  font-size: 0.85rem;
  line-height: 1.3;
  padding: 0.26rem 0.1rem;
}

.dropdown-link:hover {
  color: var(--as-pink-dark);
}

.nav-dropdown-fade-enter-active,
.nav-dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.nav-dropdown-fade-enter-from,
.nav-dropdown-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

.action-nav {
  gap: 0.3rem;
}

.icon-only {
  width: 34px;
  height: 34px;
  padding: 0;
}

.icon-link {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
}

.notification-item {
  position: relative;
}

.plain-icon {
  color: #3a2c32;
  text-decoration: none;
  transition: color 0.16s ease;
}

.plain-icon:hover {
  color: var(--as-pink-dark);
}

.nav-ic {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.search-wrap {
  gap: 0.45rem;
}

.search-inline {
  display: flex;
  align-items: center;
  width: 230px;
  margin-right: 0.65rem;
}

.search-inline-wrap {
  position: relative;
  width: 100%;
}

.search-ic {
  position: absolute;
  top: 50%;
  left: 11px;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #9c7687;
  pointer-events: none;
}

.search-input {
  border-radius: 6px;
  border: 1px solid var(--as-border);
  background: var(--as-blush-soft);
  padding-left: 36px;
  padding-right: 10px;
  height: 48px;
  font-size: 0.94rem;
  color: var(--as-ink);
}

.search-input:focus {
  border-color: var(--as-pink);
  background: #fff;
  box-shadow: 0 0 0 0.14rem rgba(233, 110, 165, 0.18);
}

.search-input-mobile {
  border-radius: 6px;
}

.search-btn {
  border: 0;
  background: transparent;
  color: var(--as-ink);
}

.account-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #3a2c32;
  text-decoration: none;
  padding: 0.2rem 0.25rem;
  border: 0;
  background: transparent;
  max-width: 180px;
}

.account-inline:hover {
  color: var(--as-pink-dark);
}

.account-name {
  display: inline-block;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  font-size: 0.84rem;
  color: #46363d;
}

.account-toggle,
.account-toggle:hover {
  border-radius: 0;
}

.account-toggle::after {
  margin-left: 0.18rem;
  border-top-width: 0.25em;
  border-right-width: 0.25em;
  border-left-width: 0.25em;
}

.account-menu {
  min-width: 220px;
  border: 1px solid var(--as-border);
  border-radius: 10px;
  padding: 0.34rem;
}

.account-head .xsmall {
  font-size: 0.72rem;
}

.cart-link {
  position: relative;
}

.cart-count-badge {
  position: absolute;
  top: -4px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.58rem;
  font-weight: 700;
  line-height: 1;
  background: var(--as-pink);
  color: #fff;
  border: 1px solid #fff;
}

.nav-mobile {
  border-top: 1px solid var(--as-border);
  background: #fffafb;
}

.nav-toggler {
  border-radius: 6px;
  border-color: #ddd;
}

.mobile-gender-block {
  border: 1px solid var(--as-border);
  border-radius: 10px;
  padding: 0.25rem 0.65rem 0.5rem;
  background: #fff;
}

.mobile-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding-left: 0.15rem;
}

.mobile-type-link {
  text-decoration: none;
  color: #4b5563;
  font-size: 0.86rem;
}

.mobile-type-link:hover {
  color: #111;
}

@media (max-width: 991.98px) {
  .nav-shell {
    min-height: 78px;
  }

  .brand-word {
    gap: 0.18rem;
    font-size: 1rem;
    letter-spacing: 0.03em;
  }
}
</style>
