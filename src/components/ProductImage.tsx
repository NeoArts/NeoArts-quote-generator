import React from 'react';
import type { DocImage } from '../types';
import { blobToDocImage } from '../lib/images';
import { Button, Icon, Modal } from './ui';

const EMPTY: DocImage = { base64String: '', height: 0 };

/** Legacy ImgContainer: paste an image into the box (Ctrl+V); "Quitar imagen" clears it. */
export function ImageBox({ image, onChange }: { image: DocImage; onChange: (img: DocImage) => void }) {
    const onPaste = async (e: React.ClipboardEvent) => {
        const item = e.clipboardData?.items[0];
        if (!item || !item.type.includes('image')) return;
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onChange(await blobToDocImage(file));
    };

    return (
        <div className="flex flex-col gap-2">
            <span className="label">Imagen</span>
            {image?.base64String ? (
                <div className="space-y-2">
                    <div className="rounded-lg border border-rule-soft bg-[repeating-conic-gradient(#F6F7F9_0%_25%,#fff_0%_50%)] [background-size:16px_16px] p-3 flex items-center justify-center min-h-44">
                        <img src={image.base64String} alt="Imagen del producto" className="max-h-64 object-contain" />
                    </div>
                    <Button text="Quitar imagen" icon="trash" variant="ghost" size="sm" onClick={() => onChange(EMPTY)} title="Eliminar imagen" />
                </div>
            ) : (
                <textarea
                    aria-label="Pega aquí la imagen (Ctrl+V)"
                    placeholder={'Haz clic aquí y pega la imagen\n(Ctrl+V)'}
                    value=""
                    onChange={() => undefined}
                    onPaste={onPaste}
                    className="min-h-44 w-full rounded-lg border-2 border-dashed border-rule bg-well text-center pt-16 text-sm text-graphite placeholder:text-graphite caret-transparent resize-none focus:border-magenta focus:ring-0 focus:bg-magenta-soft/30 cursor-pointer"
                />
            )}
        </div>
    );
}

/** Legacy ImagePopup. */
export function ImageModal({ open, image, onChange, onClose, onPaste }: { open: boolean; image: DocImage; onChange: (img: DocImage) => void; onClose: () => void; onPaste: () => void }) {
    return (
        <Modal
            open={open}
            title="Imagen del producto"
            onClose={onClose}
            footer={<>
                <Button text="Pegar del portapapeles" icon="clipboard" variant="ghost" className="mr-auto" onClick={onPaste} />
                <Button text="Listo" onClick={onClose} />
            </>}
        >
            <ImageBox image={image} onChange={onChange} />
            <p className="text-xs text-mist flex items-center gap-1.5"><Icon name="image" className="w-3.5 h-3.5" />En el PDF la imagen se ajusta a 117 pt de ancho.</p>
        </Modal>
    );
}

/** Legacy 📋 button: read an image straight from the clipboard. */
export async function readClipboardImage(): Promise<DocImage | null> {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            const type = item.types.find(t => t.startsWith('image/'));
            if (type) return await blobToDocImage(await item.getType(type));
        }
        window.alert('No hay ninguna imagen en el portapapeles. Copia una imagen e inténtalo de nuevo.');
    } catch {
        window.alert('El navegador no permitió leer el portapapeles. Acepta el permiso o pega la imagen con Ctrl+V en el recuadro de imagen.');
    }
    return null;
}
