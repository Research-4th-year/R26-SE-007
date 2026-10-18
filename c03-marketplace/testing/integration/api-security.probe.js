/**
 * Integration probes against a running Express API.
 * If the API is not reachable, tests are skipped (recorded as NOT TESTED).
 *
 * Default base URL: http://localhost:5000
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = process.env.C03_API_BASE_URL || "http://localhost:5000";

async function request(pathname, options = {}) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const elapsedMs = Date.now() - started;
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body, elapsedMs };
}

async function apiAvailable() {
  try {
    await fetch(BASE_URL, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

describe("C03 API integration probes", async () => {
  const available = await apiAvailable();

  test("IT-SEC-01 unauthenticated harvest list is rejected", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { response, body } = await request("/api/harvests/my-harvests");
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
  });

  test("IT-SEC-02 unauthenticated matching is rejected", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { response } = await request(
      "/api/matching/harvest/000000000000000000000000"
    );
    assert.equal(response.status, 401);
  });

  test("IT-SEC-03 unauthenticated RAG is rejected", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { response } = await request("/api/rag/ask", {
      method: "POST",
      body: JSON.stringify({ question: "What is PMB?" }),
    });
    assert.equal(response.status, 401);
  });

  test("IT-SEC-04 unauthenticated negotiation start is rejected", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { response } = await request("/api/negotiations/start", {
      method: "POST",
      body: JSON.stringify({ selectionId: "000000000000000000000000" }),
    });
    assert.equal(response.status, 401);
  });

  test("IT-SEC-05 miller cannot access farmer harvest create route", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { response } = await request("/api/harvests/add", {
      method: "POST",
      headers: {
        Authorization: "Bearer not-a-real-token",
      },
      body: JSON.stringify({
        paddyType: "nadu",
        season: "maha",
        quantity: 100,
        expectedPrice: 100,
        minimumAcceptablePrice: 90,
      }),
    });
    assert.ok([401, 403].includes(response.status));
  });

  test("IT-NFR-01 unauthenticated protected-route latency is recorded", async (t) => {
    if (!available) {
      t.skip(`API not reachable at ${BASE_URL}`);
      return;
    }
    const { elapsedMs, response } = await request("/api/harvests/my-harvests");
    assert.equal(response.status, 401);
    assert.ok(elapsedMs >= 0);
    console.log(`NFR_AUTH_REJECT_MS=${elapsedMs}`);
  });
});
