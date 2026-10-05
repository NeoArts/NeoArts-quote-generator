import React from 'react';
import { useProviders } from './useProviders';
import { Icon } from './ui';

interface ProviderSelectProps {
    id: string;
    value: string;
    onChange: (name: string) => void;
    onCreate: (name: string) => void;
    label?: string;
    /** Borderless trigger for table cells. */
    compact?: boolean;
}

type Place = { left: number; width: number; top?: number; bottom?: number };

/**
 * Searchable provider dropdown with inline "Crear …" option (legacy ProviderSelect).
 * The list uses fixed positioning so the table's scroll area never clips it.
 */
export default function ProviderSelect({ id, value, onChange, onCreate, label, compact = false }: ProviderSelectProps) {
    const providers = useProviders();
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [place, setPlace] = React.useState<Place | null>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const listRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const term = search.trim().toLowerCase();
    // Legacy matches the untrimmed text; only the empty check is trimmed.
    const filtered = term ? providers.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : providers;
    const exactMatch = providers.some(p => p.name.toLowerCase() === search.toLowerCase());
    const showCreate = term !== '' && !exactMatch && filtered.length === 0;

    const close = () => { setIsOpen(false); setSearch(''); };

    React.useLayoutEffect(() => {
        if (!isOpen) return;
        const measure = () => {
            const r = triggerRef.current?.getBoundingClientRect();
            if (!r) return;
            const width = Math.max(r.width, 240);
            const left = Math.min(r.left, window.innerWidth - width - 8);
            setPlace(window.innerHeight - r.bottom < 300 && r.top > 300 ? { left, width, bottom: window.innerHeight - r.top + 4 } : { left, width, top: r.bottom + 4 });
        };
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!listRef.current?.contains(t) && !triggerRef.current?.contains(t)) close();
        };
        // Escape closes only the dropdown, not the dialog around it.
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); triggerRef.current?.focus(); } };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        setTimeout(() => inputRef.current?.focus(), 0);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, [isOpen]);

    const select = (name: string) => { onChange(name); close(); };
    const create = () => { onCreate(search); close(); };

    return (
        <div className="relative w-full">
            {label && <label htmlFor={id} className="label block mb-1.5">{label}</label>}
            <button
                ref={triggerRef}
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={() => (isOpen ? close() : setIsOpen(true))}
                className={compact
                    ? 'w-full h-10 px-3 flex items-center justify-between gap-2 text-sm text-left bg-transparent hover:bg-well focus:ring-2 focus:ring-inset focus:ring-magenta focus:outline-none'
                    : 'field h-10 flex items-center justify-between gap-2 text-left'}
            >
                <span className={`truncate ${value ? 'text-ink' : 'text-mist'}`}>{value || 'Selecciona'}</span>
                <svg className={`w-4 h-4 flex-shrink-0 text-mist transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && place && (
                <div ref={listRef} style={{ position: 'fixed', left: place.left, width: place.width, top: place.top, bottom: place.bottom }} className="anim-pop z-[60] bg-sheet border border-rule rounded-lg shadow-lift overflow-hidden">
                    <div className="p-2 border-b border-rule-soft relative">
                        <Icon name="search" className="w-4 h-4 text-mist absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (filtered.length === 1) select(filtered[0].name); else if (showCreate) create(); } }}
                            placeholder="Buscar proveedor"
                            aria-label="Buscar proveedor"
                            className="field h-9 py-0 pl-8"
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto scroll-thin py-1" role="listbox">
                        {filtered.length > 0 ? filtered.map(p => (
                            <div
                                key={`${p.id}-${p.name}`}
                                role="option"
                                aria-selected={value === p.name}
                                onClick={() => select(p.name)}
                                className={`mx-1 px-3 py-2 rounded-md cursor-pointer flex items-center justify-between text-sm ${value === p.name ? 'bg-magenta-soft text-magenta-ink font-medium' : 'text-ink hover:bg-well'}`}
                            >
                                <span className="truncate">{p.name}</span>
                                <span className="num text-xs text-graphite">{(Number(p.discount) * 100).toFixed(0)}%</span>
                            </div>
                        )) : term === '' ? (
                            <p className="px-4 py-3 text-center text-graphite text-sm">No hay proveedores registrados. Escribe un nombre para crearlo.</p>
                        ) : !showCreate ? (
                            <p className="px-4 py-3 text-center text-graphite text-sm">No se encontraron resultados</p>
                        ) : null}
                        {showCreate && (
                            <div role="option" aria-selected={false} onClick={create} className="mx-1 px-3 py-2 rounded-md cursor-pointer text-sm hover:bg-well flex items-center gap-2">
                                <Icon name="plus" className="w-4 h-4 text-magenta" />
                                <span>Crear "{search}"</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
