import fileSaver from 'file-saver';
import type { Provider, Quote } from '../types';
import { isValidQuote } from './exporters';
import { normalizeQuote } from './numbers';

// IMPROVEMENT-001: portable files for providers and for everything (quotes + providers).
// Legacy single-quote JSON files remain importable.

const BACKUP = 'neoarts-backup';
const PROVIDERS = 'neoarts-providers';

const isProvider = (p: unknown): p is Provider =>
    !!p && typeof p === 'object' && typeof (p as Provider).name === 'string' && (p as Provider).name !== '' && Array.isArray((p as Provider).wholesaleDiscount ?? []);

const stamp = () => new Date().toISOString().split('T')[0];
const save = (data: unknown, name: string) => fileSaver.saveAs(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), name);

export const downloadBackup = (quotes: Quote[], providers: Provider[]) =>
    save({ type: BACKUP, version: 1, exportedAt: new Date().toISOString(), quotes: quotes.map(normalizeQuote), providers }, `respaldo-cotizaciones-${stamp()}.json`);

export const downloadProviders = (providers: Provider[]) =>
    save({ type: PROVIDERS, version: 1, exportedAt: new Date().toISOString(), providers }, `proveedores-${stamp()}.json`);

export type ImportContent = { quotes: Quote[]; providers: Provider[] };

/** Recognizes a legacy single quote, a providers file or a full backup. Returns null for anything else. */
export function parseImportFile(data: unknown): ImportContent | null {
    if (isValidQuote(data)) return { quotes: [data], providers: [] };
    if (!data || typeof data !== 'object') return null;
    const d = data as { type?: string; quotes?: unknown; providers?: unknown };
    if (d.type !== BACKUP && d.type !== PROVIDERS) return null;
    const providers = Array.isArray(d.providers) ? d.providers.filter(isProvider) : [];
    const quotes = d.type === BACKUP && Array.isArray(d.quotes) ? d.quotes.filter(isValidQuote) : [];
    return quotes.length || providers.length ? { quotes, providers } : null;
}
