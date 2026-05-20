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

