
import React, { useState } from "react";
import {
  ShoppingCart,
  History,
  Plus,
  Search,
  FileText,
} from "lucide-react";
import "./purchases.css";

export default function Purchases() {
  const [activeTab, setActiveTab] = useState("new");
  const [showInvoice, setShowInvoice] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <section className="purchases-page">
      <header className="purchases-header">
        <div>
          <span className="purchases-eyebrow">COMMERCE</span>
          <h1>Purchases</h1>
          <p>Manage purchase invoices and supplier transactions.</p>
        </div>
      </header>

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
              <h2>New Purchase Invoice</h2>
              <p>Start a new invoice for your supplier.</p>
            </div>
          </div>

          <div className="purchases-empty">
            <div className="purchases-empty-icon">
              <ShoppingCart size={30} />
            </div>
            <h3>Ready to create a purchase invoice?</h3>
            <p>
              Select a supplier and add products to begin.
            </p>
            <button
              className="purchases-primary-button"
              onClick={() => setShowInvoice(true)}
            >
              <Plus size={18} />
              Create Purchase Invoice
            </button>
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
              <p>Review your previous purchase invoices.</p>
            </div>
          </div>

          <label className="purchases-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by invoice number or supplier..."
            />
          </label>

          <div className="purchases-history-empty">
            <FileText size={28} />
            <p>Purchase invoices will appear here.</p>
          </div>
        </div>
      )}

      {showInvoice && (
        <div
          className="purchases-modal-backdrop"
          onClick={() => setShowInvoice(false)}
        >
          <div
            className="purchases-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="purchases-modal-close"
              onClick={() => setShowInvoice(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="purchases-heading-icon">
              <ShoppingCart size={22} />
            </div>
            <h2>New Purchase Invoice</h2>
            <p>
              The invoice form will be added in the next step.
            </p>
            <button
              className="purchases-primary-button"
              onClick={() => setShowInvoice(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
