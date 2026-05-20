const test = require("node:test");
const assert = require("node:assert/strict");

const adminProductsService = require("../src/services/adminProducts.service");
const adminProductsRepo = require("../src/repositories/adminProducts.repository");
const db = require("../src/db");

const originals = {
  findCategoryById: adminProductsRepo.findCategoryById,
  findProductById: adminProductsRepo.findProductById,
  listProductImages: adminProductsRepo.listProductImages,
};

test.afterEach(() => {
  adminProductsRepo.findCategoryById = originals.findCategoryById;
  adminProductsRepo.findProductById = originals.findProductById;
  adminProductsRepo.listProductImages = originals.listProductImages;
});

test("create: rejects when discount price is greater than base price", async () => {
  adminProductsRepo.findCategoryById = async () => ({ id: "cat-1", is_active: true });

  await assert.rejects(
    adminProductsService.create({
      title: "Linen Shirt",
      slug: "linen-shirt",
      gender: "men",
      category_id: "cat-1",
      base_price: 50,
      discount_price: 60,
      images: [{ url: "http://localhost:4000/uploads/products/a.webp" }],
      variants: [{ size: "M", color: "White", stock: 5 }],
    }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, "discount_price must be > 0 and <= base_price");
      return true;
    }
  );
});

test("create: rejects when images are missing", async () => {
  adminProductsRepo.findCategoryById = async () => ({ id: "cat-1", is_active: true });

  await assert.rejects(
    adminProductsService.create({
      title: "Cotton Tee",
      slug: "cotton-tee",
      gender: "unisex",
      category_id: "cat-1",
      base_price: 20,
      variants: [{ size: "L", color: "Black", stock: 7 }],
    }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, "At least one image is required");
      return true;
    }
  );
});

test("update: rejects when no fields are provided", async () => {
  adminProductsRepo.findProductById = async () => ({
    id: "prod-1",
    base_price: 40,
    tags: {},
  });
  adminProductsRepo.listProductImages = async () => [];

  await assert.rejects(
    adminProductsService.update("prod-1", {}),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, "No fields to update");
      return true;
    }
  );
});

test("update: rejects when discount exceeds base price", async () => {
  adminProductsRepo.findProductById = async () => ({
    id: "prod-1",
    base_price: 50,
    tags: {},
  });
  adminProductsRepo.listProductImages = async () => [];

  await assert.rejects(
    adminProductsService.update("prod-1", { discount_price: 55 }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, "discount_price must be <= base_price");
      return true;
    }
  );
});

