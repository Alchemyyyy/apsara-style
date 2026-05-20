const adminProductsRepo = require("../repositories/adminProducts.repository");
const db = require("../db");
const fs = require("fs/promises");
const path = require("path");

const VALID_GENDERS = ["men", "women", "unisex"];
const uploadsProductsDir = path.resolve(__dirname, "../../uploads/products");

function appError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toLocalUploadPath(urlValue) {
  const raw = String(urlValue || "").trim();
  if (!raw) return null;
  let pathname = "";

  try {
    const parsed = new URL(raw);
    pathname = parsed.pathname || "";
  } catch {
    pathname = raw;
  }

  const marker = "/uploads/products/";
  const index = pathname.indexOf(marker);
  if (index === -1) return null;

  const filename = pathname.slice(index + marker.length).split("/").filter(Boolean).join("");
  if (!filename) return null;

  const resolved = path.resolve(uploadsProductsDir, filename);
  if (!resolved.startsWith(uploadsProductsDir)) return null;
  return resolved;
}

function extractLocalUploadPathsFromImages(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  for (const img of images) {
    const p = toLocalUploadPath(img?.url || img);
    if (p) out.push(p);
  }
  return out;
}

function computeRemovedLocalUploads(existingImages, nextImages) {
  const existing = new Set(extractLocalUploadPathsFromImages(existingImages));
  const next = new Set(extractLocalUploadPathsFromImages(nextImages));
  return [...existing].filter((p) => !next.has(p));
}

async function removeLocalFiles(filePaths = []) {
  if (!Array.isArray(filePaths) || !filePaths.length) return;
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore missing/locked files; DB state remains source of truth
      }
    })
  );
}

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

function toBoolOrNull(v) {
  if (typeof v === "boolean") return v;
  const s = String(v || "").trim().toLowerCase();
  if (!s) return null;
  if (["1", "true", "yes"].includes(s)) return true;
  if (["0", "false", "no"].includes(s)) return false;
  return null;
}

function ensureGender(gender) {
  const safe = String(gender || "").trim().toLowerCase();
  if (!VALID_GENDERS.includes(safe)) throw appError("gender must be one of men|women|unisex", 400);
  return safe;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function parseStringList(value) {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v || "").trim())
      .filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeImages(input) {
  if (input === undefined) return null;
  if (!Array.isArray(input)) throw appError("images must be an array", 400);

  return input.map((item, index) => {
    if (typeof item === "string") {
      const url = item.trim();
      if (!url) throw appError("image url cannot be empty", 400);
      return { url, alt_text: null, sort_order: index };
    }

    if (!item || typeof item !== "object") throw appError("images must contain string urls or objects", 400);

    const url = String(item.url || "").trim();
    if (!url) throw appError("image url cannot be empty", 400);

    const sortOrderRaw = Number(item.sort_order);
    const sortOrder = Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : index;
    const altText = normalizeOptionalText(item.alt_text);

    return { url, alt_text: altText, sort_order: sortOrder };
  });
}

function normalizeVariants(input) {
  if (input === undefined) return null;
  if (!Array.isArray(input)) throw appError("variants must be an array", 400);
  if (!input.length) return [];

  return input.map((item, index) => {
    if (!item || typeof item !== "object") throw appError(`variant ${index + 1} is invalid`, 400);

    const size = String(item.size || "").trim();
    const color = String(item.color || "").trim();
    const sku = normalizeOptionalText(item.sku);
    const stock = Number(item.stock);

    if (!size) throw appError(`variant ${index + 1}: size is required`, 400);
    if (!color) throw appError(`variant ${index + 1}: color is required`, 400);
    if (!Number.isInteger(stock) || stock < 0) throw appError(`variant ${index + 1}: stock must be >= 0`, 400);

    return { size, color, sku, stock };
  });
}

