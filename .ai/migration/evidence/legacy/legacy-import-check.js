const { chromium } = require('playwright-core'); const fx = require('./fixture');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await (await b.newContext()).newPage(); const toasts = [];
  await page.goto('http://127.0.0.1:4321/NeoArts-WebTools/quote/');
  await fx.seed(page, { providers: [], quotes: [fx.quote2] }); await page.reload(); await page.waitForTimeout(1000);
  await page.locator('#file-upload').setInputFiles([
    { name: 'dup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fx.quote2)) },
    { name: 'new.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...fx.quote2, id: 'imp09', client: 'Nuevo' })) }]);
  await page.waitForTimeout(800);
  await page.getByText('Importar Cotizaciones', { exact: true }).last().click();
  await page.waitForTimeout(1000);
  const msgs = await page.locator('[role=status]').allTextContents();
  const ids = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('QuotesDB', 1); q.onsuccess = () => { const g = q.result.transaction('quotes').objectStore('quotes').getAllKeys(); g.onsuccess = () => r(g.result); }; }));
  console.log(JSON.stringify({ toasts: msgs, idsAfterImport: ids }));
  await b.close();
})();
