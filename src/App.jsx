
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
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Languages,
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


const translations = {
 en: {},
 fr: {
 "GENERAL":"GÉNÉRAL","COMMERCE":"COMMERCE","PARTNERS":"PARTENAIRES","FINANCE & REPORTS":"FINANCES ET RAPPORTS",
 "Dashboard":"Tableau de bord","Settings":"Paramètres","Point of Sale":"Point de vente","Sales History":"Historique des ventes",
 "Purchases":"Achats","Purchase History":"Historique des achats","Products":"Produits","Product List":"Liste des produits",
 "Product Purchase History":"Historique des achats par produit","Product Sales History":"Historique des ventes par produit",
 "Categories":"Catégories","Orders":"Commandes","Suppliers List":"Liste des fournisseurs","Supplier Debts":"Dettes fournisseurs",
 "Customers":"Clients","Cash Register":"Caisse","Reports":"Rapports","BUSINESS SUITE":"GESTION COMMERCIALE",
 "My Business":"Mon entreprise","Business workspace":"Espace de travail","System operational":"Système opérationnel",
 "Language":"Langue","Workspace":"Espace de travail","Your business performance overview.":"Vue d’ensemble des performances de votre entreprise.",
 "Create and manage sales invoices.":"Créer et gérer les factures de vente.","Manage your products and inventory.":"Gérer vos produits et votre stock.",
 "Review, print and edit completed sales.":"Consulter, imprimer et modifier les ventes terminées.",
 "Create and manage purchase invoices.":"Créer et gérer les factures d’achat.","Manage supplier names and phone numbers.":"Gérer les noms et téléphones des fournisseurs.",
 "Review supplier invoices and outstanding balances.":"Consulter les factures fournisseurs et les soldes dus.",
 "Review purchase movements for each product.":"Consulter les mouvements d’achat par produit.",
 "Review sales movements for each product.":"Consulter les mouvements de vente par produit.",
 "Manage your business with VELTRO-PRO.":"Gérez votre entreprise avec VELTRO-PRO.",
 "Search...":"Rechercher...","Hide sidebar":"Masquer le menu","Show sidebar":"Afficher le menu",
 "Exit full screen":"Quitter le plein écran","Enter full screen":"Passer en plein écran","Notifications":"Notifications",
 "YOUR BUSINESS AT A GLANCE":"VOTRE ENTREPRISE EN UN COUP D’ŒIL","Welcome back, Administrator":"Bon retour, Administrateur",
 "Manage your sales and inventory from one place.":"Gérez vos ventes et votre stock depuis un seul endroit.",
 "Quick access":"Accès rapide","Continue working in VELTRO-PRO.":"Continuez à travailler dans VELTRO-PRO.",
 "Create a new sale":"Créer une vente","Review completed invoices":"Consulter les factures terminées","Manage inventory":"Gérer le stock",
 "This module will be developed in a future VELTRO-PRO update.":"Ce module sera développé dans une prochaine mise à jour de VELTRO-PRO.",
 "All rights reserved.":"Tous droits réservés.","All systems operational":"Tous les systèmes fonctionnent"
 },
 ar: {
 "GENERAL":"عام","COMMERCE":"التجارة","PARTNERS":"الشركاء","FINANCE & REPORTS":"المالية والتقارير",
 "Dashboard":"لوحة التحكم","Settings":"الإعدادات","Point of Sale":"نقطة البيع","Sales History":"سجل المبيعات",
 "Purchases":"المشتريات","Purchase History":"سجل المشتريات","Products":"المنتجات","Product List":"قائمة المنتجات",
 "Product Purchase History":"سجل مشتريات المنتج","Product Sales History":"سجل مبيعات المنتج",
 "Categories":"الفئات","Orders":"الطلبات","Suppliers List":"قائمة الموردين","Supplier Debts":"ديون الموردين",
 "Customers":"العملاء","Cash Register":"الصندوق","Reports":"التقارير","BUSINESS SUITE":"نظام إدارة الأعمال",
 "My Business":"مؤسستي","Business workspace":"مساحة العمل","System operational":"النظام يعمل بشكل طبيعي",
 "Language":"اللغة","Workspace":"مساحة العمل","Your business performance overview.":"نظرة عامة على أداء أعمالك.",
 "Create and manage sales invoices.":"إنشاء فواتير البيع وإدارتها.","Manage your products and inventory.":"إدارة المنتجات والمخزون.",
 "Review, print and edit completed sales.":"مراجعة المبيعات المكتملة وطباعتها وتعديلها.",
 "Create and manage purchase invoices.":"إنشاء فواتير الشراء وإدارتها.","Manage supplier names and phone numbers.":"إدارة أسماء الموردين وأرقام هواتفهم.",
 "Review supplier invoices and outstanding balances.":"مراجعة فواتير الموردين والأرصدة المستحقة.",
 "Review purchase movements for each product.":"مراجعة حركات شراء كل منتج.","Review sales movements for each product.":"مراجعة حركات بيع كل منتج.",
 "Manage your business with VELTRO-PRO.":"أدر أعمالك باستخدام VELTRO-PRO.",
 "Search...":"بحث...","Hide sidebar":"إخفاء القائمة الجانبية","Show sidebar":"إظهار القائمة الجانبية",
 "Exit full screen":"الخروج من ملء الشاشة","Enter full screen":"ملء الشاشة","Notifications":"الإشعارات",
 "YOUR BUSINESS AT A GLANCE":"أعمالك في لمحة","Welcome back, Administrator":"مرحبًا بعودتك، أيها المدير",
 "Manage your sales and inventory from one place.":"أدر المبيعات والمخزون من مكان واحد.",
 "Quick access":"وصول سريع","Continue working in VELTRO-PRO.":"تابع العمل في VELTRO-PRO.",
 "Create a new sale":"إنشاء عملية بيع","Review completed invoices":"مراجعة الفواتير المكتملة","Manage inventory":"إدارة المخزون",
 "This module will be developed in a future VELTRO-PRO update.":"ستتم برمجة هذا القسم في تحديث قادم من VELTRO-PRO.",
 "All rights reserved.":"جميع الحقوق محفوظة.","All systems operational":"جميع الأنظمة تعمل"
 }
};
function tr(locale, text) { return translations[locale]?.[text] || text; }

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
      {
        label: "Purchases",
        icon: CreditCard,
        children: [{ label: "Purchase History", icon: ReceiptText }],
      },
      {
        label: "Products",
        icon: Package,
        children: [
          { label: "Product List", icon: ClipboardList, page: "Products" },
          {
            label: "Product Purchase History",
            icon: ReceiptText,
            page: "Product Purchase History",
          },
          {
            label: "Product Sales History",
            icon: History,
            page: "Product Sales History",
          },
        ],
      },
      { label: "Categories", icon: Boxes },
      { label: "Orders", icon: ReceiptText },
    ],
  },
  {
    title: "PARTNERS",
    items: [
      {
        label: "Suppliers List",
        icon: Truck,
        children: [{ label: "Supplier Debts", icon: Wallet }],
      },
      { label: "Customers", icon: Users },
    ],
  },
  {
    title: "FINANCE & REPORTS",
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
  locale,
  onLocaleChange,
}) {
  const [expanded, setExpanded] = useState({
    "Point of Sale": activePage === "Sales History",
    Purchases: activePage === "Purchase History",
    "Suppliers List": activePage === "Supplier Debts",
    Products:
      activePage === "Products" ||
      activePage === "Product Purchase History" ||
      activePage === "Product Sales History",
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
            <span>{tr(locale, "BUSINESS SUITE")}</span>
          </div>

        </div>

        <div className="sidebar-workspace">
          <div className="workspace-avatar">V</div>

          <div className="workspace-info">
            <strong>{tr(locale, "My Business")}</strong>
            <span>{tr(locale, "Business workspace")}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.title}>
              <p className="nav-group-title">{tr(locale, group.title)}</p>

              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children);
                const open = Boolean(expanded[item.label]);

                const childActive = item.children?.some(
                  (child) => (child.page || child.label) === activePage
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

                        if (item.label === "Products") {
                          onNavigate("Products");
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
                      <span>{tr(locale, item.label)}</span>

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
                                activePage === (child.page || child.label)
                                  ? "active"
                                  : ""
                              }`}
                              onClick={() => {
                                onNavigate(child.page || child.label);
                                onClose();
                              }}
                            >
                              <ChevronRight size={15} />
                              <ChildIcon size={17} />
                              <span>{tr(locale, child.label)}</span>
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
          <div className="sidebar-language">
            <div className="sidebar-language-title"><Languages size={15} /><span>{tr(locale, "Language")}</span></div>
            <div className="sidebar-language-options" role="group" aria-label={tr(locale, "Language")}>
              {[{code:"en",short:"EN",label:"English"},{code:"fr",short:"FR",label:"Français"},{code:"ar",short:"ع",label:"العربية"}].map((language) => (
                <button key={language.code} type="button" className={`sidebar-language-option ${locale===language.code?"active":""}`} aria-pressed={locale===language.code} title={language.label} onClick={()=>onLocaleChange(language.code)}>{language.short}</button>
              ))}
            </div>
          </div>
          <div className="sidebar-footer">
            <span className="online-dot" />
            <span>{tr(locale, "System operational")}</span>
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
  locale,
  sidebarVisible,
  onSidebarToggle,
  onMenuClick,
  search,
  onSearchChange,
  isFullscreen,
  onToggleFullscreen,
}) {
  const descriptions = {
    Dashboard: "Your business performance overview.",
    "Point of Sale": "Create and manage sales invoices.",
    Products: "Manage your products and inventory.",
    "Sales History": "Review, print and edit completed sales.",
    "Purchase History": "Create and manage purchase invoices.",
    "Suppliers List": "Manage supplier names and phone numbers.",
    "Supplier Debts": "Review supplier invoices and outstanding balances.",
    "Product Purchase History": "Review purchase movements for each product.",
    "Product Sales History": "Review sales movements for each product.",
  };

  return (
    <header className="dashboard-header">
      <div className="header-heading">
        <button
          className="sidebar-toggle icon-button"
          type="button"
          onClick={onSidebarToggle}
          title={tr(locale, sidebarVisible ? "Hide sidebar" : "Show sidebar")}
          aria-label={tr(locale, sidebarVisible ? "Hide sidebar" : "Show sidebar")}
        >
          {sidebarVisible ? (
            <PanelLeftClose size={21} />
          ) : (
            <PanelLeftOpen size={21} />
          )}
        </button>

        <div>
          <div className="breadcrumb">
            <span>{tr(locale, "Workspace")}</span>
            <span>/</span>
            <span className="breadcrumb-current">
              {tr(locale, activePage)}
            </span>
          </div>

          <h1>{tr(locale, activePage)}</h1>

          <p className="header-description">
            {tr(locale, descriptions[activePage] ||
              "Manage your business with VELTRO-PRO.")}
          </p>
        </div>
      </div>

      <div className="header-actions">
        <label className="search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder={tr(locale, "Search...")}
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />
        </label>

        <button
          className="header-icon-button fullscreen-button"
          type="button"
          aria-label={tr(locale, isFullscreen ? "Exit full screen" : "Enter full screen")}
          title={tr(locale, isFullscreen ? "Exit full screen" : "Enter full screen")}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
        </button>

        <button
          className="header-icon-button"
          type="button"
          aria-label={tr(locale, "Notifications")}
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

function Dashboard({ onNavigate, locale }) {
  return (
    <>
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-eyebrow">
            YOUR BUSINESS AT A GLANCE
          </div>

          <h2>{tr(locale, "Welcome back, Administrator")}</h2>

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
          <h2>{tr(locale, "Quick access")}</h2>
          <p>{tr(locale, "Continue working in VELTRO-PRO.")}</p>
        </div>
      </div>

      <div className="stats-grid">
        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Point of Sale")}
        >
          <ShoppingCart size={25} />
          <strong>{tr(locale, "Point of Sale")}</strong>
          <span>{tr(locale, "Create a new sale")}</span>
        </button>

        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Sales History")}
        >
          <History size={25} />
          <strong>{tr(locale, "Sales History")}</strong>
          <span>{tr(locale, "Review completed invoices")}</span>
        </button>

        <button
          className="panel quick-access-card"
          type="button"
          onClick={() => onNavigate("Products")}
        >
          <Package size={25} />
          <strong>{tr(locale, "Products")}</strong>
          <span>{tr(locale, "Manage inventory")}</span>
        </button>
      </div>
    </>
  );
}

/* =========================================================
   PLACEHOLDER PAGES
========================================================= */

function PlaceholderPage({ title, locale }) {
  const icons = {
    Categories: Boxes,
    Purchases: CreditCard,
    Orders: ShoppingCart,
    Customers: Users,
    "Cash Register": Wallet,
    "Product Purchase History": ReceiptText,
    "Product Sales History": History,
    Reports: BarChart3,
    Settings,
  };

  const Icon = icons[title] || LayoutDashboard;

  return (
    <section className="panel placeholder-panel">
      <div className="placeholder-icon">
        <Icon size={34} />
      </div>

      <h2>{tr(locale, title)}</h2>

      <p>
        {tr(locale, "This module will be developed in a future VELTRO-PRO update.")}
      </p>
    </section>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [locale, setLocale] = useState(() => {
    try { const saved = window.localStorage.getItem("veltro-language"); return ["en","fr","ar"].includes(saved) ? saved : "en"; }
    catch { return "en"; }
  });
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.body.dir = locale === "ar" ? "rtl" : "ltr";
    try { window.localStorage.setItem("veltro-language", locale); } catch { /* storage may be unavailable */ }
  }, [locale]);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error("Unable to toggle full screen mode:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleFullscreenShortcut);
    return () => window.removeEventListener("keydown", handleFullscreenShortcut);
  }, []);

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
          locale={locale}
          onLocaleChange={setLocale}
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
          locale={locale}
          sidebarVisible={sidebarVisible}
          onSidebarToggle={toggleSidebar}
          onMenuClick={() => setMobileOpen(true)}
          search={search}
          onSearchChange={setSearch}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        <div className="page-content">
          {activePage === "Dashboard" ? (
            <Dashboard onNavigate={setActivePage} locale={locale} />
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
            <PlaceholderPage title={activePage} locale={locale} />
          )}
        </div>

        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} VELTRO. {tr(locale, "All rights reserved.")}
          </span>

          <span className="footer-status">
            <span />
            {tr(locale, "All systems operational")}
          </span>
        </footer>
      </main>
    </div>
  );
}
