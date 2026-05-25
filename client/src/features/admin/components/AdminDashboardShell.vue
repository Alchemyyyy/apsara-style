<template>
  <section class="admin-layout container-fluid px-0">
    <div class="admin-wrap" :class="{ collapsed: sidebarCollapsed }">
      <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-brand">
          <BrandLogo size="md" class="mb-1" />
          <div class="small text-white-50">Admin Panel</div>
        </div>

        <div class="sidebar-label">MENU</div>
        <nav class="sidebar-nav">
          <button
            v-if="canAccessProducts"
            class="sidebar-link"
            :class="{ active: route.name === 'adminProducts', open: catalogOpen }"
            @click="toggleCatalog"
            title="Catalog"
          >
            <span class="nav-icon">C</span>
            <span class="label-text">Catalog</span>
            <span class="chev label-text">▾</span>
          </button>

          <div v-if="canAccessProducts" class="sidebar-subnav" :class="{ open: catalogOpen }">
            <button
              class="sidebar-sublink"
              :class="{ active: isCatalogTabActive('view') }"
              @click="goCatalogTab('view')"
              title="View"
            >
              <span class="sub-icon">V</span>
              <span class="label-text">View Product</span>
            </button>
            <button
              class="sidebar-sublink"
              :class="{ active: isCatalogTabActive('create-product') }"
              @click="goCatalogTab('create-product')"
              title="Create Product"
            >
              <span class="sub-icon">P</span>
              <span class="label-text">Create Product</span>
            </button>
            <button
              class="sidebar-sublink"
              :class="{ active: isCatalogTabActive('create-type') }"
              @click="goCatalogTab('create-type')"
              title="Create Type"
            >
              <span class="sub-icon">T</span>
              <span class="label-text">Create Type</span>
            </button>
          </div>

          <button
            v-for="item in navItems"
            :key="item.name"
            class="sidebar-link"
            :class="{ active: isActive(item.name) }"
            @click="goTab(item.name)"
            :title="item.label"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="label-text">{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <main class="admin-main">
        <div class="admin-topbar">
          <div>
            <h1 class="h5 mb-1 fw-semibold text-dark">Dashboard</h1>
            <p class="text-muted small mb-0">{{ subtitle }}</p>
          </div>
          <div class="d-flex gap-2">
            <BaseButton variant="secondary" size="sm" @click="toggleSidebar">☰</BaseButton>
            <BaseButton variant="secondary" size="sm" @click="logout">Logout</BaseButton>
          </div>
        </div>

        <div class="admin-content">
          <div v-if="showQuickStats" class="row g-3 mb-3">
            <div class="col-md-4">
              <div class="quick-stat-card">
                <div class="stat-label">Orders (Last 24h)</div>
                <div class="stat-value">{{ quickStats.ordersToday }}</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="quick-stat-card">
                <div class="stat-label">Low Stock (<=5)</div>
                <div class="stat-value">{{ quickStats.lowStock }}</div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="quick-stat-card">
                <div class="stat-label">Revenue (Last 24h)</div>
                <div class="stat-value">${{ quickStats.revenue }}</div>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-end mb-3">
            <slot name="actions" />
          </div>
          <slot />
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { adminHttp } from '@/features/admin/api/adminHttp'
import { clearAdminAuthState, getAdminProfile } from '@/features/admin/api/adminHttp'
import BaseButton from '@/shared/components/common/BaseButton.vue'

defineProps({
  subtitle: {
    type: String,
    default: 'Control products, orders, and analytics from one place.',
  },
})

const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const catalogOpen = ref(route.name === 'adminProducts')
const quickStats = ref({
  ordersToday: 0,
  lowStock: 0,
  revenue: '0.00',
})

const roles = computed(() => {
  const profile = getAdminProfile()
  return Array.isArray(profile?.roles) ? profile.roles : []
})

const canAccessProducts = computed(() => roles.value.some((r) => ['super_admin', 'catalog_admin'].includes(r)))
const canAccessOrders = computed(() => roles.value.some((r) => ['super_admin', 'ops_admin'].includes(r)))
const canAccessReturns = computed(() => roles.value.some((r) => ['super_admin', 'ops_admin'].includes(r)))
const canAccessAnalytics = computed(() => roles.value.some((r) => ['super_admin', 'ops_admin', 'catalog_admin'].includes(r)))
const canAccessAuditLogs = computed(() => roles.value.includes('super_admin'))
const showQuickStats = computed(() => ['adminOrders', 'adminAnalytics'].includes(String(route.name || '')))

const navItems = computed(() => {
  const items = []
  if (canAccessOrders.value) items.push({ label: 'Orders', name: 'adminOrders', icon: 'O' })
  if (canAccessReturns.value) items.push({ label: 'Returns', name: 'adminReturns', icon: 'R' })
  if (canAccessAnalytics.value) items.push({ label: 'Analytics', name: 'adminAnalytics', icon: 'A' })
  if (canAccessAuditLogs.value) items.push({ label: 'Audit Logs', name: 'adminAuditLogs', icon: 'L' })
  return items
})

function isActive(name) {
  return route.name === name
}

function goTab(name) {
  if (name && name !== route.name) router.push({ name })
}

function toggleCatalog() {
  if (route.name !== 'adminProducts') {
    catalogOpen.value = true
    router.push({ name: 'adminProducts', query: { tab: 'view' } })
    return
  }
  catalogOpen.value = !catalogOpen.value
}

function isCatalogTabActive(tab) {
  if (route.name !== 'adminProducts') return false
  const raw = String(route.query.tab || 'view').toLowerCase()
  const current = raw === 'products' ? 'view' : raw === 'types' ? 'create-type' : raw
  return current === tab
}

function goCatalogTab(tab) {
  const raw = String(route.query.tab || 'view').toLowerCase()
  const current = raw === 'products' ? 'view' : raw === 'types' ? 'create-type' : raw
  catalogOpen.value = true
  if (route.name === 'adminProducts' && current === tab) return
  router.push({ name: 'adminProducts', query: { tab } })
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

async function loadQuickStats() {
  try {
    const res = await adminHttp.get('/analytics/overview', { params: { days: 1 } })
    const data = res.data?.data || {}
    const summary = data.summary || {}
    const funnel = data.orderFunnel || {}
    quickStats.value = {
      ordersToday: Number(funnel.total || 0),
      lowStock: Number(summary.low_stock || 0),
      revenue: Number(summary.revenue || 0).toFixed(2),
    }
  } catch {
    quickStats.value = { ordersToday: 0, lowStock: 0, revenue: '0.00' }
  }
}

async function logout() {
  try {
    await adminHttp.post(
      '/auth/logout',
      {},
      { headers: { 'x-skip-auth-expired-handler': '1', 'x-skip-auth-refresh': '1' } }
    )
  } catch {
    // Always clear client auth state even if logout request fails.
  } finally {
    clearAdminAuthState()
    router.push({ name: 'adminLogin' })
  }
}

onMounted(loadQuickStats)
watch(
  () => route.name,
  (name) => {
    if (name === 'adminProducts') catalogOpen.value = true
  }
)
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #ffffff;
}

.admin-wrap {
  display: flex;
  min-height: 100vh;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-sidebar {
  width: 260px;
  background: #161113;
  border-right: 1px solid rgba(240, 213, 225, 0.16);
  padding: 1.25rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1), padding 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.admin-sidebar.collapsed {
  width: 132px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.admin-sidebar.collapsed .sidebar-brand .small,
.admin-sidebar.collapsed .sidebar-label,
.admin-sidebar.collapsed .label-text {
  display: none;
}

.admin-sidebar.collapsed .sidebar-subnav {
  display: none;
}

.admin-sidebar.collapsed .sidebar-link {
  justify-content: center;
  padding-left: 0.45rem;
  padding-right: 0.45rem;
}

.sidebar-brand {
  margin-bottom: 1.25rem;
  padding: 0.35rem 0.25rem;
  border-bottom: 1px solid rgba(240, 213, 225, 0.18);
}

.admin-sidebar :deep(.brand-logo) {
  max-width: 100%;
}

.admin-sidebar.collapsed :deep(.brand-logo img) {
  height: 38px;
}

.sidebar-label {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: rgba(253, 232, 241, 0.72);
  font-weight: 700;
  padding: 0.25rem 0.4rem;
}

.sidebar-nav {
  margin-top: 0.35rem;
  display: grid;
  gap: 0.35rem;
}

.sidebar-subnav {
  margin-top: 0;
  margin-bottom: 0;
  display: grid;
  gap: 0.2rem;
  padding-left: 1.5rem;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(-4px);
  transition:
    max-height 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease,
    transform 0.45s ease,
    margin 0.45s ease;
}

.sidebar-subnav.open {
  margin-top: -0.1rem;
  margin-bottom: 0.2rem;
  max-height: 140px;
  opacity: 1;
  transform: translateY(0);
}

.sidebar-sublink {
  border: 0;
  background: transparent;
  color: #c7aab7;
  text-align: left;
  border-radius: 0.55rem;
  padding: 0.45rem 0.55rem;
  font-weight: 600;
  font-size: 0.86rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.sub-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(253, 232, 241, 0.38);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  color: #f4d5e2;
}

.sidebar-sublink:hover {
  background: rgba(233, 110, 165, 0.14);
  color: #fff5f9;
}

.sidebar-sublink.active {
  background: rgba(233, 110, 165, 0.18);
  color: #ffd9e8;
}

.sidebar-link {
  border: 0;
  background: transparent;
  color: #f0d5e1;
  text-align: left;
  border-radius: 0.65rem;
  padding: 0.62rem 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.nav-icon {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(253, 232, 241, 0.38);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.68rem;
  color: #f4d5e2;
  flex: 0 0 22px;
}

.sidebar-link .chev {
  margin-left: auto;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.sidebar-link.open .chev {
  transform: rotate(180deg);
}

.sidebar-link:hover {
  background: rgba(233, 110, 165, 0.14);
  color: #fff5f9;
}

.sidebar-link.active {
  background: rgba(233, 110, 165, 0.2);
  color: #fff;
}

.sidebar-link.active .nav-icon,
.sidebar-sublink.active .sub-icon {
  border-color: rgba(233, 110, 165, 0.85);
  color: #ffd9e8;
}

.admin-main {
  flex: 1;
  min-width: 0;
  padding: 0;
}

.admin-topbar {
  background: #ffffff;
  border-bottom: 1px solid var(--as-border);
  box-shadow: 0 10px 28px rgba(87, 48, 64, 0.06);
  padding: 0.9rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  position: sticky;
  top: 0;
  z-index: 20;
}

.admin-content {
  padding: 1rem 1.25rem 1.25rem;
}

.quick-stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  padding: 0.75rem 0.9rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
}

.stat-label {
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 600;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-top: 0.2rem;
}

@media (max-width: 991.98px) {
  .admin-wrap {
    flex-direction: column;
  }

  .admin-sidebar {
    width: 100%;
    height: auto;
    position: static;
  }

  .sidebar-nav {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .sidebar-subnav {
    padding-left: 0;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .admin-sidebar.collapsed {
    width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .admin-sidebar.collapsed .sidebar-brand .small,
  .admin-sidebar.collapsed .sidebar-label,
  .admin-sidebar.collapsed .label-text {
    display: block;
  }
}
</style>
