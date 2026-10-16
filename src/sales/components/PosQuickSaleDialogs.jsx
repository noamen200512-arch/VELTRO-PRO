import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Star, Scale, Settings2, Check, Plus, Package } from "lucide-react";

const COPY = {
  en: {
    favorites:"Favorite products", weigh:"Sell by weight", settings:"Quick-sale settings", search:"Search by product name or reference…",
    noFavorites:"No favorite products configured.", noWeighed:"No products configured for weighing.", close:"Close", add:"Add to invoice",
    choose:"Choose a product", category:"Category", all:"All categories", nuts:"Nuts", grains:"Grains", spices:"Spices", other:"Other",
    weight:"Weight", amount:"Amount to pay", kg:"kg", priceKg:"Price per kg", total:"Total", onePound:"1 pound", halfPound:"½ pound",
    customCategories:"Manage categories", newCategory:"New category name", addCategory:"Add category", favorite:"Favorite", weighed:"Sell by weight", showCategoryOnWeighPage:"Show this category in the weigh-sale page",
    save:"Save settings", cancel:"Cancel", noProducts:"No products found.", select:"Select", quantity:"Weight in kg", paidAmount:"Amount in DA",
    invalidPrice:"This product needs a price greater than zero to calculate weight.", invalidWeight:"Enter a weight or amount greater than zero.",
    selected:"Selected product", setupHint:"Choose which products appear in each quick-sale screen and assign a category to weighed products.",
    remove:"Remove", enter:"Enter", clear:"Clear", poundSize:"Pound size (grams)", noCategory:"Uncategorized"
  },
  fr: {
    favorites:"Produits favoris", weigh:"Vente au poids", settings:"Réglages de vente rapide", search:"Rechercher par nom ou référence…",
    noFavorites:"Aucun produit favori configuré.", noWeighed:"Aucun produit configuré pour la pesée.", close:"Fermer", add:"Ajouter à la facture",
    choose:"Choisir un produit", category:"Catégorie", all:"Toutes les catégories", nuts:"Fruits à coque", grains:"Céréales", spices:"Épices", other:"Autre",
    weight:"Poids", amount:"Montant à payer", kg:"kg", priceKg:"Prix au kg", total:"Total", onePound:"1 livre", halfPound:"½ livre",
    customCategories:"Gérer les catégories", newCategory:"Nom de la nouvelle catégorie", addCategory:"Ajouter la catégorie", favorite:"Favori", weighed:"Vente au poids", showCategoryOnWeighPage:"Afficher cette catégorie dans la vente au poids",
    save:"Enregistrer", cancel:"Annuler", noProducts:"Aucun produit trouvé.", select:"Sélectionner", quantity:"Poids en kg", paidAmount:"Montant en DA",
    invalidPrice:"Ce produit doit avoir un prix supérieur à zéro pour calculer le poids.", invalidWeight:"Saisissez un poids ou un montant supérieur à zéro.",
    selected:"Produit sélectionné", setupHint:"Choisissez les produits affichés dans chaque écran et classez les produits vendus au poids.",
    remove:"Supprimer", enter:"Entrée", clear:"Effacer", poundSize:"Valeur de la livre (grammes)", noCategory:"Sans catégorie"
  },
  ar: {
    favorites:"المنتجات المفضلة", weigh:"البيع بالميزان", settings:"إعدادات البيع السريع", search:"ابحث باسم المنتج أو مرجعه…",
    noFavorites:"لم تُحدَّد منتجات مفضلة بعد.", noWeighed:"لم تُحدَّد منتجات للبيع بالميزان.", close:"إغلاق", add:"إضافة إلى الفاتورة",
    choose:"اختر منتجًا", category:"الفئة", all:"كل الفئات", nuts:"مكسرات", grains:"حبوب", spices:"توابل", other:"أخرى",
    weight:"الوزن", amount:"المبلغ المراد دفعه", kg:"كغ", priceKg:"السعر لكل كغ", total:"الإجمالي", onePound:"رطل واحد", halfPound:"نصف رطل",
    customCategories:"إدارة الفئات", newCategory:"اسم الفئة الجديدة", addCategory:"إضافة الفئة", favorite:"مفضّل", weighed:"بيع بالميزان", showCategoryOnWeighPage:"إظهار هذه الفئة في صفحة البيع بالميزان",
    save:"حفظ الإعدادات", cancel:"إلغاء", noProducts:"لم يُعثر على منتجات.", select:"اختيار", quantity:"الوزن بالكيلوغرام", paidAmount:"المبلغ بالدج",
    invalidPrice:"يجب أن يكون سعر الكيلوغرام أكبر من صفر لحساب الوزن.", invalidWeight:"أدخل وزنًا أو مبلغًا أكبر من صفر.",
    selected:"المنتج المحدد", setupHint:"اختر المنتجات التي تظهر في كل شاشة، وصنّف المنتجات المباعة بالميزان.",
    remove:"حذف", enter:"إدخال", clear:"مسح", poundSize:"قيمة الرطل بالغرام", noCategory:"بلا فئة"
  }
};

