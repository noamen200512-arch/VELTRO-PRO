import React, { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { supabase } from "./lib/supabase.js";
import App from "./App.jsx";

const messages = {
  en: {
    loading: "Checking your session…",
    subtitle: "Sign in to your account",
    email: "Email address",
    password: "Password",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "Enter your password",
    login: "Sign in",
    signingIn: "Signing in…",
    secured: "Secure sign-in powered by Supabase",
    invalid: "The email address or password is incorrect.",
    loginError: "Unable to sign in. Please try again.",
    sessionError: "Unable to verify your session.",
    logoutError: "Unable to sign out. Please try again.",
    language: "Language",
  },
  fr: {
    loading: "Vérification de votre session…",
    subtitle: "Connectez-vous à votre compte",
    email: "Adresse e-mail",
    password: "Mot de passe",
    emailPlaceholder: "nom@exemple.com",
    passwordPlaceholder: "Saisissez votre mot de passe",
    login: "Se connecter",
    signingIn: "Connexion…",
    secured: "Connexion sécurisée par Supabase",
    invalid: "L’adresse e-mail ou le mot de passe est incorrect.",
    loginError: "Impossible de se connecter. Veuillez réessayer.",
    sessionError: "Impossible de vérifier votre session.",
    logoutError: "Impossible de se déconnecter. Veuillez réessayer.",
    language: "Langue",
  },
  ar: {
    loading: "جارٍ التحقق من الجلسة…",
    subtitle: "سجّل الدخول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "name@example.com",
    passwordPlaceholder: "أدخل كلمة المرور",
    login: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول…",
    secured: "تسجيل دخول آمن بواسطة Supabase",
    invalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    loginError: "تعذر تسجيل الدخول. حاول مرة أخرى.",
    sessionError: "تعذر التحقق من الجلسة.",
    logoutError: "تعذر تسجيل الخروج. حاول مرة أخرى.",
    language: "اللغة",
  },
};

const languageOptions = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export default function AuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locale, setLocale] = useState(() => {
    try {
      const saved = window.localStorage.getItem("veltro-language");
      return ["en", "fr", "ar"].includes(saved) ? saved : "fr";
    } catch {
      return "fr";
    }
  });
  const t = messages[locale] || messages.fr;
  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = locale;
    try {
      window.localStorage.setItem("veltro-language", locale);
    } catch {
      // The language remains usable for this session if storage is unavailable.
    }
  }, [locale, direction]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError("sessionError");
      setSession(data?.session ?? null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setError("sessionError");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginError) throw loginError;
      setSession(data.session);
    } catch (err) {
      const message = String(err?.message || "");
      if (/invalid login credentials|invalid email or password/i.test(message)) {
        setError("invalid");
      } else {
        setError("loginError");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError("logoutError");
  }

  if (loading) {
    return (
      <div style={{ ...styles.screen, direction }}>
        <p>{t.loading}</p>
      </div>
    );
  }

  if (session) {
    return <App onLogout={handleLogout} currentUser={session?.user || null} />;
  }

  return (
    <main style={{ ...styles.screen, direction }}>
      <form onSubmit={handleLogin} style={styles.card}>
        <div style={styles.languageHeading}>
          <span><Languages size={15} /> {t.language}</span>
          <div style={styles.languageOptions} role="group" aria-label={t.language}>
            {languageOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setLocale(option.code)}
                aria-pressed={locale === option.code}
                style={{
                  ...styles.languageButton,
                  ...(locale === option.code ? styles.languageButtonActive : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.logo}>V</div>
        <h1 style={styles.title}>VELTRO-PRO</h1>
        <p style={styles.subtitle}>{t.subtitle}</p>

        <label style={styles.label} htmlFor="veltro-email">{t.email}</label>
        <input
          id="veltro-email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.emailPlaceholder}
          style={styles.input}
          dir="ltr"
        />

        <label style={styles.label} htmlFor="veltro-password">{t.password}</label>
        <input
          id="veltro-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t.passwordPlaceholder}
          style={styles.input}
          dir="auto"
        />

        {error && <p style={styles.error} role="alert">{t[error] || error}</p>}

        <button type="submit" disabled={busy} style={{ ...styles.submit, opacity: busy ? 0.7 : 1 }}>
          {busy ? t.signingIn : t.login}
        </button>

        <p style={styles.footer}>{t.secured}</p>
      </form>
    </main>
  );
}

const styles = {
  screen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    boxSizing: "border-box",
    background: "#080c14",
    color: "#edf4ff",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 430,
    boxSizing: "border-box",
    padding: 28,
    border: "1px solid rgba(148,163,184,.2)",
    borderRadius: 18,
    background: "#101725",
    boxShadow: "0 20px 60px rgba(0,0,0,.3)",
  },
  languageHeading: {
    display: "grid",
    gap: 10,
    marginBottom: 24,
    color: "#a7b5c9",
    fontSize: 12,
  },
  languageOptions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
  },
  languageButton: {
    border: "1px solid #303c50",
    borderRadius: 8,
    padding: "7px 10px",
    background: "#080c14",
    color: "#cbd5e1",
    fontSize: 12,
    cursor: "pointer",
  },
  languageButtonActive: {
    borderColor: "#32d6c5",
    background: "rgba(50,214,197,.12)",
    color: "#62e4d7",
  },
  logo: {
    width: 52,
    height: 52,
    display: "grid",
    placeItems: "center",
    borderRadius: 14,
    background: "#32d6c5",
    color: "#08111c",
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 18,
  },
  title: { margin: "0 0 8px", fontSize: 25, fontWeight: 800 },
  subtitle: { color: "#8d9bb0", margin: "0 0 26px" },
  label: { display: "block", margin: "16px 0 8px", fontSize: 14 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    borderRadius: 10,
    border: "1px solid #303c50",
    background: "#080c14",
    color: "#edf4ff",
    fontSize: 16,
    outline: "none",
  },
  submit: {
    width: "100%",
    marginTop: 22,
    padding: 14,
    border: 0,
    borderRadius: 10,
    background: "#32d6c5",
    color: "#07121a",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
  },
  error: { marginTop: 14, color: "#ff8b8b", fontSize: 14, lineHeight: 1.6 },
  footer: { margin: "20px 0 0", color: "#8d9bb0", fontSize: 12, textAlign: "center" },
};
