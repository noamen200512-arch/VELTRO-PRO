import React from "react";
import { Search, X, Package, AlertTriangle, Boxes, Calculator, Banknote, ChevronLeft, ChevronRight, Check, Barcode } from "lucide-react";

const COPY = {
  en: {
    products: "Product list", search: "Search by name, ID, or barcode...", name: "Product name", barcode: "Primary barcode", stock: "Available stock",
    out: "Out of stock", low: "Low stock", available: "Available", previous: "Previous", next: "Next", page: "Page", of: "of", choose: "Select product",
    close: "Close", options: "Product options", selected: "Selected product", editQty: "Edit quantity", editPrice: "Edit price", carton: "Convert to carton",
    qty: "Quantity (units)", price: "Unit selling price (DA)", confirm: "Confirm", cancel: "Cancel", enter: "Enter: confirm", esc: "Esc: cancel",
    keypad: "Touch keypad", stockTitle: "Stock warning", stockText: "The requested quantity exceeds the available stock. Continue with a negative stock balance?",
    priceTitle: "Below-cost warning", priceText: "The selling price is below the purchase cost. Apply this price anyway?",
    requested: "Requested quantity", availableQty: "Available quantity", cost: "Purchase cost", selling: "Selling price",
    noProducts: "No matching products.", noSelection: "Select a product row first.", cartonUnavailable: "Carton size is not configured for this product.",
    before: "Before", after: "After", currentQuantity: "Current quantity", newQuantity: "New quantity", currentPrice: "Current unit price", newPrice: "New unit price", lineTotal: "Line total", unchanged: "Changes are applied only after confirmation.",
    outTag: "OUT", lowTag: "LOW"
  },
  fr: {
    products: "Liste des produits", search: "Rechercher par nom, identifiant ou code-barres...", name: "Nom du produit", barcode: "Code-barres principal", stock: "Stock disponible",
    out: "Rupture de stock", low: "Stock faible", available: "Disponible", previous: "Précédente", next: "Suivante", page: "Page", of: "sur", choose: "Choisir le produit",
    close: "Fermer", options: "Options du produit", selected: "Produit sélectionné", editQty: "Modifier la quantité", editPrice: "Modifier le prix", carton: "Convertir en carton",
    qty: "Quantité (unités)", price: "Prix de vente unitaire (DA)", confirm: "Confirmer", cancel: "Annuler", enter: "Entrée : confirmer", esc: "Échap : annuler",
    keypad: "Clavier tactile", stockTitle: "Alerte de stock", stockText: "La quantité demandée dépasse le stock disponible. Continuer avec un stock négatif ?",
    priceTitle: "Alerte de vente à perte", priceText: "Le prix de vente est inférieur au coût d'achat. Appliquer ce prix quand même ?",
    requested: "Quantité demandée", availableQty: "Quantité disponible", cost: "Coût d'achat", selling: "Prix de vente",
    noProducts: "Aucun produit correspondant.", noSelection: "Sélectionnez d'abord une ligne de produit.", cartonUnavailable: "Le format carton n'est pas configuré pour ce produit.",
    before: "Avant", after: "Après", currentQuantity: "Quantité actuelle", newQuantity: "Nouvelle quantité", currentPrice: "Prix unitaire actuel", newPrice: "Nouveau prix unitaire", lineTotal: "Total de la ligne", unchanged: "Les changements seront appliqués après confirmation.",
    outTag: "ÉPUISÉ", lowTag: "FAIBLE"
  },
  ar: {
    products: "قائمة المنتجات", search: "ابحث بالاسم أو المعرف أو الكودبار...", name: "اسم المنتج", barcode: "الكودبار الأساسي", stock: "المخزون المتوفر",
    out: "نفد المخزون", low: "مخزون منخفض", available: "متوفر", previous: "الصفحة السابقة", next: "الصفحة التالية", page: "صفحة", of: "من", choose: "اختيار المنتج",
    close: "إغلاق", options: "خيارات المنتج", selected: "المنتج المحدد", editQty: "تعديل الكمية", editPrice: "تعديل السعر", carton: "تحويل إلى كرتونة",
    qty: "الكمية (وحدات)", price: "سعر البيع للوحدة (دج)", confirm: "تأكيد", cancel: "إلغاء", enter: "Enter: تأكيد", esc: "Esc: إلغاء",
    keypad: "لوحة أرقام للمس", stockTitle: "تنبيه المخزون", stockText: "الكمية المطلوبة أكبر من المخزون المتوفر. هل تريد المتابعة مع رصيد مخزون سالب؟",
    priceTitle: "تنبيه البيع بأقل من التكلفة", priceText: "سعر البيع أقل من سعر الشراء. هل تريد اعتماد هذا السعر؟",
    requested: "الكمية المطلوبة", availableQty: "الكمية المتوفرة", cost: "سعر الشراء", selling: "سعر البيع",
    noProducts: "لا توجد منتجات مطابقة.", noSelection: "حدد صف المنتج أولًا.", cartonUnavailable: "لم يتم إعداد عدد القطع في الكرتونة لهذا المنتج.",
    before: "قبل التعديل", after: "بعد التعديل", currentQuantity: "الكمية الحالية", newQuantity: "الكمية الجديدة", currentPrice: "سعر الوحدة الحالي", newPrice: "سعر الوحدة الجديد", lineTotal: "إجمالي السطر", unchanged: "لن تُطبّق التغييرات إلا بعد التأكيد.",
    outTag: "نفد", lowTag: "منخفض"
  }
};

