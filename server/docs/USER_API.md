# User API Documentation

Base URL (local): `http://localhost:4000`

All user endpoints return JSON in this pattern:

- Success: `{ "success": true, "data": ... }`
- List success: `{ "success": true, "data": [...], "meta": {...} }`
- Error: `{ "success": false, "error": "message" }`

---

## Session + Auth

This API uses two identity layers:

1. **Guest session** (`x-session-id`)
2. **User auth token** (`Authorization: Bearer <token>`)

### `x-session-id` behavior

- Session middleware runs before user routes.
- If request has `x-session-id` header, server uses it.
- If missing, server creates one and returns it in response header `x-session-id`.
- Cart, orders, wishlist, notifications, events, and recommendations use this session id.

### User token behavior

- Token is returned from auth login/register/social login.
- Send token as:
  - `Authorization: Bearer <token>`
- Token currently uses JWT HS256 and expires by default in **7 days**.

---

## Authentication (`/api/auth`)

### Register
- `POST /api/auth/register`

Request body:
```json
{
  "fullName": "Customer Name",
  "email": "user@example.com",
  "password": "strongpassword"
}
```

Response data:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "fullName": "Customer Name",
    "email": "user@example.com",
    "role": "customer",
    "createdAt": "2026-04-22T10:00:00.000Z",
    "updatedAt": "2026-04-22T10:00:00.000Z",
    "phone": null,
    "defaultAddress": null
  }
}
```

### Login
- `POST /api/auth/login`

Request body:
```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

### Social login (Google)
- `POST /api/auth/google`

Request body:
```json
{
  "credential": "<google-id-token>"
}
```

### Social login (Facebook)
- `POST /api/auth/facebook`

Request body:
```json
{
  "access_token": "<facebook-user-access-token>"
}
```

### Forgot password
- `POST /api/auth/forgot-password`

Request body:
```json
{
  "email": "user@example.com"
}
```

Notes:
- Response is intentionally generic to avoid email enumeration.
- In non-production when email sending is not configured, response may include `resetToken` fallback.

### Reset password
- `POST /api/auth/reset-password`

Request body:
```json
{
  "token": "<reset-token>",
  "newPassword": "newpassword123"
}
```

### My profile
- `GET /api/auth/me`
- Requires user token

### Update profile
- `PATCH /api/auth/me`
- Requires user token

Allowed fields:
- `fullName`
- `phone`
- `defaultAddress` object:
  - `label`, `phone`, `country`, `city`, `addressLine1`, `addressLine2`, `postalCode`

### Change password
- `PUT /api/auth/me/password`
- Requires user token

Request body:
```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password-min-8",
  "confirmPassword": "new-password-min-8"
}
```

Notes:
- On success, token version is bumped (other sessions are logged out).
- Response includes new user token.

### Address book
- `GET /api/auth/me/addresses` (requires token)
- `POST /api/auth/me/addresses` (requires token)
- `PATCH /api/auth/me/addresses/:id` (requires token)
- `DELETE /api/auth/me/addresses/:id` (requires token)
- `PATCH /api/auth/me/addresses/:id/default` (requires token)

Create/update address body:
```json
{
  "label": "Home",
  "phone": "012345678",
  "country": "Cambodia",
  "city": "Phnom Penh",
  "addressLine1": "Street 123",
  "addressLine2": "",
  "postalCode": "12000",
  "isDefault": true
}
```

---

## Catalog (`/api/products`)

### List products
- `GET /api/products`

Query params:
- `page` (default `1`)
- `limit` (default `12`, max `48`)
- `gender` (`men|women|unisex`)
- `category` (category slug)
- `minPrice`
- `maxPrice`
- `discount` (`true|1|yes`)
- `sort`:
  - `recommend`
  - `newest`
  - `price_asc`
  - `price_desc`
  - `discount_desc`
  - `discount_asc`

### Product metadata (for menu/filter)
- `GET /api/products/meta`

Returns:
- `genders`: `["men","women","unisex"]`
- `categories`: each type with per-gender counts

### Product detail
- `GET /api/products/:id`

Returns product with:
- `images`
- `variants`

### Similar products
- `GET /api/products/:id/similar`
- Query:
  - `limit` (default `8`, max `24`)

---

## Cart (`/api/cart`)

All cart endpoints are session-based (`x-session-id`).

### Get cart
- `GET /api/cart`

### Add item
- `POST /api/cart/items`

Request body:
```json
{
  "variantId": "uuid",
  "qty": 1
}
```

### Update item qty
- `PATCH /api/cart/items/:itemId`

Request body:
```json
{
  "qty": 2
}
```

Notes:
- `qty = 0` removes item.

