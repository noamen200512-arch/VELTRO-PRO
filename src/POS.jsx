
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X, UserRound, Phone, Fingerprint, Users, Check, UserRoundPlus, BadgeCheck, ReceiptText, WalletCards, AlertTriangle } from "lucide-react";

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
  getCustomerDebt,
  getCompletedSales,
} from "./sales/salesStore.js";

import { getProducts } from "./productStore.js";
import "./sales/sales.css";

function money(value) {
  return Math.max(0, Number(value) || 0);
}

function getQuantity(item) {
  return Math.max(0, Number(item.qty ?? item.quantity) || 0);
}

function getProductId(item) {
  return String(item.productId ?? item.id ?? "");
}

function calculateSubtotal(items = []) {
  return items.reduce((sum, item) => {
    const lineTotal = getQuantity(item) * money(item.price);
    const itemDiscount = Math.min(lineTotal, money(item.discount));

    return sum + lineTotal - itemDiscount;
  }, 0);
}

function normalizeItem(product, quantity = 1) {
  const productId = String(product.productId ?? product.id ?? "");

  return {
    ...product,
    productId,
    id: productId,
    name: String(product.name || "Unnamed product"),
    barcode: String(product.barcode || ""),
    price: money(product.price),
    qty: quantity,
    quantity,
    discount: money(product.discount),
    piecesPerCarton: Math.max(
      1,
      Number(product.piecesPerCarton) || 1
    ),
    cartonPrice: money(product.cartonPrice),
  };
}

