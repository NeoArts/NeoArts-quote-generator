# Stage catalog

Stages are evidence gates, not routine human checkpoints. Run per slice where useful; broad release checks still apply to the whole candidate. Stage 13 proposals can proceed while deployment is blocked.

| ID | Stage |
|---|---|
| 00 | [Initialize and recover context](stages/00_INITIALIZE.md) |
| 01 | [Preserve and measure baseline](stages/01_BASELINE.md) |
| 02 | [Discover the whole system](stages/02_SYSTEM_DISCOVERY.md) |
| 03 | [Discover capabilities and workflows](stages/03_WORKFLOW_DISCOVERY.md) |
| 04 | [Discover design and interactions](stages/04_UI_DESIGN_DISCOVERY.md) |
| 05 | [Establish the migration contract](stages/05_MIGRATION_CONTRACT.md) |
| 06 | [Characterize and verify legacy](stages/06_CHARACTERIZATION.md) |
| 07 | [Design target and transition](stages/07_TARGET_AND_TRANSITION.md) |
| 08 | [Build foundation and recreate UI](stages/08_FOUNDATION_AND_UI.md) |
| 09 | [Migrate complete workflow slices](stages/09_MIGRATION_SLICES.md) |
| 10 | [Audit completeness independently](stages/10_COMPLETENESS_AUDIT.md) |
| 11 | [Rehearse release and data migration](stages/11_RELEASE_REHEARSAL.md) |
| 12 | [Cut over and stabilize](stages/12_CUTOVER_AND_STABILIZATION.md) |
| 13 | [Propose improvements and hand over](stages/13_IMPROVEMENTS_AND_HANDOVER.md) |

A passing discovery stage may document limitations; affected implementation/release gates cannot pass while critical evidence remains blocked. Use STATE.json for stage status and milestone, and FEATURES.json for capability coverage.
