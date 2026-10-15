import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import App from "./App.jsx";

export default function AuthGate() {
const [session, setSession] = useState(null);
const [loading, setLoading] = useState(true);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [busy, setBusy] = useState(false);

useEffect(() => {
let mounted = true;

supabase.auth.getSession().then(({ data, error }) => {
  if (!mounted) return;
  if (error) setError("تعذر التحقق من الجلسة.");
  setSession(data?.session ?? null);
  setLoading(false);
});

const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((_event, newSession) => {
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
  const { data, error: loginError } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

  if (loginError) throw loginError;
  setSession(data.session);
} catch (err) {
  setError(
    err?.message === "Invalid login credentials"
      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      : err?.message || "تعذر تسجيل الدخول. حاول مرة أخرى."
  );
} finally {
  setBusy(false);
}

}

async function handleLogout() {
const { error: logoutError } = await supabase.auth.signOut();
if (logoutError) setError("تعذر تسجيل الخروج. حاول مرة أخرى.");
}

if (loading) {
return (
<div style={styles.screen}>
<p>جارٍ التحقق من تسجيل الدخول...</p>
</div>
);
}

if (session) {
return <App onLogout={handleLogout} />;
}

return (
<main style={styles.screen}>
<form onSubmit={handleLogin} style={styles.card}>
<div style={styles.logo}>V</div>
<h1 style={styles.title}>VELTRO-PRO</h1>
<p style={styles.subtitle}>سجّل الدخول إلى حسابك</p>

    <label style={styles.label} htmlFor="veltro-email">
      البريد الإلكتروني
    </label>
    <input
      id="veltro-email"
      type="email"
      autoComplete="username"
      required
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      placeholder="name@example.com"
      style={styles.input}
    />

    <label style={styles.label} htmlFor="veltro-password">
      كلمة المرور
    </label>
    <input
      id="veltro-password"
      type="password"
      autoComplete="current-password"
      required
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      placeholder="أدخل كلمة المرور"
      style={styles.input}
    />

    {error && <p style={styles.error}>{error}</p>}

    <button
      type="submit"
      disabled={busy}
      style={{
        ...styles.submit,
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
    </button>

    <p style={styles.footer}>
      تسجيل الدخول محمي بواسطة Supabase
    </p>
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
maxWidth: 390,
boxSizing: "border-box",
padding: 28,
border: "1px solid rgba(148,163,184,.2)",
borderRadius: 18,
background: "#101725",
boxShadow: "0 20px 60px rgba(0,0,0,.3)",
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
title: {
margin: "0 0 8px",
fontSize: 25,
fontWeight: 800,
},
subtitle: {
color: "#8d9bb0",
margin: "0 0 26px",
},
label: {
display: "block",
margin: "16px 0 8px",
fontSize: 14,
},
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
error: {
marginTop: 14,
color: "#ff8b8b",
fontSize: 14,
lineHeight: 1.6,
},
footer: {
margin: "20px 0 0",
color: "#8d9bb0",
fontSize: 12,
textAlign: "center",
},
};