
import { getProducts, saveProducts } from "../productStore.js";

export const INVOICES_KEY = "veltro_purchase_invoices";
export const SUPPLIERS_KEY = "veltro_purchase_suppliers";

/**
 * Read an array from localStorage safely.
 */
export function readPurchaseStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save an array to localStorage safely.
 */
export function savePurchaseStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load purchase invoices.
 */
export function getPurchaseInvoices() {
  return readPurchaseStorage(INVOICES_KEY);
}

/**
 * Load suppliers saved by the purchases module.
 */
export function getPurchaseSuppliers() {
  return readPurchaseStorage(SUPPLIERS_KEY);
}

/**
 * Save purchase invoices.
 */
export function savePurchaseInvoices(invoices) {
  return savePurchaseStorage(INVOICES_KEY, invoices);
}

/**
 * Save purchase suppliers.
 */
export function savePurchaseSuppliers(suppliers) {
  return savePurchaseStorage(SUPPLIERS_KEY, suppliers);
}

/**
 * Add purchased quantities to stock and update purchase/sale prices.
 *
 * This function must only be called when confirming a NEW invoice.
 * Do not call it when editing an existing invoice.
 */
export function applyPurchaseStock(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return {
      success: false,
      message: "No products found in the purchase invoice.",
    };
  }

  let currentProducts;

  try {
    currentProducts = getProducts();

    if (!Array.isArray(currentProducts)) {
      return {
        success: false,
        message: "Could not load the product database.",
      };
    }
  } catch {
    return {
      success: false,
      message: "Could not load the product database.",
    };
  }

  const quantitiesByProduct = new Map();

  for (const line of lines) {
    if (!line?.productId) {
      return {
        success: false,
        message: "A purchase line is missing its product ID.",
      };
    }

    const quantity = Number(line.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return {
        success: false,
        message: "A product quantity is invalid.",
      };
    }

    const current = quantitiesByProduct.get(line.productId) || {
      quantity: 0,
      latestLine: line,
    };

    quantitiesByProduct.set(line.productId, {
      quantity: current.quantity + quantity,
      latestLine: line,
    });
  }

  const productIds = new Set(
    currentProducts.map((product) => product.id)
  );

  for (const productId of quantitiesByProduct.keys()) {
    if (!productIds.has(productId)) {
      return {
        success: false,
        message: `Product ${productId} no longer exists in the database.`,
      };
    }
  }

  const updatedProducts = currentProducts.map((product) => {
    const purchase = quantitiesByProduct.get(product.id);

    if (!purchase) return product;

    const line = purchase.latestLine;

    return {
      ...product,
      stock: Number(product.stock || 0) + purchase.quantity,
      purchasePrice:
        Number(line.unitPrice) > 0
          ? Number(line.unitPrice)
          : Number(product.purchasePrice || 0),
      price:
        Number(line.salePrice) > 0
          ? Number(line.salePrice)
          : Number(product.price || 0),
      wholesalePrice:
        Number(line.wholesalePrice) > 0
          ? Number(line.wholesalePrice)
          : Number(product.wholesalePrice || 0),
      cartonPrice:
        Number(line.productCartonPrice) > 0
          ? Number(line.productCartonPrice)
          : Number(product.cartonPrice || 0),
    };
  });

  try {
    const saved = saveProducts(updatedProducts);

    if (!saved) {
      return {
        success: false,
        message: "Could not save the updated product stock.",
      };
    }

    return {
      success: true,
      products: updatedProducts,
    };
  } catch {
    return {
      success: false,
      message: "An error occurred while updating product stock.",
    };
  }
}

/**
 * Calculate the payment status of an invoice.
 */
export function getPurchasePaymentStatus(total, paid) {
  const invoiceTotal = Math.max(0, Number(total) || 0);
  const amountPaid = Math.max(0, Number(paid) || 0);
  const remaining = Math.max(0, invoiceTotal - amountPaid);

  return {
    total: invoiceTotal,
    paid: amountPaid,
    remaining,
    status:
      remaining <= 0
        ? "Paid"
        : amountPaid > 0
        ? "Partially paid"
        : "Unpaid",
  };
}
