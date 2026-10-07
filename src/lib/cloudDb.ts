import type { DocImage, Product, Provider, Quote } from '../types';
import { currentUserId, requireSupabase } from './supabase';
import { normalizeProvider, normalizeQuote } from './numbers';
import { readAsDataUrl } from './images';
import type { ImportResult } from './localDb';

// Supabase-backed storage. Same API as localDb.ts. Quotes keep their listing fields as columns and the
// rest in `data`; product images are files in the private "product-images" bucket, referenced by path.

const BUCKET = 'product-images';
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_UPLOAD = 1.5 * 1024 * 1024;

type QuoteRow = { id: string; number: string; client: string; date: string; data: Partial<Quote> | null };

// Session caches: avoid re-uploading the same pasted image and re-downloading the same file.
// Bounded (most recent entries), because images are large strings: an unbounded cache crashed the tab
// when uploading a browser with hundreds of MB of legacy images.
class RecentMap<V> extends Map<string, V> {
    constructor(private readonly limit: number) { super(); }
    override set(key: string, value: V): this {
        this.delete(key);
        super.set(key, value);
        while (this.size > this.limit) this.delete(this.keys().next().value as string);
        return this;
    }
}
const uploadedByDataUrl = new RecentMap<{ path: string; thumbPath?: string }>(40);
const dataUrlByPath = new RecentMap<string>(80);

export function clearCloudCaches(): void {
    uploadedByDataUrl.clear();
    dataUrlByPath.clear();
}

const MAX_SOURCE = 15 * 1024 * 1024;

/** Re-encodes as JPEG on white (transparent areas would turn black), at most `maxWidth` px wide. */
async function reencode(blob: Blob, maxWidth: number, quality: number): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', quality));
}

async function toUploadable(blob: Blob): Promise<Blob> {
    if (blob.size > MAX_SOURCE) throw new Error('La imagen es demasiado grande (máximo 15 MB).');
    if (ALLOWED.includes(blob.type) && blob.size <= MAX_UPLOAD) return blob;
    // Large or unusual formats are re-encoded as JPEG (max 1600 px wide) to fit the bucket limits.
    return reencode(blob, 1600, 0.85);
}

type Uploaded = { path: string; thumbPath?: string };

async function uploadImage(dataUrl: string, userId: string): Promise<Uploaded> {
    const cached = uploadedByDataUrl.get(dataUrl);
    if (cached) return cached;
    const source = await (await fetch(dataUrl)).blob();
    const blob = await toUploadable(source);
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const base = `${userId}/${crypto.randomUUID()}`;
    const storage = requireSupabase().storage.from(BUCKET);
    const { error } = await storage.upload(`${base}.${ext}`, blob, { contentType: blob.type, upsert: false });
    if (error) throw new Error(`No se pudo subir una imagen: ${error.message}`);
    const uploaded: Uploaded = { path: `${base}.${ext}` };
    // Small preview for lists; a failure here only means lists fall back to the full image.
    try {
        const thumb = await reencode(source, 160, 0.8);
        if (!(await storage.upload(`${base}.thumb.jpg`, thumb, { contentType: 'image/jpeg', upsert: false })).error) uploaded.thumbPath = `${base}.thumb.jpg`;
    } catch { /* keep the full image only */ }
    uploadedByDataUrl.set(dataUrl, uploaded);
    dataUrlByPath.set(uploaded.path, dataUrl);
    return uploaded;
}

export async function downloadImage(path: string): Promise<string> {
    const cached = dataUrlByPath.get(path);
    if (cached) return cached;
    const { data, error } = await requireSupabase().storage.from(BUCKET).download(path);
    if (error || !data) return ''; // a missing file shows as "no image" instead of breaking the quote
    const dataUrl = await readAsDataUrl(data);
    dataUrlByPath.set(path, dataUrl);
    return dataUrl;
}

/** Stored form: images as paths only. Pasted images (data URLs) are uploaded first. */
async function dehydrate(quote: Quote, userId: string): Promise<Quote> {
    const products = await Promise.all(quote.products.map(async (p): Promise<Product> => {
        const img = p.image ?? { base64String: '', height: 0 };
        // An image that still has its path was not replaced (pasting a new image drops the path).
        if (img.path) return { ...p, image: { base64String: '', height: img.height, path: img.path, ...(img.thumbPath ? { thumbPath: img.thumbPath } : {}) } };
        if (img.base64String?.startsWith('data:')) return { ...p, image: { base64String: '', height: img.height, ...(await uploadImage(img.base64String, userId)) } };
        return { ...p, image: { base64String: '', height: img.height } };
    }));
    return normalizeQuote({ ...quote, products });
}

/** Editable form: images downloaded as data URLs (needed by the editor, PDF and JSON export). */
async function hydrate(quote: Quote): Promise<Quote> {
    const products = await Promise.all(quote.products.map(async p => {
        const path = p.image?.path;
        return path ? { ...p, image: { ...p.image, base64String: await downloadImage(path) } as DocImage } : p;
    }));
    return { ...quote, products };
}

