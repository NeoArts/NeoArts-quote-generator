# Risks and unknowns

| ID | Fact, risk, or unknown | Evidence | Affected scope | Severity | Owner | Next investigation | Blocking gate | Status |
|---|---|---|---|---|---|---|---|---|
| R-001 | Browser data is per-origin. Quotes/providers carry over automatically only if the target is served from the legacy origin (https://neoarts.github.io). Otherwise quotes move via JSON export/import; providers have no export path. | src/lib/db.ts, src/lib/providers.ts; legacy astro.config.mjs (site neoarts.github.io) | FEATURE-023 | High | user | Choose deployment origin (AUTHORITY pending request) | 12 | OPEN |
| R-002 | URL import depends on third-party CORS proxies and catalogospromocionales.com markup; verified only with mocked network. | e2e/run.mjs W10 | FEATURE-019 | Medium | — | Manual live check when deployed | none | CLOSED (feature removed, DECISION-015) |
| R-003 | Clipboard image read (📋) needs browser permission/HTTPS; verified in Chrome with granted permission only. | E2E W9 | FEATURE-017 | Low | — | Firefox/Safari manual check | none | OPEN |
| R-004 | Supported environment actually tested: Windows 11, Chrome (system install) via playwright-core 1.48, viewports 1440x900 and 390x844. Other browsers untested. | evidence/target/e2e-results.json | all | Low | — | Cross-browser smoke | none | OPEN |
| R-005 | No git repository in the target; revisions identified by source snapshot hash (FEATURES.json source_revision). | — | records | Low | user | `git init` when user wants VCS | none | OPEN |
| R-006 | Legacy calculation quirks preserved intentionally (DECISION-011); users may perceive them as bugs. | tests/calc.test.ts | FEATURE-011 | Low | user | See improvements/PROPOSALS.md | none | ACCEPTED |
| R-007 | Legacy app was run from an isolated copy (scratch dir, `npm ci --ignore-scripts`), not from its own folder; puppeteer post-install skipped (unused by quote feature). | evidence/legacy/capture-log.json | baseline | Low | — | — | none | CLOSED |
