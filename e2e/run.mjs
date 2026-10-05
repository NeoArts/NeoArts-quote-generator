// End-to-end workflow verification against a running build (default: vite preview on :4322).
// Usage: npm run build && npx vite preview --port 4322 & ; node e2e/run.mjs [outDir]
// Uses the locally installed Chrome through playwright-core (no browser download).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import * as fx from './fixture.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4322/';
const OUT = process.argv[2] ?? 'e2e-output';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(path.join(OUT, 'downloads'), { recursive: true });

const results = [];
const errors = [];
async function step(name, fn) {
    try { await fn(); results.push({ name, status: 'PASS' }); console.log('PASS', name); }
    catch (e) { results.push({ name, status: 'FAIL', error: String(e?.message ?? e) }); console.log('FAIL', name, e?.message ?? e); }
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const dialogs = [];
page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const shot = (n, fullPage = false) => page.screenshot({ path: path.join(OUT, `${n}.png`), fullPage });
const wait = (ms = 300) => page.waitForTimeout(ms);
const dbQuote = (id) => page.evaluate(id => new Promise(r => {
    const q = indexedDB.open('QuotesDB', 1);
    q.onsuccess = () => { const g = q.result.transaction('quotes').objectStore('quotes').get(id); g.onsuccess = () => { q.result.close(); r(g.result); }; };
}), id);
const download = async (trigger) => {
    const [dl] = await Promise.all([page.waitForEvent('download'), trigger()]);
    const file = path.join(OUT, 'downloads', dl.suggestedFilename());
    await dl.saveAs(file);
    return { name: dl.suggestedFilename(), file };
};
const dialogCount = async (n, msg) => {
    for (let i = 0; i < 30 && (await page.getByRole('dialog').count()) !== n; i++) await wait(100);
    assert.equal(await page.getByRole('dialog').count(), n, msg);
};
const row = (i) => page.getByTestId(`product-row-${i}`);
const calc = (id) => page.getAttribute(id, 'data-value');

await step('W1 empty list and new quote creation', async () => {
    await page.goto(BASE); await wait(800);
    await page.getByText('Aún no hay cotizaciones.').waitFor();
    await shot('01-quote-list-empty');
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Nueva cotización' });
    assert.equal(await dialog.locator('#quote-date').inputValue(), new Date().toISOString().split('T')[0]);
    await shot('02-new-quote-modal');
    await dialog.locator('#quote-number').fill('500');
    await dialog.locator('#quote-client').fill('Cliente Nuevo');
    await dialog.getByRole('button', { name: 'Crear cotización' }).click(); await wait(500);
    await page.getByText('Cliente Nuevo').waitFor();
    assert.ok(await page.getByText('1 cotización guardada en este navegador.').isVisible());
});

await step('W2 seeded list ordering, select all, bulk and single delete', async () => {
    await fx.seed(page, { providers: fx.providers, quotes: [fx.quote, fx.quote2] });
    await page.reload(); await wait(800);
    const names = await page.locator('ul > li span.truncate').allTextContents();
    assert.deepEqual(names.slice(0, 3), ['Cliente Nuevo', 'Otra Empresa', 'Cliente Demo SAS']);
    await shot('03-quote-list');
    await page.getByText('Seleccionar todas las cotizaciones').click();
    assert.ok(await page.getByText('3 seleccionadas').isVisible());
    await shot('04-quote-list-all-selected');
    await page.getByText('Seleccionar todas las cotizaciones').click();
    await page.getByLabel('Seleccionar Cliente Nuevo').check();
    await page.getByRole('button', { name: 'Eliminar 1 cotización' }).click(); await wait(500);
    assert.equal(await page.getByText('Cliente Nuevo').count(), 0);
    assert.ok(dialogs.at(-1).includes('eliminar 1 cotización'));
});

await step('W3 Excel and JSON export', async () => {
    const xlsx = await download(() => page.locator('li', { hasText: 'Otra Empresa' }).getByRole('button', { name: 'Exportar a Excel' }).click());
    assert.equal(xlsx.name, 'Otra Empresa-2025-10-01.xlsx');
    const sheet = XLSX.read(fs.readFileSync(xlsx.file), { cellStyles: true }).Sheets.Sheet1;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    assert.deepEqual(rows[0], ['Id', 'Artículo', 'Descuento Proveedor', 'Precio con descuento', 'Costo Total', 'Precio de venta', 'Valor total', 'Tipo de marca', 'Proveedor', 'Costo', 'Cantidad', 'Costo de marca', 'Otros costos', 'Rentabilidad']);
    assert.equal(rows[1][1], 'Gorra');
    assert.ok(sheet['!cols'][0].hidden);
    const json = await download(() => page.locator('li', { hasText: 'Otra Empresa' }).getByRole('button', { name: 'Descargar JSON' }).click());
    assert.equal(json.name, 'quote-121-Otra-Empresa.json');
    assert.deepEqual(JSON.parse(fs.readFileSync(json.file, 'utf8')), fx.quote2);
    await wait(300); await shot('05-toasts');
});

await step('W4 JSON import: file picker, validation, preview, duplicates, drag and drop', async () => {
    await page.locator('#file-upload').setInputFiles([
        { name: 'quote-x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...fx.quote2, id: 'imp01', client: 'Importado' })) },
        { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"foo":1}') },
    ]);
    await page.getByText('quote-x.json').waitFor();
    assert.ok(await page.getByText('1 archivo con estructura inválida').isVisible());
    await shot('06-json-import-preview', true);
    // drag & drop a duplicate (existing id) plus a new one
    await page.evaluate(async ([a, b]) => {
        const dt = new DataTransfer();
        dt.items.add(new File([a], 'dup.json', { type: 'application/json' }));
        dt.items.add(new File([b], 'new.json', { type: 'application/json' }));
        const zone = document.querySelector('[data-testid="json-dropzone"]');
        zone.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, bubbles: true }));
        zone.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true }));
    }, [JSON.stringify(fx.quote2), JSON.stringify({ ...fx.quote2, id: 'imp02', client: 'Arrastrado' })]);
    await page.getByText(/3 cotizaciones para importar/).waitFor();
    await page.getByRole('button', { name: 'Importar', exact: true }).click();
    await page.getByText('Importado').waitFor();
    await page.getByText('Arrastrado').waitFor();
    assert.ok(await page.getByText('ya existía y no se importó').first().isVisible());
    // non-JSON rejected
    await page.locator('#file-upload').setInputFiles({ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await page.getByText('Solo se aceptan archivos .json').waitFor();
});

