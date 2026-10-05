const { chromium } = require('playwright-core');
const fs = require('fs');
const fx = require('./fixture');
const OUT = process.argv[2];
const BASE = 'http://127.0.0.1:4321/NeoArts-WebTools/';
const log = [];
const note = (k, v) => { log.push({ k, v }); console.log(k, JSON.stringify(v)); };
const dbProducts = (page, id) => page.evaluate((id) => new Promise(r => {
  const q = indexedDB.open('QuotesDB', 1);
  q.onsuccess = () => { const g = q.result.transaction('quotes').objectStore('quotes').get(id); g.onsuccess = () => r(g.result.products.map(p => ({ id: p.id, quantity: p.quantity, providerDiscount: p.providerDiscount, costOff: p.costOff, totalCost: p.totalCost, sellPrice: p.sellPrice, totalValue: p.totalValue }))); };
}), id);

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('dialog', async d => { note('dialog', { type: d.type(), msg: d.message() }); await d.accept(); });
  const shot = (n, fullPage = false) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage });

  await page.goto(BASE + 'quote/'); await page.waitForTimeout(1500);
  await shot('01-quote-list-empty');
  await page.getByRole('button', { name: 'Nueva Cotización' }).click(); await page.waitForTimeout(300);
  note('newQuoteDefaults', await page.evaluate(() => ({ date: document.querySelector('#details-modal:not(.hidden) #quote-date')?.value, number: document.querySelector('#details-modal:not(.hidden) #quote-number')?.value })));
  await shot('02-new-quote-modal');

  await fx.seed(page, { providers: fx.providers, quotes: [fx.quote, fx.quote2] });
  await page.reload(); await page.waitForTimeout(1500);
  await shot('03-quote-list');
  note('listOrder', await page.locator('h3.font-bold').allTextContents());
  await page.getByText('Seleccionar todas las cotizaciones').click(); await page.waitForTimeout(200);
  await shot('04-quote-list-all-selected');
  await page.getByText('Seleccionar todas las cotizaciones').click();

  for (const [title, name] of [['Exportar a Excel', 'excel'], ['Descargar JSON', 'json']]) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(`button[title="${title}"]`).first().click()]);
    const fn = dl.suggestedFilename(); await dl.saveAs(`${OUT}/downloads/${fn}`); note('download-' + name, fn);
  }
  await page.waitForTimeout(500); await shot('05-toasts');

  await page.locator('#file-upload').setInputFiles([
    { name: 'quote-x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...fx.quote2, id: 'imp01', client: 'Importado' })) },
    { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"foo":1}') },
  ]);
  await page.waitForTimeout(800);
  await shot('06-json-import-preview', true);

  await page.getByText('Cliente Demo SAS').click(); await page.waitForURL('**/quote-generator**'); await page.waitForTimeout(1500);
  await shot('07-editor');
  await page.fill('#product-quantity-0', '101'); await page.waitForTimeout(300);
  await page.fill('#product-quantity-0', '100'); await page.waitForTimeout(800);
  note('rowsAfterEditQty0', await dbProducts(page, 'fixq01'));
  await page.fill('#product-quantity-2', '50'); await page.waitForTimeout(800);
  note('rowsAfterEditQty2', await dbProducts(page, 'fixq01'));
  await shot('08-editor-after-calc');
  await page.evaluate(() => { document.getElementById('table-scroll').scrollLeft = 5000; }); await page.waitForTimeout(200);
  await shot('09-editor-scrolled-right');
  await page.evaluate(() => { document.getElementById('table-scroll').scrollLeft = 0; });

  await page.locator('#table-scroll span:text-is("PROMOS")').first().click(); await page.waitForTimeout(300);
  await shot('10-provider-dropdown');
  await page.fill('input[placeholder="Buscar proveedor..."]', 'NUEVOPROV'); await page.waitForTimeout(200);
  await shot('11-provider-create-option');
  await page.getByText('Crear "NUEVOPROV"').click(); await page.waitForTimeout(300);
  await shot('12-provider-create-modal');

  await page.goto(BASE + 'quote/quote-generator/'); await page.waitForTimeout(1500);
  await page.locator('img[src*="info.svg"]').first().evaluate(e => e.closest('button').click()); await page.waitForTimeout(300);
  await shot('13-details-modal');
  await page.locator('button:visible', { hasText: 'Crear escalas' }).first().click(); await page.waitForTimeout(200);
  await shot('14-scales-mode');
  await page.fill('#scales-input', '200,300');
  await page.locator('button:visible', { hasText: 'Crear escalas' }).last().click(); await page.waitForTimeout(2500);
  note('afterScales', await dbProducts(page, 'fixq01'));
  await shot('15-after-scales');

  await page.locator('img[src*="duplicate.svg"]').first().evaluate(e => e.closest('button').click()); await page.waitForTimeout(800);
  note('afterDuplicateIds', (await dbProducts(page, 'fixq01')).map(p => p.id));
  await page.getByText('+ Agregar Fila').click(); await page.waitForTimeout(800);
  note('afterAddIds', (await dbProducts(page, 'fixq01')).map(p => p.id));

  await page.locator('img[alt="Preview"]').first().click(); await page.waitForTimeout(300);
  await shot('16-image-popup');

  await page.goto(BASE + 'quote/quote-generator/'); await page.waitForTimeout(1500);
  await page.getByText('🔗 Importar desde URL').click(); await page.waitForTimeout(200);
  await shot('17-url-import-panel', true);

  const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Generar cotización' }).click()]);
  note('download-pdf', pdf.suggestedFilename()); await pdf.saveAs(`${OUT}/downloads/legacy-quote.pdf`);

  await page.goto(BASE + 'providers/'); await page.waitForTimeout(1500);
  await shot('18-providers-page');
  await page.getByRole('button', { name: 'Ver detalles' }).first().click(); await page.waitForTimeout(300);
  await shot('19-provider-details');

  fs.writeFileSync(`${OUT}/capture-log.json`, JSON.stringify(log, null, 2));
  await browser.close();
})().catch(e => { console.error(e); fs.writeFileSync(`${OUT}/capture-log.json`, JSON.stringify(log, null, 2)); process.exit(1); });
