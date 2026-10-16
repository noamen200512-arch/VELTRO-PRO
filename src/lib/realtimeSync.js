import { supabase } from "./supabase.js";
import { loadProductsFromCloud } from "./productCloud.js";
import { loadCustomersFromCloud } from "./customerCloud.js";
import { loadSuppliersFromCloud } from "./supplierCloud.js";
import { saveSaleToCloud } from "./salesCloud.js";
import { savePurchaseInvoiceToCloud } from "./purchaseCloud.js";
import { getProducts } from "../productStore.js";
import { getCompletedSales, getPendingInvoices } from "../sales/salesStore.js";
import { getPurchaseInvoices, getPurchaseSuppliers } from "../purchases/purchaseService.js";

const ORGANIZATION_TABLES = [
  "organizations",
  "branches",
  "profiles",
  "roles",
  "products",
  "customers",
  "suppliers",
  "sales_invoices",
  "sales_invoice_items",
  "purchase_invoices",
  "purchase_invoice_items",
  "stock_movements",
  "customer_payments",
  "supplier_payments",
  "cash_register_sessions",
  "cash_register_transactions",
  "pos_invoice_drafts",
];

const CACHE_KEYS = [
  "veltro_products",
  "veltro_customers",
  "veltro_purchase_suppliers",
  "veltro_completed_sales",
  "veltro_pending_invoices",
  "veltro_purchase_invoices",
];

let refreshTimer = null;
let refreshInFlight = false;
let refreshAgain = false;
const bootstrapPromises = new Map();
const bootstrapReadyOrganizations = new Set();

function readLocalArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/**
 * Preserve existing browser data when an organization first connects.
 * Legacy local records are copied only if the corresponding cloud table is empty.
 */