await step('W2b single quote delete with confirm', async () => {
    await page.locator('li', { hasText: 'Arrastrado' }).getByRole('button', { name: 'Eliminar cotización' }).click();
    await wait(400);
    assert.equal(dialogs.at(-1), '¿Estás segur@ de borrar esta cotización?');
    assert.equal(await page.getByText('Arrastrado').count(), 0);
    await page.getByText('Cotización eliminada').first().waitFor();
});

await step('W5 editor: open, calculation parity with legacy, autosave, deep link, back', async () => {
    await page.getByRole('button', { name: /Cliente Demo SAS/ }).click();
    await page.waitForURL(/#\/cotizacion\/fixq01$/);
    assert.equal(await page.evaluate(() => localStorage.getItem('currentQuote')), 'fixq01');
    await page.locator('#product-quantity-0').waitFor();
    await shot('07-editor');
    await page.fill('#product-quantity-0', '101'); await page.fill('#product-quantity-0', '100'); await wait(600);
    const vals = async (i) => Promise.all(['costOff', 'totalCost', 'sellPrice', 'totalValue'].map(f => calc(`#product-${f}-${i}`)));
    assert.deepEqual(await vals(0), ['5400', '6400', '9143', '914300']);
    assert.deepEqual(await vals(1), ['810', '1110', '1708', '854000']);
    await shot('08-editor-after-calc');
    await page.evaluate(() => { document.getElementById('table-scroll').scrollLeft = 5000; }); await wait(200);
    await shot('09-editor-scrolled-right');
    await page.evaluate(() => { document.getElementById('table-scroll').scrollLeft = 0; });
    await page.fill('#quote-client', 'Cliente Demo SAS 2'); await wait(600);
    await page.reload(); await page.locator('#product-quantity-0').waitFor(); await wait(300);
    assert.equal(await page.inputValue('#quote-client'), 'Cliente Demo SAS 2');
    assert.equal(await calc('#product-sellPrice-0'), '9143');
    await page.getByRole('link', { name: 'Volver a cotizaciones' }).click();
    await page.getByRole('heading', { name: 'Cotizaciones', exact: true }).waitFor();
    await page.goBack(); await page.locator('#product-quantity-0').waitFor();
    await page.fill('#quote-client', 'Cliente Demo SAS'); await wait(400);
});

await step('W6 provider select: search, select (recalculates), inline create', async () => {
    await page.locator('#product-provider-2').click();
    await shot('10-provider-dropdown');
    await page.getByRole('option', { name: /PROMOS/ }).first().click();
    assert.equal(await page.inputValue('#product-providerDiscount-2'), '0.4');
    assert.equal(await calc('#product-costOff-2'), '4320');
    await page.locator('#product-provider-2').click();
    await page.getByLabel('Buscar proveedor').fill('NUEVOPROV');
    await shot('11-provider-create-option');
    await page.getByText('Crear "NUEVOPROV"').click();
    const modal = page.getByRole('dialog', { name: 'Nuevo proveedor' });
    assert.equal(await modal.locator('#provider-name').inputValue(), 'NUEVOPROV');
    await modal.locator('#provider-discount').fill('0.25');
    await shot('12-provider-create-modal');
    await modal.getByRole('button', { name: 'Guardar' }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('providers')).map(p => p.name));
    assert.deepEqual(saved, ['PROMOS', 'MPPROMO', 'NUEVOPROV']);
    await page.locator('#product-provider-2').click();
    await page.getByRole('option', { name: /NUEVOPROV/ }).waitFor();
    await page.keyboard.press('Escape');
    // restore row 2 provider
    await page.locator('#product-provider-2').click();
    await page.getByRole('option', { name: /MPPROMO/ }).click();
});

