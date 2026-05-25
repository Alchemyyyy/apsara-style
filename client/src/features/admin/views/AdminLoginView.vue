<template>
  <div class="auth-page min-vh-100 d-flex align-items-center">
    <div class="container py-5 auth-lift" style="max-width: 520px;">
      <div class="auth-card bg-white border rounded-4 p-4 p-md-5">
        <div class="text-center mb-4">
          <BrandLogo size="lg" class="mb-2" />
          <span class="badge text-bg-dark mb-3 px-3 py-2">ADMIN PORTAL</span>
          <h2 class="h4 mb-2">Admin Login</h2>
          <p class="text-muted mb-0">Sign in with your admin email and password.</p>
        </div>

        <label class="form-label fw-medium">Email</label>
        <input class="form-control auth-input" v-model="email" type="email" placeholder="admin@sabyorder.com" />

        <label class="form-label fw-medium mt-3">Password</label>
        <div class="password-field">
          <input
            class="form-control auth-input password-input"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter password..."
            @keyup.enter="login"
          />
          <button
            type="button"
            class="btn password-toggle"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M10.6 10.7C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.3 13.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M9.4 5.5C10.2 5.2 11.1 5 12 5C16.5 5 20 8 21 12C20.6 13.4 19.9 14.6 19 15.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M6.2 8.2C4.9 9.2 3.9 10.5 3 12C4 16 7.5 19 12 19C13.8 19 15.4 18.5 16.8 17.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <svg v-else class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2.5 12C4.2 7.8 7.8 5 12 5C16.2 5 19.8 7.8 21.5 12C19.8 16.2 16.2 19 12 19C7.8 19 4.2 16.2 2.5 12Z" stroke="currentColor" stroke-width="1.8" />
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </button>
        </div>

        <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>

        <BaseButton variant="dark" class="mt-4 py-2 auth-action-btn" block @click="login">Continue</BaseButton>

        <div class="text-center mt-3 small text-muted fw-medium">
          Customer account?
          <RouterLink class="text-decoration-none" :to="{ name: 'userLogin' }">User login</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BrandLogo from "@/shared/components/common/BrandLogo.vue"
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp, setAdminAuthState } from '@/features/admin/api/adminHttp'
import BaseButton from '@/shared/components/common/BaseButton.vue'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')

onMounted(() => {
  const notice = sessionStorage.getItem('apsara_admin_auth_notice') || ''
  if (notice) {
    error.value = notice
    sessionStorage.removeItem('apsara_admin_auth_notice')
  }
})

async function login() {
  error.value = ''

  try {
    const res = await adminHttp.post('/auth/login', {
      email: email.value,
      password: password.value,
    })
    const payload = res.data?.data || {}
    const token = String(payload.token || '')
    const admin = payload.admin || {}
    const roles = Array.isArray(admin.roles) ? admin.roles : []

    if (!token) throw new Error('Missing auth token')

    setAdminAuthState({ token, admin })

    if (roles.includes('super_admin') || roles.includes('catalog_admin')) {
      router.push({ name: 'adminProducts' })
      return
    }
    if (roles.includes('ops_admin')) {
      router.push({ name: 'adminOrders' })
      return
    }
    router.push({ name: 'adminAnalytics' })
  } catch (e) {
    error.value = e?.response?.data?.error || 'Invalid email or password.'
  }
}
</script>

<style scoped>
.auth-page {
  background: #ffffff;
}

.auth-lift {
  margin-top: 0;
}

.auth-card {
  border: 1px solid var(--as-border);
  box-shadow: 0 22px 58px rgba(87, 48, 64, 0.12);
}

.auth-input {
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}

.password-field {
  position: relative;
}

.password-input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 0.55rem;
  transform: translateY(-50%);
  border: 0;
  padding: 0.2rem;
  color: #6c757d;
}

.password-toggle:hover {
  color: #111;
}

.eye-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.auth-action-btn {
  background: var(--as-ink, #161113) !important;
  border-color: var(--as-ink, #161113) !important;
  color: #ffffff !important;
}

.auth-action-btn:hover:not(:disabled) {
  background: #000 !important;
  border-color: var(--as-ink, #161113) !important;
  color: #ffffff !important;
}
</style>
