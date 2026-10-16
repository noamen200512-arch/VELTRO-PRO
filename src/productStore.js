const STORAGE_KEY = "veltro_products";

// Remove only exact records from the old demo seed.
const DEMO_PRODUCTS = [
  ["PRD-001", "Premium Coffee"], ["PRD-002", "Mineral Water"],
  ["PRD-003", "Chocolate Biscuits"], ["PRD-004", "Orange Juice"],
  ["PRD-005", "Potato Chips"], ["PRD-006", "Fresh Milk"],
  ["PRD-007", "Dark Chocolate"], ["PRD-008", "Apple Juice"],
  ["PRD-009", "Energy Drink"], ["PRD-010", "Biscuits Mini"],
  ["PRD-011", "Yogurt"], ["PRD-012", "Sparkling Water"],
];

function isDemoProduct(product) {
  return DEMO_PRODUCTS.some(([id, name]) =>
    String(product?.id ?? "") === id &&
    String(product?.name ?? "").trim().toLowerCase() === name.toLowerCase() &&
    !String(product?.barcode ?? "").trim() &&
    !(Array.isArray(product?.barcodeAliases) && product.barcodeAliases.some(Boolean))
  );
}

export function getProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    const clean = parsed.filter((product) => !isDemoProduct(product));
    if (clean.length !== parsed.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return clean;
  } catch {
    return [];
  }
}

export function saveProducts(products) {
  try {
    if (!Array.isArray(products)) return false;
    const clean = products.filter((product) => !isDemoProduct(product));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(saved) && saved.length === clean.length;
  } catch {
    return false;
  }
}

export function createProductId() {
  return `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
