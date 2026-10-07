import React from 'react';
import type { DocImage, Product } from '../types';
import { Icon, IconButton } from './ui';
import ProductFields, { COLUMNS, STICKY, type ColumnGroup } from './ProductFields';

interface ProductTableProps {
    products: Product[];
    onFieldChange: (index: number) => (field: keyof Product, value: string) => void;
    onImageChange: (index: number) => (image: DocImage) => void;
    onDelete: (index: number) => void;
    onDuplicate: (index: number) => void;
    onDetails: (index: number) => void;
    onAdd: () => void;
    /** IMPROVEMENT-012: reorder rows (drag handle, or Alt+↑/↓ on the handle). */
    onMove: (from: number, to: number) => void;
}

// Column group bands: one quiet tint per group so the eye can find costs vs. sale at a glance.
const GROUP_STYLE: Record<ColumnGroup, string> = {
    Producto: 'text-ink',
    Costos: 'text-cyan',
    Venta: 'text-magenta-ink',
};
const REM: Record<string, number> = { 'w-16': 4, 'w-20': 5, 'w-24': 6, 'w-28': 7, 'w-32': 8, 'w-36': 9, 'w-44': 11, 'w-52': 13, 'w-56': 14 };
const groupSpans = (['Producto', 'Costos', 'Venta'] as ColumnGroup[]).map(g => ({ group: g, cols: COLUMNS.filter(c => c.group === g) }));

