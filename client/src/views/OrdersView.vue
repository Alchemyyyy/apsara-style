<template>
  <div class="container py-5">
    <div class="brand-wordmark mb-1">APSARA STYLE</div>
    <h2 class="h4">Orders</h2>

    <div v-if="loading" class="text-muted py-5 text-center">Loading…</div>

    <div v-else class="bg-white border rounded-4 p-3 mt-3">
      <div v-if="orders.length === 0" class="text-muted p-3">No orders yet.</div>

      <div v-else class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id">
              <td class="fw-semibold">{{ o.id.slice(0, 8).toUpperCase() }}</td>
              <td><span class="badge text-bg-light border">{{ o.status }}</span></td>
              <td class="fw-semibold">${{ Number(o.total).toFixed(2) }}</td>
              <td class="text-muted">{{ new Date(o.created_at).toLocaleString() }}</td>
              <td class="text-end">
                <RouterLink class="btn btn-outline-dark btn-sm" :to="{ name: 'orderDetail', params: { id: o.id } }">
                  View
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { http } from '@/api/http'

const orders = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await http.get('/orders')
    orders.value = res.data.data
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
