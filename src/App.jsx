
import React, { useEffect, useState } from "react";
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

} from "lucide-react";

import POS from "./POS";
import Products from "./Products.jsx";
import SalesHistory from "./sales/SalesHistory.jsx";
import Purchases from "./purchases/Purchases.jsx";
import Suppliers from "./suppliers/Suppliers.jsx";
import SupplierDebts from "./suppliers/SupplierDebts.jsx";

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
      {
        label: "Suppliers List",
        icon: Truck,
        children: [{ label: "Supplier Debts", icon: Wallet }],
      },
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
    "Suppliers List": activePage === "Supplier Debts",
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

        </div>

        <div className="sidebar-workspace">
          <div className="workspace-avatar">V</div>

          <div className="workspace-info">
            <strong>My Business</strong>
            <span>Business workspace</span>
          </div>
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

                        if (item.label === "Purchases") {
                          onNavigate("Purchase History");
                          onClose();
                          return;
                        }

                        if (item.label === "Suppliers List") {
                          onNavigate("Suppliers List");
                          onClose();
                          return;
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
    "Purchase History": "Create and manage purchase invoices.",
    "Suppliers List": "Manage supplier names and phone numbers.",
    "Supplier Debts": "Review supplier invoices and outstanding balances.",
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
            <SalesHistory />
          ) : activePage === "Purchase History" ? (
            <Purchases />
          ) : activePage === "Suppliers List" ? (
            <Suppliers />
          ) : activePage === "Supplier Debts" ? (
            <SupplierDebts />
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
