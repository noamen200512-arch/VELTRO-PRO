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

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const total = Math.max(
    0,
    subtotal - Math.max(0, Number(discount) || 0)
  );

  const remaining = Math.max(
    0,
    total - Math.max(0, Number(paid) || 0)
  );

  const addProduct = (product) => {
    setItems((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...current, { ...product, qty: 1 }];
    });
  };

  const updateItem = (id, changes) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const newInvoice = () => {
    setInvoiceNumber((number) => number + 1);
    setCustomer("");
    setItems([]);
    setPaid(0);
    setDiscount(0);
    setShowProducts(false);
  };

  const savePending = () => {
    alert("Pending invoices will be implemented in the next step.");
  };

  const printInvoice = () => {
    if (items.length === 0) {
      alert("Please add products before printing.");
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

          <p>
            Manage invoices, products and payments.
          </p>
        </div>
      </header>

      <SalesToolbar
        onNew={newInvoice}
        onModify={() =>
          alert("Invoice modification will be added next.")
        }
        onPrint={printInvoice}
        onCustomer={() => {
          const name = window.prompt(
            "Customer name:",
            customer
          );

          if (name !== null) {
            setCustomer(name);
          }
        }}
        onPending={savePending}
      />

      <div className="pos-layout">
        <SalesSidebar
          invoiceNumber={invoiceNumber}
          customer={customer}
          onCustomerChange={setCustomer}
          paid={paid}
          onPaidChange={setPaid}
          remaining={remaining}
          newAmount={total}
        />

        <main className="pos-workspace">
          <ProductEntry
            onAddProduct={addProduct}
            showProducts={showProducts}
            onShowProducts={() =>
              setShowProducts((visible) => !visible)
            }
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
            paid={paid}
            remaining={remaining}
            onSavePending={savePending}
            onPrint={printInvoice}
          />
        </main>
      </div>
    </div>
  );
}
