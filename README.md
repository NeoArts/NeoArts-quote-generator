# NeoArts – Creador de cotizaciones

Standalone migration of the "Creador de cotizaciones" tool from NeoArts-WebTools (including its Proveedores management), redesigned. Everything runs in the browser; data stays in the browser's storage.

## Use

```bash
npm install
npm run dev          # http://localhost:5173
```

- **Cotizaciones**: create (Nueva Cotización), open (click a row), select/delete, export Excel, download JSON, import JSON files (picker or drag & drop).
- **Editor**: edit date/number/client and the product table (autosaves). Row buttons: delete, duplicate, details (vertical form, "Crear escalas"). Image cell: click to view/paste, 📋 pastes from the clipboard. "Descargar PDF" (bottom bar) downloads the PDF.
- **Proveedores**: button on the quote list (cards, create, edit, delete, wholesale tiers, export/import), or "Crear …" from the provider dropdown in a row.
- **Discount changes never alter existing quotes**: each quote keeps the provider discounts it was made with. When a provider changes, the quote shows a notice to "Aplicar" or "Ignorar".
- **Also**: "Descargar respaldo" (quotes + providers in one file, importable in "Importar Cotizaciones"), suggested next quote number, totals and margin under the table, "Datos del PDF" (cities, IVA, validity, payment, production, delivery, quote date), "Deshacer" after deleting rows or quotes, drag rows by ⋮⋮ (or Alt + ↑/↓) to reorder, and "Vista previa del PDF" for a live preview while editing.

## Data

Same storage as the legacy app: IndexedDB `QuotesDB` (store `quotes`, key `id`) and localStorage `providers` / `currentQuote`. Browser storage is per origin: if this app is served from the same origin as the old one (`https://neoarts.github.io`), existing quotes and providers appear automatically. Otherwise move quotes with the old app's JSON export, and providers by re-entering them once (the old app cannot export them); afterwards use "Descargar respaldo".

## Build and checks

```bash
npm run build                 # type-check + production build into dist/ (relative paths, any static host)
npm test                      # unit + characterization tests (calc compared against the legacy module in ../NeoArts-WebTools)
npx vite preview --port 4322  # then, in another shell:
node e2e/run.mjs e2e-output   # 24 browser workflows; uses local Chrome (set CHROME_PATH if elsewhere)
```

`e2e/pdf-parity.mjs` compares the generated PDF with the legacy app's PDF (needs the legacy app served on :4321).

## Deploy

Not deployed. `dist/` is a static site; GitHub Pages works (e.g. `npx gh-pages -d dist`). Deploy under `neoarts.github.io` to keep existing browser data.

Migration records: `.ai/migration/` (start with `INDEX.md`).
