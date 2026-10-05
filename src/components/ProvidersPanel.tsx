import React from 'react';
import type { Provider } from '../types';
import { Button, CloseButton, Icon, formatMoney, useEscapeToClose } from './ui';
import ProviderModal from './ProviderModal';
import { useProviders } from './useProviders';
import { downloadProviders, parseImportFile } from '../lib/backup';
import { importProviders } from '../lib/providers';
import { notify } from '../lib/notify';

/** IMPROVEMENT-001: accepts a providers file or a full backup; upserts by name. */
async function importFile(file: File | undefined) {
    if (!file) return;
    try {
        const content = parseImportFile(JSON.parse(await file.text()));
        if (!content?.providers.length) { notify.error('El archivo no contiene proveedores'); return; }
        const { added, updated } = importProviders(content.providers);
        notify.success(`Proveedores importados: ${added} nuevos, ${updated} actualizados`);
    } catch {
        notify.error('No se pudo leer el archivo de proveedores');
    }
}

const pct = (n: number) => `${(Number(n) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`;
const newProvider = (): Provider => ({ id: 0, name: '', discount: 0, wholesaleDiscount: [] });

/** Legacy /providers page, embedded in the quote creator as a slide-over panel (no separate section). */
export default function ProvidersPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
    const providers = useProviders();
    const [editing, setEditing] = React.useState<Provider | null>(null);

    const dialogRef = React.useRef<HTMLDivElement>(null);
    useEscapeToClose(open, onClose, dialogRef);

    if (!open) return null;
    return (
        <>
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Proveedores" className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px]" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
                <div className="anim-sheet w-full max-w-xl h-full bg-paper shadow-lift flex flex-col">
                    <div className="bg-sheet border-b border-rule-soft px-5 pt-5 pb-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="wide text-2xl font-extrabold">Proveedores</h2>
                                <p className="text-sm text-graphite mt-0.5">Descuentos generales y por volumen. Cada cotización guarda los descuentos con los que se hizo.</p>
                            </div>
                            <CloseButton onClick={onClose} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button text="Nuevo proveedor" icon="plus" onClick={() => setEditing(newProvider())} />
                            <Button text="Exportar proveedores" icon="download" variant="secondary" disabled={providers.length === 0} onClick={() => downloadProviders(providers)} />
                            <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-rule bg-sheet text-sm font-medium text-ink hover:border-mist hover:bg-well cursor-pointer">
                                <Icon name="upload" className="w-4 h-4" />
                                Importar proveedores
                                <input id="providers-upload" type="file" accept=".json" className="hidden" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
                            </label>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto scroll-thin p-5">
                        {providers.length > 0 ? (
                            <ul className="bg-sheet rounded-xl shadow-sheet divide-y divide-rule-soft">
                                {providers.map((provider, index) => {
                                    const tiers = (provider.wholesaleDiscount ?? []).filter(t => Number(t.amount) || Number(t.discount));
                                    return (
                                        <li key={index}>
                                            <button type="button" onClick={() => setEditing(provider)} className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-well rounded-xl" aria-label={`Editar ${provider.name}`}>
                                                <span className="flex-1 min-w-0">
                                                    <span className="block font-semibold truncate">{provider.name}</span>
                                                    <span className="block text-sm text-graphite truncate">
                                                        {tiers.length ? tiers.map(t => `${pct(t.discount)} desde ${formatMoney(Number(t.amount))}`).join(', ') : 'Sin descuentos por volumen'}
                                                    </span>
                                                </span>
                                                <span className="semiwide num text-lg font-bold text-ink">{pct(provider.discount)}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <p className="semiwide text-lg font-semibold">Sin proveedores registrados</p>
                                <p className="text-graphite text-sm mt-1 mb-5">Agrega un proveedor con su descuento para que los costos se calculen solos.</p>
                                <Button text="Nuevo proveedor" icon="plus" onClick={() => setEditing(newProvider())} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ProviderModal provider={editing} onClose={() => setEditing(null)} />
        </>
    );
}
