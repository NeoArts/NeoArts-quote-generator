import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { excelRows, isValidQuote, quoteJsonFileName } from '../src/lib/exporters';
import { sortQuotes } from '../src/components/QuoteList';
import { parseScales } from '../src/components/ProductDetailsModal';
import { deleteQuote, getQuote, getQuotes, importQuotes, putQuote } from '../src/lib/db';
import { spanishDate } from '../src/pdf/generateQuote';
import { emptyProduct, type Provider, type Quote } from '../src/types';
import { applyChange, effectiveProviders, ignoreChange, pendingChanges, withFrozenTerms } from '../src/lib/terms';
import { normalizeProduct, normalizeProvider, toNumber } from '../src/lib/numbers';
import { parseImportFile } from '../src/lib/backup';
import { suggestNextNumber } from '../src/lib/db';
import { moveItem, recalcGroupOf } from '../src/lib/calc';
import { letterDate } from '../src/pdf/generateQuote';
import { quoteTotals } from '../src/components/QuoteExtras';

const q = (id: string, date = '2025-01-01', number = '1'): Quote => ({ id, client: `C ${id}`, number, date, products: [{ ...emptyProduct }] });

describe('quote list ordering (legacy)', () => {
    it('sorts newest first for ISO and DD/MM/YYYY dates', () => {
        const sorted = sortQuotes([q('a', '2025-01-02'), q('b', '2025-03-01'), q('c', '15/02/2025')]);
        expect(sorted.map(x => x.id)).toEqual(['b', 'c', 'a']);
    });
});

describe('JSON import/export (legacy formats)', () => {
    it('validates a single quote object', () => {
        expect(isValidQuote(q('x'))).toBe(true);
        expect(isValidQuote({ foo: 1 })).toBe(false);
        expect(isValidQuote([q('x')])).toBe(false);
        expect(isValidQuote({ ...q('x'), number: '' })).toBe(false);
    });
    it('names files like legacy', () => {
        expect(quoteJsonFileName({ ...q('x'), number: '121', client: 'Otra  Empresa SAS' })).toBe('quote-121-Otra-Empresa-SAS.json');
    });
    it('maps Excel columns correctly (IMPROVEMENT-003) with numeric cells', () => {
        const [row] = excelRows([{ ...emptyProduct, id: 3, name: 'N', markType: 'LASER', providerDiscount: 0.4, markCost: '99' as unknown as number, costOff: 5400 }]);
        expect(Object.keys(row)).toEqual(['Id', 'Artículo', 'Descuento Proveedor', 'Precio con descuento', 'Costo Total', 'Precio de venta', 'Valor total', 'Tipo de marca', 'Proveedor', 'Costo', 'Cantidad', 'Costo de marca', 'Otros costos', 'Rentabilidad']);
        expect(row['Precio con descuento']).toBe(5400);
        expect(row['Costo de marca']).toBe(99);
    });
});

describe('IndexedDB store (QuotesDB/quotes)', () => {
    it('round-trips, imports with duplicate detection, and deletes', async () => {
        await putQuote(q('a'));
        expect((await getQuote('a'))?.client).toBe('C a');
        const result = await importQuotes([q('a'), q('b'), q('c')]);
        expect(result).toEqual({ success: 2, duplicates: 1, errors: 0 });
        expect((await getQuotes()).map(x => x.id).sort()).toEqual(['a', 'b', 'c']);
        await deleteQuote('b');
        expect(await getQuote('b')).toBeUndefined();
    });
});

describe('scales', () => {
    it('parses comma separated quantities like legacy', () => {
        expect(parseScales('100, 1000,10000')).toEqual([100, 1000, 10000]);
    });
});

describe('PDF date', () => {
    it('formats in Spanish like legacy', () => {
        expect(spanishDate(new Date(2025, 9, 5))).toBe('5 de Octubre de 2025');
    });
});

