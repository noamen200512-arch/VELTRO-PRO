import React from "react";
import { X } from "lucide-react";

const C = {
  panel: "#0D1525",
  border: "rgba(148,163,184,0.14)",
  text: "#F1F5F9",
  muted: "#8795AC",
  orange: "#FBBF24",
};

export default function BarcodeScanner({
  open,
  videoRef,
  error = "",
  supported = true,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="barcode-scanner-title"
        style={{
          width: "min(520px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: C.panel,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 15,
          padding: 18,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <h3
            id="barcode-scanner-title"
            style={{ margin: 0, fontSize: 16 }}
          >
            Scan Barcode
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            style={{
              display: "grid",
              placeItems: "center",
              padding: 8,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.text,
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          Point the rear camera at the product barcode.
        </p>

        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Barcode camera preview"
          style={{
            display: "block",
            width: "100%",
            maxHeight: 320,
            background: "#000",
            borderRadius: 10,
            objectFit: "contain",
          }}
        />

        {error && (
          <p
            role="alert"
            style={{
              color: C.orange,
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        )}

        {!supported && (
          <p
            style={{
              color: C.muted,
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            Barcode scanning is not supported by this browser.
            You can type the barcode in the product form instead.
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 14px",
              borderRadius: 9,
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.text,
              cursor: "pointer",
            }}
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}