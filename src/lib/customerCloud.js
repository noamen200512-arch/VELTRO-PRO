import { supabase } from "./supabase.js";

async function getAccount() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in first.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("organization_id").eq("user_id", data.user.id).single();
  if (profileError) throw profileError;
  if (!profile?.organization_id) throw new Error("No organization is linked to this account.");
  return { userId: data.user.id, organizationId: profile.organization_id };
}
function toDatabase(customer, organizationId, userId) {
  return {
    id: String(customer.id), organization_id: organizationId, name: String(customer.name || "").trim(),
    phone: String(customer.phone || "").trim(), email: String(customer.email || "").trim(),
    address: String(customer.address || "").trim(), reference: String(customer.reference || customer.code || "").trim(),
    notes: String(customer.notes ?? customer.note ?? "").trim(), credit_limit: Math.max(0, Number(customer.creditLimit) || 0),
    is_active: customer.isActive !== false, created_by: userId, updated_at: customer.updatedAt || new Date().toISOString()
  };
}
function fromDatabase(row, localCustomers = []) {
  const existing = localCustomers.find(item => String(item.id) === String(row.id));
  return { ...existing, id: String(row.id), name: row.name || "", phone: row.phone || "", email: row.email || "",
    address: row.address || "", reference: row.reference || existing?.reference || row.id, code: row.reference || existing?.code || row.id,
    notes: row.notes || "", creditLimit: Number(row.credit_limit) || 0, isActive: row.is_active !== false,
    createdAt: row.created_at || existing?.createdAt || new Date().toISOString(), updatedAt: row.updated_at || existing?.updatedAt || new Date().toISOString()
  };
}
export async function loadCustomersFromCloud(localCustomers = []) {
  const account = await getAccount();
  const { data, error } = await supabase.from("customers").select("*").eq("organization_id", account.organizationId).order("name", { ascending: true });
  if (error) throw error;
  if (data.length > 0) return data.map(row => fromDatabase(row, localCustomers));
  if (localCustomers.length > 0) {
    const rows = localCustomers.map(customer => toDatabase(customer, account.organizationId, account.userId));
    const { error: uploadError } = await supabase.from("customers").upsert(rows, { onConflict: "organization_id,id" });
    if (uploadError) throw uploadError;
  }
  return localCustomers;
}
export async function saveCustomersToCloud(customers) {
  if (!Array.isArray(customers)) throw new Error("Customers must be an array.");
  if (customers.length === 0) return true;
  const account = await getAccount();
  const rows = customers.map(customer => toDatabase(customer, account.organizationId, account.userId));
  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "organization_id,id" });
  if (error) throw error;
  return true;
}
export async function deleteCustomerFromCloud(customerId) {
  const account = await getAccount();
  const { error } = await supabase.from("customers").delete().eq("organization_id", account.organizationId).eq("id", String(customerId));
  if (error) throw error;
  return true;
}
