# 02 - Discover the whole system

## Purpose and applicability
Discover the whole system for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
Baseline, source tree, manifests, deployment definitions, existing repository map.

## Entry conditions
Stage 01 baseline captured to the extent access permits.

Dependency: Normally stage 01; reuse valid prior evidence and reopen affected dependencies as needed.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Map entry points, modules, persistence, schemas, triggers, jobs, identity boundaries, configuration, and deployments.
2. Map external producers/consumers and database/file integrations, including unofficial operational interfaces.
3. Link each observation to code/config/runtime evidence; flag uncertainty.
4. Do not redesign or edit legacy implementation during this discovery stage.

## Required outputs
- System/repository map and dependency graph.
- Interface/data/job inventory with evidence and unknowns.

## Exit checks
- All identified boundaries and entry-point categories have investigation status.
- Unresolved boundaries have explicit risk and downstream blocking conditions.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/02_SYSTEM_DISCOVERY/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
