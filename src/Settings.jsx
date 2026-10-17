import React, { useEffect, useMemo, useState } from "react";
import {
  Building2, UsersRound, ShieldCheck, MapPinned, SlidersHorizontal,
  RefreshCw, Search, Mail, Phone, CheckCircle2, AlertCircle,
  Languages, Store, KeyRound, ChevronRight, UserRound, Database, Save, Pencil, X,
  Package, Scale, Star, Plus, Trash2, Volume2,
} from "lucide-react";
import { supabase } from "./lib/supabase.js";
import { getSoundSettings, playSound, saveSoundSettings, setSoundUser } from "./services/soundService.js";
import { getProducts } from "./productStore.js";

const copy = {
  en: {
    eyebrow: "WORKSPACE CONTROL CENTER", title: "Settings",
    subtitle: "Manage your business workspace, users, access rules, and branches.",
    business: "Business profile", users: "Users & roles", permissions: "Permissions",
    branches: "Branches", preferences: "Preferences", productSettings: "Product Settings", soundSettings: "Sound Settings", soundSettingsText: "Configure strong, modern audio feedback for scans, edits, deletion, confirmations, sales, and alerts.", soundEnabled: "Enable interactive sounds", soundVolume: "Volume", soundBarcode: "Barcode scan successful", soundSale: "Sale completed", soundErrors: "Errors and invalid actions", soundAlerts: "Stock and server alerts", soundPrice: "Price changed", soundQuantity: "Quantity changed", soundDelete: "Product deleted", soundConfirm: "Action confirmed", soundPreview: "Preview sound", soundSaved: "Sound preferences saved for this user on this device.", soundHint: "Some browsers require a click or keypress before audio can play.", overview: "Workspace overview",
    productSettingsText: "Manage the weighed-sale screen and arrange weighed products in its tiles.", layoutTitle: "Weighed-sale tile layout", layoutText: "Only products marked for measured sale in product entry appear here. Drag a tile to set its position in the sales screen.", dragHint: "Drag products between squares to change their order in the sale screen.", noWeighedProducts: "No products are marked for measured sale. Edit a product and enable measured sale first.", poundGrams: "Pound size (grams)", categories: "Product categories", newCategory: "New category name", addCategory: "Add category", visibleCategories: "Show this category on the weigh-sale screen", renameCategory: "Category name", deleteCategory: "Delete category", productList: "Product assignment", productListText: "Choose which products appear in quick-sale tiles and assign each weighed product to a category.", favorite: "Favorite", weighed: "Sell by weight", category: "Category", uncategorized: "Uncategorized", saveProductSettings: "Save product settings", productSettingsSaved: "Product settings saved on this device.", noProducts: "No products found in the product catalog.",
    overviewText: "Your organization and account setup at a glance.",
    organization: "Organization", status: "Status", active: "Active", suspended: "Suspended",
    currentAccount: "Current account", accountName: "Account name", email: "Email address",
    phone: "Phone number", role: "Role", accountStatus: "Account status",
    editProfile: "Edit profile", saveChanges: "Save changes", cancel: "Cancel",
    profileName: "Full name", profileSaved: "Profile updated successfully.",
    profileSaveError: "Could not save profile changes. Please try again.",
    nameRequired: "Please enter your name.", saving: "Saving…", createdAt: "Created on",
    team: "Team members", teamText: "Accounts linked to this organization.",
    searchUsers: "Search by name, phone, or role…", noUsers: "No team members were found.",
    addWorker: "Add worker", workerName: "Full name", workerEmail: "Email address", workerPhone: "Phone number", temporaryPassword: "Initial password", assignRole: "Assign role", createWorker: "Create account", workerCreated: "Worker account created successfully.", workerCreateError: "Could not create worker account",
    roleCatalog: "Role catalog", roleCatalogText: "Roles configured for this organization.",
    systemRole: "System role", customRole: "Custom role", noRoles: "No roles found.",
    addRole: "Create role", roleName: "Role name", roleDescription: "Description", createRole: "Create role",
    editPermissions: "Configure permissions", chooseRole: "Choose a role to configure", savePermissions: "Save permissions",
    roleCreated: "Role created successfully.", permissionsSaved: "Permissions saved successfully.",
    roleSaveError: "Could not save role settings.", ownerOnly: "Only the workspace owner can manage roles and permissions.",
    roleNameRequired: "Enter a role name with at least 2 characters.", cancelEdit: "Cancel editing", savingRole: "Saving…",
    accessRules: "Access rules", accessRulesText: "Available permission keys grouped by application module.",
    noPermissions: "No permission rules were found.", module: "Module", permissionKey: "Permission key",
    description: "Description", branchesText: "Locations linked to this organization.",
    mainBranch: "Main branch", branch: "Branch", address: "Address", noAddress: "No address provided",
    noBranches: "No branches were found.", language: "Interface language",
    languageText: "Choose the language used by the VELTRO-PRO interface.",
    currency: "Display currency", currencyText: "Currency used for business totals.",
    currencyValue: "Algerian dinar (DA)", security: "Security & access",
    securityText: "User creation and role changes must be processed through secure server-side authorization.",
    loading: "Loading settings…", retry: "Retry", reload: "Refresh data",
    loadError: "Settings could not be loaded. Check your connection and database access.",
    noEmail: "Not available in profile", noPhone: "Not provided",
    members: "Members", rolesCount: "Roles", permissionsCount: "Permission rules", branchesCount: "Branches",
    readOnly: "Database overview", readOnlyText: "This screen reads the organization settings currently available in the database.",
  },
  fr: {
    eyebrow: "CENTRE DE CONTRÔLE", title: "Paramètres",
    subtitle: "Gérez votre espace professionnel, les utilisateurs, les accès et les agences.",
    business: "Profil de l’entreprise", users: "Utilisateurs et rôles", permissions: "Autorisations",
    branches: "Agences", preferences: "Préférences", productSettings: "Paramètres des produits", soundSettings: "Paramètres sonores", soundSettingsText: "Configurez des sons modernes et puissants pour le scan, les modifications, la suppression, la confirmation et les ventes.", soundEnabled: "Activer les sons interactifs", soundVolume: "Volume", soundBarcode: "Scan du code-barres réussi", soundSale: "Vente finalisée", soundErrors: "Erreurs et actions invalides", soundAlerts: "Alertes de stock et du serveur", soundPrice: "Prix modifié", soundQuantity: "Quantité modifiée", soundDelete: "Produit supprimé", soundConfirm: "Action confirmée", soundPreview: "Tester le son", soundSaved: "Préférences sonores enregistrées pour cet utilisateur sur cet appareil.", soundHint: "Certains navigateurs exigent un clic ou une touche avant la lecture audio.", overview: "Vue d’ensemble",
    productSettingsText: "Gérez l’écran de vente au poids et l’ordre des produits dans ses cases.", layoutTitle: "Disposition des cases de vente au poids", layoutText: "Seuls les produits marqués pour la vente mesurée dans la fiche produit apparaissent ici. Faites glisser une case pour définir sa position dans l’écran de vente.", dragHint: "Faites glisser les produits entre les cases pour modifier leur ordre dans l’écran de vente.", noWeighedProducts: "Aucun produit n’est marqué pour la vente mesurée. Modifiez un produit et activez cette option d’abord.", poundGrams: "Valeur de la livre (grammes)", categories: "Catégories de produits", newCategory: "Nom de la nouvelle catégorie", addCategory: "Ajouter la catégorie", visibleCategories: "Afficher cette catégorie dans la vente au poids", renameCategory: "Nom de la catégorie", deleteCategory: "Supprimer la catégorie", productList: "Affectation des produits", productListText: "Choisissez les produits affichés dans la vente rapide et classez les produits vendus au poids.", favorite: "Favori", weighed: "Vente au poids", category: "Catégorie", uncategorized: "Sans catégorie", saveProductSettings: "Enregistrer les paramètres produits", productSettingsSaved: "Paramètres produits enregistrés sur cet appareil.", noProducts: "Aucun produit trouvé dans le catalogue.",
    overviewText: "Résumé de votre organisation et de votre compte.",
    organization: "Organisation", status: "Statut", active: "Actif", suspended: "Suspendu",
    currentAccount: "Compte actuel", accountName: "Nom du compte", email: "Adresse e-mail",
    phone: "Téléphone", role: "Rôle", accountStatus: "État du compte",
    editProfile: "Modifier le profil", saveChanges: "Enregistrer", cancel: "Annuler",
    profileName: "Nom complet", profileSaved: "Profil mis à jour.",
    profileSaveError: "Impossible d’enregistrer le profil. Réessayez.",
    nameRequired: "Veuillez saisir votre nom.", saving: "Enregistrement…", createdAt: "Créé le",
    team: "Membres de l’équipe", teamText: "Comptes associés à cette organisation.",
    searchUsers: "Rechercher par nom, téléphone ou rôle…", noUsers: "Aucun membre trouvé.",
    addWorker: "Ajouter un employé", workerName: "Nom complet", workerEmail: "Adresse e-mail", workerPhone: "Téléphone", temporaryPassword: "Mot de passe initial", assignRole: "Attribuer un rôle", createWorker: "Créer le compte", workerCreated: "Compte employé créé.", workerCreateError: "Impossible de créer le compte employé",
    roleCatalog: "Catalogue des rôles", roleCatalogText: "Rôles configurés pour cette organisation.",
    systemRole: "Rôle système", customRole: "Rôle personnalisé", noRoles: "Aucun rôle trouvé.",
    addRole: "Créer un rôle", roleName: "Nom du rôle", roleDescription: "Description", createRole: "Créer le rôle",
    editPermissions: "Configurer les autorisations", chooseRole: "Choisir un rôle à configurer", savePermissions: "Enregistrer les autorisations",
    roleCreated: "Rôle créé avec succès.", permissionsSaved: "Autorisations enregistrées.", roleSaveError: "Impossible d’enregistrer les paramètres du rôle.",
    ownerOnly: "Seul le propriétaire peut gérer les rôles et autorisations.", roleNameRequired: "Saisissez un nom de rôle d’au moins 2 caractères.",
    cancelEdit: "Annuler la modification", savingRole: "Enregistrement…",
    accessRules: "Règles d’accès", accessRulesText: "Autorisations disponibles regroupées par module.",
    noPermissions: "Aucune autorisation trouvée.", module: "Module", permissionKey: "Clé d’autorisation",
    description: "Description", branchesText: "Agences associées à cette organisation.",
    mainBranch: "Agence principale", branch: "Agence", address: "Adresse", noAddress: "Aucune adresse indiquée",
    noBranches: "Aucune agence trouvée.", language: "Langue de l’interface",
    languageText: "Choisissez la langue de l’interface VELTRO-PRO.",
    currency: "Devise d’affichage", currencyText: "Devise utilisée pour les totaux.",
    currencyValue: "Dinar algérien (DA)", security: "Sécurité et accès",
    securityText: "La création d’utilisateurs et les changements de rôles doivent passer par une autorisation serveur sécurisée.",
    loading: "Chargement des paramètres…", retry: "Réessayer", reload: "Actualiser",
    loadError: "Impossible de charger les paramètres. Vérifiez la connexion et les accès à la base.",
    noEmail: "Indisponible dans le profil", noPhone: "Non renseigné",
    members: "Membres", rolesCount: "Rôles", permissionsCount: "Autorisations", branchesCount: "Agences",
    readOnly: "Vue de la base", readOnlyText: "Cet écran affiche les paramètres actuellement disponibles dans la base de données.",
  },
  ar: {
    eyebrow: "مركز التحكم في مساحة العمل", title: "الإعدادات",
    subtitle: "إدارة المؤسسة والمستخدمين والصلاحيات والفروع من مكان واحد.",
    business: "بيانات المؤسسة", users: "المستخدمون والأدوار", permissions: "الصلاحيات",
    branches: "الفروع", preferences: "التفضيلات", productSettings: "إعدادات المنتجات", soundSettings: "إعدادات الأصوات", soundSettingsText: "تحكم في الأصوات الحديثة والقوية للمسح وتعديل السعر والكمية والحذف والتأكيد والبيع والتنبيهات.", soundEnabled: "تفعيل الأصوات التفاعلية", soundVolume: "مستوى الصوت", soundBarcode: "نجاح مسح الباركود", soundSale: "إتمام عملية البيع", soundErrors: "الأخطاء والإجراءات غير الصالحة", soundAlerts: "تنبيهات المخزون والسيرفر", soundPrice: "تعديل السعر", soundQuantity: "تعديل الكمية", soundDelete: "حذف المنتج", soundConfirm: "تأكيد العملية", soundPreview: "تجربة الصوت", soundSaved: "تم حفظ إعدادات الصوت لهذا المستخدم على هذا الجهاز.", soundHint: "قد يتطلب المتصفح نقرة أو ضغطة مفتاح قبل تشغيل الصوت.", overview: "نظرة عامة",
    productSettingsText: "إدارة شاشة البيع بوحدات القياس وترتيب المنتجات داخل مربعات البيع.", layoutTitle: "مخطط مربعات البيع بوحدات القياس", layoutText: "تظهر هنا تلقائيًا المنتجات التي فعّلت لها البيع بوحدات القياس عند إدخال المنتج فقط. اسحب مربع المنتج لتحديد مكانه في شاشة البيع.", dragHint: "اسحب المنتجات بين المربعات لتغيير ترتيب ظهورها في شاشة البيع.", noWeighedProducts: "لا توجد منتجات مفعّل لها البيع بوحدات القياس. افتح إدخال المنتج وفعّل هذا الخيار أولًا.", poundGrams: "قيمة الرطل بالغرام", categories: "فئات المنتجات", newCategory: "اسم الفئة الجديدة", addCategory: "إضافة الفئة", visibleCategories: "إظهار هذه الفئة في صفحة البيع بالميزان", renameCategory: "اسم الفئة", deleteCategory: "حذف الفئة", productList: "تعيين المنتجات للفئات", productListText: "اختر المنتجات التي تظهر في مربعات البيع السريع وحدد فئة كل منتج يُباع بالميزان.", favorite: "مفضّل", weighed: "بيع بالميزان", category: "الفئة", uncategorized: "بلا فئة", saveProductSettings: "حفظ إعدادات المنتجات", productSettingsSaved: "تم حفظ إعدادات المنتجات على هذا الجهاز.", noProducts: "لا توجد منتجات في قائمة المنتجات.",
    overviewText: "ملخص المؤسسة والحساب الحالي.",
    organization: "المؤسسة", status: "الحالة", active: "نشطة", suspended: "موقوفة",
    currentAccount: "الحساب الحالي", accountName: "اسم الحساب", email: "البريد الإلكتروني",
    phone: "رقم الهاتف", role: "الدور", accountStatus: "حالة الحساب",
    editProfile: "تعديل الملف الشخصي", saveChanges: "حفظ التغييرات", cancel: "إلغاء",
    profileName: "الاسم الكامل", profileSaved: "تم تحديث الملف الشخصي بنجاح.",
    profileSaveError: "تعذر حفظ التعديلات. حاول مرة أخرى.",
    nameRequired: "يرجى إدخال الاسم.", saving: "جارٍ الحفظ…", createdAt: "تاريخ الإنشاء",
    team: "أعضاء الفريق", teamText: "الحسابات المرتبطة بهذه المؤسسة.",
    searchUsers: "ابحث بالاسم أو الهاتف أو الدور…", noUsers: "لم يتم العثور على مستخدمين.",
    addWorker: "إضافة عامل", workerName: "الاسم الكامل", workerEmail: "البريد الإلكتروني", workerPhone: "رقم الهاتف", temporaryPassword: "كلمة المرور الأولية", assignRole: "تعيين الدور", createWorker: "إنشاء الحساب", workerCreated: "تم إنشاء حساب العامل بنجاح.", workerCreateError: "تعذر إنشاء حساب العامل",
    roleCatalog: "قائمة الأدوار", roleCatalogText: "الأدوار المعرفة لهذه المؤسسة.",
    systemRole: "دور نظام", customRole: "دور مخصص", noRoles: "لا توجد أدوار.",
    addRole: "إنشاء دور", roleName: "اسم الدور", roleDescription: "الوصف", createRole: "إنشاء الدور",
    editPermissions: "تخصيص الصلاحيات", chooseRole: "اختر دورًا لتخصيصه", savePermissions: "حفظ الصلاحيات",
    roleCreated: "تم إنشاء الدور بنجاح.", permissionsSaved: "تم حفظ الصلاحيات بنجاح.", roleSaveError: "تعذر حفظ إعدادات الدور.",
    ownerOnly: "المالك وحده يستطيع إدارة الأدوار والصلاحيات.", roleNameRequired: "أدخل اسمًا للدور لا يقل عن حرفين.",
    cancelEdit: "إلغاء التعديل", savingRole: "جارٍ الحفظ…",
    accessRules: "قواعد الوصول", accessRulesText: "الصلاحيات المتاحة مجمعة حسب أقسام التطبيق.",
    noPermissions: "لم يتم العثور على صلاحيات.", module: "القسم", permissionKey: "رمز الصلاحية",
    description: "الوصف", branchesText: "الفروع المرتبطة بهذه المؤسسة.",
    mainBranch: "الفرع الرئيسي", branch: "الفرع", address: "العنوان", noAddress: "لم يحدد عنوان",
    noBranches: "لم يتم العثور على فروع.", language: "لغة الواجهة",
    languageText: "اختر لغة واجهة VELTRO-PRO.",
    currency: "عملة العرض", currencyText: "العملة المستخدمة في عرض المجاميع.",
    currencyValue: "الدينار الجزائري (دج)", security: "الأمان والتحكم في الوصول",
    securityText: "يجب أن تتم إضافة المستخدمين وتغيير الأدوار عبر صلاحيات آمنة من جهة الخادم.",
    loading: "جارٍ تحميل الإعدادات…", retry: "إعادة المحاولة", reload: "تحديث البيانات",
    loadError: "تعذر تحميل الإعدادات. تحقق من الاتصال وصلاحيات قاعدة البيانات.",
    noEmail: "غير متاح في ملف المستخدم", noPhone: "غير محدد",
    members: "المستخدمون", rolesCount: "الأدوار", permissionsCount: "الصلاحيات", branchesCount: "الفروع",
    readOnly: "عرض بيانات قاعدة البيانات", readOnlyText: "تعرض هذه الصفحة إعدادات المؤسسة المتاحة حاليًا في قاعدة البيانات.",
  },
};

