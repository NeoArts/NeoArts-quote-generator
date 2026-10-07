import React from 'react';
import { emptyProduct, type DocImage, type Product, type Quote } from '../types';
import { getQuote, getQuotes, loadImage, putQuote, trackSave } from '../lib/db';
import { buildLibrary, type LibraryEntry } from '../lib/library';
import { LibraryContext } from './ProductNameInput';
import { applyProductUpdate, moveItem, nextProductId, recalcGroupOf, withAutomatedFields } from '../lib/calc';
import { applyChange, effectiveProviders, ignoreChange, pendingChanges, withFrozenTerms } from '../lib/terms';
import { notify, notifyUndoable } from '../lib/notify';
import { Button, Icon } from './ui';
import ProductTable from './ProductTable';
import ProductDetailsModal from './ProductDetailsModal';
import { PdfOptionsPanel, PdfPreview, ProviderChangesNotice, QuoteTotals } from './QuoteExtras';
import { useProviders } from './useProviders';
import { cloudEnabled } from '../lib/supabase';

const scrollTableToBottom = () => setTimeout(() => {
    const el = document.getElementById('table-scroll');
    if (el) el.scrollTop = el.scrollHeight;
}, 300);

/**
 * Autosave: saves are serialized so the last edit always wins (legacy dropped saves while one was pending).
 * In cloud mode edits are grouped until typing pauses; pending changes are saved when leaving the editor,
 * and closing the tab with unsaved changes asks for confirmation.
 */
function useAutosave(quote: Quote | null) {
    const queue = React.useRef<Promise<unknown>>(Promise.resolve());
    const lastSaved = React.useRef<Quote | null>(null);
    const pending = React.useRef<Quote | null>(null);
    const timer = React.useRef<ReturnType<typeof setTimeout>>();
    const [status, setStatus] = React.useState<'saved' | 'saving' | 'error'>('saved');

    const flush = React.useCallback(() => {
        clearTimeout(timer.current);
        const q = pending.current;
        if (!q) return;
        pending.current = null;
        queue.current = trackSave(queue.current
            .then(() => putQuote(q))
            .then(() => { if (!pending.current) setStatus('saved'); })
            .catch((e: unknown) => { setStatus('error'); notify.error(e instanceof Error ? e.message : 'No se pudo guardar la cotización'); }));
    }, []);

    React.useEffect(() => {
        if (!quote) return;
        if (!lastSaved.current) { lastSaved.current = quote; return; }
        if (lastSaved.current === quote) return;
        lastSaved.current = quote;
        pending.current = quote;
        setStatus('saving');
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, cloudEnabled ? 700 : 0);
    }, [quote, flush]);

    React.useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => { if (pending.current) { flush(); e.preventDefault(); } };
        window.addEventListener('beforeunload', warn);
        return () => { window.removeEventListener('beforeunload', warn); flush(); };
    }, [flush]);

    return { lastSaved, status };
}

