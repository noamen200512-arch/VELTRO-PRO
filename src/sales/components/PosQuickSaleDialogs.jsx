import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Star, Scale, Settings2, Check, Plus, Package, ListFilter, Trash2 } from "lucide-react";

const COPY = {
  en: {
    favorites:"Favorite products", weigh:"Sell by weight", settings:"Quick-sale settings", search:"Search by product name or reference…", priceMode:"F1 · Enter amount", weightMode:"F2 · Enter weight", chooseMode:"Select a product to open entry. Press F1 to enter the amount to pay or F2 to enter the weight.",
    noFavorites:"No favorite products configured.", noWeighed:"No products configured for weighing.", close:"Close", add:"Add to invoice",
    choose:"Choose a product", category:"Category", all:"All categories", nuts:"Nuts", grains:"Grains", spices:"Spices", other:"Other",
    weight:"Weight", amount:"Amount to pay", kg:"kg", priceKg:"Price per kg", total:"Total", onePound:"1 pound", halfPound:"½ pound",
    customCategories:"Manage categories", newCategory:"New category name", addCategory:"Add category", favorite:"Favorite", weighed:"Sell by weight", showCategoryOnWeighPage:"Show this category in the weigh-sale page", categoryVisibilityButton:"Choose categories shown in weigh-sale",
    save:"Save settings", cancel:"Cancel", noProducts:"No products found.", select:"Select", quantity:"Weight in kg", paidAmount:"Amount in DA",
    invalidPrice:"This product needs a price greater than zero to calculate weight.", invalidWeight:"Enter a weight or amount greater than zero.",
    selected:"Selected product", setupHint:"Choose which products appear in each quick-sale screen and assign a category to weighed products.",
    remove:"Remove", enter:"Enter", clear:"Clear", poundSize:"Pound size (grams)", noCategory:"Uncategorized", manageCategoryContents:"Manage category names", categoryName:"Category name", deleteCategory:"Delete category", categoryRenameHint:"Edit a name, then leave the field to apply it."
  },
  fr: {
    favorites:"Produits favoris", weigh:"Vente au poids", settings:"Réglages de vente rapide", search:"Rechercher par nom ou référence…", priceMode:"F1 · Saisir le montant", weightMode:"F2 · Saisir le poids", chooseMode:"Choisissez un produit pour ouvrir la saisie. F1 pour le montant à payer, F2 pour le poids.",
    noFavorites:"Aucun produit favori configuré.", noWeighed:"Aucun produit configuré pour la pesée.", close:"Fermer", add:"Ajouter à la facture",
    choose:"Choisir un produit", category:"Catégorie", all:"Toutes les catégories", nuts:"Fruits à coque", grains:"Céréales", spices:"Épices", other:"Autre",
    weight:"Poids", amount:"Montant à payer", kg:"kg", priceKg:"Prix au kg", total:"Total", onePound:"1 livre", halfPound:"½ livre",
    customCategories:"Gérer les catégories", newCategory:"Nom de la nouvelle catégorie", addCategory:"Ajouter la catégorie", favorite:"Favori", weighed:"Vente au poids", showCategoryOnWeighPage:"Afficher cette catégorie dans la vente au poids", categoryVisibilityButton:"Choisir les catégories affichées pour la vente au poids",
    save:"Enregistrer", cancel:"Annuler", noProducts:"Aucun produit trouvé.", select:"Sélectionner", quantity:"Poids en kg", paidAmount:"Montant en DA",
    invalidPrice:"Ce produit doit avoir un prix supérieur à zéro pour calculer le poids.", invalidWeight:"Saisissez un poids ou un montant supérieur à zéro.",
    selected:"Produit sélectionné", setupHint:"Choisissez les produits affichés dans chaque écran et classez les produits vendus au poids.",
    remove:"Supprimer", enter:"Entrée", clear:"Effacer", poundSize:"Valeur de la livre (grammes)", noCategory:"Sans catégorie", manageCategoryContents:"Gérer les noms des catégories", categoryName:"Nom de la catégorie", deleteCategory:"Supprimer la catégorie", categoryRenameHint:"Modifiez un nom puis quittez le champ pour appliquer."
  },
  ar: {
    favorites:"المنتجات المفضلة", weigh:"البيع بالميزان", settings:"إعدادات البيع السريع", search:"ابحث باسم المنتج أو مرجعه…", priceMode:"F1 · إدخال المبلغ", weightMode:"F2 · إدخال الوزن", chooseMode:"اختر المنتج للانتقال إلى صفحة الإدخال: F1 للمبلغ وF2 للوزن.",
    noFavorites:"لم تُحدَّد منتجات مفضلة بعد.", noWeighed:"لم تُحدَّد منتجات للبيع بالميزان.", close:"إغلاق", add:"إضافة إلى الفاتورة",
    choose:"اختر منتجًا", category:"الفئة", all:"كل الفئات", nuts:"مكسرات", grains:"حبوب", spices:"توابل", other:"أخرى",
    weight:"الوزن", amount:"المبلغ المراد دفعه", kg:"كغ", priceKg:"السعر لكل كغ", total:"الإجمالي", onePound:"رطل واحد", halfPound:"نصف رطل",
    customCategories:"إدارة الفئات", newCategory:"اسم الفئة الجديدة", addCategory:"إضافة الفئة", favorite:"مفضّل", weighed:"بيع بالميزان", showCategoryOnWeighPage:"إظهار هذه الفئة في صفحة البيع بالميزان", categoryVisibilityButton:"اختيار الفئات الظاهرة في صفحة البيع بالميزان",
    save:"حفظ الإعدادات", cancel:"إلغاء", noProducts:"لم يُعثر على منتجات.", select:"اختيار", quantity:"الوزن بالكيلوغرام", paidAmount:"المبلغ بالدج",
    invalidPrice:"يجب أن يكون سعر الكيلوغرام أكبر من صفر لحساب الوزن.", invalidWeight:"أدخل وزنًا أو مبلغًا أكبر من صفر.",
    selected:"المنتج المحدد", setupHint:"اختر المنتجات التي تظهر في كل شاشة، وصنّف المنتجات المباعة بالميزان.",
    remove:"حذف", enter:"إدخال", clear:"مسح", poundSize:"قيمة الرطل بالغرام", noCategory:"بلا فئة", manageCategoryContents:"إدارة أسماء الفئات", categoryName:"اسم الفئة", deleteCategory:"حذف الفئة", categoryRenameHint:"عدّل الاسم ثم انتقل خارج الحقل لتطبيقه."
  }
};

