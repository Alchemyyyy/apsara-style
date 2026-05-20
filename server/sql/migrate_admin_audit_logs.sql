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

