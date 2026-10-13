import React from "react";

export default function PurchaseLayout({
activeTab = "new",
onTabChange = () => {},
children,
}) {
return (
<div className="purchase-layout">
<header className="purchase-page-header">
<div className="purchase-header-info">
<span className="purchase-eyebrow">VELTRO / MANAGEMENT</span>
<h1>Purchases</h1>
<p>
Manage purchase invoices, suppliers, incoming products, and payments.
</p>
</div>

    <div className="purchase-header-status">
      <span className="purchase-status-dot" />
      Purchase Management
    </div>
  </header>

  <nav className="purchase-tabs" aria-label="Purchase sections">
    <button
      type="button"
      className={`purchase-tab ${
        activeTab === "new" ? "active" : ""
      }`}
      onClick={() => onTabChange("new")}
    >
      <span className="purchase-tab-icon">＋</span>
      <span>
        <strong>New Purchase Invoice</strong>
        <small>Create and manage a purchase</small>
      </span>
    </button>

    <button
      type="button"
      className={`purchase-tab ${
        activeTab === "history" ? "active" : ""
      }`}
      onClick={() => onTabChange("history")}
    >
      <span className="purchase-tab-icon">▤</span>
      <span>
        <strong>Purchase History</strong>
        <small>Review previous invoices</small>
      </span>
    </button>
  </nav>

  <main className="purchase-layout-content">{children}</main>
</div>

);
}