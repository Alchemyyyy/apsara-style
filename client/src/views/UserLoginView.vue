<template>
  <div class="auth-page min-vh-100 d-flex align-items-center">
    <div class="container py-5 auth-lift" style="max-width: 560px;">
      <div class="auth-card bg-white border rounded-4 p-4 p-md-5">
        <div class="text-center mb-4">
          <div class="brand-wordmark mb-2">APSARA STYLE</div>
          <h2 class="h4 mb-2">
            {{ isLoggedIn ? 'You Are Logged In' : (mode === 'login' ? 'Welcome Back' : 'Create Your Account') }}
          </h2>
          <p class="text-muted mb-0">
            {{ isLoggedIn ? `Signed in as ${currentUser?.email || 'customer account'}.` : (mode === 'login' ? 'Sign in to continue shopping.' : 'Register to save your preferences and orders.') }}
          </p>
        </div>

        <div v-if="isLoggedIn" class="d-grid gap-2">
          <BaseButton variant="primary" block @click="goHome">Go to Home</BaseButton>
          <BaseButton variant="dark" block @click="logout">Logout</BaseButton>
        </div>

        <template v-else>
        <div class="mode-switch p-1 rounded-3 mb-4">
          <button
            type="button"
            class="btn btn-sm w-50 auth-mode-btn"
            :class="{ 'is-active': mode === 'login' }"
            :disabled="loading"
            @click="mode = 'login'; error = ''; success = ''"
          >
            Login
          </button>
          <button
            type="button"
            class="btn btn-sm w-50 auth-mode-btn"
            :class="{ 'is-active': mode === 'register' }"
            :disabled="loading"
            @click="mode = 'register'; error = ''; success = ''"
          >
            Register
          </button>
        </div>

        <div v-if="mode === 'register'">
          <label class="form-label fw-medium">Full name <span class="required-mark">*</span></label>
          <input class="form-control auth-input" v-model="fullName" placeholder="Your name" required />
        </div>

        <div v-if="mode === 'forgot'">
          <label class="form-label fw-medium">Email <span class="required-mark">*</span></label>
          <input class="form-control auth-input" type="email" v-model="email" placeholder="you@example.com" required />
          <BaseButton variant="dark" block class="mt-4 auth-action-btn" :loading="loading" loading-text="Please wait…" :disabled="!canSubmitForgot" @click="submitForgot">
            Send reset instructions
          </BaseButton>

          <div class="small text-muted mt-3">
            Remembered your password?
            <a href="#" class="text-decoration-none" @click.prevent="setMode('login')">Back to login</a>
          </div>
        </div>

        <div v-if="mode === 'reset'">
          <label class="form-label fw-medium">Reset token <span class="required-mark">*</span></label>
          <input class="form-control auth-input" v-model="resetToken" placeholder="Paste reset token" required />

          <label class="form-label fw-medium mt-3">New password <span class="required-mark">*</span></label>
          <div class="password-field">
            <input
              class="form-control auth-input password-input"
              :type="showResetPassword ? 'text' : 'password'"
              v-model="newPassword"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              class="btn password-toggle"
              :aria-label="showResetPassword ? 'Hide password' : 'Show password'"
              @click="showResetPassword = !showResetPassword"
            >
              <svg v-if="showResetPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

          <div class="small text-muted mt-2">Use at least 6 characters.</div>
          <BaseButton variant="dark" block class="mt-4 auth-action-btn" :loading="loading" loading-text="Please wait…" :disabled="!canSubmitReset" @click="submitReset">
            Reset password
          </BaseButton>

          <div class="small text-muted mt-3">
            <a href="#" class="text-decoration-none" @click.prevent="setMode('login')">Back to login</a>
          </div>
        </div>

        <template v-if="mode === 'login' || mode === 'register'">
          <label class="form-label fw-medium" :class="mode === 'register' ? 'mt-3' : ''">Email <span class="required-mark">*</span></label>
          <input class="form-control auth-input" type="email" v-model="email" placeholder="you@example.com" required />

          <label class="form-label fw-medium mt-3">Password <span class="required-mark">*</span></label>
          <div class="password-field">
            <input
              class="form-control auth-input password-input"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="At least 6 characters"
              @keyup.enter="submit"
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
          <div class="small text-muted mt-2">Use at least 6 characters.</div>

          <div v-if="mode === 'login'" class="text-end mt-2">
            <a href="#" class="small text-decoration-none" @click.prevent="setMode('forgot')">Forgot password?</a>
          </div>

          <BaseButton variant="dark" block class="mt-4 auth-action-btn" :loading="loading" loading-text="Please wait…" :disabled="!canSubmitAuth" @click="submit">
            {{ mode === 'login' ? 'Login' : 'Create account' }}
          </BaseButton>

          <div v-if="showGoogleSection" class="oauth-block mt-3">
            <div class="oauth-divider"><span>or</span></div>
            <div ref="googleButtonMount" class="google-button-mount"></div>
            <div v-if="googleError" class="small text-danger mt-2">{{ googleError }}</div>
          </div>

          <div v-if="showFacebookSection" class="oauth-block mt-3">
            <button
              class="oauth-social-btn oauth-facebook-btn"
              type="button"
              :disabled="loading"
              @click="loginWithFacebookClick"
            >
              <span class="oauth-social-icon" aria-hidden="true">
                <svg class="oauth-social-icon-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H8v3h2v5h3v-5h3l.5-3H13V9c0-.6.4-1 1-1z"
                  />
                </svg>
              </span>
              <span class="oauth-social-label">Continue with Facebook</span>
            </button>
            <div v-if="facebookError" class="small text-danger mt-2">{{ facebookError }}</div>
          </div>
        </template>

        <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>
        <div v-if="success" class="alert alert-success mt-3 mb-0">{{ success }}</div>
        </template>
      </div>

      <div class="text-center mt-3 small text-muted fw-medium">
        Are you an admin?
        <RouterLink class="text-decoration-none" :to="{ name: 'adminLogin' }">Admin login</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  claimUserCart,
  clearUserAuth,
  forgotPassword,
  getUserProfile,
  loginUser,
  loginWithGoogle,
  loginWithFacebook as loginWithFacebookApi,
  registerUser,
  resetPassword,
  storeUserAuth,
} from '@/api/userAuth'
import { isUserLoggedIn } from '@/stores/authStore'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const route = useRoute()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const success = ref('')

