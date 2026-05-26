const test = require("node:test");
const assert = require("node:assert/strict");

const embedQueryService = require("../src/services/embedQuery.service");
const stylistRepo = require("../src/modules/stylist/repository");

embedQueryService.embedQueryPython = async () => [1, 0];

const stylistService = require("../src/modules/stylist/service");

const originals = {
  loadCandidates: stylistRepo.loadCandidates,
  createStylistRequestEvent: stylistRepo.createStylistRequestEvent,
};

test.afterEach(() => {
  stylistRepo.loadCandidates = originals.loadCandidates;
  stylistRepo.createStylistRequestEvent = originals.createStylistRequestEvent;
});

test("buildOutfit: matches shared category slugs", async () => {
  stylistRepo.loadCandidates = async () => [
    { id: "top-1", title: "Minimal Top", gender: "women", category_slug: "tops", base_price: 30, tags: { style: ["minimal"] }, vector: [1, 0] },
    { id: "bottom-1", title: "Tailored Pants", gender: "women", category_slug: "pants", base_price: 45, tags: {}, vector: [0.9, 0] },
    { id: "shoes-1", title: "Clean Sneakers", gender: "women", category_slug: "shoes", base_price: 55, tags: {}, vector: [0.8, 0] },
  ];
  stylistRepo.createStylistRequestEvent = async () => {};

  const result = await stylistService.buildOutfit({
    sessionId: "session-1",
    prompt: "minimal office outfit",
    gender: "women",
    style: "minimal",
    k: 1,
  });

  const look = result.looks[0];
  assert.equal(look.outfit.top.id, "top-1");
  assert.equal(look.outfit.bottom.id, "bottom-1");
  assert.equal(look.outfit.shoes.id, "shoes-1");
  assert.equal(look.isComplete, true);
  assert.equal(look.estimatedTotal, 130);
});

test("buildOutfit: rejects unsupported public gender", async () => {
  await assert.rejects(
    stylistService.buildOutfit({
      sessionId: "session-1",
      prompt: "minimal outfit",
      gender: "unisex",
      k: 1,
    }),
    (err) => {
      assert.equal(err.status, 400);
      assert.equal(err.message, "gender must be one of women|men");
      return true;
    }
  );
});
