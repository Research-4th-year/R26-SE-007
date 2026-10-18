# C03 Digital Goviya Marketplace — PP2 Testing Evidence Report

Date: 2026-08-30  
Scope: Verify the **existing** C03 marketplace. No product code, APIs, schemas, or UI were changed for this report.

## 1. Testing overview

| Area | What was done |
|---|---|
| Unit | Matching, RAG language helpers, FL CLI, negotiation validator, auth/privacy schema |
| Integration | Live HTTP probes to `http://localhost:5000`; FL predict pipeline |
| System | Cases documented; E2E not run (no logged-in Farmer/Miller session) |
| NFR | Measured auth-reject and FL predict latency; JWT coverage checked |
| Regression | Mapped historical fixes from git; re-ran related unit tests only |

Existing automated tests found in the repo before this work: **none** (no Jest/Mocha/pytest suite). `negotiation_agents/tests/simulation_runner.py` is empty.

## 2. Test environment

| Item | Value |
|---|---|
| OS | Windows 10 |
| API | `http://localhost:5000` (already running) |
| Node | `node:test` (built-in) |
| Python | `unittest` (stdlib) |
| FL models | `c03-marketplace/fl/models/global_model.pkl`, `preprocessing.pkl` |
| Product changes | None |

## 3. Unit testing

Evidence: `testing/unit/RESULTS.md`, `testing/unit/unit-run-log.txt`

| Suite | Tests | PASS | FAIL |
|---|---|---|---|
| Matching `evaluateDemand` | 14 | 14 | 0 |
| RAG language / normalize / fallback filter | 10 | 10 | 0 |
| FL `prediction.py` CLI | 5 | 5 | 0 |
| Negotiation `DecisionValidator` + schema | 10 | 10 | 0 |
| Auth middleware + private-price schema | 8 | 8 | 0 |
| **Total executed** | **47** | **47** | **0** |

Matching labels confirmed: 100 → `HIGHLY_RECOMMENDED` / HIGH; 70 → `RECOMMENDED` / MEDIUM; 60 → `MODERATE_MATCH`.

RAG retrieval via FAISS and OpenAI generation: **NOT TESTED** (helpers extracted without loading the index).

Ollama multi-round negotiation: **NOT TESTED** (validator only).

## 4. Integration testing

Evidence: `testing/integration/RESULTS.md`, `testing/integration/integration-run-log.txt`

| ID | Result |
|---|---|
| Unauthenticated harvest / matching / RAG / negotiation | PASS (401) |
| Invalid token on farmer harvest create | PASS (401/403) |
| Express → `prediction.py` → model → JSON | PASS (`predictedPrice`: 126.37) |
| FL predict requires JWT | **FAIL** (200 with no token) |
| Matching API → MongoDB → partners | NOT TESTED |
| RAG Express → FAISS → OpenAI | NOT TESTED |
| Negotiation Express → FastAPI → Ollama → MongoDB | NOT TESTED |
| agreement_reached → Mark as Sold → sold excluded from matching | NOT TESTED |

## 5. System testing

Evidence: `testing/system/TEST_CASES.md`

All 15 requested user-flow cases are **NOT TESTED** end-to-end. No Expo login session was available to this harness.

## 6. NFR measurements

Evidence: `testing/nfr/RESULTS.md`, `testing/nfr/nfr-measurements.txt`

Measured (ms, this machine → localhost):

| Call | Status | Time |
|---|---|---|
| Login validation (empty) | 400 | 448 (cold) |
| Login validation (invalid) | 400 | 4 |
| Harvests unauth (avg of 5) | 401 | 3.4 |
| Matching unauth | 401 | 18 |
| RAG unauth | 401 | 6 |
| Negotiation unauth | 401 | 6 |
| FL predict (3 warm runs) | 200 | 2702, 2903, 2670 (avg **2758**) |

Successful login, harvest create, matching, RAG answer, and live negotiation times: **NOT TESTED**.

Usability study: **NOT TESTED**.

## 7. Bug fixes

See `testing/regression/RESULTS.md`. Fixes identified from git (`5309445`, `51e7469`, `af081f5`, `d91b741`), not from new incidents in this run.

No bugs were patched during this testing task.

New observation (not previously claimed as a historical bug): **`POST /api/fl/predict` is unauthenticated**.

## 8. Regression testing

After inspecting those historical fixes:

| Check | Result |
|---|---|
| Matching weights 40/30/20/10 | PASS (unit) |
| No `slice(0, 5)` in matching.controller.js | PASS (source) |
| `agreement_reached` + `sold` on harvest schema | PASS (unit) |
| Duplicate-request skip still in matchSelection.controller.js | PASS (source) |
| JWT still required on harvest/matching/RAG/negotiation | PASS (live 401) |

Live UI regression of matching tabs, Mark as Sold, and connected partners: **NOT TESTED**.

## 9. Overall test summary

| Category | PASS | FAIL | NOT TESTED |
|---|---|---|---|
| Unit | 47 | 0 | RAG FAISS/OpenAI, Ollama rounds |
| Integration | 6 JWT + 1 FL pipeline | 1 (FL unauthenticated) | Matching/RAG/negotiation happy paths |
| System E2E | 0 | 0 | 15 |
| NFR performance (auth reject + FL) | measured | — | authenticated happy paths |
| Historical bug E2E retest | — | — | all E2E |

## 10. Limitations

1. No farmer/miller credentials were used, so authenticated APIs and Expo UI flows were not run.
2. RAG unit tests execute helper functions from `rag_engine.py` without loading FAISS/OpenAI.
3. Negotiation unit tests do not start Ollama agents.
4. NFR times are from one workstation to localhost; they are not a load test.
5. Screenshots of mobile screens were not captured.
6. `/api/fl/predict` has no `authenticate` middleware in `fl.routes.js`; that is reported, not changed.

## How to re-run unit tests

```text
node --test c03-marketplace/testing/unit/matching.test.js
node --test c03-marketplace/testing/unit/auth-privacy.test.js
python c03-marketplace/testing/unit/test_rag_language.py
python c03-marketplace/testing/unit/test_fl_prediction.py
python c03-marketplace/testing/unit/test_negotiation_validator.py
node --test c03-marketplace/testing/integration/api-security.probe.js
```
