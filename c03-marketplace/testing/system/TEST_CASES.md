# System / end-to-end test cases

These scenarios require a logged-in Farmer and Miller on the Expo client plus live MongoDB, RAG, FL, and Ollama. They were **not executed** in this PP2 evidence run because no authenticated marketplace session was available to this test harness.

| Test ID | Scenario | Preconditions | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|
| ST-01 | Farmer login | Registered farmer | Open app → login | Session opens on Farmer Home | — | NOT TESTED | — |
| ST-02 | Farmer creates harvest | Logged-in farmer | Add Harvest → submit | Harvest saved | — | NOT TESTED | — |
| ST-03 | FL predicted price appears | Harvest create | Check harvest/result | aiPredictedPrice shown | Unit/API FL returned 126.37 for kandy/nadu/maha/500; UI path not run | NOT TESTED (UI) | nfr-measurements.txt for API only |
| ST-04 | Farmer views matching partners | Available harvest | Open matching | All eligible millers, sorted by score, no top-5 cap | Algorithm unit-tested; UI not run | NOT TESTED (E2E) | matching.test.js |
| ST-05 | Farmer sends match request | Matches listed | Select miller → send | Request created | — | NOT TESTED | — |
| ST-06 | Miller accepts request | Pending request | Accept | negotiation_ready | — | NOT TESTED | — |
| ST-07 | Negotiation starts | negotiation_ready | Start negotiation | Agents run | — | NOT TESTED | — |
| ST-08 | Two agents negotiate | Running negotiation | Wait for rounds | History stored | — | NOT TESTED | — |
| ST-09 | Agreement reached | Compatible prices | Agents agree | status agreed | Validator unit-tested; live agents not run | NOT TESTED (E2E) | test_negotiation_validator.py |
| ST-10 | Harvest/demand → agreement_reached | Successful negotiation | Inspect listings | Status agreement_reached, not sold | Schema unit-tested | NOT TESTED (E2E) | auth-privacy.test.js |
| ST-11 | Manual Mark as Sold / Fulfilled | agreement_reached | Confirm in My Harvests / My Demands | sold / fulfilled | — | NOT TESTED | — |
| ST-12 | Sold/fulfilled cannot be matched again | sold harvest / fulfilled demand | Open matching / send request | Rejected / excluded | Matching queries status=available/open in source | NOT TESTED (E2E) | matching.controller.js |
| ST-13 | RAG English / Sinhala / Singlish | Logged-in user | Ask three questions | Language-appropriate answers | Language detection unit-tested; live RAG not called | NOT TESTED (E2E) | test_rag_language.py |
| ST-14 | Connected partner matching | Accepted connection + eligible listing | Open Connected Partners tab | Eligible connected partners shown, no score bonus | isConnected flag exists in matching controller | NOT TESTED (E2E) | matching.controller.js |
| ST-15 | Duplicate match request prevented | Existing request for pair | Send again | Skipped / already sent | Skip logic present in matchSelection.controller.js | NOT TESTED (E2E) | matchSelection.controller.js |