function buildCatalogTags(body, baseTags = {}) {
  const tags = baseTags && typeof baseTags === "object" && !Array.isArray(baseTags) ? { ...baseTags } : {};

  const setOrDelete = (key, value) => {
    if (value === null || value === undefined || value === "") delete tags[key];
    else tags[key] = value;
  };

  if (body.brand !== undefined) setOrDelete("brand", normalizeOptionalText(body.brand));
  if (body.parent_sku !== undefined) setOrDelete("parent_sku", normalizeOptionalText(body.parent_sku));
  if (body.material !== undefined) setOrDelete("material", normalizeOptionalText(body.material));
  if (body.care !== undefined) setOrDelete("care", normalizeOptionalText(body.care));
  if (body.fit !== undefined) setOrDelete("fit", normalizeOptionalText(body.fit));
  if (body.model_note !== undefined) setOrDelete("model_note", normalizeOptionalText(body.model_note));
  if (body.size_guide !== undefined) setOrDelete("size_guide", normalizeOptionalText(body.size_guide));
  if (body.style_tags !== undefined) {
    const styleTags = parseStringList(body.style_tags);
    if (styleTags.length) tags.style_tags = styleTags;
    else delete tags.style_tags;
  }

  if (body.meta_title !== undefined || body.meta_description !== undefined) {
    const currentSeo = tags.seo && typeof tags.seo === "object" && !Array.isArray(tags.seo) ? { ...tags.seo } : {};
    if (body.meta_title !== undefined) {
      const value = normalizeOptionalText(body.meta_title);
      if (value) currentSeo.meta_title = value;
      else delete currentSeo.meta_title;
    }
    if (body.meta_description !== undefined) {
      const value = normalizeOptionalText(body.meta_description);
      if (value) currentSeo.meta_description = value;
      else delete currentSeo.meta_description;
    }

    if (Object.keys(currentSeo).length) tags.seo = currentSeo;
    else delete tags.seo;
  }

  return tags;
}

async function ensureCategoryActive(categoryId) {
  const category = await adminProductsRepo.findCategoryById(categoryId);
  if (!category || !category.is_active) throw appError("category_id must reference an active category", 400);
  return category;
}

