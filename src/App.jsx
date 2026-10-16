
import React, { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CalendarDays, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";

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
  LogOut,
  RefreshCw,
} from "lucide-react";

import POS from "./POS";
import Products from "./Products.jsx";
import SalesHistory from "./sales/SalesHistory.jsx";
import Purchases from "./purchases/Purchases.jsx";
import Suppliers from "./suppliers/Suppliers.jsx";
import Customers from "./customers/Customers.jsx";
import SupplierDebts from "./suppliers/SupplierDebts.jsx";
import { translatePage } from "./i18n.js";
import SettingsPage from "./Settings.jsx";
import { supabase } from "./lib/supabase.js";
import { startOrganizationRealtimeSync, requestOrganizationSync } from "./lib/realtimeSync.js";

/* =========================================================
   INVOICE MODAL AND PRINT STYLES
========================================================= */

function InvoiceInterfaceStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-veltro-invoice-styles", "true");
    style.textContent = ".invoice-modal-backdrop {\n        position: fixed !important;\n        inset: 0 !important;\n        z-index: 3000 !important;\n        display: flex !important;\n        align-items: center !important;\n        justify-content: center !important;\n        padding: 20px !important;\n        overflow: auto !important;\n        background: rgba(2, 6, 15, 0.82) !important;\n        backdrop-filter: blur(6px);\n        -webkit-backdrop-filter: blur(6px);\n      }\n\n      .invoice-detail-modal {\n        position: relative !important;\n        display: flex !important;\n        flex-direction: column !important;\n        width: min(960px, 100%) !important;\n        max-width: 960px !important;\n        max-height: calc(100dvh - 40px) !important;\n        min-width: 0 !important;\n        margin: auto !important;\n        overflow: hidden !important;\n        box-sizing: border-box !important;\n      }\n\n      .invoice-detail-modal > .panel-header {\n        flex: 0 0 auto !important;\n      }\n\n      .invoice-detail-modal #invoice-print-area {\n        flex: 1 1 auto !important;\n        min-width: 0 !important;\n        overflow: auto !important;\n        overscroll-behavior: contain;\n        background: #ffffff !important;\n        color: #151922 !important;\n        border-radius: 10px;\n        padding: 24px;\n        box-sizing: border-box !important;\n      }\n\n      #invoice-print-area,\n      #invoice-print-area * {\n        box-sizing: border-box;\n      }\n\n      #invoice-print-area .invoice-paper-heading {\n        display: flex;\n        justify-content: space-between;\n        align-items: flex-start;\n        gap: 16px;\n        flex-wrap: wrap;\n        margin-bottom: 24px;\n        padding-bottom: 18px;\n        border-bottom: 1px solid #e3e7ed;\n      }\n\n      #invoice-print-area .invoice-paper-heading h2 {\n        margin: 0 0 5px;\n        color: #111827;\n        font-size: 24px;\n        font-weight: 800;\n      }\n\n      #invoice-print-area .invoice-paper-heading p {\n        margin: 0;\n        color: #697386;\n      }\n\n      #invoice-print-area .invoice-paper-number {\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        text-align: right;\n        overflow-wrap: anywhere;\n      }\n\n      #invoice-print-area .invoice-paper-number strong {\n        color: #111827;\n      }\n\n      #invoice-print-area .invoice-paper-number span {\n        color: #697386;\n        font-size: 12px;\n      }\n\n      #invoice-print-area .invoice-paper-meta {\n        display: grid;\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n        gap: 16px;\n        margin-bottom: 22px;\n      }\n\n      #invoice-print-area .invoice-paper-meta > div {\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        min-width: 0;\n      }\n\n      #invoice-print-area .invoice-paper-meta span {\n        color: #697386;\n        font-size: 12px;\n      }\n\n      #invoice-print-area .invoice-paper-meta strong {\n        color: #111827;\n        overflow-wrap: anywhere;\n      }\n\n      #invoice-print-area .table-wrapper {\n        width: 100%;\n        max-width: 100%;\n        overflow-x: auto !important;\n        margin-bottom: 20px;\n      }\n\n      #invoice-print-area .products-table {\n        width: 100%;\n        min-width: 560px;\n        border-collapse: collapse;\n        color: #111827;\n        background: #ffffff;\n      }\n\n      #invoice-print-area .products-table th,\n      #invoice-print-area .products-table td {\n        padding: 11px 10px;\n        border-bottom: 1px solid #e5e7eb;\n        color: #111827;\n        text-align: left;\n        vertical-align: top;\n        overflow-wrap: anywhere;\n      }\n\n      #invoice-print-area .products-table th {\n        background: #f3f5f8;\n        color: #4b5563;\n        font-size: 11px;\n        font-weight: 800;\n      }\n\n      #invoice-print-area .invoice-paper-totals {\n        display: flex;\n        flex-direction: column;\n        gap: 10px;\n        width: min(360px, 100%);\n        margin-left: auto;\n      }\n\n      #invoice-print-area .invoice-paper-totals > div {\n        display: flex;\n        justify-content: space-between;\n        gap: 16px;\n        color: #4b5563;\n      }\n\n      #invoice-print-area .invoice-paper-totals strong {\n        color: #111827;\n        text-align: right;\n      }\n\n      #invoice-print-area .invoice-paper-totals .invoice-grand-total {\n        padding-top: 12px;\n        border-top: 1px solid #d8dee8;\n        font-size: 18px;\n        font-weight: 800;\n      }\n\n      #invoice-print-area .invoice-note {\n        margin-top: 24px;\n        padding-top: 12px;\n        border-top: 1px solid #e5e7eb;\n        color: #4b5563;\n        overflow-wrap: anywhere;\n      }\n\n      .invoice-detail-modal > .panel-actions {\n        flex: 0 0 auto !important;\n        flex-wrap: wrap;\n      }\n\n      @media (max-width: 620px) {\n        .invoice-modal-backdrop {\n          align-items: flex-start !important;\n          justify-content: center !important;\n          padding: 10px !important;\n        }\n\n        .invoice-detail-modal {\n          width: 100% !important;\n          max-width: 100% !important;\n          max-height: calc(100dvh - 20px) !important;\n          border-radius: 14px !important;\n        }\n\n        .invoice-detail-modal #invoice-print-area {\n          padding: 15px !important;\n        }\n\n        #invoice-print-area .invoice-paper-heading {\n          gap: 12px;\n          margin-bottom: 18px;\n        }\n\n        #invoice-print-area .invoice-paper-heading h2 {\n          font-size: 20px;\n        }\n\n        #invoice-print-area .invoice-paper-number {\n          text-align: left;\n        }\n\n        #invoice-print-area .invoice-paper-meta {\n          grid-template-columns: minmax(0, 1fr);\n          gap: 12px;\n        }\n\n        #invoice-print-area .invoice-paper-totals {\n          width: 100%;\n        }\n\n        .invoice-detail-modal > .panel-actions > button {\n          flex: 1 1 auto;\n          justify-content: center;\n        }\n      }\n\n      #invoice-print-area .invoice-paper-heading {\n        background: #f7f8fa !important;\n        border: 1px solid #e2e6ec !important;\n        border-radius: 10px !important;\n        padding: 18px !important;\n      }\n      #invoice-print-area .invoice-paper-heading h2 { color: #172033 !important; }\n      #invoice-print-area .invoice-paper-heading p { color: #647084 !important; }\n      #invoice-print-area .invoice-paper-number strong {\n        color: #172033 !important;\n        background: #eef2f6 !important;\n        border: 1px solid #d9e0e8 !important;\n        border-radius: 7px !important;\n        padding: 6px 9px !important;\n      }\n      #invoice-print-area .invoice-paper-meta > div {\n        padding: 12px 14px !important;\n        background: #f8fafc !important;\n        border: 1px solid #e3e8ef !important;\n        border-radius: 8px !important;\n      }\n      #invoice-print-area .invoice-paper-meta span { color: #687386 !important; }\n      #invoice-print-area .invoice-paper-meta strong { color: #172033 !important; }\n      #invoice-print-area .table-wrapper {\n        border: 1px solid #e1e6ed !important;\n        border-radius: 8px !important;\n        background: #ffffff !important;\n      }\n      #invoice-print-area .products-table { background: #ffffff !important; }\n      #invoice-print-area .products-table th {\n        background: #edf1f5 !important;\n        color: #39465a !important;\n        border-bottom: 1px solid #dce2ea !important;\n      }\n      #invoice-print-area .products-table td { background: #ffffff !important; color: #202b3c !important; }\n      #invoice-print-area .products-table tbody tr:nth-child(even) td { background: #f8fafc !important; }\n      #invoice-print-area .invoice-paper-totals > div {\n        padding: 11px 13px !important;\n        border: 1px solid #e3e8ef !important;\n        border-radius: 8px !important;\n        background: #f8fafc !important;\n        color: #4b5563 !important;\n      }\n      #invoice-print-area .invoice-paper-totals > div > span { color: #5f6b7d !important; }\n      #invoice-print-area .invoice-paper-totals > div > strong { color: #172033 !important; }\n      #invoice-print-area .invoice-paper-totals .invoice-grand-total {\n        background: #eef8f6 !important;\n        border: 1px solid #c5e4de !important;\n        border-radius: 8px !important;\n      }\n      #invoice-print-area .invoice-paper-totals .invoice-grand-total > span,\n      #invoice-print-area .invoice-paper-totals .invoice-grand-total > strong { color: #175e56 !important; }\n      #invoice-print-area .invoice-note {\n        padding: 12px 14px !important;\n        border: 1px solid #e3e8ef !important;\n        border-radius: 8px !important;\n        background: #f8fafc !important;\n        color: #4b5563 !important;\n      }\n\n      @media print {\n        @page {\n          size: auto;\n          margin: 10mm;\n        }\n\n        html,\n        body,\n        #root {\n          width: 100% !important;\n          min-width: 0 !important;\n          height: auto !important;\n          min-height: 0 !important;\n          margin: 0 !important;\n          padding: 0 !important;\n          overflow: visible !important;\n          background: #ffffff !important;\n          color: #111827 !important;\n        }\n\n        body * {\n          visibility: hidden !important;\n        }\n\n        #invoice-print-area,\n        #invoice-print-area * {\n          visibility: visible !important;\n        }\n\n        .invoice-modal-backdrop {\n          position: static !important;\n          display: block !important;\n          width: 100% !important;\n          height: auto !important;\n          min-height: 0 !important;\n          margin: 0 !important;\n          padding: 0 !important;\n          overflow: visible !important;\n          background: #ffffff !important;\n          backdrop-filter: none !important;\n        }\n\n        .invoice-detail-modal {\n          position: static !important;\n          display: block !important;\n          width: 100% !important;\n          max-width: none !important;\n          max-height: none !important;\n          height: auto !important;\n          min-height: 0 !important;\n          margin: 0 !important;\n          padding: 0 !important;\n          overflow: visible !important;\n          border: 0 !important;\n          border-radius: 0 !important;\n          box-shadow: none !important;\n          background: #ffffff !important;\n          color: #111827 !important;\n        }\n\n        #invoice-print-area {\n          position: fixed !important;\n          top: 0 !important;\n          left: 0 !important;\n          z-index: 2147483647 !important;\n          display: block !important;\n          width: 100% !important;\n          max-width: none !important;\n          height: auto !important;\n          max-height: none !important;\n          margin: 0 !important;\n          padding: 0 !important;\n          overflow: visible !important;\n          border: 0 !important;\n          border-radius: 0 !important;\n          box-shadow: none !important;\n          background: #ffffff !important;\n          color: #111827 !important;\n          font-size: 12px !important;\n          -webkit-print-color-adjust: exact;\n          print-color-adjust: exact;\n        }\n\n        #invoice-print-area .table-wrapper {\n          width: 100% !important;\n          max-width: none !important;\n          height: auto !important;\n          max-height: none !important;\n          margin: 0 0 18px !important;\n          padding: 0 !important;\n          overflow: visible !important;\n        }\n\n        #invoice-print-area .products-table {\n          width: 100% !important;\n          min-width: 0 !important;\n          table-layout: auto !important;\n          border-collapse: collapse !important;\n          background: #ffffff !important;\n        }\n\n        #invoice-print-area .products-table th,\n        #invoice-print-area .products-table td {\n          padding: 7px 5px !important;\n          border: 1px solid #d9dee7 !important;\n          background: #ffffff !important;\n          color: #111827 !important;\n          font-size: 10px !important;\n          overflow-wrap: anywhere !important;\n        }\n\n        #invoice-print-area .products-table th {\n          background: #f0f2f5 !important;\n          color: #111827 !important;\n        }\n\n        #invoice-print-area .invoice-paper-heading,\n        #invoice-print-area .invoice-paper-meta,\n        #invoice-print-area .invoice-paper-totals,\n        #invoice-print-area .invoice-note {\n          break-inside: avoid;\n          page-break-inside: avoid;\n        }\n\n        #invoice-print-area tr {\n          break-inside: avoid;\n          page-break-inside: avoid;\n        }\n\n        #invoice-print-area .invoice-paper-heading h2,\n        #invoice-print-area .invoice-paper-heading p,\n        #invoice-print-area .invoice-paper-number strong,\n        #invoice-print-area .invoice-paper-number span,\n        #invoice-print-area .invoice-paper-meta span,\n        #invoice-print-area .invoice-paper-meta strong,\n        #invoice-print-area .invoice-paper-totals span,\n        #invoice-print-area .invoice-paper-totals strong,\n        #invoice-print-area .invoice-note {\n          color: #111827 !important;\n        }\n\n        .no-print {\n          display: none !important;\n          visibility: hidden !important;\n        }\n      }\n";
    document.head.appendChild(style);
    return () => style.remove();
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
 "Language":"Langue","Logout":"Déconnexion","Workspace":"Espace de travail","Your business performance overview.":"Vue d’ensemble des performances de votre entreprise.",
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
 "Language":"اللغة","Logout":"تسجيل الخروج","Workspace":"مساحة العمل","Your business performance overview.":"نظرة عامة على أداء أعمالك.",
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
  canAccessPage,
  onNavigate,
  mobileOpen,
  onClose,
  locale,
  onLocaleChange,
  onLogout,
  isOwner,
  organizationId,
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage("");
    try {
      const result = await requestOrganizationSync(organizationId);
      setSyncMessage(`Synchronized at ${new Date(result.refreshedAt).toLocaleTimeString()}`);
    } catch (error) {
      setSyncMessage(error?.message || "Synchronization failed.");
    } finally {
      setSyncing(false);
    }
  };
  const [expanded, setExpanded] = useState({
    "Point of Sale": activePage === "Sales History",
    Purchases: activePage === "Purchases" || activePage === "Purchase History",
    "Suppliers List": activePage === "Supplier Debts",
    Products:
      activePage === "Products" ||
      activePage === "Product Purchase History" ||
      activePage === "Product Sales History",
  });
  const visibleNavGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      children: item.children?.filter((child) => canAccessPage(child.page || child.label)),
    })).filter((item) => canAccessPage(item.label) || Boolean(item.children?.length)),
  })).filter((group) => group.items.length > 0);

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
          {visibleNavGroups.map((group) => (
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
                          onNavigate("Purchases");
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
          {isOwner && (
            <div className="sidebar-sync-control">
              <button className="nav-item sidebar-sync-button" type="button" onClick={handleSyncNow} disabled={syncing} title="Synchronize all connected users in this organization">
                <RefreshCw size={18} className={syncing ? "sync-spinning" : ""} />
                <span>{syncing ? tr(locale, "Synchronizing…") : tr(locale, "Sync now")}</span>
              </button>
              {syncMessage && <div className="sidebar-sync-message" role="status">{syncMessage}</div>}
            </div>
          )}
          <div className="sidebar-language">
            <div className="sidebar-language-title"><Languages size={15} /><span>{tr(locale, "Language")}</span></div>
            <div className="sidebar-language-options" role="group" aria-label={tr(locale, "Language")}>
              {[{code:"en",short:"EN",label:"English"},{code:"fr",short:"FR",label:"Français"},{code:"ar",short:"ع",label:"العربية"}].map((language) => (
                <button key={language.code} type="button" className={`sidebar-language-option ${locale===language.code?"active":""}`} aria-pressed={locale===language.code} title={language.label} onClick={()=>onLocaleChange(language.code)}>{language.short}</button>
              ))}
            </div>
          </div>
          <button className="sidebar-logout-button" type="button" onClick={onLogout} title={tr(locale, "Logout")}>
            <LogOut size={17} />
            <span>{tr(locale, "Logout")}</span>
          </button>
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
    "Purchases": "Manage purchase invoices, supplier accounts, and incoming inventory.",
    "Purchase History": "Search and review all purchase invoices.",
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

function readDashboardArray(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function dashboardDate(record) {
  const value = record?.completedAt || record?.closedAt || record?.date || record?.createdAt || record?.updatedAt;
  const parsed = value ? new Date(value) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed : null;
}

function dashboardTotal(record) {
  const direct = Number(record?.total ?? record?.grandTotal ?? record?.amount);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const lines = Array.isArray(record?.items) ? record.items : Array.isArray(record?.lines) ? record.lines : [];
  return lines.reduce((sum, line) => sum + Math.max(0, Number(line.lineTotal ?? line.total ?? (Number(line.qty ?? line.quantity ?? 0) * Number(line.price ?? line.unitPrice ?? 0))) || 0), 0);
}

function Dashboard({ onNavigate, locale }) {
  const [dashboardData, setDashboardData] = useState(() => ({
    sales: readDashboardArray("veltro_completed_sales"),
    purchases: readDashboardArray("veltro_purchase_invoices"),
    products: readDashboardArray("veltro_products"),
  }));
  const [period, setPeriod] = useState("7d");
  const [refreshedAt, setRefreshedAt] = useState(new Date());

  useEffect(() => {
    const refresh = () => {
      setDashboardData({
        sales: readDashboardArray("veltro_completed_sales"),
        purchases: readDashboardArray("veltro_purchase_invoices"),
        products: readDashboardArray("veltro_products"),
      });
      setRefreshedAt(new Date());
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const now = new Date();
  const dayKey = date => date ? [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-") : "";
  const monthKey = date => date ? [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0")].join("-") : "";
  const todayKey = dayKey(now);
  const thisMonthKey = monthKey(now);
  const sales = dashboardData.sales.filter(sale => String(sale.status || "Completed").toLowerCase() !== "cancelled");
  const purchases = dashboardData.purchases.filter(purchase => !["pending","draft","cancelled"].includes(String(purchase.status || "posted").toLowerCase()));
  const totalForSale = sale => dashboardTotal(sale);
  const paidForSale = sale => Math.max(0, Number(sale.paid ?? sale.amountPaid ?? 0) || 0);
  const remainingForSale = sale => Math.max(0, Number(sale.remaining ?? (totalForSale(sale) - paidForSale(sale))) || 0);
  const profitForSale = sale => {
    const products = dashboardData.products;
    const lines = Array.isArray(sale.items) ? sale.items : [];
    return lines.reduce((sum, line) => {
      const productId = String(line.productId ?? line.id ?? "");
      const product = products.find(item => String(item.id) === productId || (line.sku && item.sku === line.sku));
      const qty = Math.max(0, Number(line.qty ?? line.quantity ?? 0) || 0);
      const price = Math.max(0, Number(line.price ?? line.unitPrice ?? product?.price ?? 0) || 0);
      const cost = Math.max(0, Number(line.purchasePrice ?? line.costPrice ?? product?.purchasePrice ?? 0) || 0);
      return sum + (price - cost) * qty;
    }, 0);
  };
  const inToday = record => dayKey(dashboardDate(record)) === todayKey;
  const inThisMonth = record => monthKey(dashboardDate(record)) === thisMonthKey;
  const sum = (records, getter) => records.reduce((total, record) => total + getter(record), 0);
  const salesToday = sales.filter(inToday);
  const salesMonth = sales.filter(inThisMonth);
  const purchasesToday = purchases.filter(inToday);
  const purchasesMonth = purchases.filter(inThisMonth);
  const salesTodayTotal = sum(salesToday, totalForSale);
  const salesMonthTotal = sum(salesMonth, totalForSale);
  const paidToday = sum(salesToday, paidForSale);
  const paidMonth = sum(salesMonth, paidForSale);
  const profitToday = sum(salesToday, profitForSale);
  const profitMonth = sum(salesMonth, profitForSale);
  const stockUnits = sum(dashboardData.products, item => Math.max(0, Number(item.stock) || 0));
  const stockValue = sum(dashboardData.products, item => Math.max(0, Number(item.stock) || 0) * Math.max(0, Number(item.purchasePrice) || 0));
  const lowStock = dashboardData.products.filter(item => Number(item.stock) <= Number(item.minStock ?? item.minimumStock ?? 0)).length;
  const receivables = sum(sales, remainingForSale);
  const purchaseSpendToday = sum(purchasesToday, dashboardTotal);
  const purchaseSpendMonth = sum(purchasesMonth, dashboardTotal);
  const money = value => new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "ar" ? "ar-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0) + " DA";
  const number = value => new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "ar" ? "ar-DZ" : "en-US", { maximumFractionDigits: 0 }).format(value);
  const label = (en, fr, ar) => locale === "ar" ? ar : locale === "fr" ? fr : en;
  const dayCount = period === "30d" ? 30 : 7;
  const lastDays = Array.from({length: dayCount}, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayCount - 1 - index));
    const key = dayKey(date);
    const matches = sales.filter(sale => dayKey(dashboardDate(sale)) === key);
    const purchaseMatches = purchases.filter(purchase => dayKey(dashboardDate(purchase)) === key);
    return {
      label: date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "short" }),
      sales: sum(matches, totalForSale),
      collected: sum(matches, paidForSale),
      profit: sum(matches, profitForSale),
      purchases: sum(purchaseMatches, dashboardTotal),
      invoices: matches.length,
    };
  });
  const lastMonths = Array.from({length: 6}, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    const matches = sales.filter(sale => monthKey(dashboardDate(sale)) === key);
    const purchaseMatches = purchases.filter(purchase => monthKey(dashboardDate(purchase)) === key);
    return {
      label: date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US", { month: "short" }),
      sales: sum(matches, totalForSale),
      collected: sum(matches, paidForSale),
      profit: sum(matches, profitForSale),
      purchases: sum(purchaseMatches, dashboardTotal),
      invoices: matches.length,
    };
  });
  const topProducts = dashboardData.products.map(product => {
    const sold = sales.reduce((total, sale) => total + (sale.items || []).reduce((lineTotal, line) => {
      const same = String(line.productId ?? line.id ?? "") === String(product.id) || (line.sku && line.sku === product.sku);
      return lineTotal + (same ? Math.max(0, Number(line.qty ?? line.quantity ?? 0) || 0) : 0);
    }, 0), 0);
    return { ...product, sold };
  }).filter(product => product.sold > 0).sort((a,b) => b.sold-a.sold).slice(0,5);
  const tooltipStyle = { background: "#101827", border: "1px solid rgba(148,163,184,.2)", borderRadius: 12, color: "#edf4ff", fontSize: 12 };
  const cards = [
    { title: label("Sales today","Ventes du jour","مبيعات اليوم"), value: money(salesTodayTotal), note: label(salesToday.length + " invoices today", salesToday.length + " factures aujourd’hui", salesToday.length + " فاتورة اليوم"), icon: ShoppingCart, tone: "teal", onClick: "Sales History" },
    { title: label("Sales this month","Ventes du mois","مبيعات الشهر"), value: money(salesMonthTotal), note: label(salesMonth.length + " completed invoices", salesMonth.length + " factures terminées", salesMonth.length + " فاتورة مكتملة"), icon: BarChart3, tone: "violet", onClick: "Sales History" },
    { title: label("Collected today","Encaissements du jour","المقبوضات اليوم"), value: money(paidToday), note: label("Payments received", "Paiements reçus", "المبالغ المقبوضة"), icon: Wallet, tone: "blue", onClick: "Cash Register" },
    { title: label("Collected this month","Encaissements du mois","المقبوضات هذا الشهر"), value: money(paidMonth), note: label("Payments received", "Paiements reçus", "المبالغ المقبوضة"), icon: CreditCard, tone: "green", onClick: "Cash Register" },
    { title: label("Estimated profit today","Profit estimé du jour","الربح التقديري اليوم"), value: money(profitToday), note: label("Sales minus estimated item cost", "Ventes moins coût estimé", "المبيعات ناقص تكلفة الشراء التقديرية"), icon: Wallet, tone: "green", onClick: "Reports" },
    { title: label("Estimated profit this month","Profit estimé du mois","الربح التقديري هذا الشهر"), value: money(profitMonth), note: label("Uses current product purchase costs", "Basé sur les coûts d’achat actuels", "يعتمد على أسعار الشراء الحالية للمنتجات"), icon: BarChart3, tone: "violet", onClick: "Reports" },
    { title: label("Purchases today","Achats du jour","مشتريات اليوم"), value: money(purchaseSpendToday), note: label(purchasesToday.length + " purchase vouchers", purchasesToday.length + " bons d’achat", purchasesToday.length + " بون شراء"), icon: ReceiptText, tone: "orange", onClick: "Purchase History" },
    { title: label("Purchases this month","Achats du mois","مشتريات الشهر"), value: money(purchaseSpendMonth), note: label(purchasesMonth.length + " purchase vouchers", purchasesMonth.length + " bons d’achat", purchasesMonth.length + " بون شراء"), icon: Boxes, tone: "orange", onClick: "Purchase History" },
  ];
  const metricLabels = [
    { title: label("Inventory cost value","Valeur du stock au coût d’achat","قيمة المخزون بسعر الشراء"), value: money(stockValue), note: number(stockUnits) + " " + label("units in stock","unités en stock","وحدة في المخزون"), icon: Package, onClick: "Products" },
    { title: label("Customer receivables","Créances clients","ديون العملاء"), value: money(receivables), note: label("Outstanding balance on sales", "Solde restant sur les ventes", "المبالغ المتبقية على المبيعات"), icon: Users, onClick: "Sales History" },
    { title: label("Products at low stock","Produits en stock faible","منتجات منخفضة المخزون"), value: number(lowStock), note: label("At or below minimum stock", "Au seuil minimum ou en dessous", "بلغت الحد الأدنى أو أقل"), icon: AlertTriangle, onClick: "Products" },
    { title: label("Completed invoices","Factures terminées","الفواتير المكتملة"), value: number(sales.length), note: label("All recorded sales", "Toutes les ventes enregistrées", "كل عمليات البيع المسجلة"), icon: ReceiptText, onClick: "Sales History" },
  ];
  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <span className="dashboard-eyebrow">{label("BUSINESS PERFORMANCE CENTER","CENTRE DE PERFORMANCE","مركز أداء الأعمال")}</span>
          <h1>{label("Business overview","Vue d’ensemble","نظرة عامة على الأعمال")}</h1>
          <p>{label("Daily sales, monthly performance, cash flow and inventory — all in one place.","Ventes quotidiennes, performances mensuelles, trésorerie et stock au même endroit.","المبيعات اليومية والأداء الشهري والتدفقات النقدية والمخزون في مكان واحد.")}</p>
          <div className="dashboard-welcome-bottom"><span><CalendarDays size={15} /> {now.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span><span className="dashboard-live-dot">{label("Live local data","Données locales en direct","بيانات محلية مباشرة")}</span></div>
        </div>
        <div className="dashboard-welcome-art"><div className="dashboard-art-ring ring-one"></div><div className="dashboard-art-ring ring-two"></div><div className="dashboard-art-center"><BarChart3 size={36} /></div><div className="dashboard-art-mini mini-one"><TrendingUp size={17}/><span>{label("Sales","Ventes","المبيعات")}</span></div><div className="dashboard-art-mini mini-two"><Wallet size={17}/><span>{label("Cash flow","Trésorerie","التدفق النقدي")}</span></div></div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head"><div><h2>{label("Performance indicators","Indicateurs de performance","مؤشرات الأداء")}</h2><p>{label("Actual figures from recorded invoices and inventory.","Chiffres réels des factures et du stock enregistrés.","أرقام فعلية من الفواتير والمخزون المسجل.")}</p></div><button className="dashboard-refresh" onClick={() => { setDashboardData({sales:readDashboardArray("veltro_completed_sales"),purchases:readDashboardArray("veltro_purchase_invoices"),products:readDashboardArray("veltro_products")}); setRefreshedAt(new Date()); }}><RefreshCw size={15}/>{label("Refresh","Actualiser","تحديث")}</button></div>
        <div className="dashboard-kpi-grid">{cards.map((card,index) => { const Icon=card.icon; return <button type="button" key={card.title} className={"dashboard-kpi-card tone-"+card.tone} onClick={() => onNavigate(card.onClick)}><span className="dashboard-kpi-icon"><Icon size={19}/></span><span className="dashboard-kpi-title">{card.title}</span><strong className="dashboard-kpi-value">{card.value}</strong><span className="dashboard-kpi-note">{card.note}</span></button>; })}</div>
        <div className="dashboard-secondary-grid">{metricLabels.map(card=>{const Icon=card.icon;return <button type="button" className="dashboard-secondary-card" key={card.title} onClick={()=>onNavigate(card.onClick)}><span className="dashboard-secondary-icon"><Icon size={18}/></span><span><small>{card.title}</small><strong>{card.value}</strong><em>{card.note}</em></span><ChevronRight size={17}/></button>;})}</div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-head"><div><h2>{label("Sales and revenue analytics","Analyse des ventes et revenus","تحليلات المبيعات والإيرادات")}</h2><p>{label("Compare sales totals, collected payments and estimated profit.","Comparez le chiffre d’affaires, les encaissements et le bénéfice estimé.","قارن إجمالي المبيعات والمبالغ المقبوضة والربح التقديري.")}</p></div><div className="dashboard-period-switch"><button className={period==="7d"?"active":""} onClick={()=>setPeriod("7d")}>{label("7 days","7 jours","7 أيام")}</button><button className={period==="30d"?"active":""} onClick={()=>setPeriod("30d")}>{label("30 days","30 jours","30 يومًا")}</button></div></div>
        <div className="dashboard-chart-grid">
          <article className="dashboard-chart-card dashboard-chart-wide"><div className="dashboard-chart-heading"><div><h3>{label("Daily sales & collections","Ventes et encaissements quotidiens","المبيعات والمقبوضات اليومية")}</h3><p>{label("Daily totals for the selected period","Totaux quotidiens pour la période choisie","الإجماليات اليومية للفترة المحددة")}</p></div><span className="dashboard-chart-tag">{period==="7d"?label("Last 7 days","7 derniers jours","آخر 7 أيام"):label("Last 30 days","30 derniers jours","آخر 30 يومًا")}</span></div><div className="dashboard-chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={lastDays} margin={{top:10,right:8,left:0,bottom:0}}><CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{fill:"#8493a9",fontSize:11}} axisLine={false} tickLine={false} interval={period==="30d"?4:0}/><YAxis tick={{fill:"#8493a9",fontSize:11}} axisLine={false} tickLine={false} width={58} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":String(v)}/><Tooltip contentStyle={tooltipStyle} formatter={(value,name)=>[money(Number(value)),name==="sales"?label("Sales","Ventes","المبيعات"):label("Collected","Encaissé","المقبوضات")]}/><Legend wrapperStyle={{fontSize:11,color:"#9aa8bb"}}/><Bar dataKey="sales" name={label("Sales","Ventes","المبيعات")} fill="#35d6c5" radius={[5,5,0,0]} maxBarSize={period==="30d"?18:34}/><Bar dataKey="collected" name={label("Collected","Encaissé","المقبوضات")} fill="#8b7bff" radius={[5,5,0,0]} maxBarSize={period==="30d"?18:34}/></BarChart></ResponsiveContainer></div></article>
          <article className="dashboard-chart-card"><div className="dashboard-chart-heading"><div><h3>{label("Sales vs purchases","Ventes vs achats","المبيعات مقابل المشتريات")}</h3><p>{label("Daily business movement","Mouvements quotidiens","حركة النشاط اليومية")}</p></div></div><div className="dashboard-chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={lastDays} margin={{top:10,right:4,left:0,bottom:0}}><defs><linearGradient id="dashSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#35d6c5" stopOpacity={.28}/><stop offset="95%" stopColor="#35d6c5" stopOpacity={0}/></linearGradient><linearGradient id="dashPurchasesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f5a65b" stopOpacity={.2}/><stop offset="95%" stopColor="#f5a65b" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{fill:"#8493a9",fontSize:10}} axisLine={false} tickLine={false} interval={period==="30d"?5:0}/><YAxis tick={{fill:"#8493a9",fontSize:10}} axisLine={false} tickLine={false} width={48} tickFormatter={v=>v>=1000?(v/1000).toFixed(0)+"k":String(v)}/><Tooltip contentStyle={tooltipStyle} formatter={value=>money(Number(value))}/><Area type="monotone" dataKey="sales" name={label("Sales","Ventes","المبيعات")} stroke="#35d6c5" strokeWidth={2.5} fill="url(#dashSalesFill)"/><Area type="monotone" dataKey="purchases" name={label("Purchases","Achats","المشتريات")} stroke="#f5a65b" strokeWidth={2} fill="url(#dashPurchasesFill)"/></AreaChart></ResponsiveContainer></div></article>
          <article className="dashboard-chart-card dashboard-chart-wide"><div className="dashboard-chart-heading"><div><h3>{label("Monthly sales, collections & profit","Ventes, encaissements et bénéfice mensuels","المبيعات والمقبوضات والأرباح الشهرية")}</h3><p>{label("Six-month business performance","Performances sur six mois","أداء النشاط خلال ستة أشهر")}</p></div></div><div className="dashboard-chart-area dashboard-chart-area-tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={lastMonths} margin={{top:10,right:10,left:0,bottom:0}}><CartesianGrid stroke="rgba(148,163,184,.12)" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{fill:"#8493a9",fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#8493a9",fontSize:11}} axisLine={false} tickLine={false} width={58} tickFormatter={v=>v>=1000000?(v/1000000).toFixed(1)+"M":v>=1000?(v/1000).toFixed(0)+"k":String(v)}/><Tooltip contentStyle={tooltipStyle} formatter={(value,name)=>[money(Number(value)),name==="sales"?label("Sales","Ventes","المبيعات"):name==="collected"?label("Collected","Encaissé","المقبوضات"):label("Estimated profit","Bénéfice estimé","الربح التقديري")]}/><Legend wrapperStyle={{fontSize:11,color:"#9aa8bb"}}/><Line type="monotone" dataKey="sales" name={label("Sales","Ventes","المبيعات")} stroke="#35d6c5" strokeWidth={2.5} dot={{r:3,fill:"#35d6c5"}} activeDot={{r:5}}/><Line type="monotone" dataKey="collected" name={label("Collected","Encaissé","المقبوضات")} stroke="#8b7bff" strokeWidth={2.5} dot={{r:3,fill:"#8b7bff"}}/><Line type="monotone" dataKey="profit" name={label("Estimated profit","Bénéfice estimé","الربح التقديري")} stroke="#65d98a" strokeWidth={2.5} dot={{r:3,fill:"#65d98a"}}/></LineChart></ResponsiveContainer></div></article>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-chart-card dashboard-top-products"><div className="dashboard-chart-heading"><div><h3>{label("Best-selling products","Produits les plus vendus","المنتجات الأكثر مبيعًا")}</h3><p>{label("Ranked by units sold across recorded invoices","Classés par unités vendues","مرتبة حسب عدد الوحدات المباعة")}</p></div><button className="dashboard-text-link" onClick={()=>onNavigate("Products")}>{label("View products","Voir les produits","عرض المنتجات")} <ChevronRight size={15}/></button></div>
          {topProducts.length ? <div className="dashboard-top-list">{topProducts.map((product,index)=> <div className="dashboard-top-row" key={product.id}><span className="dashboard-rank">{String(index+1).padStart(2,"0")}</span><span className="dashboard-product-mark"><Package size={17}/></span><span className="dashboard-product-name"><strong>{product.name}</strong><small>{product.sku || product.id}</small></span><span className="dashboard-product-sold"><strong>{number(product.sold)}</strong><small>{label("units sold","unités vendues","وحدة مباعة")}</small></span><div className="dashboard-product-bar"><span style={{width:(product.sold/Math.max(1,topProducts[0].sold)*100)+"%"}}/></div></div>)}</div> : <div className="dashboard-empty-chart"><Package size={25}/><strong>{label("No sales data yet","Aucune vente enregistrée","لا توجد مبيعات مسجلة بعد")}</strong><span>{label("Completed invoices will populate this ranking.","Les factures terminées alimenteront ce classement.","ستظهر المنتجات هنا بعد تسجيل فواتير بيع مكتملة.")}</span></div>}
        </article>
        <article className="dashboard-chart-card dashboard-health-card"><div className="dashboard-chart-heading"><div><h3>{label("Inventory health","État du stock","حالة المخزون")}</h3><p>{label("Current inventory overview","Vue du stock actuel","نظرة عامة على المخزون الحالي")}</p></div></div><div className="dashboard-health-main"><span className="dashboard-health-icon"><Package size={22}/></span><div><small>{label("Units currently in stock","Unités actuellement en stock","الوحدات الموجودة حاليًا")}</small><strong>{number(stockUnits)}</strong></div></div><div className="dashboard-health-line"><span>{label("Products in catalog","Produits au catalogue","المنتجات في القائمة")}</span><strong>{number(dashboardData.products.length)}</strong></div><div className="dashboard-health-line"><span>{label("Low-stock products","Produits à faible stock","منتجات منخفضة المخزون")}</span><strong className={lowStock?"dashboard-warning-text":""}>{number(lowStock)}</strong></div><div className="dashboard-health-line"><span>{label("Inventory cost value","Valeur du stock au coût","قيمة المخزون بسعر التكلفة")}</span><strong>{money(stockValue)}</strong></div><button className="dashboard-health-button" onClick={()=>onNavigate("Products")}>{label("Manage inventory","Gérer le stock","إدارة المخزون")} <ChevronRight size={15}/></button></article>
      </section>
      <div className="dashboard-footer-note"><span>{label("Last refreshed","Dernière actualisation","آخر تحديث")} {refreshedAt.toLocaleTimeString(locale==="ar"?"ar-DZ":locale==="fr"?"fr-FR":"en-US",{hour:"2-digit",minute:"2-digit"})}</span><span>{label("Estimated profit is based on the current purchase price saved on each product; it is not a formal accounting result.","Le bénéfice estimé utilise le prix d’achat actuel de chaque produit ; il ne constitue pas un résultat comptable officiel.","الربح التقديري محسوب باستخدام سعر الشراء الحالي للمنتج، وليس نتيجة محاسبية رسمية.")}</span></div>
    </div>
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

const pagePermissionOptions = {
  Dashboard: ["dashboard.view"],
  Settings: ["settings.manage", "users.view", "users.manage", "roles.manage"],
  "Point of Sale": ["sales.create"],
  "Sales History": ["sales.view"],
  Purchases: ["purchases.view", "purchases.create"],
  "Purchase History": ["purchases.view"],
  Products: ["products.view"],
  "Product Purchase History": ["products.view"],
  "Product Sales History": ["products.view"],
  Categories: ["products.view"],
  Orders: ["sales.view"],
  "Suppliers List": ["suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.delete"],
  "Supplier Debts": ["suppliers.debts.view"],
  Customers: ["customers.view", "customers.create", "customers.edit", "customers.delete"],
  "Cash Register": ["cash_register.view", "cash_register.manage", "cash_register.open_drawer", "cash_register.close"],
  Reports: ["reports.view", "profits.view"],
};

export default function App({ onLogout, currentUser }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [workspaceAccess, setWorkspaceAccess] = useState({ loading: true, error: "", profile: null, permissionCodes: [] });

  useEffect(() => {
    let cancelled = false;
    async function loadWorkspaceAccess() {
      if (!currentUser?.id) {
        setWorkspaceAccess({ loading: false, error: "No authenticated user was found.", profile: null, permissionCodes: [] });
        return;
      }
      setWorkspaceAccess((previous) => ({ ...previous, loading: true, error: "" }));
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, organization_id, role_id, full_name, is_owner, status")
          .eq("user_id", currentUser.id)
          .single();
        if (profileError) throw profileError;
        if (!profile || profile.status !== "active") throw new Error("This workspace account is missing or disabled.");

        const { data: permissions, error: permissionsError } = await supabase
          .from("permissions")
          .select("id, code");
        if (permissionsError) throw permissionsError;

        let permissionCodes = [];
        if (profile.is_owner) {
          permissionCodes = (permissions || []).map((permission) => permission.code);
        } else if (profile.role_id) {
          const { data: rolePermissions, error: rolePermissionsError } = await supabase
            .from("role_permissions")
            .select("permission_id")
            .eq("role_id", profile.role_id);
          if (rolePermissionsError) throw rolePermissionsError;
          const assignedIds = new Set((rolePermissions || []).map((item) => item.permission_id));
          permissionCodes = (permissions || []).filter((permission) => assignedIds.has(permission.id)).map((permission) => permission.code);
        }
        if (!cancelled) setWorkspaceAccess({ loading: false, error: "", profile, permissionCodes });
      } catch (error) {
        console.error("Unable to load workspace access:", error);
        if (!cancelled) setWorkspaceAccess({ loading: false, error: error?.message || "Could not load this account's permissions.", profile: null, permissionCodes: [] });
      }
    }
    loadWorkspaceAccess();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    const organizationId = workspaceAccess.profile?.organization_id;
    if (!organizationId || workspaceAccess.loading || workspaceAccess.error) return undefined;

    const stopSync = startOrganizationRealtimeSync({
      organizationId,
      userId: currentUser?.id,
    });

    return () => stopSync?.();
  }, [workspaceAccess.profile?.organization_id, workspaceAccess.loading, workspaceAccess.error, currentUser?.id]);

  const workspaceUser = workspaceAccess.profile
    ? {
        ...currentUser,
        full_name: workspaceAccess.profile.full_name || currentUser?.user_metadata?.full_name || currentUser?.email || "User",
        user_metadata: {
          ...(currentUser?.user_metadata || {}),
          full_name: workspaceAccess.profile.full_name || currentUser?.user_metadata?.full_name || currentUser?.email || "User",
        },
      }
    : currentUser;

  const canAccessPage = (page) => {
    if (workspaceAccess.profile?.is_owner) return true;
    const required = pagePermissionOptions[page] || [];
    return required.some((code) => workspaceAccess.permissionCodes.includes(code));
  };
  const navigateToPage = (page) => {
    if (canAccessPage(page)) setActivePage(page);
    else window.alert("Access denied: your assigned role does not allow this section.");
  };

  useEffect(() => {
    if (workspaceAccess.loading || workspaceAccess.error || canAccessPage(activePage)) return;
    const fallback = ["Dashboard", "Point of Sale", "Products", "Purchases", "Customers", "Cash Register", "Settings"].find((page) => canAccessPage(page));
    if (fallback) setActivePage(fallback);
  }, [workspaceAccess.loading, workspaceAccess.error, workspaceAccess.profile, workspaceAccess.permissionCodes, activePage]);
  const [locale, setLocale] = useState(() => {
    try { const saved = window.localStorage.getItem("veltro-language"); return ["en","fr","ar"].includes(saved) ? saved : "en"; }
    catch { return "en"; }
  });
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const direction = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.body.dir = direction;
    document.documentElement.dataset.locale = locale;
    try {
      window.localStorage.setItem("veltro-language", locale);
    } catch {
      // Storage may be unavailable in private browsing.
    }

    // Use body so dynamically mounted dialogs and overlays outside #root
    // are translated too.
    const root = document.body;
    translatePage(locale, root);

    // Translate newly rendered text and updated field/button attributes without
    // changing React state, business data, calculations, or event handlers.
    const observer = new MutationObserver(() => translatePage(locale, root));
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label", "aria-description"],
    });

    return () => observer.disconnect();
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

  if (workspaceAccess.loading) {
    return <div className="auth-loading-screen" role="status">Loading your workspace permissions…</div>;
  }
  if (workspaceAccess.error) {
    return <div className="auth-loading-screen" role="alert"><p>Unable to load your workspace account: {workspaceAccess.error}</p><button type="button" onClick={onLogout}>Sign out</button></div>;
  }

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
          onNavigate={navigateToPage}
          canAccessPage={canAccessPage}
          onLogout={onLogout}
          isOwner={Boolean(workspaceAccess.profile?.is_owner)}
          organizationId={workspaceAccess.profile?.organization_id}
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
          {activePage === "Settings" ? (
            <SettingsPage locale={locale} onLocaleChange={setLocale} currentUser={workspaceUser} />
          ) : activePage === "Dashboard" ? (
            <Dashboard onNavigate={navigateToPage} locale={locale} />
          ) : activePage === "Point of Sale" ? (
            <POS currentUserName={workspaceAccess.profile?.full_name || currentUser?.email || "User"} locale={locale} />
          ) : activePage === "Products" ? (
            <Products />
          ) : activePage === "Sales History" ? (
            <SalesHistory />
          ) : activePage === "Purchases" ? (
            <Purchases view="dashboard" currentUser={workspaceUser} />
          ) : activePage === "Purchase History" ? (
            <Purchases view="history" currentUser={workspaceUser} />
          ) : activePage === "Suppliers List" ? (
            <Suppliers />
          ) : activePage === "Supplier Debts" ? (
            <SupplierDebts />
          ) : activePage === "Customers" ? (
            <Customers />
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
