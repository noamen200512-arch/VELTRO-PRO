import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Truck, X, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getPurchaseSuppliers,
  savePurchaseSuppliers,
  getPurchaseInvoices,
} from "../purchases/purchaseService.js";
import { loadSuppliersFromCloud, saveSuppliersToCloud, deleteSupplierFromCloud } from "../lib/supplierCloud.js";
import "./suppliers.css";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const createId = () =>
  `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function nextSupplierReference(items = []) {
  const used = new Set(items.map(item => String(item.reference || "").toUpperCase()));
  let number = 1;
  while (used.has("SUP-" + String(number).padStart(6, "0"))) number += 1;
  return "SUP-" + String(number).padStart(6, "0");
}
function ensureSupplierReferences(items = []) {
  const used = new Set();
  let next = 1;
  return items.map(item => {
    let reference = String(item.reference || "").trim().toUpperCase();
    if (!reference || used.has(reference)) {
      while (used.has("SUP-" + String(next).padStart(6, "0"))) next += 1;
      reference = "SUP-" + String(next).padStart(6, "0");
      next += 1;
    }
    used.add(reference);
    return { ...item, reference };
  });
}

function loadSuppliers() {
  try {
    return ensureSupplierReferences(getPurchaseSuppliers().map(item => ({
      ...item, id: item.id || createId(), name: item.name || "", phone: item.phone || ""
    })));
  } catch {
    return [];
  }
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(loadSuppliers);

  useEffect(() => {
    const refreshCloudSuppliers = () => setSuppliers(loadSuppliers());
    window.addEventListener("storage", refreshCloudSuppliers);
    window.addEventListener("veltro:cloud-sync", refreshCloudSuppliers);
    return () => {
      window.removeEventListener("storage", refreshCloudSuppliers);
      window.removeEventListener("veltro:cloud-sync", refreshCloudSuppliers);
    };
  }, []);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", reference: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const query = normalize(search);
    return suppliers
      .filter((item) =>
        [item.name, item.phone, item.reference, item.id].some((value) =>
          normalize(value).includes(query)
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, search]);

  const notify = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);
  };

  useEffect(() => {
    let active = true;
    const localSuppliers = loadSuppliers();

    loadSuppliersFromCloud(localSuppliers)
      .then((loaded) => {
        if (!active || !Array.isArray(loaded)) return;
        const normalized = ensureSupplierReferences(loaded.map(item => ({
          ...item, id: item.id || createId(), name: item.name || "", phone: item.phone || ""
        })));
        savePurchaseSuppliers(normalized);
        setSuppliers(normalized);
        saveSuppliersToCloud(normalized).catch(() => {});
      })
      .catch(() => {
        if (active) {
          notify(
            "Cloud sync unavailable. Supplier data remains available on this device.",
            "error"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const persist = (next) => {
    if (!savePurchaseSuppliers(next)) {
      notify("Could not save supplier data. Please check browser storage.", "error");
      return false;
    }
    setSuppliers(next);
    saveSuppliersToCloud(next).catch(() => {
      notify(
        "Supplier changes were saved on this device, but cloud sync failed. Please check your connection and sign in again.",
        "error"
      );
    });
    return true;
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", phone: "", reference: nextSupplierReference(suppliers) });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditing(supplier);
    setForm({
      name: supplier.name || "",
      phone: supplier.phone || "",
      reference: supplier.reference || supplier.id || "",
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
          ? { ...item, name, phone, reference: item.reference || form.reference || nextSupplierReference(suppliers), updatedAt: timestamp }
          : item
      );
    } else {
      next = [
        ...suppliers,
        {
          id: createId(),
          name,
          phone,
          reference: form.reference || nextSupplierReference(suppliers),
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

  const deleteSupplier = async (supplier) => {
    let invoices = [];

    try {
      invoices = getPurchaseInvoices();
    } catch {
      notify("Could not check purchase history. Supplier was not deleted.", "error");
      return;
    }

    const hasInvoices = invoices.some(
      (invoice) =>
        (String(invoice.supplierId || "") && String(invoice.supplierId) === String(supplier.id)) || normalize(invoice.supplier) === normalize(supplier.name)
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

    try {
      await deleteSupplierFromCloud(supplier.id);
    } catch {
      notify(
        "Could not delete this supplier from the cloud. No local deletion was made.",
        "error"
      );
      return;
    }

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
            placeholder="Search by supplier name, phone or ID..."
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
                  <th>Supplier ID</th>
                  <th>Supplier name</th>
                  <th>Phone number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id}>
                    <td><strong className="supplier-reference">{supplier.reference || supplier.id}</strong></td>
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
                  <span>Supplier ID / Reference</span>
                  <input value={form.reference || ""} readOnly />
                </label>
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