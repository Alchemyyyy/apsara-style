<template>
  <footer class="border-top bg-white mt-5">
    <div class="container py-5">
      <div class="row g-4">
        <div class="col-md-6">
          <div class="brand-wordmark mb-2">APSARA STYLE</div>
          <div class="text-muted">Where elegance meets intelligence.</div>
        </div>
        <div class="col-md-3">
          <div class="fw-semibold mb-2">Shop</div>
          <div class="d-flex flex-column gap-1">
            <RouterLink class="link-muted" :to="{ name: 'products', params: { gender: 'women' } }">Women</RouterLink>
            <RouterLink class="link-muted" :to="{ name: 'products', params: { gender: 'men' } }">Men</RouterLink>
          </div>
        </div>
        <div class="col-md-3">
          <div class="fw-semibold mb-2">Project</div>
          <div class="d-flex flex-column gap-1">
            <span class="text-muted">Thesis e-commerce</span>
            <span class="text-muted">AI Search & Recommendations</span>
          </div>
        </div>
      </div>

      <div class="text-muted small mt-4">© {{ new Date().getFullYear() }} APSARA STYLE</div>
    </div>
  </footer>
</template>
