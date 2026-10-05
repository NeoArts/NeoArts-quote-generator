import { loadPdfAssets, type QuoteImages } from './assets';
import { PdfProvider } from './pdfUtils';
import { defaultPdfOptions, type Quote } from '../types';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const spanishDate = (d: Date = new Date()) => `${d.getDate()} de ${monthNames[d.getMonth()]} de ${d.getFullYear()}`;

/** Quote dates are stored as YYYY-MM-DD; parse them as local dates. Falls back to today. */
export function letterDate(quote: Quote, useQuoteDate: boolean): string {
    const match = useQuoteDate ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(quote.date || '') : null;
    return spanishDate(match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date());
}

const addThousandSeparator = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const pdfFileName = (quote: Quote) => `Cotización ${quote.client} ${'REF: VPM-' + quote.number}.pdf`;

// Port of legacy invoiceUtils.generateQuote. With default options the output is identical to legacy.
function buildQuotePdf(quote: Quote, images: QuoteImages): PdfProvider {
    const o = { ...defaultPdfOptions, ...quote.pdfOptions };
    const doc = new PdfProvider(images, { leftMargin: 60, rightMargin: 60, topMargin: 75, bottomMargin: 90 });
    doc.SetDefaultHeader();
    doc.SetDefaultFooter();
    doc.SetFont('Montserrat-Regular');

    doc.AddBlankLines(3);
    doc.AddLine(o.city);
    doc.AddLine(letterDate(quote, o.useQuoteDate));
    doc.AddBlankLines(1);
    doc.AddLine('Señores');
    doc.AddLine(quote.client);
    doc.AddLine(o.clientCity);
    doc.AddBlankLines(1);
    doc.AddHeader6('REF: VPM-' + quote.number);
    doc.AddBlankLines(1);
    doc.AddLine('Tenemos el agrado de cotizar las siguientes referencias');
    doc.AddBlankLines(1);

    doc.AddTable(
        [
            { text: 'ARTICULO', width: 0.2 },
            { text: 'MARCA', width: 0.15 },
            { text: 'IMAGEN', width: 0.2 },
            { text: 'UND', width: 0.08 },
            { text: 'VALOR UN', width: 0.17 },
        ],
        quote.products.map(p => [String(p.name ?? ''), String(p.markType ?? ''), '', String(p.quantity ?? ''), `$${addThousandSeparator(p.sellPrice)} COP`]),
        quote.products.map(p => p.image.height),
        quote.products,
    );

    doc.SetTextColor(0, 0, 0);
    doc.AddBlankLines(1);
    doc.AddLine('NOTA: Las cantidades  entregadas pueden variar en un 2% aproximadamente,');
    doc.AddLine('sobre el total de la orden.');
    doc.AddBlankLines(1);
    doc.AddLine('Cantidad sujeta a disponibilidad de inventario al momento de la orden de compra.');
    doc.AddLine('Los precios aplican únicamente a las cantidades establecidas en este documento. ');
    doc.AddBlankLines(1);
    doc.AddLineTab('IVA', o.iva);
    doc.AddLineTab('Validez de la oferta:', o.validity);
    doc.AddLineTab('Forma de pago:', o.payment);
    doc.AddLineTab('Tiempo de producción:', o.production);
    doc.AddLineTab('Entrega(s):', o.delivery);
    doc.AddSign(images.sign, 'PNG', 60, 220, 80);
    return doc;
}

export async function generateQuote(quote: Quote): Promise<void> {
    buildQuotePdf(quote, await loadPdfAssets()).DownloadPdf(pdfFileName(quote));
}

export async function renderQuotePdf(quote: Quote): Promise<Blob> {
    return buildQuotePdf(quote, await loadPdfAssets()).ToBlob();
}