const normalize = (v) => String(v ?? "").trim().toLocaleLowerCase();
const idOf = (p) => String(p?.id ?? p?.productId ?? p?.sku ?? "");
const priceOf = (p) => Number(p?.price ?? p?.retailPrice ?? p?.sellingPrice ?? 0) || 0;

export default function PosQuickSaleDialogs({
  dialog, locale = "en", products = [], favoriteIds = [], weighedIds = [], categoriesByProduct = {},
  categories = ["Nuts", "Grains", "Spices", "Other"], visibleWeighedCategories = categories, poundGrams = 500,
  onClose = () => {}, onAddProduct = () => {}, onToggleFavorite = () => {},
  onSaveSettings = () => {}
}) {
  const t = COPY[locale] || COPY.en;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("weight");
  const [weight, setWeight] = useState("1");
  const [amount, setAmount] = useState("");
  const [replaceInput, setReplaceInput] = useState(true);
  const [draftFavorites, setDraftFavorites] = useState(favoriteIds.map(String));
  const [draftWeighed, setDraftWeighed] = useState(weighedIds.map(String));
  const [draftCategories, setDraftCategories] = useState({ ...categoriesByProduct });
  const [draftCategoryList, setDraftCategoryList] = useState([...categories]);
  const [draftVisibleCategories, setDraftVisibleCategories] = useState([...visibleWeighedCategories]);
  const [newCategory, setNewCategory] = useState("");
  const [draftPound, setDraftPound] = useState(String(poundGrams || 500));

  useEffect(() => {
    if (dialog === "settings") {
      setDraftFavorites(favoriteIds.map(String));
      setDraftWeighed(weighedIds.map(String));
      setDraftCategories({ ...categoriesByProduct });
      setDraftCategoryList([...categories]);
      setDraftVisibleCategories([...visibleWeighedCategories]);
      setDraftPound(String(poundGrams || 500));
    }
    if (dialog === "favorites" || dialog === "weigh") {
      setSearch("");
      setCategoryFilter("all");
      setSelectedId("");
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
    if (dialog === "weigh" && !(p.weighedSale || weighedSet.has(id))) return false;
    const q = normalize(search);
    if (q && ![p.name, p.id, p.productId, p.sku, p.reference, p.barcode].some((v) => normalize(v).includes(q))) return false;
    if (dialog === "weigh" && categoryFilter !== "all" && (categoriesByProduct[id] || p.category || "") !== categoryFilter) return false;
    return true;
  }), [products, dialog, favoriteSet, weighedSet, search, categoryFilter, categoriesByProduct]);
  const selected = products.find((p) => idOf(p) === selectedId) || null;
  const unitPrice = selected ? priceOf(selected) : 0;
  const measureUnit = String(selected?.unit || "kg").toLowerCase();
  const measureLabel = ({ kg: "kg", g: "g", liter: "L", ml: "ml", meter: "m", cm: "cm" })[measureUnit] || measureUnit;
  const computedWeight = mode === "amount" ? (unitPrice > 0 ? (Number(String(amount).replace(",", ".")) || 0) / unitPrice : 0) : (Number(String(weight).replace(",", ".")) || 0);
  const computedAmount = selected ? unitPrice * computedWeight : 0;
  if (!dialog) return null;

  const resetAndClose = () => { setSearch(""); setCategoryFilter("all"); setSelectedId(""); onClose(); };
  const keypad = (key, setter, current) => {
    if (key === "⌫") setter(replaceInput ? "" : String(current).slice(0, -1));
    else if (key === "C") setter("");
    else if (key === "." && replaceInput) setter("0.");
    else if (key === "." && String(current).includes(".")) return;
    else setter(replaceInput ? key : String(current) + key);
    setReplaceInput(false);
  };
  const categoryLabel = (category) => {
    const key = ({ "Nuts":"nuts", "Grains":"grains", "Spices":"spices", "Other":"other" })[category];
    return key ? t[key] : category;
  };
  const keypadButtons = (setter, current) => <div className="pos-quick-keypad" aria-label={t.enter}>
    {["1","2","3","4","5","6","7","8","9","⌫","0",".","C"].map((key) => <button type="button" key={key} onClick={() => keypad(key, setter, current)}>{key}</button>)}
  </div>;
  const productTiles = <div className="pos-quick-tiles">
    {filtered.map((p) => <button type="button" key={idOf(p)} className={selectedId === idOf(p) ? "is-selected" : ""} onClick={() => { setSelectedId(idOf(p)); setWeight("1"); setAmount(""); setMode("weight"); }}>
      <span className="pos-quick-tile-icon"><Package size={20}/></span><strong>{p.name || idOf(p)}</strong><small>{p.sku || p.reference || p.id || ""}</small><b>{priceOf(p).toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</b>
      {dialog === "favorites" && <span role="presentation" className="pos-quick-star" onClick={(e) => { e.stopPropagation(); onToggleFavorite(p); }}><Star size={17} fill="currentColor"/></span>}
    </button>)}
    {!filtered.length && <p className="pos-quick-empty">{dialog === "favorites" ? t.noFavorites : dialog === "weigh" ? t.noWeighed : t.noProducts}</p>}
  </div>;

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
          <div className="pos-quick-new-category"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder={t.newCategory}/><button type="button" onClick={() => { const value = newCategory.trim(); if (value && !draftCategoryList.includes(value)) setDraftCategoryList((old) => [...old, value]); setNewCategory(""); }}><Plus size={16}/>{t.addCategory}</button></div>
        </div>
        <div className="pos-quick-category-visibility" aria-label={t.customCategories}>
          <strong>{t.customCategories}</strong>
          <p>{t.showCategoryOnWeighPage}</p>
          <div className="pos-quick-category-row">{draftCategoryList.map((category) => <label className="pos-quick-check" key={category}><input type="checkbox" checked={draftVisibleCategories.includes(category)} onChange={(e) => setDraftVisibleCategories((old) => e.target.checked ? [...new Set([...old, category])] : old.filter((x) => x !== category))}/>{categoryLabel(category)}</label>)}</div>
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
        {dialog === "weigh" && <div className="pos-quick-category-row"><span>{t.category}</span><button type="button" className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>{t.all}</button>{visibleWeighedCategories.filter((c) => categories.includes(c)).map((c) => <button type="button" key={c} className={categoryFilter === c ? "active" : ""} onClick={() => setCategoryFilter(c)}>{categoryLabel(c)}</button>)}</div>}
        <label className="pos-quick-search"><Search size={18}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search}/></label>
        {productTiles}
        {dialog === "weigh" && selected && <div className="pos-quick-weigh-panel">
          <div className="pos-quick-selected"><div><small>{t.selected}</small><strong>{selected.name}</strong></div><span>{({ kg: t.priceKg, g: locale === "ar" ? "السعر لكل غرام" : locale === "fr" ? "Prix au gramme" : "Price per gram", liter: locale === "ar" ? "السعر لكل لتر" : locale === "fr" ? "Prix au litre" : "Price per liter", ml: locale === "ar" ? "السعر لكل مل" : locale === "fr" ? "Prix au ml" : "Price per ml", meter: locale === "ar" ? "السعر لكل متر" : locale === "fr" ? "Prix au mètre" : "Price per meter", cm: locale === "ar" ? "السعر لكل سم" : locale === "fr" ? "Prix au cm" : "Price per cm" })[measureUnit] || t.priceKg}: {unitPrice.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</span></div>
          <div className="pos-quick-mode-switch"><button type="button" className={mode === "weight" ? "active" : ""} onClick={() => { if (unitPrice > 0 && computedWeight > 0) setWeight(String(Number(computedWeight.toFixed(3)))); setMode("weight"); setReplaceInput(true); }}>{t.weight}</button><button type="button" className={mode === "amount" ? "active" : ""} onClick={() => { if (unitPrice > 0 && computedAmount > 0) setAmount(String(Number(computedAmount.toFixed(2)))); setMode("amount"); setReplaceInput(true); }}>{t.amount}</button></div>
          <div className="pos-quick-weight-input"><label>{mode === "weight" ? (locale === "ar" ? `الكمية (${measureLabel})` : locale === "fr" ? `Quantité (${measureLabel})` : `Quantity (${measureLabel})`) : t.paidAmount}<input inputMode="decimal" value={mode === "weight" ? weight : amount} onFocus={() => setReplaceInput(true)} onChange={(e) => { (mode === "weight" ? setWeight : setAmount)(e.target.value); setReplaceInput(false); }}/></label>{keypadButtons(mode === "weight" ? setWeight : setAmount, mode === "weight" ? weight : amount)}</div>
          {measureUnit === "kg" && <div className="pos-quick-pound-buttons"><button type="button" onClick={() => { setMode("weight"); setWeight(String(Number(poundGrams || 500) / 1000)); setReplaceInput(true); }}>{t.onePound} ({Number(poundGrams || 500)} g)</button><button type="button" onClick={() => { setMode("weight"); setWeight(String(Number(poundGrams || 500) / 2000)); setReplaceInput(true); }}>{t.halfPound} ({Number(poundGrams || 500) / 2} g)</button></div>}
          <div className="pos-quick-calculation"><span>{locale === "ar" ? "الكمية" : locale === "fr" ? "Quantité" : "Quantity"}: <strong>{computedWeight.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 3 })} {measureLabel}</strong></span><span>{t.total}: <strong>{computedAmount.toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 })} DA</strong></span></div>
          <footer className="pos-quick-footer"><button type="button" onClick={() => setSelectedId("")}>{t.cancel}</button><button type="button" className="primary" disabled={unitPrice <= 0 || computedWeight <= 0 || !Number.isFinite(computedWeight)} onClick={() => { if (unitPrice <= 0) { window.alert(t.invalidPrice); return; } if (computedWeight <= 0) { window.alert(t.invalidWeight); return; } onAddProduct({ ...selected, quantity: Number(computedWeight.toFixed(3)), price: unitPrice, weighedSale: true, weighedCategory: categoriesByProduct[idOf(selected)] || selected.category || "", unitLabel: measureLabel }); resetAndClose(); }}><Check size={17}/>{t.add}</button></footer>
        </div>}
        {dialog === "favorites" && selected && <footer className="pos-quick-footer"><button type="button" onClick={resetAndClose}>{t.close}</button><button type="button" className="primary" onClick={() => { onAddProduct(selected); resetAndClose(); }}><Plus size={17}/>{t.add}</button></footer>}
      </>}
    </section>
  </div>;
}
