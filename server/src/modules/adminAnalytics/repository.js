const db = require("../../db");

const fetchSummary = async (days) => {
  const res = await db.query(
    `
    SELECT
      SUM(CASE WHEN type='view_product' THEN 1 ELSE 0 END)::int AS views,
      SUM(CASE WHEN type='add_to_cart' THEN 1 ELSE 0 END)::int AS add_to_cart,
      SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
      SUM(CASE WHEN type='search' THEN 1 ELSE 0 END)::int AS searches,
      (
        SELECT COALESCE(SUM(o.total), 0)::numeric(12,2)
        FROM orders o
        WHERE o.created_at >= now() - ($1 || ' days')::interval
          AND LOWER(o.status) <> 'cancelled'
      ) AS revenue,
      (
        SELECT COUNT(*)::int
        FROM product_variants pv
        JOIN products p ON p.id = pv.product_id
        WHERE p.is_active = true
          AND pv.stock <= 5
      ) AS low_stock
    FROM events
    WHERE created_at >= now() - ($1 || ' days')::interval
    `,
    [days]
  );
  return res.rows[0] || null;
};

const fetchDaily = async (days) => {
  const res = await db.query(
    `
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
      SUM(CASE WHEN type='view_product' THEN 1 ELSE 0 END)::int AS views,
      SUM(CASE WHEN type='add_to_cart' THEN 1 ELSE 0 END)::int AS add_to_cart,
      SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
      SUM(CASE WHEN type='search' THEN 1 ELSE 0 END)::int AS searches
    FROM events
    WHERE created_at >= now() - ($1 || ' days')::interval
    GROUP BY 1
    ORDER BY 1 ASC
    `,
    [days]
  );
  return res.rows;
};

const fetchOrderStatusTotals = async (days) => {
  const res = await db.query(
    `
    SELECT status, COUNT(*)::int AS count
    FROM orders
    WHERE created_at >= now() - ($1 || ' days')::interval
    GROUP BY status
    `,
    [days]
  );
  return res.rows;
};

const fetchOrderStatusDaily = async (days) => {
  const res = await db.query(
    `
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
      LOWER(status) AS status,
      COUNT(*)::int AS count
    FROM orders
    WHERE created_at >= now() - ($1 || ' days')::interval
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC
    `,
    [days]
  );
  return res.rows;
};

const fetchTopProductScores = async ({ days, limit }) => {
  const res = await db.query(
    `
    SELECT
      e.product_id,
      SUM(
        CASE
          WHEN e.type='purchase' THEN 5
          WHEN e.type='add_to_cart' THEN 3
          WHEN e.type='view_product' THEN 1
          ELSE 0
        END
      )::int AS score
    FROM events e
    WHERE e.product_id IS NOT NULL
      AND e.created_at >= now() - ($1 || ' days')::interval
      AND e.type IN ('view_product','add_to_cart','purchase')
    GROUP BY e.product_id
    ORDER BY score DESC
    LIMIT $2
    `,
    [days, limit]
  );
  return res.rows;
};

const fetchProductsByIds = async (ids) => {
  const res = await db.query(
    `
    SELECT
      p.id, p.title, p.gender,
      c.slug AS category_slug,
      (
        SELECT url FROM product_images pi
        WHERE pi.product_id = p.id
        ORDER BY pi.sort_order ASC
        LIMIT 1
      ) AS hero_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ANY($1::uuid[])
    `,
    [ids]
  );
  return res.rows;
};

const fetchTopSearches = async ({ days, limit }) => {
  const res = await db.query(
    `
    SELECT
      LOWER(TRIM(query)) AS q,
      COUNT(*)::int AS count
    FROM events
    WHERE type='search'
      AND query IS NOT NULL
      AND created_at >= now() - ($1 || ' days')::interval
    GROUP BY 1
    ORDER BY count DESC
    LIMIT $2
    `,
    [days, limit]
  );
  return res.rows;
};

module.exports = {
  fetchSummary,
  fetchDaily,
  fetchOrderStatusTotals,
  fetchOrderStatusDaily,
  fetchTopProductScores,
  fetchProductsByIds,
  fetchTopSearches,
};
