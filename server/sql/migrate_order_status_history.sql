CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at);

INSERT INTO order_status_history (order_id, status, created_at, note)
SELECT o.id, o.status, o.created_at, 'Backfilled from orders table'
FROM orders o
WHERE NOT EXISTS (
  SELECT 1
  FROM order_status_history h
  WHERE h.order_id = o.id
);
