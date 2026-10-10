
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

const INITIAL_PRODUCTS = [
  { id: 1, name: "Premium Coffee", category: "Beverages", price: 450, stock: 24, sku: "PRD-001", color: "#8b6a4f" },
  { id: 2, name: "Mineral Water", category: "Drinks", price: 80, stock: 120, sku: "PRD-002", color: "#4285f4" },
  { id: 3, name: "Chocolate Biscuits", category: "Snacks", price: 120, stock: 45, sku: "PRD-003", color: "#b78353" },
  { id: 4, name: "Orange Juice", category: "Beverages", price: 180, stock: 32, sku: "PRD-004", color: "#f59e0b" },
  { id: 5, name: "Potato Chips", category: "Snacks", price: 100, stock: 38, sku: "PRD-005", color: "#e5b94d" },
  { id: 6, name: "Fresh Milk", category: "Dairy", price: 140, stock: 20, sku: "PRD-006", color: "#a7c9ed" },
  { id: 7, name: "Dark Chocolate", category: "Snacks", price: 250, stock: 17, sku: "PRD-007", color: "#795548" },
  { id: 8, name: "Apple Juice", category: "Beverages", price: 160, stock: 28, sku: "PRD-008", color: "#e46b72" },
  { id: 9, name: "Energy Drink", category: "Drinks", price: 220, stock: 36, sku: "PRD-009", color: "#39bda7" },
  { id: 10, name: "Biscuits Mini", category: "Snacks", price: 50, stock: 80, sku: "PRD-010", color: "#d4a373" },
  { id: 11, name: "Yogurt", category: "Dairy", price: 90, stock: 26, sku: "PRD-011", color: "#c084fc" },
  { id: 12, name: "Sparkling Water", category: "Drinks", price: 110, stock: 42, sku: "PRD-012", color: "#60a5fa" },
];

const CATEGORIES = ["All Products", "Beverages", "Drinks", "Snacks", "Dairy"];

const formatMoney = (value) =>
  `${Number(value).toLocaleString("fr-DZ")} DA`;

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
    padding: "12px",
    color: "#e9edf6",
    outline: "none",
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    fontSize: 13,
  },
};

export default function POS() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Products");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [received, setReceived] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [message, setMessage] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All Products" || product.category === category;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
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

  function addToCart(product) {
    if (product.stock <= 0) {
      setMessage("This product is out of stock.");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          setMessage("Not enough stock for this quantity.");
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setMessage("");
    setLastSale(null);
  }

  function updateQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== id) return item;

          const product = products.find((p) => p.id === id);
          const quantity = item.quantity + amount;

          if (quantity > (product?.stock ?? 0)) {
            setMessage("Not enough stock for this quantity.");
            return item;
          }

          return { ...item, quantity };
        })
        .filter((item) => item.quantity > 0)
    );

    setMessage("");
  }

  function removeItem(id) {
    setCart((current) => current.filter((item) => item.id !== id));
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
      setMessage("Add at least one product to the cart.");
      return;
    }

    if (paymentMethod === "Cash" && paidAmount < total) {
      setMessage("The amount received is less than the total.");
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

    setProducts((current) =>
      current.map((product) => {
        const soldItem = cart.find((item) => item.id === product.id);

        return soldItem
          ? { ...product, stock: product.stock - soldItem.quantity }
          : product;
      })
    );

    setLastSale(sale);
    setCart([]);
    setDiscount("0");
    setReceived("");
    setShowPayment(false);
    setMessage("Sale completed successfully.");
  }

  return (
    <div style={styles.page}>
      <style>{`
        .pos-layout { display:grid; grid-template-columns:minmax(0,1fr) minmax(300px,360px); gap:18px; align-items:start; }
        .pos-products { padding:20px; }
        .pos-cart { padding:20px; position:sticky; top:16px; }
        .pos-product-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
        .pos-product { border:1px solid #293145; border-radius:12px; background:#151c2b; padding:14px; text-align:left; color:#e9edf6; cursor:pointer; min-width:0; transition:border-color .15s, transform .15s; }
        .pos-product:hover { border-color:#36d9c3; transform:translateY(-2px); }
        .pos-category { border:1px solid #2a3244; border-radius:8px; background:#151b29; color:#9ba7bd; padding:9px 12px; cursor:pointer; white-space:nowrap; font-size:12px; }
        .pos-category.active { background:rgba(54,217,195,.12); border-color:#36d9c3; color:#36d9c3; }
        .pos-cart-items { display:flex; flex-direction:column; gap:12px; max-height:340px; overflow-y:auto; }
        .pos-cart-item { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; padding-bottom:12px; border-bottom:1px solid #252c3d; }
        .pos-qty { display:flex; align-items:center; gap:10px; }
        .pos-qty button { display:flex; align-items:center; justify-content:center; width:27px; height:27px; border:1px solid #30394b; border-radius:7px; background:#1a2232; color:#e9edf6; cursor:pointer; }
        .pos-primary { display:flex; align-items:center; justify-content:center; gap:8px; border:0; border-radius:9px; background:#36d9c3; color:#071411; padding:13px; width:100%; font-weight:800; font-size:14px; cursor:pointer; }
        .pos-primary:disabled { opacity:.45; cursor:not-allowed; }
        .pos-pay-option { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:13px 8px; background:#151b29; color:#aab5c9; border:1px solid #30394b; border-radius:10px; cursor:pointer; }
        .pos-pay-option.active { border-color:#36d9c3; background:rgba(54,217,195,.1); color:#36d9c3; }
        .pos-scroll { overflow-x:auto; display:flex; gap:8px; padding-bottom:4px; }
        @media(max-width:1100px) { .pos-layout { grid-template-columns:minmax(0,1fr); } .pos-cart { position:static; } .pos-product-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
        @media(max-width:680px) { .pos-products,.pos-cart { padding:13px; } .pos-product-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; } .pos-product { padding:11px; } .pos-heading { align-items:flex-start !important; flex-direction:column; } .pos-heading-actions { width:100%; } .pos-heading-actions button { flex:1; } .pos-product-art { height:76px !important; } }
        @media(max-width:380px) { .pos-product-grid { grid-template-columns:minmax(0,1fr); } }
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
            background: message.includes("successfully")
              ? "rgba(54,217,195,.1)"
              : "rgba(245,158,11,.1)",
            color: message.includes("successfully") ? "#36d9c3" : "#fbbf24",
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
            {lastSale.paymentMethod === "Cash" ? ` · Change: ${formatMoney(lastSale.change)}` : ""}
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
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="pos-scroll" style={{ marginBottom: 17 }}>
            {CATEGORIES.map((item) => (
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
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                className="pos-product"
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                style={{ opacity: product.stock <= 0 ? 0.5 : 1 }}
              >
                <div
                  className="pos-product-art"
                  style={{
                    height: 95,
                    borderRadius: 9,
                    background: `linear-gradient(145deg, ${product.color}25, ${product.color}08)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    color: product.color,
                  }}
                >
                  <ShoppingBag size={34} strokeWidth={1.4} />
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, minHeight: 36 }}>
                  {product.name}
                </div>

                <div style={{ color: "#8996ad", fontSize: 10, margin: "6px 0 10px" }}>
                  {product.sku} · Stock: {product.stock}
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
            ))}

            {filteredProducts.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 35, color: "#8996ad" }}>
                No products found.
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
              onClick={() => setShowPayment(true)}
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
              Demo mode: this sale updates the sample stock in this page only.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
