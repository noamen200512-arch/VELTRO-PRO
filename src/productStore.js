
import React, { useMemo, useState } from "react";
import {
  Search, Plus, Package, AlertTriangle, Boxes, Wallet,
  Pencil, Trash2, X, Save, RefreshCw
} from "lucide-react";
import {
  getProducts,
  saveProducts,
  createProductId,
} from "./productStore";

const EMPTY_PRODUCT = {
  name: "",
  sku: "",
  barcode: "",
  category: "General",
  purchasePrice: "0",
  price: "0",
  cartonPrice: "0",
  wholesalePrice: "0",
  piecesPerCarton: "1",
  stock: "0",
  minStock: "5",
  unit: "piece",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-DZ")} DA`;

export default function Products() {
  const [products, setProducts] = useState(() => getProducts());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const persist = (next) => {
    if (!saveProducts(next)) {
      setError("تعذر حفظ البيانات. تحقق من مساحة التخزين في المتصفح.");
      return false;
    }

    setProducts(next);
    setError("");
    return true;
  };

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        String(product.name || "").toLowerCase().includes(normalized) ||
        String(product.sku || "").toLowerCase().includes(normalized) ||
        String(product.barcode || "").toLowerCase().includes(normalized);

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category || "General")),
  ];

  const lowStockCount = products.filter(
    (product) => Number(product.stock) <= Number(product.minStock)
  ).length;

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + Number(product.purchasePrice || 0) * Number(product.stock || 0),
    0
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      ...EMPTY_PRODUCT,
      ...product,
      purchasePrice: String(product.purchasePrice ?? 0),
      price: String(product.price ?? 0),
      cartonPrice: String(product.cartonPrice ?? 0),
      wholesalePrice: String(product.wholesalePrice ?? 0),
      piecesPerCarton: String(product.piecesPerCarton ?? 1),
      stock: String(product.stock ?? 0),
      minStock: String(product.minStock ?? 5),
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("أدخل اسم المنتج.");
      return;
    }

    if (!form.sku.trim()) {
      setError("أدخل مرجع المنتج.");
      return;
    }

    const duplicate = products.find(
      (product) =>
        product.id !== editingId &&
        (
          String(product.sku || "").toLowerCase() === form.sku.trim().toLowerCase() ||
          (form.barcode.trim() &&
            String(product.barcode || "") === form.barcode.trim())
        )
    );

    if (duplicate) {
      setError("مرجع المنتج أو الباركود مستخدم بالفعل.");
      return;
    }

    const numericFields = [
      "purchasePrice", "price", "cartonPrice", "wholesalePrice",
      "piecesPerCarton", "stock", "minStock",
    ];

    for (const field of numericFields) {
      const value = Number(form[field]);

      if (!Number.isFinite(value) || value < 0) {
        setError("تأكد من أن الأسعار والكميات أرقام صحيحة غير سالبة.");
        return;
      }
    }

    if (Number(form.piecesPerCarton) < 1) {
      setError("عدد القطع في الكرتون يجب أن يكون واحدًا على الأقل.");
      return;
    }

    const product = {
      ...form,
      id: editingId || createProductId(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim() || "General",
      purchasePrice: Number(form.purchasePrice),
      price: Number(form.price),
      cartonPrice: Number(form.cartonPrice),
      wholesalePrice: Number(form.wholesalePrice),
      piecesPerCarton: Number(form.piecesPerCarton),
      stock: Number(form.stock),
      minStock: Number(form.minStock),
      unit: form.unit || "piece",
    };

    const next = editingId
      ? products.map((item) => item.id === editingId ? product : item)
      : [product, ...products];

    if (persist(next)) {
      setModalOpen(false);
      setNotice(editingId ? "تم تحديث المنتج بنجاح." : "تمت إضافة المنتج بنجاح.");
    }
  };

  const handleDelete = (product) => {
    const confirmed = window.confirm(
      `هل تريد حذف المنتج "${product.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
    );

    if (!confirmed) return;

    if (persist(products.filter((item) => item.id !== product.id))) {
      setNotice("تم حذف المنتج.");
    }
  };

  return (
    <div className="products-page">
      <style>{`
        .products-page{color:#e8edf7;display:flex;flex-direction:column;gap:22px}
        .products-page *{box-sizing:border-box}
        .products-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
        .products-heading h2{margin:0 0 7px;font-size:23px}
        .products-heading p{margin:0;color:#8993a8;font-size:13px}
        .products-btn{border:1px solid #2a3547;background:#151e2d;color:#e8edf7;border-radius:10px;padding:11px 14px;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-weight:600}
        .products-btn.primary{background:#35d6c2;border-color:#35d6c2;color:#07131a}
        .products-btn.danger{color:#ff9292}
        .products-btn:hover{filter:brightness(1.1)}
        .products-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .products-stat{background:#101722;border:1px solid #222c3c;border-radius:15px;padding:19px;min-width:0}
        .products-stat-top{display:flex;justify-content:space-between;align-items:center;color:#98a4b9;font-size:12px;gap:8px}
        .products-stat-icon{display:grid;place-items:center;width:39px;height:39px;border-radius:11px;background:#18302f;color:#35d6c2}
        .products-stat strong{display:block;font-size:23px;margin-top:15px;overflow-wrap:anywhere}
        .products-stat small{color:#8793a9;font-size:12px}
        .products-toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:#101722;border:1px solid #222c3c;padding:15px;border-radius:14px}
        .products-search{flex:1;min-width:180px;display:flex;align-items:center;gap:9px;background:#0b111b;border:1px solid #283347;border-radius:10px;padding:0 12px;color:#8c9ab0}
        .products-search input{width:100%;min-width:0;background:transparent;border:0;outline:0;color:#edf2fb;padding:12px 0}
        .products-select{background:#0b111b;color:#dce5f4;border:1px solid #283347;border-radius:10px;padding:12px;max-width:100%}
        .products-table-card{background:#101722;border:1px solid #222c3c;border-radius:15px;overflow:hidden}
        .products-table-head{padding:18px 20px;border-bottom:1px solid #222c3c;display:flex;align-items:center;justify-content:space-between;gap:12px}
        .products-table-head h3{margin:0;font-size:15px}
        .products-table-head span{color:#8e9bb0;font-size:12px}
        .products-table-scroll{width:100%;overflow-x:auto}
        .products-table{border-collapse:collapse;width:100%;min-width:930px;text-align:left}
        .products-table th{color:#8491a7;font-size:10px;letter-spacing:.07em;font-weight:700;padding:14px 16px;background:#0d141f;white-space:nowrap}
        .products-table td{padding:15px 16px;border-top:1px solid #202a39;font-size:12px;white-space:nowrap}
        .products-table tbody tr:hover{background:#141e2b}
        .products-name{font-weight:700;color:#e7edf8}
        .products-muted{color:#8c9ab0}
        .products-price{color:#35d6c2;font-weight:700}
        .products-stock{display:inline-flex;padding:5px 8px;border-radius:7px;background:#18302f;color:#64e2c7;font-size:11px}
        .products-stock.low{background:#392d1a;color:#ffc56e}
        .products-stock.empty{background:#3b2028;color:#ff9292}
        .products-actions{display:flex;gap:7px}
        .products-icon-btn{width:32px;height:32px;display:grid;place-items:center;border:1px solid #303b4c;background:#151e2b;color:#c4cee0;border-radius:8px;cursor:pointer}
        .products-empty{text-align:center!important;padding:36px!important;color:#8e9bb0!important}
        .products-notice{background:#13312f;color:#7de7d5;border:1px solid #24544f;padding:12px 14px;border-radius:10px;font-size:13px}
        .products-error{background:#351e26;color:#ffb0b0;border:1px solid #65313d;padding:12px 14px;border-radius:10px;font-size:13px}
        .products-modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(2,6,12,.78);display:flex;align-items:center;justify-content:center;padding:16px}
        .products-modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#101722;border:1px solid #303b4d;border-radius:17px;box-shadow:0 25px 90px #0009}
        .products-modal-header{display:flex;justify-content:space-between;align-items:center;padding:19px 22px;border-bottom:1px solid #283244;gap:12px}
        .products-modal-header h3{margin:0;font-size:18px}
        .products-modal-body{padding:22px}
        .products-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .products-field{display:flex;flex-direction:column;gap:7px;min-width:0}
        .products-field label{font-size:12px;color:#aab5c8}
        .products-field input,.products-field select{width:100%;min-width:0;background:#0a111b;border:1px solid #303b4d;border-radius:9px;padding:11px;color:#edf2fb;outline:none}
        .products-field input:focus,.products-field select:focus{border-color:#35d6c2}
        .products-form-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:22px;flex-wrap:wrap}
        @media(max-width:700px){.products-stats{grid-template-columns:1fr}.products-stat{padding:15px}.products-stat strong{font-size:21px}.products-heading h2{font-size:20px}.products-modal-body{padding:15px}.products-form-grid{grid-template-columns:1fr}.products-table-head{padding:15px}}
      `}</style>

      <div className="products-heading">
        <div>
          <h2>Product Management</h2>
          <p>إدارة المنتجات والأسعار والمخزون من مكان واحد.</p>
        </div>
        <button className="products-btn primary" onClick={openAdd}>
          <Plus size={17} /> Add Product
        </button>
      </div>

      {notice && <div className="products-notice">{notice}</div>}
      {error && !modalOpen && <div className="products-error">{error}</div>}

      <div className="products-stats">
        <div className="products-stat">
          <div className="products-stat-top">
            <span>Total Products</span>
            <span className="products-stat-icon"><Package size={19} /></span>
          </div>
          <strong>{products.length.toLocaleString("fr-DZ")}</strong>
          <small>إجمالي المنتجات المسجلة</small>
        </div>
        <div className="products-stat">
          <div className="products-stat-top">
            <span>Low Stock</span>
            <span className="products-stat-icon" style={{ color: "#ffc56e", background: "#392d1a" }}><AlertTriangle size={19} /></span>
          </div>
          <strong>{lowStockCount.toLocaleString("fr-DZ")}</strong>
          <small>منتجات وصلت إلى حد التنبيه</small>
        </div>
        <div className="products-stat">
          <div className="products-stat-top">
            <span>Inventory Cost</span>
            <span className="products-stat-icon" style={{ color: "#b6a6ff", background: "#272342" }}><Wallet size={19} /></span>
          </div>
          <strong>{money(inventoryValue)}</strong>
          <small>قيمة المخزون بسعر الشراء</small>
        </div>
      </div>

      <div className="products-toolbar">
        <label className="products-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, reference or barcode..."
          />
        </label>
        <select
          className="products-select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter products by category"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All categories" : item}
            </option>
          ))}
        </select>
        <button
          className="products-btn"
          onClick={() => {
            setQuery("");
            setCategory("All");
          }}
        >
          <RefreshCw size={15} /> Reset
        </button>
      </div>

      <section className="products-table-card">
        <div className="products-table-head">
          <h3>Product Inventory</h3>
          <span>{filteredProducts.length} product(s)</span>
        </div>
        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>REFERENCE / BARCODE</th>
                <th>BUY PRICE</th>
                <th>SELL PRICE</th>
                <th>CARTON PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0);
                const min = Number(product.minStock || 0);
                const empty = stock <= 0;
                const low = !empty && stock <= min;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="products-name">{product.name}</div>
                      <div className="products-muted">{product.category} · {product.unit || "piece"}</div>
                    </td>
                    <td>
                      <div>{product.sku}</div>
                      <div className="products-muted">{product.barcode || "No barcode"}</div>
                    </td>
                    <td>{money(product.purchasePrice)}</td>
                    <td className="products-price">{money(product.price)}</td>
                    <td>{Number(product.cartonPrice) > 0 ? money(product.cartonPrice) : "—"}</td>
                    <td>{stock.toLocaleString("fr-DZ")}</td>
                    <td>
                      <span className={`products-stock ${empty ? "empty" : low ? "low" : ""}`}>
                        {empty ? "Out of stock" : low ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="products-actions">
                        <button className="products-icon-btn" title="Edit product" onClick={() => openEdit(product)}>
                          <Pencil size={15} />
                        </button>
                        <button className="products-icon-btn" title="Delete product" onClick={() => handleDelete(product)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={8} className="products-empty">لا توجد منتجات مطابقة لبحثك.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="products-modal-backdrop" onClick={() => setModalOpen(false)}>
          <section className="products-modal" onClick={(event) => event.stopPropagation()}>
            <div className="products-modal-header">
              <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
              <button className="products-icon-btn" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={17} />
              </button>
            </div>
            <form className="products-modal-body" onSubmit={handleSave}>
              {error && <div className="products-error" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="products-form-grid">
                <div className="products-field">
                  <label>Product name *</label>
                  <input required value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Product name" />
                </div>
                <div className="products-field">
                  <label>Reference / SKU *</label>
                  <input required value={form.sku} onChange={(e) => updateField("sku", e.target.value)} placeholder="PRD-013" />
                </div>
                <div className="products-field">
                  <label>Barcode</label>
                  <input value={form.barcode} onChange={(e) => updateField("barcode", e.target.value)} placeholder="Scan or enter barcode" />
                </div>
                <div className="products-field">
                  <label>Category</label>
                  <input value={form.category} onChange={(e) => updateField("category", e.target.value)} placeholder="General" />
                </div>
                <div className="products-field">
                  <label>Purchase price (DA)</label>
                  <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => updateField("purchasePrice", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Retail price / piece (DA)</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField("price", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Carton selling price (DA)</label>
                  <input type="number" min="0" step="0.01" value={form.cartonPrice} onChange={(e) => updateField("cartonPrice", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Wholesale price (DA)</label>
                  <input type="number" min="0" step="0.01" value={form.wholesalePrice} onChange={(e) => updateField("wholesalePrice", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Pieces per carton</label>
                  <input type="number" min="1" step="1" value={form.piecesPerCarton} onChange={(e) => updateField("piecesPerCarton", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Current stock</label>
                  <input type="number" min="0" step="0.001" value={form.stock} onChange={(e) => updateField("stock", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Minimum stock alert</label>
                  <input type="number" min="0" step="0.001" value={form.minStock} onChange={(e) => updateField("minStock", e.target.value)} />
                </div>
                <div className="products-field">
                  <label>Unit</label>
                  <select value={form.unit} onChange={(e) => updateField("unit", e.target.value)}>
                    <option value="piece">Piece</option>
                    <option value="carton">Carton</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter</option>
                    <option value="bottle">Bottle</option>
                  </select>
                </div>
              </div>
              <div className="products-form-footer">
                <button type="button" className="products-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="products-btn primary">
                  <Save size={16} /> Save Product
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
