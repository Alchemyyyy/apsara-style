<template>
  <main class="notifications-page py-4">
    <div class="container">
      <div class="page-head">
        <div>
          <h1 class="page-title mb-1">Notifications</h1>
          <p class="text-muted mb-0">Unread: {{ meta.unread || 0 }} · Total: {{ meta.totalAll || 0 }}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline-dark btn-sm" :disabled="loading || !hasUnread" @click="onMarkAllRead">
            Mark All Read
          </button>
          <select v-model.number="clearDays" class="form-select form-select-sm clear-select">
            <option :value="7">Clear older than 7 days</option>
            <option :value="30">Clear older than 30 days</option>
            <option :value="90">Clear older than 90 days</option>
          </select>
          <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="onClearOlder">
            Clear
          </button>
        </div>
      </div>

      <div class="stat-chips">
        <span class="chip"><strong>{{ meta.unread || 0 }}</strong> unread</span>
        <span class="chip"><strong>{{ meta.total || 0 }}</strong> in current filter</span>
      </div>

      <div class="filter-strip">
        <select v-model="filterType" class="form-select form-select-sm">
          <option value="all">All Types</option>
          <option value="order_created">Order Created</option>
          <option value="order_cancelled">Order Cancelled</option>
          <option value="order_status_updated">Order Status Updated</option>
          <option value="return_requested">Return Requested</option>
          <option value="return_status_updated">Return Status Updated</option>
          <option value="payment_paid">Payment Paid</option>
          <option value="payment_failed">Payment Failed</option>
        </select>
        <select v-model="filterRead" class="form-select form-select-sm">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <input v-model="dateFrom" type="date" class="form-control form-control-sm" />
        <input v-model="dateTo" type="date" class="form-control form-control-sm" />
        <button class="btn btn-dark btn-sm" :disabled="loading" @click="applyFilters">Apply</button>
        <button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="resetFilters">Reset</button>
      </div>

      <section class="notification-list mt-3">
        <article v-if="loading" class="notification-empty">Loading notifications...</article>
        <article v-else-if="!items.length" class="notification-empty">No notifications found.</article>

        <button
          v-for="item in items"
          :key="item.id"
          class="notification-card"
          :class="{ 'is-unread': !item.is_read }"
          type="button"
          @click="openNotification(item)"
        >
          <span class="dot" :class="{ 'is-hidden': item.is_read }" aria-hidden="true"></span>
          <span class="type-icon" :class="`is-${noticeKind(item.type)}`" aria-hidden="true">
            <svg v-if="noticeKind(item.type) === 'order'" viewBox="0 0 24 24" fill="none">
              <path d="M3 7.5H21L19.5 18H4.5L3 7.5Z" stroke="currentColor" stroke-width="1.8"/>
              <path d="M9 10.5V6.5A3 3 0 0 1 15 6.5V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="noticeKind(item.type) === 'payment'" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
              <path d="M7 14.5H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else-if="noticeKind(item.type) === 'return'" viewBox="0 0 24 24" fill="none">
              <path d="M9 7H19V17H9" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 10L9 7L12 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 12H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <path d="M12 3.5L3.5 8V16L12 20.5L20.5 16V8L12 3.5Z" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 20.5V12" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </span>
          <div class="content">
            <div class="top-row">
              <h2 class="title mb-0">{{ item.title }}</h2>
              <span class="time">{{ formatTime(item.created_at) }}</span>
            </div>
            <p class="message mb-1">{{ item.message }}</p>
            <small class="type">{{ item.type }}</small>
          </div>
        </button>
      </section>

      <AppPagination
        v-if="(meta.totalPages || 1) > 1"
        v-model="page"
        :total-pages="meta.totalPages || 1"
        :loading="loading"
      />
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPagination from '@/shared/components/common/AppPagination.vue'
import {
  clearNotificationsOlderThan,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/features/notifications/api/notifications'
import { subscribeNotificationsStream } from '@/features/notifications/api/notificationsStream'
import { isUserLoggedIn } from '@/features/auth/store'
import { useToast } from '@/shared/composables/useToast'

const router = useRouter()
const { success, error } = useToast()

const loading = ref(false)
const streamConnected = ref(false)
const items = ref([])
const meta = ref({})
const page = ref(1)
const clearDays = ref(30)

const filterType = ref('all')
const filterRead = ref('all')
const dateFrom = ref('')
const dateTo = ref('')

const hasUnread = computed(() => Number(meta.value?.unread || 0) > 0)
let unsubscribeStream = null
let fallbackPoll = null

function formatTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function orderRouteFor(item) {
  const data = item?.meta && typeof item.meta === 'object' ? item.meta : {}
  const orderId = data.orderId || data.order_id || null
  if (orderId && isUserLoggedIn.value) return { name: 'orderDetail', params: { id: orderId } }
  return { name: 'trackOrder' }
}

function noticeKind(type) {
  const text = String(type || '').toLowerCase()
  if (text.includes('payment')) return 'payment'
  if (text.includes('return')) return 'return'
  if (text.includes('order')) return 'order'
  return 'general'
}

async function loadData({ silent = false } = {}) {
  loading.value = true
  try {
    const data = await fetchNotifications({
      page: page.value,
      limit: 10,
      type: filterType.value,
      is_read: filterRead.value,
      date_from: dateFrom.value || undefined,
      date_to: dateTo.value || undefined,
    })
    items.value = data.items || []
    meta.value = data.meta || {}
  } catch (err) {
    if (!silent) {
      error(err?.response?.data?.error || 'Failed to load notifications.')
    }
  } finally {
    loading.value = false
  }
}

function handleStreamEvent() {
  loadData({ silent: true })
}

function startFallbackPolling() {
  if (fallbackPoll) return
  fallbackPoll = setInterval(() => {
    if (!streamConnected.value) loadData({ silent: true })
  }, 30000)
}

function stopFallbackPolling() {
  if (!fallbackPoll) return
  clearInterval(fallbackPoll)
  fallbackPoll = null
}

function applyFilters() {
  page.value = 1
  loadData({ silent: false })
}

function resetFilters() {
  filterType.value = 'all'
  filterRead.value = 'all'
  dateFrom.value = ''
  dateTo.value = ''
  page.value = 1
  loadData({ silent: false })
}

async function onMarkAllRead() {
  try {
    const data = await markAllNotificationsRead()
    success(`Marked ${data?.updated || 0} notifications as read.`)
    await loadData({ silent: true })
  } catch (err) {
    error(err?.response?.data?.error || 'Failed to mark notifications as read.')
  }
}

async function onClearOlder() {
  try {
    const data = await clearNotificationsOlderThan(clearDays.value)
    success(`Cleared ${data?.deleted || 0} old notifications.`)
    await loadData({ silent: true })
  } catch (err) {
    error(err?.response?.data?.error || 'Failed to clear notifications.')
  }
}

async function openNotification(item) {
  if (!item) return
  if (!item.is_read) {
    try {
      await markNotificationRead(item.id)
    } catch {}
  }
  router.push(orderRouteFor(item)).catch(() => {})
}

watch(page, () => loadData({ silent: false }))

onMounted(() => loadData({ silent: false }))

onMounted(() => {
  unsubscribeStream = subscribeNotificationsStream({
    onMessage: handleStreamEvent,
    onStatus: (connected) => {
      streamConnected.value = Boolean(connected)
    },
  })
  startFallbackPolling()
})

onUnmounted(() => {
  stopFallbackPolling()
  if (typeof unsubscribeStream === 'function') unsubscribeStream()
})
</script>

<style scoped>
.notifications-page {
  min-height: calc(100vh - 72px);
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #171717;
}

.stat-chips {
  margin-top: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid var(--as-border);
  background: var(--as-blush-soft);
  color: #3b3b3b;
  border-radius: 999px;
  padding: 0.24rem 0.62rem;
  font-size: 0.79rem;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.clear-select {
  min-width: 190px;
}

.filter-strip {
  margin-top: 0.95rem;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 1fr 1fr auto auto;
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1px solid var(--as-border);
  border-radius: 12px;
  background: #fff;
}

.notification-list {
  display: grid;
  gap: 0.6rem;
}

.notification-empty {
  border: 1px solid var(--as-border);
  border-radius: 10px;
  background: #fff;
  color: #666;
  padding: 0.95rem;
}

.notification-card {
  width: 100%;
  border: 1px solid var(--as-border);
  border-radius: 12px;
  background: #fff;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 0.65rem;
  padding: 0.85rem;
  text-align: left;
  box-shadow: 0 4px 14px rgba(17, 17, 17, 0.03);
}

.notification-card.is-unread {
  background: var(--as-blush-soft);
}

.notification-card:hover {
  border-color: var(--as-pink);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--as-pink, #e96ea5);
  margin-top: 0.4rem;
}

.dot.is-hidden {
  visibility: hidden;
}

.type-icon {
  width: 1.05rem;
  height: 1.05rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.2rem;
  color: #6b7280;
}

.type-icon svg {
  width: 100%;
  height: 100%;
}

.type-icon.is-order {
  color: #64748b;
}

.type-icon.is-payment {
  color: #166534;
}

.type-icon.is-return {
  color: #9a3412;
}

.content {
  display: grid;
  gap: 0.2rem;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}

.title {
  font-size: 0.95rem;
  font-weight: 700;
}

.time {
  font-size: 0.76rem;
  color: #6b7280;
  white-space: nowrap;
}

.message {
  color: #2d2d2d;
  font-size: 0.9rem;
}

.type {
  color: #6b7280;
  font-size: 0.76rem;
  text-transform: uppercase;
}

@media (max-width: 991px) {
  .filter-strip {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 575px) {
  .filter-strip {
    grid-template-columns: 1fr;
  }
}
</style>
