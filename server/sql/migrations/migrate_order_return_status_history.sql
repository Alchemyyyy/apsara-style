CREATE TABLE IF NOT EXISTS order_return_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id uuid NOT NULL REFERENCES order_return_requests(id) ON DELETE CASCADE,
  status varchar(30) NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_return_status_history_request
  ON order_return_status_history(return_request_id, created_at DESC);
