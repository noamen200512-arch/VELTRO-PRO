
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Printer,
  Pause,
  Package,
  Search,
  Barcode,
  ScanBarcode,
  Trash2,
  Minus,
  X,
  Check,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  UserRound,
  Clock,
  RefreshCw,
  LockKeyhole,
  Eye,
  AlertTriangle,
  Receipt,
  CircleDollarSign,
  ChevronDown,
  Keyboard,
  RotateCcw,
  Boxes,
} from "lucide-react";

import { getProducts, saveProducts } from "./productStore.js";

const STORAGE = {
  bills: "veltro_pos_bills",
  suspended: "veltro_pos_suspended",
  settings: "veltro_pos_settings",
};

const money = (value) =>
  new Intl.NumberFormat("fr-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0) + " DA";

const makeId = () =>
  "VT-" + Date.now().toString(36).toUpperCase() +
  "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

const readStorage = (key, fallback = []) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getProductName = (p) =>
  p?.name || p?.productName || p?.designation || p?.nom || "Unnamed product";

const getProductBarcode = (p) =>
  String(p?.barcode || p?.barCode || p?.codeBarre || p?.bar_code || p?.reference || "");

const getProductPrice = (p) =>
  Number(
    p?.salePrice ??
    p?.sellingPrice ??
    p?.priceSale ??
    p?.prixVente ??
    p?.price ??
    p?.prix ??
    0
  );

const getProductStock = (p) =>
  Number(p?.stock ?? p?.quantity ?? p?.qty ?? p?.quantite ?? p?.quantityOnHand ?? 0);

const getProductId = (p) =>
  String(p?.id ?? p?._id ?? p?.productId ?? getProductBarcode(p) ?? getProductName(p));

const getProductImage = (p) =>
  p?.image || p?.imageUrl || p?.photo || p?.picture || "";

const normalizeProduct = (p) => ({
  ...p,
  id: getProductId(p),
  name: getProductName(p),
  barcode: getProductBarcode(p),
  price: getProductPrice(p),
  stock: getProductStock(p),
  image: getProductImage(p),
});

const createBill = () => ({
  id: makeId(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "draft",
  customer: "",
  items: [],
  discount: 0,
  extraCharge: 0,
  paymentMethod: "cash",
  amountPaid: 0,
  notes: "",
});

const initialSettings = {
  storeName: "VELTRO-PRO",
  currency: "DA",
  managerPin: "1234",
};

const styles = `
:root {
  --pos-bg: #080d18;
  --pos-panel: #0e1626;
  --pos-panel-2: #121d30;
  --pos-border: rgba(143,166,202,.14);
  --pos-text: #eef4ff;
  --pos-muted: #8292ad;
  --pos-accent: #37e0c0;
  --pos-violet: #a78bfa;
  --pos-danger: #fb7185;
}
.pos-root, .pos-root * { box-sizing: border-box; }
.pos-root {
  min-height: 100%;
  width: 100%;
  padding: 22px;
  color: var(--pos-text);
  background:
    radial-gradient(ellipse at 78% 0%, rgba(76,92,180,.12), transparent 36%),
    radial-gradient(ellipse at 5% 35%, rgba(27,210,184,.055), transparent 35%),
    var(--pos-bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif;
}
.pos-root button, .pos-root input, .pos-root select, .pos-root textarea { font: inherit; }
.pos-root button { cursor: pointer; }
.pos-header {
  display:flex; justify-content:space-between; align-items:center;
  gap:16px; flex-wrap:wrap; margin-bottom:22px;
}
.pos-title { margin:0; font-size:clamp(23px,3vw,30px); font-weight:800; letter-spacing:-.7px; }
.pos-subtitle { color:var(--pos-muted); margin-top:6px; font-size:13px; }
.pos-live {
  display:inline-flex; align-items:center; gap:8px; color:var(--pos-accent);
  font-size:12px; border:1px solid rgba(55,224,192,.22);
  background:rgba(55,224,192,.06); padding:8px 12px; border-radius:30px;
}
.pos-live-dot { width:7px; height:7px; border-radius:50%; background:var(--pos-accent); }
.pos-toolbar {
  display:grid; grid-template-columns:repeat(5,minmax(0,1fr));
  gap:10px; margin-bottom:20px;
}
.pos-toolbar button {
  min-height:58px; padding:12px 10px; display:flex; justify-content:center;
  align-items:center; gap:9px; border-radius:13px; border:1px solid var(--pos-border);
  color:#dbe6f8; background:linear-gradient(145deg,#121d30,#0e1626);
  transition:.18s; font-size:13px; font-weight:700;
}
.pos-toolbar button:hover { transform:translateY(-2px); border-color:rgba(55,224,192,.45); }
.pos-toolbar button.primary {
  color:#061a18; border-color:transparent;
  background:linear-gradient(110deg,#38e2c0,#64edcb);
}
.pos-toolbar button.primary:hover { filter:brightness(1.06); }
.pos-toolbar button svg { flex-shrink:0; }
.pos-toolbar button:disabled { opacity:.4; cursor:not-allowed; transform:none; }
.pos-layout {
  display:grid; grid-template-columns:minmax(0,1.45fr) minmax(330px,.85fr);
  gap:18px; align-items:start;
}
.pos-panel {
  min-width:0; border:1px solid var(--pos-border); border-radius:17px;
  background:linear-gradient(145deg,rgba(17,27,45,.97),rgba(11,18,31,.98));
  overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,.13);
}
.pos-panel-head {
  padding:17px 18px; display:flex; justify-content:space-between; align-items:center;
  gap:12px; border-bottom:1px solid var(--pos-border);
}
.pos-panel-title { font-size:14px; font-weight:800; display:flex; align-items:center; gap:9px; }
.pos-panel-title svg { color:var(--pos-accent); }
.pos-small-muted { color:var(--pos-muted); font-size:12px; }
.pos-panel-body { padding:17px; }
.pos-search-row { display:flex; gap:9px; margin-bottom:13px; }
.pos-search-wrap { flex:1; min-width:0; position:relative; }
.pos-search-wrap svg {
  position:absolute; left:13px; top:50%; transform:translateY(-50%);
  color:var(--pos-muted); pointer-events:none;
}
.pos-input, .pos-select, .pos-textarea {
  width:100%; color:var(--pos-text); background:#09111f;
  border:1px solid rgba(143,166,202,.18); border-radius:10px;
  padding:11px 12px; outline:none; min-width:0;
}
.pos-search-wrap .pos-input { padding-left:39px; }
.pos-input:focus, .pos-select:focus, .pos-textarea:focus {
  border-color:rgba(55,224,192,.65); box-shadow:0 0 0 3px rgba(55,224,192,.07);
}
.pos-input::placeholder, .pos-textarea::placeholder { color:#64748b; }
.pos-select option { background:#101b2d; }
.pos-icon-btn {
  display:inline-flex; align-items:center; justify-content:center; gap:7px;
  padding:10px 12px; border-radius:10px; border:1px solid var(--pos-border);
  color:#dbe6f8; background:#121e31;
}
.pos-icon-btn:hover { border-color:rgba(55,224,192,.5); }
.pos-icon-btn:disabled { opacity:.35; cursor:not-allowed; }
.pos-product-list {
  display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px;
  max-height:530px; overflow-y:auto; padding:1px 3px 3px 1px;
}
.pos-product {
  display:flex; align-items:center; gap:11px; min-width:0; padding:12px;
  text-align:left; color:var(--pos-text); border:1px solid var(--pos-border);
  border-radius:12px; background:rgba(18,29,48,.65); transition:.16s;
}
.pos-product:hover { border-color:rgba(55,224,192,.55); background:rgba(24,45,59,.65); }
.pos-product:disabled { opacity:.4; cursor:not-allowed; }
.pos-product-image {
  width:47px; height:47px; flex-shrink:0; display:flex; align-items:center;
  justify-content:center; border-radius:10px; overflow:hidden;
  background:linear-gradient(145deg,#192b40,#111a2a); color:var(--pos-accent);
}
.pos-product-image img { width:100%; height:100%; object-fit:cover; }
.pos-product-info { min-width:0; flex:1; }
.pos-product-name {
  font-size:12px; font-weight:750; overflow:hidden; text-overflow:ellipsis;
  white-space:nowrap; margin-bottom:5px;
}
.pos-product-code { font-size:10px; color:var(--pos-muted); overflow:hidden; text-overflow:ellipsis; }
.pos-product-bottom { display:flex; justify-content:space-between; gap:5px; margin-top:8px; align-items:center; }
.pos-product-price { font-size:12px; font-weight:800; color:var(--pos-accent); }
.pos-stock { font-size:10px; color:var(--pos-muted); }
.pos-stock.low { color:#fbbf24; }
.pos-empty {
  padding:36px 16px; text-align:center; color:var(--pos-muted);
  border:1px dashed var(--pos-border); border-radius:12px; font-size:13px;
}
.pos-empty svg { margin-bottom:10px; opacity:.65; }
.pos-cart-header {
  display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:13px;
}
.pos-bill-id {
  display:inline-flex; align-items:center; gap:6px; border-radius:8px;
  background:rgba(55,224,192,.07); color:var(--pos-accent);
  padding:7px 9px; font-size:11px; font-weight:800;
}
.pos-cart-items { display:flex; flex-direction:column; gap:9px; max-height:350px; overflow:auto; }
.pos-cart-item {
  border:1px solid var(--pos-border); background:rgba(8,15,27,.55);
  border-radius:11px; padding:11px;
}
.pos-cart-item-top { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
.pos-cart-item-name { font-size:12px; font-weight:750; overflow-wrap:anywhere; }
.pos-cart-item-sub { font-size:10px; color:var(--pos-muted); margin-top:4px; }
.pos-cart-item-total { color:var(--pos-accent); font-size:12px; font-weight:800; white-space:nowrap; }
.pos-cart-item-bottom { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:11px; }
.pos-qty { display:flex; align-items:center; gap:10px; }
.pos-qty button {
  width:27px; height:27px; display:flex; align-items:center; justify-content:center;
  border-radius:7px; border:1px solid var(--pos-border); background:#142137; color:#e5efff;
}
.pos-qty button:hover { border-color:var(--pos-accent); }
.pos-qty input {
  width:44px; padding:5px; text-align:center; color:white; background:#09111f;
  border:1px solid var(--pos-border); border-radius:7px; outline:none;
}
.pos-delete {
  border:0; background:transparent; color:#fb7185; display:flex; padding:5px;
}
.pos-divider { border:0; border-top:1px solid var(--pos-border); margin:16px 0; }
.pos-field { margin-bottom:12px; }
.pos-label { display:block; color:#9baac2; font-size:11px; font-weight:700; margin-bottom:7px; }
.pos-two-col { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.pos-totals { display:flex; flex-direction:column; gap:10px; }
.pos-total-line { display:flex; justify-content:space-between; gap:12px; font-size:12px; color:#a7b5ca; }
.pos-total-line strong { color:#edf4ff; font-weight:700; }
.pos-total-line.grand {
  padding-top:12px; border-top:1px solid var(--pos-border); font-size:14px;
  color:#eaf3ff; font-weight:800; align-items:center;
}
.pos-total-line.grand strong { color:var(--pos-accent); font-size:22px; letter-spacing:-.5px; }
.pos-payment-title { font-size:12px; font-weight:800; margin-bottom:10px; }
.pos-payment-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.pos-payment {
  min-width:0; display:flex; flex-direction:column; align-items:center; gap:7px;
  padding:12px 5px; border:1px solid var(--pos-border); border-radius:10px;
  background:#0b1423; color:#aab8ce; font-size:10px; font-weight:700;
}
.pos-payment svg { width:19px; height:19px; }
.pos-payment.active {
  border-color:var(--pos-accent); color:var(--pos-accent);
  background:rgba(55,224,192,.075);
}
.pos-checkout {
  width:100%; border:0; border-radius:11px; margin-top:14px; padding:14px;
  display:flex; align-items:center; justify-content:center; gap:9px;
  color:#061b18; font-weight:850; background:linear-gradient(110deg,#38e2c0,#68edc9);
  box-shadow:0 6px 22px rgba(55,224,192,.1);
}
.pos-checkout:disabled { opacity:.35; cursor:not-allowed; box-shadow:none; }
.pos-secondary-action {
  width:100%; margin-top:9px; padding:11px; display:flex; justify-content:center;
  align-items:center; gap:8px; color:#cad7eb; background:transparent;
  border:1px solid var(--pos-border); border-radius:10px; font-size:12px;
}
.pos-secondary-action:hover { border-color:rgba(55,224,192,.4); }
.pos-notice {
  padding:11px 12px; border-radius:10px; font-size:12px; margin-bottom:12px;
  border:1px solid rgba(251,191,36,.22); background:rgba(251,191,36,.06); color:#fcd34d;
}
.pos-modal-backdrop {
  position:fixed; inset:0; z-index:9999; padding:18px;
  display:flex; align-items:center; justify-content:center;
  background:rgba(2,6,15,.78); backdrop-filter:blur(8px);
}
.pos-modal {
  width:min(650px,100%); max-height:85vh; overflow:auto;
  background:#0e1727; border:1px solid var(--pos-border); border-radius:16px;
  box-shadow:0 24px 90px rgba(0,0,0,.5);
}
.pos-modal-head {
  padding:17px 19px; display:flex; justify-content:space-between; align-items:center;
  gap:12px; border-bottom:1px solid var(--pos-border);
}
.pos-modal-title { font-size:15px; font-weight:850; }
.pos-modal-body { padding:18px; }
.pos-modal-row {
  width:100%; text-align:left; padding:13px; border-radius:10px;
  border:1px solid var(--pos-border); background:#101b2d; color:var(--pos-text);
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:9px;
}
.pos-modal-row:hover { border-color:rgba(55,224,192,.4); }
.pos-modal-row small { display:block; color:var(--pos-muted); margin-top:5px; font-size:11px; }
.pos-modal-row strong { color:var(--pos-accent); white-space:nowrap; }
.pos-modal-footer { padding:0 18px 18px; display:flex; justify-content:flex-end; gap:9px; }
.pos-action {
  border:1px solid var(--pos-border); border-radius:9px; padding:10px 14px;
  background:#142137; color:#e5efff; font-weight:700; font-size:12px;
}
.pos-action.confirm { border-color:transparent; color:#051b18; background:var(--pos-accent); }
.pos-action.danger { color:#fb7185; }
.pos-error { color:#fb7185; font-size:12px; margin-top:8px; }
.pos-success { color:var(--pos-accent); font-size:12px; margin-top:8px; }
.pos-receipt { display:none; }
.pos-root .pos-textarea { resize:vertical; min-height:65px; }
@media(max-width:1050px) {
  .pos-root { padding:16px; }
  .pos-layout { grid-template-columns:minmax(0,1fr); }
  .pos-cart-items { max-height:430px; }
}
@media(max-width:680px) {
  .pos-root { padding:11px; }
  .pos-header { align-items:flex-start; }
  .pos-toolbar { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .pos-toolbar button { min-height:48px; padding:9px 6px; font-size:11px; gap:6px; }
  .pos-toolbar button:last-child { grid-column:span 2; }
  .pos-panel-head { padding:14px; }
  .pos-panel-body { padding:12px; }
  .pos-product-list { grid-template-columns:1fr; max-height:380px; }
  .pos-product { padding:10px; }
  .pos-two-col { grid-template-columns:1fr 1fr; }
  .pos-total-line.grand strong { font-size:19px; }
  .pos-payment-grid { gap:6px; }
  .pos-payment { padding:10px 3px; font-size:9px; }
  .pos-modal-backdrop { padding:9px; }
}
@media print {
  body * { visibility:hidden !important; }
  .pos-print-area, .pos-print-area * { visibility:visible !important; }
  .pos-print-area {
    display:block !important; position:absolute !important; inset:0 auto auto 0 !important;
    width:100% !important; color:#000 !important; background:#fff !important;
    padding:8mm !important; font-family:Arial,sans-serif !important;
  }
  .pos-print-area table { width:100%; border-collapse:collapse; font-size:12px; }
  .pos-print-area th, .pos-print-area td { border-bottom:1px solid #ddd; padding:7px 3px; text-align:left; }
  .pos-print-area .receipt-center { text-align:center; }
  .pos-print-area .receipt-total { text-align:right; font-weight:bold; }
}
`;

export default function POS() {
  const [products, setProducts] = useState([]);
  const [bill, setBill] = useState(() => createBill());
  const [bills, setBills] = useState([]);
  const [suspendedBills, setSuspendedBills] = useState([]);
  const [query, setQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showProducts, setShowProducts] = useState(true);
  const [modal, setModal] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [pinAction, setPinAction] = useState("");
  const [pinError, setPinError] = useState("");
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [editingBillId, setEditingBillId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const barcodeRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const scanTimerRef = useRef(null);

  useEffect(() => {
    try {
      const loaded = getProducts();
      setProducts(Array.isArray(loaded) ? loaded.map(normalizeProduct) : []);
    } catch (error) {
      console.error("VELTRO POS: could not load products", error);
      setProducts([]);
    }
    setBills(readStorage(STORAGE.bills, []));
    setSuspendedBills(readStorage(STORAGE.suspended, []));
    setSettings({ ...initialSettings, ...readStorage(STORAGE.settings, {}) });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.bills, JSON.stringify(bills));
    } catch (error) {
      console.error("Could not save bills", error);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.suspended, JSON.stringify(suspendedBills));
    } catch (error) {
      console.error("Could not save suspended bills", error);
    }
  }, [suspendedBills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const notify = useCallback((text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(""), 3500);
  }, []);

  const subtotal = useMemo(
    () => bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [bill.items]
  );

  const discountValue = Math.max(0, Number(bill.discount) || 0);
  const extraChargeValue = Math.max(0, Number(bill.extraCharge) || 0);
  const total = Math.max(0, subtotal - discountValue + extraChargeValue);

  const cartQuantity = useMemo(
    () => bill.items.reduce((sum, item) => sum + item.quantity, 0),
    [bill.items]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      getProductName(p).toLowerCase().includes(q) ||
      getProductBarcode(p).toLowerCase().includes(q) ||
      String(p?.reference || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const persistProducts = useCallback((next) => {
    setProducts(next);
    try {
      saveProducts(next);
      return true;
    } catch (error) {
      console.error("Could not save product stock", error);
      notify("Could not save inventory changes.", "error");
      return false;
    }
  }, [notify]);

  const addProduct = useCallback((rawProduct, requestedQty = 1) => {
    const product = normalizeProduct(rawProduct);
    const qty = Math.max(1, Number(requestedQty) || 1);
    const existing = bill.items.find((item) => item.productId === product.id);
    const nextQty = (existing?.quantity || 0) + qty;

    if (product.stock <= 0) {
      notify("This product is out of stock.", "error");
      return;
    }
    if (nextQty > product.stock) {
      notify(`Only ${product.stock} units available.`, "error");
      return;
    }

    setBill((current) => {
      const currentItem = current.items.find((item) => item.productId === product.id);
      const items = currentItem
        ? current.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + qty }
              : item
          )
        : [
            ...current.items,
            {
              productId: product.id,
              name: product.name,
              barcode: product.barcode,
              price: product.price,
              quantity: qty,
              maxStock: product.stock,
            },
          ];
      return { ...current, updatedAt: new Date().toISOString(), items };
    });
    setQuery("");
    setBarcodeInput("");
  }, [bill.items, notify]);

  const addByBarcode = useCallback((value) => {
    const code = String(value || "").trim();
    if (!code) return;
    const found = products.find((p) => getProductBarcode(p) === code);
    if (!found) {
      notify("No product found with this barcode.", "error");
      return;
    }
    addProduct(found);
  }, [products, addProduct, notify]);

  const updateItemQuantity = (productId, value) => {
    const quantity = Math.floor(Number(value));
    const product = products.find((p) => getProductId(p) === productId);
    const max = product ? getProductStock(product) : 0;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setBill((current) => ({
        ...current,
        items: current.items.filter((item) => item.productId !== productId),
      }));
      return;
    }
    if (quantity > max) {
      notify(`Maximum available quantity is ${max}.`, "error");
      return;
    }
    setBill((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      ),
    }));
  };

  const changeItemQuantity = (productId, delta) => {
    const item = bill.items.find((entry) => entry.productId === productId);
    if (!item) return;
    updateItemQuantity(productId, item.quantity + delta);
  };

  const removeItem = (productId) => {
    setBill((current) => ({
      ...current,
      items: current.items.filter((item) => item.productId !== productId),
    }));
  };

  const resetBill = () => {
    setBill(createBill());
    setEditingBillId(null);
    setQuery("");
    setBarcodeInput("");
  };

  const handleNewBill = () => {
    if (bill.items.length > 0) {
      const confirmed = window.confirm(
        "Suspend the current bill and start a new one?"
      );
      if (!confirmed) return;
      setSuspendedBills((current) => [
        { ...bill, status: "suspended", suspendedAt: new Date().toISOString() },
        ...current,
      ]);
    }
    resetBill();
    notify("New bill created.");
  };

  const suspendCurrentBill = () => {
    if (!bill.items.length) {
      notify("Add products before suspending this bill.", "error");
      return;
    }
    setSuspendedBills((current) => [
      { ...bill, status: "suspended", suspendedAt: new Date().toISOString() },
      ...current,
    ]);
    resetBill();
    notify("Bill suspended successfully.");
  };

  const restoreSuspendedBill = (savedBill) => {
    if (bill.items.length) {
      const confirmed = window.confirm(
        "Replace the current bill? It will be suspended first."
      );
      if (!confirmed) return;
      setSuspendedBills((current) => [
        { ...bill, status: "suspended", suspendedAt: new Date().toISOString() },
        ...current,
      ]);
    }
    setSuspendedBills((current) => current.filter((item) => item.id !== savedBill.id));
    setBill({ ...savedBill, status: "draft" });
    setEditingBillId(null);
    setModal("");
    notify("Suspended bill restored.");
  };

  const requestEditBill = (savedBill) => {
    if (bill.items.length && !window.confirm("Replace the current bill?")) return;
    setBill({
      ...savedBill,
      status: "draft",
      items: (savedBill.items || []).map((item) => ({ ...item })),
    });
    setEditingBillId(savedBill.id);
    setModal("");
    setShowHistory(false);
    notify("Bill opened for editing.");
  };

  const finalizeBill = () => {
    if (!bill.items.length) {
      notify("Add at least one product before checkout.", "error");
      return;
    }

    const oldBill = editingBillId
      ? bills.find((entry) => entry.id === editingBillId)
      : null;

    const nextProducts = products.map((product) => {
      const id = getProductId(product);
      const soldNow = bill.items
        .filter((item) => item.productId === id)
        .reduce((sum, item) => sum + item.quantity, 0);
      const soldBefore = oldBill
        ? (oldBill.items || [])
            .filter((item) => item.productId === id)
            .reduce((sum, item) => sum + item.quantity, 0)
        : 0;
      const delta = oldBill ? soldBefore - soldNow : -soldNow;

      if (delta === 0) return product;

      const currentStock = getProductStock(product);
      const nextStock = currentStock + delta;
      if (nextStock < 0) return product;

      if ("stock" in product || !("quantity" in product)) {
        return { ...product, stock: nextStock };
      }
      return { ...product, quantity: nextStock };
    });

    const insufficient = bill.items.some((item) => {
      const product = nextProducts.find((p) => getProductId(p) === item.productId);
      return !product || getProductStock(product) < 0;
    });

    if (insufficient) {
      notify("Inventory check failed. Please verify product stock.", "error");
      return;
    }

    const paidBill = {
      ...bill,
      status: "paid",
      id: editingBillId || bill.id,
      subtotal,
      total,
      discount: discountValue,
      extraCharge: extraChargeValue,
      paymentMethod: bill.paymentMethod,
      amountPaid: total,
      completedAt: new Date().toISOString(),
    };

    if (!persistProducts(nextProducts)) return;

    setBills((current) => {
      const exists = current.some((entry) => entry.id === paidBill.id);
      return exists
        ? current.map((entry) => entry.id === paidBill.id ? paidBill : entry)
        : [paidBill, ...current];
    });

    setBill(paidBill);
    setModal("checkout-success");
  };

  const printBill = (billToPrint = bill) => {
    if (!billToPrint?.items?.length) {
      notify("There is no bill to print.", "error");
      return;
    }
    setBill(billToPrint);
    window.setTimeout(() => window.print(), 120);
  };

  const openCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by this browser.");
      setModal("camera");
      return;
    }
    if (!("BarcodeDetector" in window)) {
      setCameraError("Barcode scanning is not supported on this browser. Use the barcode input instead.");
      setModal("camera");
      return;
    }
    try {
      const detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      cameraStreamRef.current = stream;
      setCameraActive(true);
      setModal("camera");

      window.setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      }, 100);

      scanTimerRef.current = window.setInterval(async () => {
        const video = cameraVideoRef.current;
        if (!video || video.readyState < 2) return;
        try {
          const results = await detector.detect(video);
          if (results?.length) {
            const code = results[0].rawValue;
            closeCamera();
            addByBarcode(code);
          }
        } catch {}
      }, 450);
    } catch {
      setCameraError("Could not access the camera. Check browser permissions.");
      setCameraActive(false);
      setModal("camera");
    }
  };

  const closeCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
    setModal("");
  };

  const requestProtectedAction = (action) => {
    setPinAction(action);
    setManagerPin("");
    setPinError("");
    setModal("pin");
  };

  const verifyPin = () => {
    if (managerPin !== String(settings.managerPin || "1234")) {
      setPinError("Incorrect manager PIN.");
      return;
    }
    const action = pinAction;
    setModal("");
    setManagerPin("");
    setPinError("");
    if (action === "edit") {
      setShowHistory(true);
      setHistorySearch("");
    } else if (action === "settings") {
      setModal("settings");
    } else if (action === "clear") {
      if (window.confirm("Clear all items from this bill?")) {
        setBill((current) => ({ ...current, items: [] }));
      }
    }
  };

  const historyBills = bills.filter((saved) => {
    const q = historySearch.trim().toLowerCase();
    return !q ||
      String(saved.id).toLowerCase().includes(q) ||
      String(saved.customer || "").toLowerCase().includes(q);
  });

  const printTotal = Number(bill.total ?? total);
  const printSubtotal = Number(bill.subtotal ?? subtotal);

  return (
    <div className="pos-root">
      <style>{styles}</style>

      <div className="pos-header">
        <div>
          <h1 className="pos-title">Point of Sale</h1>
          <div className="pos-subtitle">
            Fast checkout · Smart inventory · Professional billing
          </div>
        </div>
        <div className="pos-live">
          <span className="pos-live-dot" />
          POS SYSTEM ACTIVE
        </div>
      </div>

      <div className="pos-toolbar">
        <button className="primary" onClick={handleNewBill}>
          <Plus size={17} /> New Bill
        </button>
        <button onClick={() => requestProtectedAction("edit")}>
          <Pencil size={16} /> Edit Bill
        </button>
        <button onClick={() => printBill()}>
          <Printer size={16} /> Print Bill
        </button>
        <button onClick={() => setModal("suspended")}>
          <Pause size={16} /> Suspended Bills
          {suspendedBills.length > 0 && (
            <span style={{
              background: "rgba(55,224,192,.15)",
              color: "var(--pos-accent)",
              padding: "2px 6px",
              borderRadius: 20,
              fontSize: 10
            }}>
              {suspendedBills.length}
            </span>
          )}
        </button>
        <button onClick={() => setShowProducts((value) => !value)}>
          {showProducts ? <Eye size={16} /> : <Boxes size={16} />}
          {showProducts ? "Hide Products" : "Show Products"}
        </button>
      </div>

      {message && (
        <div
          className={messageType === "error" ? "pos-notice" : "pos-success"}
          style={{
            padding: 12,
            borderRadius: 10,
            marginBottom: 14,
            background: messageType === "error"
              ? "rgba(251,113,133,.07)"
              : "rgba(55,224,192,.07)",
            border: `1px solid ${messageType === "error"
              ? "rgba(251,113,133,.22)"
              : "rgba(55,224,192,.2)"}`,
          }}
        >
          {messageType === "error" ? <AlertTriangle size={14} style={{ display: "inline", marginRight: 7 }} /> : <Check size={14} style={{ display: "inline", marginRight: 7 }} />}
          {message}
        </div>
      )}

      <div className="pos-layout">
        <section className="pos-panel">
          <div className="pos-panel-head">
            <div className="pos-panel-title">
              <Package size={18} /> Products
            </div>
            <span className="pos-small-muted">{products.length} products</span>
          </div>

          {showProducts && (
            <div className="pos-panel-body">
              <div className="pos-search-row">
                <div className="pos-search-wrap">
                  <Search size={17} />
                  <input
                    className="pos-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products or barcode..."
                    aria-label="Search products"
                  />
                </div>
                <button
                  className="pos-icon-btn"
                  onClick={openCamera}
                  title="Scan barcode with camera"
                  aria-label="Scan barcode with camera"
                >
                  <ScanBarcode size={18} />
                </button>
              </div>

              <form
                className="pos-search-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  addByBarcode(barcodeInput);
                }}
              >
                <div className="pos-search-wrap">
                  <Barcode size={17} />
                  <input
                    ref={barcodeRef}
                    className="pos-input"
                    value={barcodeInput}
                    onChange={(event) => setBarcodeInput(event.target.value)}
                    placeholder="Enter barcode and press Enter..."
                    aria-label="Barcode input"
                  />
                </div>
                <button className="pos-icon-btn" type="submit" title="Add by barcode">
                  <Plus size={18} />
                </button>
              </form>

              {products.length === 0 ? (
                <div className="pos-empty">
                  <Boxes size={29} />
                  <div>No products found.</div>
                  <div style={{ marginTop: 6 }}>
                    Add products from the product management section first.
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="pos-empty">
                  <Search size={28} />
                  <div>No matching products.</div>
                  <div style={{ marginTop: 6 }}>Try another name or barcode.</div>
                </div>
              ) : (
                <div className="pos-product-list">
                  {filteredProducts.map((product) => {
                    const stock = getProductStock(product);
                    const image = getProductImage(product);
                    return (
                      <button
                        key={getProductId(product)}
                        className="pos-product"
                        disabled={stock <= 0}
                        onClick={() => addProduct(product)}
                        title={stock <= 0 ? "Out of stock" : "Add product to bill"}
                      >
                        <div className="pos-product-image">
                          {image
                            ? <img src={image} alt="" />
                            : <Package size={22} />}
                        </div>
                        <div className="pos-product-info">
                          <div className="pos-product-name">{getProductName(product)}</div>
                          <div className="pos-product-code">
                            {getProductBarcode(product) || "No barcode"}
                          </div>
                          <div className="pos-product-bottom">
                            <span className="pos-product-price">{money(getProductPrice(product))}</span>
                            <span className={`pos-stock ${stock <= 5 ? "low" : ""}`}>
                              Stock: {stock}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="pos-panel">
          <div className="pos-panel-head">
            <div className="pos-panel-title">
              <ShoppingCart size={18} /> Current Bill
            </div>
            <span className="pos-bill-id">{bill.id}</span>
          </div>

          <div className="pos-panel-body">
            {editingBillId && (
              <div className="pos-notice">
                <Pencil size={14} style={{ display: "inline", marginRight: 6 }} />
                Editing saved bill {editingBillId}
              </div>
            )}

            <div className="pos-cart-header">
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Bill items</div>
                <div className="pos-small-muted" style={{ marginTop: 4 }}>
                  {cartQuantity} units · {bill.items.length} products
                </div>
              </div>
              <button
                className="pos-icon-btn"
                onClick={() => requestProtectedAction("clear")}
                disabled={!bill.items.length}
                title="Clear bill items"
              >
                <Trash2 size={15} /> Clear
              </button>
            </div>

            {bill.items.length === 0 ? (
              <div className="pos-empty">
                <ShoppingCart size={29} />
                <div>Your bill is empty.</div>
                <div style={{ marginTop: 6 }}>Select a product to begin.</div>
              </div>
            ) : (
              <div className="pos-cart-items">
                {bill.items.map((item) => (
                  <div className="pos-cart-item" key={item.productId}>
                    <div className="pos-cart-item-top">
                      <div style={{ minWidth: 0 }}>
                        <div className="pos-cart-item-name">{item.name}</div>
                        <div className="pos-cart-item-sub">
                          {item.barcode || "No barcode"} · {money(item.price)} / unit
                        </div>
                      </div>
                      <div className="pos-cart-item-total">
                        {money(item.price * item.quantity)}
                      </div>
                    </div>
                    <div className="pos-cart-item-bottom">
                      <div className="pos-qty">
                        <button
                          onClick={() => changeItemQuantity(item.productId, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={getProductStock(products.find((p) => getProductId(p) === item.productId))}
                          value={item.quantity}
                          onChange={(event) => {
                            if (event.target.value === "") return;
                            updateItemQuantity(item.productId, event.target.value);
                          }}
                          aria-label={`Quantity for ${item.name}`}
                        />
                        <button
                          onClick={() => changeItemQuantity(item.productId, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        className="pos-delete"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <hr className="pos-divider" />

            <div className="pos-field">
              <label className="pos-label">Customer (optional)</label>
              <input
                className="pos-input"
                value={bill.customer || ""}
                onChange={(event) =>
                  setBill((current) => ({ ...current, customer: event.target.value }))
                }
                placeholder="Walk-in customer"
              />
            </div>

            <div className="pos-two-col">
              <div className="pos-field">
                <label className="pos-label">Discount (DA)</label>
                <input
                  className="pos-input"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={bill.discount}
                  onChange={(event) =>
                    setBill((current) => ({
                      ...current,
                      discount: Math.min(subtotal, Math.max(0, Number(event.target.value) || 0)),
                    }))
                  }
                />
              </div>
              <div className="pos-field">
                <label className="pos-label">Extra charge (DA)</label>
                <input
                  className="pos-input"
                  type="number"
                  min="0"
                  value={bill.extraCharge}
                  onChange={(event) =>
                    setBill((current) => ({
                      ...current,
                      extraCharge: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </div>
            </div>

            <div className="pos-totals">
              <div className="pos-total-line">
                <span>Subtotal</span><strong>{money(subtotal)}</strong>
              </div>
              <div className="pos-total-line">
                <span>Discount</span><strong>- {money(discountValue)}</strong>
              </div>
              <div className="pos-total-line">
                <span>Extra charge</span><strong>+ {money(extraChargeValue)}</strong>
              </div>
              <div className="pos-total-line grand">
                <span>Total to pay</span><strong>{money(total)}</strong>
              </div>
            </div>

            <hr className="pos-divider" />

            <div className="pos-payment-title">Payment method</div>
            <div className="pos-payment-grid">
              <button
                className={`pos-payment ${bill.paymentMethod === "cash" ? "active" : ""}`}
                onClick={() => setBill((current) => ({ ...current, paymentMethod: "cash" }))}
              >
                <Banknote /> Cash
              </button>
              <button
                className={`pos-payment ${bill.paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setBill((current) => ({ ...current, paymentMethod: "card" }))}
              >
                <CreditCard /> Card
              </button>
              <button
                className={`pos-payment ${bill.paymentMethod === "mobile" ? "active" : ""}`}
                onClick={() => setBill((current) => ({ ...current, paymentMethod: "mobile" }))}
              >
                <Smartphone /> Mobile
              </button>
            </div>

            <button
              className="pos-checkout"
              onClick={finalizeBill}
              disabled={!bill.items.length}
            >
              <Check size={18} />
              {editingBillId ? "Save Bill Changes" : "Complete Payment"}
            </button>

            <button
              className="pos-secondary-action"
              onClick={suspendCurrentBill}
              disabled={!bill.items.length}
            >
              <Pause size={15} /> Suspend Current Bill
            </button>

            <button
              className="pos-secondary-action"
              onClick={() => requestProtectedAction("settings")}
            >
              <LockKeyhole size={15} /> Manager Settings
            </button>
          </div>
        </section>
      </div>

      <div className="pos-receipt pos-print-area">
        <div className="receipt-center">
          <h2>{settings.storeName || "VELTRO-PRO"}</h2>
          <p>Sales receipt</p>
          <p>Bill: {bill.id}</p>
          <p>{new Date(bill.completedAt || bill.createdAt || Date.now()).toLocaleString()}</p>
          {bill.customer && <p>Customer: {bill.customer}</p>}
        </div>
        <hr />
        <table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={`${item.productId}-${index}`}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{money(item.price)}</td>
                <td>{money(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="receipt-total">Subtotal: {money(printSubtotal)}</p>
        <p className="receipt-total">Discount: {money(bill.discount || 0)}</p>
        <p className="receipt-total">Extra charge: {money(bill.extraCharge || 0)}</p>
        <h3 className="receipt-total">TOTAL: {money(printTotal)}</h3>
        <p>Payment: {String(bill.paymentMethod || "cash").toUpperCase()}</p>
        <p className="receipt-center">Thank you for your visit!</p>
      </div>

      {modal === "suspended" && (
        <div className="pos-modal-backdrop" onClick={() => setModal("")}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title">
                <Pause size={17} style={{ display: "inline", marginRight: 8, color: "var(--pos-accent)" }} />
                Suspended Bills
              </div>
              <button className="pos-icon-btn" onClick={() => setModal("")}><X size={17} /></button>
            </div>
            <div className="pos-modal-body">
              {suspendedBills.length === 0 ? (
                <div className="pos-empty">There are no suspended bills.</div>
              ) : suspendedBills.map((saved) => (
                <button className="pos-modal-row" key={saved.id} onClick={() => restoreSuspendedBill(saved)}>
                  <span>
                    <b>{saved.id}</b>
                    <small>{saved.items?.length || 0} products · {new Date(saved.suspendedAt || saved.createdAt).toLocaleString()}</small>
                  </span>
                  <strong>{money((saved.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0) - Number(saved.discount || 0) + Number(saved.extraCharge || 0))}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="pos-modal-backdrop" onClick={() => setShowHistory(false)}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><Receipt size={17} style={{ display: "inline", marginRight: 8, color: "var(--pos-accent)" }} />Bill History</div>
              <button className="pos-icon-btn" onClick={() => setShowHistory(false)}><X size={17} /></button>
            </div>
            <div className="pos-modal-body">
              <div className="pos-search-wrap" style={{ marginBottom: 14 }}>
                <Search size={16} />
                <input className="pos-input" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Search by bill number or customer..." />
              </div>
              {historyBills.length === 0 ? (
                <div className="pos-empty">No saved bills found.</div>
              ) : historyBills.map((saved) => (
                <div className="pos-modal-row" key={saved.id}>
                  <span>
                    <b>{saved.id}</b>
                    <small>{saved.customer || "Walk-in customer"} · {new Date(saved.completedAt || saved.createdAt).toLocaleString()}</small>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{money(saved.total ?? (saved.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0))}</strong>
                    <button className="pos-action" onClick={() => requestEditBill(saved)}>Edit</button>
                    <button className="pos-action" onClick={() => printBill(saved)}>Print</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal === "pin" && (
        <div className="pos-modal-backdrop" onClick={() => setModal("")}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><LockKeyhole size={17} style={{ display: "inline", marginRight: 8, color: "var(--pos-accent)" }} />Manager Authorization</div>
              <button className="pos-icon-btn" onClick={() => setModal("")}><X size={17} /></button>
            </div>
            <div className="pos-modal-body">
              <p className="pos-small-muted" style={{ marginTop: 0 }}>Enter your manager PIN to continue.</p>
              <input
                className="pos-input"
                type="password"
                inputMode="numeric"
                autoFocus
                value={managerPin}
                onChange={(event) => setManagerPin(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && verifyPin()}
                placeholder="Manager PIN"
              />
              {pinError && <div className="pos-error">{pinError}</div>}
              <div className="pos-small-muted" style={{ marginTop: 9 }}>Default PIN: 1234. Change it in Manager Settings.</div>
            </div>
            <div className="pos-modal-footer">
              <button className="pos-action" onClick={() => setModal("")}>Cancel</button>
              <button className="pos-action confirm" onClick={verifyPin}>Authorize</button>
            </div>
          </div>
        </div>
      )}

      {modal === "settings" && (
        <div className="pos-modal-backdrop" onClick={() => setModal("")}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><LockKeyhole size={17} style={{ display: "inline", marginRight: 8, color: "var(--pos-accent)" }} />Manager Settings</div>
              <button className="pos-icon-btn" onClick={() => setModal("")}><X size={17} /></button>
            </div>
            <div className="pos-modal-body">
              <div className="pos-field">
                <label className="pos-label">Store name on receipt</label>
                <input className="pos-input" value={settings.storeName || ""} onChange={(event) => setSettings((current) => ({ ...current, storeName: event.target.value }))} />
              </div>
              <div className="pos-field">
                <label className="pos-label">New manager PIN</label>
                <input className="pos-input" type="password" inputMode="numeric" value={settings.managerPin || ""} onChange={(event) => setSettings((current) => ({ ...current, managerPin: event.target.value }))} />
              </div>
              <div className="pos-notice">Keep your manager PIN private. The default PIN is 1234 until you change it.</div>
            </div>
            <div className="pos-modal-footer">
              <button className="pos-action" onClick={() => setModal("")}>Close</button>
              <button className="pos-action confirm" onClick={() => { setModal(""); notify("Settings saved."); }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {modal === "camera" && (
        <div className="pos-modal-backdrop" onClick={closeCamera}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title"><ScanBarcode size={17} style={{ display: "inline", marginRight: 8, color: "var(--pos-accent)" }} />Barcode Scanner</div>
              <button className="pos-icon-btn" onClick={closeCamera}><X size={17} /></button>
            </div>
            <div className="pos-modal-body">
              {cameraError ? (
                <div className="pos-notice">{cameraError}</div>
              ) : (
                <>
                  <p className="pos-small-muted">Point your rear camera at a product barcode.</p>
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      maxHeight: 360,
                      borderRadius: 12,
                      background: "#030712",
                      objectFit: "cover",
                    }}
                  />
                  {!cameraActive && <div className="pos-small-muted">Starting camera...</div>}
                </>
              )}
            </div>
            <div className="pos-modal-footer">
              <button className="pos-action" onClick={closeCamera}>Close Scanner</button>
            </div>
          </div>
        </div>
      )}

      {modal === "checkout-success" && (
        <div className="pos-modal-backdrop" onClick={() => setModal("")}>
          <div className="pos-modal" onClick={(event) => event.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-title" style={{ color: "var(--pos-accent)" }}><Check size={18} style={{ display: "inline", marginRight: 8 }} />Payment Completed</div>
              <button className="pos-icon-btn" onClick={() => setModal("")}><X size={17} /></button>
            </div>
            <div className="pos-modal-body" style={{ textAlign: "center" }}>
              <div style={{ width: 62, height: 62, borderRadius: "50%", margin: "4px auto 15px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(55,224,192,.1)", color: "var(--pos-accent)" }}>
                <Check size={30} />
              </div>
              <div style={{ fontSize: 25, fontWeight: 850, color: "var(--pos-accent)" }}>{money(total)}</div>
              <div className="pos-small-muted" style={{ marginTop: 7 }}>Bill {bill.id} has been saved.</div>
            </div>
            <div className="pos-modal-footer">
              <button className="pos-action" onClick={() => { setModal(""); printBill(bill); }}><Printer size={14} style={{ display: "inline", marginRight: 5 }} />Print Receipt</button>
              <button className="pos-action confirm" onClick={() => { setModal(""); resetBill(); }}>New Bill</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
