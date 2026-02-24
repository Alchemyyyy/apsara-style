const db = require("../db");

function clampDays(days) {
  const d = Number(days);
  if (!Number.isFinite(d)) return 7;
  return Math.max(1, Math.min(Math.floor(d), 90));
}

function clampLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n)) return 10;
  return Math.max(1, Math.min(Math.floor(n), 50));
}

// exports.overview = async ({ days }) => {
//   const d = clampDays(days);

//   // Summary counts
//   const summaryRes = await db.query(
//     `
//     SELECT
//       SUM(CASE WHEN type='view_product' THEN 1 ELSE 0 END)::int AS views,
//       SUM(CASE WHEN type='add_to_cart' THEN 1 ELSE 0 END)::int AS add_to_cart,
//       SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
//       SUM(CASE WHEN type='search' THEN 1 ELSE 0 END)::int AS searches
//     FROM events
//     WHERE created_at >= now() - ($1 || ' days')::interval
//     `,
//     [d]
//   );

//   // Daily chart (views/add_to_cart/purchase/search)
//   const dailyRes = await db.query(
//     `
//     SELECT
//       to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
//       SUMSUM(CASE WHEN type='view_product' THEN 1 ELSE 0 END)::int AS views,
//       SUM(CASE WHEN type='add_to_cart' THEN 1 ELSE 0 END)::int AS add_to_cart,
//       SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
//       SUM(CASE WHEN type='search' THEN 1 ELSE 0 END)::int AS searches
//     FROM events
//     WHERE created_at >= now() - ($1 || ' days')::interval
//     GROUP BY 1
//     ORDER BY 1 ASC
//     `,
//     [d]
//   );

//   // NOTE: typo fix: "RZ" isn't valid. We'll do a safe fallback if query fails.
//   // But since you will paste this file, I’ll give you corrected SQL right below.

//   return {
//     days: d,
//     summary: summaryRes.rows[0],
//     daily: dailyRes.rows,
//   };
// };

// Corrected overview daily query (paste this version instead of the above dailyRes block)
exports.overview = async ({ days }) => {
  const d = clampDays(days);

  const summaryRes = await db.query(
    `
    SELECT
      SUM(CASE WHEN type='view_product' THEN 1 ELSE 0 END)::int AS views,
      SUM(CASE WHEN type='add_to_cart' THEN 1 ELSE 0 END)::int AS add_to_cart,
      SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
      SUM(CASE WHEN type='search' THEN 1 ELSE 0 END)::int AS searches
    FROM events
    WHERE created_at >= now() - ($1 || ' days')::interval
    `,
    [d]
  );

  const dailyRes = await db.query(
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
    [d]
  );

  return {
    days: d,
    summary: summaryRes.rows[0],
    daily: dailyRes.rows,
  };
};

exports.topProducts = async ({ days, limit }) => {
  const d = clampDays(days);
  const take = clampLimit(limit);

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
    [d, take]
  );

  // attach product info
  const ids = res.rows.map((r) => r.product_id);
  if (!ids.length) return [];

  const products = await db.query(
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

  const map = new Map(products.rows.map((p) => [p.id, p]));
  return res.rows.map((r) => ({ ...map.get(r.product_id), score: r.score })).filter(Boolean);
};

exports.topSearches = async ({ days, limit }) => {
  const d = clampDays(days);
  const take = clampLimit(limit);

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
    [d, take]
  );

  return res.rows;
};
