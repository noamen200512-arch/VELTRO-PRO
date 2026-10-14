import React, { useState } from "react";

export default function PurchaseInvoice({
onClose,
onConfirm,
suppliers = [],
products = [],
}) {
const [supplier, setSupplier] = useState("");
const [invoiceNumber] = useState(
"PUR-${Date.now().toString().slice(-8)}"
);
const [invoiceDate, setInvoiceDate] = useState(
new Date().toISOString().slice(0, 10)
);
const [search, setSearch] = useState("");
const [items, setItems] = useState([]);
const [amountPaid, setAmountPaid] = useState("0");

const filteredProducts = products.filter((product) => {
const query = search.trim().toLowerCase();

if (!query) return false;

return [
  product.name,
  product.sku,
  product.barcode,
  product.reference,
].some((value) =>
  String(value || "").toLowerCase().includes(query)
);

});

const addProduct = (product) => {
setItems((current) => {
const existing = current.find(
(item) => String(item.id) === String(product.id)
);

  if (existing) {
    return current.map((item) =>
      String(item.id) === String(product.id)
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  }

  return [
    ...current,
    {
      id: product.id,
      name: product.name || "Unnamed product",
      quantity: 1,
      purchasePrice: Number(product.purchasePrice) || 0,
    },
  ];
});

setSearch("");

};

const updateItem = (id, field, value) => {
setItems((current) =>
current.map((item) =>
String(item.id) === String(id)
? {
...item,
[field]: Math.max(
0,
Number(value) || 0
),
}
: item
)
);
};

const removeItem = (id) => {
setItems((current) =>
current.filter((item) => String(item.id) !== String(id))
);
};

const total = items.reduce(
(sum, item) => sum + item.quantity * item.purchasePrice,
0
);

const formatMoney = (value) =>
new Intl.NumberFormat("fr-DZ", {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
}).format(value) + " DA";

const handleConfirm = () => {
if (!supplier) {
alert("Please select a supplier.");
return;
}

if (items.length === 0) {
  alert("Please add at least one product.");
  return;
}

const paid = Number(amountPaid) || 0;

if (paid < 0 || paid > total) {
  alert("The paid amount must be between 0 and the invoice total.");
  return;
}

const invoice = {
  id: invoiceNumber,
  invoiceNumber,
  date: invoiceDate,
  supplierId: supplier,
  items,
  total,
  amountPaid: paid,
  remaining: total - paid,
  status: paid === total ? "paid" : paid > 0 ? "partial" : "unpaid",
  createdAt: new Date().toISOString(),
};

if (onConfirm) {
  onConfirm(invoice);
} else {
  alert("Invoice interface ready. Saving will be connected next.");
}

};

return (
<div className="purchase-modal-backdrop">
<section
className="purchase-invoice-modal"
role="dialog"
aria-modal="true"
aria-labelledby="purchase-invoice-title"
>
<header className="purchase-modal-header">
<div>
<span className="purchase-eyebrow">PURCHASE MANAGEMENT</span>
<h2 id="purchase-invoice-title">New Purchase Invoice</h2>
<p>Invoice No. {invoiceNumber}</p>
</div>

      <button
        type="button"
        className="purchase-close-button"
        onClick={onClose}
        aria-label="Close invoice"
      >
        ×
      </button>
    </header>

    <div className="purchase-invoice-fields">
      <label className="purchase-field">
        <span>Supplier *</span>
        <select
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
          required
        >
          <option value="">Select supplier</option>
          {suppliers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="purchase-field">
        <span>Invoice date</span>
        <input
          type="date"
          value={invoiceDate}
          onChange={(event) => setInvoiceDate(event.target.value)}
        />
      </label>
    </div>

    <div className="purchase-product-search">
      <label className="purchase-field">
        <span>Search products</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Product name, reference, or barcode..."
        />
      </label>

      {search.trim() && (
        <div className="purchase-search-results">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <button
                type="button"
                className="purchase-search-result"
                key={product.id}
                onClick={() => addProduct(product)}
              >
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.barcode || product.sku || "No barcode"}
                  </small>
                </span>
                <span>
                  {formatMoney(Number(product.purchasePrice) || 0)}
                </span>
              </button>
            ))
          ) : (
            <p className="purchase-empty-search">
              No matching products found.
            </p>
          )}
        </div>
      )}
    </div>

    <div className="purchase-items-section">
      <div className="purchase-section-heading">
        <h3>Invoice items</h3>
        <span>{items.length} products</span>
      </div>

      <div className="purchase-items-table-wrapper">
        <table className="purchase-items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit cost</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="purchase-empty-row">
                  No products added. Search above to add products.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>
                    <input
                      className="purchase-quantity-input"
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, "quantity", event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="purchase-cost-input"
                      type="number"
                      min="0"
                      step="any"
                      value={item.purchasePrice}
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          "purchasePrice",
                          event.target.value
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>
                      {formatMoney(item.quantity * item.purchasePrice)}
                    </strong>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="purchase-remove-button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="purchase-invoice-summary">
      <div className="purchase-summary-line">
        <span>Invoice total</span>
        <strong>{formatMoney(total)}</strong>
      </div>

      <label className="purchase-field purchase-paid-field">
        <span>Amount paid</span>
        <input
          type="number"
          min="0"
          max={total}
          step="any"
          value={amountPaid}
          onChange={(event) => setAmountPaid(event.target.value)}
        />
      </label>

      <div className="purchase-summary-line purchase-remaining">
        <span>Remaining balance</span>
        <strong>
          {formatMoney(Math.max(0, total - (Number(amountPaid) || 0)))}
        </strong>
      </div>
    </div>

    <footer className="purchase-modal-footer">
      <button
        type="button"
        className="purchase-secondary-button"
        onClick={onClose}
      >
        Cancel
      </button>

      <button
        type="button"
        className="purchase-primary-button"
        onClick={handleConfirm}
      >
        Confirm Purchase
      </button>
    </footer>
  </section>
</div>

);
}