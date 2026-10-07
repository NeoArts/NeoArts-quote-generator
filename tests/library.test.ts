import { describe, expect, it } from 'vitest';
import { buildLibrary, searchLibrary } from '../src/lib/library';
import { emptyProduct, type Quote } from '../src/types';

const p = (name: string, extra: Record<string, unknown> = {}) => ({ ...emptyProduct, name, ...extra });
const quotes: Quote[] = [
    { id: 'old', client: 'A', number: '1', date: '2025-01-10', products: [p('Mug cerámico', { provider: 'PROMOS', markType: '1 TINTA', cost: 9000 }), p('')] },
    { id: 'new', client: 'B', number: '2', date: '2025-06-01', products: [p('mug ceramico', { provider: 'PROMOS', markType: '1 tinta', cost: 9500, profit: 70 }), p('Libreta', { provider: 'MP' })] },
    { id: 'legacy', client: 'C', number: '3', date: '15/03/2025', products: [p('Bolígrafo', { provider: 'PROMOS', markType: 'LASER', image: { base64String: 'data:image/png;base64,AA', height: 50 } })] },
    { id: 'open', client: 'D', number: '4', date: '2025-07-01', products: [p('Gorra')] },
];

describe('product library', () => {
    it('keeps one entry per name+provider+print type, most recent wins, skips blank names and the open quote', () => {
        const lib = buildLibrary(quotes, 'open');
        expect(lib.map(e => e.name)).toEqual(['mug ceramico', 'Libreta', 'Bolígrafo']);
        expect(lib[0]).toMatchObject({ cost: 9500, profit: 70, quoteId: 'new', client: 'B' });
        expect(lib.find(e => e.name === 'Bolígrafo')).toMatchObject({ hasImage: true, imageHeight: 50, thumb: 'data:image/png;base64,AA' });
    });
    it('searches by words, ignoring accents and case, across name, provider and print type', () => {
        const lib = buildLibrary(quotes);
        expect(searchLibrary(lib, 'MUG').map(e => e.name)).toEqual(['mug ceramico']);
        expect(searchLibrary(lib, 'boligrafo laser').map(e => e.name)).toEqual(['Bolígrafo']);
        expect(searchLibrary(lib, 'promos').length).toBe(2);
        expect(searchLibrary(lib, 'm')).toEqual([]);
        expect(searchLibrary(lib, 'zzz')).toEqual([]);
    });
});
