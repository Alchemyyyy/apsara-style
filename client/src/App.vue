<template>
  <div v-if="isAuthBootstrapping" class="boot-splash min-vh-100 d-flex align-items-center justify-content-center">
    <div class="text-center">
      <BrandLogo size="lg" class="mb-2" />
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
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavbar from '@/app/components/layout/AppNavbar.vue'
import AppFooter from '@/app/components/layout/AppFooter.vue'
import { authBootstrapWarning, isAuthBootstrapping } from '@/app/bootstrap/authBootstrap'
import UserToastStack from '@/shared/components/common/UserToastStack.vue'
import { useToast } from '@/shared/composables/useToast'

const route = useRoute()
const { toasts, removeToast, triggerAction } = useToast()

const hideShell = computed(() => {
  const path = String(route.path || '')
  return path === '/login' || path.startsWith('/admin')
})
</script>

<style scoped>
.boot-splash {
  background: #ffffff;
}

.auth-warning {
  background-color: #f7e7bf;
  color: #4d3d12;
}
</style>
