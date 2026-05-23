CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  order_in_app boolean NOT NULL DEFAULT true,
  order_email boolean NOT NULL DEFAULT true,
  payment_in_app boolean NOT NULL DEFAULT true,
  payment_email boolean NOT NULL DEFAULT true,
  return_in_app boolean NOT NULL DEFAULT true,
  return_email boolean NOT NULL DEFAULT true,
  marketing_in_app boolean NOT NULL DEFAULT false,
  marketing_email boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
