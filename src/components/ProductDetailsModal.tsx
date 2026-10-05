import React from 'react';
import type { DocImage, Product } from '../types';
import { Button, Input, Modal } from './ui';
import ProductFields from './ProductFields';

interface ProductDetailsModalProps {
    product: Product | null;
    onClose: () => void;
    onFieldChange: (field: keyof Product, value: string) => void;
    onImageChange: (image: DocImage) => void;
    /** Legacy "Crear escalas": copies of the product with each comma-separated quantity. */
    onCreateScales: (quantities: number[]) => void;
}

export const parseScales = (input: string): number[] => input.split(',').map(s => Number(s));

/** Legacy quote/Details.tsx: full product form plus the scales mode. Edits apply live. */
export default function ProductDetailsModal({ product, onClose, onFieldChange, onImageChange, onCreateScales }: ProductDetailsModalProps) {
    const [scalesMode, setScalesMode] = React.useState(false);
    const [scales, setScales] = React.useState('');

    React.useEffect(() => { setScalesMode(false); setScales(''); }, [product?.id]);
    if (!product) return null;

    const quantities = parseScales(scales).filter(n => Number.isFinite(n) && n > 0);
    const createScales = () => {
        onCreateScales(parseScales(scales));
        setScalesMode(false);
        setScales('');
        onClose();
    };

    return (
        <Modal
            open
            size="lg"
            title={scalesMode ? 'Crear escalas' : product.name || 'Producto'}
            onClose={onClose}
            headerActions={!scalesMode && <Button text="Crear escalas" variant="secondary" size="sm" onClick={() => setScalesMode(true)} />}
            footer={scalesMode
                ? <><Button text="Cancelar" variant="ghost" onClick={() => setScalesMode(false)} /><Button text="Crear escalas" onClick={createScales} disabled={quantities.length === 0} /></>
                : <Button text="Listo" onClick={onClose} />}
        >
            {scalesMode ? (
                <div className="space-y-3">
                    <p className="text-graphite text-sm">Crea una copia de <strong className="text-ink">{product.name || 'este producto'}</strong> por cada cantidad. Cada copia se cotiza con su propia cantidad.</p>
                    <Input id="scales-input" type="text" label="Cantidades separadas por coma" placeholder="100, 1000, 10000" value={scales} onChange={e => setScales(e.target.value)} />
                    {quantities.length > 0 && (
                        <div className="flex flex-wrap gap-2" aria-label="Escalas a crear">
                            {quantities.map((q, i) => <span key={i} className="num text-sm px-2.5 py-1 rounded-full bg-magenta-soft text-magenta-ink">{q.toLocaleString('es-CO')} und</span>)}
                        </div>
                    )}
                </div>
            ) : (
                <ProductFields product={product} onFieldChange={onFieldChange} onImageChange={onImageChange} />
            )}
        </Modal>
    );
}
