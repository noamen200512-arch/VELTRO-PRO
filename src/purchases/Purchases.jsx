import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Search, X, Trash2, Package, Truck, CalendarDays,
  CreditCard, Eye, Printer, Pencil, Barcode, Camera, Images,
  Save, History, CheckCircle2, AlertTriangle, Info, RotateCcw,
  FileText, ScanLine, ChevronDown, ChevronUp, CircleDollarSign, ReceiptText, Wallet,
  UserRound, Hash, Clock3, ScanBarcode, ListFilter, Edit3
} from "lucide-react";
import { getProducts, saveProducts, createProductId } from "../productStore.js";
import {
  getPurchaseInvoices,
  getPurchaseSuppliers,
  savePurchaseInvoices,
  savePurchaseSuppliers
} from "./purchaseService.js";
import "./purchases.css";

const DRAFT_KEY = "veltro_purchase_draft_v2";
const CATEGORIES_KEY = "veltro_product_categories";
const UNITS_KEY = "veltro_product_units";

const purchaseText = (en, fr, ar) => {
  const locale = document.documentElement.lang;
  return locale === "ar" ? ar : locale === "fr" ? fr : en;
};

const money = value => {
  const locale = document.documentElement.lang === "ar"
    ? "ar-DZ"
    : document.documentElement.lang === "fr"
      ? "fr-DZ"
      : "en-US";
  return `${Number(value || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} DA`;
};

const nowISO = () => new Date().toISOString();
const normalize = value => String(value ?? "").trim().toLowerCase();

const makeId = prefix =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const safeRead = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

function makeEan13(existingCodes) {
  for (let attempt = 0; attempt < 100; attempt++) {
    // Internal EAN-13 style identifier. It is not a GS1-issued GTIN.
    const body = "200" + Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const code = body + checkDigit;

    if (!existingCodes.has(code)) return code;
  }

  return "";
}

