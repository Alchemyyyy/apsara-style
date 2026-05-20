<template>
  <div class="app-pagination-wrap mt-4">
    <button class="btn btn-sm" :class="navClass" @click="goPrev" :disabled="isPrevDisabled">Prev</button>
    <template v-for="item in pageItems" :key="item.key">
      <button
        v-if="item.type === 'page'"
        class="btn btn-sm app-page-btn"
        :class="item.value === modelValue ? activeClass : inactiveClass"
        @click="goTo(item.value)"
        :disabled="loading"
      >
        {{ item.value }}
      </button>
      <span v-else class="app-page-ellipsis">…</span>
    </template>
    <button class="btn btn-sm" :class="navClass" @click="goNext" :disabled="isNextDisabled">Next</button>
  </div>
  <div v-if="showSummary" class="text-center small text-muted mt-2">
    Page {{ safePage }} of {{ safeTotal }}
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  showSummary: { type: Boolean, default: true },
  activeClass: { type: String, default: 'btn-dark' },
  inactiveClass: { type: String, default: 'btn-outline-secondary' },
  navClass: { type: String, default: 'btn-outline-dark' },
})

const emit = defineEmits(['update:modelValue'])

const safeTotal = computed(() => Math.max(1, Number(props.totalPages || 1)))
const safePage = computed(() => Math.min(Math.max(1, Number(props.modelValue || 1)), safeTotal.value))
const isPrevDisabled = computed(() => props.loading || safePage.value <= 1)
const isNextDisabled = computed(() => props.loading || safePage.value >= safeTotal.value)

const pageItems = computed(() => {
  const total = safeTotal.value
  const current = safePage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      key: `p-${i + 1}`,
      type: 'page',
      value: i + 1,
    }))
  }

  const items = []
  const pushPage = (n) => items.push({ key: `p-${n}`, type: 'page', value: n })
  const pushEllipsis = (k) => items.push({ key: `e-${k}`, type: 'ellipsis' })

  pushPage(1)

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pushEllipsis('left')
  for (let n = start; n <= end; n += 1) pushPage(n)
  if (end < total - 1) pushEllipsis('right')

  pushPage(total)
  return items
})

function goTo(n) {
  if (!Number.isInteger(n) || n < 1 || n > safeTotal.value || n === safePage.value) return
  emit('update:modelValue', n)
}

function goPrev() {
  if (isPrevDisabled.value) return
  emit('update:modelValue', safePage.value - 1)
}

function goNext() {
  if (isNextDisabled.value) return
  emit('update:modelValue', safePage.value + 1)
}
</script>

<style scoped>
.app-pagination-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.app-page-btn {
  min-width: 36px;
}

.app-page-ellipsis {
  min-width: 20px;
  text-align: center;
  font-weight: 700;
  color: #64748b;
}
</style>
