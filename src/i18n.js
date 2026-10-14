const dictionaries = {
  en: {},
  fr: {
    "Add product":"Ajouter un produit","Edit product":"Modifier le produit","Product name":"Nom du produit","Name":"Nom","Barcode":"Code-barres","SKU":"Référence","Category":"Catégorie","Unit":"Unité","Stock":"Stock","Quantity":"Quantité","Min stock":"Stock minimum","Purchase price":"Prix d'achat","Selling price":"Prix de vente","Retail price":"Prix de détail","Wholesale price":"Prix de gros","Carton price":"Prix du carton","Pieces per carton":"Pièces par carton","Image":"Image","Save":"Enregistrer","Save changes":"Enregistrer les modifications","Cancel":"Annuler","Close":"Fermer","Delete":"Supprimer","Edit":"Modifier","Add":"Ajouter","Search":"Rechercher","Search products...":"Rechercher des produits...","Search product...":"Rechercher un produit...","Search supplier name or phone...":"Rechercher un fournisseur par nom ou téléphone...","All categories":"Toutes les catégories","All":"Tout","Actions":"Actions","Status":"Statut","Date":"Date","Time":"Heure","Customer":"Client","Supplier":"Fournisseur","Employee":"Employé","Invoice":"Facture","Invoice number":"Numéro de facture","Total":"Total","Subtotal":"Sous-total","Discount":"Remise","Paid":"Payé","Remaining":"Restant","Payment":"Paiement","Payment method":"Mode de paiement","Cash":"Espèces","Credit":"Crédit","Notes":"Notes","Phone":"Téléphone","Address":"Adresse","Email":"E-mail","Reference":"Référence","Price":"Prix","Profit":"Bénéfice","Benefits":"Bénéfices","Sales":"Ventes","Purchases":"Achats","Products":"Produits","Inventory":"Inventaire","Supplier List":"Liste des fournisseurs","Supplier Debts":"Dettes fournisseurs","Sales History":"Historique des ventes","Purchase History":"Historique des achats","New invoice":"Nouvelle facture","Modify Invoice":"Modifier la facture","Print Invoice":"Imprimer la facture","Customer Choice":"Choisir un client","Pending invoices":"Factures en attente","Add to invoice":"Ajouter à la facture","Complete sale":"Finaliser la vente","Confirm sale":"Confirmer la vente","No products added":"Aucun produit ajouté","No products found":"Aucun produit trouvé","No results found":"Aucun résultat trouvé","Loading...":"Chargement...","Please wait...":"Veuillez patienter...","Success":"Succès","Error":"Erreur","Warning":"Avertissement","Confirm":"Confirmer","Are you sure?":"Êtes-vous sûr ?","Required field":"Champ obligatoire","This field is required.":"Ce champ est obligatoire.","Product added successfully.":"Produit ajouté avec succès.","Product updated successfully.":"Produit modifié avec succès.","Product deleted successfully.":"Produit supprimé avec succès.","Supplier added successfully.":"Fournisseur ajouté avec succès.","Supplier updated successfully.":"Fournisseur modifié avec succès.","Supplier name is required.":"Le nom du fournisseur est obligatoire.","Please enter a valid phone number.":"Veuillez saisir un numéro de téléphone valide.","Could not save supplier data. Please check browser storage.":"Impossible d'enregistrer les fournisseurs. Vérifiez le stockage du navigateur.","This supplier has financial records. Keep the account to protect purchase history and balances.":"Ce fournisseur possède des opérations financières. Conservez son compte pour protéger l'historique et les soldes.","Delete supplier":"Supprimer le fournisseur","New purchase":"Nouvel achat","Purchase invoice":"Facture d'achat","Purchase date":"Date d'achat","Sales invoice":"Facture de vente","Completed sale details":"Détails de la vente terminée","Walk-in customer":"Client de passage","Not recorded":"Non enregistré","Start date":"Date de début","End date":"Date de fin","Start time":"Heure de début","End time":"Heure de fin","All customers":"Tous les clients","All suppliers":"Tous les fournisseurs","All employees":"Tous les employés","Reset filters":"Réinitialiser les filtres","Invoice number, customer or employee...":"N° de facture, client ou employé...","Select a date range, time range, customer or employee.":"Sélectionnez une période, des horaires, un client ou un employé.","No invoices found":"Aucune facture trouvée","View details":"Voir les détails","Export":"Exporter","Import":"Importer","Refresh":"Actualiser","Scan barcode":"Scanner le code-barres","Generate barcode":"Générer un code-barres","Expiry date":"Date d'expiration","Low stock":"Stock faible","Out of stock":"Rupture de stock","In stock":"En stock","Total products":"Nombre total de produits","Total sales":"Ventes totales","Total purchases":"Achats totaux","Outstanding balance":"Solde impayé","Supplier balances":"Soldes fournisseurs","Purchase invoices":"Factures d'achat","Search supplier name or phone...":"Rechercher un fournisseur par nom ou téléphone...","This invoice has no products.":"Cette facture ne contient aucun produit.","The operation could not be completed.":"L'opération n'a pas pu être effectuée.","Anonyme":"Client anonyme","Anonymous":"Client anonyme","Today":"Aujourd'hui","Yesterday":"Hier","This week":"Cette semaine","This month":"Ce mois-ci","From":"De","To":"À","Apply":"Appliquer","Clear":"Effacer","Back":"Retour","Next":"Suivant","Previous":"Précédent","Total outstanding":"Total impayé","Suppliers with records":"Fournisseurs avec opérations","Outstanding balance shown for the listed suppliers":"Solde impayé des fournisseurs affichés","Suppliers matching the current filter":"Fournisseurs correspondant au filtre actuel","Invoices linked by supplier name":"Factures associées au nom du fournisseur","Show all suppliers":"Afficher tous les fournisseurs","No supplier records":"Aucun enregistrement fournisseur","Delete supplier?":"Supprimer ce fournisseur ?","Supplier deleted.":"Fournisseur supprimé.","Dismiss":"Fermer","COMMERCE / CONTACTS":"COMMERCE / CONTACTS","COMMERCE / SUPPLIERS":"COMMERCE / FOURNISSEURS","Supplier Debts":"Dettes fournisseurs","Review outstanding supplier balances and purchase invoices.":"Consultez les soldes fournisseurs et les factures d'achat impayées.","Supplier balances":"Soldes fournisseurs","Select the search filter to find a supplier by name or phone.":"Recherchez un fournisseur par nom ou téléphone.",
    "Search by supplier name or phone...":"Rechercher par nom ou téléphone du fournisseur...",
    "No matching suppliers":"Aucun fournisseur correspondant","No suppliers yet":"Aucun fournisseur pour le moment",
    "Try another name or phone number.":"Essayez un autre nom ou numéro de téléphone.",
    "Add your first supplier to create your contact list.":"Ajoutez votre premier fournisseur pour créer votre liste de contacts.",
    "No phone number":"Aucun numéro de téléphone","Add new supplier":"Ajouter un fournisseur","Enter supplier name":"Saisir le nom du fournisseur",
    "Add supplier":"Ajouter le fournisseur","Edit supplier":"Modifier le fournisseur","Delete supplier":"Supprimer le fournisseur",
    "Search Results":"Résultats de recherche","All Products":"Tous les produits","Search categories...":"Rechercher des catégories...",
    "Clear category search":"Effacer la recherche de catégorie","This product is out of stock":"Ce produit est en rupture de stock",
    "Configure pieces per carton for this product":"Configurez le nombre de pièces par carton pour ce produit","Not set":"Non défini",
    "Add one unit":"Ajouter une unité","Product pages":"Pages de produits","Remove product":"Retirer le produit",
    "Payment received in DA":"Paiement reçu (DA)","Enter payment amount":"Saisir le montant du paiement",
    "Scan or enter barcode, then press Enter...":"Scannez ou saisissez le code-barres, puis appuyez sur Entrée...",
    "Search by name, reference, category or barcode...":"Rechercher par nom, référence, catégorie ou code-barres...",
    "Clear barcode":"Effacer le code-barres","Clear product search":"Effacer la recherche de produits",
    "Close categories":"Fermer les catégories","All categories":"Toutes les catégories",
    "New Invoice":"Nouvelle facture","Print Invoice":"Imprimer la facture","Customer Choice":"Choisir un client","Pending Invoices":"Factures en attente",
    "Administrator":"Administrateur","Enter payment amount":"Saisir le montant du paiement",
    "An empty invoice cannot be saved as pending.":"Une facture vide ne peut pas être mise en attente.",
    "Invoice saved to Pending Invoices.":"Facture enregistrée dans les factures en attente.",
    "A new invoice is ready.":"Une nouvelle facture est prête.","Empty invoice closed. New invoice created.":"Facture vide fermée. Une nouvelle facture a été créée.",
    "Product not found in the current inventory.":"Produit introuvable dans le stock actuel.",
    "Quantity must be at least one unit.":"La quantité doit être d'au moins une unité.",
    "Price and discount must be zero or greater.":"Le prix et la remise doivent être positifs ou nuls.",
    "This product has no carton quantity configured.":"Le nombre de pièces par carton n'est pas configuré pour ce produit.",
    "Add products before completing the sale.":"Ajoutez des produits avant de finaliser la vente.",
    "Sale completed and inventory updated.":"Vente finalisée et stock mis à jour.",
    "Add products before printing.":"Ajoutez des produits avant l'impression.",
    "Incorrect password.":"Mot de passe incorrect.","An invoice must contain at least one product.":"Une facture doit contenir au moins un produit.",
    "Invoice discount cannot be negative.":"La remise de la facture ne peut pas être négative.",
    "Paid amount cannot be negative.":"Le montant payé ne peut pas être négatif.",
    "The paid amount cannot exceed the invoice total.":"Le montant payé ne peut pas dépasser le total de la facture.",
    "Saving...":"Enregistrement...","Save invoice changes":"Enregistrer les modifications de la facture",
    "Invoice updated and inventory adjusted successfully.":"Facture modifiée et stock ajusté avec succès.",
    "Sale deleted and stock quantities restored successfully.":"Vente supprimée et quantités du stock restaurées.",
    "Could not save the restored stock. The sale was not deleted.":"Impossible d'enregistrer le stock restauré. La vente n'a pas été supprimée.",
    "Could not delete the sale. Please try again.":"Impossible de supprimer la vente. Réessayez.",
    "Could not find this sale.":"Vente introuvable.","Unnamed product":"Produit sans nom",
    "Products loaded, but local browser storage could not be updated.":"Produits chargés, mais le stockage local du navigateur n'a pas pu être mis à jour.",
    "Products loaded and synchronized.":"Produits chargés et synchronisés.","Cloud sync unavailable. Your saved local products are still available.":"Synchronisation cloud indisponible. Vos produits locaux restent disponibles.",
    "Barcode scanning is not supported by this browser. You can enter the code manually.":"La lecture des codes-barres n'est pas prise en charge par ce navigateur. Saisissez le code manuellement.",
    "Camera access is unavailable in this browser.":"L'accès à la caméra est indisponible dans ce navigateur.",
    "Barcode scanned. Save the product to keep the change.":"Code-barres scanné. Enregistrez le produit pour conserver la modification.",
    "Unable to open the camera. Allow camera access or enter the barcode manually.":"Impossible d'ouvrir la caméra. Autorisez son accès ou saisissez le code-barres manuellement.",
    "Unable to save. Check your browser storage.":"Enregistrement impossible. Vérifiez le stockage du navigateur.",
    "Enter or scan an additional barcode first.":"Saisissez ou scannez d'abord un code-barres supplémentaire.",
    "This barcode is already assigned to this product.":"Ce code-barres est déjà associé à ce produit.",
    "This barcode is already used by another product.":"Ce code-barres est déjà utilisé par un autre produit.",
    "Additional barcode added to the form.":"Code-barres supplémentaire ajouté au formulaire.",
    "Please select an image file.":"Veuillez sélectionner un fichier image.",
    "Please choose an image smaller than 8 MB.":"Choisissez une image de moins de 8 Mo.",
    "Please enter a product name.":"Veuillez saisir le nom du produit.",
    "This SKU already exists.":"Cette référence existe déjà.",
    "Product deleted.":"Produit supprimé.","Delete product":"Supprimer le produit",
    "Are you sure you want to delete ":"Voulez-vous vraiment supprimer ",
    "Please select a valid image file.":"Veuillez sélectionner un fichier image valide.",
    "Image file is too large. Choose an image under 2 MB.":"L'image est trop volumineuse. Choisissez une image de moins de 2 Mo.",
    "Enter the product name.":"Saisissez le nom du produit.",
    "Enter the primary barcode or generate one automatically.":"Saisissez le code-barres principal ou générez-le automatiquement.",
    "Invalid EAN-13 number. Check the check digit.":"Numéro EAN-13 invalide. Vérifiez la clé de contrôle.",
    "Enter a quantity greater than zero.":"Saisissez une quantité supérieure à zéro.",
    "Check the purchase price.":"Vérifiez le prix d'achat.",
    "Edit Product Details":"Modifier les détails du produit","Add Product to Purchase":"Ajouter un produit à l'achat",
    "Changes remain temporary until the purchase invoice is successfully closed.":"Les modifications restent temporaires jusqu'à la validation de la facture d'achat.",
    "Product Name":"Nom du produit","Primary Barcode":"Code-barres principal","Scan or enter barcode":"Scannez ou saisissez le code-barres",
    "Generate EAN-13":"Générer un EAN-13","Remove barcode":"Supprimer le code-barres","New additional barcode":"Nouveau code-barres supplémentaire",
    "Number of Cartons":"Nombre de cartons","Units per Carton":"Unités par carton","Total Units":"Total des unités",
    "Carton Purchase Price (DA)":"Prix d'achat du carton (DA)","Unit Purchase Price (DA)":"Prix d'achat unitaire (DA)",
    "Retail Sale Price (DA)":"Prix de vente au détail (DA)","Wholesale Sale Price (DA)":"Prix de vente en gros (DA)",
    "Carton Sale Price (Manual)":"Prix de vente du carton (manuel)","Enter scanner result here":"Saisissez ici le résultat du scanner",
    "Search supplier name or phone...":"Rechercher un fournisseur par nom ou téléphone...",
    "Invoice Summary":"Résumé de la facture",
    "Review the amounts before completing the sale":"Vérifiez les montants avant de finaliser la vente",
    "Invoice Items":"Articles de la facture",
    "Invoice items":"Articles de la facture",
    "Product Entry":"Saisie de produit",
    "Find products in your current inventory":"Rechercher des produits dans le stock actuel",
    "Purchase Activity":"Activité des achats",
    "Compare invoice totals with amounts paid.":"Comparez le total des factures aux montants payés.",
    "Purchase Items":"Articles achetés",
    "SUPPLIER CONTACTS":"CONTACTS FOURNISSEURS",
    "Enter the supplier's name and phone number.":"Saisissez le nom et le numéro de téléphone du fournisseur.",
    "RECORDS & PAYMENTS":"HISTORIQUE ET PAIEMENTS",
    "Review invoices, payments, and outstanding balances.":"Consultez les factures, les paiements et les soldes impayés.",
    "Sales Invoice":"Facture de vente",
    "product":"produit",
    "products":"produits",
    "Edit supplier":"Modifier le fournisseur",
    "Add new supplier":"Ajouter un fournisseur",
    "Invoice Summary":"Résumé de la facture",
    "No supplier records":"Aucun enregistrement fournisseur",
    "Search Results":"Résultats de recherche",
    "Total Units":"Total des unités",
    "Paid amount":"Montant payé",
    "Outstanding balance":"Solde impayé",
    "Supplier Details":"Détails du fournisseur",
    "Purchase Details":"Détails de l'achat",
    "Sale Details":"Détails de la vente",
    "Invoice Details":"Détails de la facture",
    "Recent activity":"Activité récente",
    "Top products":"Meilleurs produits",
    "Sales overview":"Aperçu des ventes",
    "Purchase overview":"Aperçu des achats",
    "Point of Sale":"Point de vente",
    "Manage invoices, products and payments.":"Gérez les factures, les produits et les paiements.",
    "Invoice Information":"Informations sur la facture",
    "Invoice Number":"Numéro de facture",
    "Current User":"Utilisateur actuel",
    "Customer & Account":"Client et compte",
    "Customer Name":"Nom du client",
    "Previous Debt":"Dette précédente",
    "Paid Amount":"Montant payé",
    "Remaining Amount":"Montant restant",
    "New Amount":"Nouveau montant",
    "Payment Received (DA)":"Paiement reçu (DA)",
    "SALES TERMINAL":"TERMINAL DE VENTE",
    "Search Product":"Rechercher un produit",
    "Selected category":"Catégorie sélectionnée",
    "Search by name, reference, category or barcode...":"Rechercher par nom, référence, catégorie ou code-barres...",
    "Showing":"Affichage",
    "of":"sur",
    "No products added yet":"Aucun produit ajouté pour le moment",
    "Scan a barcode or search for a product above":"Scannez un code-barres ou recherchez un produit ci-dessus",
    "to start a new invoice.":"pour commencer une nouvelle facture.",
    "ITEMS":"ARTICLES",
    "Global Discount (DA)":"Remise globale (DA)",
    "Invoice Total":"Total de la facture",
    "Remaining on Invoice":"Reste à payer sur la facture",
    "Save Pending":"Enregistrer en attente",
    "Complete Sale":"Finaliser la vente",
    "Please verify the payment and total before finalizing the invoice.":"Veuillez vérifier le paiement et le total avant de finaliser la facture.",
    "Final amount due":"Montant final dû",
    "TOTAL AMOUNT":"MONTANT TOTAL",
    "Search by name, reference, category or barcode...":"Rechercher par nom, référence, catégorie ou code-barres...",
    "products added":"produits ajoutés",
    "product added":"produit ajouté",
    "All products":"Tous les produits",
    "Hide Products":"Masquer les produits",
    "2 products loaded from your inventory.":"2 produits chargés depuis votre stock.",
    "Sales Operator":"Opérateur de vente",
    "Previous Customer Debt":"Dette précédente du client",
    "Total Debt After Sale":"Dette totale après la vente",
    "Add Unit":"Ajouter une unité",
    "Add Carton":"Ajouter un carton",
    "Add one unit":"Ajouter une unité",
    "Carton":"Carton",
    "carton":"carton",
    "cartons":"cartons",
    "pcs":"pièces",
    "loose":"à l'unité",
    "unit":"unité",
    "units":"unités",
    "total units":"unités au total",
    "added":"ajouté",
    "Product":"Produit",
    "Unit Price":"Prix unitaire",
    "Previous Customer Debt":"Dette précédente du client",
    "Customer":"Client",
    "Undo":"Annuler",
    "removed":"retiré",
    "Added one carton of ":"Un carton de ",
    " products loaded from your inventory.":" produits chargés depuis votre stock.",
    "Hide Products":"Masquer les produits",
    "Show Products":"Afficher les produits",
    "Refresh":"Actualiser",
    "Refreshing...":"Actualisation...",
    "SALES TERMINAL":"TERMINAL DE VENTE",
    "Outstanding":"Impayé","Settled":"Réglé","No products added":"Aucun produit ajouté",
    "Search completed invoices, inspect details, print or edit a sale.": "Rechercher des factures terminées, consulter les détails, imprimer ou modifier une vente.",
    "Total Sales": "Ventes totales",
    "Based on filtered invoices": "Selon les factures filtrées",
    "Invoices": "Factures",
    "Completed sales": "Ventes terminées",
    "Customers": "Clients",
    "In the current results": "Dans les résultats actuels",
    "Unpaid Balance": "Solde impayé",
    "Remaining invoice balances": "Soldes restants des factures",
    "Filter invoices": "Filtrer les factures",
    "INVOICE": "FACTURE",
    "CUSTOMER": "CLIENT",
    "EMPLOYEE": "EMPLOYÉ",
    "DATE & TIME": "DATE ET HEURE",
    "TOTAL": "TOTAL",
    "PAID": "PAYÉ",
    "REMAINING": "RESTANT",
    "ACTIONS": "ACTIONS",
    "No completed sales yet": "Aucune vente terminée pour le moment",
    "Completed invoices from Point of Sale will appear here.": "Les factures terminées du point de vente apparaîtront ici.",
    "Showing 0 of 0 filtered invoices (0 total)": "Affichage de 0 sur 0 facture filtrée (0 au total)",
    "Export CSV": "Exporter CSV",
    "View invoice": "Voir la facture",
    "Print invoice": "Imprimer la facture",
    "Edit invoice": "Modifier la facture",
  },
  ar: {
    "Add product":"إضافة منتج","Edit product":"تعديل المنتج","Product name":"اسم المنتج","Name":"الاسم","Barcode":"الباركود","SKU":"المرجع","Category":"الفئة","Unit":"الوحدة","Stock":"المخزون","Quantity":"الكمية","Min stock":"الحد الأدنى للمخزون","Purchase price":"سعر الشراء","Selling price":"سعر البيع","Retail price":"سعر التجزئة","Wholesale price":"سعر الجملة","Carton price":"سعر الكرتون","Pieces per carton":"عدد القطع في الكرتون","Image":"الصورة","Save":"حفظ","Save changes":"حفظ التعديلات","Cancel":"إلغاء","Close":"إغلاق","Delete":"حذف","Edit":"تعديل","Add":"إضافة","Search":"بحث","Search products...":"ابحث عن المنتجات...","Search product...":"ابحث عن منتج...","Search supplier name or phone...":"ابحث باسم المورد أو رقم هاتفه...","All categories":"كل الفئات","All":"الكل","Actions":"الإجراءات","Status":"الحالة","Date":"التاريخ","Time":"الوقت","Customer":"الزبون","Supplier":"المورد","Employee":"الموظف","Invoice":"الفاتورة","Invoice number":"رقم الفاتورة","Total":"الإجمالي","Subtotal":"المجموع الفرعي","Discount":"التخفيض","Paid":"المدفوع","Remaining":"المتبقي","Payment":"الدفع","Payment method":"طريقة الدفع","Cash":"نقدًا","Credit":"دين","Notes":"ملاحظات","Phone":"الهاتف","Address":"العنوان","Email":"البريد الإلكتروني","Reference":"المرجع","Price":"السعر","Profit":"الربح","Benefits":"الأرباح","Sales":"المبيعات","Purchases":"المشتريات","Products":"المنتجات","Inventory":"المخزون","Supplier List":"قائمة الموردين","Supplier Debts":"ديون الموردين","Sales History":"سجل المبيعات","Purchase History":"سجل المشتريات","New invoice":"فاتورة جديدة","Modify Invoice":"تعديل الفاتورة","Print Invoice":"طباعة الفاتورة","Customer Choice":"اختيار الزبون","Pending invoices":"الفواتير المعلقة","Add to invoice":"إضافة إلى الفاتورة","Complete sale":"إتمام البيع","Confirm sale":"تأكيد البيع","No products added":"لم تتم إضافة منتجات","No products found":"لم يتم العثور على منتجات","No results found":"لا توجد نتائج","Loading...":"جارٍ التحميل...","Please wait...":"يرجى الانتظار...","Success":"نجاح","Error":"خطأ","Warning":"تنبيه","Confirm":"تأكيد","Are you sure?":"هل أنت متأكد؟","Required field":"حقل مطلوب","This field is required.":"هذا الحقل مطلوب.","Product added successfully.":"تمت إضافة المنتج بنجاح.","Product updated successfully.":"تم تعديل المنتج بنجاح.","Product deleted successfully.":"تم حذف المنتج بنجاح.","Supplier added successfully.":"تمت إضافة المورد بنجاح.","Supplier updated successfully.":"تم تعديل المورد بنجاح.","Supplier name is required.":"اسم المورد مطلوب.","Please enter a valid phone number.":"يرجى إدخال رقم هاتف صحيح.","Could not save supplier data. Please check browser storage.":"تعذر حفظ بيانات الموردين. تحقق من مساحة تخزين المتصفح.","This supplier has financial records. Keep the account to protect purchase history and balances.":"لدى هذا المورد سجلات مالية. احتفظ بحسابه لحماية سجل المشتريات والأرصدة.","Delete supplier":"حذف المورد","New purchase":"عملية شراء جديدة","Purchase invoice":"فاتورة شراء","Purchase date":"تاريخ الشراء","Sales invoice":"فاتورة بيع","Completed sale details":"تفاصيل عملية البيع المكتملة","Walk-in customer":"زبون مباشر","Not recorded":"غير مسجل","Start date":"تاريخ البداية","End date":"تاريخ النهاية","Start time":"وقت البداية","End time":"وقت النهاية","All customers":"كل الزبائن","All suppliers":"كل الموردين","All employees":"كل الموظفين","Reset filters":"إعادة ضبط عوامل التصفية","Invoice number, customer or employee...":"رقم الفاتورة أو الزبون أو الموظف...","Select a date range, time range, customer or employee.":"حدد نطاق التاريخ والوقت أو الزبون أو الموظف.","No invoices found":"لم يتم العثور على فواتير","View details":"عرض التفاصيل","Export":"تصدير","Import":"استيراد","Refresh":"تحديث","Scan barcode":"مسح الباركود","Generate barcode":"إنشاء باركود","Expiry date":"تاريخ الصلاحية","Low stock":"مخزون منخفض","Out of stock":"نفد المخزون","In stock":"متوفر في المخزون","Total products":"إجمالي المنتجات","Total sales":"إجمالي المبيعات","Total purchases":"إجمالي المشتريات","Outstanding balance":"الرصيد المستحق","Supplier balances":"أرصدة الموردين","Purchase invoices":"فواتير الشراء","This invoice has no products.":"لا تحتوي هذه الفاتورة على منتجات.","The operation could not be completed.":"تعذر إتمام العملية.","Anonyme":"زبون مجهول","Anonymous":"زبون مجهول","Today":"اليوم","Yesterday":"أمس","This week":"هذا الأسبوع","This month":"هذا الشهر","From":"من","To":"إلى","Apply":"تطبيق","Clear":"مسح","Back":"رجوع","Next":"التالي","Previous":"السابق","Total outstanding":"إجمالي المستحقات","Suppliers with records":"الموردون ذوو السجلات","Outstanding balance shown for the listed suppliers":"الرصيد المستحق للموردين المعروضين","Suppliers matching the current filter":"الموردون المطابقون للتصفية الحالية","Invoices linked by supplier name":"الفواتير المرتبطة باسم المورد","Show all suppliers":"عرض جميع الموردين","No supplier records":"لا توجد سجلات للموردين","Delete supplier?":"هل تريد حذف المورد؟","Supplier deleted.":"تم حذف المورد.","Dismiss":"إخفاء","COMMERCE / CONTACTS":"التجارة / جهات الاتصال","COMMERCE / SUPPLIERS":"التجارة / الموردون","Review outstanding supplier balances and purchase invoices.":"مراجعة أرصدة الموردين والفواتير المستحقة.","Select the search filter to find a supplier by name or phone.":"ابحث عن المورد بالاسم أو رقم الهاتف.",
    "Search by supplier name or phone...":"ابحث باسم المورد أو رقم هاتفه...",
    "No matching suppliers":"لا يوجد موردون مطابقون","No suppliers yet":"لا يوجد موردون حتى الآن",
    "Try another name or phone number.":"جرّب اسمًا أو رقم هاتف آخر.",
    "Add your first supplier to create your contact list.":"أضف أول مورد لإنشاء قائمة جهات الاتصال.",
    "No phone number":"لا يوجد رقم هاتف","Add new supplier":"إضافة مورد جديد","Enter supplier name":"أدخل اسم المورد",
    "Add supplier":"إضافة المورد","Edit supplier":"تعديل المورد","Delete supplier":"حذف المورد",
    "Search Results":"نتائج البحث","All Products":"كل المنتجات","Search categories...":"ابحث عن الفئات...",
    "Clear category search":"مسح البحث عن الفئات","This product is out of stock":"هذا المنتج غير متوفر في المخزون",
    "Configure pieces per carton for this product":"حدد عدد القطع في الكرتون لهذا المنتج","Not set":"غير محدد",
    "Add one unit":"إضافة وحدة واحدة","Product pages":"صفحات المنتجات","Remove product":"إزالة المنتج",
    "Payment received in DA":"المبلغ المستلم (دج)","Enter payment amount":"أدخل مبلغ الدفع",
    "Scan or enter barcode, then press Enter...":"امسح الباركود أو أدخله ثم اضغط Enter...",
    "Search by name, reference, category or barcode...":"ابحث بالاسم أو المرجع أو الفئة أو الباركود...",
    "Clear barcode":"مسح الباركود","Clear product search":"مسح بحث المنتجات",
    "Close categories":"إغلاق الفئات","All categories":"كل الفئات",
    "New Invoice":"فاتورة جديدة","Print Invoice":"طباعة الفاتورة","Customer Choice":"اختيار الزبون","Pending Invoices":"الفواتير المعلقة",
    "Administrator":"المدير","An empty invoice cannot be saved as pending.":"لا يمكن حفظ فاتورة فارغة ضمن الفواتير المعلقة.",
    "Invoice saved to Pending Invoices.":"تم حفظ الفاتورة ضمن الفواتير المعلقة.",
    "A new invoice is ready.":"فاتورة جديدة جاهزة.","Empty invoice closed. New invoice created.":"تم إغلاق الفاتورة الفارغة وإنشاء فاتورة جديدة.",
    "Product not found in the current inventory.":"المنتج غير موجود في المخزون الحالي.",
    "Quantity must be at least one unit.":"يجب أن تكون الكمية وحدة واحدة على الأقل.",
    "Price and discount must be zero or greater.":"يجب ألا يكون السعر أو التخفيض أقل من الصفر.",
    "This product has no carton quantity configured.":"لم يتم تحديد عدد القطع في كرتون هذا المنتج.",
    "Add products before completing the sale.":"أضف منتجات قبل إتمام البيع.",
    "Sale completed and inventory updated.":"تم إتمام البيع وتحديث المخزون.",
    "Add products before printing.":"أضف منتجات قبل الطباعة.",
    "Incorrect password.":"كلمة المرور غير صحيحة.","An invoice must contain at least one product.":"يجب أن تحتوي الفاتورة على منتج واحد على الأقل.",
    "Invoice discount cannot be negative.":"لا يمكن أن يكون تخفيض الفاتورة سالبًا.",
    "Paid amount cannot be negative.":"لا يمكن أن يكون المبلغ المدفوع سالبًا.",
    "The paid amount cannot exceed the invoice total.":"لا يمكن أن يتجاوز المبلغ المدفوع إجمالي الفاتورة.",
    "Saving...":"جارٍ الحفظ...","Save invoice changes":"حفظ تعديلات الفاتورة",
    "Invoice updated and inventory adjusted successfully.":"تم تعديل الفاتورة وتحديث المخزون بنجاح.",
    "Sale deleted and stock quantities restored successfully.":"تم حذف البيع واستعادة كميات المخزون بنجاح.",
    "Could not save the restored stock. The sale was not deleted.":"تعذر حفظ المخزون المستعاد. لم يتم حذف عملية البيع.",
    "Could not delete the sale. Please try again.":"تعذر حذف عملية البيع. حاول مجددًا.",
    "Could not find this sale.":"لم يتم العثور على عملية البيع.","Unnamed product":"منتج بلا اسم",
    "Products loaded, but local browser storage could not be updated.":"تم تحميل المنتجات، لكن تعذر تحديث التخزين المحلي للمتصفح.",
    "Products loaded and synchronized.":"تم تحميل المنتجات ومزامنتها.","Cloud sync unavailable. Your saved local products are still available.":"المزامنة السحابية غير متاحة. ما زالت منتجاتك المحفوظة محليًا متاحة.",
    "Barcode scanning is not supported by this browser. You can enter the code manually.":"هذا المتصفح لا يدعم مسح الباركود. يمكنك إدخال الرمز يدويًا.",
    "Camera access is unavailable in this browser.":"الوصول إلى الكاميرا غير متاح في هذا المتصفح.",
    "Barcode scanned. Save the product to keep the change.":"تم مسح الباركود. احفظ المنتج للاحتفاظ بالتغيير.",
    "Unable to open the camera. Allow camera access or enter the barcode manually.":"تعذر فتح الكاميرا. اسمح بالوصول إليها أو أدخل الباركود يدويًا.",
    "Unable to save. Check your browser storage.":"تعذر الحفظ. تحقق من مساحة تخزين المتصفح.",
    "Enter or scan an additional barcode first.":"أدخل باركودًا إضافيًا أو امسحه أولًا.",
    "This barcode is already assigned to this product.":"هذا الباركود مرتبط بهذا المنتج بالفعل.",
    "This barcode is already used by another product.":"هذا الباركود مستخدم لمنتج آخر بالفعل.",
    "Additional barcode added to the form.":"تمت إضافة الباركود الإضافي إلى النموذج.",
    "Please select an image file.":"يرجى اختيار ملف صورة.",
    "Please choose an image smaller than 8 MB.":"اختر صورة يقل حجمها عن 8 ميغابايت.",
    "Please enter a product name.":"يرجى إدخال اسم المنتج.",
    "This SKU already exists.":"هذا المرجع موجود بالفعل.",
    "Product deleted.":"تم حذف المنتج.","Delete product":"حذف المنتج",
    "Are you sure you want to delete ":"هل أنت متأكد أنك تريد حذف ",
    "Please select a valid image file.":"يرجى اختيار ملف صورة صالح.",
    "Image file is too large. Choose an image under 2 MB.":"حجم الصورة كبير جدًا. اختر صورة أقل من 2 ميغابايت.",
    "Enter the product name.":"أدخل اسم المنتج.",
    "Enter the primary barcode or generate one automatically.":"أدخل الباركود الأساسي أو أنشئه تلقائيًا.",
    "Invalid EAN-13 number. Check the check digit.":"رقم EAN-13 غير صالح. تحقق من رقم التحقق.",
    "Enter a quantity greater than zero.":"أدخل كمية أكبر من الصفر.",
    "Check the purchase price.":"تحقق من سعر الشراء.",
    "Edit Product Details":"تعديل تفاصيل المنتج","Add Product to Purchase":"إضافة منتج إلى المشتريات",
    "Changes remain temporary until the purchase invoice is successfully closed.":"تبقى التعديلات مؤقتة حتى إتمام فاتورة الشراء بنجاح.",
    "Product Name":"اسم المنتج","Primary Barcode":"الباركود الأساسي","Scan or enter barcode":"امسح الباركود أو أدخله",
    "Generate EAN-13":"إنشاء EAN-13","Remove barcode":"إزالة الباركود","New additional barcode":"باركود إضافي جديد",
    "Number of Cartons":"عدد الكراتين","Units per Carton":"الوحدات في الكرتون","Total Units":"إجمالي الوحدات",
    "Carton Purchase Price (DA)":"سعر شراء الكرتون (دج)","Unit Purchase Price (DA)":"سعر شراء الوحدة (دج)",
    "Retail Sale Price (DA)":"سعر البيع بالتجزئة (دج)","Wholesale Sale Price (DA)":"سعر البيع بالجملة (دج)",
    "Carton Sale Price (Manual)":"سعر بيع الكرتون (يدوي)","Enter scanner result here":"أدخل نتيجة الماسح هنا",
    "Invoice Summary":"ملخص الفاتورة",
    "Review the amounts before completing the sale":"راجع المبالغ قبل إتمام البيع",
    "Invoice Items":"عناصر الفاتورة",
    "Invoice items":"عناصر الفاتورة",
    "Product Entry":"إدخال المنتج",
    "Find products in your current inventory":"ابحث عن المنتجات في المخزون الحالي",
    "Purchase Activity":"نشاط المشتريات",
    "Compare invoice totals with amounts paid.":"قارن إجمالي الفواتير بالمبالغ المدفوعة.",
    "Purchase Items":"عناصر الشراء",
    "SUPPLIER CONTACTS":"جهات اتصال الموردين",
    "Enter the supplier's name and phone number.":"أدخل اسم المورد ورقم هاتفه.",
    "RECORDS & PAYMENTS":"السجلات والمدفوعات",
    "Review invoices, payments, and outstanding balances.":"راجع الفواتير والمدفوعات والأرصدة المستحقة.",
    "Sales Invoice":"فاتورة بيع",
    "product":"منتج",
    "products":"منتجات",
    "Edit supplier":"تعديل المورد",
    "Add new supplier":"إضافة مورد جديد",
    "No supplier records":"لا توجد سجلات للموردين",
    "Paid amount":"المبلغ المدفوع",
    "Outstanding balance":"الرصيد المستحق",
    "Supplier Details":"تفاصيل المورد",
    "Purchase Details":"تفاصيل الشراء",
    "Sale Details":"تفاصيل البيع",
    "Invoice Details":"تفاصيل الفاتورة",
    "Recent activity":"النشاط الأخير",
    "Top products":"أفضل المنتجات",
    "Sales overview":"نظرة عامة على المبيعات",
    "Purchase overview":"نظرة عامة على المشتريات",
    "Point of Sale":"نقطة البيع",
    "Manage invoices, products and payments.":"إدارة فواتير البيع والمنتجات والمدفوعات.",
    "Invoice Information":"معلومات الفاتورة",
    "Invoice Number":"رقم الفاتورة",
    "Current User":"المستخدم الحالي",
    "Customer & Account":"الزبون والحساب",
    "Customer Name":"اسم الزبون",
    "Previous Debt":"الدين السابق",
    "Paid Amount":"المبلغ المدفوع",
    "Remaining Amount":"المبلغ المتبقي",
    "New Amount":"المبلغ الجديد",
    "Payment Received (DA)":"المبلغ المستلم (دج)",
    "SALES TERMINAL":"واجهة البيع",
    "Search Product":"البحث عن منتج",
    "Selected category":"الفئة المحددة",
    "Search by name, reference, category or barcode...":"ابحث بالاسم أو المرجع أو الفئة أو الباركود...",
    "Showing":"عرض",
    "of":"من",
    "No products added yet":"لم تتم إضافة أي منتجات بعد",
    "Scan a barcode or search for a product above":"امسح الباركود أو ابحث عن منتج أعلاه",
    "to start a new invoice.":"لبدء فاتورة جديدة.",
    "ITEMS":"عناصر",
    "Global Discount (DA)":"التخفيض الإجمالي (دج)",
    "Invoice Total":"إجمالي الفاتورة",
    "Remaining on Invoice":"المتبقي من الفاتورة",
    "Save Pending":"حفظ كمعلّقة",
    "Complete Sale":"إتمام البيع",
    "Please verify the payment and total before finalizing the invoice.":"يرجى التحقق من المبلغ المدفوع والإجمالي قبل إتمام الفاتورة.",
    "Final amount due":"المبلغ النهائي المستحق",
    "TOTAL AMOUNT":"المبلغ الإجمالي",
    "products added":"منتجات مضافة",
    "product added":"منتج مضاف",
    "All products":"كل المنتجات",
    "Hide Products":"إخفاء المنتجات",
    "2 products loaded from your inventory.":"تم تحميل منتجين من المخزون.",
    "Sales Operator":"موظف المبيعات",
    "Previous Customer Debt":"الدين السابق للزبون",
    "Total Debt After Sale":"إجمالي الدين بعد البيع",
    "Add Unit":"إضافة وحدة",
    "Add Carton":"إضافة كرتون",
    "Add one unit":"إضافة وحدة واحدة",
    "Carton":"كرتون",
    "carton":"كرتون",
    "cartons":"كراتين",
    "pcs":"قطع",
    "loose":"مفرد",
    "unit":"وحدة",
    "units":"وحدات",
    "total units":"إجمالي الوحدات",
    "added":"مضاف",
    "Product":"المنتج",
    "Unit Price":"سعر الوحدة",
    "Undo":"تراجع",
    "removed":"تمت إزالته",
    " products loaded from your inventory.":" منتجات تم تحميلها من المخزون.",
    "Hide Products":"إخفاء المنتجات",
    "Show Products":"إظهار المنتجات",
    "Refresh":"تحديث",
    "Refreshing...":"جارٍ التحديث...",
    "Scan with Camera":"المسح بالكاميرا",
    "Barcode":"الباركود",
    "Category":"الفئة",
    "Quantity":"الكمية",
    "Total":"الإجمالي",
    "Outstanding":"غير مدفوع","Settled":"مسدد",
    "Search completed invoices, inspect details, print or edit a sale.": "ابحث عن الفواتير المكتملة، واطّلع على تفاصيلها أو اطبعها أو عدّل عملية البيع.",
    "Total Sales": "إجمالي المبيعات",
    "Based on filtered invoices": "حسب الفواتير المصفّاة",
    "Invoices": "الفواتير",
    "Completed sales": "المبيعات المكتملة",
    "Customers": "الزبائن",
    "In the current results": "في النتائج الحالية",
    "Unpaid Balance": "الرصيد غير المدفوع",
    "Remaining invoice balances": "المبالغ المتبقية في الفواتير",
    "Filter invoices": "تصفية الفواتير",
    "INVOICE": "الفاتورة",
    "CUSTOMER": "الزبون",
    "EMPLOYEE": "الموظف",
    "DATE & TIME": "التاريخ والوقت",
    "TOTAL": "الإجمالي",
    "PAID": "المدفوع",
    "REMAINING": "المتبقي",
    "ACTIONS": "الإجراءات",
    "No completed sales yet": "لا توجد مبيعات مكتملة حتى الآن",
    "Completed invoices from Point of Sale will appear here.": "ستظهر هنا الفواتير المكتملة من نقطة البيع.",
    "Showing 0 of 0 filtered invoices (0 total)": "عرض 0 من 0 فاتورة بعد التصفية (الإجمالي 0)",
    "Export CSV": "تصدير CSV",
    "View invoice": "عرض الفاتورة",
    "Print invoice": "طباعة الفاتورة",
    "Edit invoice": "تعديل الفاتورة",
  }
};

