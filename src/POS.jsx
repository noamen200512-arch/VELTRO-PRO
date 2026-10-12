
import React, { useState } from "react";

import { SalesToolbar } from "./sales/components/SalesToolbar";
import { SalesSidebar } from "./sales/components/SalesSidebar";
import { ProductEntry } from "./sales/components/ProductEntry";
import { InvoiceTable } from "./sales/components/InvoiceTable";
import { InvoiceSummary } from "./sales/components/InvoiceSummary";

import "./sales/sales.css";

export default function POS() {
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [showProducts, setShowProducts] = useState(false);

  // Calculate subtotal after individual product discounts.
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.qty ?? item.quantity) || 0;
    const price = Number(item.price) || 0;
    const itemDiscount = Math.max(
      0,
      Number(item.discount) || 0
    );

    return sum + Math.max(0, quantity * price - itemDiscount);
  }, 0);

  // Apply the invoice-wide discount after product discounts.
  const globalDiscount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - globalDiscount);

  const paidAmount = Math.max(0, Number(paid) || 0);
  const remaining = Math.max(0, total - paidAmount);

  // Add a product and merge it when the same barcode is scanned.
  const addProduct = (product) => {
    const quantity = Math.max(
      0.01,
      Number(product.quantity) || 1
    );

    const barcode = String(product.barcode || "").trim();

    setItems((current) => {
      const existing = barcode
        ? current.find((item) => item.barcode === barcode)
        : undefined;

      if (existing) {
        const nextQuantity =
          (Number(existing.qty ?? existing.quantity) || 0) +
          quantity;

        return current.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                qty: nextQuantity,
                quantity: nextQuantity,
              }
            : item
        );
      }

      const id =
        product.id ??
        `manual-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      return [
        ...current,
        {
          ...product,
          id,
          name: String(product.name || "Unnamed product"),
          barcode,
          price: Math.max(0, Number(product.price) || 0),
          qty: quantity,
          quantity,
          discount: Math.max(0, Number(product.discount) || 0),
        },
      ];
    });
  };

  // Compatible with InvoiceTable's (id, field, value) callback.
  const updateItem = (id, field, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (field === "quantity") {
          const quantity = Math.max(0.01, Number(value) || 0.01);

          return {
            ...item,
            qty: quantity,
            quantity,
          };
        }

        if (field === "price") {
          return {
            ...item,
            price: Math.max(0, Number(value) || 0),
          };
        }

        if (field === "discount") {
          return {
            ...item,
            discount: Math.max(0, Number(value) || 0),
          };
        }

        return item;
      })
    );
  };

  const removeItem = (id) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const newInvoice = () => {
    if (
      items.length > 0 &&
      !window.confirm(
        "Start a new invoice? Unsaved invoice items will be removed."
      )
    ) {
      return;
    }

    setInvoiceNumber((number) => number + 1);
    setCustomer("");
    setItems([]);
    setPaid(0);
    setDiscount(0);
    setShowProducts(false);
  };

  const chooseCustomer = () => {
    const name = window.prompt("Customer name:", customer);

    if (name !== null) {
      setCustomer(name.trim());
    }
  };

  const modifyInvoice = () => {
    if (items.length === 0) {
      window.alert("There are no products to modify.");
      return;
    }

    window.alert(
      "You can edit product quantities, prices and discounts directly in the invoice table."
    );
  };

  const savePending = () => {
    window.alert(
      "Pending invoice storage will be connected in the next development step."
    );
  };

  const printInvoice = () => {
    if (items.length === 0) {
      window.alert("Please add products before printing.");
      return;
    }

    window.print();
  };

  return (
    <div className="pos-page">
      <header className="pos-heading">
        <div>
          <div className="pos-eyebrow">
            VELTRO-PRO / COMMERCE
          </div>

          <h1>Point of Sale</h1>

          <p>Manage invoices, products and payments.</p>
        </div>
      </header>

      <SalesToolbar
        onNew={newInvoice}
        onModify={modifyInvoice}
        onPrint={printInvoice}
        onCustomer={chooseCustomer}
        onPending={savePending}
      />

      <div className="sales-layout">
        <SalesSidebar
          invoiceNumber={invoiceNumber}
          customer={customer}
          onCustomerChange={setCustomer}
          paid={paid}
          onPaidChange={setPaid}
          remaining={remaining}
          newAmount={total}
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
            onDiscountChange={setDiscount}
            total={total}
            paid={paidAmount}
            remaining={remaining}
            onSavePending={savePending}
            onPrint={printInvoice}
          />
        </main>
      </div>
    </div>
  );
}
