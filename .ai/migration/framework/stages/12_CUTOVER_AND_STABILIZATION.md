# 12 - Cut over and stabilize

## Purpose and applicability
Cut over and stabilize for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Approved release package, exact candidate, deployment/data authorizations, monitoring and recovery plan.

## Entry conditions
Stage 11 passed; real authorization covers the exact action/environment and remains valid.

Dependency: Normally stage 11; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Execute only the authorized rollout sequence. Record deployed versions and data transformation outcomes.
2. Reconcile data and verify critical journeys/integrations in the permitted production validation scope.
3. Observe operational metrics over the configured window and compare against rollback triggers.
4. If thresholds fail, execute authorized recovery or escalate the missing action; preserve incident evidence.
5. Do not retire legacy or delete backups merely because deployment succeeded.

## Required outputs
- Deployment and reconciliation records, operational observation evidence, incidents/recovery if any.
- Stabilization verdict and remaining retirement conditions.

## Exit checks
- Deployed candidate and required reconciliation/critical checks verified.
- Observation window and operational conditions pass; deployment alone is not stabilization.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/12_CUTOVER_AND_STABILIZATION/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
