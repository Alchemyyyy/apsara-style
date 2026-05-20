BEGIN;

ALTER TABLE wishlists
  ADD COLUMN IF NOT EXISTS session_id varchar(120);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'user_id'
  ) THEN
    UPDATE wishlists
    SET session_id = user_id::text
    WHERE session_id IS NULL;
  END IF;
END $$;

ALTER TABLE wishlists
  DROP CONSTRAINT IF EXISTS wishlists_pkey;

ALTER TABLE wishlists
  ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE wishlists
  DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;

ALTER TABLE wishlists
  DROP COLUMN IF EXISTS user_id;

ALTER TABLE wishlists
  ADD CONSTRAINT wishlists_pkey PRIMARY KEY (session_id, product_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_session ON wishlists(session_id);

COMMIT;
