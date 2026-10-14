import { useEffect } from "react";

const words = {
  fr: {
    "Product Entry":"Saisie des produits","Find products in your current inventory":"Rechercher des produits dans le stock actuel","Scan with Camera":"Scanner avec la caméra","Barcode":"Code-barres","Search Product":"Rechercher un produit","Search Results":"Résultats de recherche","All Products":"Tous les produits","Category":"Catégorie","Selected category":"Catégorie sélectionnée","All categories":"Toutes les catégories","Choose a category":"Choisir une catégorie","Filter the product list by category":"Filtrer la liste par catégorie","Search categories...":"Rechercher des catégories...","No categories found":"Aucune catégorie trouvée","Try a different search.":"Essayez une autre recherche.","Show all products":"Afficher tous les produits","No products found in your inventory.":"Aucun produit trouvé dans le stock.","Try refreshing the inventory.":"Essayez d’actualiser le stock.","No matching products found.":"Aucun produit correspondant trouvé.","Try another name, reference or barcode.":"Essayez un autre nom, une référence ou un code-barres.","Carton":"Carton","Not set":"Non défini","Out of stock":"Rupture de stock","Add":"Ajouter","Invoice Items":"Articles de la facture","No products added yet":"Aucun produit ajouté","Product":"Produit","Quantity":"Quantité","Unit Price":"Prix unitaire","Invoice Summary":"Résumé de la facture","Review the amounts before completing the sale":"Vérifiez les montants avant de terminer la vente","Subtotal":"Sous-total","Invoice Total":"Total de la facture","Payment Received (DA)":"Montant reçu (DA)","Previous Customer Debt":"Dette client précédente","Total Debt After Sale":"Dette totale après la vente","Customer":"Client","Final amount due":"Montant final à payer","Sales History":"Historique des ventes","Completed sale details":"Détails de la vente terminée","Sales Invoice":"Facture de vente","Employee":"Employé","Manager authorization":"Autorisation du responsable","Manager password":"Mot de passe du responsable","Customer name":"Nom du client","Amount paid (DA)":"Montant payé (DA)","Invoice discount (DA)":"Remise sur facture (DA)","Invoice items":"Articles de la facture","Filter invoices":"Filtrer les factures","All customers":"Tous les clients","All employees":"Tous les employés","INVOICE":"FACTURE","CUSTOMER":"CLIENT","EMPLOYEE":"EMPLOYÉ","DATE & TIME":"DATE ET HEURE","PAID":"PAYÉ","REMAINING":"RESTANT","ACTIONS":"ACTIONS","Suppliers List":"Liste des fournisseurs","Supplier Debts":"Dettes fournisseurs","Supplier directory":"Répertoire des fournisseurs","Supplier name":"Nom du fournisseur","Phone number":"Numéro de téléphone","Actions":"Actions","SUPPLIER CONTACTS":"CONTACTS FOURNISSEURS","Enter the supplier's name and phone number.":"Saisissez le nom et le numéro de téléphone du fournisseur.","Review outstanding supplier balances and purchase invoices.":"Consultez les soldes fournisseurs et les factures d’achat.","Total outstanding":"Total impayé","Suppliers with records":"Fournisseurs avec historique","Purchase invoices":"Factures d’achat","Supplier balances":"Soldes fournisseurs","No supplier debts found":"Aucune dette fournisseur trouvée","Supplier":"Fournisseur","Phone":"Téléphone","Invoices":"Factures","Outstanding":"Impayé","Status":"Statut","Purchases":"Achats","Purchase Dashboard":"Tableau de bord des achats","Purchase and payment overview":"Vue d’ensemble des achats et paiements","Product Prices":"Prix des produits","Today's Purchases":"Achats du jour","Paid Today":"Payé aujourd’hui","Purchase Activity":"Activité des achats","Total Purchases":"Total des achats","Amount Paid":"Montant payé","Recent Purchase Invoices":"Factures d’achat récentes","Print Product Price Labels":"Imprimer les étiquettes de prix","Reference":"Référence","Sale Price":"Prix de vente","Print":"Imprimer","Remove":"Supprimer","Previous Debt":"Dette précédente","Invoice Number":"Numéro de facture","Items":"Articles","Cancel":"Annuler","Save":"Enregistrer","Search...":"Rechercher..."
  },
  ar: {
    "Product Entry":"إدخال المنتجات","Find products in your current inventory":"ابحث عن المنتجات في المخزون الحالي","Scan with Camera":"المسح بالكاميرا","Barcode":"الباركود","Search Product":"البحث عن منتج","Search Results":"نتائج البحث","All Products":"كل المنتجات","Category":"الفئة","Selected category":"الفئة المحددة","All categories":"كل الفئات","Choose a category":"اختر فئة","Filter the product list by category":"تصفية قائمة المنتجات حسب الفئة","Search categories...":"البحث عن الفئات...","No categories found":"لم يتم العثور على فئات","Try a different search.":"جرّب بحثًا مختلفًا.","Show all products":"عرض كل المنتجات","No products found in your inventory.":"لم يتم العثور على منتجات في المخزون.","Try refreshing the inventory.":"جرّب تحديث المخزون.","No matching products found.":"لم يتم العثور على منتجات مطابقة.","Try another name, reference or barcode.":"جرّب اسمًا أو مرجعًا أو باركود آخر.","Carton":"كرتون","Not set":"غير محدد","Out of stock":"نفد المخزون","Add":"إضافة","Invoice Items":"منتجات الفاتورة","No products added yet":"لم تتم إضافة منتجات بعد","Product":"المنتج","Quantity":"الكمية","Unit Price":"سعر الوحدة","Invoice Summary":"ملخص الفاتورة","Review the amounts before completing the sale":"راجع المبالغ قبل إتمام البيع","Subtotal":"المجموع الفرعي","Invoice Total":"إجمالي الفاتورة","Payment Received (DA)":"المبلغ المستلم (دج)","Previous Customer Debt":"ديون العميل السابقة","Total Debt After Sale":"إجمالي الدين بعد البيع","Customer":"العميل","Final amount due":"المبلغ النهائي المستحق","Sales History":"سجل المبيعات","Completed sale details":"تفاصيل عملية البيع المكتملة","Sales Invoice":"فاتورة بيع","Employee":"الموظف","Manager authorization":"موافقة المسؤول","Manager password":"كلمة مرور المسؤول","Customer name":"اسم العميل","Amount paid (DA)":"المبلغ المدفوع (دج)","Invoice discount (DA)":"تخفيض الفاتورة (دج)","Invoice items":"منتجات الفاتورة","Filter invoices":"تصفية الفواتير","All customers":"كل العملاء","All employees":"كل الموظفين","INVOICE":"الفاتورة","CUSTOMER":"العميل","EMPLOYEE":"الموظف","DATE & TIME":"التاريخ والوقت","PAID":"المدفوع","REMAINING":"المتبقي","ACTIONS":"الإجراءات","Suppliers List":"قائمة الموردين","Supplier Debts":"ديون الموردين","Supplier directory":"دليل الموردين","Supplier name":"اسم المورد","Phone number":"رقم الهاتف","Actions":"الإجراءات","SUPPLIER CONTACTS":"جهات اتصال الموردين","Enter the supplier's name and phone number.":"أدخل اسم المورد ورقم هاتفه.","Review outstanding supplier balances and purchase invoices.":"راجع أرصدة الموردين المستحقة وفواتير الشراء.","Total outstanding":"إجمالي المستحقات","Suppliers with records":"الموردون ذوو السجلات","Purchase invoices":"فواتير الشراء","Supplier balances":"أرصدة الموردين","No supplier debts found":"لا توجد ديون موردين","Supplier":"المورد","Phone":"الهاتف","Invoices":"الفواتير","Outstanding":"المستحق","Status":"الحالة","Purchases":"المشتريات","Purchase Dashboard":"لوحة المشتريات","Purchase and payment overview":"نظرة عامة على المشتريات والمدفوعات","Product Prices":"أسعار المنتجات","Today's Purchases":"مشتريات اليوم","Paid Today":"المدفوع اليوم","Purchase Activity":"نشاط المشتريات","Total Purchases":"إجمالي المشتريات","Amount Paid":"المبلغ المدفوع","Recent Purchase Invoices":"فواتير الشراء الأخيرة","Print Product Price Labels":"طباعة ملصقات أسعار المنتجات","Reference":"المرجع","Sale Price":"سعر البيع","Print":"طباعة","Remove":"حذف","Previous Debt":"الدين السابق","Invoice Number":"رقم الفاتورة","Items":"العناصر","Cancel":"إلغاء","Save":"حفظ","Search...":"بحث..."
  }
};

export default function LocaleTranslator({ locale }) {
  useEffect(() => {
    const dictionary = words[locale];
    if (!dictionary) return undefined;
    const originals = new WeakMap();
    const translateNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (!originals.has(node)) originals.set(node, node.nodeValue);
        const original = originals.get(node);
        const trimmed = original.trim();
        if (dictionary[trimmed]) {
          const lead = original.match(/^\\s*/)?.[0] || "";
          const trail = original.match(/\\s*$/)?.[0] || "";
          node.nodeValue = lead + dictionary[trimmed] + trail;
        } else {
          node.nodeValue = original;
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      for (const child of node.childNodes) translateNode(child);
      for (const attr of ["placeholder", "title", "aria-label"]) {
        const value = node.getAttribute(attr);
        if (value && dictionary[value]) {
          if (!node.hasAttribute("data-locale-original-" + attr)) node.setAttribute("data-locale-original-" + attr, value);
          node.setAttribute(attr, dictionary[node.getAttribute("data-locale-original-" + attr)] || node.getAttribute("data-locale-original-" + attr));
        }
      }
    };
    translateNode(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translateNode(record.target);
        for (const node of record.addedNodes || []) translateNode(node);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);
  return null;
}
