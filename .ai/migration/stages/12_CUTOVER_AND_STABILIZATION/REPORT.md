# Stage report: 12_CUTOVER_AND_STABILIZATION Cut over and stabilize

## Scope and applicability
Production deployment of dist/.

## Inputs and entry checks
Stage 11 passed. No deployment authorization, repository/remote, or hosting origin was given.

## Work performed
None executed. Proposal: publish dist/ to GitHub Pages under https://neoarts.github.io/<repo>/ (same origin as legacy, so existing quotes and providers appear automatically). Once a repo exists: `npm run build && npx gh-pages -d dist`. Rollback: keep legacy live; revert the Pages branch.

## Outputs and evidence
AUTHORITY.json pending_requests[0].

## Exit checks
| Check | PASS / FAIL / BLOCKED / N/A | Evidence | Limitation or reason |
|---|---|---|---|
| Authorized deployment evidenced | BLOCKED | AUTHORITY.json | needs explicit authorization and target repo/origin |
| Stabilization window | BLOCKED | AUTHORITY.json | follows deployment |

## Deviations and decisions
—

## Recovery and next action
Resume condition: user authorizes deployment and names the repository/origin. Then deploy, run e2e/run.mjs against the live URL (E2E_BASE), record evidence/deployment-record.md.

## Verdict
BLOCKED
