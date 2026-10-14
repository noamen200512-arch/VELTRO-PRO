
import React, { useEffect, useState } from "react";
import {
  Receipt,
  Percent,
  Banknote,
  Printer,
  Clock,
  CheckCircle2,
  Wallet,
  LoaderCircle,
} from "lucide-react";

export function InvoiceSummary({
  subtotal = 0,
  discount = 0,
  onDiscountChange,
  total = 0,
  paid = 0,
  onPaidChange,
  remaining = 0,
  previousDebt = 0,
  customerName = "",
  onViewDebtDetails,
  onSavePending,
  onPrint,
  onCompleteSale,
  busy = false,
}) {
  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  const safeDiscount = Math.max(0, Number(discount) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const safePaid = Math.max(0, Number(paid) || 0);
  const [paidDraft, setPaidDraft] = useState(String(paid ?? 0));

  useEffect(() => {
    setPaidDraft(String(paid ?? 0));
  }, [paid]);
  const safeRemaining = Math.max(0, Number(remaining) || 0);
  const safePreviousDebt = Math.max(0, Number(previousDebt) || 0);

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
              max={Math.max(0, Number(subtotal) || 0)}
              step="0.01"
              value={discount}
              disabled={busy}
              onChange={(event) => {
                const value = Math.max(
                  0,
                  Number(event.target.value) || 0
                );

                onDiscountChange?.(
                  Math.min(value, Math.max(0, Number(subtotal) || 0))
                );
              }}
            />
          </div>

          <div className="invoice-summary-row">
            <span>Invoice Total</span>
            <strong>{money(safeTotal)}</strong>
          </div>

          <div className="invoice-summary-row invoice-summary-payment-row">
            <label htmlFor="invoice-payment-received"><Banknote size={15} /> Payment Received (DA)</label>
            <input
              id="invoice-payment-received"
              className="invoice-summary-payment-input"
              type="number"
              inputMode="decimal"
              min="0"
              max={safeTotal}
              step="any"
              value={paidDraft}
              disabled={busy}
              onChange={(event) => setPaidDraft(event.target.value)}
              onBlur={() => {
                const value = paidDraft.trim() === "" ? 0 : Number(paidDraft);
                if (Number.isFinite(value) && value >= 0) {
                  const nextPaid = Math.min(value, safeTotal);
                  setPaidDraft(String(nextPaid));
                  onPaidChange?.(nextPaid);
                } else {
                  setPaidDraft(String(safePaid));
                }
              }}
              aria-label="Payment received in DA"
            />
          </div>

          <div className="invoice-summary-row">
            <span>
              <Wallet size={15} />
              Remaining on Invoice
            </span>

            <strong className="invoice-summary-remaining">
              {money(safeRemaining)}
            </strong>
          </div>

          <div className="invoice-summary-row invoice-summary-debt-row">
            <span>Previous Customer Debt</span>
            <strong>{money(safePreviousDebt)}</strong>
          </div>

          {safePreviousDebt > 0 && (
            <div className="invoice-summary-row">
              <span>Total Debt After Sale</span>
              <strong className="invoice-summary-remaining">
                {money(safePreviousDebt + safeRemaining)}
              </strong>
            </div>
          )}

          {customerName && (
            <div className="invoice-summary-customer">
              <span>Customer</span>
              <strong>{customerName}</strong>

              {safePreviousDebt > 0 && (
                <button
                  type="button"
                  className="invoice-debt-details-button"
                  disabled={busy}
                  onClick={() => onViewDebtDetails?.()}
                >
                  View Debt Details
                </button>
              )}
            </div>
          )}
        </div>

        <div className="invoice-summary-total">
          <div>
            <span>TOTAL AMOUNT</span>
            <p>Final amount due</p>
          </div>

          <strong>{money(safeTotal)}</strong>
        </div>
      </div>

      <div className="invoice-summary-actions">
        <button
          type="button"
          className="invoice-pending-button"
          disabled={busy}
          onClick={() => onSavePending?.()}
        >
          <Clock size={17} />
          Save Pending
        </button>

        <button
          type="button"
          className="invoice-print-button"
          disabled={busy}
          onClick={() => onPrint?.()}
        >
          <Printer size={17} />
          Print Invoice
        </button>

        <button
          type="button"
          className="invoice-complete-button"
          disabled={busy}
          onClick={() => onCompleteSale?.()}
        >
          {busy ? (
            <>
              <LoaderCircle size={18} />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Complete Sale
            </>
          )}
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
