# 05 - Establish the migration contract

## Purpose and applicability
Establish the migration contract for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Workflow evidence, UI/interaction catalog, constraints, existing behavioral contract, known defects.

## Entry conditions
Discovery adequate to define the next slice; critical uncertainty is visible.

Dependency: Normally stage 04; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Define desired observable behavior and exact acceptance criteria for each required feature.
2. Classify every capability preserve/change/retire/unresolved. Default unclassified scope to preserve pending decision.
3. Distinguish actual legacy behavior, known defects, security invariants, desired behavior, and approved deviations.
4. Version the behavioral and design contracts; link feature/rule/test IDs and decision references.
5. Define performance, compatibility, data, accessibility, visual, and operational acceptance for applicable scope. Do not invent product thresholds.

## Required outputs
- Behavioral contract, design/fidelity contract, and requirements-to-test matrix.
- Decision register and explicit scope dispositions.

## Exit checks
- Next slice has testable criteria and no blocking business ambiguity.
- Any removal/material change has an authorization or established policy reference.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/05_MIGRATION_CONTRACT/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
