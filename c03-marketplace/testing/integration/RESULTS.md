# Integration test results

Executed: 2026-08-30  
Target: `http://localhost:5000`  
Evidence: `testing/integration/integration-run-log.txt`

| Test ID | Scenario | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|
| IT-SEC-01 | GET /api/harvests/my-harvests with no token | 401 | 401 | PASS | integration-run-log.txt |
| IT-SEC-02 | GET /api/matching/harvest/:id with no token | 401 | 401 | PASS | integration-run-log.txt |
| IT-SEC-03 | POST /api/rag/ask with no token | 401 | 401 | PASS | integration-run-log.txt |
| IT-SEC-04 | POST /api/negotiations/start with no token | 401 | 401 | PASS | integration-run-log.txt |
| IT-SEC-05 | POST /api/harvests/add with invalid token | 401 or 403 | 401/403 | PASS | integration-run-log.txt |
| IT-FL-01 | POST /api/fl/predict kandy/nadu/maha/500 | JSON predictedPrice | 200 `{"success":true,"data":{"predictedPrice":126.37}}` in 2670–4951 ms | PASS (pipeline) | testing/nfr/nfr-measurements.txt |
| IT-SEC-06 | FL predict requires JWT | 401 | **200 without JWT** | FAIL | nfr-measurements.txt |

Not tested (no authenticated farmer/miller session in this environment):

| Test ID | Scenario | Result |
|---|---|---|
| IT-MATCH-01 | Frontend → matching API → MongoDB → evaluateDemand → partners | NOT TESTED |
| IT-RAG-01 | RN → Express → rag_engine.py → FAISS → OpenAI | NOT TESTED |
| IT-NEG-01 | Match accept → FastAPI/Ollama → MongoDB result | NOT TESTED |
| IT-STATUS-01 | agreement_reached then Mark as Sold → sold; sold excluded from matching | NOT TESTED |