const fullName = ref('')
const email = ref('')
const password = ref('')
const resetToken = ref('')
const newPassword = ref('')
const showPassword = ref(false)
const showResetPassword = ref(false)
const currentUser = ref(getUserProfile())
const isLoggedIn = computed(() => isUserLoggedIn.value)
const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
const facebookAppId = String(import.meta.env.VITE_FACEBOOK_APP_ID || '').trim()
const googleButtonMount = ref(null)
const googleError = ref('')
const facebookError = ref('')
let googleScriptNode = null
let facebookScriptNode = null
const normalizedEmail = computed(() => String(email.value || '').trim())
const normalizedFullName = computed(() => String(fullName.value || '').trim())
const normalizedResetToken = computed(() => String(resetToken.value || '').trim())
const normalizedNewPassword = computed(() => String(newPassword.value || ''))
const normalizedPassword = computed(() => String(password.value || ''))

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

const canSubmitForgot = computed(() => isValidEmail(normalizedEmail.value))
const canSubmitReset = computed(() => normalizedResetToken.value.length > 0 && normalizedNewPassword.value.length >= 6)
const canSubmitAuth = computed(() => {
  if (!isValidEmail(normalizedEmail.value)) return false
  if (normalizedPassword.value.length < 6) return false
  if (mode.value === 'register' && normalizedFullName.value.length < 2) return false
  return true
})
const showGoogleSection = computed(() => Boolean(googleClientId) && (mode.value === 'login' || mode.value === 'register') && !isLoggedIn.value)
const showFacebookSection = computed(() => Boolean(facebookAppId) && (mode.value === 'login' || mode.value === 'register') && !isLoggedIn.value)

async function finalizeAuthSession(data, successMessage) {
  const token = String(data?.token || '')
  if (!token) throw new Error('Missing auth token')
  storeUserAuth({ token, user: data.user || null })
  try {
    await claimUserCart()
  } catch {
    // Non-blocking: authentication should succeed even if cart merge fails.
  }
  refreshCurrentUser()
  success.value = successMessage
  googleRedirectAfterAuth()
}

function googleRedirectAfterAuth() {
  const redirect = String(route.query.redirect || '')
  if (redirect.startsWith('/')) {
    router.push(redirect)
  } else {
    router.push({ name: 'home' })
  }
}

async function onGoogleCredential(response) {
  const credential = String(response?.credential || '')
  if (!credential) {
    googleError.value = 'Google sign-in failed. Missing credential.'
    return
  }
  error.value = ''
  success.value = ''
  googleError.value = ''
  loading.value = true
  try {
    const data = await loginWithGoogle({ credential })
    await finalizeAuthSession(data, 'Login successful.')
  } catch (e) {
    googleError.value = e?.response?.data?.error || 'Google sign-in failed.'
  } finally {
    loading.value = false
  }
}

