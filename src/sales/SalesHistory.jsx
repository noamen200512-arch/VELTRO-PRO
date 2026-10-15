
import React, { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  FileText,
  Users,
  Clock,
  Search,
  Calendar,
  RefreshCw,
  Download,
  History,
  Eye,
  Printer,
  Pencil,
  X,
  LockKeyhole,
  Plus,
  Trash2,
  Save,
  UserRound,
  Check,
} from "lucide-react";

import { getProducts } from "../productStore.js";
import {
  getCompletedSales,
  editCompletedSale,
  deleteCompletedSale,
} from "./salesStore.js";

import "./salesHistory.css";
import EditInvoiceProductPicker from "./components/EditInvoiceProductPicker.jsx";

/* =========================================================
   HELPERS
========================================================= */

function money(value) {
  return `${(Number(value) || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 2,
  })} DA`;
}

function quantity(item) {
  return Math.max(0, Number(item.qty ?? item.quantity) || 0);
}

function productId(item) {
  return String(item.productId ?? item.id ?? "");
}

function invoiceSubtotal(items = []) {
  return items.reduce((sum, item) => {
    const line = quantity(item) * Math.max(0, Number(item.price) || 0);
    return sum + Math.max(0, line - (Number(item.discount) || 0));
  }, 0);
}

function invoiceTotal(invoice) {
  return Math.max(
    0,
    invoiceSubtotal(invoice.items || []) -
      (Number(invoice.discount) || 0)
  );
}

function invoiceDate(invoice) {
  return invoice.completedAt || invoice.createdAt || invoice.updatedAt || "";
}

function employeeName(invoice) {
  return (
    invoice.employeeName ||
    invoice.userName ||
    invoice.cashierName ||
    invoice.createdBy ||
    invoice.currentUser ||
    invoice.employee ||
    ""
  );
}

function customerName(invoice) {
  return invoice.customerName || "Walk-in customer";
}

function invoiceIdentity(invoice) {
  return String(
    invoice.id || invoice.invoiceId || invoice.invoiceNumber || ""
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <article className="stat-card accent-cyan">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>
      </div>

      <p className="stat-title">{title}</p>

      <div className="stat-value-row">
        <h2>{value}</h2>
      </div>

      <p className="stat-subtitle">{subtitle}</p>
    </article>
  );
}

/* =========================================================
   INVOICE DETAILS AND PRINT
========================================================= */

