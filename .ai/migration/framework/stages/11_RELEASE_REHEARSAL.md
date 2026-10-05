# 11 - Rehearse release and data migration

## Purpose and applicability
Rehearse release and data migration for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Audited candidate, release criteria, data plan, deployment/rollback procedures, authorizations.

## Entry conditions
Required feature gaps closed; candidate version identified; isolated rehearsal environment available.

Dependency: Normally stage 10; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Run full relevant regression, end-to-end, visual, security, compatibility, and performance checks on the exact candidate.
2. Rehearse migration on representative sanitized data; compare counts plus domain invariants, relationships, ownership, and semantics.
3. Test backup restoration, restart/rerun/idempotency, cutover sequencing, and recovery with post-cutover writes where applicable.
4. Confirm monitoring, operational ownership, side-effect controls, and rollout/rollback thresholds.
5. Prepare a concrete release package: revision, scope, commands, impact, evidence, rollback, unresolved risks, and authorization needed.

## Required outputs
- Release-candidate verification and data reconciliation reports.
- Restore/rollback rehearsal evidence and reviewable release package.

## Exit checks
- All required release checks pass on candidate; no unresolved critical test/access limitation.
- Operational criteria defined and recovery rehearsed. Set READY_FOR_RELEASE only with this evidence.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/11_RELEASE_REHEARSAL/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
