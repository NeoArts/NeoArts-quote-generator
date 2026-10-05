# 04 - Discover design and interactions

## Purpose and applicability
Discover design and interactions for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Feature/workflow inventory, running legacy if available, assets/styles, supported roles/devices.

## Entry conditions
UI applicability established; original application access or explicit limitation recorded.

Dependency: Normally stage 03; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Enumerate screens and states: normal, loading, empty, error, permission-denied, editing, confirmation, and unsaved changes.
2. Capture controlled screenshots/recordings with role, viewport/device, source version, and fixture. Capture layout, typography, spacing, terminology, icons/assets, and navigation.
3. Document interaction contracts: dragging/drop targets, hover/focus, keyboard, gestures, selection, save/cancel, map/canvas editing, and imports.
4. Describe familiarity/fidelity requirements and proposed measurable tolerances; resolve consequential subjective choices before implementation.
5. For non-UI applications, document N/A evidence and route interface equivalence to stages 05/06. Missing UI tooling is not N/A.

## Required outputs
- Screen/state catalog, navigation map, legacy visual evidence, design token/asset catalog.
- Interaction contracts and initial fidelity rubric.

## Exit checks
- Required screens/states/interactions have reference evidence or explicit blockers.
- Baseline evidence originates from legacy; target-generated images are never legacy baselines.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/04_UI_DESIGN_DISCOVERY/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
