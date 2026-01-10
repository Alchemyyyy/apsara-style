<template>
  <div class="container py-5" v-if="order">
    <div class="d-flex justify-content-between align-items-end flex-wrap gap-3">
      <div>
        <div class="brand-wordmark mb-1">APSARA STYLE</div>
        <h2 class="h4 mb-0">Order {{ order.id.slice(0, 8).toUpperCase() }}</h2>
        <div class="text-muted small">Status: {{ order.status }} · Total: ${{ Number(order.total).toFixed(2) }}</div>
      </div>
      <RouterLink class="btn btn-outline-dark" :to="{ name: 'orders' }">All orders</RouterLink>
    </div>

    <div class="row g-4 mt-2">
      <div class="col-lg-7">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Items</div>

          <div class="d-flex flex-column gap-3">
            <div v-for="it in order.items" :key="it.id" class="d-flex gap-3 align-items-center">
              <img :src="it.hero_image" class="rounded-3" style="width: 84px; height: 112px; object-fit: cover;" />
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ it.title_snapshot }}</div>
                <div class="text-muted small">Color: {{ it.color }} · Size: {{ it.size }}</div>
                <div class="text-muted small">Qty: {{ it.qty }}</div>
              </div>
              <div class="fw-semibold">${{ Number(it.price_snapshot).toFixed(2) }}</div>
            </div>
          </div>

          <hr class="my-4" />
          <div class="d-flex justify-content-between">
            <span class="text-muted">Subtotal</span>
            <span class="fw-semibold">${{ Number(order.subtotal).toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <span class="text-muted">Total</span>
            <span class="fw-semibold">${{ Number(order.total).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="col-lg-5">
        <div class="bg-white border rounded-4 p-4">
          <div class="fw-semibold mb-3">Shipping</div>
          <div class="text-muted small">Email: {{ order.email }}</div>
          <div class="text-muted small">Phone: {{ order.phone || '-' }}</div>

          <hr class="my-3" />
          <div class="text-muted small">
            <div>{{ order.shipping_address?.addressLine1 }}</div>
            <div v-if="order.shipping_address?.addressLine2">{{ order.shipping_address.addressLine2 }}</div>
            <div>{{ order.shipping_address?.city }}, {{ order.shipping_address?.country }}</div>
            <div>{{ order.shipping_address?.postalCode }}</div>
          </div>

          <div class="alert alert-success mt-4 mb-0">
            Order placed successfully 🎉
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="container py-5 text-center text-muted">Loading order…</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { http } from '@/api/http'

const props = defineProps({ id: { type: String, required: true } })
const order = ref(null)

async function load() {
  const res = await http.get(`/orders/${props.id}`)
  order.value = res.data.data
}

onMounted(load)
</script>