await step('W7 details dialog edit and scales (unique ids, legacy values)', async () => {
    await page.getByRole('button', { name: 'Detalles fila 1' }).click();
    const modal = page.getByRole('dialog').last();
    await modal.locator('#detail-name').fill('Mug cerámico XL');
    assert.equal(await page.inputValue('#product-name-0'), 'Mug cerámico XL');
    await shot('13-details-modal');
    await modal.getByRole('button', { name: 'Crear escalas' }).click();
    await shot('14-scales-mode');
    await modal.locator('#scales-input').fill('200,300');
    await modal.getByRole('button', { name: 'Crear escalas' }).last().click(); await wait(600);
    const products = (await dbQuote('fixq01')).products;
    assert.deepEqual(products.map(p => p.id), [0, 1, 2, 3, 4]);
    assert.deepEqual(products.slice(3).map(p => [p.quantity, p.costOff, p.totalCost, p.sellPrice, p.totalValue]), [[200, 5400, 6400, 9143, 1828600], [300, 5400, 6400, 9143, 2742900]]);
    await shot('15-after-scales');
});

await step('W8 duplicate, add, delete rows (unique ids, last row reset)', async () => {
    await page.getByRole('button', { name: 'Duplicar fila 1' }).click(); await wait(300);
    await page.getByRole('button', { name: 'Agregar producto' }).click(); await wait(600);
    let ids = (await dbQuote('fixq01')).products.map(p => p.id);
    assert.deepEqual(ids, [0, 1, 2, 3, 4, 5, 6]);
    // editing the duplicate must not change the original (legacy bug D-003)
    await page.fill('#product-name-5', 'Copia'); await wait(400);
    assert.equal(await page.inputValue('#product-name-0'), 'Mug cerámico XL');
    await page.getByRole('button', { name: 'Eliminar fila 7' }).click(); await wait(400);
    ids = (await dbQuote('fixq01')).products.map(p => p.id);
    assert.deepEqual(ids, [0, 1, 2, 3, 4, 5]);
});

await step('W9 images: thumbnail popup, paste, clipboard button, clear', async () => {
    await row(0).getByTitle('Ver imagen').click();
    const modal = page.getByRole('dialog', { name: 'Imagen del producto' });
    await shot('16-image-popup');
    await modal.getByRole('button', { name: 'Quitar imagen' }).click();
    await modal.getByLabel('Pega aquí la imagen (Ctrl+V)').waitFor();
    await modal.getByLabel('Pega aquí la imagen (Ctrl+V)').evaluate(async (el, img) => {
        const blob = await (await fetch(img)).blob();
        const dt = new DataTransfer(); dt.items.add(new File([blob], 'p.png', { type: 'image/png' }));
        el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
    }, fx.IMG);
    await modal.getByAltText('Imagen del producto').waitFor();
    await modal.getByRole('button', { name: 'Listo' }).click(); await wait(400);
    const img = (await dbQuote('fixq01')).products[0].image;
    assert.ok(img.base64String.startsWith('data:image/png'));
    assert.equal(Math.round(img.height), 117);
    // 📋 button on row 3 reads the system clipboard
    await page.evaluate(async (src) => { const blob = await (await fetch(src)).blob(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); }, fx.IMG);
    await row(2).getByRole('button', { name: 'Pegar imagen del portapapeles' }).click(); await wait(600);
    assert.ok((await dbQuote('fixq01')).products[2].image.base64String.startsWith('data:image/png'));
});

