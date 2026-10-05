// Characterization tests: the target calculation must match the legacy module exactly.
// The legacy source is imported read-only from the sibling NeoArts-WebTools checkout.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyProductUpdate, nextProductId, withAutomatedFields } from '../src/lib/calc';
import { emptyProduct, type Product, type Provider } from '../src/types';
// Legacy module, read-only.
import * as legacy from '../../NeoArts-WebTools/src/features/quote/services/ProductCalc';

const providerSets: Record<string, Provider[]> = {
    none: [],
    tiers: [
        { id: 1, name: 'PROMOS', discount: 0.4, wholesaleDiscount: [{ id: 0, amount: 1000, discount: 0.05 }, { id: 1, amount: 500000, discount: 0.1 }] },
        { id: 2, name: 'MP', discount: 0.3, wholesaleDiscount: [] },
    ],
    // Values saved from inputs are strings in real data.
    strings: [
        { id: 1, name: 'PROMOS', discount: '0.35' as unknown as number, wholesaleDiscount: [{ id: 0, amount: '200000' as unknown as number, discount: '0.07' as unknown as number }] },
        { id: 2, name: 'ZERO', discount: 0, wholesaleDiscount: [{ id: 0, amount: 0, discount: 0 }] },
    ],
};

const p = (over: Partial<Product>): Product => ({ ...emptyProduct, ...over });
const products: Product[] = [
    p({ id: 0, provider: 'PROMOS', cost: 10000, quantity: 100, markCost: 800, otherCost: 200, profit: 70, discountGroup: 'A' }),
    p({ id: 1, provider: 'PROMOS', cost: '1500' as unknown as number, quantity: '500' as unknown as number, markCost: '300' as unknown as number, profit: 65, discountGroup: 'A' }),
    p({ id: 2, provider: 'MP', cost: 8000, quantity: 50, markCost: 1000, otherCost: 500, profit: 75 }),
    p({ id: 3, provider: 'ZERO', providerDiscount: 0.2, cost: 3333, quantity: 7, profit: 0 }),
    p({ id: 4, provider: 'UNKNOWN', providerDiscount: '0.25' as unknown as number, cost: 999.99, quantity: 3, profit: 33 }),
    p({ id: 5, provider: 'PROMOS', cost: 20000, quantity: 30, profit: 60, discountGroup: 'B' }),
    p({ id: 6, provider: 'MP', cost: 1234, quantity: 10, profit: 50, discountGroup: 'A' }),
];

const legacyCompute = (product: Product, all?: Product[]) => {
    const copy = { ...product };
    legacy.setProductAutomatedFields(copy, all);
    return copy;
};

// Legacy flow plus the one intended change (IMPROVEMENT-004): rows left in the previous group are recalculated too.
const expectedUpdate = (all: Product[], edited: Product) => {
    const out = legacyUpdate(all, edited);
    const before = all.find(x => x.id === edited.id)!;
    if (before.discountGroup && (before.discountGroup !== edited.discountGroup || before.provider !== edited.provider)) {
        out.forEach(x => {
            if (x.id !== edited.id && x.discountGroup === before.discountGroup && x.provider === before.provider) legacy.setProductAutomatedFields(x, out);
        });
    }
    return out;
};

// Literal copy of the legacy QuoteTable handleValueChange + updateProduct flow (keyed by id).
const legacyUpdate = (all: Product[], edited: Product) => {
    const updatedProduct = { ...edited };
    legacy.setProductAutomatedFields(updatedProduct, all);
    const updatedProducts = all.map(x => (x.id === updatedProduct.id ? updatedProduct : { ...x }));
    if (updatedProduct.discountGroup) {
        updatedProducts.forEach(x => {
            if (x.discountGroup === updatedProduct.discountGroup && x.provider === updatedProduct.provider) legacy.setProductAutomatedFields(x, updatedProducts);
        });
    }
    return updatedProducts;
};

beforeEach(() => { vi.spyOn(console, 'log').mockImplementation(() => undefined); });

describe.each(Object.keys(providerSets))('provider set %s', (setName) => {
    beforeEach(() => localStorage.setItem('providers', JSON.stringify(providerSets[setName])));

    it.each(products.map((x, i) => [i, x] as const))('row %i matches legacy (individual and grouped)', (_, product) => {
        expect(withAutomatedFields(product)).toEqual(legacyCompute(product));
        expect(withAutomatedFields(product, products)).toEqual(legacyCompute(product, products));
    });

    it.each([
        ['quantity', '250'], ['cost', '12000'], ['discountGroup', 'B'], ['discountGroup', ''], ['provider', 'MP'], ['profit', '80'], ['markCost', '0'],
    ])('editing %s=%s recalculates like legacy', (field, value) => {
        products.forEach((row, index) => {
            const edited = { ...row, [field]: value };
            expect(applyProductUpdate(products, index, edited)).toEqual(expectedUpdate(products, edited));
        });
    });
});

describe('ids', () => {
    it('nextProductId never collides (legacy duplicate/scales did, see D-003)', () => {
        expect(nextProductId([p({ id: 0 }), p({ id: 1 }), p({ id: 2 })])).toBe(3);
        expect(nextProductId([p({ id: 5 }), p({ id: 1 })])).toBe(6);
        expect(nextProductId([])).toBe(0);
    });
});

describe('fixture values observed in the running legacy app', () => {
    it('reproduces evidence/legacy/capture-log.json rowsAfterEditQty0', () => {
        localStorage.setItem('providers', JSON.stringify([
            { id: 1, name: 'PROMOS', discount: 0.4, wholesaleDiscount: [{ id: 0, amount: 1000, discount: 0.05 }, { id: 1, amount: 5000, discount: 0.1 }] },
            { id: 2, name: 'MPPROMO', discount: 0.3, wholesaleDiscount: [] },
        ]));
        const rows = [
            p({ id: 0, provider: 'PROMOS', providerDiscount: 0.4, cost: 10000, quantity: 100, markCost: 800, otherCost: 200, profit: 70, discountGroup: 'A' }),
            p({ id: 1, provider: 'PROMOS', providerDiscount: 0.4, cost: 1500, quantity: 500, markCost: 300, profit: 65, discountGroup: 'A' }),
        ];
        const out = applyProductUpdate(rows, 0, { ...rows[0], quantity: '100' as unknown as number });
        expect(out.map(r => [r.costOff, r.totalCost, r.sellPrice, r.totalValue])).toEqual([[5400, 6400, 9143, 914300], [810, 1110, 1708, 854000]]);
    });
});
