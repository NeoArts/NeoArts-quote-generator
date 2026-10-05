# 07 - Design target and transition

## Purpose and applicability
Design target and transition for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Verified contracts, system dependencies, constraints, readiness and security/data findings.

## Entry conditions
Sufficient verified evidence to choose the next implementation boundary.

Dependency: Normally stage 06; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Choose architecture and transition strategy with explicit rationale; do not mandate microservices or a rewrite.
2. Prefer reversible slices where feasible. For coexistence define routing, compatibility, source of truth, write ownership, and duplicate-side-effect prevention.
3. Plan schema/file conversion, IDs, timezones/encoding, transactions, reconciliation, backfill/catch-up, cutover, and recovery where applicable.
4. Define rollout and rollback triggers, including what happens to new writes after cutover; a code rollback may not reverse data changes.
5. Order work packages, identify risks and approvals, and define release/observation criteria before deployment.

## Required outputs
- Architecture decisions, transition/data plan, dependency-ordered slice plan.
- Release/rollback strategy with explicit acceptance thresholds and authorization needs.

## Exit checks
- Every planned slice has scope, criteria, dependencies, and a recovery boundary.
- Consequential unresolved strategy choices block dependent implementation.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/07_TARGET_AND_TRANSITION/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
