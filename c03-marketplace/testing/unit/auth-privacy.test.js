/**
 * Unit tests for JWT gate behaviour and private-price schema flags.
 * Does not start MongoDB or change product code.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const backendSrc = path.join(__dirname, "..", "..", "backend", "src");

const {
  authenticate,
  authorizeRoles,
} = require(path.join(backendSrc, "middlewares", "auth.middleware.js"));

const Harvest = require(path.join(backendSrc, "models", "harvest.model.js"));
const MillerDemand = require(
  path.join(backendSrc, "models", "millerDemand.model.js")
);

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe("Auth middleware", () => {
  test("UT-AUTH-01 missing Authorization header returns 401", async () => {
    const req = { headers: {} };
    const res = mockRes();
    let nextCalled = false;

    await authenticate(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /token is required/i);
  });

  test("UT-AUTH-02 invalid Bearer token returns 401", async () => {
    const req = {
      headers: { authorization: "Bearer not-a-valid-jwt" },
    };
    const res = mockRes();

    await authenticate(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /invalid|required|secret/i);
  });

  test("UT-AUTH-03 miller role is forbidden on farmer-only route", () => {
    const req = { user: { role: "miller" } };
    const res = mockRes();
    let nextCalled = false;

    authorizeRoles("farmer")(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  });

  test("UT-AUTH-04 farmer role is allowed on farmer-only route", () => {
    const req = { user: { role: "farmer" } };
    const res = mockRes();
    let nextCalled = false;

    authorizeRoles("farmer")(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });
});

describe("Private negotiation field schema flags", () => {
  test("UT-PRIV-01 harvest minimumAcceptablePrice is select:false", () => {
    assert.equal(
      Harvest.schema.path("minimumAcceptablePrice").options.select,
      false
    );
  });

  test("UT-PRIV-02 miller demand maximumBuyingPrice is select:false", () => {
    assert.equal(
      MillerDemand.schema.path("maximumBuyingPrice").options.select,
      false
    );
  });

  test("UT-PRIV-03 harvest status enum includes agreement_reached and sold", () => {
    const values = Harvest.schema.path("status").enumValues;
    assert.ok(values.includes("agreement_reached"));
    assert.ok(values.includes("sold"));
    assert.ok(values.includes("available"));
  });

  test("UT-PRIV-04 demand status enum includes agreement_reached and fulfilled", () => {
    const values = MillerDemand.schema.path("status").enumValues;
    assert.ok(values.includes("agreement_reached"));
    assert.ok(values.includes("fulfilled"));
    assert.ok(values.includes("open"));
  });
});
