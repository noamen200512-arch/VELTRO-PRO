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

function toDatabase(supplier, organizationId, userId) {
  return {
    id: String(supplier.id),
    organization_id: organizationId,
    name: String(supplier.name || "").trim(),
    phone: String(supplier.phone || "").trim(),
    email: String(supplier.email || "").trim(),
    address: String(supplier.address || "").trim(),
    notes: String(supplier.note ?? supplier.notes ?? "").trim(),
    is_active: supplier.isActive !== false,
    created_by: userId,
    updated_at: supplier.updatedAt || new Date().toISOString(),
  };
}

function fromDatabase(row, localSuppliers = []) {
  const existing = localSuppliers.find(
    (supplier) => String(supplier.id) === String(row.id)
  );

  return {
    ...existing,
    id: row.id,
    name: row.name || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    note: row.notes || "",
    isActive: row.is_active !== false,
    createdAt: row.created_at || existing?.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || existing?.updatedAt || new Date().toISOString(),
  };
}

export async function loadSuppliersFromCloud(localSuppliers = []) {
  const account = await getAccount();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("organization_id", account.organizationId)
    .order("name", { ascending: true });

  if (error) throw error;

  if (data.length > 0) {
    return data.map((row) => fromDatabase(row, localSuppliers));
  }

  // One-time local-to-cloud migration for existing supplier records.
  if (localSuppliers.length > 0) {
    const rows = localSuppliers.map((supplier) =>
      toDatabase(supplier, account.organizationId, account.userId)
    );
    const { error: uploadError } = await supabase
      .from("suppliers")
      .upsert(rows, { onConflict: "organization_id,id" });

    if (uploadError) throw uploadError;
  }

  return localSuppliers;
}

export async function saveSuppliersToCloud(suppliers) {
  if (!Array.isArray(suppliers)) {
    throw new Error("Suppliers must be an array.");
  }
  if (suppliers.length === 0) return true;

  const account = await getAccount();
  const rows = suppliers.map((supplier) =>
    toDatabase(supplier, account.organizationId, account.userId)
  );
  const { error } = await supabase
    .from("suppliers")
    .upsert(rows, { onConflict: "organization_id,id" });

  if (error) throw error;
  return true;
}

export async function deleteSupplierFromCloud(supplierId) {
  const account = await getAccount();
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("organization_id", account.organizationId)
    .eq("id", String(supplierId));

  if (error) throw error;
  return true;
}
