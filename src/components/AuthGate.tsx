import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { cloudEnabled, supabase } from '../lib/supabase';
import { clearCloudProviders, loadCloudProviders } from '../lib/providers';
import { clearCloudCaches } from '../lib/cloudDb';
import { waitForSaves } from '../lib/db';
import { Button, Input } from './ui';

export type Account = { email: string; userId: string; signOut: () => Promise<void> } | null;

const ERRORS: [RegExp, string][] = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/email not confirmed/i, 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.'],
    [/already registered|already been registered/i, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
    [/password should be at least|weak password/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/rate limit|too many/i, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'],
    [/unable to validate email|invalid email/i, 'Escribe un correo válido.'],
    [/failed to fetch|network/i, 'Sin conexión con el servidor. Revisa tu internet.'],
];
const friendly = (message: string) => ERRORS.find(([re]) => re.test(message))?.[1] ?? message;
const redirectUrl = () => `${window.location.origin}${window.location.pathname}`;

type Mode = 'signin' | 'signup' | 'reset' | 'newPassword';

function AuthScreen({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');
    const [info, setInfo] = React.useState('');
    const auth = supabase!.auth;

    const submit = async () => {
        setBusy(true); setError(''); setInfo('');
        try {
            if (mode === 'signin') {
                const { error: e } = await auth.signInWithPassword({ email, password });
                if (e) throw e;
            } else if (mode === 'signup') {
                const { data, error: e } = await auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } });
                if (e) throw e;
                if (!data.session) { setInfo(`Te enviamos un correo a ${email}. Ábrelo para confirmar tu cuenta y luego inicia sesión.`); setMode('signin'); }
            } else if (mode === 'reset') {
                const { error: e } = await auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
                if (e) throw e;
                setInfo(`Si existe una cuenta con ${email}, te llegará un correo para crear una contraseña nueva.`);
            } else {
                const { error: e } = await auth.updateUser({ password });
                if (e) throw e;
                setInfo('Contraseña actualizada.');
                setMode('signin');
            }
        } catch (e) {
            setError(friendly(e instanceof Error ? e.message : String(e)));
        } finally {
            setBusy(false);
        }
    };

    const titles: Record<Mode, string> = { signin: 'Iniciar sesión', signup: 'Crear cuenta', reset: 'Recuperar contraseña', newPassword: 'Nueva contraseña' };
    const actions: Record<Mode, string> = { signin: 'Iniciar sesión', signup: 'Crear cuenta', reset: 'Enviar correo', newPassword: 'Guardar contraseña' };

    return (
        <div className="min-h-[calc(100vh-3.6rem)] grid place-items-center px-4 py-10">
            <div className="w-full max-w-sm">
                <h1 className="wide text-3xl font-extrabold text-center">Cotizaciones</h1>
                <p className="text-graphite text-center mt-1 mb-6">Cada persona ve solo sus cotizaciones y proveedores.</p>
                <form className="bg-sheet rounded-xl shadow-sheet p-6 space-y-4" onSubmit={e => { e.preventDefault(); submit(); }}>
                    {(mode === 'signin' || mode === 'signup') && (
                        <div className="grid grid-cols-2 p-1 rounded-lg bg-well text-sm font-medium" role="tablist">
                            {(['signin', 'signup'] as Mode[]).map(m => (
                                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
                                    className={`h-9 rounded-md ${mode === m ? 'bg-sheet shadow-sheet text-ink' : 'text-graphite hover:text-ink'}`}>{titles[m]}</button>
                            ))}
                        </div>
                    )}
                    {(mode === 'reset' || mode === 'newPassword') && <h2 className="semiwide text-lg font-semibold">{titles[mode]}</h2>}
                    {mode !== 'newPassword' && <Input id="auth-email" type="email" label="Correo" placeholder="tu@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />}
                    {mode !== 'reset' && (
                        <Input id="auth-password" type="password" label={mode === 'newPassword' ? 'Contraseña nueva' : 'Contraseña'} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                    )}
                    {error && <p role="alert" className="text-sm text-danger bg-danger-soft rounded-md px-3 py-2">{error}</p>}
                    {info && <p role="status" className="text-sm text-go bg-go-soft rounded-md px-3 py-2">{info}</p>}
                    <Button text={actions[mode]} loading={busy} onClick={submit} className="w-full" />
                    <button type="submit" className="hidden" />
                    <div className="text-sm text-center">
                        {mode === 'signin' && <button type="button" className="text-graphite hover:text-ink underline-offset-2 hover:underline" onClick={() => { setMode('reset'); setError(''); }}>¿Olvidaste tu contraseña?</button>}
                        {mode === 'reset' && <button type="button" className="text-graphite hover:text-ink underline-offset-2 hover:underline" onClick={() => setMode('signin')}>Volver a iniciar sesión</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

/** Cloud mode: requires a signed-in user and loads their providers before showing the app. */
export default function AuthGate({ children }: { children: (account: Account) => React.ReactNode }) {
    const [session, setSession] = React.useState<Session | null | undefined>(cloudEnabled ? undefined : null);
    const [ready, setReady] = React.useState(!cloudEnabled);
    const [mode, setMode] = React.useState<Mode>('signin');
    const [loadError, setLoadError] = React.useState('');

    React.useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data } = supabase.auth.onAuthStateChange((event, s) => {
            if (event === 'PASSWORD_RECOVERY') setMode('newPassword');
            setSession(s);
        });
        return () => data.subscription.unsubscribe();
    }, []);

    const userId = session?.user.id;
    React.useEffect(() => {
        if (!cloudEnabled) return;
        if (!userId) { clearCloudProviders(); clearCloudCaches(); setReady(false); return; }
        setReady(false);
        setLoadError('');
        loadCloudProviders().then(() => setReady(true)).catch((e: unknown) => setLoadError(friendly(e instanceof Error ? e.message : String(e))));
    }, [userId]);

    if (!cloudEnabled) return <>{children(null)}</>;
    if (session === undefined) return <p className="px-6 py-10 text-graphite">Cargando…</p>;
    if (!session || mode === 'newPassword') return <AuthScreen mode={mode === 'newPassword' && !session ? 'signin' : mode} setMode={setMode} />;
    if (loadError) {
        return (
            <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
                <p className="semiwide text-lg font-semibold">No se pudieron cargar tus datos.</p>
                <p className="text-graphite">{loadError}</p>
                <Button text="Reintentar" onClick={() => window.location.reload()} />
            </div>
        );
    }
    if (!ready) return <p className="px-6 py-10 text-graphite">Cargando tus datos…</p>;
    return <>{children({ email: session.user.email ?? '', userId: session.user.id, signOut: async () => {
        // Leave the editor first (it saves on close), wait for pending saves, then end the session.
        window.location.hash = '#/';
        await new Promise(r => setTimeout(r, 0));
        await waitForSaves();
        await supabase!.auth.signOut();
    } })}</>;
}
