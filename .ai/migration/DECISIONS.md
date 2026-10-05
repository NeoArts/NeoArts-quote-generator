# Decision register

Use stable DECISION-### IDs. An agent recommendation is not user authorization.

## DECISION-001 — Scope: quote creator only (accepted, user instruction 2026-10-05)
- Question: which legacy features migrate. Affects all features.
- Decision: migrate only "Creador de cotizaciones" (list `/quote`, editor `/quote/quote-generator`) and its Proveedores management. Out of scope by user instruction: dashboard, cuentas de cobro/invoice, customers, post, terminal, XML converter, notifications center, mp3 transcription, requirement analysis, computer listener, sidebar/header user menu.
- Authorization: user message 2026-10-05 ("focus ONLY in creador de cotizaciones ... Except Proveedores ... no need to create a sidebar").

## DECISION-002 — Providers embedded, not a separate section (accepted, user instruction)
- Decision: legacy `/providers` page becomes a "Proveedores" dialog opened from the quote list; inline creation from the provider select remains. Same storage and CRUD semantics (keyed by name).
- Authorization: same user message ("I don't want it to be a separated section").

## DECISION-003 — Unique product ids; rows updated by position (accepted, data-integrity bug fix)
- Evidence: legacy capture `evidence/legacy/capture-log.json` (`afterScales`, `afterDuplicateIds` = [0,1,2,1,2,1]). Legacy keyed row updates by id, so editing a duplicated/scaled row overwrote every row sharing its id.
- Decision: new ids = max(id)+1 for add/duplicate/scales/URL import; edits apply by row index. Same for provider wholesale tier rows (legacy id-based edit/delete stopped working after a deletion).
- Rationale: prevents silent data loss; no user-visible downside. Policy: user objective "preserve required functionality and data semantics"; data-loss fixes are not optional polish. Reversible.
- Tests: E2E W7/W8/W12, UNIT nextProductId.

## DECISION-004 — Single-page app, hash routing, no full reloads (accepted, implementation choice under user's "what you consider better")
- Decision: Vite + React 18 + TypeScript + Tailwind 3 static SPA. Routes `#/` (list) and `#/cotizacion/<id>` (editor; also writes legacy `currentQuote`). Legacy `window.location.reload()` after create/delete/import replaced by in-place refresh. "← Volver a cotizaciones" link replaces sidebar navigation. Editor uses full width (no sidebar). Toasts dismissed on route change.
- Tests: E2E W1–W14.

## DECISION-005 — Defensive product defaults (accepted, robustness)
- Evidence: legacy new quotes store `products: [{id: 0}]`; generating a PDF before editing every field throws (`quantity.toString()` on undefined).
- Decision: new quotes start with a full empty product; loaded products are merged over defaults (stored only on next edit).

## DECISION-006 — Keep legacy next-number suggestion as-is (accepted, preserve)
- Evidence: legacy `NewQuotePopup` reads localStorage `quotes` (pre-IndexedDB key), so with current data it never suggests a number.
- Decision: preserved exactly; fixing it is IMPROVEMENT-002 (needs product decision).

## DECISION-007 — Spelling "cotizaciones" (accepted, text bug fix)
- Legacy concatenated "cotización"+"es" → "cotizaciónes". Corrected in counts, buttons, confirms and toasts.

## DECISION-008 — JSON import imports non-duplicates (accepted, bug fix matching legacy UI promise)
- Evidence: `evidence/legacy/import-duplicate-check.json` — legacy aborts the whole IndexedDB transaction when any file is a duplicate, so nothing is imported, despite the note "Las cotizaciones duplicadas (mismo ID) no se importarán".
- Decision: duplicates are skipped and counted; others are imported. Tests: E2E W4, UNIT importQuotes.

## DECISION-009 — Notification persistence dropped (accepted, follows DECISION-001)
- Legacy toasts also wrote to the notifications-center IndexedDB, an out-of-scope feature. Toast texts/styles kept.

## DECISION-010 — Visual bug fixes with no behavior change (accepted)
- Button `className` now replaces variant colors (legacy "Ver detalles" text was white-on-gray, invisible: `evidence/legacy/18-providers-page.png`).
- Unreachable legacy UI not reproduced: `DiscountGroupInfo` modal (its trigger is commented out in legacy QuoteTable); the Grupo Dto tooltip is kept.
- Unused legacy server route `src/pages/api/scrape-product.ts` (static build, client uses CORS proxies) not reproduced.
- Escape closes dialogs; dialogs have accessible names (additive).

## DECISION-011 — Preserved legacy quirks (accepted, preserve; see IMPROVEMENT proposals)
- Excel "Precio con descuento" holds providerDiscount and "Costo de marca" holds markType; image object in hidden column O.
- providerDiscount display uses `provider.discount || product.providerDiscount` while the calculation uses provider.discount even when 0.
- Group members of a product's *previous* group/provider are not recalculated when the group/provider changes (recalculated on their next edit).
- Changing a provider's discounts does not recalculate existing quotes until a row is edited.
- Image changes do not recalculate the row. URL import fails silently on image CORS errors (no image).
- PDF date is the generation day, not the quote date; PDF city/terms text fixed.

