/**
 * APSARA STYLE - Seed Catalog (300 products)
 * Seeds: categories, products, product_images, product_variants
 *
 * Requirements:
 * - PostgreSQL tables already exist.
 * - env DATABASE_URL is set.
 *
 * Run:
 *   node scripts/seed_catalog.js
 */

require("dotenv").config();

const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL env var.");
  process.exit(1);
}

const TOTAL_PRODUCTS = 300;

// Category distribution
const CATEGORY_PLAN = {
  women: [
    ["Dresses", 30],
    ["Tops", 28],
    ["Pants", 22],
    ["Blazers", 15],
    ["Skirts", 14],
    ["Outerwear", 14],
    ["Activewear", 16],
    ["Shoes", 18],
    ["Accessories", 8],
  ],
  men: [
    ["Shirts", 24],
    ["T-Shirts", 20],
    ["Pants", 18],
    ["Jeans", 16],
    ["Blazers", 12],
    ["Outerwear", 12],
    ["Activewear", 14],
    ["Shoes", 12],
    ["Accessories", 7],
  ],
};

// Controlled vocabulary
const TAGS = {
  style: ["minimal", "smart-casual", "formal", "streetwear", "classic", "sporty", "modern"],
  occasion: ["office", "casual", "evening", "wedding", "party", "travel", "gym"],
  season: ["summer", "rainy", "winter", "all-season"],
  material: ["cotton", "linen", "denim", "wool", "leather", "polyester", "rayon"],
  color_family: ["black", "white", "beige", "brown", "navy", "gray", "green", "pastel"],
  fit: ["slim", "regular", "relaxed", "oversized"],
  pattern: ["solid", "striped", "checkered", "floral"],
  features: ["breathable", "wrinkle-resistant", "stretch", "soft-touch"],
};

// Naming pools
const ADJECTIVES = ["Minimal", "Relaxed", "Tailored", "Essential", "Classic", "Modern", "Fluid", "Structured", "Soft", "Refined"];
const MATERIAL_WORD = ["Cotton", "Linen", "Denim", "Wool", "Knit", "Leather"];

const ITEM_BY_CATEGORY = {
  "Dresses": ["Midi Dress", "Wrap Dress", "Slip Dress", "Shirt Dress"],
  "Tops": ["Blouse", "Top", "Rib Tank", "Long Sleeve Top"],
  "Pants": ["Tailored Pants", "Wide-Leg Pants", "Straight Pants", "Cropped Pants"],
  "Blazers": ["Single-Breasted Blazer", "Relaxed Blazer", "Structured Blazer"],
  "Skirts": ["Midi Skirt", "A-Line Skirt", "Pleated Skirt"],
  "Outerwear": ["Coat", "Jacket", "Trench Coat", "Bomber Jacket"],
  "Activewear": ["Performance Tee", "Training Shorts", "Leggings", "Track Jacket"],
  "Shoes": ["Sneakers", "Loafers", "Sandals", "Chelsea Boots"],
  "Accessories": ["Cap", "Belt", "Wallet", "Sling Bag", "Tote Bag"],
  "Shirts": ["Oxford Shirt", "Relaxed Shirt", "Poplin Shirt"],
  "T-Shirts": ["Essential Tee", "Oversized Tee", "Pocket Tee"],
  "Jeans": ["Straight Jeans", "Relaxed Jeans", "Slim Jeans"],
};

