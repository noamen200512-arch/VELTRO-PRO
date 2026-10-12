import React, { useMemo, useState } from "react";
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
} from "lucide-react";

import { getProducts } from "../productStore.js";
import {
  getCompletedSales,
  editCompletedSale,
} from "./salesStore.js";

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
                  const line = quantity(item) * (Number(item.price) || 0);
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

  const removeItem = (index) => {
    setDraft((old) => ({
      ...old,
      items: old.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addProduct = (id) => {
    if (!id) return;

    const product = inventory.find(
      (item) => String(item.id) === String(id)
    );

    if (!product) return;

    const existingIndex = draft.items.findIndex(
      (item) =>
        productId(item) === String(product.id) && !item.isCartonLine
    );

    if (existingIndex >= 0) {
      setDraft((old) => ({
        ...old,
        items: old.items.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                qty: quantity(item) + 1,
                quantity: quantity(item) + 1,
              }
            : item
        ),
      }));
      return;
    }

    setDraft((old) => ({
      ...old,
      items: [
        ...old.items,
        {
          ...product,
          id: String(product.id),
          productId: String(product.id),
          qty: 1,
          quantity: 1,
          price: Math.max(0, Number(product.price) || 0),
          discount: 0,
        },
      ],
    }));
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

    if (paid < 0) {
      setError("Paid amount cannot be negative.");
      return;
    }

    if (paid > total) {
      setError("The paid amount cannot exceed the invoice total.");
      return;
    }

    setSaving(true);
    setError("");

    let result;

    try {
      result = onSave({
        ...draft,
        subtotal,
        total,
        paid,
        remaining: Math.max(0, total - paid),
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

      setError(messages[result?.error] || "The invoice could not be saved.");
    }
  };

  return (
    <div className="modal-backdrop">
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
          <label className="modal-field">
            <span>Customer name</span>
            <input
              value={draft.customerName || ""}
              onChange={(event) =>
                updateField("customerName", event.target.value)
              }
            />
          </label>

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

          <label className="add-product-select">
            <Plus size={16} />
            <select
              defaultValue=""
              onChange={(event) => {
                addProduct(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Add product...</option>
              {inventory.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>QTY</th>
                <th>PRICE</th>
                <th>LINE DISCOUNT</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {draft.items.map((item, index) => (
                <tr key={`${productId(item)}-${index}`}>
                  <td>{item.name || "Product"}</td>

                  <td>
                    <input
                      className="edit-number-input"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity(item)}
                      onChange={(event) =>
                        updateItem(index, "qty", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="edit-number-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={Number(item.price) || 0}
                      onChange={(event) =>
                        updateItem(index, "price", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="edit-number-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={Number(item.discount) || 0}
                      onChange={(event) =>
                        updateItem(index, "discount", event.target.value)
                      }
                    />
                  </td>

                  <td>
                    <button
                      className="icon-button danger-icon"
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={`Remove ${item.name || "product"}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {draft.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No products in this invoice.
                  </td>
                </tr>
              )}
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

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printRequest, setPrintRequest] = useState(0);
  const [passwordInvoice, setPasswordInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [notice, setNotice] = useState("");

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
      [...new Set(invoices.map((invoice) => invoice.customerName).filter(Boolean))].sort(),
    [invoices]
  );

  const employees = useMemo(
    () => [...new Set(invoices.map(employeeName).filter(Boolean))].sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

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
        (!startDate || (dateOnly && dateOnly >= startDate)) &&
        (!endDate || (dateOnly && dateOnly <= endDate)) &&
        (!startTime || (timeOnly && timeOnly >= startTime)) &&
        (!endTime || (timeOnly && timeOnly <= endTime)) &&
        (!customerFilter || (invoice.customerName || "") === customerFilter) &&
        (!employeeFilter || employeeName(invoice) === employeeFilter)
      );
    });
  }, [
    invoices,
    search,
    startDate,
    endDate,
    startTime,
    endTime,
    customerFilter,
    employeeFilter,
  ]);

  const totalSales = filteredInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total ?? invoiceTotal(invoice)),
    0
  );

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setCustomerFilter("");
    setEmployeeFilter("");
  };

  const exportCsv = () => {
    const rows = [
      ["Invoice", "Customer", "Employee", "Date", "Time", "Total DA", "Paid DA", "Remaining DA"],
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

  return (
    <div className="history-page">
      <div className="section-heading">
        <div>
          <h2>Sales History</h2>
          <p>Search completed invoices, inspect details, print or edit a sale.</p>
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
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
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
          value={String(new Set(filteredInvoices.map((invoice) => invoice.customerName || "")).size)}
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
            <span><Calendar size={15} /> Start date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>

          <label className="history-filter-field">
            <span><Calendar size={15} /> End date</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>

          <label className="history-filter-field">
            <span><Clock size={15} /> Start time</span>
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          </label>

          <label className="history-filter-field">
            <span><Clock size={15} /> End time</span>
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </label>

          <label className="history-filter-field">
            <span><Users size={15} /> Customer</span>
            <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
              <option value="">All customers</option>
              {customers.map((customer) => <option key={customer} value={customer}>{customer}</option>)}
            </select>
          </label>

          <label className="history-filter-field">
            <span><Users size={15} /> Employee</span>
            <select value={employeeFilter} onChange={(event) => setEmployeeFilter(event.target.value)}>
              <option value="">All employees</option>
              {employees.map((employee) => <option key={employee} value={employee}>{employee}</option>)}
            </select>
          </label>
        </div>

        <div className="table-wrapper">
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
              {filteredInvoices.map((invoice, index) => {
                const date = new Date(invoiceDate(invoice));
                const total = Number(invoice.total ?? invoiceTotal(invoice));
                const paid = Number(invoice.paid) || 0;

                return (
                  <tr key={invoiceIdentity(invoice) || index}>
                    <td><strong>{invoice.invoiceNumber || invoice.id || "Invoice"}</strong></td>
                    <td>{customerName(invoice)}</td>
                    <td>{employeeName(invoice) || "Not recorded"}</td>
                    <td>
                      {Number.isNaN(date.getTime()) ? "—" : (
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
                        <button className="icon-button" type="button" title="View invoice" aria-label="View invoice" onClick={() => setSelectedInvoice(invoice)}>
                          <Eye size={17} />
                        </button>
                        <button className="icon-button" type="button" title="Print or reprint invoice" aria-label="Print invoice" onClick={() => printInvoiceFromTable(invoice)}>
                          <Printer size={17} />
                        </button>
                        <button className="icon-button" type="button" title="Edit invoice" aria-label="Edit invoice" onClick={() => setPasswordInvoice(invoice)}>
                          <Pencil size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <div className="history-empty">
                      <div className="placeholder-icon"><History size={30} /></div>
                      <strong>{invoices.length ? "No matching invoices" : "No completed sales yet"}</strong>
                      <p>
                        {invoices.length
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

        <div className="table-footer">
          <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
          <span className="muted-cell">Sales History</span>
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
