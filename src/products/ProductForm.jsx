import React from "react";
import {
  X,
  Plus,
  Save,
  RefreshCw,
  Barcode,
  Camera,
  Percent,
  ImagePlus,
  Trash2,
} from "lucide-react";

const C = {
  bg: "#080D18",
  panel: "#0D1525",
  border: "rgba(148,163,184,0.14)",
  text: "#F1F5F9",
  muted: "#8795AC",
  cyan: "#35D6D0",
  green: "#34D399",
  red: "#FB7185",
};

function Field({ label, children }) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        minWidth: 0,
        color: C.muted,
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function ProductForm({
  open,
  editingId,
  form,
  products,
  categories,
  buttonStyle,
  fileInputRef,
  onClose,
  onSubmit,
  updateField,
  generateSku,
  generateBarcode,
  removeExtraBarcode,
  addExtraBarcode,
  onImageChange,
  onRemoveImage,
  onOpenScanner,
}) {
  if (!open) return null;

  const inputStyle = {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
  };

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
        boxSizing: "border-box",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        style={{
          width: "min(760px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: C.panel,
          color: C.text,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 18,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h2
              id="product-modal-title"
              style={{ margin: 0, fontSize: 18 }}
            >
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <p
              style={{
                color: C.muted,
                fontSize: 11,
                margin: "6px 0 0",
              }}
            >
              Enter the product information below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={buttonStyle}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div
            style={{
              padding: 18,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
              gap: 14,
            }}
          >
            {/* Product name */}
            <Field label="Product Name *">
              <input
                className="veltro-product-input"
                style={inputStyle}
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="e.g. Mineral Water"
                required
                autoFocus
              />
            </Field>

            {/* SKU / Reference */}
            <Field label="SKU / Reference">
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  minWidth: 0,
                }}
              >
                <input
                  className="veltro-product-input"
                  style={inputStyle}
                  value={form.sku}
                  onChange={(event) =>
                    updateField("sku", event.target.value)
                  }
                  placeholder="e.g. PRD-001"
                />

                <button
                  type="button"
                  title="Generate reference"
                  onClick={() =>
                    updateField("sku", generateSku(products))
                  }
                  style={{
                    ...buttonStyle,
                    color: C.cyan,
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </Field>

            {/* Main barcode */}
            <Field label="Barcode">
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  minWidth: 0,
                }}
              >
                <input
                  className="veltro-product-input"
                  style={inputStyle}
                  value={form.barcode}
                  onChange={(event) =>
                    updateField("barcode", event.target.value)
                  }
                  placeholder="Scan or type barcode"
                />

                <button
                  type="button"
                  title="Generate barcode"
                  onClick={() =>
                    updateField(
                      "barcode",
                      generateBarcode(products)
                    )
                  }
                  style={{
                    ...buttonStyle,
                    color: C.cyan,
                    flexShrink: 0,
                  }}
                >
                  <Barcode size={15} />
                </button>

                <button
                  type="button"
                  title="Scan with camera"
                  onClick={() => onOpenScanner("primary")}
                  style={{
                    ...buttonStyle,
                    color: C.green,
                    flexShrink: 0,
                  }}
                >
                  <Camera size={15} />
                </button>
              </div>
            </Field>

            {/* Category */}
            <Field label="Category">
              <input
                className="veltro-product-input"
                style={inputStyle}
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                placeholder="e.g. Drinks"
                list="veltro-product-categories"
              />

              <datalist id="veltro-product-categories">
                {categories
                  .filter((item) => item !== "All")
                  .map((item) => (
                    <option key={item} value={item} />
                  ))}
              </datalist>
            </Field>

            {/* Additional barcodes */}
            <div
              style={{
                gridColumn: "1 / -1",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 10,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Barcode size={16} color={C.cyan} />
                <span style={{ fontSize: 12, fontWeight: 650 }}>
                  Additional Barcodes
                </span>
              </div>

              {(form.barcodeAliases || []).map((code) => (
                <div
                  key={code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "7px 9px",
                    borderRadius: 8,
                    background: C.bg,
                    fontSize: 12,
                  }}
                >
                  <span style={{ overflowWrap: "anywhere" }}>
                    {code}
                  </span>

                  <button
                    type="button"
                    title="Remove barcode"
                    onClick={() => removeExtraBarcode(code)}
                    style={{
                      ...buttonStyle,
                      padding: 6,
                      color: C.red,
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  gap: 7,
                  minWidth: 0,
                }}
              >
                <input
                  className="veltro-product-input"
                  style={inputStyle}
                  value={form.newBarcode}
                  onChange={(event) =>
                    updateField("newBarcode", event.target.value)
                  }
                  placeholder="Enter an additional barcode"
                />

                <button
                  type="button"
                  title="Scan additional barcode"
                  onClick={() => onOpenScanner("extra")}
                  style={{
                    ...buttonStyle,
                    color: C.green,
                    flexShrink: 0,
                  }}
                >
                  <Camera size={15} />
                </button>

                <button
                  type="button"
                  onClick={addExtraBarcode}
                  style={{
                    ...buttonStyle,
                    color: C.cyan,
                    flexShrink: 0,
                  }}
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>

            {/* Purchase price */}
            <Field label="Purchase Price (DA)">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="any"
                value={form.purchasePrice}
                onChange={(event) =>
                  updateField("purchasePrice", event.target.value)
                }
                placeholder="0"
              />
            </Field>

            {/* Retail price */}
            <Field label="Retail Selling Price (DA) *">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="any"
                value={form.price}
                onChange={(event) =>
                  updateField("price", event.target.value)
                }
                placeholder="0"
                required
              />
            </Field>

            {/* Retail profit */}
            <Field label="Retail Profit (%)">
              <div style={{ position: "relative" }}>
                <input
                  className="veltro-product-input"
                  style={{
                    ...inputStyle,
                    paddingRight: 36,
                  }}
                  type="number"
                  step="any"
                  value={form.retailProfit}
                  onChange={(event) =>
                    updateField(
                      "retailProfit",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />

                <Percent
                  size={15}
                  color={C.muted}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </Field>

            {/* Wholesale price */}
            <Field label="Wholesale Price (DA)">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="any"
                value={form.wholesalePrice}
                onChange={(event) =>
                  updateField(
                    "wholesalePrice",
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </Field>

            {/* Wholesale profit */}
            <Field label="Wholesale Profit (%)">
              <div style={{ position: "relative" }}>
                <input
                  className="veltro-product-input"
                  style={{
                    ...inputStyle,
                    paddingRight: 36,
                  }}
                  type="number"
                  step="any"
                  value={form.wholesaleProfit}
                  onChange={(event) =>
                    updateField(
                      "wholesaleProfit",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />

                <Percent
                  size={15}
                  color={C.muted}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </Field>

            {/* Carton price */}
            <Field label="Carton Price (DA)">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="any"
                value={form.cartonPrice}
                onChange={(event) =>
                  updateField("cartonPrice", event.target.value)
                }
                placeholder="0"
              />
            </Field>

            {/* Carton profit */}
            <Field label="Carton Profit (%)">
              <div style={{ position: "relative" }}>
                <input
                  className="veltro-product-input"
                  style={{
                    ...inputStyle,
                    paddingRight: 36,
                  }}
                  type="number"
                  step="any"
                  value={form.cartonProfit}
                  onChange={(event) =>
                    updateField(
                      "cartonProfit",
                      event.target.value
                    )
                  }
                  placeholder="0"
                />

                <Percent
                  size={15}
                  color={C.muted}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </Field>

            {/* Pieces per carton */}
            <Field label="Pieces per Carton">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="1"
                step="1"
                value={form.piecesPerCarton}
                onChange={(event) =>
                  updateField(
                    "piecesPerCarton",
                    event.target.value
                  )
                }
              />
            </Field>

            {/* Stock */}
            <Field label="Current Stock">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) =>
                  updateField("stock", event.target.value)
                }
                placeholder="0"
              />
            </Field>

            {/* Minimum stock */}
            <Field label="Minimum Stock Alert">
              <input
                className="veltro-product-input"
                style={inputStyle}
                type="number"
                min="0"
                step="1"
                value={form.minStock}
                onChange={(event) =>
                  updateField("minStock", event.target.value)
                }
                placeholder="5"
              />
            </Field>

            {/* Unit */}
            <Field label="Unit">
              <select
                className="veltro-product-input"
                style={inputStyle}
                value={form.unit}
                onChange={(event) =>
                  updateField("unit", event.target.value)
                }
              >
                <option value="piece">Piece</option>
                <option value="carton">Carton</option>
                <option value="pack">Pack</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="liter">Liter</option>
                <option value="bottle">Bottle</option>
                <option value="box">Box</option>
              </select>
            </Field>

            {/* Product image */}
            <div
              style={{
                gridColumn: "1 / -1",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 12,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ImagePlus size={17} color={C.cyan} />
                  <span style={{ fontSize: 12 }}>
                    Product Image
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={buttonStyle}
                >
                  <Plus size={14} /> Choose Image
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  style={{ display: "none" }}
                />
              </div>

              {form.image && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <img
                    src={form.image}
                    alt="Product preview"
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 9,
                      objectFit: "cover",
                      border: `1px solid ${C.border}`,
                    }}
                  />

                  <button
                    type="button"
                    onClick={onRemoveImage}
                    style={{
                      ...buttonStyle,
                      color: C.red,
                    }}
                  >
                    <Trash2 size={14} /> Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 18,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
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
              type="submit"
              style={{
                ...buttonStyle,
                background: C.cyan,
                color: "#07131A",
                borderColor: C.cyan,
                padding: "10px 16px",
              }}
            >
              <Save size={15} />{" "}
              {editingId ? "Save Changes" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}