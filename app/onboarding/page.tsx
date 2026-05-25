"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Wrench, ChevronRight, ArrowLeft, Apple,
  Star, Zap, Shield, Clock, MapPin, CheckCircle,
  Users, Smartphone,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";
import { supabase, supabaseReady } from "@/lib/supabase";

type Stap = "welcome" | "kies" | "login" | "nieuw";

const DEMO_ACCOUNTS = [
  {
    role: "klant" as UserRole,
    name: "Lisa de Vries",
    address: "Jordaan, Amsterdam",
    isAdmin: false,
    label: "Klant",
    sub: "Amsterdam · Gebruikt app al 3 maanden",
    color: "#4F46E5",
    bg: "#EEF2FF",
    initial: "L",
  },
  {
    role: "vakman" as UserRole,
    name: "Marco van den Berg",
    address: "Prinsengracht 263, Amsterdam",
    isAdmin: true,
    label: "Vakman + Admin",
    sub: "Loodgieter · Amsterdam",
    color: "#DC2626",
    bg: "#FEF2F2",
    initial: "M",
  },
];

const FEATURES = [
  {
    icon: Zap,
    color: "#F59E0B",
    bg: "#FFFBEB",
    title: "Binnen 90 seconden",
    desc: "3 vakmensen sturen direct een bieding op jouw opdracht",
  },
  {
    icon: Shield,
    color: "#10B981",
    bg: "#ECFDF5",
    title: "100% veilig",
    desc: "Gecertificeerde vakmensen, veilig betalen, altijd verzekerd",
  },
  {
    icon: Star,
    color: "#4F46E5",
    bg: "#EEF2FF",
    title: "Betrouwbaar",
    desc: "Meer dan 2.400 vakmannen met echte reviews van klanten",
  },
  {
    icon: MapPin,
    color: "#EF4444",
    bg: "#FEF2F2",
    title: "In jouw buurt",
    desc: "Vakmensen uit jouw regio — snel ter plaatse",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { login } = useUserStore();

  const [stap, setStap] = useState<Stap>("welcome");
  const [naam, setNaam] = useState("");
  const [rol, setRol] = useState<UserRole>("klant");
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

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

  const handleDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    login({ role: acc.role, name: acc.name, address: acc.address, isAdmin: acc.isAdmin });
    router.replace(acc.role === "vakman" ? "/dashboard" : "/");
  };

  const handleNieuw = () => {
    if (!naam.trim()) return;
    login({ role: rol!, name: naam.trim(), address: "Amsterdam", isAdmin: false });
    router.replace(rol === "vakman" ? "/dashboard" : "/");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabaseReady) {
      setOauthError("Gebruik een van de knoppen hieronder om in te loggen.");
      return;
    }
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding?oauth=1` },
    });
    if (error) { setOauthError(error.message); setOauthLoading(null); }
  };

  /* ══════════════════════════════════════════════════════════════
     STAP 1 — WELCOME / UITLEG
  ══════════════════════════════════════════════════════════════ */
  if (stap === "welcome") return (
    <div className="flex flex-col min-h-dvh animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Hero gradient */}
      <div className="relative overflow-hidden px-6 pt-16 pb-10"
        style={{ background: "linear-gradient(160deg, #3730A3 0%, #4F46E5 50%, #818CF8 100%)" }}>
        {/* Blob decorations */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20" style={{ background: "white" }} />
        <div className="absolute -left-10 bottom-0 w-48 h-48 rounded-full opacity-10" style={{ background: "black" }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
            <span className="font-black text-white" style={{ fontSize: 22 }}>S</span>
          </div>
          <span className="font-black text-white tracking-tight" style={{ fontSize: 28 }}>Servr</span>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h1 className="font-black text-white leading-tight mb-3" style={{ fontSize: 34, letterSpacing: "-0.02em" }}>
            De slimste manier<br />om een vakman<br />te vinden
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, lineHeight: 1.6 }}>
            Snel, veilig en altijd iemand beschikbaar in jouw buurt.
          </p>
        </div>

        {/* Trust strip */}
        <div className="relative flex items-center gap-4 mt-6">
          {[
            { v: "2.400+", l: "vakmensen" },
            { v: "4.8⭐", l: "gemiddeld" },
            { v: "90s", l: "reactietijd" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center">
              {i > 0 && <span className="mr-4 opacity-30 text-white">|</span>}
              <div>
                <span className="font-black text-white text-base leading-none block">{s.v}</span>
                <span className="text-[11px] font-medium block mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>
          Waarom Servr?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-4 rounded-3xl"
                style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: f.bg }}>
                  <Icon size={20} style={{ color: f.color }} strokeWidth={2} />
                </div>
                <p className="font-black text-sm leading-tight mb-1" style={{ color: "#0f172a" }}>{f.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 pb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: "#94a3b8" }}>Hoe werkt het?</p>
        <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {[
            { n: "1", icon: Smartphone, title: "Beschrijf je klus", desc: "Typ of scan je probleem in de app", color: "#4F46E5" },
            { n: "2", icon: Users, title: "Ontvang biedingen", desc: "Vakmensen bieden binnen 90 seconden", color: "#10B981" },
            { n: "3", icon: CheckCircle, title: "Klus geklaard", desc: "Betaal veilig na afloop via de app", color: "#F59E0B" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < 2 ? "1px solid #F8FAFC" : "none" }}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: s.color + "15" }}>
                  <Icon size={18} style={{ color: s.color }} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: s.color, color: "white" }}>{s.n}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-12 pt-2 mt-auto">
        <button onClick={() => setStap("kies")}
          className="touch-scale w-full flex items-center justify-center gap-2 font-black text-white"
          style={{
            padding: "22px",
            borderRadius: 22,
            fontSize: 19,
            background: "linear-gradient(135deg, #4F46E5, #818CF8)",
            boxShadow: "0 8px 28px rgba(79,70,229,0.45)",
            border: "none",
          }}>
          Aan de slag <ChevronRight size={22} />
        </button>
        <p className="text-center mt-3 text-xs font-medium" style={{ color: "#cbd5e1" }}>
          Gratis · Geen verplichtingen · Altijd opzegbaar
        </p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     STAP 2 — KIES: AL EEN ACCOUNT OF NIEUW
  ══════════════════════════════════════════════════════════════ */
  if (stap === "kies") return (
    <div className="flex flex-col min-h-dvh animate-slide-up" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{ background: "linear-gradient(160deg, #3730A3 0%, #4F46E5 60%, #818CF8 100%)" }}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15" style={{ background: "white" }} />
        <button onClick={() => setStap("welcome")}
          className="touch-scale mb-6 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div className="relative">
          <h1 className="font-black text-white leading-tight" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>
            Welkom bij Servr
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
            Heb je al een account of maak je een nieuwe aan?
          </p>
        </div>
      </div>

      <div className="px-5 pt-8 flex flex-col gap-4 flex-1">

        {/* Al een account */}
        <button onClick={() => setStap("login")}
          className="touch-scale flex items-center gap-5 text-left rounded-3xl"
          style={{
            padding: "24px 22px",
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
            border: "2px solid transparent",
          }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}>
            <User size={28} style={{ color: "#4F46E5" }} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-black" style={{ fontSize: 19, color: "#0f172a" }}>Al een account</p>
            <p className="text-sm mt-1 font-medium" style={{ color: "#94a3b8" }}>
              Log direct in en ga verder
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
            <ChevronRight size={18} color="white" />
          </div>
        </button>

        {/* Nieuw account */}
        <button onClick={() => setStap("nieuw")}
          className="touch-scale flex items-center gap-5 text-left rounded-3xl"
          style={{
            padding: "24px 22px",
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.09)",
            border: "2px solid transparent",
          }}>
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)" }}>
            <Users size={28} style={{ color: "#10B981" }} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="font-black" style={{ fontSize: 19, color: "#0f172a" }}>Nieuw account</p>
            <p className="text-sm mt-1 font-medium" style={{ color: "#94a3b8" }}>
              Klaar in minder dan een minuut
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 4px 12px rgba(16,185,129,0.35)" }}>
            <ChevronRight size={18} color="white" />
          </div>
        </button>

        {/* Of via OAuth */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>of direct via</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#fff", border: "1.5px solid #E5E7EB", fontSize: 14, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {oauthLoading === "google"
              ? <span className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Google
          </button>
          <button onClick={() => handleOAuth("apple")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#000", color: "#fff", fontSize: 14 }}>
            {oauthLoading === "apple"
              ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Apple size={16} />
            }
            Apple
          </button>
        </div>
        {oauthError && (
          <p className="text-center rounded-2xl px-4 py-3" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 13 }}>
            {oauthError}
          </p>
        )}
      </div>

      <div className="px-5 pb-10 pt-4">
        <p className="text-center text-xs font-medium" style={{ color: "#cbd5e1" }}>
          Door verder te gaan ga je akkoord met onze{" "}
          <span style={{ color: "#94a3b8", textDecoration: "underline" }}>voorwaarden</span>
        </p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     STAP 3A — AL EEN ACCOUNT (demo login)
  ══════════════════════════════════════════════════════════════ */
  if (stap === "login") return (
    <div className="flex flex-col min-h-dvh animate-slide-up" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{ background: "linear-gradient(160deg, #3730A3 0%, #4F46E5 60%, #818CF8 100%)" }}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15" style={{ background: "white" }} />
        <button onClick={() => setStap("kies")}
          className="touch-scale mb-6 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div className="relative">
          <h1 className="font-black text-white leading-tight" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>
            Inloggen
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
            Kies jouw account om door te gaan
          </p>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-3 flex-1">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
          Demo accounts
        </p>

        {DEMO_ACCOUNTS.map(acc => (
          <button key={acc.name} onClick={() => handleDemo(acc)}
            className="touch-scale flex items-center gap-4 text-left rounded-3xl"
            style={{
              padding: "20px 22px",
              background: "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}>
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${acc.color}, ${acc.color}aa)` }}>
              {acc.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base" style={{ color: "#0f172a" }}>{acc.name}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: "#94a3b8" }}>{acc.sub}</p>
              <span className="inline-block mt-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: acc.bg, color: acc.color }}>
                {acc.label}
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: acc.bg }}>
              <ChevronRight size={18} style={{ color: acc.color }} />
            </div>
          </button>
        ))}

        {/* Divider */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>of via</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="flex gap-3">
          <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#fff", border: "1.5px solid #E5E7EB", fontSize: 14, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {oauthLoading === "google"
              ? <span className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Google
          </button>
          <button onClick={() => handleOAuth("apple")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#000", color: "#fff", fontSize: 14 }}>
            {oauthLoading === "apple"
              ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Apple size={16} />
            }
            Apple
          </button>
        </div>
        {oauthError && (
          <p className="text-center rounded-2xl px-4 py-3" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 13 }}>
            {oauthError}
          </p>
        )}
      </div>

      <div className="px-5 pb-10 pt-4">
        <p className="text-center text-xs font-medium" style={{ color: "#cbd5e1" }}>
          Nog geen account?{" "}
          <button onClick={() => setStap("nieuw")} className="font-bold" style={{ color: "#94a3b8", textDecoration: "underline" }}>
            Maak er een aan
          </button>
        </p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════
     STAP 3B — NIEUW ACCOUNT
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col min-h-dvh animate-slide-up" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10"
        style={{ background: "linear-gradient(160deg, #3730A3 0%, #4F46E5 60%, #818CF8 100%)" }}>
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-15" style={{ background: "white" }} />
        <button onClick={() => setStap("kies")}
          className="touch-scale mb-6 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft size={20} color="white" />
        </button>
        <div className="relative">
          <h1 className="font-black text-white leading-tight" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>
            Account aanmaken
          </h1>
          <p className="mt-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>
            Klaar in minder dan een minuut
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-5 pt-7 pb-12">

        {/* Naam */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "#94a3b8" }}>
            Jouw naam
          </label>
          <input
            value={naam}
            onChange={e => setNaam(e.target.value)}
            placeholder="Voornaam achternaam"
            autoFocus
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 18,
              border: `2px solid ${naam ? "#4F46E5" : "#E5E7EB"}`,
              fontSize: 17,
              fontWeight: 700,
              color: "#0f172a",
              background: "#fff",
              outline: "none",
              boxShadow: naam ? "0 0 0 4px rgba(79,70,229,0.1)" : "0 2px 8px rgba(0,0,0,0.06)",
              boxSizing: "border-box",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          />
        </div>

        {/* Rol kiezen */}
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "#94a3b8" }}>
            Ik wil...
          </label>
          <div className="flex flex-col gap-3">
            {([
              {
                r: "klant" as UserRole,
                icon: User,
                label: "Een vakman zoeken",
                sub: "Boek iemand voor thuis",
                color: "#4F46E5",
                bg: "#EEF2FF",
              },
              {
                r: "vakman" as UserRole,
                icon: Wrench,
                label: "Klussen aannemen",
                sub: "Ontvang opdrachten & verdien geld",
                color: "#DC2626",
                bg: "#FEF2F2",
              },
              {
                r: "beide" as UserRole,
                icon: Users,
                label: "Beide",
                sub: "Ik zoek én voer klussen uit",
                color: "#10B981",
                bg: "#ECFDF5",
              },
            ]).map(({ r, icon: Icon, label, sub, color, bg }) => (
              <button key={r} onClick={() => setRol(r)}
                className="touch-scale flex items-center gap-4 text-left rounded-2xl"
                style={{
                  padding: "18px 20px",
                  border: `2px solid ${rol === r ? color : "#E5E7EB"}`,
                  background: rol === r ? bg : "#fff",
                  boxShadow: rol === r ? `0 4px 16px ${color}25` : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: rol === r ? color : "#F3F4F6" }}>
                  <Icon size={24} style={{ color: rol === r ? "white" : "#9CA3AF" }} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <p className="font-black" style={{ fontSize: 16, color: "#0f172a" }}>{label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>{sub}</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: rol === r ? color : "#F3F4F6",
                    boxShadow: rol === r ? `0 2px 8px ${color}50` : "none",
                  }}>
                  {rol === r && <span style={{ color: "white", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start knop */}
        <button
          onClick={handleNieuw}
          disabled={!naam.trim()}
          className="touch-scale flex items-center justify-center gap-2"
          style={{
            width: "100%",
            padding: "22px",
            borderRadius: 22,
            background: naam.trim()
              ? "linear-gradient(135deg, #4F46E5, #818CF8)"
              : "#D1D5DB",
            color: "white",
            fontSize: 19,
            fontWeight: 900,
            boxShadow: naam.trim() ? "0 8px 28px rgba(79,70,229,0.45)" : "none",
            border: "none",
            cursor: naam.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}>
          Account aanmaken <ChevronRight size={22} />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
          <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>of via</span>
          <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
        </div>

        <div className="flex gap-3">
          <button onClick={() => handleOAuth("google")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#fff", border: "1.5px solid #E5E7EB", fontSize: 14, color: "#374151", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {oauthLoading === "google"
              ? <span className="w-5 h-5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
              : <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Google
          </button>
          <button onClick={() => handleOAuth("apple")} disabled={!!oauthLoading}
            className="touch-scale flex-1 flex items-center justify-center gap-2.5 rounded-2xl font-bold"
            style={{ padding: "16px", background: "#000", color: "#fff", fontSize: 14 }}>
            {oauthLoading === "apple"
              ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <Apple size={16} />
            }
            Apple
          </button>
        </div>

        {oauthError && (
          <p className="text-center rounded-2xl px-4 py-3" style={{ background: "#FEF3C7", color: "#92400E", fontSize: 13 }}>
            {oauthError}
          </p>
        )}

        <p className="text-center text-xs font-medium" style={{ color: "#cbd5e1" }}>
          Al een account?{" "}
          <button onClick={() => setStap("login")} className="font-bold" style={{ color: "#94a3b8", textDecoration: "underline" }}>
            Log hier in
          </button>
        </p>
      </div>
    </div>
  );
}