## DECISION-012 — Approved improvements implemented (accepted, user message 2026-10-05)
- User approved IMPROVEMENT-001, 002, 003, 005, 007, 008, 009, 010, 012 ("Lets implement all other features"), declined 006 ("not needed for now") and 011 ("feature was discard so we omit that one" — read as dropping the proposal; the existing URL import stays).
- Implemented: providers export/import + full backup (001), next number from IndexedDB (002), corrected Excel columns, numeric cells, image column removed (003), totals (005), editable PDF letter fields with quote-date option, defaults byte-identical to legacy (007), undo for row/quote deletion (008), numbers stored as numbers (009), PDF assets as binary files loaded on demand and unused invoice images/code removed (010), row reordering by drag handle and Alt+Arrow (012).
- Supersedes DECISION-006 and the Excel item of DECISION-011.

## DECISION-013 — Frozen provider terms per quote (accepted, user rule for IMPROVEMENT-004)
- User rule: "an old quote that uses old discounts should never change, we should rather offer the user a notification of the discounts changes and let them decide if they want to apply them to the current quote".
- Each quote stores `providerTerms` (discount + wholesale tiers per used provider), frozen when a provider is first used or when a pre-existing quote is first opened. Calculations use frozen terms; deleted providers keep working through them.
- When current terms differ, the editor shows a notice with old vs current terms: "Aplicar a esta cotización" adopts them and recalculates that provider's rows; "Ignorar" hides that exact change (stored in `ignoredProviderChanges`) until the provider changes again.
- Also from IMPROVEMENT-004 (same-quote consistency, no external data involved): rows left in a previous discount group, and groups affected by row delete/duplicate/undo, are recalculated. Supersedes those items of DECISION-011.
- Limitation: quotes created before this version freeze the provider terms current at their first opening (the original terms were never recorded).

## DECISION-014 — Live PDF preview (accepted, user request 2026-10-05)
- Collapsible panel ("Vista previa del PDF") beside the editor on wide screens, stacked on narrow ones. It renders the real PDF with the same code as the download, 0.7 s after edits stop, in the browser's built-in PDF viewer.

## DECISION-015 — Remove "Importar desde URL" (accepted, user instruction 2026-10-05)
- User: "#11 feature was discard so we omit that one", then on seeing the button: "I still see the import from url button" — the URL import feature itself is discarded, not only the server-side proposal.
- Removed the button, panel, src/lib/scraper.ts, its unit tests and E2E step W10. FEATURE-019 RETIRED. Supersedes the URL-import part of DECISION-012. Reversible from the legacy source (ProductScraperService.ts) if needed.

## DECISION-016 — Full visual redesign (accepted, user instruction 2026-10-05)
- User: "redesign from scratch, replace, restore, change everything ... to achieve a very comfortable user experience and an attractive user interface". Supersedes the visual-fidelity goal (legacy look) for all screens; behavior and data are unchanged.
- Direction "press room": cool paper background, ink, one process-magenta accent, cyan/yellow only for information and warnings; Archivo (expanded width for quote references and titles, tabular figures for amounts); a C/M/Y strip under the header as the only decoration.
- Structure: quote ledger with search, totals and image thumbnails; editor with an in-place header (VPM number, client, date, save status), a spreadsheet-style table grouped Producto / Costos / Venta with Artículo pinned left and Valor total pinned right, read-only calculated cells, the provider dropdown positioned outside the scroll area, a sticky totals bar with "Descargar PDF"; providers in a slide-over panel; dialogs restyled; dark toasts at the bottom.
- Copy follows sentence case and names actions by what they do ("Nueva cotización", "Descargar PDF", "Agregar producto").
- Evidence: evidence/design/*.png, E2E 24/24 (selectors updated for the new copy and structure), unit 63/63. PDF code untouched by the redesign (parity evidence from RUN-2026-10-05-improvements still applies).

## DECISION-017 — Cloud storage with Supabase, per-user data (accepted, user instructions 2026-10-05)
- User: wants a free database instead of browser storage; "Several people ... each person has their own quotes and providers"; chose Supabase; created the hosted project (ref ymnudgatqbijnkqrgqpn) and ran the init SQL.
- Design: email + password accounts (confirmation and reset by email, PKCE flow); tables `quotes` (listing columns + jsonb `data`) and `providers`; product images as files in the private `product-images` bucket under `<user id>/`; row level security owner-only on tables and files (supabase/migrations/). Browser storage remains as a build mode without Supabase settings (used by the original E2E suite).
- Existing browser data: a banner offers a one-time upload of this browser's quotes/providers to the signed-in account (local data is kept).
- Hardening after independent security review (no critical/high): PKCE, size limits and per-user row caps, 2 MB image limit, search_path on functions, CSP in production builds, caches cleared and pending saves flushed on sign-out.
- Known limits: image files are never deleted (1 GB free storage); built-in email sending is rate-limited (custom SMTP/CAPTCHA recommended if abused); free projects pause after 7 days without use; lists load all quotes (no pagination).
- Evidence: evidence/cloud/cloud-results.json (8/8 against local Supabase), evidence/cloud/rls-check.txt (13/13), browser-mode E2E 24/24, unit 63/63.