function initFacebookSdk() {
  if (!facebookAppId || !window.FB) return
  window.FB.init({
    appId: facebookAppId,
    cookie: false,
    xfbml: false,
    version: 'v23.0',
  })
}

function loadFacebookScript() {
  if (!facebookAppId) return
  if (window.FB) {
    initFacebookSdk()
    return
  }
  if (facebookScriptNode) return
  facebookScriptNode = document.createElement('script')
  facebookScriptNode.src = 'https://connect.facebook.net/en_US/sdk.js'
  facebookScriptNode.async = true
  facebookScriptNode.defer = true
  facebookScriptNode.onload = initFacebookSdk
  facebookScriptNode.onerror = () => {
    facebookError.value = 'Unable to load Facebook sign-in.'
  }
  document.head.appendChild(facebookScriptNode)
}

function loginWithFacebookClick() {
  if (!window.FB) {
    facebookError.value = 'Facebook sign-in is not ready yet.'
    return
  }
  const isLocalHttp =
    window.location.protocol === 'http:' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const isSecureContext = window.location.protocol === 'https:' || isLocalHttp
  if (!isSecureContext) {
    facebookError.value = 'Facebook sign-in requires HTTPS (or localhost during development).'
    return
  }
  error.value = ''
  success.value = ''
  googleError.value = ''
  facebookError.value = ''
  loading.value = true

  const handleFacebookLoginResponse = (response) => {
    ;(async () => {
      try {
        const accessToken = String(response?.authResponse?.accessToken || '')
        if (!accessToken) {
          facebookError.value = 'Facebook login canceled or access denied.'
          return
        }
        const data = await loginWithFacebookApi({ access_token: accessToken })
        await finalizeAuthSession(data, 'Login successful.')
      } catch (e) {
        facebookError.value = e?.response?.data?.error || e?.message || 'Facebook sign-in failed.'
      } finally {
        loading.value = false
      }
    })()
  }

  try {
    window.FB.login(handleFacebookLoginResponse, { scope: 'email,public_profile' })
  } catch (e) {
    loading.value = false
    facebookError.value = e?.message || 'Facebook sign-in failed.'
  }
}

function renderGoogleButton() {
  if (!showGoogleSection.value || !googleButtonMount.value) return
  const google = window.google
  if (!google?.accounts?.id) return
  googleButtonMount.value.innerHTML = ''
  google.accounts.id.initialize({
    client_id: googleClientId,
    callback: onGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
  })
  google.accounts.id.renderButton(googleButtonMount.value, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    logo_alignment: 'left',
    width: 320,
  })
}

function loadGoogleScript() {
  if (!googleClientId) return
  if (window.google?.accounts?.id) {
    nextTick(renderGoogleButton)
    return
  }
  if (googleScriptNode) return
  googleScriptNode = document.createElement('script')
  googleScriptNode.src = 'https://accounts.google.com/gsi/client'
  googleScriptNode.async = true
  googleScriptNode.defer = true
  googleScriptNode.onload = () => nextTick(renderGoogleButton)
  googleScriptNode.onerror = () => {
    googleError.value = 'Unable to load Google sign-in.'
  }
  document.head.appendChild(googleScriptNode)
}

onMounted(() => {
  const notice = sessionStorage.getItem('apsara_user_auth_notice') || ''
  if (notice) {
    success.value = notice
    sessionStorage.removeItem('apsara_user_auth_notice')
  }

  const modeQ = String(route.query.mode || '')
  const tokenQ = String(route.query.token || '')
  if (modeQ === 'reset') {
    mode.value = 'reset'
    if (tokenQ) resetToken.value = tokenQ
  }
  loadGoogleScript()
  loadFacebookScript()
})

onUnmounted(() => {
  if (googleButtonMount.value) googleButtonMount.value.innerHTML = ''
})

watch(
  () => mode.value,
  () => {
    googleError.value = ''
    facebookError.value = ''
    nextTick(renderGoogleButton)
  }
)

function refreshCurrentUser() {
  currentUser.value = getUserProfile()
}

function resetAuthFields() {
  fullName.value = ''
  email.value = ''
  password.value = ''
  resetToken.value = ''
  newPassword.value = ''
  showPassword.value = false
  showResetPassword.value = false
  googleError.value = ''
  facebookError.value = ''
}

function goHome() {
  router.push({ name: 'home' })
}

function logout() {
  clearUserAuth()
  refreshCurrentUser()
  sessionStorage.removeItem('apsara_user_auth_notice')
  success.value = ''
  error.value = ''
  mode.value = 'login'
  resetAuthFields()
}

