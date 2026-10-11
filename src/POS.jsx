
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Printer,
  PauseCircle,
  Package,
  Search,
  ScanBarcode,
  Trash2,
  Minus,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Check,
  ShoppingCart,
  RotateCcw,
  LockKeyhole,
  Clock,
  UserRound,
  Percent,
  ChevronDown,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { getProducts, saveProducts } from "./productStore.js";

const STORAGE = {
  bills: "veltro_pos_bills_v2",
  suspended: "veltro_pos_suspended_v2",
  settings: "veltro_pos_settings_v2",
};

const initialSettings = {
  currency: "DA",
  taxRate: 0,
  managerPin: "1234",
};

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function money(value) {
  return `${Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 2,
  })} DA`;
}

function productId(product) {
  const id = product?.id ?? product?._id ?? product?.productId;
  if (id !== undefined && id !== null && String(id)) return String(id);

  const barcode = product?.barcode ?? product?.barCode ?? product?.codeBar;
  if (barcode) return String(barcode);

  return String(product?.name ?? product?.designation ?? "");
}

function productName(product) {
  return String(
    product?.name ??
      product?.designation ??
      product?.productName ??
      product?.label ??
      "Unnamed product"
  );
}

function productBarcode(product) {
  return String(
    product?.barcode ?? product?.barCode ?? product?.codeBar ?? product?.ean ?? ""
  );
}

function productPrice(product) {
  return Number(
    product?.salePrice ??
      product?.sellingPrice ??
      product?.sale_price ??
      product?.price ??
      product?.prixVente ??
      0
  );
}

function productStock(product) {
  const value =
    product?.stock ??
    product?.quantity ??
    product?.qty ??
    product?.quantite ??
    product?.stockQuantity;

  return value === undefined || value === null || value === ""
    ? null
    : Number(value);
}

function productImage(product) {
  return (
    product?.image ??
    product?.imageUrl ??
    product?.photo ??
    product?.picture ??
    ""
  );
}

function makeId() {
  return `BILL-${Date.now().toString().slice(-8)}`;
}

