
import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  History,
  Plus,
  Search,
  FileText,
  X,
  Trash2,
  CheckCircle2,
  Package,
  Truck,
  CalendarDays,
  CreditCard,
  Eye,
  Printer,
  Pencil,
} from "lucide-react";
import { getProducts, saveProducts } from "../productStore.js";
import "./purchases.css";

const INVOICES_KEY = "veltro_purchase_invoices";
const SUPPLIERS_KEY = "veltro_purchase_suppliers";
const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR")} DA`;

const readStorage = (key, fallback = []) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "11px 12px",
  borderRadius: 9,
  border: "1px solid rgba(148,163,184,.2)",
  background: "#080c14",
  color: "#edf2fa",
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 7, minWidth: 0 }}>
      <span style={{ color: "#8996aa", fontSize: 12 }}>{label}</span>
      {children}
    </label>
  );
}

function ActionButton({ children, onClick, danger = false, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minHeight: 38,
        padding: "8px 12px",
        borderRadius: 9,
        border: `1px solid ${
          danger ? "rgba(251,113,133,.3)" : "rgba(148,163,184,.2)"
        }`,
        background: danger ? "rgba(251,113,133,.08)" : "#111a29",
        color: danger ? "#fb7185" : "#edf2fa",
        fontSize: 12,
        fontWeight: 650,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function Purchases() {
  const [activeTab, setActiveTab] = useState("new");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierDebt, setSupplierDebt] = useState("");
  const [payment, setPayment] = useState("0");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("1");
  const [cartons, setCartons] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cartonPrice, setCartonPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [productCartonPrice, setProductCartonPrice] = useState("");
  const [lines, setLines] = useState([]);
  const [invoices, setInvoices] = useState(() =>
    readStorage(INVOICES_KEY)
  );
  const [suppliers, setSuppliers] = useState(() =>
    readStorage(SUPPLIERS_KEY)
  );
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const products = useMemo(() => {
    try {
      return getProducts();
    } catch {
      return [];
    }
  }, [showInvoice, selectedProduct, invoices.length]);

  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
    0
  );

  const paidAmount = Math.max(0, Number(payment) || 0);
  const remaining = Math.max(0, total - paidAmount);

  const filteredProducts = products.filter((product) => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return true;

    const barcodes = [
      product.barcode,
      ...(Array.isArray(product.barcodeAliases) ? product.barcodeAliases : []),
    ];

    return [
      product.name,
      product.sku,
      product.id,
      ...barcodes,
    ].some((value) =>
      String(value || "").toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const filteredInvoices = invoices.filter((invoice) => {
    const q = search.trim().toLowerCase();
    return !q || [
      invoice.number,
      invoice.supplier,
      invoice.phone,
      invoice.status,
    ].some((value) => String(value || "").toLowerCase().includes(q));
  });

  function resetDraft() {
    setSupplier("");
    setSupplierPhone("");
    setSupplierDebt("");
    setPayment("0");
    setInvoiceNote("");
    setProductSearch("");
    setSelectedProduct(null);
    setQuantity("1");
    setCartons("");
    setUnitPrice("");
    setCartonPrice("");
    setSalePrice("");
    setWholesalePrice("");
    setProductCartonPrice("");
    setLines([]);
    setEditingInvoice(null);
  }

  function openNewInvoice() {
    resetDraft();
    setShowInvoice(true);
  }

  function chooseProduct(product) {
    setSelectedProduct(product);
    setProductSearch(product.name || "");
    setQuantity("1");
    setCartons("");
    setUnitPrice(String(product.purchasePrice || ""));
    setCartonPrice(
      String(
        Number(product.purchasePrice || 0) *
          Math.max(1, Number(product.piecesPerCarton || 1))
      )
    );
    setSalePrice(String(product.price || ""));
    setWholesalePrice(String(product.wholesalePrice || ""));
    setProductCartonPrice(String(product.cartonPrice || ""));
  }

  function updateCartons(value) {
    setCartons(value);
    if (value !== "" && selectedProduct) {
      const perCarton = Math.max(
        1,
        Number(selectedProduct.piecesPerCarton || 1)
      );
      setQuantity(String(Math.max(0, Number(value) || 0) * perCarton));
      setUnitPrice(
        cartonPrice !== ""
          ? String((Number(cartonPrice) || 0) / perCarton)
          : unitPrice
      );
    }
  }

  function updateCartonPrice(value) {
    setCartonPrice(value);
    const perCarton = Math.max(
      1,
      Number(selectedProduct?.piecesPerCarton || 1)
    );
    if (value !== "") {
      setUnitPrice(String(Number((Number(value) / perCarton).toFixed(4))));
    } else {
      setUnitPrice("");
    }
  }

  function updateUnitPrice(value) {
    setUnitPrice(value);
    setCartonPrice("");
    setCartons("");
  }

  function addLine() {
    if (!selectedProduct) {
      setNotice("Select a product from the product database first.");
      return;
    }

    const qty = Math.max(0, Number(quantity) || 0);
    const price = Math.max(0, Number(unitPrice) || 0);

    if (qty <= 0) {
      setNotice("Enter a quantity greater than zero.");
      return;
    }

    const existingIndex = lines.findIndex(
      (line) => line.productId === selectedProduct.id
    );

    const newLine = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      sku: selectedProduct.sku || selectedProduct.id,
      barcode: selectedProduct.barcode || "",
      quantity: qty,
      cartons: Math.max(0, Number(cartons) || 0),
      unit: selectedProduct.unit || "piece",
      piecesPerCarton: Math.max(
        1,
        Number(selectedProduct.piecesPerCarton || 1)
      ),
      unitPrice: price,
      cartonPrice: Math.max(0, Number(cartonPrice) || 0),
      salePrice: Math.max(0, Number(salePrice) || 0),
      wholesalePrice: Math.max(0, Number(wholesalePrice) || 0),
      productCartonPrice: Math.max(0, Number(productCartonPrice) || 0),
      image: selectedProduct.image || "",
    };

    setLines((previous) => {
      if (existingIndex >= 0) {
        return previous.map((line, index) =>
          index === existingIndex
            ? { ...line, quantity: line.quantity + qty }
            : line
        );
      }
      return [...previous, newLine];
    });

    setSelectedProduct(null);
    setProductSearch("");
    setQuantity("1");
    setCartons("");
    setUnitPrice("");
    setCartonPrice("");
    setSalePrice("");
    setWholesalePrice("");
    setProductCartonPrice("");
    setNotice("");
  }

  function updateLine(index, field, value) {
    setLines((previous) =>
      previous.map((line, i) => {
        if (i !== index) return line;

        const next = { ...line, [field]: value };

        if (field === "quantity" || field === "unitPrice") {
          next[field] = Math.max(0, Number(value) || 0);
        }

        return next;
      })
    );
  }

  function saveInvoice() {
    if (!supplier.trim()) {
      setNotice("Enter the supplier name.");
      return;
    }

    if (!lines.length) {
      setNotice("Add at least one product to the invoice.");
      return;
    }

    if (paidAmount > total) {
      setNotice("The paid amount cannot exceed the invoice total.");
      return;
    }

    setShowPayment(false);
    setNotice("");
    setShowInvoice(false);

    const now = new Date().toISOString();
    const existing = editingInvoice
      ? invoices.find((invoice) => invoice.id === editingInvoice)
      : null;

    const invoice = {
      id: existing?.id || `PUR-${Date.now()}`,
      number: existing?.number || `PUR-${Date.now()}`,
      supplier: supplier.trim(),
      phone: supplierPhone.trim(),
      date: existing?.date || now,
      updatedAt: now,
      lines: lines.map((line) => ({ ...line })),
      total,
      paid: paidAmount,
      remaining,
      status:
        remaining <= 0
          ? "Paid"
          : paidAmount > 0
          ? "Partially paid"
          : "Unpaid",
      note: invoiceNote.trim(),
    };

    // A new confirmed invoice updates stock once.
    // Editing an existing invoice does not apply stock a second time.
    if (!existing) {
      const currentProducts = getProducts();
      const updatedProducts = currentProducts.map((product) => {
        const matchingLines = lines.filter(
          (line) => line.productId === product.id
        );
        if (!matchingLines.length) return product;

        const addedUnits = matchingLines.reduce(
          (sum, line) => sum + Number(line.quantity || 0),
          0
        );

        const latest = matchingLines[matchingLines.length - 1];

        return {
          ...product,
          stock: Number(product.stock || 0) + addedUnits,
          purchasePrice: Number(latest.unitPrice || product.purchasePrice || 0),
          price: Number(latest.salePrice || product.price || 0),
          wholesalePrice: Number(
            latest.wholesalePrice || product.wholesalePrice || 0
          ),
          cartonPrice: Number(
            latest.productCartonPrice || product.cartonPrice || 0
          ),
        };
      });

      const savedProducts = saveProducts(updatedProducts);
      if (!savedProducts) {
        setNotice("Could not update product stock. Invoice was not saved.");
        setShowInvoice(true);
        return;
      }
    }

    const nextInvoices = existing
      ? invoices.map((item) => item.id === invoice.id ? invoice : item)
      : [invoice, ...invoices];

    const nextSuppliers = [...suppliers];
    const supplierIndex = nextSuppliers.findIndex(
      (item) => item.name.toLowerCase() === invoice.supplier.toLowerCase()
    );

    if (supplierIndex >= 0) {
      nextSuppliers[supplierIndex] = {
        ...nextSuppliers[supplierIndex],
        phone: invoice.phone || nextSuppliers[supplierIndex].phone || "",
        debt: Math.max(
          0,
          Number(nextSuppliers[supplierIndex].debt || 0) + invoice.remaining
        ),
      };
    } else {
      nextSuppliers.push({
        id: `SUP-${Date.now()}`,
        name: invoice.supplier,
        phone: invoice.phone,
        debt: invoice.remaining,
      });
    }

    const invoicesSaved = saveStorage(INVOICES_KEY, nextInvoices);
    const suppliersSaved = saveStorage(SUPPLIERS_KEY, nextSuppliers);

    if (!invoicesSaved || !suppliersSaved) {
      setNotice(
        "Some data could not be saved in this browser. Check available storage."
      );
      return;
    }

    setInvoices(nextInvoices);
    setSuppliers(nextSuppliers);
    setViewInvoice(invoice);
    setActiveTab("history");
    resetDraft();
  }

  function openPaymentStep() {
    if (!supplier.trim()) {
      setNotice("Enter the supplier name.");
      return;
    }
    if (!lines.length) {
      setNotice("Add products before confirming the invoice.");
      return;
    }
    setPayment("0");
    setShowPayment(true);
  }

  function deleteInvoice(invoice) {
    const accepted = window.confirm(
      `Delete invoice ${invoice.number}? This will not reverse stock changes.`
    );
    if (!accepted) return;

    const next = invoices.filter((item) => item.id !== invoice.id);
    if (saveStorage(INVOICES_KEY, next)) {
      setInvoices(next);
      setNotice("Invoice deleted. Stock was not changed.");
    }
  }

  function printInvoice(invoice) {
    const rows = invoice.lines.map((line) => `
      <tr>
        <td>${String(line.name || "").replace(/[<>&]/g, "")}</td>
        <td>${Number(line.quantity || 0)}</td>
        <td>${Number(line.unitPrice || 0).toLocaleString("fr-FR")} DA</td>
        <td>${(Number(line.quantity || 0) * Number(line.unitPrice || 0)).toLocaleString("fr-FR")} DA</td>
      </tr>
    `).join("");

    const popup = window.open("", "_blank", "width=850,height=700");
    if (!popup) {
      setNotice("Allow pop-ups to print the invoice.");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>${invoice.number}</title>
        <style>
          body{font-family:Arial,sans-serif;color:#111;padding:28px}
          h1{margin:0 0 8px}p{color:#555}
          table{width:100%;border-collapse:collapse;margin-top:24px}
          th,td{padding:10px;border:1px solid #ddd;text-align:left}
          th{background:#f3f4f6}
          .total{text-align:right;font-size:20px;font-weight:bold;margin-top:24px}
        </style>
      </head>
      <body>
        <h1>VELTRO-PRO — Purchase Invoice</h1>
        <p>Invoice: ${invoice.number}</p>
        <p>Supplier: ${String(invoice.supplier || "").replace(/[<>&]/g, "")}</p>
        <p>Date: ${new Date(invoice.date).toLocaleString()}</p>
        <table>
          <thead><tr><th>Product</th><th>Quantity</th><th>Unit cost</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">Total: ${Number(invoice.total || 0).toLocaleString("fr-FR")} DA</div>
        <p>Paid: ${Number(invoice.paid || 0).toLocaleString("fr-FR")} DA</p>
        <p>Remaining: ${Number(invoice.remaining || 0).toLocaleString("fr-FR")} DA</p>
        <script>window.onload=()=>window.print();<\/script>
      </body>
      </html>
    `);
    popup.document.close();
  }

  function startEditing(invoice) {
    setEditingInvoice(invoice.id);
    setSupplier(invoice.supplier || "");
    setSupplierPhone(invoice.phone || "");
    setInvoiceNote(invoice.note || "");
    setLines(invoice.lines.map((line) => ({ ...line })));
    setPayment(String(invoice.paid || 0));
    setShowInvoice(true);
    setActiveTab("new");
    setNotice(
      "Editing invoice details will not change stock or supplier debt automatically."
    );
  }

  return (
    <section className="purchases-page">
      <header className="purchases-header">
        <div>
          <span className="purchases-eyebrow">COMMERCE</span>
          <h1>Purchases</h1>
          <p>Manage supplier invoices, purchase costs and incoming stock.</p>
        </div>
        <button
          className="purchases-primary-button"
          onClick={openNewInvoice}
        >
          <Plus size={17} />
          New Purchase Invoice
        </button>
      </header>

      {notice && (
        <div style={{
          marginBottom: 16,
          padding: "12px 14px",
          border: "1px solid rgba(39,217,195,.25)",
          borderRadius: 10,
          color: "#b6fff5",
          background: "rgba(39,217,195,.07)",
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          {notice}
          <button
            onClick={() => setNotice("")}
            style={{
              float: "right",
              background: "transparent",
              border: 0,
              color: "inherit",
              cursor: "pointer",
            }}
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <nav className="purchases-tabs">
        <button
          className={activeTab === "new" ? "active" : ""}
          onClick={() => setActiveTab("new")}
        >
          <ShoppingCart size={18} />
          New Purchase Invoice
        </button>
        <button
          className={activeTab === "history" ? "active" : ""}
          onClick={() => setActiveTab("history")}
        >
          <History size={18} />
          Purchase History
        </button>
      </nav>

      {activeTab === "new" ? (
        <div className="purchases-panel">
          <div className="purchases-panel-heading">
            <div className="purchases-heading-icon">
              <FileText size={22} />
            </div>
            <div>
              <h2>Purchase invoices</h2>
              <p>Create an invoice and add products from your existing inventory list.</p>
            </div>
          </div>

          <div className="purchases-empty">
            <div className="purchases-empty-icon">
              <ShoppingCart size={30} />
            </div>
            <h3>Ready to receive new stock?</h3>
            <p>
              Start a supplier invoice, add products and quantities, then confirm
              the payment details.
            </p>
            <button
              className="purchases-primary-button"
              onClick={openNewInvoice}
            >
              <Plus size={18} />
              Create Purchase Invoice
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginTop: 8,
          }}>
            <div style={{
              padding: 16,
              border: "1px solid rgba(148,163,184,.15)",
              borderRadius: 12,
              background: "#0b121e",
            }}>
              <Package size={20} color="#27d9c3" />
              <p style={{ color: "#8996aa", fontSize: 12 }}>Products available</p>
              <strong style={{ fontSize: 23 }}>{products.length}</strong>
            </div>
            <div style={{
              padding: 16,
              border: "1px solid rgba(148,163,184,.15)",
              borderRadius: 12,
              background: "#0b121e",
            }}>
              <FileText size={20} color="#9b8afb" />
              <p style={{ color: "#8996aa", fontSize: 12 }}>Saved invoices</p>
              <strong style={{ fontSize: 23 }}>{invoices.length}</strong>
            </div>
            <div style={{
              padding: 16,
              border: "1px solid rgba(148,163,184,.15)",
              borderRadius: 12,
              background: "#0b121e",
            }}>
              <Truck size={20} color="#34d399" />
              <p style={{ color: "#8996aa", fontSize: 12 }}>Saved suppliers</p>
              <strong style={{ fontSize: 23 }}>{suppliers.length}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="purchases-panel">
          <div className="purchases-panel-heading">
            <div className="purchases-heading-icon">
              <History size={22} />
            </div>
            <div>
              <h2>Purchase History</h2>
              <p>Search, inspect, edit or print your saved purchase invoices.</p>
            </div>
          </div>

          <label className="purchases-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoice number or supplier..."
            />
          </label>

          {filteredInvoices.length ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{
                width: "100%",
                minWidth: 650,
                borderCollapse: "collapse",
                fontSize: 12,
              }}>
                <thead>
                  <tr style={{ color: "#8996aa", textAlign: "left" }}>
                    {["Invoice", "Date", "Supplier", "Purchase Value", "Amount Paid", "Remaining", "Actions"].map((label) => (
                      <th key={label} style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid rgba(148,163,184,.15)",
                      }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        <strong>{invoice.number}</strong>
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        {new Date(invoice.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        {invoice.supplier}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        {money(invoice.total)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        {money(invoice.paid)}
                      </td>
                      <td style={{
                        padding: 10,
                        borderBottom: "1px solid rgba(148,163,184,.1)",
                        color: Number(invoice.remaining) > 0 ? "#fbbf24" : "#34d399",
                      }}>
                        {money(invoice.remaining)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid rgba(148,163,184,.1)" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <ActionButton onClick={() => setViewInvoice(invoice)}>
                            <Eye size={14} />
                          </ActionButton>
                          <ActionButton onClick={() => startEditing(invoice)}>
                            <Pencil size={14} />
                          </ActionButton>
                          <ActionButton onClick={() => printInvoice(invoice)}>
                            <Printer size={14} />
                          </ActionButton>
                          <ActionButton danger onClick={() => deleteInvoice(invoice)}>
                            <Trash2 size={14} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="purchases-history-empty">
              <FileText size={28} />
              <p>No purchase invoices found.</p>
            </div>
          )}
        </div>
      )}

      {showInvoice && (
        <div className="purchases-modal-backdrop" onClick={() => {
          setShowInvoice(false);
          setShowPayment(false);
        }}>
          <div
            className="purchases-modal purchases-invoice-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="purchases-modal-close"
              onClick={() => setShowInvoice(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="purchases-panel-heading" style={{ paddingBottom: 18 }}>
              <div className="purchases-heading-icon">
                <ShoppingCart size={22} />
              </div>
              <div>
                <h2>{editingInvoice ? "Edit Purchase Invoice" : "New Purchase Invoice"}</h2>
                <p>Invoice number is generated automatically on confirmation.</p>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
              gap: 13,
              marginTop: 20,
            }}>
              <Field label="Supplier name *">
                <input
                  style={inputStyle}
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  placeholder="Enter supplier name"
                  list="purchase-suppliers"
                />
                <datalist id="purchase-suppliers">
                  {suppliers.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </Field>
              <Field label="Supplier phone">
                <input
                  style={inputStyle}
                  value={supplierPhone}
                  onChange={(event) => setSupplierPhone(event.target.value)}
                  placeholder="Phone number"
                />
              </Field>
            </div>

            <div style={{
              marginTop: 20,
              padding: 14,
              border: "1px solid rgba(148,163,184,.15)",
              borderRadius: 12,
              background: "#0b121e",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                Add product to invoice
              </h3>

              <Field label="Search by product name, reference or barcode">
                <input
                  style={inputStyle}
                  value={productSearch}
                  onChange={(event) => {
                    setProductSearch(event.target.value);
                    setSelectedProduct(null);
                  }}
                  placeholder="Type product name or scan/type barcode..."
                />
              </Field>

              {productSearch && !selectedProduct && (
                <div style={{
                  display: "grid",
                  gap: 6,
                  marginTop: 8,
                  maxHeight: 190,
                  overflowY: "auto",
                }}>
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => chooseProduct(product)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        padding: 11,
                        borderRadius: 9,
                        border: "1px solid rgba(148,163,184,.13)",
                        background: "#101927",
                        color: "#edf2fa",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span>
                        <strong style={{ display: "block", fontSize: 12 }}>
                          {product.name}
                        </strong>
                        <small style={{ color: "#8996aa" }}>
                          {product.sku || product.id} · Stock: {product.stock || 0}
                        </small>
                      </span>
                      <Plus size={17} color="#27d9c3" />
                    </button>
                  ))}
                  {!filteredProducts.length && (
                    <p style={{ color: "#8996aa", fontSize: 12 }}>
                      Product not found. Add it first in the Products section.
                    </p>
                  )}
                </div>
              )}

              {selectedProduct && (
                <div style={{
                  marginTop: 14,
                  padding: 12,
                  border: "1px solid rgba(39,217,195,.25)",
                  borderRadius: 10,
                  background: "rgba(39,217,195,.05)",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 13,
                  }}>
                    {selectedProduct.image && (
                      <img
                        src={selectedProduct.image}
                        alt=""
                        style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover" }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{selectedProduct.name}</strong>
                      <div style={{ color: "#8996aa", fontSize: 11, marginTop: 4 }}>
                        Reference: {selectedProduct.sku || selectedProduct.id}
                        {" · "}Unit: {selectedProduct.unit || "piece"}
                        {" · "}Units/carton: {selectedProduct.piecesPerCarton || 1}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        setProductSearch("");
                      }}
                      style={{ background: "transparent", border: 0, color: "#8996aa", cursor: "pointer" }}
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 135px), 1fr))",
                    gap: 11,
                  }}>
                    <Field label="Cartons">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={cartons}
                        onChange={(event) => updateCartons(event.target.value)}
                        placeholder="Optional"
                      />
                    </Field>
                    <Field label={`Quantity (${selectedProduct.unit || "piece"})`}>
                      <input
                        style={inputStyle}
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(event) => {
                          setQuantity(event.target.value);
                          setCartons("");
                        }}
                      />
                    </Field>
                    <Field label="Carton purchase price (DA)">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={cartonPrice}
                        onChange={(event) => updateCartonPrice(event.target.value)}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Unit purchase price (DA)">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={unitPrice}
                        onChange={(event) => updateUnitPrice(event.target.value)}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Sale price 1 (DA)">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={salePrice}
                        onChange={(event) => setSalePrice(event.target.value)}
                      />
                    </Field>
                    <Field label="Sale price 2 (DA)">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={wholesalePrice}
                        onChange={(event) => setWholesalePrice(event.target.value)}
                      />
                    </Field>
                    <Field label="Carton sale price (DA)">
                      <input
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={productCartonPrice}
                        onChange={(event) => setProductCartonPrice(event.target.value)}
                      />
                    </Field>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 14,
                  }}>
                    <span style={{ color: "#8996aa", fontSize: 12 }}>
                      Line total: <strong style={{ color: "#edf2fa" }}>
                        {money(Number(quantity || 0) * Number(unitPrice || 0))}
                      </strong>
                    </span>
                    <button
                      className="purchases-primary-button"
                      onClick={addLine}
                    >
                      <Plus size={16} /> Add to invoice
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 22 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>
                Invoice items ({lines.length})
              </h3>

              {lines.length ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {lines.map((line, index) => (
                    <div key={`${line.productId}-${index}`} style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 95px 120px 36px",
                      alignItems: "center",
                      gap: 8,
                      padding: 10,
                      border: "1px solid rgba(148,163,184,.13)",
                      borderRadius: 10,
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: 12, overflowWrap: "anywhere" }}>
                          {line.name}
                        </strong>
                        <span style={{ color: "#8996aa", fontSize: 11 }}>
                          {money(line.quantity * line.unitPrice)}
                        </span>
                      </div>
                      <input
                        aria-label="Quantity"
                        style={inputStyle}
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(event) => updateLine(index, "quantity", event.target.value)}
                      />
                      <input
                        aria-label="Unit purchase price"
                        style={inputStyle}
                        type="number"
                        min="0"
                        value={line.unitPrice}
                        onChange={(event) => updateLine(index, "unitPrice", event.target.value)}
                      />
                      <button
                        aria-label="Remove item"
                        onClick={() => setLines((old) => old.filter((_, i) => i !== index))}
                        style={{ border: 0, background: "transparent", color: "#fb7185", cursor: "pointer" }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="purchases-history-empty">
                  <Package size={26} />
                  <p>No products added yet.</p>
                </div>
              )}
            </div>

            <Field label="Invoice note">
              <textarea
                style={{ ...inputStyle, minHeight: 75, resize: "vertical" }}
                value={invoiceNote}
                onChange={(event) => setInvoiceNote(event.target.value)}
                placeholder="Optional note..."
              />
            </Field>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              paddingTop: 18,
              marginTop: 18,
              borderTop: "1px solid rgba(148,163,184,.15)",
            }}>
              <div>
                <span style={{ color: "#8996aa", fontSize: 12 }}>Invoice total</span>
                <div style={{ color: "#27d9c3", fontSize: 24, fontWeight: 800 }}>
                  {money(total)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ActionButton onClick={() => setShowInvoice(false)}>
                  Cancel
                </ActionButton>
                <button
                  className="purchases-primary-button"
                  onClick={openPaymentStep}
                >
                  <CheckCircle2 size={17} />
                  Confirm invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className="purchases-modal-backdrop" onClick={() => setShowPayment(false)}>
          <div className="purchases-modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="purchases-modal-close"
              onClick={() => setShowPayment(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>
            <div className="purchases-heading-icon">
              <CreditCard size={22} />
            </div>
            <h2>Confirm purchase invoice</h2>
            <p>Review the amount paid. Remaining balance will be recorded for this supplier.</p>

            <div style={{
              padding: 15,
              border: "1px solid rgba(148,163,184,.15)",
              borderRadius: 12,
              background: "#0b121e",
              margin: "18px 0",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <span style={{ color: "#8996aa" }}>Supplier</span>
                <strong>{supplier}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <span style={{ color: "#8996aa" }}>Invoice total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <Field label="Amount paid now (DA)">
              <input
                style={inputStyle}
                type="number"
                min="0"
                max={total}
                value={payment}
                onChange={(event) => setPayment(event.target.value)}
              />
            </Field>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              padding: "15px 0",
              color: "#8996aa",
            }}>
              <span>Remaining balance</span>
              <strong style={{ color: "#fbbf24" }}>
                {money(Math.max(0, total - Number(payment || 0)))}
              </strong>
            </div>

            <button
              className="purchases-primary-button"
              style={{ width: "100%" }}
              onClick={saveInvoice}
            >
              <CheckCircle2 size={17} />
              Save and confirm
            </button>
          </div>
        </div>
      )}

      {viewInvoice && (
        <div className="purchases-modal-backdrop" onClick={() => setViewInvoice(null)}>
          <div className="purchases-modal" onClick={(event) => event.stopPropagation()}>
            <button className="purchases-modal-close" onClick={() => setViewInvoice(null)}>
              <X size={19} />
            </button>
            <div className="purchases-heading-icon">
              <FileText size={22} />
            </div>
            <h2>Purchase Invoice</h2>
            <p>{viewInvoice.number} · {new Date(viewInvoice.date).toLocaleString()}</p>

            <div style={{ display: "grid", gap: 9, margin: "18px 0" }}>
              <div><span style={{ color: "#8996aa" }}>Supplier: </span>{viewInvoice.supplier}</div>
              <div><span style={{ color: "#8996aa" }}>Status: </span>{viewInvoice.status}</div>
              {viewInvoice.lines.map((line, index) => (
                <div key={`${line.productId}-${index}`} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: 10,
                  background: "#0b121e",
                  borderRadius: 8,
                }}>
                  <span>{line.name} × {line.quantity}</span>
                  <strong>{money(line.quantity * line.unitPrice)}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(148,163,184,.15)", paddingTop: 14 }}>
              <p>Total: <strong>{money(viewInvoice.total)}</strong></p>
              <p>Paid: <strong>{money(viewInvoice.paid)}</strong></p>
              <p>Remaining: <strong>{money(viewInvoice.remaining)}</strong></p>
            </div>

            <button
              className="purchases-primary-button"
              style={{ width: "100%" }}
              onClick={() => printInvoice(viewInvoice)}
            >
              <Printer size={17} /> Print invoice
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
