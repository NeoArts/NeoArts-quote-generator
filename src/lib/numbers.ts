import type { Product, Provider, Quote } from '../types';

// IMPROVEMENT-009: inputs keep the typed text while editing (so "0." can become "0.4"),
// but numbers are stored as numbers. Reads stay tolerant of legacy string data.

export const NUMERIC_FIELDS = ['providerDiscount', 'cost', 'quantity', 'costOff', 'markCost', 'otherCost', 'totalCost', 'sellPrice', 'totalValue', 'profit'] as const;

export function toNumber<T>(value: T): T | number {
    if (typeof value !== 'string' || value.trim() === '') return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
}

export function normalizeProduct(product: Product): Product {
    const out: Record<string, unknown> = { ...product };
    NUMERIC_FIELDS.forEach(f => { out[f] = toNumber(product[f]); });
    return out as Product;
}

export const normalizeQuote = (quote: Quote): Quote => ({ ...quote, products: quote.products.map(normalizeProduct) });

export const normalizeProvider = (provider: Provider): Provider => ({
    ...provider,
    discount: toNumber(provider.discount) as number,
    wholesaleDiscount: (provider.wholesaleDiscount ?? []).map(d => ({ ...d, amount: toNumber(d.amount) as number, discount: toNumber(d.discount) as number })),
});
