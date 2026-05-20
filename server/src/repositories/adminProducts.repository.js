const db = require("../db");

function withRunner(client) {
  return client || db;
}

const countProducts = async (where, params) => {
  const res = await db.query(`SELECT COUNT(*)::int AS total FROM products p ${where}`, params);
  return Number(res.rows[0]?.total || 0);
};

const listProducts = async ({ where, params, limit, offset }) => {
  const withPage = [...params, limit, offset];
  const limitPos = withPage.length - 1;
  const offsetPos = withPage.length;
  const res = await db.query(
    `
    SELECT
      p.id, p.product_code, p.title, p.slug, p.gender, p.description,
      p.base_price, p.discount_price, p.is_active, p.category_id, p.tags, p.created_at,
      c.name AS category_name,
      c.slug AS category_slug,
      (
        SELECT url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image,
      (
        SELECT COALESCE(SUM(stock),0)::int
        FROM product_variants pv
        WHERE pv.product_id = p.id
      ) AS total_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
    ORDER BY p.created_at DESC
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    withPage
  );
  return res.rows;
};

const createProduct = async ({ title, slug, gender, categoryId, description, basePrice, discountPrice, tags }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    INSERT INTO products (title, slug, gender, category_id, description, base_price, discount_price, tags)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [title, slug, gender, categoryId, description, basePrice, discountPrice, tags]
  );
  return res.rows[0] || null;
};

const updateProduct = async ({ id, setsSql, params }, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    UPDATE products
    SET ${setsSql}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *
    `,
    params
  );
  return res.rows[0] || null;
};

const findProductById = async (id, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT
      p.id, p.product_code, p.title, p.slug, p.gender, p.description,
      p.base_price, p.discount_price, p.is_active, p.category_id, p.tags, p.created_at, p.updated_at,
      c.name AS category_name,
      c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [id]
  );
  return res.rows[0] || null;
};

const listProductImages = async (productId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, url, alt_text, sort_order
    FROM product_images
    WHERE product_id = $1
    ORDER BY sort_order ASC, id ASC
    `,
    [productId]
  );
  return res.rows;
};

const listProductVariants = async (productId, client) => {
  const runner = withRunner(client);
  const res = await runner.query(
    `
    SELECT id, size, color, sku, stock
    FROM product_variants
    WHERE product_id = $1
    ORDER BY color ASC, size ASC, id ASC
    `,
    [productId]
  );
  return res.rows;
};

const replaceProductImages = async ({ productId, images }, client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM product_images WHERE product_id = $1`, [productId]);
  if (!Array.isArray(images) || !images.length) return;

  for (const image of images) {
    await runner.query(
      `
      INSERT INTO product_images (product_id, url, alt_text, sort_order)
      VALUES ($1, $2, $3, $4)
      `,
      [productId, image.url, image.alt_text || null, image.sort_order || 0]
    );
  }
};

const replaceProductVariants = async ({ productId, variants }, client) => {
  const runner = withRunner(client);
  await runner.query(`DELETE FROM product_variants WHERE product_id = $1`, [productId]);
  if (!Array.isArray(variants) || !variants.length) return;

  for (const variant of variants) {
    await runner.query(
      `
      INSERT INTO product_variants (product_id, size, color, sku, stock)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [productId, variant.size, variant.color, variant.sku || null, variant.stock]
    );
  }
};

const deactivateProduct = async (id) => {
  await db.query(`UPDATE products SET is_active = false, updated_at = now() WHERE id = $1`, [id]);
};

const updateVariantStock = async ({ variantId, stock }) => {
  const res = await db.query(`UPDATE product_variants SET stock = $1 WHERE id = $2 RETURNING *`, [stock, variantId]);
  return res.rows[0] || null;
};

const findCategoryById = async (id) => {
  const res = await db.query(`SELECT id, name, slug, is_active, sort_order FROM categories WHERE id = $1`, [id]);
  return res.rows[0] || null;
};

const listCategories = async () => {
  const res = await db.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.is_active,
      c.sort_order,
      COUNT(p.id)::int AS product_count,
      COUNT(p.id) FILTER (WHERE p.is_active = true)::int AS active_product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug, c.is_active, c.sort_order
    ORDER BY c.sort_order ASC, c.name ASC
    `
  );
  return res.rows;
};

const createCategory = async ({ name, slug, sortOrder, isActive }) => {
  const res = await db.query(
    `
    INSERT INTO categories (name, slug, gender, sort_order, is_active)
    VALUES ($1, $2, 'unisex', $3, $4)
    RETURNING id, name, slug, is_active, sort_order
    `,
    [name, slug, sortOrder, isActive]
  );
  return res.rows[0] || null;
};

const updateCategory = async (id, payload) => {
  const allowed = ["name", "slug", "sort_order", "is_active"];
  const sets = [];
  const params = [];
  let i = 1;

  for (const key of allowed) {
    if (payload[key] !== undefined) {
      sets.push(`${key} = $${i++}`);
      params.push(payload[key]);
    }
  }

  params.push(id);
  const res = await db.query(
    `
    UPDATE categories
    SET ${sets.join(", ")}
    WHERE id = $${params.length}
    RETURNING id, name, slug, is_active, sort_order
    `,
    params
  );
  return res.rows[0] || null;
};

const deactivateCategory = async (id) => {
  await db.query(`UPDATE categories SET is_active = false WHERE id = $1`, [id]);
};

module.exports = {
  countProducts,
  listProducts,
  createProduct,
  updateProduct,
  findProductById,
  listProductImages,
  listProductVariants,
  replaceProductImages,
  replaceProductVariants,
  deactivateProduct,
  updateVariantStock,
  findCategoryById,
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
