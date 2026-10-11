
import React, { useMemo, useState } from "react";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Package,
  CreditCard, Banknote, Smartphone, ScanBarcode, X,
  CheckCircle2, Receipt, RotateCcw, ShoppingBag,
  ChevronLeft, ChevronRight, Eye, EyeOff, Printer,
  Lock, Unlock, Pencil, Save, Barcode, ShieldCheck
} from "lucide-react";
import { getProducts, saveProducts } from "./productStore.js";

const BILLS_KEY = "veltro_pos_bills";
const ACTIVE_KEY = "veltro_pos_active_bill";
const ROLE_KEY = "veltro_pos_role";
const PIN_KEY = "veltro_manager_pin";

const money = (v) => `${Number(v || 0).toLocaleString("fr-DZ")} DA`;
const uid = () => `VLT-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

const readBills = () => {
  try {
    const value = JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeBills = (bills) => {
  try {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
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
    color: "#e9edf6",
    fontFamily: "Inter,system-ui,sans-serif",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
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

const getColor = (category = "") => {
  const v = category.toLowerCase();
  if (v.includes("drink") || v.includes("beverage")) return "#60a5fa";
  if (v.includes("snack") || v.includes("biscuit")) return "#d4a373";
  if (v.includes("dairy") || v.includes("milk")) return "#a7c9ed";
  return "#36d9c3";
};

export default function POS() {
  const [products, setProducts] = useState(() => getProducts());
  const [bills, setBills] = useState(() => {
    const saved = readBills();
    return saved.length ? saved : [blankBill()];
  });
  const [activeId, setActiveId] = useState(() => {
    const saved = readBills();
    const stored = localStorage.getItem(ACTIVE_KEY);
    return saved.some((b) => b.id === stored && b.status === "open")
      ? stored
      : saved.find((b) => b.status === "open")?.id || "";
  });

  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("All Products");
  const [page, setPage] = useState(1);
  const [showProducts, setShowProducts] = useState(true);
  const [message, setMessage] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editPieces, setEditPieces] = useState("");
  const [managerDialog, setManagerDialog] = useState(null);
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY) || "Cashier");
  const [printBill, setPrintBill] = useState(null);
  const [reason, setReason] = useState("");

  const activeBill = bills.find((b) => b.id === activeId) || null;
  const cart = activeBill?.items || [];
  const isEditingClosed = activeBill?.status === "editing";

  function persist(nextBills, nextActive = activeId) {
    if (!writeBills(nextBills)) {
      setMessage("تعذر حفظ البونات في المتصفح.");
      return false;
    }
    setBills(nextBills);
    setActiveId(nextActive);
    try {
      localStorage.setItem(ACTIVE_KEY, nextActive);
    } catch {}
    return true;
  }

  function updateBill(id, changes) {
    const next = bills.map((b) => b.id === id ? { ...b, ...changes } : b);
    persist(next);
  }

  function refreshProducts() {
    const latest = getProducts();
    setProducts(latest);
    return latest;
  }

  function createBill() {
    const openCount = bills.filter((b) => b.status === "open" || b.status === "editing").length;
    if (openCount >= 20) {
      setMessage("وصلت إلى الحد الأقصى للبونات المفتوحة (20).");
      return;
    }
    const bill = blankBill(bills.reduce((max, b) => Math.max(max, b.number || 0), 0) + 1);
    const next = [...bills, bill];
    if (persist(next, bill.id)) setMessage("تم فتح بون جديد.");
  }

  function updateItems(items) {
    if (!activeBill || activeBill.status === "closed") return;
    updateBill(activeBill.id, { items });
  }

  const categories = useMemo(() => [
    "All Products",
    ...new Set(products.map((p) => p.category || "General")),
  ], [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) =>
      (category === "All Products" || (p.category || "General") === category) &&
      (!q ||
        String(p.name || "").toLowerCase().includes(q) ||
        String(p.sku || "").toLowerCase().includes(q) ||
        String(p.barcode || "").toLowerCase().includes(q))
    );
  }, [products, search, category]);

  const pageSize = 9;
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.min(subtotal, Math.max(0, Number(activeBill?.discount) || 0));
  const total = Math.max(0, subtotal - discount);
  const paid = activeBill?.paymentMethod === "Cash"
    ? Number(activeBill?.received) || 0
    : total;
  const change = Math.max(0, paid - total);

  function addProduct(product, mode = "piece") {
    if (!activeBill || activeBill.status === "closed") {
      setMessage("افتح بونًا جديدًا قبل إضافة المنتجات.");
      return;
    }
    const latest = refreshProducts();
    const p = latest.find((x) => x.id === product.id);
    if (!p) return setMessage("المنتج غير موجود.");

    const pieces = Math.max(1, Number(p.piecesPerCarton) || 1);
    const unitCount = mode === "carton" ? pieces : 1;
    const stock = Number(p.stock) || 0;
    const alreadyInCart = cart
      .filter((i) => i.productId === p.id)
      .reduce((sum, i) => sum + i.quantity * i.piecesPerUnit, 0);

    if (stock - alreadyInCart < unitCount) {
      return setMessage("المخزون لا يكفي لهذه الكمية.");
    }

    const price = mode === "carton"
      ? (Number(p.cartonPrice) > 0 ? Number(p.cartonPrice) : Number(p.price || 0) * pieces)
      : Number(p.price || 0);

    const existing = cart.find((i) => i.productId === p.id && i.mode === mode);
    const items = existing
      ? cart.map((i) => i.id === existing.id
          ? { ...i, quantity: i.quantity + 1 }
          : i)
      : [...cart, {
          id: uid(),
          productId: p.id,
          name: p.name,
          sku: p.sku || "",
          barcode: p.barcode || "",
          mode,
          quantity: 1,
          piecesPerUnit: unitCount,
          price,
          originalPrice: price,
          purchasePrice: Number(p.purchasePrice || 0),
        }];

    updateItems(items);
    setMessage("");
  }

  function scanBarcode(value) {
    const code = value.trim().toLowerCase();
    if (!code) return;
    const p = products.find((x) =>
      String(x.barcode || "").toLowerCase() === code ||
      String(x.sku || "").toLowerCase() === code
    );
    if (!p) {
      setMessage("لم نعثر على منتج بهذا الباركود أو المرجع.");
    } else {
      addProduct(p);
      setSearch("");
      setCategory("All Products");
      setPage(1);
    }
    setBarcode("");
  }

  function changeQuantity(itemId, amount) {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    const latest = getProducts();
    const p = latest.find((x) => x.id === item.productId);
    if (!p) return setMessage("المنتج غير موجود بالمخزون.");

    const nextQty = item.quantity + amount;
    if (nextQty <= 0) {
      updateItems(cart.filter((i) => i.id !== itemId));
      return;
    }

    const oldBillUnits = isEditingClosed ? (activeBill.originalItems || [])
      .filter((i) => i.productId === item.productId)
      .reduce((s, i) => s + i.quantity * i.piecesPerUnit, 0) : 0;

    const inCartUnits = cart
      .filter((i) => i.productId === item.productId)
      .reduce((s, i) => s + i.quantity * i.piecesPerUnit, 0);

    const available = Number(p.stock || 0) + oldBillUnits;
    if (inCartUnits - item.quantity * item.piecesPerUnit +
        nextQty * item.piecesPerUnit > available) {
      return setMessage("الكمية تتجاوز المخزون المتاح.");
    }

    updateItems(cart.map((i) => i.id === itemId ? { ...i, quantity: nextQty } : i));
    setMessage("");
  }

  function removeItem(id) {
    updateItems(cart.filter((i) => i.id !== id));
  }

  function requestManager(action, bill = activeBill, item = null) {
    setPin("");
    setReason("");
    setManagerDialog({ action, billId: bill?.id, itemId: item?.id });
  }

  function authorizeManager() {
    const correctPin = localStorage.getItem(PIN_KEY) || "1234";
    if (pin !== correctPin) {
      setMessage("رمز المدير غير صحيح.");
      return;
    }
    localStorage.setItem(ROLE_KEY, "Manager");
    setRole("Manager");
    const request = managerDialog;
    setManagerDialog(null);
    setPin("");
    if (!request) return;

    const bill = bills.find((b) => b.id === request.billId);
    if (request.action === "edit-price" && bill) {
      const item = bill.items.find((i) => i.id === request.itemId);
      if (item) {
        setEditItem({ ...item, billId: bill.id });
        setEditPrice(String(item.price));
        setEditPieces(String(item.piecesPerUnit));
      }
    } else if (request.action === "edit-closed" && bill) {
      beginEditClosed(bill);
    } else if (request.action === "change-role") {
      setMessage("تم تفعيل صلاحيات المدير في هذه الجلسة.");
    }
  }

  function beginEditClosed(bill) {
    const latest = getProducts();
    const nextProducts = latest.map((p) => {
      const sold = bill.items
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity * i.piecesPerUnit, 0);
      return sold ? { ...p, stock: Number(p.stock || 0) + sold } : p;
    });

    if (!saveProducts(nextProducts)) {
      setMessage("تعذر استرجاع المخزون لتعديل البون.");
      return;
    }

    const next = bills.map((b) => b.id === bill.id
      ? {
          ...b,
          status: "editing",
          originalItems: b.items.map((i) => ({ ...i })),
          originalTotal: b.total,
          history: [...(b.history || []), {
            date: new Date().toISOString(),
            action: "edit started",
            reason: reason || "Manager edit",
          }],
        }
      : b);

    if (persist(next, bill.id)) {
      setProducts(nextProducts);
      setMessage("تم فتح البون للتعديل. راجع الكميات والأسعار قبل الحفظ.");
    }
  }

  function saveEditedPrice() {
    if (!editItem || !activeBill) return;
    const price = Number(editPrice);
    const pieces = Math.max(1, Math.floor(Number(editPieces) || 1));
    if (!Number.isFinite(price) || price < 0) {
      setMessage("أدخل سعرًا صحيحًا.");
      return;
    }
    updateItems(cart.map((i) => i.id === editItem.id
      ? { ...i, price, piecesPerUnit: pieces }
      : i));
    setEditItem(null);
    setMessage("تم تحديث سعر السطر لهذه الفاتورة فقط.");
  }

  function finalizeSale() {
    if (!activeBill || !cart.length) return setMessage("أضف منتجًا واحدًا على الأقل.");
    if (activeBill.paymentMethod === "Cash" && paid < total) {
      return setMessage("المبلغ المستلم أقل من الإجمالي.");
    }

    const latest = getProducts();
    const originalItems = isEditingClosed ? (activeBill.originalItems || []) : [];
    const stockAfterRestore = latest.map((p) => {
      const oldQty = originalItems
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity * i.piecesPerUnit, 0);
      return oldQty ? { ...p, stock: Number(p.stock || 0) + oldQty } : p;
    });

    for (const item of cart) {
      const p = stockAfterRestore.find((x) => x.id === item.productId);
      const qty = item.quantity * item.piecesPerUnit;
      if (!p || Number(p.stock || 0) < qty) {
        setMessage(`المخزون غير كافٍ للمنتج: ${item.name}`);
        setProducts(latest);
        return;
      }
    }

    const nextProducts = stockAfterRestore.map((p) => {
      const qty = cart
        .filter((i) => i.productId === p.id)
        .reduce((s, i) => s + i.quantity * i.piecesPerUnit, 0);
      return qty ? { ...p, stock: Number(p.stock || 0) - qty } : p;
    });

    if (!saveProducts(nextProducts)) return setMessage("فشل حفظ المخزون.");

    const closed = {
      ...activeBill,
      items: cart.map((i) => ({ ...i })),
      subtotal,
      discount,
      total,
      paymentMethod: activeBill.paymentMethod || "Cash",
      received: paid,
      change,
      status: "closed",
      closedAt: new Date().toISOString(),
      history: [
        ...(activeBill.history || []),
        {
          date: new Date().toISOString(),
          action: isEditingClosed ? "bill edited and closed" : "sale completed",
          reason: isEditingClosed ? (reason || "Manager edit") : "",
        },
      ],
    };

    const nextBills = bills.map((b) => b.id === closed.id ? closed : b);
    if (persist(nextBills, "")) {
      setProducts(nextProducts);
      setShowPayment(false);
      setReason("");
      setPrintBill(closed);
      setMessage("تم حفظ البون وتحديث المخزون بنجاح.");
    }
  }

  function closeBill() {
    if (!activeBill || !cart.length) return setMessage("البون فارغ.");
    if (activeBill.status === "closed") return;
    if (isEditingClosed) {
      return setMessage("أكمل حفظ التعديل من زر تأكيد البيع.");
    }
    updateBill(activeBill.id, {
      status: "closed",
      items: cart.map((i) => ({ ...i })),
      subtotal,
      discount,
      total,
      paymentMethod: activeBill.paymentMethod,
      received: paid,
      change,
      closedAt: new Date().toISOString(),
    });
    setMessage("تم إغلاق البون دون تسجيل بيع أو خصم جديد من المخزون.");
  }

  function openClosedBill(bill) {
    setPrintBill(bill);
  }

  function printReceipt(bill) {
    setPrintBill(bill);
    setTimeout(() => window.print(), 100);
  }

  function billTotals(bill) {
    const sub = (bill.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
    const disc = Math.min(sub, Math.max(0, Number(bill.discount) || 0));
    return { subtotal: sub, discount: disc, total: Math.max(0, sub - disc) };
  }

  return (
    <div style={styles.page}>
      <style>{`
        .pos-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,370px);gap:16px;align-items:start}
        .pos-panel{padding:17px}
        .pos-cart{position:sticky;top:14px}
        .pos-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .pos-product{border:1px solid #293145;border-radius:12px;background:#151c2b;padding:12px;text-align:left;color:#e9edf6;cursor:pointer;min-width:0}
        .pos-product:hover{border-color:#36d9c3}
        .pos-product:disabled{opacity:.4;cursor:not-allowed}
        .pos-chip{border:1px solid #2a3244;border-radius:8px;background:#151b29;color:#9ba7bd;padding:8px 10px;cursor:pointer;white-space:nowrap;font-size:11px}
        .pos-chip.active{border-color:#36d9c3;color:#36d9c3;background:#12302e}
        .pos-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
        .pos-items{display:flex;flex-direction:column;gap:12px;max-height:390px;overflow:auto}
        .pos-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;border-bottom:1px solid #252c3d;padding-bottom:12px}
        .pos-qty{display:flex;align-items:center;gap:7px;margin-top:8px}
        .pos-qty button{display:flex;align-items:center;justify-content:center;width:27px;height:27px;border:1px solid #30394b;border-radius:7px;background:#1a2232;color:#e9edf6;cursor:pointer}
        .pos-primary{display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:9px;background:#36d9c3;color:#071411;padding:12px;width:100%;font-weight:800;font-size:13px;cursor:pointer}
        .pos-primary:disabled{opacity:.4;cursor:not-allowed}
        .pos-modal{position:fixed;inset:0;z-index:9999;background:#03060dcc;display:flex;align-items:center;justify-content:center;padding:15px}
        .pos-modal-card{width:100%;max-width:440px;background:#111624;border:1px solid #30394b;border-radius:14px;padding:22px;max-height:90vh;overflow:auto}
        @media(max-width:1000px){.pos-layout{grid-template-columns:minmax(0,1fr)}.pos-cart{position:static}}
        @media(max-width:600px){.pos-panel{padding:12px}.pos-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pos-heading{align-items:flex-start!important;flex-direction:column}.pos-grid-art{height:65px!important}}
        @media(max-width:360px){.pos-grid{grid-template-columns:minmax(0,1fr)}}
        @media print{
          body *{visibility:hidden!important}
          #pos-print,#pos-print *{visibility:visible!important}
          #pos-print{position:absolute;left:0;top:0;width:100%;background:white!important;color:black!important;padding:12px!important}
          #pos-print table{width:100%;border-collapse:collapse}
          #pos-print th,#pos-print td{border-bottom:1px solid #aaa;padding:6px;text-align:left;color:black!important}
          .no-print{display:none!important}
          @page{size:auto;margin:8mm}
        }
      `}</style>

      <header className="pos-heading" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:17}}>
        <div>
          <div style={{color:"#36d9c3",fontSize:10,fontWeight:800,letterSpacing:2,marginBottom:6}}>COMMERCE / CHECKOUT</div>
          <h2 style={{fontSize:25,margin:0}}>Point of Sale</h2>
          <p style={{color:"#8996ad",fontSize:12,margin:"6px 0 0"}}>Multi-bill checkout · Inventory connected</p>
        </div>
        <div className="pos-row">
          <button style={styles.button} onClick={createBill}><Plus size={15}/> New Bill</button>
          <button style={styles.button} onClick={()=>requestManager("change-role")}><ShieldCheck size={15}/> {role}</button>
        </div>
      </header>

      {message && <div role="status" style={{padding:11,marginBottom:13,borderRadius:9,background:message.includes("بنجاح")?"#12302e":"#342a18",color:message.includes("بنجاح")?"#36d9c3":"#fbbf24",fontSize:12}}>{message}</div>}

      <section style={{...styles.card,padding:10,marginBottom:15}}>
        <div className="pos-row">
          {bills.map((b)=>(
            <button key={b.id} className={`pos-chip ${b.id===activeId?"active":""}`} onClick={()=>{
              if(b.status==="closed"){openClosedBill(b);return;}
              setActiveId(b.id);localStorage.setItem(ACTIVE_KEY,b.id);setMessage("");
            }}>
              <Receipt size={13} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/>
              Bill {b.number} · {b.status==="closed"?"Closed":b.status==="editing"?"Editing":"Open"}
            </button>
          ))}
        </div>
        <div className="pos-row" style={{marginTop:10}}>
          {activeBill?.status==="open" && <button style={styles.button} onClick={closeBill}><Lock size={14}/> Close Bill</button>}
          {activeBill?.status==="editing" && <span style={{fontSize:11,color:"#fbbf24"}}>Manager edit mode — confirm to save changes</span>}
          {activeBill?.status==="closed" && <button style={styles.button} onClick={()=>requestManager("edit-closed",activeBill)}><Pencil size={14}/> Edit Closed Bill</button>}
          {activeBill?.status==="closed" && <button style={styles.button} onClick={()=>printReceipt(activeBill)}><Printer size={14}/> Print</button>}
        </div>
      </section>

      <div className="pos-layout">
        <section style={styles.card} className="pos-panel">
          <div className="pos-row" style={{justifyContent:"space-between",marginBottom:13}}>
            <div>
              <h3 style={{margin:0,fontSize:16}}>Products</h3>
              <p style={{margin:"5px 0 0",fontSize:11,color:"#8996ad"}}>{filteredProducts.length} products · Page {page} / {pageCount}</p>
            </div>
            <button style={styles.button} onClick={()=>setShowProducts(!showProducts)}>
              {showProducts?<EyeOff size={15}/>:<Eye size={15}/>} {showProducts?"Hide products":"Show products"}
            </button>
          </div>

          <form className="pos-row" style={{marginBottom:10}} onSubmit={(e)=>{e.preventDefault();scanBarcode(barcode);}}>
            <Barcode size={17} color="#36d9c3"/>
            <input style={{...styles.input,flex:1}} value={barcode} onChange={(e)=>setBarcode(e.target.value)} placeholder="Scan or enter barcode / SKU"/>
            <button style={styles.button} type="submit"><ScanBarcode size={15}/> Add</button>
          </form>

          <div style={{position:"relative",marginBottom:12}}>
            <Search size={16} color="#8290a8" style={{position:"absolute",left:12,top:12}}/>
            <input style={{...styles.input,paddingLeft:37}} value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder="Search name, barcode or reference..."/>
          </div>

          {showProducts && <>
            <div className="pos-row" style={{marginBottom:13,flexWrap:"nowrap",overflowX:"auto"}}>
              {categories.map((c)=><button key={c} className={`pos-chip ${category===c?"active":""}`} onClick={()=>{setCategory(c);setPage(1);}}>{c}</button>)}
            </div>
            <div className="pos-grid">
              {visibleProducts.map((p)=>{
                const stock=Number(p.stock||0), color=getColor(p.category);
                return <div key={p.id} className="pos-product" style={{opacity:stock<=0?.45:1}}>
                  <button disabled={stock<=0||!activeBill||activeBill.status==="closed"} onClick={()=>addProduct(p)} style={{border:0,background:"transparent",color:"inherit",padding:0,width:"100%",textAlign:"left",cursor:"pointer"}}>
                    <div className="pos-grid-art" style={{height:75,borderRadius:9,background:`linear-gradient(145deg,${color}25,${color}08)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:9,color}}><ShoppingBag size={30}/></div>
                    <div style={{fontSize:12,fontWeight:700,minHeight:32,lineHeight:1.4}}>{p.name}</div>
                    <div style={{fontSize:10,color:"#8996ad",margin:"5px 0"}}>{p.sku||p.barcode||"No reference"} · Stock {stock}</div>
                    <strong style={{color:"#36d9c3",fontSize:12}}>{money(p.price)}</strong>
                  </button>
                  <div className="pos-row" style={{marginTop:8}}>
                    <button className="pos-chip" disabled={stock<=0} onClick={()=>addProduct(p,"piece")}>+ Unit</button>
                    <button className="pos-chip" disabled={stock<Math.max(1,Number(p.piecesPerCarton)||1)} onClick={()=>addProduct(p,"carton")}>+ Carton</button>
                  </div>
                </div>;
              })}
              {visibleProducts.length===0&&<p style={{gridColumn:"1/-1",textAlign:"center",color:"#8996ad",padding:20}}>No products found.</p>}
            </div>
            <div className="pos-row" style={{justifyContent:"center",marginTop:14}}>
              <button style={styles.button} disabled={page<=1} onClick={()=>setPage((p)=>p-1)}><ChevronLeft size={15}/> Previous</button>
              {Array.from({length:pageCount},(_,i)=>i+1).map(n=><button key={n} className={`pos-chip ${page===n?"active":""}`} onClick={()=>setPage(n)}>{n}</button>)}
              <button style={styles.button} disabled={page>=pageCount} onClick={()=>setPage((p)=>p+1)}>Next <ChevronRight size={15}/></button>
            </div>
          </>}
        </section>

        <section style={styles.card} className="pos-panel pos-cart">
          <div className="pos-row" style={{justifyContent:"space-between",marginBottom:15}}>
            <div className="pos-row"><ShoppingCart color="#36d9c3"/><div><h3 style={{margin:0,fontSize:16}}>Bill {activeBill?.number||"—"}</h3><p style={{margin:"4px 0 0",fontSize:11,color:"#8996ad"}}>{cart.reduce((s,i)=>s+i.quantity,0)} sale units</p></div></div>
            <button style={styles.button} disabled={!cart.length||activeBill?.status==="closed"} onClick={()=>updateItems([])}><Trash2 size={15}/></button>
          </div>

          {!activeBill?<p style={{color:"#8996ad"}}>Open a new bill to start.</p>:cart.length===0?<div style={{textAlign:"center",padding:25,color:"#8996ad"}}><ShoppingCart size={30}/><p>Bill is empty</p></div>:
          <div className="pos-items">{cart.map((item)=>(
            <div className="pos-line" key={item.id}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700}}>{item.name}</div>
                <div style={{fontSize:10,color:"#8996ad",marginTop:4}}>{item.mode==="carton"?"Carton":"Unit"} · {item.piecesPerUnit} piece(s) per sale unit</div>
                <div style={{fontSize:11,color:"#36d9c3",marginTop:4}}>{money(item.price)} / {item.mode==="carton"?"carton":"unit"}</div>
                <div className="pos-qty">
                  <button disabled={activeBill.status==="closed"} onClick={()=>changeQuantity(item.id,-1)}><Minus size={12}/></button>
                  <span>{item.quantity}</span>
                  <button disabled={activeBill.status==="closed"} onClick={()=>changeQuantity(item.id,1)}><Plus size={12}/></button>
                  <button disabled={activeBill.status==="closed"} onClick={()=>removeItem(item.id)} style={{color:"#fb7185"}}><Trash2 size={13}/></button>
                  <button disabled={activeBill.status==="closed"} onClick={()=>requestManager("edit-price",activeBill,item)} title="Manager: edit price"><Pencil size={13}/></button>
                </div>
              </div>
              <strong style={{fontSize:12,whiteSpace:"nowrap"}}>{money(item.price*item.quantity)}</strong>
            </div>
          ))}</div>}

          <div style={{borderTop:"1px solid #252c3d",marginTop:14,paddingTop:14}}>
            <div className="pos-row" style={{justifyContent:"space-between",fontSize:12,marginBottom:12}}><span style={{color:"#9ba7bd"}}>Subtotal</span><strong>{money(subtotal)}</strong></div>
            <label style={{fontSize:11,color:"#9ba7bd"}}>Discount (DA)</label>
            <input style={{...styles.input,margin:"6px 0 13px"}} type="number" min="0" disabled={!activeBill||activeBill.status==="closed"} value={activeBill?.discount??0} onChange={(e)=>updateBill(activeBill.id,{discount:e.target.value})}/>
            <div className="pos-row" style={{justifyContent:"space-between",marginBottom:15}}><strong>Total due</strong><strong style={{fontSize:22,color:"#36d9c3"}}>{money(total)}</strong></div>
            <div style={{fontSize:11,color:"#9ba7bd",marginBottom:8}}>Payment method</div>
            <div className="pos-row" style={{marginBottom:12,flexWrap:"nowrap"}}>
              {[["Cash",Banknote],["Card",CreditCard],["Mobile",Smartphone]].map(([m,Icon])=><button key={m} disabled={!activeBill||activeBill.status==="closed"} className={`pos-chip ${activeBill?.paymentMethod===m?"active":""}`} style={{flex:1}} onClick={()=>updateBill(activeBill.id,{paymentMethod:m})}><Icon size={15}/> {m}</button>)}
            </div>
            {activeBill?.paymentMethod==="Cash"&&<>
              <label style={{fontSize:11,color:"#9ba7bd"}}>Amount received (DA)</label>
              <input style={{...styles.input,margin:"6px 0 10px"}} type="number" min="0" disabled={activeBill.status==="closed"} value={activeBill.received||""} onChange={(e)=>updateBill(activeBill.id,{received:e.target.value})} placeholder={String(total)}/>
              <div className="pos-row" style={{justifyContent:"space-between",fontSize:12,marginBottom:14}}><span style={{color:"#9ba7bd"}}>Change</span><strong style={{color:"#36d9c3"}}>{money(change)}</strong></div>
            </>}
            <button className="pos-primary" disabled={!cart.length||activeBill?.status==="closed"} onClick={()=>setShowPayment(true)}><CreditCard size={17}/> Review and Complete Sale</button>
            {isEditingClosed&&<button style={{...styles.button,width:"100%",marginTop:9}} onClick={()=>{setReason("");setShowPayment(true);}}>Save bill changes</button>}
          </div>
        </section>
      </div>

      {showPayment&&<div className="pos-modal" onClick={()=>setShowPayment(false)}>
        <section className="pos-modal-card" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
          <div className="pos-row" style={{justifyContent:"space-between"}}><h3 style={{margin:0}}>Confirm Bill {activeBill?.number}</h3><button style={styles.button} onClick={()=>setShowPayment(false)}><X size={16}/></button></div>
          <div style={{textAlign:"center",padding:"22px 0"}}><Receipt size={34} color="#36d9c3"/><div style={{fontSize:11,color:"#9ba7bd",marginTop:8}}>Total due</div><div style={{fontSize:30,fontWeight:800,color:"#36d9c3"}}>{money(total)}</div></div>
          {isEditingClosed&&<><label style={{fontSize:12}}>Reason for editing</label><input style={{...styles.input,margin:"6px 0 12px"}} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Required: explain the correction"/></>}
          {activeBill?.paymentMethod==="Cash"&&paid<total&&<p style={{color:"#fbbf24",fontSize:12}}>Received amount is less than the total.</p>}
          <button className="pos-primary" disabled={activeBill?.paymentMethod==="Cash"&&paid<total} onClick={finalizeSale}><CheckCircle2 size={17}/>{isEditingClosed?"Save changes and close bill":"Confirm sale and deduct stock"}</button>
          <button style={{...styles.button,width:"100%",marginTop:9}} onClick={()=>setShowPayment(false)}>Back to bill</button>
        </section>
      </div>}

      {managerDialog&&<div className="pos-modal" onClick={()=>setManagerDialog(null)}>
        <section className="pos-modal-card" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
          <div className="pos-row" style={{justifyContent:"space-between"}}><h3 style={{margin:0}}>Manager authorization</h3><button style={styles.button} onClick={()=>setManagerDialog(null)}><X size={16}/></button></div>
          <p style={{fontSize:12,color:"#9ba7bd"}}>Enter the manager PIN to continue.</p>
          <input style={styles.input} type="password" value={pin} onChange={(e)=>setPin(e.target.value)} placeholder="Manager PIN"/>
          <button className="pos-primary" style={{marginTop:12}} onClick={authorizeManager}><Unlock size={16}/> Authorize</button>
          <p style={{fontSize:10,color:"#8996ad",lineHeight:1.5}}>Initial demo PIN: 1234. Change it before real use. This browser-only PIN is not secure authentication for a multi-user system.</p>
        </section>
      </div>}

      {editItem&&<div className="pos-modal" onClick={()=>setEditItem(null)}>
        <section className="pos-modal-card" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
          <div className="pos-row" style={{justifyContent:"space-between"}}><h3 style={{margin:0}}>Edit sale line</h3><button style={styles.button} onClick={()=>setEditItem(null)}><X size={16}/></button></div>
          <p style={{fontSize:12,color:"#9ba7bd"}}>{editItem.name} · current bill only</p>
          <label style={{fontSize:12}}>Sale price (DA)</label>
          <input style={{...styles.input,margin:"6px 0 12px"}} type="number" min="0" value={editPrice} onChange={(e)=>setEditPrice(e.target.value)}/>
          <label style={{fontSize:12}}>Pieces per sale unit</label>
          <input style={{...styles.input,margin:"6px 0 12px"}} type="number" min="1" value={editPieces} onChange={(e)=>setEditPieces(e.target.value)}/>
          <button className="pos-primary" onClick={saveEditedPrice}><Save size={16}/> Save line</button>
        </section>
      </div>}

      {printBill&&<div className="pos-modal no-print" onClick={()=>setPrintBill(null)}>
        <section className="pos-modal-card" style={{maxWidth:560}} onClick={(e)=>e.stopPropagation()}>
          <div className="pos-row" style={{justifyContent:"space-between"}}><h3 style={{margin:0}}>Bill {printBill.number} · {printBill.id}</h3><button style={styles.button} onClick={()=>setPrintBill(null)}><X size={16}/></button></div>
          <div id="pos-print" style={{background:"#fff",color:"#111",padding:16,marginTop:15,borderRadius:8}}>
            <h2 style={{textAlign:"center",margin:"0 0 5px"}}>VELTRO-PRO</h2>
            <p style={{textAlign:"center",fontSize:12}}>Receipt / Bon de vente</p>
            <p style={{fontSize:12}}>Bill: {printBill.number}<br/>Reference: {printBill.id}<br/>Date: {new Date(printBill.closedAt||printBill.createdAt).toLocaleString("fr-DZ")}</p>
            <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
              {(printBill.items||[]).map((i)=><tr key={i.id}><td>{i.name} ({i.mode})</td><td>{i.quantity}</td><td>{money(i.price)}</td><td>{money(i.price*i.quantity)}</td></tr>)}
            </tbody></table>
            <p>Subtotal: {money(billTotals(printBill).subtotal)}</p>
            <p>Discount: {money(billTotals(printBill).discount)}</p>
            <h3>Total: {money(billTotals(printBill).total)}</h3>
            <p>Payment: {printBill.paymentMethod||"Cash"}</p>
            <p>Thank you / Merci</p>
          </div>
          <button className="pos-primary" style={{marginTop:12}} onClick={()=>window.print()}><Printer size={16}/> Print receipt</button>
          {printBill.status==="closed"&&<button style={{...styles.button,width:"100%",marginTop:8}} onClick={()=>{const b=printBill;setPrintBill(null);requestManager("edit-closed",b);}}> <Pencil size={15}/> Edit closed bill</button>}
        </section>
      </div>}
    </div>
  );
}