await step('W11 PDF generation', async () => {
    const pdf = await download(() => page.getByRole('button', { name: 'Descargar PDF' }).click());
    assert.equal(pdf.name, 'Cotización Cliente Demo SAS REF_ VPM-120.pdf');
    fs.renameSync(pdf.file, path.join(OUT, 'downloads', 'target-quote.pdf'));
    const size = fs.statSync(path.join(OUT, 'downloads', 'target-quote.pdf')).size;
    assert.ok(size > 100000, `pdf size ${size}`);
});

await step('W12 providers dialog: list, edit tiers by row, create, delete', async () => {
    await page.goto(BASE); await wait(600);
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Proveedores' });
    await panel.getByText('5% desde $1.000, 10% desde $5.000').waitFor();
    await shot('18-providers-panel');
    await panel.getByRole('button', { name: 'Editar PROMOS' }).click();
    const modal = page.getByRole('dialog').last();
    await shot('19-provider-details');
    await modal.getByRole('button', { name: 'Agregar nivel' }).click();
    await modal.locator('#discount-provider-2').fill('20000');
    await modal.locator('#discount-value-2').fill('0.15');
    await modal.getByRole('button', { name: 'Eliminar descuento' }).nth(1).click();
    await modal.locator('#discount-value-1').fill('0.2'); // former row 3, edited by position (legacy id bug)
    await modal.getByRole('button', { name: 'Guardar' }).click();
    const promos = await page.evaluate(() => JSON.parse(localStorage.getItem('providers')).find(p => p.name === 'PROMOS'));
    assert.deepEqual(promos.wholesaleDiscount.map(d => [Number(d.amount), Number(d.discount)]), [[1000, 0.05], [20000, 0.2]]);
    await panel.getByRole('button', { name: 'Nuevo proveedor' }).first().click();
    await modal.locator('#provider-name').fill('TEMP');
    await modal.getByRole('button', { name: 'Guardar' }).click();
    await panel.getByText('TEMP').waitFor();
    await panel.getByRole('button', { name: 'Editar TEMP' }).click();
    await modal.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await wait(300);
    assert.equal(await panel.getByText('TEMP').count(), 0);
    await page.keyboard.press('Escape');
    await dialogCount(0);
});

await step('W13 phone-width layout has no page-level horizontal scroll', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE); await wait(600);
    await shot('20-mobile-list', true);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.goto(BASE + '#/cotizacion/fixq01'); await page.locator('#product-quantity-0').waitFor();
    await shot('21-mobile-editor');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.setViewportSize({ width: 1440, height: 900 });
});

await step('W14 unknown quote deep link', async () => {
    await page.goto(BASE + '#/cotizacion/nope'); await wait(500);
    await page.getByText('No se encontró la cotización.').waitFor();
});

await step('W16 Escape closes only the topmost dialog; new-quote draft survives close', async () => {
    await page.goto(BASE + '#/cotizacion/fixq01'); await page.locator('#product-quantity-0').waitFor();
    await page.getByRole('button', { name: 'Detalles fila 1' }).click();
    const details = page.getByRole('dialog').last();
    await details.locator('#detail-provider').click();
    await page.keyboard.press('Escape');
    await dialogCount(1, 'dropdown Escape must not close the dialog');
    await details.locator('#detail-provider').click();
    await page.getByLabel('Buscar proveedor').fill('OTROPROV');
    await page.getByText('Crear "OTROPROV"').click();
    await page.locator('#provider-name').waitFor();
    await dialogCount(2);
    await page.keyboard.press('Escape');
    await dialogCount(1);
    await page.keyboard.press('Escape');
    await dialogCount(0);
    await page.goto(BASE); await wait(500);
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click();
    await page.getByRole('dialog').locator('#quote-client').fill('Borrador');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click();
    assert.equal(await page.getByRole('dialog').locator('#quote-client').inputValue(), 'Borrador');
    await page.keyboard.press('Escape');
});

