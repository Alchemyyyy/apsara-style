import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ProductsView from '@/views/ProductsView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import CartView from '@/views/CartView.vue'
import CheckoutView from '@/views/CheckoutView.vue'
import OrdersView from '@/views/OrdersView.vue'
import OrderDetailView from '@/views/OrderDetailView.vue'
import SearchView from '@/views/SearchView.vue'
import StylistView from '@/views/StylistView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/shop/:gender(men|women)', name: 'products', component: ProductsView, props: true },
  { path: '/product/:id', name: 'productDetail', component: ProductDetailView, props: true },
  { path: '/cart', name: 'cart', component: CartView },
  { path: '/checkout', name: 'checkout', component: CheckoutView },
  { path: '/orders', name: 'orders', component: OrdersView },
  { path: '/orders/:id', name: 'orderDetail', component: OrderDetailView, props: true },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/stylist', name: 'stylist', component: StylistView },

]

export default createRouter({
  history: createWebHistory(),
  routes,
})
