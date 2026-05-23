# APSARA STYLE Architecture

## Frontend Structure

The frontend is organized by feature modules under `client/src/features`, with app shell and shared utilities split out explicitly.

```text
client/src/
  app/
    bootstrap/
    components/layout/
    router/
  features/
    admin/
    auth/
    cart/
    home/
    notifications/
    orders/
    products/
    search/
    stylist/
    wishlist/
  shared/
    api/
    components/common/
    composables/
    styles/
```

Frontend responsibilities:

- `app`: application shell, global bootstrapping, router, and layout components.
- `features/<domain>`: route views, feature-specific components, API wrappers, and local stores.
- `shared/api`: cross-feature API clients and low-level request/session helpers.
- `shared/components/common`: reusable UI components that are not owned by one feature.
- `shared/composables`: reusable Vue composables.
- `shared/styles`: global theme and shared CSS variables.

Feature views should not import low-level HTTP clients directly when a feature API wrapper exists. Prefer a small API module such as `features/admin/api/adminProductsApi.js` so endpoint paths and response normalization stay outside Vue templates.

Large Vue files should be split by responsibility:

- Extract presentational sections into feature components.
- Keep API calls in feature API modules.
- Keep reusable state in feature stores or composables.
- Keep route-level views focused on orchestration.

## Backend Structure

Request flow:

1. `routes/`
2. `controllers/`
3. `services/`
4. `repositories/`
5. PostgreSQL (`db/index.js`)

The backend is organized by domain modules under `server/src/modules`.

Typical module shape:

```text
server/src/modules/<domain>/
  routes.js
  controller.js
  service.js
  repository.js
```

Examples:

```text
server/src/modules/products/
server/src/modules/cart/
server/src/modules/orders/
server/src/modules/adminProducts/
server/src/modules/notifications/
```

Responsibilities inside each module:

- `routes`: endpoint mapping + middleware chain.
- `controllers`: request validation + HTTP response format.
- `services`: business rules and transaction workflow.
- `repositories`: SQL/data access only.

Shared infrastructure remains at the top level:

- `server/src/config`: centralized environment parsing and runtime config.
- `server/src/db`: PostgreSQL connection.
- `server/src/middleware`: auth, session, rate limiting.
- `server/src/shared`: shared backend helpers such as `AppError`, `appError`, and `asyncHandler`.
- `server/src/shared/validation.js`: reusable controller validation helpers for common 400 responses.
- `server/src/shared/responses.js`: reusable success response helpers such as `ok`, `okList`, and `noContentOk`.
- `server/src/utils`: token, password, similarity helpers.
- `server/src/services`: shared cross-module services such as email and embedding helpers.

Module mounting is centralized in `server/src/modules/index.js`, and `server/src/app.js` only mounts the module registry after global middleware.

Controllers should wrap async actions with `asyncHandler` instead of repeating `try/catch(next)`. The upload controller is the main exception because Multer uses callback-style error forwarding.

Controllers should use shared response helpers instead of hand-writing success envelopes.

Notes:

- Backend module system: CommonJS with `module.exports = { ... }`.
- Frontend module system: ESM (`export` / `import`).

## Key Domains

- Catalog: `products`, `search`, `recommendations`, `stylist`
- Cart/Checkout: `cart`, `orders`, inventory reservations
- Admin: `adminProducts`, `adminOrders`, `adminAnalytics`
- Guest engagement: `events`, `wishlist`, order tracking

## Smoke Test Checklist

Assumptions:

- PostgreSQL is running.
- `server/.env` is configured (`DATABASE_URL`, `ADMIN_TOKEN_SECRET`, `USER_TOKEN_SECRET`).
- Migrations have been applied.

### 1) Start apps

```bash
npm --prefix server run dev
npm --prefix client run dev
```

### Auth & Email Setup

1. Run auth-related migrations:

```bash
psql "$DATABASE_URL" -f server/sql/migrations/migrate_admin_auth_rbac.sql
psql "$DATABASE_URL" -f server/sql/migrations/migrate_password_reset_tokens.sql
```

2. Configure token/email env vars (`server/.env`):

```bash
ADMIN_TOKEN_SECRET=replace-with-long-random-secret
USER_TOKEN_SECRET=replace-with-long-random-secret
CLIENT_URL=http://localhost:5173

# Email mode: disabled | console | smtp
EMAIL_MODE=console

# For SMTP mode:
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-pass
MAIL_FROM="APSARA STYLE <no-reply@apsara.local>"
```

3. Create first admin user:

```bash
npm --prefix server run create-admin -- --email admin@apsara.com --password 'YourStrongPass123!' --name 'Super Admin' --role super_admin
```

### 2) Guest shopping flow

1. Open `http://localhost:5173`.
2. Browse product list and open a product detail page.
3. Select color/size and confirm stock appears.
4. Add item to cart.
5. Open cart and update quantity.
6. Checkout with email/address.
7. Confirm order code is returned and order appears in `/orders`.

### 3) Guest tracking flow

1. Open `/track-order`.
2. Enter `email + order code` from checkout.
3. Confirm order detail loads with status and history timeline.

### 4) Admin flow

1. Open `/admin` and login with admin email/password.
2. `Admin Products`: search/list and verify stock values.
3. `Admin Orders`: move status through valid transitions.
4. Confirm status history is visible on order detail for guest track/list pages.
5. `Admin Analytics`: verify overview cards, top products, top searches, and trend chart render.

### 5) Inventory reservation behavior

1. Add same variant to cart in one browser session.
2. Open second session/incognito and try same variant quantity.
3. Confirm availability and reservation conflict handling works.

### 6) User auth & password reset flow

1. Open `/login` and register a user account.
2. Logout/expire session and login again.
3. Use `Forgot password` on `/login`.
4. If `EMAIL_MODE=console`, copy reset link/token from server logs.
5. Complete reset and login using new password.

## Quick Validation Commands

```bash
# Backend syntax
for f in $(rg --files server/src | rg '\\.js$'); do node --check "$f" || exit 1; done

# Frontend production build
npm --prefix client run build

# Frontend unit tests
npm --prefix client test
```
