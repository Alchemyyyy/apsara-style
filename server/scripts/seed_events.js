/**
 * APSARA STYLE - Seed Events (10,000+)
 * Seeds: events
 *
 * Requirements:
 * - products exist
 * - env DATABASE_URL is set
 *
 * Run:
 *   node scripts/seed_events.js
 */

require("dotenv").config();

const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL env var.");
  process.exit(1);
}

const TOTAL_EVENTS = 10000;

// Distribution
const EVENT_TYPES = [
  { type: "view_product", weight: 70 },
  { type: "add_to_cart", weight: 20 },
  { type: "purchase", weight: 10 },
];

const SEARCH_QUERIES = [
  "office outfit",
  "minimal black",
  "summer linen",
  "smart casual",
  "streetwear oversized",
  "classic blazer",
  "white sneakers",
  "evening dress",
  "travel essentials",
  "cotton shirt",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedPick(items) {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.type;
  }
  return items[items.length - 1].type;
}

function randomSessionId() {
  // stable-ish guest sessions
  return `seed-session-${randInt(1, 400).toString().padStart(4, "0")}`;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("✅ Connected to DB");

  const productsRes = await client.query(`SELECT id FROM products WHERE is_active = true`);
  const productIds = productsRes.rows.map((r) => r.id);

  if (!productIds.length) {
    throw new Error("No products found. Run seed_catalog.js first.");
  }

  // If users exist, some events will be tied to real users; otherwise guest sessions only.
  const usersRes = await client.query(`SELECT id FROM users LIMIT 200`);
  const userIds = usersRes.rows.map((r) => r.id);

  console.log(`✅ Products: ${productIds.length}, Users: ${userIds.length}`);

  // Batch insert for speed
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < TOTAL_EVENTS; i += BATCH_SIZE) {
    const chunkSize = Math.min(BATCH_SIZE, TOTAL_EVENTS - i);
    const values = [];
    const params = [];
    let p = 1;

    for (let j = 0; j < chunkSize; j++) {
      const type = weightedPick(EVENT_TYPES);

      const useUser = userIds.length > 0 && Math.random() < 0.35; // 35% tied to users
      const userId = useUser ? userIds[randInt(0, userIds.length - 1)] : null;
      const sessionId = useUser ? null : randomSessionId();

      const productId =
        type === "search" ? null : productIds[randInt(0, productIds.length - 1)];

      // Add some search events too (help evaluation + trending)
      const isSearch = Math.random() < 0.12; // 12% searches
      const finalType = isSearch ? "search" : type;

      const query = finalType === "search" ? SEARCH_QUERIES[randInt(0, SEARCH_QUERIES.length - 1)] : null;

      const meta =
        finalType === "search"
          ? { source: "seed", ui: "searchbar" }
          : { source: "seed", ui: Math.random() < 0.5 ? "grid" : "detail" };

      values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(userId, sessionId, finalType, productId, query, JSON.stringify(meta));
    }

    await client.query(
      `
      INSERT INTO events (user_id, session_id, type, product_id, query, meta)
      VALUES ${values.join(",")}
      `,
      params
    );

    inserted += chunkSize;
    console.log(`… inserted ${inserted}/${TOTAL_EVENTS} events`);
  }

  console.log(`🎉 Done. Seeded ${inserted} events.`);
  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
