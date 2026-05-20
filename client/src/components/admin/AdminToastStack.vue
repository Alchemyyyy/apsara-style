<template>
  <TransitionGroup name="toast" tag="div" class="admin-toast-stack">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="admin-toast-item"
      :class="toast.type === 'success' ? 'is-success' : 'is-error'"
      role="status"
      aria-live="polite"
    >
      <div class="toast-text">{{ toast.message }}</div>
      <button class="toast-close" @click="$emit('close', toast.id)">✕</button>
    </div>
  </TransitionGroup>
</template>

<script setup>
defineProps({
  toasts: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['close'])
</script>

<style scoped>
.admin-toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1200;
  display: grid;
  gap: 0.55rem;
  width: min(360px, calc(100vw - 1.5rem));
}

.admin-toast-item {
  border-radius: 0.75rem;
  border: 1px solid transparent;
  padding: 0.68rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.6rem;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(2px);
}

.admin-toast-item.is-success {
  background: #ecfdf3;
  border-color: #86efac;
  color: #14532d;
}

.admin-toast-item.is-error {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #7f1d1d;
}

.toast-text {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.35;
}

.toast-close {
  border: 0;
  background: transparent;
  color: inherit;
  line-height: 1;
  font-size: 0.9rem;
  padding: 0.1rem 0.2rem;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.toast-move {
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
