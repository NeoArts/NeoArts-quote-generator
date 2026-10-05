# 00 - Initialize and recover context

## Purpose and applicability
Initialize and recover context for the project and applicable slice. Read MASTER.md and selected profiles.

## Inputs
PROJECT.json, AUTHORITY.json, applicable repository instructions, existing `.ai` records, legacy and target roots.

## Entry conditions
Read-only access to the project and framework; unknown consequential inputs may remain pending.

Dependency: None; inspect existing state first.

## Permitted actions
Follow AUTHORITY.json. Discovery may write migration records and execute authorized isolated checks; it does not authorize legacy application edits. Implementation changes are limited to the recorded work package.

## Procedure
1. Inventory and index existing state, tests, contracts, decisions, security findings, and baselines.
2. Confirm roots, application types, objective, target constraints, permissions, tools, and measurable budgets. Infer factual commands from evidence, not convention.
3. Check dirty files and active work. Reconcile stale state and select the first unverified dependency.
4. Record missing inputs with owners and exact resume conditions. Bootstrap never grants production authority.

## Required outputs
- Initialized project/state/authority records and INDEX.md.
- Artifact reconciliation and applicability report; missing-input register.

## Exit checks
- Project identity and roots verified; prior work accounted for.
- Tools and limits are understood; critical missing inputs block only dependent actions.

## Recovery and approval triggers
Repair bounded technical failures within PROJECT.json limits. Preserve evidence; mark affected work BLOCKED for missing access, consequential unresolved decisions, exhausted retries, or missing authority. Continue independent tasks. Prepare the concrete action/evidence before requesting missing approval. Never interpret a timeout as approval.

## State update and next selection
Save `stages/00_INITIALIZE/REPORT.md` using templates/STAGE.md, link outputs in INDEX.md, and update STATE.json with the verdict, evidence, blockers, and exact next action. Advance automatically only when the next dependency is satisfied. A NOT_APPLICABLE verdict requires documented evidence. New findings reopen affected prior gates.
