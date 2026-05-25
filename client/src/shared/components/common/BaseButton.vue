<template>
  <button
    :type="nativeType"
    class="btn base-button"
    :class="buttonClass"
    :disabled="isDisabled"
    v-bind="$attrs"
  >
    <span v-if="loading">{{ loadingText }}</span>
    <slot v-else />
  </button>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
  },
  block: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'Loading...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  nativeType: {
    type: String,
    default: 'button',
  },
})

const variantClassMap = {
  primary: 'btn-as',
  secondary: 'btn-outline-secondary',
  dark: 'btn-outline-dark',
  danger: 'btn-outline-danger',
  adminCta: 'base-button-admin-cta',
}

const sizeClassMap = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

const isDisabled = computed(() => props.disabled || props.loading)

const buttonClass = computed(() => [
  variantClassMap[props.variant] || variantClassMap.primary,
  sizeClassMap[props.size] || '',
  props.block ? 'w-100' : '',
  props.loading ? 'base-button-loading' : '',
])
</script>

<style scoped>
.base-button-loading {
  cursor: wait;
}

.base-button-admin-cta {
  background: var(--as-pink);
  color: #ffffff;
  border: 1px solid var(--as-pink);
  box-shadow: 0 8px 18px rgba(233, 110, 165, 0.28);
  font-weight: 700;
  letter-spacing: 0.01em;
}

.base-button-admin-cta:hover:not(:disabled) {
  background: var(--as-pink-dark);
  border-color: var(--as-pink-dark);
  color: #ffffff;
}

.base-button-admin-cta:disabled {
  box-shadow: none;
  opacity: 0.6;
}
</style>