export function PosKeyboardDialogs({
  dialog, locale = "en", products = [], selectedItem = null, selectedCartIndex = 0,
  productSearch = "", setProductSearch = () => {}, productPage = 1, setProductPage = () => {},
  selectedProductIndex = 0, setSelectedProductIndex = () => {}, quantityDraft = "", setQuantityDraft = () => {},
  priceDraft = "", setPriceDraft = () => {}, warningPayload = null,
  onClose = () => {}, onSelectProduct = () => {}, onConvertCarton = () => {},
  onOpenQuantity = () => {}, onOpenPrice = () => {}, onApplyQuantity = () => {},
  onApplyPrice = () => {}, onConfirmWarning = () => {}, onCancelWarning = () => {}
}) {
  const t = COPY[locale] || COPY.en;
  if (!dialog) return null;
  const query = productSearch.trim().toLocaleLowerCase();
  const filtered = products.filter((p) => [
    p.name, p.id, p.productId, p.sku, p.barcode, ...(Array.isArray(p.barcodeAliases) ? p.barcodeAliases : [])
  ].some((v) => String(v ?? "").toLocaleLowerCase().includes(query)));
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(productPage, pageCount);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedProduct = pageRows[Math.min(selectedProductIndex, Math.max(0, pageRows.length - 1))] || null;
  const stockOf = (p) => Number(p?.stock) || 0;
  const thresholdOf = (p) => Math.max(1, Number(p?.lowStockThreshold ?? p?.minStock ?? p?.minimumStock ?? p?.alertStock) || 5);
  const currentQty = Math.max(0, Number(selectedItem?.quantity ?? selectedItem?.qty) || 0);
  const currentPrice = Math.max(0, Number(selectedItem?.price) || 0);
  const itemProductId = selectedItem?.productId ?? selectedItem?.product_id ?? selectedItem?.id;
  const itemProduct = products.find((p) => String(p.id ?? p.productId) === String(itemProductId)) || selectedItem;
  const cartonSize = Math.max(1, Number(itemProduct?.piecesPerCarton ?? itemProduct?.unitsPerCarton ?? selectedItem?.piecesPerCarton) || 1);
  const cartonPrice = Math.max(0, Number(itemProduct?.cartonPrice ?? selectedItem?.cartonPrice) || 0);
  const previewQty = dialog === "quantity" && Number(quantityDraft) > 0 ? Number(quantityDraft) : currentQty;
  const previewPrice = dialog === "price" && Number(String(priceDraft).replace(",", ".")) >= 0 ? Number(String(priceDraft).replace(",", ".")) : currentPrice;
  const moneyFormat = (n) => format(n) + " DA";
  const format = (n) => (Number(n) || 0).toLocaleString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-DZ" : "en-US", { maximumFractionDigits: 2 });
  const [keypadReplace, setKeypadReplace] = React.useState(true);
  React.useEffect(() => { setKeypadReplace(true); }, [dialog]);
  const keyButtons = ["1","2","3","4","5","6","7","8","9","⌫","0","."];
  const pushKey = (key, type) => {
    const setter = type === "quantity" ? setQuantityDraft : setPriceDraft;
    const current = String(type === "quantity" ? quantityDraft : priceDraft);
    if (key === "⌫") {
      setter(keypadReplace ? "" : current.slice(0, -1));
      setKeypadReplace(false);
      return;
    }
    if (key === "." && type === "quantity") return;
    if (key === "." && !keypadReplace && current.includes(".")) return;
    setter(keypadReplace ? (key === "." ? "0." : key) : (current === "0" && key !== "." ? key : current + key));
    setKeypadReplace(false);
  };
  const title = dialog === "products" ? t.products : dialog === "options" ? t.options : dialog === "quantity" ? t.editQty : dialog === "price" ? t.editPrice : dialog === "stockWarning" ? t.stockTitle : t.priceTitle;

  return (
    <div className="pos-keyboard-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !["stockWarning","priceWarning"].includes(dialog)) onClose(); }}>
      {(["quantity", "price", "priceWarning"].includes(dialog) || (dialog === "stockWarning" && (warningPayload?.returnTo || warningPayload?.type === "convertCarton"))) && (
        <section className="pos-keyboard-modal pos-keyboard-parent-under" aria-hidden="true" dir={locale === "ar" ? "rtl" : "ltr"}>
          <header className="pos-keyboard-header">
            <div className="pos-keyboard-title-icon"><Boxes size={20}/></div>
            <div className="pos-keyboard-title-copy"><h2>{dialog === "quantity" || warningPayload?.returnTo === "quantity" ? t.editQty : dialog === "price" || warningPayload?.returnTo === "price" ? t.editPrice : t.options}</h2><p>{selectedItem?.name || ""}</p></div>
          </header>
          <div className="pos-keyboard-selected-product"><Package size={20}/><div><small>{t.selected}</small><strong>{selectedItem?.name || ""}</strong></div></div>
        </section>
      )}
      <section className={`pos-keyboard-modal ${dialog === "products" ? "pos-keyboard-products" : "pos-keyboard-compact"}`} role="dialog" aria-modal="true" aria-label={title} dir={locale === "ar" ? "rtl" : "ltr"}>
        <header className="pos-keyboard-header">
          <div className="pos-keyboard-title-icon">{dialog === "products" ? <Package size={20}/> : dialog === "quantity" ? <Calculator size={20}/> : dialog === "price" ? <Banknote size={20}/> : dialog === "options" ? <Boxes size={20}/> : <AlertTriangle size={20}/>}</div>
          <div className="pos-keyboard-title-copy"><h2>{title}</h2>{selectedItem && dialog !== "products" && <p>{selectedItem.name}</p>}</div>
          <button type="button" className="pos-keyboard-close" onClick={onClose} aria-label={t.close}><X size={19}/></button>
        </header>

        {dialog === "products" && <>
          <label className="pos-keyboard-search"><Search size={18}/><input autoFocus value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setProductPage(1); setSelectedProductIndex(0); }} placeholder={t.search} aria-label={t.search}/><Barcode size={18}/></label>
          <div className="pos-keyboard-table-wrap">
            <table className="pos-keyboard-table"><thead><tr><th>{t.name}</th><th>{t.barcode}</th><th>{t.stock}</th></tr></thead><tbody>
              {pageRows.map((p, i) => { const stock = stockOf(p); const low = stock > 0 && stock <= thresholdOf(p); const out = stock <= 0; return <tr key={String(p.id ?? p.productId ?? p.barcode)} className={i === selectedProductIndex ? "is-selected" : ""} onMouseEnter={() => setSelectedProductIndex(i)} onDoubleClick={() => onSelectProduct(p)} onClick={() => setSelectedProductIndex(i)}>
                <td><span className={out ? "pos-stock-out" : low ? "pos-stock-low" : ""}>{p.name || "—"}</span>{out && <small className="pos-stock-pill out">{t.outTag}</small>}{low && <small className="pos-stock-pill low">{t.lowTag}</small>}</td><td>{p.barcode || "—"}</td><td className={out ? "pos-stock-out" : low ? "pos-stock-low" : "pos-stock-ok"}>{format(stock)}</td>
              </tr>; })}
              {!pageRows.length && <tr><td colSpan="3" className="pos-keyboard-empty">{t.noProducts}</td></tr>}
            </tbody></table>
          </div>
          <footer className="pos-keyboard-footer"><span>{t.page} {page} {t.of} {pageCount} · {filtered.length}</span><div><button type="button" onClick={() => { setProductPage(Math.max(1, page - 1)); setSelectedProductIndex(0); }} disabled={page <= 1}><ChevronLeft size={15}/>{t.previous}</button><button type="button" onClick={() => { setProductPage(Math.min(pageCount, page + 1)); setSelectedProductIndex(0); }} disabled={page >= pageCount}>{t.next}<ChevronRight size={15}/></button><button type="button" className="primary" disabled={!selectedProduct} onClick={() => selectedProduct && onSelectProduct(selectedProduct)}><Check size={15}/>{t.choose}</button></div></footer>
        </>}

        {dialog === "options" && <div className="pos-keyboard-options pos-keyboard-options-redesigned">
          <div className="pos-keyboard-selected-product pos-keyboard-product-hero"><Package size={23}/><div><small>{t.selected} · {selectedCartIndex + 1}</small><strong>{selectedItem?.name || t.noSelection}</strong><span>{t.stock}: {format(stockOf(itemProduct))}</span></div></div>
          <div className="pos-keyboard-comparison">
            <div className="pos-keyboard-comparison-heading"><span>{t.before}</span><span>{t.after}</span></div>
            <div className="pos-keyboard-comparison-row"><span><small>{t.currentQuantity}</small><strong>{format(currentQty)}</strong></span><span><small>{t.newQuantity}</small><strong>{format(cartonSize)}</strong></span></div>
            <div className="pos-keyboard-comparison-row"><span><small>{t.currentPrice}</small><strong>{moneyFormat(currentPrice)}</strong></span><span><small>{t.newPrice}</small><strong>{moneyFormat(cartonSize > 1 && cartonPrice > 0 ? cartonPrice / cartonSize : currentPrice)}</strong></span></div>
            <div className="pos-keyboard-comparison-total"><span>{t.lineTotal}</span><strong>{moneyFormat(currentQty * currentPrice)} <ChevronRight size={14}/> {moneyFormat(cartonSize * (cartonSize > 1 && cartonPrice > 0 ? cartonPrice / cartonSize : currentPrice))}</strong></div>
          </div>
          <p className="pos-keyboard-no-change">{t.unchanged}</p>
          <div className="pos-keyboard-options-actions">
            <button type="button" onClick={onOpenQuantity}><Calculator size={18}/><span>{t.editQty}</span><kbd>F7</kbd></button>
            <button type="button" onClick={onOpenPrice}><Banknote size={18}/><span>{t.editPrice}</span><kbd>F8</kbd></button>
            <button type="button" onClick={onConvertCarton}><Boxes size={18}/><span>{t.carton}</span><kbd>F6</kbd></button>
          </div>
        </div>}

        {(dialog === "quantity" || dialog === "price") && <div className="pos-keyboard-editor pos-keyboard-editor-redesigned">
          <div className="pos-keyboard-comparison pos-keyboard-live-comparison">
            <div className="pos-keyboard-comparison-heading"><span>{t.before}</span><span>{t.after}</span></div>
            <div className="pos-keyboard-comparison-row"><span><small>{t.currentQuantity}</small><strong>{format(currentQty)}</strong></span><span><small>{t.newQuantity}</small><strong>{format(previewQty)}</strong></span></div>
            <div className="pos-keyboard-comparison-row"><span><small>{t.currentPrice}</small><strong>{moneyFormat(currentPrice)}</strong></span><span><small>{t.newPrice}</small><strong>{moneyFormat(previewPrice)}</strong></span></div>
            <div className="pos-keyboard-comparison-total"><span>{t.lineTotal}</span><strong>{moneyFormat(currentQty * currentPrice)} <ChevronRight size={14}/> {moneyFormat(previewQty * previewPrice)}</strong></div>
          </div>
          <label>{dialog === "quantity" ? t.qty : t.price}<input autoFocus type="text" inputMode={dialog === "quantity" ? "numeric" : "decimal"} value={dialog === "quantity" ? quantityDraft : priceDraft} onChange={(e) => { (dialog === "quantity" ? setQuantityDraft : setPriceDraft)(e.target.value.replace(dialog === "quantity" ? /[^0-9]/g : /[^0-9.,]/g, "")); setKeypadReplace(false); }} onFocus={(e) => { e.currentTarget.select(); setKeypadReplace(true); }}/></label>
          <div className="pos-keyboard-keypad"><span>{t.keypad}</span><div>{keyButtons.map((key) => <button type="button" key={key} onClick={() => pushKey(key, dialog)}>{key}</button>)}</div></div>
          <footer className="pos-keyboard-footer"><span>{t.enter} · {t.esc}</span><button type="button" className="primary" onClick={() => dialog === "quantity" ? onApplyQuantity(quantityDraft) : onApplyPrice(priceDraft)}><Check size={15}/>{t.confirm}</button></footer>
        </div>}

        {dialog === "stockWarning" && <div className="pos-keyboard-warning"><AlertTriangle size={30}/><p>{t.stockText}</p><div className="pos-keyboard-warning-stats"><span>{t.requested}<strong>{format(warningPayload?.requested)}</strong></span><span>{t.availableQty}<strong>{format(warningPayload?.available)}</strong></span></div><footer className="pos-keyboard-footer"><button type="button" onClick={onCancelWarning}>{t.cancel} · Esc</button><button type="button" className="primary" onClick={onConfirmWarning}>{t.confirm} · Enter</button></footer></div>}
        {dialog === "priceWarning" && <div className="pos-keyboard-warning"><AlertTriangle size={30}/><p>{t.priceText}</p><div className="pos-keyboard-warning-stats"><span>{t.cost}<strong>{format(warningPayload?.cost)} DA</strong></span><span>{t.selling}<strong>{format(warningPayload?.selling)} DA</strong></span></div><footer className="pos-keyboard-footer"><button type="button" onClick={onCancelWarning}>{t.cancel} · Esc</button><button type="button" className="primary" onClick={onConfirmWarning}>{t.confirm} · Enter</button></footer></div>}
      </section>
    </div>
  );
}

export default PosKeyboardDialogs;