describe('frozen provider terms (IMPROVEMENT-004 as decided)', () => {
    const promos = (discount: number): Provider => ({ id: 1, name: 'PROMOS', discount, wholesaleDiscount: [] });
    const base: Quote = { ...q('t'), products: [{ ...emptyProduct, id: 0, provider: 'PROMOS', cost: 1000, quantity: 1, profit: 50, costOff: 600, totalCost: 600, sellPrice: 1200, totalValue: 1200 }] };

    it('freezes terms once and never recalculates on its own', () => {
        const frozen = withFrozenTerms(base, [promos(0.4)]);
        expect(frozen.providerTerms).toEqual({ PROMOS: { discount: 0.4, wholesaleDiscount: [] } });
        expect(withFrozenTerms(frozen, [promos(0.2)])).toBe(frozen);
        expect(effectiveProviders(frozen, [promos(0.2)])[0].discount).toBe(0.4);
        expect(frozen.products[0].sellPrice).toBe(1200);
    });
    it('keeps working when the provider is deleted', () => {
        const frozen = withFrozenTerms(base, [promos(0.4)]);
        expect(effectiveProviders(frozen, []).map(p => [p.name, p.discount])).toEqual([['PROMOS', 0.4]]);
    });
    it('reports a change and applies it only on request', () => {
        const frozen = withFrozenTerms(base, [promos(0.4)]);
        const [change] = pendingChanges(frozen, [promos(0.2)]);
        expect(change.name).toBe('PROMOS');
        const applied = applyChange(frozen, change, [promos(0.2)]);
        expect(applied.products[0].costOff).toBe(800);
        expect(pendingChanges(applied, [promos(0.2)])).toEqual([]);
    });
    it('ignoring hides that change until the provider changes again', () => {
        const frozen = withFrozenTerms(base, [promos(0.4)]);
        const ignored = ignoreChange(frozen, pendingChanges(frozen, [promos(0.2)])[0]);
        expect(pendingChanges(ignored, [promos(0.2)])).toEqual([]);
        expect(pendingChanges(ignored, [promos(0.1)])).toHaveLength(1);
        expect(ignored.products).toBe(frozen.products);
    });
    it('treats "0.4" and 0.4 as the same terms', () => {
        const frozen = withFrozenTerms(base, [{ ...promos(0), discount: '0.4' as unknown as number }]);
        expect(pendingChanges(frozen, [promos(0.4)])).toEqual([]);
    });
});

describe('numbers (IMPROVEMENT-009)', () => {
    it('stores numeric text as numbers and leaves the rest', () => {
        expect(toNumber('12.5')).toBe(12.5);
        expect(toNumber('')).toBe('');
        expect(toNumber('abc')).toBe('abc');
        expect(normalizeProduct({ ...emptyProduct, cost: '1500' as unknown as number }).cost).toBe(1500);
        expect(normalizeProduct({ ...emptyProduct, name: '123' }).name).toBe('123');
        expect(normalizeProvider({ id: 1, name: 'A', discount: '0.3' as unknown as number, wholesaleDiscount: [{ amount: '1000' as unknown as number, discount: '0.1' as unknown as number }] }))
            .toEqual({ id: 1, name: 'A', discount: 0.3, wholesaleDiscount: [{ amount: 1000, discount: 0.1 }] });
    });
});

describe('backup files (IMPROVEMENT-001)', () => {
    it('accepts legacy quotes, providers files and backups', () => {
        const prov = { id: 1, name: 'P', discount: 0.1, wholesaleDiscount: [] };
        expect(parseImportFile(q('a'))?.quotes).toHaveLength(1);
        expect(parseImportFile({ type: 'neoarts-providers', providers: [prov, { bad: 1 }] })).toEqual({ quotes: [], providers: [prov] });
        expect(parseImportFile({ type: 'neoarts-backup', quotes: [q('a'), { x: 1 }], providers: [prov] })).toEqual({ quotes: [q('a')], providers: [prov] });
        expect(parseImportFile({ type: 'other' })).toBeNull();
        expect(parseImportFile({ type: 'neoarts-backup', quotes: [], providers: [] })).toBeNull();
    });
});

describe('next quote number (IMPROVEMENT-002)', () => {
    it('is max numeric number + 1', async () => {
        await putQuote({ ...q('n1'), number: '119' });
        await putQuote({ ...q('n2'), number: 'ABC-1' });
        expect(await suggestNextNumber()).toBe('120');
    });
});

describe('rows', () => {
    it('moves items', () => {
        expect(moveItem([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
        expect(moveItem([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
        expect(moveItem([1, 2], 0, 5)).toEqual([1, 2]);
    });
    it('recalculates the group after removing a row', () => {
        const providers: Provider[] = [{ id: 1, name: 'P', discount: 0, wholesaleDiscount: [{ amount: 1000, discount: 0.5 }] }];
        const row = (id: number) => ({ ...emptyProduct, id, provider: 'P', cost: 600, quantity: 1, discountGroup: 'A', profit: 0 });
        const [kept] = recalcGroupOf([row(0)], row(1), providers);
        expect(kept.costOff).toBe(600);
    });
});

describe('PDF options (IMPROVEMENT-007)', () => {
    it('uses the quote date when asked', () => {
        expect(letterDate({ ...q('d'), date: '2025-09-15' }, true)).toBe('15 de Septiembre de 2025');
        expect(letterDate({ ...q('d'), date: '2025-09-15' }, false)).toBe(spanishDate());
    });
});

describe('totals (IMPROVEMENT-005)', () => {
    it('sums value, cost, profit and margin', () => {
        const t = quoteTotals([{ ...emptyProduct, totalValue: 914300, totalCost: 6400, quantity: 100 }, { ...emptyProduct, totalValue: '1000' as unknown as number, totalCost: 500, quantity: '1' as unknown as number }]);
        expect(t).toEqual({ value: 915300, cost: 640500, profit: 274800, margin: (274800 / 915300) * 100 });
    });
});
