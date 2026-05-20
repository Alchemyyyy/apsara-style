const test = require("node:test");
const assert = require("node:assert/strict");

const adminOrdersService = require("../src/services/adminOrders.service");
const adminOrdersRepo = require("../src/repositories/adminOrders.repository");
const db = require("../src/db");

const originals = {
  dbQuery: db.query,
  findOrderById: adminOrdersRepo.findOrderById,
  listOrderItems: adminOrdersRepo.listOrderItems,
  listOrderStatusHistory: adminOrdersRepo.listOrderStatusHistory,
  updateOrderStatus: adminOrdersRepo.updateOrderStatus,
  insertStatusHistory: adminOrdersRepo.insertStatusHistory,
};

test.afterEach(() => {
  db.query = originals.dbQuery;
  adminOrdersRepo.findOrderById = originals.findOrderById;
  adminOrdersRepo.listOrderItems = originals.listOrderItems;
  adminOrdersRepo.listOrderStatusHistory = originals.listOrderStatusHistory;
  adminOrdersRepo.updateOrderStatus = originals.updateOrderStatus;
  adminOrdersRepo.insertStatusHistory = originals.insertStatusHistory;
});

test("getById: returns order with items and history", async () => {
  adminOrdersRepo.findOrderById = async () => ({
    id: "ord-1",
    order_code: "AS123456",
    status: "paid",
    total: 99.99,
  });
  adminOrdersRepo.listOrderItems = async () => [{ id: "item-1", qty: 2, title_snapshot: "Linen Shirt" }];
  adminOrdersRepo.listOrderStatusHistory = async () => [{ id: "his-1", status: "paid" }];

  const result = await adminOrdersService.getById("ord-1");
  assert.equal(result.id, "ord-1");
  assert.equal(result.items.length, 1);
  assert.equal(result.history.length, 1);
});

test("updateStatus: rejects invalid transition", async () => {
  adminOrdersRepo.findOrderById = async () => ({
    id: "ord-1",
    order_code: "AS123456",
    status: "pending",
  });

  await assert.rejects(
    adminOrdersService.updateStatus("ord-1", "delivered"),
    (err) => {
      assert.equal(err.status, 409);
      assert.match(err.message, /Invalid status transition/);
      return true;
    }
  );
});

test("updateStatus: updates order and writes status history", async () => {
  const txCalls = [];
  db.query = async (sql) => {
    txCalls.push(String(sql).trim().toUpperCase());
    return { rows: [] };
  };
  adminOrdersRepo.findOrderById = async () => ({
    id: "ord-1",
    order_code: "AS123456",
    status: "pending",
    email: "x@example.com",
    total: 49.5,
    created_at: new Date().toISOString(),
  });
  adminOrdersRepo.updateOrderStatus = async ({ id, status }) => ({
    id,
    order_code: "AS123456",
    status,
    email: "x@example.com",
    total: 49.5,
    created_at: new Date().toISOString(),
  });

  let historyCalled = false;
  adminOrdersRepo.insertStatusHistory = async ({ orderId, status, note }) => {
    historyCalled = true;
    assert.equal(orderId, "ord-1");
    assert.equal(status, "paid");
    assert.match(note, /Admin updated/);
  };

  const updated = await adminOrdersService.updateStatus("ord-1", "paid");

  assert.equal(updated.status, "paid");
  assert.equal(historyCalled, true);
  assert.equal(txCalls.includes("BEGIN"), true);
  assert.equal(txCalls.includes("COMMIT"), true);
});

