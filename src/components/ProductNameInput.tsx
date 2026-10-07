import React from 'react';
import { searchLibrary, type LibraryEntry } from '../lib/library';
import { formatMoney } from './ui';
import { displayDate } from './QuoteList';

/** Product history for the open quote, and how to fill a row from an entry. Provided by QuoteEditor. */
export const LibraryContext = React.createContext<{ entries: LibraryEntry[]; pick: (row: number, entry: LibraryEntry) => void }>({ entries: [], pick: () => undefined });

interface ProductNameInputProps {
    id: string;
    row: number;
    value: string;
    ariaLabel: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

type Place = { left: number; width: number; top?: number; bottom?: number };

/**
 * Name cell with suggestions from previously quoted products (IMPROVEMENT "reuse previous products").
 * Typing keeps working as a plain input; ↓/↑ choose a suggestion, Enter fills the row, Escape closes.
 */
export default function ProductNameInput({ id, row, value, ariaLabel, placeholder, onChange }: ProductNameInputProps) {
    const { entries, pick } = React.useContext(LibraryContext);
    const [open, setOpen] = React.useState(false);
    const [active, setActive] = React.useState(-1);
    const [place, setPlace] = React.useState<Place | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const matches = open ? searchLibrary(entries, value) : [];
    const show = open && matches.length > 0;

    React.useLayoutEffect(() => {
        if (!show) return;
        const measure = () => {
            const r = inputRef.current?.getBoundingClientRect();
            if (!r) return;
            const width = Math.max(r.width, 380);
            const left = Math.min(r.left, window.innerWidth - width - 8);
            setPlace(window.innerHeight - r.bottom < 320 && r.top > 320 ? { left, width, bottom: window.innerHeight - r.top + 4 } : { left, width, top: r.bottom + 4 });
        };
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
    }, [show]);

    const choose = (entry: LibraryEntry) => { setOpen(false); setActive(-1); pick(row, entry); };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!show) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); setActive(a => Math.min(a + 1, matches.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); setActive(a => Math.max(a - 1, -1)); }
        else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); e.stopPropagation(); choose(matches[active]); }
        else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); setActive(-1); }
    };

    const listId = `${id}-suggestions`;
    return (
        <>
            <input
                ref={inputRef}
                id={id}
                type="text"
                role="combobox"
                aria-label={ariaLabel}
                aria-autocomplete="list"
                aria-expanded={show}
                aria-controls={show ? listId : undefined}
                aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
                autoComplete="off"
                className="cell font-medium"
                value={value}
                placeholder={placeholder}
                onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1); }}
                onKeyDown={onKeyDown}
                onBlur={() => setOpen(false)}
            />
            {show && place && (
                <div id={listId} role="listbox" aria-label="Productos cotizados antes" style={{ position: 'fixed', left: place.left, width: place.width, top: place.top, bottom: place.bottom }} className="anim-pop z-[60] bg-sheet border border-rule rounded-lg shadow-lift overflow-hidden">
                    <p className="px-3 pt-2 pb-1 text-xs text-graphite">Productos cotizados antes</p>
                    <ul className="max-h-72 overflow-y-auto scroll-thin pb-1">
                        {matches.map((m, i) => (
                            <li
                                key={m.key}
                                id={`${listId}-${i}`}
                                role="option"
                                aria-selected={i === active}
                                onMouseDown={e => { e.preventDefault(); choose(m); }}
                                onMouseEnter={() => setActive(i)}
                                className={`mx-1 px-2 py-1.5 rounded-md cursor-pointer flex items-center gap-3 ${i === active ? 'bg-magenta-soft' : 'hover:bg-well'}`}
                            >
                                <span className="w-9 h-9 flex-shrink-0 rounded border border-rule-soft bg-sheet overflow-hidden flex items-center justify-center">
                                    {m.thumb ? <img src={m.thumb} alt="" className="w-full h-full object-contain" /> : <span className="text-[10px] text-mist">{m.hasImage ? 'img' : ''}</span>}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-ink truncate">{m.name}</span>
                                    <span className="block text-xs text-graphite truncate">{[m.provider, m.markType, m.cost ? `costo ${formatMoney(m.cost)}` : ''].filter(Boolean).join(', ')}</span>
                                </span>
                                <span className="text-xs text-mist text-right flex-shrink-0 max-w-[8rem] truncate" title={`${m.client}, ${displayDate(m.date)}`}>{displayDate(m.date)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
