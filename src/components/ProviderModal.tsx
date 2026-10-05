import React from 'react';
import type { Discount, Provider } from '../types';
import { deleteProvider, getProviders, saveProvider } from '../lib/providers';
import { Button, IconButton, Input, Modal } from './ui';

const asPct = (v: unknown) => (v === '' || v === undefined || Number.isNaN(Number(v)) ? undefined : `${(Number(v) * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`);

interface ProviderModalProps {
    provider: Provider | null;
    onClose: () => void;
}

const emptyTier = (): Discount => ({ id: 0, amount: 0, discount: 0 });

/** Legacy providers/Details.tsx + ProviderDiscountTable.tsx. Rows are edited by position. */
export default function ProviderModal({ provider: initial, onClose }: ProviderModalProps) {
    const [provider, setProvider] = React.useState<Provider | null>(initial);
    React.useEffect(() => {
        setProvider(initial && { ...initial, wholesaleDiscount: initial.wholesaleDiscount?.length ? initial.wholesaleDiscount : [emptyTier()] });
    }, [initial]);
    // Check the prop too, so closing hides the dialog in the same render.
    if (!initial || !provider) return null;
    const exists = !!initial.name && getProviders().some(p => p.name === initial.name);

    const setField = (field: 'name' | 'discount') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setProvider({ ...provider, [field]: e.target.value });
    const setTier = (index: number, field: 'amount' | 'discount', value: string) =>
        setProvider({ ...provider, wholesaleDiscount: provider.wholesaleDiscount.map((d, i) => (i === index ? { ...d, [field]: value } : d)) });
    const addTier = () =>
        setProvider({ ...provider, wholesaleDiscount: [...provider.wholesaleDiscount, { id: provider.wholesaleDiscount.length, amount: 0, discount: 0 }] });
    const removeTier = (index: number) => {
        const rest = provider.wholesaleDiscount.filter((_, i) => i !== index);
        setProvider({ ...provider, wholesaleDiscount: rest.length ? rest : [emptyTier()] });
    };

    const handleSave = () => {
        saveProvider(provider);
        onClose();
    };
    const handleDelete = () => {
        if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            deleteProvider(provider.name);
            onClose();
        }
    };

    return (
        <Modal
            open
            title={exists ? 'Editar proveedor' : 'Nuevo proveedor'}
            onClose={onClose}
            footer={<>
                {exists && <Button text="Eliminar" icon="trash" variant="ghost" className="mr-auto !text-danger hover:!bg-danger-soft" onClick={handleDelete} />}
                <Button text="Cancelar" variant="ghost" onClick={onClose} />
                <Button text="Guardar" onClick={handleSave} />
            </>}
        >
            <div className="grid grid-cols-[1fr_9rem] gap-3">
                <Input id="provider-name" type="text" label="Nombre" placeholder="PROMOS" value={provider.name} onChange={setField('name')} />
                <Input id="provider-discount" type="number" step="0.01" min={0} max={1} label="Descuento" placeholder="0.4" value={provider.discount?.toString()} onChange={setField('discount')} hint={asPct(provider.discount)} />
            </div>
            <fieldset className="space-y-2">
                <legend className="label mb-1">Descuentos por volumen</legend>
                <p className="text-xs text-mist -mt-1">Se aplican sobre el costo con descuento cuando el total del producto (o de su grupo) llega al monto.</p>
                <div className="rounded-lg border border-rule-soft divide-y divide-rule-soft">
                    <div className="grid grid-cols-[1fr_8rem_2.5rem] gap-2 px-3 py-2 text-xs font-medium text-graphite bg-well rounded-t-lg">
                        <span>Desde (monto)</span><span>Descuento</span><span />
                    </div>
                    {provider.wholesaleDiscount.map((tier, index) => (
                        <div key={index} className="grid grid-cols-[1fr_8rem_2.5rem] gap-2 px-3 py-2 items-center">
                            <input id={`discount-provider-${index}`} aria-label={`Monto del nivel ${index + 1}`} className="field num" inputMode="numeric" placeholder="5000" value={tier.amount.toString()} onChange={e => setTier(index, 'amount', e.target.value)} />
                            <input id={`discount-value-${index}`} aria-label={`Descuento del nivel ${index + 1}`} className="field num" type="number" step="0.01" placeholder="0.1" value={tier.discount.toString()} onChange={e => setTier(index, 'discount', e.target.value)} />
                            <IconButton icon="trash" label="Eliminar descuento" tone="danger" onClick={() => removeTier(index)} />
                        </div>
                    ))}
                </div>
                <Button text="Agregar nivel" icon="plus" variant="ghost" size="sm" onClick={addTier} title="Agregar descuento" />
            </fieldset>
        </Modal>
    );
}
