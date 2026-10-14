function toNumber(value) {
if (value === "" || value === null || value === undefined) {
return NaN;
}

return Number(value);
}

export function validateProduct(product, products = [], editingId = null) {
const errors = {};

const name = String(product?.name ?? "").trim();
const barcode = String(product?.barcode ?? "").trim();
const sku = String(product?.sku ?? "").trim();

if (!name) {
errors.name = "Product name is required.";
}

const priceFields = [
["purchasePrice", "Purchase price"],
["price", "Retail selling price"],
["wholesalePrice", "Wholesale price"],
["cartonPrice", "Carton price"],
];

for (const [field, label] of priceFields) {
const rawValue = product?.[field];

if (rawValue === "" || rawValue === null || rawValue === undefined) {
  continue;
}

const value = toNumber(rawValue);

if (!Number.isFinite(value) || value < 0) {
  errors[field] = `${label} must be a valid non-negative number.`;
}

}

const quantityFields = [
["stock", "Stock"],
["minStock", "Minimum stock"],
["piecesPerCarton", "Pieces per carton"],
];

for (const [field, label] of quantityFields) {
const rawValue = product?.[field];

if (
  field === "piecesPerCarton" &&
  (rawValue === "" || rawValue === null || rawValue === undefined)
) {
  continue;
}

if (
  field !== "piecesPerCarton" &&
  (rawValue === "" || rawValue === null || rawValue === undefined)
) {
  continue;
}

const value = toNumber(rawValue);

if (
  !Number.isInteger(value) ||
  value < (field === "piecesPerCarton" ? 1 : 0)
) {
  errors[field] = `${label} must be a valid whole number.`;
}

}

const profitFields = [
["retailProfit", "Retail profit"],
["wholesaleProfit", "Wholesale profit"],
["cartonProfit", "Carton profit"],
];

for (const [field, label] of profitFields) {
const rawValue = product?.[field];

if (rawValue === "" || rawValue === null || rawValue === undefined) {
  continue;
}

const value = toNumber(rawValue);

if (!Number.isFinite(value)) {
  errors[field] = `${label} must be a valid number.`;
}

}

const aliases = Array.isArray(product?.barcodeAliases)
? product.barcodeAliases
: [];

const barcodes = [barcode, ...aliases]
.map((value) => String(value ?? "").trim())
.filter(Boolean);

if (new Set(barcodes).size !== barcodes.length) {
errors.barcodeAliases = "A product cannot contain duplicate barcodes.";
}

const duplicateBarcode = products.some((existing) => {
if (String(existing?.id) === String(editingId)) return false;

const existingCodes = [
  existing?.barcode,
  ...(Array.isArray(existing?.barcodeAliases)
    ? existing.barcodeAliases
    : []),
]
  .map((value) => String(value ?? "").trim())
  .filter(Boolean);

return barcodes.some((code) => existingCodes.includes(code));

});

if (duplicateBarcode) {
errors.barcode = "This barcode is already assigned to another product.";
}

if (sku) {
const duplicateSku = products.some(
(existing) =>
String(existing?.id) !== String(editingId) &&
String(existing?.sku ?? "").trim().toLowerCase() ===
sku.toLowerCase()
);

if (duplicateSku) {
  errors.sku = "This product reference is already in use.";
}

}

return {
valid: Object.keys(errors).length === 0,
errors,
};
}

export function getFirstValidationError(errors = {}) {
return Object.values(errors).find(Boolean) || "";
}