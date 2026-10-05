// Reproduces sign-up -> email confirmation link -> first entry, with legacy data in the browser,
// and watches for render/request loops. Needs the local Supabase stack with confirmations on.
// Usage: node e2e/confirm-flow.mjs [baseUrl] [mailpitUrl]
import { chromium } from 'playwright-core';
import * as fx from './fixture.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:4322/';
const MAIL = process.argv[3] ?? 'http://127.0.0.1:54324';
const email = `confirma.${Date.now().toString(36)}@example.com`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--js-flags=--expose-gc'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
let requests = 0;
const byUrl = new Map();
page.on('console', m => logs.push(`${m.type()}: ${m.text().slice(0, 300)}`));
page.on('pageerror', e => logs.push(`pageerror: ${e.message}`));
page.on('request', r => { requests++; const k = r.method() + ' ' + r.url().split('?')[0]; byUrl.set(k, (byUrl.get(k) ?? 0) + 1); });
page.on('crash', () => logs.push('PAGE CRASHED'));

await page.goto(BASE);
// Realistic legacy volume: many quotes with large pasted images (HEAVY=quotes count).
const HEAVY = Number(process.env.HEAVY ?? 0);
if (HEAVY) {
    await page.evaluate(async (n) => {
        const big = 'data:image/png;base64,' + 'A'.repeat(400_000);
        const quotes = Array.from({ length: n }, (_, i) => ({ id: 'h' + i, client: 'Cliente ' + i, number: String(i), date: '2025-01-01',
            products: Array.from({ length: 8 }, (_, j) => ({ id: j, name: 'P' + j, markType: '', provider: 'PROMOS', providerDiscount: 0.4, cost: 1000, quantity: 10, costOff: 0, markCost: 0, otherCost: 0, totalCost: 0, sellPrice: 0, totalValue: 0, profit: 50, image: { base64String: big + String(i * 8 + j).padStart(4, 'A').replace(/[^A-Za-z0-9]/g, 'A'), height: 100 } })) }));
        await new Promise((res, rej) => { const r = indexedDB.open('QuotesDB', 1);
            r.onupgradeneeded = () => r.result.createObjectStore('quotes', { keyPath: 'id' });
            r.onsuccess = () => { const tx = r.result.transaction('quotes', 'readwrite'); quotes.forEach(q => tx.objectStore('quotes').put(q)); tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = rej; }; });
        localStorage.setItem('providers', JSON.stringify([{ id: 1, name: 'PROMOS', discount: 0.4, wholesaleDiscount: [] }]));
    }, HEAVY);
} else {
    await fx.seed(page, { providers: fx.providers, quotes: [fx.quote, fx.quote2] });
}
await page.reload();
await page.getByRole('tab', { name: 'Crear cuenta' }).click();
await page.fill('#auth-email', email);
await page.fill('#auth-password', 'clave-segura-1');
await page.getByRole('button', { name: 'Crear cuenta', exact: true }).last().click();
await page.getByText(/Te enviamos un correo/).waitFor({ timeout: 15000 });
console.log('signup ok, waiting for email');

let link = '';
for (let i = 0; i < 20 && !link; i++) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent('to:' + email)}`)).json();
    const id = list.messages?.[0]?.ID;
    if (id) {
        const msg = await (await fetch(`${MAIL}/api/v1/message/${id}`)).json();
        link = (msg.HTML || msg.Text).match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? '';
    }
    if (!link) await new Promise(r => setTimeout(r, 500));
}
console.log('confirmation link:', link.replace(/token=[^&]+/, 'token=…'));

requests = 0; byUrl.clear();
await page.goto(link);
const t0 = Date.now();
const samples = [];
for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    const heap = await page.evaluate(() => (window.gc?.(), (performance.memory?.usedJSHeapSize ?? 0) / 1e6)).catch(() => -1);
    samples.push({ s: i + 1, requests, heapMB: Math.round(heap) });
}
console.log('url after:', page.url());
if (process.env.UPLOAD) {
    const t = Date.now();
    let peak = 0;
    await page.getByRole('button', { name: 'Subir a mi cuenta' }).click();
    while (Date.now() - t < 240000) {
        const heap = await page.evaluate(() => (window.gc?.(), (performance.memory?.usedJSHeapSize ?? 0) / 1e6)).catch(() => -1);
        peak = Math.max(peak, heap);
        if (await page.getByText('Este navegador tiene datos sin subir a tu cuenta.').count() === 0) break;
        await page.waitForTimeout(1000);
    }
    const rows = await page.locator('ul > li').count();
    console.log('upload:', JSON.stringify({ seconds: Math.round((Date.now() - t) / 1000), peakHeapMB: Math.round(peak), quotesListed: rows }));
}
console.log('samples:', JSON.stringify(samples));
console.log('top requests:', JSON.stringify([...byUrl.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)));
console.log('visible:', await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(e => 'ERR ' + e.message));
console.log('logs:', JSON.stringify(logs.slice(-15), null, 1));
await browser.close();
