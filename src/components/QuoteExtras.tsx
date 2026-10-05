import React from 'react';
import { defaultPdfOptions, type PdfOptions, type Product, type ProviderTerms, type Quote } from '../types';
import type { TermsChange } from '../lib/terms';
import { Button, Icon, formatMoney } from './ui';

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function quoteTotals(products: Product[]) {
    const value = products.reduce((s, p) => s + num(p.totalValue), 0);
    const cost = products.reduce((s, p) => s + num(p.totalCost) * num(p.quantity), 0);
    const profit = value - cost;
    return { value, cost, profit, margin: value ? (profit / value) * 100 : 0 };
}

/** IMPROVEMENT-005: totals, shown in the editor's sticky bottom bar. */
export function QuoteTotals({ products }: { products: Product[] }) {
    const t = quoteTotals(products);
    return (
        <dl data-testid="quote-totals" className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div className="flex items-baseline gap-2">
                <dt className="text-sm text-graphite">Valor total</dt>
                <dd className="wide num text-2xl font-extrabold text-ink">{formatMoney(t.value)}</dd>
            </div>
            <div className="flex items-baseline gap-2">
                <dt className="text-sm text-graphite">Costo total</dt>
                <dd className="num font-semibold">{formatMoney(t.cost)}</dd>
            </div>
            <div className="flex items-baseline gap-2">
                <dt className="text-sm text-graphite">Utilidad</dt>
                <dd className={`num font-semibold ${t.profit < 0 ? 'text-danger' : 'text-go'}`}>{formatMoney(t.profit)}</dd>
            </div>
            <div className="flex items-baseline gap-2">
                <dt className="text-sm text-graphite">Margen</dt>
                <dd className="num font-semibold">{t.margin.toFixed(1)}%</dd>
            </div>
        </dl>
    );
}

const pct = (t: ProviderTerms) => `${(Number(t.discount) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
const tiers = (t: ProviderTerms) => {
    const list = (t.wholesaleDiscount ?? []).filter(d => Number(d.amount) || Number(d.discount));
    return list.length ? `, por volumen ${list.map(d => `${(Number(d.discount) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}% desde ${formatMoney(Number(d.amount))}`).join(', ')}` : '';
};

/** IMPROVEMENT-004 (as decided): provider discounts changed after this quote was made; the user decides. */
export function ProviderChangesNotice({ changes, onApply, onIgnore }: { changes: TermsChange[]; onApply: (c: TermsChange) => void; onIgnore: (c: TermsChange) => void }) {
    if (changes.length === 0) return null;
    return (
        <div role="status" className="space-y-2">
            {changes.map(c => (
                <div key={c.name} className="flex flex-wrap items-center gap-x-6 gap-y-3 pl-4 pr-3 py-3 rounded-lg bg-yellow-soft border-l-4 border-yellow">
                    <div className="flex-1 min-w-[16rem] text-sm text-ink">
                        <p className="font-semibold">Los descuentos de {c.name} cambiaron desde que se hizo esta cotización.</p>
                        <p className="text-graphite">Esta cotización usa {pct(c.before)}{tiers(c.before)}. Ahora el proveedor tiene {pct(c.after)}{tiers(c.after)}.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button text="Ignorar" variant="ghost" size="sm" onClick={() => onIgnore(c)} />
                        <Button text="Aplicar a esta cotización" size="sm" onClick={() => onApply(c)} />
                    </div>
                </div>
            ))}
        </div>
    );
}

const TEXT_FIELDS: [keyof Omit<PdfOptions, 'useQuoteDate'>, string][] = [
    ['city', 'Ciudad del encabezado'],
    ['clientCity', 'Ciudad del cliente'],
    ['iva', 'IVA'],
    ['validity', 'Validez de la oferta'],
    ['payment', 'Forma de pago'],
    ['production', 'Tiempo de producción'],
    ['delivery', 'Entrega(s)'],
];

/** IMPROVEMENT-007: editable letter fields of the PDF, stored per quote. */
export function PdfOptionsPanel({ quote, onChange, onClose }: { quote: Quote; onChange: (options: Partial<PdfOptions>) => void; onClose: () => void }) {
    const o = { ...defaultPdfOptions, ...quote.pdfOptions };
    const set = (patch: Partial<PdfOptions>) => onChange({ ...quote.pdfOptions, ...patch });
    const customized = Object.keys(quote.pdfOptions ?? {}).length > 0;
    return (
        <section aria-label="Ajustes del PDF" className="anim-pop bg-sheet rounded-xl shadow-sheet p-4 sm:p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="semiwide font-semibold">Ajustes del PDF</h2>
                    <p className="text-sm text-graphite">Textos de la carta para esta cotización.</p>
                </div>
                <div className="flex items-center gap-1">
                    {customized && <Button text="Restablecer valores predeterminados" variant="ghost" size="sm" onClick={() => onChange({})} />}
                    <Button text="Cerrar ajustes" variant="ghost" size="sm" onClick={onClose} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TEXT_FIELDS.map(([field, label]) => (
                    <label key={field} className="flex flex-col gap-1.5">
                        <span className="label">{label}</span>
                        <input id={`pdf-${field}`} className="field" value={o[field]} onChange={e => set({ [field]: e.target.value })} />
                    </label>
                ))}
                <label className="flex items-center gap-2.5 self-end h-10 text-sm text-ink cursor-pointer">
                    <input id="pdf-useQuoteDate" type="checkbox" className="w-4 h-4 rounded border-rule text-magenta focus:ring-magenta" checked={o.useQuoteDate} onChange={e => set({ useQuoteDate: e.target.checked })} />
                    Fechar con la fecha de la cotización
                </label>
            </div>
        </section>
    );
}

/** Live PDF preview: regenerates the real PDF (same code as the download) shortly after edits stop. */
export function PdfPreview({ quote, onClose }: { quote: Quote; onClose: () => void }) {
    const [url, setUrl] = React.useState<string | null>(null);
    const [error, setError] = React.useState(false);
    const [busy, setBusy] = React.useState(true);

    React.useEffect(() => {
        let cancelled = false;
        setBusy(true);
        const timer = setTimeout(async () => {
            try {
                const { renderQuotePdf } = await import('../pdf/generateQuote');
                const blob = await renderQuotePdf(quote);
                if (cancelled) return;
                setError(false);
                setUrl(old => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setBusy(false);
            }
        }, 700);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [quote]);

    React.useEffect(() => () => { setUrl(old => { if (old) URL.revokeObjectURL(old); return null; }); }, []);

    return (
        <div className="h-full flex flex-col bg-ink rounded-xl overflow-hidden shadow-lift">
            <div className="px-4 h-11 flex items-center justify-between gap-3 text-sm text-white/80">
                <span className="semiwide font-semibold text-white">Vista previa</span>
                <span className="flex items-center gap-3">
                    <span aria-live="polite" className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${error ? 'bg-danger' : busy ? 'bg-yellow animate-pulse' : 'bg-go'}`} aria-hidden="true" />
                        {error ? 'No se pudo generar' : busy ? 'Actualizando…' : 'Actualizada'}
                    </span>
                    <button type="button" onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10" aria-label="Ocultar vista previa">
                        <Icon name="close" className="w-4 h-4" />
                    </button>
                </span>
            </div>
            {url
                ? <iframe title="Vista previa del PDF" src={`${url}#toolbar=0&view=FitH`} className="flex-1 w-full bg-white" />
                : <div className="flex-1 grid place-items-center text-white/50 text-sm">Generando la vista previa…</div>}
        </div>
    );
}
