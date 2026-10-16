
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, UserRound, Phone, Fingerprint, Users, Check, UserRoundPlus, BadgeCheck, ReceiptText, WalletCards, AlertTriangle, Hash, CalendarClock, Clock, ChevronRight, ClipboardList, Maximize2, Minimize2 } from "lucide-react";

import { SalesToolbar } from "./sales/components/SalesToolbar";
import { SalesSidebar } from "./sales/components/SalesSidebar";
import { ProductEntry } from "./sales/components/ProductEntry";
import { InvoiceTable } from "./sales/components/InvoiceTable";
import { InvoiceSummary } from "./sales/components/InvoiceSummary";

import {
  createInvoice,
  getAutoSavedDraft,
  saveAutoSavedDraft,
  getPendingInvoices,
  savePendingInvoice,
  getPendingInvoice,
  completeSale,
  getCustomerDebt,
  getCompletedSales,
} from "./sales/salesStore.js";

import { getProducts } from "./productStore.js";
import { saveProductsToCloud } from "./lib/productCloud.js";
import { saveSaleToCloud } from "./lib/salesCloud.js";
import { supabase } from "./lib/supabase.js";
import { loadCustomersFromCloud } from "./lib/customerCloud.js";

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
    discount: money(product.discount),
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

  const index = currentItems.findIndex(
    (item) => getProductId(item) === productId
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
  const [invoice, setInvoice] = useState(() => getAutoSavedDraft() || createInvoice());
  const [draftIdentity, setDraftIdentity] = useState(() => currentUserId && organizationId ? { userId: currentUserId, organizationId } : null);
  const [draftCloudReady, setDraftCloudReady] = useState(false);

  const [pendingInvoices, setPendingInvoices] = useState(
    () => getPendingInvoices()
  );

  const [showProducts, setShowProducts] = useState(true);
  const [showPending, setShowPending] = useState(false);
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
  const [showBelowCostWarning, setShowBelowCostWarning] = useState(false);
  const [belowCostItems, setBelowCostItems] = useState([]);
  const [paidDraft, setPaidDraft] = useState("0");

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === posPageRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

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

  const items = invoice.items || [];
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
    if (!draftCloudReady || !draftIdentity?.userId || !draftIdentity?.organizationId) return undefined;
    const timeoutId = window.setTimeout(() => {
      saveCloudInvoiceDraft(draftIdentity.organizationId, draftIdentity.userId, {
        ...invoice, subtotal, total, paid, remaining, status: "Draft",
      }).catch((error) => console.warn("VELTRO-PRO could not sync the invoice draft to Supabase:", error));
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [draftCloudReady, draftIdentity?.userId, draftIdentity?.organizationId, invoice, subtotal, total, paid, remaining]);

  // Persist every unconfirmed invoice change immediately. The draft lives
  // separately from the pending-invoice list and is restored on next launch.
  useEffect(() => {
    saveAutoSavedDraft({
      ...invoice,
      subtotal,
      total,
      paid,
      remaining,
      status: "Draft",
    });
  }, [invoice, subtotal, total, paid, remaining]);

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
    ]
  );

  // A new invoice can only be created after the current invoice has products.
  // Non-empty invoices are saved as pending before the next invoice is created.
  const createNewInvoice = () => {
    if (busy) return;

    if (items.length === 0) {
      notify(
        "Add at least one product to the current invoice before creating a new invoice.",
        "error"
      );
      return;
    }

    setShowPending(false);
    setShowEmptyWarning(false);

    if (!saveCurrentAsPending(true)) {
      return;
    }

    setInvoice(createInvoice());
    setRemovedItem(null);

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
    const productId = getProductId(product);

    const inventoryProduct = getProducts().find(
      (item) => String(item.id) === productId
    );

    if (!inventoryProduct) {
      notify("Product not found in the current inventory.", "error");
      return;
    }

    const quantityToAdd = Math.max(
      1,
      Math.floor(Number(product.quantity) || 1)
    );

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
      notify(
        `${inventoryProduct.name}: only ${Math.max(
          0,
          available - currentQuantity
        )} additional units are available.`,
        "error"
      );

      return;
    }

    setInvoice((current) => ({
      ...current,
      items: mergeItems(
        current.items || [],
        inventoryProduct,
        quantityToAdd
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));
    setShowEmptyWarning(false);
    setRemovedItem(null);
    notify(currentQuantity > 0 ? "Quantity updated for " + inventoryProduct.name + ": " + currentQuantity + " → " + (currentQuantity + quantityToAdd) + "." : "Added " + inventoryProduct.name + " to invoice.", "success");
  };

  const updateItem = (id, field, value) => {
    const currentItem = items.find(
      (item) => String(item.id) === String(id)
    );

    if (!currentItem) return;

    if (field === "quantity") {
      const rawQuantity = Number(value);

      if (!Number.isFinite(rawQuantity) || rawQuantity < 1) {
        notify("Quantity must be at least one unit.", "error");
        return;
      }

      const quantity = Math.floor(rawQuantity);
      if (quantity === getQuantity(currentItem)) return;

      const available = getAvailableForProduct(
        getProductId(currentItem),
        currentItem.id
      );

      if (quantity > available) {
        notify(
          `${currentItem.name}: only ${available} units are available for this line.`,
          "error"
        );
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

      if (field === "price") notify("Price updated for " + currentItem.name + ": " + previousValue.toFixed(2) + " → " + nextValue.toFixed(2) + " DA.", "success");
    }
  };

  const addUnit = (item) => {
    updateItem(item.id, "quantity", getQuantity(item) + 1);
  };

  const addCarton = (item) => {
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

    if (cartonSize > remainingStock) {
      notify(
        `${inventoryProduct.name}: one carton needs ${cartonSize} units, but only ${remainingStock} units are available for this invoice.`,
        "error"
      );
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
  };

  const removeItem = (id) => {
    const removed = items.find(
      (item) => String(item.id) === String(id)
    );

    if (!removed) return;

    setRemovedItem({
      item: { ...removed },
      invoiceId: invoice.id,
    });

    setInvoice((current) => ({
      ...current,
      items: (current.items || []).filter(
        (item) => String(item.id) !== String(id)
      ),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    }));

    notify(`${removed.name} removed. You can undo this action.`, "info");
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

  const filteredCustomerRecords = customerRecords.filter((record) => {
    const query = customerSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    return [
      record.name, record.customerId, record.id, record.phone, record.phoneNumber,
      record.code, record.reference, record.ref, record.customerCode,
    ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
  });

  const openPendingInvoice = (pendingId) => {
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

  const confirmSaleCompletion = async () => {
    if (busy) return;
    setShowSaleReview(false);
    setShowSaleConfirm(false);
    setBusy(true);
    try {
      const result = completeSale({
        ...invoice,
        subtotal,
        total,
        paid,
        remaining,
        customerName: customer,
        customerId: isAnonymousCustomer ? "" : invoice.customerId,
        status: "Completed",
      });
      if (!result.ok) {
        notify(getErrorMessage(result), "error");
        return;
      }

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
      if (draftIdentity?.userId && draftIdentity?.organizationId) {
        try {
          await deleteCloudInvoiceDraft(draftIdentity.organizationId, draftIdentity.userId);
        } catch (draftError) {
          console.warn("VELTRO-PRO could not clear the completed cloud draft:", draftError);
        }
      }

      // completeSale deducts stock locally. Persist that exact updated stock
      // to Supabase as well, otherwise the Products screen can reload stale
      // cloud quantities and appear to undo the sale.
      setInvoice(createInvoice());
      setRemovedItem(null);
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

  const printInvoice = () => {
    if (items.length === 0) {
      notify("Add products before printing.", "error");
      return;
    }

    window.print();
  };

  const toggleFullscreen = async () => {
    const page = posPageRef.current;
    if (!page) return;

    try {
      if (document.fullscreenElement === page) {
        await document.exitFullscreen();
      } else {
        await page.requestFullscreen();
      }
    } catch (error) {
      console.error("Could not toggle full-screen POS mode:", error);
      notify("Full-screen mode is unavailable in this browser or permission context.", "error");
    }
  };

  return (
    <div ref={posPageRef} className={`pos-page${isFullscreen ? " pos-fullscreen-active" : ""}`}>
      <header className="pos-heading">
        <div>
          <div className="pos-eyebrow">VELTRO-PRO / COMMERCE</div>
          <h1>Point of Sale</h1>
          <p>Manage invoices, products and payments.</p>
        </div>
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

      <SalesToolbar
        onNew={createNewInvoice}
        onPrint={printInvoice}
        onCustomer={chooseCustomer}
        onPending={() => setShowPending((current) => !current)}
        pendingCount={pendingInvoices.length}
        showPending={showPending}
        newDisabled={items.length === 0}
        disabled={busy}
        message={message ? translatePosMessage(message, locale) : ""}
        messageType={messageType}
        onDismissMessage={() => setMessage("")}
        onUndo={removedItem ? () => undoRemove(removedItem.item) : undefined}
        undoLabel={translatePosMessage("Undo", locale)}
        dismissLabel={translatePosMessage("Dismiss message", locale)}
      />

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
                <h2 id="pending-invoices-title">Pending Invoices</h2>
                <p>Choose a saved invoice to continue working on it.</p>
              </div>
              <span className="pending-invoices-count">{pendingInvoices.length}</span>
              <button
                type="button"
                className="pending-invoices-close"
                onClick={() => setShowPending(false)}
                aria-label="Close pending invoices"
              >
                <X size={18} />
              </button>
            </header>

            {pendingInvoices.length === 0 ? (
              <div className="pending-invoices-empty">
                <span className="pending-invoices-empty-icon"><ClipboardList size={25} /></span>
                <strong>No pending invoices yet</strong>
                <p>Invoices saved for later will appear here.</p>
              </div>
            ) : (
              <div className="pending-invoices-table-wrap">
                <div className="pending-invoices-list-heading">
                  <span>INVOICE DETAILS</span>
                  <span>AMOUNT</span>
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
                        className="pending-invoices-row"
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
              <span>{pendingInvoices.length} saved invoice{pendingInvoices.length === 1 ? "" : "s"}</span>
              <button type="button" onClick={() => setShowPending(false)}>Close</button>
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
                <h2 id="below-cost-title">Warning: selling below purchase cost</h2>
                <p>Some products are priced below their recorded purchase cost. This sale may cause a loss.</p>
              </div>
              <button
                type="button"
                className="sale-confirm-close"
                onClick={() => setShowBelowCostWarning(false)}
                disabled={busy}
                aria-label="Close warning"
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
                      Qty: {item.quantity} · Loss per unit: {item.lossPerUnit.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                    </small>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <strong>{item.sellingPrice.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong>
                    <small style={{ display: "block", marginTop: 4 }}>
                      Cost: {item.purchaseCost.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA
                    </small>
                  </span>
                </div>
              ))}
            </div>

            <p className="sale-confirm-note">
              Do you want to continue with this sale anyway?
            </p>
            <footer className="sale-confirm-actions">
              <button
                type="button"
                className="sale-confirm-secondary"
                onClick={() => setShowBelowCostWarning(false)}
                disabled={busy}
              >
                Cancel sale
              </button>
              <button
                type="button"
                className="sale-confirm-primary"
                onClick={openSaleConfirmation}
                disabled={busy}
              >
                Continue anyway <Check size={16} />
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
                <h2 id="sale-confirm-title">{showSaleReview ? "Review customer account" : "Confirm sale completion"}</h2>
                <p>{showSaleReview ? "Review the balance and invoice amounts before proceeding." : "Please confirm that you want to finalize this sale."}</p>
              </div>
              <button type="button" className="sale-confirm-close" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(false); }} disabled={busy} aria-label="Close"><X size={18} /></button>
            </header>
            {showSaleReview ? (
              <>
                <div className="sale-confirm-customer">
                  <span className="sale-confirm-customer-avatar"><UserRound size={18} /></span>
                  <span className="sale-confirm-customer-name"><small>Selected customer</small><strong>{customer}</strong></span>
                  <span className="sale-confirm-invoice-number">{invoice.invoiceNumber}</span>
                </div>
                <div className="sale-confirm-amounts">
                  <div className="sale-confirm-amount-row"><span><WalletCards size={15} /> Previous debt</span><strong>{previousDebt.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row"><span><ReceiptText size={15} /> Invoice total</span><strong>{total.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-amount-row sale-confirm-paid-row"><label htmlFor="review-paid-amount"><Check size={15} /> Amount paid</label><div className="sale-confirm-paid-input-wrap"><input id="review-paid-amount" className="sale-confirm-paid-input" type="number" inputMode="decimal" min="0" max={total} step="any" value={paidDraft} disabled={busy} onFocus={() => { if (paidDraft === "0" || paidDraft === "0.00") setPaidDraft(""); }} onChange={(event) => setPaidDraft(event.target.value)} onBlur={() => { const value = paidDraft.trim() === "" ? 0 : Number(paidDraft); if (Number.isFinite(value)) { setPaidDraft(String(value)); updateInvoice({ paid: value }); } else { setPaidDraft(String(paid)); }} } aria-label="Amount paid in DA" /><span>DA</span></div></div>
                  <div className="sale-confirm-amount-row current"><span><AlertTriangle size={15} /> Current unpaid amount</span><strong>{remaining.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                  <div className="sale-confirm-total-debt"><span>Total debt after this sale</span><strong>{(previousDebt + remaining).toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                </div>
                <p className="sale-confirm-note">The next step will ask you to confirm completion of this invoice.</p>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleReview(false)}>Back to invoice</button>
                  <button type="button" className="sale-confirm-primary" onClick={() => { setShowSaleReview(false); setShowSaleConfirm(true); }}>Continue <Check size={16} /></button>
                </footer>
              </>
            ) : (
              <>
                <div className="sale-confirm-message">
                  <span className="sale-confirm-message-icon"><AlertTriangle size={21} /></span>
                  <div><strong>Complete invoice {invoice.invoiceNumber}?</strong><p>{isAnonymousCustomer ? "This sale will be recorded under Anonyme. No previous customer debt will be applied." : `This sale will be recorded for ${customer}. Please verify the amounts before finalizing.`}</p></div>
                </div>
                <div className="sale-confirm-final-amount"><span>Invoice total</span><strong>{total.toLocaleString(document.documentElement.lang === "ar" ? "ar-DZ" : document.documentElement.lang === "fr" ? "fr-DZ" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DA</strong></div>
                <footer className="sale-confirm-actions">
                  <button type="button" className="sale-confirm-secondary" onClick={() => setShowSaleConfirm(false)} disabled={busy}>Cancel</button>
                  <button type="button" className="sale-confirm-primary" onClick={confirmSaleCompletion} disabled={busy}>{busy ? "Completing..." : <> <Check size={16} /> Confirm sale </>}</button>
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
                <h2 id="customer-picker-title">Select customer</h2>
                <p>Search by name, phone number, customer ID or reference.</p>
              </div>
              <button type="button" className="customer-picker-close" onClick={() => setShowCustomerPicker(false)} aria-label="Close customer selection">
                <X size={19} />
              </button>
            </header>

            <div className="customer-picker-search">
              <Search size={18} />
              <input
                autoFocus
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Name, phone, ID or reference..."
                aria-label="Search customers"
              />
              {customerSearch && (
                <button type="button" onClick={() => setCustomerSearch("")} aria-label="Clear search"><X size={15} /></button>
              )}
            </div>

            <button type="button" className="customer-picker-anonymous" onClick={() => selectCustomer({ name: "Anonyme" })}>
              <span className="customer-picker-avatar anonymous"><UserRound size={18} /></span>
              <span className="customer-picker-record-copy">
                <strong>Anonyme</strong>
                <small>Walk-in customer · No customer debt tracking</small>
              </span>
              {String(customer).toLowerCase() === "anonyme" && <Check size={18} />}
            </button>

            <div className="customer-picker-list-heading">
              <span>Customer list</span>
              <span>{filteredCustomerRecords.length} {filteredCustomerRecords.length === 1 ? "customer" : "customers"}</span>
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
                  <strong>{customerSearch ? "No matching customers" : "No saved customers yet"}</strong>
                  <p>{customerSearch ? "Try another name, phone number, ID or reference." : "Customers from previous invoices will appear here. You can still use Anonyme for a quick sale."}</p>
                </div>
              )}
            </div>

            <footer className="customer-picker-footer">
              <span><Users size={14} /> Choose a customer to link this invoice to their account.</span>
              <button type="button" onClick={() => setShowCustomerPicker(false)}>Cancel</button>
            </footer>
          </section>
        </div>
      )}

      <div className="sales-layout">
        <SalesSidebar
          invoiceNumber={invoice.invoiceNumber}
          customer={customer}
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

        <main className="sales-workspace">
          <ProductEntry
            onAddProduct={addProduct}
            onAddCarton={addCarton}
            showProducts={showProducts}
            onShowProducts={setShowProducts}
          />

          <InvoiceTable
            items={items}
            onUpdate={updateItem}
            onRemove={removeItem}
            onUndoRemove={undoRemove}
            onAddUnit={addUnit}
            onAddCarton={addCarton}
          />

          <InvoiceSummary
            currentUser={currentUserName || localStorage.getItem("veltro_current_user") || "User"}
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
        </main>
      </div>
    </div>
  );
}
