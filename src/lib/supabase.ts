import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cloud mode is on when the build has Supabase settings (.env.cloud for the hosted project,
// .env.supabase-local for the local Docker stack) AND the project answers at startup (probeCloud).
// Otherwise the app keeps everything in the browser; local data is offered for upload once the cloud is back.
// PKCE flow: confirmation/recovery links return as ?code=…, which does not collide with the #/ router.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

const configured = Boolean(url && key);
const OFFLINE_FLAG = 'neoarts-offline-used';

// Live bindings: set once by probeCloud() before the app renders.
export let cloudEnabled = false;
/** The build uses the cloud but the project did not answer (quota restriction, outage, no network). */
export let cloudOffline = false;
export let supabase: SupabaseClient | null = null;

export async function probeCloud(): Promise<void> {
    if (!configured) return;
    try {
        const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: key! }, signal: AbortSignal.timeout(6000) });
        cloudEnabled = res.ok; // a restricted project answers 402
    } catch {
        cloudEnabled = false;
    }
    cloudOffline = !cloudEnabled;
    if (cloudOffline) {
        try { localStorage.setItem(OFFLINE_FLAG, '1'); } catch { /* private mode: upload offer just won't reappear */ }
        return;
    }
    // Created only when reachable: a failing token refresh would otherwise sign the user out.
    supabase = createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
}

/** Browser data was created while the cloud was down and has not been uploaded yet. */
export const offlineDataPending = (): boolean => { try { return !!localStorage.getItem(OFFLINE_FLAG); } catch { return false; } };
export const clearOfflineData = (): void => { try { localStorage.removeItem(OFFLINE_FLAG); } catch { /* ignore */ } };

export function requireSupabase(): SupabaseClient {
    if (!supabase) throw new Error('Supabase no está configurado');
    return supabase;
}

export async function currentUserId(): Promise<string> {
    const { data, error } = await requireSupabase().auth.getSession();
    const id = data.session?.user.id;
    if (error || !id) throw new Error('La sesión expiró. Vuelve a iniciar sesión.');
    return id;
}
