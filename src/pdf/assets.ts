import { jsPDF } from 'jspdf';
import regularUrl from './assets/Montserrat-Regular.ttf?url';
import boldUrl from './assets/Montserrat-Bold.ttf?url';
import headerUrl from './assets/quote-header.png?url';
import footerUrl from './assets/quote-footer.jpg?url';
import signUrl from './assets/quote-sign.png?url';

// Fonts and template images are binary files fetched on first use instead of base64 strings
// inside the JS bundle. Same bytes as legacy, so the PDF output is unchanged (see e2e/pdf-parity.mjs).

export type QuoteImages = { header: string; footer: string; sign: string };

async function fetchBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
}

let loading: Promise<QuoteImages> | null = null;

export function loadPdfAssets(): Promise<QuoteImages> {
    loading ??= (async () => {
        const [regular, bold, header, footer, sign] = await Promise.all([regularUrl, boldUrl, headerUrl, footerUrl, signUrl].map(fetchBase64));
        jsPDF.API.events.push(['addFonts', function (this: jsPDF) {
            // Regular first, Bold second: same font ids as the legacy build (F15/F16), keeps the PDF identical.
            this.addFileToVFS('Montserrat-Regular-normal.ttf', regular);
            this.addFont('Montserrat-Regular-normal.ttf', 'Montserrat-Regular', 'normal');
            this.addFileToVFS('Montserrat-Bold-normal.ttf', bold);
            this.addFont('Montserrat-Bold-normal.ttf', 'Montserrat-Bold', 'normal');
        }]);
        return { header: `data:image/png;base64,${header}`, footer: `data:image/jpeg;base64,${footer}`, sign: `data:image/png;base64,${sign}` };
    })().catch(error => { loading = null; throw error; });
    return loading;
}
