import React from "react";
import { X, Barcode, Printer } from "lucide-react";
import { getAllBarcodes } from "./productUtils.js";

const C = {
  bg: "#080D18",
  panel: "#0D1525",
  border: "rgba(148,163,184,0.14)",
  text: "#F1F5F9",
  muted: "#8795AC",
  cyan: "#35D6D0",
};

export default function ProductPrint({
  product,
  money,
  showPrintRef,
  setShowPrintRef,
  showPrintBarcode,
  setShowPrintBarcode,
  onClose,
  onPrint,
  buttonStyle = {},
}) {
  if (!product) return null;

  const barcode = getAllBarcodes(product)[0];

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-print-title"
        style={{
          width: "min(440px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: C.panel,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 18,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <h2
            id="product-print-title"
            style={{ margin: 0, fontSize: 17 }}
          >
            Print Price Card
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close print dialog"
            style={buttonStyle}
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            color: C.muted,
            fontSize: 12,
            marginTop: 0,
            overflowWrap: "anywhere",
          }}
        >
          {product.name}
        </p>

        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 14,
            background: C.bg,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              color: C.muted,
              fontSize: 11,
              marginBottom: 10,
            }}
          >
            Information to show on the card
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 13,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showPrintRef}
              onChange={(event) =>
                setShowPrintRef(event.target.checked)
              }
            />
            Show product reference
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showPrintBarcode}
              onChange={(event) =>
                setShowPrintBarcode(event.target.checked)
              }
            />
            Show barcode and digits
          </label>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            color: "#111111",
            border: "1px solid #222222",
            borderRadius: 8,
            padding: 16,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 17,
              overflowWrap: "anywhere",
            }}
          >
            {product.name}
          </div>

          {showPrintRef && product.sku && (
            <div style={{ fontSize: 11, marginTop: 8 }}>
              Reference: {product.sku}
            </div>
          )}

          {showPrintBarcode && barcode && (
            <div
              style={{
                fontSize: 11,
                marginTop: 8,
                letterSpacing: 1,
                overflowWrap: "anywhere",
              }}
            >
              <Barcode
                size={20}
                style={{ verticalAlign: "middle" }}
              />

              <div>{barcode}</div>
            </div>
          )}

          <div
            style={{
              fontSize: 25,
              fontWeight: 800,
              marginTop: 10,
            }}
          >
            {money(product.price)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={buttonStyle}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onPrint}
            style={{
              ...buttonStyle,
              background: C.cyan,
              color: "#07131A",
              borderColor: C.cyan,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}