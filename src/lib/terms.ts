import type { Provider, ProviderTerms, Quote } from '../types';
import { withAutomatedFields } from './calc';

// Each quote freezes the discount terms of the providers it uses (IMPROVEMENT-004 as decided by the user):
// editing a provider never changes existing quotes; the editor offers to apply the new terms instead.

const termsOf = (p: Provider): ProviderTerms => ({ discount: p.discount, wholesaleDiscount: p.wholesaleDiscount ?? [] });

/** Comparable form: numeric values, tiers ordered by amount. */
export function signature(t: ProviderTerms): string {
    const tiers = (t.wholesaleDiscount ?? []).map(d => [Number(d.amount), Number(d.discount)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    return JSON.stringify([Number(t.discount), tiers]);
}

const usedProviders = (quote: Quote) => new Set(quote.products.map(p => p.provider).filter(Boolean));

/** Freezes current terms for used providers that have none yet. Returns the same object when nothing changes. */
export function withFrozenTerms(quote: Quote, current: Provider[]): Quote {
    const frozen = quote.providerTerms ?? {};
    const missing = current.filter(p => usedProviders(quote).has(p.name) && !frozen[p.name]);
    if (missing.length === 0) return quote;
    return { ...quote, providerTerms: { ...frozen, ...Object.fromEntries(missing.map(p => [p.name, termsOf(p)])) } };
}

/** Providers as seen by this quote: frozen terms win; deleted providers keep working through their frozen terms. */
export function effectiveProviders(quote: Quote, current: Provider[]): Provider[] {
    const frozen = quote.providerTerms ?? {};
    const fromCurrent = current.map(p => (frozen[p.name] ? { ...p, ...frozen[p.name] } : p));
    const deleted = Object.entries(frozen)
        .filter(([name]) => !current.some(p => p.name === name))
        .map(([name, t], i) => ({ id: -1 - i, name, ...t }));
    return [...fromCurrent, ...deleted];
}

export type TermsChange = { name: string; before: ProviderTerms; after: ProviderTerms };

/** Used providers whose current terms differ from the frozen ones and were not ignored. */
export function pendingChanges(quote: Quote, current: Provider[]): TermsChange[] {
    const frozen = quote.providerTerms ?? {};
    const used = usedProviders(quote);
    return current
        .filter(p => used.has(p.name) && frozen[p.name])
        .map(p => ({ name: p.name, before: frozen[p.name], after: termsOf(p) }))
        .filter(c => signature(c.before) !== signature(c.after) && quote.ignoredProviderChanges?.[c.name] !== signature(c.after));
}

/** Adopts the provider's current terms and recalculates its rows. */
export function applyChange(quote: Quote, change: TermsChange, current: Provider[]): Quote {
    const { [change.name]: _ignored, ...ignored } = quote.ignoredProviderChanges ?? {};
    const next: Quote = { ...quote, providerTerms: { ...quote.providerTerms, [change.name]: change.after }, ignoredProviderChanges: ignored };
    const providers = effectiveProviders(next, current);
    return { ...next, products: next.products.map(p => (p.provider === change.name ? withAutomatedFields(p, next.products, providers) : p)) };
}

export const ignoreChange = (quote: Quote, change: TermsChange): Quote =>
    ({ ...quote, ignoredProviderChanges: { ...quote.ignoredProviderChanges, [change.name]: signature(change.after) } });
