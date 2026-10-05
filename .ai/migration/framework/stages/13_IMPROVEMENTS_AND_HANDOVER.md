# 13 - Propose improvements and hand over

## Purpose and applicability
Propose improvements and hand over for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Migration findings, gap audit, performance/usability evidence, decisions, operational results when available.

## Entry conditions
Enough verified migration evidence to propose useful improvements; proposals may start while release is blocked.

Dependency: Stages 09-11 provide proposal evidence; stage 12 is required for operational completion, not for drafting proposals.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Consolidate improvement opportunities captured throughout the project. Rank by user value, effort, risk, dependencies, and measurable success.
2. Separate required defects from optional improvements. For each proposal give evidence, alternatives, acceptance metrics, and authorization impact.
3. Implement proposals only if already authorized and within budget; use a new bounded work package and revalidate affected gates.
4. Produce build/run/test/operate/recover handover, final scope/evidence matrix, remaining risks, and maintenance ownership.
5. Define legacy retirement conditions: consumers/jobs/traffic removed, retention obligations, backup/archive verification, rollback-window expiry, and explicit authorization. Execute only if authorized.

## Required outputs
- Ranked improvements/PROPOSALS.md, operating guide, final migration report, and retirement plan.
- Recorded completion milestone with remaining blockers and next owner/action.

## Exit checks
- Proposals and handover complete with evidence; optional changes did not silently alter accepted scope.
- MIGRATION_COMPLETE requires stages 00-12 applicable gates as well; LEGACY_RETIRED requires separate retirement evidence.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/13_IMPROVEMENTS_AND_HANDOVER/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
