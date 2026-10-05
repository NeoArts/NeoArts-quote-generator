# 08 - Build foundation and recreate UI

## Purpose and applicability
Build foundation and recreate UI for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Target/transition plan, first-slice contract, design references, legacy test adapter.

## Entry conditions
Local target edits authorized; baseline and rollback boundary established.

Dependency: Normally stage 07; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Set up reproducible target build/test/start and essential configuration without embedding secrets.
2. Implement persistence/auth boundaries required by the first journey; preserve security invariants.
3. Recreate shared navigation, layout, terminology, and component states from the design contract.
4. Implement one real vertical journey through UI/interface, rules, storage, and relevant side effects. Avoid a mock-only shell as completion evidence.
5. Run behavior, visual/interaction, and regression checks; review the actual application.

## Required outputs
- Working foundation, pipeline, shared UI/interface components, first integrated journey.
- Evidence against the first journey contract and documented remaining scope.

## Exit checks
- Representative end-to-end journey works with the selected data path.
- Design/interaction contract checks pass for implemented scope; no fake completion of other features.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/08_FOUNDATION_AND_UI/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
