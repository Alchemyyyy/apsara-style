const db = require("../db");
const { embedQueryPython } = require("./embedQuery.service");

function tagsToText(tags) {
  if (!tags) return "";
  const parts = [];
  for (const [k, v] of Object.entries(tags)) {
    if (Array.isArray(v) && v.length) parts.push(`${k}: ${v.join(", ")}`);
    else if (typeof v === "string" && v) parts.push(`${k}: ${v}`);
  }
  return parts.join(" | ");
}

function buildProductText({ title, description, gender, category_name: category, tags }) {
  return `${title || ""}. Category: ${category || ""}. Gender: ${gender || ""}. ${description || ""} Tags: ${tagsToText(tags)}`.trim();
}

async function generateProductEmbedding(product) {
  const vector = await embedQueryPython(buildProductText(product));
  await db.query(
    `INSERT INTO product_embeddings (product_id, vector)
     VALUES ($1, $2)
     ON CONFLICT (product_id) DO UPDATE SET vector = EXCLUDED.vector, updated_at = now();`,
    [product.id, vector]
  );
}

module.exports = { tagsToText, buildProductText, generateProductEmbedding };
