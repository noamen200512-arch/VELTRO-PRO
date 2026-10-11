import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";

import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Printer,
  Lock,
  Unlock,
  Pencil,
  Save,
  Barcode,
  ShieldCheck,
  ShoppingBag,
  ScanBarcode,
  RotateCcw,
  Camera,
  ClipboardList,
  Play,
  AlertTriangle,
  History,
} from "lucide-react";

import {
  getProducts,
  saveProducts,
} from "./productStore.js";

const BILLS_KEY = "veltro_pos_bills";
const ACTIVE_KEY = "veltro_pos_active_bill";
const ROLE_KEY = "veltro_pos_role";
const PIN_KEY = "veltro_manager_pin";

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 2,
  })} DA`;

const uid = () =>
  `VLT-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const readBills = () => {
  try {
    const value = JSON.parse(
      localStorage.getItem(BILLS_KEY) || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeBills = (bills) => {
  try {
    localStorage.setItem(
      BILLS_KEY,
      JSON.stringify(bills)
    );
    return true;
  } catch {
    return false;
  }
};

const blankBill = (number = 1) => ({
  id: uid(),
  number,
  status: "open",
  items: [],
  discount: 0,
  paymentMethod: "Cash",
  received: "",
  createdAt: new Date().toISOString(),
  closedAt: null,
  history: [],
});

const styles = {
  page: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    color: "#e9edf6",
    fontFamily: "Inter,system-ui,sans-serif",
  },
  card: {
    background: "#111624",
    border: "1px solid #252c3d",
    borderRadius: 14,
    minWidth: 0,
    boxSizing: "border-box",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    border: "1px solid #30394b",
    background: "#171e2d",
    color: "#dce4f2",
    borderRadius: 9,
    padding: "9px 11px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  input: {
    background: "#0c111d",
    border: "1px solid #2a3244",
    borderRadius: 9,
    padding: 11,
    color: "#e9edf6",
    outline: "none",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    fontSize: 13,
  },
};

const getName = (p) =>
  String(
    p?.name ??
    p?.productName ??
    p?.designation ??
    ""
  );

const getSKU = (p) =>
  String(p?.sku ?? p?.reference ?? p?.ref ?? "");

const getBarcode = (p) =>
  String(
    p?.barcode ??
    p?.barCode ??
    p?.codeBar ??
    ""
  );

const getStock = (p) =>
  Math.max(0, Number(p?.stock) || 0);

const getPrice = (p) =>
  Math.max(0, Number(p?.price) || 0);

const getPieces = (p) =>
  Math.max(
    1,
    Math.floor(Number(p?.piecesPerCarton) || 1)
  );

const getColor = (category = "") => {
  const value = String(category).toLowerCase();

  if (
    value.includes("drink") ||
    value.includes("beverage")
  ) return "#60a5fa";

  if (
    value.includes("snack") ||
    value.includes("biscuit")
  ) return "#d4a373";

  if (
    value.includes("dairy") ||
    value.includes("milk")
  ) return "#a7c9ed";

  return "#36d9c3";
};

const getBillTotals = (bill) => {
  const subtotal = (bill?.items || []).reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0
  );

  const discount = Math.min(
    subtotal,
    Math.max(0, Number(bill?.discount) || 0)
  );

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
  };
};

