import React, { useEffect, useMemo, useState } from "react";
import {
  Building2, UsersRound, ShieldCheck, MapPinned, SlidersHorizontal,
  RefreshCw, Search, Mail, Phone, CheckCircle2, AlertCircle,
  Languages, Store, KeyRound, ChevronRight, UserRound, Database, Save, Pencil, X,

} from "lucide-react";
import { supabase } from "./lib/supabase.js";

const copy = {
  en: {
    eyebrow: "WORKSPACE CONTROL CENTER", title: "Settings",
    subtitle: "Manage your business workspace, users, access rules, and branches.",
    business: "Business profile", users: "Users & roles", permissions: "Permissions",
    branches: "Branches", preferences: "Preferences", overview: "Workspace overview",
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
    branches: "Agences", preferences: "Préférences", overview: "Vue d’ensemble",
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
    branches: "الفروع", preferences: "التفضيلات", overview: "نظرة عامة",
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
    if (!term) return data.users;
    return data.users.filter((user) => [
      user.full_name, user.phone, roleById[user.role_id]?.name, user.status,
    ].some((value) => String(value || "").toLowerCase().includes(term)));
  }, [data.users, data.roles, search, roleById]);

  const activeNav = nav.find((item) => item.id === section) || nav[0];
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
    <section className="settings-page">
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
          {loading ? (
            <div className="settings-state"><RefreshCw size={23} className="settings-spin" /><span>{t.loading}</span></div>
          ) : error ? (
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
                  <p>{section === "business" ? t.overviewText : section === "users" ? t.teamText : section === "permissions" ? t.accessRulesText : section === "branches" ? t.branchesText : t.languageText}</p>
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
                      <div className="settings-permission-groups">{Object.entries(data.permissions.reduce((groups, permission) => { const key = permission.module || "other"; (groups[key] ||= []).push(permission); return groups; }, {})).map(([module, permissions]) => <section className="settings-permission-group" key={module}><div className="settings-permission-group-heading"><span>{getPermissionModuleLabel(module, locale)}</span><span>{permissions.length}</span></div><div className="settings-permission-list">{permissions.map((permission) => <label className="settings-permission-row" key={permission.id}><input type="checkbox" checked={selectedPermissionCodes.includes(permission.code)} onChange={(event) => setSelectedPermissionCodes((previous) => event.target.checked ? [...new Set([...previous, permission.code])] : previous.filter((code) => code !== permission.code))} /><span className="settings-permission-icon"><CheckCircle2 size={15} /></span><span><strong>{permission.code}</strong><small>{getPermissionDescription(permission, locale)}</small></span></label>)}</div></section>)}</div>
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
                  <div className="settings-permission-groups">{Object.entries(data.permissions.reduce((groups, permission) => { const key = permission.module || "other"; (groups[key] ||= []).push(permission); return groups; }, {})).map(([module, permissions]) => <section className="settings-permission-group" key={module}><div className="settings-permission-group-heading"><span>{getPermissionModuleLabel(module, locale)}</span><span>{permissions.length}</span></div><div className="settings-permission-list">{permissions.map((permission) => <div className="settings-permission-row" key={permission.id}><span className="settings-permission-icon"><CheckCircle2 size={15} /></span><span><strong>{permission.code}</strong><small>{getPermissionDescription(permission, locale)}</small></span></div>)}</div></section>)}</div>
                  {!data.permissions.length && <p className="settings-empty">{t.noPermissions}</p>}
                </div>
              )}

              {section === "branches" && (
                <div className="settings-branch-grid">
                  {data.branches.map((branch) => <article className="settings-branch-card" key={branch.id}><div className="settings-branch-top"><span className="settings-branch-icon"><MapPinned size={19} /></span>{branch.is_main && <span className="settings-main-badge">{t.mainBranch}</span>}</div><h4>{branch.name}</h4><p className="settings-branch-address">{branch.address || t.noAddress}</p><div className="settings-branch-contact"><Phone size={14} /><span>{branch.phone || t.noPhone}</span></div></article>)}
                  {!data.branches.length && <div className="settings-empty">{t.noBranches}</div>}
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
