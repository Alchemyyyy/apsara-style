ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_provider varchar(30),
  ADD COLUMN IF NOT EXISTS payment_status varchar(30) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_intent_id varchar(120),
  ADD COLUMN IF NOT EXISTS checkout_session_id varchar(120),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session ON orders(checkout_session_id);
