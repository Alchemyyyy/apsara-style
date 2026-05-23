import { computed, ref } from 'vue'

export const USER_TOKEN_KEY = 'apsara_user_token'
export const USER_PROFILE_KEY = 'apsara_user_profile'

function parseProfile(raw) {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const userToken = ref(localStorage.getItem(USER_TOKEN_KEY) || '')
const userProfile = ref(parseProfile(localStorage.getItem(USER_PROFILE_KEY)))
const isUserLoggedIn = computed(() => Boolean(userToken.value))

function hydrateUserAuthState() {
  userToken.value = localStorage.getItem(USER_TOKEN_KEY) || ''
  userProfile.value = parseProfile(localStorage.getItem(USER_PROFILE_KEY))
}

function setUserAuthState({ token, user }) {
  const safeToken = String(token || '')
  userToken.value = safeToken
  userProfile.value = user || null

  if (safeToken) localStorage.setItem(USER_TOKEN_KEY, safeToken)
  else localStorage.removeItem(USER_TOKEN_KEY)

  if (user) localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_PROFILE_KEY)
}

function clearUserAuthState() {
  userToken.value = ''
  userProfile.value = null
  localStorage.removeItem(USER_TOKEN_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
}

window.addEventListener('storage', (event) => {
  if (event.key === USER_TOKEN_KEY || event.key === USER_PROFILE_KEY || event.key === null) {
    hydrateUserAuthState()
  }
})

export function useAuthStore() {
  return {
    userToken,
    userProfile,
    isUserLoggedIn,
    hydrateUserAuthState,
    setUserAuthState,
    clearUserAuthState,
  }
}

export {
  userToken,
  userProfile,
  isUserLoggedIn,
  hydrateUserAuthState,
  setUserAuthState,
  clearUserAuthState,
}
