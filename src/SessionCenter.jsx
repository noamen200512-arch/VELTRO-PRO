import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, Laptop, LockKeyhole, RefreshCw, Search, ShieldAlert, ShieldCheck, Smartphone, UsersRound, Wifi, WifiOff, XCircle, Zap, History, X } from "lucide-react";
import { supabase } from "./lib/supabase.js";
import { requestOrganizationSync, requestSessionRevocation, refreshOrganizationCache } from "./lib/realtimeSync.js";
import "./session-center.css";

const dict = {
en: {
title:"Sync & Sessions", subtitle:"Monitor organization synchronization, accounts, sessions and devices.", sync:"Synchronization", accounts:"Accounts & sessions", activity:"Activity log", devices:"Devices", security:"Security",
syncTitle:"Organization synchronization", syncText:"Refresh supported cloud data on this device and notify connected devices in this organization.", syncNow:"Synchronize all connected devices", syncing:"Synchronizing…", realtime:"Real-time sync", enabled:"Enabled", syncMode:"Changes refresh automatically when real-time events are received. Manual synchronization is available at any time.", coverage:"Current cloud refresh coverage", products:"Products", customers:"Customers", suppliers:"Suppliers", sales:"Sales invoices", purchases:"Purchase invoices", syncNote:"Other modules may need additional cloud integration before their data can be synchronized here.", lastSync:"Last refresh", syncSettings:"Synchronization settings", cloudData:"Cloud module", reconnect:"Refresh this device when connection returns", reconnectText:"Automatically reload supported cloud data on this device after it reconnects.", logErrors:"Record synchronization errors", logErrorsText:"Add detected synchronization errors to this visit’s activity log.",
accountsTitle:"Organization accounts", accountsText:"Accounts and sessions visible to this organization.", search:"Search name, ID or role…", all:"All", online:"Connected now", offline:"Not connected", suspended:"Suspended", active:"Active account", owner:"Owner", user:"User", account:"Account", role:"Role", status:"Account status", session:"Session", lastSeen:"Last seen", actions:"Actions", terminate:"End connected sessions", terminating:"Sending request…", noAccounts:"No accounts found.", noPresence:"No connected sessions are currently visible.", revokeWarning:"This sends a sign-out request to currently connected VELTRO-PRO devices. Offline devices cannot receive it, and this does not revoke server-side refresh tokens.", confirmTerminate:"End all connected sessions for this account?", sent:"Request sent to connected devices.", requestSent:"Waiting for device acknowledgement…", acknowledged:"Device received request; checking connection…", confirmed:"Session ended — device is now disconnected.", failed:"Operation failed",
activityTitle:"Recent activity", activityText:"Synchronization and security events observed in this browser during this visit.", noActivity:"No activity recorded in this view yet.", devicesTitle:"Connected devices", devicesText:"Devices currently reporting presence to the organization channel.", device:"Device", heartbeat:"Last heartbeat", securityTitle:"Security & access", securityText:"Review connected sessions and account state. Server-side session revocation requires a trusted server function.", secureBroadcast:"Connected-device sign-out", secureBroadcastText:"Available for connected devices only.", accountState:"Account state", accountStateText:"Account suspension must be handled through account administration.", loading:"Loading accounts…", retry:"Retry", loadError:"Could not load organization accounts. Check database permissions.", justNow:"Just now", minutes:"min ago", hours:"h ago", refresh:"Refresh", current:"This device", unknown:"Unknown device", never:"Not reported", sessionHistory:"Session history", viewHistory:"View history", loginTime:"Signed in", logoutTime:"Signed out", duration:"Duration", deviceLabel:"Device", logoutReason:"End reason", noHistory:"No session history recorded yet.", historyError:"Could not load session history.", loadingHistory:"Loading session history…", activeSession:"Still active", unconfirmed:"Connection lost / exit unconfirmed", endedByOwner:"Ended by owner", signedOut:"Signed out"
},
fr: {
title:"Synchronisation et sessions", subtitle:"Surveillez la synchronisation, les comptes, les sessions et les appareils.", sync:"Synchronisation", accounts:"Comptes et sessions", activity:"Journal d’activité", devices:"Appareils", security:"Sécurité",
syncTitle:"Synchronisation de l’organisation", syncText:"Actualisez les données cloud prises en charge et avertissez les appareils connectés.", syncNow:"Synchroniser tous les appareils connectés", syncing:"Synchronisation…", realtime:"Synchronisation temps réel", enabled:"Activée", syncMode:"Les modifications sont actualisées automatiquement lors des événements temps réel. La synchronisation manuelle reste disponible.", coverage:"Données actuellement prises en charge", products:"Produits", customers:"Clients", suppliers:"Fournisseurs", sales:"Factures de vente", purchases:"Factures d’achat", syncNote:"D’autres modules peuvent nécessiter une intégration cloud supplémentaire.", lastSync:"Dernière actualisation", syncSettings:"Paramètres de synchronisation", cloudData:"Module cloud", reconnect:"Actualiser cet appareil au retour de la connexion", reconnectText:"Recharger automatiquement les données cloud prises en charge après reconnexion.", logErrors:"Enregistrer les erreurs de synchronisation", logErrorsText:"Ajouter les erreurs détectées au journal de cette visite.",
accountsTitle:"Comptes de l’organisation", accountsText:"Comptes et sessions visibles dans cette organisation.", search:"Rechercher nom, ID ou rôle…", all:"Tous", online:"Connecté", offline:"Déconnecté", suspended:"Suspendu", active:"Compte actif", owner:"Propriétaire", user:"Utilisateur", account:"Compte", role:"Rôle", status:"État", session:"Session", lastSeen:"Dernière activité", actions:"Actions", terminate:"Terminer les sessions connectées", terminating:"Envoi…", noAccounts:"Aucun compte trouvé.", noPresence:"Aucune session connectée visible.", revokeWarning:"Une demande de déconnexion est envoyée aux appareils actuellement connectés. Les appareils hors ligne ne la reçoivent pas et les jetons serveur ne sont pas révoqués.", confirmTerminate:"Terminer toutes les sessions connectées de ce compte ?", sent:"Demande envoyée aux appareils connectés.", requestSent:"En attente de confirmation de l’appareil…", acknowledged:"Appareil averti ; vérification de la connexion…", confirmed:"Session terminée — appareil déconnecté.", failed:"Échec de l’opération",
activityTitle:"Activité récente", activityText:"Événements de synchronisation et de sécurité observés dans ce navigateur.", noActivity:"Aucune activité enregistrée.", devicesTitle:"Appareils connectés", devicesText:"Appareils signalant leur présence.", device:"Appareil", heartbeat:"Dernier signal", securityTitle:"Sécurité et accès", securityText:"Consultez les sessions. La révocation serveur nécessite une fonction sécurisée.", secureBroadcast:"Déconnexion des appareils connectés", secureBroadcastText:"Disponible uniquement pour les appareils connectés.", accountState:"État du compte", accountStateText:"La suspension doit être gérée par l’administration des comptes.", loading:"Chargement des comptes…", retry:"Réessayer", loadError:"Impossible de charger les comptes. Vérifiez les droits de base de données.", justNow:"À l’instant", minutes:"min", hours:"h", refresh:"Actualiser", current:"Cet appareil", unknown:"Appareil inconnu", never:"Non signalé", sessionHistory:"Historique des sessions", viewHistory:"Voir l’historique", loginTime:"Connexion", logoutTime:"Déconnexion", duration:"Durée", deviceLabel:"Appareil", logoutReason:"Motif de fin", noHistory:"Aucun historique de session enregistré.", historyError:"Impossible de charger l’historique des sessions.", loadingHistory:"Chargement de l’historique…", activeSession:"Toujours active", unconfirmed:"Connexion perdue / sortie non confirmée", endedByOwner:"Terminée par le propriétaire", signedOut:"Déconnecté"
},
ar: {
title:"المزامنة والجلسات", subtitle:"راقب مزامنة المؤسسة والحسابات والجلسات والأجهزة.", sync:"المزامنة", accounts:"الحسابات والجلسات", activity:"سجل النشاط", devices:"الأجهزة", security:"الأمان",
syncTitle:"مزامنة المؤسسة", syncText:"حدّث بيانات السحابة المدعومة على هذا الجهاز وأرسل إشعار مزامنة إلى الأجهزة المتصلة بالمؤسسة.", syncNow:"مزامنة جميع الأجهزة المتصلة", syncing:"جارٍ المزامنة…", realtime:"المزامنة الفورية", enabled:"مفعّلة", syncMode:"تُحدّث البيانات تلقائيًا عند وصول أحداث المزامنة الفورية، ويمكن بدء المزامنة يدويًا في أي وقت.", coverage:"البيانات المشمولة حاليًا", products:"المنتجات", customers:"الزبائن", suppliers:"الموردون", sales:"فواتير البيع", purchases:"فواتير الشراء", syncNote:"قد تحتاج الوحدات الأخرى إلى ربط إضافي بالسحابة قبل مزامنة بياناتها هنا.", lastSync:"آخر تحديث", syncSettings:"إعدادات المزامنة", cloudData:"وحدة سحابية", reconnect:"تحديث هذا الجهاز عند عودة الاتصال", reconnectText:"إعادة تحميل بيانات السحابة المدعومة تلقائيًا على هذا الجهاز بعد عودة الإنترنت.", logErrors:"تسجيل أخطاء المزامنة", logErrorsText:"إضافة أخطاء المزامنة المكتشفة إلى سجل النشاط خلال هذه الزيارة.",
accountsTitle:"حسابات المؤسسة", accountsText:"الحسابات والجلسات الظاهرة ضمن هذه المؤسسة.", search:"ابحث بالاسم أو المعرّف أو الدور…", all:"الكل", online:"متصل الآن", offline:"غير متصل", suspended:"موقوف", active:"حساب نشط", owner:"المالك", user:"مستخدم", account:"الحساب", role:"الدور", status:"حالة الحساب", session:"الجلسة", lastSeen:"آخر ظهور", actions:"الإجراءات", terminate:"إنهاء الجلسات المتصلة", terminating:"جارٍ إرسال الطلب…", noAccounts:"لم يتم العثور على حسابات.", noPresence:"لا توجد جلسات متصلة ظاهرة حاليًا.", revokeWarning:"يرسل هذا طلب تسجيل خروج إلى أجهزة VELTRO-PRO المتصلة حاليًا. الأجهزة غير المتصلة لن تستلمه، ولا يؤدي ذلك إلى إبطال رموز الجلسات على الخادم.", confirmTerminate:"هل تريد إنهاء جميع الجلسات المتصلة لهذا الحساب؟", sent:"تم إرسال طلب الإنهاء إلى الأجهزة المتصلة.", requestSent:"بانتظار تأكيد الجهاز…", acknowledged:"استلم الجهاز الطلب؛ جارٍ التحقق من الاتصال…", confirmed:"انتهت الجلسة — أصبح الجهاز غير متصل.", failed:"فشلت العملية",
activityTitle:"النشاط الأخير", activityText:"أحداث المزامنة والأمان التي رُصدت في هذا المتصفح خلال الزيارة الحالية.", noActivity:"لم يتم تسجيل نشاط في هذه الواجهة بعد.", devicesTitle:"الأجهزة المتصلة", devicesText:"الأجهزة التي ترسل حاليًا إشارات اتصال إلى قناة المؤسسة.", device:"الجهاز", heartbeat:"آخر إشارة", securityTitle:"الأمان والوصول", securityText:"راجع الجلسات المتصلة. إبطال الجلسات من جهة الخادم يحتاج إلى وظيفة موثوقة.", secureBroadcast:"تسجيل خروج الأجهزة المتصلة", secureBroadcastText:"متاح للأجهزة المتصلة حاليًا فقط.", accountState:"حالة الحساب", accountStateText:"يجب إيقاف الحساب من إدارة الحسابات.", loading:"جارٍ تحميل الحسابات…", retry:"إعادة المحاولة", loadError:"تعذر تحميل حسابات المؤسسة. تحقق من صلاحيات قاعدة البيانات.", justNow:"الآن", minutes:"د", hours:"س", refresh:"تحديث", current:"هذا الجهاز", unknown:"جهاز غير معروف", never:"غير مسجل", sessionHistory:"سجل الجلسات", viewHistory:"عرض السجل", loginTime:"وقت الدخول", logoutTime:"وقت الخروج", duration:"المدة", deviceLabel:"الجهاز", logoutReason:"سبب الانتهاء", noHistory:"لا يوجد سجل جلسات محفوظ بعد.", historyError:"تعذر تحميل سجل الجلسات.", loadingHistory:"جارٍ تحميل سجل الجلسات…", activeSession:"الجلسة ما زالت نشطة", unconfirmed:"انقطع الاتصال / الخروج غير مؤكد", endedByOwner:"أنهاها المالك", signedOut:"تسجيل خروج"
}
};

