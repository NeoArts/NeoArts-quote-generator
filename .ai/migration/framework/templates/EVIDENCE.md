# Evidence record format

Save records under `evidence/` or `runs/`; reference them with paths relative to `.ai/migration/`.

- Evidence ID, timestamp with timezone, author/tool, and feature/test/stage IDs.
- Legacy version and/or target revision. If no Git exists, record a reproducible source snapshot identifier.
- Environment: operating system, runtime, browser/device, viewport/fonts where relevant, dependencies, sanitized data fixture, and configuration excluding secrets.
- Preconditions, exact command or user procedure, expected outcome, observed outcome, and exit status where available.
- Relevant raw output, screenshot/recording, state reconciliation, timing, and links to related local files.
- Classification: observed runtime / executed test / static inference / simulated / blocked / external reference.
- Known limitations, masking/normalization, excluded cases, and reproducibility instructions.

Preserve original baselines. Keep legacy and target captures separate. Normalize nondeterminism only with a documented reason and without hiding meaningful differences. Use isolated recipients/services for notifications, payments, webhooks, and other side effects. A mock result does not establish the live integration contract.

Do not save credentials or unnecessary personal data. Record external URLs and relevant observations in a local evidence note; the structural validator checks the note's existence, not the truth of the external claim.
