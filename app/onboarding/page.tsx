"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, ChevronRight, User, Wrench, Users } from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";
import { supabase, supabaseReady } from "@/lib/supabase";

type Stap = "welcome" | "kies" | "login" | "registreer";

const SERIF = "'Source Serif 4', Georgia, serif";

// ─── kleine helpers ────────────────────────────────────────────────────────────
function Input({
  label, type = "text", value, onChange, placeholder, autoFocus, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoFocus?: boolean; error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8A83", marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          autoFocus={autoFocus}
          type={isPass && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: isPass ? "16px 48px 16px 16px" : "16px",
            borderRadius: 14,
            border: `0.5px solid ${error ? "#C97A4D" : "#E5DDD0"}`,
            background: "#FBF7F0",
            fontSize: 16, color: "#1A1D1A", outline: "none",
            fontFamily: "Inter, sans-serif",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8A8A83", padding: 0 }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#C97A4D", marginTop: 6 }}>{error}</p>}
    </div>
  );
}

function Btn({ label, onClick, disabled, variant = "primary" }: {
  label: string; onClick: () => void; disabled?: boolean; variant?: "primary" | "ghost";
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: "100%", padding: "18px", borderRadius: 14, fontSize: 16, fontWeight: 700,
        border: variant === "ghost" ? "0.5px solid #E5DDD0" : "none",
        background: variant === "ghost" ? "transparent" : disabled ? "#E5DDD0" : "#2B4030",
        color: variant === "ghost" ? "#1A1D1A" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}>
      {label}
    </button>
  );
}

