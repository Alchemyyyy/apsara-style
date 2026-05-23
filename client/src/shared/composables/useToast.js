import { ref } from 'vue'

let toastSeed = 0
const toasts = ref([])
const toastTimers = new Map()

export function useToast() {
  function removeToast(id) {
    const timer = toastTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      toastTimers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function pushToast(type, message, duration = 3200, options = {}) {
    const id = `toast-${Date.now()}-${toastSeed++}`
    toasts.value.push({
      id,
      type,
      message,
      actionLabel: options.actionLabel || '',
      onAction: typeof options.onAction === 'function' ? options.onAction : null,
    })
    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration)
      toastTimers.set(id, timer)
    }
    return id
  }

  async function triggerAction(id) {
    const toast = toasts.value.find((t) => t.id === id)
    if (!toast || typeof toast.onAction !== 'function') {
      removeToast(id)
      return
    }
    try {
      await toast.onAction()
    } finally {
      removeToast(id)
    }
  }

  function success(message, duration) {
    pushToast('success', message, duration)
  }

  function error(message, duration) {
    pushToast('error', message, duration)
  }

  return {
    toasts,
    success,
    error,
    pushToast,
    triggerAction,
    removeToast,
  }
}
