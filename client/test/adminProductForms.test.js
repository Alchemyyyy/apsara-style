import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildProductPayload,
  createEmptyProductForm,
  productToForm,
} from '../src/features/admin/utils/adminProductForms.js'

test('createEmptyProductForm returns fresh default arrays', () => {
  const first = createEmptyProductForm()
  const second = createEmptyProductForm()

  first.images.push({ url: 'https://example.com/a.jpg' })
  first.variants.push({ size: 'M', color: 'Black', sku: 'SKU-1', stock: 3 })

  assert.equal(second.gender, 'women')
  assert.equal(second.images.length, 1)
  assert.equal(second.variants.length, 1)
})

test('productToForm normalizes nested product metadata', () => {
  const form = productToForm({
    title: 'Silk Dress',
    slug: 'silk-dress',
    gender: 'women',
    category_id: 'cat-1',
    base_price: 100,
    discount_price: 80,
    images: [{ url: 'https://example.com/dress.jpg', alt_text: 'Dress', sort_order: 2 }],
    variants: [{ size: 'S', color: 'Gold', sku: 'DRESS-S-GOLD', stock: 5 }],
    is_active: true,
  })

  assert.equal(form.discount_percent, 20)
  assert.equal(form.images[0].sort_order, 2)
  assert.equal(form.variants[0].stock, 5)
  assert.equal(form.is_active, true)
})

test('buildProductPayload trims image and variant rows', () => {
  const payload = buildProductPayload({
    ...createEmptyProductForm(),
    category_id: '',
    discount_price: '',
    discount_percent: 15,
    images: [
      { url: ' https://example.com/hero.jpg ', alt_text: ' Hero ', sort_order: '0' },
      { url: ' ', alt_text: 'ignored', sort_order: 1 },
    ],
    variants: [
      { size: ' M ', color: ' Black ', sku: ' SKU-M-BLK ', stock: '7' },
      { size: '', color: 'Red', sku: 'ignored', stock: 1 },
    ],
  })

  assert.equal(payload.category_id, null)
  assert.equal(payload.discount_price, null)
  assert.equal(payload.discount_percent, undefined)
  assert.deepEqual(payload.images, [
    { url: 'https://example.com/hero.jpg', alt_text: 'Hero', sort_order: 0 },
  ])
  assert.deepEqual(payload.variants, [
    { size: 'M', color: 'Black', sku: 'SKU-M-BLK', stock: 7 },
  ])
})
