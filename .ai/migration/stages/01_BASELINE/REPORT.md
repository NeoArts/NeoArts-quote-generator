# Stage report: 01_BASELINE Preserve and measure baseline

## Scope and applicability
Legacy NeoArts-WebTools@69f5c25 (clean tree except untracked .migration-framework/); target snapshot src-sha256:abd2b5213a88c118; profile web; scope per DECISION-001/002 (quote creator + embedded providers).

## Inputs and entry checks
Legacy has no node_modules; running it in place would modify the legacy folder.

## Work performed
Copied legacy sources to an isolated scratch dir, `npm ci --ignore-scripts`, `astro build` (9 pages, exit 0), `astro preview` on :4321. Captured 19 screens, Excel/JSON/PDF downloads, calculated values, dialogs.

## Outputs and evidence
`evidence/legacy/*.png`, `evidence/legacy/capture-log.json`, `evidence/legacy/downloads/`, `evidence/legacy/legacy-capture.js`, `evidence/legacy/fixture.js` (sanitized fixture).

## Exit checks
| Check | PASS / FAIL / BLOCKED / N/A | Evidence | Limitation or reason |
|---|---|---|---|
| Legacy runs and is measured | PASS | evidence/legacy/capture-log.json | Chrome, 1440x900, Windows 11 |
| Legacy baseline untouched | PASS | git status of legacy | runtime from isolated copy |

## Deviations and decisions
None.

## Recovery and next action
Stage 02.

## Verdict
PASSED
