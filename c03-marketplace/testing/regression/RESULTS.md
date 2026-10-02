# Bug fixes and regression

Bugs below are taken from git history on this repo, not invented.  
E2E re-runs after those fixes were **not** performed in this session. Related unit/schema/source checks that *were* executed are listed.

| Bug ID | Description | Evidence it existed | Fix (commit) | Test performed this session | Regression result |
|---|---|---|---|---|---|
| BUG-01 | Duplicate match requests for the same harvest+demand pair | Commit `5309445` “Implement existing request checks in matching logic”; skip reason still in `matchSelection.controller.js` | Existing-request lookup; skip with “already exists” | Source still contains skip path. No live duplicate-send. | Implementation PRESENT. E2E **NOT TESTED** |
| BUG-02 | Matching results limited to top 5 | Prior `includeFocusedMatch` used `slice(0, 5)`; commit `51e7469` added all matches + connected tab | Return all eligible matches; `isConnected` flag | Grep of `matching.controller.js`: no `slice(0, 5)`. `isConnected` present. Scoring unit tests PASS | Top-5 limiter absent in current code. UI tab **NOT TESTED** |
| BUG-03 | Successful negotiation marked harvest `sold` automatically | Commit `af081f5` “Add agreement_reached status…” | Negotiation success → `agreement_reached`; sold only via Mark as Sold | Schema enum unit tests PASS (`agreement_reached` and `sold` both present) | Schema PRESENT. Live negotiation **NOT TESTED** |
| BUG-04 | Need to mark harvest sold / demand fulfilled manually after trade | Commit `d91b741` | PATCH sold / fulfilled endpoints | Not invoked against API this session | **NOT TESTED** |
| BUG-05 | Connected partners not visible on matching screen | Commit `51e7469` | `isConnected` on match payload + Connected Partners tab | Flag present in controller | **NOT TESTED** (UI) |
| BUG-06 | Expo/backend host resolution | Commit `00d4f0c` (API host resolution) | Dynamic API host | **NOT TESTED** | — |

No product bug was **fixed in this testing task**. Functionality was not changed.

Related unit regressions that did run after inspecting those fixes:

- Matching score formula unchanged (14 unit tests PASS)
- Auth 401/403 still works (middleware unit + live 401 probes PASS)
- FL prediction still returns a price (CLI + HTTP PASS)