const nav = [
  { id: "business", icon: Building2, label: "business" },
  { id: "users", icon: UsersRound, label: "users" },
  { id: "permissions", icon: ShieldCheck, label: "permissions" },
  { id: "branches", icon: MapPinned, label: "branches" },
  { id: "preferences", icon: SlidersHorizontal, label: "preferences" },
  { id: "productSettings", icon: Package, label: "productSettings" },
  { id: "soundSettings", icon: Volume2, label: "soundSettings" },
];

const localeName = { en: "English", fr: "Français", ar: "العربية" };

const frenchRoleLabels = {
  accountant: {
    name: "Comptable",
    description: "Paiements, soldes des comptes et rapports financiers.",
  },
  admin: {
    name: "Administrateur",
    description: "Accès complet à VELTRO-PRO.",
  },
  cashier: {
    name: "Caissier",
    description: "Opérations de point de vente et gestion des ventes quotidiennes.",
  },
  employee: {
    name: "Employé",
    description: "Accès limité aux tâches quotidiennes.",
  },
  "inventory manager": {
    name: "Responsable des stocks",
    description: "Gestion du catalogue de produits et contrôle des stocks.",
  },
  "purchasing officer": {
    name: "Responsable des achats",
    description: "Gestion des fournisseurs et des achats.",
  },
  "store manager": {
    name: "Gérant du magasin",
    description: "Gestion quotidienne du magasin avec un accès contrôlé aux rapports et à l’équipe.",
  },
};

const arabicRoleLabels = {
  accountant: {
    name: "محاسب",
    description: "المدفوعات وأرصدة الحسابات والتقارير المالية.",
  },
  admin: {
    name: "مسؤول النظام",
    description: "وصول كامل إلى جميع وظائف VELTRO-PRO.",
  },
  cashier: {
    name: "أمين الصندوق",
    description: "عمليات نقطة البيع وإدارة المبيعات اليومية.",
  },
  employee: {
    name: "الموظف",
    description: "صلاحيات محدودة للمهام اليومية.",
  },
  "inventory manager": {
    name: "مسؤول المخزون",
    description: "إدارة المنتجات ومراقبة المخزون.",
  },
  "purchasing officer": {
    name: "مسؤول المشتريات",
    description: "إدارة الموردين وعمليات الشراء.",
  },
  "store manager": {
    name: "مدير المتجر",
    description: "إدارة عمليات المتجر اليومية بصلاحيات مضبوطة للتقارير والفريق.",
  },
};

