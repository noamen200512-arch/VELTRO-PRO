import React from "react";
import {
  Receipt,
  Percent,
  Banknote,
  Printer,
  Clock,
  CheckCircle2,
  Wallet,
} from "lucide-react";

export function InvoiceSummary({
  subtotal = 0,
  discount = 0,
  onDiscountChange,
  total = 0,
  paid = 0,
  remaining = 0,
  onSavePending,
  onPrint,
}) {
  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  return (
    <section className="invoice-summary">
      <div className="invoice-summary-header">
        <div className="invoice-summary-title">
          <Receipt size={20} />
          <div>
            <h2>Invoice Summary</h2>
            <p>Review the amounts before completing the sale</p>
          </div>
        </div>
      </div>

      <div className="invoice-summary-content">
        <div className="invoice-summary-details">
          <div className="invoice-summary-row">
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div className="invoice-summary-row">
            <label htmlFor="invoice-global-discount">
              <Percent size={15} />
              Global Discount (DA)
            </label>

            <input
              id="invoice-global-discount"
              className="invoice-summary-discount"
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(event) =>
                onDiscountChange?.(event.target.value)
              }
            />
          </div>

          <div className="invoice-summary-row">
            <span>Payment Received</span>
            <strong>{money(paid)}</strong>
          </div>

          <div className="invoice-summary-row">
            <span>
              <Wallet size={15} />
              Remaining Balance
            </span>
            <strong className="invoice-summary-remaining">
              {money(remaining)}
            </strong>
          </div>
        </div>

        <div className="invoice-summary-total">
          <div>
            <span>TOTAL AMOUNT</span>
            <p>Final amount due</p>
          </div>

          <strong>{money(total)}</strong>
        </div>
      </div>

      <div className="invoice-summary-actions">
        <button
          type="button"
          className="invoice-pending-button"
          onClick={() => onSavePending?.()}
        >
          <Clock size={17} />
          Save Pending
        </button>

        <button
          type="button"
          className="invoice-print-button"
          onClick={() => onPrint?.()}
        >
          <Printer size={17} />
          Print Invoice
        </button>

        <button
          type="button"
          className="invoice-complete-button"
          onClick={() => onPrint?.()}
        >
          <CheckCircle2 size={18} />
          Complete Sale
        </button>
      </div>

      <div className="invoice-summary-note">
        <Banknote size={15} />
        <span>
          Please verify the payment and total before finalizing the invoice.
        </span>
      </div>
    </section>
  );
}

export default InvoiceSummary;
