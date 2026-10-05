# 03 - Discover capabilities and workflows

## Purpose and applicability
Discover capabilities and workflows for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
System map, prior feature inventory, observed legacy UI/API/CLI/jobs, relevant usage evidence.

## Entry conditions
System boundary inventory available.

Dependency: Normally stage 02; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Inventory features by business workflow and actor, not only by code module. Assign stable FEATURE, WORKFLOW, RULE, and TEST IDs.
2. Trace reads/writes, validation, roles, side effects, failures, and dependencies across each journey.
3. Explicitly inspect imports/exports, editing tools, dragging/reordering, maps/canvas, shortcuts, attachments, notifications, and scheduled work when applicable.
4. Cross-check routes/menu entries/event handlers/jobs/integration endpoints against FEATURES.json. Do not remove capabilities based only on apparent disuse.

## Required outputs
- FEATURES.json entries and workflow documents.
- Entry-point-to-feature mapping; role matrix; confidence/unknown register.

## Exit checks
- All discovered surfaces mapped or explicitly unresolved.
- Critical workflow paths investigated with source/runtime evidence and clear uncertainty.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/03_WORKFLOW_DISCOVERY/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
