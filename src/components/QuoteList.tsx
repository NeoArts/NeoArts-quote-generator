import React from 'react';
import type { Quote } from '../types';
import { deleteQuote, getQuote, getQuotes, putQuote } from '../lib/db';
import { downloadQuoteJson, exportQuoteToExcel } from '../lib/exporters';
import { notify, notifyUndoable } from '../lib/notify';
import { downloadBackup } from '../lib/backup';
import { getProviders } from '../lib/providers';
import { Button, Icon, IconButton, formatMoney } from './ui';
import NewQuoteModal from './NewQuoteModal';
import JsonImporter from './JsonImporter';
import ProvidersPanel from './ProvidersPanel';
import LocalDataBanner from './LocalDataBanner';
import type { Account } from './AuthGate';

const cot = (n: number) => (n === 1 ? 'cotización' : 'cotizaciones');
// Legacy ordering: newest first, accepting both YYYY-MM-DD and DD/MM/YYYY dates.
const sortKey = (q: Quote) => (q.date || '').split('/').reverse().join('-');
export const sortQuotes = (quotes: Quote[]) => [...quotes].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function displayDate(date: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : date;
}
const quoteValue = (q: Quote) => (q.products ?? []).reduce((s, p) => s + (Number(p.totalValue) || 0), 0);
const matches = (q: Quote, term: string) => `${q.client} ${q.number} vpm-${q.number}`.toLowerCase().includes(term.toLowerCase().trim());