const toRow = (q: Quote) => {
    const { id, number, client, date, ...data } = q;
    return { id, number: number ?? '', client: client ?? '', date: date ?? '', data };
};
const fromRow = (r: QuoteRow): Quote => ({ ...(r.data ?? {}), id: r.id, number: r.number, client: r.client, date: r.date, products: r.data?.products ?? [] });

function fail(action: string, error: { message: string } | null): never {
    throw new Error(`${action}: ${error?.message ?? 'error desconocido'}`);
}

/** List view: no image downloads; the first images get short-lived signed URLs for thumbnails. */
export async function getQuotes(): Promise<Quote[]> {
    const db = requireSupabase();
    const { data, error } = await db.from('quotes').select('id, number, client, date, data').order('date', { ascending: false });
    if (error) fail('No se pudieron cargar las cotizaciones', error);
    const quotes = (data as QuoteRow[]).map(fromRow);
    // Small previews where available (images saved before thumbnails existed fall back to the full file).
    const preview = (p: Product) => p.image?.thumbPath ?? p.image?.path;
    const paths = [...new Set(quotes.flatMap(q => q.products.map(preview).filter((x): x is string => !!x)))];
    if (paths.length === 0) return quotes;
    const urlByPath = new Map<string, string>();
    for (let i = 0; i < paths.length; i += 500) {
        const { data: signed } = await db.storage.from(BUCKET).createSignedUrls(paths.slice(i, i + 500), 3600);
        (signed ?? []).forEach(s => { if (s.signedUrl && s.path) urlByPath.set(s.path, s.signedUrl); });
    }
    return quotes.map(q => ({ ...q, products: q.products.map(p => { const u = preview(p) && urlByPath.get(preview(p)!); return u ? { ...p, image: { ...p.image, base64String: u } } : p; }) }));
}

export async function getQuote(id: string): Promise<Quote | undefined> {
    const { data, error } = await requireSupabase().from('quotes').select('id, number, client, date, data').eq('id', id).maybeSingle();
    if (error) fail('No se pudo cargar la cotización', error);
    return data ? hydrate(fromRow(data as QuoteRow)) : undefined;
}

export async function putQuote(quote: Quote): Promise<void> {
    const userId = await currentUserId();
    const row = toRow(await dehydrate(quote, userId));
    const { error } = await requireSupabase().from('quotes').upsert({ ...row, user_id: userId }, { onConflict: 'user_id,id' });
    if (error) fail('No se pudo guardar la cotización', error);
}

// ponytail: image files are never deleted (they may be shared by duplicated rows, undo and other quotes).
// The free plan has 1 GB; add a cleanup of unreferenced files if storage ever gets close.
export async function deleteQuote(id: string): Promise<void> {
    const { error } = await requireSupabase().from('quotes').delete().eq('id', id);
    if (error) fail('No se pudo eliminar la cotización', error);
}

/** Adds quotes without overwriting: existing ids count as duplicates (legacy import semantics). */
export async function importQuotes(quotes: Quote[]): Promise<ImportResult> {
    const ids = [...new Set(quotes.map(q => q.id))];
    const { data, error } = await requireSupabase().from('quotes').select('id').in('id', ids);
    if (error) fail('No se pudieron revisar las cotizaciones existentes', error);
    const existing = new Set((data ?? []).map((r: { id: string }) => r.id));
    const result: ImportResult = { success: 0, duplicates: 0, errors: 0 };
    for (const quote of quotes) {
        if (existing.has(quote.id)) { result.duplicates++; continue; }
        try { await putQuote(quote); existing.add(quote.id); result.success++; } catch { result.errors++; }
    }
    return result;
}

export async function suggestNextNumber(): Promise<string> {
    const { data, error } = await requireSupabase().from('quotes').select('number');
    if (error) return '';
    const numbers = (data ?? []).map((r: { number: string }) => Number(r.number)).filter(n => Number.isInteger(n) && n >= 0);
    return numbers.length ? String(Math.max(...numbers) + 1) : '';
}

// Providers --------------------------------------------------------------------

type ProviderRow = { name: string; discount: number; wholesale_discount: Provider['wholesaleDiscount'] };

export async function fetchProviders(): Promise<Provider[]> {
    const { data, error } = await requireSupabase().from('providers').select('name, discount, wholesale_discount').order('created_at');
    if (error) fail('No se pudieron cargar los proveedores', error);
    return (data as ProviderRow[]).map((r, i) => ({ id: i + 1, name: r.name, discount: Number(r.discount), wholesaleDiscount: r.wholesale_discount ?? [] }));
}

export async function upsertProviders(providers: Provider[]): Promise<void> {
    if (providers.length === 0) return;
    const userId = await currentUserId();
    const rows = providers.map(normalizeProvider).map(p => ({ user_id: userId, name: p.name, discount: Number(p.discount) || 0, wholesale_discount: p.wholesaleDiscount ?? [] }));
    const { error } = await requireSupabase().from('providers').upsert(rows, { onConflict: 'user_id,name' });
    if (error) fail('No se pudo guardar el proveedor', error);
}

export async function removeProvider(name: string): Promise<void> {
    const { error } = await requireSupabase().from('providers').delete().eq('name', name);
    if (error) fail('No se pudo eliminar el proveedor', error);
}
