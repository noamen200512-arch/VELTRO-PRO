
import React from "react";
import {
  FileText,
  UserRound,
  CalendarDays,
  Clock3,
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
  invoiceDate,
  previousDebt = 0,
  statusCards = null,
  customerReference = "",
  locale = "en",
}) {
  const parsedDate = invoiceDate
    ? new Date(invoiceDate)
    : new Date();

  const validDate = Number.isNaN(parsedDate.getTime())
    ? new Date()
    : parsedDate;

  const language = locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en";
  const date = validDate.toLocaleDateString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-GB");
  const time = validDate.toLocaleTimeString(language === "ar" ? "ar-DZ" : language === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const labels = {
    en: { reference: "Customer Reference", status: "Invoice Status", paid: "Paid", partial: "Partially paid", unpaid: "Unpaid", noItems: "No items", accountSummary: "Account Overview" },
    fr: { reference: "Référence client", status: "État de la facture", paid: "Payée", partial: "Partiellement payée", unpaid: "Impayée", noItems: "Vide", accountSummary: "Résumé du compte" },
    ar: { reference: "مرجع الزبون", status: "حالة الفاتورة", paid: "مدفوعة", partial: "مدفوعة جزئيًا", unpaid: "غير مدفوعة", noItems: "فارغة", accountSummary: "ملخص الحساب" },
  }[language];
  const invoiceStatus = Number(newAmount) <= 0 ? labels.noItems : Number(remaining) <= 0 ? labels.paid : Number(paid) > 0 ? labels.partial : labels.unpaid;

  const displayInvoiceNumber = String(invoiceNumber || "—");

  const formattedInvoiceNumber =
    displayInvoiceNumber.startsWith("INV-")
      ? displayInvoiceNumber
      : `INV-${displayInvoiceNumber}`;

  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  return (
    <aside className="sales-sidebar">
      {statusCards && <div className="pos-unified-status-cards">{statusCards}</div>}
      <section className="sales-side-section">
        <div className="sales-section-heading">
          <FileText size={18} />
          <h3>Invoice Information</h3>
        </div>

        <div className="sales-info-card">
          <span className="sales-field-label">
            Invoice Number
          </span>

          <strong>{formattedInvoiceNumber}</strong>
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
        <div className="sales-info-card sales-invoice-status-card">
          <span className="sales-field-label">{labels.status}</span>
          <strong className={Number(remaining) <= 0 && Number(newAmount) > 0 ? "is-paid" : Number(paid) > 0 ? "is-partial" : "is-unpaid"}>{invoiceStatus}</strong>
        </div>
      </section>

      <section className="sales-side-section sales-account-section">
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
        {customerReference && !["anonyme", "anonymous"].includes(String(customer || "").trim().toLowerCase()) && (
          <div className="sales-info-card sales-customer-reference">
            <span className="sales-field-label">{labels.reference}</span>
            <strong>{customerReference}</strong>
          </div>
        )}

        <div className="sales-account-card">
          <div className="sales-account-card-heading">{labels.accountSummary}</div>
          <div className="sales-account-row">
            <span>
              <CreditCard size={15} />
              Previous Debt
            </span>

            <strong>{money(previousDebt)}</strong>
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
