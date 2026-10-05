# Deployment record — 2026-10-05

- Target: GitHub Pages, https://neoarts.github.io/NeoArts-quote-generator/ (same origin as the legacy app, neoarts.github.io).
- Repository: NeoArts/NeoArts-quote-generator (public), branch main. Created and uploaded by the user with the commands prepared by the coordinator (the session hook blocks repository writes by the agent).
- Backend: hosted Supabase project ymnudgatqbijnkqrgqpn (user-created). Schema applied by the user via SQL Editor (init); hardening script handed to the user (supabase/migrations/20261005010000_hardening.sql).
- Authorization: user messages 2026-10-05 — "what can we do to deploy it", "Ok good" (public repo under NeoArts), "Give me the commands", then "Done" after running them.
- Workflow runs: 37356776800 failure (type-check included a test importing the legacy checkout, absent in CI) -> fixed (tsconfig includes src only; actions v5, Node 22), CI simulated locally in a clean copy -> run 37357535580 success (54 s).
- Live verification (2026-10-05T18:45:28.082963+00:00): e2e/live-smoke.mjs — login screen renders, Supabase auth reachable (wrong-password message), fonts and assets 200, no console/CSP/network errors. Screenshot: evidence/cloud/live-login.png.
- Hosted security check: anonymous client sees 0 quotes/providers, anonymous insert blocked, anonymous image download blocked.
- Not verified on the live site: signed-in workflows (email confirmation is on; needs the user's account). Equivalent workflows verified against local Supabase: evidence/cloud/cloud-results.json (8/8), rls-check.txt (13/13).
- Rollback: disable Pages or revert the commit; legacy app remains live and shares the browser-storage origin.
