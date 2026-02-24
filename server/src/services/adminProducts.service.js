const db = require("../db");

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

exports.list = async (q) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 20), 100);
  const offset = (page - 1) * limit;

  const params = [];
  const filters = ["p.is_active = true"];
  let i = 1;

  if (q.q) {
    params.push(`%${q.q}%`);
    filters.push(`p.title ILIKE $${i++}`);
  }

  const where = `WHERE ${filters.join(" AND ")}`;

  const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM products p ${where}`, params);
  const total = countRes.rows[0]?.total ?? 0;

  params.push(limit, offset);
  const itemsRes = await db.query(
    `
    SELECT
      p.id, p.title, p.gender, p.base_price, p.discount_price, p.created_at,
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
    LIMIT $${i++} OFFSET $${i++}
    `,
    params
  );

  return {
    items: itemsRes.rows,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.create = async (body) => {
  const {
    title,
    slug,
    gender,
    category_id,
    description,
    base_price,
    discount_price,
    tags,
  } = body;

  if (!title || !slug || !gender || !base_price) throw new Error("title, slug, gender, base_price required");

  const res = await db.query(
    `
    INSERT INTO products (title, slug, gender, category_id, description, base_price, discount_price, tags)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [title, slug, gender, category_id || null, description || null, base_price, discount_price || null, tags || {}]
  );

  return res.rows[0];
};

exports.update = async (id, body) => {
  const allowed = ["title","slug","gender","category_id","description","base_price","discount_price","tags","is_active"];
  const sets = [];
  const params = [];
  let i = 1;

  for (const k of allowed) {
    if (body[k] !== undefined) {
      sets.push(`${k} = $${i++}`);
      params.push(body[k]);
    }
  }

  if (!sets.length) throw new Error("No fields to update");

  params.push(id);
  const res = await db.query(
    `
    UPDATE products
    SET ${sets.join(", ")}, updated_at = now()
    WHERE id = $${i++}
    RETURNING *
    `,
    params
  );

  return res.rows[0];
};

exports.remove = async (id) => {
  await db.query(`UPDATE products SET is_active = false, updated_at = now() WHERE id = $1`, [id]);
};

exports.updateStock = async (variantId, stock) => {
  const res = await db.query(
    `UPDATE product_variants SET stock = $1 WHERE id = $2 RETURNING *`,
    [stock, variantId]
  );
  return res.rows[0];
};
