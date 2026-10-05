# Improvement proposals (ranked)

Generated at stage 13 from evidence gathered during the migration. Proposals do not authorize implementation; each needs a user decision. Ranking = user value × confidence ÷ effort/risk.

| Rank | ID | Proposal | Evidence | Value | Effort / risk | Authorization |
|---|---|---|---|---|---|---|
| 1 | IMPROVEMENT-001 | **Export/import providers (JSON)** next to quote import, or a full backup (quotes + providers) file. | Providers live only in localStorage; no export in legacy or target (R-001). Required to move data if the app is not served from neoarts.github.io. | High: avoids losing provider discount tables on a new origin/browser | S, low risk | IMPLEMENTED (DECISION-012) |
| 2 | IMPROVEMENT-002 | **Suggest next quote number from IndexedDB** (max numeric `number` + 1). | Legacy reads obsolete localStorage `quotes`, so it never suggests (DECISION-006). | Medium: fewer numbering mistakes on the "REF: VPM-" reference | XS, low | IMPLEMENTED (DECISION-012) |
| 3 | IMPROVEMENT-003 | **Fix Excel columns**: "Precio con descuento" → costOff, "Costo de marca" → markCost; drop the hidden image object column. | `src/lib/exporters.ts` mapping copied from legacy (DECISION-011); parity file `evidence/parity/excel-parity.json`. | Medium: exported sheets currently mislabel two columns | XS; changes an external file format | IMPLEMENTED (DECISION-012) |
| 4 | IMPROVEMENT-004 | **Consistent recalculation**: recompute all rows when a provider's discounts change, and recompute the previous group when a row leaves it. | DECISION-011 quirks; legacy shows stale costOff/sellPrice until a row is edited. | Medium: prevents quoting stale prices | S; changes stored computed values | IMPLEMENTED as user rule: frozen terms + notice (DECISION-013) |
| 5 | IMPROVEMENT-005 | **Quote totals and margin summary** under the table (Σ valor total, Σ costo total, utilidad). | Not present in legacy; users compute manually. | Medium | S, additive | IMPLEMENTED (DECISION-012) |
| 6 | IMPROVEMENT-006 | **Image from file / drag-and-drop** in the image box, in addition to paste and 📋. | Paste-only today (FEATURE-017); clipboard API needs permissions (R-003). | Medium on non-Chrome browsers | S, additive | DECLINED by user (paste-only is enough for now) |
| 7 | IMPROVEMENT-007 | **Editable PDF letter fields** (city, validity, payment terms, production time) stored per quote, defaulting to current text; option to print the quote date. | `src/pdf/generateQuote.ts` hardcodes "Bogotá", "3 días", "A convenir"; uses generation date. | Medium | M; PDF output changes | IMPLEMENTED (DECISION-012) |
| 8 | IMPROVEMENT-008 | **Undo for row/quote deletion** (toast with "Deshacer") instead of immediate loss. | Row delete has no confirm in legacy/target. | Low–medium | S | IMPLEMENTED (DECISION-012) |
| 9 | IMPROVEMENT-009 | **Store numeric fields as numbers** (with tolerant reads of existing string data). | Inputs persist strings (legacy behavior, tests use string fixtures). | Low (data hygiene, Excel number cells) | S; data-shape change, needs reconciliation test | IMPLEMENTED (DECISION-012) |
| 10 | IMPROVEMENT-010 | **Shrink PDF chunk** (1.44 MB: base64 fonts + header/footer images) via binary assets/subsetting. | `vite build` output; chunk is already lazy-loaded. | Low: faster first PDF | M; must keep PDF parity | IMPLEMENTED (DECISION-012) |
| 11 | IMPROVEMENT-011 | **Server-side product scraping** (small serverless function) instead of public CORS proxies. | R-002; legacy had an unused API route. | Medium reliability | M; needs hosting (possibly paid) | DECLINED by user; URL import feature removed (DECISION-015) |
| 12 | IMPROVEMENT-012 | **Row reordering by drag-and-drop** to control PDF row order. | Rows can only be appended today; no reordering in legacy. | Low–medium | M | IMPLEMENTED (DECISION-012) |

Release-blocking defects found during migration were fixed under DECISION-003/005/008, not deferred here.


## Status update 2026-10-05 and new proposals

The authorization column above now shows each proposal's outcome. Added by the user: live PDF preview (DECISION-014, implemented).

| Rank | ID | Proposal | Evidence | Value | Effort / risk | Authorization |
|---|---|---|---|---|---|---|
| 1 | IMPROVEMENT-013 | **Compress generated PDFs** (jsPDF `compress: true`). | Generated PDFs are ~8.5 MB (uncompressed images/fonts), heavy for e-mail. | High for sending quotes | XS; PDF bytes change (visually the same) | product change |
| 2 | IMPROVEMENT-014 | **Keep preview scroll position** across refreshes (render pages with pdf.js instead of the built-in viewer). | Built-in viewer reloads at the top after each edit (FEATURE-034). | Medium | M; adds a dependency | engineering |
| 3 | IMPROVEMENT-015 | **Initialize Git and CI** for the target (build, unit tests, E2E on push). | No VCS in the target (R-005). | Medium (safety, history) | S | engineering |