const attributes = ["placeholder", "title", "aria-label", "aria-description"];
const originalText = new WeakMap();
const originalAttributes = new WeakMap();

export function translatePage(locale, root = document.body) {
  if (!root || !dictionaries[locale]) return;
  const dictionary = dictionaries[locale];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,textarea,[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    let record = originalText.get(node);
    if (!record || node.nodeValue !== record.rendered) {
      record = { source: node.nodeValue, rendered: node.nodeValue };
      originalText.set(node, record);
    }
    const original = record.source;
    const trimmed = original.trim();
    let translated = dictionary[trimmed] || trimmed;

    // Translate dynamic POS notices and count strings.
    if (!dictionary[trimmed] && locale === "ar") {
      let match = trimmed.match(/^Added one carton of (.+) at (.+)\.$/i);
      if (match) translated = `تمت إضافة كرتون واحد من ${match[1]} بسعر ${match[2]}.`;
      match = trimmed.match(/^(\d+) products loaded from your inventory\.$/i);
      if (match) translated = `تم تحميل ${match[1]} منتجات من المخزون.`;
      match = trimmed.match(/^(\d+) product loaded from your inventory\.$/i);
      if (match) translated = `تم تحميل ${match[1]} منتج من المخزون.`;
    } else if (!dictionary[trimmed] && locale === "fr") {
      let match = trimmed.match(/^Added one carton of (.+) at (.+)\.$/i);
      if (match) translated = `Un carton de ${match[1]} a été ajouté au prix de ${match[2]}.`;
      match = trimmed.match(/^(\d+) products loaded from your inventory\.$/i);
      if (match) translated = `${match[1]} produits chargés depuis votre stock.`;
      match = trimmed.match(/^(\d+) product loaded from your inventory\.$/i);
      if (match) translated = `${match[1]} produit chargé depuis votre stock.`;
    }

    // Translate common count/pagination labels whose numbers change at runtime.
    if (!dictionary[trimmed] && locale === "ar") {
      let match = trimmed.match(/^(\d+)\s+ITEMS$/i);
      if (match) translated = Number(match[1]) === 1 ? "عنصر واحد" : `${match[1]} عناصر`;
      match = trimmed.match(/^(\d+)\s+products added$/i);
      if (match) translated = `${match[1]} منتجات مضافة`;
      match = trimmed.match(/^(\d+)\s+product added$/i);
      if (match) translated = `${match[1]} منتج مضاف`;
      match = trimmed.match(/^Showing\s+(\d+)–(\d+)\s+of\s+(\d+)\s+filtered invoices?\s+\((\d+)\s+total\)$/i);
      if (match) translated = `عرض ${match[1]}–${match[2]} من ${match[3]} فاتورة بعد التصفية (الإجمالي ${match[4]})`;
      match = trimmed.match(/^Showing\s+(\d+)\s+of\s+(\d+)\s+filtered invoices?\s+\((\d+)\s+total\)$/i);
      if (match) translated = `عرض ${match[1]} من ${match[2]} فاتورة بعد التصفية (الإجمالي ${match[3]})`;
      match = trimmed.match(/^Showing\s+(\d+)–(\d+)\s+of\s+(\d+)$/i);
      if (match) translated = `عرض ${match[1]}–${match[2]} من ${match[3]}`;
    } else if (!dictionary[trimmed] && locale === "fr") {
      let match = trimmed.match(/^(\d+)\s+ITEMS$/i);
      if (match) translated = Number(match[1]) === 1 ? "1 article" : `${match[1]} articles`;
      match = trimmed.match(/^(\d+)\s+products added$/i);
      if (match) translated = `${match[1]} produits ajoutés`;
      match = trimmed.match(/^(\d+)\s+product added$/i);
      if (match) translated = `${match[1]} produit ajouté`;
      match = trimmed.match(/^Showing\s+(\d+)–(\d+)\s+of\s+(\d+)\s+filtered invoices?\s+\((\d+)\s+total\)$/i);
      if (match) translated = `Affichage de ${match[1]}–${match[2]} sur ${match[3]} factures filtrées (${match[4]} au total)`;
      match = trimmed.match(/^Showing\s+(\d+)\s+of\s+(\d+)\s+filtered invoices?\s+\((\d+)\s+total\)$/i);
      if (match) translated = `Affichage de ${match[1]} sur ${match[2]} factures filtrées (${match[3]} au total)`;
      match = trimmed.match(/^Showing\s+(\d+)–(\d+)\s+of\s+(\d+)$/i);
      if (match) translated = `Affichage ${match[1]}–${match[2]} sur ${match[3]}`;
    }
    const next = original.replace(trimmed, translated);
    if (node.nodeValue !== next) node.nodeValue = next;
    record.rendered = next;
  });

  root.querySelectorAll("*").forEach((element) => {
    if (!originalAttributes.has(element)) originalAttributes.set(element, {});
    const saved = originalAttributes.get(element);
    attributes.forEach((attribute) => {
      const current = element.getAttribute(attribute);
      let record = saved[attribute];
      if (!record || current !== record.rendered) {
        record = { source: current, rendered: current };
        saved[attribute] = record;
      }
      if (record.source === null) return;
      const translated = dictionary[record.source] || record.source;
      if (current !== translated) element.setAttribute(attribute, translated);
      record.rendered = translated;
    });
  });
}
