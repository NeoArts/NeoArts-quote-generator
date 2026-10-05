import type { DocImage } from '../types';

// Legacy sizes images for a 117pt-wide PDF cell.
const PDF_IMAGE_WIDTH = 117;

export const readAsDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
});

export const heightForWidth = (dataUrl: string, width = PDF_IMAGE_WIDTH) => new Promise<number>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(width / (img.width / img.height));
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
});

export async function blobToDocImage(blob: Blob): Promise<DocImage> {
    const base64String = await readAsDataUrl(blob);
    return { base64String, height: await heightForWidth(base64String) };
}
