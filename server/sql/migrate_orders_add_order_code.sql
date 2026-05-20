ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_code varchar(16);

UPDATE orders
SET order_code = 'AS-' || UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 10))
WHERE order_code IS NULL;

ALTER TABLE orders
  ALTER COLUMN order_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