export default function QuoteEditor({ quoteId }: { quoteId: string }) {
    const current = useProviders();
    const [quote, setQuote] = React.useState<Quote | null>(null);
    const [missing, setMissing] = React.useState(false);
    const [detailsIndex, setDetailsIndex] = React.useState<number | null>(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [downloading, setDownloading] = React.useState(false);
    const { lastSaved, status } = useAutosave(quote);
    const [library, setLibrary] = React.useState<LibraryEntry[]>([]);

    // Product history from the other quotes, for name suggestions. Not critical: failures leave it empty.
    React.useEffect(() => {
        getQuotes().then(qs => setLibrary(buildLibrary(qs, quoteId))).catch(() => undefined);
    }, [quoteId]);

    // Warm up the PDF engine (code, fonts, letterhead) while the user edits, so the first PDF is instant.
    React.useEffect(() => {
        const warm = () => import('../pdf/assets').then(m => m.loadPdfAssets()).then(() => import('../pdf/generateQuote')).catch(() => undefined);
        const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
        if (idle) idle(warm); else setTimeout(warm, 1500);
    }, []);

    React.useEffect(() => {
        getQuote(quoteId)
            .then(q => {
                if (!q) { setMissing(true); return; }
                const loaded = { ...q, products: q.products?.length ? q.products.map(p => ({ ...emptyProduct, ...p })) : [emptyProduct] };
                const frozen = withFrozenTerms(loaded, current);
                // Freeze provider terms immediately for quotes that predate the snapshot (legacy data).
                if (frozen !== loaded) putQuote(frozen).catch(() => notify.error('No se pudo guardar la cotización'));
                lastSaved.current = frozen;
                setQuote(frozen);
            })
            .catch(() => setMissing(true));
    }, [quoteId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (missing) {
        return (
            <div className="max-w-xl mx-auto px-6 py-20 text-center">
                <p className="wide text-2xl font-bold">No se encontró la cotización.</p>
                <p className="text-graphite mt-2 mb-6">Puede que se haya eliminado o que pertenezca a otro navegador.</p>
                <a href="#/" className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-ink text-white text-sm font-medium">Volver a cotizaciones</a>
            </div>
        );
    }
    if (!quote) return <p className="px-6 py-10 text-graphite">Cargando…</p>;

    /** Product updates always freeze terms for newly used providers and calculate with the quote's terms. */
    const updateProducts = (update: (products: Product[], q: Quote) => Product[]) =>
        setQuote(q => (q ? withFrozenTerms({ ...q, products: update(q.products, q) }, current) : q));
    const providersFor = (q: Quote, products: Product[]) => effectiveProviders(withFrozenTerms({ ...q, products }, current), current);

    const changeField = (index: number) => (field: keyof Product, value: string) =>
        updateProducts((ps, q) => {
            const edited = { ...ps[index], [field]: value };
            return applyProductUpdate(ps, index, edited, providersFor(q, ps.map((p, i) => (i === index ? edited : p))));
        });

    const changeImage = (index: number) => (image: DocImage) =>
        updateProducts(ps => ps.map((p, i) => (i === index ? { ...p, image } : p)));

    const addRow = () => {
        updateProducts(ps => [...ps, { ...emptyProduct, id: nextProductId(ps) }]);
        scrollTableToBottom();
        setTimeout(() => document.getElementById(`product-name-${quote.products.length}`)?.focus(), 320);
    };

    const deleteRow = (index: number) => {
        const removed = quote.products[index];
        const wasLast = quote.products.length === 1;
        updateProducts((ps, q) => {
            const rest = ps.filter((_, i) => i !== index);
            return rest.length ? recalcGroupOf(rest, removed, providersFor(q, rest)) : [emptyProduct];
        });
        notifyUndoable(`Se eliminó ${removed.name ? `“${removed.name}”` : 'la fila'}`, () => updateProducts((ps, q) => {
            const restored = wasLast ? [removed] : [...ps.slice(0, index), removed, ...ps.slice(index)];
            return recalcGroupOf(restored, removed, providersFor(q, restored));
        }));
    };

    const duplicateRow = (index: number) => updateProducts((ps, q) => {
        const next = [...ps, { ...ps[index], id: nextProductId(ps) }];
        return recalcGroupOf(next, ps[index], providersFor(q, next));
    });

    const createScales = (index: number) => (quantities: number[]) => updateProducts((ps, q) => {
        const firstId = nextProductId(ps);
        const providers = providersFor(q, ps);
        // Legacy: each scale is priced on its own quantity (not added to the group volume).
        return [...ps, ...quantities.map((quantity, i) => withAutomatedFields({ ...ps[index], quantity, id: firstId + i }, undefined, providers))];
    });

    const moveRow = (from: number, to: number) => updateProducts(ps => moveItem(ps, from, to));

    /** Fills a row from a previously quoted product; keeps the row's quantity if it already has one. */
    const pickFromLibrary = async (row: number, entry: LibraryEntry) => {
        let image: DocImage | null = null;
        try {
            if (entry.imagePath) image = { base64String: await loadImage(entry.imagePath), height: entry.imageHeight, path: entry.imagePath, ...(entry.thumbPath ? { thumbPath: entry.thumbPath } : {}) };
            else if (entry.thumb.startsWith('data:')) image = { base64String: entry.thumb, height: entry.imageHeight };
        } catch { image = null; }
        updateProducts((ps, q) => {
            const cur = ps[row];
            if (!cur) return ps;
            const edited: Product = {
                ...cur,
                name: entry.name, markType: entry.markType, provider: entry.provider,
                cost: entry.cost, markCost: entry.markCost, otherCost: entry.otherCost,
                profit: entry.profit || cur.profit,
                quantity: Number(cur.quantity) ? cur.quantity : entry.quantity,
                image: image?.base64String ? image : cur.image,
            };
            return applyProductUpdate(ps, row, edited, providersFor(q, ps.map((p, i) => (i === row ? edited : p))));
        });
        notify.success(`Fila llenada con “${entry.name}” (cotizado para ${entry.client || 'otro cliente'})`);
    };

    // Web Share with files (phones, some desktop browsers): send the PDF straight to WhatsApp, e-mail, etc.
    const canShare = typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [new File([''], 'a.pdf', { type: 'application/pdf' })] });
    const sharePdf = async () => {
        setDownloading(true);
        try {
            const m = await import('../pdf/generateQuote');
            const file = new File([await m.renderQuotePdf(quote)], m.pdfFileName(quote), { type: 'application/pdf' });
            await navigator.share({ files: [file], title: `Cotización ${quote.client}` });
        } catch (e) {
            if (!(e instanceof DOMException && e.name === 'AbortError')) notify.error('No se pudo compartir el PDF. Usa "Descargar PDF".');
        } finally {
            setDownloading(false);
        }
    };

    const downloadPdf = () => {
        setDownloading(true);
        // PDF engine and assets are loaded on demand.
        import('../pdf/generateQuote')
            .then(m => m.generateQuote(quote))
            .catch(() => notify.error('No se pudo generar el PDF'))
            .finally(() => setDownloading(false));
    };

    const detailsProduct = detailsIndex !== null ? quote.products[detailsIndex] ?? null : null;
    const changes = pendingChanges(quote, current);
    const setHeader = (field: 'date' | 'number' | 'client') => (e: React.ChangeEvent<HTMLInputElement>) => setQuote({ ...quote, [field]: e.target.value });
    const toggleClass = (on: boolean) => (on ? '!bg-ink !text-white !border-ink' : '');

    return (
        <div className="flex flex-col min-h-[calc(100vh-3.6rem)]">
            {/* Quote header: reference, client and date are edited in place. */}
            <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-rule">
                <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-3">
                    <a href="#/" className="inline-flex items-center gap-1 h-9 pl-1.5 pr-3 rounded-md text-sm text-graphite hover:text-ink hover:bg-ink/5" aria-label="Volver a cotizaciones">
                        <Icon name="back" className="w-4 h-4" /> Cotizaciones
                    </a>
                    <div className="flex items-center rounded-md hover:bg-sheet focus-within:bg-sheet focus-within:ring-2 focus-within:ring-magenta/30 pl-2">
                        <label htmlFor="quote-number" className="wide font-extrabold text-xl text-mist select-none">VPM-</label>
                        <input id="quote-number" aria-label="Número de cotización" value={quote.number} onChange={setHeader('number')} placeholder="000" size={Math.max(3, quote.number.length)} className="wide num font-extrabold text-xl bg-transparent border-0 focus:ring-0 px-0.5 py-1 text-ink" />
                    </div>
                    <input id="quote-client" aria-label="Cliente" value={quote.client} onChange={setHeader('client')} placeholder="Nombre del cliente" className="flex-1 min-w-[12rem] semiwide text-lg font-semibold bg-transparent border-0 rounded-md px-2 py-1 hover:bg-sheet focus:bg-sheet focus:ring-2 focus:ring-magenta/30 placeholder:text-mist" />
                    <input id="quote-date" type="date" aria-label="Fecha" value={quote.date} onChange={setHeader('date')} className="h-9 rounded-md border-0 bg-transparent text-sm text-graphite num hover:bg-sheet focus:bg-sheet focus:ring-2 focus:ring-magenta/30" />
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                        <span className={`hidden sm:inline text-xs w-24 text-right ${status === 'error' ? 'text-danger' : 'text-mist'}`} aria-live="polite">{status === 'saving' ? 'Guardando…' : status === 'error' ? 'Sin guardar' : 'Guardado'}</span>
                        <Button text="Ajustes del PDF" icon="settings" variant="secondary" size="sm" className={toggleClass(settingsOpen)} onClick={() => setSettingsOpen(!settingsOpen)} />
                        <Button text={previewOpen ? 'Ocultar vista previa' : 'Vista previa del PDF'} icon={previewOpen ? 'eyeOff' : 'eye'} variant="secondary" size="sm" className={toggleClass(previewOpen)} onClick={() => setPreviewOpen(!previewOpen)} />
                    </div>
                </div>
            </div>

            <div className={`flex-1 px-4 sm:px-6 py-5 flex flex-col ${previewOpen ? 'xl:flex-row' : ''} gap-5`}>
                <div className="flex-1 min-w-0 space-y-4">
                    <ProviderChangesNotice
                        changes={changes}
                        onApply={c => setQuote(q => (q ? applyChange(q, c, current) : q))}
                        onIgnore={c => setQuote(q => (q ? ignoreChange(q, c) : q))}
                    />
                    {settingsOpen && <PdfOptionsPanel quote={quote} onChange={pdfOptions => setQuote({ ...quote, pdfOptions })} onClose={() => setSettingsOpen(false)} />}
                    <ProductDetailsModal
                        product={detailsProduct}
                        onClose={() => setDetailsIndex(null)}
                        onFieldChange={changeField(detailsIndex ?? 0)}
                        onImageChange={changeImage(detailsIndex ?? 0)}
                        onCreateScales={createScales(detailsIndex ?? 0)}
                    />
                    <LibraryContext.Provider value={{ entries: library, pick: pickFromLibrary }}>
                    <ProductTable
                        products={quote.products}
                        onFieldChange={changeField}
                        onImageChange={changeImage}
                        onDelete={deleteRow}
                        onDuplicate={duplicateRow}
                        onDetails={setDetailsIndex}
                        onAdd={addRow}
                        onMove={moveRow}
                    />
                    </LibraryContext.Provider>
                </div>
                {previewOpen && (
                    <aside className="xl:w-[40%] h-[78vh] xl:h-[calc(100vh-12.5rem)] xl:sticky xl:top-[5.5rem]">
                        <PdfPreview quote={quote} onClose={() => setPreviewOpen(false)} />
                    </aside>
                )}
            </div>

            {/* Totals stay in view while editing. */}
            <div className="sticky bottom-0 z-20 bg-sheet/95 backdrop-blur border-t border-rule shadow-[0_-4px_16px_-8px_rgba(24,32,47,0.15)]">
                <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <QuoteTotals products={quote.products} />
                    <div className="flex gap-2">
                        {canShare && <Button text="Compartir" icon="upload" variant="secondary" disabled={downloading} onClick={sharePdf} />}
                        <Button text="Descargar PDF" icon="download" variant="accent" loading={downloading} onClick={downloadPdf} />
                    </div>
                </div>
            </div>
        </div>
    );
}
