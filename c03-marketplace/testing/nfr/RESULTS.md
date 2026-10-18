# NFR measurements

Date: 2026-08-30  
Client: this workstation → `http://localhost:5000`  
Raw log: `testing/nfr/nfr-measurements.txt`

## Performance (measured)

| Operation | Auth | Status | Time (ms) | Notes |
|---|---|---|---|---|
| POST /api/auth/login empty body | none | 400 | 448 | First call; validation only |
| POST /api/auth/login invalid body | none | 400 | 4 | Validation only — **not** a successful login |
| GET /api/harvests/my-harvests | none | 401 | 34 first; later avg **3.4** over 5 runs | Auth reject path |
| GET /api/matching/harvest/:id | none | 401 | 18 | Auth reject path |
| POST /api/rag/ask | none | 401 | 6 | Auth reject path — **not** RAG generation time |
| POST /api/negotiations/start | none | 401 | 6 | Auth reject path — **not** Ollama negotiation time |
| POST /api/fl/predict | none | 200 | 4951, 2702, 2903, 2670 | Express → prediction.py → model. Average of last 3: **2758 ms** |

Not measured (no authenticated session / no UI instrumentation):

| Operation | Result |
|---|---|
| Successful farmer login | NOT TESTED |
| Create harvest (includes FL in harvest controller) | NOT TESTED |
| Authenticated matching query | NOT TESTED |
| Authenticated RAG generation | NOT TESTED |
| Full AI negotiation | NOT TESTED |
| Task-completion usability study | NOT TESTED |

## Security (measured / observed)

| Check | Result | Evidence |
|---|---|---|
| Harvest/matching/RAG/negotiation APIs reject missing JWT | PASS | integration-run-log.txt |
| Role guard: miller cannot use farmer-only authorizeRoles | PASS | auth-privacy.test.js |
| Private min/max prices are `select: false` on schemas | PASS | auth-privacy.test.js |
| `/api/fl/predict` requires JWT | **FAIL** — returned 200 and a price with no token | nfr-measurements.txt |
| Cross-user data access with two real accounts | NOT TESTED | — |
| Private prices absent from normal harvest/demand JSON | NOT TESTED (would need authenticated GET of own listing) | — |

## Usability

Qualitative only: not measured. No task-time or completion-rate study was run.
