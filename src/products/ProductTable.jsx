import React from "react";
import {
  Search,
  Plus,
  Package,
  Barcode,
  Filter,
  ArrowUpDown,
  Printer,
  Edit3,
  Trash2,
} from "lucide-react";

import { getAllBarcodes } from "./productUtils.js";
import ProductImage from "./ProductImage.jsx";

export default function ProductTable({
  filteredProducts = [],
  categories = ["All"],
  category,
  setCategory,
  stockFilter,
  setStockFilter,
  sortBy,
  setSortBy,
  search,
  setSearch,
  money,
  onPrintProduct,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  C,
  buttonStyle = {},
}) {
  const colors = {
    bg: "#080C14",
    panel: "#0D1525",
    border: "rgba(148,163,184,0.14)",
    text: "#F1F5F9",
    muted: "#8795AC",
    cyan: "#35D6D0",
    green: "#34D399",
    orange: "#FBBF24",
    red: "#FB7185",
    ...(C || {}),
  };

  const actionButtonStyle = {
    ...buttonStyle,
    padding: 8,
  };

  return (
    <section
      style={{
        background: colors.panel,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        overflow: "hidden",
        minWidth: 0,
        color: colors.text,
      }}
    >
      <div
        style={{
          padding: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 15 }}>
            Product Inventory
          </h3>

          <p
            style={{
              margin: "5px 0 0",
              color: colors.muted,
              fontSize: 11,
            }}
          >
            Manage your products and stock.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddProduct}
          style={{
            ...buttonStyle,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            padding: "10px 13px",
            background: colors.cyan,
            color: "#07111A",
            border: "none",
            borderRadius: 9,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          Add Product
        </button>
      </div>

      <div
        style={{
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            position: "relative",
            flex: "1 1 210px",
            minWidth: 0,
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.muted,
              pointerEvents: "none",
            }}
          />

          <input
            className="veltro-product-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, SKU, barcode..."
            aria-label="Search products"
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: 38,
            }}
          />
        </div>

        <select
          className="veltro-product-input"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter by category"
          style={{
            width: "auto",
            minWidth: 130,
            maxWidth: "100%",
          }}
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
          onChange={(event) => setStockFilter(event.target.value)}
          aria-label="Filter by stock"
          style={{
            width: "auto",
            minWidth: 125,
            maxWidth: "100%",
          }}
        >
          <option value="All">All Stock</option>
          <option value="Available">In Stock</option>
          <option value="Low">Low Stock</option>
          <option value="Out">Out of Stock</option>
        </select>

        <select
          className="veltro-product-input"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          aria-label="Sort products"
          style={{
            width: "auto",
            minWidth: 130,
            maxWidth: "100%",
          }}
        >
          <option value="name">Sort: Name</option>
          <option value="stock">Sort: Stock</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      <div
        className="veltro-product-table-wrap"
        style={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table
          className="veltro-product-table"
          style={{
            width: "100%",
            minWidth: 850,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {[
                "PRODUCT",
                "SKU / BARCODE",
                "CATEGORY",
                "SELLING PRICE",
                "PURCHASE PRICE",
                "STOCK",
                "STATUS",
                "ACTIONS",
              ].map((heading, index) => (
                <th
                  key={heading}
                  style={{
                    padding: "13px 12px",
                    textAlign: index === 7 ? "right" : "left",
                    color: colors.muted,
                    fontSize: 10,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((product) => {
              const stock = Number(product.stock || 0);
              const minimum = Number(product.minStock || 0);

              const out = stock <= 0;
              const low = !out && stock <= minimum;

              const statusColor = out
                ? colors.red
                : low
                  ? colors.orange
                  : colors.green;

              const statusText = out
                ? "Out of Stock"
                : low
                  ? "Low Stock"
                  : "In Stock";

              const codes = getAllBarcodes(product);

              return (
                <tr key={product.id}>
                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 145,
                      }}
                    >
                      <ProductImage
                        src={product.image}
                        size={35}
                        alt={product.name || ""}
                      />

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            color: colors.text,
                            fontWeight: 650,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {product.name}
                        </div>

                        <div
                          style={{
                            color: colors.muted,
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          ID: {product.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div>{product.sku || "—"}</div>

                    {codes.map((code) => (
                      <div
                        key={code}
                        style={{
                          color: colors.muted,
                          fontSize: 10,
                          marginTop: 4,
                          overflowWrap: "anywhere",
                        }}
                      >
                        <Barcode
                          size={11}
                          style={{
                            display: "inline",
                            verticalAlign: "middle",
                          }}
                        />{" "}
                        {code}
                      </div>
                    ))}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      color: colors.muted,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    {product.category || "General"}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      fontWeight: 650,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    {money(product.price)}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      color: colors.muted,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    {money(product.purchasePrice)}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      whiteSpace: "nowrap",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {stock.toLocaleString("fr-FR")}
                    </span>{" "}
                    <span
                      style={{
                        color: colors.muted,
                        fontSize: 10,
                      }}
                    >
                      {product.unit || "piece"}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
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
                        whiteSpace: "nowrap",
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

                  <td
                    style={{
                      padding: 12,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <button
                        type="button"
                        title="Print price card"
                        aria-label={`Print price for ${product.name}`}
                        onClick={() => onPrintProduct?.(product)}
                        style={{
                          ...actionButtonStyle,
                          color: colors.green,
                        }}
                        className="veltro-product-action"
                      >
                        <Printer size={14} />
                      </button>

                      <button
                        type="button"
                        title="Edit product"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => onEditProduct?.(product)}
                        style={{
                          ...actionButtonStyle,
                          color: colors.cyan,
                        }}
                        className="veltro-product-action"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        type="button"
                        title="Delete product"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => onDeleteProduct?.(product)}
                        style={{
                          ...actionButtonStyle,
                          color: colors.red,
                        }}
                        className="veltro-product-action"
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
                    color={colors.muted}
                    style={{ marginBottom: 10 }}
                  />

                  <div style={{ fontWeight: 650 }}>
                    No products found
                  </div>

                  <p
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    Try changing your filters or add a new product.
                  </p>

                  <button
                    type="button"
                    onClick={onAddProduct}
                    style={buttonStyle}
                  >
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
          borderTop: `1px solid ${colors.border}`,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          color: colors.muted,
          fontSize: 11,
        }}
      >
        <span>
          <Filter
            size={12}
            style={{
              display: "inline",
              verticalAlign: "middle",
            }}
          />{" "}
          Inventory overview
        </span>

        <span>
          <ArrowUpDown
            size={12}
            style={{
              display: "inline",
              verticalAlign: "middle",
            }}
          />{" "}
          Changes are saved locally and synchronized with the cloud
        </span>
      </div>
    </section>
  );
}