### Remove item
- `DELETE /api/cart/items/:itemId`

### Refresh reservations
- `POST /api/cart/reserve`

Returns:
- `cart`
- `failedItems` (items that cannot be reserved with current stock)

### Adjust cart to available stock
- `POST /api/cart/adjust-to-available`

Returns:
- `cart`
- `adjustedItems`
- `removedItems`

### Claim guest cart into logged-in user cart
- `POST /api/cart/claim`
- Requires user token

---

## Orders (`/api/orders`)

### Create order from cart
- `POST /api/orders`

Request body:
```json
{
  "email": "user@example.com",
  "phone": "012345678",
  "shippingAddress": {
    "country": "Cambodia",
    "city": "Phnom Penh",
    "addressLine1": "Street 123",
    "addressLine2": "",
    "postalCode": "12000"
  }
}
```

### List my orders (session-based)
- `GET /api/orders`

### Order detail by id (session-based)
- `GET /api/orders/:id`

### Lookup order (guest support)
- `POST /api/orders/lookup`

Request body:
```json
{
  "email": "user@example.com",
  "orderCode": "A123456789"
}
```

### Cancel order
- `PATCH /api/orders/:id/cancel`

### Request return
- `POST /api/orders/:id/returns`

Request body:
```json
{
  "reason": "size_issue",
  "note": "Need different size"
}
```

---

## Payments (`/api/payments`)

### Create Bakong checkout session
- `POST /api/payments/checkout-session`

Request body:
```json
{
  "orderId": "uuid"
}
```

### Read order payment status
- `GET /api/payments/orders/:orderId/status`

### Sync payment status from provider
- `POST /api/payments/orders/:orderId/sync`

### Set Cash on Delivery for order
- `POST /api/payments/orders/:orderId/cod`

### Bakong webhook (provider-side)
- `POST /api/payments/bakong/webhook`

Notes:
- Webhook is intended for payment provider callbacks, not frontend clients.

---

## Notifications (`/api/notifications`)

Session-based in-app notification APIs:

### List notifications
- `GET /api/notifications`

Query params:
- `page`, `limit`
- `type`
- `is_read` (`true|false|read|unread|all`)
- `date_from` (ISO date)
- `date_to` (ISO date)

### Mark one read
- `PATCH /api/notifications/:id/read`

### Mark all read
- `PATCH /api/notifications/read-all`

### Clear old notifications
- `DELETE /api/notifications/clear`

Query/body:
- `days` (integer >= 1)

### SSE stream
- `GET /api/notifications/stream`

Notes:
- Supports session through `x-session-id`.
- Also accepts `sid` query for SSE convenience.

### Notification preferences (user account)
- `GET /api/notifications/preferences` (requires token)
- `PATCH /api/notifications/preferences` (requires token)

Patch body:
```json
{
  "inApp": {
    "order": true,
    "payment": true,
    "return": true,
    "marketing": false
  },
  "email": {
    "order": true,
    "payment": true,
    "return": true,
    "marketing": false
  }
}
```

---

## Wishlist (`/api/wishlist`)

Session-based wishlist APIs:

### List wishlist
- `GET /api/wishlist`

### Add wishlist item
- `POST /api/wishlist`

Request body:
```json
{
  "productId": "uuid"
}
```

### Remove wishlist item
- `DELETE /api/wishlist/:productId`

---

## Search (`/api/search`)

### Search catalog
- `GET /api/search`

Query params are forwarded to search service (keyword/query filters).

---

## Recommendations (`/api/recommendations`)

### Personalized recommendations
- `GET /api/recommendations`
- Uses session behavior/events when available
- Query:
  - `limit`

### Trending recommendations
- `GET /api/recommendations/trending`
- Query:
  - `limit`

---

## Stylist (`/api/stylist`)

### Build outfit suggestions
- `POST /api/stylist`

Request body:
```json
{
  "prompt": "Need a smart casual office look",
  "gender": "women",
  "occasion": "office",
  "style": "minimal",
  "budgetMax": 120,
  "k": 3
}
```

---

## Events (`/api/events`)

### Track behavior event
- `POST /api/events`

Request body:
```json
{
  "type": "product_view",
  "productId": "uuid",
  "query": "linen shirt",
  "meta": {
    "source": "products_page"
  }
}
```

---

## Team Notes

1. Keep sending `x-session-id` from frontend/API clients to preserve cart/wishlist/order/notification continuity.
2. Use user token only for protected account endpoints (`/api/auth/me*`, notification preferences, `/api/cart/claim`).
3. For Postman:
   - Set `{{baseUrl}} = http://localhost:4000`
   - Add `x-session-id` in collection headers
   - Save `token` from login and use Bearer auth where required.
