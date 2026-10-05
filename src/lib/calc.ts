import type { Product, Provider } from '../types';
import { getProviders } from './providers';

// Faithful port of legacy ProductCalc.ts. Quirks are intentional and covered by
// characterization tests against the legacy module (tests/calc.test.ts):
// - providerDiscount display uses `provider.discount || product.providerDiscount`,
//   but the cost calculation uses provider.discount even when it is 0.
// - Inputs may be numeric strings; arithmetic relies on JS coercion like the legacy code.

const findProvider = (providers: Provider[], name: string) => providers.find(p => p.name === name);

export function wholesaleDiscount(product: Product, generalDiscount: number, allProducts: Product[] | undefined, providers: Provider[]): number {
    const provider = findProvider(providers, product.provider);
    if (!provider || provider.wholesaleDiscount.length === 0) return 0;

    let totalCost: number;
    if (product.discountGroup && allProducts) {
        totalCost = allProducts
            .filter(p => p.discountGroup === product.discountGroup && p.provider === product.provider && p.discountGroup !== '' && p.discountGroup !== undefined)
            .reduce((sum, p) => sum + Number(p.cost) * Number(1 - generalDiscount) * p.quantity, 0);
    } else {
        totalCost = Number(product.cost) * Number(1 - generalDiscount) * product.quantity;
    }

    const tiers = [...provider.wholesaleDiscount].sort((a, b) => b.amount - a.amount);
    const tier = tiers.find(t => totalCost >= t.amount);
    return tier ? tier.discount : 0;
}

export function withAutomatedFields(product: Product, allProducts?: Product[], providers: Provider[] = getProviders()): Product {
    const provider = findProvider(providers, product.provider);
    const providerDiscount = provider?.discount || product.providerDiscount;
    const generalDiscount = provider ? provider.discount : product.providerDiscount;
    const extra = wholesaleDiscount(product, generalDiscount, allProducts, providers);
    const firstDiscount = product.cost * (1 - generalDiscount);
    const costOff = Math.ceil(firstDiscount * (1 - extra) * 100) / 100;
    const totalCost = Number(costOff) + Number(product.markCost) + Number(product.otherCost);
    const sellPrice = Math.round(totalCost / (product.profit ? Number(product.profit / 100) : 1));
    return { ...product, providerDiscount, costOff, totalCost, sellPrice, totalValue: Number(sellPrice) * Number(product.quantity) };
}

/**
 * Apply an edited product at `index` and recalculate like the legacy table:
 * the edited row is recalculated, and when it has a discount group every row of the
 * same group and provider is recalculated against the updated list.
 * `providers` must be the quote's effective providers (frozen terms, see terms.ts).
 */
export function applyProductUpdate(products: Product[], index: number, edited: Product, providers: Provider[] = getProviders()): Product[] {
    const previous = products[index];
    const recalculated = withAutomatedFields(edited, products, providers);
    const updated = products.map((p, i) => (i === index ? recalculated : p));
    const inGroup = (group: string | undefined, provider: string) => (p: Product) => !!group && p.discountGroup === group && p.provider === provider;
    const newGroup = inGroup(recalculated.discountGroup, recalculated.provider);
    // Rows left behind in the previous group also lose (or gain) volume, so recalculate them too
    // (legacy left them stale until their next edit — IMPROVEMENT-004).
    const oldGroup = previous && (previous.discountGroup !== recalculated.discountGroup || previous.provider !== recalculated.provider)
        ? inGroup(previous.discountGroup, previous.provider) : () => false;
    return updated.map(p => (newGroup(p) || oldGroup(p) ? withAutomatedFields(p, updated, providers) : p));
}

/** Next unique product id (fixes legacy duplicate ids, see DECISIONS D-003). */
export const nextProductId = (products: Product[]): number =>
    products.reduce((max, p) => Math.max(max, Number(p.id) || 0), -1) + 1;

/** Recalculates every row in the same discount group and provider as `ref` (used after add/remove/duplicate). */
export function recalcGroupOf(products: Product[], ref: Product | undefined, providers: Provider[]): Product[] {
    if (!ref?.discountGroup) return products;
    return products.map(p => (p.discountGroup === ref.discountGroup && p.provider === ref.provider ? withAutomatedFields(p, products, providers) : p));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
}
