-- Add session ownership to orders for guest-access scoping.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_id varchar(120);

CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);
