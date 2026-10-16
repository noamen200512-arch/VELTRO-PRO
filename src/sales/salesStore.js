
import { getProducts, saveProducts } from "../productStore.js";

const PENDING_KEY = "veltro_pending_invoices";
const SALES_KEY = "veltro_completed_sales";
const COUNTER_KEY = "veltro_invoice_counter";

/**
 * Recover the last unconfirmed POS invoice after a refresh, tab close, or
 * browser restart. This is separate from pending invoices so autosaving does
 * not reserve inventory or create duplicate entries in the pending list.
 */
const AUTOSAVED_DRAFT_KEY = "veltro_pos_autosaved_draft";

export function getAutoSavedDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(AUTOSAVED_DRAFT_KEY) || "null");
    if (!draft || typeof draft !== "object" || !draft.id || !Array.isArray(draft.items)) {
      return null;
    }
    return { ...draft, status: "Draft" };
  } catch {
    return null;
  }
}

export function saveAutoSavedDraft(invoice) {
  if (!invoice?.id || !Array.isArray(invoice.items)) return false;
  try {
    localStorage.setItem(
      AUTOSAVED_DRAFT_KEY,
      JSON.stringify({ ...invoice, status: "Draft", updatedAt: new Date().toISOString() })
    );
    return true;
  } catch (error) {
    console.warn("VELTRO-PRO could not autosave the current invoice:", error);
    return false;
  }
}

