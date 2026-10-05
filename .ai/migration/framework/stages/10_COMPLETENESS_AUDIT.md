# 10 - Audit completeness independently

## Purpose and applicability
Audit completeness independently for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Legacy sources/runtime, target application, feature register, entry-point inventories, contracts.

## Entry conditions
Candidate feature implementation available for the audited scope.

Dependency: Normally stage 09; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Revisit the legacy independently of the implementation checklist to rediscover routes, controls, handlers, roles, jobs, imports/exports, and integrations.
2. Cross-check legacy surface -> feature -> contract -> target -> executed evidence. Investigate orphan surfaces in both directions.
3. Exercise hidden and stateful behavior explicitly: drag/drop, map editing, imports, cancellation, undo where present, reload persistence, and permission variants.
4. Record new gaps with stable IDs and reopen stage 09 or earlier discovery/contract stages.
5. Require evidence for intentional exclusions. Report audited scope and unknowns; do not claim omniscient completeness.

## Required outputs
- Completeness matrix and independent gap report.
- Remediation packages and explicit scope exclusions/decisions.

## Exit checks
- Zero unexplained discovered surfaces and zero unresolved required feature gaps.
- New required work is implemented and verified before this gate passes.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/10_COMPLETENESS_AUDIT/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
