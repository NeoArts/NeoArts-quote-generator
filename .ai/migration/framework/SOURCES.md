# Sources and design decisions

Reviewed 2026-10-05.

## Local foundations

`C:\Users\tparr\Documents\Obsidian Vault\Agentic Development\Templates`:

- 01_MIGRATION_GOAL: objective, target, constraints, success criteria.
- 02_BASELINE: preserve an untouched build/repository baseline.
- 03_ENGINEERING_RULES: evidence, scoped changes, security, data, validation.
- 04_SYSTEM_DISCOVERY: repository map and explicit unknowns.
- 05_BEHAVIORAL_DISCOVERY: capability/actor/dependency inventory.
- 06_FEATURES_DOCUMENTATION: workflow contracts, stable rule/test IDs, coordinator synthesis.
- 07_CHARACTERIZATION: executable characterization, runtime reconciliation, security/data review, decisions, readiness.

These are instruction templates, not completed project evidence. Earlier project-specific security defects and evaluation scores from the referenced conversation are not imported as facts about future projects.

## External references

- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents): incremental work, durable progress, feature registers, end-to-end checks.
- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps): explicit completion contracts and separated implementation/evaluation. This framework adapts those ideas for fidelity, not creative redesign or automatic scope expansion.
- [Patterns of Legacy Displacement](https://martinfowler.com/articles/patterns-legacy-displacement/): outcomes and incremental transition strategies.
- [Feature Parity](https://martinfowler.com/articles/patterns-legacy-displacement/feature-parity.html): the cost of discovering/reproducing legacy scope and the need for deliberate scope decisions.
- [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots): environment-controlled screenshot verification for web projects.

The exact stage sequence, defaults, and schemas are this framework's synthesis. No source establishes that unattended agents can guarantee correctness for arbitrary legacy systems.
