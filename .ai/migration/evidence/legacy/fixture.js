// Sanitized fixture shared by legacy and target captures.
const IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==';
exports.IMG = IMG;
exports.providers = [
  { id: 1, name: 'PROMOS', discount: 0.4, wholesaleDiscount: [{ id: 0, amount: 1000, discount: 0.05 }, { id: 1, amount: 5000, discount: 0.1 }] },
  { id: 2, name: 'MPPROMO', discount: 0.3, wholesaleDiscount: [] },
];
exports.quote = {
  id: 'fixq01', client: 'Cliente Demo SAS', number: '120', date: '2025-09-15',
  products: [
    { id: 0, name: 'Mug cerámico', markType: '1 TINTA', provider: 'PROMOS', providerDiscount: 0.4, cost: 10000, quantity: 100, costOff: 0, markCost: 800, otherCost: 200, totalCost: 0, sellPrice: 0, totalValue: 0, profit: 70, image: { base64String: IMG, height: 117 }, discountGroup: 'A' },
    { id: 1, name: 'Bolígrafo', markType: 'LASER', provider: 'PROMOS', providerDiscount: 0.4, cost: 1500, quantity: 500, costOff: 0, markCost: 300, otherCost: 0, totalCost: 0, sellPrice: 0, totalValue: 0, profit: 65, image: { base64String: '', height: 0 }, discountGroup: 'A' },
    { id: 2, name: 'Libreta', markType: 'SERIGRAFIA', provider: 'MPPROMO', providerDiscount: 0.3, cost: 8000, quantity: 50, costOff: 0, markCost: 1000, otherCost: 500, totalCost: 0, sellPrice: 0, totalValue: 0, profit: 75, image: { base64String: '', height: 0 } },
  ],
};
exports.quote2 = { id: 'fixq02', client: 'Otra Empresa', number: '121', date: '2025-10-01', products: [{ id: 0, name: 'Gorra', markType: 'BORDADO', provider: '', providerDiscount: 0, cost: 0, quantity: 0, costOff: 0, markCost: 0, otherCost: 0, totalCost: 0, sellPrice: 0, totalValue: 0, profit: 0, image: { base64String: '', height: 0 } }] };
exports.seed = async (page, { providers, quotes }) => page.evaluate(async ({ providers, quotes }) => {
  localStorage.setItem('providers', JSON.stringify(providers));
  await new Promise((res, rej) => { const r = indexedDB.open('QuotesDB', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('quotes', { keyPath: 'id' });
    r.onsuccess = () => { const tx = r.result.transaction('quotes', 'readwrite'); quotes.forEach(q => tx.objectStore('quotes').put(q)); tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = rej; };
    r.onerror = rej; });
}, { providers, quotes });