function normalizeProducts(list) {
  return (Array.isArray(list) ? list : []).map((product) => ({
    ...product,
    _posId: productId(product),
    _posName: productName(product),
    _posBarcode: productBarcode(product),
    _posPrice: productPrice(product),
    _posStock: productStock(product),
    _posImage: productImage(product),
  }));
}

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled = false,
  title,
  className = "",
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`pos-button pos-button-${variant} ${className}`}
    >
      {children}
    </button>
  );
}

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [customer, setCustomer] = useState("");
  const [discount, setDiscount] = useState("0");
  const [extraCharge, setExtraCharge] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [settings, setSettings] = useState(initialSettings);
  const [bills, setBills] = useState([]);
  const [suspendedBills, setSuspendedBills] = useState([]);
  const [editingBillId, setEditingBillId] = useState(null);
  const [activeModal, setActiveModal] = useState("");
  const [notice, setNotice] = useState("");
  const [managerPin, setManagerPin] = useState("");
  const [pinAction, setPinAction] = useState("");
  const [showProducts, setShowProducts] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [productFilter, setProductFilter] = useState("All");
  const barcodeRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    setProducts(normalizeProducts(getProducts()));
    setBills(readStorage(STORAGE.bills, []));
    setSuspendedBills(readStorage(STORAGE.suspended, []));
    setSettings({
      ...initialSettings,
      ...readStorage(STORAGE.settings, {}),
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE.bills, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE.suspended, JSON.stringify(suspendedBills));
  }, [suspendedBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(timeout);
  }, [notice]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const discountValue = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const extraValue = Math.max(0, Number(extraCharge) || 0);

  const tax = Math.max(
    0,
    ((subtotal - discountValue) * (Number(settings.taxRate) || 0)) / 100
  );

  const total = Math.max(
    0,
    subtotal - discountValue + extraValue + tax
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product._posName.toLowerCase().includes(query) ||
        product._posBarcode.toLowerCase().includes(query) ||
        String(product.reference ?? product.sku ?? "")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        productFilter === "All" ||
        (productFilter === "Available" &&
          (product._posStock === null || product._posStock > 0)) ||
        (productFilter === "Low stock" &&
          product._posStock !== null &&
          product._posStock > 0 &&
          product._posStock <= 5) ||
        (productFilter === "Out of stock" && product._posStock === 0);

      return matchesSearch && matchesFilter;
    });
  }, [products, search, productFilter]);

  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  function reloadProducts() {
    setProducts(normalizeProducts(getProducts()));
  }

  function addProduct(product) {
    const current = products.find(
      (item) => item._posId === product._posId
    );

    if (!current) {
      setNotice("Product not found in inventory.");
      return;
    }

    if (current._posStock !== null && current._posStock <= 0) {
      setNotice("This product is out of stock.");
      return;
    }

    setCart((previous) => {
      const existing = previous.find(
        (item) => item.id === current._posId
      );

      if (existing) {
        if (
          current._posStock !== null &&
          existing.quantity >= current._posStock
        ) {
          setNotice("Available stock limit reached.");
          return previous;
        }

        return previous.map((item) =>
          item.id === current._posId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          id: current._posId,
          name: current._posName,
          barcode: current._posBarcode,
          price: current._posPrice,
          quantity: 1,
          stock: current._posStock,
          image: current._posImage,
        },
      ];
    });

    setNotice(`${current._posName} added to bill.`);
  }

  function addByBarcode(event) {
    event?.preventDefault();

    const code = barcodeInput.trim();
    if (!code) return;

    const found = products.find(
      (product) =>
        product._posBarcode === code || product._posId === code
    );

    if (!found) {
      setNotice("No product found for this barcode.");
      return;
    }

    addProduct(found);
    setBarcodeInput("");
    barcodeRef.current?.focus();
  }

  function changeQuantity(id, delta) {
    setCart((previous) =>
      previous
        .map((item) => {
          if (item.id !== id) return item;

          const nextQuantity = item.quantity + delta;

          if (nextQuantity < 1) return item;

          if (item.stock !== null && nextQuantity > item.stock) {
            setNotice("Available stock limit reached.");
            return item;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function updateItemPrice(id, value) {
    const price = Math.max(0, Number(value) || 0);
    setCart((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, price } : item
      )
    );
  }

  function removeItem(id) {
    setCart((previous) => previous.filter((item) => item.id !== id));
  }

  function resetBill() {
    setCart([]);
    setCustomer("");
    setDiscount("0");
    setExtraCharge("0");
    setPaymentMethod("Cash");
    setEditingBillId(null);
    setCheckoutDone(false);
    setSelectedBill(null);
    setNotice("New bill created.");
    searchRef.current?.focus();
  }

  function getBillData(status = "Completed") {
    return {
      id: editingBillId || makeId(),
      customer: customer.trim() || "Walk-in customer",
      items: cart.map((item) => ({ ...item })),
      subtotal,
      discount: discountValue,
      extraCharge: extraValue,
      tax,
      total,
      paymentMethod,
      status,
      createdAt: new Date().toISOString(),
    };
  }

  function suspendBill() {
    if (!cart.length) {
      setNotice("Add products before suspending the bill.");
      return;
    }

    const bill = getBillData("Suspended");

    setSuspendedBills((previous) => [
      bill,
      ...previous.filter((item) => item.id !== bill.id),
    ]);

    resetBill();
    setNotice("Bill suspended successfully.");
  }

  function openSuspendedBill(bill) {
    if (cart.length) {
      const shouldContinue = window.confirm(
        "The current bill contains items. Replace it with the selected bill?"
      );
      if (!shouldContinue) return;
    }

    setCart(bill.items.map((item) => ({ ...item })));
    setCustomer(bill.customer === "Walk-in customer" ? "" : bill.customer);
    setDiscount(String(bill.discount || 0));
    setExtraCharge(String(bill.extraCharge || 0));
    setPaymentMethod(bill.paymentMethod || "Cash");
    setEditingBillId(bill.id);
    setSuspendedBills((previous) =>
      previous.filter((item) => item.id !== bill.id)
    );
    setActiveModal("");
    setNotice("Suspended bill restored.");
  }

  function requestEditBill(bill) {
    if (cart.length) {
      const shouldContinue = window.confirm(
        "Replace the current bill with the selected bill?"
      );
      if (!shouldContinue) return;
    }

    setCart(bill.items.map((item) => ({ ...item })));
    setCustomer(bill.customer === "Walk-in customer" ? "" : bill.customer);
    setDiscount(String(bill.discount || 0));
    setExtraCharge(String(bill.extraCharge || 0));
    setPaymentMethod(bill.paymentMethod || "Cash");
    setEditingBillId(bill.id);
    setActiveModal("");
    setNotice(`Editing ${bill.id}.`);
  }

  function checkout() {
    if (!cart.length) {
      setNotice("Add at least one product before checkout.");
      return;
    }

    const inventory = getProducts();
    const normalized = normalizeProducts(inventory);

    // Check all stock quantities before changing inventory.
    for (const item of cart) {
      const product = normalized.find((entry) => entry._posId === item.id);
      if (!product) {
        setNotice(`Product "${item.name}" no longer exists in inventory.`);
        return;
      }

      const stock = product._posStock;

      if (stock !== null) {
        const oldQuantity = editingBillId
          ? (bills.find((bill) => bill.id === editingBillId)?.items || [])
              .filter((oldItem) => oldItem.id === item.id)
              .reduce((sum, oldItem) => sum + oldItem.quantity, 0)
          : 0;

        const available = stock + oldQuantity;

        if (item.quantity > available) {
          setNotice(`Insufficient stock for ${item.name}. Available: ${available}.`);
          return;
        }
      }
    }

    // If editing an already completed bill, restore its previous stock first.
    let nextInventory = inventory.map((product) => ({ ...product }));

    if (editingBillId) {
      const oldBill = bills.find((bill) => bill.id === editingBillId);

      if (oldBill) {
        nextInventory = nextInventory.map((product) => {
          const id = productId(product);
          const oldQuantity = oldBill.items
            .filter((item) => item.id === id)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (!oldQuantity) return product;

          const stockKey = ["stock", "quantity", "qty", "quantite", "stockQuantity"]
            .find((key) => product[key] !== undefined && product[key] !== null);

          if (!stockKey) return product;

          return {
            ...product,
            [stockKey]: Number(product[stockKey]) + oldQuantity,
          };
        });
      }
    }

    // Deduct the new bill quantities.
    for (const item of cart) {
      nextInventory = nextInventory.map((product) => {
        if (productId(product) !== item.id) return product;

        const stockKey = ["stock", "quantity", "qty", "quantite", "stockQuantity"]
          .find((key) => product[key] !== undefined && product[key] !== null);

        if (!stockKey) return product;

        return {
          ...product,
          [stockKey]: Number(product[stockKey]) - item.quantity,
        };
      });
    }

    try {
      saveProducts(nextInventory);
      setProducts(normalizeProducts(nextInventory));
    } catch {
      setNotice("Could not update inventory. Please check productStore.js.");
      return;
    }

    const completedBill = getBillData("Completed");

    setBills((previous) => [
      completedBill,
      ...previous.filter((bill) => bill.id !== completedBill.id),
    ]);

    setSuspendedBills((previous) =>
      previous.filter((bill) => bill.id !== completedBill.id)
    );

    setSelectedBill(completedBill);
    setCheckoutDone(true);
    setActiveModal("success");
    setEditingBillId(null);
    setNotice("Sale completed successfully.");
  }

  function printBill(bill = getBillData("Completed")) {
    setSelectedBill(bill);
    setActiveModal("print");
    setTimeout(() => window.print(), 250);
  }

  function requireManager(action) {
    setPinAction(action);
    setManagerPin("");
    setActiveModal("pin");
  }

  function confirmManagerPin(event) {
    event.preventDefault();

    if (managerPin !== String(settings.managerPin || "1234")) {
      setNotice("Incorrect manager PIN.");
      return;
    }

    const action = pinAction;
    setActiveModal("");

    if (action === "edit") {
      setActiveModal("history");
    } else if (action === "settings") {
      setActiveModal("settings");
    } else if (action === "price") {
      setNotice("Manager access granted. You can now edit item prices.");
    }
  }

  function clearCompletedBill() {
    setActiveModal("");
    resetBill();
  }

  return (
    <div className="pos-page">
      <style>{`
        .pos-page {
          --pos-bg: #0b0f19;
          --pos-panel: #111725;
          --pos-panel-2: #151d2c;
          --pos-border: #273044;
          --pos-text: #edf2fa;
          --pos-muted: #8995ab;
          --pos-cyan: #36d9c3;
          --pos-violet: #9585ff;
          color: var(--pos-text);
          width: 100%;
          min-width: 0;
          font-family: inherit;
        }
        .pos-page * { box-sizing: border-box; }
        .pos-page button, .pos-page input, .pos-page select { font: inherit; }
        .pos-page button { cursor: pointer; }
        .pos-page button:disabled { opacity: .45; cursor: not-allowed; }
        .pos-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 14px; margin-bottom: 18px;
        }
        .pos-page-title { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pos-title-icon {
          width: 44px; height: 44px; border-radius: 14px;
          display: grid; place-items: center; color: var(--pos-cyan);
          background: rgba(54,217,195,.10); border: 1px solid rgba(54,217,195,.22);
          flex-shrink: 0;
        }
        .pos-page-title h2 { font-size: 21px; margin: 0 0 5px; font-weight: 750; }
        .pos-page-title p { color: var(--pos-muted); margin: 0; font-size: 12px; }
        .pos-toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .pos-button {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 38px; padding: 9px 12px; border-radius: 10px;
          border: 1px solid var(--pos-border); color: var(--pos-text);
          background: #151c2b; font-size: 12px; font-weight: 650;
          transition: border-color .15s, background .15s; white-space: nowrap;
        }
        .pos-button:hover { border-color: #53617b; background: #1a2435; }
        .pos-button-primary { background: var(--pos-cyan); color: #06201e; border-color: var(--pos-cyan); }
        .pos-button-primary:hover { background: #63e7d5; border-color: #63e7d5; }
        .pos-button-danger { color: #ff9caa; border-color: #60313f; background: #261722; }
        .pos-button-violet { color: #d1caff; border-color: #48406d; background: #211e38; }
        .pos-button-compact { min-height: 31px; padding: 6px 8px; }
        .pos-overview {
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 12px; margin-bottom: 16px;
        }
        .pos-mini-card {
          display: flex; align-items: center; gap: 12px; padding: 14px;
          border: 1px solid var(--pos-border); border-radius: 14px;
          background: linear-gradient(145deg, #151d2d, #101624); min-width: 0;
        }
        .pos-mini-icon {
          width: 39px; height: 39px; border-radius: 12px; display: grid;
          place-items: center; color: var(--pos-cyan); background: #18312f; flex-shrink: 0;
        }
        .pos-mini-icon.violet { color: var(--pos-violet); background: #25213f; }
        .pos-mini-icon.blue { color: #78b9ff; background: #1b2b42; }
        .pos-mini-card span { color: var(--pos-muted); display: block; font-size: 11px; margin-bottom: 5px; }
        .pos-mini-card strong { font-size: 18px; font-weight: 750; display: block; overflow-wrap: anywhere; }
        .pos-workspace {
          display: grid; grid-template-columns: minmax(0,1.2fr) minmax(310px,.8fr);
          gap: 15px; align-items: start;
        }
        .pos-panel {
          border: 1px solid var(--pos-border); background: var(--pos-panel);
          border-radius: 15px; min-width: 0; overflow: hidden;
        }
        .pos-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 16px 17px; border-bottom: 1px solid var(--pos-border);
        }
        .pos-panel-header h3 { margin: 0; font-size: 14px; font-weight: 750; }
        .pos-panel-header p { margin: 5px 0 0; font-size: 11px; color: var(--pos-muted); }
        .pos-product-tools { padding: 13px; display: flex; gap: 9px; flex-wrap: wrap; }
        .pos-input-wrap {
          display: flex; align-items: center; gap: 9px; padding: 0 11px;
          min-height: 40px; border: 1px solid var(--pos-border); border-radius: 10px;
          background: #0c1220; color: var(--pos-muted); min-width: 0;
        }
        .pos-input-wrap:focus-within { border-color: #3b9f98; }
        .pos-input-wrap input {
          border: 0; outline: 0; background: transparent; color: var(--pos-text);
          width: 100%; min-width: 0; font-size: 12px;
        }
        .pos-search { flex: 1 1 190px; }
        .pos-barcode { flex: 1 1 150px; }
        .pos-select {
          color: var(--pos-text); background: #0c1220; border: 1px solid var(--pos-border);
          border-radius: 10px; padding: 0 10px; min-height: 40px; max-width: 100%; font-size: 12px;
        }
        .pos-product-grid {
          padding: 0 13px 14px; display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px;
        }
        .pos-product-card {
          text-align: left; border: 1px solid var(--pos-border); background: #141c2b;
          color: var(--pos-text); border-radius: 12px; padding: 11px; min-width: 0;
          transition: border-color .15s, transform .15s;
        }
        .pos-product-card:hover { border-color: var(--pos-cyan); transform: translateY(-1px); }
        .pos-product-card:disabled { transform: none; }
        .pos-product-image {
          height: 70px; border-radius: 9px; display: grid; place-items: center;
          overflow: hidden; margin-bottom: 10px; background: #1b2638; color: #6c7b94;
        }
        .pos-product-image img { width: 100%; height: 100%; object-fit: cover; }
        .pos-product-name {
          font-size: 12px; line-height: 1.4; font-weight: 700; display: block;
          min-height: 33px; overflow-wrap: anywhere;
        }
        .pos-product-barcode { color: var(--pos-muted); font-size: 10px; display: block; margin: 5px 0 9px; overflow-wrap: anywhere; }
        .pos-product-bottom { display: flex; justify-content: space-between; gap: 5px; align-items: center; }
        .pos-product-price { color: var(--pos-cyan); font-size: 12px; font-weight: 800; }
        .pos-stock-label { color: var(--pos-muted); font-size: 10px; }
        .pos-stock-label.low { color: #ffbf69; }
        .pos-stock-label.out { color: #ff8e9c; }
        .pos-empty {
          padding: 36px 15px; text-align: center; color: var(--pos-muted);
          font-size: 12px; grid-column: 1/-1;
        }
        .pos-empty svg { margin: 0 auto 10px; display: block; opacity: .65; }
        .pos-cart-header-right { display: flex; align-items: center; gap: 8px; color: var(--pos-muted); font-size: 11px; }
        .pos-cart-body { padding: 13px; }
        .pos-customer-row { margin-bottom: 13px; }
        .pos-customer-row .pos-input-wrap { width: 100%; }
        .pos-cart-items { display: flex; flex-direction: column; gap: 9px; }
        .pos-cart-item {
          display: grid; grid-template-columns: minmax(0,1fr) auto;
          gap: 8px; padding: 11px; border: 1px solid var(--pos-border);
          border-radius: 11px; background: #141b29;
        }
        .pos-cart-item-main { min-width: 0; }
        .pos-cart-item-name { font-size: 12px; font-weight: 700; margin-bottom: 5px; overflow-wrap: anywhere; }
        .pos-cart-item-price { font-size: 11px; color: var(--pos-muted); }
        .pos-cart-item-right { display: flex; align-items: flex-start; gap: 8px; }
        .pos-qty-controls { display: flex; align-items: center; gap: 7px; margin-top: 10px; }
        .pos-qty-controls button {
          width: 27px; height: 27px; border: 1px solid var(--pos-border);
          border-radius: 7px; background: #1c2637; color: var(--pos-text);
          display: grid; place-items: center;
        }
        .pos-qty-controls strong { font-size: 12px; min-width: 18px; text-align: center; }
        .pos-item-total { font-size: 12px; font-weight: 800; white-space: nowrap; }
        .pos-remove {
          border: 0; background: transparent; color: #ff8999; padding: 2px;
          display: grid; place-items: center;
        }
        .pos-cart-empty {
          text-align: center; border: 1px dashed #354056; border-radius: 12px;
          padding: 27px 12px; color: var(--pos-muted);
        }
        .pos-cart-empty svg { margin-bottom: 9px; opacity: .6; }
        .pos-cart-empty strong { display: block; font-size: 12px; color: #c5cede; margin-bottom: 5px; }
        .pos-cart-empty span { font-size: 11px; }
        .pos-adjustments { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .pos-field label { display: block; color: var(--pos-muted); font-size: 10px; margin-bottom: 6px; }
        .pos-field input {
          width: 100%; min-width: 0; height: 36px; border: 1px solid var(--pos-border);
          border-radius: 8px; padding: 0 9px; color: var(--pos-text); background: #0c1220; outline: 0;
        }
        .pos-field input:focus { border-color: #3b9f98; }
        .pos-summary { border-top: 1px solid var(--pos-border); margin-top: 15px; padding-top: 13px; }
        .pos-summary-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 10px; font-size: 12px;
        }
        .pos-summary-row span { color: var(--pos-muted); }
        .pos-summary-row strong { font-weight: 650; }
        .pos-summary-row.total {
          padding-top: 12px; margin-top: 5px; border-top: 1px dashed #364055;
          font-size: 14px;
        }
        .pos-summary-row.total span { color: var(--pos-text); font-weight: 750; }
        .pos-summary-row.total strong { color: var(--pos-cyan); font-size: 22px; }
        .pos-payment-title { color: var(--pos-muted); font-size: 11px; margin: 16px 0 9px; }
        .pos-payment-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
        .pos-payment-option {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 7px; min-height: 65px; border: 1px solid var(--pos-border);
          border-radius: 10px; background: #111827; color: var(--pos-muted); font-size: 11px;
        }
        .pos-payment-option.active { border-color: var(--pos-cyan); color: var(--pos-cyan); background: rgba(54,217,195,.08); }
        .pos-checkout-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-top: 13px; }
        .pos-checkout-actions .pos-button { min-height: 44px; }
        .pos-safe-note { color: var(--pos-muted); font-size: 10px; text-align: center; margin: 11px 0 0; }
        .pos-notice {
          position: sticky; top: 8px; z-index: 15; margin: 0 0 12px;
          padding: 11px 14px; border: 1px solid #2b6c64; background: #102c2a;
          color: #b9fff1; border-radius: 10px; font-size: 12px;
        }
        .pos-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000; display: flex;
          align-items: center; justify-content: center; padding: 16px;
          background: rgba(3,6,13,.78); backdrop-filter: blur(7px);
        }
        .pos-modal {
          width: min(560px,100%); max-height: min(85vh,800px); overflow: auto;
          background: #111725; color: var(--pos-text); border: 1px solid #303b50;
          border-radius: 16px; box-shadow: 0 25px 80px #0008;
        }
        .pos-modal-header {
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 16px 18px; border-bottom: 1px solid var(--pos-border);
        }
        .pos-modal-header h3 { margin: 0; font-size: 15px; }
        .pos-modal-close {
          border: 1px solid var(--pos-border); border-radius: 8px; background: #1b2434;
          color: var(--pos-text); width: 32px; height: 32px; display: grid; place-items: center;
        }
        .pos-modal-content { padding: 17px; }
        .pos-modal-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .pos-history-list { display: flex; flex-direction: column; gap: 9px; }
        .pos-history-row {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          padding: 12px; border: 1px solid var(--pos-border); border-radius: 10px;
          background: #151d2c;
        }
        .pos-history-row strong { display: block; font-size: 12px; margin-bottom: 5px; }
        .pos-history-row span { color: var(--pos-muted); font-size: 10px; }
        .pos-history-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .pos-form-field { margin-bottom: 13px; }
        .pos-form-field label { display: block; font-size: 11px; color: var(--pos-muted); margin-bottom: 6px; }
        .pos-form-field input, .pos-form-field select {
          width: 100%; height: 40px; border: 1px solid var(--pos-border);
          border-radius: 9px; background: #0c1220; color: var(--pos-text); padding: 0 11px; outline: 0;
        }
        .pos-success-icon {
          width: 60px; height: 60px; margin: 4px auto 13px; border-radius: 50%;
          display: grid; place-items: center; background: rgba(54,217,195,.12);
          color: var(--pos-cyan); border: 1px solid rgba(54,217,195,.3);
        }
        .pos-success-content { text-align: center; padding: 24px 18px; }
        .pos-success-content h3 { margin: 0 0 7px; font-size: 20px; }
        .pos-success-content p { color: var(--pos-muted); font-size: 12px; margin: 0 0 12px; }
        .pos-success-total { font-size: 28px; font-weight: 800; color: var(--pos-cyan); margin: 12px 0 20px; }
        .pos-success-content .pos-modal-actions { justify-content: center; }
        .pos-receipt { display: none; }
        @media (max-width: 1150px) {
          .pos-workspace { grid-template-columns: minmax(0,1fr); }
          .pos-cart-panel { order: -1; }
          .pos-cart-items { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
        }
        @media (max-width: 760px) {
          .pos-toolbar { align-items: flex-start; }
          .pos-toolbar-actions { width: 100%; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); }
          .pos-toolbar-actions .pos-button { width: 100%; white-space: normal; min-height: 42px; }
          .pos-toolbar-actions .pos-button:last-child { grid-column: 1/-1; }
          .pos-overview { grid-template-columns: 1fr; gap: 8px; }
          .pos-mini-card { padding: 11px; }
          .pos-mini-card strong { font-size: 16px; }
          .pos-product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .pos-cart-items { grid-template-columns: 1fr; }
          .pos-panel-header { padding: 13px; }
          .pos-product-tools { padding: 10px; }
          .pos-page-title h2 { font-size: 19px; }
        }
        @media (max-width: 390px) {
          .pos-product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; padding: 0 9px 10px; }
          .pos-product-card { padding: 8px; }
          .pos-product-image { height: 58px; }
          .pos-product-name { font-size: 11px; }
          .pos-product-price { font-size: 11px; }
          .pos-payment-grid { gap: 5px; }
          .pos-payment-option { font-size: 10px; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .pos-receipt, .pos-receipt * { visibility: visible !important; }
          .pos-receipt {
            display: block !important; position: absolute !important; inset: 0 auto auto 0 !important;
            width: 72mm !important; padding: 3mm !important; margin: 0 !important;
            background: white !important; color: black !important;
            font: 11px/1.45 monospace !important;
          }
          .pos-receipt h2 { text-align: center; font-size: 17px; margin: 0 0 4px; }
          .pos-receipt p { margin: 3px 0; }
          .pos-receipt hr { border: 0; border-top: 1px dashed black; margin: 7px 0; }
          .pos-receipt table { width: 100%; border-collapse: collapse; font-size: 10px; }
          .pos-receipt td { padding: 3px 0; vertical-align: top; }
          .pos-receipt .receipt-total { font-weight: bold; font-size: 14px; }
        }
      `}</style>

      {notice && <div className="pos-notice">{notice}</div>}

      <div className="pos-toolbar">
        <div className="pos-page-title">
          <div className="pos-title-icon">
            <ShoppingCart size={23} />
          </div>
          <div>
            <h2>Point of Sale</h2>
            <p>
              {editingBillId ? `Editing ${editingBillId}` : "Create and manage sales bills"}
            </p>
          </div>
        </div>

        <div className="pos-toolbar-actions">
          <Button variant="primary" onClick={resetBill}>
            <Plus size={16} /> New Bill
          </Button>
          <Button onClick={() => requireManager("edit")}>
            <Pencil size={15} /> Edit Bill
          </Button>
          <Button onClick={() => printBill()}>
            <Printer size={15} /> Print Bill
          </Button>
          <Button variant="violet" onClick={() => setActiveModal("suspended")}>
            <PauseCircle size={16} /> Suspended Bills
            {suspendedBills.length > 0 && ` (${suspendedBills.length})`}
          </Button>
          <Button onClick={() => setShowProducts((value) => !value)}>
            <Package size={16} /> {showProducts ? "Hide Products" : "Show Products"}
          </Button>
        </div>
      </div>

      <div className="pos-overview">
        <div className="pos-mini-card">
          <div className="pos-mini-icon"><ShoppingCart size={20} /></div>
          <div>
            <span>Items in current bill</span>
            <strong>{cartQuantity}</strong>
          </div>
        </div>
        <div className="pos-mini-card">
          <div className="pos-mini-icon violet"><FileText size={20} /></div>
          <div>
            <span>Current bill total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>
        <div className="pos-mini-card">
          <div className="pos-mini-icon blue"><Package size={20} /></div>
          <div>
            <span>Products available</span>
            <strong>{products.length}</strong>
          </div>
        </div>
      </div>

      <div className="pos-workspace">
        {showProducts && (
          <section className="pos-panel">
            <div className="pos-panel-header">
              <div>
                <h3>Products</h3>
                <p>Choose a product or enter its barcode.</p>
              </div>
              <Button
                className="pos-button-compact"
                onClick={() => {
                  reloadProducts();
                  setNotice("Inventory refreshed.");
                }}
              >
                <RotateCcw size={14} /> Refresh
              </Button>
            </div>

            <div className="pos-product-tools">
              <label className="pos-input-wrap pos-search">
                <Search size={17} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product name..."
                />
              </label>

              <form className="pos-input-wrap pos-barcode" onSubmit={addByBarcode}>
                <ScanBarcode size={17} />
                <input
                  ref={barcodeRef}
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  placeholder="Barcode..."
                />
                <button type="submit" aria-label="Add barcode product" style={{background:"transparent",border:0,color:"#36d9c3",padding:0}}>
                  <Plus size={17} />
                </button>
              </form>

              <select
                className="pos-select"
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                aria-label="Filter products"
              >
                <option>All</option>
                <option>Available</option>
                <option>Low stock</option>
                <option>Out of stock</option>
              </select>
            </div>

            <div className="pos-product-grid">
              {filteredProducts.map((product) => {
                const outOfStock = product._posStock !== null && product._posStock <= 0;
                const lowStock = product._posStock !== null && product._posStock > 0 && product._posStock <= 5;

                return (
                  <button
                    type="button"
                    key={product._posId}
                    className="pos-product-card"
                    disabled={outOfStock}
                    onClick={() => addProduct(product)}
                  >
                    <div className="pos-product-image">
                      {product._posImage ? (
                        <img src={product._posImage} alt="" />
                      ) : (
                        <Package size={28} />
                      )}
                    </div>
                    <span className="pos-product-name">{product._posName}</span>
                    <span className="pos-product-barcode">
                      {product._posBarcode || "No barcode"}
                    </span>
                    <span className="pos-product-bottom">
                      <span className="pos-product-price">{money(product._posPrice)}</span>
                      <span className={`pos-stock-label ${outOfStock ? "out" : lowStock ? "low" : ""}`}>
                        {outOfStock
                          ? "Out of stock"
                          : product._posStock === null
                          ? "Stock —"
                          : `Stock ${product._posStock}`}
                      </span>
                    </span>
                  </button>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="pos-empty">
                  <Package size={28} />
                  No products found. Check your search or inventory.
                </div>
              )}
            </div>
          </section>
        )}

        <section className="pos-panel pos-cart-panel">
          <div className="pos-panel-header">
            <div>
              <h3>Current Bill</h3>
              <p>{editingBillId || "New sale"} · {new Date().toLocaleDateString("en-GB")}</p>
            </div>
            <div className="pos-cart-header-right">
              <ShoppingCart size={17} />
              {cartQuantity} items
            </div>
          </div>

          <div className="pos-cart-body">
            <div className="pos-customer-row">
              <label className="pos-input-wrap">
                <UserRound size={16} />
                <input
                  value={customer}
                  onChange={(event) => setCustomer(event.target.value)}
                  placeholder="Customer name (optional)"
                />
              </label>
            </div>

            <div className="pos-cart-items">
              {cart.map((item) => (
                <div className="pos-cart-item" key={item.id}>
                  <div className="pos-cart-item-main">
                    <div className="pos-cart-item-name">{item.name}</div>
                    <div className="pos-cart-item-price">
                      {money(item.price)} / unit
                    </div>
                    <div className="pos-qty-controls">
                      <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity">
                        <Minus size={13} />
                      </button>
                      <strong>{item.quantity}</strong>
                      <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity">
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="pos-cart-item-right">
                    <div className="pos-item-total">{money(item.price * item.quantity)}</div>
                    <button
                      type="button"
                      className="pos-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="pos-cart-empty">
                  <ShoppingCart size={30} />
                  <strong>Your bill is empty</strong>
                  <span>Choose a product to add it to this sale.</span>
                </div>
              )}
            </div>

            <div className="pos-adjustments">
              <div className="pos-field">
                <label><Percent size={11} style={{display:"inline",verticalAlign:"middle"}} /> Discount (DA)</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                />
              </div>
              <div className="pos-field">
                <label>Extra charge (DA)</label>
                <input
                  type="number"
                  min="0"
                  value={extraCharge}
                  onChange={(event) => setExtraCharge(event.target.value)}
                />
              </div>
            </div>

            <div className="pos-summary">
              <div className="pos-summary-row">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div className="pos-summary-row">
                <span>Discount</span>
                <strong>− {money(discountValue)}</strong>
              </div>
              {Number(settings.taxRate) > 0 && (
                <div className="pos-summary-row">
                  <span>Tax ({settings.taxRate}%)</span>
                  <strong>{money(tax)}</strong>
                </div>
              )}
              {extraValue > 0 && (
                <div className="pos-summary-row">
                  <span>Extra charge</span>
                  <strong>{money(extraValue)}</strong>
                </div>
              )}
              <div className="pos-summary-row total">
                <span>Total due</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <p className="pos-payment-title">Payment method</p>
            <div className="pos-payment-grid">
              {[
                { name: "Cash", icon: Banknote },
                { name: "Card", icon: CreditCard },
                { name: "Mobile", icon: Smartphone },
              ].map(({ name, icon: Icon }) => (
                <button
                  type="button"
                  key={name}
                  className={`pos-payment-option ${paymentMethod === name ? "active" : ""}`}
                  onClick={() => setPaymentMethod(name)}
                >
                  <Icon size={19} />
                  {name}
                </button>
              ))}
            </div>

            <div className="pos-checkout-actions">
              <Button variant="primary" onClick={checkout}>
                <Check size={17} /> Complete Sale
              </Button>
              <Button
                variant="violet"
                title="Suspend current bill"
                onClick={suspendBill}
                disabled={!cart.length}
              >
                <PauseCircle size={17} />
              </Button>
            </div>

            <p className="pos-safe-note">
              <LockKeyhole size={11} style={{display:"inline",verticalAlign:"middle"}} /> Stock updates when the sale is completed.
            </p>
          </div>
        </section>
      </div>

      {activeModal && activeModal !== "print" && (
        <div className="pos-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveModal("");
        }}>
          <div className="pos-modal" role="dialog" aria-modal="true">
            {activeModal === "success" ? (
              <div className="pos-success-content">
                <div className="pos-success-icon"><Check size={30} /></div>
                <h3>Sale completed</h3>
                <p>The bill has been saved and inventory updated.</p>
                <div className="pos-success-total">{money(selectedBill?.total)}</div>
                <p>Bill: {selectedBill?.id}</p>
                <div className="pos-modal-actions">
                  <Button onClick={() => printBill(selectedBill)}>
                    <Printer size={15} /> Print receipt
                  </Button>
                  <Button variant="primary" onClick={clearCompletedBill}>
                    <Plus size={15} /> New Bill
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="pos-modal-header">
                  <h3>
                    {activeModal === "suspended" && "Suspended Bills"}
                    {activeModal === "history" && "Completed Bills"}
                    {activeModal === "pin" && "Manager authorization"}
                    {activeModal === "settings" && "POS Settings"}
                  </h3>
                  <button className="pos-modal-close" type="button" onClick={() => setActiveModal("")} aria-label="Close dialog">
                    <X size={17} />
                  </button>
                </div>

                <div className="pos-modal-content">
                  {activeModal === "suspended" && (
                    suspendedBills.length ? (
                      <div className="pos-history-list">
                        {suspendedBills.map((bill) => (
                          <div className="pos-history-row" key={bill.id}>
                            <div>
                              <strong>{bill.id}</strong>
                              <span>{bill.customer} · {bill.items.length} products · {money(bill.total)}</span>
                            </div>
                            <div className="pos-history-actions">
                              <Button className="pos-button-compact" variant="primary" onClick={() => openSuspendedBill(bill)}>
                                <RotateCcw size={13} /> Restore
                              </Button>
                              <Button className="pos-button-compact" variant="danger" onClick={() => {
                                setSuspendedBills((previous) => previous.filter((item) => item.id !== bill.id));
                                setNotice("Suspended bill deleted.");
                              }}>
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pos-empty">There are no suspended bills.</div>
                    )
                  )}

                  {activeModal === "history" && (
                    bills.length ? (
                      <div className="pos-history-list">
                        {bills.map((bill) => (
                          <div className="pos-history-row" key={bill.id}>
                            <div>
                              <strong>{bill.id}</strong>
                              <span>
                                {bill.customer} · {new Date(bill.createdAt).toLocaleString("en-GB")} · {money(bill.total)}
                              </span>
                            </div>
                            <div className="pos-history-actions">
                              <Button className="pos-button-compact" onClick={() => printBill(bill)}>
                                <Printer size={13} />
                              </Button>
                              <Button className="pos-button-compact" variant="primary" onClick={() => requestEditBill(bill)}>
                                <Pencil size={13} /> Edit
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="pos-empty">No completed bills have been saved yet.</div>
                    )
                  )}

                  {activeModal === "pin" && (
                    <form onSubmit={confirmManagerPin}>
                      <p style={{fontSize:12,color:"#8995ab",lineHeight:1.7,marginTop:0}}>
                        Enter the manager PIN to access bill history or protected settings.
                      </p>
                      <div className="pos-form-field">
                        <label>Manager PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          autoFocus
                          value={managerPin}
                          onChange={(event) => setManagerPin(event.target.value)}
                          placeholder="Enter PIN"
                        />
                      </div>
                      <div className="pos-modal-actions">
                        <Button onClick={() => setActiveModal("")}>Cancel</Button>
                        <Button variant="primary" onClick={undefined}>
                          <LockKeyhole size={14} /> Verify PIN
                        </Button>
                      </div>
                    </form>
                  )}

                  {activeModal === "settings" && (
                    <>
                      <div className="pos-form-field">
                        <label>Tax rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.taxRate}
                          onChange={(event) => setSettings((previous) => ({
                            ...previous,
                            taxRate: event.target.value,
                          }))}
                        />
                      </div>
                      <div className="pos-form-field">
                        <label>New manager PIN</label>
                        <input
                          type="password"
                          value={settings.managerPin}
                          onChange={(event) => setSettings((previous) => ({
                            ...previous,
                            managerPin: event.target.value,
                          }))}
                          placeholder="Default: 1234"
                        />
                      </div>
                      <div className="pos-modal-actions">
                        <Button variant="primary" onClick={() => {
                          setActiveModal("");
                          setNotice("POS settings saved.");
                        }}>
                          <Check size={14} /> Save settings
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeModal === "print" && (
        <div className="pos-modal-backdrop">
          <div className="pos-modal">
            <div className="pos-modal-header">
              <h3>Print bill</h3>
              <button className="pos-modal-close" type="button" onClick={() => setActiveModal("")} aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <div className="pos-modal-content">
              <p style={{color:"#8995ab",fontSize:12}}>Use the browser print dialog to select your printer or save the receipt as PDF.</p>
              <div className="pos-modal-actions">
                <Button onClick={() => setActiveModal("")}>Close</Button>
                <Button variant="primary" onClick={() => window.print()}>
                  <Printer size={15} /> Print now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pos-receipt">
        <h2>VELTRO-PRO</h2>
        <p style={{textAlign:"center"}}>SALES RECEIPT</p>
        <hr />
        <p>Bill: {(selectedBill || getBillData()).id}</p>
        <p>Date: {new Date((selectedBill || {}).createdAt || Date.now()).toLocaleString("en-GB")}</p>
        <p>Customer: {(selectedBill || {}).customer || customer || "Walk-in customer"}</p>
        <hr />
        <table>
          <tbody>
            {((selectedBill || {}).items || cart).map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td>
                  {item.name}
                  <br />
                  {item.quantity} x {money(item.price)}
                </td>
                <td style={{textAlign:"right",whiteSpace:"nowrap"}}>
                  {money(item.quantity * item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        <p>Subtotal: {money((selectedBill || {}).subtotal ?? subtotal)}</p>
        <p>Discount: {money((selectedBill || {}).discount ?? discountValue)}</p>
        <p>Extra charge: {money((selectedBill || {}).extraCharge ?? extraValue)}</p>
        <p>Tax: {money((selectedBill || {}).tax ?? tax)}</p>
        <hr />
        <p className="receipt-total">
          TOTAL: {money((selectedBill || {}).total ?? total)}
        </p>
        <p>Payment: {(selectedBill || {}).paymentMethod || paymentMethod}</p>
        <hr />
        <p style={{textAlign:"center"}}>Thank you for your purchase!</p>
      </div>
    </div>
  );
}
