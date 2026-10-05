# Test the framework in a new project

## 1. Choose the inputs

Identify the legacy checkout, the target workspace, the migration objective, and the application profile (`web`, `desktop`, `mobile`, `service`, or `batch`). Use `generic` if the type is uncertain; the coordinator must resolve applicability during initialization. For a mixed application, add additional profiles to PROJECT.json.

The target directory must already exist. It can be an empty folder or an existing repository. Initialization does not create a Git repository, alter application code, or execute application commands.

## 2. Initialize from PowerShell

Replace the example paths and objective before running:

```powershell
python 'C:\Users\tparr\Documents\TOMAS\PERSONAL\Migration\tools\migration.py' init `
  --project-root 'C:\Projects\NewApp' `
  --legacy-root 'C:\Projects\LegacyApp' `
  --profile web `
  --objective 'Migrate LegacyApp to the chosen target stack while preserving required behavior and interface familiarity.'
```

Python 3.10 or newer is required. No third-party packages are needed. Initialization refuses to replace an existing `.ai/migration` directory. If migration records already exist elsewhere in `.ai`, the coordinator indexes and reconciles them at stage 00 rather than replacing them.

For an in-place migration, both paths may be the same. The coordinator must establish a baseline and an isolated change strategy before editing code.

## 3. Open the target project in your coding agent

Paste this prompt, adjusting the target outcome if needed:

```text
Read .ai/migration/framework/MASTER.md and operate as this project's migration coordinator.
Read applicable repository instructions, then .ai/migration/PROJECT.json, AUTHORITY.json,
STATE.json, INDEX.md, and existing migration artifacts before doing new work.

Start at the earliest unverified dependency and execute the applicable framework stages.
Preserve required behavior, interface familiarity, and complete workflows. Inspect the old
application directly when tools and access permit; explicitly report anything you cannot verify.
Use existing evidence and decisions without repeating completed discovery unnecessarily.

Continue through authorized work, updating durable state after each work package. Independently
verify completion. Respect the configured budget and permissions; ask only for missing inputs or
decisions that actually block the next dependent action. Continue independent work while waiting.
Do not stop after merely planning. Do not claim deployment or migration completion without the
corresponding evidence. Generate the final ranked improvement proposals as an official stage.
```

The coordinator discovers build/start/test commands and records them; it must not guess a target stack or product decision when none was specified. If useful work can proceed before a decision, it should proceed.

## 4. Inspect progress

- `STATE.json`: active stage, blockers, current work package, and next action.
- `FEATURES.json`: discovered capabilities and verification status.
- `stages/`: reports, gate results, and linked evidence.
- `DECISIONS.md`: preserved decisions, changed behavior, and approvals.
- `improvements/PROPOSALS.md`: ranked opportunities discovered during migration.

Structural validation:

```powershell
python .ai/migration/framework/tools/migration.py validate --project-root .
```

Validation checks record structure and local evidence references. It does not run application tests, assess screenshots, approve scope, or certify migration success.

## 5. Run the optional smoke test first

Follow [examples/SMOKE_TEST.md](examples/SMOKE_TEST.md) to rehearse discovery and omission detection without a real application. The simulated example is intentionally incapable of proving runtime parity. A good coordinator identifies that limitation and does not mark it migration-complete.

## Resume an interrupted run

Reopen the same target project and say: "Resume using .ai/migration/framework/MASTER.md. Reconcile STATE.json with actual files, revisions, and evidence before continuing."

Do not rerun initialization. Do not copy blank templates over project records. Before upgrading the framework, checkpoint the current project state and review the changes.