function formatLocaleDate(value, locale) {
  const language = locale === "ar" ? "ar-DZ" : locale === "fr" ? "fr-FR" : "en-GB";
  return new Date(value).toLocaleString(language);
}

function ageLabel(value, t, locale) {
  if (!value) return t.never;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return t.justNow;
  if (seconds < 3600) return Math.floor(seconds / 60) + " " + t.minutes;
  if (seconds < 86400) return Math.floor(seconds / 3600) + " " + t.hours;
  return formatLocaleDate(value, locale);
}
function DeviceIcon({ label }) { return /android|iphone|ipad|mobile/i.test(label || "") ? <Smartphone size={21} /> : <Laptop size={21} />; }

export default function SessionCenter({ locale = "en", organizationId, currentUser }) {
  const t = dict[locale] || dict.en;
  const [section, setSection] = useState("sync");
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);
  const [presence, setPresence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const [actionUser, setActionUser] = useState("");
  const [sessionStatus, setSessionStatus] = useState({});
  const [sessionModalAccount, setSessionModalAccount] = useState(null);
  const [sessionRows, setSessionRows] = useState([]);
  const [sessionHistoryLoading, setSessionHistoryLoading] = useState(false);
  const [sessionHistoryError, setSessionHistoryError] = useState("");
  const [notice, setNotice] = useState("");
  const [events, setEvents] = useState([]);
  const [syncOnReconnect, setSyncOnReconnect] = useState(() => { try { return localStorage.getItem("veltro-sync-reconnect-" + organizationId) !== "false"; } catch { return true; } });
  const [logSyncErrors, setLogSyncErrors] = useState(() => { try { return localStorage.getItem("veltro-sync-errors-" + organizationId) !== "false"; } catch { return true; } });
  const addEvent = useCallback((kind, message) => setEvents((old) => [{ id: Date.now() + Math.random(), kind, message, at: new Date().toISOString() }, ...old].slice(0, 50)), []);

  const loadAccounts = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true); setError("");
    try {
      const results = await Promise.all([
        supabase.from("profiles").select("user_id, organization_id, role_id, full_name, phone, status, is_owner, created_at").eq("organization_id", organizationId).order("created_at", { ascending: true }),
        supabase.from("roles").select("id, organization_id, name").eq("organization_id", organizationId).order("name"),
      ]);
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      setAccounts(results[0].data || []); setRoles(results[1].data || []);
    } catch (err) { setError(err?.message || t.loadError); }
    finally { setLoading(false); }
  }, [organizationId, t.loadError]);
  useEffect(() => { void loadAccounts(); }, [loadAccounts]);
  useEffect(() => {
    try {
      localStorage.setItem("veltro-sync-reconnect-" + organizationId, String(syncOnReconnect));
      localStorage.setItem("veltro-sync-errors-" + organizationId, String(logSyncErrors));
    } catch { /* Local settings are optional when browser storage is restricted. */ }
  }, [organizationId, syncOnReconnect, logSyncErrors]);

  useEffect(() => {
    if (!organizationId) return undefined;
    let alive = true;
    const channel = supabase.channel("veltro-org-sync-" + organizationId, { config: { broadcast: { self: false }, presence: { key: "monitor-" + (currentUser?.id || "owner") + "-" + Date.now() } } });
    const updatePresence = () => {
      if (!alive) return;
      const nextPresence = Object.values(channel.presenceState()).flatMap((sessions) => sessions.map((session) => ({ ...session })));
      setPresence(nextPresence);
      setSessionStatus((previous) => {
        const next = { ...previous };
        Object.entries(previous).forEach(([userId, state]) => {
          if ((state === "acknowledged" || state === "requested") && !nextPresence.some((session) => String(session.userId) === userId)) next[userId] = "confirmed";
        });
        return next;
      });
    };
    channel.on("presence", { event: "sync" }, updatePresence);
    channel.on("presence", { event: "join" }, updatePresence);
    channel.on("presence", { event: "leave" }, updatePresence);
    channel.on("broadcast", { event: "revoke_session_ack" }, (message) => {
      if (String(message?.payload?.organizationId || "") !== String(organizationId)) return;
      const userId = String(message?.payload?.userId || "");
      if (!userId) return;
      setSessionStatus((previous) => ({ ...previous, [userId]: "acknowledged" }));
      addEvent("notice", (locale === "ar" ? "استلم الجهاز طلب إنهاء الجلسة للحساب: " : locale === "fr" ? "Demande de déconnexion reçue par l’appareil : " : "Device acknowledged the sign-out request for account: ") + userId.slice(0,8));
    });
    channel.subscribe((status) => { if (status === "SUBSCRIBED") updatePresence(); });
    const timer = window.setInterval(updatePresence, 1000);
    const onSync = (event) => {
      if (event.detail?.organizationId !== organizationId) return;
      setLastSync(event.detail.refreshedAt || new Date().toISOString());
      addEvent("success", locale === "ar" ? "تم تحديث ذاكرة البيانات المحلية" : locale === "fr" ? "Cache local actualisé" : "Local data cache refreshed");
    };
    const onError = (event) => { if (logSyncErrors && event.detail?.organizationId === organizationId) addEvent("error", event.detail.message || t.failed); };
    const onOnline = () => {
      if (!syncOnReconnect) return;
      void refreshOrganizationCache(organizationId);
      addEvent("success", t.reconnect);
    };
    window.addEventListener("veltro:cloud-sync", onSync);
    window.addEventListener("veltro:cloud-sync-error", onError);
    window.addEventListener("online", onOnline);
    return () => {
      alive = false; window.clearInterval(timer);
      window.removeEventListener("veltro:cloud-sync", onSync);
      window.removeEventListener("veltro:cloud-sync-error", onError);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [organizationId, currentUser?.id, locale, addEvent, t.failed, syncOnReconnect, logSyncErrors, t.reconnect]);

  const roleById = useMemo(() => Object.fromEntries(roles.map((role) => [String(role.id), role.name])), [roles]);
  const onlineByUser = useMemo(() => {
    const map = new Map();
    presence.forEach((session) => { if (session.userId) map.set(String(session.userId), [...(map.get(String(session.userId)) || []), session]); });
    return map;
  }, [presence]);
  const filteredAccounts = useMemo(() => accounts.filter((account) => {
    const online = (onlineByUser.get(String(account.user_id)) || []).length > 0;
    const role = account.is_owner ? t.owner : roleById[String(account.role_id)] || t.user;
    const q = search.trim().toLowerCase();
    const match = !q || [account.full_name, account.user_id, role, account.phone].some((value) => String(value || "").toLowerCase().includes(q));
    return match && (filter === "all" || (filter === "online" && online) || (filter === "offline" && !online) || (filter === "suspended" && account.status !== "active"));
  }), [accounts, onlineByUser, search, filter, roleById, t.owner, t.user]);

  const openSessionHistory = async (account) => {
    setSessionModalAccount(account); setSessionRows([]); setSessionHistoryError(""); setSessionHistoryLoading(true);
    try {
      const { data, error: historyError } = await supabase.from("user_session_history").select("session_id, login_at, logout_at, last_seen_at, device_label, logout_reason").eq("organization_id", organizationId).eq("user_id", account.user_id).order("login_at", { ascending: false }).limit(100);
      if (historyError) throw historyError;
      setSessionRows(data || []);
    } catch (err) { setSessionHistoryError(err?.message || t.historyError); }
    finally { setSessionHistoryLoading(false); }
  };
  const durationLabel = (row) => {
    const start = new Date(row.login_at).getTime(); const end = row.logout_at ? new Date(row.logout_at).getTime() : Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
    const totalMinutes = Math.floor((end - start) / 60000); const days = Math.floor(totalMinutes / 1440); const hours = Math.floor((totalMinutes % 1440) / 60); const minutes = totalMinutes % 60;
    return (days ? days + "d " : "") + (hours ? hours + "h " : "") + minutes + "m";
  };
  const reasonLabel = (row) => {
    if (!row.logout_at) return Date.now() - new Date(row.last_seen_at || row.login_at).getTime() > 90000 ? t.unconfirmed : t.activeSession;
    if (row.logout_reason === "ended_by_owner") return t.endedByOwner;
    if (row.logout_reason === "signed_out") return t.signedOut;
    return row.logout_reason || "—";
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true); setNotice("");
    try {
      const result = await requestOrganizationSync(organizationId);
      setLastSync(result.refreshedAt); setNotice(t.sent); addEvent("success", t.syncNow);
    } catch (err) { setNotice(err?.message || t.failed); addEvent("error", err?.message || t.failed); }
    finally { setSyncing(false); }
  };
  const terminateSessions = async (account) => {
    if (!window.confirm(t.confirmTerminate)) return;
    setActionUser(String(account.user_id)); setNotice("");
    try {
      setSessionStatus((previous) => ({ ...previous, [String(account.user_id)]: "requested" }));
      await requestSessionRevocation(organizationId, account.user_id);
      setNotice(t.sent); addEvent("notice", t.terminate + ": " + (account.full_name || account.user_id));
    } catch (err) { setSessionStatus((previous) => ({ ...previous, [String(account.user_id)]: "failed" })); setNotice(err?.message || t.failed); addEvent("error", err?.message || t.failed); }
    finally { setActionUser(""); }
  };
  const sections = [
    { id: "sync", label: t.sync, icon: RefreshCw }, { id: "accounts", label: t.accounts, icon: UsersRound },
    { id: "activity", label: t.activity, icon: Activity }, { id: "devices", label: t.devices, icon: Laptop }, { id: "security", label: t.security, icon: ShieldCheck },
  ];

  return <section className="session-center" dir={locale === "ar" ? "rtl" : "ltr"}>
    <header className="sc-intro"><div className="sc-intro-icon"><RefreshCw size={25} /></div><div className="sc-intro-copy"><span className="sc-eyebrow">VELTRO · CONTROL CENTER</span><h2>{t.title}</h2><p>{t.subtitle}</p></div><button type="button" className="sc-button sc-button-secondary" onClick={() => void loadAccounts()}><RefreshCw size={16} />{t.refresh}</button></header>
    <nav className="sc-tabs" aria-label={t.title}>{sections.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}><Icon size={17} /><span>{item.label}</span></button>; })}</nav>
    {notice && <div className="sc-notice" role="status"><AlertTriangle size={16} /><span>{notice}</span><button type="button" aria-label="Dismiss" onClick={() => setNotice("")}>×</button></div>}

    {section === "sync" && <div className="sc-stack">
      <div className="sc-sync-hero"><div className="sc-sync-copy"><span className="sc-eyebrow">{t.realtime}</span><h3>{t.syncTitle}</h3><p>{t.syncText}</p></div><div className="sc-live-badge"><i />{t.enabled}</div><button type="button" className="sc-button sc-button-primary" onClick={handleSync} disabled={syncing}><RefreshCw size={17} className={syncing ? "sc-spin" : ""} />{syncing ? t.syncing : t.syncNow}</button></div>
      <div className="sc-kpi-grid">{[[Database,t.products,"products"],[UsersRound,t.customers,"customers"],[UsersRound,t.suppliers,"suppliers"],[Activity,t.sales,"sales_invoices"],[Database,t.purchases,"purchase_invoices"]].map(([Icon,label,table]) => <article className="sc-kpi" key={table}><span><Icon size={18} /></span><strong>{label}</strong><small>{t.cloudData}</small></article>)}</div>
      <article className="sc-panel"><div className="sc-panel-heading"><div><h3>{t.coverage}</h3><p>{t.syncMode}</p></div><span className="sc-live-badge"><Zap size={13} />{t.enabled}</span></div><div className="sc-sync-rows">{[t.products,t.customers,t.suppliers,t.sales,t.purchases].map((label) => <div key={label}><CheckCircle2 size={16} /><span>{label}</span><small>{t.enabled}</small></div>)}</div><div className="sc-settings-block"><h4>{t.syncSettings}</h4><label className="sc-setting-row"><span><strong>{t.reconnect}</strong><small>{t.reconnectText}</small></span><input type="checkbox" checked={syncOnReconnect} onChange={(event) => setSyncOnReconnect(event.target.checked)} /></label><label className="sc-setting-row"><span><strong>{t.logErrors}</strong><small>{t.logErrorsText}</small></span><input type="checkbox" checked={logSyncErrors} onChange={(event) => setLogSyncErrors(event.target.checked)} /></label></div><p className="sc-footnote"><AlertTriangle size={15} />{t.syncNote}</p>{lastSync && <p className="sc-last-sync"><Clock3 size={15} />{t.lastSync}: {formatLocaleDate(lastSync, locale)}</p>}</article>
    </div>}

    {section === "accounts" && <article className="sc-panel"><div className="sc-panel-heading"><div><h3>{t.accountsTitle}</h3><p>{t.accountsText}</p></div><span className="sc-count">{filteredAccounts.length} / {accounts.length}</span></div><div className="sc-toolbar"><label className="sc-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.search} /></label><div className="sc-filters">{[["all",t.all],["online",t.online],["offline",t.offline],["suspended",t.suspended]].map(([value,label]) => <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {loading ? <div className="sc-empty"><RefreshCw className="sc-spin" size={20} />{t.loading}</div> : error ? <div className="sc-error"><AlertTriangle size={18} /><span>{error}</span><button type="button" onClick={() => void loadAccounts()}>{t.retry}</button></div> : filteredAccounts.length === 0 ? <div className="sc-empty"><UsersRound size={24} />{t.noAccounts}</div> : <div className="sc-table-wrap"><table className="sc-table"><thead><tr><th>{t.account}</th><th>{t.role}</th><th>{t.status}</th><th>{t.session}</th><th>{t.lastSeen}</th><th>{t.actions}</th></tr></thead><tbody>{filteredAccounts.map((account) => {
        const sessions = onlineByUser.get(String(account.user_id)) || []; const online = sessions.length > 0; const suspended = account.status !== "active"; const role = account.is_owner ? t.owner : roleById[String(account.role_id)] || t.user;
        return <tr key={account.user_id}><td><div className="sc-account-cell"><span className="sc-avatar">{(account.full_name || account.user_id || "?").slice(0,1).toUpperCase()}</span><span><strong>{account.full_name || t.user}</strong><small>{String(account.user_id).slice(0,8)}… {String(account.user_id) === String(currentUser?.id) ? "· " + t.current : ""}</small></span></div></td><td><span className={account.is_owner ? "sc-role-owner" : "sc-role"}>{role}</span></td><td><span className={suspended ? "sc-state sc-state-danger" : "sc-state sc-state-success"}><i />{suspended ? t.suspended : t.active}</span></td><td><span className={(sessionStatus[String(account.user_id)] === "confirmed" ? "sc-state sc-state-success" : sessionStatus[String(account.user_id)] === "requested" ? "sc-state sc-state-muted" : online ? "sc-state sc-state-success" : "sc-state sc-state-muted")}><i />{sessionStatus[String(account.user_id)] === "confirmed" ? t.confirmed : (sessionStatus[String(account.user_id)] === "requested" ? t.requestSent : sessionStatus[String(account.user_id)] === "acknowledged" ? t.acknowledged : online ? t.online + " (" + sessions.length + ")" : t.offline)}</span></td><td>{ageLabel(sessions[0]?.lastSeenAt || sessions[0]?.connectedAt,t,locale)}</td><td><div className="sc-action-group"><button type="button" className="sc-button sc-button-history" onClick={() => void openSessionHistory(account)} title={t.viewHistory}><History size={14} />{t.viewHistory}</button><button type="button" className="sc-button sc-button-danger" disabled={!online || String(account.user_id) === String(currentUser?.id) || actionUser === String(account.user_id)} onClick={() => void terminateSessions(account)} title={t.revokeWarning}><LockKeyhole size={14} />{actionUser === String(account.user_id) ? t.terminating : t.terminate}</button></div></td></tr>;
      })}</tbody></table></div>}<p className="sc-footnote"><AlertTriangle size={15} />{t.revokeWarning}</p>
    </article>}

    {section === "activity" && <article className="sc-panel"><div className="sc-panel-heading"><div><h3>{t.activityTitle}</h3><p>{t.activityText}</p></div><Activity size={20} /></div>{events.length ? <div className="sc-event-list">{events.map((event) => <div key={event.id} className="sc-event-row"><span className={"sc-event-icon sc-event-" + event.kind}>{event.kind === "success" ? <CheckCircle2 size={16} /> : event.kind === "error" ? <XCircle size={16} /> : <AlertTriangle size={16} />}</span><span><strong>{event.message}</strong><small>{formatLocaleDate(event.at, locale)}</small></span></div>)}</div> : <div className="sc-empty"><Activity size={25} />{t.noActivity}</div>}</article>}

    {section === "devices" && <article className="sc-panel"><div className="sc-panel-heading"><div><h3>{t.devicesTitle}</h3><p>{t.devicesText}</p></div><span className="sc-count">{presence.length}</span></div>{presence.length ? <div className="sc-device-grid">{presence.map((session,index) => { const account = accounts.find((item) => String(item.user_id) === String(session.userId)); return <article className="sc-device-card" key={String(session.userId) + "-" + index}><span className="sc-device-icon"><DeviceIcon label={session.deviceLabel} /></span><span className="sc-state sc-state-success"><i />{t.online}</span><h4>{account?.full_name || String(session.userId || "").slice(0,8)}</h4><p>{session.deviceLabel || t.unknown}</p><small>{t.heartbeat}: {ageLabel(session.lastSeenAt,t,locale)}</small></article>; })}</div> : <div className="sc-empty"><WifiOff size={25} />{t.noPresence}</div>}</article>}

    {section === "security" && <div className="sc-stack"><article className="sc-panel"><div className="sc-panel-heading"><div><h3>{t.securityTitle}</h3><p>{t.securityText}</p></div><ShieldCheck size={22} /></div><div className="sc-security-row"><span className="sc-security-icon"><Wifi size={19} /></span><span><strong>{t.secureBroadcast}</strong><small>{t.secureBroadcastText}</small></span><span className="sc-live-badge">{t.enabled}</span></div><div className="sc-security-row"><span className="sc-security-icon"><UsersRound size={19} /></span><span><strong>{t.accountState}</strong><small>{t.accountStateText}</small></span><span className="sc-live-badge">{accounts.length}</span></div><p className="sc-footnote"><ShieldAlert size={15} />{t.revokeWarning}</p></article></div>}
    {sessionModalAccount && <div className="sc-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSessionModalAccount(null); }}>
      <section className="sc-history-modal" role="dialog" aria-modal="true" aria-labelledby="sc-history-title" dir={locale === "ar" ? "rtl" : "ltr"}>
        <header className="sc-history-header"><div><span className="sc-eyebrow">VELTRO · AUDIT LOG</span><h3 id="sc-history-title">{t.sessionHistory}</h3><p>{sessionModalAccount.full_name || t.user} · {String(sessionModalAccount.user_id).slice(0, 8)}…</p></div><button type="button" className="sc-history-close" onClick={() => setSessionModalAccount(null)} aria-label="Close"><X size={18} /></button></header>
        {sessionHistoryLoading ? <div className="sc-empty"><RefreshCw className="sc-spin" size={20} />{t.loadingHistory}</div> : sessionHistoryError ? <div className="sc-error"><AlertTriangle size={18} /><span>{sessionHistoryError}</span><button type="button" onClick={() => void openSessionHistory(sessionModalAccount)}>{t.retry}</button></div> : sessionRows.length === 0 ? <div className="sc-empty"><History size={24} />{t.noHistory}</div> : <div className="sc-table-wrap sc-history-table-wrap"><table className="sc-table sc-history-table"><thead><tr><th>{t.loginTime}</th><th>{t.logoutTime}</th><th>{t.duration}</th><th>{t.deviceLabel}</th><th>{t.logoutReason}</th></tr></thead><tbody>{sessionRows.map((row) => <tr key={row.session_id}><td>{formatLocaleDate(row.login_at, locale)}</td><td>{row.logout_at ? formatLocaleDate(row.logout_at, locale) : "—"}</td><td>{durationLabel(row)}</td><td>{row.device_label || t.unknown}</td><td><span className={!row.logout_at ? "sc-state sc-state-muted" : "sc-state sc-state-success"}><i />{reasonLabel(row)}</span></td></tr>)}</tbody></table></div>}
        <footer className="sc-history-footer"><span>{sessionRows.length} / 100</span><button type="button" className="sc-button sc-button-secondary" onClick={() => setSessionModalAccount(null)}>{locale === "ar" ? "إغلاق" : locale === "fr" ? "Fermer" : "Close"}</button></footer>
      </section>
    </div>}
  </section>;
}
