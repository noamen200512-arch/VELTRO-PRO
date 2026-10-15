import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Users, X, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { getCompletedSales } from "../sales/salesStore.js";
import { loadCustomersFromCloud, saveCustomersToCloud, deleteCustomerFromCloud } from "../lib/customerCloud.js";
import "../suppliers/suppliers.css";

const STORAGE_KEY = "veltro_customers";
const normalize = value => String(value ?? "").trim().toLowerCase();
const readLocal = () => {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const writeLocal = value => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); return true; }
  catch { return false; }
};
const nextReference = items => {
  const used = new Set(items.map(item => String(item.reference || "").toUpperCase()));
  let number = 1;
  while (used.has("CUS-" + String(number).padStart(6, "0"))) number += 1;
  return "CUS-" + String(number).padStart(6, "0");
};
const ensureReferences = items => {
  const used = new Set();
  let next = 1;
  return items.map(item => {
    let reference = String(item.reference || item.code || "").trim().toUpperCase();
    if (!reference || used.has(reference)) {
      while (used.has("CUS-" + String(next).padStart(6, "0"))) next += 1;
      reference = "CUS-" + String(next).padStart(6, "0");
      next += 1;
    }
    used.add(reference);
    return { ...item, id: String(item.id || reference), reference, code: reference, name: String(item.name || "").trim(), phone: String(item.phone || "").trim() };
  });
};

