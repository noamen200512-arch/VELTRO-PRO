import React, { useMemo, useState } from "react";

export default function PurchaseHistory({
invoices = [],
onPreview,
onPrint,
onEdit,
onDelete,
}) {
const [search, setSearch] = useState("");
const [status, setStatus] = useState("all");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");

const formatMoney = (value) =>
new Intl.NumberFormat("fr-DZ", {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
}).format(Number(value) || 0) + " DA";

const filteredInvoices = useMemo(() => {
const query = search.trim().toLowerCase();

return invoices.filter((invoice) => {
  const invoiceNumber = String(
    invoice.invoiceNumber || invoice.id || ""
  ).toLowerCase();

  const supplierName = String(
    invoice.supplierName || invoice.supplier?.name || ""
  ).toLowerCase();

  const matchesSearch =
    !query ||
    invoiceNumber.includes(query) ||
    supplierName.includes(query);

  const remaining = Number(invoice.remaining) || 0;
  const total = Number(invoice.total) || 0;

  const invoiceStatus =
    invoice.status ||
    (remaining <= 0 ? "paid" : Number(invoice.amountPaid) > 0 ? "partial" : "unpaid");

  const matchesStatus =
    status === "all" || invoiceStatus === status;

  const date = String(invoice.date || "").slice(0, 10);

  const matchesFrom = !dateFrom || date >= dateFrom;
  const matchesTo = !dateTo || date <= dateTo;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesFrom &&
    matchesTo &&
    total >= 0
  );
});

}, [invoices, search, status, dateFrom, dateTo]);

const totals = useMemo(
() =>
filteredInvoices.reduce(
(result, invoice) => ({
purchaseValue: result.purchaseValue + (Number(invoice.total) || 0),
paid: result.paid + (Number(invoice.amountPaid) || 0),
remaining: result.remaining + (Number(invoice.remaining) || 0),
}),
{ purchaseValue: 0, paid: 0, remaining: 0 }
),
[filteredInvoices]
);

const getStatus = (invoice) => {
if (invoice.status) return invoice.status;

const remaining = Number(invoice.remaining) || 0;
const paid = Number(invoice.amountPaid) || 0;

if (remaining <= 0) return "paid";
if (paid > 0) return "partial";
return "unpaid";

};

const statusLabel = {
paid: "Paid",
partial: "Partially paid",
unpaid: "Unpaid",
};

const handleDelete = (invoice) => {
const number = invoice.invoiceNumber || invoice.id || "this invoice";

if (
  typeof onDelete === "function" &&
  window.confirm(`Delete ${number}? This action may not be reversible.`)
) {
  onDelete(invoice);
}

};

return (
<section className="purchase-history">
<header className="purchase-history-header">
<div>
<span className="purchase-eyebrow">RECORDS & PAYMENTS</span>
<h2>Purchase History</h2>
<p>Review invoices, payments, and outstanding balances.</p>
</div>

    <div className="purchase-history-count">
      {filteredInvoices.length} invoices
    </div>
  </header>

  <div className="purchase-history-stats">
    <article className="purchase-history-stat">
      <span>Purchase Value</span>
      <strong>{formatMoney(totals.purchaseValue)}</strong>
    </article>

    <article className="purchase-history-stat">
      <span>Amount Paid</span>
      <strong>{formatMoney(totals.paid)}</strong>
    </article>

    <article className="purchase-history-stat">
      <span>Remaining Balance</span>
      <strong>{formatMoney(totals.remaining)}</strong>
    </article>
  </div>

  <div className="purchase-history-filters">
    <label className="purchase-field purchase-history-search">
      <span>Search</span>
      <input
        type="search"
        placeholder="Invoice number or supplier..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </label>

    <label className="purchase-field">
      <span>Payment status</span>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="paid">Paid</option>
        <option value="partial">Partially paid</option>
        <option value="unpaid">Unpaid</option>
      </select>
    </label>

    <label className="purchase-field">
      <span>From</span>
      <input
        type="date"
        value={dateFrom}
        onChange={(event) => setDateFrom(event.target.value)}
      />
    </label>

    <label className="purchase-field">
      <span>To</span>
      <input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(event) => setDateTo(event.target.value)}
      />
    </label>
  </div>

  <div className="purchase-history-table-wrapper">
    <table className="purchase-history-table">
      <thead>
        <tr>
          <th>Invoice</th>
          <th>Date</th>
          <th>Supplier</th>
          <th>Purchase Value</th>
          <th>Amount Paid</th>
          <th>Remaining</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {filteredInvoices.length === 0 ? (
          <tr>
            <td colSpan={8} className="purchase-history-empty">
              <span className="purchase-history-empty-icon">▤</span>
              <strong>No purchase invoices found</strong>
              <small>
                Invoices will appear here when purchase records are connected.
              </small>
            </td>
          </tr>
        ) : (
          filteredInvoices.map((invoice) => {
            const invoiceId = invoice.id || invoice.invoiceNumber;
            const invoiceStatus = getStatus(invoice);

            return (
              <tr key={invoiceId}>
                <td>
                  <strong>
                    {invoice.invoiceNumber || invoice.id || "—"}
                  </strong>
                </td>

                <td>{invoice.date || "—"}</td>

                <td>
                  {invoice.supplierName ||
                    invoice.supplier?.name ||
                    "—"}
                </td>

                <td>{formatMoney(invoice.total)}</td>

                <td>{formatMoney(invoice.amountPaid)}</td>

                <td className="purchase-history-balance">
                  {formatMoney(invoice.remaining)}
                </td>

                <td>
                  <span
                    className={`purchase-payment-status ${invoiceStatus}`}
                  >
                    {statusLabel[invoiceStatus] || invoiceStatus}
                  </span>
                </td>

                <td>
                  <div className="purchase-history-actions">
                    <button
                      type="button"
                      title="Preview invoice"
                      aria-label="Preview invoice"
                      onClick={() => onPreview?.(invoice)}
                    >
                      View
                    </button>

                    <button
                      type="button"
                      title="Print invoice"
                      aria-label="Print invoice"
                      onClick={() => onPrint?.(invoice)}
                    >
                      Print
                    </button>

                    <button
                      type="button"
                      title="Edit invoice"
                      aria-label="Edit invoice"
                      onClick={() => onEdit?.(invoice)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="purchase-history-delete"
                      title="Delete invoice"
                      aria-label="Delete invoice"
                      onClick={() => handleDelete(invoice)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>

  <footer className="purchase-history-footer">
    Showing {filteredInvoices.length} of {invoices.length} invoices
  </footer>
</section>

);
}