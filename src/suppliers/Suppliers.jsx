
import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Truck,
  Users,
  Wallet,
  CreditCard,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  ArrowLeft,
  FileText,
  CalendarDays,
  CircleDollarSign,
  CheckCircle2,
  AlertTriangle,
  Package,
  History,
} from "lucide-react";

import {
  getPurchaseSuppliers,
  savePurchaseSuppliers,
  getPurchaseInvoices,
} from "../purchases/purchaseService.js";

import "./suppliers.css";

const money = (value) =>
  `${Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 2,
  })} DA`;

const normalize = (value) =>
  String(value ?? "").trim().toLowerCase();

const createId = () =>
  `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  note: "",
};

function readSuppliers() {
  try {
    return getPurchaseSuppliers().map((supplier) => ({
      ...supplier,
      id: supplier.id || createId(),
      name: supplier.name || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      note: supplier.note || "",
      debt: Number(supplier.debt || 0),
      credit: Number(supplier.credit || 0),
    }));
  } catch {
    return [];
  }
}

function readInvoices() {
  try {
    return getPurchaseInvoices();
  } catch {
    return [];
  }
}

function StatCard({ icon: Icon, label, value, color, note }) {
  return (
    <article className="supplier-stat-card">
      <div className="supplier-stat-top">
        <span>{label}</span>
        <span
          className="supplier-stat-icon"
          style={{ "--stat-color": color }}
        >
          <Icon size={20} />
        </span>
      </div>
      <strong className="supplier-stat-value">{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function Field({ label, children, full = false }) {
  return (
    <label
      className={`supplier-field ${full ? "supplier-field-full" : ""}`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function SupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(supplier || {}),
  }));

  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const submit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (form.phone.trim() && !/^[+\d\s().-]{5,25}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      note: form.note.trim(),
    });
  };

  return (
    <div
      className="supplier-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="supplier-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-modal-title"
      >
        <header className="supplier-modal-header">
          <div>
            <span className="supplier-eyebrow">SUPPLIER MANAGEMENT</span>
            <h2 id="supplier-modal-title">
              {supplier ? "Edit supplier" : "Add new supplier"}
            </h2>
            <p>Enter the supplier's contact information.</p>
          </div>

          <button
            type="button"
            className="supplier-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="supplier-form-grid">
            <Field label="Supplier name *" full>
              <input
                autoFocus
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Enter supplier or company name"
                maxLength={120}
              />
            </Field>

            <Field label="Phone number">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+213 ..."
                maxLength={25}
              />
            </Field>

            <Field label="Email address">
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="supplier@example.com"
                maxLength={150}
              />
            </Field>

            <Field label="Address" full>
              <input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                placeholder="City, street, address"
                maxLength={250}
              />
            </Field>

            <Field label="Notes" full>
              <textarea
                value={form.note}
                onChange={(event) => update("note", event.target.value)}
                placeholder="Additional information..."
                rows={3}
                maxLength={1000}
              />
            </Field>
          </div>

          {error && (
            <div className="supplier-alert supplier-alert-error">
              <AlertTriangle size={17} />
              {error}
            </div>
          )}

          <footer className="supplier-modal-actions">
            <button
              type="button"
              className="supplier-button supplier-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="supplier-button supplier-button-primary"
            >
              <Save size={17} />
              {supplier ? "Save changes" : "Add supplier"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function SupplierDetails({ supplier, invoices, onBack, onEdit }) {
  const supplierInvoices = invoices
    .filter(
      (invoice) =>
        normalize(invoice.supplier) === normalize(supplier.name)
    )
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    );

  const totalPurchases = supplierInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  const totalPaid = supplierInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.paid || 0),
    0
  );

  return (
    <section className="supplier-details">
      <button
        type="button"
        className="supplier-back-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back to suppliers
      </button>

      <div className="supplier-detail-hero">
        <div className="supplier-detail-identity">
          <div className="supplier-avatar supplier-avatar-large">
            <Truck size={28} />
          </div>
          <div>
            <span className="supplier-eyebrow">SUPPLIER PROFILE</span>
            <h2>{supplier.name}</h2>
            <p>{supplier.phone || "No phone number added"}</p>
          </div>
        </div>

        <button
          type="button"
          className="supplier-button supplier-button-secondary"
          onClick={onEdit}
        >
          <Pencil size={16} />
          Edit supplier
        </button>
      </div>

      <div className="supplier-contact-grid">
        <div className="supplier-contact-card">
          <Phone size={18} />
          <div>
            <span>Phone</span>
            <strong>{supplier.phone || "Not provided"}</strong>
          </div>
        </div>
        <div className="supplier-contact-card">
          <MapPin size={18} />
          <div>
            <span>Address</span>
            <strong>{supplier.address || "Not provided"}</strong>
          </div>
        </div>
        <div className="supplier-contact-card">
          <FileText size={18} />
          <div>
            <span>Email</span>
            <strong>{supplier.email || "Not provided"}</strong>
          </div>
        </div>
      </div>

      <div className="supplier-stats-grid supplier-detail-stats">
        <StatCard
          icon={Package}
          label="Total purchases"
          value={money(totalPurchases)}
          color="#35d6c2"
          note={`${supplierInvoices.length} purchase invoices`}
        />
        <StatCard
          icon={Wallet}
          label="Recorded payments"
          value={money(totalPaid)}
          color="#78b8ff"
          note="Paid amounts on purchase invoices"
        />
        <StatCard
          icon={CreditCard}
          label="Outstanding balance"
          value={money(supplier.debt)}
          color="#ffbd72"
          note="Balance stored in supplier account"
        />
      </div>

      {supplier.note && (
        <div className="supplier-note-card">
          <strong>Notes</strong>
          <p>{supplier.note}</p>
        </div>
      )}

      <section className="supplier-panel">
        <div className="supplier-panel-heading">
          <div>
            <h3>Purchase history</h3>
            <p>Invoices recorded for this supplier.</p>
          </div>
          <History size={20} />
        </div>

        {supplierInvoices.length === 0 ? (
          <div className="supplier-empty-state supplier-empty-compact">
            <FileText size={30} />
            <strong>No purchase invoices yet</strong>
            <p>Invoices will appear here after purchases are recorded.</p>
          </div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.map((invoice) => {
                  const remaining = Math.max(
                    0,
                    Number(
                      invoice.remaining ??
                      (Number(invoice.total || 0) - Number(invoice.paid || 0))
                    )
                  );

                  return (
                    <tr key={invoice.id || invoice.number}>
                      <td>
                        <strong>{invoice.number || "—"}</strong>
                      </td>
                      <td>
                        {invoice.date
                          ? new Date(invoice.date).toLocaleDateString("fr-DZ")
                          : "—"}
                      </td>
                      <td>{money(invoice.total)}</td>
                      <td>{money(invoice.paid)}</td>
                      <td className={remaining > 0 ? "supplier-debt-text" : ""}>
                        {money(remaining)}
                      </td>
                      <td>
                        <span
                          className={`supplier-status ${
                            remaining <= 0 ? "is-paid" : "is-unpaid"
                          }`}
                        >
                          {remaining <= 0 ? "Paid" : "Outstanding"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(readSuppliers);
  const [invoices] = useState(readInvoices);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === selectedSupplierId
  );

  const filteredSuppliers = useMemo(() => {
    const query = normalize(search);

    return suppliers
      .filter((supplier) =>
        [
          supplier.name,
          supplier.phone,
          supplier.email,
          supplier.address,
        ].some((value) => normalize(value).includes(query))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, search]);

  const totalDebt = suppliers.reduce(
    (sum, supplier) => sum + Number(supplier.debt || 0),
    0
  );

  const totalCredit = suppliers.reduce(
    (sum, supplier) => sum + Number(supplier.credit || 0),
    0
  );

  const totalPurchases = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0
  );

  const notify = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  const persistSuppliers = (nextSuppliers) => {
    if (!savePurchaseSuppliers(nextSuppliers)) {
      notify(
        "Could not save supplier data. Check your browser storage.",
        "error"
      );
      return false;
    }

    setSuppliers(nextSuppliers);
    return true;
  };

  const openNewSupplier = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const openEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const saveSupplier = (form) => {
    const duplicate = suppliers.find(
      (supplier) =>
        normalize(supplier.name) === normalize(form.name) &&
        supplier.id !== editingSupplier?.id
    );

    if (duplicate) {
      notify("A supplier with this name already exists.", "error");
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingSupplier) {
      const updated = {
        ...editingSupplier,
        ...form,
        updatedAt: timestamp,
      };

      const next = suppliers.map((supplier) =>
        supplier.id === editingSupplier.id ? updated : supplier
      );

      if (!persistSuppliers(next)) return;

      setSelectedSupplierId(updated.id);
      notify("Supplier details updated successfully.");
    } else {
      const created = {
        id: createId(),
        ...form,
        debt: 0,
        credit: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      if (!persistSuppliers([...suppliers, created])) return;

      setSelectedSupplierId(created.id);
      notify("Supplier added successfully.");
    }

    setModalOpen(false);
    setEditingSupplier(null);
  };

  const deleteSupplier = (supplier) => {
    const hasInvoices = invoices.some(
      (invoice) =>
        normalize(invoice.supplier) === normalize(supplier.name)
    );

    if (hasInvoices) {
      notify(
        "This supplier has purchase invoices. Keep the account to preserve its history.",
        "error"
      );
      return;
    }

    if (Number(supplier.debt || 0) > 0 || Number(supplier.credit || 0) > 0) {
      notify(
        "This supplier has a recorded balance. Resolve the balance before deleting the account.",
        "error"
      );
      return;
    }

    if (
      !window.confirm(
        `Delete supplier "${supplier.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    const next = suppliers.filter((item) => item.id !== supplier.id);

    if (!persistSuppliers(next)) return;

    if (selectedSupplierId === supplier.id) setSelectedSupplierId(null);

    notify("Supplier deleted.");
  };

  if (selectedSupplier) {
    return (
      <div className="supplier-layout">
        {notice && (
          <div className={`supplier-notice ${noticeType}`}>
            {noticeType === "error" ? (
              <AlertTriangle size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        <SupplierDetails
          supplier={selectedSupplier}
          invoices={invoices}
          onBack={() => setSelectedSupplierId(null)}
          onEdit={() => openEditSupplier(selectedSupplier)}
        />

        {modalOpen && (
          <SupplierModal
            supplier={editingSupplier}
            onClose={() => {
              setModalOpen(false);
              setEditingSupplier(null);
            }}
            onSave={saveSupplier}
          />
        )}
      </div>
    );
  }

  return (
    <div className="supplier-layout">
      {notice && (
        <div className={`supplier-notice ${noticeType}`}>
          {noticeType === "error" ? (
            <AlertTriangle size={17} />
          ) : (
            <CheckCircle2 size={17} />
          )}
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <header className="supplier-page-header">
        <div>
          <span className="supplier-eyebrow">COMMERCE / CONTACTS</span>
          <h1>Suppliers</h1>
          <p>Manage supplier details, purchase history and account balances.</p>
        </div>

        <button
          type="button"
          className="supplier-button supplier-button-primary"
          onClick={openNewSupplier}
        >
          <Plus size={18} />
          Add supplier
        </button>
      </header>

      <div className="supplier-stats-grid">
        <StatCard
          icon={Truck}
          label="Total suppliers"
          value={suppliers.length.toLocaleString("fr-DZ")}
          color="#35d6c2"
          note="Supplier accounts saved"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Purchase invoices"
          value={money(totalPurchases)}
          color="#78b8ff"
          note={`${invoices.length} recorded invoices`}
        />
        <StatCard
          icon={CreditCard}
          label="Outstanding debt"
          value={money(totalDebt)}
          color="#ffbd72"
          note="Balances recorded in supplier accounts"
        />
        <StatCard
          icon={Wallet}
          label="Supplier credit"
          value={money(totalCredit)}
          color="#a78bfa"
          note="Available credit recorded"
        />
      </div>

      <section className="supplier-panel">
        <div className="supplier-panel-heading supplier-list-heading">
          <div>
            <h3>Supplier directory</h3>
            <p>Search, view and manage your supplier accounts.</p>
          </div>

          <span className="supplier-count">
            {filteredSuppliers.length} supplier
            {filteredSuppliers.length === 1 ? "" : "s"}
          </span>
        </div>

        <label className="supplier-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, email or address..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </label>

        {filteredSuppliers.length === 0 ? (
          <div className="supplier-empty-state">
            <div className="supplier-empty-icon">
              {search ? <Search size={30} /> : <Users size={32} />}
            </div>
            <h3>{search ? "No matching suppliers" : "No suppliers yet"}</h3>
            <p>
              {search
                ? "Try another search term."
                : "Add your first supplier to start building your directory."}
            </p>
            {!search && (
              <button
                type="button"
                className="supplier-button supplier-button-primary"
                onClick={openNewSupplier}
              >
                <Plus size={17} />
                Add first supplier
              </button>
            )}
          </div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Total purchases</th>
                  <th>Balance due</th>
                  <th>Account status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => {
                  const supplierInvoices = invoices.filter(
                    (invoice) =>
                      normalize(invoice.supplier) === normalize(supplier.name)
                  );

                  const purchaseTotal = supplierInvoices.reduce(
                    (sum, invoice) => sum + Number(invoice.total || 0),
                    0
                  );

                  const debt = Number(supplier.debt || 0);

                  return (
                    <tr key={supplier.id}>
                      <td>
                        <button
                          type="button"
                          className="supplier-name-button"
                          onClick={() => setSelectedSupplierId(supplier.id)}
                        >
                          <span className="supplier-avatar">
                            <Truck size={18} />
                          </span>
                          <span className="supplier-name-copy">
                            <strong>{supplier.name}</strong>
                            <small>
                              {supplierInvoices.length} purchase invoice
                              {supplierInvoices.length === 1 ? "" : "s"}
                            </small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <div className="supplier-contact-cell">
                          <span>
                            <Phone size={14} />
                            {supplier.phone || "No phone"}
                          </span>
                          {supplier.email && (
                            <small>{supplier.email}</small>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>{money(purchaseTotal)}</strong>
                      </td>

                      <td>
                        <strong className={debt > 0 ? "supplier-debt-text" : ""}>
                          {money(debt)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`supplier-status ${
                            debt > 0 ? "is-unpaid" : "is-paid"
                          }`}
                        >
                          {debt > 0 ? "Balance due" : "Settled"}
                        </span>
                      </td>

                      <td>
                        <div className="supplier-row-actions">
                          <button
                            type="button"
                            className="supplier-icon-button"
                            title="View details"
                            aria-label={`View ${supplier.name}`}
                            onClick={() => setSelectedSupplierId(supplier.id)}
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            className="supplier-icon-button"
                            title="Edit supplier"
                            aria-label={`Edit ${supplier.name}`}
                            onClick={() => openEditSupplier(supplier)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            className="supplier-icon-button supplier-delete-button"
                            title="Delete supplier"
                            aria-label={`Delete ${supplier.name}`}
                            onClick={() => deleteSupplier(supplier)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="supplier-footer-note">
        <CheckCircle2 size={16} />
        <span>
          Supplier details are stored locally in this browser and shared with
          the purchase module.
        </span>
      </div>

      {modalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setModalOpen(false);
            setEditingSupplier(null);
          }}
          onSave={saveSupplier}
        />
      )}
    </div>
  );
}
