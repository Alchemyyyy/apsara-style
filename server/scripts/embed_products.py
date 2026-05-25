"""
SABY ORDER - Embed Products (FREE local embeddings)
Reads products + tags, generates embeddings, stores into product_embeddings.vector (real[])

Run:
  source .venv/bin/activate
  python scripts/embed_products.py
"""

import os
from typing import List

import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise SystemExit("❌ Missing DATABASE_URL. Put it in server/.env")

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

def tags_to_text(tags) -> str:
    if not tags:
        return ""
    parts: List[str] = []
    for k, v in tags.items():
        if isinstance(v, list) and v:
            parts.append(f"{k}: " + ", ".join(map(str, v)))
        elif isinstance(v, str) and v:
            parts.append(f"{k}: {v}")
    return " | ".join(parts)

def build_product_text(row) -> str:
    title = row["title"] or ""
    desc = row["description"] or ""
    gender = row["gender"] or ""
    category = row["category_name"] or ""
    tags = row["tags"] or {}
    tag_text = tags_to_text(tags)
    return f"{title}. Category: {category}. Gender: {gender}. {desc} Tags: {tag_text}".strip()

def main():
    print("✅ Loading embedding model...")
    model = SentenceTransformer(MODEL_NAME)

    print("✅ Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
              p.id,
              p.title,
              p.description,
              p.gender,
              p.tags,
              c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = true
            ORDER BY p.created_at ASC;
            """
        )
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]

    if not rows:
        raise SystemExit("❌ No products found. Run seed_catalog.js first.")

    texts = [build_product_text(r) for r in rows]
    product_ids = [r["id"] for r in rows]

    print(f"✅ Generating embeddings for {len(texts)} products...")
    vectors = model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        normalize_embeddings=True
    )

    data = [(pid, vec.tolist()) for pid, vec in zip(product_ids, vectors)]

    print("✅ Upserting into product_embeddings...")
    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO product_embeddings (product_id, vector)
            VALUES %s
            ON CONFLICT (product_id)
            DO UPDATE SET vector = EXCLUDED.vector, updated_at = now();
            """,
            data,
            page_size=500
        )
    conn.commit()
    conn.close()
    print("🎉 Done. Embeddings stored.")

if __name__ == "__main__":
    main()
