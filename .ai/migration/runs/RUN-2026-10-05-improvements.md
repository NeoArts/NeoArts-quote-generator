# Run record RUN-2026-10-05-improvements (target snapshot src-sha256:02e314e48f4e3703)

- Scope: approved improvements (DECISION-012/013/014). Environment as RUN-2026-10-05 (Windows 11, Node 25.9.0, system Chrome via playwright-core 1.48.2).

| Check | Command | Expected | Observed | Classification | Evidence |
|---|---|---|---|---|---|
| Type-check + build | npm run build | exit 0 | exit 0; PDF JS chunk 409 kB (was 1,440 kB) + binary assets | executed test | console |
| Unit/characterization | npm test | all pass | 66/66 | executed test | evidence/target/unit-tests.txt |
| Browser workflows | node e2e/run.mjs | all pass | 25/25, three consecutive runs | executed test | evidence/target/e2e-results.json |
| PDF parity (default options) | node e2e/pdf-parity.mjs | identical to legacy except CreationDate/ID | identical | executed test | evidence/parity/pdf-parity.json |
| Live preview rendering | node e2e/preview-headed.mjs | real PDF visible in the preview pane | visible | observed runtime (headed Chrome) | evidence/target/25-pdf-preview-headed.png |

Notes: flaky first runs traced to test timing (dialogs closing one frame later; keyboard input during a drag gesture). Fixed by closing the provider dialog in the same render, an Escape rule based on DOM order, and polling assertions. Excel parity with legacy is intentionally broken by IMPROVEMENT-003.

## Re-run after removing URL import (DECISION-015)

npm run build: pass. npm test: 63/63. node e2e/run.mjs: 24/24 (W10 removed). Headed preview check re-captured (evidence/target/25-pdf-preview-headed.png).

## Redesign (DECISION-016)

npm run build: pass. npm test: 63/63. node e2e/run.mjs: 24/24, two consecutive runs. Screens: evidence/design/ (d01–d12 at 1440x900 and 390x844, headed live preview 25-pdf-preview-headed.png). Bug found and fixed during the redesign: the provider dialog opened from the dropdown was titled "Editar" for a new provider.
