import type { Quote } from '../types';

// Product library: every product ever quoted, so a name typed in a new row can be filled in from history.
// Built from the quote list (no full-size images); the picked product's image is fetched on demand.

export type LibraryEntry = {
    key: string;
    name: string;
    markType: string;
    provider: string;
    cost: number;
    markCost: number;
    otherCost: number;
    profit: number;
    quantity: number;
    /** Where the product was last quoted (to fetch its image). */
    quoteId: string;
    productIndex: number;
    client: string;
    date: string;
    thumb: string;
    hasImage: boolean;
    /** Cloud: storage path of the full image. Browser mode: thumb is already the full data URL. */
    imagePath?: string;
    thumbPath?: string;
    imageHeight: number;
};

const fold = (s: unknown) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const dateKey = (d: string) => (d || '').split('/').reverse().join('-');

/** One entry per name + provider + print type, keeping the most recent quote's values. */
export function buildLibrary(quotes: Quote[], excludeQuoteId?: string): LibraryEntry[] {
    const byKey = new Map<string, LibraryEntry>();
    for (const q of quotes) {
        if (q.id === excludeQuoteId) continue;
        (q.products ?? []).forEach((p, productIndex) => {
            const name = String(p.name ?? '').trim();
            if (!name) return;
            const key = `${fold(name)}|${fold(p.provider)}|${fold(p.markType)}`;
            const prev = byKey.get(key);
            if (prev && dateKey(prev.date) >= dateKey(q.date)) return;
            byKey.set(key, {
                key, name, productIndex, quoteId: q.id, client: q.client, date: q.date,
                markType: String(p.markType ?? ''), provider: String(p.provider ?? ''),
                cost: Number(p.cost) || 0, markCost: Number(p.markCost) || 0, otherCost: Number(p.otherCost) || 0,
                profit: Number(p.profit) || 0, quantity: Number(p.quantity) || 0,
                thumb: p.image?.base64String ?? '', hasImage: !!(p.image?.base64String || p.image?.path),
                imagePath: p.image?.path, thumbPath: p.image?.thumbPath, imageHeight: Number(p.image?.height) || 0,
            });
        });
    }
    return [...byKey.values()].sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date)));
}

/** Every word must appear in the name, provider or print type (accent- and case-insensitive). */
export function searchLibrary(library: LibraryEntry[], query: string, limit = 8): LibraryEntry[] {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (words.length === 0 || fold(query).length < 2) return [];
    return library.filter(e => {
        const hay = `${fold(e.name)} ${fold(e.provider)} ${fold(e.markType)}`;
        return words.every(w => hay.includes(w));
    }).slice(0, limit);
}
