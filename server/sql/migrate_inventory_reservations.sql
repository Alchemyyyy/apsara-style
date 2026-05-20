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

DELETE FROM inventory_reservations
WHERE expires_at <= now();
