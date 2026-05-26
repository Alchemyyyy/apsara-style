<template>
  <span class="brand-logo" :class="[`brand-logo--${size}`]">
    <img src="@/shared/assets/saby-order-logo.webp" alt="Saby Order" />
  </span>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'nav', 'md', 'lg', 'xl'].includes(value),
  },
})
</script>

<style scoped>
.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.brand-logo img {
  display: block;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.brand-logo--sm img {
  height: 42px;
}

.brand-logo--nav img {
  height: 68px;
}

.brand-logo--md img {
  height: 56px;
}

.brand-logo--lg img {
  height: 74px;
}

.brand-logo--xl img {
  height: 96px;
}
</style>
