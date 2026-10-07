import type { Quote } from '../types';
import { cloudEnabled } from './supabase';
import * as local from './localDb';
import * as cloud from './cloudDb';

// Storage facade: Supabase when the build is configured for it, otherwise the browser's IndexedDB.
export type { ImportResult } from './localDb';

const backend = cloudEnabled ? cloud : local;

// In-flight saves, so signing out can wait for them (otherwise the last edit could be lost).
const inFlight = new Set<Promise<unknown>>();
export function trackSave<T>(p: Promise<T>): Promise<T> {
    inFlight.add(p);
    p.finally(() => inFlight.delete(p)).catch(() => undefined);
    return p;
}
export const waitForSaves = () => Promise.allSettled([...inFlight]);

export const getQuotes = (): Promise<Quote[]> => backend.getQuotes();
export const getQuote = (id: string): Promise<Quote | undefined> => backend.getQuote(id);
export const putQuote = (quote: Quote): Promise<unknown> => backend.putQuote(quote);
export const deleteQuote = (id: string): Promise<unknown> => backend.deleteQuote(id);
export const importQuotes = (quotes: Quote[]) => backend.importQuotes(quotes);
export const suggestNextNumber = (): Promise<string> => backend.suggestNextNumber();
/** Full image of a stored product (cloud only; in browser mode images are already inline). */
export const loadImage = (path: string): Promise<string> => (cloudEnabled ? cloud.downloadImage(path) : Promise.resolve(''));
