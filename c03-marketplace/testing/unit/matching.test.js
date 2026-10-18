/**
 * Unit tests for evaluateDemand() in matching.controller.js.
 * Uses Node's built-in test runner. Does not change product code.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { evaluateDemand } = require(
  path.join(
    __dirname,
    "..",
    "..",
    "backend",
    "src",
    "controllers",
    "matching.controller.js"
  )
);

function evaluate(overrides = {}) {
  const harvest = {
    paddyType: "nadu",
    quantity: 500,
    aiPredictedPrice: 100,
    expectedPrice: 100,
    ...overrides.harvest,
  };

  const farmer = {
    district: "Kandy",
    ...overrides.farmer,
  };

  const demand = {
    paddyType: "nadu",
    offeredPrice: 100,
    quantityNeeded: 1000,
    millerId: {
      district: "Kandy",
      ...(overrides.miller || {}),
    },
    ...overrides.demand,
  };

  return evaluateDemand({
    demand,
    harvest,
    farmer,
    perspective: overrides.perspective || "farmer",
  });
}

describe("Matching evaluateDemand", () => {
  test("UT-MATCH-01 same district awards 40 location points", () => {
    const result = evaluate();
    assert.equal(result.scoreBreakdown.location, 40);
    assert.match(
      result.reasons[0].english,
      /same district/i
    );
  });

  test("UT-MATCH-02 different district awards 0 location points", () => {
    const result = evaluate({
      miller: { district: "Ampara" },
    });
    assert.equal(result.scoreBreakdown.location, 0);
    assert.match(
      result.reasons[0].english,
      /different districts/i
    );
  });

  test("UT-MATCH-03 same paddy type awards 30 points", () => {
    const result = evaluate();
    assert.equal(result.scoreBreakdown.paddyType, 30);
  });

  test("UT-MATCH-04 different paddy type awards 0 paddy points", () => {
    const result = evaluate({
      demand: {
        paddyType: "samba",
        offeredPrice: 100,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(result.scoreBreakdown.paddyType, 0);
    assert.equal(result.scoreBreakdown.location, 40);
  });

  test("UT-MATCH-05 price difference <= 5 awards 20 points", () => {
    const result = evaluate({
      harvest: {
        paddyType: "nadu",
        quantity: 500,
        aiPredictedPrice: 100,
        expectedPrice: 100,
      },
      demand: {
        paddyType: "nadu",
        offeredPrice: 104,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(result.scoreBreakdown.priceCompatibility, 20);
  });

  test("UT-MATCH-06 price difference 6-10 awards 15 points", () => {
    const result = evaluate({
      demand: {
        paddyType: "nadu",
        offeredPrice: 108,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(result.scoreBreakdown.priceCompatibility, 15);
  });

  test("UT-MATCH-07 price difference 11-20 awards 10 points", () => {
    const result = evaluate({
      demand: {
        paddyType: "nadu",
        offeredPrice: 115,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(result.scoreBreakdown.priceCompatibility, 10);
  });

  test("UT-MATCH-08 price difference > 20 awards 5 points", () => {
    const result = evaluate({
      demand: {
        paddyType: "nadu",
        offeredPrice: 130,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(result.scoreBreakdown.priceCompatibility, 5);
  });

  test("UT-MATCH-09 harvest quantity <= demand quantity awards 10 points", () => {
    const result = evaluate();
    assert.equal(result.scoreBreakdown.quantityCompatibility, 10);
    assert.equal(result.quantityAnalysis.compatible, true);
  });

  test("UT-MATCH-10 harvest quantity > demand quantity awards 0 quantity points", () => {
    const result = evaluate({
      harvest: {
        paddyType: "nadu",
        quantity: 2000,
        aiPredictedPrice: 100,
        expectedPrice: 100,
      },
    });
    assert.equal(result.scoreBreakdown.quantityCompatibility, 0);
    assert.equal(result.quantityAnalysis.compatible, false);
  });

  test("UT-MATCH-11 perfect match scores 100 and is HIGHLY_RECOMMENDED", () => {
    const result = evaluate();
    assert.equal(result.score, 100);
    assert.equal(result.matchingPercentage, 100);
    assert.equal(result.priority, "HIGHLY_RECOMMENDED");
    assert.equal(result.confidence.level, "HIGH");
  });

  test("UT-MATCH-12 70% match is RECOMMENDED", () => {
    // different district (0) + same paddy (30) + close price (20) + qty (10) = 60
    const moderate = evaluate({
      miller: { district: "Ampara" },
    });
    assert.equal(moderate.score, 60);
    assert.equal(moderate.priority, "MODERATE_MATCH");

    // same district (40) + different paddy (0) + close price (20) + qty (10) = 70
    const recommended = evaluate({
      demand: {
        paddyType: "samba",
        offeredPrice: 100,
        quantityNeeded: 1000,
        millerId: { district: "Kandy" },
      },
    });
    assert.equal(recommended.score, 70);
    assert.equal(recommended.priority, "RECOMMENDED");
    assert.equal(recommended.confidence.level, "MEDIUM");
  });

  test("UT-MATCH-13 district comparison is case-insensitive", () => {
    const result = evaluate({
      farmer: { district: "kandy" },
      miller: { district: "Kandy" },
    });
    assert.equal(result.scoreBreakdown.location, 40);
  });

  test("UT-MATCH-14 missing miller profile throws", () => {
    assert.throws(
      () =>
        evaluateDemand({
          demand: {
            paddyType: "nadu",
            offeredPrice: 100,
            quantityNeeded: 1000,
            millerId: null,
          },
          harvest: {
            paddyType: "nadu",
            quantity: 500,
            aiPredictedPrice: 100,
            expectedPrice: 100,
          },
          farmer: { district: "Kandy" },
        }),
      /valid Miller profile/i
    );
  });
});
