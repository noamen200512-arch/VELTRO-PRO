import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Package,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Edit3,
  Trash2,
  X,
  Save,
  RefreshCw,
  Barcode,
  Filter,
  ArrowUpDown,
} from "lucide-react";

import {
  getProducts,
  saveProducts,
  createProductId,
} from "./productStore.js";

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
  category: "General",
  purchasePrice: "",
  price: "",
  cartonPrice: "",
  wholesalePrice: "",
  piecesPerCarton: "1",
  stock: "",
  minStock: "5",
  unit: "piece",
};

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR")} DA`;

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
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 18,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ color: C.muted, fontSize: 12 }}>{label}</span>
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}18`,
            display: "grid",
            placeItems: "center",
            color,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </span>
      </div>

      <div
        style={{
          color: C.text,
          fontSize: 25,
          fontWeight: 750,
          marginTop: 15,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
        {note}
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState(() => getProducts());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timeout);
  }, [notice]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(products.map((p) => p.category || "General")),
    ],
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
        sum +
        Number(p.stock || 0) * Number(p.purchasePrice || 0),
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
        const matchesSearch =
          !query ||
          [p.name, p.sku, p.barcode, p.category, p.id]
            .some((v) => String(v || "").toLowerCase().includes(query));

        const matchesCategory =
          category === "All" || (p.category || "General") === category;

        const quantity = Number(p.stock || 0);
        const minimum = Number(p.minStock || 0);

        const matchesStock =
          stockFilter === "All" ||
          (stockFilter === "Low" && quantity <= minimum) ||
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

  function persist(nextProducts, successMessage) {
    const ok = saveProducts(nextProducts);

    if (!ok) {
      setNotice("Unable to save. Check your browser storage.");
      return false;
    }

    setProducts(nextProducts);
    setNotice(successMessage);
    return true;
  }

  function openAddModal() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  function openEditModal(product) {
    setEditingId(product.id);
    setForm({
      ...EMPTY_FORM,
      ...product,
      purchasePrice: String(product.purchasePrice ?? ""),
      price: String(product.price ?? ""),
      cartonPrice: String(product.cartonPrice ?? ""),
      wholesalePrice: String(product.wholesalePrice ?? ""),
      piecesPerCarton: String(product.piecesPerCarton ?? 1),
      stock: String(product.stock ?? ""),
      minStock: String(product.minStock ?? 5),
    });
    setModalOpen(true);
  }

  function updateField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setNotice("Please enter a product name.");
      return;
    }

    const sku = form.sku.trim() || createProductId();

    const duplicate = products.some(
      (p) =>
        p.id !== editingId &&
        (p.sku || "").toLowerCase() === sku.toLowerCase()
    );

    if (duplicate) {
      setNotice("This SKU already exists.");
      return;
    }

    const product = {
      id: editingId || createProductId(),
      name,
      sku,
      barcode: form.barcode.trim(),
      category: form.category.trim() || "General",
      purchasePrice: Math.max(0, Number(form.purchasePrice) || 0),
      price: Math.max(0, Number(form.price) || 0),
      cartonPrice: Math.max(0, Number(form.cartonPrice) || 0),
      wholesalePrice: Math.max(0, Number(form.wholesalePrice) || 0),
      piecesPerCarton: Math.max(
        1,
        Number(form.piecesPerCarton) || 1
      ),
      stock: Math.max(0, Number(form.stock) || 0),
      minStock: Math.max(0, Number(form.minStock) || 0),
      unit: form.unit || "piece",
    };

    const nextProducts = editingId
      ? products.map((p) => (p.id === editingId ? product : p))
      : [product, ...products];

    if (
      persist(
        nextProducts,
        editingId ? "Product updated successfully." : "Product added successfully."
      )
    ) {
      setModalOpen(false);
    }
  }

  function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    persist(
      products.filter((p) => p.id !== product.id),
      "Product deleted."
    );
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setStockFilter("All");
    setSortBy("name");
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
      <style>{`
        .veltro-products-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .veltro-product-toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .veltro-product-table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .veltro-product-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }
        .veltro-product-table th {
          color: ${C.muted};
          font-size: 11px;
          font-weight: 600;
          padding: 13px 15px;
          border-bottom: 1px solid ${C.border};
          white-space: nowrap;
        }
        .veltro-product-table td {
          padding: 14px 15px;
          border-bottom: 1px solid ${C.border};
          font-size: 12px;
          white-space: nowrap;
        }
        .veltro-product-table tbody tr:hover {
          background: rgba(53,214,208,0.035);
        }
        .veltro-product-input {
          width: 100%;
          padding: 11px 12px;
          border-radius: 9px;
          border: 1px solid ${C.border};
          background: ${C.bg};
          color: ${C.text};
          outline: none;
          box-sizing: border-box;
          font-size: 13px;
        }
        .veltro-product-input:focus {
          border-color: ${C.cyan};
        }
        @media (max-width: 1050px) {
          .veltro-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .veltro-products-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

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
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 7 }}>
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
          <p style={{ color: C.muted, fontSize: 12, margin: "8px 0 0" }}>
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
          <Plus size={16} />
          Add Product
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
          }}
        >
          {notice}
        </div>
      )}

      <div className="veltro-products-grid" style={{ marginBottom: 22 }}>
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.count}
          color={C.cyan}
          note="Products in your catalog"
        />
        <StatCard
          icon={Boxes}
          label="Units in Stock"
          value={stats.totalUnits.toLocaleString("fr-FR")}
          color={C.violet}
          note="Combined available quantity"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStock}
          color={C.orange}
          note="At or below minimum stock"
        />
        <StatCard
          icon={TrendingUp}
          label="Stock Cost Value"
          value={money(stats.purchaseValue)}
          color={C.green}
          note="Estimated purchase value"
        />
      </div>

      <section
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          background: C.panel,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 16 }}>Product Inventory</h2>
            <p style={{ color: C.muted, fontSize: 11, margin: "6px 0 0" }}>
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>

          <button onClick={resetFilters} style={buttonStyle}>
            <RefreshCw size={14} />
            Reset Filters
          </button>
        </div>

        <div className="veltro-product-toolbar" style={{ padding: 16 }}>
          <div
            style={{
              flex: "1 1 220px",
              position: "relative",
              minWidth: 0,
            }}
          >
            <Search
              size={16}
              color={C.muted}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                pointerEvents: "none",
              }}
            />
            <input
              className="veltro-product-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, barcode..."
              style={{ paddingLeft: 38 }}
            />
          </div>

          <select
            className="veltro-product-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            style={{ width: "auto", minWidth: 130, maxWidth: "100%" }}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select
            className="veltro-product-input"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            aria-label="Filter by stock"
            style={{ width: "auto", minWidth: 125, maxWidth: "100%" }}
          >
            <option value="All">All Stock</option>
            <option value="Available">In Stock</option>
            <option value="Low">Low Stock</option>
            <option value="Out">Out of Stock</option>
          </select>

          <select
            className="veltro-product-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            style={{ width: "auto", minWidth: 130, maxWidth: "100%" }}
          >
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            <option value="price">Sort: Price</option>
          </select>
        </div>

        <div className="veltro-product-table-wrap">
          <table className="veltro-product-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>SKU / BARCODE</th>
                <th>CATEGORY</th>
                <th>SELLING PRICE</th>
                <th>PURCHASE PRICE</th>
                <th>STOCK</th>
                <th>STATUS</th>
                <th style={{ textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = Number(product.stock || 0);
                const minimum = Number(product.minStock || 0);
                const out = stock <= 0;
                const low = !out && stock <= minimum;
                const statusColor = out
                  ? C.red
                  : low
                  ? C.orange
                  : C.green;
                const statusText = out
                  ? "Out of Stock"
                  : low
                  ? "Low Stock"
                  : "In Stock";

                return (
                  <tr key={product.id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 35,
                            height: 35,
                            borderRadius: 9,
                            background: `${C.cyan}12`,
                            color: C.cyan,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={17} />
                        </div>
                        <div>
                          <div style={{ color: C.text, fontWeight: 650 }}>
                            {product.name}
                          </div>
                          <div
                            style={{
                              color: C.muted,
                              fontSize: 10,
                              marginTop: 4,
                            }}
                          >
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{product.sku || "—"}</div>
                      {product.barcode && (
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          <Barcode
                            size={11}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          {product.barcode}
                        </div>
                      )}
                    </td>
                    <td style={{ color: C.muted }}>
                      {product.category || "General"}
                    </td>
                    <td style={{ fontWeight: 650 }}>
                      {money(product.price)}
                    </td>
                    <td style={{ color: C.muted }}>
                      {money(product.purchasePrice)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>
                        {stock.toLocaleString("fr-FR")}
                      </span>{" "}
                      <span style={{ color: C.muted, fontSize: 10 }}>
                        {product.unit || "piece"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          color: statusColor,
                          background: `${statusColor}12`,
                          padding: "5px 8px",
                          borderRadius: 20,
                          fontSize: 10,
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: statusColor,
                          }}
                        />
                        {statusText}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 6,
                        }}
                      >
                        <button
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEditModal(product)}
                          style={{
                            ...buttonStyle,
                            padding: 8,
                            color: C.cyan,
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => handleDelete(product)}
                          style={{
                            ...buttonStyle,
                            padding: 8,
                            color: C.red,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "50px 20px",
                      whiteSpace: "normal",
                    }}
                  >
                    <Package
                      size={30}
                      color={C.muted}
                      style={{ marginBottom: 10 }}
                    />
                    <div style={{ fontWeight: 650 }}>No products found</div>
                    <p style={{ color: C.muted, fontSize: 12 }}>
                      Try changing your filters or add a new product.
                    </p>
                    <button onClick={openAddModal} style={buttonStyle}>
                      <Plus size={14} /> Add Product
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            color: C.muted,
            fontSize: 11,
          }}
        >
          <span>
            <Filter
              size={12}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Inventory overview
          </span>
          <span>
            <ArrowUpDown
              size={12}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Changes are saved in this browser
          </span>
        </div>
      </section>

      {modalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            style={{
              width: "min(720px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                padding: 18,
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <h2
                  id="product-modal-title"
                  style={{ margin: 0, fontSize: 18 }}
                >
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>
                <p style={{ color: C.muted, fontSize: 11, margin: "6px 0 0" }}>
                  Enter the product information below.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Close dialog"
                style={buttonStyle}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  padding: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
                  gap: 14,
                }}
              >
                <Field label="Product Name *">
                  <input
                    className="veltro-product-input"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Mineral Water"
                    required
                    autoFocus
                  />
                </Field>

                <Field label="SKU / Reference">
                  <input
                    className="veltro-product-input"
                    value={form.sku}
                    onChange={(e) => updateField("sku", e.target.value)}
                    placeholder="e.g. PRD-001"
                  />
                </Field>

                <Field label="Barcode">
                  <input
                    className="veltro-product-input"
                    value={form.barcode}
                    onChange={(e) => updateField("barcode", e.target.value)}
                    placeholder="Scan or type barcode"
                  />
                </Field>

                <Field label="Category">
                  <input
                    className="veltro-product-input"
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    placeholder="e.g. Drinks"
                    list="veltro-product-categories"
                  />
                  <datalist id="veltro-product-categories">
                    {categories
                      .filter((item) => item !== "All")
                      .map((item) => (
                        <option key={item} value={item} />
                      ))}
                  </datalist>
                </Field>

                <Field label="Purchase Price (DA)">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchasePrice}
                    onChange={(e) =>
                      updateField("purchasePrice", e.target.value)
                    }
                    placeholder="0"
                  />
                </Field>

                <Field label="Retail Selling Price (DA) *">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", e.target.value)}
                    placeholder="0"
                    required
                  />
                </Field>

                <Field label="Wholesale Price (DA)">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.wholesalePrice}
                    onChange={(e) =>
                      updateField("wholesalePrice", e.target.value)
                    }
                    placeholder="0"
                  />
                </Field>

                <Field label="Carton Price (DA)">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cartonPrice}
                    onChange={(e) =>
                      updateField("cartonPrice", e.target.value)
                    }
                    placeholder="0"
                  />
                </Field>

                <Field label="Pieces per Carton">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="1"
                    step="1"
                    value={form.piecesPerCarton}
                    onChange={(e) =>
                      updateField("piecesPerCarton", e.target.value)
                    }
                  />
                </Field>

                <Field label="Current Stock">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) => updateField("stock", e.target.value)}
                    placeholder="0"
                  />
                </Field>

                <Field label="Minimum Stock Alert">
                  <input
                    className="veltro-product-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minStock}
                    onChange={(e) => updateField("minStock", e.target.value)}
                    placeholder="5"
                  />
                </Field>

                <Field label="Unit">
                  <select
                    className="veltro-product-input"
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                  >
                    <option value="piece">Piece</option>
                    <option value="carton">Carton</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter</option>
                    <option value="bottle">Bottle</option>
                    <option value="box">Box</option>
                  </select>
                </Field>
              </div>

              <div
                style={{
                  padding: 18,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={buttonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...buttonStyle,
                    background: C.cyan,
                    color: "#07131A",
                    borderColor: C.cyan,
                    padding: "10px 16px",
                  }}
                >
                  <Save size={15} />
                  {editingId ? "Save Changes" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
