<template>
  <TransitionGroup name="user-toast" tag="div" class="user-toast-stack" aria-live="polite" aria-atomic="true">
    <article
      v-for="toast in toasts"
      :key="toast.id"
      class="user-toast-item"
      :class="toast.type === 'success' ? 'is-success' : 'is-error'"
      role="status"
    >
      <div class="toast-icon" aria-hidden="true">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none">
          <path d="M20 7L9 18L4 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none">
          <path d="M12 8V13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="12" cy="17" r="1" fill="currentColor"/>
          <path d="M10.3 3.9L2.6 17.3A2 2 0 0 0 4.3 20.3H19.7A2 2 0 0 0 21.4 17.3L13.7 3.9A2 2 0 0 0 10.3 3.9Z" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      </div>
      <p class="toast-text mb-0">{{ toast.message }}</p>
      <button
        v-if="toast.actionLabel"
        class="toast-action"
        type="button"
        @click="$emit('action', toast.id)"
      >
        {{ toast.actionLabel }}
      </button>
      <button class="toast-close" type="button" aria-label="Close" @click="$emit('close', toast.id)">✕</button>
    </article>
  </TransitionGroup>
</template>

<script setup>
defineProps({
  toasts: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['close', 'action'])
</script>

<style scoped>
.user-toast-stack {
  position: fixed;
  top: calc(74px + 1.2rem);
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: min(92vw, 380px);
  pointer-events: none;
}

.user-toast-item {
  pointer-events: auto;
  display: grid;
  grid-template-columns: 1.125rem 1fr auto;
  align-items: center;
  gap: 0.7rem;
  border-radius: 12px;
  border: 1px solid #e8dfd0;
  border-left-width: 4px;
  background: #fffdf9;
  color: #2a2a2a;
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.1);
  padding: 0.72rem 0.75rem;
}

.user-toast-item.is-success {
  border-left-color: var(--as-gold, #c6a97a);
}

.user-toast-item.is-error {
  border-left-color: #ef4444;
  border-color: #f4cccc;
}

.toast-icon {
  width: 1.125rem;
  height: 1.125rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--as-gold, #c6a97a);
}

.user-toast-item.is-error .toast-icon {
  color: #f87171;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-text {
  font-size: 0.92rem;
  line-height: 1.25;
}

.toast-close {
  border: 0;
  background: transparent;
  color: #4b5563;
  opacity: 0.7;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.toast-close:hover {
  opacity: 1;
}

.toast-action {
  border: 0;
  background: transparent;
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 0.1rem 0.25rem;
  text-transform: uppercase;
}

.toast-action:hover {
  color: var(--as-gold, #c6a97a);
}

.user-toast-enter-active,
.user-toast-leave-active {
  transition: opacity 0.3s ease, transform 0.34s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.user-toast-enter-from,
.user-toast-leave-to {
  opacity: 0;
  transform: translate3d(0, -8px, 0) scale(0.98);
}

.user-toast-move {
  transition: transform 0.34s cubic-bezier(0.2, 0.7, 0.2, 1);
}

@media (max-width: 575px) {
  .user-toast-stack {
    top: calc(64px + 1rem);
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
  }
}
</style>
