import React from 'react';
import type { DocImage, Product, Provider } from '../types';
import { Icon, Input, TextArea } from './ui';
import ProviderSelect from './ProviderSelect';
import ProviderModal from './ProviderModal';
import { ImageBox, ImageModal, readClipboardImage } from './ProductImage';

type EditableField = Exclude<keyof Product, 'id' | 'image' | 'provider'>;
export type ColumnGroup = 'Producto' | 'Costos' | 'Venta';

export type Column = {
    field: EditableField | 'provider' | 'image';
    header: string;
    label: string;
    width: string;
    group: ColumnGroup;
    type?: 'number';
    calc?: boolean;
    money?: boolean;
    placeholder?: string;
    title?: string;
};

// Inputs first, results last, grouped the way a quote is reasoned about.
export const COLUMNS: Column[] = [
    { field: 'name', header: 'Artículo', label: 'Artículo', width: 'w-52', group: 'Producto', placeholder: 'Nombre del producto' },
    { field: 'image', header: 'Imagen', label: 'Imagen', width: 'w-20', group: 'Producto' },
    { field: 'markType', header: 'Tipo de marca', label: 'Tipo de marca', width: 'w-28', group: 'Producto', placeholder: '1 tinta' },
    { field: 'provider', header: 'Proveedor', label: 'Proveedor', width: 'w-36', group: 'Producto' },
    { field: 'quantity', header: 'Cantidad', label: 'Cantidad', width: 'w-20', group: 'Producto', type: 'number', placeholder: '0' },
    { field: 'discountGroup', header: 'Grupo', label: 'Grupo de descuento', width: 'w-16', group: 'Producto', placeholder: '—', title: 'Productos del mismo proveedor con el mismo grupo suman su volumen para alcanzar descuentos por mayoreo' },
    { field: 'cost', header: 'Costo', label: 'Costo unitario', width: 'w-24', group: 'Costos', type: 'number', placeholder: '0' },
    { field: 'providerDiscount', header: 'Dto. prov.', label: 'Descuento del proveedor', width: 'w-20', group: 'Costos', placeholder: '0.4', title: 'Fracción: 0.4 = 40%' },
    { field: 'costOff', header: 'Con dto.', label: 'Costo con descuento', width: 'w-24', group: 'Costos', calc: true, money: true },
    { field: 'markCost', header: 'Marca', label: 'Costo de marca', width: 'w-20', group: 'Costos', type: 'number', placeholder: '0' },
    { field: 'otherCost', header: 'Otros', label: 'Otros costos', width: 'w-20', group: 'Costos', type: 'number', placeholder: '0' },
    { field: 'totalCost', header: 'Costo total', label: 'Costo total unitario', width: 'w-24', group: 'Costos', calc: true, money: true },
    { field: 'profit', header: 'Rentab.', label: 'Rentabilidad (%)', width: 'w-20', group: 'Venta', type: 'number', placeholder: '70', title: 'Precio = costo total ÷ (rentabilidad / 100). Con 70, el costo es el 70% del precio.' },
    { field: 'sellPrice', header: 'Precio unit.', label: 'Precio de venta unitario', width: 'w-24', group: 'Venta', calc: true, money: true },
    { field: 'totalValue', header: 'Valor total', label: 'Valor total', width: 'w-28', group: 'Venta', calc: true, money: true },
];

/** Artículo stays pinned left and Valor total pinned right while the table scrolls sideways. */
export const STICKY: Partial<Record<Column['field'], string>> = {
    name: 'md:sticky md:left-10 z-[5] md:shadow-[1px_0_0_theme(colors.rule.DEFAULT)]',
    totalValue: 'md:sticky md:right-28 z-[5] !bg-sheet font-semibold md:shadow-[-1px_0_0_theme(colors.rule.DEFAULT)]',
};

const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
export const formatCalc = (v: unknown) => (v === '' || v === undefined || v === null || !Number.isFinite(Number(v)) ? '' : numberFormat.format(Number(v)));

interface ProductFieldsProps {
    product: Product;
    /** Row index in the table, or undefined when rendered in the details dialog. */
    index?: number;
    onFieldChange: (field: keyof Product, value: string) => void;
    onImageChange: (image: DocImage) => void;
}

