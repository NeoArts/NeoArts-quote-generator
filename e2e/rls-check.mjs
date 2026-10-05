// Verifies row level security directly against the API: one user can never read or change another user's
// quotes, providers or image files. Usage: node e2e/rls-check.mjs <supabaseUrl> <publishableKey>
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';

const [url, key] = process.argv.slice(2);
const run = Date.now().toString(36);
const client = () => createClient(url, key, { auth: { persistSession: false } });

async function user(name) {
    const c = client();
    const { data, error } = await c.auth.signUp({ email: `${name}.${run}@example.com`, password: 'clave-segura-rls' });
    if (error || !data.session) throw new Error(`signup ${name}: ${error?.message ?? 'no session (email confirmation on?)'}`);
    return { c, id: data.user.id };
}

const a = await user('rls-a');
const b = await user('rls-b');
const anon = client();
const checks = [];
const check = (name, ok) => { checks.push({ name, ok }); console.log(ok ? 'PASS' : 'FAIL', name); };

// A creates data
await a.c.from('providers').insert({ name: 'SECRETO', discount: 0.5 });
await a.c.from('quotes').insert({ id: 'qa', number: '1', client: 'Privado', date: '2026-01-01', data: {} });
const path = `${a.id}/privada.png`;
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==', 'base64'));
const up = await a.c.storage.from('product-images').upload(path, png, { contentType: 'image/png' });
check('A can upload into own folder', !up.error);

// B tries to read / change A's data
check('B sees no A quotes', ((await b.c.from('quotes').select('*')).data ?? []).length === 0);
check('B sees no A providers', ((await b.c.from('providers').select('*')).data ?? []).length === 0);
await b.c.from('quotes').update({ client: 'hackeado' }).eq('id', 'qa');
await b.c.from('quotes').delete().eq('id', 'qa');
const still = (await a.c.from('quotes').select('client').eq('id', 'qa')).data;
check('B cannot update or delete A quote', still?.length === 1 && still[0].client === 'Privado');
const spoof = await b.c.from('quotes').insert({ id: 'qx', user_id: a.id, data: {} });
check('B cannot insert rows as A', !!spoof.error);
check('B cannot download A image', !!(await b.c.storage.from('product-images').download(path)).error);
check('B cannot upload into A folder', !!(await b.c.storage.from('product-images').upload(`${a.id}/x.png`, png, { contentType: 'image/png' })).error);
check('B cannot sign A image URL', !!(await b.c.storage.from('product-images').createSignedUrl(path, 60)).error);

// Anonymous (not signed in)
check('anon sees no quotes', ((await anon.from('quotes').select('*')).data ?? []).length === 0);
check('anon cannot insert quotes', !!(await anon.from('quotes').insert({ id: 'qz', data: {} })).error);
check('anon cannot download images', !!(await anon.storage.from('product-images').download(path)).error);

// A still has full access
check('A reads own quote', ((await a.c.from('quotes').select('*')).data ?? []).length === 1);
check('A downloads own image', !(await a.c.storage.from('product-images').download(path)).error);

const failed = checks.filter(c => !c.ok).length;
console.log(`${checks.length - failed}/${checks.length} passed`);
assert.equal(failed, 0);
