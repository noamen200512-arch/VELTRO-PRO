
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import ProductForm from "./products/ProductForm.jsx";
import ProductTable from "./products/ProductTable.jsx";
import ProductStats from "./products/ProductStats.jsx";
import BarcodeScanner from "./products/BarcodeScanner.jsx";
import ProductPrint from "./products/ProductPrint.jsx";
import ProductNotice from "./products/ProductNotice.jsx";
import ProductConfirm from "./products/ProductConfirm.jsx";
import "./styles/products.css";

import {
  getProducts,
  saveProducts,
  createProductId,
} from "./productStore.js";

import {
  loadProductsFromCloud,
  saveProductsToCloud,
  deleteProductFromCloud,
} from "./lib/productCloud.js";

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
  cartonsReceived: "0",
  purchaseCartonPrice: "",
  stock: "0",
  minStock: "5",
  unit: "piece",
  weighedSale: false,
  image: "",
  expiryDate: "",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")} DA`;

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

  useEffect(() => {
    const refreshCloudProducts = () => setProducts(getProducts());
    window.addEventListener("storage", refreshCloudProducts);
    window.addEventListener("veltro:cloud-sync", refreshCloudProducts);
    return () => {
      window.removeEventListener("storage", refreshCloudProducts);
      window.removeEventListener("veltro:cloud-sync", refreshCloudProducts);
    };
  }, []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [printProduct, setPrintProduct] = useState(null);
  const [showPrintRef, setShowPrintRef] = useState(true);
  const [showPrintBarcode, setShowPrintBarcode] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState("primary");
  const [scanError, setScanError] = useState("");
  const [scanSupported, setScanSupported] = useState(true);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const productsRef = useRef(products);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  // Load cloud products when the page opens.
  // Local products remain available if the cloud cannot be reached.
  useEffect(() => {
    let cancelled = false;

    async function syncProducts() {
      try {
        const localProducts = getProducts();
        const cloudProducts = await loadProductsFromCloud(localProducts);

        if (cancelled) return;

        const saved = saveProducts(cloudProducts);

        if (!saved) {
          setNotice(
            "Products loaded, but local browser storage could not be updated."
          );
          setProducts(cloudProducts);
          return;
        }

        setProducts(cloudProducts);
        setNotice("Products loaded and synchronized.");
      } catch (error) {
        if (cancelled) return;

        console.error("Unable to load products from cloud:", error);

        setProducts(getProducts());
        setNotice(
          "Cloud sync unavailable. Your saved local products are still available."
        );
      }
    }

    syncProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => setNotice(""), 5000);

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
          if (
            stopped ||
            !videoRef.current ||
            videoRef.current.readyState < 2
          ) {
            return;
          }

          try {
            const results = await detector.detect(videoRef.current);

            if (results.length && results[0].rawValue) {
              const value = results[0].rawValue.trim();

              // When adding a product, reuse the saved product record if its
              // primary or secondary barcode is scanned instead of creating a duplicate.
              if (scanTarget === "primary" && !editingId) {
                const existingProduct = productsRef.current.find((product) =>
                  [product.barcode, ...(product.barcodeAliases || [])]
                    .some((code) => String(code || "").trim() === value)
                );

                if (existingProduct) {
                  setScanOpen(false);
                  openEditModal(existingProduct);
                  setNotice(
                    `Found saved product "${existingProduct.name}". Its packaging and purchase/selling prices have been loaded.`
                  );
                  return;
                }
              }

              setForm((previous) => {
                if (scanTarget === "extra") {
                  return { ...previous, newBarcode: value };
                }

                return { ...previous, barcode: value };
              });

              setNotice(
                "Barcode scanned. Save the product to keep the change."
              );

              setScanOpen(false);
            }
          } catch {
            // Continue scanning if a camera frame cannot be read.
          }
        }, 350);
      } catch (error) {
        console.error("Barcode scanner error:", error);

        setScanError(
          "Unable to open the camera. Allow camera access or enter the barcode manually."
        );
      }
    }

    startScanner();

    return () => {
      stopped = true;

      if (interval) clearInterval(interval);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [scanOpen, scanTarget]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category || "General"))],
    [products]
  );

  const stats = useMemo(() => {
    const totalUnits = products.reduce(
      (sum, p) => sum + Number(p.stock || 0),
      0
    );

    const lowStock = products.filter(
      (p) => Number(p.stock || 0) <= Number(p.minStock || 0)
    ).length;

    const purchaseValue = products.reduce(
      (sum, p) =>
        sum + Number(p.stock || 0) * Number(p.purchasePrice || 0),
      0
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
          category === "All" ||
          (p.category || "General") === category;

        const quantity = Number(p.stock || 0);
        const minimum = Number(p.minStock || 0);

        const matchesStock =
          stockFilter === "All" ||
          (stockFilter === "Low" &&
            quantity > 0 &&
            quantity <= minimum) ||
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

  // Save locally first, then synchronize with Supabase.
  // If cloud synchronization fails, keep the local changes.
  async function persist(
    nextProducts,
    successMessage,
    syncCloud = true
  ) {
    const ok = saveProducts(nextProducts);

    if (!ok) {
      setNotice("Unable to save. Check your browser storage.");
      return false;
    }

    setProducts(nextProducts);
    setNotice(successMessage);

    if (syncCloud) {
      try {
        await saveProductsToCloud(nextProducts);
        setNotice(`${successMessage} Cloud synchronized.`);
      } catch (error) {
        console.error("Unable to save products to cloud:", error);

        setNotice(
          `${successMessage} Saved on this device, but cloud synchronization failed.`
        );
      }
    }

    return true;
  }

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      sku: generateSku(products),
      barcodeAliases: [],
      cartonsReceived: "0",
      stock: "0",
    });
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingId(product.id);
    const piecesPerCarton = Math.max(1, Number(product.piecesPerCarton || 1));

    setForm({
      ...EMPTY_FORM,
      ...product,
      barcodeAliases: Array.isArray(product.barcodeAliases)
        ? product.barcodeAliases
        : [],
      purchasePrice: String(product.purchasePrice ?? ""),
      purchaseCartonPrice: String(
        Number(product.purchasePrice || 0) * piecesPerCarton
      ),
      price: String(product.price ?? ""),
      cartonPrice: String(product.cartonPrice ?? ""),
      wholesalePrice: String(product.wholesalePrice ?? ""),
      piecesPerCarton: String(piecesPerCarton),
      cartonsReceived: "0",
      stock: String(product.stock ?? ""),
      minStock: String(product.minStock ?? 5),
      expiryDate: product.expiryDate || "",
      retailProfit: getProfitPercent(product.price, product.purchasePrice),
      wholesaleProfit: getProfitPercent(product.wholesalePrice, product.purchasePrice),
      cartonProfit: getProfitPercent(
        product.cartonPrice,
        Number(product.purchasePrice || 0) * piecesPerCarton
      ),
      newBarcode: "",
    });

    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      const cartonQty = Math.max(1, Number(next.piecesPerCarton) || 1);
      const round2 = (number) => Number(Number(number || 0).toFixed(2));

      if (key === "purchaseCartonPrice") {
        next.purchasePrice = value === ""
          ? ""
          : String(round2(Number(value) / cartonQty));
      } else if (key === "purchasePrice") {
        next.purchaseCartonPrice = value === ""
          ? ""
          : String(round2(Number(value) * cartonQty));
      } else if (key === "piecesPerCarton") {
        if (next.purchaseCartonPrice !== "") {
          next.purchasePrice = String(round2(Number(next.purchaseCartonPrice) / cartonQty));
        } else if (next.purchasePrice !== "") {
          next.purchaseCartonPrice = String(round2(Number(next.purchasePrice) * cartonQty));
        }
      }

      if (!editingId && (key === "cartonsReceived" || key === "piecesPerCarton")) {
        next.stock = String(round2(
          Math.max(0, Number(next.cartonsReceived) || 0) * cartonQty
        ));
      }

      const purchase = numberValue(next.purchasePrice);
      if (["purchasePrice", "purchaseCartonPrice", "piecesPerCarton"].includes(key)) {
        next.retailProfit = getProfitPercent(next.price, purchase);
        next.wholesaleProfit = getProfitPercent(next.wholesalePrice, purchase);
        next.cartonProfit = getProfitPercent(next.cartonPrice, purchase * cartonQty);
      }
      if (key === "price") next.retailProfit = getProfitPercent(value, purchase);
      if (key === "wholesalePrice") next.wholesaleProfit = getProfitPercent(value, purchase);
      if (key === "cartonPrice") next.cartonProfit = getProfitPercent(value, purchase * cartonQty);
      if (key === "retailProfit") next.price = priceFromProfit(purchase, value);
      if (key === "wholesaleProfit") next.wholesalePrice = priceFromProfit(purchase, value);
      if (key === "cartonProfit") next.cartonPrice = priceFromProfit(purchase * cartonQty, value);
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
      (p) =>
        p.id !== editingId &&
        getAllBarcodes(p).includes(value)
    );

    if (usedByOther) {
      setNotice("This barcode is already used by another product.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      barcodeAliases: [
        ...new Set([
          ...(previous.barcodeAliases || []),
          value,
        ]),
      ],
      newBarcode: "",
    }));

    setNotice("Additional barcode added to the form.");
  }

  function removeExtraBarcode(value) {
    setForm((previous) => ({
      ...previous,
      barcodeAliases: (previous.barcodeAliases || []).filter(
        (code) => code !== value
      ),
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

          canvas.width = Math.max(
            1,
            Math.round(image.width * ratio)
          );

          canvas.height = Math.max(
            1,
            Math.round(image.height * ratio)
          );

          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL("image/jpeg", 0.78);

          setForm((previous) => ({
            ...previous,
            image: compressed,
          }));
        } catch {
          setForm((previous) => ({
            ...previous,
            image: String(reader.result || ""),
          }));
        }
      };

      image.onerror = () => {
        setNotice("Unable to read this image.");
      };

      image.src = String(reader.result || "");
    };

    reader.onerror = () => {
      setNotice("Unable to read this image.");
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setNotice("Please enter a product name.");
      return;
    }

    const sku = form.sku.trim() || generateSku(products);

    const duplicateSku = products.some(
      (p) =>
        p.id !== editingId &&
        String(p.sku || "").toLowerCase() === sku.toLowerCase()
    );

    if (duplicateSku) {
      setNotice("This SKU already exists.");
      return;
    }

    const barcodeAliases = [
      ...new Set(
        (form.barcodeAliases || [])
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      ),
    ];

    const primaryBarcode = String(form.barcode || "").trim();

    const allFormCodes = [
      ...new Set(
        [primaryBarcode, ...barcodeAliases].filter(Boolean)
      ),
    ];

    if (
      allFormCodes.length !==
      [primaryBarcode, ...barcodeAliases].filter(Boolean).length
    ) {
      setNotice("A barcode appears more than once in this product.");
      return;
    }

    const duplicateBarcode = products.some((p) => {
      if (p.id === editingId) return false;

      const otherCodes = getAllBarcodes(p);

      return allFormCodes.some((code) => otherCodes.includes(code));
    });

    if (duplicateBarcode) {
      setNotice(
        "One of these barcodes is already used by another product."
      );
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
      piecesPerCarton: Math.max(
        1,
        Number(form.piecesPerCarton) || 1
      ),
      stock: editingId
        ? numberValue(form.stock)
        : numberValue(form.cartonsReceived) *
          Math.max(1, Number(form.piecesPerCarton) || 1),
      minStock: numberValue(form.minStock),
      unit: form.unit || "piece",
      weighedSale: Boolean(form.weighedSale),
      image: form.image || "",
      expiryDate: form.expiryDate || "",
    };

    const nextProducts = editingId
      ? products.map((p) =>
          p.id === editingId ? { ...p, ...product } : p
        )
      : [product, ...products];

    const saved = await persist(
      nextProducts,
      editingId
        ? "Product updated successfully."
        : "Product added successfully."
    );

    if (saved) {
      setModalOpen(false);
    }
  }

  function handleDelete(product) {
    setConfirmProduct(product);
  }

  async function confirmDelete() {
    if (!confirmProduct) return;

    const product = confirmProduct;
    const nextProducts = products.filter(
      (item) => item.id !== product.id
    );

    const saved = await persist(
      nextProducts,
      "Product deleted.",
      false
    );

    if (!saved) return;

    setConfirmProduct(null);

    try {
      await deleteProductFromCloud(product.id);
      setNotice("Product deleted and synchronized.");
    } catch (error) {
      console.error("Unable to delete product from cloud:", error);

      setNotice(
        "Product deleted on this device, but cloud deletion failed."
      );
    }
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

    const barsSvg = pattern.bars
      .map(
        (bar) =>
          `<rect x="${bar.x}" y="2" width="${bar.width}" height="42" fill="#111"/>`
      )
      .join("");

    const refHtml =
      showPrintRef && product.sku
        ? `<div class="reference">Reference: ${escapeHtml(product.sku)}</div>`
        : "";

    const barcodeHtml =
      showPrintBarcode && barcode
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
      setNotice(
        "Allow pop-ups in your browser to print the price card."
      );
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
    <div
      style={{
        color: C.text,
        padding: "clamp(12px, 2vw, 24px)",
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              color: C.muted,
              fontSize: 12,
              marginBottom: 7,
            }}
          >
            Commerce / Inventory
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(23px, 3vw, 30px)",
              letterSpacing: "-0.7px",
            }}
          >
            Products
          </h1>

          <p
            style={{
              color: C.muted,
              fontSize: 12,
              margin: "8px 0 0",
            }}
          >
            Manage your catalog, prices and stock levels.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            ...buttonStyle,
            background: C.cyan,
            color: "#07131A",
            borderColor: C.cyan,
            padding: "11px 16px",
          }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            padding: "12px 14px",
            border: `1px solid ${C.cyan}45`,
            background: `${C.cyan}10`,
            borderRadius: 10,
            marginBottom: 16,
            color: C.text,
            fontSize: 12,
            overflowWrap: "anywhere",
          }}
        >
          {notice}
        </div>
      )}

      <ProductNotice notice={notice} onClose={() => setNotice("")} type={notice.toLowerCase().includes("failed") || notice.toLowerCase().includes("unable") || notice.toLowerCase().includes("cannot") ? "error" : "info"} />

      <ProductStats stats={stats} money={money} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button type="button" onClick={resetFilters} style={buttonStyle}>
          <RefreshCw size={14} /> Reset Filters
        </button>
      </div>

      <ProductTable
        filteredProducts={filteredProducts}
        categories={categories}
        category={category}
        setCategory={setCategory}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        search={search}
        setSearch={setSearch}
        money={money}
        onPrintProduct={setPrintProduct}
        onEditProduct={openEditModal}
        onDeleteProduct={handleDelete}
        onAddProduct={openAddModal}
        C={C}
        buttonStyle={buttonStyle}
      />

      <ProductForm
        open={modalOpen}
        editingId={editingId}
        form={form}
        products={products}
        categories={categories.filter((item) => item !== "All")}
        buttonStyle={buttonStyle}
        fileInputRef={fileInputRef}
        cameraInputRef={cameraInputRef}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        updateField={updateField}
        generateSku={() => generateSku(products)}
        generateBarcode={() => generateBarcode(products)}
        removeExtraBarcode={removeExtraBarcode}
        addExtraBarcode={addExtraBarcode}
        onImageChange={handleImageChange}
        onRemoveImage={() => {
          setForm((previous) => ({ ...previous, image: "" }));
          if (fileInputRef.current) fileInputRef.current.value = "";
          if (cameraInputRef.current) cameraInputRef.current.value = "";
        }}
        onOpenScanner={(target) => {
          setScanTarget(target || "primary");
          setScanError("");
          setScanSupported(true);
          setScanOpen(true);
        }}
      />

      <BarcodeScanner open={scanOpen} videoRef={videoRef} error={scanError} supported={scanSupported} onClose={() => setScanOpen(false)} />

      <ProductPrint
        product={printProduct}
        money={money}
        showPrintRef={showPrintRef}
        setShowPrintRef={setShowPrintRef}
        showPrintBarcode={showPrintBarcode}
        setShowPrintBarcode={setShowPrintBarcode}
        onClose={() => setPrintProduct(null)}
        onPrint={printPriceCard}
        buttonStyle={buttonStyle}
      />

      <ProductConfirm
        open={Boolean(confirmProduct)}
        title="Delete product"
        message={confirmProduct ? `Are you sure you want to delete "${confirmProduct.name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete product"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmProduct(null)}
      />
    </div>
  );
}

function getProfitPercent(price, cost) {
  const p = Number(price || 0);
  const c = Number(cost || 0);

  if (c <= 0) return "";

  return String(
    Number((((p - c) / c) * 100).toFixed(2))
  );
}

function priceFromProfit(cost, profit) {
  const c = Number(cost || 0);
  const pct = Number(profit || 0);

  if (profit === "" || !Number.isFinite(pct)) return "";

  return String(Number((c * (1 + pct / 100)).toFixed(2)));
}