/** Legacy FormProducts: table row cells, or a form inside the details dialog. */
export default function ProductFields({ product, index, onFieldChange, onImageChange }: ProductFieldsProps) {
    const inRow = index !== undefined;
    const [showImage, setShowImage] = React.useState(false);
    const [newProvider, setNewProvider] = React.useState<Provider | null>(null);
    const idFor = (field: string) => (inRow ? `product-${field}-${index}` : `detail-${field}`);
    const rowLabel = (col: Column) => `${col.label}${inRow ? `, fila ${index + 1}` : ''}`;

    const pasteFromClipboard = async () => { const img = await readClipboardImage(); if (img) onImageChange(img); };

    const renderField = (col: Column) => {
        if (col.field === 'provider') {
            return (
                <ProviderSelect
                    id={idFor('provider')}
                    value={product.provider}
                    label={inRow ? undefined : col.label}
                    compact={inRow}
                    onChange={name => onFieldChange('provider', name)}
                    onCreate={name => setNewProvider({ id: Date.now(), name, discount: 0, wholesaleDiscount: [] })}
                />
            );
        }
        if (col.field === 'image') {
            if (!inRow) return <ImageBox image={product.image} onChange={onImageChange} />;
            return (
                <div className="flex items-center gap-1 h-10 px-2">
                    {product.image?.base64String ? (
                        <button type="button" className="w-10 h-8 rounded border border-rule-soft bg-sheet overflow-hidden hover:border-magenta" onClick={() => setShowImage(true)} title="Ver imagen" aria-label={`Ver imagen, fila ${index + 1}`}>
                            <img src={product.image.base64String} alt="Preview" className="w-full h-full object-contain" />
                        </button>
                    ) : (
                        <button type="button" className="w-10 h-8 rounded border border-dashed border-rule text-mist hover:text-ink hover:border-mist flex items-center justify-center" onClick={() => setShowImage(true)} title="Agregar imagen" aria-label={`Agregar imagen, fila ${index + 1}`}>
                            <Icon name="image" className="w-4 h-4" />
                        </button>
                    )}
                    <button type="button" onClick={pasteFromClipboard} className="w-8 h-8 rounded text-mist hover:text-ink hover:bg-ink/5 flex items-center justify-center" title="Pegar imagen del portapapeles" aria-label="Pegar imagen del portapapeles">
                        <Icon name="clipboard" className="w-4 h-4" />
                    </button>
                </div>
            );
        }
        const field = col.field;
        const raw = product[field];
        const value = raw === undefined || raw === null ? '' : String(raw);
        const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onFieldChange(field, e.target.value);

        if (!inRow) {
            if (col.calc) {
                return (
                    <div className="flex flex-col gap-1.5">
                        <span className="label">{col.label}</span>
                        <output id={idFor(field)} data-value={value} className="h-10 flex items-center px-3 rounded-md bg-well text-graphite num">{col.money && value ? '$' : ''}{formatCalc(raw)}</output>
                    </div>
                );
            }
            if (field === 'name') return <TextArea id={idFor(field)} label={col.label} placeholder={col.placeholder} value={value} onChange={onChange} />;
            return <Input id={idFor(field)} type={col.type ?? 'text'} label={col.label} placeholder={col.placeholder} value={value} onChange={onChange} hint={col.title} />;
        }
        if (col.calc) {
            return <input id={idFor(field)} readOnly tabIndex={-1} aria-label={rowLabel(col)} data-value={value} className="cell-calc" value={formatCalc(raw)} />;
        }
        const numeric = col.type === 'number' || field === 'providerDiscount';
        return (
            <input
                id={idFor(field)}
                type={col.type ?? 'text'}
                inputMode={numeric ? 'decimal' : undefined}
                aria-label={rowLabel(col)}
                className={`cell ${numeric ? 'text-right num' : ''} ${field === 'name' ? 'font-medium' : ''}`}
                value={value}
                placeholder={col.placeholder}
                onChange={onChange}
            />
        );
    };

    const modals = (
        <>
            {inRow && <ImageModal open={showImage} image={product.image} onChange={onImageChange} onClose={() => setShowImage(false)} onPaste={pasteFromClipboard} />}
            <ProviderModal provider={newProvider} onClose={() => setNewProvider(null)} />
        </>
    );

    if (inRow) {
        return (
            <>
                {modals}
                {COLUMNS.map(col => (
                    <div
                        key={col.field}
                        title={col.title}
                        className={`${col.width} flex-shrink-0 border-r border-rule-soft ${col.calc ? 'bg-well' : 'bg-sheet'} ${STICKY[col.field] ?? ''}`}
                    >
                        {renderField(col)}
                    </div>
                ))}
            </>
        );
    }

    const byGroup = (g: ColumnGroup) => COLUMNS.filter(c => c.group === g && c.field !== 'image' && c.field !== 'name');
    return (
        <div className="grid md:grid-cols-[1fr_15rem] gap-6">
            {modals}
            <div className="space-y-5">
                {renderField(COLUMNS[0])}
                {(['Producto', 'Costos', 'Venta'] as ColumnGroup[]).map(g => (
                    <fieldset key={g} className="space-y-3">
                        <legend className="semiwide text-sm font-semibold text-ink mb-2">{g}</legend>
                        <div className="grid grid-cols-2 gap-3">
                            {byGroup(g).map(col => <div key={col.field} className={col.field === 'provider' ? 'col-span-2' : ''}>{renderField(col)}</div>)}
                        </div>
                    </fieldset>
                ))}
            </div>
            <div>{renderField(COLUMNS[1])}</div>
        </div>
    );
}
