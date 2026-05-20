/**
 * Replace random placeholder product images (picsum) with fashion/editorial images.
 *
 * Run:
 *   node scripts/replace_product_images_with_fashion.js
 */

require("dotenv").config();
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL env var.");
  process.exit(1);
}

const FASHION_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
  "https://images.unsplash.com/photo-1516257984-b1b4d707412e",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
  "https://images.unsplash.com/photo-1445205170230-053b83016050",
  "https://images.unsplash.com/photo-1464863979621-258859e62245",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
  "https://images.unsplash.com/photo-1475180098004-ca77a66827be",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",
  "https://images.unsplash.com/photo-1516762689617-e1cffcef479d",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b",
  "https://images.unsplash.com/photo-1467043198406-dc953a3defa0",
];

function hashString(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function buildFashionUrl(key) {
  const index = hashString(key) % FASHION_IMAGE_POOL.length;
  return `${FASHION_IMAGE_POOL[index]}?auto=format&fit=crop&w=900&q=80`;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(
    `
    SELECT id, product_id, sort_order
    FROM product_images
    WHERE url ILIKE '%picsum.photos%'
    ORDER BY product_id ASC, sort_order ASC, id ASC
    `
  );

  if (!rows.length) {
    console.log("No picsum product images found. Nothing to replace.");
    await client.end();
    return;
  }

  await client.query("BEGIN");
  try {
    for (const row of rows) {
      const key = `${row.product_id}-${row.sort_order}`;
      const nextUrl = buildFashionUrl(key);
      await client.query(
        `
        UPDATE product_images
        SET url = $1
        WHERE id = $2
        `,
        [nextUrl, row.id]
      );
    }

    await client.query("COMMIT");
    console.log(`Updated ${rows.length} product image URL(s) to fashion images.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to replace product images:", err?.message || err);
  process.exit(1);
});

