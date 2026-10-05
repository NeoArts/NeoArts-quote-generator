import React from 'react';

// Base UI kit for the press-room design (see tailwind.config.js tokens).

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-ink text-white hover:bg-ink-soft disabled:bg-mist',
    secondary: 'bg-sheet text-ink border border-rule hover:border-mist hover:bg-well disabled:text-mist',
    ghost: 'bg-transparent text-graphite hover:bg-ink/5 hover:text-ink disabled:text-mist',
    danger: 'bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40',
    accent: 'bg-magenta text-white hover:bg-magenta-ink disabled:bg-magenta/40',
};

interface ButtonProps {
    text: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
    icon?: IconName;
    className?: string;
    title?: string;
}

export function Button({ text, onClick, disabled = false, loading = false, variant = 'primary', size = 'md', icon, className = '', title }: ButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            title={title}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed
                ${size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm'} ${variantStyles[variant]} ${className}`}
        >
            {loading ? <Spinner /> : icon && <Icon name={icon} className="w-4 h-4" />}
            {text}
        </button>
    );
}

export function IconButton({ icon, label, onClick, tone = 'neutral', className = '' }: { icon: IconName; label: string; onClick: () => void; tone?: 'neutral' | 'danger'; className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${tone === 'danger' ? 'text-mist hover:text-danger hover:bg-danger-soft' : 'text-mist hover:text-ink hover:bg-ink/5'} ${className}`}
        >
            <Icon name={icon} className="w-[18px] h-[18px]" />
        </button>
    );
}

const Spinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

interface FieldProps {
    id: string;
    label?: string;
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    hint?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export function Input({ type, min, max, step, ...props }: FieldProps & { type: string; min?: number; max?: number; step?: string }) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {props.label && <label htmlFor={props.id} className="label">{props.label}</label>}
            <input
                id={props.id}
                name={props.id}
                type={type}
                min={min}
                max={max}
                step={step}
                className="field"
                value={props.value ?? ''}
                placeholder={props.placeholder}
                onChange={props.onChange}
                disabled={props.disabled}
                aria-label={props.label ? undefined : props.placeholder}
            />
            {props.hint && <p className="text-xs text-mist">{props.hint}</p>}
        </div>
    );
}

export function TextArea(props: FieldProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {props.label && <label htmlFor={props.id} className="label">{props.label}</label>}
            <textarea id={props.id} name={props.id} rows={3} className="field resize-y" value={props.value ?? ''} placeholder={props.placeholder} onChange={props.onChange} />
        </div>
    );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
    return <IconButton icon="close" label="Cerrar" onClick={onClick} />;
}

/**
 * Escape closes only the topmost dialog: the last [role=dialog] in the document
 * (nested dialogs render after their parents). Stateless, so it cannot get out of sync.
 */
export function useEscapeToClose(active: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
    const closeRef = React.useRef(onClose);
    closeRef.current = onClose;
    React.useEffect(() => {
        if (!active) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || e.defaultPrevented) return;
            const dialogs = document.querySelectorAll('[role="dialog"]');
            if (dialogs[dialogs.length - 1] === ref.current) { e.preventDefault(); closeRef.current(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, ref]);
}

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    headerActions?: React.ReactNode;
    footer: React.ReactNode;
    children: React.ReactNode;
    size?: 'md' | 'lg';
    bodyClassName?: string;
}

/** Centered dialog. Clicking the backdrop or pressing Escape closes it. */
export function Modal({ open, title, onClose, headerActions, footer, children, size = 'md', bodyClassName = '' }: ModalProps) {
    const dialogRef = React.useRef<HTMLDivElement>(null);
    useEscapeToClose(open, onClose, dialogRef);

    if (!open) return null;
    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-[2px] p-0 sm:p-6"
            onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`anim-pop w-full ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col bg-sheet rounded-t-xl sm:rounded-xl shadow-lift`}>
                <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 border-b border-rule-soft">
                    <h3 className="semiwide text-lg font-semibold text-ink">{title}</h3>
                    <div className="flex items-center gap-2">
                        {headerActions}
                        <CloseButton onClick={onClose} />
                    </div>
                </div>
                <div className={`px-5 py-4 overflow-auto scroll-thin space-y-4 ${bodyClassName}`}>{children}</div>
                <div className="flex items-center gap-3 justify-end px-5 py-3 border-t border-rule-soft bg-well/60 rounded-b-xl">{footer}</div>
            </div>
        </div>
    );
}

export const icon = (name: string) => `${import.meta.env.BASE_URL}icons/${name}.svg`;

const ICON_PATHS = {
    close: 'M6 6l12 12M18 6L6 18',
    trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3',
    copy: 'M9 9h10v10H9zM5 15V5h10',
    expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    sheet: 'M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h8',
    braces: 'M8 4c-2 0-2 2-2 4s-1 4-3 4c2 0 3 2 3 4s0 4 2 4M16 4c2 0 2 2 2 4s1 4 3 4c-2 0-3 2-3 4s0 4-2 4',
    download: 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14',
    upload: 'M12 20V9m0 0l-4 4m4-4l4 4M5 4h14',
    plus: 'M12 5v14M5 12h14',
    back: 'M15 18l-6-6 6-6',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z',
    eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 004.4-1.1',
    file: 'M7 3h7l5 5v13H7zM14 3v5h5',
    search: 'M11 18a7 7 0 100-14 7 7 0 000 14zm9 2l-4.35-4.35',
    building: 'M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M8 7h4M8 11h4M8 15h4M3 21h18',
    grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
    clipboard: 'M9 4h6v3H9zM8 5H6v16h12V5h-2',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z',
    archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}

export const formatMoney = (n: number) => `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
