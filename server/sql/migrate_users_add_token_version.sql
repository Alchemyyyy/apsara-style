ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version int NOT NULL DEFAULT 1;

UPDATE users
SET token_version = 1
WHERE token_version IS NULL;
