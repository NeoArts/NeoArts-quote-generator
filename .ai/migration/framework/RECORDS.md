# Project records and update rules

All paths in this document are relative to the initialized `.ai/migration/` directory.

## PROJECT.json

Record factual project configuration and explicitly agreed constraints. Null means unknown. Discover safe facts from source and runtime. A target stack, changed business rule, paid infrastructure choice, or undefined product acceptance threshold may need a user decision. Preserve existing authorization; do not turn every null into a blanket stop.

The default session limits are 10 work packages, 120 minutes, and 3 repair attempts per package. They are configurable limits, not performance estimates. Record budget changes and follow any stronger user/runtime limit. Null total cost is unspecified, not unlimited spending authorization.

## AUTHORITY.json

`allowed_actions` describes default local work. `conditional_actions` needs applicable existing authorization. `grants` contains actual authorizations using the documented grant format. `pending_requests` holds concrete requests with action, environment, scope, evidence package, and the decision needed. Never store secret values or treat an agent-authored grant as human authorization. Tool permissions remain binding.

## STATE.json

Run status: `NOT_STARTED`, `RUNNING`, `HUMAN_REQUIRED`, `BLOCKED`, `BUDGET_EXHAUSTED`, or `COMPLETE`.

Stage status: `NOT_STARTED`, `RUNNING`, `PASSED`, `BLOCKED`, or `NOT_APPLICABLE`. Only stage 04 may be wholly N/A; other stages adapt to the application's scope. For example, an application without database conversion still needs a release rehearsal, and a headless service still needs a working foundation.

Milestone: `NONE`, `READY_FOR_RELEASE`, `DEPLOYED`, `MIGRATION_COMPLETE`, or `LEGACY_RETIRED`.

For a passing/N/A stage, fill `report` and `evidence` with existing local relative paths. For N/A also fill `reason`. Set `active_stage`, `active_work_package`, `revision`, timestamp, `next_action`, blockers, and budget usage when checkpointing. A blocker should include an ID, affected scope, evidence, owner, and exact resume condition.

When claiming `DEPLOYED`, add `deployment_evidence: ["evidence/deployment-record.md"]` using the real file. For `LEGACY_RETIRED`, add `retirement_evidence` with real authorization/execution evidence. `COMPLETE` run status requires a migration-complete or legacy-retired milestone. A project blocked before deployment stays at its last evidenced milestone.

Stage 13 proposals may pass before stage 12. This does not permit a migration-complete milestone until applicable preceding gates pass. For incremental rollouts, record per-slice gates in reports/work packages; project milestone represents the whole contracted scope.

## FEATURES.json

Add feature objects based on `framework/templates/FEATURE.json`; never replace the whole register with a blank template. Use stable IDs. Disposition is `preserve`, `change`, `retire`, or `unresolved`.

Feature status is `DISCOVERED`, `SPECIFIED`, `IMPLEMENTING`, `IMPLEMENTED`, `VERIFIED`, `BLOCKED`, or `RETIRED`. IMPLEMENTED means code exists; VERIFIED means relevant acceptance checks actually passed. Keep feature status and disposition distinct.

- VERIFIED requires acceptance criteria, test IDs, target evidence, and a verified source revision/snapshot ID.
- Change/retire requires a decision ID linked to real authorization or established policy.
- RETIRED means that capability was deliberately excluded from target scope; it does not mean the whole legacy system was decommissioned.
- A required feature deferred for later remains unfinished. Do not use retirement to hide it.
- Legacy evidence, target evidence, static inference, and simulated fixtures must be labeled separately.

## Durable updates

Use one coordinator to update shared registers. Workers write their own work packages and evidence. Validate changed JSON before replacing the previous state atomically. Preserve the prior valid checkpoint and history through the project's existing version-control conventions; do not initialize or rewrite Git history without checking repository instructions.

The validator catches malformed records, missing files, and some inconsistent completion claims. It cannot authenticate approval, interpret test evidence, discover omitted features, validate thresholds, or prove a release safe. The coordinator and independent verification remain responsible for those judgments.