export default function QuoteList({ onOpen, account = null }: { onOpen: (id: string) => void; account?: Account }) {
    const [quotes, setQuotes] = React.useState<Quote[] | null>(null);
    const [selected, setSelected] = React.useState<string[]>([]);
    const [search, setSearch] = React.useState('');
    const [newOpen, setNewOpen] = React.useState(false);
    const [providersOpen, setProvidersOpen] = React.useState(false);

    const reload = React.useCallback(() => {
        getQuotes().then(qs => { setQuotes(qs); setSelected(sel => sel.filter(id => qs.some(q => q.id === id))); })
            .catch(() => { setQuotes([]); notify.error('No se pudo abrir la base de datos del navegador'); });
    }, []);
    React.useEffect(reload, [reload]);

    const all = quotes ?? [];
    const visible = sortQuotes(all).filter(q => matches(q, search));

    const removeOne = async (quote: Quote) => {
        if (!window.confirm('¿Estás segur@ de borrar esta cotización?')) return;
        await deleteQuote(quote.id);
        reload();
        notifyUndoable('Cotización eliminada', () => { putQuote(quote).then(reload); });
    };
    const removeSelected = async () => {
        const n = selected.length;
        if (!window.confirm(`¿Estás segur@ de eliminar ${n} ${cot(n)}?`)) return;
        const removed = all.filter(q => selected.includes(q.id));
        await Promise.all(selected.map(deleteQuote));
        reload();
        notifyUndoable(`${n} ${cot(n)} eliminada${n > 1 ? 's' : ''}`, () => { Promise.all(removed.map(putQuote)).then(reload); });
    };
    const exportExcel = (quote: Quote) => { exportQuoteToExcel(quote); notify.success('Excel descargado'); };
    // JSON and backups must carry the images, so load the full quote (cloud lists only have thumbnails).
    const exportJson = async (quote: Quote) => {
        try { downloadQuoteJson((await getQuote(quote.id)) ?? quote); notify.success('JSON descargado'); } catch { notify.error('No se pudo descargar el JSON'); }
    };
    const exportBackup = async () => {
        try {
            const full = await Promise.all(all.map(async q => (await getQuote(q.id)) ?? q));
            downloadBackup(full, getProviders());
            notify.success('Respaldo descargado');
        } catch { notify.error('No se pudo preparar el respaldo'); }
    };
    const toggle = (id: string, on: boolean) => setSelected(sel => (on ? [...sel, id] : sel.filter(s => s !== id)));
    const allSelected = visible.length > 0 && visible.every(q => selected.includes(q.id));

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
            <NewQuoteModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={reload} />
            <ProvidersPanel open={providersOpen} onClose={() => setProvidersOpen(false)} />

            <LocalDataBanner account={account} onUploaded={reload} />

            <section className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div>
                    <h1 className="wide text-3xl sm:text-4xl font-extrabold text-ink">Cotizaciones</h1>
                    <p className="text-graphite mt-1">
                        {quotes === null ? 'Cargando…' : all.length === 0 ? 'Aún no hay cotizaciones.' : `${all.length} ${cot(all.length)} ${all.length === 1 ? 'guardada' : 'guardadas'} ${account ? 'en tu cuenta' : 'en este navegador'}.`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button text="Proveedores" icon="building" variant="secondary" onClick={() => setProvidersOpen(true)} />
                    <Button text="Descargar respaldo" icon="archive" variant="secondary" onClick={exportBackup} title="Todas las cotizaciones y proveedores en un archivo" />
                    <Button text="Nueva cotización" icon="plus" onClick={() => setNewOpen(true)} />
                </div>
            </section>

            {all.length === 0 && quotes !== null ? (
                <section className="rounded-xl border-2 border-dashed border-rule bg-sheet/60 px-6 py-14 text-center">
                    <p className="semiwide text-xl font-semibold">Empieza tu primera cotización</p>
                    <p className="text-graphite mt-1 mb-6">Crea una nueva o importa archivos de cotizaciones más abajo.</p>
                    <Button text="Nueva cotización" icon="plus" onClick={() => setNewOpen(true)} />
                </section>
            ) : all.length > 0 && (
                <section className="bg-sheet rounded-xl shadow-sheet overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-rule-soft">
                        <label className="flex items-center gap-2 text-sm text-graphite cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={e => setSelected(e.target.checked ? visible.map(q => q.id) : [])}
                                className="w-4 h-4 rounded border-rule text-magenta focus:ring-magenta"
                            />
                            Seleccionar todas las cotizaciones
                        </label>
                        {selected.length > 0 ? (
                            <div className="flex items-center gap-3 ml-auto">
                                <span className="text-sm font-medium text-magenta-ink">{selected.length} seleccionada{selected.length !== 1 ? 's' : ''}</span>
                                <Button text={`Eliminar ${selected.length} ${cot(selected.length)}`} icon="trash" variant="danger" size="sm" onClick={removeSelected} />
                            </div>
                        ) : (
                            <div className="relative ml-auto w-full sm:w-72">
                                <Icon name="search" className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
                                <input type="search" aria-label="Buscar por cliente o número" placeholder="Buscar por cliente o número" value={search} onChange={e => setSearch(e.target.value)} className="field pl-9 h-9 py-0" />
                            </div>
                        )}
                    </div>

                    <ul className="divide-y divide-rule-soft">
                        {visible.map(quote => {
                            const images = (quote.products ?? []).map(p => p.image?.base64String).filter(Boolean).slice(0, 3);
                            const isSelected = selected.includes(quote.id);
                            return (
                                <li key={quote.id} className={`group flex items-center gap-3 sm:gap-4 px-4 py-3 transition-colors ${isSelected ? 'bg-magenta-soft/50' : 'hover:bg-well'}`}>
                                    <input
                                        type="checkbox"
                                        aria-label={`Seleccionar ${quote.client}`}
                                        checked={isSelected}
                                        onChange={e => toggle(quote.id, e.target.checked)}
                                        className="flex-shrink-0 w-4 h-4 rounded border-rule text-magenta focus:ring-magenta"
                                    />
                                    <button type="button" className="flex-1 min-w-0 flex flex-col sm:grid sm:grid-cols-[7.5rem_1fr_6.5rem_8.5rem] sm:items-center gap-x-4 gap-y-0.5 text-left rounded-md" onClick={() => onOpen(quote.id)} title="Abrir cotización">
                                        <span className="wide num font-bold text-ink text-sm sm:text-base">VPM-{quote.number || '—'}</span>
                                        <span className="min-w-0 flex items-center gap-3">
                                            <span className="font-semibold text-ink truncate">{quote.client || 'Sin cliente'}</span>
                                            {images.length > 0 && (
                                                <span className="hidden md:flex -space-x-2" aria-hidden="true">
                                                    {images.map((src, i) => <img key={i} src={src} alt="" className="w-7 h-7 rounded-md object-contain bg-sheet ring-2 ring-sheet border border-rule-soft" />)}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm text-graphite num">{displayDate(quote.date)}<span className="sm:hidden">, {formatMoney(quoteValue(quote))}</span></span>
                                        <span className="hidden sm:block text-right num font-semibold text-ink">{formatMoney(quoteValue(quote))}</span>
                                    </button>
                                    <div className="flex items-center gap-0.5 flex-shrink-0 sm:opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                        <IconButton icon="sheet" label="Exportar a Excel" onClick={() => exportExcel(quote)} />
                                        <IconButton icon="braces" label="Descargar JSON" onClick={() => exportJson(quote)} />
                                        <IconButton icon="trash" label="Eliminar cotización" tone="danger" onClick={() => removeOne(quote)} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {visible.length === 0 && (
                        <p className="px-4 py-10 text-center text-graphite">Ninguna cotización coincide con “{search}”.</p>
                    )}
                </section>
            )}

            <section aria-labelledby="import-title" className="space-y-3">
                <h2 id="import-title" className="semiwide text-lg font-semibold">Importar archivos</h2>
                <JsonImporter onImported={reload} />
            </section>
        </div>
    );
}
