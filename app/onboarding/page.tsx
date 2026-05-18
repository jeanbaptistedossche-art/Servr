"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, ChevronRight, Phone, Apple, CheckCircle,
  ArrowLeft, User, Wrench,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";

type Step = "welcome" | "login" | "rol" | "location" | "signup" | "profiel";

// ─── demo accounts ─────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    role: "klant" as UserRole,
    name: "Lisa de Vries",
    address: "Jordaan, Amsterdam",
    avatar: "https://i.pravatar.cc/150?img=32",
    sub: "Klant · Jordaan, Amsterdam",
    isAdmin: false,
  },
  {
    role: "vakman" as UserRole,
    name: "Marco van den Berg",
    address: "Prinsengracht 263, Amsterdam",
    avatar: "https://i.pravatar.cc/150?img=11",
    sub: "Vakman · Loodgieter · Amsterdam",
    isAdmin: true,
  },
];

export default function OnboardingPage() {
  const [step, setStep]         = useState<Step>("welcome");
  const [rol, setRol]           = useState<UserRole>(null);
  const [phone, setPhone]       = useState("");
  const [naam, setNaam]         = useState("");
  const [adres, setAdres]       = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  // Login-with-name flow
  const [loginNaam, setLoginNaam]   = useState("");
  const [loginRol, setLoginRol]     = useState<UserRole>("klant");

  const router = useRouter();
  const { login } = useUserStore();

  // ── Quick-login via demo account ──────────────────────────────────────────
  const handleDemoLogin = (acc: typeof DEMO_ACCOUNTS[0]) => {
    login({ role: acc.role, name: acc.name, address: acc.address, isAdmin: acc.isAdmin });
    router.replace(acc.role === "vakman" ? "/dashboard" : "/");
  };

  // ── Login with custom name ─────────────────────────────────────────────────
  const handleCustomLogin = () => {
    if (!loginNaam.trim()) return;
    login({ role: loginRol, name: loginNaam.trim(), address: "Amsterdam", isAdmin: false });
    router.replace(loginRol === "vakman" ? "/dashboard" : "/");
  };

  // ── Finish registration ───────────────────────────────────────────────────
  const finish = () => {
    login({
      role: rol,
      name: naam.trim() || "Gebruiker",
      address: adres.trim() || "Amsterdam",
      isAdmin: false,
    });
    router.replace(rol === "vakman" ? "/dashboard" : "/");
  };

  const accentColor = rol === "vakman" ? "var(--coral)" : "var(--teal)";

  /* ═══════════════════════════════════════════════════════════════════
     WELCOME
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "welcome") return (
    <div className="flex flex-col min-h-dvh px-6 pt-16 pb-12 animate-fade-in"
      style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
          <span className="text-white font-black" style={{ fontSize: 56 }}>S</span>
        </div>

        <div>
          <h1 className="text-5xl font-black text-white tracking-tight">Servr</h1>
          <p className="text-white/75 text-lg mt-2">De Uber voor lokale dienstverleners</p>
        </div>

        <div className="flex flex-col gap-3 text-left w-full max-w-xs">
          {[
            ["⚡", "Vakman binnen 90 seconden"],
            ["📍", "Locatie-gebaseerde matching"],
            ["💰", "Directe offertes & betaling"],
            ["⭐", "Geverifieerde vakmensen"],
          ].map(([icon, text]) => (
            <div key={text as string} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-white/90 text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => setStep("rol")}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
          style={{ background: "white", color: "var(--teal)" }}>
          Aan de slag <ChevronRight size={18} />
        </button>
        <button onClick={() => setStep("login")}
          className="touch-scale w-full py-3.5 rounded-2xl font-semibold text-sm"
          style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
          Heb al een account? Inloggen →
        </button>
      </div>

      <p className="text-white/40 text-xs text-center mt-4">
        Door verder te gaan ga je akkoord met onze voorwaarden
      </p>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     LOGIN
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "login") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      {/* Header */}
      <div className="pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <button onClick={() => setStep("welcome")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h1 className="text-white font-black text-2xl">Welkom terug!</h1>
        <p className="text-white/70 text-sm mt-1">Kies een account of log in met je naam</p>
      </div>

      <div className="flex flex-col gap-6 pt-6">

        {/* Demo accounts */}
        <div>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>
            Demo accounts
          </p>
          <div className="flex flex-col gap-3">
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.name} onClick={() => handleDemoLogin(acc)}
                className="touch-scale flex items-center gap-4 p-4 rounded-2xl border-2 text-left"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <img src={acc.avatar} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{acc.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{acc.sub}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: acc.role === "vakman" ? "var(--coral)" + "18" : "var(--teal)" + "18",
                      color: acc.role === "vakman" ? "var(--coral)" : "var(--teal)",
                    }}>
                    {acc.role === "vakman" ? "🔧 Vakman" : "👤 Klant"}
                  </span>
                </div>
                <ChevronRight size={18} style={{ color: "var(--muted)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>of log in met naam</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Custom login */}
        <div className="flex flex-col gap-3">
          <input
            value={loginNaam}
            onChange={e => setLoginNaam(e.target.value)}
            placeholder="Jouw naam"
            className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
            style={{
              borderColor: loginNaam ? "var(--teal)" : "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />

          {/* Role toggle */}
          <div className="flex gap-2">
            {(["klant", "vakman"] as const).map(r => (
              <button key={r} onClick={() => setLoginRol(r)}
                className="touch-scale flex-1 py-3 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-2"
                style={{
                  borderColor: loginRol === r
                    ? (r === "vakman" ? "var(--coral)" : "var(--teal)")
                    : "var(--border)",
                  background: loginRol === r
                    ? (r === "vakman" ? "var(--coral)" : "var(--teal)") + "12"
                    : "var(--surface)",
                  color: loginRol === r
                    ? (r === "vakman" ? "var(--coral)" : "var(--teal)")
                    : "var(--muted)",
                }}>
                {r === "klant" ? <User size={14} /> : <Wrench size={14} />}
                {r === "klant" ? "Klant" : "Vakman"}
              </button>
            ))}
          </div>

          <button
            onClick={handleCustomLogin}
            disabled={!loginNaam.trim()}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white"
            style={{ background: loginNaam.trim() ? "var(--teal)" : "var(--muted)" }}>
            Inloggen
          </button>
        </div>

        <button onClick={() => setStep("rol")}
          className="touch-scale py-3 text-sm font-semibold text-center"
          style={{ color: "var(--teal)" }}>
          Nieuw account aanmaken →
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     ROL KIEZEN
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "rol") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <button onClick={() => setStep("welcome")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h2 className="text-white font-black text-2xl">Wie ben jij?</h2>
        <p className="text-white/70 text-sm mt-1">Kies hoe je Servr wilt gebruiken</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 pt-6">
        {/* Klant */}
        <button onClick={() => setRol("klant")}
          className="touch-scale relative p-5 rounded-3xl border-2 text-left transition-all"
          style={{
            borderColor: rol === "klant" ? "var(--teal)" : "var(--border)",
            background: rol === "klant" ? "var(--teal)" + "0f" : "var(--surface)",
          }}>
          {rol === "klant" && (
            <CheckCircle size={20} className="absolute top-4 right-4" style={{ color: "var(--teal)" }} />
          )}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3"
            style={{ background: "var(--teal)" + "18" }}>👤</div>
          <h3 className="font-black text-lg mb-1">Ik zoek een vakman</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Maak opdrachten aan, ontvang offertes en betaal veilig.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Opdracht plaatsen", "Offertes vergelijken", "Veilig betalen"].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                ✓ {t}
              </span>
            ))}
          </div>
        </button>

        {/* Vakman */}
        <button onClick={() => setRol("vakman")}
          className="touch-scale relative p-5 rounded-3xl border-2 text-left transition-all"
          style={{
            borderColor: rol === "vakman" ? "var(--coral)" : "var(--border)",
            background: rol === "vakman" ? "var(--coral)" + "0f" : "var(--surface)",
          }}>
          {rol === "vakman" && (
            <CheckCircle size={20} className="absolute top-4 right-4" style={{ color: "var(--coral)" }} />
          )}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3"
            style={{ background: "var(--coral)" + "18" }}>🔧</div>
          <h3 className="font-black text-lg mb-1">Ik ben vakman</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ontvang opdrachten in jouw buurt, stuur offertes en verdien extra inkomen.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Opdrachten ontvangen", "Offertes sturen", "Snel uitbetaald"].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "var(--coral)" + "15", color: "var(--coral)" }}>
                ✓ {t}
              </span>
            ))}
          </div>
        </button>
      </div>

      <button onClick={() => rol && setStep("location")}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base mt-4"
        style={{
          background: rol ? (rol === "klant" ? "var(--teal)" : "var(--coral)") : "var(--muted)",
          transition: "background 0.2s",
        }}>
        Doorgaan als {rol === "klant" ? "klant" : rol === "vakman" ? "vakman" : "..."}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     LOCATIE
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "location") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: `linear-gradient(160deg, ${accentColor} 0%, ${accentColor} 100%)`, opacity: 1 }}>
        <button onClick={() => setStep("rol")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h2 className="text-white font-black text-2xl">
          {rol === "vakman" ? "Jouw werkgebied" : "Jouw locatie"}
        </h2>
        <p className="text-white/70 text-sm mt-1">
          {rol === "vakman"
            ? "Opdrachten binnen jouw radius"
            : "Alleen gedeeld met vakman die jij kiest"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 pt-6 text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: accentColor + "18" }}>
          <MapPin size={44} style={{ color: accentColor }} />
        </div>

        <div>
          <h3 className="text-xl font-black mb-2">
            {rol === "vakman" ? "Stel je werkgebied in" : "Deel je locatie"}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {rol === "vakman"
              ? "We laten opdrachten zien binnen jouw radius. Klanten zien jouw afstand, niet je exacte adres."
              : "Je adres wordt alleen gedeeld met de vakman die jij kiest. Nooit automatisch."}
          </p>
        </div>

        {/* Fake map */}
        <div className="w-full h-40 rounded-3xl overflow-hidden relative"
          style={{ background: "#e8f4ee" }}>
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, var(--teal) 0, var(--teal) 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, var(--teal) 0, var(--teal) 1px, transparent 0, transparent 40px)",
              backgroundSize: "40px 40px",
            }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full animate-pulse"
                style={{ background: accentColor + "30" }} />
              <div className="w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                style={{ background: accentColor }}>
                <MapPin size={18} color="white" />
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2">
            <p className="text-xs font-semibold">📍 Jordaan, Amsterdam</p>
            {rol === "vakman" && (
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>Werkgebied: 5 km radius</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => setStep("signup")}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ background: accentColor }}>
          📍 Locatie toestaan
        </button>
        <button onClick={() => setStep("signup")}
          className="touch-scale py-3 text-sm font-medium text-center"
          style={{ color: "var(--muted)" }}>
          Handmatig adres invoeren
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     SIGNUP
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "signup") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <button onClick={() => setStep("location")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h2 className="text-white font-black text-2xl">Account aanmaken</h2>
        <p className="text-white/70 text-sm mt-1">Als {rol === "vakman" ? "vakman" : "klant"}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 pt-6">
        <button onClick={() => setStep("profiel")}
          className="touch-scale w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 border"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Doorgaan met Google
        </button>

        <button onClick={() => setStep("profiel")}
          className="touch-scale w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3"
          style={{ background: "#000", color: "#fff" }}>
          <Apple size={20} /> Doorgaan met Apple
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>of telefoonnummer</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border"
          style={{ borderColor: phone ? "var(--teal)" : "var(--border)", background: "var(--surface)" }}>
          <Phone size={18} style={{ color: "var(--muted)" }} />
          <span className="font-medium text-sm">+31</span>
          <div className="w-px h-5" style={{ background: "var(--border)" }} />
          <input
            type="tel"
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>

        <button onClick={() => setStep("profiel")}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ background: accentColor }}>
          SMS-code ontvangen
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     PROFIEL INVULLEN
  ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <button onClick={() => setStep("signup")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h2 className="text-white font-black text-2xl">Bijna klaar!</h2>
        <p className="text-white/70 text-sm mt-1">Vul je gegevens in</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 pt-6">
        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
            Naam
          </label>
          <input
            value={naam}
            onChange={e => setNaam(e.target.value)}
            placeholder={rol === "vakman" ? "Marco van den Berg" : "Lisa de Vries"}
            className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
            style={{
              borderColor: naam ? "var(--teal)" : "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
            {rol === "vakman" ? "Werkadres / postcode" : "Thuisadres"}
          </label>
          <input
            value={adres}
            onChange={e => setAdres(e.target.value)}
            placeholder="Prinsengracht 263, Amsterdam"
            className="w-full px-4 py-3.5 rounded-2xl border outline-none text-sm"
            style={{
              borderColor: adres ? "var(--teal)" : "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
          <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
            {rol === "vakman"
              ? "Klanten zien alleen jouw afstand, niet je exacte adres."
              : "Alleen zichtbaar voor de vakman die jij kiest."}
          </p>
        </div>

        {rol === "vakman" && (
          <div>
            <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
              Categorie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[["🔧","Loodgieter"],["⚡","Elektricien"],["🖌️","Schilder"],["🧹","Schoonmaak"],["🪚","Timmerman"],["🔑","Slotenmaker"]].map(([icon, cat]) => (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  className="touch-scale py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border-2"
                  style={{
                    borderColor: selectedCat === cat ? "var(--coral)" : "var(--border)",
                    background: selectedCat === cat ? "var(--coral)" + "12" : "var(--surface)",
                    color: selectedCat === cat ? "var(--coral)" : "var(--foreground)",
                  }}>
                  <span className="text-xl">{icon}</span>{cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={finish}
        disabled={!naam.trim()}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base mt-4"
        style={{ background: naam.trim() ? accentColor : "var(--muted)" }}>
        {rol === "vakman" ? "🔧 Start als vakman" : "✓ Account aanmaken"}
      </button>
    </div>
  );
}
