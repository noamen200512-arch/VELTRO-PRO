import React from "react";
import {
  Package,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Barcode,
} from "lucide-react";

export function InvoiceTable({
  items = [],
  onUpdate,
  onRemove,
}) {
  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  const updateQuantity = (item, change) => {
    const currentQuantity = Number(item.quantity) || 1;
    const nextQuantity = currentQuantity + change;

    if (nextQuantity <= 0) return;

    onUpdate?.(item.id, "quantity", nextQuantity);
  };

  const updateField = (item, field, value) => {
    onUpdate?.(item.id, field, value);
  };

  return (
    <section className="invoice-table-section">
      <div className="invoice-table-header">
        <div className="invoice-table-title">
          <div className="invoice-table-icon">
            <ShoppingBag size={19} />
          </div>

          <div>
            <h2>Invoice Items</h2>
            <p>
              {items.length} {items.length === 1 ? "product" : "products"} added
            </p>
          </div>
        </div>

        <div className="invoice-table-count">
          {items.length} ITEMS
        </div>
      </div>

      <div className="invoice-table-scroll">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-col-product">Product</th>
              <th>Barcode</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Discount (DA)</th>
              <th>Total</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="invoice-empty-state">
                    <div className="invoice-empty-icon">
                      <Package size={30} />
                    </div>

                    <h3>No products added yet</h3>

                    <p>
                      Scan a barcode or enter a product above
                      to start a new invoice.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const discount = Number(item.discount) || 0;
                const total = Math.max(
                  0,
                  quantity * price - discount
                );

                return (
                  <tr key={item.id ?? index}>
                    <td className="invoice-product-cell">
                      <div className="invoice-product-icon">
                        <Package size={18} />
                      </div>

                      <div className="invoice-product-details">
                        <strong>{item.name || "Unnamed product"}</strong>
                        <span>Product #{index + 1}</span>
                      </div>
                    </td>

                    <td>
                      <span className="invoice-barcode">
                        <Barcode size={14} />
                        {item.barcode || "—"}
                      </span>
                    </td>

                    <td>
                      <div className="invoice-quantity-control">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={quantity <= 1}
                          onClick={() => updateQuantity(item, -1)}
                        >
                          <Minus size={13} />
                        </button>

                        <span>{quantity}</span>

                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item, 1)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </td>

                    <td>
                      <input
                        className="invoice-cell-input"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Unit price for ${item.name}`}
                        value={item.price ?? 0}
                        onChange={(event) =>
                          updateField(
                            item,
                            "price",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="invoice-cell-input invoice-discount-input"
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Discount for ${item.name}`}
                        value={item.discount ?? 0}
                        onChange={(event) =>
                          updateField(
                            item,
                            "discount",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <strong className="invoice-line-total">
                        {money(total)}
                      </strong>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="invoice-remove-button"
                        aria-label={`Remove ${item.name}`}
                        title="Remove product"
                        onClick={() => onRemove?.(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="invoice-table-footer">
          <span>
            Showing {items.length} invoice{" "}
            {items.length === 1 ? "item" : "items"}
          </span>

          <span>Prices in Algerian dinars (DA)</span>
        </div>
      )}
    </section>
  );
}

export default InvoiceTable;
