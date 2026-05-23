CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id varchar(120),
  type varchar(40) NOT NULL,
  title varchar(120) NOT NULL,
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_session_created
  ON notifications(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_session_unread
  ON notifications(session_id, is_read, created_at DESC);
