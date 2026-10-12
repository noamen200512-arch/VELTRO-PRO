
import React, { useState } from "react";
import {
  Package,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Undo2,
  Boxes,
} from "lucide-react";

export function InvoiceTable({
  items = [],
  onUpdate,
  onRemove,
  onUndoRemove,
  onAddUnit,
  onAddCarton,
}) {
  const [removedItem, setRemovedItem] = useState(null);

  const money = (value) =>
    `${(Number(value) || 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DA`;

  const updateField = (item, field, value) => {
    onUpdate?.(item.id, field, value);
  };

  const getCartonSize = (item) =>
    Math.max(1, Number(item.piecesPerCarton) || 1);

  const updateQuantity = (item, nextQuantity) => {
    const quantity = Math.floor(Number(nextQuantity));

    if (!Number.isFinite(quantity) || quantity < 1) return;

    onUpdate?.(item.id, "quantity", quantity);
  };

  const addUnit = (item) => {
    if (onAddUnit) {
      onAddUnit(item);
      return;
    }

    updateQuantity(item, (Number(item.quantity ?? item.qty) || 0) + 1);
  };

  const addCarton = (item) => {
    if (onAddCarton) {
      onAddCarton(item);
      return;
    }

    const cartonSize = getCartonSize(item);
    updateQuantity(
      item,
      (Number(item.quantity ?? item.qty) || 0) + cartonSize
    );
  };

  const removeItem = (item) => {
    setRemovedItem({
      item,
      removedAt: Date.now(),
    });

    onRemove?.(item.id, item);
  };

  const undoRemove = () => {
    if (!removedItem || !onUndoRemove) return;

    onUndoRemove(removedItem.item);
    setRemovedItem(null);
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
              {items.length}{" "}
              {items.length === 1 ? "product" : "products"} added
            </p>
          </div>
        </div>

        <div className="invoice-table-count">
          {items.length} ITEMS
        </div>
      </div>

      {removedItem && (
        <div className="invoice-remove-notice" role="status">
          <span>
            <Trash2 size={15} />
            {removedItem.item.name || "Product"} removed
          </span>

          {onUndoRemove && (
            <button type="button" onClick={undoRemove}>
              <Undo2 size={15} />
              Undo
            </button>
          )}
        </div>
      )}

      <div className="invoice-table-scroll">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="invoice-col-product">Product</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="invoice-empty-state">
                    <div className="invoice-empty-icon">
                      <Package size={30} />
                    </div>

                    <h3>No products added yet</h3>

                    <p>
                      Scan a barcode or search for a product above
                      to start a new invoice.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const quantity = Math.max(
                  0,
                  Number(item.quantity ?? item.qty) || 0
                );

                const price = Math.max(
                  0,
                  Number(item.price) || 0
                );

                const total = quantity * price;
                const cartonSize = getCartonSize(item);
                const cartons = Math.floor(quantity / cartonSize);
                const looseUnits = quantity % cartonSize;

                return (
                  <tr key={item.id ?? index}>
                    <td className="invoice-product-cell">
                      <div className="invoice-product-icon">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="invoice-product-image"
                          />
                        ) : (
                          <Package size={18} />
                        )}
                      </div>

                      <div className="invoice-product-details">
                        <strong>
                          {item.name || "Unnamed product"}
                        </strong>

                        <span>
                          {item.sku || item.id || `Product #${index + 1}`}
                        </span>

                        {cartonSize > 1 && (
                          <small className="invoice-carton-details">
                            {cartons > 0 && (
                              <span>
                                {cartons} carton
                                {cartons !== 1 ? "s" : ""}
                              </span>
                            )}

                            {cartons > 0 && looseUnits > 0 && (
                              <span> + </span>
                            )}

                            {looseUnits > 0 && (
                              <span>
                                {looseUnits} loose{" "}
                                {looseUnits === 1 ? "unit" : "units"}
                              </span>
                            )}

                            <span> · {quantity} total units</span>
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="invoice-quantity-cell">
                        <div className="invoice-quantity-control">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            disabled={quantity <= 1}
                            onClick={() =>
                              updateQuantity(item, quantity - 1)
                            }
                          >
                            <Minus size={13} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            aria-label={`Quantity of ${item.name}`}
                            value={quantity}
                            onChange={(event) => {
                              const value = event.target.value;
                              if (value === "") return;

                              updateQuantity(item, value);
                            }}
                          />

                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => addUnit(item)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="invoice-pack-actions">
                          <button
                            type="button"
                            onClick={() => addUnit(item)}
                            title="Add one unit"
                          >
                            <Plus size={12} />
                            Add Unit
                          </button>

                          {cartonSize > 1 && (
                            <button
                              type="button"
                              onClick={() => addCarton(item)}
                              title={`Add ${cartonSize} units`}
                            >
                              <Boxes size={12} />
                              Add Carton
                            </button>
                          )}
                        </div>
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
                      <div className="invoice-line-total-cell">
                        <strong className="invoice-line-total">
                          {money(total)}
                        </strong>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="invoice-remove-button"
                        aria-label={`Remove ${item.name}`}
                        title="Remove product"
                        onClick={() => removeItem(item)}
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