const list = async (q) => {
  const page = toInt(q.page, 1);
  const limit = Math.min(toInt(q.limit, 20), 100);
  const offset = (page - 1) * limit;

  const params = [];
  const filters = [];
  let i = 1;

  if (q.q) {
    params.push(`%${q.q}%`);
    filters.push(`p.title ILIKE $${i++}`);
  }

  if (q.gender) {
    params.push(ensureGender(q.gender));
    filters.push(`p.gender = $${i++}`);
  }

  if (q.category_id) {
    params.push(String(q.category_id));
    filters.push(`p.category_id = $${i++}`);
  }

  const active = toBoolOrNull(q.is_active);
  if (active !== null) {
    params.push(active);
    filters.push(`p.is_active = $${i++}`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const total = await adminProductsRepo.countProducts(where, params);
  const items = await adminProductsRepo.listProducts({ where, params, limit, offset });

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

const getById = async (id) => {
  const product = await adminProductsRepo.findProductById(id);
  if (!product) throw appError("Product not found", 404);

  const [images, variants] = await Promise.all([
    adminProductsRepo.listProductImages(id),
    adminProductsRepo.listProductVariants(id),
  ]);

  return { ...product, images, variants };
};

const create = async (body) => {
  const title = String(body.title || "").trim();
  const slug = String(body.slug || "").trim();
  const gender = ensureGender(body.gender);
  const categoryId = String(body.category_id || "").trim();
  const basePrice = Number(body.base_price);
  const images = normalizeImages(body.images) || [];
  const variants = normalizeVariants(body.variants) || [];

  if (!title || !slug || !categoryId || !Number.isFinite(basePrice) || basePrice <= 0) {
    throw appError("title, slug, gender, category_id, base_price required", 400);
  }

  if (body.discount_price !== undefined && body.discount_price !== null) {
    const discount = Number(body.discount_price);
    if (!Number.isFinite(discount) || discount <= 0 || discount > basePrice) {
      throw appError("discount_price must be > 0 and <= base_price", 400);
    }
  }

  await ensureCategoryActive(categoryId);
  if (!images.length) throw appError("At least one image is required", 400);
  if (!variants.length) throw appError("At least one variant is required", 400);

  const baseTags = body.tags && typeof body.tags === "object" && !Array.isArray(body.tags) ? body.tags : {};
  const tags = buildCatalogTags(body, baseTags);
  const createdLocalUploadPaths = extractLocalUploadPathsFromImages(images);

  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    const created = await adminProductsRepo.createProduct({
      title,
      slug,
      gender,
      categoryId,
      description: body.description || null,
      basePrice,
      discountPrice: body.discount_price || null,
      tags,
    }, client);

    await adminProductsRepo.replaceProductImages({ productId: created.id, images }, client);
    await adminProductsRepo.replaceProductVariants({ productId: created.id, variants }, client);

    await client.query("COMMIT");
    return getById(created.id);
  } catch (err) {
    await client.query("ROLLBACK");
    await removeLocalFiles(createdLocalUploadPaths);
    throw err;
  } finally {
    client.release();
  }
};

const update = async (id, body) => {
  const allowed = ["title", "slug", "gender", "category_id", "description", "base_price", "discount_price", "tags", "is_active"];
  const sets = [];
  const params = [];
  let i = 1;
  const existing = await adminProductsRepo.findProductById(id);
  const existingImages = await adminProductsRepo.listProductImages(id);
  const images = normalizeImages(body.images);
  const variants = normalizeVariants(body.variants);
  const removedLocalUploadPaths = images !== null ? computeRemovedLocalUploads(existingImages, images) : [];
  const incomingLocalUploadPaths = images !== null ? extractLocalUploadPathsFromImages(images) : [];

  if (!existing) throw appError("Product not found", 404);

  if (body.gender !== undefined) body.gender = ensureGender(body.gender);

  if (body.base_price !== undefined) {
    const basePrice = Number(body.base_price);
    if (!Number.isFinite(basePrice) || basePrice <= 0) throw appError("base_price must be > 0", 400);
    body.base_price = basePrice;
  }

  if (body.discount_price !== undefined && body.discount_price !== null) {
    const discount = Number(body.discount_price);
    if (!Number.isFinite(discount) || discount <= 0) throw appError("discount_price must be > 0", 400);
    const basePriceForValidation =
      body.base_price !== undefined ? Number(body.base_price) : Number(existing.base_price);
    if (discount > basePriceForValidation) throw appError("discount_price must be <= base_price", 400);
    body.discount_price = discount;
  }

  if (body.category_id !== undefined && body.category_id !== null) {
    await ensureCategoryActive(body.category_id);
  }

  const hasCatalogMeta =
    body.tags !== undefined ||
    body.brand !== undefined ||
    body.parent_sku !== undefined ||
    body.material !== undefined ||
    body.care !== undefined ||
    body.fit !== undefined ||
    body.model_note !== undefined ||
    body.size_guide !== undefined ||
    body.style_tags !== undefined ||
    body.meta_title !== undefined ||
    body.meta_description !== undefined;

  if (hasCatalogMeta) {
    const baseTags =
      body.tags && typeof body.tags === "object" && !Array.isArray(body.tags) ? body.tags : existing.tags || {};
    body.tags = buildCatalogTags(body, baseTags);
  }

  for (const k of allowed) {
    if (body[k] !== undefined) {
      sets.push(`${k} = $${i++}`);
      params.push(body[k]);
    }
  }

  if (!sets.length && images === null && variants === null) throw appError("No fields to update", 400);

  const client = await db.getClient();
  try {
    await client.query("BEGIN");
    if (sets.length) {
      params.push(id);
      await adminProductsRepo.updateProduct({
        id,
        setsSql: sets.join(", "),
        params,
      }, client);
    }

    if (images !== null) {
      await adminProductsRepo.replaceProductImages({ productId: id, images }, client);
    }
    if (variants !== null) {
      await adminProductsRepo.replaceProductVariants({ productId: id, variants }, client);
    }

    await client.query("COMMIT");
    if (removedLocalUploadPaths.length) {
      await removeLocalFiles(removedLocalUploadPaths);
    }
    return getById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    if (incomingLocalUploadPaths.length) {
      const existingSet = new Set(extractLocalUploadPathsFromImages(existingImages));
      const orphanedNewFiles = incomingLocalUploadPaths.filter((p) => !existingSet.has(p));
      await removeLocalFiles(orphanedNewFiles);
    }
    throw err;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  await adminProductsRepo.deactivateProduct(id);
};

const updateStock = async (variantId, stock) => {
  const updated = await adminProductsRepo.updateVariantStock({ variantId, stock });
  if (!updated) throw appError("Variant not found", 404);
  return updated;
};

const listCategories = async () => {
  return adminProductsRepo.listCategories();
};

const getCategoryById = async (id) => {
  const category = await adminProductsRepo.findCategoryById(id);
  if (!category) throw appError("Category not found", 404);
  return category;
};

const createCategory = async (body) => {
  const name = String(body.name || "").trim();
  const slug = slugify(body.slug || body.name || "");
  const sortOrder = Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0;

  if (!name || !slug) throw appError("name required", 400);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) throw appError("sort_order must be >= 0", 400);

  return adminProductsRepo.createCategory({
    name,
    slug,
    sortOrder,
    isActive: body.is_active !== false,
  });
};

const updateCategory = async (id, body) => {
  const payload = {};

  if (body.name !== undefined) {
    const name = String(body.name || "").trim();
    if (!name) throw appError("name cannot be empty", 400);
    payload.name = name;
  }

  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) throw appError("slug cannot be empty", 400);
    payload.slug = slug;
  }

  if (body.sort_order !== undefined) {
    const sortOrder = Number(body.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) throw appError("sort_order must be >= 0", 400);
    payload.sort_order = sortOrder;
  }

  if (body.is_active !== undefined) {
    payload.is_active = Boolean(body.is_active);
  }

  if (!Object.keys(payload).length) throw appError("No fields to update", 400);
  return adminProductsRepo.updateCategory(id, payload);
};

const removeCategory = async (id) => {
  await adminProductsRepo.deactivateCategory(id);
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  updateStock,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  removeCategory,
};
