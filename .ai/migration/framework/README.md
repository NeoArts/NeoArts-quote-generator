# Autonomous Migration Framework

Version 1.0.0 | 2026-10-05

A reusable, evidence-driven process for migrating legacy applications. It covers discovery, interface fidelity, behavioral characterization, implementation, feature-gap auditing, release, stabilization, and improvement proposals.

Start with [QUICKSTART.md](QUICKSTART.md). The coordinator follows [MASTER.md](MASTER.md), the [stage catalog](STAGES.md), and the selected application [profile](profiles/README.md).

## What this package provides

- Fourteen stage instructions with inputs, actions, outputs, exit checks, recovery, and approval rules.
- Project configuration, authorization, state, feature, decision, work-package, and evidence templates.
- A Python standard-library initializer and structural validator.
- A copyable launch prompt and a simulated smoke-test project.
- Local, project-owned instructions and state under `.ai/migration/` after initialization.

This is an agent-executable playbook, not an installed background service. Claude Code or another capable coding agent executes its instructions using the tools available in that project. Unattended continuation after a process exits requires an external runner; [RUNNER_CONTRACT.md](RUNNER_CONTRACT.md) defines that integration. No runner, cloud resources, or production permissions are installed by this package.

See [RECORDS.md](RECORDS.md) for state/status semantics and [VALIDATION.md](VALIDATION.md) for the checks actually executed.

## Package layout

`MASTER.md` is the coordinator entry point. `stages/` holds procedures; `templates/` holds reusable record formats; `profiles/` adapts evidence requirements to application types. `tools/migration.py` initializes and validates project records. `examples/` contains a deliberately incomplete rehearsal project.

The initializer copies the framework into a project's `.ai/migration/framework/`. Project-specific records live beside that copy. Editing the original library does not silently change a running migration. Upgrade the project copy deliberately, with a recorded diff and version change.

## Principles

1. Account for every discovered capability, including hidden interactions and machine workflows.
2. Preserve required behavior and interface familiarity; explicitly authorize deviations.
3. Verify in the running application where possible. Source inspection alone does not establish runtime equivalence.
4. Keep implementation, verification, and operational completion separate.
5. Preserve history and existing work. Never invent successful evidence.
6. Use scoped, reversible work and selective delegation; do not create unnecessary agents.

## Provenance

Adapted from the user's seven Obsidian migration templates (`01_MIGRATION_GOAL.md` through `07_CHARACTERIZATION.md`) and reported migration lessons: omitted design recreation, drag-and-drop, map editing, import flows, and a valuable post-migration proposal stage. The original templates were inspected but not modified. Completed project artifacts were not present in that template folder and are not represented here as verified facts.

See [SOURCES.md](SOURCES.md) for the research informing this design. The framework's exact gates and record formats are proposed engineering policy, not claims that the cited sources guarantee autonomous migration success.
