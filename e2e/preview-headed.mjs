// Visual check of the live PDF preview in headed Chrome (headless Chrome has no PDF viewer).
// Usage: node e2e/preview-headed.mjs <outDir>
import { chromium } from 'playwright-core';
import path from 'node:path';
import * as fx from './fixture.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4322/';
const OUT = process.argv[2] ?? 'e2e-output';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: false });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(BASE);
await fx.seed(page, { providers: fx.providers, quotes: [fx.quote] });
await page.goto(BASE + '#/cotizacion/fixq01');
await page.locator('#product-quantity-0').waitFor();
await page.getByRole('button', { name: 'Vista previa del PDF' }).click();
await page.getByText('Actualizada').waitFor({ timeout: 20000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, '25-pdf-preview-headed.png') });
await browser.close();
console.log('ok');