export default function POS() {
  const [products, setProducts] = useState(() => {
    try {
      const data = getProducts();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });

  const [bills, setBills] = useState(() => {
    const saved = readBills();

    if (saved.length) return saved;

    const first = blankBill(1);
    writeBills([first]);

    try {
      localStorage.setItem(ACTIVE_KEY, first.id);
    } catch {}

    return [first];
  });

  const [activeId, setActiveId] = useState(() => {
    const saved = readBills();

    if (saved.length) {
      let stored = null;

      try {
        stored = localStorage.getItem(ACTIVE_KEY);
      } catch {}

      const storedBill = saved.find(
        (bill) =>
          bill.id === stored &&
          ["open", "editing"].includes(bill.status)
      );

      if (storedBill) return storedBill.id;

      const openBill = saved.find(
        (bill) =>
          ["open", "editing"].includes(bill.status)
      );

      if (openBill) return openBill.id;

      const next = blankBill(
        saved.reduce(
          (max, bill) =>
            Math.max(max, Number(bill.number) || 0),
          0
        ) + 1
      );

      writeBills([...saved, next]);

      try {
        localStorage.setItem(ACTIVE_KEY, next.id);
      } catch {}

      return next.id;
    }

    const first = blankBill(1);
    writeBills([first]);

    try {
      localStorage.setItem(ACTIVE_KEY, first.id);
    } catch {}

    return first.id;
  });

  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("All Products");
  const [page, setPage] = useState(1);
  const [showProducts, setShowProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);

  const processingRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const scanBusyRef = useRef(false);

  const [managerDialog, setManagerDialog] = useState(null);
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(
    () => localStorage.getItem(ROLE_KEY) || "Cashier"
  );

  const [editItem, setEditItem] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPieces, setEditPieces] = useState("");
  const [reason, setReason] = useState("");

  const [printBill, setPrintBill] = useState(null);
  const [billBrowseIndex, setBillBrowseIndex] = useState(-1);

  // النوافذ الجديدة
  const [showPendingBills, setShowPendingBills] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const activeBill =
    bills.find((bill) => bill.id === activeId) || null;

  const cart = activeBill?.items || [];
  const isEditingClosed = activeBill?.status === "editing";
  const isClosed = activeBill?.status === "closed";

  const pendingBills = useMemo(
    () =>
      bills
        .filter((bill) =>
          ["open", "editing"].includes(bill.status)
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        ),
    [bills]
  );

  const closedBills = useMemo(
    () =>
      bills
        .filter((bill) => bill.status === "closed")
        .sort(
          (a, b) =>
            new Date(b.closedAt || b.createdAt || 0) -
            new Date(a.closedAt || a.createdAt || 0)
        ),
    [bills]
  );

  function persist(nextBills, nextActive = activeId) {
    if (!writeBills(nextBills)) {
      setMessage(
        "تعذر حفظ البونات. تحقق من مساحة المتصفح."
      );
      return false;
    }

    setBills(nextBills);
    setActiveId(nextActive);

    try {
      if (nextActive) {
        localStorage.setItem(ACTIVE_KEY, nextActive);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch {}

    return true;
  }

  function updateBill(id, changes) {
    const next = bills.map((bill) =>
      bill.id === id
        ? { ...bill, ...changes }
        : bill
    );

    persist(next);
  }

  function updateItems(items) {
    if (
      !activeBill ||
      activeBill.status === "closed"
    ) return;

    updateBill(activeBill.id, { items });
  }

  function refreshProducts() {
    try {
      const latest = getProducts();

      if (!Array.isArray(latest)) {
        setMessage("تعذر قراءة قائمة المنتجات.");
        return products;
      }

      setProducts(latest);
      return latest;
    } catch {
      setMessage("حدث خطأ أثناء قراءة المنتجات.");
      return products;
    }
  }

  function createBill() {
    const count = bills.filter((bill) =>
      ["open", "editing"].includes(bill.status)
    ).length;

    if (count >= 20) {
      setMessage(
        "وصلت إلى الحد الأقصى للبونات المفتوحة."
      );
      return;
    }

    const bill = blankBill(
      bills.reduce(
        (max, current) =>
          Math.max(max, Number(current.number) || 0),
        0
      ) + 1
    );

    if (persist([...bills, bill], bill.id)) {
      setMessage("تم فتح بون جديد.");
      setShowPayment(false);
      setShowPendingBills(false);
    }
  }

  function activateBill(bill) {
    if (!bill) return;

    if (bill.status === "closed") {
      setPrintBill(bill);
      return;
    }

    setActiveId(bill.id);

    try {
      localStorage.setItem(ACTIVE_KEY, bill.id);
    } catch {}

    setShowPayment(false);
    setShowPendingBills(false);
    setMessage("");
  }

  const categories = useMemo(
    () => [
      "All Products",
      ...new Set(
        products.map((p) =>
          String(p.category || "General")
        )
      ),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return products.filter((product) => {
      const categoryMatch =
        category === "All Products" ||
        String(product.category || "General") === category;

      const searchMatch =
        !query ||
        getName(product).toLocaleLowerCase().includes(query) ||
        getSKU(product).toLocaleLowerCase().includes(query) ||
        getBarcode(product).toLocaleLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [products, search, category]);

  const pageSize = 9;
  const pageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / pageSize)
  );
  const safePage = Math.min(page, pageCount);

  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0
  );

  const discount = Math.min(
    subtotal,
    Math.max(0, Number(activeBill?.discount) || 0)
  );

  const total = Math.max(0, subtotal - discount);

  const paid =
    activeBill?.paymentMethod === "Cash"
      ? activeBill?.received === "" ||
        activeBill?.received == null
        ? total
        : Math.max(
            0,
            Number(activeBill?.received) || 0
          )
      : total;

  const change = Math.max(0, paid - total);

  function addProduct(product, mode = "piece") {
    if (
      !activeBill ||
      activeBill.status === "closed"
    ) {
      setMessage("افتح بونًا جديدًا قبل إضافة المنتجات.");
      return;
    }

    const latest = refreshProducts();
    const productId = product.id ?? product.productId;

    const currentProduct = latest.find(
      (item) =>
        (item.id ?? item.productId) === productId
    );

    if (!currentProduct) {
      setMessage(
        "المنتج غير موجود. حدّث صفحة المنتجات."
      );
      return;
    }

    const pieces = getPieces(currentProduct);
    const piecesPerUnit =
      mode === "carton" ? pieces : 1;
    const stock = getStock(currentProduct);

    const oldBillUnits = isEditingClosed
      ? (activeBill.originalItems || [])
          .filter(
            (item) => item.productId === productId
          )
          .reduce(
            (sum, item) =>
              sum +
              (Number(item.quantity) || 0) *
                (Number(item.piecesPerUnit) || 1),
            0
          )
      : 0;

    const alreadyInCart = cart
      .filter((item) => item.productId === productId)
      .reduce(
        (sum, item) =>
          sum +
          (Number(item.quantity) || 0) *
            (Number(item.piecesPerUnit) || 1),
        0
      );

    if (
      alreadyInCart + piecesPerUnit >
      stock + oldBillUnits
    ) {
      setMessage("المخزون لا يكفي لهذه الكمية.");
      return;
    }

    const price =
      mode === "carton"
        ? Number(currentProduct.cartonPrice) > 0
          ? Number(currentProduct.cartonPrice)
          : getPrice(currentProduct) * pieces
        : getPrice(currentProduct);

    const existing = cart.find(
      (item) =>
        item.productId === productId &&
        item.mode === mode
    );

    const items = existing
      ? cart.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity:
                  (Number(item.quantity) || 0) + 1,
              }
            : item
        )
      : [
          ...cart,
          {
            id: uid(),
            productId,
            name: getName(currentProduct),
            sku: getSKU(currentProduct),
            barcode: getBarcode(currentProduct),
            mode,
            quantity: 1,
            piecesPerUnit,
            price,
            purchasePrice:
              Number(currentProduct.purchasePrice) || 0,
          },
        ];

    updateItems(items);
    setMessage("");
  }

  function scanBarcode(value) {
    const code = String(value || "").trim().toLowerCase();
    if (!code) return;

    const latest = refreshProducts();

    const product = latest.find(
      (item) =>
        getBarcode(item).trim().toLowerCase() === code ||
        getSKU(item).trim().toLowerCase() === code
    );

    if (!product) {
      setMessage(
        "لم نعثر على منتج بهذا الباركود أو المرجع."
      );
    } else {
      addProduct(product);
      setSearch("");
      setCategory("All Products");
      setPage(1);
    }

    setBarcode("");
  }

  function changeQuantity(itemId, amount) {
    if (
      !activeBill ||
      activeBill.status === "closed"
    ) return;

    const item = cart.find(
      (current) => current.id === itemId
    );

    if (!item) return;

    const nextQty = Number(item.quantity) + amount;

    if (nextQty <= 0) {
      updateItems(
        cart.filter((current) => current.id !== itemId)
      );
      setMessage("");
      return;
    }

    const latest = refreshProducts();

    const product = latest.find(
      (current) =>
        (current.id ?? current.productId) === item.productId
    );

    if (!product) {
      setMessage("المنتج غير موجود بالمخزون.");
      return;
    }

    const oldBillUnits = isEditingClosed
      ? (activeBill.originalItems || [])
          .filter(
            (current) =>
              current.productId === item.productId
          )
          .reduce(
            (sum, current) =>
              sum +
              (Number(current.quantity) || 0) *
                (Number(current.piecesPerUnit) || 1),
            0
          )
      : 0;

    const inCartUnits = cart
      .filter(
        (current) =>
          current.productId === item.productId
      )
      .reduce(
        (sum, current) =>
          sum +
          (Number(current.quantity) || 0) *
            (Number(current.piecesPerUnit) || 1),
        0
      );

    const requested =
      inCartUnits -
      item.quantity * item.piecesPerUnit +
      nextQty * item.piecesPerUnit;

    if (
      requested >
      getStock(product) + oldBillUnits
    ) {
      setMessage("الكمية تتجاوز المخزون المتاح.");
      return;
    }

    updateItems(
      cart.map((current) =>
        current.id === itemId
          ? { ...current, quantity: nextQty }
          : current
      )
    );

    setMessage("");
  }

  function removeItem(id) {
    updateItems(
      cart.filter((item) => item.id !== id)
    );
  }

  function requestManager(
    action,
    bill = activeBill,
    item = null
  ) {
    setPin("");
    setManagerDialog({
      action,
      billId: bill?.id,
      itemId: item?.id,
    });
  }

  function authorizeManager() {
    const correctPin =
      localStorage.getItem(PIN_KEY) || "1234";

    if (pin !== correctPin) {
      setMessage("رمز المدير غير صحيح.");
      return;
    }

    try {
      localStorage.setItem(ROLE_KEY, "Manager");
    } catch {}

    setRole("Manager");

    const request = managerDialog;
    setManagerDialog(null);
    setPin("");

    if (!request) return;

    const bill = bills.find(
      (current) => current.id === request.billId
    );

    if (request.action === "edit-price" && bill) {
      const item = bill.items.find(
        (current) => current.id === request.itemId
      );

      if (item) {
        setEditItem({ ...item, billId: bill.id });
        setEditPrice(String(item.price));
        setEditPieces(String(item.piecesPerUnit));
      }
    }

    if (request.action === "edit-closed" && bill) {
      beginEditClosed(bill);
    }

    if (request.action === "change-role") {
      setMessage("تم تفعيل صلاحيات المدير.");
    }

    if (request.action === "delete-bill" && bill) {
      setDeleteTarget(bill);
    }
  }

  function beginEditClosed(bill) {
    if (role !== "Manager") {
      setMessage("صلاحية المدير مطلوبة.");
      return;
    }

    const next = bills.map((current) =>
      current.id === bill.id
        ? {
            ...current,
            status: "editing",
            originalItems: (current.items || []).map(
              (item) => ({ ...item })
            ),
            originalTotal: current.total,
            history: [
              ...(current.history || []),
              {
                date: new Date().toISOString(),
                action: "edit started",
              },
            ],
          }
        : current
    );

    if (persist(next, bill.id)) {
      setMessage(
        "تم فتح البون للتعديل. لم يتغير المخزون بعد."
      );
      setPrintBill(null);
    }
  }

  function saveEditedPrice() {
    if (!editItem || !activeBill) return;

    const price = Number(editPrice);
    const oldPrice = Math.max(
      0,
      Number(editItem.price) || 0
    );

    const oldPieces = Math.max(
      1,
      Math.floor(Number(editItem.piecesPerUnit) || 1)
    );

    const pieces = Math.max(
      1,
      Math.floor(Number(editPieces) || 1)
    );

    if (!Number.isFinite(price) || price < 0) {
      setMessage("أدخل سعرًا صحيحًا.");
      return;
    }

    if (!Number.isFinite(pieces) || pieces < 1) {
      setMessage("أدخل عدد قطع صحيحًا.");
      return;
    }

    const priceWasChanged = price !== oldPrice;

    const newPrice =
      pieces !== oldPieces && !priceWasChanged
        ? (oldPrice / oldPieces) * pieces
        : price;

    updateItems(
      cart.map((item) =>
        item.id === editItem.id
          ? {
              ...item,
              price: Number(newPrice.toFixed(2)),
              piecesPerUnit: pieces,
            }
          : item
      )
    );

    setEditItem(null);
    setMessage(
      "تم تحديث عدد القطع والسعر والإجمالي."
    );
  }

  function finalizeSale() {
    if (processingRef.current) return;

    if (!activeBill || !cart.length) {
      setMessage("أضف منتجًا واحدًا على الأقل.");
      return;
    }

    if (
      activeBill.paymentMethod === "Cash" &&
      paid < total
    ) {
      setMessage("المبلغ المستلم أقل من الإجمالي.");
      return;
    }

    if (
      isEditingClosed &&
      !reason.trim()
    ) {
      setMessage("أدخل سبب تعديل الفاتورة.");
      return;
    }

    processingRef.current = true;
    setProcessing(true);
    setMessage("");

    let originalProducts = null;
    let inventoryWasChanged = false;

    try {
      const latest = getProducts();

      if (!Array.isArray(latest)) {
        setMessage("قائمة المنتجات غير صالحة.");
        return;
      }

      originalProducts = latest.map(
        (product) => ({ ...product })
      );

      const originalItems = isEditingClosed
        ? activeBill.originalItems || []
        : [];

      const stockAfterRestore = latest.map((product) => {
        const id = product.id ?? product.productId;

        const oldQty = originalItems
          .filter((item) => item.productId === id)
          .reduce(
            (sum, item) =>
              sum +
              (Number(item.quantity) || 0) *
                (Number(item.piecesPerUnit) || 1),
            0
          );

        return oldQty
          ? {
              ...product,
              stock: getStock(product) + oldQty,
            }
          : { ...product };
      });

      const requiredByProduct = new Map();

      for (const item of cart) {
        const quantity =
          (Number(item.quantity) || 0) *
          (Number(item.piecesPerUnit) || 1);

        requiredByProduct.set(
          item.productId,
          (requiredByProduct.get(item.productId) || 0) +
            quantity
        );
      }

      for (const [productId, quantity] of requiredByProduct) {
        const product = stockAfterRestore.find(
          (current) =>
            (current.id ?? current.productId) === productId
        );

        if (!product) {
          setMessage(
            `المنتج غير موجود: ${
              cart.find(
                (item) => item.productId === productId
              )?.name || ""
            }`
          );
          return;
        }

        if (getStock(product) < quantity) {
          setMessage(
            `المخزون غير كافٍ للمنتج: ${
              cart.find(
                (item) => item.productId === productId
              )?.name || ""
            }`
          );
          return;
        }
      }

      const nextProducts = stockAfterRestore.map((product) => {
        const id = product.id ?? product.productId;
        const quantity = requiredByProduct.get(id) || 0;

        return {
          ...product,
          stock: getStock(product) - quantity,
        };
      });

      const saved = saveProducts(nextProducts);

      if (saved === false) {
        setMessage(
          "فشل حفظ المخزون. لم يتم إغلاق البون."
        );
        return;
      }

      inventoryWasChanged = true;

      const verified = getProducts();

      if (!Array.isArray(verified)) {
        throw new Error(
          "تعذر التحقق من المخزون بعد الحفظ."
        );
      }

      const stockSaved = nextProducts.every((product) => {
        const id = product.id ?? product.productId;

        const check = verified.find(
          (current) =>
            (current.id ?? current.productId) === id
        );

        return (
          check &&
          getStock(check) === getStock(product)
        );
      });

      if (!stockSaved) {
        throw new Error(
          "المخزون المحفوظ لا يطابق الكميات المطلوبة."
        );
      }

      const now = new Date().toISOString();

      const closed = {
        ...activeBill,
        items: cart.map((item) => ({ ...item })),
        subtotal,
        discount,
        total,
        paymentMethod:
          activeBill.paymentMethod || "Cash",
        received: paid,
        change,
        status: "closed",
        closedAt: now,
        originalItems: undefined,
        history: [
          ...(activeBill.history || []),
          {
            date: now,
            action: isEditingClosed
              ? "bill edited and closed"
              : "sale completed",
            reason: isEditingClosed ? reason : "",
          },
        ],
      };

      const nextBills = bills.map((bill) =>
        bill.id === closed.id ? closed : bill
      );

      if (!writeBills(nextBills)) {
        throw new Error("تعذر حفظ الفاتورة.");
      }

      setBills(nextBills);
      setActiveId("");

      try {
        localStorage.removeItem(ACTIVE_KEY);
      } catch {}

      setProducts(verified);
      setShowPayment(false);
      setReason("");
      setMessage(
        "تم حفظ البيع وتحديث المخزون بنجاح."
      );
    } catch (error) {
      console.error(
        "VELTRO POS finalizeSale error:",
        error
      );

      if (inventoryWasChanged && originalProducts) {
        try {
          const rollback = saveProducts(originalProducts);

          if (rollback === false) {
            setProducts(getProducts());
            setMessage(
              "تعذر استعادة المخزون تلقائيًا. تحقق منه قبل إعادة البيع."
            );
          } else {
            setProducts(originalProducts);
            setMessage(
              `لم يكتمل البيع: ${
                error?.message || "خطأ غير معروف"
              }. تمت محاولة استعادة المخزون السابق.`
            );
          }
        } catch (rollbackError) {
          console.error(
            "VELTRO stock rollback error:",
            rollbackError
          );

          try {
            setProducts(getProducts());
          } catch {}

          setMessage(
            "حدث خطأ أثناء استعادة المخزون. تحقق من المخزون والفاتورة يدويًا."
          );
        }
      } else {
        setMessage(
          `تعذر إتمام البيع: ${
            error?.message || "خطأ غير معروف"
          }.`
        );
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }

  function closeBill() {
    if (!activeBill || !cart.length) {
      setMessage("البون فارغ.");
      return;
    }

    if (activeBill.status !== "open") return;

    setMessage(
      "لإتمام البيع وخصم المخزون، استخدم زر تأكيد البيع."
    );
  }

  function printReceipt(bill) {
    setPrintBill(bill);

    // ننتظر ظهور محتوى الفاتورة قبل فتح نافذة الطباعة.
    window.setTimeout(() => window.print(), 250);
  }

  function browseBill(direction) {
    if (!closedBills.length) {
      setMessage(
        "لا توجد بونات مغلقة للتنقل بينها."
      );
      return;
    }

    const currentIndex = closedBills.findIndex(
      (bill) => bill.id === printBill?.id
    );

    const start =
      currentIndex >= 0
        ? currentIndex
        : direction > 0
          ? -1
          : closedBills.length;

    const nextIndex = Math.max(
      0,
      Math.min(
        closedBills.length - 1,
        start + direction
      )
    );

    setBillBrowseIndex(nextIndex);
    setPrintBill(closedBills[nextIndex]);
  }

  // حذف بون لا يعيد تعديل المخزون.
  // البيع المغلق سبق أن خصم المخزون عند إتمامه.
  function confirmDeleteBill() {
    if (!deleteTarget) return;

    const target = bills.find(
      (bill) => bill.id === deleteTarget.id
    );

    if (!target) {
      setDeleteTarget(null);
      return;
    }

    if (target.status === "editing") {
      setMessage(
        "احفظ تعديل البون أو ألغِ وضع التعديل قبل حذفه."
      );
      setDeleteTarget(null);
      return;
    }

    const nextBills = bills.filter(
      (bill) => bill.id !== target.id
    );

    let nextActive = activeId;

    if (target.id === activeId) {
      const otherOpen = nextBills.find(
        (bill) =>
          ["open", "editing"].includes(bill.status)
      );

      nextActive = otherOpen?.id || "";
    }

    if (!persist(nextBills, nextActive)) {
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);

    if (printBill?.id === target.id) {
      setPrintBill(null);
    }

    setMessage(
      `تم حذف البون رقم ${target.number}. لم تتم إعادة تعديل المخزون.`
    );
  }

  // تشغيل الكاميرا عبر getUserMedia.
  async function startCamera() {
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "المتصفح لا يدعم تشغيل الكاميرا هنا. افتح الموقع عبر HTTPS أو استخدم الإدخال اليدوي."
      );
      setShowCamera(true);
      return;
    }

    if (!("BarcodeDetector" in window)) {
      setCameraError(
        "قارئ الباركود غير مدعوم في هذا المتصفح. جرّب Chrome على الهاتف أو أدخل الباركود يدويًا."
      );
      setShowCamera(true);
      return;
    }

    setShowCamera(true);
  }

  function stopCamera() {
    if (scanTimerRef.current) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    scanBusyRef.current = false;
    setShowCamera(false);
  }

  useEffect(() => {
    if (!showCamera || cameraError) return;

    let cancelled = false;

    async function initializeCamera() {
      try {
        const detector = new window.BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "itf",
            "qr_code",
          ],
        });

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          });

        if (cancelled) {
          stream.getTracks().forEach((track) =>
            track.stop()
          );
          return;
        }

        streamRef.current = stream;

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const scanFrame = async () => {
          if (
            cancelled ||
            !videoRef.current ||
            !streamRef.current
          ) return;

          if (!scanBusyRef.current) {
            scanBusyRef.current = true;

            try {
              const results = await detector.detect(
                videoRef.current
              );

              if (results?.length && !cancelled) {
                const value = results[0].rawValue;

                if (value) {
                  scanBusyRef.current = false;
                  stopCamera();
                  scanBarcode(value);
                  return;
                }
              }
            } catch {
              // قد يفشل اكتشاف إطار واحد؛ نتابع المسح.
            }

            scanBusyRef.current = false;
          }

          if (!cancelled) {
            scanTimerRef.current =
              window.setTimeout(scanFrame, 220);
          }
        };

        scanFrame();
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error?.name === "NotAllowedError"
              ? "لم يتم السماح بالوصول إلى الكاميرا. فعّل الإذن من إعدادات المتصفح."
              : "تعذر تشغيل الكاميرا. تحقق من اتصال HTTPS وإذن الكاميرا."
          );
        }
      }
    }

    initializeCamera();

    return () => {
      cancelled = true;

      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      scanBusyRef.current = false;
    };
  }, [showCamera, cameraError]);

  return (
    <div style={styles.page}>
      <style>{`
        .pos-layout {
          display:grid;
          grid-template-columns:minmax(0,1fr) minmax(290px,370px);
          gap:16px;
          align-items:start;
        }
        .pos-panel {padding:17px}
        .pos-cart {position:sticky;top:14px}
        .pos-grid {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
        }
        .pos-product {
          border:1px solid #293145;
          border-radius:12px;
          background:#151c2b;
          padding:12px;
          color:#e9edf6;
          min-width:0;
        }
        .pos-product:hover {border-color:#36d9c3}
        .pos-chip {
          border:1px solid #2a3244;
          border-radius:8px;
          background:#151b29;
          color:#9ba7bd;
          padding:8px 10px;
          cursor:pointer;
          white-space:nowrap;
          font-size:11px;
        }
        .pos-chip.active {
          border-color:#36d9c3;
          color:#36d9c3;
          background:#12302e;
        }
        .pos-chip:disabled {opacity:.4;cursor:not-allowed}
        .pos-row {
          display:flex;
          gap:8px;
          align-items:center;
          flex-wrap:wrap;
        }
        .pos-items {
          display:flex;
          flex-direction:column;
          gap:12px;
          max-height:390px;
          overflow:auto;
        }
        .pos-line {
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          gap:8px;
          border-bottom:1px solid #252c3d;
          padding-bottom:12px;
        }
        .pos-qty {
          display:flex;
          align-items:center;
          gap:7px;
          margin-top:8px;
          flex-wrap:wrap;
        }
        .pos-qty button {
          display:flex;
          align-items:center;
          justify-content:center;
          width:27px;
          height:27px;
          border:1px solid #30394b;
          border-radius:7px;
          background:#1a2232;
          color:#e9edf6;
          cursor:pointer;
        }
        .pos-primary {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          border:0;
          border-radius:9px;
          background:#36d9c3;
          color:#071411;
          padding:12px;
          width:100%;
          font-weight:800;
          font-size:13px;
          cursor:pointer;
        }
        .pos-primary:disabled {opacity:.4;cursor:not-allowed}
        .pos-danger {
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          border:1px solid #713342;
          border-radius:9px;
          background:#3a1923;
          color:#fda4af;
          padding:11px;
          width:100%;
          font-weight:700;
          font-size:12px;
          cursor:pointer;
        }
        .pos-modal {
          position:fixed;
          inset:0;
          z-index:9999;
          background:#03060dcc;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:15px;
        }
        .pos-modal-card {
          width:100%;
          max-width:440px;
          background:#111624;
          border:1px solid #30394b;
          border-radius:14px;
          padding:22px;
          max-height:90vh;
          overflow:auto;
        }
        .pos-list {
          display:flex;
          flex-direction:column;
          gap:9px;
        }
        .pos-bill-entry {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:12px;
          border:1px solid #293145;
          border-radius:10px;
          background:#151c2b;
        }
        .pos-bill-entry button {flex-shrink:0}
        .pos-muted {font-size:11px;color:#8996ad}
        .pos-table-wrap {overflow-x:auto}
        @media(max-width:1000px) {
          .pos-layout {grid-template-columns:minmax(0,1fr)}
          .pos-cart {position:static}
        }
        @media(max-width:600px) {
          .pos-panel {padding:12px}
          .pos-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
          .pos-heading {
            align-items:flex-start!important;
            flex-direction:column;
          }
          .pos-grid-art {height:65px!important}
          .pos-modal-card {padding:15px}
        }
        @media(max-width:360px) {
          .pos-grid {grid-template-columns:minmax(0,1fr)}
        }
        @media print {
          body * {visibility:hidden!important}
          #pos-print,#pos-print * {visibility:visible!important}
          #pos-print {
            position:absolute;
            left:0;
            top:0;
            width:100%;
            background:white!important;
            color:black!important;
            padding:12px!important;
          }
          #pos-print table {width:100%;border-collapse:collapse}
          #pos-print th,#pos-print td {
            border-bottom:1px solid #aaa;
            padding:6px;
            text-align:left;
            color:black!important;
          }
          .no-print {display:none!important}
          @page {size:auto;margin:8mm}
        }
      `}</style>

      <header
        className="pos-heading"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 17,
        }}
      >
        <div>
          <div
            style={{
              color: "#36d9c3",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            COMMERCE / CHECKOUT
          </div>

          <h2 style={{ fontSize: 25, margin: 0 }}>
            Point of Sale
          </h2>

          <p
            style={{
              color: "#8996ad",
              fontSize: 12,
              margin: "6px 0 0",
            }}
          >
            Multi-bill checkout · Inventory connected
          </p>
        </div>

        <div className="pos-row">
          <button
            style={styles.button}
            onClick={createBill}
          >
            <Plus size={15} /> New Bill
          </button>

          <button
            style={styles.button}
            onClick={() => setShowPendingBills(true)}
          >
            <ClipboardList size={15} />
            Pending ({pendingBills.length})
          </button>

          <button
            style={styles.button}
            onClick={() => requestManager("change-role")}
          >
            <ShieldCheck size={15} /> {role}
          </button>
        </div>
      </header>

      {message && (
        <div
          role="status"
          style={{
            padding: 11,
            marginBottom: 13,
            borderRadius: 9,
            background: message.includes("بنجاح")
              ? "#12302e"
              : "#342a18",
            color: message.includes("بنجاح")
              ? "#36d9c3"
              : "#fbbf24",
            fontSize: 12,
          }}
        >
          {message}

          <button
            onClick={() => setMessage("")}
            style={{
              float: "right",
              background: "transparent",
              border: 0,
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* البونات الحالية */}
      <section
        style={{
          ...styles.card,
          padding: 10,
          marginBottom: 15,
        }}
      >
        <div className="pos-row">
          {bills.map((bill) => (
            <button
              key={bill.id}
              className={`pos-chip ${
                bill.id === activeId ? "active" : ""
              }`}
              onClick={() => activateBill(bill)}
            >
              <Receipt
                size={13}
                style={{
                  display: "inline",
                  verticalAlign: "middle",
                  marginRight: 4,
                }}
              />
              Bill {bill.number} ·{" "}
              {bill.status === "closed"
                ? "Closed"
                : bill.status === "editing"
                  ? "Editing"
                  : "Open"}
            </button>
          ))}
        </div>

        <div className="pos-row" style={{ marginTop: 10 }}>
          <button
            style={styles.button}
            onClick={() => browseBill(-1)}
          >
            <ChevronLeft size={14} /> Previous receipt
          </button>

          <button
            style={styles.button}
            onClick={() => browseBill(1)}
          >
            Next receipt <ChevronRight size={14} />
          </button>

          <button
            style={styles.button}
            onClick={() => setShowPendingBills(true)}
          >
            <ClipboardList size={14} /> Pending bills
          </button>

          {activeBill?.status === "open" && (
            <button
              style={styles.button}
              onClick={closeBill}
            >
              <Lock size={14} /> Close Bill
            </button>
          )}

          {activeBill?.status === "editing" && (
            <span
              style={{ fontSize: 11, color: "#fbbf24" }}
            >
              Manager edit mode
            </span>
          )}

          {activeBill?.status === "closed" && (
            <>
              <button
                style={styles.button}
                onClick={() =>
                  requestManager("edit-closed", activeBill)
                }
              >
                <Pencil size={14} /> Edit Closed Bill
              </button>

              <button
                style={styles.button}
                onClick={() => printReceipt(activeBill)}
              >
                <Printer size={14} /> Print
              </button>
            </>
          )}
        </div>
      </section>

      <div className="pos-layout">
        {/* المنتجات */}
        <section
          style={styles.card}
          className="pos-panel"
        >
          <div
            className="pos-row"
            style={{
              justifyContent: "space-between",
              marginBottom: 13,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Products
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 11,
                  color: "#8996ad",
                }}
              >
                {filteredProducts.length} products · Page{" "}
                {safePage} / {pageCount}
              </p>
            </div>

            <div className="pos-row">
              <button
                style={styles.button}
                onClick={() => {
                  refreshProducts();
                  setMessage("تم تحديث قائمة المنتجات.");
                }}
              >
                <RotateCcw size={14} /> Refresh
              </button>

              <button
                style={styles.button}
                onClick={() => setShowProducts((value) => !value)}
              >
                {showProducts ? (
                  <EyeOff size={15} />
                ) : (
                  <Eye size={15} />
                )}
                {showProducts
                  ? "Hide products"
                  : "Show products"}
              </button>
            </div>
          </div>

          <form
            className="pos-row"
            style={{ marginBottom: 10 }}
            onSubmit={(event) => {
              event.preventDefault();
              scanBarcode(barcode);
            }}
          >
            <Barcode size={17} color="#36d9c3" />

            <input
              style={{ ...styles.input, flex: 1 }}
              value={barcode}
              onChange={(event) =>
                setBarcode(event.target.value)
              }
              placeholder="Scan or enter barcode / SKU"
            />

            <button
              style={styles.button}
              type="submit"
            >
              <ScanBarcode size={15} /> Add
            </button>

            <button
              style={styles.button}
              type="button"
              onClick={startCamera}
            >
              <Camera size={15} /> Camera
            </button>
          </form>

          <div
            style={{
              position: "relative",
              marginBottom: 12,
            }}
          >
            <Search
              size={16}
              color="#8290a8"
              style={{
                position: "absolute",
                left: 12,
                top: 12,
              }}
            />

            <input
              style={{
                ...styles.input,
                paddingLeft: 37,
              }}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, barcode or reference..."
            />
          </div>

          {showProducts && (
            <>
              <div
                className="pos-row"
                style={{
                  marginBottom: 13,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                }}
              >
                {categories.map((currentCategory) => (
                  <button
                    key={currentCategory}
                    type="button"
                    className={`pos-chip ${
                      category === currentCategory
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setCategory(currentCategory);
                      setPage(1);
                    }}
                  >
                    {currentCategory}
                  </button>
                ))}
              </div>

              <div className="pos-grid">
                {visibleProducts.map((product) => {
                  const stock = getStock(product);
                  const color = getColor(product.category);
                  const productId =
                    product.id ?? product.productId;

                  return (
                    <div
                      key={productId}
                      className="pos-product"
                      style={{
                        opacity: stock <= 0 ? 0.5 : 1,
                      }}
                    >
                      <button
                        disabled={
                          stock <= 0 ||
                          !activeBill ||
                          activeBill.status === "closed"
                        }
                        onClick={() => addProduct(product)}
                        style={{
                          border: 0,
                          background: "transparent",
                          color: "inherit",
                          padding: 0,
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          className="pos-grid-art"
                          style={{
                            height: 75,
                            borderRadius: 9,
                            background:
                              `linear-gradient(145deg,${color}25,${color}08)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 9,
                            color,
                          }}
                        >
                          <ShoppingBag size={30} />
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            minHeight: 32,
                            lineHeight: 1.4,
                          }}
                        >
                          {getName(product) ||
                            "Unnamed product"}
                        </div>

                        <div
                          style={{
                            fontSize: 10,
                            color: "#8996ad",
                            margin: "5px 0",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {getSKU(product) ||
                            getBarcode(product) ||
                            "No reference"}{" "}
                          · Stock {stock}
                        </div>

                        <strong
                          style={{
                            color: "#36d9c3",
                            fontSize: 12,
                          }}
                        >
                          {money(getPrice(product))}
                        </strong>
                      </button>

                      <div
                        className="pos-row"
                        style={{ marginTop: 8 }}
                      >
                        <button
                          className="pos-chip"
                          disabled={
                            stock <= 0 ||
                            !activeBill ||
                            activeBill.status === "closed"
                          }
                          onClick={() =>
                            addProduct(product, "piece")
                          }
                        >
                          + Unit
                        </button>

                        <button
                          className="pos-chip"
                          disabled={
                            stock < getPieces(product) ||
                            !activeBill ||
                            activeBill.status === "closed"
                          }
                          onClick={() =>
                            addProduct(product, "carton")
                          }
                        >
                          + Carton
                        </button>
                      </div>
                    </div>
                  );
                })}

                {visibleProducts.length === 0 && (
                  <p
                    style={{
                      gridColumn: "1/-1",
                      textAlign: "center",
                      color: "#8996ad",
                      padding: 20,
                    }}
                  >
                    No products found. Clear the search or
                    change category.
                  </p>
                )}
              </div>

              <div
                className="pos-row"
                style={{
                  justifyContent: "center",
                  marginTop: 14,
                }}
              >
                <button
                  style={styles.button}
                  disabled={safePage <= 1}
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                >
                  <ChevronLeft size={15} /> Previous
                </button>

                {Array.from(
                  { length: pageCount },
                  (_, index) => index + 1
                ).map((number) => (
                  <button
                    key={number}
                    className={`pos-chip ${
                      safePage === number ? "active" : ""
                    }`}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}

                <button
                  style={styles.button}
                  disabled={safePage >= pageCount}
                  onClick={() =>
                    setPage((value) =>
                      Math.min(pageCount, value + 1)
                    )
                  }
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </>
          )}
        </section>

        {/* سلة البيع */}
        <section
          style={styles.card}
          className="pos-panel pos-cart"
        >
          <div
            className="pos-row"
            style={{
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div className="pos-row">
              <ShoppingCart color="#36d9c3" />

              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  Bill {activeBill?.number || "—"}
                </h3>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 11,
                    color: "#8996ad",
                  }}
                >
                  {cart.reduce(
                    (sum, item) =>
                      sum + (Number(item.quantity) || 0),
                    0
                  )}{" "}
                  sale units
                </p>
              </div>
            </div>

            <button
              style={styles.button}
              disabled={
                !cart.length ||
                isClosed ||
                processing
              }
              onClick={() => updateItems([])}
              title="Clear bill items"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {!activeBill ? (
            <p style={{ color: "#8996ad" }}>
              Open a new bill to start.
            </p>
          ) : cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 25,
                color: "#8996ad",
              }}
            >
              <ShoppingCart size={30} />
              <p>Bill is empty</p>
            </div>
          ) : (
            <div className="pos-items">
              {cart.map((item) => (
                <div className="pos-line" key={item.id}>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {item.name}
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        color: "#8996ad",
                        marginTop: 4,
                      }}
                    >
                      {item.mode === "carton"
                        ? "Carton"
                        : "Unit"}{" "}
                      · {item.piecesPerUnit} piece(s) per
                      sale unit
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#36d9c3",
                        marginTop: 4,
                      }}
                    >
                      {money(item.price)} /{" "}
                      {item.mode === "carton"
                        ? "carton"
                        : "unit"}
                    </div>

                    <div className="pos-qty">
                      <button
                        disabled={isClosed || processing}
                        onClick={() =>
                          changeQuantity(item.id, -1)
                        }
                      >
                        <Minus size={12} />
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        disabled={isClosed || processing}
                        onClick={() =>
                          changeQuantity(item.id, 1)
                        }
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        disabled={isClosed || processing}
                        onClick={() => removeItem(item.id)}
                        style={{ color: "#fb7185" }}
                      >
                        <Trash2 size={13} />
                      </button>

                      <button
                        disabled={isClosed || processing}
                        onClick={() =>
                          requestManager(
                            "edit-price",
                            activeBill,
                            item
                          )
                        }
                        title="Manager: edit price"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>

                  <strong
                    style={{
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {money(item.price * item.quantity)}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid #252c3d",
              marginTop: 14,
              paddingTop: 14,
            }}
          >
            <div
              className="pos-row"
              style={{
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              <span style={{ color: "#9ba7bd" }}>
                Subtotal
              </span>
              <strong>{money(subtotal)}</strong>
            </div>

            <label
              style={{ fontSize: 11, color: "#9ba7bd" }}
            >
              Discount (DA)
            </label>

            <input
              style={{
                ...styles.input,
                margin: "6px 0 13px",
              }}
              type="number"
              min="0"
              disabled={
                !activeBill ||
                isClosed ||
                processing
              }
              value={activeBill?.discount ?? 0}
              onChange={(event) =>
                activeBill &&
                updateBill(activeBill.id, {
                  discount: event.target.value,
                })
              }
            />

            <div
              className="pos-row"
              style={{
                justifyContent: "space-between",
                marginBottom: 15,
              }}
            >
              <strong>Total due</strong>

              <strong
                style={{
                  fontSize: 22,
                  color: "#36d9c3",
                }}
              >
                {money(total)}
              </strong>
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#9ba7bd",
                marginBottom: 8,
              }}
            >
              Payment method
            </div>

            <div
              className="pos-row"
              style={{
                marginBottom: 12,
                flexWrap: "nowrap",
              }}
            >
              {[
                ["Cash", Banknote],
                ["Card", CreditCard],
                ["Mobile", Smartphone],
              ].map(([method, Icon]) => (
                <button
                  key={method}
                  disabled={
                    !activeBill ||
                    isClosed ||
                    processing
                  }
                  className={`pos-chip ${
                    activeBill?.paymentMethod === method
                      ? "active"
                      : ""
                  }`}
                  style={{ flex: 1 }}
                  onClick={() =>
                    activeBill &&
                    updateBill(activeBill.id, {
                      paymentMethod: method,
                    })
                  }
                >
                  <Icon size={15} /> {method}
                </button>
              ))}
            </div>

            {activeBill?.paymentMethod === "Cash" && (
              <>
                <label
                  style={{
                    fontSize: 11,
                    color: "#9ba7bd",
                  }}
                >
                  Amount received (DA)
                </label>

                <input
                  style={{
                    ...styles.input,
                    margin: "6px 0 10px",
                  }}
                  type="number"
                  min="0"
                  disabled={isClosed || processing}
                  value={activeBill.received || ""}
                  onChange={(event) =>
                    updateBill(activeBill.id, {
                      received: event.target.value,
                    })
                  }
                  placeholder={String(total)}
                />

                <div
                  className="pos-row"
                  style={{
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ color: "#9ba7bd" }}>
                    Change
                  </span>

                  <strong style={{ color: "#36d9c3" }}>
                    {money(change)}
                  </strong>
                </div>
              </>
            )}

            <button
              className="pos-primary"
              disabled={
                !cart.length ||
                isClosed ||
                processing
              }
              onClick={() => setShowPayment(true)}
            >
              <CreditCard size={17} />
              Review and Complete Sale
            </button>

            {isEditingClosed && (
              <button
                style={{
                  ...styles.button,
                  width: "100%",
                  marginTop: 9,
                }}
                disabled={processing}
                onClick={() => setShowPayment(true)}
              >
                Save bill changes
              </button>
            )}
          </div>
        </section>
      </div>

      {/* نافذة البونات المعلقة */}
      {showPendingBills && (
        <div
          className="pos-modal"
          onClick={() => setShowPendingBills(false)}
        >
          <section
            className="pos-modal-card"
            style={{ maxWidth: 620 }}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div className="pos-row">
                <ClipboardList
                  size={21}
                  color="#36d9c3"
                />

                <div>
                  <h3 style={{ margin: 0 }}>
                    Pending bills
                  </h3>

                  <p className="pos-muted">
                    {pendingBills.length} open or suspended
                    bills
                  </p>
                </div>
              </div>

              <button
                style={styles.button}
                onClick={() => setShowPendingBills(false)}
              >
                <X size={16} />
              </button>
            </div>

            {pendingBills.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 28,
                  color: "#8996ad",
                }}
              >
                <ClipboardList size={32} />
                <p>No pending bills.</p>

                <button
                  className="pos-primary"
                  onClick={createBill}
                >
                  <Plus size={16} /> Create a bill
                </button>
              </div>
            ) : (
              <div className="pos-list">
                {pendingBills.map((bill) => {
                  const totals = getBillTotals(bill);
                  const selected = bill.id === activeId;

                  return (
                    <div
                      key={bill.id}
                      className="pos-bill-entry"
                      style={{
                        borderColor: selected
                          ? "#36d9c3"
                          : "#293145",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <strong>
                          Bill {bill.number}
                        </strong>

                        <div className="pos-muted">
                          {bill.status === "editing"
                            ? "Manager editing"
                            : "Pending"}{" "}
                          · {(bill.items || []).length} lines
                        </div>

                        <div
                          style={{
                            color: "#36d9c3",
                            fontSize: 12,
                            marginTop: 5,
                          }}
                        >
                          {money(totals.total)}
                        </div>

                        <div className="pos-muted">
                          {new Date(
                            bill.createdAt
                          ).toLocaleString("fr-DZ")}
                        </div>
                      </div>

                      <div
                        className="pos-row"
                        style={{ justifyContent: "flex-end" }}
                      >
                        <button
                          style={styles.button}
                          title="Preview"
                          onClick={() => setPrintBill(bill)}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          style={{
                            ...styles.button,
                            borderColor: "#267d70",
                          }}
                          onClick={() => activateBill(bill)}
                        >
                          <Play size={14} /> Resume
                        </button>

                        <button
                          style={{
                            ...styles.button,
                            color: "#fb7185",
                          }}
                          title="Delete bill"
                          onClick={() => setDeleteTarget(bill)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              style={{
                ...styles.button,
                width: "100%",
                marginTop: 14,
              }}
              onClick={() => setShowPendingBills(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}

      {/* نافذة تأكيد حذف البون */}
      {deleteTarget && (
        <div
          className="pos-modal"
          onClick={() => setDeleteTarget(null)}
        >
          <section
            className="pos-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{ marginBottom: 12 }}
            >
              <AlertTriangle
                size={23}
                color="#fb7185"
              />

              <h3 style={{ margin: 0 }}>
                Confirm bill deletion
              </h3>
            </div>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "#cbd5e1",
              }}
            >
              هل تريد حذف البون رقم{" "}
              <strong>{deleteTarget.number}</strong>؟
              لا يمكن التراجع عن هذا الإجراء.
            </p>

            {deleteTarget.status === "closed" && (
              <p
                style={{
                  color: "#fbbf24",
                  fontSize: 11,
                  lineHeight: 1.7,
                }}
              >
                هذا بون مغلق. حذفه من سجل البونات لن يعيد
                المخزون ولن يغيّر المخزون الحالي.
              </p>
            )}

            {deleteTarget.id === activeId &&
              deleteTarget.status !== "closed" && (
                <p
                  style={{
                    color: "#fbbf24",
                    fontSize: 11,
                    lineHeight: 1.7,
                  }}
                >
                  سيتم حذف محتويات البون المعلق أيضًا.
                </p>
              )}

            <div className="pos-row" style={{ marginTop: 18 }}>
              <button
                className="pos-danger"
                onClick={confirmDeleteBill}
              >
                <Trash2 size={15} /> Delete permanently
              </button>

              <button
                style={styles.button}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      {/* نافذة مسح الباركود بالكاميرا */}
      {showCamera && (
        <div
          className="pos-modal"
          onClick={stopCamera}
        >
          <section
            className="pos-modal-card"
            style={{ maxWidth: 540 }}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div className="pos-row">
                <Camera size={20} color="#36d9c3" />

                <h3 style={{ margin: 0 }}>
                  Scan barcode
                </h3>
              </div>

              <button
                style={styles.button}
                onClick={stopCamera}
              >
                <X size={16} />
              </button>
            </div>

            {cameraError ? (
              <div
                style={{
                  padding: 14,
                  background: "#342a18",
                  borderRadius: 10,
                  color: "#fbbf24",
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                {cameraError}
              </div>
            ) : (
              <>
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 12,
                    background: "#05070c",
                    border: "1px solid #30394b",
                  }}
                >
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: 390,
                      objectFit: "cover",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "10%",
                      right: "10%",
                      top: "45%",
                      borderTop: "2px solid #36d9c3",
                      boxShadow:
                        "0 0 10px #36d9c388",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: "#9ba7bd",
                    textAlign: "center",
                    lineHeight: 1.7,
                  }}
                >
                  وجّه الكاميرا الخلفية إلى الباركود وانتظر
                  حتى تتم قراءته تلقائيًا.
                </p>
              </>
            )}

            <button
              style={{
                ...styles.button,
                width: "100%",
                marginTop: 10,
              }}
              onClick={stopCamera}
            >
              Close camera
            </button>
          </section>
        </div>
      )}

      {/* تأكيد البيع */}
      {showPayment && (
        <div
          className="pos-modal"
          onClick={() =>
            !processing && setShowPayment(false)
          }
        >
          <section
            className="pos-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{ justifyContent: "space-between" }}
            >
              <h3 style={{ margin: 0 }}>
                Confirm Bill {activeBill?.number}
              </h3>

              <button
                style={styles.button}
                disabled={processing}
                onClick={() => setShowPayment(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "22px 0",
              }}
            >
              <Receipt size={34} color="#36d9c3" />

              <div
                style={{
                  fontSize: 11,
                  color: "#9ba7bd",
                  marginTop: 8,
                }}
              >
                Total due
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#36d9c3",
                }}
              >
                {money(total)}
              </div>
            </div>

            {isEditingClosed && (
              <>
                <label style={{ fontSize: 12 }}>
                  Reason for editing
                </label>

                <input
                  style={{
                    ...styles.input,
                    margin: "6px 0 12px",
                  }}
                  disabled={processing}
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  placeholder="Explain the correction"
                />
              </>
            )}

            {activeBill?.paymentMethod === "Cash" &&
              paid < total && (
                <p
                  style={{
                    color: "#fbbf24",
                    fontSize: 12,
                  }}
                >
                  Received amount is less than the total.
                </p>
              )}

            <button
              className="pos-primary"
              disabled={
                processing ||
                !cart.length ||
                (activeBill?.paymentMethod === "Cash" &&
                  paid < total) ||
                (isEditingClosed && !reason.trim())
              }
              onClick={finalizeSale}
            >
              <CheckCircle2 size={17} />

              {processing
                ? "Processing sale..."
                : isEditingClosed
                  ? "Save changes and close bill"
                  : "Confirm sale and deduct stock"}
            </button>

            <button
              style={{
                ...styles.button,
                width: "100%",
                marginTop: 9,
              }}
              disabled={processing}
              onClick={() => setShowPayment(false)}
            >
              Back to bill
            </button>
          </section>
        </div>
      )}

      {/* صلاحيات المدير */}
      {managerDialog && (
        <div
          className="pos-modal"
          onClick={() => setManagerDialog(null)}
        >
          <section
            className="pos-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{ justifyContent: "space-between" }}
            >
              <h3 style={{ margin: 0 }}>
                Manager authorization
              </h3>

              <button
                style={styles.button}
                onClick={() => setManagerDialog(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9ba7bd",
              }}
            >
              Enter the manager PIN to continue.
            </p>

            <input
              style={styles.input}
              type="password"
              value={pin}
              onChange={(event) =>
                setPin(event.target.value)
              }
              placeholder="Manager PIN"
            />

            <button
              className="pos-primary"
              style={{ marginTop: 12 }}
              onClick={authorizeManager}
            >
              <Unlock size={16} /> Authorize
            </button>

            <p
              style={{
                fontSize: 10,
                color: "#8996ad",
                lineHeight: 1.5,
              }}
            >
              Initial demo PIN: 1234. Change it before real
              use. This browser-only PIN is not secure
              authentication for a multi-user system.
            </p>
          </section>
        </div>
      )}

      {/* تعديل سعر سطر البيع */}
      {editItem && (
        <div
          className="pos-modal"
          onClick={() => setEditItem(null)}
        >
          <section
            className="pos-modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{ justifyContent: "space-between" }}
            >
              <h3 style={{ margin: 0 }}>
                Edit sale line
              </h3>

              <button
                style={styles.button}
                onClick={() => setEditItem(null)}
              >
                <X size={16} />
              </button>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#9ba7bd",
              }}
            >
              {editItem.name} · current bill only
            </p>

            <label style={{ fontSize: 12 }}>
              Sale price (DA)
            </label>

            <input
              style={{
                ...styles.input,
                margin: "6px 0 12px",
              }}
              type="number"
              min="0"
              value={editPrice}
              onChange={(event) =>
                setEditPrice(event.target.value)
              }
            />

            <label style={{ fontSize: 12 }}>
              Pieces per sale unit
            </label>

            <input
              style={{
                ...styles.input,
                margin: "6px 0 12px",
              }}
              type="number"
              min="1"
              value={editPieces}
              onChange={(event) =>
                setEditPieces(event.target.value)
              }
            />

            <button
              className="pos-primary"
              onClick={saveEditedPrice}
            >
              <Save size={16} /> Save line
            </button>
          </section>
        </div>
      )}

      {/* معاينة البون والطباعة */}
      {printBill && (
        <div
          className="pos-modal no-print"
          onClick={() => setPrintBill(null)}
        >
          <section
            className="pos-modal-card"
            style={{ maxWidth: 600 }}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="pos-row"
              style={{
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Bill {printBill.number}
                </h3>

                <p
                  className="pos-muted"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {printBill.id}
                </p>
              </div>

              <button
                style={styles.button}
                onClick={() => setPrintBill(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div
              className="pos-row"
              style={{
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <span
                className="pos-chip active"
                style={{ cursor: "default" }}
              >
                {printBill.status === "closed"
                  ? "Closed"
                  : printBill.status === "editing"
                    ? "Editing"
                    : "Pending"}
              </span>

              <span className="pos-muted">
                {new Date(
                  printBill.closedAt ||
                  printBill.createdAt
                ).toLocaleString("fr-DZ")}
              </span>
            </div>

            <div
              id="pos-print"
              style={{
                background: "#fff",
                color: "#111",
                padding: 16,
                marginTop: 15,
                borderRadius: 8,
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  margin: "0 0 5px",
                }}
              >
                VELTRO-PRO
              </h2>

              <p
                style={{
                  textAlign: "center",
                  fontSize: 12,
                }}
              >
                Receipt / Bon de vente
              </p>

              <p style={{ fontSize: 12 }}>
                Bill: {printBill.number}
                <br />
                Reference: {printBill.id}
                <br />
                Date:{" "}
                {new Date(
                  printBill.closedAt ||
                  printBill.createdAt
                ).toLocaleString("fr-DZ")}
              </p>

              <div className="pos-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(printBill.items || []).map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.name} ({item.mode})
                        </td>
                        <td>{item.quantity}</td>
                        <td>{money(item.price)}</td>
                        <td>
                          {money(
                            item.price * item.quantity
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                Subtotal:{" "}
                {money(getBillTotals(printBill).subtotal)}
              </p>

              <p>
                Discount:{" "}
                {money(getBillTotals(printBill).discount)}
              </p>

              <h3>
                Total: {money(getBillTotals(printBill).total)}
              </h3>

              <p>
                Payment:{" "}
                {printBill.paymentMethod || "Cash"}
              </p>

              {printBill.status === "closed" && (
                <>
                  <p>
                    Received:{" "}
                    {money(printBill.received)}
                  </p>

                  <p>
                    Change:{" "}
                    {money(printBill.change)}
                  </p>
                </>
              )}

              <p>Thank you / Merci</p>
            </div>

            <button
              className="pos-primary"
              style={{ marginTop: 12 }}
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print receipt
            </button>

            {printBill.status === "closed" && (
              <button
                style={{
                  ...styles.button,
                  width: "100%",
                  marginTop: 8,
                }}
                onClick={() => {
                  const bill = printBill;
                  setPrintBill(null);
                  requestManager("edit-closed", bill);
                }}
              >
                <Pencil size={15} /> Edit closed bill
              </button>
            )}

            {printBill.status !== "editing" && (
              <button
                style={{
                  ...styles.button,
                  width: "100%",
                  marginTop: 8,
                  color: "#fb7185",
                }}
                onClick={() => setDeleteTarget(printBill)}
              >
                <Trash2 size={15} /> Delete bill
              </button>
            )}

            <div
              className="pos-row"
              style={{ marginTop: 10 }}
            >
              <button
                style={styles.button}
                disabled={!closedBills.length}
                onClick={() => browseBill(-1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <button
                style={styles.button}
                disabled={!closedBills.length}
                onClick={() => browseBill(1)}
              >
                Next <ChevronRight size={14} />
              </button>

              {["open", "editing"].includes(
                printBill.status
              ) && (
                <button
                  style={styles.button}
                  onClick={() => activateBill(printBill)}
                >
                  <Play size={14} /> Resume bill
                </button>
              )}
            </div>

            {printBill.history?.length > 0 && (
              <details style={{ marginTop: 15 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#9ba7bd",
                  }}
                >
                  <History
                    size={13}
                    style={{
                      display: "inline",
                      verticalAlign: "middle",
                      marginRight: 5,
                    }}
                  />
                  Bill history
                </summary>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {printBill.history.map((entry, index) => (
                    <div
                      key={`${entry.date}-${index}`}
                      style={{
                        fontSize: 11,
                        color: "#9ba7bd",
                        borderLeft: "2px solid #36d9c3",
                        paddingLeft: 9,
                      }}
                    >
                      <div>
                        {entry.action}
                      </div>

                      <div>
                        {new Date(
                          entry.date
                        ).toLocaleString("fr-DZ")}
                      </div>

                      {entry.reason && (
                        <div>
                          Reason: {entry.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
