# Optional unattended runner integration

The package does not install a runner. A compatible agent runtime may execute multiple work packages in one session; an external runner is needed to restart after process exit or session failure.

The runner must:

1. Bind to the correct project root and enforce permitted directories, tools, environments, network access, and spending outside the model's own instructions.
2. Acquire a per-project single-coordinator lock. Do not launch a second master into the same state. Worker concurrency needs explicit ownership.
3. Start the agent with MASTER.md and the persisted records, not a reconstructed conversation alone.
4. Allow checkpointing and atomic state replacement. Preserve logs and the last valid state after a crash. A stale lock requires checking the owning process, not blindly deleting it.
5. Resume only RUNNING/NOT_STARTED work within authorization and budgets. HUMAN_REQUIRED, BUDGET_EXHAUSTED, and BLOCKED require their recorded resume conditions; a timer is not approval.
6. Enforce configured per-run and total budgets, with bounded crash retries and backoff. If spending cannot be measured, report that limitation and honor the remaining measurable limits.
7. Deliver a concise event on meaningful completion, failure, or required action. Do not spam unchanged status.
8. Never promote READY_FOR_RELEASE to DEPLOYED by inference. Check actual release evidence.

A runner integration should be tested against interruption, duplicate launch, missing credentials, exhausted budgets, corrupted state, and a failed release gate before unattended production use. These are requirements for a future integration, not verified capabilities of this package.
