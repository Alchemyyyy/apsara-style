<template>
  <footer class="app-footer mt-5">
    <div class="container py-5">
      <div class="row g-4 g-lg-5">
        <div class="col-lg-3 col-md-6">
          <div class="brand-wordmark footer-brand mb-2">APSARA STYLE</div>
          <p class="footer-muted mb-3">
            Elevated essentials for women, men, and unisex wardrobes.
          </p>
          <div class="trust-inline">
            <span class="trust-chip">Secure Checkout</span>
            <span class="trust-chip">Cash on Delivery</span>
            <span class="trust-chip">Easy Returns</span>
          </div>
        </div>

        <div class="col-lg-2 col-md-6">
          <div class="footer-title">Shop</div>
          <div class="footer-links">
            <RouterLink class="footer-link" :to="{ name: 'products', params: { gender: 'women' } }">Women</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'products', params: { gender: 'men' } }">Men</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'products', params: { gender: 'unisex' } }">Unisex</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'search', query: { q: 'new arrivals' } }">New Arrivals</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'search', query: { q: 'sale' } }">Sale</RouterLink>
          </div>
        </div>

        <div class="col-lg-2 col-md-6">
          <div class="footer-title">Help</div>
          <div class="footer-links">
            <RouterLink class="footer-link" :to="{ name: 'trackOrder' }">Track Order</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'orders' }">My Orders</RouterLink>
            <RouterLink class="footer-link" :to="{ name: 'account' }">Account</RouterLink>
            <a class="footer-link" href="#">Shipping Info</a>
            <a class="footer-link" href="#">Returns & Exchanges</a>
          </div>
        </div>

        <div class="col-lg-2 col-md-6">
          <div class="footer-title">Policies</div>
          <div class="footer-links">
            <a class="footer-link" href="#">Privacy Policy</a>
            <a class="footer-link" href="#">Terms & Conditions</a>
            <a class="footer-link" href="#">Refund Policy</a>
            <a class="footer-link" href="#">Size Guide</a>
          </div>
        </div>

        <div class="col-lg-3 col-md-6">
          <div class="footer-title">Stay Connected</div>
          <a class="footer-muted small mb-2 footer-mail" href="mailto:support@apsarastyle.com">support@apsarastyle.com</a>
          <div class="footer-muted small mb-3">+855 12 345 678</div>

          <div class="social-row mb-3">
            <a href="#" class="social-link icon-link" aria-label="Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" stroke-width="1.8" />
                <circle cx="12" cy="12" r="3.7" stroke="currentColor" stroke-width="1.8" />
                <circle cx="17" cy="7" r="1" fill="currentColor" />
              </svg>
            </a>
            <a href="#" class="social-link icon-link" aria-label="Facebook" title="Facebook">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M13.2 20V12.9H15.8L16.2 10H13.2V8.2C13.2 7.4 13.5 6.8 14.6 6.8H16.3V4.2C16 4.1 15 4 14 4C11.8 4 10.3 5.3 10.3 7.8V10H8V12.9H10.3V20H13.2Z" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" class="social-link icon-link" aria-label="TikTok" title="TikTok">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14.8 4.2C15.3 5.6 16.4 6.7 17.8 7.1V9.3C16.8 9.3 15.8 9 14.8 8.4V14.4C14.8 17.2 12.8 19.2 10.2 19.2C7.6 19.2 5.6 17.2 5.6 14.7C5.6 12.1 7.6 10.2 10.2 10.2C10.5 10.2 10.8 10.2 11.1 10.3V12.7C10.8 12.6 10.5 12.5 10.2 12.5C8.9 12.5 7.9 13.5 7.9 14.7C7.9 16 8.9 16.9 10.2 16.9C11.5 16.9 12.5 15.9 12.5 14.7V4.2H14.8Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} APSARA STYLE</span>
        <span class="footer-bottom-divider">•</span>
        <span>Designed for modern fashion commerce.</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  color: #0f172a;
}

.footer-brand {
  color: #111827;
}

.footer-title {
  margin-bottom: 0.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #111827;
}

.footer-muted {
  color: #64748b;
}

.footer-links {
  display: flex;
  flex-direction: column;
  gap: 0.34rem;
}

.footer-link {
  font-size: 0.92rem;
  color: #334155;
  text-decoration: none;
}

.footer-link:hover {
  color: #111827;
}

.trust-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.trust-chip {
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  color: #334155;
  background: #f8fafc;
}

.social-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.social-link {
  font-size: 0.82rem;
  text-decoration: none;
  color: #0f172a;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  padding: 0.18rem 0.58rem;
  background: #fff;
}

.social-link:hover {
  border-color: #111827;
}
.icon-link {
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-link svg {
  width: 17px;
  height: 17px;
}

.footer-mail {
  text-decoration: none;
  display: inline-block;
}

.footer-mail:hover {
  color: #0f172a;
}

.footer-bottom {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  color: #64748b;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.footer-bottom-divider {
  opacity: 0.7;
}

@media (max-width: 575.98px) {
  .social-row {
    margin-bottom: 0 !important;
  }
}
</style>
