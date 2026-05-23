CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(120) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_admin_users_email_lower ON admin_users (LOWER(email));

CREATE TABLE IF NOT EXISTS admin_roles (
  code varchar(40) PRIMARY KEY,
  name varchar(80) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_code varchar(40) NOT NULL REFERENCES admin_roles(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (admin_user_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role ON admin_user_roles(role_code);

INSERT INTO admin_roles (code, name) VALUES
  ('super_admin', 'Super Admin'),
  ('ops_admin', 'Operations Admin'),
  ('catalog_admin', 'Catalog Admin')
ON CONFLICT (code) DO NOTHING;