function isValidEan13(value) {
  const code = String(value || "").trim();
  if (!/^\d{13}$/.test(code)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(code[i]) * (i % 2 === 0 ? 1 : 3);
  }

  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

function barcodeSvg(code) {
  const digits = String(code || "");
  const patterns = {
    "0": "0001101", "1": "0011001", "2": "0010011",
    "3": "0111101", "4": "0100011", "5": "0110001",
    "6": "0101111", "7": "0111011", "8": "0110111",
    "9": "0001011"
  };

  if (!isValidEan13(digits)) return "";

  const left = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
    "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"][Number(digits[0])];

  const parity = {
    L: {
      "0": "0001101", "1": "0011001", "2": "0010011",
      "3": "0111101", "4": "0100011", "5": "0110001",
      "6": "0101111", "7": "0111011", "8": "0110111",
      "9": "0001011"
    },
    G: {
      "0": "0100111", "1": "0110011", "2": "0011011",
      "3": "0100001", "4": "0011101", "5": "0111001",
      "6": "0000101", "7": "0010001", "8": "0001001",
      "9": "0010111"
    },
    R: {
      "0": "1110010", "1": "1100110", "2": "1101100",
      "3": "1000010", "4": "1011100", "5": "1001110",
      "6": "1010000", "7": "1000100", "8": "1001000",
      "9": "1110100"
    }
  };

  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += parity[left[i - 1]][digits[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += parity.R[digits[i]];
  bits += "101";

  const width = 2;
  const bars = [...bits].map((bit, i) =>
    bit === "1"
      ? `<rect x="${i * width}" y="0" width="${width}" height="58" fill="#111"/>`
      : ""
  ).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="226" height="70" viewBox="0 0 226 70"><rect width="226" height="70" fill="#fff"/>${bars}<text x="113" y="69" font-family="Arial" font-size="10" text-anchor="middle" fill="#111">${digits}</text></svg>`;
}

function Field({ label, children }) {
  return (
    <label className="purchase-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  title
}) {
  return (
    <button
      type="button"
      className={`purchase-button ${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div
      className="purchase-modal-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section className={`purchase-modal ${wide ? "wide" : ""}`}>
        <header className="purchase-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="purchase-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </header>
        <div className="purchase-modal-content">{children}</div>
      </section>
    </div>
  );
}

function ProductModal({
  product,
  products,
  initialPurchase = null,
  onCancel,
  onSave,
  onNotice
}) {
  const existing = Boolean(product?.id);

  const [form, setForm] = useState(() => ({
    id: product?.id || createProductId(),
    name: product?.name || "",
    barcode: product?.barcode || "",
    barcodeAliases: Array.isArray(product?.barcodeAliases)
      ? [...product.barcodeAliases]
      : [],
    sku: product?.sku || "",
    category: product?.category || "",
    unit: product?.unit || "piece",
    piecesPerCarton: String(product?.piecesPerCarton || 1),
    stock: Number(product?.stock || 0),
    purchasePrice: String(product?.purchasePrice ?? ""),
    price: String(product?.price ?? ""),
    wholesalePrice: String(product?.wholesalePrice ?? ""),
    cartonPrice: String(product?.cartonPrice ?? ""),
    image: product?.image || ""
  }));

  const [cartons, setCartons] = useState(String(initialPurchase?.cartons ?? "1"));
  const [quantity, setQuantity] = useState(String(initialPurchase?.quantity ?? "1"));
  const [buyUnit, setBuyUnit] = useState(String(initialPurchase?.unitPrice ?? product?.purchasePrice ?? ""));
  const [buyCarton, setBuyCarton] = useState(
    String(initialPurchase?.cartonPrice ?? (
      Number(product?.purchasePrice || 0) * Number(product?.piecesPerCarton || 1)
    ))
  );
  const [newAlias, setNewAlias] = useState("");
  const [showAliases, setShowAliases] = useState(false);
  const [warning, setWarning] = useState("");

  const [categoryOptions, setCategoryOptions] = useState(() =>
    safeRead(CATEGORIES_KEY, [
      "Beverages",
      "Drinks",
      "Food",
      "Snacks",
      "Cleaning",
      "Tobacco",
      "Other"
    ])
  );

  const [unitOptions, setUnitOptions] = useState(() =>
    safeRead(UNITS_KEY, [
      "piece",
      "kg",
      "g",
      "liter",
      "ml",
      "meter",
      "box",
      "pack"
    ])
  );

  const update = (key, value) =>
    setForm(previous => ({ ...previous, [key]: value }));

  const allCodes = useMemo(() => {
    const set = new Set();

    products.forEach(item => {
      if (item.id === form.id) return;

      [item.barcode, ...(Array.isArray(item.barcodeAliases) ? item.barcodeAliases : [])]
        .filter(Boolean)
        .forEach(code => set.add(String(code).trim()));
    });

    return set;
  }, [products, form.id]);

  const checkCode = code => {
    const normalized = String(code || "").trim();
    return normalized && allCodes.has(normalized);
  };

  const addAlias = codeValue => {
    const code = String(codeValue ?? newAlias).trim();
    if (!code) return;

    if (code === form.barcode || form.barcodeAliases.includes(code)) {
      setWarning("This barcode is already registered for this product.");
      return;
    }

    if (checkCode(code)) {
      setWarning("This barcode belongs to another product. Choose a different barcode.");
      return;
    }

    setForm(previous => ({
      ...previous,
      barcodeAliases: [...previous.barcodeAliases, code]
    }));

    setNewAlias("");
    setWarning("");
  };

  const generateBarcode = () => {
    const code = makeEan13(allCodes);

    if (!code) {
      setWarning("Could not generate a unique barcode. Please try again.");
      return;
    }

    update("barcode", code);
    setWarning("");
  };

  const setCartonCount = value => {
    setCartons(value);

    const perCarton = Math.max(1, Number(form.piecesPerCarton) || 1);

    setQuantity(
      String(Math.max(0, Number(value) || 0) * perCarton)
    );
  };

  const setPiecesPerCarton = value => {
    update("piecesPerCarton", value);

    setQuantity(
      String(
        Math.max(0, Number(cartons) || 0) *
        Math.max(1, Number(value) || 1)
      )
    );

    if (buyCarton !== "") {
      setBuyUnit(
        String(
          Number(
            (
              Number(buyCarton) /
              Math.max(1, Number(value) || 1)
            ).toFixed(4)
          )
        )
      );
    }
  };

  const updateBuyCarton = value => {
    setBuyCarton(value);

    setBuyUnit(
      value === ""
        ? ""
        : String(
            Number(
              (
                Number(value) /
                Math.max(1, Number(form.piecesPerCarton) || 1)
              ).toFixed(4)
            )
          )
    );
  };

  const updateBuyUnit = value => {
    setBuyUnit(value);

    setBuyCarton(
      value === ""
        ? ""
        : String(
            Number(
              (
                Number(value) *
                Math.max(1, Number(form.piecesPerCarton) || 1)
              ).toFixed(4)
            )
          )
    );
  };

  const profit = (sale, cost) => {
    const s = Number(sale);
    const c = Number(cost);
    return c > 0 ? ((s - c) / c) * 100 : 0;
  };

  const handleImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setWarning("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setWarning("Image file is too large. Choose an image under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update("image", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name.trim()) {
      setWarning("Enter the product name.");
      return;
    }

    if (!form.barcode.trim()) {
      setWarning("Enter the primary barcode or generate one automatically.");
      return;
    }

    if (checkCode(form.barcode)) {
      setWarning("The primary barcode is already used by another product.");
      return;
    }

    if (/^\d{13}$/.test(form.barcode) && !isValidEan13(form.barcode)) {
      setWarning("Invalid EAN-13 number. Check the check digit.");
      return;
    }

    if (form.barcodeAliases.some(code => checkCode(code))) {
      setWarning("One of the additional barcodes belongs to another product.");
      return;
    }

    const quantityValue = Number(quantity);
    const unitCost = Number(buyUnit);

    if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
      setWarning("Enter a quantity greater than zero.");
      return;
    }

    if (!Number.isFinite(unitCost) || unitCost < 0) {
      setWarning("Check the purchase price.");
      return;
    }

    const loss =
      (Number(form.price) > 0 && Number(form.price) < unitCost) ||
      (Number(form.wholesalePrice) > 0 && Number(form.wholesalePrice) < unitCost) ||
      (
        Number(form.cartonPrice) > 0 &&
        Number(form.cartonPrice) < Number(buyCarton)
      );

    const result = {
      product: {
        ...form,
        name: form.name.trim(),
        sku: form.sku.trim() || form.id,
        barcode: form.barcode.trim(),
        barcodeAliases: [
          ...new Set(
            form.barcodeAliases
              .map(code => String(code).trim())
              .filter(Boolean)
          )
        ],
        category: form.category || "Other",
        unit: form.unit || "piece",
        piecesPerCarton: Math.max(1, Number(form.piecesPerCarton) || 1),
        purchasePrice: unitCost,
        price: Math.max(0, Number(form.price) || 0),
        wholesalePrice: Math.max(0, Number(form.wholesalePrice) || 0),
        cartonPrice: Math.max(0, Number(form.cartonPrice) || 0),
        stock: Number(form.stock || 0)
      },
      purchase: {
        ...(initialPurchase?.lineId ? { lineId: initialPurchase.lineId } : {}),
        productId: form.id,
        name: form.name.trim(),
        sku: form.sku.trim() || form.id,
        barcode: form.barcode.trim(),
        barcodeAliases: [...form.barcodeAliases],
        quantity: quantityValue,
        cartons: Math.max(0, Number(cartons) || 0),
        unit: form.unit,
        piecesPerCarton: Math.max(1, Number(form.piecesPerCarton) || 1),
        unitPrice: unitCost,
        cartonPrice: Math.max(0, Number(buyCarton) || 0),
        salePrice: Math.max(0, Number(form.price) || 0),
        wholesalePrice: Math.max(0, Number(form.wholesalePrice) || 0),
        productCartonPrice: Math.max(0, Number(form.cartonPrice) || 0),
        image: form.image || "",
        productSnapshot: { ...form }
      }
    };

    if (loss) {
      const accepted = window.confirm(
        purchaseText("Warning: A sale price is lower than the purchase price. Save despite the loss?", "Attention : un prix de vente est inférieur au prix d’achat. Enregistrer malgré la perte ?", "تحذير: سعر البيع أقل من سعر الشراء. هل تريد الحفظ رغم الخسارة؟")
      );

      if (!accepted) return;
    }

    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categoryOptions));
    localStorage.setItem(UNITS_KEY, JSON.stringify(unitOptions));

    onSave(result, existing);
  };

  const addOption = type => {
    const label = window.prompt(
      type === "category"
        ? purchaseText("Enter the new category name:", "Saisissez le nom de la nouvelle catégorie :", "أدخل اسم الفئة الجديدة:")
        : purchaseText("Enter the new unit name:", "Saisissez le nom de la nouvelle unité :", "أدخل اسم الوحدة الجديدة:")
    );

    if (!label?.trim()) return;

    const clean = label.trim();

    if (type === "category") {
      const next = [...new Set([...categoryOptions, clean])];

      setCategoryOptions(next);
      update("category", clean);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(next));
    } else {
      const next = [...new Set([...unitOptions, clean])];

      setUnitOptions(next);
      update("unit", clean);
      localStorage.setItem(UNITS_KEY, JSON.stringify(next));
    }
  };

  return (
    <Modal
      title={existing ? "Edit Product Details" : "Add Product to Purchase"}
      subtitle="Changes remain temporary until the purchase invoice is successfully closed."
      onClose={onCancel}
      wide
    >
      <div className="purchase-form-grid">
        <div className="purchase-section-title full">
          <Package size={18} /> Product Details and Barcode
        </div>

        <Field label="Product Name">
          <input
            value={form.name}
            onChange={e => update("name", e.target.value)}
            placeholder="Product name"
          />
        </Field>

        <Field label="Primary Barcode">
          <div className="purchase-input-actions">
            <input
              value={form.barcode}
              onChange={e => update("barcode", e.target.value)}
              placeholder="Scan or enter barcode"
            />
            <Button onClick={generateBarcode} title="Generate EAN-13">
              <Barcode size={17} />
            </Button>
          </div>
          <small className="purchase-muted">
            Generated barcodes are internal identifiers, not official GS1 numbers.
          </small>
        </Field>

        <div className="full">
          <button
            className="purchase-expand"
            onClick={() => setShowAliases(v => !v)}
          >
            <span>Additional Barcodes ({form.barcodeAliases.length})</span>
            {showAliases ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>

          {showAliases && (
            <div className="purchase-alias-panel">
              {form.barcodeAliases.map(code => (
                <div className="purchase-alias-row" key={code}>
                  <Barcode size={16} />
                  <span>{code}</span>
                  <button
                    onClick={() =>
                      update(
                        "barcodeAliases",
                        form.barcodeAliases.filter(item => item !== code)
                      )
                    }
                    aria-label="Remove barcode"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              <div className="purchase-input-actions">
                <input
                  value={newAlias}
                  onChange={e => setNewAlias(e.target.value)}
                  placeholder="New additional barcode"
                />
                <Button onClick={() => addAlias()}>
                  <Plus size={16} /> Add
                </Button>

                <label className="purchase-button secondary purchase-file-button">
                  <Camera size={16} /> Scan Barcode
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter scanner result here"
                    onChange={e => {
                      if (e.target.value.length >= 8) {
                        addAlias(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {warning && (
          <div className="purchase-alert warning full">
            <AlertTriangle size={17} /> {warning}
          </div>
        )}

        <div className="purchase-section-title full">
          <Truck size={18} /> Quantity and Purchase Cost
        </div>

        <Field label="Number of Cartons">
          <input
            type="number"
            min="0"
            value={cartons}
            onChange={e => setCartonCount(e.target.value)}
          />
        </Field>

        <Field label="Units per Carton">
          <input
            type="number"
            min="1"
            value={form.piecesPerCarton}
            onChange={e => setPiecesPerCarton(e.target.value)}
          />
        </Field>

        <Field label="Total Units">
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </Field>

        <Field label="Carton Purchase Price (DA)">
          <input
            type="number"
            min="0"
            value={buyCarton}
            onChange={e => updateBuyCarton(e.target.value)}
          />
        </Field>

        <Field label="Unit Purchase Price (DA)">
          <input
            type="number"
            min="0"
            value={buyUnit}
            onChange={e => updateBuyUnit(e.target.value)}
          />
        </Field>

        <div className="purchase-alert info full">
          <Info size={17} />
          Changes are temporary. Product details are saved and stock is updated when the invoice is successfully closed.
        </div>

        <div className="purchase-section-title full">
          <CircleDollarSign size={18} /> Sale Prices and Profit Margins
        </div>

        <Field label="Retail Sale Price (DA)">
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={e => update("price", e.target.value)}
          />
          <small className="purchase-muted">
            Profit: {profit(form.price, buyUnit).toFixed(2)}%
          </small>
        </Field>

        <Field label="Wholesale Sale Price (DA)">
          <input
            type="number"
            min="0"
            value={form.wholesalePrice}
            onChange={e => update("wholesalePrice", e.target.value)}
          />
          <small className="purchase-muted">
            Profit: {profit(form.wholesalePrice, buyUnit).toFixed(2)}%
          </small>
        </Field>

        <Field label="Carton Sale Price (Manual)">
          <input
            type="number"
            min="0"
            value={form.cartonPrice}
            onChange={e => update("cartonPrice", e.target.value)}
          />
          <small className="purchase-muted">
            Profit: {profit(form.cartonPrice, buyCarton).toFixed(2)}%
          </small>
        </Field>

        <div className="purchase-section-title full">
          <Package size={18} /> Category and Image
        </div>

        <Field label="Product Category">
          <div className="purchase-input-actions">
            <select
              value={form.category}
              onChange={e => update("category", e.target.value)}
            >
              <option value="">Select Category</option>
              {categoryOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Button onClick={() => addOption("category")}>
              <Plus size={16} />
            </Button>
          </div>
        </Field>

        <Field label="Unit of Measure">
          <div className="purchase-input-actions">
            <select
              value={form.unit}
              onChange={e => update("unit", e.target.value)}
            >
              {unitOptions.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Button onClick={() => addOption("unit")}>
              <Plus size={16} />
            </Button>
          </div>
        </Field>

        <Field label="Product Reference (Optional)">
          <input
            value={form.sku}
            onChange={e => update("sku", e.target.value)}
            placeholder="Reference number"
          />
        </Field>

        <div className="purchase-image-picker full">
          {form.image ? (
            <img src={form.image} alt={form.name || "Product"} />
          ) : (
            <div className="purchase-image-placeholder">
              <Images size={28} />
              <span>Product Image</span>
            </div>
          )}

          <div className="purchase-image-actions">
            <label className="purchase-button secondary">
              <Images size={16} /> Choose from Gallery
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
              />
            </label>

            <label className="purchase-button secondary">
              <Camera size={16} /> Take Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
              />
            </label>

            {form.image && (
              <Button
                variant="danger"
                onClick={() => update("image", "")}
              >
                <Trash2 size={16} /> Remove Image
              </Button>
            )}
          </div>
        </div>
      </div>

      <footer className="purchase-modal-footer">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={save}>
          <Save size={16} /> Save and Add to Invoice
        </Button>
      </footer>
    </Modal>
  );
}


function CameraScannerModal({ onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const detectedRef = useRef(onDetected);
  detectedRef.current = onDetected;

  useEffect(() => {
    let stopped = false;
    let timer = null;
    let detector = null;

    const stopCamera = () => {
      if (timer) window.clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is unavailable in this browser. Enter the barcode below.");
        return;
      }
      if (!("BarcodeDetector" in window)) {
        setCameraError("Automatic barcode detection is not supported by this browser. Enter the barcode below.");
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false
        });
        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        if (!("BarcodeDetector" in window)) return;
        detector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"]
        });
        const scan = async () => {
          if (stopped || !videoRef.current || videoRef.current.readyState < 2) {
            timer = window.setTimeout(scan, 300);
            return;
          }
          try {
            const results = await detector.detect(videoRef.current);
            const value = results?.[0]?.rawValue;
            if (value) {
              stopped = true;
              stopCamera();
              detectedRef.current?.(value);
              return;
            }
          } catch {
            // Continue scanning while the camera feed is active.
          }
          timer = window.setTimeout(scan, 250);
        };
        scan();
      } catch {
        setCameraError("Could not open the camera. Check browser camera permission or enter the barcode below.");
      }
    };

    start();
    return () => {
      stopped = true;
      stopCamera();
    };
  }, []);

  return (
    <Modal
      title="Scan Product Barcode"
      subtitle="Point the rear camera at the product barcode."
      onClose={onClose}
      wide
    >
      <div className="purchase-scanner-layout">
        <video ref={videoRef} className="purchase-scanner-video" playsInline muted />
        {cameraError && <div className="purchase-alert warning">{cameraError}</div>}
        <Field label="Enter barcode manually">
          <input
            value={manualCode}
            onChange={event => setManualCode(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && manualCode.trim()) detectedRef.current?.(manualCode.trim());
            }}
            placeholder="Barcode number"
            inputMode="numeric"
            autoFocus
          />
        </Field>
        <footer className="purchase-modal-footer">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!manualCode.trim()}
            onClick={() => detectedRef.current?.(manualCode.trim())}
          >
            <ScanBarcode size={16} /> Use Barcode
          </Button>
        </footer>
      </div>
    </Modal>
  );
}

export default function Purchases({ currentUser = null }) {
  const [products, setProducts] = useState(() => getProducts());
  const [invoices, setInvoices] = useState(() => getPurchaseInvoices());
  const [suppliers, setSuppliers] = useState(() => getPurchaseSuppliers());

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPendingVouchers, setShowPendingVouchers] = useState(false);
  const [pendingVouchers, setPendingVouchers] = useState(() => safeRead("veltro_purchase_pending_drafts_v1", []));
  const [showInfo, setShowInfo] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [lines, setLines] = useState([]);
  const [draftProductChanges, setDraftProductChanges] = useState({});
  const [payment, setPayment] = useState("0");
  const [useCredit, setUseCredit] = useState(false);
  const [creditToUse, setCreditToUse] = useState("0");
  const [dateRange, setDateRange] = useState("all");
  const [chartMode, setChartMode] = useState("7d");
  const [customSupplier, setCustomSupplier] = useState("");
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [supplierPickerSearch, setSupplierPickerSearch] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productPickerSearch, setProductPickerSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [editingPurchaseLine, setEditingPurchaseLine] = useState(null);
  const [viewPurchaseLine, setViewPurchaseLine] = useState(null);
  const [draftInvoiceNumber, setDraftInvoiceNumber] = useState("");
  const [draftCreatedBy, setDraftCreatedBy] = useState("");
  const [draftCreatedAt, setDraftCreatedAt] = useState(null);
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const total = lines.reduce(
    (sum, line) =>
      sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
    0
  );

  const currentSupplier = suppliers.find(
    item => normalize(item.name) === normalize(supplier)
  );

  const previousDebt = Number(currentSupplier?.debt || 0);
  const previousCredit = Number(currentSupplier?.credit || 0);

  const appliedCredit = useCredit
    ? Math.min(
        previousCredit,
        Math.max(0, Number(creditToUse) || 0),
        total
      )
    : 0;

  const paid = Math.max(0, Number(payment) || 0);
  const newDebt = Math.max(0, previousDebt + total - appliedCredit - paid);

  const newCredit =
    Math.max(0, previousCredit - appliedCredit) +
    Math.max(0, paid + appliedCredit - previousDebt - total);

  const filteredProducts = products.filter(product => {
    const q = normalize(productSearch);
    const codes = [product.barcode, ...(product.barcodeAliases || [])];

    return (
      !q ||
      [product.name, product.sku, product.id, ...codes]
        .some(value => normalize(value).includes(q))
    );
  });

  const filteredPickerProducts = products.filter(product => {
    const q = normalize(productPickerSearch);
    return !q || [product.name, product.sku, product.id, product.barcode, ...(product.barcodeAliases || [])]
      .some(value => normalize(value).includes(q));
  });

  const filteredPickerSuppliers = suppliers.filter(item => {
    const q = normalize(supplierPickerSearch);
    return !q || [item.name, item.phone, item.id, item.reference, item.sku]
      .some(value => normalize(value).includes(q));
  });
  const SUPPLIER_PAGE_SIZE = 10;
  const supplierPageCount = Math.max(1, Math.ceil(filteredPickerSuppliers.length / SUPPLIER_PAGE_SIZE));
  const safeSupplierPage = Math.min(supplierPage, supplierPageCount);
  const visibleSuppliers = filteredPickerSuppliers.slice((safeSupplierPage - 1) * SUPPLIER_PAGE_SIZE, safeSupplierPage * SUPPLIER_PAGE_SIZE);

  const getCurrentUserName = () => {
    const metadata = currentUser?.user_metadata || {};
    const authenticatedName = metadata.full_name || metadata.fullName || metadata.name || metadata.username || currentUser?.email;
    if (authenticatedName) return String(authenticatedName);
    const keys = ["veltro-current-user", "currentUser", "current_user", "veltro-user", "auth-user", "user"];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const value = JSON.parse(raw);
        const candidate = typeof value === "string" ? value : value?.fullName || value?.name || value?.username || value?.email || value?.user?.fullName || value?.user?.name || value?.user?.email;
        if (candidate) return String(candidate);
      } catch {
        try {
          const raw = localStorage.getItem(key);
          if (raw && raw.length < 120 && !raw.startsWith("{")) return raw;
        } catch { /* Ignore unavailable browser storage. */ }
      }
    }
    return "Current user";
  };

  const findProductByBarcode = code => products.find(item =>
    [item.barcode, ...(item.barcodeAliases || [])].some(value => String(value || "").trim() === String(code || "").trim())
  );

  const filteredInvoices = invoices.filter(invoice => {
    const q = normalize(search);

    return (
      !q ||
      [invoice.number, invoice.supplier, invoice.phone]
        .some(value => normalize(value).includes(q))
    );
  });

  const todayKey = new Date().toLocaleDateString("en-CA");

  const todayInvoices = invoices.filter(
    invoice => new Date(invoice.date).toLocaleDateString("en-CA") === todayKey
  );

  const todayTotal = todayInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  const todayPaid = todayInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.paid || 0),
    0
  );

  const chartData = useMemo(() => {
    const locale = document.documentElement.lang === "ar"
      ? "ar-DZ"
      : document.documentElement.lang === "fr"
        ? "fr-DZ"
        : "en-DZ";
    const dayCount = chartMode === "30d" ? 30 : 7;
    const dayKey = date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const grouped = new Map();

    invoices.forEach(invoice => {
      const date = new Date(invoice.date);
      if (Number.isNaN(date.getTime())) return;
      const key = dayKey(date);
      const previous = grouped.get(key) || { total: 0, paid: 0 };
      previous.total += Math.max(0, Number(invoice.total || 0));
      previous.paid += Math.max(0, Number(invoice.paid || 0));
      grouped.set(key, previous);
    });

    const today = new Date();
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (dayCount - index - 1));
      const key = dayKey(date);
      const values = grouped.get(key) || { total: 0, paid: 0 };
      return {
        key,
        label: new Intl.DateTimeFormat(locale, {
          day: "2-digit",
          month: chartMode === "30d" ? "short" : undefined
        }).format(date),
        total: values.total,
        paid: values.paid
      };
    });
  }, [invoices, chartMode]);

  const chartMax = Math.max(1, ...chartData.flatMap(item => [item.total, item.paid]));

  useEffect(() => {
    const draft = safeRead(DRAFT_KEY, null);

    if (!draft || !Array.isArray(draft.lines) || !draft.lines.length) return;

    if (!window.confirm(purchaseText("An unfinished purchase invoice was found. Would you like to restore it?", "Une facture d’achat inachevée a été trouvée. Voulez-vous la restaurer ?", "تم العثور على فاتورة شراء غير مكتملة. هل تريد استعادتها؟"))) {
      return;
    }

    setSupplier(draft.supplier || "");
    setSupplierPhone(draft.supplierPhone || "");
    setInvoiceNote(draft.invoiceNote || "");
    setLines(draft.lines || []);
    setDraftProductChanges(draft.draftProductChanges || {});
    setEditingInvoice(draft.editingInvoice || null);
    setDraftInvoiceNumber(draft.number || `PUR-${Date.now()}`);
    setDraftCreatedBy(draft.createdBy || getCurrentUserName());
    setDraftCreatedAt(draft.createdAt || nowISO());
    setShowInvoice(true);
  }, []);

  useEffect(() => {
    if (!showInvoice || showAccount) return;

    const draft = {
      supplier,
      supplierPhone,
      invoiceNote,
      lines,
      draftProductChanges,
      editingInvoice,
      number: draftInvoiceNumber || `PUR-${Date.now()}`,
      createdBy: draftCreatedBy || getCurrentUserName(),
      createdAt: draftCreatedAt || nowISO(),
      savedAt: nowISO()
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      setNotice("Could not save the draft automatically. Storage may be full.");
    }
  }, [
    showInvoice,
    showAccount,
    supplier,
    supplierPhone,
    invoiceNote,
    lines,
    draftProductChanges,
    editingInvoice,
    draftInvoiceNumber,
    draftCreatedBy,
    draftCreatedAt
  ]);

  const resetDraft = (removeSaved = true) => {
    setSupplier("");
    setSupplierPhone("");
    setInvoiceNote("");
    setLines([]);
    setDraftProductChanges({});
    setEditingInvoice(null);
    setDraftInvoiceNumber("");
    setDraftCreatedBy("");
    setEditingPurchaseLine(null);
    setPayment("0");
    setUseCredit(false);
    setCreditToUse("0");
    setProductSearch("");
    setSupplierSearch("");
    setDraftCreatedAt(null);

    if (removeSaved) localStorage.removeItem(DRAFT_KEY);
  };

  const openNewInvoice = () => {
    resetDraft(false);
    setDraftInvoiceNumber(`PUR-${Date.now()}`);
    setDraftCreatedBy(getCurrentUserName());
    setDraftCreatedAt(nowISO());
    setShowInvoice(true);
    setShowHistory(false);
    setNotice("");
  };

  const selectSupplier = name => {
    const found = suppliers.find(item => normalize(item.name) === normalize(name));
    setSupplier(name);
    setSupplierPhone(found?.phone || "");
    setSupplierSearch("");
    setShowSupplierList(false);
    setShowSupplierPicker(false);
  };

  const openProductForPurchase = product => {
    setEditingPurchaseLine(null);
    setEditProduct(product || null);
    setShowProductPicker(false);
    setProductPickerSearch("");
    setShowProductModal(true);
    setProductSearch(product?.name || productSearch);
  };

  const openNewProductWithBarcode = () => {
    const existingCodes = new Set(products.flatMap(item => [item.barcode, ...(item.barcodeAliases || [])]).filter(Boolean).map(String));
    setEditingPurchaseLine(null);
    setEditProduct({ barcode: makeEan13(existingCodes) });
    setShowProductModal(true);
  };

  const handleBarcodeLookup = codeValue => {
    const code = String(codeValue || "").trim();
    if (!code) return;
    const match = findProductByBarcode(code);
    setBarcodeInput("");
    if (match) {
      openProductForPurchase(match);
    } else {
      setProductPickerSearch(code);
      setShowProductPicker(true);
      setNotice("Barcode not found. Search for the product or create a new one.");
    }
  };

  const addProductToDraft = (result, wasExisting) => {
    const product = result.product;
    const purchase = result.purchase;

    setDraftProductChanges(previous => ({
      ...previous,
      [product.id]: {
        product: { ...product },
        isNew: !products.some(item => item.id === product.id)
      }
    }));

    setLines(previous => {
      const existingIndex = purchase.lineId
        ? previous.findIndex(line => line.lineId === purchase.lineId)
        : previous.findIndex(line => line.productId === product.id);

      const newLine = {
        ...purchase,
        lineId: purchase.lineId || makeId("LINE"),
        quantity: Number(purchase.quantity || 0),
        unitPrice: Number(purchase.unitPrice || 0),
        productSnapshot: { ...product }
      };

      if (existingIndex < 0) return [...previous, newLine];
      if (purchase.lineId) return previous.map((line, index) => index === existingIndex ? newLine : line);

      return previous.map((line, index) =>
        index === existingIndex
          ? {
              ...line,
              quantity: Number(line.quantity || 0) + newLine.quantity,
              cartons: Number(line.cartons || 0) + Number(newLine.cartons || 0),
              unitPrice: newLine.unitPrice,
              cartonPrice: newLine.cartonPrice,
              productSnapshot: { ...product }
            }
          : line
      );
    });

    setShowProductModal(false);
    setEditProduct(null);
    setEditingPurchaseLine(null);
    setProductSearch("");

    setNotice(
      wasExisting
        ? "Quantity added to the purchase draft. Permanent changes have not been saved yet."
        : "New product added to the draft. It will be saved when the invoice is closed."
    );
  };

  const updateLine = (lineId, field, value) => {
    setLines(previous => previous.map(line => {
      if (line.lineId !== lineId) return line;

      if (field === "quantity" || field === "unitPrice") {
        return {
          ...line,
          [field]: Math.max(0, Number(value) || 0)
        };
      }

      return { ...line, [field]: value };
    }));
  };

  const removeLine = lineId => setLines(previous => previous.filter(line => line.lineId !== lineId));

  const editPurchaseLine = line => {
    const product = line.productSnapshot || products.find(item => item.id === line.productId) || {
      id: line.productId, name: line.name, sku: line.sku, barcode: line.barcode,
      purchasePrice: line.unitPrice, piecesPerCarton: line.piecesPerCarton || 1
    };
    setEditingPurchaseLine(line);
    setEditProduct({ ...product });
    setShowProductModal(true);
  };

  const startEditInvoice = invoice => {
    setEditingInvoice(invoice.id);
    setDraftInvoiceNumber(invoice.number || "");
    setDraftCreatedBy(invoice.createdBy || getCurrentUserName());
    setSupplier(invoice.supplier || "");
    setSupplierPhone(invoice.phone || "");
    setInvoiceNote(invoice.note || "");

    setLines((invoice.lines || []).map(line => ({
      ...line,
      lineId: line.lineId || makeId("LINE"),
      productSnapshot:
        line.productSnapshot ||
        products.find(product => product.id === line.productId) ||
        {}
    })));

    setDraftProductChanges({});
    setPayment(String(invoice.paid || 0));
    setShowHistory(false);
    setShowInvoice(true);
    setDraftCreatedAt(invoice.date || nowISO());
  };

  const confirmAccount = () => {
    if (!supplier.trim()) {
      setNotice("Select a supplier or enter its name first.");
      setShowAccount(false);
      setShowInvoice(true);
      return;
    }

    if (!lines.length) {
      setNotice("Add at least one product.");
      setShowAccount(false);
      setShowInvoice(true);
      return;
    }

    const currentProducts = getProducts();
    const nextProducts = [...currentProducts];

    const productIndex = new Map(
      nextProducts.map((product, index) => [product.id, index])
    );

    for (const [id, change] of Object.entries(draftProductChanges)) {
      const index = productIndex.get(id);

      if (index === undefined) {
        nextProducts.push({
          ...change.product,
          stock: Number(change.product.stock || 0)
        });

        productIndex.set(id, nextProducts.length - 1);
      } else {
        const old = nextProducts[index];

        nextProducts[index] = {
          ...old,
          ...change.product,
          stock: Number(old.stock || 0)
        };
      }
    }

    const totalQuantities = new Map();

    lines.forEach(line => {
      totalQuantities.set(
        line.productId,
        (totalQuantities.get(line.productId) || 0) +
          Number(line.quantity || 0)
      );
    });

    lines.forEach(line => {
      const index = productIndex.get(line.productId);
      if (index === undefined) return;

      const product = nextProducts[index];

      nextProducts[index] = {
        ...product,
        stock:
          Number(product.stock || 0) +
          Number(totalQuantities.get(line.productId) || 0),
        purchasePrice: Number(
          line.unitPrice || product.purchasePrice || 0
        ),
        price: Number(line.salePrice || product.price || 0),
        wholesalePrice: Number(
          line.wholesalePrice || product.wholesalePrice || 0
        ),
        cartonPrice: Number(
          line.productCartonPrice || product.cartonPrice || 0
        ),
        barcode: line.barcode || product.barcode || "",
        barcodeAliases: line.barcodeAliases || product.barcodeAliases || [],
        piecesPerCarton: Number(
          line.piecesPerCarton || product.piecesPerCarton || 1
        ),
        image: line.image || product.image || ""
      };
    });

    const paidNow = Math.max(0, Number(payment) || 0);
    const creditApplied = appliedCredit;

    const existing = editingInvoice
      ? invoices.find(invoice => invoice.id === editingInvoice)
      : null;

    const timestamp = nowISO();

    const invoice = {
      id: existing?.id || makeId("PUR"),
      number: existing?.number || draftInvoiceNumber || `PUR-${Date.now()}`,
      supplier: supplier.trim(),
      phone: supplierPhone.trim(),
      date: existing?.date || timestamp,
      updatedAt: timestamp,
      closedAt: timestamp,
      openedAt: draftCreatedAt || timestamp,
      lines: lines.map(line => ({
        ...line,
        name: line.name,
        productSnapshot: { ...(line.productSnapshot || {}) },
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        lineTotal:
          Number(line.quantity || 0) * Number(line.unitPrice || 0)
      })),
      total,
      paid: paidNow,
      creditApplied,
      remaining: newDebt,
      status:
        newDebt <= 0
          ? "Paid"
          : paidNow > 0 || creditApplied > 0
            ? "Partially paid"
            : "Unpaid",
      note: invoiceNote.trim(),
      previousDebt,
      previousCredit,
      currentDebt: newDebt,
      currentCredit: newCredit,
      createdBy: existing?.createdBy || draftCreatedBy || getCurrentUserName(),
      closedBy: getCurrentUserName()
    };

    const previousSupplier = suppliers.find(
      item => normalize(item.name) === normalize(supplier)
    );

    const isUnknownSupplier = normalize(supplier) === normalize("Unknown Supplier");
    const nextSupplier = {
      id: previousSupplier?.id || makeId("SUP"),
      name: supplier.trim(),
      phone: supplierPhone.trim() || previousSupplier?.phone || "",
      debt: newDebt,
      credit: newCredit,
      updatedAt: timestamp,
      note: invoiceNote.trim()
    };

    const nextSuppliers = isUnknownSupplier
      ? suppliers
      : previousSupplier
        ? suppliers.map(item => normalize(item.name) === normalize(supplier) ? nextSupplier : item)
        : [...suppliers, nextSupplier];

    const nextInvoices = existing
      ? invoices.map(item => item.id === invoice.id ? invoice : item)
      : [invoice, ...invoices];

    if (!saveProducts(nextProducts)) {
      setNotice("Could not save products and inventory. The invoice was not finalized.");
      return;
    }

    if (
      !savePurchaseInvoices(nextInvoices) ||
      !savePurchaseSuppliers(nextSuppliers)
    ) {
      setNotice("Could not save the invoice or supplier account. Check available storage.");
      return;
    }

    setProducts(nextProducts);
    setInvoices(nextInvoices);
    setSuppliers(nextSuppliers);
    setViewInvoice(invoice);
    setShowAccount(false);
    setShowInvoice(false);
    setActiveTab("dashboard");
    resetDraft(true);
    setNotice("Purchase invoice closed. Invoice saved and inventory updated.");
  };

  const openAccount = () => {
    if (!supplier.trim()) {
      setNotice("Select a supplier before closing the invoice.");
      return;
    }

    if (!lines.length) {
      setNotice("Add products before closing the invoice.");
      return;
    }

    setPayment("0");
    setUseCredit(false);
    setCreditToUse("0");
    setShowInvoice(false);
    setShowAccount(true);
  };

  const cancelDraft = () => {
    if (!window.confirm(purchaseText("Cancel this purchase invoice and delete its draft and temporary changes?", "Annuler cette facture d’achat et supprimer son brouillon et ses modifications temporaires ?", "هل تريد إلغاء فاتورة الشراء وحذف مسودتها والتغييرات المؤقتة؟"))) {
      return;
    }

    resetDraft(true);
    setShowInvoice(false);
    setShowAccount(false);
  };

  const deleteInvoice = invoice => {
    if (
      !window.confirm(
        purchaseText(`Delete invoice ${invoice.number}? Inventory movements will not be reversed automatically.`, `Supprimer la facture ${invoice.number} ? Les mouvements de stock ne seront pas annulés automatiquement.`, `هل تريد حذف الفاتورة ${invoice.number}؟ لن يتم عكس حركات المخزون تلقائيًا.`)
      )
    ) {
      return;
    }

    const next = invoices.filter(item => item.id !== invoice.id);

    if (savePurchaseInvoices(next)) {
      setInvoices(next);
      setNotice("Invoice record deleted. Inventory was not adjusted automatically.");
    }
  };

  const printInvoice = invoice => {
    const rows = (invoice.lines || []).map(line => `
      <tr>
        <td>${escapeHtml(line.name)}</td>
        <td>${Number(line.quantity || 0)}</td>
        <td>${money(line.unitPrice)}</td>
        <td>${money(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</td>
      </tr>`).join("");

    const popup = window.open("", "_blank", "width=900,height=720");

    if (!popup) {
      setNotice("Allow pop-up windows to print this invoice.");
      return;
    }

    popup.document.write(`<!doctype html><html lang="${document.documentElement.lang || "en"}" dir="${document.documentElement.dir || "ltr"}"><head><meta charset="utf-8"><title>${escapeHtml(invoice.number)}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:28px;color:#111}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        td,th{padding:10px;border:1px solid #ddd;text-align:left}
        th{background:#f1f5f9}
        .total{font-size:20px;font-weight:bold;margin-top:22px}
      </style>
      </head><body>
      <h1>VELTRO-PRO — ${purchaseText("Purchase Invoice", "Facture d’achat", "فاتورة شراء")}</h1>
      <p>${purchaseText("Invoice Number", "Numéro de facture", "رقم الفاتورة")}: ${escapeHtml(invoice.number)}</p>
      <p>${purchaseText("Supplier", "Fournisseur", "المورد")}: ${escapeHtml(invoice.supplier)}</p>
      <p>${purchaseText("Date", "Date", "التاريخ")}: ${new Date(invoice.date).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}</p>
      <table>
        <thead><tr><th>${purchaseText("Product", "Produit", "المنتج")}</th><th>${purchaseText("Quantity", "Quantité", "الكمية")}</th><th>${purchaseText("Unit Price", "Prix unitaire", "سعر الوحدة")}</th><th>${purchaseText("Total", "Total", "الإجمالي")}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total">${purchaseText("Total", "Total", "الإجمالي")}: ${money(invoice.total)}</div>
      <p>${purchaseText("Amount Paid", "Montant payé", "المبلغ المدفوع")}: ${money(invoice.paid)}</p>
      <p>${purchaseText("Current Debt", "Dette actuelle", "الدين الحالي")}: ${money(invoice.currentDebt ?? invoice.remaining)}</p>
      <p>${purchaseText("Notes", "Notes", "ملاحظات")}: ${escapeHtml(invoice.note || "—")}</p>
      <script>window.onload=()=>window.print();<\/script>
      </body></html>`);

    popup.document.close();
  };

  const printPriceLabels = selected => {
    const list = Array.isArray(selected) ? selected : [selected];

    const labels = list.map(product => `
      <div class="label">
        <strong>${escapeHtml(product.name)}</strong>
        <div class="price">${money(product.price)}</div>
        <div class="barcode">${barcodeSvg(product.barcode)}</div>
        <small>${purchaseText("Reference", "Référence", "المرجع")}: ${escapeHtml(product.sku || product.id)}</small>
      </div>`).join("");

    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      setNotice("Allow pop-up windows to print price labels.");
      return;
    }

    popup.document.write(`<!doctype html><html lang="${document.documentElement.lang || "en"}" dir="${document.documentElement.dir || "ltr"}"><head><meta charset="utf-8"><title>${purchaseText("Product Price Labels", "Étiquettes de prix des produits", "ملصقات أسعار المنتجات")}</title>
      <style>
        @page{size:auto;margin:6mm}
        body{font-family:Arial,sans-serif;margin:0}
        .sheet{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5mm}
        .label{border:1px dashed #aaa;padding:5mm;text-align:center;break-inside:avoid}
        .label strong{display:block;font-size:14pt;margin-bottom:4mm}
        .price{font-size:23pt;font-weight:800;margin:3mm 0}
        .barcode svg{max-width:100%;height:auto}
        small{display:block;margin-top:2mm}
      </style></head><body>
      <div class="sheet">${labels}</div>
      <script>window.onload=()=>window.print();<\/script>
      </body></html>`);

    popup.document.close();
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  const [selectedLabels, setSelectedLabels] = useState([]);
  const [productListSearch, setProductListSearch] = useState("");

  const printableProducts = products.filter(product => {
    const q = normalize(productListSearch);

    return (
      !q ||
      [product.name, product.sku, product.barcode]
        .some(value => normalize(value).includes(q))
    );
  });

  const openPendingVoucher = record => {
    setSupplier(record.supplier || "");
    setSupplierPhone(record.phone || "");
    setInvoiceNote(record.note || "");
    setLines(Array.isArray(record.lines) ? record.lines.map(line => ({ ...line, lineId: line.lineId || makeId("LINE") })) : []);
    setDraftProductChanges(record.draftProductChanges || {});
    setEditingInvoice(record.editingInvoice || null);
    setDraftInvoiceNumber(record.number || `PUR-${Date.now()}`);
    setDraftCreatedBy(record.createdBy || getCurrentUserName());
    setDraftCreatedAt(record.date || nowISO());
    const next = pendingVouchers.filter(item => item.id !== record.id);
    setPendingVouchers(next);
    localStorage.setItem("veltro_purchase_pending_drafts_v1", JSON.stringify(next));
    setShowPendingVouchers(false);
    setShowInvoice(true);
  };

  const deletePendingVoucher = record => {
    const next = pendingVouchers.filter(item => item.id !== record.id);
    setPendingVouchers(next);
    localStorage.setItem("veltro_purchase_pending_drafts_v1", JSON.stringify(next));
  };

  const savePendingConfirmation = () => {
    if (!lines.length) {
      setNotice("Add at least one product before saving a pending voucher.");
      return;
    }
    const key = "veltro_purchase_pending_drafts_v1";
    const pending = safeRead(key, []);
    const record = {
      id: makeId("PENDING"),
      number: draftInvoiceNumber || `PUR-${Date.now()}`,
      status: "Pending confirmation",
      supplier: supplier || "Unknown Supplier",
      phone: supplierPhone,
      date: draftCreatedAt || nowISO(),
      createdBy: draftCreatedBy || getCurrentUserName(),
      lines: lines.map(line => ({ ...line, productSnapshot: { ...(line.productSnapshot || {}) } })),
      total,
      note: invoiceNote,
      draftProductChanges,
      editingInvoice
    };
    try {
      localStorage.setItem(key, JSON.stringify([record, ...pending]));
      localStorage.removeItem(DRAFT_KEY);
      setShowInvoice(false);
      setNotice("Purchase voucher saved as pending confirmation. Inventory has not been updated.");
    } catch {
      setNotice("Could not save the pending voucher. Check available storage.");
    }
  };

  return (
    <section className="purchase-layout" dir={document.documentElement.dir || "ltr"}>
      <header className="purchase-page-header">
        <div className="purchase-header-info">
          <span className="purchase-eyebrow">VELTRO-PRO / COMMERCE</span>
          <h1>Purchases</h1>
          <p>Manage purchase invoices, supplier accounts, and incoming inventory.</p>
        </div>
      </header>

      {notice && (
        <div className="purchase-alert info purchase-page-notice">
          <Info size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}

      {activeTab === "dashboard" && (
        <main className="purchase-dashboard">
          <section className="purchase-overview-hero">
            <div className="purchase-overview-copy">
              <span className="purchase-overview-kicker">VELTRO-PRO / PROCUREMENT</span>
              <h2>Purchase Overview</h2>
              <p>Track today's purchases, supplier payments, and purchase vouchers from one place.</p>
              <div className="purchase-live-datetime">
                <span className="purchase-live-date-icon"><CalendarDays size={16} /></span>
                <span className="purchase-live-date-text">
                  <strong>{new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(clockNow)}</strong>
                  <small>{new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(clockNow)}</small>
                </span>
              </div>
            </div>
            <div className="purchase-overview-hero-actions">
              <span className="purchase-overview-live"><i /> Live overview</span>
              <Button onClick={() => { setPendingVouchers(safeRead("veltro_purchase_pending_drafts_v1", [])); setShowPendingVouchers(true); }}><Clock3 size={16} /> Pending Vouchers ({pendingVouchers.length})</Button>
              <Button variant="primary" onClick={openNewInvoice}><Plus size={17} /> New Purchase Voucher</Button>
            </div>
            <div className="purchase-hero-orb purchase-hero-orb-one" />
            <div className="purchase-hero-orb purchase-hero-orb-two" />
          </section>

          <section className="purchase-panel purchase-daily-comparison">
            <div className="purchase-panel-heading">
              <div>
                <h2>Daily Purchase Comparison</h2>
                <p>Compare the value of purchase vouchers with payments made each day.</p>
              </div>
              <div className="purchase-segmented" role="group" aria-label="Chart period">
                <button
                  type="button"
                  className={chartMode === "7d" ? "active" : ""}
                  aria-pressed={chartMode === "7d"}
                  onClick={() => setChartMode("7d")}
                >7 Days</button>
                <button
                  type="button"
                  className={chartMode === "30d" ? "active" : ""}
                  aria-pressed={chartMode === "30d"}
                  onClick={() => setChartMode("30d")}
                >30 Days</button>
              </div>
            </div>
            <div className="purchase-chart" role="img" aria-label={`Daily purchases and payments for the last ${chartMode === "30d" ? 30 : 7} days`}>
              {chartData.map(item => (
                <div className="purchase-chart-column" key={item.key}>
                  <div className="purchase-chart-bars">
                    <div
                      className="purchase-chart-bar total"
                      style={{ height: `${Math.max(3, (item.total / chartMax) * 135)}px` }}
                      title={`Purchases: ${money(item.total)}`}
                    />
                    <div
                      className="purchase-chart-bar paid"
                      style={{ height: `${Math.max(3, (item.paid / chartMax) * 135)}px` }}
                      title={`Payments: ${money(item.paid)}`}
                    />
                  </div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
            <div className="purchase-chart-legend">
              <span><i className="total" /> Purchase value</span>
              <span><i className="paid" /> Payments made</span>
            </div>
          </section>

          <section className="purchase-metric-grid" aria-label="Purchase statistics">
            <article className="purchase-metric-card metric-purchases">
              <div className="purchase-metric-top"><span>Today's Purchases</span><span className="purchase-metric-icon"><CircleDollarSign size={19} /></span></div>
              <strong>{money(todayTotal)}</strong>
              <small><span className="purchase-metric-dot" /> Total value of today's vouchers</small>
              <div className="purchase-metric-bottom"><span>DAILY TOTAL</span><CalendarDays size={14} /></div>
            </article>
            <article className="purchase-metric-card metric-vouchers">
              <div className="purchase-metric-top"><span>Purchase Vouchers</span><span className="purchase-metric-icon"><FileText size={19} /></span></div>
              <strong>{todayInvoices.length.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}</strong>
              <small><span className="purchase-metric-dot" /> Vouchers created today</small>
              <div className="purchase-metric-bottom"><span>DAILY COUNT</span><ReceiptText size={14} /></div>
            </article>
            <article className="purchase-metric-card metric-paid">
              <div className="purchase-metric-top"><span>Payments Today</span><span className="purchase-metric-icon"><CreditCard size={19} /></span></div>
              <strong>{money(todayPaid)}</strong>
              <small><span className="purchase-metric-dot" /> Total amount paid today</small>
              <div className="purchase-metric-bottom"><span>PAID AMOUNT</span><CheckCircle2 size={14} /></div>
            </article>
            <article className="purchase-metric-card metric-debt">
              <div className="purchase-metric-top"><span>Total Supplier Debt</span><span className="purchase-metric-icon"><Truck size={19} /></span></div>
              <strong>{money(suppliers.reduce((sum, item) => sum + Math.max(0, Number(item.debt || 0)), 0))}</strong>
              <small><span className="purchase-metric-dot" /> Outstanding across suppliers</small>
              <div className="purchase-metric-bottom"><span>OUTSTANDING</span><Wallet size={14} /></div>
            </article>
          </section>

          <section className="purchase-voucher-register">
            <div className="purchase-register-header">
              <div>
                <span className="purchase-section-kicker">PURCHASE REGISTER</span>
                <h3>Today's Purchase Vouchers</h3>
                <p><strong>{todayInvoices.length}</strong> voucher(s) recorded today</p>
              </div>
              <div className="purchase-register-actions">
                <Button onClick={() => { setSearch(""); setShowHistory(true); setActiveTab("history"); }}><History size={16} /> View All Vouchers</Button>
              </div>
            </div>
            <div className="purchase-voucher-table-frame">
              <div className="purchase-table-wrap">
                <table className="purchase-table purchase-vouchers-table">
                  <thead><tr>
                    <th>Voucher Number</th><th>Voucher ID</th><th>Created By</th><th>Created At</th><th>Items</th><th>Supplier</th><th>Voucher Total</th><th>Paid Amount</th><th>Voucher Balance</th><th>Total Supplier Debt</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {[...todayInvoices].sort((a, b) => new Date(b.date) - new Date(a.date)).map(invoice => {
                      const supplierRecord = suppliers.find(item => normalize(item.name) === normalize(invoice.supplier));
                      const itemCount = (invoice.lines || []).length;
                      const voucherBalance = Math.max(0, Number(invoice.total || 0) - Number(invoice.paid || 0) - Number(invoice.creditApplied || 0));
                      const supplierDebt = Math.max(0, Number(invoice.currentDebt ?? supplierRecord?.debt ?? voucherBalance));
                      const createdAt = new Date(invoice.openedAt || invoice.date);
                      return (
                        <tr key={invoice.id}>
                          <td><strong className="purchase-voucher-number">{invoice.number || "—"}</strong></td>
                          <td><span className="purchase-voucher-id" title={invoice.id || ""}>{invoice.id || "—"}</span></td>
                          <td><span className="purchase-created-by"><span className="purchase-user-avatar">{String(invoice.createdBy || "U").slice(0,1).toUpperCase()}</span>{invoice.createdBy || invoice.employee || "Current user"}</span></td>
                          <td><span className="purchase-voucher-date">{new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { year: "numeric", month: "short", day: "2-digit" }).format(createdAt)}</span><small className="purchase-voucher-time">{new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { hour: "2-digit", minute: "2-digit" }).format(createdAt)}</small></td>
                          <td><span className="purchase-item-count">{itemCount}</span></td>
                          <td><span className="purchase-supplier-name">{invoice.supplier || "—"}</span></td>
                          <td><strong className="purchase-voucher-total">{money(invoice.total)}</strong></td>
                          <td className="purchase-paid-cell">{money(invoice.paid)}</td>
                          <td className={voucherBalance > 0 ? "purchase-debt-cell" : "purchase-paid-cell"}>{money(voucherBalance)}</td>
                          <td className={supplierDebt > 0 ? "purchase-debt-cell" : "purchase-paid-cell"}>{money(supplierDebt)}</td>
                          <td><div className="purchase-row-actions">
                            <button type="button" title="Edit" aria-label="Edit voucher" onClick={() => startEditInvoice(invoice)}><Pencil size={15} /></button>
                            <button type="button" title="Preview" aria-label="Preview voucher" onClick={() => setViewInvoice(invoice)}><Eye size={15} /></button>
                            <button type="button" title="Print" aria-label="Print voucher" onClick={() => printInvoice(invoice)}><Printer size={15} /></button>
                            <button type="button" title="Delete" aria-label="Delete voucher" className="danger" onClick={() => deleteInvoice(invoice)}><Trash2 size={15} /></button>
                          </div></td>
                        </tr>
                      );
                    })}
                    {!todayInvoices.length && <tr><td colSpan="11" className="purchase-empty-row"><div className="purchase-voucher-empty"><span><ReceiptText size={26} /></span><strong>No purchase vouchers today</strong><small>Create a new voucher to start recording today's purchases.</small><button type="button" onClick={openNewInvoice}><Plus size={15} /> Create first voucher</button></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <footer className="purchase-register-footer">
              <span><i /> Showing vouchers created today only</span>
              <span>Amounts shown in Algerian dinars (DA)</span>
            </footer>
          </section>
        </main>
      )}

      {activeTab === "products" && (
        <section className="purchase-panel">
          <div className="purchase-panel-heading">
            <div>
              <h2>Print Product Price Labels</h2>
              <p>Select one or more products to print price labels.</p>
            </div>

            <Button
              variant="primary"
              disabled={!selectedLabels.length}
              onClick={() =>
                printPriceLabels(
                  products.filter(item => selectedLabels.includes(item.id))
                )
              }
            >
              <Printer size={16} /> Print Selected ({selectedLabels.length})
            </Button>
          </div>

          <div className="purchase-filter-row">
            <input
              value={productListSearch}
              onChange={e => setProductListSearch(e.target.value)}
              placeholder="Search by product name, barcode, or reference..."
            />

            <Button
              onClick={() =>
                setSelectedLabels(printableProducts.map(item => item.id))
              }
            >
              Select All
            </Button>

            <Button onClick={() => setSelectedLabels([])}>
              Clear Selection
            </Button>
          </div>

          <div className="purchase-table-wrap">
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Product</th>
                  <th>Reference</th>
                  <th>Barcode</th>
                  <th>Sale Price</th>
                  <th>Print</th>
                </tr>
              </thead>

              <tbody>
                {printableProducts.map(product => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLabels.includes(product.id)}
                        onChange={e =>
                          setSelectedLabels(previous =>
                            e.target.checked
                              ? [...previous, product.id]
                              : previous.filter(id => id !== product.id)
                          )
                        }
                      />
                    </td>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku || product.id}</td>
                    <td>{product.barcode || "—"}</td>
                    <td>{money(product.price)}</td>
                    <td>
                      <Button onClick={() => printPriceLabels(product)}>
                        <Printer size={15} /> Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showInvoice && (
        <Modal
          title={editingInvoice ? "Edit Purchase Invoice" : "New Purchase Invoice"}
          subtitle="Purchase voucher workspace — all changes stay temporary until confirmed."
          onClose={() => setShowInvoice(false)}
          wide
        >
          <div className="purchase-voucher-page">
            <section className="purchase-voucher-meta" aria-label="Purchase voucher information">
              <div className="purchase-voucher-meta-item">
                <span><CalendarDays size={15} /> Date and time</span>
                <strong>{new Intl.DateTimeFormat(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(draftCreatedAt || clockNow))}</strong>
              </div>
              <div className="purchase-voucher-meta-item">
                <span><UserRound size={15} /> Current user</span>
                <strong>{getCurrentUserName()}</strong>
              </div>
              <div className="purchase-voucher-meta-item">
                <span><UserRound size={15} /> Created by</span>
                <strong>{draftCreatedBy || getCurrentUserName()}</strong>
              </div>
              <div className="purchase-voucher-meta-item">
                <span><Hash size={15} /> Voucher ID</span>
                <strong>{draftInvoiceNumber || "—"}</strong>
              </div>
            </section>

            <section className="purchase-voucher-section">
              <div className="purchase-voucher-section-heading">
                <div><span className="purchase-voucher-step">01</span><div><h3>Supplier</h3><p>Choose a supplier or continue with an unknown supplier.</p></div></div>
                <Button onClick={() => { setSupplierPickerSearch(""); setSupplierPage(1); setShowSupplierPicker(true); }}>
                  <ListFilter size={16} /> Choose supplier
                </Button>
              </div>
              <button type="button" className="purchase-selected-supplier" onClick={() => { setSupplierPickerSearch(""); setSupplierPage(1); setShowSupplierPicker(true); }}>
                <span className="purchase-selected-supplier-icon"><Truck size={20} /></span>
                <span className="purchase-selected-supplier-copy"><strong>{supplier ? (normalize(supplier) === normalize("Unknown Supplier") ? "Unknown supplier" : supplier) : "No supplier selected"}</strong><small>{supplierPhone || (normalize(supplier) === normalize("Unknown Supplier") ? "Supplier details are not recorded" : "Click to select a supplier")}</small></span>
                <ChevronDown size={18} />
              </button>
            </section>

            <section className="purchase-voucher-section">
              <div className="purchase-voucher-section-heading">
                <div><span className="purchase-voucher-step">02</span><div><h3>Find or add a product</h3><p>Use a barcode, camera scan, generated code, or the product catalogue.</p></div></div>
              </div>
              <div className="purchase-product-entry-row">
                <label className="purchase-product-entry-field">
                  <span>Search by barcode</span>
                  <input
                    value={barcodeInput}
                    onChange={event => setBarcodeInput(event.target.value)}
                    onKeyDown={event => { if (event.key === "Enter") handleBarcodeLookup(barcodeInput); }}
                    placeholder="Scan or type a product barcode"
                    inputMode="numeric"
                  />
                </label>
                <Button onClick={() => setShowScanner(true)}><Camera size={16} /> Scan with camera</Button>
                <Button onClick={openNewProductWithBarcode}><Barcode size={16} /> Generate code / New product</Button>
                <Button variant="primary" onClick={() => { setProductPickerSearch(""); setShowProductPicker(true); }}><Search size={16} /> Search products</Button>
              </div>
            </section>

            <section className="purchase-voucher-section purchase-voucher-lines-section">
              <div className="purchase-voucher-section-heading">
                <div><span className="purchase-voucher-step">03</span><div><h3>Purchased products</h3><p>{lines.length} product line(s) in this voucher.</p></div></div>
              </div>
              <div className="purchase-table-wrap purchase-voucher-lines-wrap">
                <table className="purchase-table purchase-voucher-lines-table">
                  <thead><tr>
                    <th>Product</th><th>Quantity (units)</th><th>Unit price</th><th>Carton price</th><th>Cartons</th><th>Units / carton</th><th>Line total</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {lines.map(line => {
                      const snapshot = line.productSnapshot || products.find(item => item.id === line.productId) || {};
                      const lineProduct = { ...snapshot, name: line.name, sku: line.sku || snapshot.sku || line.productId, barcode: line.barcode || snapshot.barcode, price: line.salePrice ?? snapshot.price };
                      return <tr key={line.lineId}>
                        <td><strong>{line.name}</strong><small>{line.sku || line.barcode || line.productId}</small></td>
                        <td><input className="purchase-cell-input" type="number" min="0" value={line.quantity} onChange={event => updateLine(line.lineId, "quantity", event.target.value)} aria-label={`Quantity for ${line.name}`} /></td>
                        <td><input className="purchase-cell-input" type="number" min="0" step="0.01" value={line.unitPrice} onChange={event => updateLine(line.lineId, "unitPrice", event.target.value)} aria-label={`Unit price for ${line.name}`} /></td>
                        <td>{money(line.cartonPrice ?? Number(line.unitPrice || 0) * Number(line.piecesPerCarton || 1))}</td>
                        <td>{Number(line.cartons || 0).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}</td>
                        <td>{Number(line.piecesPerCarton || 1).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}</td>
                        <td><strong>{money(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</strong></td>
                        <td><div className="purchase-row-actions">
                          <button type="button" title="Preview product" aria-label={`Preview ${line.name}`} onClick={() => setViewPurchaseLine({ ...line, productSnapshot: snapshot })}><Eye size={15} /></button>
                          <button type="button" title="Edit product line" aria-label={`Edit ${line.name}`} onClick={() => editPurchaseLine(line)}><Pencil size={15} /></button>
                          <button type="button" title="Print price label" aria-label={`Print price label for ${line.name}`} onClick={() => printPriceLabels(lineProduct)}><Printer size={15} /></button>
                          <button type="button" title="Delete product line" aria-label={`Delete ${line.name}`} className="danger" onClick={() => removeLine(line.lineId)}><Trash2 size={15} /></button>
                        </div></td>
                      </tr>;
                    })}
                    {!lines.length && <tr><td colSpan="8" className="purchase-empty-row">No products have been added yet. Search for a product to begin.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="purchase-voucher-total-row">
              <div><span>Voucher total</span><small>{lines.length} product line(s)</small></div>
              <strong>{money(total)}</strong>
            </div>
            <Field label="Invoice Notes (Optional)">
              <textarea rows="2" value={invoiceNote} onChange={event => setInvoiceNote(event.target.value)} placeholder="Optional notes for this purchase voucher..." />
            </Field>
            <footer className="purchase-modal-footer purchase-voucher-footer">
              <Button variant="danger" onClick={cancelDraft}><Trash2 size={16} /> Cancel voucher</Button>
              <Button onClick={() => { setShowInvoice(false); setNotice("Purchase voucher saved as a draft and can be resumed later."); }}><Save size={16} /> Save draft</Button>
              <Button onClick={savePendingConfirmation}><Clock3 size={16} /> Save as pending confirmation</Button>
              <Button variant="primary" onClick={openAccount}><CheckCircle2 size={16} /> Review and confirm</Button>
            </footer>
          </div>
        </Modal>
      )}

      {showSupplierPicker && (
        <Modal title="Choose supplier" subtitle="Search by supplier name, phone number, or supplier ID." onClose={() => setShowSupplierPicker(false)} wide>
          <div className="purchase-picker-search"><Search size={17} /><input autoFocus value={supplierPickerSearch} onChange={event => { setSupplierPickerSearch(event.target.value); setSupplierPage(1); }} placeholder="Name, phone number, or supplier ID..." /></div>
          <div className="purchase-table-wrap purchase-picker-table-wrap">
            <table className="purchase-table purchase-supplier-picker-table">
              <thead><tr><th>Supplier name</th><th>Phone number</th><th>Supplier ID / Reference</th><th>Debt</th><th>Credit</th><th>Choose</th></tr></thead>
              <tbody>
                {visibleSuppliers.map(item => <tr key={item.id || item.name}>
                  <td><strong>{item.name}</strong></td><td>{item.phone || "—"}</td><td>{item.reference || item.id || "—"}</td><td>{money(item.debt)}</td><td>{money(item.credit)}</td>
                  <td><Button variant="primary" onClick={() => selectSupplier(item.name)}><CheckCircle2 size={15} /> Select</Button></td>
                </tr>)}
                {!visibleSuppliers.length && <tr><td colSpan="6" className="purchase-empty-row">No suppliers match your search.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="purchase-picker-footer">
            <span>{filteredPickerSuppliers.length ? `Showing ${(safeSupplierPage - 1) * SUPPLIER_PAGE_SIZE + 1}–${Math.min(safeSupplierPage * SUPPLIER_PAGE_SIZE, filteredPickerSuppliers.length)} of ${filteredPickerSuppliers.length} suppliers` : "0 suppliers"}</span>
            <div><Button disabled={safeSupplierPage <= 1} onClick={() => setSupplierPage(page => Math.max(1, page - 1))}>Previous</Button><span>{safeSupplierPage} / {supplierPageCount}</span><Button disabled={safeSupplierPage >= supplierPageCount} onClick={() => setSupplierPage(page => Math.min(supplierPageCount, page + 1))}>Next</Button></div>
          </div>
          <div className="purchase-unknown-supplier">
            <div><strong>Unknown supplier</strong><small>Use this when the supplier is not recorded. No supplier account will be created.</small></div>
            <Button onClick={() => selectSupplier("Unknown Supplier")}><UserRound size={16} /> Select unknown supplier</Button>
          </div>
        </Modal>
      )}

      {showProductPicker && (
        <Modal title="Search products" subtitle="Products appear as you type. Select one to add it to this purchase voucher." onClose={() => setShowProductPicker(false)} wide>
          <div className="purchase-picker-search"><Search size={17} /><input autoFocus value={productPickerSearch} onChange={event => setProductPickerSearch(event.target.value)} placeholder="Type a product name, reference, or barcode..." /></div>
          <div className="purchase-product-picker-list">
            {!productPickerSearch.trim() && <div className="purchase-empty-row">Start typing a product name, reference, or barcode.</div>}
            {productPickerSearch.trim() && filteredPickerProducts.map(product => <button type="button" key={product.id} onClick={() => openProductForPurchase(product)}>
              <span className="purchase-product-picker-icon"><Package size={18} /></span>
              <span className="purchase-product-picker-copy"><strong>{product.name}</strong><small>Ref: {product.sku || product.id} · Barcode: {product.barcode || "—"}</small></span>
              <span className="purchase-product-picker-price">{money(product.purchasePrice)} <Plus size={16} /></span>
            </button>)}
            {productPickerSearch.trim() && !filteredPickerProducts.length && <div className="purchase-empty-row">No products found. Use “Generate code / New product” to create one.</div>}
          </div>
        </Modal>
      )}

      {showScanner && (
        <CameraScannerModal
          onClose={() => setShowScanner(false)}
          onDetected={code => { setShowScanner(false); handleBarcodeLookup(code); }}
        />
      )}

      {viewPurchaseLine && (
        <Modal title={`Product preview: ${viewPurchaseLine.name}`} subtitle="Purchase line details." onClose={() => setViewPurchaseLine(null)}>
          <div className="purchase-info-list">
            <InfoRow label="Product name" value={viewPurchaseLine.name} />
            <InfoRow label="Reference" value={viewPurchaseLine.sku || viewPurchaseLine.productId || "—"} />
            <InfoRow label="Barcode" value={viewPurchaseLine.barcode || "—"} />
            <InfoRow label="Quantity (units)" value={String(viewPurchaseLine.quantity || 0)} />
            <InfoRow label="Unit price" value={money(viewPurchaseLine.unitPrice)} />
            <InfoRow label="Carton price" value={money(viewPurchaseLine.cartonPrice ?? Number(viewPurchaseLine.unitPrice || 0) * Number(viewPurchaseLine.piecesPerCarton || 1))} />
            <InfoRow label="Cartons" value={String(viewPurchaseLine.cartons || 0)} />
            <InfoRow label="Units per carton" value={String(viewPurchaseLine.piecesPerCarton || 1)} />
            <InfoRow label="Line total" value={money(Number(viewPurchaseLine.quantity || 0) * Number(viewPurchaseLine.unitPrice || 0))} />
          </div>
          <footer className="purchase-modal-footer">
            <Button onClick={() => { const snapshot = viewPurchaseLine.productSnapshot || {}; setViewPurchaseLine(null); printPriceLabels({ ...snapshot, name: viewPurchaseLine.name, price: viewPurchaseLine.salePrice ?? snapshot.price, sku: viewPurchaseLine.sku || snapshot.sku, barcode: viewPurchaseLine.barcode || snapshot.barcode }); }}><Printer size={16} /> Print price label</Button>
            <Button variant="primary" onClick={() => setViewPurchaseLine(null)}>Close</Button>
          </footer>
        </Modal>
      )}

      {showProductModal && (
        <ProductModal
          key={editingPurchaseLine?.lineId || editProduct?.id || "new"}
          product={editProduct}
          initialPurchase={editingPurchaseLine}
          products={[
            ...products,
            ...Object.values(draftProductChanges).map(item => item.product)
          ]}
          onCancel={() => {
            setShowProductModal(false);
            setEditProduct(null);
            setEditingPurchaseLine(null);
          }}
          onNotice={setNotice}
          onSave={addProductToDraft}
        />
      )}

      {showAccount && (
        <Modal
          title="Supplier Account and Invoice Closure"
          subtitle="Review the supplier account before confirming the invoice and updating inventory."
          onClose={() => {
            setShowAccount(false);
            setShowInvoice(true);
          }}
          wide
        >
          <div className="purchase-form-grid">
            <div className="purchase-account-card">
              <span>Previous Debt</span>
              <strong>{money(previousDebt)}</strong>
            </div>

            <div className="purchase-account-card">
              <span>Previous Credit Balance</span>
              <strong className="positive">{money(previousCredit)}</strong>
            </div>

            <div className="purchase-account-card">
              <span>Invoice Total</span>
              <strong>{money(total)}</strong>
            </div>

            {previousCredit > 0 && (
              <div className="purchase-credit-choice full">
                <label>
                  <input
                    type="checkbox"
                    checked={useCredit}
                    onChange={e => setUseCredit(e.target.checked)}
                  />
                  Use Supplier Credit Balance (Optional)
                </label>

                {useCredit && (
                  <Field
                    label={`Credit Amount (up to ${money(Math.min(previousCredit, total))})`}
                  >
                    <input
                      type="number"
                      min="0"
                      max={Math.min(previousCredit, total)}
                      value={creditToUse}
                      onChange={e => setCreditToUse(e.target.value)}
                    />
                  </Field>
                )}
              </div>
            )}

            <Field label="Amount Paid Now (DA)">
              <input
                type="number"
                min="0"
                value={payment}
                onChange={e => setPayment(e.target.value)}
              />
            </Field>

            <div className="purchase-account-card">
              <span>Current Debt After Payment</span>
              <strong>{money(newDebt)}</strong>
            </div>

            <div className="purchase-account-card">
              <span>Remaining Credit Balance</span>
              <strong className="positive">{money(newCredit)}</strong>
            </div>

            <div className="purchase-alert info full">
              <Info size={17} />
              If the payment exceeds the total amount due, the difference is recorded as supplier credit. This credit will not be applied automatically to the next invoice.
            </div>

            <Field label="Account Notes (Optional)">
              <textarea
                rows="3"
                value={invoiceNote}
                onChange={e => setInvoiceNote(e.target.value)}
                placeholder="Payment notes or supplier agreement..."
              />
            </Field>
          </div>

          <footer className="purchase-modal-footer">
            <Button onClick={() => {
              setShowAccount(false);
              setShowInvoice(true);
            }}>
              Back to Invoice
            </Button>

            <Button variant="primary" onClick={confirmAccount}>
              <CheckCircle2 size={16} /> Confirm Closure and Save Account
            </Button>
          </footer>
        </Modal>
      )}

      {showPendingVouchers && (
        <Modal title="Pending purchase vouchers" subtitle="Continue a saved voucher or remove it from the pending list." onClose={() => setShowPendingVouchers(false)} wide>
          <div className="purchase-table-wrap purchase-picker-table-wrap">
            <table className="purchase-table">
              <thead><tr><th>Voucher ID</th><th>Supplier</th><th>Created by</th><th>Date and time</th><th>Total</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingVouchers.map(record => <tr key={record.id}>
                  <td><strong>{record.number || record.id}</strong></td>
                  <td>{record.supplier || "Unknown supplier"}</td>
                  <td>{record.createdBy || "—"}</td>
                  <td>{record.date ? new Date(record.date).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US") : "—"}</td>
                  <td>{money(record.total)}</td>
                  <td><div className="purchase-row-actions">
                    <button type="button" title="Resume voucher" aria-label="Resume voucher" onClick={() => openPendingVoucher(record)}><Pencil size={15} /></button>
                    <button type="button" title="Delete pending voucher" aria-label="Delete pending voucher" className="danger" onClick={() => deletePendingVoucher(record)}><Trash2 size={15} /></button>
                  </div></td>
                </tr>)}
                {!pendingVouchers.length && <tr><td colSpan="6" className="purchase-empty-row">No pending purchase vouchers.</td></tr>}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {showHistory && (
        <Modal
          title="Purchase History"
          subtitle="Search and review purchase invoices."
          onClose={() => setShowHistory(false)}
          wide
        >
          <div className="purchase-filter-row">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by invoice number or supplier..."
            />
          </div>

          <InvoiceTable
            invoices={filteredInvoices}
            onView={invoice => {
              setViewInvoice(invoice);
              setShowHistory(false);
            }}
            onInfo={setShowInfo}
            onEdit={invoice => {
              startEditInvoice(invoice);
              setShowHistory(false);
            }}
            onPrint={printInvoice}
            onDelete={deleteInvoice}
          />
        </Modal>
      )}

      {showInfo && (
        <Modal
          title={`Invoice Details: ${showInfo.number}`}
          subtitle="Invoice account summary and timestamps."
          onClose={() => setShowInfo(null)}
        >
          <div className="purchase-info-list">
            <InfoRow label="Invoice Total" value={money(showInfo.total)} />
            <InfoRow label="Amount Paid" value={money(showInfo.paid)} />
            <InfoRow
              label="Current Debt"
              value={money(showInfo.currentDebt ?? showInfo.remaining)}
            />
            <InfoRow
              label="Credit Balance"
              value={money(showInfo.currentCredit || 0)}
            />
            <InfoRow
              label="Created By"
              value={showInfo.createdBy || "—"}
            />
            <InfoRow
              label="Closed By"
              value={showInfo.closedBy || "—"}
            />
            <InfoRow
              label="Opened At"
              value={
                showInfo.openedAt
                  ? new Date(showInfo.openedAt).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")
                  : "—"
              }
            />
            <InfoRow
              label="Closed At"
              value={
                showInfo.closedAt
                  ? new Date(showInfo.closedAt).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")
                  : "—"
              }
            />
            <InfoRow label="Notes" value={showInfo.note || "—"} />
          </div>
        </Modal>
      )}

      {viewInvoice && (
        <Modal
          title={`Invoice Preview: ${viewInvoice.number}`}
          subtitle="Preview the invoice before printing."
          onClose={() => setViewInvoice(null)}
          wide
        >
          <div className="purchase-invoice-preview">
            <div className="purchase-preview-head">
              <div>
                <span>VELTRO-PRO</span>
                <h3>Purchase Invoice</h3>
              </div>

              <div>
                <strong>{viewInvoice.number}</strong>
                <small>
                  {new Date(viewInvoice.date).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}
                </small>
              </div>
            </div>

            <p>
              <strong>Supplier:</strong> {viewInvoice.supplier}
            </p>

            <div className="purchase-table-wrap">
              <table className="purchase-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {(viewInvoice.lines || []).map((line, index) => (
                    <tr key={line.lineId || index}>
                      <td>{line.name}</td>
                      <td>{line.quantity}</td>
                      <td>{money(line.unitPrice)}</td>
                      <td>
                        {money(
                          Number(line.quantity || 0) *
                          Number(line.unitPrice || 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="purchase-preview-total">
              <span>Invoice Total</span>
              <strong>{money(viewInvoice.total)}</strong>
            </div>

            <div className="purchase-preview-total">
              <span>Amount Paid</span>
              <strong>{money(viewInvoice.paid)}</strong>
            </div>

            <div className="purchase-preview-total">
              <span>Current Debt</span>
              <strong>
                {money(viewInvoice.currentDebt ?? viewInvoice.remaining)}
              </strong>
            </div>

            {viewInvoice.note && (
              <p>
                <strong>Notes:</strong> {viewInvoice.note}
              </p>
            )}
          </div>

          <footer className="purchase-modal-footer">
            <Button onClick={() => printInvoice(viewInvoice)}>
              <Printer size={16} /> Print Invoice
            </Button>

            <Button variant="primary" onClick={() => setViewInvoice(null)}>
              Close Preview
            </Button>
          </footer>
        </Modal>
      )}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="purchase-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InvoiceTable({
  invoices,
  onView,
  onInfo,
  onEdit,
  onPrint,
  onDelete
}) {
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(invoices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleInvoices = invoices.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [invoices.length]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="purchase-history-list">
      <div className="purchase-history-table-scroll">
        <div className="purchase-table-wrap">
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Items</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.number}</strong></td>
                  <td>{(invoice.lines || []).length}</td>
                  <td>{invoice.supplier}</td>
                  <td>{new Date(invoice.date).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US")}</td>
                  <td>{money(invoice.total)}</td>
                  <td>
                    <span
                      className={`purchase-status ${
                        String(invoice.status || "").toLowerCase().includes("paid")
                          ? "paid"
                          : "unpaid"
                      }`}
                    >
                      {invoice.status || "—"}
                    </span>
                  </td>
                  <td>
                    <div className="purchase-row-actions">
                      <button
                        type="button"
                        title="Preview"
                        aria-label="Preview invoice"
                        onClick={() => onView(invoice)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        aria-label="Edit invoice"
                        onClick={() => onEdit(invoice)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Print"
                        aria-label="Print invoice"
                        onClick={() => onPrint(invoice)}
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        type="button"
                        title="Details"
                        aria-label="Invoice details"
                        onClick={() => onInfo(invoice)}
                      >
                        <Info size={15} />
                      </button>
                      <button
                        type="button"
                        title="Delete invoice"
                        aria-label="Delete invoice"
                        className="danger"
                        onClick={() => onDelete(invoice)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!visibleInvoices.length && (
                <tr>
                  <td colSpan="7" className="purchase-empty-row">
                    No purchase invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="purchase-history-pagination">
        <span className="purchase-history-page-summary">
          {invoices.length
            ? `Showing ${startIndex + 1}–${Math.min(startIndex + PAGE_SIZE, invoices.length)} of ${invoices.length} invoices`
            : "Showing 0 invoices"}
        </span>

        <div className="purchase-history-page-controls" aria-label="Invoice pages">
          <button
            type="button"
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter(page =>
              page === 1 ||
              page === totalPages ||
              Math.abs(page - safePage) <= 1
            )
            .reduce((items, page, index, pages) => {
              if (index > 0 && page - pages[index - 1] > 1) {
                items.push("ellipsis-" + page);
              }
              items.push(page);
              return items;
            }, [])
            .map(page => typeof page === "number" ? (
              <button
                type="button"
                key={page}
                className={page === safePage ? "active" : ""}
                aria-current={page === safePage ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ) : (
              <span className="purchase-history-page-ellipsis" key={page}>…</span>
            ))}

          <button
            type="button"
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