// Price ranges (USD)
const PRICE_RULES = {
  "Tops": [18, 35],
  "T-Shirts": [18, 35],
  "Shirts": [28, 55],
  "Blouse": [28, 55],
  "Pants": [35, 65],
  "Skirts": [35, 65],
  "Dresses": [45, 85],
  "Blazers": [60, 120],
  "Outerwear": [80, 150],
  "Shoes": [45, 110],
  "Accessories": [12, 35],
  "Activewear": [22, 50],
  "Jeans": [40, 80],
};

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickMany(arr, minCount, maxCount) {
  const count = randInt(minCount, maxCount);
  const copy = [...arr];
  const out = [];
  while (out.length < count && copy.length) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function normalizeGender(g) {
  return g === "women" ? "women" : "men";
}

function getPriceForCategory(categoryName) {
  const rule = PRICE_RULES[categoryName] || [25, 75];
  const [min, max] = rule;
  const base = randInt(min, max);
  const hasDiscount = Math.random() < 0.25; // 25% discounted
  const discount = hasDiscount ? Math.max(min, Math.round(base * (randInt(70, 90) / 100))) : null;
  return { base_price: base, discount_price: discount && discount < base ? discount : null };
}

function buildTags(categoryName) {
  // Make tags logical by category
  const isActive = categoryName === "Activewear";
  const isFormal = categoryName === "Blazers";
  const isSummerFriendly = ["Dresses", "Tops", "Shirts"].includes(categoryName);

  const style = isActive ? ["sporty"] : isFormal ? pickMany(["minimal", "smart-casual", "formal", "classic", "modern"], 1, 2) : pickMany(TAGS.style, 1, 2);
  const occasion = isActive ? ["gym"] : isFormal ? pickMany(["office", "evening", "wedding"], 1, 2) : pickMany(TAGS.occasion, 1, 2);
  const season = isSummerFriendly && Math.random() < 0.4 ? ["summer"] : pickMany(TAGS.season, 1, 1);
  const material = isActive ? pickMany(["polyester", "cotton", "rayon"], 1, 2) : pickMany(TAGS.material, 1, 2);
  const color_family = pickMany(TAGS.color_family, 1, 2);
  const fit = pickMany(TAGS.fit, 1, 1);
  const pattern = Math.random() < 0.2 ? pickMany(TAGS.pattern, 1, 1) : ["solid"];
  const features = isActive ? pickMany(["breathable", "stretch", "soft-touch"], 1, 2) : pickMany(TAGS.features, 0, 2);

  const tags = { style, occasion, season, material, color_family, fit, pattern };
  if (features.length) tags.features = features;
  return tags;
}

function buildDescription(title, tags) {
  const style = tags.style?.[0] || "modern";
  const material = tags.material?.[0] || "premium fabric";
  const fit = tags.fit?.[0] || "regular";
  return `A ${style} piece crafted in ${material} with a ${fit} fit. Designed for effortless styling and everyday elegance — perfect for building a refined wardrobe.`;
}

function sizeSetForGender(gender) {
  return gender === "women" ? ["XS", "S", "M", "L"] : ["S", "M", "L", "XL"];
}

function colorSet() {
  // Keep clean fashion palette
  const pool = ["Black", "White", "Beige", "Navy", "Gray", "Green"];
  return pickMany(pool, 2, 3);
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
  "https://images.unsplash.com/photo-1475180098004-ca77a66827be",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b",
  "https://images.unsplash.com/photo-1467043198406-dc953a3defa0",
];

function hashString(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function imageUrlsForSlug(slug, count) {
  const urls = [];
  const base = hashString(String(slug || ""));
  for (let i = 0; i < count; i += 1) {
    const idx = (base + i) % FASHION_IMAGE_POOL.length;
    urls.push(`${FASHION_IMAGE_POOL[idx]}?auto=format&fit=crop&w=900&q=80`);
  }
  return urls;
}

async function upsertCategories(client) {
  // Create categories if not exist; return map slug -> id
  const categoriesToEnsure = [];

  for (const [name] of CATEGORY_PLAN.women) {
    categoriesToEnsure.push({ name, slug: slugify(name), gender: "unisex" });
  }
  for (const [name] of CATEGORY_PLAN.men) {
    categoriesToEnsure.push({ name, slug: slugify(name), gender: "unisex" });
  }

  // Insert missing categories
  for (const c of categoriesToEnsure) {
    await client.query(
      `
      INSERT INTO categories (name, slug, gender)
      VALUES ($1, $2, $3)
      ON CONFLICT (slug) DO NOTHING
      `,
      [c.name, c.slug, c.gender]
    );
  }

  const { rows } = await client.query(`SELECT id, slug FROM categories`);
  const map = new Map(rows.map((r) => [r.slug, r.id]));
  return map;
}

async function insertProduct(client, product) {
  const res = await client.query(
    `
    INSERT INTO products (
      title, slug, gender, category_id, description, base_price, discount_price, is_active, tags
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8)
    RETURNING id
    `,
    [
      product.title,
      product.slug,
      product.gender,
      product.category_id,
      product.description,
      product.base_price,
      product.discount_price,
      product.tags,
    ]
  );
  return res.rows[0].id;
}

async function insertImages(client, productId, urls) {
  let order = 0;
  for (const url of urls) {
    await client.query(
      `
      INSERT INTO product_images (product_id, url, alt_text, sort_order)
      VALUES ($1,$2,$3,$4)
      `,
      [productId, url, "APSARA STYLE product image", order++]
    );
  }
}

async function insertVariants(client, productId, gender) {
  const sizes = sizeSetForGender(gender);
  const colors = colorSet();

  // A typical fashion product has 2–3 colors and 4 sizes => 8–12 variants
  for (const size of sizes) {
    for (const color of colors) {
      const stock = randInt(0, 30);
      await client.query(
        `
        INSERT INTO product_variants (product_id, size, color, sku, stock)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [productId, size, color, `APS-${productId.toString().slice(0, 8)}-${size}-${color.toUpperCase()}`, stock]
      );
    }
  }
}

function buildProductTitle(categoryName) {
  const itemPool = ITEM_BY_CATEGORY[categoryName] || ["Essential Piece"];
  const adjective = pick(ADJECTIVES);
  const material = pick(MATERIAL_WORD);
  const item = pick(itemPool);
  // Keep it fashion-like and readable
  return `${adjective} ${material} ${item}`;
}

function ensureUniqueSlug(slug, used) {
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let i = 2;
  while (used.has(`${slug}-${i}`)) i++;
  const finalSlug = `${slug}-${i}`;
  used.add(finalSlug);
  return finalSlug;
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log("✅ Connected to DB");

  const categoryMap = await upsertCategories(client);
  console.log(`✅ Categories ready: ${categoryMap.size}`);

  const usedSlugs = new Set();

  let created = 0;
  const start = Date.now();

  // Build product plans list from distribution
  const productPlans = [];

  for (const gender of ["women", "men"]) {
    for (const [catName, count] of CATEGORY_PLAN[gender]) {
      const slug = slugify(catName);
      const category_id = categoryMap.get(slug);
      if (!category_id) throw new Error(`Missing category id for slug: ${slug}`);

      for (let i = 0; i < count; i++) {
        productPlans.push({ gender, catName, category_id });
      }
    }
  }

  if (productPlans.length !== TOTAL_PRODUCTS) {
    console.warn(`⚠️ Plan count (${productPlans.length}) != ${TOTAL_PRODUCTS}. Using plan count.`);
  }

  // Insert products
  for (const plan of productPlans) {
    const gender = normalizeGender(plan.gender);
    const title = buildProductTitle(plan.catName);
    const baseSlug = `${slugify(title)}-${gender}`;
    const slug = ensureUniqueSlug(baseSlug, usedSlugs);

    const tags = buildTags(plan.catName);
    const description = buildDescription(title, tags);
    const { base_price, discount_price } = getPriceForCategory(plan.catName);

    const productId = await insertProduct(client, {
      title,
      slug,
      gender,
      category_id: plan.category_id,
      description,
      base_price,
      discount_price,
      tags,
    });

    const imgCount = randInt(4, 5);
    const urls = imageUrlsForSlug(slug, imgCount);
    await insertImages(client, productId, urls);
    await insertVariants(client, productId, gender);

    created++;
    if (created % 25 === 0) {
      console.log(`… seeded ${created}/${productPlans.length}`);
    }
  }

  const ms = Date.now() - start;
  console.log(`🎉 Done. Seeded ${created} products in ${(ms / 1000).toFixed(1)}s`);

  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
