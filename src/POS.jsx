
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, UserRound, Phone, Fingerprint, Users, Check, UserRoundPlus, BadgeCheck, ReceiptText, WalletCards, AlertTriangle, Hash, CalendarClock, Clock, ChevronRight, ChevronLeft, ClipboardList, RotateCcw, Maximize2, Minimize2, Keyboard, HelpCircle, Star, Scale, Wifi, WifiOff, Server } from "lucide-react";

import { SalesToolbar } from "./sales/components/SalesToolbar";
import { SalesSidebar } from "./sales/components/SalesSidebar";
import { ProductEntry } from "./sales/components/ProductEntry";
import { InvoiceTable } from "./sales/components/InvoiceTable";
import { InvoiceSummary } from "./sales/components/InvoiceSummary";
import { PosKeyboardDialogs } from "./sales/components/PosKeyboardDialogs";
import PosQuickSaleDialogs from "./sales/components/PosQuickSaleDialogs";

import {
  createInvoice,
  getAutoSavedDraft,
  saveAutoSavedDraft,
  getPendingInvoices,
  savePendingInvoice,
  getPendingInvoice,
  cancelPendingInvoice,
  completeSale,
  getCustomerDebt,
  getCompletedSales,
  editCompletedSale,
} from "./sales/salesStore.js";

import { getProducts } from "./productStore.js";
import { saveProductsToCloud } from "./lib/productCloud.js";
import { saveSaleToCloud, voidPendingSaleFromCloud } from "./lib/salesCloud.js";
import { supabase } from "./lib/supabase.js";
import { loadCustomersFromCloud } from "./lib/customerCloud.js";
import { playSound, setSoundUser, unlockSoundAudio } from "./services/soundService.js";

let cloudDraftSaveQueue = Promise.resolve();

async function loadCloudInvoiceDraft(organizationId, userId) {
  const { data, error } = await supabase
    .from("pos_invoice_drafts")
    .select("draft, updated_at")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.draft && typeof data.draft === "object"
    ? { ...data.draft, updatedAt: data.updated_at || data.draft.updatedAt, status: "Draft" }
    : null;
}

function saveCloudInvoiceDraft(organizationId, userId, invoice) {
  const task = async () => {
    const now = new Date().toISOString();
    const draft = { ...invoice, status: "Draft", updatedAt: now };
    const { error } = await supabase
      .from("pos_invoice_drafts")
      .upsert({
        organization_id: organizationId,
        user_id: userId,
        invoice_id: String(draft.id),
        invoice_number: String(draft.invoiceNumber || ""),
        draft,
        updated_at: now,
      }, { onConflict: "organization_id,user_id" });
    if (error) throw error;
  };

  cloudDraftSaveQueue = cloudDraftSaveQueue.catch(() => {}).then(task);
  return cloudDraftSaveQueue;
}

async function deleteCloudInvoiceDraft(organizationId, userId) {
  const { error } = await supabase
    .from("pos_invoice_drafts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw error;
}

import "./sales/sales.css";

const POS_MESSAGE_TRANSLATIONS = {
  fr: {
    "Invoice saved to Pending Invoices.": "Facture enregistrée dans les factures en attente.",
    "A new invoice is ready.": "Une nouvelle facture est prête.",
    "Empty invoice closed. New invoice created.": "Facture vide fermée. Nouvelle facture créée.",
    "Product not found in the current inventory.": "Produit introuvable dans le stock actuel.",
    "Product not found in the current inventory. Refresh the product list and try again.": "Produit introuvable dans le stock actuel. Actualisez la liste puis réessayez.",
    "Quantity must be at least one unit.": "La quantité doit être d’au moins une unité.",
    "Price and discount must be zero or greater.": "Le prix et la remise doivent être égaux ou supérieurs à zéro.",
    "Product added to invoice.": "Produit ajouté à la facture.",
    "Product quantity updated.": "Quantité du produit mise à jour.",
    "Product price updated.": "Prix du produit mis à jour.",
    "Invoice item restored.": "Article rétabli dans la facture.",
    "Undo": "Annuler",
    "Dismiss message": "Fermer le message",
    "An empty invoice cannot be saved as pending.": "Une facture vide ne peut pas être enregistrée en attente.",
    "This invoice has no products.": "Cette facture ne contient aucun produit.",
    "A product in this invoice no longer exists in inventory.": "Un produit de cette facture n’existe plus dans le stock.",
    "This invoice has already been completed.": "Cette facture a déjà été finalisée.",
    "Could not save the pending invoice. Check browser storage.": "Impossible d’enregistrer la facture en attente. Vérifiez le stockage du navigateur.",
    "Could not update inventory. The sale was not completed.": "Impossible de mettre à jour le stock. La vente n’a pas été finalisée.",
    "Could not update pending invoices. Please retry.": "Impossible de mettre à jour les factures en attente. Réessayez.",
    "Could not record the sale. Please check inventory before retrying.": "Impossible d’enregistrer la vente. Vérifiez le stock avant de réessayer.",
    "The operation could not be completed.": "L’opération n’a pas pu être effectuée.",
    "Add at least one product to the current invoice before creating a new invoice.": "Ajoutez au moins un produit à la facture actuelle avant d’en créer une nouvelle.",
    "Add products before completing the sale.": "Ajoutez des produits avant de finaliser la vente.",
    "Add products before printing.": "Ajoutez des produits avant d’imprimer.",
    "Full-screen mode is unavailable in this browser or permission context.": "Le plein écran n’est pas disponible dans ce navigateur ou avec ces autorisations.",
    "Undo is unavailable because you changed invoices.": "L’annulation n’est pas disponible car vous avez changé de facture.",
    "Cannot restore this item: it is no longer in inventory.": "Impossible de rétablir cet article : il n’existe plus dans le stock.",
    "This pending invoice could not be found.": "Cette facture en attente est introuvable.",
    "Sale completed. Stock deducted and synchronized with cloud.": "Vente finalisée. Stock déduit et synchronisé avec le cloud.",
    "Sale completed, but cloud inventory sync failed.": "Vente finalisée, mais la synchronisation du stock avec le cloud a échoué."
  },
  ar: {
    "Invoice saved to Pending Invoices.": "تم حفظ الفاتورة ضمن الفواتير المعلّقة.",
    "A new invoice is ready.": "فاتورة جديدة جاهزة.",
    "Empty invoice closed. New invoice created.": "أُغلقت الفاتورة الفارغة وتم إنشاء فاتورة جديدة.",
    "Product not found in the current inventory.": "المنتج غير موجود في المخزون الحالي.",
    "Product not found in the current inventory. Refresh the product list and try again.": "المنتج غير موجود في المخزون الحالي. حدّث قائمة المنتجات ثم حاول مجددًا.",
    "Quantity must be at least one unit.": "يجب أن تكون الكمية وحدة واحدة على الأقل.",
    "Price and discount must be zero or greater.": "يجب أن يكون السعر والخصم صفرًا أو أكثر.",
    "Product added to invoice.": "تمت إضافة المنتج إلى الفاتورة.",
    "Product quantity updated.": "تم تحديث كمية المنتج.",
    "Product price updated.": "تم تغيير سعر المنتج.",
    "Invoice item restored.": "تمت استعادة المنتج إلى الفاتورة.",
    "Undo": "تراجع",
    "Dismiss message": "إغلاق الرسالة",
    "An empty invoice cannot be saved as pending.": "لا يمكن حفظ فاتورة فارغة ضمن الفواتير المعلّقة.",
    "This invoice has no products.": "لا تحتوي هذه الفاتورة على منتجات.",
    "A product in this invoice no longer exists in inventory.": "أحد منتجات الفاتورة لم يعد موجودًا في المخزون.",
    "This invoice has already been completed.": "تم إتمام هذه الفاتورة مسبقًا.",
    "Could not save the pending invoice. Check browser storage.": "تعذر حفظ الفاتورة المعلّقة. تحقق من مساحة تخزين المتصفح.",
    "Could not update inventory. The sale was not completed.": "تعذر تحديث المخزون، ولم تكتمل عملية البيع.",
    "Could not update pending invoices. Please retry.": "تعذر تحديث الفواتير المعلّقة. حاول مجددًا.",
    "Could not record the sale. Please check inventory before retrying.": "تعذر تسجيل البيع. تحقق من المخزون قبل المحاولة مجددًا.",
    "The operation could not be completed.": "تعذر إتمام العملية.",
    "Add at least one product to the current invoice before creating a new invoice.": "أضف منتجًا واحدًا على الأقل إلى الفاتورة الحالية قبل إنشاء فاتورة جديدة.",
    "Add products before completing the sale.": "أضف منتجات قبل إتمام عملية البيع.",
    "Add products before printing.": "أضف منتجات قبل الطباعة.",
    "Full-screen mode is unavailable in this browser or permission context.": "وضع ملء الشاشة غير متاح في هذا المتصفح أو بهذه الصلاحيات.",
    "Undo is unavailable because you changed invoices.": "لا يمكن التراجع لأنك انتقلت إلى فاتورة أخرى.",
    "Cannot restore this item: it is no longer in inventory.": "تعذرت استعادة المنتج لأنه لم يعد موجودًا في المخزون.",
    "This pending invoice could not be found.": "تعذر العثور على الفاتورة المعلّقة.",
    "Sale completed. Stock deducted and synchronized with cloud.": "اكتمل البيع، وتم خصم المخزون ومزامنته مع السحابة.",
    "Sale completed, but cloud inventory sync failed.": "اكتمل البيع، لكن تعذرت مزامنة المخزون مع السحابة."
  }
};

function translatePosMessage(message, locale = "en") {
  if (!message || locale === "en") return message;
  const dictionary = POS_MESSAGE_TRANSLATIONS[locale] || {};
  if (dictionary[message]) return dictionary[message];
  let match = message.match(/^(.+) removed\. You can undo this action\.$/);
  if (match) {
    if (locale === "fr") return match[1] + " retiré de la facture. Vous pouvez annuler cette action.";
    if (locale === "ar") return "تم حذف " + match[1] + " من الفاتورة. يمكنك التراجع عن الحذف.";
  }
  match = message.match(/^(.+) restored to the invoice\.$/);
  if (match) {
    if (locale === "fr") return match[1] + " rétabli dans la facture.";
    if (locale === "ar") return "تمت إعادة " + match[1] + " إلى الفاتورة.";
  }
  match = message.match(/^Added one carton of (.+) \((\d+) units\)\.$/);
  if (match) {
    if (locale === "fr") return "Un carton de " + match[1] + " (" + match[2] + " unités) a été ajouté.";
    if (locale === "ar") return "تمت إضافة كرتون من " + match[1] + " يحتوي على " + match[2] + " وحدة.";
  }
  match = message.match(/^Added one carton of (.+) as (\d+) units at the unit price\.$/);
  if (match) {
    if (locale === "fr") return "Un carton de " + match[1] + " (" + match[2] + " unités) a été ajouté au prix unitaire.";
    if (locale === "ar") return "تمت إضافة كرتون من " + match[1] + " بكمية " + match[2] + " وحدة وبسعر الوحدة.";
  }
  match = message.match(/^(.+): only (\d+) additional units are available\.$/);
  if (match) {
    if (locale === "fr") return match[1] + " : seulement " + match[2] + " unité(s) supplémentaire(s) disponible(s).";
    if (locale === "ar") return match[1] + ": المتاح " + match[2] + " وحدة إضافية فقط.";
  }
  match = message.match(/^(.+): only (\d+) units are available for this line\.$/);
  if (match) {
    if (locale === "fr") return match[1] + " : seulement " + match[2] + " unité(s) disponible(s) pour cette ligne.";
    if (locale === "ar") return match[1] + ": المتاح لهذا السطر " + match[2] + " وحدة فقط.";
  }
  match = message.match(/^(.+) has ([\d.,]+) DA in previous unpaid balances\.$/);
  if (match) {
    if (locale === "fr") return match[1] + " a " + match[2] + " DA d’impayés antérieurs.";
    if (locale === "ar") return "لدى " + match[1] + " ديون سابقة غير مدفوعة بقيمة " + match[2] + " دج.";
  }
  if (message.startsWith("Added ") && message.endsWith(" to invoice.")) {
    const productName = message.slice(6, message.length - " to invoice.".length);
    if (locale === "fr") return productName + " ajouté à la facture.";
    if (locale === "ar") return "تمت إضافة " + productName + " إلى الفاتورة.";
  }
  if (message.startsWith("Quantity updated for ")) {
    const detail = message.slice("Quantity updated for ".length, -1);
    const separator = detail.indexOf(": ");
    if (separator >= 0) {
      const productName = detail.slice(0, separator);
      const values = detail.slice(separator + 2).split(" → ");
      if (locale === "fr") return "Quantité de " + productName + " modifiée : " + (values[0] || "") + " → " + (values[1] || "") + ".";
      if (locale === "ar") return "تم تغيير كمية " + productName + " من " + (values[0] || "") + " إلى " + (values[1] || "") + ".";
    }
  }
  if (message.startsWith("Price updated for ")) {
    const detail = message.slice("Price updated for ".length, -1);
    const separator = detail.indexOf(": ");
    if (separator >= 0) {
      const productName = detail.slice(0, separator);
      const values = detail.slice(separator + 2).replace(/ DA$/, "").split(" → ");
      if (locale === "fr") return "Prix de " + productName + " modifié : " + (values[0] || "") + " → " + (values[1] || "") + " DA.";
      if (locale === "ar") return "تم تغيير سعر " + productName + " من " + (values[0] || "") + " إلى " + (values[1] || "") + " دج.";
    }
  }
  return message;
}


function money(value) {
  return Math.max(0, Number(value) || 0);
}

// Keep ordinary prices rounded to cents. Very precise fractional prices
// (for example, a carton price divided across many units) round upward so
// the per-unit price does not undercut the calculated value.
function roundPriceUp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  const decimalPart = String(value).replace(",", ".").split(".")[1] || "";
  const cents = numeric * 100;
  const rounded = decimalPart.length > 4
    ? Math.ceil(cents - 1e-9)
    : Math.round(cents);

  return rounded / 100;
}

function getQuantity(item) {
  return Math.max(0, Number(item.qty ?? item.quantity) || 0);
}

function getProductId(item) {
  return String(item.productId ?? item.id ?? "");
}

function calculateSubtotal(items = []) {
  return items.reduce((sum, item) => {
    const lineTotal = getQuantity(item) * money(item.price);
    const itemDiscount = Math.min(lineTotal, money(item.discount));

    return sum + lineTotal - itemDiscount;
  }, 0);
}

function normalizeItem(product, quantity = 1) {
  const productId = String(product.productId ?? product.id ?? "");

  return {
    ...product,
    productId,
    id: productId,
    name: String(product.name || "Unnamed product"),
    barcode: String(product.barcode || ""),
    price: money(product.price),
    qty: quantity,
    quantity,
    // Product catalog metadata must never silently discount a sale line.
    // Invoice discounts are applied explicitly in the POS summary or on the line.
    discount: 0,
    piecesPerCarton: Math.max(
      1,
      Number(product.piecesPerCarton) || 1
    ),
    cartonPrice: money(product.cartonPrice),
  };
}

function mergeItems(currentItems, product, quantity = 1) {
  const normalized = normalizeItem(product, quantity);
  const productId = normalized.productId;

  // Carton lines represent a distinct pack sale and must never absorb
  // subsequent single-unit scans/additions.
  const index = currentItems.findIndex(
    (item) => getProductId(item) === productId && !item.isCartonLine && Boolean(item.weighedSale) === Boolean(normalized.weighedSale)
  );

  if (index === -1) {
    return [...currentItems, normalized];
  }

  return currentItems.map((item, itemIndex) => {
    if (itemIndex !== index) return item;

    const nextQuantity = getQuantity(item) + quantity;

    return {
      ...item,
      qty: nextQuantity,
      quantity: nextQuantity,
    };
  });
}

function getErrorMessage(result) {
  switch (result?.error) {
    case "EMPTY_INVOICE":
      return "This invoice has no products.";

    case "PRODUCT_NOT_FOUND":
      return "A product in this invoice no longer exists in inventory.";

    case "INSUFFICIENT_STOCK":
      return `${result.productName || "Product"}: requested ${result.requested}, available ${result.available}.`;

    case "ALREADY_COMPLETED":
      return "This invoice has already been completed.";

    case "STORAGE_ERROR":
      return "Could not save the pending invoice. Check browser storage.";

    case "STOCK_SAVE_FAILED":
      return "Could not update inventory. The sale was not completed.";

    case "PENDING_SAVE_FAILED":
      return "Could not update pending invoices. Please retry.";

    case "SALE_SAVE_FAILED":
      return "Could not record the sale. Please check inventory before retrying.";

    default:
      return "The operation could not be completed.";
  }
}

