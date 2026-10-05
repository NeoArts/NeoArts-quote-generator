import React from 'react';
import { emptyProduct, type Quote } from '../types';
import { putQuote, suggestNextNumber } from '../lib/db';
import { Button, Input, Modal } from './ui';

const today = () => new Date().toISOString().split('T')[0];
const randomId = () => Math.random().toString(36).substring(7);
const blankQuote = (): Quote => ({ id: randomId(), date: today(), number: '', client: '', products: [{ ...emptyProduct }] });

export default function NewQuoteModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
    // Like legacy, a draft survives closing the dialog; it resets after a successful create.
    const [quote, setQuote] = React.useState<Quote>(blankQuote);
    // Suggest the next number when the dialog opens with an empty number (IMPROVEMENT-002).
    React.useEffect(() => {
        if (!open || quote.number) return;
        suggestNextNumber().then(n => setQuote(q => (q.number ? q : { ...q, number: n }))).catch(() => undefined);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const create = () => {
        putQuote(quote)
            .then(() => { setQuote(blankQuote()); onClose(); onCreated(); })
            .catch(() => window.alert('No se pudo guardar la cotización. Intenta de nuevo.'));
    };
    const set = (field: 'date' | 'number' | 'client') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setQuote({ ...quote, [field]: e.target.value });

    return (
        <Modal open={open} title="Nueva cotización" onClose={onClose} footer={<><Button text="Cancelar" variant="ghost" onClick={onClose} /><Button text="Crear cotización" onClick={create} /></>}>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); create(); }}>
                <Input type="text" label="Cliente" id="quote-client" placeholder="Nombre de la empresa" value={quote.client} onChange={set('client')} />
                <div className="grid grid-cols-2 gap-3">
                    <Input type="text" label="Número" id="quote-number" placeholder="000" value={quote.number} onChange={set('number')} hint="Aparece como REF: VPM-número" />
                    <Input type="date" label="Fecha" id="quote-date" value={quote.date} onChange={set('date')} />
                </div>
                <button type="submit" className="hidden" />
            </form>
        </Modal>
    );
}
