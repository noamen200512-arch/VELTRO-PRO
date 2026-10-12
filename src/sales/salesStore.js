import { getProducts, saveProducts } from "../productStore.js";

const PENDING_KEY = "veltro_pending_invoices";
const SALES_KEY = "veltro_completed_sales";
const COUNTER_KEY = "veltro_invoice_counter";

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
    customerName: "",
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
  return getCompletedSales().find(
    (sale) =>
      sale.id === invoiceId ||
      sale.invoiceId === invoiceId ||
      sale.invoiceNumber === invoiceId
  ) ?? null;
}

/**
 * Sum quantities reserved by pending invoices.
 * Pass excludeInvoiceId when checking the invoice currently being edited.
 */
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

/**
 * Save or update a pending invoice.
 * The invoice reserves stock, but does not change product.stock.
 */
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

  for (const [productId, quantity] of quantities) {
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

    const available = getAvailableStock(productId, invoice.id);

    if (quantity > available) {
      return {
        ok: false,
        error: "INSUFFICIENT_STOCK",
        productId,
        productName: product.name,
        requested: quantity,
        available,
      };
    }
  }

  const now = new Date().toISOString();

  const savedInvoice = {
    ...invoice,
    status: "Pending",
    updatedAt: now,
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
  return getPendingInvoices().find(
    (invoice) => invoice.id === invoiceId
  ) ?? null;
}

/**
 * Remove a pending invoice and release its reservation.
 * Product stock remains unchanged.
 */
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

/**
 * Complete a sale exactly once in this browser's local storage.
 * Validates stock, decreases product.stock, removes the pending
 * reservation, and records the completed sale.
 */
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

  for (const [productId, quantity] of quantities) {
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

    const stock = Math.max(0, Number(product.stock) || 0);
    const reservedByOthers = getReservedQuantity(productId, invoice.id);
    const availableForThisSale = stock - reservedByOthers;

    if (quantity > availableForThisSale) {
      return {
        ok: false,
        error: "INSUFFICIENT_STOCK",
        productId,
        productName: product.name,
        requested: quantity,
        available: Math.max(0, availableForThisSale),
      };
    }
  }

  const updatedProducts = products.map((product) => {
    const quantity = quantities.get(String(product.id)) || 0;

    if (quantity <= 0) return product;

    return {
      ...product,
      stock: Math.max(0, (Number(product.stock) || 0) - quantity),
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

  /*
   * Save the reduced stock first. If that fails, do not record a sale.
   * This is a browser-local workflow, not a multi-device transaction.
   */
  if (!saveProducts(updatedProducts)) {
    return { ok: false, error: "STOCK_SAVE_FAILED" };
  }

  const nextPending = pending.filter(
    (item) => item.id !== invoice.id
  );

  if (!writeArray(PENDING_KEY, nextPending)) {
    /*
     * Best-effort rollback if pending storage cannot be updated.
     */
    saveProducts(products);
    return { ok: false, error: "PENDING_SAVE_FAILED" };
  }

  if (!writeArray(SALES_KEY, [...sales, sale])) {
    /*
     * Best-effort rollback if the completed sale cannot be recorded.
     */
    saveProducts(products);
    writeArray(PENDING_KEY, pending);
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
