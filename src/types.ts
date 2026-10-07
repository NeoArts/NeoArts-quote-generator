// Data shapes are stored as-is in IndexedDB/localStorage and in exported JSON,
// so field names and types must stay identical to the legacy app.
// Numeric fields edited in the table are stored as strings (legacy behavior).

export type DocImage = {
    /** Data URL while editing (or a signed URL in the cloud list view). */
    base64String: string;
    height: number;
    /** Cloud mode: storage path of the uploaded file. */
    path?: string;
    /** Cloud mode: small preview (≈160 px) used by lists and suggestions. */
    thumbPath?: string;
};

export type Product = {
    id: number;
    name: string;
    markType: string;
    provider: string;
    providerDiscount: number;
    cost: number;
    quantity: number;
    costOff: number;
    markCost: number;
    otherCost: number;
    totalCost: number;
    sellPrice: number;
    totalValue: number;
    profit: number;
    image: DocImage;
    discountGroup?: string;
};

/** Editable letter fields of the PDF. Defaults reproduce the legacy text exactly. */
export type PdfOptions = {
    city: string;
    clientCity: string;
    iva: string;
    validity: string;
    payment: string;
    production: string;
    delivery: string;
    /** false = generation day (legacy behavior), true = quote date. */
    useQuoteDate: boolean;
};

export const defaultPdfOptions: PdfOptions = {
    city: 'Bogotá D.C.',
    clientCity: 'Bogotá',
    iva: '19%',
    validity: '3 días',
    payment: 'A convenir',
    production: 'A convenir',
    delivery: 'A convenir',
    useQuoteDate: false,
};

/** Provider discount terms frozen into a quote so later provider edits never change it silently. */
export type ProviderTerms = Pick<Provider, 'discount' | 'wholesaleDiscount'>;

export type Quote = {
    id: string;
    client: string;
    number: string;
    date: string;
    products: Product[];
    /** Optional fields added by this app; legacy quotes simply lack them. */
    providerTerms?: Record<string, ProviderTerms>;
    /** Provider changes the user chose to ignore, keyed by provider name -> signature of the ignored terms. */
    ignoredProviderChanges?: Record<string, string>;
    pdfOptions?: Partial<PdfOptions>;
};

export type Discount = {
    id?: number;
    amount: number;
    discount: number;
};

export type Provider = {
    id: number;
    name: string;
    discount: number;
    wholesaleDiscount: Discount[];
};

export type Cell = {
    text: string;
    width: number;
};

export const emptyProduct: Product = {
    id: 0,
    name: '',
    markCost: 0,
    markType: '',
    provider: '',
    providerDiscount: 0,
    cost: 0,
    quantity: 0,
    costOff: 0,
    otherCost: 0,
    sellPrice: 0,
    totalCost: 0,
    totalValue: 0,
    profit: 0,
    image: { base64String: '', height: 0 },
};
