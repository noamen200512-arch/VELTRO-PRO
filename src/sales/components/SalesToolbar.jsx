
import React from "react";
import {
  Keyboard,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FilePenLine,
  Printer,
  UserRound,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Undo2,
} from "lucide-react";

const toolbarButtons = [
  {
    label: "New Invoice",
    icon: FilePlus2,
    action: "new",
  },
  {
    label: "Edit Invoice",
    icon: FilePenLine,
    action: "edit",
  },
  {
    label: "Print Invoice",
    icon: Printer,
    action: "print",
  },
  {
    label: "Customer Choice",
    icon: UserRound,
    action: "customer",
  },
  {
    label: "Pending Invoices",
    icon: ClipboardList,
    action: "pending",
  },
];

export function SalesToolbar({
  onNew,
  onEditInvoice,
  editInvoiceDisabled = true,
  onPrint,
  onCustomer,
  onPending,
  onPreviousInvoice,
  onNextInvoice,
  previousInvoiceDisabled = true,
  nextInvoiceDisabled = true,
  pendingCount = 0,
  showPending = false,
  newDisabled = false,
  disabled = false,
  message = "",
  messageType = "info",
  onDismissMessage,
  onShortcuts,
  locale = "en",
  onUndo,
  undoLabel = "Undo",
  dismissLabel = "Dismiss message",
}) {
  const actions = {
    new: onNew,
    edit: onEditInvoice,
    print: onPrint,
    customer: onCustomer,
    pending: onPending,
  };

  return (
    <div className="sales-toolbar">
      <div className="sales-toolbar-brand">
        <span className="sales-toolbar-indicator" />
        <span>SALES TERMINAL</span>
      </div>

      <div className="sales-toolbar-actions">
        <button type="button" className="sales-toolbar-button sales-toolbar-shortcuts" onClick={onShortcuts} title={locale === "ar" ? "دليل الاختصارات (Ctrl + I)" : locale === "fr" ? "Guide des raccourcis (Ctrl + I)" : "Keyboard shortcuts (Ctrl + I)"} aria-label={locale === "ar" ? "عرض دليل الاختصارات" : locale === "fr" ? "Afficher le guide des raccourcis" : "Show keyboard shortcuts"}>
          <span className="sales-toolbar-button-icon"><Keyboard size={18} strokeWidth={1.8}/></span><span>{locale === "ar" ? "الاختصارات" : locale === "fr" ? "Raccourcis" : "Shortcuts"}</span><kbd className="sales-toolbar-shortcut-hint">Ctrl I</kbd>
        </button>

        {message && (
          <div className={`sales-toolbar-notice sales-toolbar-notice-${messageType}`} role={messageType === "error" ? "alert" : "status"} aria-live={messageType === "error" ? "assertive" : "polite"}>
            <span className="sales-toolbar-notice-icon">
              {messageType === "success" ? <CheckCircle2 size={17} /> : messageType === "error" ? <AlertCircle size={17} /> : <Info size={17} />}
            </span>
            <span className="sales-toolbar-notice-text">{message}</span>
            {onUndo && (
              <button type="button" className="sales-toolbar-notice-undo" onClick={onUndo}>
                <Undo2 size={14} />
                <span>{undoLabel}</span>
              </button>
            )}
            <button type="button" className="sales-toolbar-notice-dismiss" onClick={onDismissMessage} aria-label={dismissLabel} title={dismissLabel}>
              <X size={15} />
            </button>
          </div>
        )}

        <div className="sales-toolbar-invoice-navigation" aria-label="Invoice navigation">
          <button type="button" className="sales-toolbar-invoice-nav" onClick={onPreviousInvoice} disabled={disabled || previousInvoiceDisabled || typeof onPreviousInvoice !== "function"} title={locale === "ar" ? "البون السابق (←)" : locale === "fr" ? "Bon précédent (←)" : "Previous invoice (←)"}>
            <ChevronLeft size={16} />
            <span>{locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}</span>
            <kbd>←</kbd>
          </button>
          <button type="button" className="sales-toolbar-invoice-nav" onClick={onNextInvoice} disabled={disabled || nextInvoiceDisabled || typeof onNextInvoice !== "function"} title={locale === "ar" ? "البون التالي (→)" : locale === "fr" ? "Bon suivant (→)" : "Next invoice (→)"}>
            <span>{locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}</span>
            <kbd>→</kbd>
            <ChevronRight size={16} />
          </button>
        </div>

        {toolbarButtons.map((button) => {
          const Icon = button.icon;
          const isPending = button.action === "pending";

          return (
            <button
              key={button.action}
              type="button"
              className={[
                "sales-toolbar-button",
                `sales-toolbar-${button.action}`,
                isPending && showPending ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (disabled) return;

                const action = actions[button.action];

                if (typeof action === "function") {
                  action();
                }
              }}
              disabled={
                disabled ||
                (button.action === "new" && newDisabled) ||
                (button.action === "edit" && editInvoiceDisabled) ||
                typeof actions[button.action] !== "function"
              }
              aria-expanded={isPending ? showPending : undefined}
              aria-label={
                isPending
                  ? `${button.label}: ${pendingCount} saved`
                  : button.label
              }
              title={
                button.action === "new" && newDisabled
                  ? "Add products to the current invoice before creating a new invoice."
                  : button.label
              }
            >
              <span className="sales-toolbar-button-icon">
                <Icon size={18} strokeWidth={1.8} />

                {isPending && pendingCount > 0 && (
                  <span className="sales-toolbar-badge">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </span>

              <span>{button.label}</span>
            </button>
          );
        })}


      </div>
    </div>
  );
}

export default SalesToolbar;
