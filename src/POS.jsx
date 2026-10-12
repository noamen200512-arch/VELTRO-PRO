
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { SalesToolbar } from "./sales/components/SalesToolbar";
import { SalesSidebar } from "./sales/components/SalesSidebar";
import { ProductEntry } from "./sales/components/ProductEntry";
import { InvoiceTable } from "./sales/components/InvoiceTable";
import { InvoiceSummary } from "./sales/components/InvoiceSummary";

import {
  createInvoice,
  getPendingInvoices,
  savePendingInvoice,
  getPendingInvoice,
  completeSale,
} from "./sales/salesStore.js";

import { getProducts } from "./productStore.js";
import "./sales/sales.css";

function money(value) {
  return Math.max(0, Number(value) || 0);
}

function getQuantity(item) {
  return money(item.qty ?? item.quantity);
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => {
    const lineTotal = getQuantity(item) * money(item.price);
    const itemDiscount = Math.min(lineTotal, money(item.discount));
    return sum + lineTotal - itemDiscount;
  }, 0);
}

function normalizeItem(product, quantity = 1) {
  return {
    ...product,
    productId: String(product.productId ?? product.id ?? ""),
    id: String(product.productId ?? product.id ?? ""),
    name: String(product.name || "Unnamed product"),
    barcode: String(product.barcode || ""),
    price: money(product.price),
    qty: quantity,
    quantity,
    discount: money(product.discount),
    piecesPerCarton: Math.max(1, Number(product.piecesPerCarton) || 1),
    cartonPrice: money(product.cartonPrice),
  };
}

function mergeItems(currentItems, product, quantity = 1) {
  const normalized = normalizeItem(product, quantity);
  const productId = normalized.productId;

  const index = currentItems.findIndex(
    (item) =>
      String(item.productId ?? item.id) === productId
  );

  if (index === -1) {
    return [...currentItems, normalized];
  }

  return currentItems.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    const nextQuantity = getQuantity(item) + quantity;

    return {
      ...item,
      qty: nextQuantity,
      quantity: nextQuantity,
    };
  });
}

function getErrorMessage(result) {
  switch (result?.error) {
    case "EMPTY_INVOICE":
      return "This invoice has no products.";
    case "PRODUCT_NOT_FOUND":
      return "A product in this invoice no longer exists in inventory.";
    case "INSUFFICIENT_STOCK":
      return `${result.productName || "Product"}: requested ${result.requested}, available ${result.available}.`;
    case "ALREADY_COMPLETED":
      return "This invoice has already been completed.";
    case "STORAGE_ERROR":
      return "Could not save the pending invoice. Check browser storage.";
    case "STOCK_SAVE_FAILED":
      return "Could not update inventory. The sale was not completed.";
    case "PENDING_SAVE_FAILED":
      return "Could not update pending invoices. Please retry.";
    case "SALE_SAVE_FAILED":
      return "Could not record the sale. Please check inventory before retrying.";
    default:
      return "The operation could not be completed.";
  }
}

