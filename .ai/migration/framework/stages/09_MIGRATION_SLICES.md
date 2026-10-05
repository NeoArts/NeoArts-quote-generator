# 09 - Migrate complete workflow slices

## Purpose and applicability
Migrate complete workflow slices for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Slice plan, feature register, contracts, target foundation, characterization suite.

## Entry conditions
Next slice dependencies ready; its work package and acceptance criteria recorded.

Dependency: Normally stage 08; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Implement one bounded end-to-end slice with clear file ownership. Include permissions, errors, persistence, jobs, and external effects.
2. Compare old and new behavior using equivalent fixtures. Run applicable UI/interaction and visual checks, not only unit/API tests.
3. Inspect diffs and run relevant regressions. Use separate review for critical changes; require real evidence from workers.
4. Accept, repair within retry limits, or revert only this package. Update FEATURES.json with evidence and verified revision.
5. Repeat until required slices are implemented. New findings update scope and invalidate affected checks; do not hide omitted work.

## Required outputs
- Implemented slices, tests, data scripts where applicable, and work-package/run records.
- Feature-to-target evidence and updated state.

## Exit checks
- All required planned slices verified on compatible revisions.
- No known required gap silently deferred or marked passed.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/09_MIGRATION_SLICES/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
