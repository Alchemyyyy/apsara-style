<template>
  <transition name="undo-slide">
    <div v-if="item" class="cart-undo-bar" role="status" aria-live="polite">
      <img :src="item.hero_image" :alt="item.title" class="undo-image" />
      <div class="undo-main">
        <div class="undo-title">Item removed from bag</div>
        <div class="undo-meta">
          {{ item.title }} · {{ item.color }} / {{ item.size }} · Qty {{ item.qty }}
        </div>
      </div>
      <div class="undo-actions">
        <button class="btn undo-btn" type="button" :disabled="busy" @click="$emit('undo')">
          Undo
        </button>
        <button class="btn undo-close" type="button" aria-label="Close" @click="$emit('close')">
          ×
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    default: null,
  },
  busy: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['undo', 'close'])
</script>

<style scoped>
.cart-undo-bar {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 2050;
  width: min(560px, calc(100vw - 2rem));
  border: 1px solid #dbe2ea;
  border-left: 4px solid var(--as-pink, #e96ea5);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
  padding: 0.7rem 0.8rem;
  display: grid;
  grid-template-columns: 54px 1fr auto;
  align-items: center;
  gap: 0.7rem;
}

.undo-image {
  width: 54px;
  height: 70px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.undo-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 700;
}

.undo-meta {
  margin-top: 0.1rem;
  font-size: 0.88rem;
  color: #0f172a;
  line-height: 1.25;
}

.undo-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.undo-btn {
  border: 1px solid var(--as-black, #111111);
  background: var(--as-black, #111111);
  color: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.undo-btn:hover:not(:disabled) {
  background: #000;
  border-color: #000;
  color: #fff;
}

.undo-close {
  border: 0;
  background: transparent;
  color: #64748b;
  width: 1.6rem;
  height: 1.6rem;
  font-size: 1.25rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.undo-close:hover {
  color: #0f172a;
}

.undo-slide-enter-active,
.undo-slide-leave-active {
  transition: opacity 0.26s ease, transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.undo-slide-enter-from,
.undo-slide-leave-to {
  opacity: 0;
  transform: translate3d(0, 12px, 0);
}

@media (max-width: 991.98px) {
  .cart-undo-bar {
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
    grid-template-columns: 46px 1fr auto;
    padding: 0.6rem 0.65rem;
  }

  .undo-image {
    width: 46px;
    height: 60px;
  }

  .undo-meta {
    font-size: 0.82rem;
  }
}
</style>