/** Spreadsheet-style product table: sticky header, sticky product name, sticky row actions. */
export default function ProductTable({ products, onFieldChange, onImageChange, onDelete, onDuplicate, onDetails, onAdd, onMove }: ProductTableProps) {
    const [dragFrom, setDragFrom] = React.useState<number | null>(null);
    const [dragOver, setDragOver] = React.useState<number | null>(null);

    const endDrag = () => { setDragFrom(null); setDragOver(null); };

    // Spreadsheet keys: Enter/Shift+Enter move down/up, Ctrl+Enter adds a product, Ctrl+D copies the value above.
    const focusCell = (field: string, row: number) => setTimeout(() => {
        const el = document.getElementById(`product-${field}-${row}`) as HTMLInputElement | null;
        el?.focus();
        if (el && 'select' in el && el.tagName === 'INPUT' && !el.readOnly) el.select();
    }, 0);
    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const m = /^product-(\w+)-(\d+)$/.exec(target.id);
        if (!m) return;
        const [, field, rowText] = m;
        const row = Number(rowText);
        const mod = e.ctrlKey || e.metaKey;
        if (e.key === 'Enter' && mod) {
            e.preventDefault();
            onAdd();
            focusCell('name', products.length);
        } else if (e.key === 'Enter' && target.tagName === 'INPUT' && !e.altKey) {
            e.preventDefault();
            const next = e.shiftKey ? row - 1 : row + 1;
            if (next >= 0 && next < products.length) focusCell(field, next);
        } else if (mod && (e.key === 'd' || e.key === 'D') && row > 0) {
            e.preventDefault();
            const above = products[row - 1]?.[field as keyof Product];
            const calc = (target as HTMLInputElement).readOnly;
            if (!calc && above !== undefined && typeof above !== 'object') onFieldChange(row)(field as keyof Product, String(above));
        }
    };
    // Keyboard moves keep focus on the moved row's handle.
    const moveWithKeyboard = (from: number, to: number) => {
        onMove(from, to);
        setTimeout(() => document.querySelector<HTMLButtonElement>(`[aria-label="Mover fila ${to + 1}"]`)?.focus(), 0);
    };

    return (
        <div className="bg-sheet rounded-xl shadow-sheet overflow-hidden">
            <div id="table-scroll" className="overflow-auto scroll-thin max-h-[calc(100vh-17rem)]" onKeyDown={onKeyDown}>
                <div className="w-max min-w-full">
                    <div className="sticky top-0 z-20 bg-sheet">
                        <div className="flex border-b border-rule-soft">
                            <div className="w-10 flex-shrink-0 md:sticky left-0 z-10 bg-sheet" />
                            {groupSpans.map(({ group, cols }) => (
                                <div key={group} style={{ width: `${cols.reduce((s, c) => s + REM[c.width], 0)}rem` }} className={`flex-shrink-0 px-3 pt-2.5 pb-1.5 text-xs font-semibold semiwide border-r border-rule-soft ${GROUP_STYLE[group]}`}>
                                    {group}
                                </div>
                            ))}
                            <div className="w-28 flex-shrink-0 sticky right-0 bg-sheet" />
                        </div>
                        <div className="flex border-b border-rule">
                            <div className="w-10 flex-shrink-0 md:sticky left-0 z-10 bg-sheet" />
                            {COLUMNS.map(col => (
                                <div key={col.field} title={col.title} className={`${col.width} flex-shrink-0 px-3 py-2 text-xs font-medium text-graphite border-r border-rule-soft ${col.calc || col.type === 'number' || col.field === 'providerDiscount' ? 'text-right' : ''} ${col.field === 'name' || col.field === 'totalValue' ? `${STICKY[col.field]} !z-10 bg-sheet` : ''}`}>
                                    {col.header}
                                </div>
                            ))}
                            <div className="w-28 flex-shrink-0 sticky right-0 bg-sheet border-l border-rule-soft" />
                        </div>
                    </div>

                    {products.map((product, index) => (
                        <div
                            key={index}
                            data-testid={`product-row-${index}`}
                            className={`group flex border-b border-rule-soft ${dragOver === index && dragFrom !== index ? 'shadow-[inset_0_2px_0_theme(colors.magenta.DEFAULT)]' : ''} ${dragFrom === index ? 'opacity-40' : ''}`}
                            onDragOver={e => { if (dragFrom !== null) { e.preventDefault(); setDragOver(index); } }}
                            onDrop={e => { e.preventDefault(); if (dragFrom !== null) onMove(dragFrom, index); endDrag(); }}
                        >
                            <div className="w-10 flex-shrink-0 md:sticky left-0 z-[6] bg-sheet flex items-center justify-center">
                                <button
                                    type="button"
                                    draggable
                                    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(index)); setDragFrom(index); }}
                                    onDragEnd={endDrag}
                                    onKeyDown={e => {
                                        if (!e.altKey) return;
                                        if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); moveWithKeyboard(index, index - 1); }
                                        if (e.key === 'ArrowDown' && index < products.length - 1) { e.preventDefault(); moveWithKeyboard(index, index + 1); }
                                    }}
                                    title="Arrastra para reordenar (o Alt + ↑/↓)"
                                    aria-label={`Mover fila ${index + 1}`}
                                    className="w-7 h-9 rounded flex items-center justify-center text-rule group-hover:text-mist hover:!text-ink cursor-grab active:cursor-grabbing focus:text-ink"
                                >
                                    <Icon name="grip" className="w-4 h-4" />
                                </button>
                            </div>
                            <ProductFields product={product} index={index} onFieldChange={onFieldChange(index)} onImageChange={onImageChange(index)} />
                            <div className="w-28 flex-shrink-0 sticky right-0 z-[6] bg-sheet border-l border-rule-soft flex items-center justify-center gap-0.5">
                                <IconButton icon="expand" label={`Detalles fila ${index + 1}`} onClick={() => onDetails(index)} />
                                <IconButton icon="copy" label={`Duplicar fila ${index + 1}`} onClick={() => onDuplicate(index)} />
                                <IconButton icon="trash" label={`Eliminar fila ${index + 1}`} tone="danger" onClick={() => onDelete(index)} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex items-center border-t border-rule-soft">
                <button type="button" onClick={onAdd} className="flex-1 flex items-center gap-2 px-4 h-11 text-sm font-medium text-graphite hover:text-ink hover:bg-well">
                    <Icon name="plus" className="w-4 h-4" /> Agregar producto
                </button>
                <p className="hidden lg:flex items-center gap-4 px-4 text-xs text-mist" aria-label="Atajos de teclado">
                    <span><kbd className="font-sans font-semibold text-graphite">Enter</kbd> fila siguiente</span>
                    <span><kbd className="font-sans font-semibold text-graphite">Ctrl+Enter</kbd> nuevo producto</span>
                    <span><kbd className="font-sans font-semibold text-graphite">Ctrl+D</kbd> copiar de arriba</span>
                </p>
            </div>
        </div>
    );
}
