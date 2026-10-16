import React, { useState } from "react";
import {
  X, Plus, Save, RefreshCw, Barcode, Camera, Percent, ImagePlus, Check,
  Trash2, Package, ShoppingCart, BadgePercent, CalendarDays, Boxes,
  ScanBarcode, Tag,
} from "lucide-react";

const C = {
  bg: "#080D18", panel: "#0D1525", border: "rgba(148,163,184,0.16)",
  text: "#F1F5F9", muted: "#8795AC", cyan: "#35D6D0",
  green: "#34D399", red: "#FB7185",
};

function Field({ label, children }) {
  return <label style={{ display: "grid", gap: 7, minWidth: 0 }}>
    <span style={{ color: C.muted, fontSize: 12, lineHeight: 1.4 }}>{label}</span>
    {children}
  </label>;
}

function Section({ icon: Icon, title, children }) {
  return <section style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: 15, minWidth: 0, background: "rgba(8,13,24,.48)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}>
      <span style={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: 9, color: C.cyan, background: "rgba(53,214,208,.09)" }}><Icon size={17} /></span>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 750 }}>{title}</h3>
    </div>
    {children}
  </section>;
}

export default function ProductForm({
  open, editingId, form, products, categories, buttonStyle = {},
  fileInputRef, cameraInputRef, onClose, onSubmit, updateField,
  generateSku, generateBarcode, removeExtraBarcode, addExtraBarcode,
  onImageChange, onRemoveImage, onOpenScanner,
}) {
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  if (!open) return null;

  const inputStyle = {
    width: "100%", minWidth: 0, boxSizing: "border-box",
    padding: "11px 12px", borderRadius: 9,
    border: `1px solid ${C.border}`, background: C.bg,
    color: C.text, outline: "none", fontSize: 13,
  };
  const actionButton = {
    ...buttonStyle, minHeight: 40, padding: "9px 11px", flexShrink: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  };
  const qty = Math.max(1, Number(form.piecesPerCarton) || 1);
  const cartons = Math.max(0, Number(form.cartonsReceived) || 0);
  const totalUnits = cartons * qty;
  const profit = (price, cost) => Number(cost || 0) > 0
    ? (((Number(price || 0) - Number(cost || 0)) / Number(cost || 0)) * 100).toFixed(2)
    : "—";

  return <div
    onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.76)", backdropFilter: "blur(7px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, boxSizing: "border-box" }}
  >
    <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title"
      style={{ width: "min(920px, 100%)", maxHeight: "96dvh", overflowY: "auto", background: C.panel, color: C.text, border: `1px solid ${C.border}`, borderRadius: 17, boxShadow: "0 25px 90px rgba(0,0,0,.55)", overscrollBehavior: "contain" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, padding: "16px 18px", borderBottom: `1px solid ${C.border}`, background: "rgba(13,21,37,.97)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 id="product-modal-title" style={{ margin: 0, fontSize: 18 }}>{editingId ? "Edit Product" : "Add New Product"}</h2>
          <p style={{ color: C.muted, fontSize: 11, margin: "5px 0 0" }}>Enter the product information below.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close dialog" style={{ ...actionButton, padding: 9 }}><X size={17} /></button>
      </div>

      <form onSubmit={onSubmit} style={{ padding: 16, display: "grid", gap: 13 }}>
        <Section icon={ScanBarcode} title="Product Identity">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 245px), 1fr))", gap: 13 }}>
            <Field label="Product Name *">
              <input className="veltro-product-input" style={inputStyle} value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Mineral Water" required autoFocus />
            </Field>
            <Field label="Primary Barcode">
              <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                <input className="veltro-product-input" style={inputStyle} value={form.barcode} onChange={(e) => updateField("barcode", e.target.value)} placeholder="Scan or type barcode" />
                <button type="button" title="Generate barcode" aria-label="Generate barcode" onClick={() => updateField("barcode", generateBarcode(products))} style={{ ...actionButton, color: C.cyan }}><Barcode size={16} /></button>
                <button type="button" title="Scan barcode" aria-label="Scan barcode" onClick={() => onOpenScanner("primary")} style={{ ...actionButton, color: C.green }}><Camera size={16} /></button>
                <button type="button" title="Delete primary barcode" aria-label="Delete primary barcode" disabled={!form.barcode} onClick={() => updateField("barcode", "")} style={{ ...actionButton, color: C.red }}><Trash2 size={15} /></button>
              </div>
            </Field>
            <Field label="Product Reference (SKU)">
              <div style={{ display: "flex", gap: 6, minWidth: 0 }}>
                <input className="veltro-product-input" style={inputStyle} value={form.sku} onChange={(e) => updateField("sku", e.target.value)} placeholder="PRD-001" />
                <button type="button" title="Generate reference" aria-label="Generate reference" onClick={() => updateField("sku", generateSku(products))} style={{ ...actionButton, color: C.cyan }}><RefreshCw size={15} /></button>
              </div>
            </Field>
            <div style={{ gridColumn: "1 / -1", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ color: C.cyan, display: "grid", placeItems: "center" }}><Barcode size={18} /></span>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Secondary Barcodes</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Manage additional barcodes here.</div>
              </div>
              <button type="button" onClick={() => setBarcodeModalOpen(true)} style={{ ...actionButton, color: C.cyan }}><Plus size={15} /> Manage Barcodes</button>
            </div>
          </div>
        </Section>

        <Section icon={Boxes} title={form.weighedSale ? "Measured Stock" : "Packaging Information"}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 13, alignItems: "end" }}>
            {form.weighedSale ? <Field label={`Initial Stock (${form.unit || "kg"})`}>
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="0.001" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} placeholder="0" />
            </Field> : <>
              {!editingId
                ? <Field label="Cartons Received"><input className="veltro-product-input" style={inputStyle} type="number" min="0" step="1" value={form.cartonsReceived ?? "0"} onChange={(e) => updateField("cartonsReceived", e.target.value)} placeholder="0" /></Field>
                : <Field label="Current Stock (Units)"><input className="veltro-product-input" style={inputStyle} type="number" min="0" step="any" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} placeholder="0" /></Field>}
              <Field label="Units per Carton">
                <input className="veltro-product-input" style={inputStyle} type="number" min="1" step="1" value={form.piecesPerCarton} onChange={(e) => updateField("piecesPerCarton", e.target.value)} required />
              </Field>
              {!editingId && <div style={{ border: "1px solid rgba(53,214,208,.28)", background: "rgba(53,214,208,.07)", borderRadius: 10, padding: "10px 12px", minHeight: 43 }}>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 5 }}>Total Units</div>
                <div style={{ color: C.cyan, fontSize: 20, fontWeight: 800 }}>{Number.isFinite(totalUnits) ? totalUnits.toLocaleString("fr-FR") : "0"}</div>
                <div style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{cartons} × {qty}</div>
              </div>}
            </>}
          </div>
        </Section>

        <Section icon={ShoppingCart} title="Purchase Information">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 13 }}>
            <Field label="Purchase Price per Carton (DA)">
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="any" value={form.purchaseCartonPrice} onChange={(e) => updateField("purchaseCartonPrice", e.target.value)} placeholder="0.00" />
            </Field>
            <Field label={form.weighedSale ? `Purchase Price per ${form.unit || "kg"} (DA)` : "Purchase Price per Unit (DA)"}>
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="any" value={form.purchasePrice} onChange={(e) => updateField("purchasePrice", e.target.value)} placeholder="0.00" />
            </Field>
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 9 }}>The unit purchase price is calculated automatically from the carton price and units per carton. You can also edit the unit price directly.</div>
        </Section>

        <Section icon={BadgePercent} title="Sales Information">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))", gap: 13 }}>
            <Field label={form.weighedSale ? `Retail Selling Price per ${form.unit || "kg"} (DA)` : "Retail Selling Price per Unit (DA)"}>
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="any" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Manual Unit Profit Margin (%)">
              <div style={{ position: "relative" }}><input className="veltro-product-input" style={{ ...inputStyle, paddingRight: 35 }} type="number" step="any" value={form.retailProfit} onChange={(e) => updateField("retailProfit", e.target.value)} placeholder="0.00" /><Percent size={15} color={C.muted} style={{ position: "absolute", right: 12, top: 13, pointerEvents: "none" }} /></div>
            </Field>
            <Field label="Carton Selling Price (DA)">
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="any" value={form.cartonPrice} onChange={(e) => updateField("cartonPrice", e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Manual Carton Profit Margin (%)">
              <div style={{ position: "relative" }}><input className="veltro-product-input" style={{ ...inputStyle, paddingRight: 35 }} type="number" step="any" value={form.cartonProfit} onChange={(e) => updateField("cartonProfit", e.target.value)} placeholder="0.00" /><Percent size={15} color={C.muted} style={{ position: "absolute", right: 12, top: 13, pointerEvents: "none" }} /></div>
            </Field>
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 10 }}>You can type the profit percentage yourself. The selling price updates automatically from the entered margin; you can also type the selling price directly.</div>
        </Section>

        <Section icon={Tag} title="Additional Details">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: 13 }}>
            <div style={{ gridColumn: "1 / -1", border: `1px solid ${form.weighedSale ? "rgba(53,214,208,.42)" : C.border}`, background: form.weighedSale ? "rgba(53,214,208,.07)" : "transparent", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <input id="veltro-weighed-sale" type="checkbox" checked={Boolean(form.weighedSale)} onChange={(e) => { updateField("weighedSale", e.target.checked); if (e.target.checked && ["piece", "pack", "carton"].includes(form.unit)) updateField("unit", "kg"); }} style={{ width: 18, height: 18, accentColor: C.cyan }} />
              <label htmlFor="veltro-weighed-sale" style={{ cursor: "pointer", display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 750 }}>Sell by measured quantity</span>
                <span style={{ color: C.muted, fontSize: 11 }}>Enable weight, volume, or length-based sales. The selling price is the price per selected unit.</span>
              </label>
            </div>
            <Field label="Unit of Measure">
              <select className="veltro-product-input" style={inputStyle} value={form.unit} onChange={(e) => updateField("unit", e.target.value)}>
                <option value="piece">Piece / Unit</option><option value="pack">Pack</option><option value="carton">Carton</option>
                <option value="liter">Liter (L)</option><option value="ml">Milliliter (ml)</option><option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option><option value="meter">Meter (m)</option><option value="cm">Centimeter (cm)</option>
                <option value="bottle">Bottle</option><option value="box">Box</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="Product Category">
              <input className="veltro-product-input" style={inputStyle} value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="e.g. Drinks" list="veltro-product-categories" />
              <datalist id="veltro-product-categories">{categories.filter((item) => item !== "All").map((item) => <option key={item} value={item} />)}</datalist>
            </Field>
            <div style={{ gridColumn: "1 / -1", border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><ImagePlus size={17} color={C.cyan} /><span style={{ fontSize: 12, fontWeight: 650 }}>Product Image</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={actionButton}><ImagePlus size={15} /> Choose from Gallery</button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} style={actionButton}><Camera size={15} /> Take Photo</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onImageChange} style={{ display: "none" }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onImageChange} style={{ display: "none" }} />
              </div>
              {form.image && <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                <img src={form.image} alt="Product preview" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.border}` }} />
                <button type="button" onClick={onRemoveImage} style={{ ...actionButton, color: C.red }}><Trash2 size={14} /> Remove Image</button>
              </div>}
            </div>
            <Field label="Expiry Date (Optional)">
              <div style={{ position: "relative" }}><input className="veltro-product-input" style={inputStyle} type="date" value={form.expiryDate || ""} onChange={(e) => updateField("expiryDate", e.target.value)} /><CalendarDays size={15} color={C.muted} style={{ position: "absolute", right: 12, top: 13, pointerEvents: "none" }} /></div>
            </Field>
            <Field label="Minimum Stock Alert">
              <input className="veltro-product-input" style={inputStyle} type="number" min="0" step="1" value={form.minStock} onChange={(e) => updateField("minStock", e.target.value)} placeholder="5" />
            </Field>
          </div>
        </Section>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, flexWrap: "wrap", paddingTop: 3 }}>
          <button type="button" onClick={onClose} style={actionButton}>Cancel</button>
          <button type="submit" style={{ ...actionButton, background: C.cyan, color: "#07131A", borderColor: C.cyan, padding: "11px 16px" }}><Save size={15} /> {editingId ? "Save Changes" : "Save Product"}</button>
        </div>
      </form>

      {barcodeModalOpen && <div onMouseDown={(event) => { if (event.target === event.currentTarget) setBarcodeModalOpen(false); }}
        style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,.76)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14, boxSizing: "border-box" }}>
        <div role="dialog" aria-modal="true" aria-labelledby="secondary-barcode-title" style={{ width: "min(520px, 100%)", maxHeight: "88dvh", overflowY: "auto", background: C.panel, color: C.text, border: `1px solid ${C.border}`, borderRadius: 15, padding: 16, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
            <div><h3 id="secondary-barcode-title" style={{ margin: 0, fontSize: 16 }}>Secondary Barcodes</h3><p style={{ margin: "5px 0 0", color: C.muted, fontSize: 11 }}>Add, scan, or remove any number of additional barcodes.</p></div>
            <button type="button" onClick={() => setBarcodeModalOpen(false)} style={{ ...actionButton, padding: 8 }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {(form.barcodeAliases || []).length === 0 ? <div style={{ color: C.muted, border: `1px dashed ${C.border}`, borderRadius: 9, padding: 16, textAlign: "center", fontSize: 12 }}>No secondary barcodes yet.</div> : (form.barcodeAliases || []).map((code) => <div key={code} style={{ display: "flex", alignItems: "center", gap: 9, border: `1px solid ${C.border}`, background: C.bg, padding: "9px 10px", borderRadius: 9 }}>
              <Barcode size={15} color={C.cyan} /><span style={{ flex: 1, minWidth: 0, fontSize: 12, overflowWrap: "anywhere" }}>{code}</span>
              <button type="button" title="Delete barcode" aria-label="Delete barcode" onClick={() => removeExtraBarcode(code)} style={{ ...actionButton, padding: 7, minHeight: 34, color: C.red }}><Trash2 size={14} /></button>
            </div>)}
          </div>
          <Field label="New Secondary Barcode">
            <div style={{ display: "flex", gap: 7 }}>
              <input className="veltro-product-input" style={inputStyle} value={form.newBarcode || ""} onChange={(e) => updateField("newBarcode", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraBarcode(); } }} placeholder="Enter a barcode, then confirm" />
              <button type="button" title="Scan barcode" onClick={() => onOpenScanner("extra")} style={{ ...actionButton, color: C.green }}><Camera size={16} /></button>
              <button type="button" onClick={addExtraBarcode} style={{ ...actionButton, color: C.cyan }}><Check size={15} /> Confirm</button>
            </div>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 15 }}><button type="button" onClick={() => setBarcodeModalOpen(false)} style={{ ...actionButton, background: C.cyan, color: "#07131A", borderColor: C.cyan }}>Done</button></div>
        </div>
      </div>}
    </div>
  </div>;
}
