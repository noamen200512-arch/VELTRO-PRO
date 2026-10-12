import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Bell,
  Search,
  History,
  ReceiptText,
  CreditCard,
  Boxes,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Calendar,
  Clock,
  RefreshCw,
  FileText,
  Printer,
  Pencil,
  Eye,
  LockKeyhole,
  Plus,
  Trash2,
  Save,
  Download,
} from "lucide-react";

import POS from "./POS";
import Products from "./Products.jsx";
import { getProducts } from "./productStore.js";
import {
  getCompletedSales,
  editCompletedSale,
} from "./sales/salesStore.js";

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
  return (
    invoice.completedAt ||
    invoice.createdAt ||
    invoice.updatedAt ||
    ""
  );
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
    invoice.id ||
      invoice.invoiceId ||
      invoice.invoiceNumber ||
      ""
  );
}

/* =========================================================
   INVOICE MODAL AND PRINT STYLES
========================================================= */

function InvoiceInterfaceStyles() {
  useEffect(() => {
    const style = document.createElement("style");

    style.setAttribute("data-veltro-invoice-interface", "true");

    style.textContent = `
      .invoice-modal-backdrop {
        position: fixed !important;
        inset: 0 !important;
        z-index: 3000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        overflow: auto !important;
        background: rgba(2, 6, 15, 0.82) !important;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .invoice-detail-modal {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        width: min(960px, 100%) !important;
        max-width: 960px !important;
        max-height: calc(100dvh - 40px) !important;
        min-width: 0 !important;
        margin: auto !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      .invoice-detail-modal > .panel-header {
        flex: 0 0 auto !important;
      }

      .invoice-detail-modal #invoice-print-area {
        flex: 1 1 auto !important;
        min-width: 0 !important;
        overflow: auto !important;
        overscroll-behavior: contain;
        background: #ffffff !important;
        color: #151922 !important;
        border-radius: 10px;
        padding: 24px;
        box-sizing: border-box !important;
      }

      #invoice-print-area,
      #invoice-print-area * {
        box-sizing: border-box;
      }

      #invoice-print-area .invoice-paper-heading {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        padding-bottom: 18px;
        border-bottom: 1px solid #e3e7ed;
      }

      #invoice-print-area .invoice-paper-heading h2 {
        margin: 0 0 5px;
        color: #111827;
        font-size: 24px;
        font-weight: 800;
      }

      #invoice-print-area .invoice-paper-heading p {
        margin: 0;
        color: #697386;
      }

      #invoice-print-area .invoice-paper-number {
        display: flex;
        flex-direction: column;
        gap: 6px;
        text-align: right;
        overflow-wrap: anywhere;
      }

      #invoice-print-area .invoice-paper-number strong {
        color: #111827;
      }

      #invoice-print-area .invoice-paper-number span {
        color: #697386;
        font-size: 12px;
      }

      #invoice-print-area .invoice-paper-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 22px;
      }

      #invoice-print-area .invoice-paper-meta > div {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }

      #invoice-print-area .invoice-paper-meta span {
        color: #697386;
        font-size: 12px;
      }

      #invoice-print-area .invoice-paper-meta strong {
        color: #111827;
        overflow-wrap: anywhere;
      }

      #invoice-print-area .table-wrapper {
        width: 100%;
        max-width: 100%;
        overflow-x: auto !important;
        margin-bottom: 20px;
      }

      #invoice-print-area .products-table {
        width: 100%;
        min-width: 560px;
        border-collapse: collapse;
        color: #111827;
        background: #ffffff;
      }

      #invoice-print-area .products-table th,
      #invoice-print-area .products-table td {
        padding: 11px 10px;
        border-bottom: 1px solid #e5e7eb;
        color: #111827;
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
      }

      #invoice-print-area .products-table th {
        background: #f3f5f8;
        color: #4b5563;
        font-size: 11px;
        font-weight: 800;
      }

      #invoice-print-area .invoice-paper-totals {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(360px, 100%);
        margin-left: auto;
      }

      #invoice-print-area .invoice-paper-totals > div {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        color: #4b5563;
      }

      #invoice-print-area .invoice-paper-totals strong {
        color: #111827;
        text-align: right;
      }

      #invoice-print-area .invoice-paper-totals .invoice-grand-total {
        padding-top: 12px;
        border-top: 1px solid #d8dee8;
        font-size: 18px;
        font-weight: 800;
      }

      #invoice-print-area .invoice-note {
        margin-top: 24px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        color: #4b5563;
        overflow-wrap: anywhere;
      }

      .invoice-detail-modal > .panel-actions {
        flex: 0 0 auto !important;
        flex-wrap: wrap;
      }

      @media (max-width: 620px) {
        .invoice-modal-backdrop {
          align-items: flex-start !important;
          justify-content: center !important;
          padding: 10px !important;
        }

        .invoice-detail-modal {
          width: 100% !important;
          max-width: 100% !important;
          max-height: calc(100dvh - 20px) !important;
          border-radius: 14px !important;
        }

        .invoice-detail-modal #invoice-print-area {
          padding: 15px !important;
        }

        #invoice-print-area .invoice-paper-heading {
          gap: 12px;
          margin-bottom: 18px;
        }

        #invoice-print-area .invoice-paper-heading h2 {
          font-size: 20px;
        }

        #invoice-print-area .invoice-paper-number {
          text-align: left;
        }

        #invoice-print-area .invoice-paper-meta {
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        #invoice-print-area .invoice-paper-totals {
          width: 100%;
        }

        .invoice-detail-modal > .panel-actions > button {
          flex: 1 1 auto;
          justify-content: center;
        }
      }

      @media print {
        @page {
          size: auto;
          margin: 10mm;
        }

        html,
        body,
        #root {
          width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: #ffffff !important;
          color: #111827 !important;
        }

        body * {
          visibility: hidden !important;
        }

        #invoice-print-area,
        #invoice-print-area * {
          visibility: visible !important;
        }

        .invoice-modal-backdrop {
          position: static !important;
          display: block !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: #ffffff !important;
          backdrop-filter: none !important;
        }

        .invoice-detail-modal {
          position: static !important;
          display: block !important;
          width: 100% !important;
          max-width: none !important;
          max-height: none !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          color: #111827 !important;
        }

        #invoice-print-area {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          z-index: 2147483647 !important;
          display: block !important;
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          background: #ffffff !important;
          color: #111827 !important;
          font-size: 12px !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        #invoice-print-area .table-wrapper {
          width: 100% !important;
          max-width: none !important;
          height: auto !important;
          max-height: none !important;
          margin: 0 0 18px !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        #invoice-print-area .products-table {
          width: 100% !important;
          min-width: 0 !important;
          table-layout: auto !important;
          border-collapse: collapse !important;
          background: #ffffff !important;
        }

        #invoice-print-area .products-table th,
        #invoice-print-area .products-table td {
          padding: 7px 5px !important;
          border: 1px solid #d9dee7 !important;
          background: #ffffff !important;
          color: #111827 !important;
          font-size: 10px !important;
          overflow-wrap: anywhere !important;
        }

        #invoice-print-area .products-table th {
          background: #f0f2f5 !important;
          color: #111827 !important;
        }

        #invoice-print-area .invoice-paper-heading,
        #invoice-print-area .invoice-paper-meta,
        #invoice-print-area .invoice-paper-totals,
        #invoice-print-area .invoice-note {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        #invoice-print-area tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        #invoice-print-area .invoice-paper-heading h2,
        #invoice-print-area .invoice-paper-heading p,
        #invoice-print-area .invoice-paper-number strong,
        #invoice-print-area .invoice-paper-number span,
        #invoice-print-area .invoice-paper-meta span,
        #invoice-print-area .invoice-paper-meta strong,
        #invoice-print-area .invoice-paper-totals span,
        #invoice-print-area .invoice-paper-totals strong,
        #invoice-print-area .invoice-note {
          color: #111827 !important;
        }

        .no-print {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  return null;
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
   SIDEBAR
========================================================= */

const navGroups = [
  {
    title: "GENERAL",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Settings", icon: Settings },
    ],
  },
  {
    title: "COMMERCE",
    items: [
      {
        label: "Point of Sale",
        icon: ShoppingCart,
        children: [{ label: "Sales History", icon: History }],
      },
      { label: "Products", icon: Package },
      { label: "Categories", icon: Boxes },
      {
        label: "Purchases",
        icon: CreditCard,
        children: [{ label: "Purchase History", icon: ReceiptText }],
      },
      { label: "Orders", icon: ShoppingCart },
      { label: "Suppliers", icon: Truck },
      { label: "Customers", icon: Users },
    ],
  },
  {
    title: "FINANCE",
    items: [
      { label: "Cash Register", icon: Wallet },
      { label: "Reports", icon: BarChart3 },
    ],
  },
];

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
}) {
  const [expanded, setExpanded] = useState({
    "Point of Sale": activePage === "Sales History",
    Purchases: activePage === "Purchase History",
  });

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-symbol">V</div>

          <div className="brand-text">
            <h2>VELTRO</h2>
            <span>BUSINESS SUITE</span>
          </div>

          <button
            className="mobile-close icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-workspace">
          <div className="workspace-avatar">V</div>

          <div className="workspace-info">
            <strong>My Business</strong>
            <span>Business workspace</span>
          </div>

          <ChevronDown size={16} />
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-title">{group.title}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children);
                const open = Boolean(expanded[item.label]);

                const childActive = item.children?.some(
                  (child) => child.label === activePage
                );

                const active =
                  activePage === item.label || childActive;

                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      className={`nav-item ${active ? "active" : ""}`}
                      onClick={() => {
                        if (hasChildren) {
                          setExpanded((old) => ({
                            ...old,
                            [item.label]: !old[item.label],
                          }));
                        }

                        if (
                          item.label === "Point of Sale" ||
                          !hasChildren
                        ) {
                          onNavigate(item.label);
                          onClose();
                        }
                      }}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>

                      {hasChildren && (
                        <ChevronDown
                          className={`nav-chevron ${
                            open ? "nav-chevron-open" : ""
                          }`}
                          size={16}
                        />
                      )}
                    </button>

                    {hasChildren && open && (
                      <div className="nav-submenu">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;

                          return (
                            <button
                              key={child.label}
                              type="button"
                              className={`nav-item nav-sub-item ${
                                activePage === child.label
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => {
                                onNavigate(child.label);
                                onClose();
                              }}
                            >
                              <ChevronRight size={15} />
                              <ChildIcon size={17} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-footer">
            <span className="online-dot" />
            <span>System operational</span>
            <span className="version">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   HEADER
========================================================= */

function Header({
  activePage,
  sidebarVisible,
  onSidebarToggle,
  onMenuClick,
  search,
  onSearchChange,
}) {
  const descriptions = {
    Dashboard: "Your business performance overview.",
    "Point of Sale": "Create and manage sales invoices.",
    Products: "Manage your products and inventory.",
    "Sales History": "Review, print and edit completed sales.",
    "Purchase History": "Review purchase invoices.",
  };

  return (
    <header className="dashboard-header">
      <div className="header-heading">
        <button
          className="sidebar-toggle icon-button"
          type="button"
          onClick={onSidebarToggle}
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarVisible ? (
            <PanelLeftClose size={21} />
          ) : (
            <PanelLeftOpen size={21} />
          )}
        </button>

        <button
          className="mobile-menu icon-button"
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <span className="breadcrumb-current">
              {activePage}
            </span>
          </div>

          <h1>{activePage}</h1>

          <p className="header-description">
            {descriptions[activePage] ||
              "Manage your business with VELTRO-PRO."}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <label className="search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />
        </label>

        <button
          className="header-icon-button"
          type="button"
          aria-label="Notifications"
          onClick={() => alert("Notifications coming soon.")}
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   INVOICE DETAILS AND PRINT
========================================================= */

function InvoicePrint({
  invoice,
  onClose,
  printRequest,
}) {
  const items = invoice.items || [];
  const subtotal = invoiceSubtotal(items);
  const discount = Number(invoice.discount) || 0;
  const total = Number(invoice.total ?? invoiceTotal(invoice));
  const paid = Number(invoice.paid) || 0;
  const remaining = Math.max(0, total - paid);

  useEffect(() => {
    if (!printRequest) return undefined;

    // Wait until the invoice modal has rendered before printing.
    const timer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [printRequest]);

  const print = () => {
    window.print();
  };

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
            <h3>
              Invoice {invoice.invoiceNumber || invoice.id}
            </h3>
            <p className="panel-description">
              Completed sale details
            </p>
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

        <div
          id="invoice-print-area"
          className="invoice-print-area"
        >
          <div className="invoice-paper-heading">
            <div>
              <h2>VELTRO-PRO</h2>
              <p>Sales Invoice</p>
            </div>

            <div className="invoice-paper-number">
              <strong>
                {invoice.invoiceNumber || invoice.id}
              </strong>
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
              <strong>
                {employeeName(invoice) || "Not recorded"}
              </strong>
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

                  const lineDiscount =
                    Number(item.discount) || 0;

                  return (
                    <tr key={`${productId(item)}-${index}`}>
                      <td>{item.name || "Product"}</td>
                      <td>{quantity(item)}</td>
                      <td>{money(item.price)}</td>
                      <td>{money(lineDiscount)}</td>
                      <td>
                        {money(Math.max(0, line - lineDiscount))}
                      </td>
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
            <p className="invoice-note">
              Note: {invoice.note}
            </p>
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
            onClick={print}
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

function EditInvoiceModal({
  invoice,
  onCancel,
  onSave,
}) {
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
    setDraft((old) => ({
      ...old,
      [field]: value,
    }));
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
          ...(field === "qty"
            ? { quantity: nextValue }
            : {}),
          ...(field === "quantity"
            ? { qty: nextValue }
            : {}),
        };
      }),
    }));
  };

  const removeItem = (index) => {
    setDraft((old) => ({
      ...old,
      items: old.items.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const addProduct = (id) => {
    if (!id) return;

    const product = inventory.find(
      (item) => String(item.id) === String(id)
    );

    if (!product) return;

    const existing = draft.items.find(
      (item) =>
        productId(item) === String(product.id) &&
        !item.isCartonLine
    );

    if (existing) {
      setDraft((old) => ({
        ...old,
        items: old.items.map((item) =>
          item === existing
            ? {
                ...item,
                qty: quantity(item) + 1,
                quantity: quantity(item) + 1,
              }
            : item
        ),
      }));
    } else {
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
            price: Math.max(
              0,
              Number(product.price) || 0
            ),
            discount: 0,
          },
        ],
      }));
    }
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
      result = {
        ok: false,
        error: "UNKNOWN_ERROR",
      };
    }

    setSaving(false);

    if (!result?.ok) {
      const messages = {
        EMPTY_INVOICE:
          "An invoice must contain products.",
        PRODUCT_NOT_FOUND:
          "A product in this invoice no longer exists.",
        INSUFFICIENT_STOCK:
          `${result.productName || "Product"}: requested ${result.requested}, available ${result.available}.`,
        STOCK_SAVE_FAILED:
          "Could not update inventory. No edit was saved.",
        SALE_SAVE_FAILED:
          "Could not save the edited invoice. Inventory rollback was attempted.",
        INVOICE_NOT_FOUND:
          "This invoice could not be found.",
        INVALID_INVOICE:
          "The invoice data is invalid.",
      };

      setError(
        messages[result?.error] ||
          "The invoice could not be saved."
      );
    }
  };

  return (
    <div className="modal-backdrop">
      <section className="panel edit-invoice-modal">
        <div className="panel-header">
          <div>
            <h3>
              Edit {invoice.invoiceNumber || invoice.id}
            </h3>

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
                <option
                  key={product.id}
                  value={product.id}
                >
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
   SALES HISTORY
========================================================= */

function HistoryPage() {
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
      [
        ...new Set(
          invoices
            .map((invoice) => invoice.customerName)
            .filter(Boolean)
        ),
      ].sort(),
    [invoices]
  );

  const employees = useMemo(
    () =>
      [
        ...new Set(
          invoices.map(employeeName).filter(Boolean)
        ),
      ].sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const dateValue = invoiceDate(invoice);
      const date = dateValue ? new Date(dateValue) : null;

      const matchesSearch =
        !query ||
        String(invoice.invoiceNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(invoice.id || "")
          .toLowerCase()
          .includes(query) ||
        String(invoice.customerName || "")
          .toLowerCase()
          .includes(query) ||
        String(employeeName(invoice))
          .toLowerCase()
          .includes(query);

      const validDate =
        date && !Number.isNaN(date.getTime());

      const dateOnly = validDate
        ? `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")}`
        : "";

      const timeOnly = validDate
        ? `${String(date.getHours()).padStart(2, "0")}:${String(
            date.getMinutes()
          ).padStart(2, "0")}`
        : "";

      const matchesStartDate =
        !startDate || (dateOnly && dateOnly >= startDate);

      const matchesEndDate =
        !endDate || (dateOnly && dateOnly <= endDate);

      const matchesStartTime =
        !startTime || (timeOnly && timeOnly >= startTime);

      const matchesEndTime =
        !endTime || (timeOnly && timeOnly <= endTime);

      const matchesCustomer =
        !customerFilter ||
        (invoice.customerName || "") === customerFilter;

      const matchesEmployee =
        !employeeFilter ||
        employeeName(invoice) === employeeFilter;

      return (
        matchesSearch &&
        matchesStartDate &&
        matchesEndDate &&
        matchesStartTime &&
        matchesEndTime &&
        matchesCustomer &&
        matchesEmployee
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
    (sum, invoice) =>
      sum + Number(invoice.total ?? invoiceTotal(invoice)),
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
        const total = Number(
          invoice.total ?? invoiceTotal(invoice)
        );
        const paid = Number(invoice.paid) || 0;

        return [
          invoice.invoiceNumber || invoice.id,
          customerName(invoice),
          employeeName(invoice) || "Not recorded",
          Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString(),
          Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleTimeString(),
          total,
          paid,
          Math.max(0, total - paid),
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
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

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
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
      setNotice(
        "Invoice updated and inventory adjusted successfully."
      );
    }

    return result;
  };

  const openInvoice = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const printInvoiceFromTable = (invoice) => {
    // Open the invoice first. InvoicePrint will print after rendering.
    setSelectedInvoice(invoice);
    setPrintRequest((request) => request + 1);
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

        <div className="panel-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={exportCsv}
          >
            <Download size={16} />
            Export CSV
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div
          className="pos-message pos-message-success"
          role="status"
        >
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
              filteredInvoices.map(
                (invoice) => invoice.customerName || ""
              )
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
                  Number(
                    invoice.total ?? invoiceTotal(invoice)
                  ) - (Number(invoice.paid) || 0)
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
            className="secondary-button"
            type="button"
            onClick={resetFilters}
          >
            <RefreshCw size={16} />
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
              <Calendar size={15} />
              Start date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Calendar size={15} />
              End date
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Clock size={15} />
              Start time
            </span>

            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Clock size={15} />
              End time
            </span>

            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </label>

          <label className="history-filter-field">
            <span>
              <Users size={15} />
              Customer
            </span>

            <select
              value={customerFilter}
              onChange={(event) =>
                setCustomerFilter(event.target.value)
              }
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
              <Users size={15} />
              Employee
            </span>

            <select
              value={employeeFilter}
              onChange={(event) =>
                setEmployeeFilter(event.target.value)
              }
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

                const total = Number(
                  invoice.total ?? invoiceTotal(invoice)
                );

                const paid = Number(invoice.paid) || 0;

                return (
                  <tr
                    key={
                      invoice.id ||
                      invoice.invoiceId ||
                      invoice.invoiceNumber ||
                      index
                    }
                  >
                    <td>
                      <strong>
                        {invoice.invoiceNumber ||
                          invoice.id ||
                          "Invoice"}
                      </strong>
                    </td>

                    <td>{customerName(invoice)}</td>

                    <td>
                      {employeeName(invoice) || "Not recorded"}
                    </td>

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

                    <td className="price-cell">
                      {money(total)}
                    </td>

                    <td>{money(paid)}</td>

                    <td>{money(Math.max(0, total - paid))}</td>

                    <td>
                      <div className="history-row-actions">
                        <button
                          className="icon-button"
                          type="button"
                          title="View invoice"
                          aria-label="View invoice"
                          onClick={() => openInvoice(invoice)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className="icon-button"
                          type="button"
                          title="Print or reprint invoice"
                          aria-label="Print invoice"
                          onClick={() =>
                            printInvoiceFromTable(invoice)
                          }
                        >
                          <Printer size={17} />
                        </button>

                        <button
                          className="icon-button"
                          type="button"
                          title="Edit invoice"
                          aria-label="Edit invoice"
                          onClick={() =>
                            setPasswordInvoice(invoice)
                          }
                        >
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
                      <div className="placeholder-icon">
                        <History size={30} />
                      </div>

                      <strong>
                        {invoices.length
                          ? "No matching invoices"
                          : "No completed sales yet"}
                      </strong>

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
          <span>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>

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

/* =========================================================
   PURCHASE HISTORY
========================================================= */

function PurchaseHistory() {
  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">
        <ReceiptText size={34} />
      </div>

      <h2>Purchase History</h2>

      <p>
        Purchase invoice integration will be developed with the purchasing module.
      </p>
    </section>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ onNavigate }) {
  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-eyebrow">
            YOUR BUSINESS AT A GLANCE
          </div>

          <h2>Welcome back, Administrator</h2>

          <p>
            Manage your sales and inventory from one place.
          </p>

          <div className="welcome-date">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Quick access</h2>
          <p>Continue working in VELTRO-PRO.</p>
        </div>
      </div>

      <div className="stats-grid">
        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Point of Sale")}
        >
          <ShoppingCart size={25} />
          <strong>Point of Sale</strong>
          <span>Create a new sale</span>
        </button>

        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Sales History")}
        >
          <History size={25} />
          <strong>Sales History</strong>
          <span>Review completed invoices</span>
        </button>

        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Products")}
        >
          <Package size={25} />
          <strong>Products</strong>
          <span>Manage inventory</span>
        </button>
      </div>
    </>
  );
}

/* =========================================================
   PLACEHOLDER PAGES
========================================================= */

function PlaceholderPage({ title }) {
  const icons = {
    Categories: Boxes,
    Purchases: CreditCard,
    Orders: ShoppingCart,
    Suppliers: Truck,
    Customers: Users,
    "Cash Register": Wallet,
    Reports: BarChart3,
    Settings,
  };

  const Icon = icons[title] || LayoutDashboard;

  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">
        <Icon size={34} />
      </div>

      <h2>{title}</h2>

      <p>
        This module will be developed in a future VELTRO-PRO update.
      </p>
    </section>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    if (window.innerWidth <= 620) {
      setMobileOpen((old) => !old);
    } else {
      setSidebarVisible((old) => !old);
    }
  };

  return (
    <div
      className={`app-shell ${
        sidebarVisible ? "" : "sidebar-hidden"
      }`}
    >
      <InvoiceInterfaceStyles />

      {sidebarVisible && (
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <main
        className="main-content"
        style={
          !sidebarVisible
            ? { marginLeft: 0, width: "100%" }
            : undefined
        }
      >
        <Header
          activePage={activePage}
          sidebarVisible={sidebarVisible}
          onSidebarToggle={toggleSidebar}
          onMenuClick={() => setMobileOpen(true)}
          search={search}
          onSearchChange={setSearch}
        />

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <Dashboard onNavigate={setActivePage} />
          ) : activePage === "Point of Sale" ? (
            <POS />
          ) : activePage === "Products" ? (
            <Products />
          ) : activePage === "Sales History" ? (
            <HistoryPage />
          ) : activePage === "Purchase History" ? (
            <PurchaseHistory />
          ) : (
            <PlaceholderPage title={activePage} />
          )}
        </div>

        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} VELTRO. All rights reserved.
          </span>

          <span className="footer-status">
            <span />
            All systems operational
          </span>
        </footer>
      </main>
    </div>
  );
}