const normalize = (v) => String(v ?? "").trim().toLocaleLowerCase();
const idOf = (p) => String(p?.id ?? p?.productId ?? p?.sku ?? "");
const priceOf = (p) => Number(p?.price ?? p?.retailPrice ?? p?.sellingPrice ?? 0) || 0;

export default function PosQuickSaleDialogs({
  dialog, locale = "en", products = [], favoriteIds = [], weighedIds = [], weighedLayout = [], weighedSlots = [], categoriesByProduct = {},
  categories = ["Nuts", "Grains", "Spices", "Other"], visibleWeighedCategories = categories, shortcutCategories = [], poundGrams = 500,
  onClose = () => {}, onAddProduct = () => {}, onToggleFavorite = () => {},
  onSaveSettings = () => {}
}) {
  const t = COPY[locale] || COPY.en;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [weighedPage, setWeighedPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [showWeighEntry, setShowWeighEntry] = useState(false);
  const [mode, setMode] = useState("weight");
  const [weight, setWeight] = useState("1");
  const [amount, setAmount] = useState("");
  const [replaceInput, setReplaceInput] = useState(true);
  const [draftFavorites, setDraftFavorites] = useState(favoriteIds.map(String));
  const [draftWeighed, setDraftWeighed] = useState(weighedIds.map(String));
  const [draftCategories, setDraftCategories] = useState({ ...categoriesByProduct });
  const [draftCategoryList, setDraftCategoryList] = useState([...categories]);
  const [categoryNameDrafts, setCategoryNameDrafts] = useState(Object.fromEntries(categories.map((category) => [category, category])));
  const [draftVisibleCategories, setDraftVisibleCategories] = useState([...visibleWeighedCategories]);
  const [showCategoryVisibility, setShowCategoryVisibility] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [draftPound, setDraftPound] = useState(String(poundGrams || 500));

  useEffect(() => {
    if (dialog === "settings") {
      setShowCategoryVisibility(false);
      setDraftFavorites(favoriteIds.map(String));
      setDraftWeighed(weighedIds.map(String));
      setDraftCategories({ ...categoriesByProduct });
      setDraftCategoryList([...categories]);
      setCategoryNameDrafts(Object.fromEntries(categories.map((category) => [category, category])));
      setDraftVisibleCategories([...visibleWeighedCategories]);
      setDraftPound(String(poundGrams || 500));
    }
    if (dialog === "favorites" || dialog === "weigh") {
      setSearch("");
      setCategoryFilter("all");
      setWeighedPage(1);
      setSelectedId("");
      setShowWeighEntry(false);
      setWeight("1");
      setAmount("");
      setMode("weight");
    }
  }, [dialog, favoriteIds, weighedIds, categoriesByProduct, categories, visibleWeighedCategories, poundGrams]);

  const favoriteSet = useMemo(() => new Set(favoriteIds.map(String)), [favoriteIds]);
  const weighedSet = useMemo(() => new Set(weighedIds.map(String)), [weighedIds]);
  const filtered = useMemo(() => products.filter((p) => {
    const id = idOf(p);
    if (dialog === "favorites" && !favoriteSet.has(id)) return false;
    // Include products enabled in Quick-sale settings as well as products marked in the product form.
    if (dialog === "weigh" && !(weighedSet.has(id) || p.weighedSale === true || p.weighedSale === "true")) return false;
    const q = normalize(search);
    if (q && ![p.name, p.id, p.productId, p.sku, p.reference, p.barcode].some((v) => normalize(v).includes(q))) return false;
    if (dialog === "weigh" && categoryFilter !== "all" && (p.category || categoriesByProduct[id] || "") !== categoryFilter) return false;
    return true;
  }), [products, dialog, favoriteSet, weighedSet, search, categoryFilter, categoriesByProduct]);
  const orderedProducts = useMemo(() => {
    if (dialog !== "weigh") return filtered;
    const positions = new Map(weighedLayout.map((id, index) => [String(id), index]));
    return [...filtered].sort((a, b) => {
      const aId = idOf(a);
      const bId = idOf(b);
      const aPosition = positions.has(aId) ? positions.get(aId) : Number.MAX_SAFE_INTEGER;
      const bPosition = positions.has(bId) ? positions.get(bId) : Number.MAX_SAFE_INTEGER;
      return aPosition - bPosition || String(a.name || aId).localeCompare(String(b.name || bId));
    });
  }, [filtered, dialog, weighedLayout]);
  const selected = products.find((p) => idOf(p) === selectedId) || null;
  const unitPrice = selected ? priceOf(selected) : 0;
  const measureUnit = String(selected?.unit || "kg").toLowerCase();
  const measureLabel = ({ kg: "kg", g: "g", liter: "L", ml: "ml", meter: "m", cm: "cm" })[measureUnit] || measureUnit;
  const computedWeight = mode === "amount" ? (unitPrice > 0 ? (Number(String(amount).replace(",", ".")) || 0) / unitPrice : 0) : (Number(String(weight).replace(",", ".")) || 0);
  const computedAmount = selected ? unitPrice * computedWeight : 0;
  const resetAndClose = () => { setSearch(""); setCategoryFilter("all"); setWeighedPage(1); setSelectedId(""); setShowWeighEntry(false); onClose(); };
  const keypad = (key, setter, current) => {
    if (key === "⌫") setter(replaceInput ? "" : String(current).slice(0, -1));
    else if (key === "C") setter("");
    else if (key === "." && replaceInput) setter("0.");
    else if (key === "." && String(current).includes(".")) return;
    else setter(replaceInput ? key : String(current) + key);
    setReplaceInput(false);
  };
  const commitCategoryRename = (oldName) => {
    const nextName = String(categoryNameDrafts[oldName] ?? oldName).trim();
    if (!nextName || nextName === oldName) {
      setCategoryNameDrafts((old) => ({ ...old, [oldName]: oldName }));
      return;
    }
    if (draftCategoryList.some((category) => category !== oldName && normalize(category) === normalize(nextName))) {
      setCategoryNameDrafts((old) => ({ ...old, [oldName]: oldName }));
      return;
    }
    setDraftCategoryList((old) => old.map((category) => category === oldName ? nextName : category));
    setDraftCategories((old) => Object.fromEntries(Object.entries(old).map(([id, category]) => [id, category === oldName ? nextName : category])));
    setDraftVisibleCategories((old) => old.map((category) => category === oldName ? nextName : category));
    setCategoryNameDrafts((old) => { const next = { ...old }; delete next[oldName]; next[nextName] = nextName; return next; });
  };
  const deleteCategory = (category) => {
    setDraftCategoryList((old) => old.filter((item) => item !== category));
    setDraftVisibleCategories((old) => old.filter((item) => item !== category));
    setDraftCategories((old) => Object.fromEntries(Object.entries(old).filter(([, value]) => value !== category)));
    setCategoryNameDrafts((old) => { const next = { ...old }; delete next[category]; return next; });
  };
  const categoryLabel = (category) => {
    const key = ({ "Nuts":"nuts", "Grains":"grains", "Spices":"spices", "Other":"other" })[category];
    return key ? t[key] : category;
  };
  const keypadButtons = (setter, current) => <div className="pos-quick-keypad" aria-label={t.enter}>
    {["1","2","3","4","5","6","7","8","9","⌫","0",".","C"].map((key) => <button type="button" key={key} onClick={() => keypad(key, setter, current)}>{key}</button>)}
  </div>;
  const slotOrder = [8, 7, 6, 5, 4, 3, 2, 1, 0];
  const assignedTileProducts = dialog === "weigh"
    ? slotOrder.map((slotIndex) => orderedProducts.find((product) => idOf(product) === String(weighedSlots[slotIndex] || "")) || null)
    : orderedProducts;
  const extraWeighedProducts = dialog === "weigh"
    ? orderedProducts.filter((product) => !weighedSlots.some((id) => String(id || "") === idOf(product)))
    : [];
  const weighedPageCount = dialog === "weigh" ? Math.max(1, 1 + Math.ceil(extraWeighedProducts.length / 9)) : 1;
  const visibleTileProducts = dialog === "weigh"
    ? (weighedPage === 1 ? assignedTileProducts : Array.from({ length: 9 }, (_, index) => extraWeighedProducts[(weighedPage - 2) * 9 + index] || null))
    : orderedProducts;
  useEffect(() => {
    if (!dialog) return undefined;
    const handler = (event) => {
      // While the weigh-sale modal is open, this modal owns the keyboard.
      // Stop every key event at capture phase, not only recognized shortcuts,
      // so the underlying POS screen can never react to the same key press.
      if (dialog === "weigh") {
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      }
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      const target = event.target;
      const typing = target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName));
      if (dialog !== "weigh") {
        if (event.key === "Escape") {
          event.preventDefault(); event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          resetAndClose(); return;
        }
        if (event.key === "Enter") {
          event.preventDefault(); event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          if (dialog === "settings") {
            document.querySelector(".pos-quick-modal button.primary")?.click();
          } else if (dialog === "favorites" && selectedId) {
            const selectedProduct = orderedProducts.find((product) => idOf(product) === selectedId);
            if (selectedProduct) { onAddProduct(selectedProduct); resetAndClose(); }
          }
          return;
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        if (showWeighEntry) {
          setShowWeighEntry(false);
          setSelectedId("");
        } else {
          resetAndClose();
        }
        return;
      }
      if (event.key === "Enter" && selectedId && !showWeighEntry) {
        event.preventDefault(); event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        setWeight("1"); setAmount(""); setMode("weight"); setShowWeighEntry(true);
        return;
      }
      // F1 and F2 belong exclusively to the weigh-sale workflow, even when
      // the input has focus. They must never fall through to category shortcuts
      // or the underlying POS invoice shortcuts.
      if (event.key === "F1" || event.key === "F2") {
        event.preventDefault(); event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const nextMode = event.key === "F1" ? "amount" : "weight";
        if (showWeighEntry) {
          setMode(nextMode);
          setReplaceInput(true);
          return;
        }
        const selectedProduct = orderedProducts.find((product) => idOf(product) === selectedId);
        if (selectedProduct) {
          setWeight("1");
          setAmount("");
          setMode(nextMode);
          setShowWeighEntry(true);
          setReplaceInput(true);
        }
        return;
      }
      // F12 opens the weigh-sale list from the POS screen; inside this dialog
      // it must not change categories or trigger the background screen.
      if (event.key === "F12") {
        event.preventDefault(); event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        return;
      }
      if (event.key === "Enter" && showWeighEntry) {
        const confirmButton = document.querySelector(".pos-weigh-entry-modal button.primary:not(:disabled)");
        if (confirmButton) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
          confirmButton.click();
        }
        return;
      }
      if (/^F([3-9]|1[0-1])$/.test(event.key)) {
        event.preventDefault(); event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        const categoryIndex = Number(event.key.slice(1)) - 1;
        const category = shortcutCategories.some(Boolean) ? shortcutCategories[categoryIndex] : visibleWeighedCategories.filter((item) => categories.includes(item))[categoryIndex];
        if (category) { setCategoryFilter(category); setWeighedPage(1); }
        return;
      }
      if (!typing && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault(); event.stopPropagation();
        setWeighedPage((current) => Math.min(weighedPageCount, Math.max(1, current + (event.key === "ArrowRight" ? 1 : -1))));
        return;
      }
      if (typing || !/^[1-9]$/.test(event.key)) return;
      event.preventDefault();
      const slotIndex = Number(event.key) - 1;
      const visualIndex = weighedPage === 1 ? 8 - slotIndex : slotIndex;
      const product = visibleTileProducts[visualIndex];
      if (!product) return;
      event.preventDefault(); event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
      setSelectedId(idOf(product)); setWeight("1"); setAmount(""); setMode("weight"); setShowWeighEntry(true); setReplaceInput(true);
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [dialog, showWeighEntry, selectedId, orderedProducts, onAddProduct, visibleTileProducts, visibleWeighedCategories, categories, weighedPageCount]);
  const productTiles = <div className={"pos-quick-tiles" + (dialog === "weigh" ? " pos-weighed-grid-3" : "")}>
    {visibleTileProducts.map((p, index) => p ? <button type="button" key={dialog === "weigh" ? "weighed-page-" + weighedPage + "-slot-" + index : idOf(p)} className={selectedId === idOf(p) ? "is-selected" : ""} onClick={() => { setSelectedId(idOf(p)); setWeight("1"); setAmount(""); setMode("weight"); setShowWeighEntry(true); setReplaceInput(true); }}>
      {dialog === "weigh" && <span className="pos-quick-tile-number">{weighedPage === 1 ? [9,8,7,6,5,4,3,2,1][index] : index + 1}</span>}<span className="pos-quick-tile-icon"><Package size={20}/></span><strong>{p.name || idOf(p)}</strong><small>{p.sku || p.reference || p.id || ""}</small><b>{priceOf(p).toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</b>
      {dialog === "favorites" && <span role="presentation" className="pos-quick-star" onClick={(e) => { e.stopPropagation(); onToggleFavorite(p); }}><Star size={17} fill="currentColor"/></span>}
    </button> : <div key={"empty-weighed-page-" + weighedPage + "-slot-" + index} className="pos-quick-empty-tile"><span>{weighedPage === 1 ? [7,8,9,4,5,6,1,2,3][index] : index + 1}</span></div>)}
    {!visibleTileProducts.some(Boolean) && <p className="pos-quick-empty">{dialog === "favorites" ? t.noFavorites : dialog === "weigh" ? t.noWeighed : t.noProducts}</p>}
  </div>;

  if (!dialog) return null;

  return <div className="pos-quick-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}>
    <section className="pos-quick-modal" role="dialog" aria-modal="true" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="pos-quick-header">
        <div className="pos-quick-title-icon">{dialog === "weigh" ? <Scale size={22}/> : dialog === "settings" ? <Settings2 size={22}/> : <Star size={22}/>}</div>
        <div><h2>{dialog === "favorites" ? t.favorites : dialog === "weigh" ? t.weigh : t.settings}</h2><p>{dialog === "settings" ? t.setupHint : ""}</p></div>
        <button type="button" className="pos-quick-close" onClick={resetAndClose} aria-label={t.close}><X size={20}/></button>
      </header>

      {dialog === "settings" ? <>
        <div className="pos-quick-settings-toolbar">
          <label>{t.poundSize}<input type="number" min="1" value={draftPound} onChange={(e) => setDraftPound(e.target.value)}/></label>
          <div className="pos-quick-new-category"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={t.newCategory}/><button type="button" onClick={() => { const value = newCategory.trim(); if (value && !draftCategoryList.some((category) => normalize(category) === normalize(value))) { setDraftCategoryList((old) => [...old, value]); setCategoryNameDrafts((old) => ({ ...old, [value]: value })); } setNewCategory(""); }}><Plus size={16}/>{t.addCategory}</button></div>
        </div>
        <div className="pos-quick-category-visibility" aria-label={t.customCategories}>
          <div style={{ margin: "12px 0", padding: 12, border: "1px solid rgba(148,163,184,.18)", borderRadius: 12, background: "rgba(15,23,42,.35)" }}>
            <strong style={{ display: "block", marginBottom: 6 }}>{t.manageCategoryContents}</strong>
            <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: 12 }}>{t.categoryRenameHint}</p>
            {draftCategoryList.length === 0 && <p style={{ color: "#94a3b8", fontSize: 12 }}>—</p>}
            {draftCategoryList.map((category) => <div key={category} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <input aria-label={t.categoryName} value={categoryNameDrafts[category] ?? category} onChange={(e) => setCategoryNameDrafts((old) => ({ ...old, [category]: e.target.value }))} onBlur={() => commitCategoryRename(category)} style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(148,163,184,.25)", background: "rgba(2,6,23,.45)", color: "inherit" }} />
              <button type="button" title={t.deleteCategory} aria-label={`${t.deleteCategory}: ${category}`} onClick={() => deleteCategory(category)} style={{ display: "grid", placeItems: "center", width: 36, height: 36, flexShrink: 0, borderRadius: 8, border: "1px solid rgba(248,113,113,.28)", color: "#fca5a5", background: "rgba(127,29,29,.16)", cursor: "pointer" }}><Trash2 size={15}/></button>
            </div>)}
          </div>
          <button type="button" onClick={() => setShowCategoryVisibility((open) => !open)} aria-expanded={showCategoryVisibility} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "space-between", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(45,212,191,.28)", background: "rgba(45,212,191,.08)", color: "#5eead4", fontWeight: 750, cursor: "pointer" }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><ListFilter size={17}/>{t.categoryVisibilityButton}</span><span>{showCategoryVisibility ? "−" : "+"}</span></button>
          {showCategoryVisibility && <div style={{ padding: "10px 2px 2px" }}><p>{t.showCategoryOnWeighPage}</p><div className="pos-quick-category-row">{draftCategoryList.map((category) => <label className="pos-quick-check" key={category}><input type="checkbox" checked={draftVisibleCategories.includes(category)} onChange={(e) => setDraftVisibleCategories((old) => e.target.checked ? [...new Set([...old, category])] : old.filter((x) => x !== category))}/>{categoryLabel(category)}</label>)}</div></div>}
        </div>
        <div className="pos-quick-settings-list">{products.map((p) => {
          const id = idOf(p);
          return <div className="pos-quick-settings-row" key={id}>
            <div className="pos-quick-settings-product"><strong>{p.name || id}</strong><small>{p.sku || p.reference || p.id}</small></div>
            <label className="pos-quick-check"><input type="checkbox" checked={draftFavorites.includes(id)} onChange={(e) => setDraftFavorites((old) => e.target.checked ? [...new Set([...old, id])] : old.filter((x) => x !== id))}/>{t.favorite}</label>
            <label className="pos-quick-check"><input type="checkbox" checked={draftWeighed.includes(id)} onChange={(e) => setDraftWeighed((old) => e.target.checked ? [...new Set([...old, id])] : old.filter((x) => x !== id))}/>{t.weighed}</label>
            <select aria-label={t.category} value={draftCategories[id] || ""} disabled={!draftWeighed.includes(id)} onChange={(e) => setDraftCategories((old) => ({ ...old, [id]: e.target.value }))}>
              <option value="">{t.noCategory}</option>{draftCategoryList.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>;
        })}</div>
        <footer className="pos-quick-footer"><button type="button" onClick={resetAndClose}>{t.cancel}</button><button type="button" className="primary" onClick={() => { onSaveSettings({ favoriteIds: draftFavorites, weighedIds: draftWeighed, categoriesByProduct: draftCategories, categories: draftCategoryList, visibleWeighedCategories: draftVisibleCategories.filter((category) => draftCategoryList.includes(category)), poundGrams: Math.max(1, Number(draftPound) || 500) }); resetAndClose(); }}><Check size={17}/>{t.save}</button></footer>
      </> : <>
        {dialog === "weigh" && <><div className="pos-quick-category-row"><span>{t.category}</span><button type="button" className={categoryFilter === "all" ? "active" : ""} onClick={() => { setCategoryFilter("all"); setWeighedPage(1); }}>{t.all}</button>{visibleWeighedCategories.filter((c) => categories.includes(c)).map((c, index) => { const shortcutIndex = shortcutCategories.some(Boolean) ? shortcutCategories.indexOf(c) : index; return <button type="button" key={c} className={categoryFilter === c ? "active" : ""} onClick={() => { setCategoryFilter(c); setWeighedPage(1); }}>{shortcutIndex >= 0 && <kbd>F{shortcutIndex + 1}</kbd>} {categoryLabel(c)}</button>; })}</div><div className="pos-weighed-pagination"><button type="button" disabled={weighedPage <= 1} onClick={() => setWeighedPage((page) => Math.max(1, page - 1))} aria-label="Previous page">‹</button><span>Page {weighedPage} / {weighedPageCount}</span><button type="button" disabled={weighedPage >= weighedPageCount} onClick={() => setWeighedPage((page) => Math.min(weighedPageCount, page + 1))} aria-label="Next page">›</button><small>F1–F12 categories · ← → pages</small></div></>}
        <label className="pos-quick-search"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}/></label>
        {productTiles}
        {dialog === "weigh" && selected && !showWeighEntry && <footer className="pos-quick-footer pos-weigh-mode-footer"><button type="button" onClick={resetAndClose}>{t.close}</button><button type="button" onClick={() => { setWeight("1"); setAmount(""); setMode("amount"); setShowWeighEntry(true); setReplaceInput(true); }}><Plus size={17}/><kbd>F1</kbd>{t.priceMode}</button><button type="button" className="primary" onClick={() => { setWeight("1"); setAmount(""); setMode("weight"); setShowWeighEntry(true); setReplaceInput(true); }}><Scale size={17}/><kbd>F2</kbd>{t.weightMode}</button><small>{t.chooseMode}</small></footer>}
        {dialog === "weigh" && selected && showWeighEntry && <div className="pos-weigh-entry-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowWeighEntry(false); setSelectedId(""); } }}>
          <section className="pos-weigh-entry-modal" role="dialog" aria-modal="true" aria-label={t.selected} dir={locale === "ar" ? "rtl" : "ltr"}>
            <header className="pos-weigh-entry-heading"><div><small>{t.selected}</small><h3>{selected.name}</h3><p>{({ kg: t.priceKg, g: locale === "ar" ? "السعر لكل غرام" : locale === "fr" ? "Prix au gramme" : "Price per gram", liter: locale === "ar" ? "السعر لكل لتر" : locale === "fr" ? "Prix au litre" : "Price per liter", ml: locale === "ar" ? "السعر لكل مل" : locale === "fr" ? "Prix au ml" : "Price per ml", meter: locale === "ar" ? "السعر لكل متر" : locale === "fr" ? "Prix au mètre" : "Price per meter", cm: locale === "ar" ? "السعر لكل سم" : locale === "fr" ? "Prix au cm" : "Price per cm" })[measureUnit] || t.priceKg}: <strong>{unitPrice.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</strong></p></div><button type="button" className="pos-quick-close" onClick={() => { setShowWeighEntry(false); setSelectedId(""); }} aria-label={t.cancel}><X size={19}/></button></header>
            <div className="pos-quick-weigh-panel">
              <div className="pos-quick-mode-switch"><button type="button" className={mode === "amount" ? "active" : ""} onClick={() => { if (unitPrice > 0 && computedAmount > 0) setAmount(String(Number(computedAmount.toFixed(2)))); setMode("amount"); setReplaceInput(true); }}><kbd>F1</kbd> {t.amount}</button><button type="button" className={mode === "weight" ? "active" : ""} onClick={() => { if (unitPrice > 0 && computedWeight > 0) setWeight(String(Number(computedWeight.toFixed(3)))); setMode("weight"); setReplaceInput(true); }}><kbd>F2</kbd> {t.weight}</button></div>
              <div className="pos-quick-weight-input"><label>{mode === "weight" ? (locale === "ar" ? `الوزن (${measureLabel})` : locale === "fr" ? `Poids (${measureLabel})` : `Weight (${measureLabel})`) : t.paidAmount}<input autoFocus inputMode="decimal" value={mode === "weight" ? weight : amount} onFocus={() => setReplaceInput(true)} onChange={(e) => { (mode === "weight" ? setWeight : setAmount)(e.target.value); setReplaceInput(false); }}/></label>{keypadButtons(mode === "weight" ? setWeight : setAmount, mode === "weight" ? weight : amount)}</div>
              {measureUnit === "kg" && <div className="pos-quick-pound-buttons"><button type="button" onClick={() => { setMode("weight"); setWeight(String(Number(poundGrams || 500) / 1000)); setReplaceInput(true); }}>{t.onePound} ({Number(poundGrams || 500)} g)</button><button type="button" onClick={() => { setMode("weight"); setWeight(String(Number(poundGrams || 500) / 2000)); setReplaceInput(true); }}>{t.halfPound} ({Number(poundGrams || 500) / 2} g)</button></div>}
              <div className="pos-quick-calculation"><span>{locale === "ar" ? "الوزن المحسوب" : locale === "fr" ? "Poids calculé" : "Calculated weight"}: <strong>{computedWeight.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 3 })} {measureLabel}</strong></span><span>{t.total}: <strong>{computedAmount.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</strong></span></div>
              <footer className="pos-quick-footer"><button type="button" onClick={() => { setShowWeighEntry(false); setSelectedId(""); }}>{t.cancel}</button><button type="button" className="primary" disabled={unitPrice <= 0 || computedWeight <= 0 || !Number.isFinite(computedWeight)} onClick={() => { if (unitPrice <= 0) { window.alert(t.invalidPrice); return; } if (computedWeight <= 0) { window.alert(t.invalidWeight); return; } onAddProduct({ ...selected, quantity: Number(computedWeight.toFixed(3)), price: unitPrice, weighedSale: true, weighedCategory: categoriesByProduct[idOf(selected)] || selected.category || "", unitLabel: measureLabel }); resetAndClose(); }}><Check size={17}/>{t.add}</button></footer>
            </div>
          </section>
        </div>}
        {dialog === "favorites" && selected && <footer className="pos-quick-footer"><button type="button" onClick={resetAndClose}>{t.close}</button><button type="button" className="primary" onClick={() => { onAddProduct(selected); resetAndClose(); }}><Plus size={17}/>{t.add}</button></footer>}
      </>}
    </section>
  </div>;
}
