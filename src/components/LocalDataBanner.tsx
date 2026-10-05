import React from 'react';
import type { Account } from './AuthGate';
import { getQuotes as getLocalQuotes } from '../lib/localDb';
import { importQuotes } from '../lib/db';
import { importProviders, readLocalProviders } from '../lib/providers';
import { notify } from '../lib/notify';
import { Button } from './ui';

const flagKey = (userId: string) => `neoarts-local-uploaded:${userId}`;

/**
 * Cloud mode: offers to upload quotes and providers saved only in this browser (legacy app or
 * browser mode). Local data is kept as it is; the offer is not shown again for this account.
 */
export default function LocalDataBanner({ account, onUploaded }: { account: Account; onUploaded: () => void }) {
    const [counts, setCounts] = React.useState<{ quotes: number; providers: number } | null>(null);
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
        if (!account) return;
        try { if (localStorage.getItem(flagKey(account.userId))) return; } catch { return; }
        getLocalQuotes()
            .then(qs => { const c = { quotes: qs.length, providers: readLocalProviders().length }; if (c.quotes || c.providers) setCounts(c); })
            .catch(() => undefined);
    }, [account]);

    if (!account || !counts) return null;

    const dismiss = () => { localStorage.setItem(flagKey(account.userId), new Date().toISOString()); setCounts(null); };
    const upload = async () => {
        setBusy(true);
        try {
            const providers = readLocalProviders();
            if (providers.length) importProviders(providers);
            const { success, duplicates, errors } = await importQuotes(await getLocalQuotes());
            if (errors) { notify.error(`No se pudieron subir ${errors} cotizaciones. Inténtalo de nuevo.`); return; }
            notify.success(`Subidas ${success} cotizaciones y ${providers.length} proveedores${duplicates ? ` (${duplicates} ya estaban en tu cuenta)` : ''}`);
            dismiss();
            onUploaded();
        } catch (e) {
            notify.error(e instanceof Error ? e.message : 'No se pudieron subir los datos');
        } finally {
            setBusy(false);
        }
    };

    return (
        <section role="status" className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-4 pr-3 py-3 rounded-lg bg-cyan-soft border-l-4 border-cyan">
            <div className="flex-1 min-w-[16rem] text-sm">
                <p className="font-semibold text-ink">Este navegador tiene datos sin subir a tu cuenta.</p>
                <p className="text-graphite">{counts.quotes} cotizaciones y {counts.providers} proveedores guardados solo aquí. Súbelos para verlos desde cualquier equipo.</p>
            </div>
            <div className="flex gap-2">
                <Button text="Ahora no" variant="ghost" size="sm" onClick={dismiss} />
                <Button text="Subir a mi cuenta" size="sm" loading={busy} onClick={upload} />
            </div>
        </section>
    );
}
