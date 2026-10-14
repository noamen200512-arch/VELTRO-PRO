import { supabase } from "./supabase.js";

function toDatabase(product, organizationId, userId) {
return {
id: String(product.id),
organization_id: organizationId,
name: String(product.name || ""),
category: String(product.category || "General"),
sku: String(product.sku || product.id),
barcode: String(product.barcode || ""),
barcode_aliases: Array.isArray(product.barcodeAliases)
? product.barcodeAliases
: [],
purchase_price: Number(product.purchasePrice || 0),
price: Number(product.price || 0),
carton_price: Number(product.cartonPrice || 0),
wholesale_price: Number(product.wholesalePrice || 0),
pieces_per_carton: Math.max(
1,
Number(product.piecesPerCarton || 1)
),
stock: Math.max(0, Number(product.stock || 0)),
min_stock: Math.max(0, Number(product.minStock || 0)),
unit: String(product.unit || "piece"),
image: String(product.image || ""),
created_by: userId,
updated_at: new Date().toISOString(),
};
}

function fromDatabase(row) {
return {
id: row.id,
name: row.name,
category: row.category,
sku: row.sku,
barcode: row.barcode || "",
barcodeAliases: row.barcode_aliases || [],
purchasePrice: Number(row.purchase_price || 0),
price: Number(row.price || 0),
cartonPrice: Number(row.carton_price || 0),
wholesalePrice: Number(row.wholesale_price || 0),
piecesPerCarton: Number(row.pieces_per_carton || 1),
stock: Number(row.stock || 0),
minStock: Number(row.min_stock || 0),
unit: row.unit || "piece",
image: row.image || "",
};
}

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

return {
userId: data.user.id,
organizationId: profile.organization_id,
};
}

export async function loadProductsFromCloud(localProducts = []) {
const { userId, organizationId } = await getAccount();

const { data, error } = await supabase
.from("products")
.select("*")
.eq("organization_id", organizationId)
.order("name");

if (error) throw error;

if (data.length > 0) {
return data.map(fromDatabase);
}

// First-time migration: copy existing local products only
// when the organization's cloud product table is empty.
if (localProducts.length > 0) {
const rows = localProducts.map((product) =>
toDatabase(product, organizationId, userId)
);

const { error: uploadError } = await supabase
  .from("products")
  .upsert(rows, {
    onConflict: "organization_id,id",
  });

if (uploadError) throw uploadError;

}

return localProducts;
}

export async function saveProductsToCloud(products) {
if (!Array.isArray(products)) {
throw new Error("Products must be an array.");
}

const { userId, organizationId } = await getAccount();

if (products.length === 0) return true;

const rows = products.map((product) =>
toDatabase(product, organizationId, userId)
);

const { error } = await supabase
.from("products")
.upsert(rows, {
onConflict: "organization_id,id",
});

if (error) throw error;

return true;
}

export async function deleteProductFromCloud(productId) {
const { organizationId } = await getAccount();

const { error } = await supabase
.from("products")
.delete()
.eq("organization_id", organizationId)
.eq("id", String(productId));

if (error) throw error;

return true;
}