function InvoicePrint({ invoice, onClose, printRequest }) {
  const items = invoice.items || [];
  const subtotal = invoiceSubtotal(items);
  const discount = Number(invoice.discount) || 0;
  const total = Number(invoice.total ?? invoiceTotal(invoice));
  const paid = Number(invoice.paid) || 0;
  const remaining = Math.max(0, total - paid);

  React.useEffect(() => {
    if (!printRequest) return undefined;

    const timer = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timer);
  }, [printRequest]);

  const rawDate = invoiceDate(invoice);
  const parsedDate = rawDate ? new Date(rawDate) : null;

  const formattedDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleString()
      : "—";

  return (
    <div className="modal-backdrop invoice-modal-backdrop">
      <section
        className="panel invoice-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Invoice ${invoice.invoiceNumber || invoice.id}`}
      >
        <div className="panel-header no-print">
          <div>
            <h3>Invoice {invoice.invoiceNumber || invoice.id}</h3>
            <p className="panel-description">Completed sale details</p>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
          >
            <X size={20} />
          </button>
        </div>

        <div id="invoice-print-area" className="invoice-print-area">
          <div className="invoice-paper-heading">
            <div>
              <h2>VELTRO-PRO</h2>
              <p>Sales Invoice</p>
            </div>

            <div className="invoice-paper-number">
              <strong>{invoice.invoiceNumber || invoice.id}</strong>
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="invoice-paper-meta">
            <div>
              <span>Customer</span>
              <strong>{customerName(invoice)}</strong>
            </div>

            <div>
              <span>Employee</span>
              <strong>{employeeName(invoice) || "Not recorded"}</strong>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>DISCOUNT</th>
                  <th>TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => {
                  const line =
                    quantity(item) * (Number(item.price) || 0);
                  const lineDiscount = Number(item.discount) || 0;

                  return (
                    <tr key={`${productId(item)}-${index}`}>
                      <td>{item.name || "Product"}</td>
                      <td>{quantity(item)}</td>
                      <td>{money(item.price)}</td>
                      <td>{money(lineDiscount)}</td>
                      <td>{money(Math.max(0, line - lineDiscount))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="invoice-paper-totals">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Invoice discount</span>
              <strong>{money(discount)}</strong>
            </div>
            <div className="invoice-grand-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <span>Paid</span>
              <strong>{money(paid)}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{money(remaining)}</strong>
            </div>
          </div>

          {invoice.note && (
            <p className="invoice-note">Note: {invoice.note}</p>
          )}
        </div>

        <div className="panel-actions no-print">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            Print / Reprint Invoice
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MANAGER PASSWORD
========================================================= */

function PasswordModal({ onCancel, onConfirm }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="modal-backdrop">
      <section className="panel small-modal">
        <div className="panel-header">
          <div>
            <h3>Manager authorization</h3>
            <p className="panel-description">
              Enter the manager password to edit this completed invoice.
            </p>
          </div>
          <LockKeyhole size={22} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();

            if (password !== "1234") {
              setError("Incorrect password.");
              return;
            }

            onConfirm();
          }}
        >
          <label className="modal-field">
            <span>Manager password</span>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="panel-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button className="primary-button" type="submit">
              <LockKeyhole size={16} />
              Authorize
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* =========================================================
   EDIT INVOICE
========================================================= */

function EditInvoiceModal({ invoice, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => ({
    ...invoice,
    items: (invoice.items || []).map((item) => ({ ...item })),
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [itemDrafts, setItemDrafts] = useState(() =>
    (invoice.items || []).map((item) => ({ qty: String(quantity(item)), price: String(item.price ?? 0), discount: String(item.discount ?? 0) }))
  );
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRecords, setCustomerRecords] = useState([]);

  const inventory = getProducts();
  const subtotal = invoiceSubtotal(draft.items);
  const total = invoiceTotal(draft);
  const paid = Number(draft.paid) || 0;

  const updateField = (field, value) => {
    setDraft((old) => ({ ...old, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setDraft((old) => ({
      ...old,
      items: old.items.map((item, itemIndex) => {
        if (index !== itemIndex) return item;

        const numeric = Number(value);
        const nextValue =
          field === "qty" || field === "quantity"
            ? Math.max(1, Math.floor(numeric || 1))
            : Math.max(0, numeric || 0);

        return {
          ...item,
          [field]: nextValue,
          ...(field === "qty" ? { quantity: nextValue } : {}),
          ...(field === "quantity" ? { qty: nextValue } : {}),
        };
      }),
    }));
  };

  const updateItemDraft = (index, field, value) => {
    setItemDrafts((old) => old.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row));
  };

  const applyItem = (index) => {
    const row = itemDrafts[index];
    const item = draft.items[index];
    if (!row || !item) return;
    const qty = Math.max(1, Math.floor(Number(row.qty) || 1));
    const rawPrice = String(row.price ?? item.price ?? 0).trim().replace(",", ".");
    const numericPrice = rawPrice === "" ? Math.max(0, Number(item.price) || 0) : Number(rawPrice);
    const decimals = (rawPrice.split(".")[1] || "").length;
    const price = !Number.isFinite(numericPrice) || numericPrice < 0 ? Math.max(0, Number(item.price) || 0)
      : numericPrice === 0 ? 0 : (decimals > 4 ? Math.ceil(numericPrice * 100 - 1e-9) : Math.round(numericPrice * 100)) / 100;
    const discount = Math.max(0, Number(String(row.discount ?? 0).replace(",", ".")) || 0);
    setDraft((old) => ({ ...old, items: old.items.map((current, i) => i === index ? { ...current, qty, quantity: qty, price, discount } : current) }));
    setItemDrafts((old) => old.map((current, i) => i === index ? { qty: String(qty), price: price.toFixed(2), discount: discount.toFixed(2) } : current));
    setError("");
  };

  const removeItem = (index) => {
    setDraft((old) => ({ ...old, items: old.items.filter((_, i) => i !== index) }));
    setItemDrafts((old) => old.filter((_, i) => i !== index));
  };

  const openCustomerPicker = () => {
    const records = [];
    const seen = new Set();
    const addRecord = (record) => {
      if (!record || typeof record !== "object") return;
      const name = String(record.name ?? record.customerName ?? record.label ?? "").trim();
      if (!name || name.toLowerCase() === "anonyme") return;
      const id = String(record.customerId ?? record.id ?? record.code ?? record.reference ?? name).trim();
      const key = (id || name).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      records.push({ ...record, name, customerId: id || name, phone: String(record.phone ?? record.phoneNumber ?? record.mobile ?? record.telephone ?? "").trim() });
    };
    ["veltro_customers", "veltro_clients", "veltro_customer_list", "customers", "clients"].forEach((key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        (Array.isArray(parsed) ? parsed : Array.isArray(parsed?.customers) ? parsed.customers : []).forEach(addRecord);
      } catch { /* Ignore unrelated storage values. */ }
    });
    getCompletedSales().forEach((sale) => addRecord({ name: sale.customerName, customerId: sale.customerId, phone: sale.customerPhone ?? sale.phone ?? "", code: sale.customerCode ?? sale.customerReference ?? "" }));
    setCustomerRecords(records.sort((a, b) => a.name.localeCompare(b.name)));
    setCustomerSearch("");
    setCustomerPickerOpen(true);
  };

  const chooseCustomer = (record) => {
    const name = String(record?.name || "Anonyme").trim() || "Anonyme";
    const anonymous = name.toLowerCase() === "anonyme";
    updateField("customerName", anonymous ? "Anonyme" : name);
    updateField("customerId", anonymous ? "" : String(record.customerId ?? record.id ?? name));
    updateField("customerPhone", anonymous ? "" : String(record.phone ?? record.phoneNumber ?? ""));
    updateField("customerCode", anonymous ? "" : String(record.code ?? record.reference ?? ""));
    setCustomerPickerOpen(false);
  };

  const addProduct = (id, mode = "unit") => {
    if (!id) return;

    const product = inventory.find(
      (item) => String(item.id) === String(id)
    );

    if (!product) return;

    // Adding a carton from the product picker creates a separate invoice line,
    // just like the existing Add Carton control in the invoice table.
    if (mode === "carton") {
      const cartonSize = Math.max(1, Math.floor(Number(product.piecesPerCarton) || 1));
      if (cartonSize <= 1) {
        setError("No carton quantity is configured for this product.");
        return;
      }
      const cartonPrice = Math.max(0, Number(product.cartonPrice) || 0);
      const unitPrice = cartonPrice > 0
        ? Math.ceil((cartonPrice / cartonSize) * 100 - 1e-9) / 100
        : Math.max(0, Number(product.price) || 0);
      const cartonLine = {
        ...product,
        id: `${id}-carton-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: String(id),
        qty: cartonSize,
        quantity: cartonSize,
        price: unitPrice,
        discount: 0,
        piecesPerCarton: cartonSize,
        cartonPrice,
        isCartonLine: true,
      };
      setDraft((old) => ({ ...old, items: [...old.items, cartonLine] }));
      setItemDrafts((old) => [...old, { qty: String(cartonSize), price: unitPrice.toFixed(2), discount: "0.00" }]);
      setError("");
      return;
    }

    const existingIndex = draft.items.findIndex(
      (item) =>
        productId(item) === String(product.id) && !item.isCartonLine
    );

    if (existingIndex >= 0) {
      const nextQty = quantity(draft.items[existingIndex]) + 1;
      setDraft((old) => ({ ...old, items: old.items.map((item, index) => index === existingIndex ? { ...item, qty: nextQty, quantity: nextQty } : item) }));
      setItemDrafts((old) => old.map((row, index) => index === existingIndex ? { ...row, qty: String(nextQty) } : row));
      return;
    }

    const newItem = { ...product, id: String(product.id), productId: String(product.id), qty: 1, quantity: 1, price: Math.max(0, Number(product.price) || 0), discount: 0 };
    setDraft((old) => ({ ...old, items: [...old.items, newItem] }));
    setItemDrafts((old) => [...old, { qty: "1", price: String(newItem.price), discount: "0" }]);
  };

  const save = () => {
    if (!draft.items.length) {
      setError("An invoice must contain at least one product.");
      return;
    }

    if (Number(draft.discount) < 0) {
      setError("Invoice discount cannot be negative.");
      return;
    }

    const itemsToSave = draft.items.map((item, index) => {
      const row = itemDrafts[index];
      if (!row) return item;
      const qty = Math.max(1, Math.floor(Number(row.qty) || 1));
      const rawPrice = String(row.price ?? item.price ?? 0).trim().replace(",", ".");
      const numericPrice = rawPrice === "" ? Math.max(0, Number(item.price) || 0) : Number(rawPrice);
      const decimals = (rawPrice.split(".")[1] || "").length;
      const price = !Number.isFinite(numericPrice) || numericPrice < 0
        ? Math.max(0, Number(item.price) || 0)
        : numericPrice === 0 ? 0
          : (decimals > 4 ? Math.ceil(numericPrice * 100 - 1e-9) : Math.round(numericPrice * 100)) / 100;
      const discount = Math.max(0, Number(String(row.discount ?? 0).replace(",", ".")) || 0);
      return { ...item, qty, quantity: qty, price, discount };
    });
    const savedSubtotal = invoiceSubtotal(itemsToSave);
    const savedTotal = Math.max(0, savedSubtotal - (Number(draft.discount) || 0));

    if (paid < 0) {
      setError("Paid amount cannot be negative.");
      return;
    }

    if (paid > savedTotal) {
      setError("The paid amount cannot exceed the invoice total.");
      return;
    }

    setSaving(true);
    setError("");

    let result;

    try {
      result = onSave({
        ...draft,
        items: itemsToSave,
        subtotal: savedSubtotal,
        total: savedTotal,
        paid,
        remaining: Math.max(0, savedTotal - paid),
      });
    } catch {
      result = { ok: false, error: "UNKNOWN_ERROR" };
    }

    setSaving(false);

    if (!result?.ok) {
      const messages = {
        EMPTY_INVOICE: "An invoice must contain products.",
        PRODUCT_NOT_FOUND: "A product in this invoice no longer exists.",
        INSUFFICIENT_STOCK:
          `${result.productName || "Product"}: requested ${result.requested}, available ${result.available}.`,
        STOCK_SAVE_FAILED:
          "Could not update inventory. No edit was saved.",
        SALE_SAVE_FAILED:
          "Could not save the edited invoice. Inventory rollback was attempted.",
        INVOICE_NOT_FOUND: "This invoice could not be found.",
        INVALID_INVOICE: "The invoice data is invalid.",
      };

      setError(
        messages[result?.error] || "The invoice could not be saved."
      );
    }
  };

  return (
    <div className="modal-backdrop edit-invoice-backdrop">
      <section className="panel edit-invoice-modal">
        <div className="panel-header">
          <div>
            <h3>Edit {invoice.invoiceNumber || invoice.id}</h3>
            <p className="panel-description">
              Inventory will be adjusted when the edit is saved.
            </p>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="edit-invoice-fields">
          <div className="modal-field edit-customer-field">
            <span>Customer</span>
            <div className="edit-customer-control">
              <input value={draft.customerName || ""} onChange={(event) => {
                updateField("customerName", event.target.value);
                updateField("customerId", "");
              }} />
              <button className="secondary-button edit-change-customer-button" type="button" onClick={openCustomerPicker}>
                <UserRound size={15} /> Change customer
              </button>
            </div>
          </div>

          <label className="modal-field">
            <span>Amount paid (DA)</span>
            <input
              type="number"
              min="0"
              value={draft.paid ?? 0}
              onChange={(event) =>
                updateField("paid", Number(event.target.value))
              }
            />
          </label>

          <label className="modal-field">
            <span>Invoice discount (DA)</span>
            <input
              type="number"
              min="0"
              value={draft.discount ?? 0}
              onChange={(event) =>
                updateField("discount", Number(event.target.value))
              }
            />
          </label>
        </div>

        <div className="edit-products-heading">
          <h4>Invoice items</h4>

          <button
            className="edit-add-product-button"
            type="button"
            onClick={() => setProductPickerOpen(true)}
          >
            <Plus size={16} />
            Add another product
          </button>
        </div>

        <div className="table-wrapper sales-history-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>QTY</th>
                <th>PRICE</th>
                <th>LINE DISCOUNT</th>
                <th>PRODUCT TOTAL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {draft.items.map((item, index) => {
                const row = itemDrafts[index] || { qty: String(quantity(item)), price: String(item.price ?? 0), discount: String(item.discount ?? 0) };
                const previewQty = Math.max(1, Math.floor(Number(row.qty) || 1));
                const previewPrice = Math.max(0, Number(String(row.price).replace(",", ".")) || 0);
                const previewDiscount = Math.max(0, Number(String(row.discount).replace(",", ".")) || 0);
                const lineTotal = Math.max(0, previewQty * previewPrice - previewDiscount);
                return (
                  <tr key={`${item.id || productId(item)}-${index}`}>
                    <td className="edit-invoice-product-cell">
                      <strong>{item.name || "Product"}</strong>

                    </td>
                    <td><input className="edit-number-input" type="number" min="1" step="1" value={row.qty} onChange={(event) => updateItemDraft(index, "qty", event.target.value)} /></td>
                    <td><input className="edit-number-input" type="text" inputMode="decimal" autoComplete="off" value={row.price} onChange={(event) => updateItemDraft(index, "price", event.target.value.replace(/[^0-9.,]/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") applyItem(index); }} /></td>
                    <td><input className="edit-number-input" type="number" min="0" step="0.01" value={row.discount} onChange={(event) => updateItemDraft(index, "discount", event.target.value)} /></td>
                    <td className="edit-product-line-total">{money(lineTotal)}</td>
                    <td><div className="edit-item-actions">
                      <button className="edit-apply-item-button" type="button" onClick={() => applyItem(index)}><Check size={14} /> Apply</button>
                      <button className="icon-button danger-icon" type="button" onClick={() => removeItem(index)} aria-label={`Remove ${item.name || "product"}`}><Trash2 size={17} /></button>
                    </div></td>
                  </tr>
                );
              })}
              {draft.items.length === 0 && <tr><td colSpan={6} className="empty-state">No products in this invoice.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="edit-totals">
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>Invoice discount</span>
            <strong>{money(draft.discount)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{money(Math.max(0, total - paid))}</strong>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="panel-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            type="button"
            disabled={saving}
            onClick={save}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save invoice changes"}
          </button>
        </div>
      </section>

      {productPickerOpen && <EditInvoiceProductPicker onSelect={addProduct} onClose={() => setProductPickerOpen(false)} />}

      {customerPickerOpen && (
        <div className="edit-customer-picker-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCustomerPickerOpen(false); }}>
          <section className="panel edit-customer-picker-modal" role="dialog" aria-modal="true" aria-label="Choose customer">
            <div className="panel-header"><div><h3>Change customer</h3><p className="panel-description">Choose a saved customer or keep this invoice anonymous.</p></div><button className="icon-button" type="button" onClick={() => setCustomerPickerOpen(false)} aria-label="Close customer list"><X size={19} /></button></div>
            <input className="edit-customer-search" type="search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Search customer name, phone or reference..." autoComplete="off" />
            <div className="edit-customer-list">
              <button type="button" className="edit-customer-option" onClick={() => chooseCustomer({ name: "Anonyme" })}><span><strong>Anonyme</strong><small>Walk-in customer · no customer account</small></span><Check size={16} /></button>
              {customerRecords.filter((record) => [record.name, record.phone, record.customerId, record.code, record.reference].some((value) => String(value ?? "").toLowerCase().includes(customerSearch.trim().toLowerCase()))).map((record) => (
                <button type="button" className="edit-customer-option" key={record.customerId} onClick={() => chooseCustomer(record)}><span><strong>{record.name}</strong><small>{record.phone || record.code || record.customerId}</small></span><UserRound size={16} /></button>
              ))}
              {customerRecords.filter((record) => [record.name, record.phone, record.customerId, record.code, record.reference].some((value) => String(value ?? "").toLowerCase().includes(customerSearch.trim().toLowerCase()))).length === 0 && <p className="edit-customer-empty">No saved customers found. You can still type a customer name directly in the invoice.</p>}
            </div>
            <div className="panel-actions"><button className="secondary-button" type="button" onClick={() => setCustomerPickerOpen(false)}>Cancel</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SALES HISTORY PAGE
========================================================= */

export default function SalesHistory() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printRequest, setPrintRequest] = useState(0);
  const [passwordInvoice, setPasswordInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [notice, setNotice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const invoices = useMemo(
    () =>
      getCompletedSales()
        .slice()
        .sort(
          (a, b) =>
            new Date(invoiceDate(b)).getTime() -
            new Date(invoiceDate(a)).getTime()
        ),
    [refreshKey]
  );

  const customers = useMemo(
    () =>
      [
        ...new Set(
          invoices.map((invoice) => invoice.customerName).filter(Boolean)
        ),
      ].sort(),
    [invoices]
  );

  const employees = useMemo(
    () => [...new Set(invoices.map(employeeName).filter(Boolean))].sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    if (!appliedFilters) return [];

    const filters = appliedFilters;
    const query = filters.search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const dateValue = invoiceDate(invoice);
      const date = dateValue ? new Date(dateValue) : null;
      const validDate = date && !Number.isNaN(date.getTime());

      const matchesSearch =
        !query ||
        String(invoice.invoiceNumber || "").toLowerCase().includes(query) ||
        String(invoice.id || "").toLowerCase().includes(query) ||
        String(invoice.customerName || "").toLowerCase().includes(query) ||
        String(employeeName(invoice)).toLowerCase().includes(query);

      const dateOnly = validDate
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : "";

      const timeOnly = validDate
        ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
        : "";

      return (
        matchesSearch &&
        (!filters.startDate || (dateOnly && dateOnly >= filters.startDate)) &&
        (!filters.endDate || (dateOnly && dateOnly <= filters.endDate)) &&
        (!filters.startTime || (timeOnly && timeOnly >= filters.startTime)) &&
        (!filters.endTime || (timeOnly && timeOnly <= filters.endTime)) &&
        (!filters.customerFilter ||
          (invoice.customerName || "") === filters.customerFilter) &&
        (!filters.employeeFilter || employeeName(invoice) === filters.employeeFilter)
      );
    });
  }, [invoices, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visibleInvoices = filteredInvoices.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const totalSales = filteredInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total ?? invoiceTotal(invoice)),
    0
  );

  const applySearch = () => {
    const filters = {
      search,
      startDate,
      endDate,
      startTime,
      endTime,
      customerFilter,
      employeeFilter,
    };

    const hasSearchInfo = Object.values(filters).some((value) =>
      String(value ?? "").trim() !== ""
    );

    if (!hasSearchInfo) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      filters.startDate = today;
      filters.endDate = today;
      setStartDate(today);
      setEndDate(today);
    }

    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setCustomerFilter("");
    setEmployeeFilter("");
    setAppliedFilters(null);
    setCurrentPage(1);
  };

  const exportCsv = () => {
    const rows = [
      [
        "Invoice",
        "Customer",
        "Employee",
        "Date",
        "Time",
        "Total DA",
        "Paid DA",
        "Remaining DA",
      ],
      ...filteredInvoices.map((invoice) => {
        const date = new Date(invoiceDate(invoice));
        const total = Number(invoice.total ?? invoiceTotal(invoice));
        const paid = Number(invoice.paid) || 0;

        return [
          invoice.invoiceNumber || invoice.id,
          customerName(invoice),
          employeeName(invoice) || "Not recorded",
          Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(),
          Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(),
          total,
          paid,
          Math.max(0, total - paid),
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "veltro-sales-history.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const saveEdit = (draft) => {
    const result = editCompletedSale(
      editingInvoice.id ||
        editingInvoice.invoiceId ||
        editingInvoice.invoiceNumber,
      draft
    );

    if (result?.ok) {
      setEditingInvoice(null);
      setPasswordInvoice(null);
      setSelectedInvoice(result.sale);
      setRefreshKey((key) => key + 1);
      setNotice("Invoice updated and inventory adjusted successfully.");
    }

    return result;
  };

  const printInvoiceFromTable = (invoice) => {
    setSelectedInvoice(invoice);
    setPrintRequest((request) => request + 1);
  };

  const deleteInvoiceFromTable = (invoice) => {
    const number = invoice.invoiceNumber || invoice.id || "this invoice";
    if (!window.confirm(`Delete sale ${number}? Sold quantities will be returned to stock.`)) {
      return;
    }

    const result = deleteCompletedSale(
      invoice.id || invoice.invoiceId || invoice.invoiceNumber
    );

    if (result?.ok) {
      setRefreshKey((key) => key + 1);
      setNotice("Sale deleted and stock quantities restored successfully.");
    } else {
      setNotice(
        result?.error === "STOCK_SAVE_FAILED"
          ? "Could not save the restored stock. The sale was not deleted."
          : result?.error === "SALE_SAVE_FAILED"
          ? "Could not delete the sale. Please try again."
          : "Could not find this sale."
      );
    }
  };

  return (
    <div className="history-page">
      <div className="section-heading">
        <div>
          <h2>Sales History</h2>
          <p>
            Search completed invoices, inspect details, print or edit a sale.
          </p>
        </div>

        <div className="panel-actions history-toolbar-actions">
          <button
            className="secondary-button history-export-button"
            type="button"
            onClick={exportCsv}
          >
            <Download size={17} />
            Export CSV
          </button>

          <button
            className="secondary-button history-refresh-button"
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="pos-message pos-message-success" role="status">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          title="Total Sales"
          value={money(totalSales)}
          icon={Wallet}
          subtitle="Based on filtered invoices"
        />
        <StatCard
          title="Invoices"
          value={String(filteredInvoices.length)}
          icon={FileText}
          subtitle="Completed sales"
        />
        <StatCard
          title="Customers"
          value={String(
            new Set(
              filteredInvoices.map((invoice) => invoice.customerName || "")
            ).size
          )}
          icon={Users}
          subtitle="In the current results"
        />
        <StatCard
          title="Unpaid Balance"
          value={money(
            filteredInvoices.reduce(
              (sum, invoice) =>
                sum +
                Math.max(
                  0,
                  Number(invoice.total ?? invoiceTotal(invoice)) -
                    (Number(invoice.paid) || 0)
                ),
              0
            )
          )}
          icon={Clock}
          subtitle="Remaining invoice balances"
        />
      </div>

      <section className="panel products-panel">
        <div className="panel-header">
          <div>
            <h3>Filter invoices</h3>
            <p className="panel-description">
              Select a date range, time range, customer or employee.
            </p>
          </div>

          <button
            className="secondary-button history-reset-button"
            type="button"
            onClick={resetFilters}
          >
            <RefreshCw size={17} />
            Reset filters
          </button>
        </div>

        <div className="history-filters history-filters-extended">
          <label className="search-box history-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Invoice number, customer or employee..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Calendar size={15} /> Start date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Calendar size={15} /> End date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Clock size={15} /> Start time
            </span>
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Clock size={15} /> End time
            </span>
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Users size={15} /> Customer
            </span>
            <select
              value={customerFilter}
              onChange={(event) => setCustomerFilter(event.target.value)}
            >
              <option value="">All customers</option>
              {customers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          </label>

          <label className="history-filter-field">
            <span>
              <Users size={15} /> Employee
            </span>
            <select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((employee) => (
                <option key={employee} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="history-search-actions">
          <button
            className="primary-button"
            type="button"
            onClick={applySearch}
          >
            <Search size={16} />
            Search
          </button>
        </div>

        <div className="table-wrapper sales-history-main-table">
          <table className="products-table">
            <thead>
              <tr>
                <th>INVOICE</th>
                <th>CUSTOMER</th>
                <th>EMPLOYEE</th>
                <th>DATE &amp; TIME</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>REMAINING</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {visibleInvoices.map((invoice, index) => {
                const date = new Date(invoiceDate(invoice));
                const total = Number(
                  invoice.total ?? invoiceTotal(invoice)
                );
                const paid = Number(invoice.paid) || 0;

                return (
                  <tr key={invoiceIdentity(invoice) || index}>
                    <td>
                      <strong>
                        {invoice.invoiceNumber || invoice.id || "Invoice"}
                      </strong>
                    </td>
                    <td>{customerName(invoice)}</td>
                    <td>{employeeName(invoice) || "Not recorded"}</td>
                    <td>
                      {Number.isNaN(date.getTime()) ? (
                        "—"
                      ) : (
                        <>
                          <div>{date.toLocaleDateString()}</div>
                          <small>{date.toLocaleTimeString()}</small>
                        </>
                      )}
                    </td>
                    <td className="price-cell">{money(total)}</td>
                    <td>{money(paid)}</td>
                    <td>{money(Math.max(0, total - paid))}</td>
                    <td>
                      <div className="history-row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          title="View invoice"
                          aria-label="View invoice"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className="icon-button"
                          type="button"
                          title="Print or reprint invoice"
                          aria-label="Print invoice"
                          onClick={() => printInvoiceFromTable(invoice)}
                        >
                          <Printer size={17} />
                        </button>

                        <button
                          className="icon-button"
                          type="button"
                          title="Edit invoice"
                          aria-label="Edit invoice"
                          onClick={() => setPasswordInvoice(invoice)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="history-delete-button"
                          type="button"
                          title="Delete this sale and restore its quantities to stock"
                          aria-label={`Delete sale ${invoice.invoiceNumber || invoice.id || ""}`}
                          onClick={() => deleteInvoiceFromTable(invoice)}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {visibleInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="history-empty">
                      <div className="placeholder-icon">
                        <History size={30} />
                      </div>
                      <strong>
                        {!appliedFilters
                          ? "Press Search to display sales records."
                          : invoices.length
                          ? "No matching invoices"
                          : "No completed sales yet"}
                      </strong>
                      <p>
                        {!appliedFilters
                          ? "Enter filters if needed, then press Search. With no filters, only today's sales are shown."
                          : invoices.length
                          ? "Try changing your filters."
                          : "Completed invoices from Point of Sale will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer sales-history-pagination">
          <span>
            {filteredInvoices.length
              ? `Showing ${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filteredInvoices.length)} of ${filteredInvoices.length} filtered invoices (${invoices.length} total)`
              : `Showing 0 of 0 filtered invoices (${invoices.length} total)`}
          </span>
          <div className="sales-history-page-controls" aria-label="Sales history pages">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safePage <= 1}>Previous</button>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - safePage) <= 1)
              .reduce((items, page, index, pages) => {
                if (index > 0 && page - pages[index - 1] > 1) items.push(`ellipsis-${page}`);
                items.push(page);
                return items;
              }, [])
              .map((page) => typeof page === "number" ? (
                <button type="button" key={page} className={page === safePage ? "active" : ""} aria-current={page === safePage ? "page" : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
              ) : <span className="sales-history-page-ellipsis" key={page}>…</span>)}
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safePage >= totalPages}>Next</button>
          </div>
        </div>
      </section>

      {selectedInvoice && (
        <InvoicePrint
          invoice={selectedInvoice}
          printRequest={printRequest}
          onClose={() => {
            setSelectedInvoice(null);
            setPrintRequest(0);
          }}
        />
      )}

      {passwordInvoice && (
        <PasswordModal
          onCancel={() => setPasswordInvoice(null)}
          onConfirm={() => {
            setEditingInvoice(passwordInvoice);
            setPasswordInvoice(null);
          }}
        />
      )}

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onCancel={() => setEditingInvoice(null)}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}
