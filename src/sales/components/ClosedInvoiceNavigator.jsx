import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Eye, Pencil, LockKeyhole, Save, X, Printer, Trash2, RotateCcw } from "lucide-react";

const money = (value) => `${(Number(value) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA`;
const qty = (item) => Math.max(0, Number(item.qty ?? item.quantity) || 0);
const subtotalOf = (items) => items.reduce((sum, item) => sum + Math.max(0, qty(item) * (Number(item.price) || 0) - (Number(item.discount) || 0)), 0);
const identity = (sale) => String(sale.id || sale.invoiceId || sale.invoiceNumber || "");

export default function ClosedInvoiceNavigator({ sales = [], initialInvoiceId = "", locale = "en", onClose, onSave }) {
  const sorted = useMemo(() => [...sales].sort((a,b) => new Date(b.completedAt || b.createdAt || b.updatedAt || 0) - new Date(a.completedAt || a.createdAt || a.updatedAt || 0)), [sales]);
  const [index, setIndex] = useState(() => Math.max(0, sorted.findIndex(s => identity(s) === String(initialInvoiceId))));
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const ar = locale === "ar";
  const fr = locale === "fr";
  const t = (en, a, f) => ar ? a : fr ? f : en;
  const sale = sorted[index] || null;
  const active = editing && draft ? draft : sale;
  const items = active?.items || [];
  const subtotal = subtotalOf(items);
  const discount = Math.max(0, Number(active?.discount) || 0);
  const total = Math.max(0, Number(active?.total ?? subtotal - discount) || 0);
  const paid = Math.max(0, Number(active?.paid) || 0);
  const remaining = Math.max(0, total - paid);

  const changeItem = (itemIndex, field, value) => {
    setDraft(current => {
      const nextItems = [...(current?.items || [])];
      nextItems[itemIndex] = { ...nextItems[itemIndex], [field]: value,
        ...(field === "quantity" ? { qty: value } : {}),
        ...(field === "qty" ? { quantity: value } : {}) };
      const nextSubtotal = subtotalOf(nextItems);
      const nextTotal = Math.max(0, nextSubtotal - (Number(current.discount) || 0));
      return { ...current, items: nextItems, subtotal: nextSubtotal, total: nextTotal, remaining: Math.max(0, nextTotal - (Number(current.paid) || 0)) };
    });
  };
  const removeItem = (itemIndex) => {
    setDraft(current => {
      const nextItems = (current?.items || []).filter((_, i) => i !== itemIndex);
      if (!nextItems.length) return current;
      const nextSubtotal = subtotalOf(nextItems);
      const nextTotal = Math.max(0, nextSubtotal - (Number(current.discount) || 0));
      return { ...current, items: nextItems, subtotal: nextSubtotal, total: nextTotal, remaining: Math.max(0, nextTotal - (Number(current.paid) || 0)) };
    });
  };
  const enableEdit = (event) => {
    event.preventDefault();
    if (password !== "1234") { setPasswordError(t("Incorrect manager password.", "كلمة مرور المدير غير صحيحة.", "Mot de passe incorrect.")); return; }
    setDraft({ ...sale, items: (sale.items || []).map(item => ({ ...item })) });
    setEditing(true); setShowPassword(false); setPassword(""); setPasswordError(""); setNotice("");
  };
  const save = async () => {
    if (!draft || !draft.items?.length) { setNotice(t("An invoice must contain at least one product.", "يجب أن يحتوي البون على منتج واحد على الأقل.", "La facture doit contenir au moins un produit.")); return; }
    setSaving(true);
    try {
      const result = await onSave(draft);
      if (result?.ok) { setEditing(false); setDraft(null); setNotice(t("Changes saved successfully.", "تم حفظ التعديلات بنجاح.", "Modifications enregistrées.")); }
      else setNotice(result?.message || t("Could not save changes.", "تعذر حفظ التعديلات.", "Impossible d’enregistrer les modifications."));
    } catch { setNotice(t("Could not save changes.", "تعذر حفظ التعديلات.", "Impossible d’enregistrer les modifications.")); }
    finally { setSaving(false); }
  };
  const move = (delta) => { setIndex(i => Math.min(sorted.length - 1, Math.max(0, i + delta))); setEditing(false); setDraft(null); setNotice(""); };

  if (!sale || typeof document === "undefined") return null;
  return createPortal(
    <div className="closed-invoice-overlay" dir={ar ? "rtl" : "ltr"}>
      <section className="closed-invoice-panel" role="dialog" aria-modal="true" aria-label={t("Closed invoices", "البونات المغلقة", "Factures clôturées")}>
        <header className="closed-invoice-header">
          <div className="closed-invoice-title"><span className="closed-invoice-icon"><Eye size={20}/></span><div><h2>{t("Closed invoices", "البونات المغلقة", "Factures clôturées")}</h2><p>{t("Review mode · No changes until editing is enabled", "وضع المراجعة · لا تغييرات قبل تفعيل التعديل", "Mode consultation · aucune modification sans activation")}</p></div></div>
          <button className="closed-invoice-icon-button" onClick={onClose} aria-label={t("Close", "إغلاق", "Fermer")}><X size={20}/></button>
        </header>
        <div className="closed-invoice-navigation">
          <button onClick={() => move(-1)} disabled={index <= 0}><ChevronLeft size={17}/>{t("Previous", "السابق", "Précédent")}</button>
          <div><strong>{sale.invoiceNumber || sale.id}</strong><span>{index + 1} / {sorted.length} · {t("Closed", "مغلق", "Clôturé")}</span></div>
          <button onClick={() => move(1)} disabled={index >= sorted.length - 1}>{t("Next", "التالي", "Suivant")}<ChevronRight size={17}/></button>
        </div>
        <div className="closed-invoice-meta">
          <div><span>{t("Customer", "الزبون", "Client")}</span><strong>{sale.customerName || "Anonyme"}</strong></div>
          <div><span>{t("Date", "التاريخ", "Date")}</span><strong>{new Date(sale.completedAt || sale.createdAt || sale.updatedAt || Date.now()).toLocaleString()}</strong></div>
          <div><span>{t("Cashier", "البائع", "Caissier")}</span><strong>{sale.employeeName || sale.userName || sale.cashierName || "—"}</strong></div>
        </div>
        <div className="closed-invoice-table-wrap">
          <table className="closed-invoice-table"><thead><tr><th>{t("Product", "المنتج", "Produit")}</th><th>{t("Quantity", "الكمية", "Quantité")}</th><th>{t("Unit price", "سعر الوحدة", "Prix unitaire")}</th><th>{t("Line total", "المجموع", "Total ligne")}</th>{editing && <th>{t("Action", "إجراء", "Action")}</th>}</tr></thead>
          <tbody>{items.map((item, i) => <tr key={item.id || item.productId || i}>
            <td><strong>{item.name || item.productName || "—"}</strong><small>{item.sku || item.barcode || item.productId || ""}</small></td>
            <td>{editing ? <input aria-label={t("Quantity", "الكمية", "Quantité")} type="number" min="1" step="1" value={qty(item)} onChange={e => changeItem(i, "quantity", Math.max(1, Math.floor(Number(e.target.value) || 1)))} /> : qty(item)}</td>
            <td>{editing ? <input aria-label={t("Unit price", "سعر الوحدة", "Prix unitaire")} type="number" min="0" step="0.01" value={Number(item.price) || 0} onChange={e => changeItem(i, "price", Math.max(0, Number(e.target.value) || 0)} /> : money(item.price)}</td>
            <td>{money(qty(item) * (Number(item.price) || 0) - Math.min(qty(item) * (Number(item.price) || 0), Number(item.discount) || 0))}</td>
            {editing && <td><button className="closed-invoice-remove" onClick={() => removeItem(i)} disabled={items.length <= 1} title={t("Remove line", "حذف السطر", "Supprimer la ligne")}><Trash2 size={15}/></button></td>}
          </tr>)}</tbody></table>
        </div>
        <div className="closed-invoice-bottom">
          <div className="closed-invoice-totals"><div><span>{t("Subtotal", "المجموع الفرعي", "Sous-total")}</span><strong>{money(subtotal)}</strong></div><div><span>{t("Discount", "التخفيض", "Remise")}</span><strong>{money(discount)}</strong></div><div className="grand"><span>{t("Total", "الإجمالي", "Total")}</span><strong>{money(Math.max(0, subtotal-discount))}</strong></div><div><span>{t("Paid", "المدفوع", "Payé")}</span><strong>{money(paid)}</strong></div><div><span>{t("Remaining", "المتبقي", "Reste")}</span><strong>{money(Math.max(0, subtotal-discount-paid))}</strong></div></div>
          {notice && <p className="closed-invoice-notice" role="status">{notice}</p>}
          <footer className="closed-invoice-actions">
            {!editing ? <><button className="closed-invoice-secondary" onClick={() => window.print()}><Printer size={16}/>{t("Print / Reprint", "طباعة / إعادة الطباعة", "Imprimer / Réimprimer")}</button><button className="closed-invoice-primary" onClick={() => {setPassword("");setPasswordError("");setShowPassword(true);}}><Pencil size={16}/>{t("Enable editing", "تفعيل التعديل", "Activer la modification")}</button></> : <><button className="closed-invoice-secondary" onClick={() => {setEditing(false);setDraft(null);setNotice("");}}><RotateCcw size={16}/>{t("Discard changes", "إلغاء التعديلات", "Annuler les modifications")}</button><button className="closed-invoice-primary" onClick={save} disabled={saving}><Save size={16}/>{saving ? t("Saving…", "جارٍ الحفظ…", "Enregistrement…") : t("Save changes", "حفظ التعديلات", "Enregistrer")}</button></>}
          </footer>
        </div>
        {showPassword && <div className="closed-invoice-password-backdrop"><form className="closed-invoice-password" onSubmit={enableEdit}><div className="closed-invoice-password-icon"><LockKeyhole size={22}/></div><h3>{t("Manager authorization", "تأكيد صلاحية المدير", "Autorisation du responsable")}</h3><p>{t("Enter the manager password to enable editing.", "أدخل كلمة مرور المدير لتفعيل التعديل.", "Saisissez le mot de passe du responsable.")}</p><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t("Manager password", "كلمة مرور المدير", "Mot de passe")} />{passwordError && <small>{passwordError}</small>}<div><button type="button" onClick={() => setShowPassword(false)}>{t("Cancel", "إلغاء", "Annuler")}</button><button type="submit">{t("Unlock editing", "فتح التعديل", "Déverrouiller")}</button></div></form></div>}
      </section>
    </div>, document.body
  );
}
