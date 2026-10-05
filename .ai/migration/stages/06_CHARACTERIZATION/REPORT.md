# Stage report: 06_CHARACTERIZATION Characterize and verify legacy

## Scope and applicability
Legacy NeoArts-WebTools@69f5c25 (clean tree except untracked .migration-framework/); target snapshot src-sha256:abd2b5213a88c118; profile web; scope per DECISION-001/002 (quote creator + embedded providers).

## Inputs and entry checks
Legacy ProductCalc.ts; legacy runtime.

## Work performed
Characterization tests import the legacy calc module read-only and compare it with the target for 3 provider sets × 7 rows (individual and grouped) and 7 edit kinds per row (44 tests). Runtime values from the legacy capture asserted in unit and E2E tests. Legacy PDF/Excel/JSON outputs captured for parity.

## Outputs and evidence
`tests/calc.test.ts`, `evidence/target/unit-tests.txt`, `evidence/legacy/capture-log.json`.

## Exit checks
| Check | PASS / FAIL / BLOCKED / N/A | Evidence | Limitation or reason |
|---|---|---|---|
| Critical rules characterized against legacy | PASS | evidence/target/unit-tests.txt |  |
| Outputs captured | PASS | evidence/legacy/downloads/ |  |

## Deviations and decisions
None.

## Recovery and next action
Stage 07.

## Verdict
PASSED