await step('W17 unreadable JSON files show the legacy error', async () => {
    await page.locator('#file-upload').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{not json') });
    await page.getByText('Error al leer los archivos JSON. Verifique que el formato sea correcto.').waitFor();
});

await step('W18 provider discount change: notice, ignore, apply (quotes never change silently)', async () => {
    await page.goto(BASE + '#/cotizacion/fixq01'); await page.locator('#product-quantity-0').waitFor(); await wait(400);
    const before = await calc('#product-sellPrice-1');
    // change PROMOS general discount 0.4 -> 0.3 in localStorage (as the Proveedores dialog would)
    await page.evaluate(() => {
        const ps = JSON.parse(localStorage.getItem('providers'));
        localStorage.setItem('providers', JSON.stringify(ps.map(p => (p.name === 'PROMOS' ? { ...p, discount: 0.3 } : p))));
        window.dispatchEvent(new Event('providersUpdated'));
    });
    await page.getByText('Los descuentos de PROMOS cambiaron desde que se hizo esta cotización.').waitFor();
    assert.equal(await calc('#product-sellPrice-1'), before, 'values must not change before the user decides');
    // editing a row keeps using the frozen terms
    await page.fill('#product-quantity-1', '501'); await page.fill('#product-quantity-1', '500'); await wait(300);
    assert.equal(await calc('#product-sellPrice-1'), before);
    await shot('22-provider-change-notice');
    await page.getByRole('button', { name: 'Ignorar' }).click();
    await page.reload(); await page.locator('#product-quantity-0').waitFor(); await wait(400);
    assert.equal(await page.getByText('Los descuentos de PROMOS cambiaron').count(), 0, 'ignored change stays hidden');
    // a further change shows the notice again; apply it
    await page.evaluate(() => {
        const ps = JSON.parse(localStorage.getItem('providers'));
        localStorage.setItem('providers', JSON.stringify(ps.map(p => (p.name === 'PROMOS' ? { ...p, discount: 0.2 } : p))));
        window.dispatchEvent(new Event('providersUpdated'));
    });
    await page.getByRole('button', { name: 'Aplicar a esta cotización' }).click(); await wait(400);
    assert.notEqual(await calc('#product-sellPrice-1'), before);
    assert.equal(await page.inputValue('#product-providerDiscount-1'), '0.2');
    const q = await dbQuote('fixq01');
    assert.equal(q.providerTerms.PROMOS.discount, 0.2);
    // restore PROMOS 0.4 for later steps; apply again
    await page.evaluate(() => {
        const ps = JSON.parse(localStorage.getItem('providers'));
        localStorage.setItem('providers', JSON.stringify(ps.map(p => (p.name === 'PROMOS' ? { ...p, discount: 0.4 } : p))));
        window.dispatchEvent(new Event('providersUpdated'));
    });
    await page.getByRole('button', { name: 'Aplicar a esta cotización' }).click(); await wait(300);
    assert.equal(await page.inputValue('#product-providerDiscount-1'), '0.4');
});

await step('W19 totals, numbers stored as numbers', async () => {
    const totals = await page.getByTestId('quote-totals').innerText();
    assert.match(totals, /Valor total[\s\S]*\$[\d.]+[\s\S]*Margen[\s\S]*%/);
    await shot('23-totals');
    const p0 = (await dbQuote('fixq01')).products[0];
    assert.equal(typeof p0.quantity, 'number');
    assert.equal(typeof p0.cost, 'number');
});

await step('W20 reorder rows: drag and drop, Alt+Arrow', async () => {
    const names = async () => Promise.all([0, 1, 2].map(i => page.inputValue(`#product-name-${i}`)));
    const start = await names();
    await page.getByRole('button', { name: 'Mover fila 1' }).dragTo(page.getByTestId('product-row-2'));
    await wait(300);
    assert.deepEqual(await names(), [start[1], start[2], start[0]]);
    await wait(500);
    await page.getByRole('button', { name: 'Mover fila 3' }).focus();
    await page.keyboard.press('Alt+ArrowUp'); await wait(200);
    await page.keyboard.press('Alt+ArrowUp'); await wait(500);
    assert.deepEqual(await names(), start);
    assert.deepEqual((await dbQuote('fixq01')).products.slice(0, 3).map(p => p.name), start);
});

await step('W21 undo row delete and quote delete', async () => {
    const count = (await dbQuote('fixq01')).products.length;
    const name = await page.inputValue('#product-name-1');
    await page.getByRole('button', { name: 'Eliminar fila 2' }).click(); await wait(400);
    assert.equal((await dbQuote('fixq01')).products.length, count - 1);
    await page.getByRole('button', { name: 'Deshacer' }).click(); await wait(400);
    assert.equal((await dbQuote('fixq01')).products.length, count);
    assert.equal(await page.inputValue('#product-name-1'), name);
    await page.goto(BASE); await wait(500);
    await page.locator('li', { hasText: 'Importado' }).getByRole('button', { name: 'Eliminar cotización' }).click(); await wait(400);
    assert.equal(await page.getByText('Importado', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Deshacer' }).click(); await wait(600);
    await page.getByText('Importado', { exact: true }).waitFor();
});

await step('W22 next quote number suggestion', async () => {
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click(); await wait(400);
    const dialog = page.getByRole('dialog', { name: 'Nueva cotización' });
    await dialog.locator('#quote-client').fill(''); // draft from W16 may exist
    const max = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('QuotesDB', 1); q.onsuccess = () => { const g = q.result.transaction('quotes').objectStore('quotes').getAll(); g.onsuccess = () => r(Math.max(...g.result.map(x => Number(x.number)).filter(Number.isInteger))); }; }));
    await dialog.locator('#quote-number').fill('');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click(); await wait(500);
    assert.equal(await dialog.locator('#quote-number').inputValue(), String(max + 1));
    await page.keyboard.press('Escape');
});