// ─── Hoofd component ──────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { login } = useUserStore();

  const [stap, setStap] = useState<Stap>("welcome");
  const [rol, setRol] = useState<UserRole>("klant");

  // Login velden
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registreer velden
  const [naam, setNaam] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [stad, setStad] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // OAuth
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

  // Herstel OAuth-redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") !== "1") return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const n = session.user.user_metadata?.full_name ?? session.user.email ?? "Gebruiker";
        login({ role: "klant", name: n, address: "Amsterdam" });
        router.replace("/");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Demo login (als Supabase nog niet klaar is) ──────────────────────────────
  const handleDemo = (r: UserRole, name: string) => {
    login({ role: r, name, address: "Amsterdam", isAdmin: r === "vakman" });
    router.replace(r === "vakman" ? "/agenda" : "/");
  };

  // ── Echte login ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPass) return;
    setLoginLoading(true); setLoginError("");
    try {
      const { login: authLogin } = await import("@/lib/auth");
      await authLogin(loginEmail, loginPass);
      const { activeView } = useUserStore.getState();
      router.replace(activeView === "vakman" ? "/agenda" : "/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Inloggen mislukt";
      if (msg.includes("Invalid login")) setLoginError("E-mail of wachtwoord klopt niet.");
      else if (msg.includes("Email not confirmed")) setLoginError("Bevestig eerst je e-mail.");
      else setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Echte registratie ────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setRegError("");
    if (!naam.trim()) { setRegError("Vul je naam in."); return; }
    if (!regEmail.includes("@")) { setRegError("Vul een geldig e-mailadres in."); return; }
    if (regPass.length < 6) { setRegError("Wachtwoord moet minstens 6 tekens zijn."); return; }
    if (regPass !== regPass2) { setRegError("Wachtwoorden komen niet overeen."); return; }

    setRegLoading(true);
    try {
      const { register } = await import("@/lib/auth");
      await register({
        email: regEmail,
        password: regPass,
        name: naam.trim(),
        rol: rol as "klant" | "vakman" | "beide",
        specialty: specialty.trim() || undefined,
      });
      // Vakman → verplichte setup wizard
      if (rol === "vakman" || rol === "beide") {
        router.replace("/vakman-setup");
      } else {
        setRegSuccess(true);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registratie mislukt";
      if (msg.includes("already registered")) setRegError("Dit e-mailadres is al in gebruik.");
      else setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  // ── OAuth ────────────────────────────────────────────────────────────────────
  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabaseReady) return;
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding?oauth=1` },
    });
    if (error) setOauthLoading(null);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STAP 1 — WELCOME
  // ════════════════════════════════════════════════════════════════════════════
  if (stap === "welcome") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>

      {/* Hero */}
      <div style={{ background: "#2B4030", padding: "64px 24px 48px", position: "relative", overflow: "hidden" }}>
        {/* Decoratieve cirkel */}
        <div style={{ position: "absolute", right: -60, top: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", right: 40, bottom: -80, width: 160, height: 160, borderRadius: "50%", background: "rgba(201,122,77,0.15)" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40, position: "relative" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#C97A4D", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 22, fontFamily: SERIF }}>S</span>
          </div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 26, fontFamily: SERIF }}>Servr</span>
        </div>

        {/* Tagline */}
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 34, lineHeight: 1.2, marginBottom: 12, position: "relative" }}>
          De vakman<br />die je zoekt,<br />bij jou thuis
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, lineHeight: 1.6, position: "relative" }}>
          Snel, veilig en altijd iemand beschikbaar in jouw buurt.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, marginTop: 32, position: "relative" }}>
          {[["2.400+", "vakmensen"], ["4.8 ★", "gemiddeld"], ["90s", "reactietijd"]].map(([v, l]) => (
            <div key={l}>
              <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{v}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hoe werkt het */}
      <div style={{ padding: "32px 24px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8A83", marginBottom: 16 }}>
          Hoe werkt het?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "0.5px solid #E5DDD0", borderRadius: 16, overflow: "hidden", background: "#FBF7F0" }}>
          {[
            { n: "1", t: "Beschrijf je klus", d: "Typ of scan je probleem", color: "#2B4030" },
            { n: "2", t: "Ontvang biedingen", d: "Vakmensen bieden binnen 90 seconden", color: "#C97A4D" },
            { n: "3", t: "Klus geklaard", d: "Betaal veilig na afloop via de app", color: "#2B4030" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: i < 2 ? "0.5px solid #E5DDD0" : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "white", fontSize: 13, fontWeight: 900 }}>{s.n}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1D1A" }}>{s.t}</div>
                <div style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "32px 24px 48px", marginTop: "auto" }}>
        <button onClick={() => setStap("kies")}
          style={{ width: "100%", padding: "20px", borderRadius: 14, background: "#2B4030", color: "white", fontSize: 17, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Aan de slag <ChevronRight size={20} />
        </button>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#8A8A83" }}>
          Gratis · Geen verplichtingen
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STAP 2 — KIES: INLOGGEN OF REGISTREREN
  // ════════════════════════════════════════════════════════════════════════════
  if (stap === "kies") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>

      {/* Header */}
      <div style={{ background: "#2B4030", padding: "56px 24px 40px" }}>
        <button onClick={() => setStap("welcome")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 24 }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 30, lineHeight: 1.2 }}>Welkom bij Servr</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginTop: 8 }}>Heb je al een account of maak je een nieuwe aan?</p>
      </div>

      <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>

        {/* Inloggen */}
        <button onClick={() => setStap("login")}
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", borderRadius: 16, background: "#FBF7F0", border: "0.5px solid #E5DDD0", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={22} color="#2B4030" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1A1D1A" }}>Al een account</div>
            <div style={{ fontSize: 13, color: "#5C5C56", marginTop: 3 }}>Log direct in en ga verder</div>
          </div>
          <ChevronRight size={18} color="#8A8A83" />
        </button>

        {/* Registreren */}
        <button onClick={() => setStap("registreer")}
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px", borderRadius: 16, background: "#FBF7F0", border: "0.5px solid #E5DDD0", cursor: "pointer", textAlign: "left" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(201,122,77,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={22} color="#C97A4D" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1A1D1A" }}>Nieuw account</div>
            <div style={{ fontSize: 13, color: "#5C5C56", marginTop: 3 }}>Klaar in minder dan een minuut</div>
          </div>
          <ChevronRight size={18} color="#8A8A83" />
        </button>

        {/* OAuth */}
        {supabaseReady && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E5DDD0" }} />
              <span style={{ fontSize: 12, color: "#8A8A83" }}>of direct via</span>
              <div style={{ flex: 1, height: 1, background: "#E5DDD0" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
                style={{ flex: 1, padding: "14px", borderRadius: 12, border: "0.5px solid #E5DDD0", background: "#FBF7F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 600, color: "#1A1D1A", cursor: "pointer" }}>
                {oauthLoading === "google"
                  ? <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #E5DDD0", borderTopColor: "#2B4030", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                }
                Google
              </button>
            </div>
          </>
        )}

        {/* Demo knoppen (altijd beschikbaar voor testen) */}
        <div style={{ marginTop: 8, padding: "16px", borderRadius: 14, background: "#EDE4D2", border: "0.5px solid #E5DDD0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8A83", marginBottom: 10 }}>
            Demo — snel testen
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleDemo("klant", "Lisa de Vries")}
              style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#FBF7F0", border: "0.5px solid #E5DDD0", fontSize: 13, fontWeight: 600, color: "#1A1D1A", cursor: "pointer" }}>
              Als klant
            </button>
            <button onClick={() => handleDemo("vakman", "Marco van den Berg")}
              style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#2B4030", border: "none", fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer" }}>
              Als vakman
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STAP 3A — INLOGGEN
  // ════════════════════════════════════════════════════════════════════════════
  if (stap === "login") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>

      {/* Header */}
      <div style={{ background: "#2B4030", padding: "56px 24px 40px" }}>
        <button onClick={() => setStap("kies")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 24 }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 30, lineHeight: 1.2 }}>Inloggen</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginTop: 8 }}>Vul je gegevens in om door te gaan</p>
      </div>

      <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>

        <Input label="E-mailadres" type="email" value={loginEmail} onChange={setLoginEmail}
          placeholder="jouw@email.com" autoFocus />

        <Input label="Wachtwoord" type="password" value={loginPass} onChange={setLoginPass}
          placeholder="Jouw wachtwoord" />

        {loginError && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(201,122,77,0.1)", border: "0.5px solid #C97A4D", fontSize: 13, color: "#C97A4D" }}>
            {loginError}
          </div>
        )}

        <Btn label={loginLoading ? "Inloggen..." : "Inloggen"} onClick={handleLogin}
          disabled={loginLoading || !loginEmail || !loginPass} />

        <div style={{ textAlign: "center", marginTop: "auto" }}>
          <span style={{ fontSize: 13, color: "#5C5C56" }}>Nog geen account? </span>
          <button onClick={() => setStap("registreer")} style={{ fontSize: 13, fontWeight: 700, color: "#2B4030", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Registreer hier
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // STAP 3B — REGISTREREN
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>

      {/* Header */}
      <div style={{ background: "#2B4030", padding: "56px 24px 40px" }}>
        <button onClick={() => setStap("kies")} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 24 }}>
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 30, lineHeight: 1.2 }}>Account aanmaken</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginTop: 8 }}>Klaar in minder dan een minuut</p>
      </div>

      {regSuccess ? (
        /* Bevestigingsscherm */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, fontSize: 32 }}>
            ✉️
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: "#1A1D1A", marginBottom: 12 }}>Check je e-mail</h2>
          <p style={{ fontSize: 15, color: "#5C5C56", lineHeight: 1.6, maxWidth: 280 }}>
            We hebben een bevestigingslink gestuurd naar <strong>{regEmail}</strong>. Klik op de link om je account te activeren.
          </p>
          <button onClick={() => setStap("login")}
            style={{ marginTop: 32, padding: "16px 32px", borderRadius: 14, background: "#2B4030", color: "white", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer" }}>
            Naar inloggen
          </button>
        </div>
      ) : (
        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Rol kiezen — EERST */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8A83", marginBottom: 12 }}>
              Ik wil...
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {([
                { r: "klant" as UserRole, icon: User, label: "Een vakman zoeken", sub: "Boek iemand voor thuis" },
                { r: "vakman" as UserRole, icon: Wrench, label: "Klussen aannemen", sub: "Ontvang opdrachten & verdien geld" },
                { r: "beide" as UserRole, icon: Users, label: "Beide", sub: "Ik zoek én voer klussen uit" },
              ]).map(({ r, icon: Icon, label, sub }) => (
                <button key={r} onClick={() => setRol(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                    borderRadius: 12, border: `2px solid ${rol === r ? "#2B4030" : "#E5DDD0"}`,
                    background: rol === r ? "rgba(43,64,48,0.06)" : "#FBF7F0",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: rol === r ? "#2B4030" : "#EDE4D2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    <Icon size={18} color={rol === r ? "white" : "#2B4030"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1D1A" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#5C5C56", marginTop: 2 }}>{sub}</div>
                  </div>
                  {rol === r && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontSize: 11, fontWeight: 900 }}>✓</span>
                  </div>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "#E5DDD0" }} />

          <Input label="Volledige naam" value={naam} onChange={setNaam}
            placeholder="Voornaam achternaam" autoFocus />

          <Input label="E-mailadres" type="email" value={regEmail} onChange={setRegEmail}
            placeholder="jouw@email.com" />

          <Input label="Wachtwoord" type="password" value={regPass} onChange={setRegPass}
            placeholder="Minimaal 6 tekens" />

          <Input label="Herhaal wachtwoord" type="password" value={regPass2} onChange={setRegPass2}
            placeholder="Zelfde wachtwoord"
            error={regPass2 && regPass !== regPass2 ? "Wachtwoorden komen niet overeen" : undefined} />

          {regError && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(201,122,77,0.1)", border: "0.5px solid #C97A4D", fontSize: 13, color: "#C97A4D" }}>
              {regError}
            </div>
          )}

          <Btn label={regLoading ? "Account aanmaken..." : "Account aanmaken"}
            onClick={handleRegister} disabled={regLoading || !naam || !regEmail || !regPass || regPass !== regPass2} />

          <div style={{ textAlign: "center", paddingBottom: 32 }}>
            <span style={{ fontSize: 13, color: "#5C5C56" }}>Al een account? </span>
            <button onClick={() => setStap("login")} style={{ fontSize: 13, fontWeight: 700, color: "#2B4030", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Log hier in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
