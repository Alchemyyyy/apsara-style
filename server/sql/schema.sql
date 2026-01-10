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

-- =========================
-- CATALOG
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  slug varchar(100) UNIQUE NOT NULL,
  gender varchar(10) NOT NULL DEFAULT 'unisex', -- men | women | unisex
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- =========================
-- ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  email varchar(255),
  phone varchar(30),

  status varchar(30) NOT NULL DEFAULT 'pending',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,

  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

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

-- =========================
-- WISHLIST
-- =========================
CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

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