await step('W23 backup download, providers export/import', async () => {
    const backup = await download(() => page.getByRole('button', { name: 'Descargar respaldo' }).click());
    const data = JSON.parse(fs.readFileSync(backup.file, 'utf8'));
    assert.equal(data.type, 'neoarts-backup');
    assert.ok(data.quotes.length >= 3 && data.providers.length >= 3);
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Proveedores' });
    const exported = await download(() => panel.getByRole('button', { name: 'Exportar proveedores' }).click());
    const providersFile = JSON.parse(fs.readFileSync(exported.file, 'utf8'));
    assert.equal(providersFile.type, 'neoarts-providers');
    await page.evaluate(() => { localStorage.setItem('providers', '[]'); window.dispatchEvent(new Event('providersUpdated')); });
    await panel.getByText('Sin proveedores registrados').waitFor();
    await page.locator('#providers-upload').setInputFiles(exported.file);
    await panel.getByRole('button', { name: 'Editar PROMOS' }).waitFor();
    assert.ok(await page.getByText(/Proveedores importados: \d+ nuevos, 0 actualizados/).first().isVisible());
    await page.keyboard.press('Escape');
    // backup through the quote importer: quotes are duplicates, providers are upserted
    await page.locator('#file-upload').setInputFiles(backup.file);
    await page.getByText(/cotizaciones y \d+ proveedores para importar/).waitFor();
    await page.getByRole('button', { name: 'Importar', exact: true }).click();
    await page.getByText(/ya existían y no se importaron/).first().waitFor();
});

await step('W24 PDF options and live preview', async () => {
    await page.goto(BASE + '#/cotizacion/fixq01'); await page.locator('#product-quantity-0').waitFor();
    await page.getByRole('button', { name: 'Ajustes del PDF' }).click();
    await page.locator('#pdf-validity').fill('15 días');
    await page.locator('#pdf-useQuoteDate').check(); await wait(400);
    assert.deepEqual((await dbQuote('fixq01')).pdfOptions, { validity: '15 días', useQuoteDate: true });
    await page.getByRole('button', { name: 'Vista previa del PDF' }).click();
    const frame = page.locator('iframe[title="Vista previa del PDF"]');
    await frame.waitFor({ timeout: 20000 });
    const first = await frame.getAttribute('src');
    assert.ok(first.startsWith('blob:'));
    await page.getByText('Actualizada').waitFor({ timeout: 20000 });
    await shot('24-pdf-preview');
    await page.fill('#quote-client', 'Cliente Preview'); await wait(2500);
    assert.notEqual(await frame.getAttribute('src'), first, 'preview regenerates after edits');
    const pdf = await download(() => page.getByRole('button', { name: 'Descargar PDF' }).click());
    assert.equal(pdf.name, 'Cotización Cliente Preview REF_ VPM-120.pdf');
    await page.fill('#quote-client', 'Cliente Demo SAS');
    await page.getByRole('button', { name: 'Restablecer valores predeterminados' }).click(); await wait(400);
    assert.deepEqual((await dbQuote('fixq01')).pdfOptions, {});
    await page.getByRole('button', { name: 'Ocultar vista previa' }).first().click();
});

await step('W15 no console or page errors', async () => {
    const relevant = errors.filter(e => !e.includes('favicon') && !e.includes('fonts.g'));
    assert.deepEqual(relevant, []);
});

fs.writeFileSync(path.join(OUT, 'e2e-results.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), results, dialogs, errors }, null, 2));
await browser.close();
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
