import { adminHttp, clearAdminAuthState, getAdminToken, setAdminAuthState } from '@/api/adminHttp'
import { http } from '@/api/http'
import { ref } from 'vue'
import {
  clearUserAuthState,
  hydrateUserAuthState,
  setUserAuthState,
  userToken,
} from '@/stores/authStore'

export const isAuthBootstrapping = ref(true)
export const authBootstrapWarning = ref('')
const BOOTSTRAP_TIMEOUT_MS = 10000
let bootstrapPromise = null

async function bootstrapUserAuth() {
  if (!userToken.value) return
  try {
    const res = await http.get('/auth/me', {
      headers: { 'x-skip-auth-expired-handler': '1' },
    })
    const user = res.data?.data || null
    if (!user) {
      clearUserAuthState()
      return
    }
    setUserAuthState({ token: userToken.value, user })
  } catch {
    clearUserAuthState()
  }
}

async function bootstrapAdminAuth() {
  const adminToken = getAdminToken()
  if (!adminToken) return
  try {
    const res = await adminHttp.get('/auth/me', {
      headers: { 'x-skip-auth-expired-handler': '1' },
    })
    const admin = res.data?.data || null
    if (!admin) {
      clearAdminAuthState()
      return
    }
    setAdminAuthState({ token: adminToken, admin })
  } catch {
    clearAdminAuthState()
  }
}

export async function bootstrapAuthState() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      authBootstrapWarning.value = ''
      hydrateUserAuthState()
      const checksPromise = Promise.all([bootstrapUserAuth(), bootstrapAdminAuth()])
      const raceResult = await Promise.race([
        checksPromise.then(() => 'done'),
        new Promise((resolve) => {
          setTimeout(() => resolve('timeout'), BOOTSTRAP_TIMEOUT_MS)
        }),
      ])

      if (raceResult === 'timeout') {
        authBootstrapWarning.value = 'Session check skipped (server unreachable).'
      }

      await checksPromise
    })().catch((err) => {
      console.error('Auth bootstrap failed:', err)
      authBootstrapWarning.value = 'Session check skipped (unexpected error).'
    }).finally(() => {
      isAuthBootstrapping.value = false
    })
  }
  return bootstrapPromise
}

export function ensureAuthBootstrapped() {
  return bootstrapPromise || bootstrapAuthState()
}
