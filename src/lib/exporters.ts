import fileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import type { Product, Quote } from '../types';
import { normalizeProduct, normalizeQuote } from './numbers';

// Excel columns (IMPROVEMENT-003): legacy put providerDiscount under "Precio con descuento" and markType
// under "Costo de marca", and wrote the image object into a hidden column. Fixed; numbers are real numbers.
export function excelRows(products: Product[]) {
    return products.map(raw => {
        const item = normalizeProduct(raw);
        return {
            'Id': item.id,
            'Artículo': item.name,
            'Descuento Proveedor': item.providerDiscount,
            'Precio con descuento': item.costOff,
            'Costo Total': item.totalCost,
            'Precio de venta': item.sellPrice,
            'Valor total': item.totalValue,
            'Tipo de marca': item.markType,
            'Proveedor': item.provider,
            'Costo': item.cost,
            'Cantidad': item.quantity,
            'Costo de marca': item.markCost,
            'Otros costos': item.otherCost,
            'Rentabilidad': item.profit,
        };
    });
}

export function exportQuoteToExcel(quote: Quote): void {
    const worksheet = XLSX.utils.json_to_sheet(excelRows(quote.products));
    const cols: XLSX.ColInfo[] = Array.from({ length: 14 }, () => ({ wch: 20 }));
    cols[0] = { hidden: true };
    worksheet['!cols'] = cols;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    fileSaver.saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${quote.client}-${quote.date}.xlsx`);
}

export const quoteJsonFileName = (quote: Quote) => `quote-${quote.number}-${quote.client.replace(/\s+/g, '-')}.json`;

export function downloadQuoteJson(quote: Quote): void {
    fileSaver.saveAs(new Blob([JSON.stringify(normalizeQuote(quote), null, 2)], { type: 'application/json' }), quoteJsonFileName(quote));
}

/** Legacy import validation: a single quote object with truthy id, client, number and date. */
export function isValidQuote(data: unknown): data is Quote {
    if (!data || typeof data !== 'object') return false;
    const q = data as Record<string, unknown>;
    return !!(q.id && q.client && q.number && q.date);
}
