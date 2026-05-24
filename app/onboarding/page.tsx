"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, ChevronRight, Phone, Apple, CheckCircle,
  ArrowLeft, User, Wrench, ArrowLeftRight,
  Zap, Shield, Star, Paintbrush, Hammer, Lock, Sparkles,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { UserRole } from "@/lib/store";
import { registerVakman, genId } from "@/lib/db";
import { supabase, supabaseReady } from "@/lib/supabase";
import AdresAutoComplete from "@/components/AdresAutoComplete";
import type { AdresParts } from "@/components/AdresAutoComplete";

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
  const [adresLat, setAdresLat] = useState<number | undefined>();
  const [adresLng, setAdresLng] = useState<number | undefined>();
  const [locAdres, setLocAdres]   = useState("");
  const [locLat, setLocLat]       = useState<number | undefined>();
  const [locLng, setLocLng]       = useState<number | undefined>();
  const [locStraat, setLocStraat]       = useState("");
  const [locHuisnummer, setLocHuisnummer] = useState("");
  const [locPostcode, setLocPostcode]   = useState("");
  const [locStad, setLocStad]           = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  // Login-with-name flow
  const [loginNaam, setLoginNaam]   = useState("");
  const [loginRol, setLoginRol]     = useState<UserRole>("klant");

  // Signup / telefoonnummer
  const [landCode, setLandCode]     = useState("+32");
  const [landOpen, setLandOpen]     = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useUserStore();

  // OAuth terugkeer afhandelen (na Google/Apple redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth") !== "1") return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const naam = session.user.user_metadata?.full_name
          ?? session.user.user_metadata?.name
          ?? session.user.email
          ?? "Gebruiker";
        login({ role: "klant", name: naam, address: "Amsterdam" });
        router.replace("/");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const finish = async () => {
    const samengesteld = [
      [locStraat, locHuisnummer].filter(Boolean).join(" "),
      locPostcode,
      locStad,
    ].filter(Boolean).join(", ");
    const finalAdres = adres.trim() || samengesteld || locAdres.trim() || "Amsterdam";
    const finalLat   = adresLat ?? locLat ?? 52.3676;
    const finalLng   = adresLng ?? locLng ?? 4.9041;

    login({
      role: rol,
      name: naam.trim() || "Gebruiker",
      address: finalAdres,
      isAdmin: false,
    });

    // Sla vakman op in database (als Supabase geconfigureerd is)
    if (rol === "vakman") {
      const id = genId();
      registerVakman({
        id,
        name: naam.trim() || "Vakman",
        address: finalAdres,
        lat: finalLat,
        lng: finalLng,
        categorie: selectedCat || "Algemeen",
      }).catch(() => {/* geen Supabase → stil falen */});
    }

    router.replace(rol === "vakman" ? "/dashboard" : "/");
  };

  const accentColor = rol === "vakman" ? "var(--coral)" : "var(--teal)";

  /* ═══════════════════════════════════════════════════════════════════
     WELCOME
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "welcome") return (
    <div className="flex flex-col min-h-dvh animate-fade-in" style={{ background: "#F9FAFB" }}>

      {/* Indigo gradient hero */}
      <div className="px-6 pt-16 pb-10 flex flex-col"
        style={{ background: "linear-gradient(160deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)" }}>
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <span className="font-black text-white" style={{ fontSize: 18 }}>S</span>
          </div>
          <span className="font-black text-white text-2xl tracking-tight">Servr</span>
        </div>

        <h1 className="font-black text-white leading-tight mb-3" style={{ fontSize: 32, letterSpacing: "-0.02em" }}>
          Vind de beste<br />vakman direct
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          2.400+ gecertificeerde vakmensen, direct beschikbaar in jouw buurt.
        </p>

        <div className="flex items-center gap-5 mt-6">
          {[["2.4K+","vakmensen"],["4.8 / 5","score"],["90 sec","responstijd"]].map(([v, l]) => (
            <div key={l}>
              <p className="font-black text-white text-base leading-none">{v}</p>
              <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-3">
        {[
          { Icon: Zap,    title: "Vakman binnen 90 seconden",     body: "Spoeddienst — altijd iemand beschikbaar",  color: "#EF4444" },
          { Icon: MapPin, title: "Alleen vakmensen dichtbij jou", body: "Locatie-gebaseerde matching op km",        color: "#4F46E5" },
          { Icon: Shield, title: "Veilig betalen via Servr",      body: "Geld pas vrij als het werk klaar is",     color: "#6366F1" },
          { Icon: Star,   title: "Geverifieerde vakmensen",       body: "Echte reviews · Gecertificeerde profielen", color: "#F59E0B" },
        ].map(f => (
          <div key={f.title} className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: f.color + "15", color: f.color }}>
              <f.Icon size={18} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111827" }}>{f.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{f.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 px-5 pb-12">
        <button onClick={() => setStep("rol")}
          className="touch-scale w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", boxShadow: "0 4px 20px rgba(79,70,229,0.35)" }}>
          Aan de slag <ChevronRight size={18} />
        </button>
        <button onClick={() => setStep("login")}
          className="touch-scale w-full py-3.5 rounded-2xl font-semibold text-sm"
          style={{ color: "#6B7280" }}>
          Al een account? Inloggen
        </button>
        <p className="text-center text-xs" style={{ color: "#D1D5DB" }}>
          Door verder te gaan ga je akkoord met onze voorwaarden
        </p>
      </div>
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
                    {acc.role === "vakman" ? "Vakman" : "Klant"}
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
            {([
              { r: "klant",  icon: <User size={14} />,           label: "Klant",  color: "var(--teal)"  },
              { r: "vakman", icon: <Wrench size={14} />,         label: "Vakman", color: "var(--coral)" },
              { r: "beide",  icon: <ArrowLeftRight size={14} />, label: "Beide",  color: "#7c3aed"      },
            ] as const).map(({ r, icon, label, color }) => (
              <button key={r} onClick={() => setLoginRol(r)}
                className="touch-scale flex-1 py-3 rounded-xl font-semibold text-sm border-2 flex items-center justify-center gap-1.5"
                style={{
                  borderColor: loginRol === r ? color : "var(--border)",
                  background:  loginRol === r ? color + "12" : "var(--surface)",
                  color:       loginRol === r ? color : "var(--muted)",
                }}>
                {icon} {label}
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--teal)" + "18", color: "var(--teal)" }}>
            <User size={26} strokeWidth={1.8} /></div>
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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--coral)" + "18", color: "var(--coral)" }}>
            <Wrench size={26} strokeWidth={1.8} /></div>
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

        {/* Beide */}
        <button onClick={() => setRol("beide")}
          className="touch-scale relative p-5 rounded-3xl border-2 text-left transition-all"
          style={{
            borderColor: rol === "beide" ? "#7c3aed" : "var(--border)",
            background: rol === "beide" ? "#7c3aed0f" : "var(--surface)",
          }}>
          {rol === "beide" && (
            <CheckCircle size={20} className="absolute top-4 right-4" style={{ color: "#7c3aed" }} />
          )}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "#7c3aed18" }}>
            <ArrowLeftRight size={26} color="#7c3aed" />
          </div>
          <h3 className="font-black text-lg mb-1">Ik ben vakman én klant</h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Schakel vrij tussen beide mmodi. Zoek vakmensen én ontvang opdrachten.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Beide modus", "Wissel met 1 tik", "Alle functies"].map(t => (
              <span key={t} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "#7c3aed15", color: "#7c3aed" }}>
                ✓ {t}
              </span>
            ))}
          </div>
        </button>
      </div>

      <button onClick={() => rol && setStep("location")}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base mt-4"
        style={{
          background: rol
            ? rol === "klant" ? "var(--teal)"
              : rol === "vakman" ? "var(--coral)"
              : "#7c3aed"
            : "var(--muted)",
          transition: "background 0.2s",
        }}>
        Doorgaan als {rol === "klant" ? "klant" : rol === "vakman" ? "vakman" : rol === "beide" ? "vakman + klant" : "..."}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     LOCATIE
  ═══════════════════════════════════════════════════════════════════ */
  if (step === "location") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: `linear-gradient(160deg, ${accentColor} 0%, ${accentColor} 100%)` }}>
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

      <div className="flex-1 flex flex-col gap-4 pt-6">
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
          Begin te typen — suggesties verschijnen automatisch
        </p>

        {/* Zoekbalk met autocomplete */}
        <AdresAutoComplete
          value={locAdres}
          onChange={(a, lat, lng) => {
            setLocAdres(a);
            setLocLat(lat);
            setLocLng(lng);
          }}
          onParts={(parts: AdresParts) => {
            setLocStraat(parts.straat);
            setLocHuisnummer(parts.huisnummer);
            setLocPostcode(parts.postcode);
            setLocStad(parts.stad);
          }}
          placeholder="Zoek je adres..."
          accent={accentColor}
        />

        {/* Losse velden — gevuld door autocomplete of handmatig */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Straat</label>
            <input
              value={locStraat}
              onChange={e => setLocStraat(e.target.value)}
              placeholder="Kerkstraat"
              className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
              style={{ borderColor: locStraat ? accentColor : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
          <div style={{ width: 90 }}>
            <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Nr.</label>
            <input
              value={locHuisnummer}
              onChange={e => setLocHuisnummer(e.target.value)}
              placeholder="12"
              className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
              style={{ borderColor: locHuisnummer ? accentColor : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div style={{ width: 120 }}>
            <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Postcode</label>
            <input
              value={locPostcode}
              onChange={e => setLocPostcode(e.target.value)}
              placeholder="9000"
              className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
              style={{ borderColor: locPostcode ? accentColor : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Stad</label>
            <input
              value={locStad}
              onChange={e => setLocStad(e.target.value)}
              placeholder="Gent"
              className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
              style={{ borderColor: locStad ? accentColor : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {locStraat && locStad && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
            style={{ background: accentColor + "15", color: accentColor }}>
            <MapPin size={12} />
            {[locStraat, locHuisnummer].filter(Boolean).join(" ")}, {locPostcode} {locStad}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={() => {
            // Samengesteld adres opslaan
            const volledigAdres = [
              [locStraat, locHuisnummer].filter(Boolean).join(" "),
              locPostcode,
              locStad,
            ].filter(Boolean).join(", ");
            if (volledigAdres) setLocAdres(volledigAdres);
            setStep("signup");
          }}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ background: accentColor }}>
          {(locStraat && locStad) ? "Doorgaan" : "Adres overslaan"}
        </button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════
     SIGNUP
  ═══════════════════════════════════════════════════════════════════ */

  const LANDEN_TEL = [
    { code: "+32",  vlag: "🇧🇪", naam: "België"      },
    { code: "+31",  vlag: "🇳🇱", naam: "Nederland"   },
    { code: "+49",  vlag: "🇩🇪", naam: "Duitsland"   },
    { code: "+33",  vlag: "🇫🇷", naam: "Frankrijk"   },
    { code: "+352", vlag: "🇱🇺", naam: "Luxemburg"   },
    { code: "+44",  vlag: "🇬🇧", naam: "UK"          },
    { code: "+1",   vlag: "🇺🇸", naam: "VS / Canada" },
  ];

  const handleOAuth = async (provider: "google" | "apple") => {
    if (!supabaseReady) {
      setOauthError(`${provider === "google" ? "Google" : "Apple"} login vereist Supabase. Gebruik je naam hieronder.`);
      return;
    }
    setOauthLoading(provider);
    setOauthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/onboarding?oauth=1` },
    });
    if (error) {
      setOauthError(error.message);
      setOauthLoading(null);
    }
  };

  if (step === "signup") return (
    <div className="flex flex-col min-h-dvh px-6 pb-12 animate-slide-up">
      <div className="pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <button onClick={() => setStep("location")}
          className="touch-scale mb-4 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <ArrowLeft size={18} color="white" />
        </button>
        <h2 className="text-white font-black text-2xl">Account aanmaken</h2>
        <p className="text-white/70 text-sm mt-1">Als {rol === "vakman" ? "vakman" : rol === "beide" ? "vakman + klant" : "klant"}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 pt-6">

        {/* Google */}
        <button
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading}
          className="touch-scale w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3 border"
          style={{ borderColor: "var(--border)", background: "var(--surface)", opacity: oauthLoading === "apple" ? 0.5 : 1 }}>
          {oauthLoading === "google" ? (
            <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin inline-block" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Doorgaan met Google
        </button>

        {/* Apple */}
        <button
          onClick={() => handleOAuth("apple")}
          disabled={!!oauthLoading}
          className="touch-scale w-full py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-3"
          style={{ background: "#000", color: "#fff", opacity: oauthLoading === "google" ? 0.5 : 1 }}>
          {oauthLoading === "apple"
            ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
            : <Apple size={20} />
          }
          Doorgaan met Apple
        </button>

        {/* OAuth foutmelding */}
        {oauthError && (
          <div className="px-4 py-3 rounded-2xl text-xs text-center"
            style={{ background: "#fef3c7", color: "#92400e" }}>
            {oauthError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--muted)" }}>of telefoonnummer</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* Telefoonnummer met landcode */}
        <div className="relative flex items-stretch rounded-2xl border overflow-visible"
          style={{ borderColor: phone ? accentColor : "var(--border)", background: "var(--surface)" }}>

          {/* Landcode knop */}
          <button
            onClick={() => setLandOpen(o => !o)}
            className="touch-scale flex items-center gap-1.5 px-3 py-4 border-r flex-shrink-0"
            style={{ borderColor: "var(--border)" }}>
            <span className="text-lg">{LANDEN_TEL.find(l => l.code === landCode)?.vlag}</span>
            <span className="font-bold text-sm">{landCode}</span>
            <ChevronRight size={13} style={{ color: "var(--muted)", transform: landOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {/* Nummer invoer */}
          <div className="flex items-center flex-1 px-4 gap-2">
            <Phone size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <input
              type="tel"
              placeholder={landCode === "+32" ? "0470 12 34 56" : landCode === "+31" ? "06 12 34 56 78" : "Telefoonnummer"}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "var(--foreground)" }}
            />
          </div>

          {/* Landcode dropdown */}
          {landOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-50 rounded-2xl border overflow-hidden shadow-xl w-56"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {LANDEN_TEL.map(l => (
                <button key={l.code}
                  onClick={() => { setLandCode(l.code); setLandOpen(false); }}
                  className="touch-scale w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 text-left"
                  style={{
                    borderColor: "var(--border)",
                    background: landCode === l.code ? accentColor + "0f" : "transparent",
                  }}>
                  <span className="text-xl">{l.vlag}</span>
                  <span className="flex-1 text-sm font-semibold">{l.naam}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>{l.code}</span>
                  {landCode === l.code && <CheckCircle size={14} style={{ color: accentColor }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => phone.trim() ? setStep("profiel") : null}
          disabled={!phone.trim()}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base"
          style={{ background: phone.trim() ? accentColor : "var(--muted)" }}>
          SMS-code ontvangen →
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
              borderColor: naam ? accentColor : "var(--border)",
              background: "var(--surface)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Adres met autocomplete */}
        <AdresAutoComplete
          value={adres}
          onChange={(a, lat, lng) => {
            setAdres(a);
            setAdresLat(lat);
            setAdresLng(lng);
          }}
          placeholder="Tarwelaan 47, Kortrijk..."
          label={rol === "vakman" ? "Werkadres / postcode" : "Thuisadres"}
          accent={accentColor}
        />
        <p className="text-xs -mt-2" style={{ color: "var(--muted)" }}>
          {rol === "vakman"
            ? "Klanten zien alleen jouw afstand, niet je exacte adres."
            : "Alleen zichtbaar voor de vakman die jij kiest."}
        </p>

        {rol === "vakman" && (
          <div>
            <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
              Categorie
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "loodgieter", label: "Loodgieter" },
                { id: "elektricien", label: "Elektricien" },
                { id: "schilder", label: "Schilder" },
                { id: "schoonmaak", label: "Schoonmaak" },
                { id: "timmerman", label: "Timmerman" },
                { id: "sloten", label: "Slotenmaker" },
              ].map(({ id, label }) => {
                const catIcons: Record<string, typeof Wrench> = {
                  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
                  schoonmaak: Sparkles, timmerman: Hammer, sloten: Lock,
                };
                const Icon = catIcons[id] ?? Wrench;
                return (
                  <button key={id} onClick={() => setSelectedCat(label)}
                    className="touch-scale py-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border-2"
                    style={{
                      borderColor: selectedCat === label ? "var(--coral)" : "var(--border)",
                      background: selectedCat === label ? "var(--coral)" + "12" : "var(--surface)",
                      color: selectedCat === label ? "var(--coral)" : "var(--foreground)",
                    }}>
                    <Icon size={18} strokeWidth={1.8} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={finish}
        disabled={!naam.trim()}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base mt-4"
        style={{ background: naam.trim() ? accentColor : "var(--muted)" }}>
        {rol === "vakman" ? "Start als vakman" : "Account aanmaken"}
      </button>
    </div>
  );
}
