/**
 * Seeds a small stylist-ready catalog.
 *
 * This is intentionally idempotent: running it again updates the same demo
 * products, replaces their images, upserts variants, and refreshes embeddings.
 *
 * Run:
 *   npm run seed-stylist-demo
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { Client } = require("pg");
const { databaseUrl } = require("../src/config/db.config");

if (!databaseUrl) {
  console.error("Missing database configuration. Set DATABASE_URL or DB_HOST/DB_NAME/DB_USER.");
  process.exit(1);
}

const CATEGORIES = [
  { name: "Tops", slug: "tops", sortOrder: 10 },
  { name: "Shirts", slug: "shirts", sortOrder: 11 },
  { name: "T-Shirts", slug: "t-shirts", sortOrder: 12 },
  { name: "Pants", slug: "pants", sortOrder: 20 },
  { name: "Jeans", slug: "jeans", sortOrder: 21 },
  { name: "Skirts", slug: "skirts", sortOrder: 22 },
  { name: "Dresses", slug: "dresses", sortOrder: 30 },
  { name: "Shoes", slug: "shoes", sortOrder: 40 },
  { name: "Blazers", slug: "blazers", sortOrder: 50 },
  { name: "Outerwear", slug: "outerwear", sortOrder: 51 },
];

const CATEGORY_VECTOR = {
  tops: [1, 0.2, 0, 0, 0, 0.1, 0.1, 0],
  shirts: [1, 0.25, 0, 0, 0.1, 0.15, 0, 0],
  "t-shirts": [1, 0.15, 0, 0, 0, 0.25, 0.1, 0],
  pants: [0, 1, 0.2, 0, 0.15, 0, 0, 0],
  jeans: [0, 1, 0.25, 0, 0.05, 0.1, 0, 0],
  skirts: [0.15, 0.8, 0, 0.35, 0, 0, 0.1, 0],
  dresses: [0.55, 0.1, 0, 1, 0.25, 0, 0.2, 0],
  shoes: [0, 0, 1, 0.2, 0.1, 0.1, 0, 0],
  blazers: [0.25, 0, 0, 0, 1, 0.1, 0, 0.15],
  outerwear: [0.1, 0, 0, 0, 1, 0.25, 0, 0.1],
};

const PRODUCTS = [
  {
    title: "Soft Rib Knit Top",
    slug: "stylist-women-soft-rib-knit-top",
    gender: "women",
    categorySlug: "tops",
    description: "A fitted rib knit top with a clean neckline for casual, office, and smart-casual outfits.",
    basePrice: 28,
    discountPrice: null,
    color: "Black",
    tags: {
      style: ["minimal", "smart-casual"],
      occasion: ["casual", "office"],
      season: ["all-season"],
      material: ["cotton", "knit"],
      color_family: ["black"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    title: "Tailored Wide Leg Pants",
    slug: "stylist-women-tailored-wide-leg-pants",
    gender: "women",
    categorySlug: "pants",
    description: "High-rise wide leg pants with a tailored drape for polished daily styling.",
    basePrice: 48,
    discountPrice: null,
    color: "Beige",
    tags: {
      style: ["minimal", "classic"],
      occasion: ["office", "casual"],
      season: ["all-season"],
      material: ["polyester", "rayon"],
      color_family: ["beige"],
      fit: ["relaxed"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506629905607-d9d297d43889?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    title: "Clean Leather Sneakers",
    slug: "stylist-women-clean-leather-sneakers",
    gender: "women",
    categorySlug: "shoes",
    description: "Minimal low-top sneakers that complete casual and smart-casual outfits.",
    basePrice: 58,
    discountPrice: null,
    color: "White",
    tags: {
      style: ["minimal", "modern"],
      occasion: ["casual", "travel"],
      season: ["all-season"],
      material: ["leather"],
      color_family: ["white"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["36", "37", "38", "39", "40"],
  },
  {
    title: "Pastel Midi Dress",
    slug: "stylist-women-pastel-midi-dress",
    gender: "women",
    categorySlug: "dresses",
    description: "A soft midi dress for wedding, evening, and party looks.",
    basePrice: 72,
    discountPrice: 64,
    color: "Pink",
    tags: {
      style: ["classic", "modern"],
      occasion: ["evening", "wedding", "party"],
      season: ["summer", "all-season"],
      material: ["rayon"],
      color_family: ["pastel"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    title: "Relaxed Single Breasted Blazer",
    slug: "stylist-women-relaxed-single-breasted-blazer",
    gender: "women",
    categorySlug: "blazers",
    description: "A relaxed blazer that adds structure to office and evening outfits.",
    basePrice: 88,
    discountPrice: null,
    color: "Navy",
    tags: {
      style: ["smart-casual", "formal"],
      occasion: ["office", "evening"],
      season: ["all-season"],
      material: ["polyester"],
      color_family: ["navy"],
      fit: ["relaxed"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    title: "Pleated Midi Skirt",
    slug: "stylist-women-pleated-midi-skirt",
    gender: "women",
    categorySlug: "skirts",
    description: "A pleated midi skirt that pairs easily with tops, shirts, and blazers.",
    basePrice: 42,
    discountPrice: null,
    color: "Gray",
    tags: {
      style: ["classic", "minimal"],
      occasion: ["office", "casual"],
      season: ["all-season"],
      material: ["polyester"],
      color_family: ["gray"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5886a13d24?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["XS", "S", "M", "L"],
  },
  {
    title: "Oxford Cotton Shirt",
    slug: "stylist-men-oxford-cotton-shirt",
    gender: "men",
    categorySlug: "shirts",
    description: "A crisp Oxford shirt for office, smart-casual, and dinner outfits.",
    basePrice: 42,
    discountPrice: null,
    color: "White",
    tags: {
      style: ["classic", "smart-casual"],
      occasion: ["office", "evening"],
      season: ["all-season"],
      material: ["cotton"],
      color_family: ["white"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1598032895397-b9472444bf93?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    title: "Essential Crew Tee",
    slug: "stylist-men-essential-crew-tee",
    gender: "men",
    categorySlug: "t-shirts",
    description: "A soft crew neck tee for clean everyday outfits.",
    basePrice: 24,
    discountPrice: null,
    color: "Black",
    tags: {
      style: ["minimal", "casual"],
      occasion: ["casual", "travel"],
      season: ["summer", "all-season"],
      material: ["cotton"],
      color_family: ["black"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    title: "Slim Chino Pants",
    slug: "stylist-men-slim-chino-pants",
    gender: "men",
    categorySlug: "pants",
    description: "Slim chinos that work across casual, office, and smart-casual outfits.",
    basePrice: 52,
    discountPrice: null,
    color: "Khaki",
    tags: {
      style: ["classic", "smart-casual"],
      occasion: ["office", "casual"],
      season: ["all-season"],
      material: ["cotton"],
      color_family: ["beige"],
      fit: ["slim"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    title: "Straight Fit Denim Jeans",
    slug: "stylist-men-straight-fit-denim-jeans",
    gender: "men",
    categorySlug: "jeans",
    description: "Straight fit denim jeans for casual and streetwear outfits.",
    basePrice: 58,
    discountPrice: null,
    color: "Blue",
    tags: {
      style: ["classic", "streetwear"],
      occasion: ["casual", "travel"],
      season: ["all-season"],
      material: ["denim"],
      color_family: ["navy"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1511196044526-5cb3bcb7071b?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    title: "Minimal Court Sneakers",
    slug: "stylist-men-minimal-court-sneakers",
    gender: "men",
    categorySlug: "shoes",
    description: "Clean court sneakers that complete casual and smart-casual outfits.",
    basePrice: 64,
    discountPrice: null,
    color: "White",
    tags: {
      style: ["minimal", "modern"],
      occasion: ["casual", "travel"],
      season: ["all-season"],
      material: ["leather"],
      color_family: ["white"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["40", "41", "42", "43", "44"],
  },
  {
    title: "Lightweight Bomber Jacket",
    slug: "stylist-men-lightweight-bomber-jacket",
    gender: "men",
    categorySlug: "outerwear",
    description: "A lightweight bomber jacket for layered travel and evening outfits.",
    basePrice: 82,
    discountPrice: null,
    color: "Olive",
    tags: {
      style: ["modern", "streetwear"],
      occasion: ["casual", "travel", "evening"],
      season: ["all-season"],
      material: ["polyester"],
      color_family: ["green"],
      fit: ["regular"],
      pattern: ["solid"],
    },
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80",
    ],
    sizes: ["S", "M", "L", "XL"],
  },
];

function skuPrefix(product) {
  return product.slug
    .replace(/^stylist-/, "sty-")
    .split("-")
    .map((part) => part.slice(0, 3).toUpperCase())
    .join("-");
}

function vectorFor(product) {
  const vector = CATEGORY_VECTOR[product.categorySlug] || [1, 0, 0, 0, 0, 0, 0, 0];
  const styleBoost = product.tags.style?.includes("minimal") ? 0.08 : 0;
  const occasionBoost = product.tags.occasion?.includes("office") ? 0.06 : 0;
  return vector.map((value, index) => Number((value + (index === 5 ? styleBoost : 0) + (index === 7 ? occasionBoost : 0)).toFixed(4)));
}

async function upsertCategories(client) {
  const categoryMap = new Map();

  for (const category of CATEGORIES) {
    const res = await client.query(
      `
      INSERT INTO categories (name, slug, gender, sort_order, is_active)
      VALUES ($1, $2, 'unisex', $3, true)
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        is_active = true,
        sort_order = EXCLUDED.sort_order
      RETURNING id, slug
      `,
      [category.name, category.slug, category.sortOrder]
    );

    categoryMap.set(res.rows[0].slug, res.rows[0].id);
  }

  return categoryMap;
}

async function upsertProduct(client, product, categoryId) {
  const res = await client.query(
    `
    INSERT INTO products (
      title, slug, gender, category_id, description, base_price, discount_price, is_active, tags
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8::jsonb)
    ON CONFLICT (slug)
    DO UPDATE SET
      title = EXCLUDED.title,
      gender = EXCLUDED.gender,
      category_id = EXCLUDED.category_id,
      description = EXCLUDED.description,
      base_price = EXCLUDED.base_price,
      discount_price = EXCLUDED.discount_price,
      is_active = true,
      tags = EXCLUDED.tags,
      updated_at = now()
    RETURNING id
    `,
    [
      product.title,
      product.slug,
      product.gender,
      categoryId,
      product.description,
      product.basePrice,
      product.discountPrice,
      JSON.stringify(product.tags),
    ]
  );

  return res.rows[0].id;
}

async function replaceImages(client, productId, product) {
  await client.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);

  for (const [index, url] of product.images.entries()) {
    await client.query(
      `
      INSERT INTO product_images (product_id, url, alt_text, sort_order)
      VALUES ($1, $2, $3, $4)
      `,
      [productId, url, `${product.title} product image`, index]
    );
  }
}

async function upsertVariants(client, productId, product) {
  const prefix = skuPrefix(product);

  for (const size of product.sizes) {
    const sku = `${prefix}-${size.replace(/\s+/g, "").toUpperCase()}`;
    await client.query(
      `
      INSERT INTO product_variants (product_id, size, color, sku, stock)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sku)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        size = EXCLUDED.size,
        color = EXCLUDED.color,
        stock = EXCLUDED.stock
      `,
      [productId, size, product.color, sku, 24]
    );
  }
}

async function upsertEmbedding(client, productId, product) {
  await client.query(
    `
    INSERT INTO product_embeddings (product_id, vector, updated_at)
    VALUES ($1, $2::real[], now())
    ON CONFLICT (product_id)
    DO UPDATE SET
      vector = EXCLUDED.vector,
      updated_at = now()
    `,
    [productId, vectorFor(product)]
  );
}

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query("BEGIN");

    const categoryMap = await upsertCategories(client);
    let productCount = 0;
    let variantCount = 0;

    for (const product of PRODUCTS) {
      const categoryId = categoryMap.get(product.categorySlug);
      if (!categoryId) throw new Error(`Missing category: ${product.categorySlug}`);

      const productId = await upsertProduct(client, product, categoryId);
      await replaceImages(client, productId, product);
      await upsertVariants(client, productId, product);
      await upsertEmbedding(client, productId, product);

      productCount += 1;
      variantCount += product.sizes.length;
    }

    await client.query("COMMIT");

    console.log(`Stylist demo catalog ready: ${productCount} products, ${variantCount} variants, ${productCount} embeddings.`);
    console.log("Try prompts like: office outfit, casual travel look, wedding dress, minimal men outfit.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Failed to seed stylist demo products:", err);
  process.exit(1);
});
