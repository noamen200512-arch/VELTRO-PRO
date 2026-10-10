import React, { useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Trash2,
  Package,
  ScanBarcode,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Boxes,
} from "lucide-react";

const initialProducts = [
  { id: 1, name: "Premium Coffee", category: "Boissons", sku: "PRD-001", barcode: "613001000001", price: 450, cartonQty: 12, cartonPrice: 5100, stock: 245, icon: "☕", color: "coffee" },
  { id: 2, name: "Mineral Water", category: "Boissons", sku: "PRD-002", barcode: "613001000002", price: 80, cartonQty: 12, cartonPrice: 900, stock: 180, icon: "💧", color: "water" },
  { id: 3, name: "Chocolate Biscuits", category: "Biscuits", sku: "PRD-003", barcode: "613001000003", price: 120, cartonQty: 24, cartonPrice: 2700, stock: 156, icon: "🍪", color: "biscuit" },
  { id: 4, name: "Orange Juice", category: "Boissons", sku: "PRD-004", barcode: "613001000004", price: 180, cartonQty: 6, cartonPrice: 1000, stock: 90, icon: "🧃", color: "juice" },
  { id: 5, name: "Potato Chips", category: "Snacks", sku: "PRD-005", barcode: "613001000005", price: 100, cartonQty: 20, cartonPrice: 1800, stock: 82, icon: "🍟", color: "chips" },
  { id: 6, name: "Milk", category: "Produits laitiers", sku: "PRD-006", barcode: "613001000006", price: 150, cartonQty: 12, cartonPrice: 1650, stock: 72, icon: "🥛", color: "milk" },
  { id: 7, name: "Chocolate Bar", category: "Snacks", sku: "PRD-007", barcode: "613001000007", price: 130, cartonQty: 24, cartonPrice: 2900, stock: 110, icon: "🍫", color: "chocolate" },
  { id: 8, name: "Tomato Paste", category: "Épicerie", sku: "PRD-008", barcode: "613001000008", price: 140, cartonQty: 12, cartonPrice: 1550, stock: 64, icon: "🥫", color: "tomato" },
];

const categories = ["Tous", ...new Set(initialProducts.map((p) => p.category))];

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-DZ")} DA`;

