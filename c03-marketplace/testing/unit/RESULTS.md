# Unit test results

Executed: 2026-08-30  
Evidence log: `testing/unit/unit-run-log.txt`  
Framework: Node.js built-in `node:test` and Python `unittest` (no new dependencies)

| Test ID | Area | Result | Evidence |
|---|---|---|---|
| UT-MATCH-01 | Same district = 40 | PASS | unit-run-log.txt |
| UT-MATCH-02 | Different district = 0 | PASS | unit-run-log.txt |
| UT-MATCH-03 | Same paddy = 30 | PASS | unit-run-log.txt |
| UT-MATCH-04 | Different paddy = 0 | PASS | unit-run-log.txt |
| UT-MATCH-05 | Price diff ≤5 = 20 | PASS | unit-run-log.txt |
| UT-MATCH-06 | Price diff 6–10 = 15 | PASS | unit-run-log.txt |
| UT-MATCH-07 | Price diff 11–20 = 10 | PASS | unit-run-log.txt |
| UT-MATCH-08 | Price diff >20 = 5 | PASS | unit-run-log.txt |
| UT-MATCH-09 | Quantity compatible = 10 | PASS | unit-run-log.txt |
| UT-MATCH-10 | Quantity incompatible = 0 | PASS | unit-run-log.txt |
| UT-MATCH-11 | Perfect score 100 / HIGHLY_RECOMMENDED | PASS | unit-run-log.txt |
| UT-MATCH-12 | 70 = RECOMMENDED; 60 = MODERATE_MATCH | PASS | unit-run-log.txt |
| UT-MATCH-13 | District case-insensitive | PASS | unit-run-log.txt |
| UT-MATCH-14 | Missing miller throws | PASS | unit-run-log.txt |
| UT-RAG-01 | English detection | PASS | unit-run-log.txt |
| UT-RAG-02 | Sinhala detection | PASS | unit-run-log.txt |
| UT-RAG-03 | Singlish detection | PASS | unit-run-log.txt |
| UT-RAG-04 | Sinhala wins over Latin markers | PASS | unit-run-log.txt |
| UT-RAG-05 | Query whitespace normalization | PASS | unit-run-log.txt |
| UT-RAG-06 | Sinhala query normalization | PASS | unit-run-log.txt |
| UT-RAG-07 | Singlish query normalization | PASS | unit-run-log.txt |
| UT-RAG-08 | contains_sinhala | PASS | unit-run-log.txt |
| UT-RAG-09 | Retrieve fallback rule (scores < 0.20 keep top 3) | PASS | unit-run-log.txt — filter logic only, FAISS not called |
| UT-RAG-10 | Threshold scores are kept | PASS | unit-run-log.txt |
| UT-FL-01 | Missing CLI args → error JSON | PASS | unit-run-log.txt |
| UT-FL-02 | Model files exist | PASS | unit-run-log.txt |
| UT-FL-03 | Valid input returns predictedPrice | PASS | unit-run-log.txt |
| UT-FL-04 | Invalid district → error JSON | PASS | unit-run-log.txt |
| UT-FL-05 | Non-numeric quantity fails | PASS | unit-run-log.txt |
| UT-NEG-01 | Farmer cannot accept below minimum | PASS | unit-run-log.txt |
| UT-NEG-02 | Farmer can accept at/above minimum | PASS | unit-run-log.txt |
| UT-NEG-03 | Farmer counter below minimum invalid | PASS | unit-run-log.txt |
| UT-NEG-04 | Farmer valid counter accepted | PASS | unit-run-log.txt |
| UT-NEG-05 | Miller cannot accept above maximum | PASS | unit-run-log.txt |
| UT-NEG-06 | Miller counter above maximum invalid | PASS | unit-run-log.txt |
| UT-NEG-07 | Miller valid counter accepted | PASS | unit-run-log.txt |
| UT-NEG-08 | Accept price must equal current offer | PASS | unit-run-log.txt |
| UT-NEG-09 | Reject requires null price | PASS | unit-run-log.txt |
| UT-NEG-10 | Schema max_rounds and price bounds | PASS | unit-run-log.txt |
| UT-AUTH-01 | Missing token → 401 | PASS | unit-run-log.txt |
| UT-AUTH-02 | Invalid JWT → 401 | PASS | unit-run-log.txt |
| UT-AUTH-03 | Miller blocked from farmer route | PASS | unit-run-log.txt |
| UT-AUTH-04 | Farmer allowed on farmer route | PASS | unit-run-log.txt |
| UT-PRIV-01 | harvest.minimumAcceptablePrice select:false | PASS | unit-run-log.txt |
| UT-PRIV-02 | demand.maximumBuyingPrice select:false | PASS | unit-run-log.txt |
| UT-PRIV-03 | harvest status includes agreement_reached and sold | PASS | unit-run-log.txt |
| UT-PRIV-04 | demand status includes agreement_reached and fulfilled | PASS | unit-run-log.txt |

Summary: **47 executed, 47 PASS, 0 FAIL**

Not covered in this unit run (see report): FAISS retrieval, OpenAI answer generation, Ollama multi-round negotiation.
