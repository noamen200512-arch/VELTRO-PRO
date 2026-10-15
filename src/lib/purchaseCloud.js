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
  if (!profile?.organization_id) {
    throw new Error("No organization is linked to this account.");
  }

  return { userId: data.user.id, organizationId: profile.organization_id };
}

const normalize = (value) => String(value ?? "").trim().toLowerCase();

function makeStableUuid(value) {
  const input = String(value);
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    a = Math.imul(a ^ input.charCodeAt(i), 0x01000193);
    b = Math.imul(b ^ (input.charCodeAt(i) + i), 0x85ebca6b);
  }
  const hex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  const raw = (hex(a) + hex(b) + hex(a ^ b) + hex(Math.imul(a, b))).slice(0, 32);
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-4${raw.slice(13, 16)}-a${raw.slice(17, 20)}-${raw.slice(20, 32)}`;
}

export async function savePurchaseInvoiceToCloud(invoice, suppliers = [], options = {}) {
  if (!invoice?.id || !Array.isArray(invoice.lines) || invoice.lines.length === 0) {
    throw new Error("A purchase invoice must have an ID and at least one line.");
  }

  const { userId, organizationId } = await getAccount();
  const supplier = suppliers.find(
    item => invoice.supplierId && String(item.id) === String(invoice.supplierId)
  ) || suppliers.find(
    item => normalize(item.name) === normalize(invoice.supplier)
  );
  const total = Math.max(0, Number(invoice.total) || 0);
  const paid = Math.max(0, Number(invoice.paid) || 0);
  const remaining = Math.max(0, Number(invoice.remaining ?? total - paid) || 0);

  const header = {
    id: String(invoice.id),
    organization_id: organizationId,
    invoice_number: String(invoice.number || invoice.id),
    supplier_id: supplier?.id ? String(supplier.id) : null,
    supplier_name: String(invoice.supplier || ""),
    employee_id: userId,
    status: "posted",
    subtotal: total,
    total,
    paid: Math.min(paid, total),
    remaining,
    note: String(invoice.note || ""),
    created_by: userId,
    created_at: invoice.date || new Date().toISOString(),
    updated_at: invoice.updatedAt || new Date().toISOString(),
    posted_at: invoice.closedAt || invoice.updatedAt || new Date().toISOString(),
  };

  const { error: headerError } = await supabase
    .from("purchase_invoices")
    .upsert(header, { onConflict: "organization_id,id" });
  if (headerError) throw headerError;

  if (options.replaceItems) {
    const { error: deleteError } = await supabase
      .from("purchase_invoice_items")
      .delete()
      .eq("organization_id", organizationId)
      .eq("invoice_id", String(invoice.id));
    if (deleteError) throw deleteError;
  }

  const items = invoice.lines.map((line, index) => {
    const quantity = Number(line.quantity);
    const unitCost = Math.max(0, Number(line.unitPrice) || 0);
    const unitPrice = Math.max(0, Number(line.salePrice) || 0);
    const stableLineId = makeStableUuid(
      `${invoice.id}:${line.lineId || line.productId || line.sku || index}:${index}`
    );

    return {
      id: stableLineId,
      organization_id: organizationId,
      invoice_id: String(invoice.id),
      product_id: line.productId ? String(line.productId) : null,
      product_name: String(line.name || ""),
      sku: String(line.sku || ""),
      barcode: String(line.barcode || ""),
      quantity,
      unit_cost: unitCost,
      unit_price: unitPrice,
      line_total: Math.max(0, Number(line.lineTotal) || quantity * unitCost),
    };
  });

  if (items.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
    throw new Error("A purchase invoice contains an invalid product quantity.");
  }

  const { error: itemsError } = await supabase
    .from("purchase_invoice_items")
    .upsert(items, { onConflict: "id" });
  if (itemsError) throw itemsError;

  return true;
}