export default function POS() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [unit, setUnit] = useState("piece");
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState("cash");
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState(1001);
  const [showReceipt, setShowReceipt] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Tous" || product.category === category;

      const matchesSearch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.sku.toLowerCase().includes(normalized) ||
        product.barcode.includes(normalized);

      return matchesCategory && matchesSearch;
    });
  }, [products, query, category]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function openProduct(product) {
    setSelectedProduct(product);
    setUnit("piece");
    setQuantity(1);
  }

  function addToCart() {
    if (!selectedProduct || quantity < 1) return;

    const product = selectedProduct;
    const itemUnit = unit;
    const itemPrice =
      itemUnit === "carton" ? product.cartonPrice : product.price;

    const availableUnits =
      itemUnit === "carton"
        ? Math.floor(product.stock / product.cartonQty)
        : product.stock;

    if (quantity > availableUnits) {
      window.alert("Stock insuffisant pour cette quantité.");
      return;
    }

    const key = `${product.id}-${itemUnit}`;

    setCart((current) => {
      const existing = current.find((item) => item.key === key);

      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...current,
        {
          key,
          productId: product.id,
          name: product.name,
          unit: itemUnit,
          unitLabel: itemUnit === "carton" ? "Carton" : "Pièce",
          price: itemPrice,
          quantity,
          cartonQty: product.cartonQty,
        },
      ];
    });

    setSelectedProduct(null);
  }

  function changeQuantity(key, change) {
    setCart((current) =>
      current
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(key) {
    setCart((current) => current.filter((item) => item.key !== key));
  }

  function completeSale() {
    if (!cart.length) {
      window.alert("Ajoutez au moins un produit au panier.");
      return;
    }

    const insufficient = cart.some((item) => {
      const product = products.find((p) => p.id === item.productId);
      const needed = item.quantity * (
        item.unit === "carton" ? item.cartonQty : 1
      );
      return !product || needed > product.stock;
    });

    if (insufficient) {
      window.alert("Le stock a changé ou est insuffisant. Vérifiez le panier.");
      return;
    }

    const receipt = {
      number: receiptNumber,
      items: cart.map((item) => ({ ...item })),
      total,
      payment,
      date: new Date().toLocaleString("fr-DZ"),
    };

    setProducts((current) =>
      current.map((product) => {
        const sold = cart
          .filter((item) => item.productId === product.id)
          .reduce(
            (sum, item) =>
              sum +
              item.quantity *
                (item.unit === "carton" ? item.cartonQty : 1),
            0
          );

        return { ...product, stock: product.stock - sold };
      })
    );

    setCompletedReceipt(receipt);
    setReceiptNumber((number) => number + 1);
    setCart([]);
    setShowReceipt(true);
  }

  function startNewSale() {
    setShowReceipt(false);
    setCompletedReceipt(null);
    setQuery("");
    setCategory("Tous");
    setPayment("cash");
  }

  return (
    <section className="pos-page">
      <header className="pos-heading">
        <div>
          <div className="pos-eyebrow">
            <span className="pos-live-dot" />
            VELTRO COMMERCE
          </div>
          <h1>Point de <span>Vente</span></h1>
          <p>Gérez vos ventes et encaissez en toute simplicité.</p>
        </div>

        <div className="pos-heading-badge">
          <span className="pos-live-dot" />
          Caisse active
        </div>
      </header>

      <div className="pos-workspace">
        <section className="pos-catalog">
          <div className="pos-search-row">
            <label className="pos-search">
              <Search size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un produit, SKU ou code-barres..."
              />
              <ScanBarcode size={20} className="pos-search-scan" />
            </label>
          </div>

          <div className="pos-category-row">
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

          <div className="pos-catalog-title">
            <div>
              <h2>Catalogue produits</h2>
              <p>{filteredProducts.length} produits disponibles dans la liste</p>
            </div>
            <div className="pos-catalog-icon">
              <Boxes size={19} />
            </div>
          </div>

          <div className="pos-product-grid">
            {filteredProducts.map((product) => (
              <button
                className="pos-product-card"
                key={product.id}
                onClick={() => openProduct(product)}
                disabled={product.stock <= 0}
              >
                <div className={`pos-product-art ${product.color}`}>
                  <span>{product.icon}</span>
                  <span className="pos-product-plus"><Plus size={17} /></span>
                </div>
                <div className="pos-product-info">
                  <span className="pos-product-category">{product.category}</span>
                  <strong>{product.name}</strong>
                  <div className="pos-product-bottom">
                    <span className="pos-product-price">{money(product.price)}</span>
                    <span className={`pos-stock ${product.stock < 15 ? "low" : ""}`}>
                      {product.stock} pcs
                    </span>
                  </div>
                  <span className="pos-carton-hint">
                    Carton de {product.cartonQty}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="pos-empty">
              <Package size={28} />
              <strong>Aucun produit trouvé</strong>
              <span>Essayez un autre nom, code ou catégorie.</span>
            </div>
          )}
        </section>

        <aside className="pos-cart-panel">
          <div className="pos-cart-header">
            <div className="pos-cart-title">
              <div className="pos-cart-icon"><ShoppingCart size={19} /></div>
              <div>
                <h2>Panier</h2>
                <p>Nouvelle vente</p>
              </div>
            </div>
            <span className="pos-cart-count">{itemCount} article(s)</span>
          </div>

          <div className="pos-receipt-meta">
            <span>Ticket provisoire</span>
            <strong>#{receiptNumber}</strong>
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div className="pos-cart-empty">
                <div><ShoppingCart size={25} /></div>
                <strong>Votre panier est vide</strong>
                <span>Sélectionnez un produit pour commencer.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div className="pos-cart-item" key={item.key}>
                  <div className="pos-cart-item-main">
                    <div className="pos-cart-item-art">
                      {item.unit === "carton" ? "📦" : "🛍️"}
                    </div>
                    <div className="pos-cart-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.unitLabel} · {money(item.price)}</span>
                    </div>
                    <button
                      className="pos-remove-item"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Retirer ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="pos-cart-item-bottom">
                    <div className="pos-quantity-control">
                      <button onClick={() => changeQuantity(item.key, -1)}>
                        <Minus size={13} />
                      </button>
                      <strong>{item.quantity}</strong>
                      <button onClick={() => changeQuantity(item.key, 1)}>
                        <Plus size={13} />
                      </button>
                    </div>
                    <strong className="pos-line-total">
                      {money(item.price * item.quantity)}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pos-cart-summary">
            <div><span>Sous-total</span><strong>{money(total)}</strong></div>
            <div><span>Remise</span><strong>{money(0)}</strong></div>
            <div className="pos-total-row"><span>Total à payer</span><strong>{money(total)}</strong></div>
          </div>

          <div className="pos-payment-title">Mode de paiement</div>
          <div className="pos-payment-options">
            <button
              className={payment === "cash" ? "selected" : ""}
              onClick={() => setPayment("cash")}
            >
              <Banknote size={17} />
              <span>Espèces</span>
            </button>
            <button
              className={payment === "card" ? "selected" : ""}
              onClick={() => setPayment("card")}
            >
              <CreditCard size={17} />
              <span>Carte</span>
            </button>
            <button
              className={payment === "mobile" ? "selected" : ""}
              onClick={() => setPayment("mobile")}
            >
              <Smartphone size={17} />
              <span>Mobile</span>
            </button>
          </div>

          <button
            className="pos-checkout-button"
            onClick={completeSale}
            disabled={cart.length === 0}
          >
            <span>Encaisser la vente</span>
            <strong>{money(total)}</strong>
            <ArrowRight size={18} />
          </button>

          <button
            className="pos-clear-button"
            onClick={() => {
              if (cart.length && window.confirm("Vider tout le panier ?")) {
                setCart([]);
              }
            }}
            disabled={cart.length === 0}
          >
            <RotateCcw size={14} /> Vider le panier
          </button>
        </aside>
      </div>

      {selectedProduct && (
        <div className="pos-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <section
            className="pos-product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="pos-modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fermer"
            >
              <X size={19} />
            </button>

            <div className={`pos-modal-art ${selectedProduct.color}`}>
              <span>{selectedProduct.icon}</span>
            </div>

            <span className="pos-product-category">{selectedProduct.category}</span>
            <h2>{selectedProduct.name}</h2>
            <p className="pos-modal-sku">
              Référence : {selectedProduct.sku} · Stock : {selectedProduct.stock} pièces
            </p>

            <div className="pos-unit-label">Choisir l'unité de vente</div>
            <div className="pos-unit-options">
              <button
                className={unit === "piece" ? "selected" : ""}
                onClick={() => {
                  setUnit("piece");
                  setQuantity(1);
                }}
              >
                <span>À la pièce</span>
                <strong>{money(selectedProduct.price)}</strong>
              </button>
              <button
                className={unit === "carton" ? "selected" : ""}
                onClick={() => {
                  setUnit("carton");
                  setQuantity(1);
                }}
              >
                <span>À la cartonne</span>
                <strong>{money(selectedProduct.cartonPrice)}</strong>
                <small>{selectedProduct.cartonQty} pièces / carton</small>
              </button>
            </div>

            <div className="pos-modal-quantity-row">
              <div>
                <strong>Quantité</strong>
                <span>{unit === "carton" ? "Cartons" : "Pièces"}</span>
              </div>
              <div className="pos-quantity-control large">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus size={15} />
                </button>
                <strong>{quantity}</strong>
                <button onClick={() => setQuantity((q) => q + 1)}>
                  <Plus size={15} />
                </button>
              </div>
            </div>

            <div className="pos-modal-total">
              <span>Total de la ligne</span>
              <strong>
                {money(
                  quantity *
                    (unit === "carton"
                      ? selectedProduct.cartonPrice
                      : selectedProduct.price)
                )}
              </strong>
            </div>

            <button
              className="pos-checkout-button"
              onClick={addToCart}
              disabled={
                quantity >
                (unit === "carton"
                  ? Math.floor(selectedProduct.stock / selectedProduct.cartonQty)
                  : selectedProduct.stock)
              }
            >
              <Plus size={18} />
              Ajouter au panier
            </button>
          </section>
        </div>
      )}

      {showReceipt && completedReceipt && (
        <div className="pos-modal-backdrop">
          <section className="pos-receipt-modal">
            <div className="pos-success-icon"><CheckCircle2 size={30} /></div>
            <h2>Vente enregistrée</h2>
            <p className="pos-receipt-subtitle">Le ticket de démonstration a été créé.</p>
            <div className="pos-receipt-number">Ticket #{completedReceipt.number}</div>
            <div className="pos-receipt-lines">
              {completedReceipt.items.map((item, index) => (
                <div key={`${item.key}-${index}`}>
                  <span>{item.name} × {item.quantity} ({item.unitLabel})</span>
                  <strong>{money(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="pos-receipt-total">
              <span>Total encaissé</span>
              <strong>{money(completedReceipt.total)}</strong>
            </div>
            <p className="pos-receipt-payment">
              Paiement : {completedReceipt.payment === "cash"
                ? "Espèces"
                : completedReceipt.payment === "card" ? "Carte" : "Mobile"}
            </p>
            <button className="pos-checkout-button" onClick={startNewSale}>
              Nouvelle vente <ArrowRight size={18} />
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
