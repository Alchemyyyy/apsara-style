const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || "test-admin-secret";

const app = require("../src/app");
const { signAdminToken } = require("../src/utils/adminToken");
const adminAuthRepo = require("../src/repositories/adminAuth.repository");
const adminProductsService = require("../src/services/adminProducts.service");
const adminOrdersService = require("../src/services/adminOrders.service");
const adminAuditService = require("../src/services/adminAudit.service");
const db = require("../src/db");
const runIntegration = process.env.RUN_INTEGRATION_TESTS === "1";
const it = runIntegration ? test : test.skip;

const originals = {
  findAdminById: adminAuthRepo.findAdminById,
  productsList: adminProductsService.list,
  productsGetById: adminProductsService.getById,
  ordersList: adminOrdersService.list,
  ordersGetById: adminOrdersService.getById,
  auditList: adminAuditService.list,
  dbQuery: db.query,
};

function tokenFor(adminId, roles) {
  return signAdminToken({ sub: adminId, email: `${adminId}@example.com`, roles }, { secret: process.env.ADMIN_TOKEN_SECRET });
}

test.beforeEach(() => {
  adminAuthRepo.findAdminById = async (id) => {
    const map = {
      "catalog-admin": ["catalog_admin"],
      "ops-admin": ["ops_admin"],
      "super-admin": ["super_admin"],
    };
    const roles = map[id] || [];
    if (!roles.length) return null;
    return {
      id,
      full_name: id,
      email: `${id}@example.com`,
      is_active: true,
      roles,
    };
  };

  adminProductsService.list = async () => ({ items: [], meta: { page: 1, totalPages: 1, total: 0, limit: 10 } });
  adminProductsService.getById = async (id) => ({ id, title: "Test Product" });
  adminOrdersService.list = async () => ({ items: [], meta: { page: 1, totalPages: 1, total: 0, limit: 10 } });
  adminOrdersService.getById = async (id) => ({ id, order_code: "AS000001", items: [], history: [] });
  adminAuditService.list = async () => ({ items: [], meta: { page: 1, totalPages: 1, total: 0, limit: 10 } });
  db.query = async (sql) => {
    const s = String(sql).toUpperCase();
    if (s.includes("SELECT 1")) return { rows: [{ "?column?": 1 }] };
    return { rows: [] };
  };
});

test.after(() => {
  adminAuthRepo.findAdminById = originals.findAdminById;
  adminProductsService.list = originals.productsList;
  adminProductsService.getById = originals.productsGetById;
  adminOrdersService.list = originals.ordersList;
  adminOrdersService.getById = originals.ordersGetById;
  adminAuditService.list = originals.auditList;
  db.query = originals.dbQuery;
});

it("admin products route requires auth", async () => {
  const res = await request(app).get("/api/admin/products");
  assert.equal(res.status, 401);
});

it("catalog_admin can access product routes", async () => {
  const token = tokenFor("catalog-admin", ["catalog_admin"]);
  const listRes = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);

  const getRes = await request(app).get("/api/admin/products/prod-1").set("Authorization", `Bearer ${token}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body?.data?.id, "prod-1");
});

it("ops_admin is forbidden from product routes", async () => {
  const token = tokenFor("ops-admin", ["ops_admin"]);
  const res = await request(app).get("/api/admin/products").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 403);
});

it("ops_admin can access order routes", async () => {
  const token = tokenFor("ops-admin", ["ops_admin"]);
  const listRes = await request(app).get("/api/admin/orders").set("Authorization", `Bearer ${token}`);
  assert.equal(listRes.status, 200);

  const getRes = await request(app).get("/api/admin/orders/ord-1").set("Authorization", `Bearer ${token}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body?.data?.id, "ord-1");
});

it("catalog_admin is forbidden from order routes", async () => {
  const token = tokenFor("catalog-admin", ["catalog_admin"]);
  const res = await request(app).get("/api/admin/orders").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 403);
});

it("upload route permissions are enforced", async () => {
  const opsToken = tokenFor("ops-admin", ["ops_admin"]);
  const forbidden = await request(app).post("/api/admin/uploads/images").set("Authorization", `Bearer ${opsToken}`);
  assert.equal(forbidden.status, 403);

  const catToken = tokenFor("catalog-admin", ["catalog_admin"]);
  const allowed = await request(app).post("/api/admin/uploads/images").set("Authorization", `Bearer ${catToken}`);
  assert.equal(allowed.status, 400);
});

it("health endpoints respond", async () => {
  const live = await request(app).get("/api/health");
  assert.equal(live.status, 200);
  assert.equal(live.body?.data?.status, "ok");

  const ready = await request(app).get("/api/health/ready");
  assert.equal(ready.status, 200);
  assert.equal(ready.body?.data?.status, "ready");
});

it("super_admin can access audit logs, non-super cannot", async () => {
  const superToken = tokenFor("super-admin", ["super_admin"]);
  const ok = await request(app).get("/api/admin/audit-logs").set("Authorization", `Bearer ${superToken}`);
  assert.equal(ok.status, 200);

  const opsToken = tokenFor("ops-admin", ["ops_admin"]);
  const forbidden = await request(app).get("/api/admin/audit-logs").set("Authorization", `Bearer ${opsToken}`);
  assert.equal(forbidden.status, 403);
});
