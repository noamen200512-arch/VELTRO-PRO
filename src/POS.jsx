
import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  ScanBarcode,
  X,
  CheckCircle2,
  Receipt,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";

import { getProducts, saveProducts } from "./productStore.js";

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("fr-DZ")} DA`;

const getProductColor = (category = "") => {
  const value = category.toLowerCase();

  if (value.includes("drink") || value.includes("beverage")) return "#60a5fa";
  if (value.includes("snack") || value.includes("biscuit")) return "#d4a373";
  if (value.includes("dairy") || value.includes("milk")) return "#a7c9ed";
  if (value.includes("coffee")) return "#8b6a4f";

  return "#36d9c3";
};

const styles = {
  page: {
    color: "#e9edf6",
    fontFamily: "Inter, system-ui, sans-serif",
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
    gap: 8,
    border: "1px solid #30394b",
    background: "#171e2d",
    color: "#dce4f2",
    borderRadius: 9,
    padding: "10px 13px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    background: "#0c111d",
    border: "1px solid #2a3244",
    borderRadius: 9,
    padding: 12,
    color: "#e9edf6",
    outline: "none",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    fontSize: 13,
  },
};

export default function POS() {
  const [products, setProducts] = useState(() => getProducts());
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Products");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [message, setMessage] = useState("");

  const categories = useMemo(
    () => [
      "All Products",
      ...new Set(
        products.map((product) => product.category || "General")
      ),
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All Products" ||
        (product.category || "General") === category;

      const matchesSearch =
        !query ||
        String(product.name || "").toLowerCase().includes(query) ||
        String(product.sku || "").toLowerCase().includes(query) ||
        String(product.barcode || "").toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );

  const discountValue = Math.min(
    subtotal,
    Math.max(0, Number(discount) || 0)
  );

  const total = subtotal - discountValue;

  const paidAmount =
    paymentMethod === "Cash" ? Number(received) || 0 : total;

  const change = Math.max(0, paidAmount - total);

  function refreshProducts() {
    const latest = getProducts();
    setProducts(latest);
    return latest;
  }

  function addToCart(product) {
    const latestProducts = refreshProducts();
    const currentProduct = latestProducts.find(
      (item) => item.id === product.id
    );

    if (!currentProduct) {
      setMessage("المنتج غير موجود في المخزون. حدّث الصفحة وحاول مجددًا.");
      return;
    }

    const stock = Number(currentProduct.stock || 0);

    if (stock <= 0) {
      setMessage("هذا المنتج غير متوفر في المخزون.");
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.id === currentProduct.id
      );

      if (existing) {
        if (existing.quantity >= stock) {
          setMessage("الكمية المطلوبة أكبر من المخزون المتوفر.");
          return current;
        }

        return current.map((item) =>
          item.id === currentProduct.id
            ? {
                ...item,
                price: Number(currentProduct.price || 0),
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...currentProduct,
          price: Number(currentProduct.price || 0),
          stock,
          quantity: 1,
        },
      ];
    });

    setMessage("");
    setLastSale(null);
  }

  function updateQuantity(id, amount) {
    const latestProducts = getProducts();
    const product = latestProducts.find((item) => item.id === id);

    if (!product) {
      setMessage("لم يتم العثور على المنتج في المخزون.");
      return;
    }

    const availableStock = Number(product.stock || 0);

    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;

          const quantity = item.quantity + amount;

          if (quantity > availableStock) {
            setMessage("لا توجد كمية كافية في المخزون.");
            return item;
          }

          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0)
    );

    if (amount < 0) setMessage("");
  }

  function removeItem(id) {
    setCart((current) => current.filter((item) => item.id !== id));
    setMessage("");
  }

  function clearCart() {
    setCart([]);
    setDiscount("0");
    setReceived("");
    setMessage("");
    setShowPayment(false);
  }

  function completeSale() {
    if (!cart.length) {
      setMessage("أضف منتجًا واحدًا على الأقل إلى السلة.");
      return;
    }

    if (paymentMethod === "Cash" && paidAmount < total) {
      setMessage("المبلغ المستلم أقل من إجمالي الفاتورة.");
      return;
    }

    // Read the latest inventory before completing the sale.
    const latestProducts = getProducts();

    for (const item of cart) {
      const currentProduct = latestProducts.find(
        (product) => product.id === item.id
      );

      if (!currentProduct) {
        setMessage(`المنتج "${item.name}" لم يعد موجودًا في المخزون.`);
        setProducts(latestProducts);
        return;
      }

      if (Number(currentProduct.stock || 0) < item.quantity) {
        setMessage(
          `الكمية المتوفرة من "${item.name}" غير كافية. حدّث السلة وحاول مجددًا.`
        );
        setProducts(latestProducts);
        return;
      }
    }

    const nextProducts = latestProducts.map((product) => {
      const soldItem = cart.find((item) => item.id === product.id);

      if (!soldItem) return product;

      return {
        ...product,
        stock: Number(product.stock || 0) - soldItem.quantity,
      };
    });

    // Do not complete the sale if saving the shared stock fails.
    if (!saveProducts(nextProducts)) {
      setMessage("تعذر حفظ المخزون. لم يتم تأكيد البيع.");
      return;
    }

    const sale = {
      id: `VLT-${Date.now().toString().slice(-7)}`,
      date: new Date().toLocaleString("fr-DZ"),
      items: cart.map((item) => ({ ...item })),
      subtotal,
      discount: discountValue,
      total,
      paymentMethod,
      received: paidAmount,
      change,
    };

    setProducts(nextProducts);
    setLastSale(sale);
    setCart([]);
    setDiscount("0");
    setReceived("");
    setShowPayment(false);
    setMessage("تم إتمام البيع وتحديث المخزون بنجاح.");
  }

  return (
    <div style={styles.page}>
      <style>{`
        .pos-layout {
          display:grid;
          grid-template-columns:minmax(0,1fr) minmax(300px,360px);
          gap:18px;
          align-items:start;
        }
        .pos-products { padding:20px; }
        .pos-cart { padding:20px; position:sticky; top:16px; }
        .pos-product-grid {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:12px;
        }
        .pos-product {
          border:1px solid #293145;
          border-radius:12px;
          background:#151c2b;
          padding:14px;
          text-align:left;
          color:#e9edf6;
          cursor:pointer;
          min-width:0;
          transition:border-color .15s, transform .15s;
        }
        .pos-product:hover {
          border-color:#36d9c3;
          transform:translateY(-2px);
        }
        .pos-product:disabled {
          cursor:not-allowed;
          transform:none;
        }
        .pos-category {
          border:1px solid #2a3244;
          border-radius:8px;
          background:#151b29;
          color:#9ba7bd;
          padding:9px 12px;
          cursor:pointer;
          white-space:nowrap;
          font-size:12px;
        }
        .pos-category.active {
          background:rgba(54,217,195,.12);
          border-color:#36d9c3;
          color:#36d9c3;
        }
        .pos-cart-items {
          display:flex;
          flex-direction:column;
          gap:12px;
          max-height:340px;
          overflow-y:auto;
        }
        .pos-cart-item {
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          gap:8px;
          padding-bottom:12px;
          border-bottom:1px solid #252c3d;
        }
        .pos-qty {
          display:flex;
          align-items:center;
          gap:10px;
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
          padding:13px;
          width:100%;
          font-weight:800;
          font-size:14px;
          cursor:pointer;
        }
        .pos-primary:disabled {
          opacity:.45;
          cursor:not-allowed;
        }
        .pos-pay-option {
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          gap:8px;
          padding:13px 8px;
          background:#151b29;
          color:#aab5c9;
          border:1px solid #30394b;
          border-radius:10px;
          cursor:pointer;
        }
        .pos-pay-option.active {
          border-color:#36d9c3;
          background:rgba(54,217,195,.1);
          color:#36d9c3;
        }
        .pos-scroll {
          overflow-x:auto;
          display:flex;
          gap:8px;
          padding-bottom:4px;
        }
        @media(max-width:1100px) {
          .pos-layout { grid-template-columns:minmax(0,1fr); }
          .pos-cart { position:static; }
          .pos-product-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media(max-width:680px) {
          .pos-products,.pos-cart { padding:13px; }
          .pos-product-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
          .pos-product { padding:11px; }
          .pos-heading { align-items:flex-start !important; flex-direction:column; }
          .pos-heading-actions { width:100%; }
          .pos-heading-actions button { flex:1; }
          .pos-product-art { height:76px !important; }
        }
        @media(max-width:380px) {
          .pos-product-grid { grid-template-columns:minmax(0,1fr); }
        }
      `}</style>

      <div
        className="pos-heading"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div>
          <div style={{ color: "#36d9c3", fontSize: 11, fontWeight: 800, letterSpacing: 2, marginBottom: 7 }}>
            COMMERCE / CHECKOUT
          </div>
          <h2 style={{ fontSize: 25, margin: 0, letterSpacing: -0.7 }}>
            Point of Sale
          </h2>
          <p style={{ color: "#8f9bb1", fontSize: 13, margin: "7px 0 0" }}>
            Create sales and process customer payments.
          </p>
        </div>

        <div className="pos-heading-actions" style={{ display: "flex", gap: 9 }}>
          <button style={styles.button} onClick={clearCart}>
            <RotateCcw size={15} />
            New Sale
          </button>
          <div style={{ ...styles.button, color: "#36d9c3", borderColor: "#254b49" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#36d9c3" }} />
            Register Open
          </div>
        </div>
      </div>

      {message && (
        <div
          role="status"
          style={{
            padding: "11px 14px",
            marginBottom: 15,
            borderRadius: 9,
            background: message.includes("بنجاح")
              ? "rgba(54,217,195,.1)"
              : "rgba(245,158,11,.1)",
            color: message.includes("بنجاح") ? "#36d9c3" : "#fbbf24",
            border: "1px solid #30394b",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      {lastSale && (
        <div style={{ ...styles.card, padding: 16, marginBottom: 16, borderColor: "#28665e" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle2 color="#36d9c3" size={22} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: "#36d9c3" }}>Sale completed</strong>
              <p style={{ color: "#9ba7bd", fontSize: 12, margin: "5px 0" }}>
                Receipt {lastSale.id} · {lastSale.date}
              </p>
            </div>
            <strong>{formatMoney(lastSale.total)}</strong>
          </div>
          <p style={{ fontSize: 12, color: "#9ba7bd", marginBottom: 0 }}>
            Payment: {lastSale.paymentMethod}
            {lastSale.paymentMethod === "Cash"
              ? ` · Change: ${formatMoney(lastSale.change)}`
              : ""}
          </p>
        </div>
      )}

      <div className="pos-layout">
        <section style={styles.card} className="pos-products">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>Products</h3>
              <p style={{ margin: "5px 0 0", color: "#8f9bb1", fontSize: 12 }}>
                {filteredProducts.length} products available
              </p>
            </div>
            <div style={{ color: "#36d9c3", background: "rgba(54,217,195,.1)", padding: 10, borderRadius: 10 }}>
              <Package size={20} />
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 15 }}>
            <Search size={17} color="#8290a8" style={{ position: "absolute", left: 13, top: 13 }} />
            <input
              style={{ ...styles.input, paddingLeft: 39 }}
              placeholder="Search product name, SKU or barcode..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="pos-scroll" style={{ marginBottom: 17 }}>
            {categories.map((item) => (
              <button
                key={item}
                className={`pos-category ${category === item ? "active" : ""}`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="pos-product-grid">
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const color = getProductColor(product.category);

              return (
                <button
                  key={product.id}
                  className="pos-product"
                  onClick={() => addToCart(product)}
                  disabled={stock <= 0}
                  style={{ opacity: stock <= 0 ? 0.5 : 1 }}
                >
                  <div
                    className="pos-product-art"
                    style={{
                      height: 95,
                      borderRadius: 9,
                      background: `linear-gradient(145deg, ${color}25, ${color}08)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                      color,
                    }}
                  >
                    <ShoppingBag size={34} strokeWidth={1.4} />
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, minHeight: 36 }}>
                    {product.name}
                  </div>

                  <div style={{ color: "#8996ad", fontSize: 10, margin: "6px 0 10px" }}>
                    {product.sku || product.barcode || "No reference"} · Stock: {stock}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                    <strong style={{ color: "#36d9c3", fontSize: 13 }}>
                      {formatMoney(product.price)}
                    </strong>
                    <span style={{ background: "#243c3a", color: "#36d9c3", padding: 4, borderRadius: 6, display: "flex" }}>
                      <Plus size={14} />
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 35, color: "#8996ad" }}>
                No products found. Add products from the Products section first.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#77849a", fontSize: 11, borderTop: "1px solid #252c3d", paddingTop: 14 }}>
            <ScanBarcode size={16} />
            Select a product to add it to the current sale.
          </div>
        </section>

        <section style={styles.card} className="pos-cart">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 17 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(54,217,195,.12)", color: "#36d9c3", borderRadius: 9, padding: 10 }}>
                <ShoppingCart size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, margin: 0 }}>Current Sale</h3>
                <p style={{ color: "#8996ad", fontSize: 11, margin: "5px 0 0" }}>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </p>
              </div>
            </div>
            <button
              style={{ ...styles.button, padding: 8 }}
              onClick={clearCart}
              title="Clear cart"
              aria-label="Clear cart"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div style={{ borderTop: "1px solid #252c3d", paddingTop: 15, marginBottom: 14 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 8px", color: "#8996ad" }}>
                <ShoppingCart size={32} style={{ marginBottom: 10, opacity: 0.6 }} />
                <p style={{ fontSize: 13, margin: 0 }}>Your cart is empty</p>
                <p style={{ fontSize: 11, marginTop: 6 }}>Choose products to start a sale.</p>
              </div>
            ) : (
              <div className="pos-cart-items">
                {cart.map((item) => (
                  <div className="pos-cart-item" key={item.id}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#8996ad", marginTop: 5 }}>
                        {formatMoney(item.price)} each
                      </div>
                      <div className="pos-qty" style={{ marginTop: 9 }}>
                        <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}>
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: 12, minWidth: 12, textAlign: "center" }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}>
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          style={{ marginLeft: 3, color: "#fb7185" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <strong style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {formatMoney(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid #252c3d", paddingTop: 15 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
              <span style={{ fontSize: 12, color: "#9ba7bd" }}>Subtotal</span>
              <strong style={{ fontSize: 13 }}>{formatMoney(subtotal)}</strong>
            </div>

            <label style={{ display: "block", fontSize: 12, color: "#9ba7bd", marginBottom: 7 }}>
              Discount (DA)
            </label>
            <input
              style={{ ...styles.input, marginBottom: 13 }}
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              placeholder="0"
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 17 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Total due</span>
              <strong style={{ fontSize: 23, color: "#36d9c3" }}>{formatMoney(total)}</strong>
            </div>

            <div style={{ fontSize: 12, color: "#9ba7bd", marginBottom: 10 }}>Payment method</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginBottom: 15 }}>
              {[
                { name: "Cash", label: "Cash", Icon: Banknote },
                { name: "Card", label: "Card", Icon: CreditCard },
                { name: "Mobile", label: "Mobile", Icon: Smartphone },
              ].map(({ name, label, Icon }) => (
                <button
                  key={name}
                  className={`pos-pay-option ${paymentMethod === name ? "active" : ""}`}
                  onClick={() => setPaymentMethod(name)}
                >
                  <Icon size={19} />
                  <span style={{ fontSize: 11 }}>{label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === "Cash" && (
              <>
                <label style={{ display: "block", fontSize: 12, color: "#9ba7bd", marginBottom: 7 }}>
                  Amount received (DA)
                </label>
                <input
                  style={{ ...styles.input, marginBottom: 12 }}
                  type="number"
                  min="0"
                  value={received}
                  onChange={(event) => setReceived(event.target.value)}
                  placeholder={`e.g. ${total}`}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15, fontSize: 12 }}>
                  <span style={{ color: "#9ba7bd" }}>Change due</span>
                  <strong style={{ color: "#36d9c3" }}>{formatMoney(change)}</strong>
                </div>
              </>
            )}

            <button
              className="pos-primary"
              onClick={() => {
                setMessage("");
                setShowPayment(true);
              }}
              disabled={cart.length === 0}
            >
              <CreditCard size={18} />
              Proceed to Payment
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#77849a", fontSize: 10, marginTop: 12 }}>
              <Receipt size={13} />
              Review your sale before confirming.
            </div>
          </div>
        </section>
      </div>

      {showPayment && (
        <div
          role="presentation"
          onClick={() => setShowPayment(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(3,6,13,.78)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              ...styles.card,
              width: "100%",
              maxWidth: 420,
              padding: 24,
              boxShadow: "0 25px 100px rgba(0,0,0,.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 id="pos-confirm-title" style={{ margin: 0, fontSize: 19 }}>Confirm Sale</h3>
              <button style={styles.button} onClick={() => setShowPayment(false)} aria-label="Close dialog">
                <X size={17} />
              </button>
            </div>

            <div style={{ textAlign: "center", padding: "25px 0" }}>
              <div style={{ color: "#36d9c3", marginBottom: 10 }}>
                <Receipt size={38} style={{ margin: "0 auto" }} />
              </div>
              <div style={{ fontSize: 12, color: "#9ba7bd" }}>Amount to charge</div>
              <div style={{ fontSize: 31, fontWeight: 800, color: "#36d9c3", marginTop: 7 }}>
                {formatMoney(total)}
              </div>
              <div style={{ color: "#9ba7bd", fontSize: 12, marginTop: 8 }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items · {paymentMethod}
              </div>
            </div>

            {paymentMethod === "Cash" && paidAmount < total && (
              <p style={{ color: "#fbbf24", fontSize: 12, textAlign: "center" }}>
                The received amount does not cover the total.
              </p>
            )}

            <button
              className="pos-primary"
              onClick={completeSale}
              disabled={paymentMethod === "Cash" && paidAmount < total}
            >
              <CheckCircle2 size={18} />
              Confirm and Complete Sale
            </button>

            <button
              style={{ ...styles.button, width: "100%", marginTop: 9 }}
              onClick={() => setShowPayment(false)}
            >
              Back to cart
            </button>

            <p style={{ fontSize: 10, lineHeight: 1.5, color: "#77849a", textAlign: "center", marginBottom: 0, marginTop: 14 }}>
              Inventory is saved in the shared product storage.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