export function clearAutoSavedDraft() {
  try {
    localStorage.removeItem(AUTOSAVED_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeArray(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function createId(prefix = "INV") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function getItemProductId(item) {
  return String(item.productId ?? item.id ?? "");
}

function getItemQuantity(item) {
  return normalizeQuantity(item.qty ?? item.quantity);
}

function getInvoiceQuantities(invoice) {
  const quantities = new Map();

  for (const item of invoice?.items ?? []) {
    const productId = getItemProductId(item);
    const quantity = getItemQuantity(item);

    if (!productId || quantity <= 0) continue;

    quantities.set(
      productId,
      (quantities.get(productId) || 0) + quantity
    );
  }

  return quantities;
}

function findSaleIndex(sales, invoiceId) {
  return sales.findIndex(
    (sale) =>
      sale.id === invoiceId ||
      sale.invoiceId === invoiceId ||
      sale.invoiceNumber === invoiceId
  );
}

export function createInvoiceNumber() {
  let counter = 1;

  try {
    counter = Number(localStorage.getItem(COUNTER_KEY)) || 1;
    localStorage.setItem(COUNTER_KEY, String(counter + 1));
  } catch {
    counter = Date.now();
  }

  return `INV-${String(counter).padStart(6, "0")}`;
}

export function createInvoice() {
  const now = new Date();

  return {
    id: createId(),
    invoiceNumber: createInvoiceNumber(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: "Draft",
    customerId: "",
    customerName: "Anonyme",
    items: [],
    discount: 0,
    paid: 0,
    note: "",
  };
}

export function getPendingInvoices() {
  return readArray(PENDING_KEY).sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
}

export function getCompletedSales() {
  return readArray(SALES_KEY);
}

export function getCompletedSale(invoiceId) {
  return (
    getCompletedSales().find(
      (sale) =>
        sale.id === invoiceId ||
        sale.invoiceId === invoiceId ||
        sale.invoiceNumber === invoiceId
    ) ?? null
  );
}

export function getReservedQuantity(productId, excludeInvoiceId = "") {
  let reserved = 0;

  for (const invoice of getPendingInvoices()) {
    if (invoice.id === excludeInvoiceId) continue;

    for (const item of invoice.items ?? []) {
      if (getItemProductId(item) === String(productId)) {
        reserved += getItemQuantity(item);
      }
    }
  }

  return reserved;
}

export function getAvailableStock(productId, excludeInvoiceId = "") {
  const product = getProducts().find(
    (item) => String(item.id) === String(productId)
  );

  if (!product) return 0;

  const stock = Math.max(0, Number(product.stock) || 0);
  const reserved = getReservedQuantity(productId, excludeInvoiceId);

  return Math.max(0, stock - reserved);
}

export function savePendingInvoice(invoice) {
  if (!invoice?.id) {
    return { ok: false, error: "INVALID_INVOICE" };
  }

  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    return { ok: false, error: "EMPTY_INVOICE" };
  }

  const pending = getPendingInvoices();
  const existingIndex = pending.findIndex(
    (item) => item.id === invoice.id
  );

  const quantities = getInvoiceQuantities(invoice);
  const products = getProducts();

  for (const [productId] of quantities) {
    const product = products.find(
      (item) => String(item.id) === productId
    );

    if (!product) {
      return {
        ok: false,
        error: "PRODUCT_NOT_FOUND",
        productId,
      };
    }

    // Pending invoices may reserve quantities beyond current stock. The POS
    // requires explicit confirmation before allowing this at entry time.
  }

  const savedInvoice = {
    ...invoice,
    status: "Pending",
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    pending[existingIndex] = savedInvoice;
  } else {
    pending.push(savedInvoice);
  }

  if (!writeArray(PENDING_KEY, pending)) {
    return { ok: false, error: "STORAGE_ERROR" };
  }

  return { ok: true, invoice: savedInvoice };
}

export function getPendingInvoice(invoiceId) {
  return (
    getPendingInvoices().find(
      (invoice) => invoice.id === invoiceId
    ) ?? null
  );
}

export function cancelPendingInvoice(invoiceId) {
  const pending = getPendingInvoices();
  const next = pending.filter((invoice) => invoice.id !== invoiceId);

  if (next.length === pending.length) {
    return { ok: false, error: "INVOICE_NOT_FOUND" };
  }

  if (!writeArray(PENDING_KEY, next)) {
    return { ok: false, error: "STORAGE_ERROR" };
  }

  return { ok: true };
}

export function completeSale(invoice) {
  if (!invoice?.id) {
    return { ok: false, error: "INVALID_INVOICE" };
  }

  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    return { ok: false, error: "EMPTY_INVOICE" };
  }

  const sales = getCompletedSales();

  const alreadyCompleted = sales.find(
    (sale) =>
      sale.id === invoice.id ||
      sale.invoiceId === invoice.id ||
      sale.invoiceNumber === invoice.invoiceNumber
  );

  if (alreadyCompleted) {
    return {
      ok: false,
      error: "ALREADY_COMPLETED",
      sale: alreadyCompleted,
    };
  }

  const pending = getPendingInvoices();
  const quantities = getInvoiceQuantities(invoice);
  const products = getProducts();

  for (const [productId] of quantities) {
    const product = products.find(
      (item) => String(item.id) === productId
    );

    if (!product) {
      return {
        ok: false,
        error: "PRODUCT_NOT_FOUND",
        productId,
      };
    }

    // Confirmed POS sales may exceed available stock; the resulting balance
    // is allowed to become negative and remains visible in inventory reports.
  }

  const updatedProducts = products.map((product) => {
    const quantity = quantities.get(String(product.id)) || 0;

    if (quantity <= 0) return product;

    return {
      ...product,
      stock: (Number(product.stock) || 0) - quantity,
    };
  });

  const now = new Date().toISOString();

  const sale = {
    ...invoice,
    invoiceId: invoice.id,
    status: "Completed",
    completedAt: now,
    items: invoice.items.map((item) => ({ ...item })),
  };

  if (!saveProducts(updatedProducts)) {
    return { ok: false, error: "STOCK_SAVE_FAILED" };
  }

  const nextPending = pending.filter(
    (item) => item.id !== invoice.id
  );

  if (!writeArray(PENDING_KEY, nextPending)) {
    saveProducts(products);
    return { ok: false, error: "PENDING_SAVE_FAILED" };
  }

  if (!writeArray(SALES_KEY, [...sales, sale])) {
    saveProducts(products);
    writeArray(PENDING_KEY, pending);
    return { ok: false, error: "SALE_SAVE_FAILED" };
  }

  return { ok: true, sale };
}

/**
 * Edit a completed sale without applying the stock change twice.
 * Restores the old quantities, then deducts the new quantities.
 */
export function editCompletedSale(invoiceId, updatedInvoice) {
  if (!invoiceId || !updatedInvoice) {
    return { ok: false, error: "INVALID_INVOICE" };
  }

  if (
    !Array.isArray(updatedInvoice.items) ||
    updatedInvoice.items.length === 0
  ) {
    return { ok: false, error: "EMPTY_INVOICE" };
  }

  const sales = getCompletedSales();
  const saleIndex = findSaleIndex(sales, invoiceId);

  if (saleIndex < 0) {
    return { ok: false, error: "INVOICE_NOT_FOUND" };
  }

  const previousSale = sales[saleIndex];

  // Keep the original identity; editing must not create another sale.
  const stableId = previousSale.id || previousSale.invoiceId;
  const oldQuantities = getInvoiceQuantities(previousSale);
  const newQuantities = getInvoiceQuantities(updatedInvoice);
  const products = getProducts();

  const affectedIds = new Set([
    ...oldQuantities.keys(),
    ...newQuantities.keys(),
  ]);

  const updatedProducts = products.map((product) => {
    const productId = String(product.id);

    if (!affectedIds.has(productId)) return product;

    const oldQuantity = oldQuantities.get(productId) || 0;
    const newQuantity = newQuantities.get(productId) || 0;
    const currentStock = Math.max(0, Number(product.stock) || 0);

    // Restore the original sale quantity, then apply the edited quantity.
    const nextStock = currentStock + oldQuantity - newQuantity;

    if (nextStock < 0) {
      return {
        ...product,
        __veltroStockError: true,
        __veltroRequested: newQuantity,
        __veltroAvailable: currentStock + oldQuantity,
      };
    }

    return {
      ...product,
      stock: nextStock,
    };
  });

  const stockErrorProduct = updatedProducts.find(
    (product) => product.__veltroStockError
  );

  if (stockErrorProduct) {
    const result = {
      ok: false,
      error: "INSUFFICIENT_STOCK",
      productId: String(stockErrorProduct.id),
      productName: stockErrorProduct.name,
      requested: stockErrorProduct.__veltroRequested,
      available: stockErrorProduct.__veltroAvailable,
    };

    return result;
  }

  // Only products in the edited invoice must still exist.
  // A product that was sold in the past may since have been deleted from
  // inventory; that historical reference should not block editing the sale.
  // Existing products still get their old quantity restored and new quantity
  // deducted below, while a missing product kept in the edited invoice is
  // rejected here.
  for (const productId of newQuantities.keys()) {
    if (!products.some((product) => String(product.id) === productId)) {
      return {
        ok: false,
        error: "PRODUCT_NOT_FOUND",
        productId,
      };
    }
  }

  const now = new Date().toISOString();

  const updatedSale = {
    ...previousSale,
    ...updatedInvoice,
    id: stableId,
    invoiceId: previousSale.invoiceId || stableId,
    invoiceNumber: previousSale.invoiceNumber,
    status: "Completed",
    createdAt: previousSale.createdAt,
    completedAt: previousSale.completedAt || previousSale.createdAt,
    updatedAt: now,
    editedAt: now,
    items: updatedInvoice.items.map((item) => ({ ...item })),
  };

  // Remove internal validation markers before saving.
  const cleanProducts = updatedProducts.map((product) => {
    const {
      __veltroStockError,
      __veltroRequested,
      __veltroAvailable,
      ...cleanProduct
    } = product;

    return cleanProduct;
  });

  if (!saveProducts(cleanProducts)) {
    return { ok: false, error: "STOCK_SAVE_FAILED" };
  }

  const nextSales = [...sales];
  nextSales[saleIndex] = updatedSale;

  if (!writeArray(SALES_KEY, nextSales)) {
    // Best-effort rollback to the inventory state before this edit.
    saveProducts(products);
    return { ok: false, error: "SALE_SAVE_FAILED" };
  }

  return { ok: true, sale: updatedSale };
}

/**
 * Delete a completed sale and restore its sold quantities to current stock.
 * Customer debt is derived from completed sales, so removing the sale also
 * removes its contribution to the calculated balance.
 */
export function deleteCompletedSale(invoiceId) {
  if (!invoiceId) return { ok: false, error: "INVALID_INVOICE" };

  const sales = getCompletedSales();
  const saleIndex = findSaleIndex(sales, invoiceId);

  if (saleIndex < 0) return { ok: false, error: "INVOICE_NOT_FOUND" };

  const sale = sales[saleIndex];
  const products = getProducts();
  const quantities = getInvoiceQuantities(sale);

  const restoredProducts = products.map((product) => {
    const quantity = quantities.get(String(product.id)) || 0;
    if (quantity <= 0) return product;

    return {
      ...product,
      stock: Math.max(0, Number(product.stock) || 0) + quantity,
    };
  });

  if (!saveProducts(restoredProducts)) {
    return { ok: false, error: "STOCK_SAVE_FAILED" };
  }

  const nextSales = sales.filter((_, index) => index !== saleIndex);

  if (!writeArray(SALES_KEY, nextSales)) {
    saveProducts(products);
    return { ok: false, error: "SALE_SAVE_FAILED" };
  }

  return { ok: true, sale };
}

export function getSalesForCustomer(customerId) {
  if (!customerId) return [];

  return getCompletedSales().filter(
    (sale) => String(sale.customerId || "") === String(customerId)
  );
}

export function getCustomerDebt(customerId) {
  return getSalesForCustomer(customerId).reduce((total, sale) => {
    const invoiceTotal = Math.max(0, Number(sale.total) || 0);
    const paid = Math.max(0, Number(sale.paid) || 0);

    return total + Math.max(0, invoiceTotal - paid);
  }, 0);
}


/**
 * Update only the payment/accounting fields of a completed invoice.
 * Inventory is intentionally untouched because the sold items did not change.
 */
export function updateCompletedSalePayment(invoiceId, paidAmount) {
  if (!invoiceId) return { ok: false, error: "INVALID_INVOICE" };

  const paid = Number(paidAmount);
  if (!Number.isFinite(paid) || paid < 0) {
    return { ok: false, error: "INVALID_PAID_AMOUNT" };
  }

  const sales = getCompletedSales();
  const saleIndex = findSaleIndex(sales, invoiceId);
  if (saleIndex < 0) return { ok: false, error: "INVOICE_NOT_FOUND" };

  const sale = sales[saleIndex];
  const total = Math.max(0, Number(sale.total) || 0);
  if (paid > total) return { ok: false, error: "PAID_EXCEEDS_TOTAL" };

  const updatedSale = {
    ...sale,
    paid,
    remaining: Math.max(0, total - paid),
    updatedAt: new Date().toISOString(),
    accountUpdatedAt: new Date().toISOString(),
  };

  const nextSales = [...sales];
  nextSales[saleIndex] = updatedSale;
  if (!writeArray(SALES_KEY, nextSales)) {
    return { ok: false, error: "SALE_SAVE_FAILED" };
  }

  return { ok: true, sale: updatedSale };
}

