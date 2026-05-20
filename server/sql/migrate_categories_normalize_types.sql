-- Normalize categories into shared product types and add admin controls.
-- Run after base schema migration.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_active_sort
  ON categories(is_active, sort_order, name);

WITH normalized AS (
  SELECT
    id,
    name,
    LOWER(REGEXP_REPLACE(slug, '^(women|men|unisex)-', '')) AS type_slug
  FROM categories
),
ensured AS (
  INSERT INTO categories (name, slug, gender, is_active, sort_order)
  SELECT
    MIN(n.name) AS name,
    n.type_slug AS slug,
    'unisex' AS gender,
    true AS is_active,
    0 AS sort_order
  FROM normalized n
  GROUP BY n.type_slug
  ON CONFLICT (slug) DO UPDATE
    SET gender = 'unisex'
  RETURNING id, slug
),
mapping AS (
  SELECT
    old_c.id AS old_id,
    new_c.id AS new_id
  FROM normalized old_c
  JOIN categories new_c
    ON new_c.slug = old_c.type_slug
)
UPDATE products p
SET category_id = m.new_id
FROM mapping m
WHERE p.category_id = m.old_id
  AND p.category_id <> m.new_id;

WITH normalized AS (
  SELECT
    id,
    LOWER(REGEXP_REPLACE(slug, '^(women|men|unisex)-', '')) AS type_slug
  FROM categories
),
mapping AS (
  SELECT
    old_c.id AS old_id,
    new_c.id AS new_id
  FROM normalized old_c
  JOIN categories new_c
    ON new_c.slug = old_c.type_slug
)
DELETE FROM categories c
USING mapping m
WHERE c.id = m.old_id
  AND m.old_id <> m.new_id;

UPDATE categories
SET gender = 'unisex'
WHERE gender <> 'unisex';
