// Cloud-mode workflows against a Supabase backend (default: the local Docker stack).
// Usage: npm run build:local-db && npx vite preview --port 4322 --outDir dist-local ; node e2e/cloud.mjs <outDir>
// Email confirmation on or off: confirmation links are read from the local test mailbox (Mailpit).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as fx from './fixture.mjs';

const BASE = process.env.E2E_BASE ?? 'http://127.0.0.1:4322/';
const OUT = process.argv[2] ?? 'e2e-cloud-output';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(path.join(OUT, 'downloads'), { recursive: true });

const run = Date.now().toString(36);
const userA = { email: `ana.${run}@example.com`, password: 'clave-segura-1' };
const userB = { email: `beto.${run}@example.com`, password: 'clave-segura-2' };
const userC = { email: `caro.${run}@example.com`, password: 'clave-segura-3' };

const results = [];
const errors = [];
async function step(name, fn) {
    try { await fn(); results.push({ name, status: 'PASS' }); console.log('PASS', name); }
    catch (e) { results.push({ name, status: 'FAIL', error: String(e?.message ?? e) }); console.log('FAIL', name, e?.message ?? e); }
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
page.on('dialog', d => d.accept());
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
const wait = (ms = 300) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const download = async (trigger) => {
    const [dl] = await Promise.all([page.waitForEvent('download'), trigger()]);
    const file = path.join(OUT, 'downloads', dl.suggestedFilename());
    await dl.saveAs(file);
    return { name: dl.suggestedFilename(), file };
};
const MAIL = process.env.MAILPIT ?? 'http://127.0.0.1:54324';
async function confirmationLink(email) {
    for (let i = 0; i < 30; i++) {
        const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent('to:' + email)}`)).json();
        const id = list.messages?.[0]?.ID;
        if (id) {
            const msg = await (await fetch(`${MAIL}/api/v1/message/${id}`)).json();
            const link = (msg.HTML || msg.Text).match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
            if (link) return link;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('confirmation email not received');
}
// Works with email confirmation on (production setting): opens the link from the local test mailbox.
const signUp = async (u) => {
    await page.getByRole('tab', { name: 'Crear cuenta' }).click();
    await page.fill('#auth-email', u.email);
    await page.fill('#auth-password', u.password);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).last().click();
    const signedIn = page.getByRole('button', { name: 'Cerrar sesión' });
    const emailSent = page.getByText(/Te enviamos un correo/);
    await Promise.race([signedIn.waitFor({ timeout: 15000 }), emailSent.waitFor({ timeout: 15000 })]);
    if (await emailSent.count()) {
        await page.goto(await confirmationLink(u.email));
        await signedIn.waitFor({ timeout: 15000 });
    }
};
const signIn = async (u) => {
    await page.fill('#auth-email', u.email);
    await page.fill('#auth-password', u.password);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).waitFor({ timeout: 15000 });
};
const signOut = async () => {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.locator('#auth-email').waitFor();
};

await step('C1 login screen, wrong password message', async () => {
    await page.goto(BASE);
    await page.locator('#auth-email').waitFor();
    await shot('c01-login');
    await page.fill('#auth-email', 'nadie@example.com');
    await page.fill('#auth-password', 'incorrecta');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).last().click();
    await page.getByText('Correo o contraseña incorrectos.').waitFor();
});

await step('C2 sign up user A, create provider and quote, edit, image, autosave to the cloud', async () => {
    await signUp(userA);
    await page.getByText('Aún no hay cotizaciones.').waitFor();
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    await page.getByRole('button', { name: 'Nuevo proveedor' }).first().click();
    await page.fill('#provider-name', 'PROMOS');
    await page.fill('#provider-discount', '0.4');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await page.getByRole('button', { name: 'Editar PROMOS' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Nueva cotización' });
    await dialog.locator('#quote-client').fill('Cliente Nube');
    await dialog.locator('#quote-number').fill('900');
    await dialog.getByRole('button', { name: 'Crear cotización' }).click();
    await page.getByRole('button', { name: /Cliente Nube/ }).click();
    await page.locator('#product-name-0').waitFor();
    await page.fill('#product-name-0', 'Termo');
    await page.locator('#product-provider-0').click();
    await page.getByRole('option', { name: /PROMOS/ }).click();
    await page.fill('#product-cost-0', '10000');
    await page.fill('#product-quantity-0', '10');
    await page.fill('#product-profit-0', '50');
    await page.evaluate(async (src) => { const blob = await (await fetch(src)).blob(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); }, fx.IMG);
    await page.getByTestId('product-row-0').getByRole('button', { name: 'Pegar imagen del portapapeles' }).click();
    await page.getByTestId('product-row-0').getByAltText('Preview').waitFor();
    await page.getByText('Guardado', { exact: true }).waitFor({ timeout: 10000 });
    await wait(1500);
    await shot('c02-editor');
    await page.reload();
    await page.locator('#product-name-0').waitFor({ timeout: 15000 });
    assert.equal(await page.inputValue('#product-name-0'), 'Termo');
    assert.equal(await page.getAttribute('#product-sellPrice-0', 'data-value'), '12000');
    await page.getByTestId('product-row-0').getByAltText('Preview').waitFor({ timeout: 10000 });
});

await step('C3 PDF and JSON export include the cloud image', async () => {
    const pdf = await download(() => page.getByRole('button', { name: 'Descargar PDF' }).click());
    assert.ok(fs.statSync(pdf.file).size > 100000);
    await page.getByRole('link', { name: 'Volver a cotizaciones' }).click();
    await page.getByRole('button', { name: /Cliente Nube/ }).waitFor();
    await page.locator('li', { hasText: 'Cliente Nube' }).locator('img').first().waitFor();
    const thumbSrc = await page.locator('li', { hasText: 'Cliente Nube' }).locator('img').first().getAttribute('src');
    assert.ok(thumbSrc.includes('.thumb.jpg'), 'list uses the small thumbnail');
    const json = await download(() => page.locator('li', { hasText: 'Cliente Nube' }).getByRole('button', { name: 'Descargar JSON' }).click());
    const q = JSON.parse(fs.readFileSync(json.file, 'utf8'));
    assert.ok(q.products[0].image.base64String.startsWith('data:image/'));
    await shot('c03-list');
});

await step('C3b reuse a previous product in a new quote (image comes from the cloud)', async () => {
    await page.getByRole('button', { name: 'Nueva cotización' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Nueva cotización' });
    await dialog.locator('#quote-client').fill('Cliente Segundo');
    await dialog.getByRole('button', { name: 'Crear cotización' }).click();
    await page.getByRole('button', { name: /Cliente Segundo/ }).click();
    await page.locator('#product-name-0').waitFor();
    await wait(1000);
    await page.locator('#product-name-0').fill('');
    await page.locator('#product-name-0').type('term');
    await page.getByRole('listbox', { name: 'Productos cotizados antes' }).waitFor({ timeout: 10000 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.getByTestId('product-row-0').getByAltText('Preview').waitFor({ timeout: 10000 });
    assert.equal(await page.inputValue('#product-cost-0'), '10000');
    assert.equal(await page.getAttribute('#product-sellPrice-0', 'data-value'), '12000');
    await page.getByText('Guardado', { exact: true }).waitFor({ timeout: 10000 });
    await page.getByRole('link', { name: 'Volver a cotizaciones' }).click();
    await page.getByRole('button', { name: /Cliente Segundo/ }).waitFor();
});

await step('C4 user B cannot see user A data', async () => {
    await signOut();
    await signUp(userB);
    await page.getByText('Aún no hay cotizaciones.').waitFor();
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    await page.getByText('Sin proveedores registrados').waitFor();
    await page.keyboard.press('Escape');
    // direct link to A's quote
    const aQuoteId = await page.evaluate(() => localStorage.getItem('currentQuote'));
    await page.goto(BASE + '#/cotizacion/' + aQuoteId);
    await page.getByText('No se encontró la cotización.').waitFor();
    await page.goto(BASE);
});

await step('C5 user A sees their data again after signing back in', async () => {
    await signOut();
    await signIn(userA);
    await page.getByRole('button', { name: /Cliente Nube/ }).waitFor();
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    await page.getByRole('button', { name: 'Editar PROMOS' }).waitFor();
    await page.keyboard.press('Escape');
});

await step('C6 upload this browser\'s legacy data to a new account', async () => {
    await signOut();
    await fx.seed(page, { providers: fx.providers, quotes: [fx.quote, fx.quote2] });
    await signUp(userC);
    await page.getByText('Este navegador tiene datos sin subir a tu cuenta.').waitFor();
    await shot('c06-banner');
    await page.getByRole('button', { name: 'Subir a mi cuenta' }).click();
    await page.getByRole('button', { name: /Cliente Demo SAS/ }).waitFor({ timeout: 20000 });
    await page.getByRole('button', { name: /Otra Empresa/ }).waitFor();
    assert.equal(await page.getByText('Este navegador tiene datos sin subir a tu cuenta.').count(), 0);
    await page.getByRole('button', { name: /Cliente Demo SAS/ }).click();
    await page.getByTestId('product-row-0').getByAltText('Preview').waitFor({ timeout: 10000 });
    await page.getByRole('link', { name: 'Volver a cotizaciones' }).click();
    await page.reload();
    await page.getByRole('button', { name: /Cliente Demo SAS/ }).waitFor();
    assert.equal(await page.getByText('Este navegador tiene datos sin subir a tu cuenta.').count(), 0, 'banner not shown again');
    await page.getByRole('button', { name: 'Proveedores', exact: true }).click();
    await page.getByRole('button', { name: 'Editar MPPROMO' }).waitFor();
    await page.keyboard.press('Escape');
});

await step('C7 delete with undo restores the cloud quote', async () => {
    await page.locator('li', { hasText: 'Otra Empresa' }).getByRole('button', { name: 'Eliminar cotización' }).click();
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await wait(1500);
    await page.reload();
    await page.getByRole('button', { name: /Otra Empresa/ }).waitFor();
});

await step('C8 no page errors', async () => {
    assert.deepEqual(errors, []);
});

fs.writeFileSync(path.join(OUT, 'cloud-results.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), results, errors }, null, 2));
await browser.close();
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