export default function POS({ currentUserName = "", currentUserId = "", organizationId = "", locale = "en" } = {}) {
  const posPageRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [serverConnected, setServerConnected] = useState(navigator.onLine);

  useEffect(() => {
    setSoundUser(currentUserId || "device");
    const unlock = () => unlockSoundAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [currentUserId]);

  const previousServerConnectedRef = useRef(null);
  useEffect(() => {
    if (previousServerConnectedRef.current === null) {
      previousServerConnectedRef.current = serverConnected;
      return;
    }
    if (previousServerConnectedRef.current !== serverConnected) {
      playSound("alerts");
      previousServerConnectedRef.current = serverConnected;
    }
  }, [serverConnected]);
  useEffect(() => {
    let active = true;
    const checkServer = async () => {
      if (!navigator.onLine) {
        if (active) setServerConnected(false);
        return;
      }
      try {
        const { error } = await supabase.auth.getUser();
        if (active) setServerConnected(!error);
      } catch {
        if (active) setServerConnected(false);
      }
    };
    const onOnline = () => { void checkServer(); };
    const onOffline = () => setServerConnected(false);
    void checkServer();
    const timer = window.setInterval(checkServer, 30000);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  const [invoice, setInvoice] = useState(() => getAutoSavedDraft() || createInvoice());
  const [draftIdentity, setDraftIdentity] = useState(() => currentUserId && organizationId ? { userId: currentUserId, organizationId } : null);
  const [draftCloudReady, setDraftCloudReady] = useState(false);

  const [pendingInvoices, setPendingInvoices] = useState(
    () => getPendingInvoices()
  );

  const [showProducts, setShowProducts] = useState(false);
  const [favoriteProductIds, setFavoriteProductIds] = useState(() => {
    try { const stored = JSON.parse(localStorage.getItem("veltro_pos_favorite_products") || "[]"); return Array.isArray(stored) ? stored.map(String) : []; }
    catch { return []; }
  });
  const [quickSaleDialog, setQuickSaleDialog] = useState(null);
  const [weighedProductIds, setWeighedProductIds] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_weighed_products") || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } });
  const [weighedCategories, setWeighedCategories] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_weighed_categories") || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } });
  const [weighedProductLayout, setWeighedProductLayout] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_weighed_layout") || "[]"); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } });
  const [weighedProductSlots, setWeighedProductSlots] = useState(() => { try { const saved = JSON.parse(localStorage.getItem("veltro_pos_weighed_slots") || "null"); if (Array.isArray(saved)) return Array.from({ length: 9 }, (_, i) => String(saved[i] || "")); const legacy = JSON.parse(localStorage.getItem("veltro_pos_weighed_layout") || "[]"); return Array.from({ length: 9 }, (_, i) => String(legacy[i] || "")); } catch { return Array(9).fill(""); } });
  const [weighedCategoryList, setWeighedCategoryList] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_weighed_category_list") || "[]"); const defaults = new Set(["Nuts", "Grains", "Spices", "Other", "General"]); return Array.isArray(v) ? v.filter(item => !defaults.has(String(item).trim())) : []; } catch { return []; } });
  const [visibleWeighedCategories, setVisibleWeighedCategories] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_visible_weighed_categories") || "[]"); const defaults = new Set(["Nuts", "Grains", "Spices", "Other"]); return Array.isArray(v) ? v.filter(item => !defaults.has(String(item).trim())) : []; } catch { return []; } });
  const [weighedShortcutCategories, setWeighedShortcutCategories] = useState(() => { try { const v = JSON.parse(localStorage.getItem("veltro_pos_shortcut_categories") || "null"); return Array.isArray(v) ? Array.from({ length: 12 }, (_, i) => String(v[i] || "")) : []; } catch { return []; } });
  const [poundGrams, setPoundGrams] = useState(() => { try { return Math.max(1, Number(localStorage.getItem("veltro_pos_pound_grams")) || 500); } catch { return 500; } });

  useEffect(() => {
    const refreshWeighedSettings = () => {
      try {
        const categoryList = JSON.parse(localStorage.getItem("veltro_pos_weighed_category_list") || "null");
        if (Array.isArray(categoryList)) setWeighedCategoryList(categoryList);
        const visibleList = JSON.parse(localStorage.getItem("veltro_pos_visible_weighed_categories") || "null");
        if (Array.isArray(visibleList)) setVisibleWeighedCategories(visibleList);
        const ids = JSON.parse(localStorage.getItem("veltro_pos_weighed_products") || "[]");
        if (Array.isArray(ids)) setWeighedProductIds(ids.map(String));
        const categoryMap = JSON.parse(localStorage.getItem("veltro_pos_weighed_categories") || "{}");
        if (categoryMap && typeof categoryMap === "object") setWeighedCategories(categoryMap);
      } catch (error) { console.warn("Could not refresh weighed-sale settings", error); }
    };
    window.addEventListener("veltro:weighed-settings-updated", refreshWeighedSettings);
    window.addEventListener("storage", refreshWeighedSettings);
    return () => {
      window.removeEventListener("veltro:weighed-settings-updated", refreshWeighedSettings);
      window.removeEventListener("storage", refreshWeighedSettings);
    };
  }, []);
  const [showPending, setShowPending] = useState(false);
  const [closedInvoiceMode, setClosedInvoiceMode] = useState(null);
  const [closedInvoiceIndex, setClosedInvoiceIndex] = useState(-1);
  const invoiceBeforeClosedBrowseRef = useRef(null);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [busy, setBusy] = useState(false);
  const [removedItem, setRemovedItem] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRecords, setCustomerRecords] = useState([]);
  const [showSaleReview, setShowSaleReview] = useState(false);
  const [showSaleConfirm, setShowSaleConfirm] = useState(false);
  const [showEditInvoiceConfirm, setShowEditInvoiceConfirm] = useState(false);
  const [showBelowCostWarning, setShowBelowCostWarning] = useState(false);
  const [belowCostItems, setBelowCostItems] = useState([]);
  const [paidDraft, setPaidDraft] = useState("0");
  const [keyboardDialog, setKeyboardDialog] = useState(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [selectedCartIndex, setSelectedCartIndex] = useState(0);
  const [productPickerSearch, setProductPickerSearch] = useState("");
  const [productPickerPage, setProductPickerPage] = useState(1);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [quantityDraft, setQuantityDraft] = useState("1");
  const [priceDraft, setPriceDraft] = useState("0.00");
  const [warningPayload, setWarningPayload] = useState(null);

  // In fullscreen, restore the hardware-scanner cursor after POS dialogs close.
  // The carton stock-warning confirmation closes asynchronously relative to the
  // click handler, so focusing only on the next animation frame is too early.
  useEffect(() => {
    if (!isFullscreen || keyboardDialog || warningPayload) return undefined;

    const timer = window.setTimeout(() => {
      const input = document.getElementById("product-barcode");
      if (!input || input.disabled) return;
      input.focus({ preventScroll: true });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isFullscreen, keyboardDialog, warningPayload]);
  const [selectedPendingIndex, setSelectedPendingIndex] = useState(0);

  const dialogText = (locale === "ar" ? {
    belowCostTitle:"تنبيه: البيع بأقل من سعر الشراء", belowCostDescription:"بعض المنتجات مسعرة بأقل من تكلفة شرائها المسجلة، وقد ينتج عن البيع خسارة.", belowCostQuestion:"هل تريد متابعة البيع رغم ذلك؟", cancelSale:"إلغاء البيع", continueAnyway:"متابعة على أي حال", qty:"الكمية", lossPerUnit:"الخسارة لكل وحدة", cost:"التكلفة",
    reviewTitle:"مراجعة حساب الزبون", reviewDescription:"راجع الرصيد ومبالغ الفاتورة قبل المتابعة.", confirmTitle:"تأكيد إتمام البيع", confirmDescription:"أكد رغبتك في إتمام عملية البيع.", selectedCustomer:"الزبون المحدد", previousDebt:"الدين السابق", invoiceTotal:"إجمالي الفاتورة", amountPaid:"المبلغ المدفوع", unpaid:"المبلغ المتبقي", totalDebt:"إجمالي الدين بعد البيع", nextStep:"الخطوة التالية هي تأكيد إتمام هذه الفاتورة.", backInvoice:"العودة إلى الفاتورة", continue:"متابعة", completeInvoice:"إتمام الفاتورة", anonymousSale:"سيُسجّل هذا البيع باسم Anonyme دون إضافة ديون سابقة للزبون.", customerSale:"سيُسجّل هذا البيع لحساب الزبون المحدد. يرجى التحقق من المبالغ قبل الإتمام.", cancel:"إلغاء", completing:"جارٍ الإتمام...", confirmSale:"تأكيد البيع"
  } : locale === "fr" ? {
    belowCostTitle:"Alerte : vente sous le coût d'achat", belowCostDescription:"Certains produits sont vendus sous leur coût d'achat enregistré. Cette vente peut entraîner une perte.", belowCostQuestion:"Voulez-vous continuer malgré tout ?", cancelSale:"Annuler la vente", continueAnyway:"Continuer quand même", qty:"Qté", lossPerUnit:"Perte par unité", cost:"Coût",
    reviewTitle:"Vérifier le compte client", reviewDescription:"Vérifiez le solde et les montants avant de continuer.", confirmTitle:"Confirmer la vente", confirmDescription:"Confirmez que vous souhaitez finaliser cette vente.", selectedCustomer:"Client sélectionné", previousDebt:"Dette précédente", invoiceTotal:"Total de la facture", amountPaid:"Montant payé", unpaid:"Montant impayé", totalDebt:"Dette totale après la vente", nextStep:"L'étape suivante permet de confirmer cette facture.", backInvoice:"Retour à la facture", continue:"Continuer", completeInvoice:"Finaliser la facture", anonymousSale:"Cette vente sera enregistrée sous Anonyme, sans dette client antérieure.", customerSale:"Cette vente sera enregistrée pour le client sélectionné. Vérifiez les montants avant de finaliser.", cancel:"Annuler", completing:"Finalisation...", confirmSale:"Confirmer la vente"
  } : {
    belowCostTitle:"Warning: selling below purchase cost", belowCostDescription:"Some products are priced below their recorded purchase cost. This sale may cause a loss.", belowCostQuestion:"Do you want to continue with this sale anyway?", cancelSale:"Cancel sale", continueAnyway:"Continue anyway", qty:"Qty", lossPerUnit:"Loss per unit", cost:"Cost",
    reviewTitle:"Review customer account", reviewDescription:"Review the balance and invoice amounts before proceeding.", confirmTitle:"Confirm sale completion", confirmDescription:"Please confirm that you want to finalize this sale.", selectedCustomer:"Selected customer", previousDebt:"Previous debt", invoiceTotal:"Invoice total", amountPaid:"Amount paid", unpaid:"Current unpaid amount", totalDebt:"Total debt after this sale", nextStep:"The next step will ask you to confirm completion of this invoice.", backInvoice:"Back to invoice", continue:"Continue", completeInvoice:"Complete invoice", anonymousSale:"This sale will be recorded under Anonyme. No previous customer debt will be applied.", customerSale:"This sale will be recorded for the selected customer. Please verify the amounts before finalizing.", cancel:"Cancel", completing:"Completing...", confirmSale:"Confirm sale"
  });


  // App-level fullscreen keeps Escape available for closing POS dialogs.
  // Native browser fullscreen reserves Escape to exit fullscreen itself.
  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    let active = true;
    let local = [];
    try {
      const value = JSON.parse(localStorage.getItem("veltro_customers") || "[]");
      local = Array.isArray(value) ? value : [];
    } catch {}
    loadCustomersFromCloud(local).then(records => {
      if (active && Array.isArray(records)) localStorage.setItem("veltro_customers", JSON.stringify(records));
    }).catch(error => console.warn("Customer cloud sync unavailable:", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("veltro_pos_favorite_products", JSON.stringify(favoriteProductIds)); }
    catch (error) { console.warn("Could not save POS favorite products:", error); }
  }, [favoriteProductIds]);

  const toggleFavoriteProduct = (product) => {
    const id = String(product?.id ?? product?.productId ?? "");
    if (!id) return;
    setFavoriteProductIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const items = invoice.items || [];
  const closedInvoices = useMemo(() => [...getCompletedSales()].sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0)), [closedInvoiceMode, closedInvoiceIndex, invoice.id]);
  const selectedClosedInvoice = closedInvoiceIndex >= 0 ? closedInvoices[closedInvoiceIndex] : null;
  const isReviewingClosedInvoice = closedInvoiceMode === "review";
  const isEditingClosedInvoice = closedInvoiceMode === "editing";
  useEffect(() => {
    if (items.length === 0) setSelectedCartIndex(0);
    else if (selectedCartIndex >= items.length) setSelectedCartIndex(items.length - 1);
  }, [items.length, selectedCartIndex]);


  const customer = invoice.customerName || "Anonyme";
  const isAnonymousCustomer = !invoice.customerId || String(invoice.customerId).trim().toLowerCase() === "anonyme";
  const paid = money(invoice.paid);

  useEffect(() => {
    setPaidDraft(String(invoice.paid ?? 0));
  }, [invoice.id, invoice.paid]);

  const discount = money(invoice.discount);

  // The store calculates debt from this customer's completed sales.
  const previousDebt = isAnonymousCustomer
    ? 0
    : getCustomerDebt(invoice.customerId);

  const subtotal = useMemo(
    () => calculateSubtotal(items),
    [items]
  );

  const total = Math.max(0, subtotal - discount);
  const remaining = Math.max(0, total - paid);

  useEffect(() => {
    let active = true;

    if (currentUserId && organizationId) {
      setDraftIdentity({ userId: currentUserId, organizationId });
      return () => { active = false; };
    }

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      const userId = data?.session?.user?.id;
      if (!userId) {
        if (active) setDraftCloudReady(true);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", userId)
        .single();
      if (profileError) throw profileError;
      if (active && profile?.organization_id) {
        setDraftIdentity({ userId, organizationId: profile.organization_id });
      } else if (active) {
        setDraftCloudReady(true);
      }
    }).catch((error) => {
      console.warn("VELTRO-PRO could not resolve the cloud draft account:", error);
      if (active) setDraftCloudReady(true);
    });

    return () => { active = false; };
  }, [currentUserId, organizationId]);

  // Load cloud state first so a stale local copy cannot overwrite a newer draft.
  useEffect(() => {
    let active = true;
    if (!draftIdentity?.userId || !draftIdentity?.organizationId) return () => { active = false; };

    setDraftCloudReady(false);
    loadCloudInvoiceDraft(draftIdentity.organizationId, draftIdentity.userId)
      .then((cloudDraft) => {
        if (!active) return;
        const localDraft = getAutoSavedDraft();
        const localTime = new Date(localDraft?.updatedAt || localDraft?.createdAt || 0).getTime();
        const cloudTime = new Date(cloudDraft?.updatedAt || cloudDraft?.createdAt || 0).getTime();
        if (cloudDraft && (!localDraft || cloudTime > localTime)) {
          setInvoice(cloudDraft);
          setRemovedItem(null);
        }
      })
      .catch((error) => console.warn("VELTRO-PRO cloud draft recovery unavailable; keeping the local draft:", error))
      .finally(() => { if (active) setDraftCloudReady(true); });

    return () => { active = false; };
  }, [draftIdentity?.userId, draftIdentity?.organizationId]);

  useEffect(() => {
    if (closedInvoiceMode || !draftCloudReady || !draftIdentity?.userId || !draftIdentity?.organizationId) return undefined;
    const timeoutId = window.setTimeout(() => {
      saveCloudInvoiceDraft(draftIdentity.organizationId, draftIdentity.userId, {
        ...invoice, subtotal, total, paid, remaining, status: "Draft",
      }).catch((error) => console.warn("VELTRO-PRO could not sync the invoice draft to Supabase:", error));
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [closedInvoiceMode, draftCloudReady, draftIdentity?.userId, draftIdentity?.organizationId, invoice, subtotal, total, paid, remaining]);

  // Persist every unconfirmed invoice change immediately. The draft lives
  // separately from the pending-invoice list and is restored on next launch.
  useEffect(() => {
    if (closedInvoiceMode) return;
    saveAutoSavedDraft({
      ...invoice,
      subtotal,
      total,
      paid,
      remaining,
      status: "Draft",
    });
  }, [closedInvoiceMode, invoice, subtotal, total, paid, remaining]);

  const refreshPending = useCallback(() => {
    setPendingInvoices(getPendingInvoices());
  }, []);

  useEffect(() => {
    refreshPending();

    const refresh = () => refreshPending();

    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refreshPending]);

  const notify = (text, type = "info") => {
    if (type === "error") playSound("errors");
    setMessage(text);
    setMessageType(type);
  };

  const updateInvoice = (changes) => {
    setInvoice((current) => ({
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    }));
  };

  const getAvailableForProduct = useCallback(
    (
      productId,
      excludedItemId = null,
      excludedInvoiceId = invoice.id
    ) => {
      const inventoryProduct = getProducts().find(
        (product) => String(product.id) === String(productId)
      );

      if (!inventoryProduct) return 0;

      const stock = money(inventoryProduct.stock);

      const reservedByOtherInvoices = getPendingInvoices()
        .filter((pending) => pending.id !== excludedInvoiceId)
        .reduce((sum, pending) => {
          return sum + (pending.items || []).reduce(
            (itemSum, item) => {
              return getProductId(item) === String(productId)
                ? itemSum + getQuantity(item)
                : itemSum;
            },
            0
          );
        }, 0);

      const otherCurrentInvoiceItems = (
        invoice.items || []
      ).reduce((sum, item) => {
        if (String(item.id) === String(excludedItemId)) {
          return sum;
        }

        return getProductId(item) === String(productId)
          ? sum + getQuantity(item)
          : sum;
      }, 0);

      return Math.max(
        0,
        stock -
          reservedByOtherInvoices -
          otherCurrentInvoiceItems
      );
    },
    [invoice.id, invoice.items]
  );

  const saveCurrentAsPending = useCallback(
    (silent = false) => {
      if (closedInvoiceMode) {
        notify(locale === "ar" ? "أعد البون إلى وضع التعديل أو ارجع إلى البون الحالي أولًا." : locale === "fr" ? "Rouvrez la facture ou revenez à la facture actuelle d’abord." : "Reopen this invoice or return to the current invoice first.", "info");
        return false;
      }
      if (items.length === 0) {
        if (!silent) {
          notify(
            "An empty invoice cannot be saved as pending.",
            "error"
          );
        }

        return false;
      }

      const result = savePendingInvoice({
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        status: "Pending",
      });

      if (!result?.ok) {
        notify(getErrorMessage(result), "error");
        return false;
      }

      setInvoice(result.invoice);
      refreshPending();
      void saveSaleToCloud(result.invoice, { status: "pending" }).catch((cloudError) => {
        console.error("VELTRO-PRO could not sync the pending invoice:", cloudError);
        notify("Pending invoice saved on this device, but cloud synchronization failed.", "error");
      });

      if (!silent) {
        notify("Invoice saved to Pending Invoices.", "success");
      }

      return true;
    },
    [
      invoice,
      items.length,
      subtotal,
      total,
      paid,
      remaining,
      refreshPending,
      closedInvoiceMode,
      locale,
    ]
  );

  // F1 reuses the newest empty draft, but creates a new invoice if this empty
  // draft sits before a newer pending/completed invoice in the invoice timeline.
  const createNewInvoice = () => {
    if (busy) return;

    // Leave read-only closed-invoice browsing without treating the closed sale
    // as the active draft. The original draft is retained in the navigation ref.
    const activeDraft = closedInvoiceMode === "review" && invoiceBeforeClosedBrowseRef.current
      ? invoiceBeforeClosedBrowseRef.current
      : invoice;
    const activeItems = Array.isArray(activeDraft.items) ? activeDraft.items : [];

    if (closedInvoiceMode === "editing") {
      // Do not discard an in-progress edit of a completed sale.
      return;
    }

    if (activeItems.length === 0) {
      const knownInvoices = [...getPendingInvoices(), ...getCompletedSales()];
      const newestKnownTime = knownInvoices.reduce((latest, row) => {
        const time = new Date(row.createdAt || row.updatedAt || row.completedAt || 0).getTime();
        return Number.isFinite(time) ? Math.max(latest, time) : latest;
      }, 0);
      const draftTime = new Date(activeDraft.createdAt || activeDraft.updatedAt || 0).getTime();
      const draftIsNewest = !knownInvoices.some((row) =>
        String(row.id) !== String(activeDraft.id) &&
        new Date(row.createdAt || row.updatedAt || row.completedAt || 0).getTime() > draftTime
      );

      setClosedInvoiceMode(null);
      setClosedInvoiceIndex(-1);
      invoiceBeforeClosedBrowseRef.current = null;
      setInvoice(draftIsNewest || draftTime >= newestKnownTime ? activeDraft : createInvoice());
      setShowPending(false);
      setShowEmptyWarning(false);
      setRemovedItem(null);
      setMessage("");
      return;
    }

    // If F1 is pressed while reviewing a completed invoice, restore the saved
    // draft first; otherwise save the active sale as pending before starting fresh.
    if (closedInvoiceMode === "review") {
      setClosedInvoiceMode(null);
      setClosedInvoiceIndex(-1);
      invoiceBeforeClosedBrowseRef.current = null;
      setInvoice(createInvoice());
      setShowPending(false);
      setShowEmptyWarning(false);
      setRemovedItem(null);
      setMessage("");
      return;
    }

    setShowPending(false);
    setShowEmptyWarning(false);

    if (!saveCurrentAsPending(true)) return;

    setInvoice(createInvoice());
    setRemovedItem(null);
    setMessage("");
    notify("A new invoice is ready.", "success");
  };

  const closeEmptyAndCreate = () => {
    if (items.length > 0) return;

    setInvoice(createInvoice());
    setRemovedItem(null);
    setShowEmptyWarning(false);

    notify("Empty invoice closed. New invoice created.", "success");
  };

  const addProduct = (product) => {
    if (isReviewingClosedInvoice) {
      notify(
        locale === "ar"
          ? "لا يمكن إضافة منتج إلى بون مغلق قبل الضغط على «تعديل البون» وتأكيد التعديل."
          : locale === "fr"
            ? "Impossible d’ajouter un produit à une facture clôturée avant de cliquer sur « Modifier la facture » et de confirmer."
            : "You cannot add a product to a closed invoice. Click Edit Invoice and confirm first.",
        "error"
      );
      return false;
    }
    const productId = getProductId(product);

    const inventoryProduct = getProducts().find(
      (item) => String(item.id) === productId
    );

    if (!inventoryProduct) {
      notify("Product not found in the current inventory.", "error");
      return false;
    }

    const quantityToAdd = product.weighedSale
      ? Math.max(0, Number(Number(String(product.quantity ?? "").replace(",", ".")).toFixed(3)) || 0)
      : Math.max(1, Math.floor(Number(product.quantity) || 1));
    if (quantityToAdd <= 0) return false;
    const productForInvoice = product.weighedSale
      ? { ...inventoryProduct, price: money(product.price ?? inventoryProduct.price), weighedSale: true, weighedCategory: product.weighedCategory || "", unitLabel: product.unitLabel || ({ kg: "kg", g: "g", liter: "L", ml: "ml", meter: "m", cm: "cm" })[inventoryProduct.unit] || inventoryProduct.unit || "kg" }
      : inventoryProduct;

    const currentQuantity = items.reduce((sum, item) => {
      return getProductId(item) === productId
        ? sum + getQuantity(item)
        : sum;
    }, 0);

    const stock = money(inventoryProduct.stock);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce(
          (itemSum, item) => {
            return getProductId(item) === productId
              ? itemSum + getQuantity(item)
              : itemSum;
          },
          0
        );
      }, 0);

    const available = Math.max(0, stock - othersReserved);

    if (currentQuantity + quantityToAdd > available) {
      setWarningPayload({ type: "addProduct", product: productForInvoice, quantity: quantityToAdd, requested: currentQuantity + quantityToAdd, available: Math.max(0, available - currentQuantity) });
      playSound("alerts");
      setKeyboardDialog("stockWarning");
      return false;
    }

    const existingUnitLineIndex = items.findIndex(
      (item) => getProductId(item) === productId && !item.isCartonLine
    );
    setSelectedCartIndex(existingUnitLineIndex >= 0 ? existingUnitLineIndex : items.length);
    setInvoice((current) => ({
      ...current,
      items: mergeItems(
        current.items || [],
        productForInvoice,
        quantityToAdd
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));
    setShowEmptyWarning(false);
    setRemovedItem(null);
    notify(currentQuantity > 0 ? "Quantity updated for " + inventoryProduct.name + ": " + currentQuantity + " → " + (currentQuantity + quantityToAdd) + "." : "Added " + inventoryProduct.name + " to invoice.", "success");
    return true;
  };

  const updateItem = (id, field, value, options = {}) => {
    if (isReviewingClosedInvoice) return;
    const currentItem = items.find(
      (item) => String(item.id) === String(id)
    );

    if (!currentItem) return;

    if (field === "quantity") {
      const rawQuantity = Number(String(value).replace(",", "."));
      const weighed = Boolean(currentItem.weighedSale || currentItem.unitLabel);
      if (!Number.isFinite(rawQuantity) || (weighed ? rawQuantity <= 0 : rawQuantity < 1)) {
        notify(weighed ? "Measured quantity must be greater than zero." : "Quantity must be at least one unit.", "error");
        return;
      }

      const quantity = weighed ? Number(rawQuantity.toFixed(3)) : Math.floor(rawQuantity);
      if (quantity === getQuantity(currentItem)) return;

      const available = getAvailableForProduct(
        getProductId(currentItem),
        currentItem.id
      );

      if (quantity > available && !options.allowOversell) {
        setWarningPayload({ type: "quantity", itemId: id, value: quantity, requested: quantity, available });
        playSound("alerts");
        setKeyboardDialog("stockWarning");
        return;
      }

      setInvoice((current) => ({
        ...current,
        items: (current.items || []).map((item) => {
          if (String(item.id) !== String(id)) return item;

          return {
            ...item,
            qty: quantity,
            quantity,
          };
        }),
        status: "Draft",
        updatedAt: new Date().toISOString(),
      }));

      notify("Quantity updated for " + currentItem.name + ": " + getQuantity(currentItem) + " → " + quantity + ".", "success");
      playSound("quantity");
      return;
    }

    if (field === "price" || field === "discount") {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue) || numericValue < 0) {
        notify("Price and discount must be zero or greater.", "error");
        return;
      }

      const nextValue = field === "price" ? roundPriceUp(numericValue) : money(numericValue);
      const previousValue = money(currentItem[field]);
      if (Math.abs(previousValue - nextValue) < 0.000001) return;

      setInvoice((current) => ({
        ...current,
        items: (current.items || []).map((item) => {
          if (String(item.id) !== String(id)) return item;

          return {
            ...item,
            [field]: nextValue,
          };
        }),
        status: "Draft",
        updatedAt: new Date().toISOString(),
      }));

      if (field === "price") {
        notify("Price updated for " + currentItem.name + ": " + previousValue.toFixed(2) + " → " + nextValue.toFixed(2) + " DA.", "success");
        playSound("price");
      }
    }
  };

  const addUnit = (item) => {
    if (isReviewingClosedInvoice) {
      notify(
        locale === "ar"
          ? "لا يمكن إضافة وحدة إلى بون مغلق قبل الضغط على «تعديل البون» وتأكيد التعديل."
          : locale === "fr"
            ? "Impossible d’ajouter une unité à une facture clôturée avant de cliquer sur « Modifier la facture » et de confirmer."
            : "You cannot add a unit to a closed invoice. Click Edit Invoice and confirm first.",
        "error"
      );
      return;
    }
    // Adding a loose unit beside a carton must create/use a separate unit line.
    if (item?.isCartonLine) {
      addProduct(item);
      return;
    }
    updateItem(item.id, "quantity", getQuantity(item) + 1);
  };

  const addCarton = (item, allowOversell = false) => {
    if (isReviewingClosedInvoice) {
      notify(
        locale === "ar"
          ? "لا يمكن إضافة كرتون إلى بون مغلق قبل الضغط على «تعديل البون» وتأكيد التعديل."
          : locale === "fr"
            ? "Impossible d’ajouter un carton à une facture clôturée avant de cliquer sur « Modifier la facture » et de confirmer."
            : "You cannot add a carton to a closed invoice. Click Edit Invoice and confirm first.",
        "error"
      );
      return;
    }
    // Accept both product cards and invoice rows (whose display id may differ
    // from the real inventory id), then always use the saved inventory record.
    const productId = String(item?.productId ?? item?.id ?? "").trim();
    const inventory = getProducts();
    const inventoryProduct = inventory.find((product) => {
      const identifiers = [
        product?.id,
        product?.productId,
        product?.sku,
      ].map((value) => String(value ?? "").trim()).filter(Boolean);
      return identifiers.includes(productId) ||
        (item?.sku && String(product.sku ?? "").trim() === String(item.sku).trim()) ||
        (item?.barcode && String(product.barcode ?? "").trim() === String(item.barcode).trim());
    });

    if (!inventoryProduct) {
      notify("Product not found in the current inventory. Refresh the product list and try again.", "error");
      return;
    }

    const cartonSize = Math.floor(Number(
      inventoryProduct.piecesPerCarton ??
      inventoryProduct.unitsPerCarton ??
      inventoryProduct.cartonQuantity
    ) || 0);

    if (cartonSize < 2) {
      notify("Carton sale is not configured for this product. Set Units per Carton to at least 2 in Products, then save.", "error");
      return;
    }

    const resolvedProductId = String(inventoryProduct.id ?? inventoryProduct.productId ?? productId);
    const currentQuantity = (invoice.items || []).reduce((sum, currentItem) => {
      return getProductId(currentItem) === resolvedProductId
        ? sum + getQuantity(currentItem)
        : sum;
    }, 0);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce((itemSum, pendingItem) => {
          return getProductId(pendingItem) === resolvedProductId
            ? itemSum + getQuantity(pendingItem)
            : itemSum;
        }, 0);
      }, 0);

    const available = Math.max(0, money(inventoryProduct.stock) - othersReserved);
    const remainingStock = Math.max(0, available - currentQuantity);

    if (cartonSize > remainingStock && !allowOversell) {
      setWarningPayload({ type: "addCarton", item, requested: cartonSize, available: remainingStock });
      playSound("alerts");
      setKeyboardDialog("stockWarning");
      return;
    }

    const cartonPrice = money(inventoryProduct.cartonPrice);
    const regularPrice = money(inventoryProduct.price);
    const cartonUnitPrice = roundPriceUp(
      cartonPrice > 0 ? cartonPrice / cartonSize : regularPrice
    );

    const cartonLine = {
      ...normalizeItem(inventoryProduct, cartonSize),
      id: `${resolvedProductId}-carton-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: resolvedProductId,
      qty: cartonSize,
      quantity: cartonSize,
      price: cartonUnitPrice,
      cartonPrice,
      piecesPerCarton: cartonSize,
      isCartonLine: true,
      discount: 0,
    };

    setSelectedCartIndex(items.length);
    setInvoice((current) => ({
      ...current,
      items: [...(current.items || []), cartonLine],
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    setMessage("");
    setRemovedItem(null);
    notify(
      cartonPrice > 0
        ? `Added one carton of ${inventoryProduct.name} (${cartonSize} units).`
        : `Added one carton of ${inventoryProduct.name} as ${cartonSize} units at the unit price.`,
      "success"
    );

    // Keep the scanner ready after adding a carton from either the product
    // list or the invoice table, without stealing focus from warning dialogs.
    requestAnimationFrame(() => {
      document.getElementById("product-barcode")?.focus({ preventScroll: true });
    });
  };

  const removeItem = (itemOrId) => {
    if (isReviewingClosedInvoice) {
      notify(
        locale === "ar"
          ? "لا يمكن حذف منتج من بون مغلق قبل الضغط على «تعديل البون» وتأكيد التعديل."
          : locale === "fr"
            ? "Impossible de supprimer un produit d’une facture clôturée avant de cliquer sur « Modifier la facture » et de confirmer."
            : "You cannot delete a product from a closed invoice. Click Edit Invoice and confirm first.",
        "error"
      );
      return;
    }
    // InvoiceTable passes the full item from its confirmation dialog; also
    // support callers that pass only the item id.
    const itemId = itemOrId && typeof itemOrId === "object"
      ? itemOrId.id
      : itemOrId;
    const removed = items.find(
      (item) => String(item.id) === String(itemId)
    );

    if (!removed) return;

    const nextItems = items.filter(
      (item) => String(item.id) !== String(itemId)
    );

    setRemovedItem({
      item: { ...removed },
      invoiceId: invoice.id,
    });

    const updatedAt = new Date().toISOString();
    const nextSubtotal = calculateSubtotal(nextItems);
    const nextTotal = Math.max(0, nextSubtotal - money(invoice.discount));
    const nextPaid = money(invoice.paid);
    const nextRemaining = Math.max(0, nextTotal - nextPaid);

    setInvoice((current) => ({
      ...current,
      items: (current.items || []).filter(
        (item) => String(item.id) !== String(itemId)
      ),
      subtotal: nextSubtotal,
      total: nextTotal,
      paid: nextPaid,
      remaining: nextRemaining,
      status: "Draft",
      updatedAt,
    }));

    // Persist the exact new contents immediately. This prevents the autosaved
    // draft from retaining the previous items if the user switches invoices,
    // reloads, or opens the pending list before the next React effect runs.
    saveAutoSavedDraft({
      ...invoice,
      items: nextItems.map((item) => ({ ...item })),
      subtotal: nextSubtotal,
      total: nextTotal,
      paid: nextPaid,
      remaining: nextRemaining,
      status: "Draft",
      updatedAt,
    });

    // Keep a pending invoice synchronized with the cart. If its final item is
    // removed, remove the pending record and refresh the list immediately.
    const savedPending = getPendingInvoice(invoice.id);
    if (savedPending) {
      if (nextItems.length === 0) {
        const cancelResult = cancelPendingInvoice(invoice.id);
        if (!cancelResult?.ok) {
          notify(
            locale === "ar"
              ? "تعذر حذف البون الفارغ من قائمة البونات المعلقة."
              : locale === "fr"
                ? "Impossible de retirer la facture vide des factures en attente."
                : "Could not remove the empty invoice from Pending Invoices.",
            "error"
          );
        } else {
          // Mark the cloud invoice as void rather than physically deleting it.
          // Other connected devices can then distinguish a removed pending
          // invoice from an offline-only invoice and won't resurrect it.
          voidPendingSaleFromCloud(invoice.id).catch((cloudError) => {
            console.error("VELTRO-PRO could not clear the empty pending invoice from cloud:", cloudError);
            notify(
              locale === "ar"
                ? "حُذف البون محليًا لكن تعذرت مزامنته مع السحابة. تحقق من الاتصال."
                : locale === "fr"
                  ? "Facture retirée localement, mais la synchronisation cloud a échoué."
                  : "Invoice removed locally, but cloud synchronization failed. Check the connection.",
              "error"
            );
          });
        }
      } else {
        savePendingInvoice({
          ...invoice,
          items: nextItems.map((item) => ({ ...item })),
          subtotal: nextSubtotal,
          total: nextTotal,
          paid: nextPaid,
          remaining: nextRemaining,
          status: "Pending",
          updatedAt,
        });
      }
      refreshPending();
    }

    notify(`${removed.name} removed. You can undo this action.`, "info");
    playSound("delete");
  };

  const undoRemove = (itemToRestore) => {
    const target = itemToRestore || removedItem?.item;

    if (!target) return;

    if (removedItem && removedItem.invoiceId !== invoice.id) {
      setRemovedItem(null);
      notify("Undo is unavailable because you changed invoices.", "error");
      return;
    }

    const productId = getProductId(target);

    const inventoryProduct = getProducts().find(
      (product) => String(product.id) === productId
    );

    if (!inventoryProduct) {
      notify("Cannot restore this item: it is no longer in inventory.", "error");
      return;
    }

    const alreadyInInvoice = items.reduce((sum, item) => {
      return getProductId(item) === productId
        ? sum + getQuantity(item)
        : sum;
    }, 0);

    const othersReserved = getPendingInvoices()
      .filter((pending) => pending.id !== invoice.id)
      .reduce((sum, pending) => {
        return sum + (pending.items || []).reduce(
          (itemSum, pendingItem) => {
            return getProductId(pendingItem) === productId
              ? itemSum + getQuantity(pendingItem)
              : itemSum;
          },
          0
        );
      }, 0);

    const available = Math.max(
      0,
      money(inventoryProduct.stock) - othersReserved
    );

    if (alreadyInInvoice + getQuantity(target) > available) {
      notify(
        `Cannot undo: only ${Math.max(
          0,
          available - alreadyInInvoice
        )} units are currently available.`,
        "error"
      );
      return;
    }

    setInvoice((current) => ({
      ...current,
      items: [...(current.items || []), { ...target }],
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    setRemovedItem(null);
    notify(`${target.name} restored to the invoice.`, "success");
  };

  const getCustomerRecords = () => {
    const records = [];
    const seen = new Set();
    const addRecord = (record) => {
      if (!record || typeof record !== "object") return;
      const name = String(record.name ?? record.customerName ?? record.fullName ?? record.clientName ?? "").trim();
      const id = String(record.customerId ?? record.id ?? record.code ?? record.reference ?? record.ref ?? "").trim();
      const phone = String(record.phone ?? record.phoneNumber ?? record.mobile ?? record.telephone ?? "").trim();
      if (!name || name.toLowerCase() === "anonyme") return;
      const key = (id || name).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      records.push({ ...record, name, customerId: id || name, phone, code: String(record.code ?? record.reference ?? record.ref ?? id).trim(), reference: String(record.reference ?? record.code ?? record.ref ?? id).trim() });
    };

    // Load registered customer records when a customer module has stored them.
    const storageKeys = ["veltro_customers", "veltro_clients", "veltro_customer_list", "customers", "clients"];
    storageKeys.forEach((key) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        (Array.isArray(parsed) ? parsed : Array.isArray(parsed?.customers) ? parsed.customers : []).forEach(addRecord);
      } catch { /* Ignore unrelated or malformed storage values. */ }
    });

    // Also make customers from previous invoices available as a fallback directory.
    getCompletedSales().forEach((sale) => {
      if (!sale?.customerName || !sale?.customerId) return;
      addRecord({
        name: sale.customerName,
        customerId: sale.customerId,
        phone: sale.customerPhone ?? sale.phone ?? "",
        code: sale.customerCode ?? sale.customerReference ?? sale.customerRef ?? "",
        reference: sale.customerReference ?? sale.customerRef ?? "",
      });
    });
    return records.sort((a, b) => a.name.localeCompare(b.name));
  };

  const chooseCustomer = () => {
    if (isReviewingClosedInvoice) return;
    setCustomerRecords(getCustomerRecords());
    setCustomerSearch("");
    setShowCustomerPicker(true);
  };

  const selectCustomer = (record) => {
    const selectedName = String(record?.name || record?.customerName || "").trim();
    const anonymous = !selectedName || selectedName.toLowerCase() === "anonyme";
    updateInvoice({
      customerName: anonymous ? "Anonyme" : selectedName,
      customerId: anonymous ? "" : String(record.customerId ?? record.id ?? record.code ?? selectedName),
      customerPhone: anonymous ? "" : String(record.phone ?? record.phoneNumber ?? ""),
      customerCode: anonymous ? "" : String(record.code ?? record.reference ?? record.ref ?? ""),
      status: "Draft",
    });
    setShowCustomerPicker(false);
  };

  const invoiceNavigationList = [...pendingInvoices].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return aTime - bTime;
  });
  const currentNavigationIndex = invoiceNavigationList.findIndex((row) => row.id === invoice.id);
  const currentInvoiceTime = new Date(invoice.createdAt || 0).getTime();
  const previousInvoice = currentNavigationIndex >= 0
    ? invoiceNavigationList[currentNavigationIndex - 1] || null
    : [...invoiceNavigationList].reverse().find((row) => new Date(row.createdAt || row.updatedAt || 0).getTime() < currentInvoiceTime) || null;
  const nextInvoice = currentNavigationIndex >= 0
    ? invoiceNavigationList[currentNavigationIndex + 1] || null
    : invoiceNavigationList.find((row) => new Date(row.createdAt || row.updatedAt || 0).getTime() > currentInvoiceTime) || null;

  const filteredCustomerRecords = customerRecords.filter((record) => {
    const query = customerSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    return [
      record.name, record.customerId, record.id, record.phone, record.phoneNumber,
      record.code, record.reference, record.ref, record.customerCode,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
  });

  const openPendingInvoice = (pendingId) => {
    if (closedInvoiceMode) {
      notify(locale === "ar" ? "ارجع إلى البون الحالي قبل فتح بون معلّق." : locale === "fr" ? "Revenez à la facture actuelle avant d’ouvrir une facture en attente." : "Return to the current invoice before opening a pending invoice.", "info");
      return;
    }
    const pending = getPendingInvoice(pendingId);

    if (!pending) {
      refreshPending();
      notify("This pending invoice could not be found.", "error");
      return;
    }

    // Save the current invoice before switching to another saved invoice.
    if (items.length > 0 && invoice.id !== pending.id) {
      if (!saveCurrentAsPending(true)) {
        return;
      }
    }

    setInvoice({
      ...pending,
      status: "Draft",
      items: (pending.items || []).map((item) => ({ ...item })),
    });

    setRemovedItem(null);
    setShowPending(false);
    setShowEmptyWarning(false);
    setMessage("");

    notify(`Opened ${pending.invoiceNumber}.`, "success");
  };

  const openSaleConfirmation = () => {
    setShowBelowCostWarning(false);
    if (isAnonymousCustomer) {
      setShowSaleReview(false);
      setShowSaleConfirm(true);
    } else {
      setShowSaleConfirm(false);
      setShowSaleReview(true);
    }
  };

  const completeCurrentSale = () => {
    if (busy) return;
    if (isReviewingClosedInvoice) {
      notify(locale === "ar" ? "اضغط «إعادة فتح البون» قبل تعديله أو إتمامه." : locale === "fr" ? "Cliquez sur « Rouvrir la facture » avant de la modifier ou finaliser." : "Click Reopen Invoice before editing or completing this sale.", "info");
      return;
    }
    if (items.length === 0) {
      notify("Add products before completing the sale.", "error");
      return;
    }

    // Compare each selling unit price with the latest purchase cost in inventory.
    const inventoryProducts = getProducts();
    const lossItems = items.flatMap((item) => {
      const productId = getProductId(item);
      const product = inventoryProducts.find(
        (record) => String(record.id) === String(productId)
      );
      const purchaseCost = Number(product?.purchasePrice ?? item.purchasePrice);
      const sellingPrice = Number(item.price);

      if (
        !Number.isFinite(purchaseCost) ||
        purchaseCost <= 0 ||
        !Number.isFinite(sellingPrice) ||
        sellingPrice >= purchaseCost - 0.000001
      ) {
        return [];
      }

      return [{
        id: productId,
        name: item.name || product?.name || "Product",
        quantity: getQuantity(item),
        sellingPrice,
        purchaseCost,
        lossPerUnit: purchaseCost - sellingPrice,
      }];
    });

    if (lossItems.length > 0) {
      setBelowCostItems(lossItems);
      setShowBelowCostWarning(true);
      setShowSaleReview(false);
      setShowSaleConfirm(false);
      return;
    }

    openSaleConfirmation();
  };

  const confirmSaleCompletion = async (printAfter = false) => {
    if (busy) return;
    setShowSaleReview(false);
    setShowSaleConfirm(false);
    setBusy(true);
    try {
      const salePayload = {
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        customerName: customer,
        customerId: isAnonymousCustomer ? "" : invoice.customerId,
        status: "Completed",
      };
      const result = isEditingClosedInvoice
        ? editCompletedSale(selectedClosedInvoice?.id || selectedClosedInvoice?.invoiceId || selectedClosedInvoice?.invoiceNumber, salePayload)
        : completeSale(salePayload);
      if (!result.ok) {
        notify(getErrorMessage(result), "error");
        return;
      }
      // The local sale and stock update succeeded; cloud sync may still fail separately.
      playSound("sale");

      // Persist the completed invoice and its stock changes to the shared workspace.
      try {
        await saveSaleToCloud(result.sale);
        await saveProductsToCloud(getProducts());
      } catch (cloudError) {
        console.error("VELTRO-PRO could not synchronize the completed sale:", cloudError);
        const detail = String(cloudError?.message || cloudError || "Unknown cloud error").slice(0, 240);
        notify(
          `Sale completed on this device, but cloud synchronization failed: ${detail}`,
          "error"
        );
      }

      // Remove the confirmed invoice from cloud drafts before starting a
      // fresh invoice, so a restart cannot resurrect an already completed sale.
      if (!isEditingClosedInvoice && draftIdentity?.userId && draftIdentity?.organizationId) {
        try {
          await deleteCloudInvoiceDraft(draftIdentity.organizationId, draftIdentity.userId);
        } catch (draftError) {
          console.warn("VELTRO-PRO could not clear the completed cloud draft:", draftError);
        }
      }

      // Print the completed invoice before the current draft is cleared.
      if (printAfter) {
        try { window.print(); } catch (printError) { console.warn("Receipt printing was blocked:", printError); }
      }

      // completeSale deducts stock locally. Persist that exact updated stock
      // to Supabase as well, otherwise the Products screen can reload stale
      // cloud quantities and appear to undo the sale.
      setInvoice(createInvoice());
      setRemovedItem(null);
      if (isEditingClosedInvoice) {
        setClosedInvoiceMode(null);
        setClosedInvoiceIndex(-1);
        invoiceBeforeClosedBrowseRef.current = null;
      }
      refreshPending();

      try {
        await saveProductsToCloud(getProducts());
        notify("Sale completed. Stock deducted and synchronized with cloud.", "success");
      } catch (cloudError) {
        console.error("VELTRO sale inventory cloud sync failed:", cloudError);
        const detail = String(cloudError?.message || cloudError || "Unknown cloud error").slice(0, 240);
        notify(
          `Sale completed locally, but cloud inventory sync failed: ${detail}`,
          "error"
        );
      }
    } finally {
      setBusy(false);
    }
  };


  const applyCartonConversion = (item, allowOversell = false) => {
    if (!item) return;
    const product = getProducts().find((p) => String(p.id) === String(getProductId(item)));
    if (!product) return;
    const size = Math.floor(Number(product.piecesPerCarton ?? product.unitsPerCarton ?? product.cartonQuantity) || 0);
    if (size < 2) {
      notify(locale === "ar" ? "لم يتم إعداد عدد القطع في الكرتونة." : locale === "fr" ? "Le format carton n'est pas configuré." : "Carton size is not configured.", "error");
      return;
    }
    const available = getAvailableForProduct(getProductId(item), item.id);
    if (size > available && !allowOversell) {
      setWarningPayload({ type: "convertCarton", item, requested: size, available });
      playSound("alerts");
      setKeyboardDialog("stockWarning");
      return;
    }
    const cartonPrice = money(product.cartonPrice);
    const price = roundPriceUp(cartonPrice > 0 ? cartonPrice / size : money(product.price));
    setInvoice((current) => ({ ...current, items: (current.items || []).map((row) => String(row.id) === String(item.id) ? { ...row, qty: size, quantity: size, price, cartonPrice, piecesPerCarton: size, isCartonLine: true, discount: 0 } : row), status: "Draft", updatedAt: new Date().toISOString() }));
    setKeyboardDialog(null);
    setWarningPayload(null);
  };

  const openQuantityEditor = () => {
    const item = items[selectedCartIndex];
    if (item) {
      setQuantityDraft(String(getQuantity(item)));
      setPriceDraft(String((getQuantity(item) * money(item.price)).toFixed(2)));
      setKeyboardDialog("quantity");
    }
  };
  const openPriceEditor = () => {
    const item = items[selectedCartIndex];
    if (item) { setPriceDraft(money(item.price).toFixed(2)); setKeyboardDialog("price"); }
  };
  const applyQuantityEditor = (raw) => {
    const item = items[selectedCartIndex];
    const value = Number(String(raw).trim().replace(",", "."));
    const weighed = Boolean(item?.weighedSale || item?.unitLabel);
    if (!item || !Number.isFinite(value) || (weighed ? value <= 0 : !Number.isInteger(value) || value < 1)) {
      notify(locale === "ar" ? (weighed ? "أدخل كمية قياس أكبر من صفر." : "أدخل كمية صحيحة لا تقل عن وحدة.") : locale === "fr" ? (weighed ? "Saisissez une quantité mesurée supérieure à zéro." : "Saisissez une quantité entière valide.") : (weighed ? "Enter a measured quantity greater than zero." : "Enter a valid whole quantity."), "error");
      return;
    }
    const quantity = weighed ? Number(value.toFixed(3)) : value;
    const available = getAvailableForProduct(getProductId(item), item.id);
    if (quantity > available) {
      setWarningPayload({ type: "quantity", itemId: item.id, value: quantity, requested: quantity, available, returnTo: "quantity" });
      playSound("alerts");
      setKeyboardDialog("stockWarning");
      return;
    }
    updateItem(item.id, "quantity", quantity, { allowOversell: true });
    setKeyboardDialog(null);
  };
  const applyPriceEditor = (raw) => {
    const item = items[selectedCartIndex];
    const value = Number(String(raw).trim().replace(",", "."));
    if (!item || !Number.isFinite(value) || value < 0) {
      notify(locale === "ar" ? "أدخل سعرًا صحيحًا." : locale === "fr" ? "Saisissez un prix valide." : "Enter a valid price.", "error");
      return;
    }
    const product = getProducts().find((p) => String(p.id) === String(getProductId(item)));
    const cost = Number(product?.purchasePrice ?? item.purchasePrice) || 0;
    const selling = roundPriceUp(value);
    if (cost > 0 && selling < cost) {
      setWarningPayload({ type: "price", itemId: item.id, value: selling, cost, selling, returnTo: "price" });
      setKeyboardDialog("priceWarning");
      return;
    }
    updateItem(item.id, "price", selling);
    setKeyboardDialog(null);
  };
  const confirmKeyboardWarning = () => {
    const w = warningPayload;
    playSound("confirm");
    if (!w) { setKeyboardDialog("options"); return; }
    if (w.type === "price") {
      updateItem(w.itemId, "price", w.value);
      setKeyboardDialog(null);
    } else if (w.type === "quantity") {
      updateItem(w.itemId, "quantity", w.value, { allowOversell: true });
      setKeyboardDialog(null);
    } else if (w.type === "convertCarton") {
      applyCartonConversion(w.item, true);
    } else if (w.type === "addProduct") {
      const existingIndex = items.findIndex((row) => getProductId(row) === getProductId(w.product) && Boolean(row.weighedSale) === Boolean(w.product.weighedSale));
      setSelectedCartIndex(existingIndex >= 0 ? existingIndex : items.length);
      setInvoice((current) => ({ ...current, items: mergeItems(current.items || [], w.product, w.quantity || 1), status: "Draft", updatedAt: new Date().toISOString() }));
      setKeyboardDialog(null);
    } else if (w.type === "addCarton") {
      addCarton(w.item, true);
      setKeyboardDialog(null);
    }
    setWarningPayload(null);
  };
  const cancelKeyboardWarning = () => {
    const warning = warningPayload;
    const back = warning?.returnTo || (["addProduct", "addCarton"].includes(warning?.type) || (warning?.type === "quantity" && !warning?.returnTo) ? null : warning?.type === "price" ? "price" : warning?.type === "quantity" ? "quantity" : "options");
    setWarningPayload(null);
    setKeyboardDialog(back);
  };
  const chooseProductFromKeyboardList = (product) => {
    setKeyboardDialog(null);
    setProductPickerSearch("");
    setProductPickerPage(1);
    setSelectedProductIndex(0);
    addProduct(product);
  };
  const openCashDrawer = () => {
    const bridge = window.veltroHardware;
    if (bridge && typeof bridge.openCashDrawer === "function") {
      Promise.resolve(bridge.openCashDrawer()).catch(() => notify(locale === "ar" ? "تعذر فتح درج النقود. تحقق من الطابعة." : locale === "fr" ? "Impossible d'ouvrir le tiroir-caisse." : "Could not open the cash drawer.", "error"));
      return;
    }
    window.dispatchEvent(new CustomEvent("veltro:open-cash-drawer"));
    notify(locale === "ar" ? "لا يوجد اتصال مباشر بدرج النقود. يلزم ربط الطابعة أو برنامج تشغيل متوافق." : locale === "fr" ? "Aucun pilote de tiroir-caisse n'est connecté." : "No compatible cash-drawer driver is connected.", "info");
  };


  const navigateClosedInvoice = (direction) => {
    const sales = [...getCompletedSales()].sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));
    if (!sales.length) {
      notify(locale === "ar" ? "لا توجد بونات مغلقة." : locale === "fr" ? "Aucune facture clôturée." : "No closed invoices found.", "info");
      return;
    }
    if (closedInvoiceMode === null) {
      invoiceBeforeClosedBrowseRef.current = { ...invoice, items: (invoice.items || []).map(item => ({ ...item })) };
      saveAutoSavedDraft({ ...invoice, status: "Draft", subtotal, total, paid, remaining });
      // Start on the newest closed invoice for Next, or the next older one for Previous.
      const firstIndex = direction === "previous" ? Math.min(1, sales.length - 1) : 0;
      setClosedInvoiceIndex(firstIndex);
      setInvoice({ ...sales[firstIndex], status: "Completed", items: (sales[firstIndex].items || []).map(item => ({ ...item })) });
      setClosedInvoiceMode("review");
      setRemovedItem(null);
      return;
    }
    const nextIndex = direction === "previous"
      ? Math.min(sales.length - 1, closedInvoiceIndex + 1)
      : Math.max(0, closedInvoiceIndex - 1);
    const selected = sales[nextIndex];
    setClosedInvoiceIndex(nextIndex);
    setInvoice({ ...selected, status: "Completed", items: (selected.items || []).map(item => ({ ...item })) });
    setRemovedItem(null);
  };

  // One chronological navigation sequence for the current draft, pending invoices,
  // and completed sales. Navigation wraps at both ends and never shows boundary errors.
  const navigateAllInvoices = (direction) => {
    const savedDraft = closedInvoiceMode
      ? invoiceBeforeClosedBrowseRef.current
      : invoice;
    const pending = getPendingInvoices();
    const completed = getCompletedSales();
    const entries = [];
    const seen = new Set();

    const addEntry = (record, type) => {
      if (!record?.id) return;
      const id = String(record.id);
      if (seen.has(id)) return;
      seen.add(id);
      entries.push({ ...record, __navigationType: type });
    };

    pending.forEach((record) => addEntry(record, "pending"));
    completed.forEach((record) => addEntry(record, "completed"));
    if (savedDraft && !seen.has(String(savedDraft.id))) {
      addEntry(savedDraft, "draft");
    } else if (savedDraft) {
      // If the current draft is also stored as pending, keep its latest unsaved
      // edits in the navigation record instead of replacing them with stale data.
      const existingIndex = entries.findIndex((entry) => String(entry.id) === String(savedDraft.id));
      if (existingIndex >= 0) {
        entries[existingIndex] = {
          ...entries[existingIndex],
          ...savedDraft,
          __navigationType: entries[existingIndex].__navigationType,
        };
      }
    }

    entries.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || a.completedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || b.completedAt || 0).getTime();
      return aTime - bTime;
    });

    if (!entries.length) return;
    const currentIndex = entries.findIndex((entry) => String(entry.id) === String(invoice.id));
    const startIndex = currentIndex >= 0 ? currentIndex : (direction === "previous" ? 0 : entries.length - 1);
    const offset = direction === "previous" ? -1 : 1;
    const target = entries[(startIndex + offset + entries.length) % entries.length];
    if (!target || String(target.id) === String(invoice.id)) return;

    // Preserve the draft that was open before browsing invoices so the arrows
    // can always return to it, even when the destination is a completed sale.
    if (!invoiceBeforeClosedBrowseRef.current && closedInvoiceMode === null) {
      invoiceBeforeClosedBrowseRef.current = { ...invoice, items: (invoice.items || []).map((item) => ({ ...item })) };
      saveAutoSavedDraft({ ...invoice, status: "Draft", subtotal, total, paid, remaining });
    }

    if (target.__navigationType === "draft") {
      const draft = invoiceBeforeClosedBrowseRef.current || target;
      setInvoice({ ...draft, status: "Draft", items: (draft.items || []).map((item) => ({ ...item })) });
      setClosedInvoiceMode(null);
      setClosedInvoiceIndex(-1);
      invoiceBeforeClosedBrowseRef.current = null;
    } else if (target.__navigationType === "completed") {
      const latestCompleted = [...completed].sort((a, b) =>
        new Date(b.completedAt || b.createdAt || 0).getTime() -
        new Date(a.completedAt || a.createdAt || 0).getTime()
      );
      setClosedInvoiceIndex(latestCompleted.findIndex((row) => String(row.id) === String(target.id)));
      setClosedInvoiceMode("review");
      setInvoice({ ...target, status: "Completed", items: (target.items || []).map((item) => ({ ...item })) });
    } else {
      setClosedInvoiceMode(null);
      setClosedInvoiceIndex(-1);
      setInvoice({ ...target, status: "Draft", items: (target.items || []).map((item) => ({ ...item })) });
    }

    setRemovedItem(null);
    setShowPending(false);
    setShowEmptyWarning(false);
    setMessage("");
    refreshPending();
  };

  const reopenSelectedClosedInvoice = () => {
    if (!selectedClosedInvoice || !isReviewingClosedInvoice) return;
    playSound("confirm");
    setInvoice({ ...selectedClosedInvoice, status: "Draft", items: (selectedClosedInvoice.items || []).map(item => ({ ...item })) });
    setClosedInvoiceMode("editing");
    setRemovedItem(null);
    notify(locale === "ar" ? "تم فتح البون للتعديل. أكمل البيع لحفظ التغييرات." : locale === "fr" ? "Facture rouverte. Finalisez la vente pour enregistrer les modifications." : "Invoice reopened for editing. Complete Sale will save your changes.", "success");
  };

  const returnToCurrentInvoice = () => {
    if (isEditingClosedInvoice) {
      const confirmDiscard = window.confirm(locale === "ar" ? "هل تريد إلغاء التعديلات والعودة إلى البون الحالي؟" : locale === "fr" ? "Annuler les modifications et revenir à la facture actuelle ?" : "Discard changes and return to the current invoice?");
      if (!confirmDiscard) return;
    }
    const previous = invoiceBeforeClosedBrowseRef.current;
    if (previous) setInvoice(previous);
    setClosedInvoiceMode(null);
    setClosedInvoiceIndex(-1);
    invoiceBeforeClosedBrowseRef.current = null;
    setRemovedItem(null);
  };

  const printInvoice = () => {
    if (items.length === 0) {
      notify("Add products before printing.", "error");
      return;
    }

    window.print();
  };

  // Use app-level fullscreen only. Native browser fullscreen treats Escape as
  // a forced exit, which conflicts with the POS dialogs' Escape-to-cancel behavior.
  const toggleFullscreen = () => {
    setIsFullscreen((current) => !current);
  };


  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const stop = () => { e.preventDefault(); e.stopPropagation(); };
      if (e.ctrlKey && !e.altKey && !e.metaKey && (e.code === "KeyI" || String(e.key || "").toLowerCase() === "i")) {
        stop();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        setShowShortcutsHelp((current) => !current);
        return;
      }
      // Handle invoice-edit confirmation before dialog-specific early returns.
      // Click the real confirmation button so keyboard and mouse follow one code path.
      if (showEditInvoiceConfirm && (e.key === "Enter" || e.key === "Escape")) {
        stop();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        if (e.key === "Escape") {
          setShowEditInvoiceConfirm(false);
        } else {
          const confirmButton = document.querySelector(".pos-edit-invoice-confirm-modal footer button:last-child");
          if (confirmButton && !confirmButton.disabled) confirmButton.click();
        }
        return;
      }
      // The weighed-sale dialog owns F1-F12 category shortcuts and left/right page navigation.
      if (quickSaleDialog === "weigh") return;
      // F9 toggles the POS app's fullscreen layout.
      if (e.key === "F9") {
        stop();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        setIsFullscreen((current) => !current);
        return;
      }
      if (showShortcutsHelp) { if (e.key === "Escape") { stop(); setShowShortcutsHelp(false); } return; }
      const filtered = () => { const q=productPickerSearch.trim().toLocaleLowerCase(); const source=keyboardDialog==="favorites"?getProducts().filter(p=>favoriteProductIds.includes(String(p.id??p.productId??""))):getProducts(); return source.filter(p=>[p.name,p.id,p.productId,p.sku,p.barcode,...(Array.isArray(p.barcodeAliases)?p.barcodeAliases:[])].some(v=>String(v??"").toLocaleLowerCase().includes(q))); };
      if (keyboardDialog) {
        if (e.key==="Escape") { stop(); if (keyboardDialog==="stockWarning"||keyboardDialog==="priceWarning") cancelKeyboardWarning(); else setKeyboardDialog(null); return; }
        if (keyboardDialog==="products" || keyboardDialog==="favorites") {
          if (e.key==="ArrowUp"||e.key==="ArrowDown") { stop(); const count=Math.min(12,Math.max(0,filtered().length-(productPickerPage-1)*12)); if(count)setSelectedProductIndex(v=>e.key==="ArrowDown"?(v+1)%count:(v-1+count)%count); }
          else if(e.key==="F1"||e.key==="F2") { stop(); const pages=Math.max(1,Math.ceil(filtered().length/12)); setProductPickerPage(v=>Math.min(pages,Math.max(1,v+(e.key==="F1"?-1:1)))); setSelectedProductIndex(0); }
          else if(e.key==="Enter") { stop(); const p=filtered().slice((productPickerPage-1)*12,productPickerPage*12)[selectedProductIndex]; if(p)chooseProductFromKeyboardList(p); }
          return;
        }
        if(keyboardDialog==="options") { if(e.key==="F3"){stop();applyCartonConversion(items[selectedCartIndex]);} if(e.key==="F4"){stop();openPriceEditor();} return; }
        if(keyboardDialog==="quantity"&&e.key==="F3"){stop();setKeyboardDialog(null);applyCartonConversion(items[selectedCartIndex]);return;}
        if(keyboardDialog==="quantity"&&e.key==="Enter"){stop();applyQuantityEditor(quantityDraft);return;}
        if(keyboardDialog==="price"&&e.key==="Enter"){stop();applyPriceEditor(priceDraft);return;}
        if((keyboardDialog==="stockWarning"||keyboardDialog==="priceWarning")&&e.key==="Enter"){stop();confirmKeyboardWarning();return;}
        return;
      }
      if(showPending){ if(e.key==="Escape"){stop();setShowPending(false);return;} if(e.key==="ArrowUp"||e.key==="ArrowDown"){stop();if(pendingInvoices.length)setSelectedPendingIndex(v=>e.key==="ArrowDown"?(v+1)%pendingInvoices.length:(v-1+pendingInvoices.length)%pendingInvoices.length);return;} if(e.key==="Enter"){stop();const p=pendingInvoices[selectedPendingIndex];if(p)openPendingInvoice(p.id);return;} return; }
      if(showSaleConfirm){if(e.key==="Escape"){stop();setShowSaleConfirm(false);return;}if(e.key==="Enter"){stop();void confirmSaleCompletion(false);return;}if(e.key==="F12"){stop();void confirmSaleCompletion(true);return;}return;}
      if(showSaleReview){if(e.key==="Escape"){stop();setShowSaleReview(false);return;}if(e.key==="Enter"||e.key==="F12"){stop();setShowSaleReview(false);setShowSaleConfirm(true);return;}return;}
      if(showBelowCostWarning){if(e.key==="Escape"){stop();setShowBelowCostWarning(false);return;}if(e.key==="Enter"){stop();openSaleConfirmation();return;}return;}
      if (showCustomerPicker) {
        if (e.key === "Escape") { stop(); setShowCustomerPicker(false); return; }
        if (e.key === "Enter") {
          stop();
          const query = customerSearch.trim();
          const activeCustomer = filteredCustomerRecords.find((record) =>
            String(record.customerId ?? record.id ?? record.code ?? record.name ?? "") === String(invoice.customerId || "")
          );
          const chosen = activeCustomer || filteredCustomerRecords[0];
          if (chosen) selectCustomer(chosen);
          else if (!query) selectCustomer({ name: "Anonyme" });
          return;
        }
      }
      // In remaining POS dialogs, Enter activates the primary confirmation action.
      // Escape closes the topmost dialog without triggering its confirmation.
      if (e.key === "Escape" && target instanceof Element && target.closest('[role="dialog"]')) {
        const dialog = target.closest('[role="dialog"]');
        if (dialog && !keyboardDialog && !showPending && !showSaleReview && !showSaleConfirm && !showBelowCostWarning) {
          stop();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          if (quickSaleDialog) setQuickSaleDialog(null);
          else if (showShortcutsHelp) setShowShortcutsHelp(false);
          return;
        }
      }
      if (e.key === "Enter" && target instanceof Element && target.closest('[role="dialog"]')) {
        const dialog = target.closest('[role="dialog"]');
        if (dialog && !keyboardDialog && !showPending && !showSaleReview && !showSaleConfirm && !showBelowCostWarning && !showCustomerPicker && !showEditInvoiceConfirm && quickSaleDialog !== "weigh") {
          const primary = dialog.querySelector('button.primary:not(:disabled), button[type="submit"]:not(:disabled), .sale-confirm-primary:not(:disabled)');
          if (primary) {
            stop();
            if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
            primary.click();
            return;
          }
        }
      }
      // Keep cart keyboard navigation active while the cashier's cursor is in
      // either product lookup field. Prevent the browser from moving the caret.
      const isProductLookupField =
        target?.id === "product-barcode" || target?.id === "product-search";
      if (isProductLookupField && items.length && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        stop();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        setSelectedCartIndex((index) =>
          e.key === "ArrowDown"
            ? Math.min(items.length - 1, index + 1)
            : Math.max(0, index - 1)
        );
        return;
      }
      // Left/right arrows are POS invoice-navigation shortcuts everywhere,
      // including while a text field is focused. Do not let input caret movement
      // or other keyboard handlers swallow them.
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        stop();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        navigateAllInvoices(e.key === "ArrowLeft" ? "previous" : "next");
        return;
      }
      if(e.key==="F1"){stop();createNewInvoice();return;}
      if(e.key==="F2"){stop();if(isReviewingClosedInvoice && selectedClosedInvoice){setShowEditInvoiceConfirm(true);}else{notify(locale==="ar"?"اختر بونًا مغلقًا بالأسهم أولًا لتعديله.":locale==="fr"?"Sélectionnez d’abord une facture clôturée avec les flèches.":"Select a closed invoice with the arrows first to edit it.","info");}return;}
      if(e.key==="F3"){stop();openQuantityEditor();return;}
      if(e.key==="F4"){stop();openPriceEditor();return;}
      if(e.key==="F5"){stop();openCashDrawer();return;}
      if(e.key==="F6"){stop();setProductPickerSearch("");setProductPickerPage(1);setSelectedProductIndex(0);setKeyboardDialog("products");return;}
      if(e.key==="F7"){stop();completeCurrentSale();return;}
      if(e.key==="F8"){
        stop();
        if(closedInvoiceMode==="review"){
          const previousInvoice=invoiceBeforeClosedBrowseRef.current;
          if(previousInvoice)setInvoice(previousInvoice);
          setClosedInvoiceMode(null);setClosedInvoiceIndex(-1);invoiceBeforeClosedBrowseRef.current=null;
          setSelectedPendingIndex(0);setShowPending(true);return;
        }
        if(closedInvoiceMode==="editing"){
          notify(locale==="ar"?"ألغِ تعديل البون المغلق أو أكمله قبل فتح البونات المعلّقة.":locale==="fr"?"Annulez ou terminez la modification de la facture avant d’ouvrir les factures en attente.":"Cancel or complete the closed-invoice edit before opening pending invoices.","info");
          return;
        }
        setSelectedPendingIndex(0);setShowPending(true);return;
      }
      if(e.key==="F10"){stop();setQuickSaleDialog("favorites");return;}
      if(e.key==="F12"){
        stop();
        try { const saved = JSON.parse(localStorage.getItem("veltro_pos_weighed_slots") || "null"); if (Array.isArray(saved)) setWeighedProductSlots(Array.from({ length: 9 }, (_, i) => String(saved[i] || ""))); } catch {}
        setQuickSaleDialog("weigh");
        return;
      }
      if(items.length&&(e.key==="ArrowUp"||e.key==="ArrowDown")){stop();setSelectedCartIndex(v=>e.key==="ArrowDown"?Math.min(items.length-1,v+1):Math.max(0,v-1));}
    };
    document.addEventListener("keydown",handler,true);
    return ()=>document.removeEventListener("keydown",handler,true);
  });

  return (
    <div ref={posPageRef} className={`pos-page${isFullscreen ? " pos-fullscreen-active" : ""}${isReviewingClosedInvoice ? " closed-invoice-review-mode" : ""}`}>
      <header className="pos-heading">
        <SalesToolbar
          onNew={createNewInvoice}
          onEditInvoice={() => { playSound("confirm"); setShowEditInvoiceConfirm(true); }}
          editInvoiceDisabled={!isReviewingClosedInvoice || !selectedClosedInvoice || busy}
          onPrint={printInvoice}
          onCustomer={chooseCustomer}
          onPending={() => {
            if (closedInvoiceMode === "review") {
              // Leave read-only closed-invoice browsing before opening pending invoices.
              const previousInvoice = invoiceBeforeClosedBrowseRef.current;
              if (previousInvoice) setInvoice(previousInvoice);
              setClosedInvoiceMode(null);
              setClosedInvoiceIndex(-1);
              invoiceBeforeClosedBrowseRef.current = null;
              refreshPending();
              setShowPending(true);
              return;
            }
            if (closedInvoiceMode === "editing") {
              const discardEdit = window.confirm(
                locale === "ar"
                  ? "هناك تعديلات غير مكتملة على بون مغلق. هل تريد إلغاء هذه التعديلات والعودة إلى البون الحالي ثم فتح البونات المعلّقة؟"
                  : locale === "fr"
                    ? "La modification de la facture clôturée n’est pas terminée. Voulez-vous l’annuler et ouvrir les factures en attente ?"
                    : "The closed-invoice edit is unfinished. Discard those changes and open Pending Invoices?"
              );
              if (!discardEdit) return;
              const previousInvoice = invoiceBeforeClosedBrowseRef.current;
              if (previousInvoice) setInvoice(previousInvoice);
              setClosedInvoiceMode(null);
              setClosedInvoiceIndex(-1);
              invoiceBeforeClosedBrowseRef.current = null;
              refreshPending();
              setShowPending(true);
              return;
            }
            // Always open the list from the toolbar. Closing is handled by the
            // modal close button or backdrop, avoiding a stale toggle state.
            refreshPending();
            setShowPending(true);
          }}
          pendingCount={pendingInvoices.length}
          showPending={showPending}
          newDisabled={false}
          disabled={busy}
          message={message ? translatePosMessage(message, locale) : ""}
          messageType={messageType}
          onDismissMessage={() => setMessage("")}
          onUndo={removedItem ? () => undoRemove(removedItem.item) : undefined}
          undoLabel={translatePosMessage("Undo", locale)}
          dismissLabel={translatePosMessage("Dismiss message", locale)}
          locale={locale}
          onShortcuts={() => setShowShortcutsHelp(true)}
        />

        <button
          type="button"
          className="pos-fullscreen-button"
          onClick={toggleFullscreen}
          aria-pressed={isFullscreen}
          title={isFullscreen ? "Exit full-screen mode (Esc)" : "Expand sales screen"}
          aria-label={isFullscreen ? "Exit full-screen sales mode" : "Expand sales screen to full screen"}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          <span>{isFullscreen ? "Exit Full Screen" : "Full Screen"}</span>
        </button>
      </header>

      {closedInvoices.length > 0 && (
        <section className={`closed-invoice-inline-nav ${isReviewingClosedInvoice ? "is-reviewing" : isEditingClosedInvoice ? "is-editing" : ""}`} dir={locale === "ar" ? "rtl" : "ltr"} aria-label={locale === "ar" ? "التنقل بين البونات المغلقة" : "Navigate closed invoices"}>
          <button type="button" className="closed-invoice-arrow" onMouseDown={(event) => event.preventDefault()} onClick={() => navigateClosedInvoice("previous")} disabled={closedInvoiceMode !== null && closedInvoiceIndex >= closedInvoices.length - 1} title={locale === "ar" ? "البون السابق" : locale === "fr" ? "Facture précédente" : "Previous closed invoice"}><ChevronLeft size={20}/></button>
          <div className="closed-invoice-inline-info">
            <span className="closed-invoice-inline-status">{isReviewingClosedInvoice ? (locale === "ar" ? "مراجعة بون مغلق" : locale === "fr" ? "Consultation facture clôturée" : "Closed invoice review") : isEditingClosedInvoice ? (locale === "ar" ? "تعديل بون مغلق" : locale === "fr" ? "Modification facture clôturée" : "Editing closed invoice") : (locale === "ar" ? "التنقل بين البونات المغلقة" : locale === "fr" ? "Navigation des factures clôturées" : "Browse closed invoices")}</span>
            <strong>{selectedClosedInvoice ? (selectedClosedInvoice.invoiceNumber || selectedClosedInvoice.id) : (locale === "ar" ? "اختر البون بالسهمين" : locale === "fr" ? "Choisissez une facture" : "Choose an invoice with the arrows")}</strong>
            <small>{selectedClosedInvoice ? `${closedInvoiceIndex + 1} / ${closedInvoices.length} · ${selectedClosedInvoice.customerName || "Anonyme"}` : `${closedInvoices.length} ${locale === "ar" ? "بون مغلق" : locale === "fr" ? "factures clôturées" : "closed invoices"}`}</small>
          </div>
          <button type="button" className="closed-invoice-arrow" onMouseDown={(event) => event.preventDefault()} onClick={() => navigateClosedInvoice("next")} disabled={closedInvoiceMode !== null && closedInvoiceIndex <= 0} title={locale === "ar" ? "البون التالي" : locale === "fr" ? "Facture suivante" : "Next closed invoice"}><ChevronRight size={20}/></button>
          {isEditingClosedInvoice ? (
            <span className="closed-invoice-edit-hint">{locale === "ar" ? "احفظ التغييرات بزر إتمام البيع" : locale === "fr" ? "Enregistrez via Finaliser la vente" : "Save changes using Complete Sale"}</span>
          ) : null}
          {closedInvoiceMode && <button type="button" className="closed-invoice-return" onClick={returnToCurrentInvoice}>{locale === "ar" ? "العودة للبون الحالي" : locale === "fr" ? "Revenir à la facture actuelle" : "Return to current invoice"}</button>}
        </section>
      )}

      {showEmptyWarning && (
        <div className="pos-empty-warning" role="alert">
          <div>
            <strong>Current invoice is empty</strong>
            <p>
              Close this empty invoice before opening a new or pending invoice.
            </p>
          </div>

          <button type="button" onClick={closeEmptyAndCreate}>
            Close Empty Invoice
          </button>

          <button
            type="button"
            onClick={() => setShowEmptyWarning(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {showPending && (
        <div
          className="pending-invoices-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPending(false);
          }}
        >
          <section
            className="pending-invoices-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-invoices-title"
          >
            <header className="pending-invoices-modal-header">
              <div className="pending-invoices-heading-icon">
                <ReceiptText size={21} />
              </div>
              <div className="pending-invoices-heading-copy">
                <h2 id="pending-invoices-title">{locale === "ar" ? "البونات المعلّقة" : locale === "fr" ? "Factures en attente" : "Pending Invoices"}</h2>
                <p>{locale === "ar" ? "اختر بونًا محفوظًا لمواصلة العمل عليه." : locale === "fr" ? "Choisissez une facture enregistrée pour continuer." : "Choose a saved invoice to continue working on it."}</p>
              </div>
              <span className="pending-invoices-count">{pendingInvoices.length}</span>
              <button
                type="button"
                className="pending-invoices-close"
                onClick={() => setShowPending(false)}
                aria-label={locale === "ar" ? "إغلاق البونات المعلّقة" : locale === "fr" ? "Fermer les factures en attente" : "Close pending invoices"}
              >
                <X size={18} />
              </button>
            </header>

            {pendingInvoices.length === 0 ? (
              <div className="pending-invoices-empty">
                <span className="pending-invoices-empty-icon"><ClipboardList size={25} /></span>
                <strong>{locale === "ar" ? "لا توجد بونات معلّقة" : locale === "fr" ? "Aucune facture en attente" : "No pending invoices yet"}</strong>
                <p>{locale === "ar" ? "ستظهر هنا الفواتير المحفوظة لاحقًا." : locale === "fr" ? "Les factures enregistrées apparaîtront ici." : "Invoices saved for later will appear here."}</p>
              </div>
            ) : (
              <div className="pending-invoices-table-wrap">
                <div className="pending-invoices-list-heading">
                  <span>{locale === "ar" ? "تفاصيل البون" : locale === "fr" ? "DÉTAILS DE LA FACTURE" : "INVOICE DETAILS"}</span>
                  <span>{locale === "ar" ? "المبلغ" : locale === "fr" ? "MONTANT" : "AMOUNT"}</span>
                </div>
                <div className="pending-invoices-list">
                  {pendingInvoices.map((pending) => {
                    const dateValue = pending.createdAt || pending.updatedAt;
                    const date = dateValue ? new Date(dateValue) : null;
                    const validDate = date && !Number.isNaN(date.getTime());
                    const reference = pending.reference || pending.invoiceReference || pending.ref || pending.id || "—";
                    const invoiceTotal = money(
                      pending.total ?? calculateSubtotal(pending.items || [])
                    );

                    return (
                      <button
                        type="button"
                        key={pending.id}
                        className={"pending-invoices-row " + (pendingInvoices.findIndex((row) => row.id === pending.id) === selectedPendingIndex ? "keyboard-selected" : "")}
                        onClick={() => openPendingInvoice(pending.id)}
                      >
                        <span className="pending-invoices-main">
                          <span className="pending-invoices-number">
                            <ReceiptText size={15} />
                            <strong>{pending.invoiceNumber || "—"}</strong>
                          </span>
                          <span className="pending-invoices-meta">
                            <span><Hash size={13} /> Ref: {reference}</span>
                            <span><UserRound size={13} /> {pending.customerName || "Anonyme"}</span>
                            <span><CalendarClock size={13} /> {validDate ? date.toLocaleDateString() : "—"}</span>
                            <span><Clock size={13} /> {validDate ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                          </span>
                        </span>
                        <span className="pending-invoices-amount">
                          <strong>{invoiceTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong>
                          <small>{(pending.items || []).length} item line(s)</small>
                        </span>
                        <span className="pending-invoices-open"><ChevronRight size={17} /></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <footer className="pending-invoices-modal-footer">
              <span>{locale === "ar" ? `${pendingInvoices.length} بون محفوظ` : locale === "fr" ? `${pendingInvoices.length} facture(s) enregistrée(s)` : `${pendingInvoices.length} saved invoice${pendingInvoices.length === 1 ? "" : "s"}`}</span>
              <button type="button" onClick={() => setShowPending(false)}>{locale === "ar" ? "إغلاق" : locale === "fr" ? "Fermer" : "Close"}</button>
            </footer>
          </section>
        </div>
      )}

      {showBelowCostWarning && (
        <div
          className="sale-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) {
              setShowBelowCostWarning(false);
            }
          }}
        >
          <section
            className="sale-confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="below-cost-title"
          >
            <header className="sale-confirm-header">
              <div className="sale-confirm-icon review">
                <AlertTriangle size={22} />
              </div>
              <div className="sale-confirm-heading-copy">
                <h2 id="below-cost-title">{dialogText.belowCostTitle}</h2>
                <p>{dialogText.belowCostDescription}</p>
              </div>
              <button
                type="button"
                className="sale-confirm-close"
                onClick={() => setShowBelowCostWarning(false)}
                disabled={busy}
                aria-label={locale === "ar" ? "إغلاق التنبيه" : locale === "fr" ? "Fermer l’alerte" : "Close warning"}
              >
                <X size={18} />
              </button>
            </header>

            <div className="sale-confirm-amounts">
              {belowCostItems.map((item) => (
                <div className="sale-confirm-amount-row" key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <small style={{ display: "block", marginTop: 4 }}>
                      {dialogText.qty}: {item.quantity} · {dialogText.lossPerUnit}: {item.lossPerUnit.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                    </small>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <strong>{item.sellingPrice.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong>
                    <small style={{ display: "block", marginTop: 4 }}>
                      {dialogText.cost}: {item.purchaseCost.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                    </small>
                  </span>
                </div>
              ))}
            </div>

            <p className="sale-confirm-note">
              {dialogText.belowCostQuestion}
            </p>
            <footer className="sale-confirm-actions">
              <button
                type="button"
                className="sale-confirm-secondary"
                onClick={() => setShowBelowCostWarning(false)}
                disabled={busy}
              >
                {dialogText.cancelSale}
              </button>
              <button
                type="button"
                className="sale-confirm-primary"
                onClick={openSaleConfirmation}
                disabled={busy}
              >
                {dialogText.continueAnyway} <Check size={16} />
              </button>
            </footer>
          </section>
        </div>
      )}

      {(showSaleReview || showSaleConfirm) && (
        <div className="sale-confirm-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            setShowSaleReview(false);
            setShowSaleConfirm(false);
          }
        }}>
          <section className="sale-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="sale-confirm-title">
            <header className="sale-confirm-header">
              <div className={`sale-confirm-icon ${showSaleReview ? "review" : "confirm"}`}>
                {showSaleReview ? <ReceiptText size={22} /> : <BadgeCheck size={22} />}
              </div>
              <div className="sale-confirm-heading-copy">
                <h2 id="sale-confirm-title">{showSaleReview ? dialogText.reviewTitle : dialogText.confirmTitle}</h2>
                <p>{showSaleReview ? dialogText.reviewDescription : dialogText.confirmDescription}</p>
              </div>
              <button type="button" className="sale-confirm-close" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(false); }} disabled={busy} aria-label="Close"><X size={18} /></button>
            </header>
            {showSaleReview ? (
              <>
                <div className="sale-confirm-customer">
                  <span className="sale-confirm-customer-avatar"><UserRound size={18} /></span>
                  <span className="sale-confirm-customer-name"><small>{dialogText.selectedCustomer}</small><strong>{customer}</strong></span>
                  <span className="sale-confirm-invoice-number">{invoice.invoiceNumber}</span>
                </div>
                <div className="sale-confirm-amounts">
                  <div className="sale-confirm-amount-row"><span><WalletCards size={15} /> {dialogText.previousDebt}</span><strong>{previousDebt.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row"><span><ReceiptText size={15} /> {dialogText.invoiceTotal}</span><strong>{total.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row sale-confirm-paid-row"><label htmlFor="review-paid-amount"><Check size={15} /> {dialogText.amountPaid}</label><div className="sale-confirm-paid-input-wrap"><input id="review-paid-amount" className="sale-confirm-paid-input" type="number" inputMode="decimal" min="0" max={total} step="any" value={paidDraft} disabled={busy} onFocus={() => { if (paidDraft === "0" || paidDraft === "0.00") setPaidDraft(""); }} onChange={(event) => setPaidDraft(event.target.value)} onBlur={() => { const value = paidDraft.trim() === "" ? 0 : Number(paidDraft); if (Number.isFinite(value)) { setPaidDraft(String(value)); updateInvoice({ paid: value }); } else { setPaidDraft(String(paid)); }} } aria-label="Amount paid in DA" /><span>DA</span></div></div>
                  <div className="sale-confirm-amount-row current"><span><AlertTriangle size={15} /> {dialogText.unpaid}</span><strong>{remaining.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-total-debt"><span>{dialogText.totalDebt}</span><strong>{(previousDebt + remaining).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                </div>
                <p className="sale-confirm-note">{dialogText.nextStep}</p>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleReview(false)}>{dialogText.backInvoice}</button>
                  <button type="button" className="sale-confirm-primary" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(true); }}>{dialogText.continue} <Check size={16} /></button>
                </footer>
              </>
            ) : (
              <>
                <div className="sale-confirm-message">
                  <span className="sale-confirm-message-icon"><AlertTriangle size={21} /></span>
                  <div><strong>{dialogText.completeInvoice} {invoice.invoiceNumber}?</strong><p>{isAnonymousCustomer ? dialogText.anonymousSale : dialogText.customerSale}</p></div>
                </div>
                <div className="sale-confirm-final-amount"><span>{dialogText.invoiceTotal}</span><strong>{total.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleConfirm(false)} disabled={busy}>{dialogText.cancel}</button>
                  <button type="button" className="sale-confirm-primary" onClick={confirmSaleCompletion} disabled={busy}>{busy ? dialogText.completing : <> <Check size={16} /> {dialogText.confirmSale} </>}</button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}

      {showCustomerPicker && (
        <div
          className="customer-picker-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCustomerPicker(false);
          }}
        >
          <section className="customer-picker-modal" role="dialog" aria-modal="true" aria-labelledby="customer-picker-title">
            <header className="customer-picker-header">
              <div className="customer-picker-heading-icon"><Users size={21} /></div>
              <div className="customer-picker-heading-copy">
                <h2 id="customer-picker-title">{locale === "ar" ? "اختيار زبون" : locale === "fr" ? "Choisir un client" : "Select customer"}</h2>
                <p>{locale === "ar" ? "ابحث بالاسم أو رقم الهاتف أو معرف الزبون أو المرجع." : locale === "fr" ? "Rechercher par nom, téléphone, identifiant ou référence." : "Search by name, phone number, customer ID or reference."}</p>
              </div>
              <button type="button" className="customer-picker-close" onClick={() => setShowCustomerPicker(false)} aria-label={locale === "ar" ? "إغلاق اختيار الزبون" : locale === "fr" ? "Fermer la sélection du client" : "Close customer selection"}>
                <X size={19} />
              </button>
            </header>

            <div className="customer-picker-search">
              <Search size={18} />
              <input
                autoFocus
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder={locale === "ar" ? "الاسم أو الهاتف أو المعرف أو المرجع..." : locale === "fr" ? "Nom, téléphone, identifiant ou référence..." : "Name, phone, ID or reference..."}
                aria-label={locale === "ar" ? "البحث عن الزبائن" : locale === "fr" ? "Rechercher des clients" : "Search customers"}
              />
              {customerSearch && (
                <button type="button" onClick={() => setCustomerSearch("")} aria-label="Clear search"><X size={15} /></button>
              )}
            </div>

            <button type="button" className="customer-picker-anonymous" onClick={() => selectCustomer({ name: "Anonyme" })}>
              <span className="customer-picker-avatar anonymous"><UserRound size={18} /></span>
              <span className="customer-picker-record-copy">
                <strong>Anonyme</strong>
                <small>{locale === "ar" ? "زبون عابر · دون متابعة ديون" : locale === "fr" ? "Client de passage · sans suivi de dette" : "Walk-in customer · No customer debt tracking"}</small>
              </span>
              {String(customer).toLowerCase() === "anonyme" && <Check size={18} />}
            </button>

            <div className="customer-picker-list-heading">
              <span>{locale === "ar" ? "قائمة الزبائن" : locale === "fr" ? "Liste des clients" : "Customer list"}</span>
              <span>{filteredCustomerRecords.length} {locale === "ar" ? "زبون" : locale === "fr" ? "client(s)" : filteredCustomerRecords.length === 1 ? "customer" : "customers"}</span>
            </div>

            <div className="customer-picker-list">
              {filteredCustomerRecords.length ? filteredCustomerRecords.map((record, index) => {
                const recordName = String(record.name || record.customerName || "Unnamed customer");
                const recordId = String(record.customerId ?? record.id ?? record.code ?? recordName);
                const active = String(invoice.customerId || "") === recordId;
                return (
                  <button type="button" className={`customer-picker-record ${active ? "selected" : ""}`} key={`${recordId}-${index}`} onClick={() => selectCustomer(record)}>
                    <span className="customer-picker-avatar"><UserRound size={18} /></span>
                    <span className="customer-picker-record-copy">
                      <strong>{recordName}</strong>
                      <small>
                        {record.phone || record.phoneNumber ? <><Phone size={12} /> {record.phone || record.phoneNumber}</> : <><Fingerprint size={12} /> ID: {recordId}</>}
                        {(record.code || record.reference || record.ref) && <span className="customer-picker-reference">Ref: {record.code || record.reference || record.ref}</span>}
                      </small>
                    </span>
                    {active && <Check size={18} className="customer-picker-selected-check" />}
                  </button>
                );
              }) : (
                <div className="customer-picker-empty">
                  <span className="customer-picker-empty-icon"><UserRoundPlus size={23} /></span>
                  <strong>{customerSearch ? (locale === "ar" ? "لا يوجد زبائن مطابقون" : locale === "fr" ? "Aucun client correspondant" : "No matching customers") : (locale === "ar" ? "لا يوجد زبائن محفوظون بعد" : locale === "fr" ? "Aucun client enregistré" : "No saved customers yet")}</strong>
                  <p>{customerSearch ? (locale === "ar" ? "جرّب اسمًا أو هاتفًا أو معرفًا أو مرجعًا آخر." : locale === "fr" ? "Essayez un autre nom, numéro, identifiant ou référence." : "Try another name, phone number, ID or reference.") : (locale === "ar" ? "ستظهر هنا زبائن الفواتير السابقة. يمكنك استعمال Anonyme للبيع السريع." : locale === "fr" ? "Les clients des factures précédentes apparaîtront ici. Anonyme reste disponible pour une vente rapide." : "Customers from previous invoices will appear here. You can still use Anonyme for a quick sale.")}</p>
                </div>
              )}
            </div>

            <footer className="customer-picker-footer">
              <span><Users size={14} /> {locale === "ar" ? "اختر زبونًا لربط الفاتورة بحسابه." : locale === "fr" ? "Choisissez un client pour associer la facture à son compte." : "Choose a customer to link this invoice to their account."}</span>
              <button type="button" onClick={() => setShowCustomerPicker(false)}>{locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel"}</button>
            </footer>
          </section>
        </div>
      )}


      {showShortcutsHelp && (
        <div className="pos-shortcuts-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowShortcutsHelp(false); }}>
          <section className="pos-shortcuts-modal" role="dialog" aria-modal="true" aria-labelledby="pos-shortcuts-title" dir={locale === "ar" ? "rtl" : "ltr"}>
            <header className="pos-shortcuts-header">
              <div className="pos-shortcuts-heading"><span className="pos-shortcuts-icon"><Keyboard size={22} /></span><div>
                <span className="pos-shortcuts-eyebrow">VELTRO-PRO · POS</span>
                <h2 id="pos-shortcuts-title">{locale === "ar" ? "دليل اختصارات لوحة المفاتيح" : locale === "fr" ? "Guide des raccourcis clavier" : "Keyboard shortcuts guide"}</h2>
                <p>{locale === "ar" ? "أنجز عمليات البيع بسرعة دون مغادرة لوحة المفاتيح." : locale === "fr" ? "Accélérez vos ventes sans quitter le clavier." : "Move through sales faster without leaving the keyboard."}</p>
              </div></div>
              <button type="button" className="pos-shortcuts-close" onClick={() => setShowShortcutsHelp(false)} aria-label={locale === "ar" ? "إغلاق الدليل" : locale === "fr" ? "Fermer le guide" : "Close guide"}><X size={19}/></button>
            </header>
            <div className="pos-shortcuts-tip"><HelpCircle size={16}/><span>{locale === "ar" ? "اضغط Enter للتأكيد وEscape للإلغاء أو الرجوع في النوافذ المنبثقة." : locale === "fr" ? "Appuyez sur Entrée pour confirmer et Échap pour annuler ou revenir dans les fenêtres." : "Press Enter to confirm and Escape to cancel or go back in dialogs."}</span></div>
            <div className="pos-shortcuts-grid">
              {(locale === "ar" ? [
                ["البون والبيع", [["F1","إنشاء بون جديد"],["F2","تعديل البون المغلق المحدد"],["F7","تأكيد البون وإتمام البيع"],["F8","فتح البونات المعلّقة"],["F9","الشاشة الكاملة"]]],
                ["المنتجات", [["F3","تعديل الكمية؛ اضغط مرة ثانية للتحويل إلى كرتونة"],["F4","تعديل السعر"],["F5","فتح درج النقود"],["F6","فتح قائمة البحث عن المنتجات"],["F10","فتح المنتجات المفضلة"],["F12","فتح واجهة البيع بالميزان"],["↑ / ↓","التنقل بين المنتجات أو أسطر البون"],["Enter","اختيار المنتج أو التأكيد"]]],
                ["أدوات إضافية", [["Ctrl + I","فتح هذا الدليل"],["Escape","إغلاق النافذة أو الإلغاء"],["Enter","تأكيد الإجراء داخل النافذة"]]]
              ] : locale === "fr" ? [
                ["Facture et vente", [["F1","Nouvelle facture"],["F2","Modifier la facture clôturée sélectionnée"],["F7","Confirmer et finaliser la vente"],["F8","Factures en attente"],["F9","Plein écran"]]],
                ["Produits", [["F3","Modifier la quantité ; appuyer encore pour convertir en carton"],["F4","Modifier le prix"],["F5","Ouvrir le tiroir-caisse"],["F6","Rechercher un produit"],["F10","Produits favoris"],["F12","Ouvrir la vente au poids"],["↑ / ↓","Naviguer entre les produits ou lignes"],["Entrée","Choisir ou confirmer"]]],
                ["Outils", [["Ctrl + I","Ouvrir ce guide"],["Échap","Fermer ou annuler"],["Entrée","Confirmer dans une fenêtre"]]]
              ] : [
                ["Invoice & sale", [["F1","Create a new invoice"],["F2","Edit selected closed invoice"],["F7","Confirm and complete sale"],["F8","Pending invoices"],["F9","Full screen"]]],
                ["Products", [["F3","Edit quantity; press again to convert to carton"],["F4","Edit price"],["F5","Open cash drawer"],["F6","Search products"],["F10","Favorite products"],["F12","Open weighed-sale screen"],["↑ / ↓","Navigate products or invoice rows"],["Enter","Select or confirm"]]],
                ["More tools", [["Ctrl + I","Open this guide"],["Escape","Close or cancel"],["Enter","Confirm inside a dialog"]]]
              ]).map(([group, rows]) => <section className="pos-shortcuts-group" key={group}><h3>{group}</h3>{rows.map(([key, label]) => <div className="pos-shortcuts-row" key={key + label}><kbd>{key}</kbd><span>{label}</span></div>)}</section>)}
            </div>
            <footer className="pos-shortcuts-footer"><span>{locale === "ar" ? "تلميح: افتح هذا الدليل في أي وقت باستخدام Ctrl + I." : locale === "fr" ? "Astuce : ouvrez ce guide à tout moment avec Ctrl + I." : "Tip: reopen this guide anytime with Ctrl + I."}</span><button type="button" onClick={() => setShowShortcutsHelp(false)}>{locale === "ar" ? "فهمت" : locale === "fr" ? "Compris" : "Got it"}</button></footer>
          </section>
        </div>
      )}

      {showEditInvoiceConfirm && (
        <div
          className="pos-edit-invoice-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowEditInvoiceConfirm(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(2, 6, 23, 0.78)",
            backdropFilter: "blur(7px)",
          }}
        >
          <section
            className="pos-edit-invoice-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-edit-invoice-confirm-title"
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={{
              width: "min(100%, 460px)",
              color: "#eaf2ff",
              background: "linear-gradient(145deg, #111c30, #0b1220)",
              border: "1px solid rgba(45, 212, 191, 0.35)",
              borderRadius: 18,
              boxShadow: "0 24px 80px rgba(0,0,0,.5)",
              overflow: "hidden",
            }}
          >
            <header style={{ display: "flex", alignItems: "center", gap: 13, padding: "20px 22px 14px" }}>
              <span style={{ display: "grid", placeItems: "center", flex: "0 0 44px", width: 44, height: 44, borderRadius: 13, color: "#5eead4", background: "rgba(45,212,191,.12)", border: "1px solid rgba(45,212,191,.24)" }}>
                <AlertTriangle size={23} />
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 id="pos-edit-invoice-confirm-title" style={{ margin: 0, fontSize: 18, fontWeight: 850, color: "#f8fafc" }}>
                  {locale === "ar" ? "تأكيد تعديل الفاتورة" : locale === "fr" ? "Confirmer la modification" : "Confirm invoice edit"}
                </h2>
                <p style={{ margin: "5px 0 0", fontSize: 12, lineHeight: 1.6, color: "#9aabc2" }}>
                  {locale === "ar" ? "هل تريد فتح الفاتورة المحددة للتعديل؟ لن تُحفظ التغييرات إلا بعد تأكيد البيع." : locale === "fr" ? "Voulez-vous rouvrir cette facture pour la modifier ? Les changements seront enregistrés après validation de la vente." : "Do you want to reopen this invoice for editing? Changes will only be saved when you complete the sale."}
                </p>
              </div>
              <button type="button" aria-label={locale === "ar" ? "إغلاق" : locale === "fr" ? "Fermer" : "Close"} onClick={() => setShowEditInvoiceConfirm(false)} style={{ marginInlineStart: "auto", alignSelf: "flex-start", border: 0, borderRadius: 9, padding: 7, color: "#9aabc2", background: "rgba(148,163,184,.09)", cursor: "pointer" }}>
                <X size={17} />
              </button>
            </header>
            <div style={{ margin: "0 22px 18px", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(129,140,248,.22)", background: "rgba(99,102,241,.08)" }}>
              <div style={{ fontSize: 10, letterSpacing: ".08em", fontWeight: 800, color: "#a5b4fc", marginBottom: 4 }}>
                {locale === "ar" ? "الفاتورة المحددة" : locale === "fr" ? "FACTURE SÉLECTIONNÉE" : "SELECTED INVOICE"}
              </div>
              <strong style={{ fontSize: 15, color: "#f8fafc" }}>
                {selectedClosedInvoice?.invoiceNumber || selectedClosedInvoice?.reference || selectedClosedInvoice?.id || "—"}
              </strong>
              <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "#a7b5ca" }}>
                {selectedClosedInvoice?.customerName || "Anonyme"}
              </span>
            </div>
            <footer style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 22px 22px" }}>
              <button type="button" onClick={() => setShowEditInvoiceConfirm(false)} style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(148,163,184,.25)", color: "#cbd5e1", background: "rgba(148,163,184,.08)", fontWeight: 750, cursor: "pointer" }}>
                {locale === "ar" ? "إلغاء" : locale === "fr" ? "Annuler" : "Cancel"}
              </button>
              <button type="button" disabled={!selectedClosedInvoice || !isReviewingClosedInvoice || busy} onClick={() => { playSound("confirm"); setShowEditInvoiceConfirm(false); reopenSelectedClosedInvoice(); }} style={{ minHeight: 40, padding: "0 18px", borderRadius: 10, border: "1px solid rgba(45,212,191,.42)", color: "#042f2e", background: "linear-gradient(135deg,#5eead4,#2dd4bf)", fontWeight: 850, cursor: "pointer", opacity: (!selectedClosedInvoice || !isReviewingClosedInvoice || busy) ? .55 : 1 }}>
                {locale === "ar" ? "تأكيد التعديل" : locale === "fr" ? "Confirmer" : "Confirm edit"}
              </button>
            </footer>
          </section>
        </div>
      )}

      <PosKeyboardDialogs
        dialog={keyboardDialog}
        locale={locale}
        products={getProducts()}
        favoriteProductIds={favoriteProductIds}
        onToggleFavorite={toggleFavoriteProduct}
        selectedItem={items[selectedCartIndex] || null}
        selectedCartIndex={selectedCartIndex}
        productSearch={productPickerSearch}
        setProductSearch={setProductPickerSearch}
        productPage={productPickerPage}
        setProductPage={setProductPickerPage}
        selectedProductIndex={selectedProductIndex}
        setSelectedProductIndex={setSelectedProductIndex}
        quantityDraft={quantityDraft}
        setQuantityDraft={setQuantityDraft}
        priceDraft={priceDraft}
        setPriceDraft={setPriceDraft}
        warningPayload={warningPayload}
        onClose={() => setKeyboardDialog(null)}
        onSelectProduct={chooseProductFromKeyboardList}
        onConvertCarton={() => applyCartonConversion(items[selectedCartIndex])}
        onOpenQuantity={openQuantityEditor}
        onOpenPrice={openPriceEditor}
        onApplyQuantity={applyQuantityEditor}
        onApplyPrice={applyPriceEditor}
        onConfirmWarning={confirmKeyboardWarning}
        onCancelWarning={cancelKeyboardWarning}
      />

      <PosQuickSaleDialogs
        dialog={quickSaleDialog}
        locale={locale}
        products={getProducts()}
        favoriteIds={favoriteProductIds}
        weighedIds={weighedProductIds}
        weighedLayout={weighedProductLayout}
        weighedSlots={weighedProductSlots}
        categoriesByProduct={weighedCategories}
        categories={weighedCategoryList}
        visibleWeighedCategories={visibleWeighedCategories}
        shortcutCategories={weighedShortcutCategories}
        poundGrams={poundGrams}
        onClose={() => setQuickSaleDialog(null)}
        onAddProduct={(product) => { setQuickSaleDialog(null); addProduct(product); }}
        onToggleFavorite={toggleFavoriteProduct}
        onSaveSettings={(settings) => {
          setFavoriteProductIds(settings.favoriteIds);
          setWeighedProductIds(settings.weighedIds);
          setWeighedCategories(settings.categoriesByProduct);
          if (Array.isArray(settings.weighedSlots)) { setWeighedProductSlots(Array.from({ length: 9 }, (_, i) => String(settings.weighedSlots[i] || ""))); try { localStorage.setItem("veltro_pos_weighed_slots", JSON.stringify(settings.weighedSlots)); } catch {} }
          if (Array.isArray(settings.weighedLayout)) {
            setWeighedProductLayout(settings.weighedLayout.map(String));
            try { localStorage.setItem("veltro_pos_weighed_layout", JSON.stringify(settings.weighedLayout.map(String))); } catch {}
          }
          setWeighedCategoryList(settings.categories);
          setVisibleWeighedCategories(settings.visibleWeighedCategories);
          if (Array.isArray(settings.shortcutCategories)) { setWeighedShortcutCategories(settings.shortcutCategories); try { localStorage.setItem("veltro_pos_shortcut_categories", JSON.stringify(settings.shortcutCategories)); } catch {} }
          setPoundGrams(settings.poundGrams);
          try {
            localStorage.setItem("veltro_pos_favorite_products", JSON.stringify(settings.favoriteIds));
            localStorage.setItem("veltro_pos_weighed_products", JSON.stringify(settings.weighedIds));
            localStorage.setItem("veltro_pos_weighed_categories", JSON.stringify(settings.categoriesByProduct));
            localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(settings.categories));
            localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(settings.visibleWeighedCategories));
            localStorage.setItem("veltro_pos_pound_grams", String(settings.poundGrams));
          } catch (error) { console.warn("Could not save quick-sale settings:", error); }
        }}
      />

      <div className="sales-layout">
        <div className="pos-invoice-column">
          <InvoiceSummary
            currentUser={currentUserName || localStorage.getItem("veltro_current_user") || "User"}
            invoiceNumber={invoice.invoiceNumber}
            invoiceDate={invoice.createdAt}
            customerReference={isAnonymousCustomer ? "" : String(invoice.customerId || "")}
            items={items}
            paymentMethod={invoice.paymentMethod || "cash"}
            onPaymentMethodChange={(value) => updateInvoice({ paymentMethod: value })}
            locale={locale}
            compactCustomerInfo={isFullscreen}
            onChooseCustomer={chooseCustomer}
            subtotal={subtotal}
            discount={discount}
            onDiscountChange={(value) =>
              updateInvoice({ discount: money(value) })
            }
            total={total}
            paid={paid}
            remaining={remaining}
            previousDebt={previousDebt}
            customerName={customer}
            onViewDebtDetails={() => {
              notify(
                `${customer || "Customer"} has ${previousDebt.toLocaleString()} DA in previous unpaid balances.`,
                "info"
              );
            }}
            onSavePending={() => saveCurrentAsPending(false)}
            onPrint={printInvoice}
            onCompleteSale={completeCurrentSale}
            busy={busy}
          />
          <div className="pos-cart-info-card">
          <InvoiceTable
            items={items}
            selectedIndex={selectedCartIndex}
            onSelectRow={setSelectedCartIndex}
            onUpdate={updateItem}
            onRemove={removeItem}
            onUndoRemove={undoRemove}
            onAddUnit={addUnit}
            onAddCarton={addCarton}
            locale={locale}
            readOnly={isReviewingClosedInvoice}
            onBlockedAction={() => {
                      notify(
                locale === "ar"
                  ? "هذا البون مغلق للعرض فقط. اضغط «تعديل البون» ثم أكّد التعديل قبل حذف المنتجات."
                  : locale === "fr"
                    ? "Cette facture est en lecture seule. Cliquez sur « Modifier la facture » puis confirmez avant de supprimer des produits."
                    : "This invoice is read-only. Click Edit Invoice and confirm editing before deleting products.",
                "error"
              );
            }}
          />
          </div>
        </div>
        <div className="pos-entry-column">
          <div className="pos-product-info-card">
          <ProductEntry
            isFullscreen={isFullscreen}
            onAddProduct={addProduct}
            onAddCarton={addCarton}
            showProducts={showProducts}
            onShowProducts={setShowProducts}
            quickActions={<>
<div className="pos-quick-launcher" dir={locale === "ar" ? "rtl" : "ltr"}>
            <button type="button" className="pos-quick-launch-favorite" onClick={() => setQuickSaleDialog("favorites")}><Star size={18}/><span>{locale === "ar" ? "المنتجات المفضلة" : locale === "fr" ? "Produits favoris" : "Favorite products"}</span><kbd>F10</kbd></button>
            <button type="button" className="pos-quick-launch-weigh" onClick={() => { try { const saved = JSON.parse(localStorage.getItem("veltro_pos_weighed_slots") || "null"); if (Array.isArray(saved)) setWeighedProductSlots(Array.from({ length: 9 }, (_, i) => String(saved[i] || ""))); } catch {} setQuickSaleDialog("weigh"); }}><Scale size={18}/><span>{locale === "ar" ? "البيع بالميزان" : locale === "fr" ? "Vente au poids" : "Sell by weight"}</span><kbd>F12</kbd></button>
          </div>
            </>}
            selectedProductInfo={<>
<section
            className={`pos-selected-product-preview${items.length ? "" : " is-empty"}`}
            aria-live="polite"
            aria-label={locale === "ar" ? "معاينة المنتج المحدد" : locale === "fr" ? "Aperçu du produit sélectionné" : "Selected product preview"}
            dir={locale === "ar" ? "rtl" : "ltr"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: items.length ? "space-between" : "center",
              gap: 14,
              margin: 0,
              padding: "8px 12px",
              minHeight: 62,
              borderRadius: 12,
              border: items.length ? "1px solid rgba(45, 212, 191, 0.38)" : "1px dashed rgba(148, 163, 184, 0.32)",
              background: items.length ? "linear-gradient(110deg, rgba(13, 148, 136, 0.15), rgba(99, 102, 241, 0.10))" : "rgba(16, 23, 34, 0.72)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
              minWidth: 0,
            }}
          >
            {items.length > 0 && items[selectedCartIndex] ? (
              <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  color: "#5eead4",
                  background: "rgba(45, 212, 191, 0.14)",
                  border: "1px solid rgba(45, 212, 191, 0.24)",
                  fontSize: 17,
                  fontWeight: 800,
                }}>{selectedCartIndex + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5eead4", marginBottom: 3 }}>
                    {locale === "ar" ? "المنتج المحدد" : locale === "fr" ? "PRODUIT SÉLECTIONNÉ" : "SELECTED PRODUCT"}
                  </div>
                  <div title={items[selectedCartIndex].name} style={{ fontSize: 14, fontWeight: 750, color: "var(--text-primary, #f8fafc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "min(48vw, 520px)" }}>
                    {items[selectedCartIndex].name || (locale === "ar" ? "منتج بدون اسم" : locale === "fr" ? "Produit sans nom" : "Unnamed product")}
                    {items[selectedCartIndex].isCartonLine && (
                      <span style={{ marginInlineStart: 8, color: "#5eead4", fontSize: 10, fontWeight: 800 }}>
                        {locale === "ar" ? "كرتونة" : locale === "fr" ? "CARTON" : "CARTON"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18, flexShrink: 0 }}>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", marginBottom: 3 }}>
                    {items[selectedCartIndex].weighedSale ? (locale === "ar" ? ({ kg: "سعر الكيلوغرام", g: "سعر الغرام", l: "سعر اللتر", liter: "سعر اللتر", ml: "سعر الملليلتر", m: "سعر المتر", meter: "سعر المتر", cm: "سعر السنتيمتر" }[String(items[selectedCartIndex].unitLabel || items[selectedCartIndex].unit || "kg").toLowerCase()] || "سعر الوحدة") : locale === "fr" ? "PRIX / UNITÉ MESURÉE" : "PRICE / MEASURED UNIT") : (locale === "ar" ? "سعر الحبة" : locale === "fr" ? "PRIX UNIT." : "UNIT PRICE")}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>
                    {money(items[selectedCartIndex].price).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </div>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", marginBottom: 3 }}>
                    {locale === "ar" ? "الكمية" : locale === "fr" ? "QTÉ" : "QTY"}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", fontVariantNumeric: "tabular-nums" }}>
                    {items[selectedCartIndex].weighedSale ? (() => { const q = getQuantity(items[selectedCartIndex]); const unit = String(items[selectedCartIndex].unitLabel || items[selectedCartIndex].unit || "kg").toLowerCase(); if (unit === "kg" && q > 0 && q < 1) return `${Math.round(q * 1000)} غ`; if (["l", "liter"].includes(unit) && q > 0 && q < 1) return `${Math.round(q * 1000)} مل`; if (["m", "meter"].includes(unit) && q > 0 && q < 1) return `${Math.round(q * 100)} سم`; return `${Number(q.toFixed(3))} ${items[selectedCartIndex].unitLabel || items[selectedCartIndex].unit || "kg"}`; })() : getQuantity(items[selectedCartIndex])}
                  </div>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted, #94a3b8)", marginBottom: 3 }}>
                    {locale === "ar" ? "المجموع" : locale === "fr" ? "TOTAL LIGNE" : "LINE TOTAL"}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#5eead4", fontVariantNumeric: "tabular-nums" }}>
                    {(getQuantity(items[selectedCartIndex]) * money(items[selectedCartIndex].price) - Math.min(getQuantity(items[selectedCartIndex]) * money(items[selectedCartIndex].price), money(items[selectedCartIndex].discount))).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                  </div>
                </div>
              </div>
              </>
            ) : (
              <div className="pos-selected-product-empty" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", textAlign: "center" }}>
                <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 34, height: 34, flex: "0 0 34px", borderRadius: 10, color: "#94a3b8", background: "rgba(148, 163, 184, 0.08)", border: "1px solid rgba(148, 163, 184, 0.16)" }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <strong style={{ color: "#dbe5f1", fontSize: 12, fontWeight: 750 }}>
                    {locale === "ar" ? "قائمة المنتجات فارغة" : locale === "fr" ? "La liste est vide" : "Product list is empty"}
                  </strong>
                  <span style={{ color: "#8494aa", fontSize: 10 }}>
                    {locale === "ar" ? "امسح الباركود أو ابحث عن منتج لإضافته إلى الفاتورة." : locale === "fr" ? "Scannez un code-barres ou recherchez un produit pour l'ajouter." : "Scan a barcode or search for a product to add it to the invoice."}
                  </span>
                </span>
              </div>
            )}
          </section>
            </>}
          />

            <SalesSidebar
            statusCards={
              <div className="pos-heading-status-cards">
                <section className="pos-user-status-card" aria-label="Current user">
                  <span className="pos-status-card-icon"><UserRound size={17} /></span>
                  <span className="pos-status-card-copy">
                    <small>{locale === "ar" ? "المستخدم الحالي" : locale === "fr" ? "Utilisateur actuel" : "CURRENT USER"}</small>
                    <strong>{currentUserName || localStorage.getItem("veltro_current_user") || "User"}</strong>
                  </span>
                </section>
                <section className={`pos-server-status-card ${serverConnected ? "is-connected" : "is-disconnected"}`} role="status" aria-live="polite">
                  <span className="pos-status-card-icon">{serverConnected ? <Wifi size={17} /> : <WifiOff size={17} />}</span>
                  <span className="pos-status-card-copy">
                    <small>{locale === "ar" ? "السيرفر الرئيسي" : locale === "fr" ? "SERVEUR PRINCIPAL" : "MAIN SERVER"}</small>
                    <strong>{serverConnected ? (locale === "ar" ? "متصل" : locale === "fr" ? "Connecté" : "Connected") : (locale === "ar" ? "غير متصل" : locale === "fr" ? "Déconnecté" : "Disconnected")}</strong>
                  </span>
                  <span className="pos-server-status-dot" />
                </section>
              </div>
            }
              invoiceNumber={invoice.invoiceNumber}
              onPreviousInvoice={() => navigateAllInvoices("previous")}
              onNextInvoice={() => navigateAllInvoices("next")}
              previousInvoiceNumber={
                closedInvoiceMode === null
                  ? closedInvoices[Math.min(1, closedInvoices.length - 1)]?.invoiceNumber || ""
                  : closedInvoices[closedInvoiceIndex + 1]?.invoiceNumber || ""
              }
              nextInvoiceNumber={
                closedInvoiceMode === null
                  ? closedInvoices[0]?.invoiceNumber || ""
                  : closedInvoices[closedInvoiceIndex - 1]?.invoiceNumber || ""
              }
              pendingInvoiceCount={pendingInvoices.length}
              customer={customer}
              customerReference={isAnonymousCustomer ? "" : String(invoice.customerId || "")}
              locale={locale}
              onCustomerChange={(value) => {
                const selectedName = String(value ?? "").trim();
                const anonymous = !selectedName || selectedName.toLowerCase() === "anonyme";
                updateInvoice({
                  customerName: anonymous ? "Anonyme" : selectedName,
                  customerId: anonymous ? "" : selectedName,
                });
              }}
              paid={paid}
              onPaidChange={(value) =>
                updateInvoice({ paid: money(value) })
              }
              remaining={remaining}
              newAmount={total}
              invoiceDate={invoice.createdAt}
              previousDebt={previousDebt}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
