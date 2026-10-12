
import React from "react";
import {
  FilePlus2,
  FilePenLine,
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
    label: "Modify Invoice",
    icon: FilePenLine,
    action: "modify",
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
  onModify,
  onPrint,
  onCustomer,
  onPending,
}) {
  const actions = {
    new: onNew,
    modify: onModify,
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

          return (
            <button
              key={button.action}
              type="button"
              className={`sales-toolbar-button sales-toolbar-${button.action}`}
              onClick={actions[button.action]}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{button.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SalesToolbar;
