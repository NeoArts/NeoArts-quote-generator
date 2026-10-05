import React from 'react';
import toast from 'react-hot-toast';

// Toasts (persistence to the legacy notifications center is out of scope). Base style lives in App's <Toaster>.
export const notify = {
    success: (m: string) => toast.success(m, { duration: 4000 }),
    error: (m: string) => toast.error(m, { duration: 6000 }),
    info: (m: string) => toast(m, { duration: 4000 }),
    warning: (m: string) => toast(m, { icon: '⚠', duration: 5000, style: { background: '#7A5C00' } }),
};

/** Toast with a "Deshacer" button (IMPROVEMENT-008). */
export function notifyUndoable(message: string, onUndo: () => void) {
    return toast(
        (t) => (
            React.createElement('span', { className: 'flex items-center gap-4' },
                message,
                React.createElement('button', {
                    type: 'button',
                    className: 'px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-semibold',
                    onClick: () => { toast.dismiss(t.id); onUndo(); },
                }, 'Deshacer'))
        ),
        { duration: 8000 },
    );
}
