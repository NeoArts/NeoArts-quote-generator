import React from 'react';
import type { Account } from './AuthGate';
import { countQuotes, getQuote as getLocalQuote, getQuoteIds } from '../lib/localDb';
import { importQuotes } from '../lib/db';
import { importProviders, readLocalProviders } from '../lib/providers';
import { notify } from '../lib/notify';
import { Button } from './ui';

const flagKey = (userId: string) => `neoarts-local-uploaded:${userId}`;

/**
 * Cloud mode: offers to upload quotes and providers saved only in this browser (legacy app or
 * browser mode). Local data is kept as it is; the offer is not shown again for this account.
 * Legacy data can be hundreds of MB of embedded images, so quotes are counted without loading them
 * and uploaded one at a time.
 */
export default function LocalDataBanner({ account, onUploaded }: { account: Account; onUploaded: () => void }) {
    const userId = account?.userId;
    const [counts, setCounts] = React.useState<{ quotes: number; providers: number } | null>(null);
    const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);

    React.useEffect(() => {
        if (!userId) return;
        try { if (localStorage.getItem(flagKey(userId))) return; } catch { return; }
        countQuotes()
            .then(quotes => { const c = { quotes, providers: readLocalProviders().length }; if (c.quotes || c.providers) setCounts(c); })
            .catch(() => undefined);
    }, [userId]);

    if (!userId || !counts) return null;

    const dismiss = () => { localStorage.setItem(flagKey(userId), new Date().toISOString()); setCounts(null); };
    const upload = async () => {
        const totals = { success: 0, duplicates: 0, errors: 0 };
        try {
            const providers = readLocalProviders();
            if (providers.length) importProviders(providers);
            const ids = await getQuoteIds();
            setProgress({ done: 0, total: ids.length });
            for (const [i, id] of ids.entries()) {
                const quote = await getLocalQuote(id);
                if (quote) {
                    const r = await importQuotes([quote]);
                    totals.success += r.success; totals.duplicates += r.duplicates; totals.errors += r.errors;
                }
                setProgress({ done: i + 1, total: ids.length });
            }
            if (totals.errors) { notify.error(`No se pudieron subir ${totals.errors} cotizaciones. Vuelve a intentarlo; las ya subidas no se duplican.`); return; }
            notify.success(`Subidas ${totals.success} cotizaciones y ${providers.length} proveedores${totals.duplicates ? ` (${totals.duplicates} ya estaban en tu cuenta)` : ''}`);
            dismiss();
        } catch (e) {
            notify.error(e instanceof Error ? e.message : 'No se pudieron subir los datos');
        } finally {
            setProgress(null);
            onUploaded();
        }
    };

    return (
        <section role="status" className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-4 pr-3 py-3 rounded-lg bg-cyan-soft border-l-4 border-cyan">
            <div className="flex-1 min-w-[16rem] text-sm">
                <p className="font-semibold text-ink">Este navegador tiene datos sin subir a tu cuenta.</p>
                <p className="text-graphite">
                    {progress
                        ? `Subiendo cotización ${progress.done} de ${progress.total}… No cierres esta pestaña.`
                        : `${counts.quotes} cotizaciones y ${counts.providers} proveedores guardados solo aquí. Súbelos para verlos desde cualquier equipo.`}
                </p>
                {progress && (
                    <div className="mt-2 h-1.5 rounded-full bg-sheet overflow-hidden" aria-hidden="true">
                        <div className="h-full bg-cyan transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                {!progress && <Button text="Ahora no" variant="ghost" size="sm" onClick={dismiss} />}
                <Button text="Subir a mi cuenta" size="sm" loading={!!progress} onClick={upload} />
            </div>
        </section>
    );
}
