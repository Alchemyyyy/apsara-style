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
