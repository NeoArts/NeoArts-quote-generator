# 06 - Characterize and verify legacy

## Purpose and applicability
Characterize and verify legacy for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Versioned contracts, legacy baseline, fixtures, critical workflow/test candidates.

## Entry conditions
Expected behavior defined; safe test environment available for runnable cases.

Dependency: Normally stage 05; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Build an isolated characterization adapter that preserves original data and suppresses real external side effects.
2. Execute deterministic, runtime, database, integration, and UI checks as applicable; capture outputs and persistent state.
3. Reconcile runtime versus source/document expectations. Classify legacy defects instead of silently weakening tests.
4. Review security boundaries and data integrity: ownership, authorization, validation, path/file access, concurrency, transactions, referential integrity, and retries as applicable.
5. Record readiness per slice. Blocked tests remain blocked and must be resolved before affected release acceptance.

## Required outputs
- Characterization plan/harness/tests and actual result records.
- Mismatch, security, data-integrity, and migration-readiness reports.

## Exit checks
- Critical slice expectations have executed evidence or a blocking status.
- Cleanup/isolation proven; no unsafe production characterization.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/06_CHARACTERIZATION/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
