export function emptyImage(sortOrder = 0) {
  return { url: '', alt_text: '', sort_order: sortOrder }
}

export function emptyVariant() {
  return { size: '', color: '', sku: '', stock: 0 }
}

export function createEmptyProductForm() {
  return {
    title: '',
    slug: '',
    gender: 'women',
    category_id: '',
    description: '',
    base_price: '',
    discount_price: '',
    discount_percent: '',
    brand: '',
    parent_sku: '',
    material: '',
    care: '',
    fit: '',
    model_note: '',
    size_guide: '',
    style_tags: '',
    meta_title: '',
    meta_description: '',
    images: [emptyImage(0)],
    variants: [emptyVariant()],
    is_active: true,
  }
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function productToForm(product = {}) {
  const tags = product.tags || {}
  const seo = tags.seo || {}

  return {
    title: product.title || '',
    slug: product.slug || '',
    gender: product.gender || 'women',
    category_id: product.category_id || '',
    description: product.description || '',
    base_price: product.base_price || '',
    discount_price: product.discount_price || '',
    discount_percent:
      Number(product.discount_price) > 0 && Number(product.base_price) > Number(product.discount_price)
        ? round2(((Number(product.base_price) - Number(product.discount_price)) / Number(product.base_price)) * 100)
        : '',
    brand: tags.brand || '',
    parent_sku: tags.parent_sku || '',
    material: tags.material || '',
    care: tags.care || '',
    fit: tags.fit || '',
    model_note: tags.model_note || '',
    size_guide: tags.size_guide || '',
    style_tags: Array.isArray(tags.style_tags) ? tags.style_tags.join(', ') : '',
    meta_title: seo.meta_title || '',
    meta_description: seo.meta_description || '',
    images: Array.isArray(product.images) && product.images.length
      ? product.images.map((img, idx) => ({
        url: img.url || '',
        alt_text: img.alt_text || '',
        sort_order: Number.isInteger(Number(img.sort_order)) ? Number(img.sort_order) : idx,
      }))
      : [emptyImage(0)],
    variants: Array.isArray(product.variants) && product.variants.length
      ? product.variants.map((variant) => ({
        size: variant.size || '',
        color: variant.color || '',
        sku: variant.sku || '',
        stock: Number(variant.stock || 0),
      }))
      : [emptyVariant()],
    is_active: Boolean(product.is_active),
  }
}

export function buildProductPayload(form = {}) {
  const images = (form.images || [])
    .map((img, index) => ({
      url: String(img.url || '').trim(),
      alt_text: String(img.alt_text || '').trim(),
      sort_order: Number.isInteger(Number(img.sort_order)) ? Number(img.sort_order) : index,
    }))
    .filter((img) => img.url)

  const variants = (form.variants || [])
    .map((variant) => ({
      size: String(variant.size || '').trim(),
      color: String(variant.color || '').trim(),
      sku: String(variant.sku || '').trim(),
      stock: Number(variant.stock),
    }))
    .filter((variant) => variant.size && variant.color)

  return {
    ...form,
    discount_percent: undefined,
    category_id: form.category_id || null,
    discount_price: form.discount_price || null,
    style_tags: form.style_tags || '',
    images,
    variants,
  }
}
