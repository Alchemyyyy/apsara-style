<template>
  <div class="container py-5">
    <div class="brand-wordmark mb-1">APSARA STYLE</div>
    <h2 class="h4 mb-1">My Profile</h2>
    <p class="text-muted mb-4">Update your details and manage shipping addresses.</p>

    <div class="profile-panel mb-4">
      <div v-if="loadError" class="alert alert-danger mb-3">{{ loadError }}</div>

      <div v-if="loading" class="text-muted">Loading profile...</div>
      <form v-else @submit.prevent="saveProfile">
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label">Full Name <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="form.fullName" maxlength="120" required />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Email</label>
            <input class="form-control" :value="form.email" disabled />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Phone <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="form.phone" maxlength="30" placeholder="012345678" required />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label">Joined Date</label>
            <input class="form-control" :value="joinedDateLabel" disabled />
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button class="btn btn-dark" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Profile' }}
          </button>
        </div>
      </form>
    </div>

    <div class="profile-panel mb-4">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h5 mb-1">Security</h3>
          <div class="small text-muted">Change your account password.</div>
        </div>
      </div>

      <form @submit.prevent="changePassword">
        <div class="row g-3">
          <div class="col-12 col-md-4">
            <label class="form-label">Current Password <span class="text-danger">*</span></label>
            <div class="password-field">
              <input class="form-control password-input" :type="showCurrentPassword ? 'text' : 'password'" v-model="passwordForm.currentPassword" />
              <button
                class="btn password-toggle"
                type="button"
                :aria-label="showCurrentPassword ? 'Hide password' : 'Show password'"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                <svg v-if="showCurrentPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">New Password <span class="text-danger">*</span></label>
            <div class="password-field">
              <input class="form-control password-input" :type="showNewPassword ? 'text' : 'password'" v-model="passwordForm.newPassword" />
              <button
                class="btn password-toggle"
                type="button"
                :aria-label="showNewPassword ? 'Hide password' : 'Show password'"
                @click="showNewPassword = !showNewPassword"
              >
                <svg v-if="showNewPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
            <div class="small text-muted mt-1">Minimum 8 characters.</div>
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label">Confirm Password <span class="text-danger">*</span></label>
            <div class="password-field">
              <input class="form-control password-input" :type="showConfirmPassword ? 'text' : 'password'" v-model="passwordForm.confirmPassword" />
              <button
                class="btn password-toggle"
                type="button"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="showConfirmPassword" class="eye-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
          </div>
        </div>

        <div class="d-flex justify-content-end mt-4">
          <button class="btn btn-dark" type="submit" :disabled="passwordSaving">
            {{ passwordSaving ? 'Updating...' : 'Change Password' }}
          </button>
        </div>
      </form>
    </div>

    <div class="profile-panel mb-4">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h5 mb-1">Address Book</h3>
          <div class="small text-muted">Use one default address for checkout autofill.</div>
        </div>
        <button class="btn btn-outline-dark btn-sm" type="button" @click="openCreateAddressModal">Add Address</button>
      </div>

      <div v-if="addressesLoading" class="text-muted">Loading addresses...</div>
      <div v-else-if="addresses.length === 0" class="text-muted small">No saved addresses yet.</div>

      <div v-else class="row g-3">
        <div v-for="address in addresses" :key="address.id" class="col-12 col-md-6">
          <article class="address-card" :class="{ 'is-default': address.isDefault }">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div class="fw-semibold">{{ address.label || 'Address' }}</div>
                <div v-if="address.isDefault" class="default-pill mt-1">Default</div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary" type="button" @click="openEditAddressModal(address)">Edit</button>
                <button
                  class="btn btn-sm btn-outline-dark"
                  type="button"
                  @click="setDefaultAddress(address)"
                  :disabled="address.isDefault || addressMutatingId === address.id"
                >
                  Set Default
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  type="button"
                  @click="removeAddress(address)"
                  :disabled="addressMutatingId === address.id"
                >
                  Delete
                </button>
              </div>
            </div>
            <div class="small text-muted mt-2">{{ address.phone || '-' }}</div>
            <div class="small text-muted">{{ address.addressLine1 }}</div>
            <div v-if="address.addressLine2" class="small text-muted">{{ address.addressLine2 }}</div>
            <div class="small text-muted">
              {{ address.city }}{{ address.postalCode ? `, ${address.postalCode}` : '' }} · {{ address.country }}
            </div>
          </article>
        </div>
      </div>
    </div>

    <div class="profile-panel mb-4">
      <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h3 class="h5 mb-1">Notification Preferences</h3>
          <div class="small text-muted">Control which notifications you receive in-app and by email.</div>
        </div>
      </div>

      <div v-if="prefsLoading" class="text-muted">Loading preferences...</div>
      <div v-else class="prefs-table-wrap">
        <table class="prefs-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>In App</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Order Updates</td>
              <td><input type="checkbox" v-model="notificationPrefs.inApp.order" /></td>
              <td><input type="checkbox" v-model="notificationPrefs.email.order" /></td>
            </tr>
            <tr>
              <td>Payment Updates</td>
              <td><input type="checkbox" v-model="notificationPrefs.inApp.payment" /></td>
              <td><input type="checkbox" v-model="notificationPrefs.email.payment" /></td>
            </tr>
            <tr>
              <td>Return Updates</td>
              <td><input type="checkbox" v-model="notificationPrefs.inApp.return" /></td>
              <td><input type="checkbox" v-model="notificationPrefs.email.return" /></td>
            </tr>
            <tr>
              <td>Marketing</td>
              <td><input type="checkbox" v-model="notificationPrefs.inApp.marketing" /></td>
              <td><input type="checkbox" v-model="notificationPrefs.email.marketing" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end mt-3">
        <button class="btn btn-dark" type="button" :disabled="prefsSaving || prefsLoading" @click="saveNotificationPreferences">
          {{ prefsSaving ? 'Saving...' : 'Save Preferences' }}
        </button>
      </div>
    </div>

  </div>

  <div v-if="addressModalOpen" class="address-modal-backdrop" @click.self="closeAddressModal">
    <div class="address-modal">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h4 class="h6 mb-0">{{ editingAddressId ? 'Edit Address' : 'Add Address' }}</h4>
        <button class="btn btn-sm btn-outline-dark" type="button" @click="closeAddressModal">x</button>
      </div>

      <div v-if="addressModalError" class="alert alert-danger py-2">{{ addressModalError }}</div>

      <form @submit.prevent="submitAddress">
        <div class="row g-2">
          <div class="col-md-4">
            <label class="form-label">Label</label>
            <input class="form-control" v-model.trim="addressForm.label" maxlength="50" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Phone <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="addressForm.phone" maxlength="30" required />
          </div>
          <div class="col-md-4">
            <label class="form-label">Country <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="addressForm.country" maxlength="80" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">City <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="addressForm.city" maxlength="80" required />
          </div>
          <div class="col-md-6">
            <label class="form-label">Postal Code</label>
            <input class="form-control" v-model.trim="addressForm.postalCode" maxlength="20" />
          </div>
          <div class="col-12">
            <label class="form-label">Address Line 1 <span class="text-danger">*</span></label>
            <input class="form-control" v-model.trim="addressForm.addressLine1" maxlength="255" required />
          </div>
          <div class="col-12">
            <label class="form-label">Address Line 2</label>
            <input class="form-control" v-model.trim="addressForm.addressLine2" maxlength="255" />
          </div>
        </div>

        <div class="form-check mt-3">
          <input id="set-default-address" class="form-check-input" type="checkbox" v-model="addressForm.isDefault" />
          <label for="set-default-address" class="form-check-label">Set as default</label>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-3">
          <button class="btn btn-outline-secondary" type="button" @click="closeAddressModal">Cancel</button>
          <button class="btn btn-dark" type="submit" :disabled="addressSaving">
            {{ addressSaving ? 'Saving...' : (editingAddressId ? 'Save Changes' : 'Create Address') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  fetchMyAddresses,
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
  createMyAddress,
  updateMyAddress,
  deleteMyAddress,
  setMyDefaultAddress,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/userAuth'
import { setUserAuthState, userToken } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'

const loading = ref(true)
const addressesLoading = ref(true)
const saving = ref(false)
const passwordSaving = ref(false)
const loadError = ref('')
const { success: toastSuccess, error: toastError } = useToast()

const addresses = ref([])
const addressMutatingId = ref('')
const addressModalOpen = ref(false)
const addressModalError = ref('')
const addressSaving = ref(false)
const editingAddressId = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const prefsLoading = ref(true)
const prefsSaving = ref(false)

const form = ref({
  fullName: '',
  email: '',
  phone: '',
  createdAt: '',
})

const addressForm = ref({
  label: 'Home',
  phone: '',
  country: 'Cambodia',
  city: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  isDefault: false,
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const notificationPrefs = ref({
  inApp: {
    order: true,
    payment: true,
    return: true,
    marketing: false,
  },
  email: {
    order: true,
    payment: true,
    return: true,
    marketing: false,
  },
})

const joinedDateLabel = computed(() => {
  if (!form.value.createdAt) return '-'
  const d = new Date(form.value.createdAt)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
})

function applyProfile(profile) {
  form.value = {
    fullName: String(profile?.fullName || ''),
    email: String(profile?.email || ''),
    phone: String(profile?.phone || ''),
    createdAt: String(profile?.createdAt || ''),
  }
}

function resetAddressForm() {
  addressForm.value = {
    label: 'Home',
    phone: form.value.phone || '',
    country: 'Cambodia',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    isDefault: false,
  }
}

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    const profile = await fetchMyProfile()
    applyProfile(profile)
  } catch (err) {
    loadError.value = err?.response?.data?.error || 'Failed to load profile.'
  } finally {
    loading.value = false
  }
}

async function loadAddresses() {
  addressesLoading.value = true
  try {
    addresses.value = await fetchMyAddresses()
  } catch {
    addresses.value = []
  } finally {
    addressesLoading.value = false
  }
}

async function loadNotificationPreferences() {
  prefsLoading.value = true
  try {
    const data = await fetchNotificationPreferences()
    notificationPrefs.value = {
      inApp: {
        order: Boolean(data?.inApp?.order),
        payment: Boolean(data?.inApp?.payment),
        return: Boolean(data?.inApp?.return),
        marketing: Boolean(data?.inApp?.marketing),
      },
      email: {
        order: Boolean(data?.email?.order),
        payment: Boolean(data?.email?.payment),
        return: Boolean(data?.email?.return),
        marketing: Boolean(data?.email?.marketing),
      },
    }
  } catch {
    // Keep defaults on load failure.
  } finally {
    prefsLoading.value = false
  }
}

async function saveNotificationPreferences() {
  if (prefsSaving.value) return
  prefsSaving.value = true
  try {
    await updateNotificationPreferences(notificationPrefs.value)
    toastSuccess('Notification preferences updated.')
  } catch (err) {
    toastError(err?.response?.data?.error || 'Failed to update notification preferences.')
  } finally {
    prefsSaving.value = false
  }
}

async function saveProfile() {
  if (saving.value) return
  saving.value = true
  try {
    const phone = String(form.value.phone || '').trim()
    if (!phone) throw new Error('phone is required')
    const payload = { fullName: form.value.fullName, phone }
    const defaultAddress = addresses.value.find((a) => a.isDefault) || addresses.value[0] || null
    if (defaultAddress) {
      payload.defaultAddress = {
        label: defaultAddress.label || 'Home',
        phone,
        country: defaultAddress.country || 'Cambodia',
        city: defaultAddress.city || '',
        addressLine1: defaultAddress.addressLine1 || '',
        addressLine2: defaultAddress.addressLine2 || null,
        postalCode: defaultAddress.postalCode || null,
      }
    } else {
      throw new Error('Please add a default address first.')
    }
    const updated = await updateMyProfile(payload)
    applyProfile(updated)
    setUserAuthState({ token: userToken.value, user: updated })
    toastSuccess('Profile updated successfully.')
  } catch (err) {
    toastError(err?.response?.data?.error || err?.message || 'Failed to update profile.')
  } finally {
    saving.value = false
  }
}

function resetPasswordForm() {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

async function changePassword() {
  if (passwordSaving.value) return
  passwordSaving.value = true
  try {
    const payload = {
      currentPassword: String(passwordForm.value.currentPassword || ''),
      newPassword: String(passwordForm.value.newPassword || ''),
      confirmPassword: String(passwordForm.value.confirmPassword || ''),
    }
    if (!payload.currentPassword) throw new Error('currentPassword is required')
    if (!payload.newPassword) throw new Error('newPassword is required')
    if (payload.newPassword.length < 8) throw new Error('newPassword must be at least 8 characters')
    if (payload.confirmPassword !== payload.newPassword) throw new Error('confirmPassword does not match')

    const data = await changeMyPassword(payload)
    if (data?.token && data?.user) {
      setUserAuthState({ token: data.token, user: data.user })
    }
    resetPasswordForm()
    toastSuccess(data?.message || 'Password changed successfully.')
  } catch (err) {
    toastError(err?.response?.data?.error || err?.message || 'Failed to change password.')
  } finally {
    passwordSaving.value = false
  }
}

function openCreateAddressModal() {
  editingAddressId.value = ''
  addressModalError.value = ''
  resetAddressForm()
  addressModalOpen.value = true
}

function openEditAddressModal(address) {
  editingAddressId.value = address.id
  addressModalError.value = ''
  addressForm.value = {
    label: String(address.label || 'Home'),
    phone: String(address.phone || form.value.phone || ''),
    country: String(address.country || 'Cambodia'),
    city: String(address.city || ''),
    addressLine1: String(address.addressLine1 || ''),
    addressLine2: String(address.addressLine2 || ''),
    postalCode: String(address.postalCode || ''),
    isDefault: Boolean(address.isDefault),
  }
  addressModalOpen.value = true
}

function closeAddressModal() {
  if (addressSaving.value) return
  addressModalOpen.value = false
  addressModalError.value = ''
}

async function submitAddress() {
  if (addressSaving.value) return
  addressSaving.value = true
  addressModalError.value = ''

  const payload = {
    label: addressForm.value.label || 'Home',
    phone: addressForm.value.phone,
    country: addressForm.value.country,
    city: addressForm.value.city,
    addressLine1: addressForm.value.addressLine1,
    addressLine2: addressForm.value.addressLine2 || null,
    postalCode: addressForm.value.postalCode || null,
    isDefault: Boolean(addressForm.value.isDefault),
  }

  try {
    if (editingAddressId.value) {
      await updateMyAddress(editingAddressId.value, payload)
      toastSuccess('Address updated.')
    } else {
      await createMyAddress(payload)
      toastSuccess('Address created.')
    }
    closeAddressModal()
    await Promise.all([loadAddresses(), loadProfile()])
  } catch (err) {
    addressModalError.value = err?.response?.data?.error || 'Failed to save address.'
  } finally {
    addressSaving.value = false
  }
}

async function setDefaultAddress(address) {
  if (!address?.id || address.isDefault || addressMutatingId.value) return
  addressMutatingId.value = address.id
  try {
    await setMyDefaultAddress(address.id)
    toastSuccess('Default address updated.')
    await Promise.all([loadAddresses(), loadProfile()])
  } catch (err) {
    toastError(err?.response?.data?.error || 'Failed to set default address.')
  } finally {
    addressMutatingId.value = ''
  }
}

async function removeAddress(address) {
  if (!address?.id || addressMutatingId.value) return
  const ok = window.confirm('Delete this address?')
  if (!ok) return

  addressMutatingId.value = address.id
  try {
    await deleteMyAddress(address.id)
    toastSuccess('Address deleted.')
    await Promise.all([loadAddresses(), loadProfile()])
  } catch (err) {
    toastError(err?.response?.data?.error || 'Failed to delete address.')
  } finally {
    addressMutatingId.value = ''
  }
}

onMounted(async () => {
  await Promise.all([loadProfile(), loadAddresses(), loadNotificationPreferences()])
})
</script>

<style scoped>
.profile-panel {
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  background: #fff;
  padding: 1rem 1.1rem;
}

.password-field {
  position: relative;
}

.password-input {
  padding-right: 2.8rem;
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

.address-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.85rem;
  background: #fff;
}

.address-card.is-default {
  border-color: #111827;
}

.default-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  background: #111827;
  color: #fff;
}

.address-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.address-modal {
  width: min(760px, 100%);
  max-height: min(90vh, 860px);
  overflow: auto;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
}

.prefs-table-wrap {
  overflow-x: auto;
}

.prefs-table {
  width: 100%;
  border-collapse: collapse;
}

.prefs-table th,
.prefs-table td {
  border-bottom: 1px solid #ece7df;
  padding: 0.65rem 0.3rem;
  font-size: 0.92rem;
}

.prefs-table th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b7280;
}

.prefs-table th:first-child,
.prefs-table td:first-child {
  text-align: left;
  padding-left: 0;
}

.prefs-table th:not(:first-child),
.prefs-table td:not(:first-child) {
  text-align: center;
  width: 120px;
}

</style>
