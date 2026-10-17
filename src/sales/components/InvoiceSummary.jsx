
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
  UserRound,
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
  compactCustomerInfo = false,
  currentUser = "User",
  onChooseCustomer,
  onViewDebtDetails,
  onSavePending,
  onPrint,
  onCompleteSale,
  busy = false,
  invoiceNumber = "",
  invoiceDate = null,
  customerReference = "",
  items = [],
  locale = "en",
}) {
  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  const safeDiscount = Math.max(0, Number(discount) || 0);
  const safeTotal = Math.max(0, Number(total) || 0);
  const safePaid = Number.isFinite(Number(paid)) ? Number(paid) : 0;
  const [paidDraft, setPaidDraft] = useState(String(paid ?? 0));
  const [discountDraft, setDiscountDraft] = useState(String(discount ?? 0));

  useEffect(() => {
    setPaidDraft(String(paid ?? 0));
  }, [paid]);

  useEffect(() => {
    setDiscountDraft(String(discount ?? 0));
  }, [discount]);
  const safeRemaining = Math.max(0, Number(remaining) || 0);
  const safePreviousDebt = Math.max(0, Number(previousDebt) || 0);
  const language = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  const labels = {
    en: { invoice: "INVOICE", date: "DATE", time: "TIME", lines: "PRODUCT LINES", units: "TOTAL UNITS", cartons: "CARTONS", status: "PAYMENT STATUS", paidStatus: "Paid", partialStatus: "Partially paid", unpaidStatus: "Unpaid", emptyStatus: "No items", customerRef: "Customer reference", dueNow: "Due now", totalDebt: "Total customer debt after sale" },
    fr: { invoice: "FACTURE", date: "DATE", time: "HEURE", lines: "LIGNES PRODUIT", units: "UNITÉS TOTALES", cartons: "CARTONS", status: "ÉTAT DU PAIEMENT", paidStatus: "Payée", partialStatus: "Partiellement payée", unpaidStatus: "Impayée", emptyStatus: "Vide", customerRef: "Référence client", dueNow: "À encaisser", totalDebt: "Dette client après vente" },
    ar: { invoice: "رقم الفاتورة", date: "التاريخ", time: "الوقت", lines: "عدد المنتجات", units: "إجمالي الوحدات", cartons: "الكراتين", status: "حالة الدفع", paidStatus: "مدفوعة", partialStatus: "مدفوعة جزئيًا", unpaidStatus: "غير مدفوعة", emptyStatus: "فارغة", customerRef: "مرجع الزبون", dueNow: "المطلوب قبضه الآن", totalDebt: "إجمالي دين الزبون بعد البيع" },
  }[language];
  const parsedInvoiceDate = invoiceDate ? new Date(invoiceDate) : null;
  const validInvoiceDate = parsedInvoiceDate && !Number.isNaN(parsedInvoiceDate.getTime()) ? parsedInvoiceDate : null;
  const invoiceDateLabel = validInvoiceDate ? validInvoiceDate.toLocaleDateString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-GB") : "—";
  const invoiceTimeLabel = validInvoiceDate ? validInvoiceDate.toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
  const invoiceLineCount = items.length;
  const invoiceUnitCount = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity ?? item.qty) || 0), 0);
  const invoiceCartonCount = items.reduce((sum, item) => {
    const qty = Math.max(0, Number(item.quantity ?? item.qty) || 0);
    if (item.isCartonLine) return sum + qty;
    if (item.weighedSale || item.unitLabel === "kg") return sum;
    return sum + Math.floor(qty / Math.max(1, Number(item.piecesPerCarton) || 1));
  }, 0);
  const paymentStatus = safeTotal <= 0 && invoiceLineCount === 0
    ? labels.emptyStatus
    : safeRemaining <= 0
      ? labels.paidStatus
      : safePaid > 0
        ? labels.partialStatus
        : labels.unpaidStatus;
  const totalCustomerDebt = ["anonyme", "anonymous", "زبون مجهول", "زبون مجهول الهوية"].includes(String(customerName || "").trim().toLowerCase())
    ? 0
    : safePreviousDebt + safeRemaining;

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

        <div className="invoice-summary-current-user" title="Current User">
          <div className="invoice-summary-current-user-avatar">
            {String(currentUser || "User").trim().charAt(0).toUpperCase() || "U"}
          </div>
          <div className="invoice-summary-current-user-details">
            <span>Current User</span>
            <strong>{currentUser || "User"}</strong>
            <small>Sales Operator</small>
          </div>
          <span className="invoice-summary-current-user-status" />
        </div>
      </div>

      <div className="invoice-summary-meta-strip" dir={language === "ar" ? "rtl" : "ltr"}>
        <div><span>{labels.invoice}</span><strong>{String(invoiceNumber || "—").startsWith("INV-") || !invoiceNumber ? (invoiceNumber || "—") : `INV-${invoiceNumber}`}</strong></div>
        <div><span>{labels.date}</span><strong>{invoiceDateLabel}</strong></div>
        <div><span>{labels.time}</span><strong>{invoiceTimeLabel}</strong></div>
        <div><span>{labels.lines}</span><strong>{invoiceLineCount}</strong></div>
        <div><span>{labels.units}</span><strong>{Number(invoiceUnitCount.toFixed(3)).toLocaleString(language === "ar" ? "ar-DZ" : "fr-FR")}</strong></div>
        <div><span>{labels.cartons}</span><strong>{Number(invoiceCartonCount.toFixed(3)).toLocaleString(language === "ar" ? "ar-DZ" : "fr-FR")}</strong></div>
        <div className="invoice-summary-payment-status"><span>{labels.status}</span><strong className={safeRemaining <= 0 ? "is-paid" : safePaid > 0 ? "is-partial" : "is-unpaid"}>{paymentStatus}</strong></div>
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
              value={discountDraft}
              disabled={busy}
              onFocus={() => {
                if (discountDraft === "0" || discountDraft === "0.00") {
                  setDiscountDraft("");
                }
              }}
              onChange={(event) => {
                const rawValue = event.target.value;
                setDiscountDraft(rawValue);
                const value = rawValue.trim() === "" ? 0 : Number(rawValue);
                if (Number.isFinite(value)) {
                  onDiscountChange?.(
                    Math.min(Math.max(0, value), Math.max(0, Number(subtotal) || 0))
                  );
                }
              }}
              onBlur={() => {
                const value = discountDraft.trim() === "" ? 0 : Number(discountDraft);
                if (Number.isFinite(value)) {
                  const normalized = Math.min(Math.max(0, value), Math.max(0, Number(subtotal) || 0));
                  setDiscountDraft(String(normalized));
                  onDiscountChange?.(normalized);
                } else {
                  setDiscountDraft(String(safeDiscount));
                }
              }}
            />
          </div>

          <div className="invoice-summary-row invoice-summary-payment-row">
            <label htmlFor="invoice-payment-received"><Banknote size={15} /> Payment Received (DA)</label>
            <input
              id="invoice-payment-received"
              className="invoice-summary-payment-input"
              type="number"
              inputMode="decimal"
              step="any"
              value={paidDraft}
              disabled={busy}
              onFocus={() => {
                if (paidDraft === "0" || paidDraft === "0.00") setPaidDraft("");
              }}
              onChange={(event) => setPaidDraft(event.target.value)}
              onBlur={() => {
                const value = paidDraft.trim() === "" ? 0 : Number(paidDraft);
                if (Number.isFinite(value)) {
                  setPaidDraft(String(value));
                  onPaidChange?.(value);
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
              {labels.dueNow}
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
              <span>الزبون</span>
              <strong>{customerName}</strong>
              {customerReference && !["anonyme", "anonymous", "زبون مجهول", "زبون مجهول الهوية"].includes(String(customerName || "").trim().toLowerCase()) && (
                <small className="invoice-summary-customer-reference">{labels.customerRef}: {customerReference}</small>
              )}

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
          <div className="invoice-summary-total-heading">
            <div>
              <span>TOTAL AMOUNT</span>
              <p>Final amount due</p>
            </div>
            <strong className="invoice-summary-total-amount">{money(safeTotal)}</strong>
          </div>

          {compactCustomerInfo && (
            <div className="invoice-summary-compact-customer">
              <div className="invoice-summary-compact-customer-header">
                <div className="invoice-summary-compact-customer-identity">
                  <span className="invoice-summary-compact-eyebrow">CUSTOMER ACCOUNT</span>
                  <strong className="invoice-summary-compact-customer-name">
                    {customerName || "Anonyme"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="invoice-summary-change-customer"
                  disabled={busy}
                  onClick={() => onChooseCustomer?.()}
                >
                  <UserRound size={14} />
                  Change
                </button>
              </div>

              <div className="invoice-summary-compact-customer-metrics">
                <div>
                  <span>Previous debt</span>
                  <strong>{money(safePreviousDebt)}</strong>
                </div>
                <div>
                  <span>Paid now</span>
                  <strong>{money(safePaid)}</strong>
                </div>
                <div>
                  <span>New debt</span>
                  <strong className="invoice-summary-compact-new-debt">
                    {money(
                      ["anonyme", "anonymous", "زبون مجهول", "زبون مجهول الهوية"].includes(String(customerName || "").trim().toLowerCase())
                        ? 0
                        : safePreviousDebt + safeRemaining
                    )}
                  </strong>
                </div>
              </div>
            </div>
          )}
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
