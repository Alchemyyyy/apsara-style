// One-time/backfill: generate product_embeddings rows for every active product.
// Usage: run from server/ with a .env present (DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD),
// or override inline: DATABASE_URL="postgres://..." node scripts/embed_products.js
require("dotenv").config();
const { Pool } = require("pg");
const { databaseUrl } = require("../src/config/db.config");
const { embedQueryPython } = require("../src/services/embedQuery.service");
const { buildProductText } = require("../src/services/productEmbedding.service");

const DATABASE_URL = databaseUrl;
if (!DATABASE_URL) {
  throw new Error(
    "Missing DB config. Set DATABASE_URL or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in server/.env."
  );
}

const CONCURRENCY = 8;

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log("Connecting to PostgreSQL...");
  const { rows } = await pool.query(`
    SELECT p.id, p.title, p.description, p.gender, p.tags, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
    ORDER BY p.created_at ASC;
  `);

  if (!rows.length) {
    await pool.end();
    throw new Error("No active products found.");
  }

  console.log(`Generating embeddings for ${rows.length} products...`);
  let done = 0;
  const vectors = await mapWithConcurrency(rows, CONCURRENCY, async (row) => {
    const vec = await embedQueryPython(buildProductText(row));
    done += 1;
    if (done % 25 === 0 || done === rows.length) console.log(`  ${done}/${rows.length}`);
    return vec;
  });

  console.log("Upserting into product_embeddings...");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < rows.length; i++) {
      await client.query(
        `INSERT INTO product_embeddings (product_id, vector)
         VALUES ($1, $2)
         ON CONFLICT (product_id) DO UPDATE SET vector = EXCLUDED.vector, updated_at = now();`,
        [rows[i].id, vectors[i]]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  console.log("Done. Embeddings stored for", rows.length, "products.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
