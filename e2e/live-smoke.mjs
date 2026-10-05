// Smoke test of the deployed site (no account needed). Usage: node e2e/live-smoke.mjs [url] [outDir]
import { chromium } from 'playwright-core';
const URL = process.argv[2] ?? 'https://neoarts.github.io/NeoArts-quote-generator/';
const OUT = process.argv[3] ?? '.';
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('console', m => { if (m.type() === 'error' && !/status of 400/.test(m.text())) problems.push(m.text()); });
page.on('pageerror', e => problems.push(e.message));
page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/auth/v1/token')) problems.push(`${r.status()} ${r.url()}`); });
await page.goto(URL);
await page.locator('#auth-email').waitFor({ timeout: 20000 });
await page.screenshot({ path: `${OUT}/live-login.png` });
await page.fill('#auth-email', 'nadie@example.com');
await page.fill('#auth-password', 'incorrecta1');
await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click();
await page.getByText('Correo o contraseña incorrectos.').waitFor({ timeout: 20000 });
const fontsOk = await page.evaluate(() => document.fonts.check('16px Archivo'));
// Lazy PDF engine assets resolve under the Pages base path
const assets = await page.evaluate(async () => {
    const links = [...document.querySelectorAll('script[src], link[href]')].map(e => e.src || e.href).filter(u => u.includes('/assets/'));
    return Promise.all(links.map(async u => (await fetch(u)).status));
});
console.log(JSON.stringify({ url: URL, login: 'ok', supabaseAuth: 'ok', fontsOk, assetStatuses: assets, problems }, null, 1));
await b.close();
process.exit(problems.length ? 1 : 0);
