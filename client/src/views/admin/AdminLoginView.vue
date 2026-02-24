<template>
  <div class="container py-5" style="max-width: 520px;">
    <div class="brand-wordmark mb-1">APSARA STYLE</div>
    <h2 class="h4">Admin Login</h2>
    <p class="text-muted">Enter admin key to access dashboard (thesis demo).</p>

    <div class="bg-white border rounded-4 p-4">
      <label class="form-label">Admin key</label>
      <input class="form-control" v-model="key" placeholder="Enter key..." />

      <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>

      <button class="btn btn-as w-100 mt-4" @click="login">Continue</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminHttp } from '@/api/adminHttp'

const router = useRouter()
const key = ref(localStorage.getItem('apsara_admin_key') || '')
const error = ref('')

async function login() {
  error.value = ''
  localStorage.setItem('apsara_admin_key', key.value)

  try {
    await adminHttp.get('/products') // test auth
    router.push({ name: 'adminProducts' })
  } catch (e) {
    error.value = 'Invalid admin key.'
  }
}
</script>