async function bootstrapLocalData(organizationId) {
  if (bootstrapPromises.has(organizationId)) return bootstrapPromises.get(organizationId);

  const task = (async () => {
    let safeToClearEmptyCaches = true;

    try {
      await loadProductsFromCloud(getProducts());
    } catch (error) {
      safeToClearEmptyCaches = false;
      console.warn("VELTRO-PRO product bootstrap deferred:", error?.message || error);
    }
    try {
      await loadCustomersFromCloud(readLocalArray("veltro_customers"));
    } catch (error) {
      safeToClearEmptyCaches = false;
      console.warn("VELTRO-PRO customer bootstrap deferred:", error?.message || error);
    }
    try {
      await loadSuppliersFromCloud(getPurchaseSuppliers());
    } catch (error) {
      safeToClearEmptyCaches = false;
      console.warn("VELTRO-PRO supplier bootstrap deferred:", error?.message || error);
    }

    const salesCount = await supabase
      .from("sales_invoices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if (salesCount.error) {
      safeToClearEmptyCaches = false;
      console.warn("VELTRO-PRO could not check existing cloud sales:", salesCount.error.message);
    } else if (salesCount.count === 0) {
      const localSales = getCompletedSales();
      const localPending = getPendingInvoices();
      for (const sale of localSales) {
        try {
          await saveSaleToCloud(sale, { status: "posted" });
        } catch (error) {
          safeToClearEmptyCaches = false;
          console.warn("VELTRO-PRO could not migrate a saved sale:", sale?.invoiceNumber, error?.message || error);
        }
      }
      for (const sale of localPending) {
        try {
          await saveSaleToCloud(sale, { status: "pending" });
        } catch (error) {
          safeToClearEmptyCaches = false;
          console.warn("VELTRO-PRO could not migrate a pending invoice:", sale?.invoiceNumber, error?.message || error);
        }
      }
    }

    const purchaseCount = await supabase
      .from("purchase_invoices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    if (purchaseCount.error) {
      safeToClearEmptyCaches = false;
      console.warn("VELTRO-PRO could not check existing cloud purchases:", purchaseCount.error.message);
    } else if (purchaseCount.count === 0) {
      const suppliers = getPurchaseSuppliers();
      for (const invoice of getPurchaseInvoices()) {
        try {
          await savePurchaseInvoiceToCloud(invoice, suppliers, { replaceItems: true });
        } catch (error) {
          safeToClearEmptyCaches = false;
          console.warn("VELTRO-PRO could not migrate a saved purchase:", invoice?.number, error?.message || error);
        }
      }
    }

    if (safeToClearEmptyCaches) bootstrapReadyOrganizations.add(organizationId);
    return safeToClearEmptyCaches;
  })().finally(() => bootstrapPromises.delete(organizationId));

  bootstrapPromises.set(organizationId, task);
  return task;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function productFromRow(row) {
  return {
    id: row.id,
    name: row.name || "",
    category: row.category || "General",
    sku: row.sku || row.id,
    barcode: row.barcode || "",
    barcodeAliases: Array.isArray(row.barcode_aliases) ? row.barcode_aliases : [],
    purchasePrice: number(row.purchase_price),
    price: number(row.price),
    cartonPrice: number(row.carton_price),
    wholesalePrice: number(row.wholesale_price),
    piecesPerCarton: number(row.pieces_per_carton) || 1,
    stock: number(row.stock),
    minStock: number(row.min_stock),
    unit: row.unit || "piece",
    image: row.image || "",
    expiryDate: row.expiry_date || "",
  };
}

function customerFromRow(row) {
  return {
    id: String(row.id),
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    reference: row.reference || String(row.id),
    code: row.reference || String(row.id),
    notes: row.notes || "",
    creditLimit: number(row.credit_limit),
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function supplierFromRow(row) {
  return {
    id: String(row.id),
    name: row.name || "",
    reference: row.reference || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    note: row.notes || "",
    notes: row.notes || "",
    isActive: row.is_active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function saleFromRow(row, items) {
  const invoiceItems = items.filter((item) => String(item.invoice_id) === String(row.id)).map((item) => ({
    id: item.id,
    productId: item.product_id || "",
    name: item.product_name || "",
    sku: item.sku || "",
    barcode: item.barcode || "",
    qty: number(item.quantity),
    quantity: number(item.quantity),
    price: number(item.unit_price),
    unitPrice: number(item.unit_price),
    cost: number(item.unit_cost),
    lineTotal: number(item.line_total),
    total: number(item.line_total),
  }));

  return {
    id: String(row.id),
    invoiceId: String(row.id),
    invoiceNumber: row.invoice_number || String(row.id),
    customerId: row.customer_id || "",
    customerName: row.customer_name || "Anonyme",
    employeeId: row.employee_id || "",
    status: row.status === "posted" ? "Completed" : row.status === "void" ? "Voided" : "Pending",
    subtotal: number(row.subtotal),
    discount: number(row.discount),
    total: number(row.total),
    paid: number(row.paid),
    remaining: number(row.remaining),
    note: row.note || "",
    createdAt: row.created_at,
    completedAt: row.posted_at || row.created_at,
    items: invoiceItems,
  };
}

function purchaseFromRow(row, items) {
  const lines = items.filter((item) => String(item.invoice_id) === String(row.id)).map((item) => ({
    lineId: item.id,
    productId: item.product_id || "",
    name: item.product_name || "",
    sku: item.sku || "",
    barcode: item.barcode || "",
    quantity: number(item.quantity),
    unitPrice: number(item.unit_cost),
    salePrice: number(item.unit_price),
    lineTotal: number(item.line_total),
  }));

  return {
    id: String(row.id),
    number: row.invoice_number || String(row.id),
    supplierId: row.supplier_id || "",
    supplier: row.supplier_name || "",
    date: row.created_at,
    closedAt: row.posted_at || row.created_at,
    updatedAt: row.updated_at,
    total: number(row.total),
    paid: number(row.paid),
    remaining: number(row.remaining),
    note: row.note || "",
    status: row.status === "posted" ? "Completed" : row.status,
    lines,
  };
}

function writeCache(key, value) {
  try {
    const serialized = JSON.stringify(value);
    if (localStorage.getItem(key) === serialized) return;
    localStorage.setItem(key, serialized);
    // Storage events normally only fire in other tabs. Dispatch one locally too
    // so mounted VELTRO-PRO modules can refresh their in-memory state.
    window.dispatchEvent(new StorageEvent("storage", {
      key,
      newValue: serialized,
      storageArea: localStorage,
    }));
  } catch (error) {
    console.warn("VELTRO-PRO could not refresh a local cloud cache:", key, error);
  }
}

export async function refreshOrganizationCache(organizationId) {
  if (!organizationId) return;
  if (refreshInFlight) {
    refreshAgain = true;
    return;
  }

  refreshInFlight = true;
  try {
    const [
      productsResult,
      customersResult,
      suppliersResult,
      salesResult,
      saleItemsResult,
      purchasesResult,
      purchaseItemsResult,
    ] = await Promise.all([
      supabase.from("products").select("*").eq("organization_id", organizationId).order("name"),
      supabase.from("customers").select("*").eq("organization_id", organizationId).order("name"),
      supabase.from("suppliers").select("*").eq("organization_id", organizationId).order("name"),
      supabase.from("sales_invoices").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
      supabase.from("sales_invoice_items").select("*").eq("organization_id", organizationId),
      supabase.from("purchase_invoices").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
      supabase.from("purchase_invoice_items").select("*").eq("organization_id", organizationId),
    ]);

    const results = [
      ["products", productsResult],
      ["customers", customersResult],
      ["suppliers", suppliersResult],
      ["sales invoices", salesResult],
      ["sales items", saleItemsResult],
      ["purchase invoices", purchasesResult],
      ["purchase items", purchaseItemsResult],
    ];
    for (const [label, result] of results) {
      if (result.error) console.warn(`VELTRO-PRO could not refresh ${label} (the current role may not have access):`, result.error.message);
    }

    const cacheIsEmpty = (key) => {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return !Array.isArray(value) || value.length === 0;
      } catch {
        return true;
      }
    };
    const shouldReplace = (key, result) => !result.error && (
      (Array.isArray(result.data) && result.data.length > 0) ||
      cacheIsEmpty(key) ||
      bootstrapReadyOrganizations.has(organizationId)
    );

    if (shouldReplace("veltro_products", productsResult)) {
      writeCache("veltro_products", (productsResult.data || []).map(productFromRow));
    }
    if (shouldReplace("veltro_customers", customersResult)) {
      writeCache("veltro_customers", (customersResult.data || []).map(customerFromRow));
    }
    if (shouldReplace("veltro_purchase_suppliers", suppliersResult)) {
      writeCache("veltro_purchase_suppliers", (suppliersResult.data || []).map(supplierFromRow));
    }

    if (!salesResult.error && !saleItemsResult.error && shouldReplace("veltro_completed_sales", salesResult)) {
      const saleRows = salesResult.data || [];
      const completedSales = saleRows.filter((row) => row.status === "posted").map((row) => saleFromRow(row, saleItemsResult.data || []));
      const pendingSales = saleRows.filter((row) => row.status === "pending").map((row) => saleFromRow(row, saleItemsResult.data || []));
      writeCache("veltro_completed_sales", completedSales);
      writeCache("veltro_pending_invoices", pendingSales);
    }

    if (!purchasesResult.error && !purchaseItemsResult.error && shouldReplace("veltro_purchase_invoices", purchasesResult)) {
      writeCache("veltro_purchase_invoices", (purchasesResult.data || []).map((row) => purchaseFromRow(row, purchaseItemsResult.data || [])));
    }

    window.dispatchEvent(new CustomEvent("veltro:cloud-sync", {
      detail: { organizationId, refreshedAt: new Date().toISOString() },
    }));
  } catch (error) {
    console.error("VELTRO-PRO real-time cache refresh failed:", error);
    window.dispatchEvent(new CustomEvent("veltro:cloud-sync-error", {
      detail: { organizationId, message: error?.message || "Cloud refresh failed." },
    }));
  } finally {
    refreshInFlight = false;
    if (refreshAgain) {
      refreshAgain = false;
      void refreshOrganizationCache(organizationId);
    }
  }
}

export function startOrganizationRealtimeSync({ organizationId, userId }) {
  if (!organizationId || !userId) return () => {};

  let stopped = false;
  const channel = supabase.channel(`veltro-org-sync-${organizationId}-${userId}`);

  for (const table of ORGANIZATION_TABLES) {
    channel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table,
      filter: `organization_id=eq.${organizationId}`,
    }, (payload) => {
      window.dispatchEvent(new CustomEvent("veltro:cloud-change", {
        detail: {
          organizationId,
          table,
          eventType: payload.eventType,
          newRecord: payload.new || null,
          oldRecord: payload.old || null,
        },
      }));

      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        if (!stopped) void refreshOrganizationCache(organizationId);
      }, 120);
    });
  }

  channel.subscribe((status) => {
    if (stopped) return;
    window.dispatchEvent(new CustomEvent("veltro:realtime-status", {
      detail: { organizationId, status },
    }));
    if (status === "SUBSCRIBED") {
      void bootstrapLocalData(organizationId).finally(() => refreshOrganizationCache(organizationId));
    }
  });

  return () => {
    stopped = true;
    if (refreshTimer) window.clearTimeout(refreshTimer);
    void supabase.removeChannel(channel);
  };
}