function mergeItems(currentItems, product, quantity = 1) {
  const normalized = normalizeItem(product, quantity);
  const productId = normalized.productId;

  const index = currentItems.findIndex(
    (item) => getProductId(item) === productId
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

  const [pendingInvoices, setPendingInvoices] = useState(
    () => getPendingInvoices()
  );

  const [showProducts, setShowProducts] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [busy, setBusy] = useState(false);
  const [removedItem, setRemovedItem] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRecords, setCustomerRecords] = useState([]);
  const [showSaleReview, setShowSaleReview] = useState(false);
  const [showSaleConfirm, setShowSaleConfirm] = useState(false);
  const [paidDraft, setPaidDraft] = useState("0");

  const items = invoice.items || [];
  const customer = invoice.customerName || "Anonyme";
  const isAnonymousCustomer = !invoice.customerId || String(invoice.customerId).trim().toLowerCase() === "anonyme";
  const paid = money(invoice.paid);

  useEffect(() => {
    setPaidDraft(String(invoice.paid ?? 0));
  }, [invoice.id, invoice.paid]);
  const discount = money(invoice.discount);

  // The store calculates debt from this customer's completed sales.
  const previousDebt = isAnonymousCustomer
    ? 0
    : getCustomerDebt(invoice.customerId);

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

  const getAvailableForProduct = useCallback(
    (
      productId,
      excludedItemId = null,
      excludedInvoiceId = invoice.id
    ) => {
      const inventoryProduct = getProducts().find(
        (product) => String(product.id) === String(productId)
      );

      if (!inventoryProduct) return 0;

      const stock = money(inventoryProduct.stock);

      const reservedByOtherInvoices = getPendingInvoices()
        .filter((pending) => pending.id !== excludedInvoiceId)
        .reduce((sum, pending) => {
          return sum + (pending.items || []).reduce(
            (itemSum, item) => {
              return getProductId(item) === String(productId)
                ? itemSum + getQuantity(item)
                : itemSum;
            },
            0
          );
        }, 0);

      const otherCurrentInvoiceItems = (
        invoice.items || []
      ).reduce((sum, item) => {
        if (String(item.id) === String(excludedItemId)) {
          return sum;
        }

        return getProductId(item) === String(productId)
          ? sum + getQuantity(item)
          : sum;
      }, 0);

      return Math.max(
        0,
        stock -
          reservedByOtherInvoices -
          otherCurrentInvoiceItems
      );
    },
    [invoice.id, invoice.items]
  );

  const saveCurrentAsPending = useCallback(
    (silent = false) => {
      if (items.length === 0) {
        if (!silent) {
          notify(
            "An empty invoice cannot be saved as pending.",
            "error"
          );
        }

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

      if (!result?.ok) {
        notify(getErrorMessage(result), "error");
        return false;
      }

      setInvoice(result.invoice);
      refreshPending();

      if (!silent) {
        notify("Invoice saved to Pending Invoices.", "success");
      }

      return true;
    },
    [
      invoice,
      items.length,
      subtotal,
      total,
      paid,
      remaining,
      refreshPending,
    ]
  );

  // Save a non-empty invoice before starting another one.
  const createNewInvoice = () => {
    if (busy) return;

    setShowPending(false);
    setShowEmptyWarning(false);

    if (items.length > 0) {
      if (!saveCurrentAsPending(true)) {
        return;
      }
    }

    setInvoice(createInvoice());
    setRemovedItem(null);

    notify("A new invoice is ready.", "success");
  };

  const closeEmptyAndCreate = () => {
    if (items.length > 0) return;

    setInvoice(createInvoice());
    setRemovedItem(null);
    setShowEmptyWarning(false);

    notify("Empty invoice closed. New invoice created.", "success");
  };

  const addProduct = (product) => {
    const productId = getProductId(product);

    const inventoryProduct = getProducts().find(
      (item) => String(item.id) === productId
    );

    if (!inventoryProduct) {
      notify("Product not found in the current inventory.", "error");
      return;
    }

    const quantityToAdd = Math.max(
      1,
      Math.floor(Number(product.quantity) || 1)
    );

    const currentQuantity = items.reduce((sum, item) => {
      return getProductId(item) === productId
        ? sum + getQuantity(item)
        : sum;
    }, 0);

    const stock = money(inventoryProduct.stock);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce(
          (itemSum, item) => {
            return getProductId(item) === productId
              ? itemSum + getQuantity(item)
              : itemSum;
          },
          0
        );
      }, 0);

    const available = Math.max(0, stock - othersReserved);

    if (currentQuantity + quantityToAdd > available) {
      notify(
        `${inventoryProduct.name}: only ${Math.max(
          0,
          available - currentQuantity
        )} additional units are available.`,
        "error"
      );

      return;
    }

    setInvoice((current) => ({
      ...current,
      items: mergeItems(
        current.items || [],
        inventoryProduct,
        quantityToAdd
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    setShowProducts(true);
    setShowEmptyWarning(false);
    setMessage("");
    setRemovedItem(null);
  };

  const updateItem = (id, field, value) => {
    const currentItem = items.find(
      (item) => String(item.id) === String(id)
    );

    if (!currentItem) return;

    if (field === "quantity") {
      const rawQuantity = Number(value);

      if (!Number.isFinite(rawQuantity) || rawQuantity < 1) {
        notify("Quantity must be at least one unit.", "error");
        return;
      }

      const quantity = Math.floor(rawQuantity);

      const available = getAvailableForProduct(
        getProductId(currentItem),
        currentItem.id
      );

      if (quantity > available) {
        notify(
          `${currentItem.name}: only ${available} units are available for this line.`,
          "error"
        );
        return;
      }

      setInvoice((current) => ({
        ...current,
        items: (current.items || []).map((item) => {
          if (String(item.id) !== String(id)) return item;

          return {
            ...item,
            qty: quantity,
            quantity,
          };
        }),
        status: "Draft",
        updatedAt: new Date().toISOString(),
      }));

      setMessage("");
      return;
    }

    if (field === "price" || field === "discount") {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue) || numericValue < 0) {
        notify("Price and discount must be zero or greater.", "error");
        return;
      }

      setInvoice((current) => ({
        ...current,
        items: (current.items || []).map((item) => {
          if (String(item.id) !== String(id)) return item;

          return {
            ...item,
            [field]: money(numericValue),
          };
        }),
        status: "Draft",
        updatedAt: new Date().toISOString(),
      }));

      setMessage("");
    }
  };

  const addUnit = (item) => {
    updateItem(item.id, "quantity", getQuantity(item) + 1);
  };

  const addCarton = (item) => {
    const productId = getProductId(item);

    const inventoryProduct = getProducts().find(
      (product) => String(product.id) === productId
    );

    if (!inventoryProduct) {
      notify("Product not found in the current inventory.", "error");
      return;
    }

    const cartonSize = Math.max(
      1,
      Math.floor(Number(inventoryProduct.piecesPerCarton) || 1)
    );

    if (cartonSize <= 1) {
      notify("This product has no carton quantity configured.", "error");
      return;
    }

    const currentQuantity = items.reduce((sum, currentItem) => {
      return getProductId(currentItem) === productId
        ? sum + getQuantity(currentItem)
        : sum;
    }, 0);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce(
          (itemSum, pendingItem) => {
            return getProductId(pendingItem) === productId
              ? itemSum + getQuantity(pendingItem)
              : itemSum;
          },
          0
        );
      }, 0);

    const available = Math.max(
      0,
      money(inventoryProduct.stock) - othersReserved
    );

    if (currentQuantity + cartonSize > available) {
      notify(
        `${inventoryProduct.name}: a carton requires ${cartonSize} units, but only ${Math.max(
          0,
          available - currentQuantity
        )} are available.`,
        "error"
      );

      return;
    }

    const cartonPrice = money(inventoryProduct.cartonPrice);
    const regularPrice = money(inventoryProduct.price);

    const cartonUnitPrice =
      cartonPrice > 0
        ? cartonPrice / cartonSize
        : regularPrice;

    const cartonLine = {
      ...normalizeItem(inventoryProduct, cartonSize),
      id: `${productId}-carton-${Date.now()}`,
      productId,
      qty: cartonSize,
      quantity: cartonSize,
      price: cartonUnitPrice,
      cartonPrice,
      piecesPerCarton: cartonSize,
      isCartonLine: true,
      discount: 0,
    };

    setInvoice((current) => ({
      ...current,
      items: [...(current.items || []), cartonLine],
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    setMessage("");
    setRemovedItem(null);

    notify(
      cartonPrice > 0
        ? `Added one carton of ${inventoryProduct.name} at ${cartonPrice.toLocaleString()} DA.`
        : `Added ${cartonSize} units of ${inventoryProduct.name}.`,
      "success"
    );
  };

  const removeItem = (id) => {
    const removed = items.find(
      (item) => String(item.id) === String(id)
    );

    if (!removed) return;

    setRemovedItem({
      item: { ...removed },
      invoiceId: invoice.id,
    });

    setInvoice((current) => ({
      ...current,
      items: (current.items || []).filter(
        (item) => String(item.id) !== String(id)
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    notify(`${removed.name} removed. You can undo this action.`, "info");
  };

  const undoRemove = (itemToRestore) => {
    const target = itemToRestore || removedItem?.item;

    if (!target) return;

    if (removedItem && removedItem.invoiceId !== invoice.id) {
      setRemovedItem(null);
      notify("Undo is unavailable because you changed invoices.", "error");
      return;
    }

    const productId = getProductId(target);

    const inventoryProduct = getProducts().find(
      (product) => String(product.id) === productId
    );

    if (!inventoryProduct) {
      notify("Cannot restore this item: it is no longer in inventory.", "error");
      return;
    }

    const alreadyInInvoice = items.reduce((sum, item) => {
      return getProductId(item) === productId
        ? sum + getQuantity(item)
        : sum;
    }, 0);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce(
          (itemSum, pendingItem) => {
            return getProductId(pendingItem) === productId
              ? itemSum + getQuantity(pendingItem)
              : itemSum;
          },
          0
        );
      }, 0);

    const available = Math.max(
      0,
      money(inventoryProduct.stock) - othersReserved
    );

    if (alreadyInInvoice + getQuantity(target) > available) {
      notify(
        `Cannot undo: only ${Math.max(
          0,
          available - alreadyInInvoice
        )} units are currently available.`,
        "error"
      );
      return;
    }

    setInvoice((current) => ({
      ...current,
      items: [...(current.items || []), { ...target }],
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    setRemovedItem(null);
    notify(`${target.name} restored to the invoice.`, "success");
  };

  const getCustomerRecords = () => {
    const records = [];
    const seen = new Set();
    const addRecord = (record) => {
      if (!record || typeof record !== "object") return;
      const name = String(record.name ?? record.customerName ?? record.fullName ?? record.clientName ?? "").trim();
      const id = String(record.customerId ?? record.id ?? record.code ?? record.reference ?? record.ref ?? "").trim();
      const phone = String(record.phone ?? record.phoneNumber ?? record.mobile ?? record.telephone ?? "").trim();
      if (!name || name.toLowerCase() === "anonyme") return;
      const key = (id || name).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      records.push({ ...record, name, customerId: id || name, phone, code: String(record.code ?? record.reference ?? record.ref ?? id).trim() });
    };

    // Load registered customer records when a customer module has stored them.
    const storageKeys = ["veltro_customers", "veltro_clients", "veltro_customer_list", "customers", "clients"];
    storageKeys.forEach((key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        (Array.isArray(parsed) ? parsed : Array.isArray(parsed?.customers) ? parsed.customers : []).forEach(addRecord);
      } catch { /* Ignore unrelated or malformed storage values. */ }
    });

    // Also make customers from previous invoices available as a fallback directory.
    getCompletedSales().forEach((sale) => {
      if (!sale?.customerName || !sale?.customerId) return;
      addRecord({
        name: sale.customerName,
        customerId: sale.customerId,
        phone: sale.customerPhone ?? sale.phone ?? "",
        code: sale.customerCode ?? sale.customerReference ?? sale.customerRef ?? "",
        reference: sale.customerReference ?? sale.customerRef ?? "",
      });
    });
    return records.sort((a, b) => a.name.localeCompare(b.name));
  };

  const chooseCustomer = () => {
    setCustomerRecords(getCustomerRecords());
    setCustomerSearch("");
    setShowCustomerPicker(true);
  };

  const selectCustomer = (record) => {
    const selectedName = String(record?.name || record?.customerName || "").trim();
    const anonymous = !selectedName || selectedName.toLowerCase() === "anonyme";
    updateInvoice({
      customerName: anonymous ? "Anonyme" : selectedName,
      customerId: anonymous ? "" : String(record.customerId ?? record.id ?? record.code ?? selectedName),
      customerPhone: anonymous ? "" : String(record.phone ?? record.phoneNumber ?? ""),
      customerCode: anonymous ? "" : String(record.code ?? record.reference ?? record.ref ?? ""),
      status: "Draft",
    });
    setShowCustomerPicker(false);
  };

  const filteredCustomerRecords = customerRecords.filter((record) => {
    const query = customerSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    return [
      record.name, record.customerId, record.id, record.phone, record.phoneNumber,
      record.code, record.reference, record.ref, record.customerCode,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
  });

  const openPendingInvoice = (pendingId) => {
    const pending = getPendingInvoice(pendingId);

    if (!pending) {
      refreshPending();
      notify("This pending invoice could not be found.", "error");
      return;
    }

    // Save the current invoice before switching to another saved invoice.
    if (items.length > 0 && invoice.id !== pending.id) {
      if (!saveCurrentAsPending(true)) {
        return;
      }
    }

    setInvoice({
      ...pending,
      status: "Draft",
      items: (pending.items || []).map((item) => ({ ...item })),
    });

    setRemovedItem(null);
    setShowPending(false);
    setShowEmptyWarning(false);
    setMessage("");

    notify(`Opened ${pending.invoiceNumber}.`, "success");
  };

  const completeCurrentSale = () => {
    if (busy) return;
    if (items.length === 0) {
      notify("Add products before completing the sale.", "error");
      return;
    }
    if (isAnonymousCustomer) {
      setShowSaleReview(false);
      setShowSaleConfirm(true);
    } else {
      setShowSaleConfirm(false);
      setShowSaleReview(true);
    }
  };

  const confirmSaleCompletion = () => {
    if (busy) return;
    setShowSaleReview(false);
    setShowSaleConfirm(false);
    setBusy(true);
    try {
      const result = completeSale({
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        customerName: customer,
        customerId: isAnonymousCustomer ? "" : invoice.customerId,
        status: "Completed",
      });
      if (!result.ok) {
        notify(getErrorMessage(result), "error");
        return;
      }
      setInvoice(createInvoice());
      setRemovedItem(null);
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
        pendingCount={pendingInvoices.length}
        showPending={showPending}
        disabled={busy}
      />

      {message && (
        <div
          className={`pos-message pos-message-${messageType}`}
          role="status"
        >
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {showEmptyWarning && (
        <div className="pos-empty-warning" role="alert">
          <div>
            <strong>Current invoice is empty</strong>
            <p>
              Close this empty invoice before opening a new or pending invoice.
            </p>
          </div>

          <button type="button" onClick={closeEmptyAndCreate}>
            Close Empty Invoice
          </button>

          <button
            type="button"
            onClick={() => setShowEmptyWarning(false)}
          >
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

            <button
              type="button"
              onClick={() => setShowPending(false)}
            >
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

                    <small>
                      {pending.customerName || "Walk-in customer"}
                    </small>
                  </span>

                  <span>
                    <strong>
                      {money(
                        pending.total ??
                          calculateSubtotal(pending.items || [])
                      ).toLocaleString()} DA
                    </strong>

                    <small>
                      {new Date(
                        pending.updatedAt || pending.createdAt
                      ).toLocaleString()}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {(showSaleReview || showSaleConfirm) && (
        <div className="sale-confirm-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            setShowSaleReview(false);
            setShowSaleConfirm(false);
          }
        }}>
          <section className="sale-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="sale-confirm-title">
            <header className="sale-confirm-header">
              <div className={`sale-confirm-icon ${showSaleReview ? "review" : "confirm"}`}>
                {showSaleReview ? <ReceiptText size={22} /> : <BadgeCheck size={22} />}
              </div>
              <div className="sale-confirm-heading-copy">
                <h2 id="sale-confirm-title">{showSaleReview ? "Review customer account" : "Confirm sale completion"}</h2>
                <p>{showSaleReview ? "Review the balance and invoice amounts before proceeding." : "Please confirm that you want to finalize this sale."}</p>
              </div>
              <button type="button" className="sale-confirm-close" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(false); }} disabled={busy} aria-label="Close"><X size={18} /></button>
            </header>
            {showSaleReview ? (
              <>
                <div className="sale-confirm-customer">
                  <span className="sale-confirm-customer-avatar"><UserRound size={18} /></span>
                  <span className="sale-confirm-customer-name"><small>Selected customer</small><strong>{customer}</strong></span>
                  <span className="sale-confirm-invoice-number">{invoice.invoiceNumber}</span>
                </div>
                <div className="sale-confirm-amounts">
                  <div className="sale-confirm-amount-row"><span><WalletCards size={15} /> Previous debt</span><strong>{previousDebt.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row"><span><ReceiptText size={15} /> Invoice total</span><strong>{total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row sale-confirm-paid-row"><label htmlFor="review-paid-amount"><Check size={15} /> Amount paid</label><div className="sale-confirm-paid-input-wrap"><input id="review-paid-amount" className="sale-confirm-paid-input" type="number" inputMode="decimal" min="0" max={total} step="any" value={paidDraft} disabled={busy} onFocus={() => { if (paidDraft === "0" || paidDraft === "0.00") setPaidDraft(""); }} onChange={(event) => setPaidDraft(event.target.value)} onBlur={() => { const value = paidDraft.trim() === "" ? 0 : Number(paidDraft); if (Number.isFinite(value)) { setPaidDraft(String(value)); updateInvoice({ paid: value }); } else { setPaidDraft(String(paid)); }} } aria-label="Amount paid in DA" /><span>DA</span></div></div>
                  <div className="sale-confirm-amount-row current"><span><AlertTriangle size={15} /> Current unpaid amount</span><strong>{remaining.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-total-debt"><span>Total debt after this sale</span><strong>{(previousDebt + remaining).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                </div>
                <p className="sale-confirm-note">The next step will ask you to confirm completion of this invoice.</p>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleReview(false)}>Back to invoice</button>
                  <button type="button" className="sale-confirm-primary" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(true); }}>Continue <Check size={16} /></button>
                </footer>
              </>
            ) : (
              <>
                <div className="sale-confirm-message">
                  <span className="sale-confirm-message-icon"><AlertTriangle size={21} /></span>
                  <div><strong>Complete invoice {invoice.invoiceNumber}?</strong><p>{isAnonymousCustomer ? "This sale will be recorded under Anonyme. No previous customer debt will be applied." : `This sale will be recorded for ${customer}. Please verify the amounts before finalizing.`}</p></div>
                </div>
                <div className="sale-confirm-final-amount"><span>Invoice total</span><strong>{total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleConfirm(false)} disabled={busy}>Cancel</button>
                  <button type="button" className="sale-confirm-primary" onClick={confirmSaleCompletion} disabled={busy}>{busy ? "Completing..." : <> <Check size={16} /> Confirm sale </>}</button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}

      {showCustomerPicker && (
        <div
          className="customer-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCustomerPicker(false);
          }}
        >
          <section className="customer-picker-modal" role="dialog" aria-modal="true" aria-labelledby="customer-picker-title">
            <header className="customer-picker-header">
              <div className="customer-picker-heading-icon"><Users size={21} /></div>
              <div className="customer-picker-heading-copy">
                <h2 id="customer-picker-title">Select customer</h2>
                <p>Search by name, phone number, customer ID or reference.</p>
              </div>
              <button type="button" className="customer-picker-close" onClick={() => setShowCustomerPicker(false)} aria-label="Close customer selection">
                <X size={19} />
              </button>
            </header>

            <div className="customer-picker-search">
              <Search size={18} />
              <input
                autoFocus
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Name, phone, ID or reference..."
                aria-label="Search customers"
              />
              {customerSearch && (
                <button type="button" onClick={() => setCustomerSearch("")} aria-label="Clear search"><X size={15} /></button>
              )}
            </div>

            <button type="button" className="customer-picker-anonymous" onClick={() => selectCustomer({ name: "Anonyme" })}>
              <span className="customer-picker-avatar anonymous"><UserRound size={18} /></span>
              <span className="customer-picker-record-copy">
                <strong>Anonyme</strong>
                <small>Walk-in customer · No customer debt tracking</small>
              </span>
              {String(customer).toLowerCase() === "anonyme" && <Check size={18} />}
            </button>

            <div className="customer-picker-list-heading">
              <span>Customer list</span>
              <span>{filteredCustomerRecords.length} {filteredCustomerRecords.length === 1 ? "customer" : "customers"}</span>
            </div>

            <div className="customer-picker-list">
              {filteredCustomerRecords.length ? filteredCustomerRecords.map((record, index) => {
                const recordName = String(record.name || record.customerName || "Unnamed customer");
                const recordId = String(record.customerId ?? record.id ?? record.code ?? recordName);
                const active = String(invoice.customerId || "") === recordId;
                return (
                  <button type="button" className={`customer-picker-record ${active ? "selected" : ""}`} key={`${recordId}-${index}`} onClick={() => selectCustomer(record)}>
                    <span className="customer-picker-avatar"><UserRound size={18} /></span>
                    <span className="customer-picker-record-copy">
                      <strong>{recordName}</strong>
                      <small>
                        {record.phone || record.phoneNumber ? <><Phone size={12} /> {record.phone || record.phoneNumber}</> : <><Fingerprint size={12} /> ID: {recordId}</>}
                        {(record.code || record.reference || record.ref) && <span className="customer-picker-reference">Ref: {record.code || record.reference || record.ref}</span>}
                      </small>
                    </span>
                    {active && <Check size={18} className="customer-picker-selected-check" />}
                  </button>
                );
              }) : (
                <div className="customer-picker-empty">
                  <span className="customer-picker-empty-icon"><UserRoundPlus size={23} /></span>
                  <strong>{customerSearch ? "No matching customers" : "No saved customers yet"}</strong>
                  <p>{customerSearch ? "Try another name, phone number, ID or reference." : "Customers from previous invoices will appear here. You can still use Anonyme for a quick sale."}</p>
                </div>
              )}
            </div>

            <footer className="customer-picker-footer">
              <span><Users size={14} /> Choose a customer to link this invoice to their account.</span>
              <button type="button" onClick={() => setShowCustomerPicker(false)}>Cancel</button>
            </footer>
          </section>
        </div>
      )}

      <div className="sales-layout">
        <SalesSidebar
          invoiceNumber={invoice.invoiceNumber}
          customer={customer}
          onCustomerChange={(value) => {
            const selectedName = String(value ?? "").trim();
            const anonymous = !selectedName || selectedName.toLowerCase() === "anonyme";
            updateInvoice({
              customerName: anonymous ? "Anonyme" : selectedName,
              customerId: anonymous ? "" : selectedName,
            });
          }}
          paid={paid}
          onPaidChange={(value) =>
            updateInvoice({ paid: money(value) })
          }
          remaining={remaining}
          newAmount={total}
          invoiceDate={invoice.createdAt}
          currentUser={
            localStorage.getItem("veltro_current_user") ||
            "Administrator"
          }
          previousDebt={previousDebt}
        />

        <main className="sales-workspace">
          <ProductEntry
            onAddProduct={addProduct}
            onAddCarton={addCarton}
            showProducts={showProducts}
            onShowProducts={setShowProducts}
          />

          <InvoiceTable
            items={items}
            onUpdate={updateItem}
            onRemove={removeItem}
            onUndoRemove={undoRemove}
            onAddUnit={addUnit}
            onAddCarton={addCarton}
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
            previousDebt={previousDebt}
            customerName={customer}
            onViewDebtDetails={() => {
              notify(
                `${customer || "Customer"} has ${previousDebt.toLocaleString()} DA in previous unpaid balances.`,
                "info"
              );
            }}
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
