import React from "react";
import {
  FileText,
  UserRound,
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";

export function SalesSidebar({
  invoiceNumber,
  customer,
  onCustomerChange,
  paid,
  onPaidChange,
  remaining,
  newAmount,
}) {
  const now = new Date();

  const date = now.toLocaleDateString("en-GB");
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  return (
    <aside className="sales-sidebar">
      <section className="sales-side-section">
        <div className="sales-section-heading">
          <FileText size={18} />
          <h3>Invoice Information</h3>
        </div>

        <div className="sales-info-card">
          <span className="sales-field-label">
            Invoice Number
          </span>
          <strong>INV-{invoiceNumber}</strong>
        </div>

        <div className="sales-info-grid">
          <div className="sales-info-card">
            <CalendarDays size={16} />
            <span className="sales-field-label">Date</span>
            <strong>{date}</strong>
          </div>

          <div className="sales-info-card">
            <Clock3 size={16} />
            <span className="sales-field-label">Time</span>
            <strong>{time}</strong>
          </div>
        </div>
      </section>

      <section className="sales-side-section">
        <div className="sales-section-heading">
          <UserRound size={18} />
          <h3>Current User</h3>
        </div>

        <div className="sales-user-card">
          <div className="sales-user-avatar">A</div>

          <div className="sales-user-details">
            <strong>Administrator</strong>
            <span>Sales Operator</span>
          </div>

          <span className="sales-online-indicator" />
        </div>
      </section>

      <section className="sales-side-section">
        <div className="sales-section-heading">
          <FileText size={18} />
          <h3>Invoice Navigation</h3>
        </div>

        <div className="sales-navigation-buttons">
          <button
            type="button"
            className="sales-navigation-button"
            disabled
            title="Previous invoice"
          >
            <ChevronLeft size={17} />
            Previous
          </button>

          <button
            type="button"
            className="sales-navigation-button"
            disabled
            title="Next invoice"
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>

        <p className="sales-helper-text">
          Invoice navigation will be enabled when invoice
          history is connected.
        </p>
      </section>

      <section className="sales-side-section">
        <div className="sales-section-heading">
          <Wallet size={18} />
          <h3>Customer &amp; Account</h3>
        </div>

        <label
          className="sales-field-label"
          htmlFor="sales-customer"
        >
          Customer Name
        </label>

        <input
          id="sales-customer"
          className="sales-input"
          type="text"
          placeholder="Walk-in customer"
          value={customer}
          onChange={(event) =>
            onCustomerChange?.(event.target.value)
          }
        />

        <div className="sales-account-card">
          <div className="sales-account-row">
            <span>
              <CreditCard size={15} />
              Previous Debt
            </span>
            <strong>{money(0)}</strong>
          </div>

          <div className="sales-account-row">
            <span>
              <Wallet size={15} />
              Paid Amount
            </span>
            <strong>{money(paid)}</strong>
          </div>

          <div className="sales-account-row">
            <span>
              <CircleDollarSign size={15} />
              Remaining Amount
            </span>
            <strong className="sales-remaining-amount">
              {money(remaining)}
            </strong>
          </div>

          <div className="sales-account-divider" />

          <div className="sales-account-row sales-new-amount">
            <span>New Amount</span>
            <strong>{money(newAmount)}</strong>
          </div>
        </div>

        <label
          className="sales-field-label"
          htmlFor="sales-paid"
        >
          Payment Received (DA)
        </label>

        <input
          id="sales-paid"
          className="sales-input"
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter payment amount"
          value={paid}
          onChange={(event) =>
            onPaidChange?.(event.target.value)
          }
        />
      </section>
    </aside>
  );
}

export default SalesSidebar;
