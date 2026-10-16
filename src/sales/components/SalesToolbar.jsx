
import React from "react";
import {
  FilePlus2,
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
  onPrint,
  onCustomer,
  onPending,
  pendingCount = 0,
  showPending = false,
  newDisabled = false,
  disabled = false,
  message = "",
  messageType = "info",
  onDismissMessage,
  onUndo,
  undoLabel = "Undo",
  dismissLabel = "Dismiss message",
}) {
  const actions = {
    new: onNew,
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
      </div>
    </div>
  );
}

export default SalesToolbar;
