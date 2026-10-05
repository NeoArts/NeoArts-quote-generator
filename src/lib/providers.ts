import type { Provider } from '../types';
import { normalizeProvider } from './numbers';
import { cloudEnabled } from './supabase';
import { fetchProviders, removeProvider, upsertProviders } from './cloudDb';
import { notify } from './notify';

// Browser mode: same localStorage key as the legacy app. Cloud mode: an in-memory copy of the
// user's providers, loaded at login, updated immediately and written to Supabase in the background.
const KEY = 'providers';
export const PROVIDERS_UPDATED = 'providersUpdated';

let cloudCache: Provider[] = [];

/** Providers saved in this browser (legacy/local data), regardless of mode. */
export function readLocalProviders(): Provider[] {
    const data = localStorage.getItem(KEY);
    if (!data) return [];
    try {
        const parsed: unknown = JSON.parse(data);
        return Array.isArray(parsed) ? (parsed as Provider[]) : [];
    } catch {
        return [];
    }
}

export function getProviders(): Provider[] {
    return cloudEnabled ? cloudCache : readLocalProviders();
}

export async function loadCloudProviders(): Promise<void> {
    cloudCache = await fetchProviders();
    window.dispatchEvent(new Event(PROVIDERS_UPDATED));
}

export function clearCloudProviders(): void {
    cloudCache = [];
}

function writeProviders(providers: Provider[], sync?: () => Promise<void>): void {
    if (cloudEnabled) {
        cloudCache = providers;
        sync?.().catch((e: unknown) => notify.error(e instanceof Error ? e.message : 'No se pudo guardar el proveedor'));
    } else {
        localStorage.setItem(KEY, JSON.stringify(providers));
    }
    window.dispatchEvent(new Event(PROVIDERS_UPDATED));
}

/** Upsert keyed by name (legacy semantics: renaming creates a new provider). */
export function saveProvider(input: Provider): void {
    const provider = normalizeProvider(input);
    const providers = getProviders();
    const exists = providers.some(p => p.name === provider.name);
    writeProviders(exists ? providers.map(p => (p.name === provider.name ? provider : p)) : [...providers, provider], () => upsertProviders([provider]));
}

export function deleteProvider(name: string): void {
    writeProviders(getProviders().filter(p => p.name !== name), () => removeProvider(name));
}

/** Upserts by name (IMPROVEMENT-001). Existing quotes keep their frozen terms. */
export function importProviders(incoming: Provider[]): { added: number; updated: number } {
    const providers = getProviders();
    const byName = new Map(providers.map(p => [p.name, p]));
    let added = 0;
    let updated = 0;
    const normalized = incoming.map(normalizeProvider);
    normalized.forEach(p => {
        if (byName.has(p.name)) updated++; else added++;
        byName.set(p.name, p);
    });
    writeProviders([...byName.values()], () => upsertProviders(normalized));
    return { added, updated };
}
