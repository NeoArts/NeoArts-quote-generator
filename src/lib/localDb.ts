import type { Quote } from '../types';
import { normalizeQuote } from './numbers';

// Same database/store as the legacy app (QuotesDB v1, store "quotes", keyPath "id").
const DB_NAME = 'QuotesDB';
const STORE = 'quotes';

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE)) {
                request.result.createObjectStore(STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openDb();
    try {
        return await new Promise<T>((resolve, reject) => {
            const request = action(db.transaction(STORE, mode).objectStore(STORE));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
}

export const getQuotes = () => run<Quote[]>('readonly', s => s.getAll());
export const getQuote = (id: string) => run<Quote | undefined>('readonly', s => s.get(id));
export const putQuote = (quote: Quote) => run('readwrite', s => s.put(normalizeQuote(quote)));
export const deleteQuote = (id: string) => run('readwrite', s => s.delete(id));

export type ImportResult = { success: number; duplicates: number; errors: number };

/** Adds quotes without overwriting: existing ids count as duplicates (legacy import semantics). */
export async function importQuotes(quotes: Quote[]): Promise<ImportResult> {
    const db = await openDb();
    try {
        return await new Promise<ImportResult>((resolve, reject) => {
            const result: ImportResult = { success: 0, duplicates: 0, errors: 0 };
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            quotes.forEach(quote => {
                const request = store.add(quote);
                request.onsuccess = () => { result.success++; };
                request.onerror = (event) => {
                    if (request.error?.name === 'ConstraintError') result.duplicates++;
                    else result.errors++;
                    // Keep the transaction alive so the remaining quotes are still imported.
                    event.preventDefault();
                    event.stopPropagation();
                };
            });
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
        });
    } finally {
        db.close();
    }
}

/** IMPROVEMENT-002: highest numeric quote number + 1 ('' when there is none). */
export async function suggestNextNumber(): Promise<string> {
    const numbers = (await getQuotes()).map(q => Number(q.number)).filter(n => Number.isInteger(n) && n >= 0);
    return numbers.length ? String(Math.max(...numbers) + 1) : '';
}

/** Number of quotes without loading them (legacy data can hold hundreds of MB of images). */
export const countQuotes = () => run<number>('readonly', s => s.count());
export const getQuoteIds = () => run<IDBValidKey[]>('readonly', s => s.getAllKeys()).then(keys => keys.map(String));
