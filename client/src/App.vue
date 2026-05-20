<template>
  <div v-if="isAuthBootstrapping" class="boot-splash min-vh-100 d-flex align-items-center justify-content-center">
    <div class="text-center">
      <div class="brand-wordmark mb-2">APSARA STYLE</div>
      <div class="spinner-border text-dark" role="status" aria-hidden="true"></div>
      <div class="text-muted mt-3 small">Loading your session...</div>
    </div>
  </div>
  <template v-else>
    <div v-if="authBootstrapWarning" class="auth-warning alert alert-warning rounded-0 border-0 mb-0 text-center small">
      {{ authBootstrapWarning }}
    </div>
    <UserToastStack v-if="!hideShell" :toasts="toasts" @close="removeToast" @action="triggerAction" />
    <AppNavbar v-if="!hideShell" />
    <main>
      <RouterView />
    </main>
    <AppFooter v-if="!hideShell" />
  </template>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import { authBootstrapWarning, isAuthBootstrapping } from '@/bootstrap/authBootstrap'
import UserToastStack from '@/components/common/UserToastStack.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { toasts, removeToast, triggerAction } = useToast()

const hideShell = computed(() => {
  const path = String(route.path || '')
  return path === '/login' || path.startsWith('/admin')
})
</script>

<style scoped>
.boot-splash {
  background:
    radial-gradient(780px 280px at 20% 0%, rgba(198, 169, 122, 0.22), transparent 62%),
    radial-gradient(760px 260px at 100% 100%, rgba(17, 17, 17, 0.08), transparent 62%),
    linear-gradient(180deg, #fcfcfc 0%, #f5f5f5 100%);
}

.auth-warning {
  background-color: #f7e7bf;
  color: #4d3d12;
}
</style>