function setMode(nextMode) {
  mode.value = nextMode
  error.value = ''
  success.value = ''
  if (nextMode === 'login') {
    resetAuthFields()
  } else {
    showPassword.value = false
    showResetPassword.value = false
  }
}

async function submit() {
  error.value = ''
  success.value = ''
  if (!canSubmitAuth.value) {
    error.value = mode.value === 'register'
      ? 'Please enter full name, valid email, and password (min 6 chars).'
      : 'Please enter a valid email and password (min 6 chars).'
    return
  }
  loading.value = true
  try {
    const payload = mode.value === 'login'
      ? { email: normalizedEmail.value, password: normalizedPassword.value }
      : { fullName: normalizedFullName.value, email: normalizedEmail.value, password: normalizedPassword.value }

    const data = mode.value === 'login' ? await loginUser(payload) : await registerUser(payload)
    await finalizeAuthSession(data, mode.value === 'login' ? 'Login successful.' : 'Account created.')
  } catch (e) {
    error.value = e?.response?.data?.error || 'Authentication failed.'
  } finally {
    loading.value = false
  }
}

async function submitForgot() {
  error.value = ''
  success.value = ''
  if (!canSubmitForgot.value) {
    error.value = 'Please enter a valid email address.'
    return
  }
  loading.value = true
  try {
    const data = await forgotPassword({ email: normalizedEmail.value })
    success.value = data?.message || 'If your email exists, reset instructions are ready.'
    if (data?.resetToken) {
      resetToken.value = data.resetToken
      success.value = `${success.value} Demo reset token: ${data.resetToken}`
      mode.value = 'reset'
    } else {
      mode.value = 'reset'
    }
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to process forgot password.'
  } finally {
    loading.value = false
  }
}

async function submitReset() {
  error.value = ''
  success.value = ''
  if (!canSubmitReset.value) {
    error.value = 'Please enter reset token and a new password (min 6 chars).'
    return
  }
  loading.value = true
  try {
    const data = await resetPassword({
      token: normalizedResetToken.value,
      newPassword: normalizedNewPassword.value,
    })
    mode.value = 'login'
    success.value = data?.message || 'Password has been reset.'
    password.value = ''
    newPassword.value = ''
  } catch (e) {
    error.value = e?.response?.data?.error || 'Failed to reset password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  background: #f8f8f8;
}

.auth-lift {
  margin-top: 0;
}

.auth-card {
  box-shadow: 0 20px 55px rgba(17, 17, 17, 0.08);
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

.mode-switch {
  display: flex;
  gap: 0.35rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.auth-mode-btn {
  border: 0;
  color: #475569;
  background: transparent;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.auth-mode-btn.is-active {
  color: #ffffff;
  background: var(--as-black, #111111);
  box-shadow: 0 8px 16px rgba(17, 17, 17, 0.18);
}

.auth-mode-btn:not(.is-active):hover {
  color: var(--as-black, #111111);
  background: rgba(198, 169, 122, 0.14);
}

.required-mark {
  color: #b45309;
}

.auth-action-btn {
  background: #111111 !important;
  border-color: #111111 !important;
  color: #ffffff !important;
}

.auth-action-btn:hover:not(:disabled) {
  background: #000000 !important;
  border-color: #000000 !important;
  color: #ffffff !important;
}

.auth-action-btn:disabled {
  background: #111111 !important;
  border-color: #111111 !important;
  color: #ffffff !important;
  opacity: 0.65;
  cursor: not-allowed !important;
  pointer-events: none;
}

.oauth-block {
  display: grid;
  gap: 0.65rem;
}

.oauth-divider {
  position: relative;
  text-align: center;
}

.oauth-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: #e5e7eb;
}

.oauth-divider span {
  position: relative;
  z-index: 1;
  padding: 0 0.55rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  background: #fff;
}

.google-button-mount {
  display: flex;
  justify-content: center;
}

.oauth-social-btn {
  position: relative;
  width: min(100%, 320px);
  margin: 0 auto;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #dadce0;
  background: #ffffff;
  color: #3c4043;
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 38px;
  text-align: center;
  letter-spacing: 0;
  font-family: Roboto, Arial, sans-serif;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.oauth-social-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #d2e3fc;
}

.oauth-social-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.oauth-social-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.oauth-facebook-btn .oauth-social-icon {
  background: #1877f2;
  color: #ffffff;
}

.oauth-social-icon-svg {
  width: 14px;
  height: 14px;
  display: block;
}

.oauth-social-label {
  display: inline-block;
}
</style>
