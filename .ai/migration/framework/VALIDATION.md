# Framework validation

Run: 2026-10-05. All checks below passed on Windows with Python 3.12.10 using isolated temporary project folders.

- All JSON templates parse.
- All 14 stages contain the required execution contract sections.
- All Markdown file links resolve within the library.
- Initialization and fresh-record structural validation succeed.
- Repeated initialization refuses overwrite and leaves all existing records/application files unchanged.
- A VERIFIED claim without checks, revision, or evidence is rejected.
- Evidence references escaping the migration directory are rejected.
- Well-formed records with local evidence pass structural validation (not substantive verification).
- Premature migration-complete claims are rejected when stage gates are missing.
- Malformed JSON produces a validation failure.
- The installed project-local tool validates independently of the library command.

This validates package structure and initializer/validator behavior. No real application migration, browser interaction, deployment, or unattended runner was tested. The fictional smoke test is supplied for the first agent rehearsal, not reported as executed.
