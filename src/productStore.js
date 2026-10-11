
const STORAGE_KEY = "veltro_products";

export const INITIAL_PRODUCTS = [
  { id: "PRD-001", name: "Premium Coffee", category: "Beverages", sku: "PRD-001", barcode: "", purchasePrice: 300, price: 450, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 24, minStock: 5, unit: "piece" },
  { id: "PRD-002", name: "Mineral Water", category: "Drinks", sku: "PRD-002", barcode: "", purchasePrice: 50, price: 80, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 120, minStock: 20, unit: "piece" },
  { id: "PRD-003", name: "Chocolate Biscuits", category: "Snacks", sku: "PRD-003", barcode: "", purchasePrice: 80, price: 120, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 45, minStock: 10, unit: "piece" },
  { id: "PRD-004", name: "Orange Juice", category: "Beverages", sku: "PRD-004", barcode: "", purchasePrice: 120, price: 180, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 32, minStock: 8, unit: "piece" },
  { id: "PRD-005", name: "Potato Chips", category: "Snacks", sku: "PRD-005", barcode: "", purchasePrice: 65, price: 100, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 38, minStock: 8, unit: "piece" },
  { id: "PRD-006", name: "Fresh Milk", category: "Dairy", sku: "PRD-006", barcode: "", purchasePrice: 100, price: 140, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 20, minStock: 5, unit: "piece" },
  { id: "PRD-007", name: "Dark Chocolate", category: "Snacks", sku: "PRD-007", barcode: "", purchasePrice: 180, price: 250, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 17, minStock: 5, unit: "piece" },
  { id: "PRD-008", name: "Apple Juice", category: "Beverages", sku: "PRD-008", barcode: "", purchasePrice: 110, price: 160, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 28, minStock: 6, unit: "piece" },
  { id: "PRD-009", name: "Energy Drink", category: "Drinks", sku: "PRD-009", barcode: "", purchasePrice: 150, price: 220, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 36, minStock: 8, unit: "piece" },
  { id: "PRD-010", name: "Biscuits Mini", category: "Snacks", sku: "PRD-010", barcode: "", purchasePrice: 30, price: 50, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 80, minStock: 15, unit: "piece" },
  { id: "PRD-011", name: "Yogurt", category: "Dairy", sku: "PRD-011", barcode: "", purchasePrice: 60, price: 90, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 26, minStock: 6, unit: "piece" },
  { id: "PRD-012", name: "Sparkling Water", category: "Drinks", sku: "PRD-012", barcode: "", purchasePrice: 75, price: 110, cartonPrice: 0, wholesalePrice: 0, piecesPerCarton: 1, stock: 42, minStock: 10, unit: "piece" },
];

export function getProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }

    saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  } catch {
    return [];
  }
}

export function saveProducts(products) {
  try {
    if (!Array.isArray(products)) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    // Verify that the data was actually saved.
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    return (
      Array.isArray(saved) &&
      saved.length === products.length
    );
  } catch {
    return false;
  }
}

export function createProductId() {
  return `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