export default function POS() {
  const [invoice, setInvoice] = useState(() => createInvoice());
  const [pendingInvoices, setPendingInvoices] = useState(() => getPendingInvoices());
  const [showProducts, setShowProducts] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [busy, setBusy] = useState(false);

  const items = invoice.items || [];
  const customer = invoice.customerName || "";
  const paid = money(invoice.paid);
  const discount = money(invoice.discount);

  const subtotal = useMemo(
    () => calculateSubtotal(items),
    [items]
  );

  const total = Math.max(0, subtotal - discount);
  const remaining = Math.max(0, total - paid);

  const refreshPending = useCallback(() => {
    setPendingInvoices(getPendingInvoices());
  }, []);

  useEffect(() => {
    refreshPending();

    const refresh = () => refreshPending();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refreshPending]);

  const notify = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const updateInvoice = (changes) => {
    setInvoice((current) => ({
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveCurrentAsPending = useCallback(
    (silent = false) => {
      if (items.length === 0) {
        if (!silent) notify("An empty invoice cannot be saved as pending.", "error");
        return false;
      }

      const result = savePendingInvoice({
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        status: "Pending",
      });

      if (!result.ok) {
        notify(getErrorMessage(result), "error");
        return false;
      }

      setInvoice(result.invoice);
      refreshPending();

      if (!silent) notify("Invoice saved to Pending Invoices.", "success");

      return true;
    },
    [invoice, items.length, subtotal, total, paid, remaining, refreshPending]
  );

  const createNewInvoice = () => {
    if (busy) return;

    setShowPending(false);

    if (items.length === 0) {
      setShowEmptyWarning(true);
      return;
    }

    if (invoice.status !== "Pending") {
      const saved = saveCurrentAsPending(true);
      if (!saved) return;
    }

    setInvoice(createInvoice());
    setShowEmptyWarning(false);
    notify("A new invoice is ready.", "success");
  };

  const closeEmptyAndCreate = () => {
    if (items.length > 0) return;

    setInvoice(createInvoice());
    setShowEmptyWarning(false);
    notify("Empty invoice closed. New invoice created.", "success");
  };

  const addProduct = (product) => {
    const productId = String(product.productId ?? product.id ?? "");
    const inventoryProduct = getProducts().find(
      (item) => String(item.id) === productId
    );

    if (!inventoryProduct) {
      notify("Product not found in the current inventory.", "error");
      return;
    }

    const quantityToAdd = Math.max(0.01, Number(product.quantity) || 1);
    const currentQuantity = items.reduce((sum, item) => {
      return String(item.productId ?? item.id) === productId
        ? sum + getQuantity(item)
        : sum;
    }, 0);

    const stock = money(inventoryProduct.stock);

    // Exclude the current invoice's own reservation while editing it.
    const othersReserved = pendingInvoices
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce((itemSum, item) => {
          return String(item.productId ?? item.id) === productId
            ? itemSum + getQuantity(item)
            : itemSum;
        }, 0);
      }, 0);

    const available = Math.max(0, stock - othersReserved);

    if (currentQuantity + quantityToAdd > available) {
      notify(
        `${inventoryProduct.name}: only ${Math.max(0, available - currentQuantity)} additional units are available.`,
        "error"
      );
      return;
    }

    const nextItems = mergeItems(items, inventoryProduct, quantityToAdd);

    updateInvoice({
      items: nextItems,
      status: "Draft",
    });
    setShowProducts(true);
    setShowEmptyWarning(false);
    setMessage("");
  };

  const updateItem = (id, field, value) => {
    setInvoice((current) => {
      const nextItems = (current.items || []).map((item) => {
        if (String(item.id) !== String(id)) return item;

        if (field === "quantity") {
          const quantity = Math.max(0.01, Number(value) || 0.01);
          return { ...item, qty: quantity, quantity };
        }

        if (field === "price") {
          return { ...item, price: money(value) };
        }

        if (field === "discount") {
          return { ...item, discount: money(value) };
        }

        return item;
      });

      return {
        ...current,
        items: nextItems,
        status: "Draft",
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const removeItem = (id) => {
    const removed = items.find((item) => String(item.id) === String(id));

    setInvoice((current) => ({
      ...current,
      items: (current.items || []).filter(
        (item) => String(item.id) !== String(id)
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    if (removed) notify(`${removed.name} removed from this invoice.`, "info");
  };

  const chooseCustomer = () => {
    const name = window.prompt("Customer name:", customer);
    if (name === null) return;

    updateInvoice({
      customerName: name.trim(),
      customerId: name.trim(),
    });
  };

  const openPendingInvoice = (pendingId) => {
    const pending = getPendingInvoice(pendingId);

    if (!pending) {
      refreshPending();
      notify("This pending invoice could not be found.", "error");
      return;
    }

    if (items.length > 0 && invoice.id !== pending.id) {
      if (invoice.status !== "Pending" && !saveCurrentAsPending(true)) {
        return;
      }
    } else if (items.length === 0 && invoice.id !== pending.id) {
      setShowEmptyWarning(true);
      notify("Close the empty invoice before opening another invoice.", "error");
      return;
    }

    // Opening a pending invoice does not delete its saved record.
    setInvoice({
      ...pending,
      status: "Draft",
      items: (pending.items || []).map((item) => ({ ...item })),
    });

    setShowPending(false);
    setShowEmptyWarning(false);
    notify(`Opened ${pending.invoiceNumber}.`, "success");
  };

  const completeCurrentSale = () => {
    if (busy) return;

    if (items.length === 0) {
      notify("Add products before completing the sale.", "error");
      return;
    }

    if (paid > total) {
      notify("The amount paid cannot exceed the invoice total in this version.", "error");
      return;
    }

    const confirmed = window.confirm(
      `Complete invoice ${invoice.invoiceNumber} for ${total.toLocaleString()} DA?`
    );

    if (!confirmed) return;

    setBusy(true);

    try {
      const result = completeSale({
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        customerName: customer,
        status: "Completed",
      });

      if (!result.ok) {
        notify(getErrorMessage(result), "error");
        return;
      }

      setInvoice(createInvoice());
      refreshPending();
      notify("Sale completed and inventory updated.", "success");
    } finally {
      setBusy(false);
    }
  };

  const printInvoice = () => {
    if (items.length === 0) {
      notify("Add products before printing.", "error");
      return;
    }

    window.print();
  };

  return (
    <div className="pos-page">
      <header className="pos-heading">
        <div>
          <div className="pos-eyebrow">VELTRO-PRO / COMMERCE</div>
          <h1>Point of Sale</h1>
          <p>Manage invoices, products and payments.</p>
        </div>
      </header>

      <SalesToolbar
        onNew={createNewInvoice}
        onPrint={printInvoice}
        onCustomer={chooseCustomer}
        onPending={() => setShowPending((current) => !current)}
      />

      {message && (
        <div className={`pos-message pos-message-${messageType}`} role="status">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage("")} aria-label="Dismiss">
            <XIcon />
          </button>
        </div>
      )}

      {showEmptyWarning && (
        <div className="pos-empty-warning" role="alert">
          <div>
            <strong>Current invoice is empty</strong>
            <p>Close this empty invoice before opening a new or pending invoice.</p>
          </div>
          <button type="button" onClick={closeEmptyAndCreate}>
            Close Empty Invoice
          </button>
          <button type="button" onClick={() => setShowEmptyWarning(false)}>
            Cancel
          </button>
        </div>
      )}

      {showPending && (
        <section className="pos-pending-panel">
          <div className="pos-pending-header">
            <div>
              <h2>Pending Invoices</h2>
              <p>{pendingInvoices.length} saved invoice(s)</p>
            </div>
            <button type="button" onClick={() => setShowPending(false)}>
              Close
            </button>
          </div>

          {pendingInvoices.length === 0 ? (
            <p>No pending invoices yet.</p>
          ) : (
            <div className="pos-pending-list">
              {pendingInvoices.map((pending) => (
                <button
                  type="button"
                  key={pending.id}
                  className="pos-pending-item"
                  onClick={() => openPendingInvoice(pending.id)}
                >
                  <span>
                    <strong>{pending.invoiceNumber}</strong>
                    <small>{pending.customerName || "Walk-in customer"}</small>
                  </span>
                  <span>
                    <strong>
                      {money(pending.total ?? calculateSubtotal(pending.items || [])).toLocaleString()} DA
                    </strong>
                    <small>
                      {new Date(pending.updatedAt || pending.createdAt).toLocaleString()}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="sales-layout">
        <SalesSidebar
          invoiceNumber={invoice.invoiceNumber}
          customer={customer}
          onCustomerChange={(value) =>
            updateInvoice({ customerName: value, customerId: value })
          }
          paid={paid}
          onPaidChange={(value) => updateInvoice({ paid: money(value) })}
          remaining={remaining}
          newAmount={total}
          invoiceDate={invoice.createdAt}
          currentUser={
            localStorage.getItem("veltro_current_user") || "Administrator"
          }
          previousDebt={0}
        />

        <main className="sales-workspace">
          <ProductEntry
            onAddProduct={addProduct}
            showProducts={showProducts}
            onShowProducts={setShowProducts}
          />

          <InvoiceTable
            items={items}
            onUpdate={updateItem}
            onRemove={removeItem}
          />

          <InvoiceSummary
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={(value) =>
              updateInvoice({ discount: money(value) })
            }
            total={total}
            paid={paid}
            remaining={remaining}
            onSavePending={() => saveCurrentAsPending(false)}
            onPrint={printInvoice}
            onCompleteSale={completeCurrentSale}
            busy={busy}
          />
        </main>
      </div>
    </div>
  );
}

function XIcon() {
  return <span aria-hidden="true">×</span>;
}
