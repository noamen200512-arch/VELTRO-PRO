
import React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const C = {
  text: "#F1F5F9",
  muted: "#8795AC",
  cyan: "#35D6D0",
  green: "#34D399",
  red: "#FB7185",
  orange: "#FBBF24",
};

export default function ProductNotice({
  notice,
  type = "success",
  onClose,
}) {
  if (!notice) return null;

  const styles = {
    success: {
      color: C.green,
      background: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.28)",
      Icon: CheckCircle2,
    },
    error: {
      color: C.red,
      background: "rgba(251,113,133,0.08)",
      border: "rgba(251,113,133,0.28)",
      Icon: AlertCircle,
    },
    warning: {
      color: C.orange,
      background: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.28)",
      Icon: AlertCircle,
    },
    info: {
      color: C.cyan,
      background: "rgba(53,214,208,0.08)",
      border: "rgba(53,214,208,0.28)",
      Icon: Info,
    },
  };

  const current = styles[type] || styles.success;
  const NoticeIcon = current.Icon;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "12px 14px",
        border: `1px solid ${current.border}`,
        background: current.background,
        borderRadius: 10,
        marginBottom: 16,
        color: C.text,
        fontSize: 12,
        lineHeight: 1.6,
        overflowWrap: "anywhere",
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <NoticeIcon
        size={17}
        color={current.color}
        style={{ flexShrink: 0, marginTop: 1 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {notice}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          style={{
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            padding: 3,
            border: "none",
            borderRadius: 5,
            background: "transparent",
            color: C.muted,
            cursor: "pointer",
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
