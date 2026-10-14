export function formatMoney(value) {
const amount = Number(value ?? 0);

return "${(Number.isFinite(amount) ? amount : 0).toLocaleString( "fr-FR" )} DA";
}

export function formatNumber(value) {
const number = Number(value ?? 0);

return (Number.isFinite(number) ? number : 0).toLocaleString(
"fr-FR"
);
}

export function formatPercent(value) {
const number = Number(value ?? 0);

return "${(Number.isFinite(number) ? number : 0).toLocaleString( "fr-FR", { maximumFractionDigits: 2, } )}%";
}

export function toNumber(value, fallback = 0) {
if (value === "" || value === null || value === undefined) {
return fallback;
}

const number = Number(value);

return Number.isFinite(number) ? number : fallback;
}

export function calculateProfit(purchasePrice, sellingPrice) {
return toNumber(sellingPrice) - toNumber(purchasePrice);
}

export function calculateProfitPercent(purchasePrice, sellingPrice) {
const purchase = toNumber(purchasePrice);
const selling = toNumber(sellingPrice);

if (purchase <= 0) return 0;

return ((selling - purchase) / purchase) * 100;
}

export function isLowStock(stock, minStock) {
return toNumber(stock) <= toNumber(minStock);
}