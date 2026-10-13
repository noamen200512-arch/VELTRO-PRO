import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Truck, X, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getPurchaseSuppliers,
  savePurchaseSuppliers,
  getPurchaseInvoices,
} from "../purchases/purchaseService.js";
import "./suppliers.css";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const createId = () =>
  `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function loadSuppliers() {
  try {
    return getPurchaseSuppliers().map((item) => ({
      ...item,
      id: item.id || createId(),
      name: item.name || "",
      phone: item.phone || "",
    }));
  } catch {
    return [];
  }
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(loadSuppliers);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const query = normalize(search);
    return suppliers
      .filter((item) =>
        [item.name, item.phone].some((value) =>
          normalize(value).includes(query)
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, search]);

  const notify = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  const persist = (next) => {
    if (!savePurchaseSuppliers(next)) {
      notify("Could not save supplier data. Please check browser storage.", "error");
      return false;
    }
    setSuppliers(next);
    return true;
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setError("");
  };

  const saveSupplier = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setError("Supplier name is required.");
      return;
    }

    if (phone && !/^[+\d\s().-]{5,25}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    const duplicate = suppliers.some(
      (item) =>
        normalize(item.name) === normalize(name) &&
        item.id !== editing?.id
    );

    if (duplicate) {
      setError("A supplier with this name already exists.");
      return;
    }

    const timestamp = new Date().toISOString();

    let next;

    if (editing) {
      next = suppliers.map((item) =>
        item.id === editing.id
          ? { ...item, name, phone, updatedAt: timestamp }
          : item
      );
    } else {
      next = [
        ...suppliers,
        {
          id: createId(),
          name,
          phone,
          email: "",
          address: "",
          note: "",
          debt: 0,
          credit: 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    }

    if (!persist(next)) return;

    closeModal();
    notify(editing ? "Supplier updated successfully." : "Supplier added successfully.");
  };

  const deleteSupplier = (supplier) => {
    let invoices = [];

    try {
      invoices = getPurchaseInvoices();
    } catch {
      notify("Could not check purchase history. Supplier was not deleted.", "error");
      return;
    }

    const hasInvoices = invoices.some(
      (invoice) =>
        normalize(invoice.supplier) === normalize(supplier.name)
    );

    if (
      hasInvoices ||
      Number(supplier.debt || 0) > 0 ||
      Number(supplier.credit || 0) > 0
    ) {
      notify(
        "This supplier has financial records. Keep the account to protect purchase history and balances.",
        "error"
      );
      return;
    }

    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;

    const next = suppliers.filter((item) => item.id !== supplier.id);
    if (persist(next)) notify("Supplier deleted.");
  };

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
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      <header className="supplier-page-header">
        <div>
          <span className="supplier-eyebrow">COMMERCE / CONTACTS</span>
          <h1>Suppliers List</h1>
          <p>Manage supplier names and phone numbers.</p>
        </div>

        <button
          type="button"
          className="supplier-button supplier-button-primary"
          onClick={openAdd}
        >
          <Plus size={18} />
          Add supplier
        </button>
      </header>

      <section className="supplier-panel">
        <div className="supplier-panel-heading supplier-list-heading">
          <div>
            <h3>Supplier directory</h3>
            <p>Contact details only. Financial records are under Supplier Debts.</p>
          </div>
          <span className="supplier-count">
            {filtered.length} supplier{filtered.length === 1 ? "" : "s"}
          </span>
        </div>

        <label className="supplier-search">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by supplier name or phone..."
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </label>

        {filtered.length === 0 ? (
          <div className="supplier-empty-state">
            <div className="supplier-empty-icon">
              {search ? <Search size={30} /> : <Truck size={32} />}
            </div>
            <h3>{search ? "No matching suppliers" : "No suppliers yet"}</h3>
            <p>
              {search
                ? "Try another name or phone number."
                : "Add your first supplier to create your contact list."}
            </p>
            {!search && (
              <button
                type="button"
                className="supplier-button supplier-button-primary"
                onClick={openAdd}
              >
                <Plus size={17} /> Add first supplier
              </button>
            )}
          </div>
        ) : (
          <div className="supplier-table-wrap">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>Supplier name</th>
                  <th>Phone number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div className="supplier-contact-cell">
                        <span>
                          <span className="supplier-avatar">
                            <Truck size={17} />
                          </span>
                          <strong>{supplier.name}</strong>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-contact-cell">
                        <span>
                          <Phone size={15} />
                          {supplier.phone || "No phone number"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-row-actions">
                        <button
                          type="button"
                          className="supplier-icon-button"
                          title="Edit supplier"
                          aria-label={`Edit ${supplier.name}`}
                          onClick={() => openEdit(supplier)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="supplier-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section className="supplier-modal" role="dialog" aria-modal="true">
            <header className="supplier-modal-header">
              <div>
                <span className="supplier-eyebrow">SUPPLIER CONTACTS</span>
                <h2>{editing ? "Edit supplier" : "Add new supplier"}</h2>
                <p>Enter the supplier's name and phone number.</p>
              </div>
              <button
                type="button"
                className="supplier-icon-button"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={saveSupplier}>
              <div className="supplier-form-grid">
                <label className="supplier-field supplier-field-full">
                  <span>Supplier name *</span>
                  <input
                    autoFocus
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) =>
                      setForm((old) => ({ ...old, name: event.target.value }))
                    }
                    placeholder="Enter supplier name"
                  />
                </label>

                <label className="supplier-field supplier-field-full">
                  <span>Phone number</span>
                  <input
                    type="tel"
                    maxLength={25}
                    value={form.phone}
                    onChange={(event) =>
                      setForm((old) => ({ ...old, phone: event.target.value }))
                    }
                    placeholder="+213 ..."
                  />
                </label>
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
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="supplier-button supplier-button-primary"
                >
                  <Save size={17} />
                  {editing ? "Save changes" : "Add supplier"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}