
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Undo2,
  Boxes,
} from "lucide-react";

function EditablePriceInput({ item, value, onCommit }) {
  const formatPrice = (price) => {
    const numeric = Number(price);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric.toFixed(2) : "0.00";
  };

  const [draft, setDraft] = useState(() => formatPrice(value));

  useEffect(() => {
    setDraft(formatPrice(value));
  }, [value]);

  const commit = () => {
    const normalized = String(draft).trim().replace(",", ".");
    const numeric = Number(normalized);

    if (normalized === "" || !Number.isFinite(numeric) || numeric < 0) {
      setDraft(formatPrice(value));
      return;
    }

    const decimalPart = normalized.split(".")[1] || "";
    const cents = numeric * 100;
    const roundedPrice = numeric <= 0
      ? 0
      : (decimalPart.length > 4
          ? Math.ceil(cents - 1e-9)
          : Math.round(cents)) / 100;

    onCommit(item, "price", roundedPrice);
    setDraft(formatPrice(roundedPrice));
  };

  return (
    <input
      className="invoice-cell-input"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      aria-label={`Unit price for ${item.name}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(/[^0-9.,]/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(formatPrice(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
}


function EditableQuantityInput({ item, value, onCommit }) {
  const formatQuantity = (quantity) => {
    const numeric = Number(quantity);
    if (item.weighedSale || item.unitLabel === "kg") {
      return Number.isFinite(numeric) && numeric > 0 ? String(Number(numeric.toFixed(3))) : "0.001";
    }
    return Number.isFinite(numeric) && numeric >= 1 ? String(Math.floor(numeric)) : "1";
  };

  const [draft, setDraft] = useState(() => formatQuantity(value));

  useEffect(() => {
    setDraft(formatQuantity(value));
  }, [value]);

  const commit = () => {
    const normalized = String(draft).trim();
    const numeric = normalized === "" ? NaN : Number(normalized);

    const isWeighed = item.weighedSale || item.unitLabel === "kg";
    if (!Number.isFinite(numeric) || numeric <= 0 || (!isWeighed && numeric < 1)) {
      setDraft(formatQuantity(value));
      return;
    }

    const quantity = isWeighed ? Number(numeric.toFixed(3)) : Math.floor(numeric);
    onCommit(item, "quantity", quantity);
    setDraft(String(quantity));
  };

  return (
    <input
      type="text"
      inputMode={item.weighedSale || item.unitLabel === "kg" ? "decimal" : "numeric"}
      pattern={item.weighedSale || item.unitLabel === "kg" ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
      autoComplete="off"
      aria-label={`Quantity of ${item.name}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value.replace(item.weighedSale || item.unitLabel === "kg" ? /[^0-9.,]/g : /[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(formatQuantity(value));
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export function InvoiceTable({
  items = [],
  selectedIndex = -1,
  onSelectRow,
  onUpdate,
  onRemove,
  onUndoRemove,
  onAddUnit,
  onAddCarton,
  locale = "en",
}) {
  const [removedItem, setRemovedItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteText = locale === "ar" ? {
    title: "تأكيد حذف المنتج", description: "هل تريد حذف هذا المنتج من البون؟",
    confirm: "حذف المنتج", cancel: "العودة", hint: "Enter للتأكيد · Esc للعودة"
  } : locale === "fr" ? {
    title: "Confirmer la suppression", description: "Voulez-vous supprimer ce produit de la facture ?",
    confirm: "Supprimer le produit", cancel: "Retour", hint: "Entrée pour confirmer · Échap pour revenir"
  } : {
    title: "Confirm product removal", description: "Do you want to remove this product from the invoice?",
    confirm: "Delete product", cancel: "Go back", hint: "Enter to confirm · Esc to go back"
  };

  // Delete opens the confirmation for the currently selected invoice row.
  // Ignore text fields so Delete/Backspace continue to edit the text normally.
  useEffect(() => {
    const handler = (event) => {
      if (pendingDelete) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setPendingDelete(null);
        } else if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          const item = pendingDelete;
          setPendingDelete(null);
          removeItem(item);
        }
        return;
      }

      if (event.key !== "Delete" || selectedIndex < 0) return;
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      // Keep Delete working for the selected invoice row while the cashier is
      // scanning a barcode or searching products. Other editable fields retain
      // normal text-editing behavior.
      const isProductSearchField =
        target?.id === "product-search" || target?.id === "product-barcode";
      if (
        ((tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable) &&
          !isProductSearchField)
      ) return;
      const item = items[selectedIndex];
      if (!item) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingDelete(item);
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [pendingDelete, selectedIndex, items]);

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
    const isWeighed = item.weighedSale || item.unitLabel === "kg";
    const numeric = Number(nextQuantity);
    const quantity = isWeighed ? Number(numeric.toFixed(3)) : Math.floor(numeric);

    if (!Number.isFinite(quantity) || (isWeighed ? quantity <= 0 : quantity < 1)) return;

    onUpdate?.(item.id, "quantity", quantity);
  };

  const addUnit = (item) => {
    if (onAddUnit) {
      onAddUnit(item);
      return;
    }

    updateQuantity(
      item,
      (Number(item.quantity ?? item.qty) || 0) + 1
    );
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
              {items.length === 1
                ? `${items.length} product added`
                : `${items.length} products added`}
            </p>
          </div>
        </div>

        <div className="invoice-table-count">
          {items.length} ITEMS
        </div>
      </div>


      {items.length === 0 ? (
        <div
          className="invoice-table-scroll"
          style={{ overflowX: "hidden", width: "100%" }}
        >
          <div
            className="invoice-empty-state"
            style={{
              width: "100%",
              minWidth: 0,
              padding: "24px 12px",
              overflowWrap: "anywhere",
            }}
          >
            <div className="invoice-empty-icon">
              <Package size={30} />
            </div>

            <h3>No products added yet</h3>

            <p>
              Scan a barcode or search for a product above
              to start a new invoice.
            </p>
          </div>
        </div>
      ) : (
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
              {items.map((item, index) => {
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
                  <tr
                    key={item.id ?? index}
                    className={selectedIndex === index ? "invoice-row-keyboard-selected" : ""}
                    onClick={() => onSelectRow?.(index)}
                  >
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
                        <strong
                          className="invoice-product-name"
                          style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
                        >
                          {item.name || "Unnamed product"}
                          {item.isCartonLine && (
                            <span
                              className="invoice-carton-badge"
                              title={locale === "ar" ? "بيع كرتونة" : locale === "fr" ? "Vente par carton" : "Carton sale"}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 6px",
                                borderRadius: 999,
                                border: "1px solid rgba(45, 212, 191, 0.42)",
                                background: "rgba(45, 212, 191, 0.12)",
                                color: "#5eead4",
                                fontSize: 10,
                                fontWeight: 800,
                                lineHeight: 1.4,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Boxes size={11} />
                              {locale === "ar" ? "كرتونة" : locale === "fr" ? "Carton" : "CARTON"}
                            </span>
                          )}
                        </strong>

                        <span>
                          {item.sku || item.id || `Product #${index + 1}`}
                          {(item.weighedSale || item.unitLabel === "kg") && ` · ${locale === "ar" ? "بالكيلوغرام" : locale === "fr" ? "au kg" : "per kg"}`}
                          {item.weighedCategory ? ` · ${item.weighedCategory}` : ""}
                        </span>

                        {cartonSize > 1 && !(item.weighedSale || item.unitLabel === "kg") && (
                          <small className="invoice-carton-details">
                            {cartons > 0 && (
                              <span>
                                {cartons === 1 ? "1 carton" : `${cartons} cartons`}
                              </span>
                            )}

                            {cartons > 0 && looseUnits > 0 && (
                              <span> + </span>
                            )}

                            {looseUnits > 0 && (
                              <span>
                                {looseUnits === 1
                                  ? "1 loose unit"
                                  : `${looseUnits} loose units`}
                              </span>
                            )}

                            <span>{` · ${quantity} total units`}</span>
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

                          <EditableQuantityInput
                            item={item}
                            value={quantity}
                            onCommit={updateField}
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
                      <EditablePriceInput
                        item={item}
                        value={item.price}
                        onCommit={updateField}
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
                        onClick={() => setPendingDelete(item)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && typeof document !== "undefined" && createPortal(
        <div className="invoice-delete-confirm-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null); }}>
          <section className="invoice-delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-delete-confirm-title" dir={locale === "ar" ? "rtl" : "ltr"}>
            <div className="invoice-delete-confirm-icon"><Trash2 size={23} /></div>
            <h3 id="invoice-delete-confirm-title">{deleteText.title}</h3>
            <p>{deleteText.description}</p>
            <div className="invoice-delete-confirm-product"><strong>{pendingDelete.name}</strong><span>{Number(pendingDelete.quantity ?? pendingDelete.qty) || 0} {locale === "ar" ? "وحدة" : locale === "fr" ? "unité(s)" : "unit(s)"}</span></div>
            <div className="invoice-delete-confirm-actions">
              <button type="button" className="invoice-delete-cancel" onClick={() => setPendingDelete(null)}>{deleteText.cancel} <kbd>Esc</kbd></button>
              <button type="button" className="invoice-delete-accept" onClick={() => { const item = pendingDelete; setPendingDelete(null); removeItem(item); }}>{deleteText.confirm} <kbd>Enter</kbd></button>
            </div>
            <small>{deleteText.hint}</small>
          </section>
        </div>,
        document.body
      )}

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
