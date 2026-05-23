<template>
  <button
    class="nav-link icon-link plain-icon d-inline-flex align-items-center justify-content-center notification-toggle"
    type="button"
    aria-label="Notifications"
    title="Notifications"
    @click.stop="$emit('toggle')"
  >
    <svg class="nav-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3C9.8 3 8 4.8 8 7V10.1C8 11.2 7.6 12.3 6.9 13.2L5.7 14.8C5.3 15.4 5.7 16.2 6.4 16.2H17.6C18.3 16.2 18.7 15.4 18.3 14.8L17.1 13.2C16.4 12.3 16 11.2 16 10.1V7C16 4.8 14.2 3 12 3Z" stroke="currentColor" stroke-width="1.9" />
      <path d="M10.2 18C10.5 19 11.2 19.5 12 19.5C12.8 19.5 13.5 19 13.8 18" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
    </svg>
    <span v-if="unreadCount > 0" class="notification-count-badge">{{ unreadCountText }}</span>
    <span class="visually-hidden">Notifications</span>
  </button>

  <transition name="notify-pop">
    <div v-if="open" class="notification-menu" @click.stop>
      <div class="notification-head">
        <h6 class="notification-title mb-0">Notifications</h6>
        <button
          v-if="unreadCount > 0"
          class="btn btn-link btn-sm notification-mark-all"
          type="button"
          @click="$emit('mark-all-read')"
        >
          Mark all read
        </button>
      </div>

      <p v-if="loading" class="notification-state mb-0">Loading...</p>
      <p v-else-if="!notifications.length" class="notification-state mb-0">No notifications yet.</p>

      <ul v-else class="notification-list list-unstyled mb-0">
        <li v-for="notice in notifications" :key="notice.id">
          <button
            class="notification-row"
            :class="{ 'is-unread': !notice.is_read }"
            type="button"
            @click="$emit('open-notification', notice)"
          >
            <span class="notification-dot" :class="{ 'is-hidden': notice.is_read }" aria-hidden="true"></span>
            <span class="notification-content">
              <span class="notification-row-head">
                <span class="notification-type-icon" :class="`is-${noticeKind(notice.type)}`" aria-hidden="true">
                  <svg v-if="noticeKind(notice.type) === 'order'" viewBox="0 0 24 24" fill="none">
                    <path d="M3 7.5H21L19.5 18H4.5L3 7.5Z" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M9 10.5V6.5A3 3 0 0 1 15 6.5V10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="noticeKind(notice.type) === 'payment'" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M3 10H21" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M7 14.5H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  <svg v-else-if="noticeKind(notice.type) === 'return'" viewBox="0 0 24 24" fill="none">
                    <path d="M9 7H19V17H9" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M12 10L9 7L12 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M4 12H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none">
                    <path d="M12 3.5L3.5 8V16L12 20.5L20.5 16V8L12 3.5Z" stroke="currentColor" stroke-width="1.8"/>
                    <path d="M12 20.5V12" stroke="currentColor" stroke-width="1.8"/>
                  </svg>
                </span>
                <span class="notification-row-title">{{ notice.title }}</span>
              </span>
              <span class="notification-row-message">{{ notice.message }}</span>
              <span class="notification-row-time">{{ formatNotificationTime(notice.created_at) }}</span>
            </span>
          </button>
        </li>
      </ul>

      <div class="notification-footer">
        <RouterLink class="notification-view-all" :to="{ name: 'notifications' }" @click="$emit('close')">
          View all notifications
        </RouterLink>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  notifications: {
    type: Array,
    default: () => [],
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
})

defineEmits(['toggle', 'mark-all-read', 'open-notification', 'close'])

const unreadCountText = computed(() => (props.unreadCount > 99 ? '99+' : String(props.unreadCount)))

function formatNotificationTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function noticeKind(type) {
  const text = String(type || '').toLowerCase()
  if (text.includes('payment')) return 'payment'
  if (text.includes('return')) return 'return'
  if (text.includes('order')) return 'order'
  return 'general'
}
</script>

<style scoped>
.icon-link {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
}

.notification-toggle {
  position: relative;
  background: transparent;
}

.plain-icon {
  color: #252525;
  text-decoration: none;
  transition: color 0.16s ease;
}

.plain-icon:hover {
  color: #111;
}

.nav-ic {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.notification-count-badge {
  position: absolute;
  top: -4px;
  right: -8px;
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
  background: var(--as-gold);
  color: #111;
  border: 1px solid #fff;
}

.notification-menu {
  position: absolute;
  top: calc(100% + 0.55rem);
  right: 0;
  width: min(92vw, 360px);
  max-height: 430px;
  overflow: auto;
  border: 1px solid #ece8df;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 34px rgba(17, 17, 17, 0.12);
  padding: 0.55rem;
  z-index: 40;
}

.notification-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.2rem 0.35rem 0.5rem;
  border-bottom: 1px solid #f0ece4;
  margin-bottom: 0.25rem;
}

.notification-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #202020;
}

.notification-mark-all {
  font-size: 0.76rem;
  font-weight: 600;
  color: #8a6b3f;
  text-decoration: none;
  padding: 0;
}

.notification-mark-all:hover {
  color: #6f5432;
}

.notification-state {
  padding: 0.65rem 0.35rem;
  color: #6f6f6f;
  font-size: 0.84rem;
}

.notification-list {
  display: grid;
}

.notification-footer {
  margin-top: 0.35rem;
  padding: 0.45rem 0.35rem 0.2rem;
  border-top: 1px solid #f0ece4;
}

.notification-view-all {
  font-size: 0.82rem;
  font-weight: 600;
  color: #8a6b3f;
  text-decoration: none;
}

.notification-view-all:hover {
  color: #6f5432;
}

.notification-row {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: flex-start;
  border: 0;
  background: transparent;
  text-align: left;
  border-radius: 10px;
  padding: 0.55rem 0.45rem;
}

.notification-row:hover {
  background: #f8f5ef;
}

.notification-row.is-unread {
  background: #f9f5ec;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--as-gold);
  margin-top: 0.38rem;
}

.notification-dot.is-hidden {
  visibility: hidden;
}

.notification-content {
  display: grid;
  gap: 0.08rem;
}

.notification-row-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notification-type-icon {
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #666;
  flex: 0 0 1rem;
}

.notification-type-icon svg {
  width: 100%;
  height: 100%;
}

.notification-type-icon.is-order,
.notification-type-icon.is-general {
  color: #6b7280;
}

.notification-type-icon.is-payment {
  color: #166534;
}

.notification-type-icon.is-return {
  color: #9a3412;
}

.notification-row-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1f1f1f;
}

.notification-row-message {
  font-size: 0.8rem;
  color: #3d3d3d;
  line-height: 1.35;
}

.notification-row-time {
  font-size: 0.72rem;
  color: #7e7e7e;
}

.notify-pop-enter-active,
.notify-pop-leave-active {
  transition: opacity 0.16s ease, transform 0.2s ease;
}

.notify-pop-enter-from,
.notify-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
