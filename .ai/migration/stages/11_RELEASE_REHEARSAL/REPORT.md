# Stage report: 11_RELEASE_REHEARSAL Rehearse release and data migration

## Scope and applicability
Static SPA release candidate = dist/ built from snapshot src-sha256:abd2b5213a88c118. No server or database conversion; data stays in browser storage with the legacy schema.

## Inputs and entry checks
Stages 09–10 passed.

## Work performed
- Clean-room rehearsal: fresh copy, `npm ci` from lockfile (259 packages), `npm run build` (pass), `npm test` (54/54).
- Candidate exercised from `vite preview` (production bundle, relative base): 18/18 workflows; PDF/Excel/JSON parity with legacy.
- Data rehearsal: E2E seeds legacy-format IndexedDB/localStorage records and the target reads/edits them unchanged; legacy-exported JSON is identical to target JSON (W3/W4 parity).
- Rollback: legacy app untouched and deployable; same schema, so switching back keeps data.

## Outputs and evidence
runs/RUN-2026-10-05.md, evidence/target/e2e-results.json, evidence/parity/*.json.

## Exit checks
| Check | PASS / FAIL / BLOCKED / N/A | Evidence | Limitation or reason |
|---|---|---|---|
| Reproducible build from lockfile | PASS | runs/RUN-2026-10-05.md |  |
| Full checks on exact candidate | PASS | evidence/target/e2e-results.json | Chrome only |
| Data compatibility rehearsed | PASS | E2E W2–W5 | automatic carry-over only on same origin (R-001) |
| Rollback path | PASS | legacy unchanged |  |

## Deviations and decisions
None.

## Recovery and next action
Stage 12 needs deployment authorization (AUTHORITY.json pending_requests).

## Verdict
PASSED
