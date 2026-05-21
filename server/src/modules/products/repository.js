const db = require("../../db");

const countForList = async ({ where, params }) => {
  const res = await db.query(
    `
    SELECT COUNT(*)::int AS total
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
    `,
    params
  );
  return Number(res.rows[0]?.total || 0);
};

const listForCatalog = async ({ where, orderBy, params, limit, offset }) => {
  const withPage = [...params, limit, offset];
  const limitPos = withPage.length - 1;
  const offsetPos = withPage.length;
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price,
      p.tags, p.created_at,
      c.slug AS category_slug,
      c.name AS category_name,
      (
        SELECT url
        FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
    ORDER BY ${orderBy}
    LIMIT $${limitPos} OFFSET $${offsetPos}
    `,
    withPage
  );
  return res.rows;
};

const findProductDetail = async (id) => {
  const res = await db.query(
    `
    SELECT
      p.*,
      c.name AS category_name,
      c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1 AND p.is_active = true
    `,
    [id]
  );
  return res.rows[0] || null;
};

const findProductImages = async (productId) => {
  const res = await db.query(
    `
    SELECT id, url, alt_text, sort_order
    FROM product_images
    WHERE product_id = $1
    ORDER BY sort_order ASC
    `,
    [productId]
  );
  return res.rows;
};

const findProductVariants = async (productId) => {
  const res = await db.query(
    `
    SELECT id, size, color, sku, stock
    FROM product_variants
    WHERE product_id = $1
    ORDER BY color ASC, size ASC
    `,
    [productId]
  );
  return res.rows;
};

const findEmbeddingVector = async (productId) => {
  const res = await db.query(`SELECT vector FROM product_embeddings WHERE product_id = $1`, [productId]);
  return res.rows[0] || null;
};

const listEmbeddingCandidates = async (productId) => {
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.slug, p.gender, p.base_price, p.discount_price, p.tags, p.created_at,
      c.slug AS category_slug,
      pe.vector AS vector,
      (
        SELECT url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    JOIN product_embeddings pe ON pe.product_id = p.id
    WHERE p.is_active = true AND p.id <> $1
    `,
    [productId]
  );
  return res.rows;
};

const listCatalogMeta = async () => {
  const res = await db.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.sort_order,
      COUNT(p.id) FILTER (WHERE p.is_active = true AND p.gender = 'women')::int AS women_count,
      COUNT(p.id) FILTER (WHERE p.is_active = true AND p.gender = 'men')::int AS men_count,
      COUNT(p.id) FILTER (WHERE p.is_active = true AND p.gender = 'unisex')::int AS unisex_count,
      COUNT(p.id) FILTER (WHERE p.is_active = true)::int AS total_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    WHERE c.is_active = true
    GROUP BY c.id, c.name, c.slug, c.sort_order
    ORDER BY c.sort_order ASC, c.name ASC
    `
  );
  return res.rows;
};

module.exports = {
  countForList,
  listForCatalog,
  findProductDetail,
  findProductImages,
  findProductVariants,
  findEmbeddingVector,
  listEmbeddingCandidates,
  listCatalogMeta,
};
