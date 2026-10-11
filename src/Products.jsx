
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Plus, Package, Boxes, AlertTriangle, TrendingUp,
  Edit3, Trash2, X, Save, RefreshCw, Barcode, Filter,
  ArrowUpDown, Printer, Camera, ImagePlus, Percent,
  ScanBarcode, Eye, EyeOff, CheckCircle2
} from "lucide-react";

import {
  getProducts,
  saveProducts,
  createProductId,
} from "./productStore.js";

const C = {
  bg: "#080D18",
  panel: "#0D1525",
  panel2: "#111C30",
  border: "rgba(148,163,184,0.14)",
  text: "#F1F5F9",
  muted: "#8795AC",
  cyan: "#35D6D0",
  violet: "#9B8AFB",
  green: "#34D399",
  red: "#FB7185",
  orange: "#FBBF24",
};

const EMPTY_FORM = {
  name: "",
  sku: "",
  barcode: "",
  barcodeAliases: [],
  newBarcode: "",
  category: "General",
  purchasePrice: "",
  price: "",
  cartonPrice: "",
  wholesalePrice: "",
  retailProfit: "",
  wholesaleProfit: "",
  cartonProfit: "",
  piecesPerCarton: "1",
  stock: "",
  minStock: "5",
  unit: "piece",
  image: "",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR")} DA`;

const numberValue = (value) => Math.max(0, Number(value) || 0);

const fieldStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 9,
  border: `1px solid ${C.border}`,
  background: C.bg,
  color: C.text,
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 7, minWidth: 0 }}>
      <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ icon: Icon, label, value, color, note }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 18,
      minWidth: 0,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}>
        <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
        <span style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          display: "grid",
          placeItems: "center",
          color,
          flexShrink: 0,
        }}>
          <Icon size={18} />
        </span>
      </div>
      <div style={{
        color: C.text,
        fontSize: 25,
        fontWeight: 750,
        marginTop: 15,
        overflowWrap: "anywhere",
      }}>
        {value}
      </div>
      <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
        {note}
      </div>
    </div>
  );
}

function getAllBarcodes(product) {
  return [...new Set([
    product?.barcode,
    ...(Array.isArray(product?.barcodeAliases) ? product.barcodeAliases : []),
  ].map((v) => String(v || "").trim()).filter(Boolean))];
}

function generateSku(products) {
  const used = new Set(products.map((p) => String(p.sku || "").toUpperCase()));
  let n = 1;
  while (used.has(`PRD-${String(n).padStart(3, "0")}`)) n++;
  return `PRD-${String(n).padStart(3, "0")}`;
}

function ean13CheckDigit(firstTwelve) {
  const digits = String(firstTwelve).padStart(12, "0").slice(-12);
  const sum = digits.split("").reduce(
    (total, digit, index) =>
      total + Number(digit) * (index % 2 === 0 ? 1 : 3),
    0
  );
  return String((10 - (sum % 10)) % 10);
}

function generateBarcode(products) {
  const used = new Set(products.flatMap(getAllBarcodes));
  let n = 1;
  let candidate = "";
  do {
    const base = String(200000000000 + n).slice(-12);
    candidate = base + ean13CheckDigit(base);
    n++;
  } while (used.has(candidate));
  return candidate;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function makeBarcodePattern(value) {
  // A decorative bar pattern for the printed price card.
  // The human-readable barcode digits are printed beneath it.
  const text = String(value || "");
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }
  const bars = [];
  let x = 4;
  for (let i = 0; i < Math.max(40, text.length * 7); i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const width = (seed & 3) === 0 ? 2 : 1;
    if (seed & 0x80000000) bars.push({ x, width });
    x += width + ((seed >>> 4) & 1) + 1;
  }
  return { bars, width: x + 4 };
}

