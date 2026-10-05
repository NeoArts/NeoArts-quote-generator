# 01 - Preserve and measure baseline

## Purpose and applicability
Preserve and measure baseline for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Initialized configuration, actual legacy checkout/runtime, existing tests and deployment information.

## Entry conditions
Stage 00 complete for this scope; isolated execution allowed.

Dependency: Normally stage 00; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Record source revision, branch/dirty state, dependencies, build/start commands, current tests, and known failures without fixing them first.
2. Capture representative runtime, interfaces, data shape/invariants, and performance where applicable. Stage 04 expands visual coverage.
3. Use sanitized fixtures and isolated side-effect adapters. Document unavailable services or environments.
4. Store baseline evidence immutably and describe how to reproduce it. Later baseline additions must identify their source version.

## Required outputs
- Baseline manifest and run records under evidence/baseline/.
- Startup/test recipe; failure classification and environment limitations.

## Exit checks
- Baseline revision and data inputs are reproducible or their limits explicit.
- Existing failures are distinguished from future regressions; no invented pass results.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/01_BASELINE/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