export default function Customers() {
  const [customers, setCustomers] = useState(() => ensureReferences(readLocal()));
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [error, setError] = useState("");
  const notify = (message, type = "success") => { setNotice(message); setNoticeType(type); };

  const filtered = useMemo(() => {
    const query = normalize(search);
    return customers.filter(item => [item.name, item.phone, item.id, item.reference, item.email].some(value => normalize(value).includes(query))).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search]);

  useEffect(() => {
    let active = true;
    loadCustomersFromCloud(ensureReferences(readLocal())).then(loaded => {
      if (!active || !Array.isArray(loaded)) return;
      const normalized = ensureReferences(loaded);
      writeLocal(normalized);
      setCustomers(normalized);
      saveCustomersToCloud(normalized).catch(() => {});
    }).catch(() => { if (active) notify("Cloud sync unavailable. Customer data remains on this device.", "error"); });
    return () => { active = false; };
  }, []);

  const persist = next => {
    const normalized = ensureReferences(next);
    if (!writeLocal(normalized)) { notify("Could not save customer data. Check browser storage.", "error"); return false; }
    setCustomers(normalized);
    saveCustomersToCloud(normalized).catch(() => notify("Customer data was saved on this device, but cloud sync failed.", "error"));
    return true;
  };
  const openAdd = () => { setEditing(null); setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setError(""); setModalOpen(true); };
  const openEdit = customer => {
    setEditing(customer);
    setForm({ name: customer.name || "", phone: customer.phone || "", email: customer.email || "", address: customer.address || "", notes: customer.notes || customer.note || "" });
    setError("");
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setError(""); };

  const saveCustomer = event => {
    event.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) { setError("Customer name is required."); return; }
    if (phone && !/^[+\d\s().-]{5,25}$/.test(phone)) { setError("Please enter a valid phone number."); return; }
    if (customers.some(item => normalize(item.name) === normalize(name) && item.id !== editing?.id)) { setError("A customer with this name already exists."); return; }
    const timestamp = new Date().toISOString();
    let next;
    if (editing) {
      next = customers.map(item => item.id === editing.id ? { ...item, ...form, name, phone, updatedAt: timestamp } : item);
    } else {
      const reference = nextReference(customers);
      next = [...customers, { id: reference, reference, code: reference, ...form, name, phone, creditLimit: 0, isActive: true, createdAt: timestamp, updatedAt: timestamp }];
    }
    if (!persist(next)) return;
    closeModal();
    notify(editing ? "Customer updated successfully." : "Customer added successfully.");
  };

  const deleteCustomer = async customer => {
    let sales = [];
    try { sales = getCompletedSales(); } catch { notify("Could not check sales history. Customer was not deleted.", "error"); return; }
    const hasHistory = sales.some(sale => String(sale.customerId || "") === String(customer.id) || normalize(sale.customerName) === normalize(customer.name));
    if (hasHistory) { notify("This customer is linked to sales history. Keep the record to preserve invoice links and balances.", "error"); return; }
    if (!window.confirm("Delete customer " + customer.name + " (" + (customer.reference || customer.id) + ")?")) return;
    try { await deleteCustomerFromCloud(customer.id); }
    catch { notify("Could not delete this customer from the cloud. No local deletion was made.", "error"); return; }
    if (persist(customers.filter(item => item.id !== customer.id))) notify("Customer deleted.");
  };

  return (
    <div className="supplier-layout customer-directory">
      {notice && <div className={"supplier-notice " + noticeType}>{noticeType === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}<span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button></div>}
      <header className="supplier-page-header">
        <div><span className="supplier-eyebrow">COMMERCE / CONTACTS</span><h1>Customers</h1><p>Manage customer profiles, unique IDs and contact details.</p></div>
        <button type="button" className="supplier-button supplier-button-primary" onClick={openAdd}><Plus size={18} /> Add customer</button>
      </header>
      <section className="supplier-panel">
        <div className="supplier-panel-heading supplier-list-heading"><div><h3>Customer directory</h3><p>Each registered customer has a unique ID used when selecting a customer for sales.</p></div><span className="supplier-count">{filtered.length} customer{filtered.length === 1 ? "" : "s"}</span></div>
        <label className="supplier-search"><Search size={19} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by customer ID, name, phone or email..." />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={17} /></button>}</label>
        {filtered.length === 0 ? <div className="supplier-empty-state"><div className="supplier-empty-icon">{search ? <Search size={30} /> : <Users size={32} />}</div><h3>{search ? "No matching customers" : "No customers yet"}</h3><p>{search ? "Try another customer ID, name, phone or email." : "Add your first customer to assign a permanent customer ID."}</p>{!search && <button type="button" className="supplier-button supplier-button-primary" onClick={openAdd}><Plus size={17} /> Add first customer</button>}</div> : <div className="supplier-table-wrap"><table className="supplier-table">
          <thead><tr><th>Customer ID</th><th>Customer name</th><th>Phone number</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(customer => <tr key={customer.id}><td><strong className="supplier-reference">{customer.reference || customer.id}</strong></td><td><div className="supplier-contact-cell"><span><span className="supplier-avatar"><Users size={17} /></span><strong>{customer.name}</strong></span></div></td><td><div className="supplier-contact-cell"><span><Phone size={15} />{customer.phone || "No phone number"}</span></div></td><td>{customer.email || "—"}</td><td><div className="supplier-row-actions"><button type="button" className="supplier-icon-button" title="Edit customer" aria-label={"Edit " + customer.name} onClick={() => openEdit(customer)}><Pencil size={17} /></button><button type="button" className="supplier-icon-button supplier-delete-button" title="Delete customer" aria-label={"Delete " + customer.name} onClick={() => deleteCustomer(customer)}><Trash2 size={17} /></button></div></td></tr>)}</tbody>
        </table></div>}
      </section>
      {modalOpen && <div className="supplier-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) closeModal(); }}>
        <section className="supplier-modal" role="dialog" aria-modal="true">
          <header className="supplier-modal-header"><div><span className="supplier-eyebrow">CUSTOMER PROFILE</span><h2>{editing ? "Edit customer" : "Add new customer"}</h2><p>The customer ID is generated automatically and remains unchanged.</p></div><button type="button" className="supplier-icon-button" onClick={closeModal} aria-label="Close"><X size={20} /></button></header>
          <form onSubmit={saveCustomer}><div className="supplier-form-grid">
            {editing && <label className="supplier-field supplier-field-full"><span>Customer ID</span><input value={editing.reference || editing.id} readOnly /></label>}
            <label className="supplier-field supplier-field-full"><span>Customer name *</span><input autoFocus required maxLength={120} value={form.name} onChange={event => setForm(old => ({ ...old, name: event.target.value }))} placeholder="Enter customer name" /></label>
            <label className="supplier-field"><span>Phone number</span><input type="tel" maxLength={25} value={form.phone} onChange={event => setForm(old => ({ ...old, phone: event.target.value }))} placeholder="+213 ..." /></label>
            <label className="supplier-field"><span>Email</span><input type="email" maxLength={160} value={form.email} onChange={event => setForm(old => ({ ...old, email: event.target.value }))} placeholder="customer@example.com" /></label>
            <label className="supplier-field supplier-field-full"><span>Address</span><input maxLength={240} value={form.address} onChange={event => setForm(old => ({ ...old, address: event.target.value }))} placeholder="Customer address" /></label>
            <label className="supplier-field supplier-field-full"><span>Notes</span><textarea maxLength={1000} value={form.notes} onChange={event => setForm(old => ({ ...old, notes: event.target.value }))} placeholder="Optional notes" /></label>
          </div>
          {error && <div className="supplier-alert supplier-alert-error"><AlertTriangle size={17} />{error}</div>}
          <footer className="supplier-modal-actions"><button type="button" className="supplier-button supplier-button-secondary" onClick={closeModal}>Cancel</button><button type="submit" className="supplier-button supplier-button-primary"><Save size={17} />{editing ? "Save changes" : "Add customer"}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  );
}
