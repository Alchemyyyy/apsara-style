-- Add human-friendly product reference code while keeping UUID as primary key.
-- Example format: P-000001

CREATE SEQUENCE IF NOT EXISTS product_code_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_code varchar(20);

WITH ordered AS (
  SELECT id
  FROM products
  WHERE product_code IS NULL
  ORDER BY created_at ASC, id ASC
)
UPDATE products p
SET product_code = 'P-' || LPAD(nextval('product_code_seq')::text, 6, '0')
FROM ordered o
WHERE p.id = o.id;

ALTER TABLE products
  ALTER COLUMN product_code SET DEFAULT ('P-' || LPAD(nextval('product_code_seq')::text, 6, '0'));

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_product_code ON products(product_code);

