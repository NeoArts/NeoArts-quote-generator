// Generates the PDF for the same seeded quote in the legacy app and the target app,
// then compares the PDF content (excluding creation date/ID metadata).
// Usage: node e2e/pdf-parity.mjs <legacyQuoteListUrl> <targetBaseUrl> <outDir>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import * as fx from './fixture.mjs';

const [LEGACY = 'http://127.0.0.1:4321/NeoArts-WebTools/', TARGET = 'http://127.0.0.1:4322/', OUT = 'e2e-output'] = process.argv.slice(2);
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(OUT, { recursive: true });

// Precomputed values so both apps print identical rows without editing.
const quote = {
    ...fx.quote,
    products: fx.quote.products.map((p, i) => ({ ...p, ...[
        { costOff: 5400, totalCost: 6400, sellPrice: 9143, totalValue: 914300 },
        { costOff: 810, totalCost: 1110, sellPrice: 1708, totalValue: 854000 },
        { costOff: 5040, totalCost: 6540, sellPrice: 8720, totalValue: 436000 },
    ][i] })),
};

async function pdfFrom(browser, listUrl, openEditor, file) {
    const ctx = await browser.newContext({ acceptDownloads: true });
    const page = await ctx.newPage();
    await page.goto(listUrl);
    await fx.seed(page, { providers: fx.providers, quotes: [quote] });
    await openEditor(page);
    await page.locator('#product-quantity-0').waitFor();
    await page.waitForTimeout(800);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Generar cotización' }).click()]);
    await dl.saveAs(file);
    await ctx.close();
    return dl.suggestedFilename();
}

const normalize = (buf) => buf.toString('latin1')
    .replace(/\/CreationDate \(D:[^)]*\)/g, '')
    .replace(/\/ID \[[^\]]*\]/g, '');

const browser = await chromium.launch({ executablePath: CHROME });
const legacyFile = path.join(OUT, 'parity-legacy.pdf');
const targetFile = path.join(OUT, 'parity-target.pdf');
const legacyName = await pdfFrom(browser, LEGACY + 'quote/', async page => {
    await page.evaluate(() => localStorage.setItem('currentQuote', 'fixq01'));
    await page.goto(LEGACY + 'quote/quote-generator/');
}, legacyFile);
const targetName = await pdfFrom(browser, TARGET, async page => { await page.goto(TARGET + '#/cotizacion/fixq01'); }, targetFile);
await browser.close();

const a = normalize(fs.readFileSync(legacyFile));
const b = normalize(fs.readFileSync(targetFile));
const result = { legacyName, targetName, sameName: legacyName === targetName, legacyBytes: a.length, targetBytes: b.length, identicalAfterNormalization: a === b };
if (!result.identicalAfterNormalization) {
    const la = a.split('\n'); const lb = b.split('\n');
    const i = la.findIndex((l, k) => l !== lb[k]);
    result.firstDifference = { line: i, legacy: la[i]?.slice(0, 200), target: lb[i]?.slice(0, 200) };
}
fs.writeFileSync(path.join(OUT, 'pdf-parity.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.identicalAfterNormalization && result.sameName ? 0 : 1);
