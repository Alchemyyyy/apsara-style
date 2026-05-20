-- APSARA STYLE - PostgreSQL Schema
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- USERS & AUTH
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(120) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  token_version int NOT NULL DEFAULT 1,
  role varchar(20) NOT NULL DEFAULT 'customer', -- customer | admin
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label varchar(50) DEFAULT 'Home',
  phone varchar(30),
  country varchar(80) DEFAULT 'Cambodia',
  city varchar(80),
  address_line1 varchar(255) NOT NULL,
  address_line2 varchar(255),
  postal_code varchar(20),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  order_in_app boolean NOT NULL DEFAULT true,
  order_email boolean NOT NULL DEFAULT true,
  payment_in_app boolean NOT NULL DEFAULT true,
  payment_email boolean NOT NULL DEFAULT true,
  return_in_app boolean NOT NULL DEFAULT true,
  return_email boolean NOT NULL DEFAULT true,
  marketing_in_app boolean NOT NULL DEFAULT false,
  marketing_email boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(120) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_email_lower ON admin_users (LOWER(email));

CREATE TABLE IF NOT EXISTS admin_roles (
  code varchar(40) PRIMARY KEY,
  name varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_code varchar(40) NOT NULL REFERENCES admin_roles(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_user_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role ON admin_user_roles(role_code);

CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_admin ON admin_refresh_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_expires ON admin_refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(40) NOT NULL,
  entity_id varchar(80),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_created
  ON admin_audit_logs(actor_admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_created
  ON admin_audit_logs(entity_type, entity_id, created_at DESC);

INSERT INTO admin_roles (code, name) VALUES
  ('super_admin', 'Super Admin'),
  ('ops_admin', 'Operations Admin'),
  ('catalog_admin', 'Catalog Admin')
ON CONFLICT (code) DO NOTHING;

-- =========================
-- CATALOG
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  gender varchar(10) NOT NULL DEFAULT 'unisex', -- legacy audience marker; kept for compatibility
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_active_sort ON categories(is_active, sort_order, name);

CREATE SEQUENCE IF NOT EXISTS product_code_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code varchar(20) UNIQUE NOT NULL DEFAULT ('P-' || LPAD(nextval('product_code_seq')::text, 6, '0')),
  title varchar(200) NOT NULL,
  slug varchar(220) UNIQUE NOT NULL,
  gender varchar(10) NOT NULL, -- men | women | unisex
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,

  description text,
  base_price numeric(12,2) NOT NULL,
  discount_price numeric(12,2),

  is_active boolean NOT NULL DEFAULT true,

  tags jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text varchar(200),
  sort_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size varchar(20) NOT NULL,
  color varchar(40) NOT NULL,
  sku varchar(80) UNIQUE,
  stock int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock);

-- =========================
-- CART
-- =========================
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id varchar(120),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);

CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  qty int NOT NULL CHECK (qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cart_id, variant_id)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id varchar(120) NOT NULL,
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  cart_item_id uuid REFERENCES cart_items(id) ON DELETE CASCADE,
  qty int NOT NULL CHECK (qty > 0),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_variant ON inventory_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_session ON inventory_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);

-- =========================
-- ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id varchar(120),
  order_code varchar(16) UNIQUE NOT NULL,
  email varchar(255),
  phone varchar(30),

  status varchar(30) NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_provider varchar(30),
  payment_status varchar(30) NOT NULL DEFAULT 'unpaid',
  payment_intent_id varchar(120),
  checkout_session_id varchar(120),
  paid_at timestamptz,

  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session ON orders(checkout_session_id);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  title_snapshot varchar(200) NOT NULL,
  price_snapshot numeric(12,2) NOT NULL,
  qty int NOT NULL CHECK (qty > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at);

CREATE TABLE IF NOT EXISTS order_return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  session_id varchar(120),
  reason varchar(50) NOT NULL,
  note text,
  status varchar(30) NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_return_requests_order
  ON order_return_requests(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_return_requests_session
  ON order_return_requests(session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_return_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL REFERENCES order_return_requests(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_return_status_history_request
  ON order_return_status_history(return_request_id, created_at DESC);

-- =========================
-- WISHLIST
-- =========================
CREATE TABLE IF NOT EXISTS wishlists (
  session_id varchar(120) NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_session ON wishlists(session_id);

-- =========================
-- EVENTS (AI + analytics)
-- =========================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id varchar(120),
  type varchar(30) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  query text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_product ON events(product_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id varchar(120),
  type varchar(40) NOT NULL,
  title varchar(120) NOT NULL,
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_session_created
  ON notifications(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_session_unread
  ON notifications(session_id, is_read, created_at DESC);

-- =========================
-- EMBEDDINGS
-- =========================
CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id uuid PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  vector real[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendation_cache (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  product_ids uuid[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