function getRoleLabel(role, locale, field = "name") {
  if (!role) return "";
  const key = String(role.name || "").trim().toLowerCase();
  const translations = locale === "ar" ? arabicRoleLabels : locale === "fr" ? frenchRoleLabels : null;
  const translation = translations?.[key];
  if (!translation) return role[field] || "";
  return translation[field] || role[field] || "";
}

function formatModule(value = "") {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const permissionModuleLabels = {
  ar: {
    cash_register: "صندوق النقد", customers: "الزبائن", dashboard: "لوحة التحكم",
    inventory: "المخزون", payments: "المدفوعات", products: "المنتجات",
    profits: "الأرباح", purchases: "المشتريات", reports: "التقارير",
    sales: "المبيعات", settings: "الإعدادات", suppliers: "الموردون",
    users: "المستخدمون والأدوار",
  },
  fr: {
    cash_register: "Caisse", customers: "Clients", dashboard: "Tableau de bord",
    inventory: "Stock", payments: "Paiements", products: "Produits",
    profits: "Bénéfices", purchases: "Achats", reports: "Rapports",
    sales: "Ventes", settings: "Paramètres", suppliers: "Fournisseurs",
    users: "Utilisateurs et rôles",
  },
};

const permissionTitles = {
  en: {
    "cash_register.close": "Close cash register sessions",
    "cash_register.manage": "Manage cash register",
    "cash_register.open_drawer": "Open cash drawer",
    "cash_register.view": "View cash register",
    "customers.create": "Add customers",
    "customers.debts.view": "View customer debts",
    "customers.delete": "Delete customers",
    "customers.edit": "Edit customers",
    "customers.view": "View customers",
    "dashboard.view": "View dashboard",
    "inventory.adjust": "Adjust inventory",
    "inventory.view": "View inventory",
    "payments.manage": "Manage payments",
    "payments.view": "View payments",
    "products.create": "Add products",
    "products.delete": "Delete products",
    "products.edit": "Edit products",
    "products.view": "View products",
    "profits.view": "View profits",
    "purchases.create": "Create purchases",
    "purchases.edit": "Edit purchases",
    "purchases.view": "View purchases",
    "reports.view": "View reports",
    "sales.create": "Create sales",
    "sales.credit": "Sell on customer credit",
    "sales.delete": "Delete sales",
    "sales.discount": "Apply discounts",
    "sales.edit": "Edit sales",
    "sales.price_override": "Override sale prices",
    "sales.view": "View sales",
    "sales.void": "Void completed sales",
    "settings.manage": "Manage settings",
    "suppliers.create": "Add suppliers",
    "suppliers.debts.view": "View supplier debts",
    "suppliers.delete": "Delete suppliers",
    "suppliers.edit": "Edit suppliers",
    "suppliers.view": "View suppliers",
    "roles.manage": "Manage roles and permissions",
    "users.manage": "Manage users and roles",
    "users.view": "View users",
  },
  fr: {
    "cash_register.close": "Clôturer les sessions de caisse",
    "cash_register.manage": "Gérer la caisse",
    "cash_register.open_drawer": "Ouvrir le tiroir-caisse",
    "cash_register.view": "Consulter la caisse",
    "customers.create": "Ajouter des clients",
    "customers.debts.view": "Consulter les dettes des clients",
    "customers.delete": "Supprimer des clients",
    "customers.edit": "Modifier les clients",
    "customers.view": "Consulter les clients",
    "dashboard.view": "Consulter le tableau de bord",
    "inventory.adjust": "Ajuster le stock",
    "inventory.view": "Consulter le stock",
    "payments.manage": "Gérer les paiements",
    "payments.view": "Consulter les paiements",
    "products.create": "Ajouter des produits",
    "products.delete": "Supprimer des produits",
    "products.edit": "Modifier les produits",
    "products.view": "Consulter les produits",
    "profits.view": "Consulter les bénéfices",
    "purchases.create": "Créer des achats",
    "purchases.edit": "Modifier les achats",
    "purchases.view": "Consulter les achats",
    "reports.view": "Consulter les rapports",
    "sales.create": "Créer des ventes",
    "sales.credit": "Vendre à crédit au client",
    "sales.delete": "Supprimer des ventes",
    "sales.discount": "Appliquer des remises",
    "sales.edit": "Modifier les ventes",
    "sales.price_override": "Modifier les prix pendant la vente",
    "sales.view": "Consulter les ventes",
    "sales.void": "Annuler des ventes finalisées",
    "settings.manage": "Gérer les paramètres",
    "suppliers.create": "Ajouter des fournisseurs",
    "suppliers.debts.view": "Consulter les dettes des fournisseurs",
    "suppliers.delete": "Supprimer des fournisseurs",
    "suppliers.edit": "Modifier les fournisseurs",
    "suppliers.view": "Consulter les fournisseurs",
    "roles.manage": "Gérer les rôles et autorisations",
    "users.manage": "Gérer les utilisateurs et les rôles",
    "users.view": "Consulter les utilisateurs",
  },
  ar: {
    "cash_register.close": "إغلاق جلسات صندوق النقد",
    "cash_register.manage": "إدارة صندوق النقد",
    "cash_register.open_drawer": "فتح درج النقود",
    "cash_register.view": "عرض صندوق النقد",
    "customers.create": "إضافة الزبائن",
    "customers.debts.view": "عرض ديون الزبائن",
    "customers.delete": "حذف الزبائن",
    "customers.edit": "تعديل بيانات الزبائن",
    "customers.view": "عرض الزبائن",
    "dashboard.view": "عرض لوحة التحكم",
    "inventory.adjust": "تعديل كميات المخزون",
    "inventory.view": "عرض المخزون",
    "payments.manage": "إدارة المدفوعات",
    "payments.view": "عرض المدفوعات",
    "products.create": "إضافة المنتجات",
    "products.delete": "حذف المنتجات",
    "products.edit": "تعديل المنتجات",
    "products.view": "عرض المنتجات",
    "profits.view": "عرض الأرباح",
    "purchases.create": "إنشاء المشتريات",
    "purchases.edit": "تعديل المشتريات",
    "purchases.view": "عرض المشتريات",
    "reports.view": "عرض التقارير",
    "sales.create": "إنشاء عمليات البيع",
    "sales.credit": "البيع بالدين على حساب الزبون",
    "sales.delete": "حذف عمليات البيع",
    "sales.discount": "تطبيق التخفيضات",
    "sales.edit": "تعديل عمليات البيع",
    "sales.price_override": "تغيير الأسعار يدويًا أثناء البيع",
    "sales.view": "عرض عمليات البيع",
    "sales.void": "إلغاء عمليات البيع المكتملة",
    "settings.manage": "إدارة الإعدادات",
    "suppliers.create": "إضافة الموردين",
    "suppliers.debts.view": "عرض ديون الموردين",
    "suppliers.delete": "حذف الموردين",
    "suppliers.edit": "تعديل بيانات الموردين",
    "suppliers.view": "عرض الموردين",
    "roles.manage": "إدارة الأدوار والصلاحيات",
    "users.manage": "إدارة المستخدمين والأدوار",
    "users.view": "عرض المستخدمين",
  },
};

function getPermissionTitle(permission, locale = "en") {
  return permissionTitles[locale]?.[permission.code] || permission.code;
}

const permissionDescriptions = {
  ar: {
    "cash_register.close": "إغلاق جلسات صندوق النقد",
    "cash_register.manage": "إدارة صندوق النقد",
    "cash_register.open_drawer": "فتح درج النقود دون إجراء عملية بيع",
    "cash_register.view": "عرض صندوق النقد",
    "customers.create": "إضافة الزبائن",
    "customers.debts.view": "عرض أرصدة الزبائن وديونهم",
    "customers.delete": "حذف الزبائن",
    "customers.edit": "تعديل بيانات الزبائن",
    "customers.view": "عرض الزبائن",
    "dashboard.view": "عرض لوحة التحكم",
    "inventory.adjust": "تسوية المخزون وتعديل الكميات",
    "inventory.view": "عرض المخزون",
    "payments.manage": "إدارة تسديدات الحسابات",
    "payments.view": "عرض المدفوعات وتسديدات الحسابات",
    "products.create": "إضافة المنتجات",
    "products.delete": "حذف المنتجات",
    "products.edit": "تعديل المنتجات",
    "products.view": "عرض المنتجات",
    "profits.view": "عرض الأرباح",
    "purchases.create": "إنشاء فواتير المشتريات",
    "purchases.edit": "تعديل المشتريات",
    "purchases.view": "عرض المشتريات",
    "reports.view": "عرض التقارير",
    "sales.create": "إنشاء عمليات البيع",
    "sales.credit": "البيع بالدَّين على حساب الزبون",
    "sales.delete": "حذف عمليات البيع",
    "sales.discount": "تطبيق التخفيضات على الأسعار",
    "sales.edit": "تعديل عمليات البيع",
    "sales.price_override": "تغيير أسعار المنتجات يدويًا أثناء البيع",
    "sales.view": "عرض عمليات البيع",
    "sales.void": "إلغاء عملية بيع مكتملة مع تسجيل سبب الإلغاء في سجل المراجعة",
    "settings.manage": "إدارة الإعدادات",
    "suppliers.create": "إضافة الموردين",
    "suppliers.debts.view": "عرض أرصدة الموردين وديونهم",
    "suppliers.delete": "حذف الموردين",
    "suppliers.edit": "تعديل بيانات الموردين",
    "suppliers.view": "عرض الموردين",
    "roles.manage": "إنشاء أدوار مخصصة وتحديد صلاحياتها",
    "users.manage": "إدارة المستخدمين والأدوار",
    "users.view": "عرض المستخدمين",
  },
  fr: {
    "cash_register.close": "Clôturer les sessions de caisse",
    "cash_register.manage": "Gérer la caisse",
    "cash_register.open_drawer": "Ouvrir le tiroir-caisse sans vente",
    "cash_register.view": "Consulter la caisse",
    "customers.create": "Ajouter des clients",
    "customers.debts.view": "Consulter les soldes et les dettes des clients",
    "customers.delete": "Supprimer des clients",
    "customers.edit": "Modifier les clients",
    "customers.view": "Consulter les clients",
    "dashboard.view": "Consulter le tableau de bord",
    "inventory.adjust": "Ajuster les quantités en stock",
    "inventory.view": "Consulter le stock",
    "payments.manage": "Gérer les règlements de comptes",
    "payments.view": "Consulter les paiements et règlements",
    "products.create": "Ajouter des produits",
    "products.delete": "Supprimer des produits",
    "products.edit": "Modifier les produits",
    "products.view": "Consulter les produits",
    "profits.view": "Consulter les bénéfices",
    "purchases.create": "Créer des bons d’achat",
    "purchases.edit": "Modifier les achats",
    "purchases.view": "Consulter les achats",
    "reports.view": "Consulter les rapports",
    "sales.create": "Créer des ventes",
    "sales.credit": "Vendre à crédit sur le compte client",
    "sales.delete": "Supprimer des ventes",
    "sales.discount": "Appliquer des remises",
    "sales.edit": "Modifier les ventes",
    "sales.price_override": "Modifier manuellement les prix pendant la vente",
    "sales.view": "Consulter les ventes",
    "sales.void": "Annuler une vente finalisée en indiquant le motif dans le journal d’audit",
    "settings.manage": "Gérer les paramètres",
    "suppliers.create": "Ajouter des fournisseurs",
    "suppliers.debts.view": "Consulter les soldes et les dettes des fournisseurs",
    "suppliers.delete": "Supprimer des fournisseurs",
    "suppliers.edit": "Modifier les fournisseurs",
    "suppliers.view": "Consulter les fournisseurs",
    "roles.manage": "Créer des rôles personnalisés et configurer leurs autorisations",
    "users.manage": "Gérer les utilisateurs et les rôles",
    "users.view": "Consulter les utilisateurs",
  },
};

function getPermissionModuleLabel(value = "", locale = "en") {
  return permissionModuleLabels[locale]?.[value] || formatModule(value);
}

function getPermissionDescription(permission, locale = "en") {
  return permissionDescriptions[locale]?.[permission.code] || permission.description || "";
}

export default function SettingsPage({ locale = "en", onLocaleChange, currentUser }) {
  const t = copy[locale] || copy.en;
  const [section, setSection] = useState("business");
  const soundUserId = currentUser?.id || currentUser?.user_id || "device";
  const [soundSettings, setSoundSettingsState] = useState(() => getSoundSettings(soundUserId));
  const [soundSettingsMessage, setSoundSettingsMessage] = useState("");
  useEffect(() => {
    setSoundUser(soundUserId);
    setSoundSettingsState(getSoundSettings(soundUserId));
    setSoundSettingsMessage("");
  }, [soundUserId]);
  const updateSoundSetting = (key, value) => {
    const next = saveSoundSettings({ ...soundSettings, [key]: value }, soundUserId);
    setSoundSettingsState(next);
    setSoundSettingsMessage(t.soundSaved);
  };
  const previewSound = (eventType) => {
    setSoundUser(soundUserId);
    playSound(eventType);
  };
  const [productSettingsProducts, setProductSettingsProducts] = useState(() => getProducts());
  const [productWeighedLayout, setProductWeighedLayout] = useState(() => { try { const value = JSON.parse(localStorage.getItem("veltro_pos_weighed_layout") || "[]"); return Array.isArray(value) ? value.map(String) : []; } catch { return []; } });
  const [productWeighedSlots, setProductWeighedSlots] = useState(() => { try { const saved = JSON.parse(localStorage.getItem("veltro_pos_weighed_slots") || "null"); if (Array.isArray(saved)) return Array.from({ length: 9 }, (_, i) => String(saved[i] || "")); const legacy = JSON.parse(localStorage.getItem("veltro_pos_weighed_layout") || "[]"); return Array.from({ length: 9 }, (_, i) => String(legacy[i] || "")); } catch { return Array(9).fill(""); } });
  const [productFavoriteIds, setProductFavoriteIds] = useState(() => { try { return JSON.parse(localStorage.getItem("veltro_pos_favorite_products") || "[]").map(String); } catch { return []; } });
  const [productWeighedIds, setProductWeighedIds] = useState(() => { try { return JSON.parse(localStorage.getItem("veltro_pos_weighed_products") || "[]").map(String); } catch { return []; } });
  const [productCategoriesById, setProductCategoriesById] = useState(() => { try { return JSON.parse(localStorage.getItem("veltro_pos_weighed_categories") || "{}"); } catch { return {}; } });
  const [productCategoryList, setProductCategoryList] = useState(() => { try { const value = JSON.parse(localStorage.getItem("veltro_pos_weighed_category_list") || "[]"); const defaults = new Set(["Nuts", "Grains", "Spices", "Other", "General"]); return Array.isArray(value) ? value.filter(item => !defaults.has(String(item).trim())) : []; } catch { return []; } });
  const [productVisibleCategories, setProductVisibleCategories] = useState(() => { try { const value = JSON.parse(localStorage.getItem("veltro_pos_visible_weighed_categories") || "[]"); const defaults = new Set(["Nuts", "Grains", "Spices", "Other"]); return Array.isArray(value) ? value.filter(item => !defaults.has(String(item).trim())) : []; } catch { return []; } });
  const [productPoundGrams, setProductPoundGrams] = useState(() => { try { return Math.max(1, Number(localStorage.getItem("veltro_pos_pound_grams")) || 500); } catch { return 500; } });
  const [newProductCategory, setNewProductCategory] = useState("");
  const [productCategoryNames, setProductCategoryNames] = useState({});
  const [productSettingsMessage, setProductSettingsMessage] = useState("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showShortcutCategoryModal, setShowShortcutCategoryModal] = useState(false);
  const [selectedShortcutCategory, setSelectedShortcutCategory] = useState("");
  const [productShortcutCategories, setProductShortcutCategories] = useState(() => { try { const value = JSON.parse(localStorage.getItem("veltro_pos_shortcut_categories") || "null"); return Array.isArray(value) ? Array.from({ length: 12 }, (_, i) => String(value[i] || "")) : Array(12).fill(""); } catch { return Array(12).fill(""); } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState([]);
  const [savingRole, setSavingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState("");
  const [roleError, setRoleError] = useState("");
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("");
  const [savingUser, setSavingUser] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userError, setUserError] = useState("");
  const [data, setData] = useState({
    organization: null, profile: null, users: [], roles: [], permissions: [],
    rolePermissions: [], branches: [],
  });

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const user = authData?.user || currentUser;
      if (!user?.id) throw new Error("No signed-in user.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, organization_id, role_id, full_name, phone, status, is_owner, created_at")
        .eq("user_id", user.id)
        .single();
      if (profileError) throw profileError;

      const organizationId = profile.organization_id;
      const results = await Promise.all([
        supabase.from("organizations").select("id, name, status, created_at").eq("id", organizationId).single(),
        supabase.from("profiles").select("user_id, organization_id, role_id, full_name, phone, status, is_owner, created_at").eq("organization_id", organizationId).order("created_at", { ascending: true }),
        supabase.from("roles").select("id, organization_id, name, description, is_system, created_at").eq("organization_id", organizationId).order("name"),
        supabase.from("permissions").select("id, code, module, description").order("module").order("code"),
        supabase.from("role_permissions").select("role_id, permission_id"),
        supabase.from("branches").select("id, organization_id, name, address, phone, is_main, created_at").eq("organization_id", organizationId).order("is_main", { ascending: false }).order("name"),
      ]);
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
      setProfileName(profile.full_name || "");
      setProfilePhone(profile.phone || "");
      setData({
        organization: results[0].data,
        profile,
        users: results[1].data || [],
        roles: results[2].data || [],
        permissions: results[3].data || [],
        rolePermissions: results[4].data || [],
        branches: results[5].data || [],
      });
    } catch (err) {
      console.error("Unable to load settings:", err);
      setError(err?.message || t.loadError);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    if (!profileName.trim()) {
      setProfileError(t.nameRequired);
      return;
    }
    setSavingProfile(true);
    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: profileName.trim(),
          phone: profilePhone.trim(),
        })
        .eq("user_id", data.profile.user_id)
        .select("user_id, organization_id, role_id, full_name, phone, status, is_owner, created_at")
        .single();
      if (updateError) throw updateError;
      setData((previous) => ({ ...previous, profile: updatedProfile }));
      setProfileName(updatedProfile.full_name || "");
      setProfilePhone(updatedProfile.phone || "");
      setEditingProfile(false);
      setProfileMessage(t.profileSaved);
    } catch (err) {
      console.error("Unable to save profile:", err);
      setProfileError(t.profileSaveError);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => { loadSettings(); }, [currentUser?.id]);

  const roleById = useMemo(() => Object.fromEntries(data.roles.map((role) => [role.id, role])), [data.roles]);
  const permissionCountByRole = useMemo(() => {
    const counts = {};
    data.rolePermissions.forEach((item) => { counts[item.role_id] = (counts[item.role_id] || 0) + 1; });
    return counts;
  }, [data.rolePermissions]);
  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = !term ? [...data.users] : data.users.filter((user) => [
      user.full_name, user.phone, roleById[user.role_id]?.name, user.status,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
    return matches.sort((a, b) => {
      if (Boolean(a.is_owner) !== Boolean(b.is_owner)) return a.is_owner ? -1 : 1;
      const aActive = a.status === "active";
      const bActive = b.status === "active";
      if (aActive !== bActive) return aActive ? -1 : 1;
      return String(a.full_name || "").localeCompare(String(b.full_name || ""), locale === "ar" ? "ar" : locale === "fr" ? "fr" : "en", { sensitivity: "base" });
    });
  }, [data.users, data.roles, search, roleById, locale]);

  const activeNav = nav.find((item) => item.id === section) || nav[0];
  useEffect(() => {
    if (section !== "productSettings") return;
    setProductSettingsProducts(getProducts());
    try {
      const layout = JSON.parse(localStorage.getItem("veltro_pos_weighed_layout") || "[]");
      setProductWeighedLayout(Array.isArray(layout) ? layout.map(String) : []);
      setProductFavoriteIds(JSON.parse(localStorage.getItem("veltro_pos_favorite_products") || "[]").map(String));
      setProductWeighedIds(JSON.parse(localStorage.getItem("veltro_pos_weighed_products") || "[]").map(String));
      setProductCategoriesById(JSON.parse(localStorage.getItem("veltro_pos_weighed_categories") || "{}"));
      const defaults = new Set(["Nuts", "Grains", "Spices", "Other"]);
      const storedCategories = JSON.parse(localStorage.getItem("veltro_pos_weighed_category_list") || "[]");
      const categories = Array.isArray(storedCategories) ? storedCategories.filter(item => !defaults.has(String(item).trim())) : [];
      setProductCategoryList(categories);
      localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(categories));
      const storedVisible = JSON.parse(localStorage.getItem("veltro_pos_visible_weighed_categories") || "[]");
      const visible = Array.isArray(storedVisible) ? storedVisible.filter(item => !defaults.has(String(item).trim())) : [];
      setProductVisibleCategories(visible);
      localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(visible));
      setProductPoundGrams(Math.max(1, Number(localStorage.getItem("veltro_pos_pound_grams")) || 500));
      const shortcutCategories = JSON.parse(localStorage.getItem("veltro_pos_shortcut_categories") || "null");
      setProductShortcutCategories(Array.isArray(shortcutCategories) ? Array.from({ length: 12 }, (_, i) => String(shortcutCategories[i] || "")) : Array(12).fill(""));
      // Start with all categories so newly enabled weighed products are not hidden by the first category filter.
      setSelectedShortcutCategory("");
    } catch (error) { console.warn("Could not load product settings", error); }
  }, [section]);
  const saveProductSettings = () => {
    try {
      localStorage.setItem("veltro_pos_favorite_products", JSON.stringify(productFavoriteIds));
      localStorage.setItem("veltro_pos_weighed_products", JSON.stringify(productWeighedIds));
      localStorage.setItem("veltro_pos_weighed_categories", JSON.stringify(productCategoriesById));
      localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(productCategoryList));
      localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(productVisibleCategories.filter((category) => productCategoryList.includes(category))));
      localStorage.setItem("veltro_pos_pound_grams", String(Math.max(1, Number(productPoundGrams) || 500)));
      localStorage.setItem("veltro_pos_shortcut_categories", JSON.stringify(productShortcutCategories));
      const eligibleIds = weighedSettingsProducts.map((product) => String(product.id ?? product.productId ?? product.sku ?? ""));
      const nextLayout = [...new Set([...productWeighedLayout, ...eligibleIds])].filter((id) => eligibleIds.includes(id));
      localStorage.setItem("veltro_pos_weighed_layout", JSON.stringify(nextLayout));
      setProductWeighedLayout(nextLayout);
      const eligibleSlotIds = new Set(eligibleIds);
      const nextSlots = Array.from({ length: 9 }, (_, index) => eligibleSlotIds.has(String(productWeighedSlots[index] || "")) ? String(productWeighedSlots[index]) : "");
      localStorage.setItem("veltro_pos_weighed_slots", JSON.stringify(nextSlots));
      setProductWeighedSlots(nextSlots);
      setProductSettingsMessage(t.productSettingsSaved);
    } catch (error) { console.warn("Could not save product settings", error); setProductSettingsMessage(""); }
  };
  const weighedSettingsProducts = productSettingsProducts
    .filter((product) => {
      const id = String(product.id ?? product.productId ?? product.sku ?? "");
      // Support both the product-form flag and the quick-sale settings assignment.
      return product.weighedSale === true || product.weighedSale === "true" || productWeighedIds.includes(id);
    })
    .sort((a, b) => {
      const aId = String(a.id ?? a.productId ?? a.sku ?? "");
      const bId = String(b.id ?? b.productId ?? b.sku ?? "");
      const aIndex = productWeighedLayout.indexOf(aId);
      const bIndex = productWeighedLayout.indexOf(bId);
      return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex)
        || String(a.name || aId).localeCompare(String(b.name || bId));
    });
  const moveWeighedProduct = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setProductWeighedLayout((previous) => {
      const eligibleIds = productSettingsProducts
        .filter((product) => {
          const id = String(product.id ?? product.productId ?? product.sku ?? "");
          return product.weighedSale === true || product.weighedSale === "true" || productWeighedIds.includes(id);
        })
        .map((product) => String(product.id ?? product.productId ?? product.sku ?? ""));
      const order = [...new Set([...previous.map(String), ...eligibleIds])].filter((id) => eligibleIds.includes(id));
      const from = order.indexOf(String(draggedId));
      const to = order.indexOf(String(targetId));
      if (from < 0 || to < 0) return order;
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      return order;
    });
  };
  const renameProductCategory = (oldName) => {
    const newName = String(productCategoryNames[oldName] ?? oldName).trim();
    if (!newName || productCategoryList.some((category) => category !== oldName && category.toLocaleLowerCase() === newName.toLocaleLowerCase())) {
      setProductCategoryNames((previous) => ({ ...previous, [oldName]: oldName }));
      return;
    }
    if (newName === oldName) return;
    setProductCategoryList((previous) => previous.map((category) => category === oldName ? newName : category));
    setProductCategoriesById((previous) => Object.fromEntries(Object.entries(previous).map(([id, category]) => [id, category === oldName ? newName : category])));
    setProductVisibleCategories((previous) => previous.map((category) => category === oldName ? newName : category));
    setProductShortcutCategories((previous) => previous.map((category) => category === oldName ? newName : category));
    setSelectedShortcutCategory((previous) => previous === oldName ? newName : previous);
    setProductCategoryNames((previous) => { const next = { ...previous }; delete next[oldName]; next[newName] = newName; return next; });
    try {
      const nextCategories = productCategoryList.map((category) => category === oldName ? newName : category);
      const nextVisible = productVisibleCategories.map((category) => category === oldName ? newName : category);
      const nextShortcuts = productShortcutCategories.map((category) => category === oldName ? newName : category);
      localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(nextCategories));
      localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(nextVisible));
      localStorage.setItem("veltro_pos_weighed_categories", JSON.stringify(Object.fromEntries(Object.entries(productCategoriesById).map(([id, category]) => [id, category === oldName ? newName : category]))));
      localStorage.setItem("veltro_pos_shortcut_categories", JSON.stringify(nextShortcuts));
      window.dispatchEvent(new Event("veltro:weighed-settings-updated"));
    } catch (error) { console.warn("Could not persist renamed weighed category", error); }
  };
  const removeProductCategory = (category) => {
    setProductCategoryList((previous) => previous.filter((item) => item !== category));
    setProductVisibleCategories((previous) => previous.filter((item) => item !== category));
    setProductShortcutCategories((previous) => previous.map((item) => item === category ? "" : item));
    setSelectedShortcutCategory((previous) => previous === category ? "" : previous);
    setProductCategoriesById((previous) => Object.fromEntries(Object.entries(previous).filter(([, value]) => value !== category)));
    setProductCategoryNames((previous) => { const next = { ...previous }; delete next[category]; return next; });
    try {
      const nextCategories = productCategoryList.filter((item) => item !== category);
      const nextVisible = productVisibleCategories.filter((item) => item !== category);
      const nextMap = Object.fromEntries(Object.entries(productCategoriesById).filter(([, value]) => value !== category));
      const nextShortcuts = productShortcutCategories.map((item) => item === category ? "" : item);
      localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(nextCategories));
      localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(nextVisible));
      localStorage.setItem("veltro_pos_weighed_categories", JSON.stringify(nextMap));
      localStorage.setItem("veltro_pos_shortcut_categories", JSON.stringify(nextShortcuts));
      window.dispatchEvent(new Event("veltro:weighed-settings-updated"));
    } catch (error) { console.warn("Could not persist removed weighed category", error); }
  };
  const isOwner = data.profile?.is_owner === true;
  const selectedRole = data.roles.find((role) => role.id === selectedRoleId) || null;
  const ownerRoleIds = new Set(data.users.filter((user) => user.is_owner).map((user) => user.role_id).filter(Boolean));

  const createWorker = async (event) => {
    event.preventDefault();
    setUserMessage("");
    setUserError("");
    if (!isOwner) { setUserError(t.ownerOnly); return; }
    if (!newUserRoleId) { setUserError(t.assignRole); return; }
    setSavingUser(true);
    try {
      const { data: result, error: createError } = await supabase.functions.invoke("create-workspace-user", {
        body: {
          full_name: newUserName.trim(),
          email: newUserEmail.trim(),
          phone: newUserPhone.trim(),
          password: newUserPassword,
          role_id: newUserRoleId,
        },
      });
      if (createError) throw createError;
      if (result?.error) throw new Error(result.error);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserPassword("");
      setNewUserRoleId("");
      await loadSettings();
      setUserMessage(t.workerCreated);
    } catch (err) {
      console.error("Could not create worker:", err);
      let message = err?.message || t.workerCreateError;
      // Supabase FunctionsHttpError stores the actual HTTP response in err.context.
      // Read its JSON body so the interface shows the server's actionable error
      // instead of only "Edge Function returned a non-2xx status code".
      try {
        const response = err?.context;
        if (response && typeof response.clone === "function") {
          const payload = await response.clone().json();
          if (payload?.error || payload?.message) {
            message = String(payload.error || payload.message);
          }
        }
      } catch {
        // Keep the original error if the response body is empty or not JSON.
      }
      setUserError(message);
    } finally {
      setSavingUser(false);
    }
  };

  const startRoleEditing = (role) => {
    setSelectedRoleId(role.id);
    const rolePermissionIds = new Set(data.rolePermissions.filter((item) => item.role_id === role.id).map((item) => item.permission_id));
    setSelectedPermissionCodes(data.permissions.filter((permission) => rolePermissionIds.has(permission.id)).map((permission) => permission.code));
    setRoleMessage("");
    setRoleError("");
  };

  const createRole = async (event) => {
    event.preventDefault();
    setRoleMessage("");
    setRoleError("");
    if (!isOwner) { setRoleError(t.ownerOnly); return; }
    if (roleName.trim().length < 2) { setRoleError(t.roleNameRequired); return; }
    setSavingRole(true);
    try {
      const { data: newRoleId, error: createError } = await supabase.rpc("create_custom_role", {
        p_name: roleName.trim(),
        p_description: roleDescription.trim(),
      });
      if (createError) throw createError;
      setRoleName("");
      setRoleDescription("");
      await loadSettings();
      setSelectedRoleId(newRoleId);
      setSelectedPermissionCodes([]);
      setRoleMessage(t.roleCreated);
    } catch (err) {
      console.error("Could not create role:", err);
      setRoleError(err?.message || t.roleSaveError);
    } finally {
      setSavingRole(false);
    }
  };

  const saveRolePermissions = async () => {
    if (!isOwner || !selectedRoleId) return;
    setSavingRole(true);
    setRoleMessage("");
    setRoleError("");
    try {
      const { error: saveError } = await supabase.rpc("save_role_permissions", {
        p_role_id: selectedRoleId,
        p_permission_codes: selectedPermissionCodes,
      });
      if (saveError) throw saveError;
      await loadSettings();
      setRoleMessage(t.permissionsSaved);
    } catch (err) {
      console.error("Could not save role permissions:", err);
      setRoleError(err?.message || t.roleSaveError);
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <section className="settings-page" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="settings-intro">
        <div className="settings-intro-mark"><SlidersHorizontal size={22} /></div>
        <div className="settings-intro-copy">
          <span className="settings-eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.subtitle}</p>
        </div>
        <button type="button" className="settings-refresh" onClick={loadSettings} disabled={loading}>
          <RefreshCw size={15} className={loading ? "settings-spin" : ""} />
          <span>{t.reload}</span>
        </button>
      </div>

      <div className="settings-layout">
        <aside className="settings-nav">
          <div className="settings-nav-heading">{t.title}</div>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={`settings-nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <Icon size={17} />
                <span>{t[item.label]}</span>
                <ChevronRight size={15} className="settings-nav-chevron" />
              </button>
            );
          })}
          <div className="settings-nav-note">
            <ShieldCheck size={17} />
            <span>{t.security}</span>
          </div>
        </aside>

        <div className="settings-content">
          {section !== "productSettings" && section !== "soundSettings" && loading ? (
            <div className="settings-state"><RefreshCw size={23} className="settings-spin" /><span>{t.loading}</span></div>
          ) : section !== "productSettings" && section !== "soundSettings" && error ? (
            <div className="settings-state settings-state-error">
              <AlertCircle size={23} />
              <span>{t.loadError}</span>
              <button type="button" className="settings-secondary-button" onClick={loadSettings}>{t.retry}</button>
            </div>
          ) : (
            <>
              <div className="settings-section-heading">
                <div className="settings-section-icon"><activeNav.icon size={20} /></div>
                <div>
                  <h3>{t[activeNav.label]}</h3>
                  <p>{section === "business" ? t.overviewText : section === "users" ? t.teamText : section === "permissions" ? t.accessRulesText : section === "branches" ? t.branchesText : section === "productSettings" ? t.productSettingsText : section === "soundSettings" ? t.soundSettingsText : t.languageText}</p>
                </div>
              </div>

              {section === "business" && (
                <>
                  <div className="settings-metrics">
                    {[
                      { label: t.members, value: data.users.length, icon: UsersRound },
                      { label: t.rolesCount, value: data.roles.length, icon: KeyRound },
                      { label: t.permissionsCount, value: data.permissions.length, icon: ShieldCheck },
                      { label: t.branchesCount, value: data.branches.length, icon: MapPinned },
                    ].map((item) => {
                      const Icon = item.icon;
                      return <div className="settings-metric" key={item.label}><span className="settings-metric-icon"><Icon size={17} /></span><span className="settings-metric-label">{item.label}</span><strong>{item.value}</strong></div>;
                    })}
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-heading"><Store size={18} /><div><h4>{t.organization}</h4><p>{t.readOnlyText}</p></div><span className="settings-readonly-tag"><Database size={13} />{t.readOnly}</span></div>
                    <div className="settings-detail-grid">
                      <div className="settings-detail"><span>{t.organization}</span><strong>{data.organization?.name || "—"}</strong></div>
                      <div className="settings-detail"><span>{t.status}</span><strong><i className={`settings-status-dot ${data.organization?.status === "active" ? "is-active" : ""}`} />{data.organization?.status === "active" ? t.active : t.suspended}</strong></div>
                      <div className="settings-detail"><span>{t.createdAt}</span><strong>{data.organization?.created_at ? new Date(data.organization.created_at).toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB") : "—"}</strong></div>
                    </div>
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-heading">
                      <UserRound size={18} />
                      <div><h4>{t.currentAccount}</h4><p>{t.accountName} · {currentUser?.email || t.noEmail}</p></div>
                      {!editingProfile && <button type="button" className="settings-edit-button" onClick={() => { setProfileError(""); setProfileMessage(""); setEditingProfile(true); }}><Pencil size={14} />{t.editProfile}</button>}
                    </div>
                    {profileMessage && <div className="settings-feedback settings-feedback-success" role="status"><CheckCircle2 size={15} />{profileMessage}</div>}
                    {profileError && <div className="settings-feedback settings-feedback-error" role="alert"><AlertCircle size={15} />{profileError}</div>}
                    {editingProfile ? (
                      <form className="settings-profile-form" onSubmit={saveProfile}>
                        <label className="settings-form-field"><span>{t.profileName}</span><input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={120} required autoComplete="name" /></label>
                        <label className="settings-form-field"><span>{t.phone}</span><input value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} maxLength={40} autoComplete="tel" /></label>
                        <div className="settings-profile-actions">
                          <button type="submit" className="settings-save-button" disabled={savingProfile}><Save size={15} />{savingProfile ? t.saving : t.saveChanges}</button>
                          <button type="button" className="settings-cancel-button" disabled={savingProfile} onClick={() => { setProfileName(data.profile?.full_name || ""); setProfilePhone(data.profile?.phone || ""); setProfileError(""); setEditingProfile(false); }}><X size={15} />{t.cancel}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="settings-detail-grid">
                        <div className="settings-detail"><span>{t.profileName}</span><strong>{data.profile?.full_name || "—"}</strong></div>
                        <div className="settings-detail"><span>{t.email}</span><strong>{currentUser?.email || t.noEmail}</strong></div>
                        <div className="settings-detail"><span>{t.phone}</span><strong>{data.profile?.phone || t.noPhone}</strong></div>
                        <div className="settings-detail"><span>{t.role}</span><strong>{getRoleLabel(roleById[data.profile?.role_id], locale) || "—"}</strong></div>
                      </div>
                    )}
                  </div>
                  <div className="settings-card settings-security-card">
                    <div className="settings-security-icon"><ShieldCheck size={20} /></div>
                    <div><h4>{t.security}</h4><p>{t.securityText}</p></div>
                  </div>
                </>
              )}

              {section === "users" && (
                <>
                  {isOwner && <div className="settings-card">
                    <div className="settings-card-heading"><UserRound size={18} /><div><h4>{t.addWorker}</h4><p>{t.ownerOnly}</p></div><button type="button" className="settings-save-button" onClick={() => { setShowWorkerForm((value) => !value); setUserError(""); }}><UserRound size={15} />{showWorkerForm ? t.cancel : t.addWorker}</button></div>
                    {userMessage && <div className="settings-feedback settings-feedback-success" role="status"><CheckCircle2 size={15} />{userMessage}</div>}
                    {userError && <div className="settings-feedback settings-feedback-error" role="alert"><AlertCircle size={15} />{userError}</div>}
                    {showWorkerForm && <form className="settings-profile-form" onSubmit={createWorker}>
                      <div className="settings-detail-grid">
                        <label className="settings-form-field"><span>{t.workerName}</span><input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} maxLength={120} minLength={2} required autoComplete="name" /></label>
                        <label className="settings-form-field"><span>{t.workerEmail}</span><input type="email" value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} required autoComplete="email" /></label>
                        <label className="settings-form-field"><span>{t.workerPhone}</span><input value={newUserPhone} onChange={(event) => setNewUserPhone(event.target.value)} maxLength={40} autoComplete="tel" /></label>
                        <label className="settings-form-field"><span>{t.temporaryPassword}</span><input type="password" value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} minLength={8} required autoComplete="new-password" /></label>
                        <label className="settings-form-field"><span>{t.assignRole}</span><select value={newUserRoleId} onChange={(event) => setNewUserRoleId(event.target.value)} required><option value="">{t.assignRole}</option>{data.roles.filter((role) => !ownerRoleIds.has(role.id)).map((role) => <option key={role.id} value={role.id}>{getRoleLabel(role, locale)}</option>)}</select></label>
                      </div>
                      <div className="settings-profile-actions"><button type="submit" className="settings-save-button" disabled={savingUser}><Save size={15} />{savingUser ? t.savingRole : t.createWorker}</button></div>
                    </form>}
                  </div>}
                  <div className="settings-card">
                    <div className="settings-card-heading"><UsersRound size={18} /><div><h4>{t.team}</h4><p>{t.teamText}</p></div><span className="settings-count">{data.users.length}</span></div>
                    <div className="settings-table-tools"><label className="settings-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchUsers} /></label></div>
                    <div className="settings-table-wrap"><table className="settings-table"><thead><tr><th>{t.accountName}</th><th>{t.phone}</th><th>{t.role}</th><th>{t.accountStatus}</th></tr></thead><tbody>
                      {filteredUsers.map((user) => <tr key={user.user_id}><td><div className="settings-person"><span className="settings-person-avatar"><UserRound size={16} /></span><span><strong>{user.full_name || "—"}</strong><small>{user.user_id.slice(0, 8)}…</small></span></div></td><td>{user.phone || t.noPhone}</td><td><span className="settings-role-chip">{getRoleLabel(roleById[user.role_id], locale) || "—"}</span></td><td><span className={`settings-pill ${user.status === "active" ? "is-active" : "is-disabled"}`}><i />{user.status === "active" ? t.active : t.suspended}</span></td></tr>)}
                      {!filteredUsers.length && <tr><td colSpan="4" className="settings-empty">{t.noUsers}</td></tr>}
                    </tbody></table></div>
                  </div>
                  <div className="settings-card">
                    <div className="settings-card-heading"><KeyRound size={18} /><div><h4>{t.roleCatalog}</h4><p>{t.roleCatalogText}</p></div>{isOwner && <button type="button" className="settings-save-button" onClick={() => { setShowRoleForm((value) => !value); setRoleError(""); }}><KeyRound size={15} />{showRoleForm ? t.cancel : t.addRole}</button>}</div>
                    <div className="settings-role-list">{data.roles.map((role) => <div className="settings-role-row" key={role.id}><span className="settings-role-icon"><ShieldCheck size={17} /></span><span className="settings-role-copy"><strong>{getRoleLabel(role, locale)}</strong><small>{getRoleLabel(role, locale, "description") || "—"}</small></span><span className="settings-role-permissions">{permissionCountByRole[role.id] || 0} / {data.permissions.length}</span><span className="settings-role-type">{role.is_system ? t.systemRole : t.customRole}</span>{isOwner && !ownerRoleIds.has(role.id) && <button type="button" className="settings-edit-button" onClick={() => startRoleEditing(role)}>{t.editPermissions}</button>}</div>)}{!data.roles.length && <p className="settings-empty">{t.noRoles}</p>}</div>
                    {isOwner && showRoleForm && <form className="settings-profile-form" onSubmit={createRole}>
                      <div className="settings-card-heading"><KeyRound size={18} /><div><h4>{t.addRole}</h4><p>{t.ownerOnly}</p></div></div>
                      <div className="settings-detail-grid">
                        <label className="settings-form-field"><span>{t.roleName}</span><input value={roleName} onChange={(event) => setRoleName(event.target.value)} maxLength={80} minLength={2} required /></label>
                        <label className="settings-form-field"><span>{t.roleDescription}</span><input value={roleDescription} onChange={(event) => setRoleDescription(event.target.value)} maxLength={240} /></label>
                      </div>
                      <div className="settings-profile-actions"><button type="submit" className="settings-save-button" disabled={savingRole}><Save size={15} />{savingRole ? t.savingRole : t.createRole}</button></div>
                    </form>}
                    {isOwner && selectedRole && !ownerRoleIds.has(selectedRole.id) && <div className="settings-role-editor">
                      <div className="settings-card-heading"><ShieldCheck size={18} /><div><h4>{t.editPermissions}: {getRoleLabel(selectedRole, locale)}</h4><p>{t.chooseRole}</p></div><button type="button" className="settings-cancel-button" onClick={() => setSelectedRoleId("")}>{t.cancelEdit}</button></div>
                      <div className="settings-permission-groups">{Object.entries(data.permissions.reduce((groups, permission) => { const key = permission.module || "other"; (groups[key] ||= []).push(permission); return groups; }, {})).map(([module, permissions]) => <section className="settings-permission-group" key={module}><div className="settings-permission-group-heading"><span>{getPermissionModuleLabel(module, locale)}</span><span>{permissions.length}</span></div><div className="settings-permission-list">{permissions.map((permission) => <label className="settings-permission-row" key={permission.id}><input type="checkbox" checked={selectedPermissionCodes.includes(permission.code)} onChange={(event) => setSelectedPermissionCodes((previous) => event.target.checked ? [...new Set([...previous, permission.code])] : previous.filter((code) => code !== permission.code))} /><span className="settings-permission-icon"><CheckCircle2 size={15} /></span><span><strong>{getPermissionTitle(permission, locale)}</strong><small className="settings-permission-code">{permission.code}</small><small>{getPermissionDescription(permission, locale)}</small></span></label>)}</div></section>)}</div>
                      <div className="settings-profile-actions"><button type="button" className="settings-save-button" onClick={saveRolePermissions} disabled={savingRole}><Save size={15} />{savingRole ? t.savingRole : t.savePermissions}</button></div>
                    </div>}
                    {roleMessage && <div className="settings-feedback settings-feedback-success" role="status"><CheckCircle2 size={15} />{roleMessage}</div>}
                    {roleError && <div className="settings-feedback settings-feedback-error" role="alert"><AlertCircle size={15} />{roleError}</div>}
                  </div>
                </>
              )}

              {section === "permissions" && (
                <div className="settings-card">
                  <div className="settings-card-heading"><ShieldCheck size={18} /><div><h4>{t.accessRules}</h4><p>{t.accessRulesText}</p></div><span className="settings-count">{data.permissions.length}</span></div>
                  <div className="settings-permission-groups">{Object.entries(data.permissions.reduce((groups, permission) => { const key = permission.module || "other"; (groups[key] ||= []).push(permission); return groups; }, {})).map(([module, permissions]) => <section className="settings-permission-group" key={module}><div className="settings-permission-group-heading"><span>{getPermissionModuleLabel(module, locale)}</span><span>{permissions.length}</span></div><div className="settings-permission-list">{permissions.map((permission) => <div className="settings-permission-row" key={permission.id}><span className="settings-permission-icon"><CheckCircle2 size={15} /></span><span><strong>{getPermissionTitle(permission, locale)}</strong><small className="settings-permission-code">{permission.code}</small><small>{getPermissionDescription(permission, locale)}</small></span></div>)}</div></section>)}</div>
                  {!data.permissions.length && <p className="settings-empty">{t.noPermissions}</p>}
                </div>
              )}

              {section === "branches" && (
                <div className="settings-branch-grid">
                  {data.branches.map((branch) => <article className="settings-branch-card" key={branch.id}><div className="settings-branch-top"><span className="settings-branch-icon"><MapPinned size={19} /></span>{branch.is_main && <span className="settings-main-badge">{t.mainBranch}</span>}</div><h4>{branch.name}</h4><p className="settings-branch-address">{branch.address || t.noAddress}</p><div className="settings-branch-contact"><Phone size={14} /><span>{branch.phone || t.noPhone}</span></div></article>)}
                  {!data.branches.length && <div className="settings-empty">{t.noBranches}</div>}
                </div>
              )}

              {section === "productSettings" && (
                <>
                  <div className="settings-card">
                    <div className="settings-card-heading"><Scale size={18} /><div><h4>{t.categories}</h4><p>{t.productSettingsText}</p></div></div>
                    <label className="settings-form-field" style={{ maxWidth: 280, marginBottom: 18 }}><span>{t.poundGrams}</span><input type="number" min="1" value={productPoundGrams} onChange={(event) => setProductPoundGrams(event.target.value)} /></label>
                    <div className="settings-inline-actions"><button type="button" className="settings-save-button" onClick={() => setShowCategoryManager(true)}><Package size={15}/>{locale === "ar" ? "إدارة فئات البيع بالميزان" : locale === "fr" ? "Gérer les catégories de pesée" : "Manage weighed-sale categories"}</button><span className="settings-count">{productCategoryList.length}</span></div>
                  </div>
                  {showCategoryManager && <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCategoryManager(false); }}>
                    <section className="settings-modal-card" role="dialog" aria-modal="true" aria-labelledby="weighed-category-manager-title">
                      <header className="settings-modal-header"><div><h3 id="weighed-category-manager-title">{t.categories}</h3><p>{t.productSettingsText}</p></div><button type="button" className="settings-icon-button" aria-label={t.cancel} onClick={() => setShowCategoryManager(false)}><X size={19}/></button></header>
                                          <form className="settings-profile-form" onSubmit={(event) => {
                        event.preventDefault();
                        const name = newProductCategory.trim();
                        if (!name || productCategoryList.some((category) => category.toLocaleLowerCase() === name.toLocaleLowerCase())) {
                          setNewProductCategory("");
                          return;
                        }
                        const nextCategories = [...productCategoryList, name];
                        const nextVisible = [...new Set([...productVisibleCategories, name])];
                        setProductCategoryList(nextCategories);
                        setProductVisibleCategories(nextVisible);
                        setProductCategoryNames((previous) => ({ ...previous, [name]: name }));
                        try {
                          localStorage.setItem("veltro_pos_weighed_category_list", JSON.stringify(nextCategories));
                          localStorage.setItem("veltro_pos_visible_weighed_categories", JSON.stringify(nextVisible));
                          window.dispatchEvent(new Event("veltro:weighed-settings-updated"));
                        } catch (error) { console.warn("Could not persist weighed category", error); }
                        setNewProductCategory("");
                      }}>
                      <div className="settings-detail-grid"><label className="settings-form-field"><span>{t.newCategory}</span><input value={newProductCategory} onChange={(event) => setNewProductCategory(event.target.value)} /></label></div>
                      <div className="settings-profile-actions"><button type="submit" className="settings-save-button"><Plus size={15} />{t.addCategory}</button></div>
                    </form>
                    <div className="settings-role-list" style={{ marginTop: 16 }}>
                      {productCategoryList.map((category) => <div className="settings-role-row" key={category}>
                        <span className="settings-role-icon"><Package size={17} /></span>
                        <label className="settings-form-field" style={{ flex: 1 }}><span>{t.renameCategory}</span><input value={productCategoryNames[category] ?? category} onChange={(event) => setProductCategoryNames((previous) => ({ ...previous, [category]: event.target.value }))} onBlur={() => renameProductCategory(category)} /></label>
                        <label className="settings-permission-row" style={{ padding: 0, border: 0 }}><input type="checkbox" checked={productVisibleCategories.includes(category)} onChange={(event) => setProductVisibleCategories((previous) => event.target.checked ? [...new Set([...previous, category])] : previous.filter((item) => item !== category))} /><span>{t.visibleCategories}</span></label>
                        <button type="button" className="settings-cancel-button" title={t.deleteCategory} onClick={() => removeProductCategory(category)}><Trash2 size={15} />{t.deleteCategory}</button>
                      </div>)}
                    </div>

                      <footer className="settings-modal-footer"><button type="button" className="settings-cancel-button" onClick={() => setShowCategoryManager(false)}>{t.cancel}</button><button type="button" className="settings-save-button" onClick={() => setShowCategoryManager(false)}>{locale === "ar" ? "تم" : locale === "fr" ? "Terminé" : "Done"}</button></footer>
                    </section>
                  </div>}
                  <div className="settings-card">
                    <div className="settings-card-heading"><Scale size={18} /><div><h4>{t.layoutTitle}</h4><p>{t.layoutText}</p></div><span className="settings-count">{weighedSettingsProducts.length}</span></div>
                    <p style={{ color: "var(--settings-muted, #94a3b8)", fontSize: 12, margin: "0 0 14px" }}>{t.dragHint}</p>
                    <div className="settings-shortcut-tools">
                      <label className="settings-form-field"><span>{locale === "ar" ? "الفئة التي تريد تخصيصها" : locale === "fr" ? "Catégorie à personnaliser" : "Category to customize"}</span><select value={selectedShortcutCategory} onChange={(event) => setSelectedShortcutCategory(event.target.value)}><option value="">{locale === "ar" ? "كل الفئات" : locale === "fr" ? "Toutes les catégories" : "All categories"}</option>{productCategoryList.map((category) => <option key={category} value={category}>{productCategoryNames[category] || category}</option>)}</select></label>
                      <button type="button" className="settings-save-button" onClick={() => setShowShortcutCategoryModal(true)}><SlidersHorizontal size={15}/>{locale === "ar" ? "تخصيص الفئات المرتبطة بـ F1–F12" : locale === "fr" ? "Associer les catégories à F1–F12" : "Customize categories linked to F1–F12"}</button>
                    </div>
                    {showShortcutCategoryModal && <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowShortcutCategoryModal(false); }}><section className="settings-modal-card settings-shortcut-modal" role="dialog" aria-modal="true" aria-labelledby="weighed-shortcut-modal-title">
                      <header className="settings-modal-header"><div><h3 id="weighed-shortcut-modal-title">{locale === "ar" ? "اختصارات الفئات F1–F12" : locale === "fr" ? "Raccourcis catégories F1–F12" : "F1–F12 category shortcuts"}</h3><p>{locale === "ar" ? "اختر الفئة التي يفتحها كل مفتاح أثناء البيع بالميزان." : locale === "fr" ? "Choisissez la catégorie ouverte par chaque touche en vente au poids." : "Choose which category each key opens in the weighed-sale screen."}</p></div><button type="button" className="settings-icon-button" aria-label={t.cancel} onClick={() => setShowShortcutCategoryModal(false)}><X size={19}/></button></header>
                      <div className="settings-shortcut-category-grid">{productShortcutCategories.map((category,index)=><label className="settings-form-field" key={"shortcut-category-"+index}><span>F{index+1}</span><select value={category} onChange={(event)=>setProductShortcutCategories((previous)=>previous.map((value,slot)=>slot===index?event.target.value:value))}><option value="">{locale==="ar"?"— غير مرتبط —":locale==="fr"?"— Non attribué —":"— Unassigned —"}</option>{productCategoryList.map((option)=><option key={option} value={option}>{productCategoryNames[option]||option}</option>)}</select></label>)}</div>
                      <footer className="settings-modal-footer"><button type="button" className="settings-cancel-button" onClick={()=>setShowShortcutCategoryModal(false)}>{t.cancel}</button><button type="button" className="settings-save-button" onClick={()=>{try{localStorage.setItem("veltro_pos_shortcut_categories",JSON.stringify(productShortcutCategories));}catch{}setShowShortcutCategoryModal(false);}}>{locale==="ar"?"حفظ الاختصارات":locale==="fr"?"Enregistrer les raccourcis":"Save shortcuts"}</button></footer>
                    </section></div>}
                    <div className="settings-weighed-grid settings-weighed-grid-3" dir="rtl" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                        {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((index) => {
                          const selectedId = String(productWeighedSlots[index] || "");
                          const product = weighedSettingsProducts.find((item) => String(item.id ?? item.productId ?? item.sku ?? "") === selectedId);
                          const id = product ? String(product.id ?? product.productId ?? product.sku ?? "") : "";
                          return <div key={"weighed-slot-" + index} className="settings-weighed-slot" style={{ minWidth: 0, minHeight: 155, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 9, padding: 12, boxSizing: "border-box", border: selectedId ? "1px solid rgba(53,214,208,.45)" : "1px dashed rgba(148,163,184,.3)", borderRadius: 14, background: selectedId ? "linear-gradient(145deg, rgba(53,214,208,.11), rgba(124,58,237,.10))" : "rgba(2,6,23,.18)" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                              <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, flexShrink: 0, borderRadius: 10, background: "rgba(53,214,208,.14)", color: "#5eead4", fontSize: 16, fontWeight: 800 }}>{index + 1}</span>
                              <strong style={{ fontSize: 12, color: "#cbd5e1" }}>{locale === "ar" ? "زر رقم " + (index + 1) : locale === "fr" ? "Bouton " + (index + 1) : "Button " + (index + 1)}</strong>
                            </div>
                            <select aria-label={locale === "ar" ? "المنتج في الخانة " + (index + 1) : locale === "fr" ? "Produit dans la case " + (index + 1) : "Product in tile " + (index + 1)} value={selectedId} onChange={(event) => setProductWeighedSlots((previous) => previous.map((value, slotIndex) => slotIndex === index ? event.target.value : value))} style={{ width: "100%", minWidth: 0, minHeight: 40, padding: "7px 8px", borderRadius: 8, border: "1px solid rgba(148,163,184,.28)", background: "#0b1423", color: "#e2e8f0", fontSize: 12 }}>
                              <option value="">{locale === "ar" ? "— اختر منتجًا —" : locale === "fr" ? "— Choisir un produit —" : "— Choose product —"}</option>
                              {weighedSettingsProducts.filter((item) => !selectedShortcutCategory || (productCategoriesById[String(item.id ?? item.productId ?? item.sku ?? "")] || item.category || "") === selectedShortcutCategory).map((item) => { const itemId = String(item.id ?? item.productId ?? item.sku ?? ""); return <option key={itemId} value={itemId}>{item.name || itemId} · {item.sku || item.reference || itemId}</option>; })}
                            </select>
                            {product ? <><small style={{ color: "#94a3b8", fontSize: 11, overflowWrap: "anywhere" }}>{product.sku || product.reference || id}</small><select aria-label={t.category} value={productCategoriesById[id] || (productCategoryList.includes(product.category) ? product.category : "")} onChange={(event) => setProductCategoriesById((previous) => ({ ...previous, [id]: event.target.value }))} style={{ width: "100%", minWidth: 0, padding: "6px 5px", borderRadius: 7, border: "1px solid rgba(148,163,184,.25)", background: "#0b1423", color: "#cbd5e1", fontSize: 11 }}><option value="">{locale === "ar" ? "اختر الفئة" : locale === "fr" ? "Choisir catégorie" : "Choose category"}</option>{productCategoryList.map((category) => <option key={category} value={category}>{category}</option>)}</select></> : <small style={{ color: "#64748b", fontSize: 11 }}>{locale === "ar" ? "خانة فارغة — اختر منتجًا" : locale === "fr" ? "Case vide — choisissez un produit" : "Empty tile — choose a product"}</small>}
                          </div>;
                        })}
                      </div>
                    <div className="settings-profile-actions">
                      <button type="button" className="settings-save-button" onClick={saveProductSettings}><Save size={15} />{t.saveProductSettings}</button>
                      {productSettingsMessage && <span className="settings-feedback settings-feedback-success" role="status"><CheckCircle2 size={15} />{productSettingsMessage}</span>}
                    </div>
                  </div>
                </>
              )}

              {section === "soundSettings" && (
                <div className="settings-card settings-preferences-card">
                  <div className="settings-card-heading"><Volume2 size={18} /><div><h4>{t.soundSettings}</h4><p>{t.soundSettingsText}</p></div></div>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(148,163,184,.16)", color: "#e2e8f0", fontWeight: 650 }}>
                    <span>{t.soundEnabled}</span>
                    <input type="checkbox" checked={soundSettings.enabled} onChange={(event) => updateSoundSetting("enabled", event.target.checked)} />
                  </label>
                  <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(148,163,184,.16)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, color: "#cbd5e1" }}><label htmlFor="veltro-sound-volume">{t.soundVolume}</label><strong>{soundSettings.volume}%</strong></div>
                    <input id="veltro-sound-volume" type="range" min="0" max="100" step="5" value={soundSettings.volume} disabled={!soundSettings.enabled} onChange={(event) => updateSoundSetting("volume", Number(event.target.value))} style={{ width: "100%", accentColor: "#35d6d0" }} />
                  </div>
                  <div style={{ display: "grid", gap: 12, padding: "18px 0" }}>
                    {[
                      ["barcode", t.soundBarcode],
                      ["sale", t.soundSale],
                      ["errors", t.soundErrors],
                      ["alerts", t.soundAlerts],
                      ["price", t.soundPrice],
                      ["quantity", t.soundQuantity],
                      ["delete", t.soundDelete],
                      ["confirm", t.soundConfirm],
                    ].map(([key, label]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", border: "1px solid rgba(148,163,184,.18)", borderRadius: 10, background: "rgba(15,23,42,.32)", color: "#cbd5e1" }}>
                        <span>{label}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button type="button" className="settings-secondary-button" onClick={() => previewSound(key)} disabled={!soundSettings.enabled || !soundSettings[key]}>{t.soundPreview}</button>
                          <input type="checkbox" aria-label={label} checked={soundSettings[key]} disabled={!soundSettings.enabled} onChange={(event) => updateSoundSetting(key, event.target.checked)} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6, margin: "0 0 12px" }}>{t.soundHint}</p>
                  {soundSettingsMessage && <div className="settings-feedback settings-feedback-success" role="status"><CheckCircle2 size={15} />{soundSettingsMessage}</div>}
                </div>
              )}

              {section === "preferences" && (
                <div className="settings-card settings-preferences-card">
                  <div className="settings-card-heading"><Languages size={18} /><div><h4>{t.language}</h4><p>{t.languageText}</p></div></div>
                  <div className="settings-language-options">{Object.entries(localeName).map(([value, label]) => <button type="button" key={value} className={`settings-language-option ${locale === value ? "selected" : ""}`} onClick={() => onLocaleChange?.(value)}><span className="settings-language-code">{value.toUpperCase()}</span><span>{label}</span>{locale === value && <CheckCircle2 size={17} />}</button>)}</div>
                  <div className="settings-preference-divider" />
                  <div className="settings-card-heading"><Database size={18} /><div><h4>{t.currency}</h4><p>{t.currencyText}</p></div></div>
                  <div className="settings-currency-row"><span className="settings-currency-symbol">DA</span><div><strong>{t.currencyValue}</strong><small>DA · DZD</small></div><span className="settings-fixed-label">DZD</span></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
