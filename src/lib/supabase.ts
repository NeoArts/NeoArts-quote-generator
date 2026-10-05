import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cloud mode is on when the build has Supabase settings (.env.cloud for the hosted project,
// .env.supabase-local for the local Docker stack). Without them the app keeps everything in the browser.
// PKCE flow: confirmation/recovery links return as ?code=…, which does not collide with the #/ router.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const cloudEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = cloudEnabled
    ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } })
    : null;

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