export default function Products() {
  const [products, setProducts] = useState(() => getProducts());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");
  const [printProduct, setPrintProduct] = useState(null);
  const [showPrintRef, setShowPrintRef] = useState(true);
  const [showPrintBarcode, setShowPrintBarcode] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState("primary");
  const [scanError, setScanError] = useState("");
  const [scanSupported, setScanSupported] = useState(true);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!scanOpen) return;

    let stream;
    let stopped = false;
    let interval;

    async function startScanner() {
      try {
        if (!("BarcodeDetector" in window)) {
          setScanSupported(false);
          setScanError(
            "Barcode scanning is not supported by this browser. You can enter the code manually."
          );
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setScanError("Camera access is unavailable in this browser.");
          return;
        }

        const detector = new window.BarcodeDetector();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        interval = setInterval(async () => {
          if (stopped || !videoRef.current || videoRef.current.readyState < 2) {
            return;
          }
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length && results[0].rawValue) {
              const value = results[0].rawValue.trim();
              setForm((previous) => {
                if (scanTarget === "extra") {
                  return { ...previous, newBarcode: value };
                }
                return { ...previous, barcode: value };
              });
              setNotice("Barcode scanned. Save the product to keep the change.");
              setScanOpen(false);
            }
          } catch {
            // Keep scanning if one camera frame cannot be read.
          }
        }, 350);
      } catch {
        setScanError(
          "Unable to open the camera. Allow camera access or enter the barcode manually."
        );
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [scanOpen, scanTarget]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category || "General"))],
    [products]
  );

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, p) => sum + Number(p.stock || 0), 0
    );
    const lowStock = products.filter(
      (p) => Number(p.stock || 0) <= Number(p.minStock || 0)
    ).length;
    const purchaseValue = products.reduce(
      (sum, p) => sum + Number(p.stock || 0) * Number(p.purchasePrice || 0), 0
    );
    return {
      count: products.length,
      totalUnits,
      lowStock,
      purchaseValue,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((p) => {
        const allCodes = getAllBarcodes(p);
        const matchesSearch =
          !query ||
          [p.name, p.sku, p.barcode, p.category, p.id, ...allCodes]
            .some((v) => String(v || "").toLowerCase().includes(query));

        const matchesCategory =
          category === "All" || (p.category || "General") === category;

        const quantity = Number(p.stock || 0);
        const minimum = Number(p.minStock || 0);

        const matchesStock =
          stockFilter === "All" ||
          (stockFilter === "Low" && quantity > 0 && quantity <= minimum) ||
          (stockFilter === "Available" && quantity > minimum) ||
          (stockFilter === "Out" && quantity <= 0);

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "stock") {
          return Number(a.stock || 0) - Number(b.stock || 0);
        }
        if (sortBy === "price") {
          return Number(a.price || 0) - Number(b.price || 0);
        }
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [products, search, category, stockFilter, sortBy]);

  function persist(nextProducts, successMessage) {
    const ok = saveProducts(nextProducts);
    if (!ok) {
      setNotice("Unable to save. Check your browser storage.");
      return false;
    }
    setProducts(nextProducts);
    setNotice(successMessage);
    return true;
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, barcodeAliases: [] });
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingId(product.id);
    setForm({
      ...EMPTY_FORM,
      ...product,
      barcodeAliases: Array.isArray(product.barcodeAliases)
        ? product.barcodeAliases
        : [],
      purchasePrice: String(product.purchasePrice ?? ""),
      price: String(product.price ?? ""),
      cartonPrice: String(product.cartonPrice ?? ""),
      wholesalePrice: String(product.wholesalePrice ?? ""),
      piecesPerCarton: String(product.piecesPerCarton ?? 1),
      stock: String(product.stock ?? ""),
      minStock: String(product.minStock ?? 5),
      retailProfit: getProfitPercent(product.price, product.purchasePrice),
      wholesaleProfit: getProfitPercent(product.wholesalePrice, product.purchasePrice),
      cartonProfit: getProfitPercent(
        product.cartonPrice,
        Number(product.purchasePrice || 0) * Number(product.piecesPerCarton || 1)
      ),
      newBarcode: "",
    });
    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      const purchase = numberValue(next.purchasePrice);
      const cartonQty = Math.max(1, Number(next.piecesPerCarton) || 1);

      if (key === "purchasePrice" || key === "piecesPerCarton") {
        next.retailProfit = getProfitPercent(next.price, purchase);
        next.wholesaleProfit = getProfitPercent(next.wholesalePrice, purchase);
        next.cartonProfit = getProfitPercent(next.cartonPrice, purchase * cartonQty);
      }

      if (key === "price") {
        next.retailProfit = getProfitPercent(value, purchase);
      }
      if (key === "wholesalePrice") {
        next.wholesaleProfit = getProfitPercent(value, purchase);
      }
      if (key === "cartonPrice") {
        next.cartonProfit = getProfitPercent(value, purchase * cartonQty);
      }

      if (key === "retailProfit") {
        next.price = priceFromProfit(purchase, value);
      }
      if (key === "wholesaleProfit") {
        next.wholesalePrice = priceFromProfit(purchase, value);
      }
      if (key === "cartonProfit") {
        next.cartonPrice = priceFromProfit(purchase * cartonQty, value);
      }

      return next;
    });
  }

  function addExtraBarcode() {
    const value = String(form.newBarcode || "").trim();
    if (!value) {
      setNotice("Enter or scan an additional barcode first.");
      return;
    }

    const currentCodes = getAllBarcodes(form);
    if (currentCodes.includes(value)) {
      setNotice("This barcode is already assigned to this product.");
      return;
    }

    const usedByOther = products.some(
      (p) => p.id !== editingId && getAllBarcodes(p).includes(value)
    );
    if (usedByOther) {
      setNotice("This barcode is already used by another product.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      barcodeAliases: [...new Set([
        ...(previous.barcodeAliases || []),
        value,
      ])],
      newBarcode: "",
    }));
    setNotice("Additional barcode added to the form.");
  }

  function removeExtraBarcode(value) {
    setForm((previous) => ({
      ...previous,
      barcodeAliases: (previous.barcodeAliases || []).filter((code) => code !== value),
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setNotice("Please choose an image smaller than 8 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDimension = 700;
          const ratio = Math.min(
            1,
            maxDimension / Math.max(image.width, image.height)
          );
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", 0.78);
          setForm((previous) => ({ ...previous, image: compressed }));
        } catch {
          setForm((previous) => ({ ...previous, image: String(reader.result || "") }));
        }
      };
      image.onerror = () => {
        setNotice("Unable to read this image.");
      };
      image.src = String(reader.result || "");
    };
    reader.onerror = () => setNotice("Unable to read this image.");
    reader.readAsDataURL(file);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setNotice("Please enter a product name.");
      return;
    }

    const sku = form.sku.trim() || generateSku(products);

    const duplicateSku = products.some(
      (p) => p.id !== editingId && String(p.sku || "").toLowerCase() === sku.toLowerCase()
    );
    if (duplicateSku) {
      setNotice("This SKU already exists.");
      return;
    }

    const barcodeAliases = [...new Set(
      (form.barcodeAliases || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )];
    const primaryBarcode = String(form.barcode || "").trim();
    const allFormCodes = [...new Set([primaryBarcode, ...barcodeAliases].filter(Boolean))];

    if (allFormCodes.length !== [primaryBarcode, ...barcodeAliases].filter(Boolean).length) {
      setNotice("A barcode appears more than once in this product.");
      return;
    }

    const duplicateBarcode = products.some((p) => {
      if (p.id === editingId) return false;
      const otherCodes = getAllBarcodes(p);
      return allFormCodes.some((code) => otherCodes.includes(code));
    });

    if (duplicateBarcode) {
      setNotice("One of these barcodes is already used by another product.");
      return;
    }

    const product = {
      id: editingId || createProductId(),
      name,
      sku,
      barcode: primaryBarcode,
      barcodeAliases,
      category: form.category.trim() || "General",
      purchasePrice: numberValue(form.purchasePrice),
      price: numberValue(form.price),
      cartonPrice: numberValue(form.cartonPrice),
      wholesalePrice: numberValue(form.wholesalePrice),
      piecesPerCarton: Math.max(1, Number(form.piecesPerCarton) || 1),
      stock: numberValue(form.stock),
      minStock: numberValue(form.minStock),
      unit: form.unit || "piece",
      image: form.image || "",
    };

    const nextProducts = editingId
      ? products.map((p) => (p.id === editingId ? { ...p, ...product } : p))
      : [product, ...products];

    if (persist(
      nextProducts,
      editingId ? "Product updated successfully." : "Product added successfully."
    )) {
      setModalOpen(false);
    }
  }

  function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    persist(
      products.filter((p) => p.id !== product.id),
      "Product deleted."
    );
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setStockFilter("All");
    setSortBy("name");
  }

  function printPriceCard() {
    if (!printProduct) return;

    const product = printProduct;
    const barcode = getAllBarcodes(product)[0] || "";
    const pattern = makeBarcodePattern(barcode);
    const barsSvg = pattern.bars.map((bar) =>
      `<rect x="${bar.x}" y="2" width="${bar.width}" height="42" fill="#111"/>`
    ).join("");

    const refHtml = showPrintRef && product.sku
      ? `<div class="reference">Reference: ${escapeHtml(product.sku)}</div>`
      : "";

    const barcodeHtml = showPrintBarcode && barcode
      ? `<div class="barcode">
          <svg viewBox="0 0 ${pattern.width} 48" role="img" aria-label="Barcode">
            ${barsSvg}
            <text x="${pattern.width / 2}" y="47" text-anchor="middle"
              font-size="8" fill="#111">${escapeHtml(barcode)}</text>
          </svg>
        </div>`
      : "";

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Price - ${escapeHtml(product.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 10mm; color: #111; font-family: Arial, sans-serif; }
  .card { width: 70mm; min-height: 38mm; padding: 5mm; border: 1px solid #222;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; gap: 3mm; break-inside: avoid; }
  .name { font-size: 16pt; font-weight: 700; overflow-wrap: anywhere; }
  .reference { font-size: 9pt; }
  .barcode { width: 100%; max-width: 58mm; }
  .barcode svg { display: block; width: 100%; height: auto; }
  .price { font-size: 23pt; font-weight: 800; }
  @page { size: auto; margin: 8mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="card">
    <div class="name">${escapeHtml(product.name)}</div>
    ${refHtml}
    ${barcodeHtml}
    <div class="price">${escapeHtml(money(product.price))}</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      setNotice("Allow pop-ups in your browser to print the price card.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  const buttonStyle = {
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    padding: "9px 12px",
    color: C.text,
    background: C.panel2,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontSize: 12,
    fontWeight: 600,
  };

  return (
    <div style={{
      color: C.text,
      padding: "clamp(12px, 2vw, 24px)",
      minWidth: 0,
      width: "100%",
      boxSizing: "border-box",
    }}>
      <style>{`
        .veltro-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .veltro-product-toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .veltro-product-table-wrap { width: 100%; overflow-x: auto; }
        .veltro-product-table {
          width: 100%; min-width: 760px; border-collapse: collapse; text-align: left;
        }
        .veltro-product-table th {
          color: ${C.muted}; font-size: 11px; font-weight: 600;
          padding: 13px 15px; border-bottom: 1px solid ${C.border}; white-space: nowrap;
        }
        .veltro-product-table td {
          padding: 14px 15px; border-bottom: 1px solid ${C.border};
          font-size: 12px; white-space: nowrap;
        }
        .veltro-product-table tbody tr:hover { background: rgba(53,214,208,0.035); }
        .veltro-product-input {
          width: 100%; padding: 11px 12px; border-radius: 9px;
          border: 1px solid ${C.border}; background: ${C.bg}; color: ${C.text};
          outline: none; box-sizing: border-box; font-size: 13px;
        }
        .veltro-product-input:focus { border-color: ${C.cyan}; }
        .veltro-product-action {
          min-width: 34px; min-height: 34px; flex-shrink: 0;
        }
        @media (max-width: 1050px) {
          .veltro-products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 520px) {
          .veltro-products-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 14, flexWrap: "wrap", marginBottom: 24,
      }}>
        <div>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 7 }}>
            Commerce / Inventory
          </div>
          <h1 style={{
            margin: 0, fontSize: "clamp(23px, 3vw, 30px)", letterSpacing: "-0.7px",
          }}>
            Products
          </h1>
          <p style={{ color: C.muted, fontSize: 12, margin: "8px 0 0" }}>
            Manage your catalog, prices and stock levels.
          </p>
        </div>
        <button onClick={openAddModal} style={{
          ...buttonStyle, background: C.cyan, color: "#07131A",
          borderColor: C.cyan, padding: "11px 16px",
        }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {notice && (
        <div role="status" style={{
          padding: "12px 14px", border: `1px solid ${C.cyan}45`,
          background: `${C.cyan}10`, borderRadius: 10, marginBottom: 16,
          color: C.text, fontSize: 12,
        }}>
          {notice}
        </div>
      )}

      <div className="veltro-products-grid" style={{ marginBottom: 22 }}>
        <StatCard icon={Package} label="Total Products" value={stats.count}
          color={C.cyan} note="Products in your catalog" />
        <StatCard icon={Boxes} label="Units in Stock"
          value={stats.totalUnits.toLocaleString("fr-FR")}
          color={C.violet} note="Combined available quantity" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={stats.lowStock}
          color={C.orange} note="At or below minimum stock" />
        <StatCard icon={TrendingUp} label="Stock Cost Value"
          value={money(stats.purchaseValue)} color={C.green}
          note="Estimated purchase value" />
      </div>

      <section style={{
        border: `1px solid ${C.border}`, borderRadius: 14,
        background: C.panel, overflow: "hidden",
      }}>
        <div style={{
          padding: 16, display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 12, flexWrap: "wrap",
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Product Inventory</h2>
            <p style={{ color: C.muted, fontSize: 11, margin: "6px 0 0" }}>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
          <button onClick={resetFilters} style={buttonStyle}>
            <RefreshCw size={14} /> Reset Filters
          </button>
        </div>

        <div className="veltro-product-toolbar" style={{ padding: 16 }}>
          <div style={{ flex: "1 1 220px", position: "relative", minWidth: 0 }}>
            <Search size={16} color={C.muted} style={{
              position: "absolute", left: 12, top: 12, pointerEvents: "none",
            }} />
            <input className="veltro-product-input" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, barcode..."
              style={{ paddingLeft: 38 }} />
          </div>

          <select className="veltro-product-input" value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            style={{ width: "auto", minWidth: 130, maxWidth: "100%" }}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select className="veltro-product-input" value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filter by stock"
            style={{ width: "auto", minWidth: 125, maxWidth: "100%" }}>
            <option value="All">All Stock</option>
            <option value="Available">In Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Out">Out of Stock</option>
          </select>

          <select className="veltro-product-input" value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            style={{ width: "auto", minWidth: 130, maxWidth: "100%" }}>
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            <option value="price">Sort: Price</option>
          </select>
        </div>

        <div className="veltro-product-table-wrap">
          <table className="veltro-product-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU / BARCODE</th>
                <th>CATEGORY</th>
                <th>SELLING PRICE</th>
                <th>PURCHASE PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0);
                const minimum = Number(product.minStock || 0);
                const out = stock <= 0;
                const low = !out && stock <= minimum;
                const statusColor = out ? C.red : low ? C.orange : C.green;
                const statusText = out ? "Out of Stock" : low ? "Low Stock" : "In Stock";
                const codes = getAllBarcodes(product);

                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 35, height: 35, borderRadius: 9,
                          background: `${C.cyan}12`, color: C.cyan,
                          display: "grid", placeItems: "center", flexShrink: 0,
                          overflow: "hidden",
                        }}>
                          {product.image
                            ? <img src={product.image} alt="" style={{
                                width: "100%", height: "100%", objectFit: "cover",
                              }} />
                            : <Package size={17} />}
                        </div>
                        <div>
                          <div style={{ color: C.text, fontWeight: 650 }}>
                            {product.name}
                          </div>
                          <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{product.sku || "—"}</div>
                      {codes.map((code) => (
                        <div key={code} style={{
                          color: C.muted, fontSize: 10, marginTop: 4,
                        }}>
                          <Barcode size={11} style={{
                            display: "inline", verticalAlign: "middle",
                          }} /> {code}
                        </div>
                      ))}
                    </td>
                    <td style={{ color: C.muted }}>{product.category || "General"}</td>
                    <td style={{ fontWeight: 650 }}>{money(product.price)}</td>
                    <td style={{ color: C.muted }}>{money(product.purchasePrice)}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {stock.toLocaleString("fr-FR")}
                      </span>{" "}
                      <span style={{ color: C.muted, fontSize: 10 }}>
                        {product.unit || "piece"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        color: statusColor, background: `${statusColor}12`,
                        padding: "5px 8px", borderRadius: 20, fontSize: 10,
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: statusColor,
                        }} />
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <div style={{
                        display: "flex", justifyContent: "flex-end",
                        gap: 6, alignItems: "center",
                      }}>
                        <button title="Print price card"
                          aria-label={`Print price for ${product.name}`}
                          onClick={() => setPrintProduct(product)}
                          style={{ ...buttonStyle, padding: 8, color: C.green }}
                          className="veltro-product-action">
                          <Printer size={14} />
                        </button>
                        <button title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEditModal(product)}
                          style={{ ...buttonStyle, padding: 8, color: C.cyan }}
                          className="veltro-product-action">
                          <Edit3 size={14} />
                        </button>
                        <button title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => handleDelete(product)}
                          style={{ ...buttonStyle, padding: 8, color: C.red }}
                          className="veltro-product-action">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} style={{
                    textAlign: "center", padding: "50px 20px", whiteSpace: "normal",
                  }}>
                    <Package size={30} color={C.muted} style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 650 }}>No products found</div>
                    <p style={{ color: C.muted, fontSize: 12 }}>
                      Try changing your filters or add a new product.
                    </p>
                    <button onClick={openAddModal} style={buttonStyle}>
                      <Plus size={14} /> Add Product
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          borderTop: `1px solid ${C.border}`, padding: "12px 16px",
          display: "flex", justifyContent: "space-between", gap: 10,
          flexWrap: "wrap", color: C.muted, fontSize: 11,
        }}>
          <span><Filter size={12} style={{
            display: "inline", verticalAlign: "middle",
          }} /> Inventory overview</span>
          <span><ArrowUpDown size={12} style={{
            display: "inline", verticalAlign: "middle",
          }} /> Changes are saved in this browser</span>
        </div>
      </section>

      {modalOpen && (
        <div onMouseDown={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 14,
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title"
            style={{
              width: "min(760px, 100%)", maxHeight: "92vh", overflowY: "auto",
              background: C.panel, border: `1px solid ${C.border}`,
              borderRadius: 16, boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}>
            <div style={{
              padding: 18, borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 12,
            }}>
              <div>
                <h2 id="product-modal-title" style={{ margin: 0, fontSize: 18 }}>
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p style={{ color: C.muted, fontSize: 11, margin: "6px 0 0" }}>
                  Enter the product information below.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)}
                aria-label="Close dialog" style={buttonStyle}>
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{
                padding: 18, display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                gap: 14,
              }}>
                <Field label="Product Name *">
                  <input className="veltro-product-input" value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Mineral Water" required autoFocus />
                </Field>

                <Field label="SKU / Reference">
                  <div style={{ display: "flex", gap: 7 }}>
                    <input className="veltro-product-input" value={form.sku}
                      onChange={(e) => updateField("sku", e.target.value)}
                      placeholder="e.g. PRD-001" />
                    <button type="button" title="Generate reference"
                      onClick={() => updateField("sku", generateSku(products))}
                      style={{ ...buttonStyle, color: C.cyan, flexShrink: 0 }}>
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </Field>

                <Field label="Barcode">
                  <div style={{ display: "flex", gap: 7 }}>
                    <input className="veltro-product-input" value={form.barcode}
                      onChange={(e) => updateField("barcode", e.target.value)}
                      placeholder="Scan or type barcode" />
                    <button type="button" title="Generate barcode"
                      onClick={() => updateField("barcode", generateBarcode(products))}
                      style={{ ...buttonStyle, color: C.cyan, flexShrink: 0 }}>
                      <Barcode size={15} />
                    </button>
                    <button type="button" title="Scan with camera"
                      onClick={() => {
                        setScanTarget("primary");
                        setScanError("");
                        setScanSupported(true);
                        setScanOpen(true);
                      }}
                      style={{ ...buttonStyle, color: C.green, flexShrink: 0 }}>
                      <Camera size={15} />
                    </button>
                  </div>
                </Field>

                <Field label="Category">
                  <input className="veltro-product-input" value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    placeholder="e.g. Drinks" list="veltro-product-categories" />
                  <datalist id="veltro-product-categories">
                    {categories.filter((item) => item !== "All").map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </Field>

                <div style={{
                  gridColumn: "1 / -1", border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 12, display: "grid", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Barcode size={16} color={C.cyan} />
                    <span style={{ fontSize: 12, fontWeight: 650 }}>
                      Additional Barcodes
                    </span>
                  </div>
                  {(form.barcodeAliases || []).map((code) => (
                    <div key={code} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, padding: "7px 9px", borderRadius: 8,
                      background: C.bg, fontSize: 12,
                    }}>
                      <span style={{ overflowWrap: "anywhere" }}>{code}</span>
                      <button type="button" title="Remove barcode"
                        onClick={() => removeExtraBarcode(code)}
                        style={{ ...buttonStyle, padding: 6, color: C.red }}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 7 }}>
                    <input className="veltro-product-input" value={form.newBarcode}
                      onChange={(e) => updateField("newBarcode", e.target.value)}
                      placeholder="Enter an additional barcode" />
                    <button type="button" title="Scan additional barcode"
                      onClick={() => {
                        setScanTarget("extra");
                        setScanError("");
                        setScanSupported(true);
                        setScanOpen(true);
                      }}
                      style={{ ...buttonStyle, color: C.green, flexShrink: 0 }}>
                      <Camera size={15} />
                    </button>
                    <button type="button" onClick={addExtraBarcode}
                      style={{ ...buttonStyle, color: C.cyan, flexShrink: 0 }}>
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>

                <Field label="Purchase Price (DA)">
                  <input className="veltro-product-input" type="number" min="0" step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) => updateField("purchasePrice", e.target.value)}
                    placeholder="0" />
                </Field>

                <Field label="Retail Selling Price (DA) *">
                  <input className="veltro-product-input" type="number" min="0" step="0.01"
                    value={form.price} onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0" required />
                </Field>

                <Field label="Retail Profit (%)">
                  <div style={{ position: "relative" }}>
                    <input className="veltro-product-input" type="number" step="0.01"
                      value={form.retailProfit}
                      onChange={(e) => updateField("retailProfit", e.target.value)}
                      placeholder="0" style={{ paddingRight: 36 }} />
                    <Percent size={15} color={C.muted} style={{
                      position: "absolute", right: 12, top: 12, pointerEvents: "none",
                    }} />
                  </div>
                </Field>

                <Field label="Wholesale Price (DA)">
                  <input className="veltro-product-input" type="number" min="0" step="0.01"
                    value={form.wholesalePrice}
                    onChange={(e) => updateField("wholesalePrice", e.target.value)}
                    placeholder="0" />
                </Field>

                <Field label="Wholesale Profit (%)">
                  <div style={{ position: "relative" }}>
                    <input className="veltro-product-input" type="number" step="0.01"
                      value={form.wholesaleProfit}
                      onChange={(e) => updateField("wholesaleProfit", e.target.value)}
                      placeholder="0" style={{ paddingRight: 36 }} />
                    <Percent size={15} color={C.muted} style={{
                      position: "absolute", right: 12, top: 12, pointerEvents: "none",
                    }} />
                  </div>
                </Field>

                <Field label="Carton Price (DA)">
                  <input className="veltro-product-input" type="number" min="0" step="0.01"
                    value={form.cartonPrice}
                    onChange={(e) => updateField("cartonPrice", e.target.value)}
                    placeholder="0" />
                </Field>

                <Field label="Carton Profit (%)">
                  <div style={{ position: "relative" }}>
                    <input className="veltro-product-input" type="number" step="0.01"
                      value={form.cartonProfit}
                      onChange={(e) => updateField("cartonProfit", e.target.value)}
                      placeholder="0" style={{ paddingRight: 36 }} />
                    <Percent size={15} color={C.muted} style={{
                      position: "absolute", right: 12, top: 12, pointerEvents: "none",
                    }} />
                  </div>
                </Field>

                <Field label="Pieces per Carton">
                  <input className="veltro-product-input" type="number" min="1" step="1"
                    value={form.piecesPerCarton}
                    onChange={(e) => updateField("piecesPerCarton", e.target.value)} />
                </Field>

                <Field label="Current Stock">
                  <input className="veltro-product-input" type="number" min="0" step="1"
                    value={form.stock} onChange={(e) => updateField("stock", e.target.value)}
                    placeholder="0" />
                </Field>

                <Field label="Minimum Stock Alert">
                  <input className="veltro-product-input" type="number" min="0" step="1"
                    value={form.minStock}
                    onChange={(e) => updateField("minStock", e.target.value)}
                    placeholder="5" />
                </Field>

                <Field label="Unit">
                  <select className="veltro-product-input" value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}>
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

                <div style={{
                  gridColumn: "1 / -1", border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ImagePlus size={17} color={C.cyan} />
                      <span style={{ fontSize: 12 }}>Product Image</span>
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      style={buttonStyle}>
                      <Plus size={14} /> Choose Image
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*"
                      onChange={handleImageChange} style={{ display: "none" }} />
                  </div>
                  {form.image && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12, marginTop: 12,
                    }}>
                      <img src={form.image} alt="Product preview" style={{
                        width: 76, height: 76, borderRadius: 9,
                        objectFit: "cover", border: `1px solid ${C.border}`,
                      }} />
                      <button type="button"
                        onClick={() => {
                          setForm((previous) => ({ ...previous, image: "" }));
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        style={{ ...buttonStyle, color: C.red }}>
                        <Trash2 size={14} /> Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                padding: 18, borderTop: `1px solid ${C.border}`,
                display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap",
              }}>
                <button type="button" onClick={() => setModalOpen(false)} style={buttonStyle}>
                  Cancel
                </button>
                <button type="submit" style={{
                  ...buttonStyle, background: C.cyan, color: "#07131A",
                  borderColor: C.cyan, padding: "10px 16px",
                }}>
                  <Save size={15} /> {editingId ? "Save Changes" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scanOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10001,
          background: "rgba(0,0,0,0.82)", display: "flex",
          alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            width: "min(520px, 100%)", background: C.panel,
            border: `1px solid ${C.border}`, borderRadius: 15, padding: 18,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", gap: 12, marginBottom: 12,
            }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Scan Barcode</h3>
              <button onClick={() => setScanOpen(false)} style={buttonStyle}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: C.muted, fontSize: 12 }}>
              Point the rear camera at the product barcode.
            </p>
            <video ref={videoRef} muted playsInline style={{
              display: "block", width: "100%", maxHeight: 320,
              background: "#000", borderRadius: 10, objectFit: "contain",
            }} />
            {scanError && (
              <p style={{ color: C.orange, fontSize: 12, lineHeight: 1.5 }}>
                {scanError}
              </p>
            )}
            {!scanSupported && (
              <p style={{ color: C.muted, fontSize: 12 }}>
                You can type the barcode in the product form instead.
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={() => setScanOpen(false)} style={buttonStyle}>
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}

      {printProduct && (
        <div onMouseDown={(e) => {
          if (e.target === e.currentTarget) setPrintProduct(null);
        }} style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            width: "min(440px, 100%)", background: C.panel,
            border: `1px solid ${C.border}`, borderRadius: 16, padding: 18,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10, marginBottom: 12,
            }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Print Price Card</h2>
              <button onClick={() => setPrintProduct(null)} style={buttonStyle}>
                <X size={16} />
              </button>
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 0 }}>
              {printProduct.name}
            </p>

            <div style={{
              border: `1px solid ${C.border}`, borderRadius: 10,
              padding: 14, background: C.bg, marginBottom: 14,
            }}>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
                Information to show on the card
              </div>
              <label style={{
                display: "flex", alignItems: "center", gap: 9,
                fontSize: 13, marginBottom: 12, cursor: "pointer",
              }}>
                <input type="checkbox" checked={showPrintRef}
                  onChange={(e) => setShowPrintRef(e.target.checked)} />
                Show product reference
              </label>
              <label style={{
                display: "flex", alignItems: "center", gap: 9,
                fontSize: 13, cursor: "pointer",
              }}>
                <input type="checkbox" checked={showPrintBarcode}
                  onChange={(e) => setShowPrintBarcode(e.target.checked)} />
                Show barcode and digits
              </label>
            </div>

            <div style={{
              background: "#FFFFFF", color: "#111111", border: "1px solid #222",
              borderRadius: 8, padding: 16, textAlign: "center", marginBottom: 16,
            }}>
              <div style={{
                fontWeight: 700, fontSize: 17, overflowWrap: "anywhere",
              }}>{printProduct.name}</div>
              {showPrintRef && printProduct.sku && (
                <div style={{ fontSize: 11, marginTop: 8 }}>
                  Reference: {printProduct.sku}
                </div>
              )}
              {showPrintBarcode && getAllBarcodes(printProduct)[0] && (
                <div style={{
                  fontSize: 11, marginTop: 8, letterSpacing: 1,
                  overflowWrap: "anywhere",
                }}>
                  <Barcode size={20} style={{ verticalAlign: "middle" }} />
                  <div>{getAllBarcodes(printProduct)[0]}</div>
                </div>
              )}
              <div style={{ fontSize: 25, fontWeight: 800, marginTop: 10 }}>
                {money(printProduct.price)}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setPrintProduct(null)} style={buttonStyle}>
                Cancel
              </button>
              <button onClick={printPriceCard} style={{
                ...buttonStyle, background: C.cyan,
                color: "#07131A", borderColor: C.cyan,
              }}>
                <Printer size={15} /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getProfitPercent(price, cost) {
  const p = Number(price || 0);
  const c = Number(cost || 0);
  if (c <= 0) return "";
  return String(Number((((p - c) / c) * 100).toFixed(2)));
}

function priceFromProfit(cost, profit) {
  const c = Number(cost || 0);
  const pct = Number(profit || 0);
  if (profit === "" || !Number.isFinite(pct)) return "";
  return String(Number((c * (1 + pct / 100)).toFixed(2)));
}
