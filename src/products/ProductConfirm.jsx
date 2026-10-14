import React from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

const C = {
panel: "#0D1525",
border: "rgba(148,163,184,0.14)",
text: "#F1F5F9",
muted: "#8795AC",
red: "#FB7185",
};

export default function ProductConfirm({
open,
title = "Confirm deletion",
message = "Are you sure you want to delete this product? This action cannot be undone.",
confirmLabel = "Delete",
cancelLabel = "Cancel",
onConfirm,
onCancel,
loading = false,
}) {
if (!open) return null;

return (
<div
onMouseDown={(event) => {
if (event.target === event.currentTarget && !loading) {
onCancel?.();
}
}}
style={{
position: "fixed",
inset: 0,
zIndex: 10002,
display: "flex",
alignItems: "center",
justifyContent: "center",
padding: 16,
boxSizing: "border-box",
background: "rgba(0,0,0,0.78)",
backdropFilter: "blur(5px)",
}}
>
<div
role="alertdialog"
aria-modal="true"
aria-labelledby="product-confirm-title"
aria-describedby="product-confirm-message"
style={{
width: "min(420px, 100%)",
boxSizing: "border-box",
padding: 22,
borderRadius: 16,
border: "1px solid ${C.border}",
background: C.panel,
color: C.text,
boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
}}
>
<div
style={{
display: "flex",
alignItems: "flex-start",
justifyContent: "space-between",
gap: 12,
}}
>
<div
style={{
display: "grid",
placeItems: "center",
width: 44,
height: 44,
flexShrink: 0,
borderRadius: 12,
background: "rgba(251,113,133,0.10)",
border: "1px solid rgba(251,113,133,0.22)",
}}
>
<AlertTriangle size={22} color={C.red} />
</div>

      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        aria-label="Close confirmation"
        style={{
          display: "grid",
          placeItems: "center",
          padding: 7,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: "transparent",
          color: C.muted,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        <X size={16} />
      </button>
    </div>

    <h3
      id="product-confirm-title"
      style={{
        margin: "18px 0 8px",
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {title}
    </h3>

    <p
      id="product-confirm-message"
      style={{
        margin: 0,
        color: C.muted,
        fontSize: 13,
        lineHeight: 1.7,
        overflowWrap: "anywhere",
      }}
    >
      {message}
    </p>

    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 24,
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 9,
          border: `1px solid ${C.border}`,
          background: "transparent",
          color: C.text,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          padding: "10px 14px",
          borderRadius: 9,
          border: `1px solid ${C.red}`,
          background: C.red,
          color: "#19070B",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
        }}
      >
        <Trash2 size={15} />
        {loading ? "Please wait..." : confirmLabel}
      </button>
    </div>
  </div>
</div>

);
}