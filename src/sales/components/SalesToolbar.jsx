
import React from "react";
import {
  FilePlus2,
  Printer,
  UserRound,
  ClipboardList,
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
  disabled = false,
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
                typeof actions[button.action] !== "function"
              }
              aria-expanded={isPending ? showPending : undefined}
              aria-label={
                isPending
                  ? `${button.label}: ${pendingCount} saved`
                  : button.label
              }
              title={button.label}
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
