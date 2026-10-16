import React, { useEffect, useMemo, useState } from "react";
import { Search, Wallet, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getPurchaseSuppliers,
  getPurchaseInvoices,
} from "../purchases/purchaseService.js";
import "./suppliers.css";

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const money = (value) =>
  `${Number(value || 0).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", {
    maximumFractionDigits: 2,
  })} DA`;

function readData() {
  try {
    return {
      suppliers: getPurchaseSuppliers(),
      invoices: getPurchaseInvoices(),
      error: "",
    };
  } catch {
    return {
      suppliers: [],
      invoices: [],
      error: "Could not load supplier financial data.",
    };
  }
}

function getRemaining(invoice) {
  if (invoice.remaining !== undefined && invoice.remaining !== null) {
    return Math.max(0, Number(invoice.remaining) || 0);
  }

  return Math.max(
    0,
    (Number(invoice.total) || 0) - (Number(invoice.paid) || 0)
  );
}

export default function SupplierDebts() {
  const [data, setData] = useState(readData);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const refresh = () => setData(readData());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("veltro:cloud-sync", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("veltro:cloud-sync", refresh);
    };
  }, []);

  const rows = useMemo(() => {
    const query = normalize(search);

    return data.suppliers
      .map((supplier) => {
        const invoices = data.invoices.filter(
          (invoice) =>
            (String(invoice.supplierId || "") && String(invoice.supplierId) === String(supplier.id)) ||
            normalize(invoice.supplier) === normalize(supplier.name)
        );

        const invoiceDebt = invoices.reduce(
          (sum, invoice) => sum + getRemaining(invoice),
          0
        );

        const storedDebt = Math.max(0, Number(supplier.debt) || 0);

        return {
          supplier,
          invoices,
          invoiceDebt,
          debt: invoiceDebt > 0 ? invoiceDebt : storedDebt,
        };
      })
      .filter(({ supplier, invoices, debt }) => {
        const matches =
          normalize(supplier.name).includes(query) ||
          normalize(supplier.phone).includes(query) ||
          normalize(supplier.reference || supplier.id).includes(query);

        return matches && (showAll || debt > 0 || invoices.length > 0);
      })
      .sort((a, b) => b.debt - a.debt);
  }, [data, search, showAll]);

  const totalDebt = rows.reduce((sum, row) => sum + row.debt, 0);
  const totalInvoices = rows.reduce(
    (sum, row) => sum + row.invoices.length,
    0
  );

  return (
    <div className="supplier-layout">
      <header className="supplier-page-header">
        <div>
          <span className="supplier-eyebrow">COMMERCE / SUPPLIERS</span>
          <h1>Supplier Debts</h1>
          <p>Review outstanding supplier balances and purchase invoices.</p>
        </div>
      </header>

      {data.error && (
        <div className="supplier-notice error">
          <AlertTriangle size={17} />
          <span>{data.error}</span>
        </div>
      )}

      <div className="supplier-stats-grid supplier-debt-stats">
        <article className="supplier-stat-card">
          <div className="supplier-stat-top">
            <span>Total outstanding</span>
            <span className="supplier-stat-icon" style={{ "--stat-color": "#ffbd72" }}>
              <Wallet size={20} />
            </span>
          </div>
          <strong className="supplier-stat-value">{money(totalDebt)}</strong>
          <small>Outstanding balance shown for the listed suppliers</small>
        </article>

        <article className="supplier-stat-card">
          <div className="supplier-stat-top">
            <span>Suppliers with records</span>
            <span className="supplier-stat-icon" style={{ "--stat-color": "#35d6c2" }}>
              <FileText size={20} />
            </span>
          </div>
          <strong className="supplier-stat-value">{rows.length}</strong>
          <small>Suppliers matching the current filter</small>
        </article>

        <article className="supplier-stat-card">
          <div className="supplier-stat-top">
            <span>Purchase invoices</span>
            <span className="supplier-stat-icon" style={{ "--stat-color": "#78b8ff" }}>
              <FileText size={20} />
            </span>
          </div>
          <strong className="supplier-stat-value">{totalInvoices}</strong>
          <small>Invoices linked by supplier name</small>
        </article>
      </div>

      <section className="supplier-panel">
        <div className="supplier-panel-heading">
          <div>
            <h3>Supplier balances</h3>
            <p>Search by supplier ID, name or phone. Invoices are linked by supplier ID when available.</p>
          </div>
        </div>

        <label className="supplier-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search supplier ID, name or phone..."
          />
        </label>

        <div style={{ padding: "0 22px 16px" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 9, color: "#aab8cb", fontSize: 12 }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
            />
            Show all suppliers, including settled accounts
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="supplier-empty-state">
            <div className="supplier-empty-icon">
              <CheckCircle2 size={30} />
            </div>
            <h3>No supplier debts found</h3>
            <p>
              No outstanding balances match your search. You can enable
              “Show all suppliers” to see settled accounts too.
            </p>
          </div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Invoices</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ supplier, invoices, debt }) => (
                  <tr key={supplier.id || supplier.name}>
                    <td><strong>{supplier.reference || supplier.id || "—"}</strong></td>
                    <td><strong>{supplier.name}</strong></td>
                    <td>{supplier.phone || "No phone number"}</td>
                    <td>{invoices.length}</td>
                    <td>
                      <strong className={debt > 0 ? "supplier-debt-text" : ""}>
                        {money(debt)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`supplier-status ${
                          debt > 0 ? "is-unpaid" : "is-paid"
                        }`}
                      >
                        {debt > 0 ? "Outstanding" : "Settled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="supplier-footer-note">
        <AlertTriangle size={16} />
        <span>
          This page currently displays balances from saved purchase invoices
          and supplier records. Payment entry and payment history will be added
          separately after verifying the existing purchase-payment workflow.
        </span>
      </div>
    </div>
  );
}