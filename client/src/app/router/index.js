import { createRouter, createWebHistory } from 'vue-router'
import { isUserLoggedIn } from '@/features/auth/store'
import { getAdminProfile, getAdminToken } from '@/features/admin/api/adminHttp'
import { ensureAuthBootstrapped } from '@/app/bootstrap/authBootstrap'

const HomeView = () => import('@/features/home/views/HomeView.vue')
const ProductsView = () => import('@/features/products/views/ProductsView.vue')
const ProductDetailView = () => import('@/features/products/views/ProductDetailView.vue')
const CartView = () => import('@/features/cart/views/CartView.vue')
const CheckoutView = () => import('@/features/orders/views/CheckoutView.vue')
const OrdersView = () => import('@/features/orders/views/OrdersView.vue')
const OrderDetailView = () => import('@/features/orders/views/OrderDetailView.vue')
const SearchView = () => import('@/features/search/views/SearchView.vue')
const StylistView = () => import('@/features/stylist/views/StylistView.vue')
const TrackOrderView = () => import('@/features/orders/views/TrackOrderView.vue')
const NotificationsView = () => import('@/features/notifications/views/NotificationsView.vue')
const UserLoginView = () => import('@/features/auth/views/UserLoginView.vue')
const AccountView = () => import('@/features/auth/views/AccountView.vue')
const AdminLoginView = () => import('@/features/admin/views/AdminLoginView.vue')
const AdminProductsView = () => import('@/features/admin/views/AdminProductsView.vue')
const AdminAnalyticsView = () => import('@/features/admin/views/AdminAnalyticsView.vue')
const AdminOrdersView = () => import('@/features/admin/views/AdminOrdersView.vue')
const AdminReturnsView = () => import('@/features/admin/views/AdminReturnsView.vue')
const AdminAuditLogsView = () => import('@/features/admin/views/AdminAuditLogsView.vue')
const WishlistView = () => import('@/features/wishlist/views/WishlistView.vue')

function pickAdminHomeByRoles(roles) {
  const list = Array.isArray(roles) ? roles : []
  if (list.includes('super_admin') || list.includes('catalog_admin')) return { name: 'adminProducts' }
  if (list.includes('ops_admin')) return { name: 'adminOrders' }
  return { name: 'adminAnalytics' }
}

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/shop/unisex', redirect: { name: 'products', params: { gender: 'women' } } },
  { path: '/shop/:gender(men|women)', name: 'products', component: ProductsView, props: true },
  { path: '/product/:id', name: 'productDetail', component: ProductDetailView, props: true },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/checkout', name: 'checkout', component: CheckoutView, meta: { requiresUser: true } },
  { path: '/orders', name: 'orders', component: OrdersView, meta: { requiresUser: true } },
  { path: '/orders/:id', name: 'orderDetail', component: OrderDetailView, props: true, meta: { requiresUser: true } },
  { path: '/track-order', name: 'trackOrder', component: TrackOrderView },
  { path: '/notifications', name: 'notifications', component: NotificationsView, meta: { requiresUser: true } },
  { path: '/account', name: 'account', component: AccountView, meta: { requiresUser: true } },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/stylist', name: 'stylist', component: StylistView },
  { path: '/login', name: 'userLogin', component: UserLoginView, meta: { guestOnly: true } },
  { path: '/admin', name: 'adminLogin', component: AdminLoginView },
  {
    path: '/admin/products',
    name: 'adminProducts',
    component: AdminProductsView,
    meta: { requiresAdmin: true, roles: ['super_admin', 'catalog_admin'] },
  },
  {
    path: '/admin/orders',
    name: 'adminOrders',
    component: AdminOrdersView,
    meta: { requiresAdmin: true, roles: ['super_admin', 'ops_admin'] },
  },
  {
    path: '/admin/returns',
    name: 'adminReturns',
    component: AdminReturnsView,
    meta: { requiresAdmin: true, roles: ['super_admin', 'ops_admin'] },
  },
  {
    path: '/admin/analytics',
    name: 'adminAnalytics',
    component: AdminAnalyticsView,
    meta: { requiresAdmin: true, roles: ['super_admin', 'ops_admin', 'catalog_admin'] },
  },
  {
    path: '/admin/audit-logs',
    name: 'adminAuditLogs',
    component: AdminAuditLogsView,
    meta: { requiresAdmin: true, roles: ['super_admin'] },
  },
  { path: '/wishlist', name: 'wishlist', component: WishlistView }

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  await ensureAuthBootstrapped()

  const adminToken = getAdminToken()
  const adminProfile = getAdminProfile()
  const adminRoles = Array.isArray(adminProfile?.roles) ? adminProfile.roles : []

  if (to.meta?.requiresAdmin) {
    if (!adminToken) return { name: 'adminLogin' }
    const allowed = Array.isArray(to.meta.roles) ? to.meta.roles : []
    if (allowed.length && !adminRoles.some((r) => allowed.includes(r))) {
      return pickAdminHomeByRoles(adminRoles)
    }
  }

  if (to.name === 'adminLogin' && adminToken) {
    return pickAdminHomeByRoles(adminRoles)
  }

  if (to.meta?.guestOnly) {
    if (isUserLoggedIn.value) return { name: 'home' }
  }

  if (to.meta?.requiresUser) {
    if (!isUserLoggedIn.value) {
      return { name: 'userLogin', query: { redirect: to.fullPath } }
    }
  }

  return true
})

export default router
