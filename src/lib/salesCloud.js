import { supabase } from "./supabase.js";

async function getAccount() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in first.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("user_id", data.user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile?.organization_id) throw new Error("No organization is linked to this account.");

  return { userId: data.user.id, organizationId: profile.organization_id };
}

function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function stableLineId(invoiceId, item, index) {
  const input = `${invoiceId}:${item.id || item.lineId || item.productId || index}:${index}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  const hex = (value) => (value >>> 0).toString(16).padStart(8, "0");
  const raw = (hex(hash) + hex(hash ^ 0x9e3779b9) + hex(Math.imul(hash, 31)) + hex(hash ^ 0x85ebca6b)).slice(0, 32);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

export async function saveSaleToCloud(sale, { status = "posted" } = {}) {
  if (!sale?.id && !sale?.invoiceId) throw new Error("The sale has no invoice ID.");
  if (!Array.isArray(sale.items) || sale.items.length === 0) throw new Error("The sale must contain at least one item.");

  const { userId, organizationId } = await getAccount();
  const id = String(sale.id || sale.invoiceId);
  const requestedProductIds = [...new Set(sale.items
    .map((item) => String(item.productId || item.product_id || item.id || ""))
    .filter(Boolean))];
  const validProductIds = new Set();
  if (requestedProductIds.length) {
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .in("id", requestedProductIds);
    if (productError) throw productError;
    for (const product of products || []) validProductIds.add(String(product.id));
  }

  const requestedCustomerId = sale.customerId && String(sale.customerId).toLowerCase() !== "anonyme"
    ? String(sale.customerId)
    : "";
  let customerId = null;
  if (requestedCustomerId) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", requestedCustomerId)
      .maybeSingle();
    if (!customerError && customer) customerId = String(customer.id);
  }

  const total = Math.max(0, numeric(sale.total));
  const paid = Math.min(total, Math.max(0, numeric(sale.paid)));
  const header = {
    id,
    organization_id: organizationId,
    invoice_number: String(sale.invoiceNumber || id),
    customer_id: customerId,
    customer_name: String(sale.customerName || "Anonyme"),
    employee_id: userId,
    status: status === "pending" ? "pending" : "posted",
    subtotal: Math.max(0, numeric(sale.subtotal ?? total + numeric(sale.discount))),
    discount: Math.max(0, numeric(sale.discount)),
    total,
    paid,
    remaining: Math.max(0, numeric(sale.remaining ?? total - paid)),
    note: String(sale.note || ""),
    created_by: userId,
    created_at: sale.createdAt || new Date().toISOString(),
    updated_at: sale.updatedAt || new Date().toISOString(),
    posted_at: status === "pending" ? null : (sale.completedAt || sale.updatedAt || new Date().toISOString()),
  };

  const { error: headerError } = await supabase
    .from("sales_invoices")
    .upsert(header, { onConflict: "organization_id,id" });
  if (headerError) throw headerError;

  const { error: deleteError } = await supabase
    .from("sales_invoice_items")
    .delete()
    .eq("organization_id", organizationId)
    .eq("invoice_id", id);
  if (deleteError) throw deleteError;

  const rows = sale.items.map((item, index) => {
    const quantity = numeric(item.qty ?? item.quantity);
    const unitPrice = Math.max(0, numeric(item.price ?? item.unitPrice));
    return {
      id: stableLineId(id, item, index),
      organization_id: organizationId,
      invoice_id: id,
      product_id: validProductIds.has(String(item.productId || item.product_id || item.id || ""))
        ? String(item.productId || item.product_id || item.id)
        : null,
      product_name: String(item.name || item.productName || ""),
      sku: String(item.sku || ""),
      barcode: String(item.barcode || ""),
      quantity,
      unit_price: unitPrice,
      unit_cost: Math.max(0, numeric(item.cost ?? item.unitCost)),
      line_total: Math.max(0, numeric(item.lineTotal ?? item.total ?? quantity * unitPrice)),
    };
  });

  if (rows.some((item) => !item.product_name || !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    throw new Error("The sale contains an invalid item.");
  }

  const { error: itemsError } = await supabase
    .from("sales_invoice_items")
    .upsert(rows, { onConflict: "id" });
  if (itemsError) throw itemsError;

  return true;
}

/**
 * Void a pending invoice after its final item is removed.
 * Keeping a void row is intentional: realtime clients can reconcile stale
 * local pending caches against this tombstone instead of resurrecting it.
 * Completed/posted invoices are protected by the status filter.
 */
export async function voidPendingSaleFromCloud(invoiceId) {
  if (!invoiceId) throw new Error("The invoice has no ID.");
  const { organizationId } = await getAccount();

  const { data: voidedInvoice, error: invoiceError } = await supabase
    .from("sales_invoices")
    .update({
      status: "void",
      posted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", String(invoiceId))
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (invoiceError) throw invoiceError;

  // If another session has already posted this invoice, leave its items alone.
  if (!voidedInvoice) return true;

  const { error: itemsError } = await supabase
    .from("sales_invoice_items")
    .delete()
    .eq("organization_id", organizationId)
    .eq("invoice_id", String(invoiceId));
  if (itemsError) throw itemsError;

  return true;
}

export async function deleteSaleFromCloud(invoiceId) {
  if (!invoiceId) throw new Error("The sale has no invoice ID.");
  const { organizationId } = await getAccount();

  const { error: itemsError } = await supabase
    .from("sales_invoice_items")
    .delete()
    .eq("organization_id", organizationId)
    .eq("invoice_id", String(invoiceId));
  if (itemsError) throw itemsError;

  const { error } = await supabase
    .from("sales_invoices")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", String(invoiceId));
  if (error) throw error;

  return true;
}
