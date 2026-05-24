"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, Star, Clock, CheckCircle, ChevronRight,
  Zap, Building2, Wrench, CalendarDays, FileText, Receipt,
  CreditCard, Bell, ExternalLink, Loader2, X,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";
import { useNotificatieStore, type Notificatie } from "@/lib/notificatieStore";

// ─── mock data ────────────────────────────────────────────────────────────────

const JOBS_QUEUE = [
  { id: "q1", user: "Lisa de Vries", task: "Lekkende kraan keuken", address: "Prinsengracht 124", time: "Nu", budget: "€65-85", urgent: true },
  { id: "q2", user: "Ahmed M.", task: "CV inspectie", address: "Keizersgracht 88", time: "14:00", budget: "€75", urgent: false },
  { id: "q3", user: "Sandra H.", task: "Toilet reparatie", address: "Westerstraat 45", time: "Morgen 10:00", budget: "€90-120", urgent: false },
];

type VakmanBadge = {
  icon: string;
  label: string;
  earned: boolean;
  desc: string;
  certificaatTitel: string;
  certificaatOmschrijving: string;
  certificaatDatum?: string;
  kleur: string;
  zeldzaam?: boolean;
};

const BADGES_PROVIDER: VakmanBadge[] = [
  {
    icon: "🏆", label: "Topvakman", earned: true,
    desc: "Top 10% in jouw categorie",
    certificaatTitel: "Elite Vakman Status",
    certificaatOmschrijving: "Jij behoort tot de top 10% van alle vakmensen op Servr in jouw categorie. Dit is het bewijs van uitzonderlijke kwaliteit, betrouwbaarheid en klanttevredenheid.",
    certificaatDatum: "1 apr 2026", kleur: "#f59e0b",
  },
  {
    icon: "⚡", label: "Bliksemreactie", earned: true,
    desc: "Reageerde in < 2 min op een spoedjob",
    certificaatTitel: "De Bliksemman",
    certificaatOmschrijving: "Op het moment dat iemand in paniek de hulp-knop indrukte, was jij er binnen 2 minuten. Jij bent de reden dat mensen vertrouwen op Servr.",
    certificaatDatum: "14 apr 2026", kleur: "#f97316",
  },
  {
    icon: "🔥", label: "Brand gezet", earned: true,
    desc: "50 voltooide klussen",
    certificaatTitel: "50 Klussen Club",
    certificaatOmschrijving: "Vijftig klussen afgerond. Vijftig tevreden klanten. Vijftig keer jouw naam in de zoekopdrachten. Je bent officieel een vaste kracht in de buurt.",
    certificaatDatum: "3 mei 2026", kleur: "#ef4444",
  },
  {
    icon: "🦅", label: "Nachtadder", earned: false,
    desc: "3 spoedjobs na middernacht opgelost",
    certificaatTitel: "Nacht Sheriff",
    certificaatOmschrijving: "Als andere vakmensen sliepen, was jij wakker. Drie keer heb je midden in de nacht iemand uit de brand geholpen. Legendarisch.",
    kleur: "#6366f1", zeldzaam: true,
  },
  {
    icon: "💎", label: "Diamant klasse", earned: false,
    desc: "100 voltooide klussen",
    certificaatTitel: "De 100 Klussen Legende",
    certificaatOmschrijving: "Honderd klussen. Niet veel vakmensen halen dit. Jij wel. Dit certificaat bewijst dat je geen gewone vakman bent — je bent een instelling.",
    kleur: "#0ea5e9", zeldzaam: true,
  },
  {
    icon: "🎯", label: "Precieze offerte", earned: false,
    desc: "5 offertes die exact klopten",
    certificaatTitel: "Master Offereur",
    certificaatOmschrijving: "Vijf keer heb jij een offerte gemaakt die tot op de cent klopte met het eindresultaat. Dat is het teken van een échte professional.",
    kleur: "#10b981", zeldzaam: true,
  },
  {
    icon: "🚀", label: "Raketstart", earned: true,
    desc: "Eerste 10 klussen in < 1 maand",
    certificaatTitel: "Snelste Start Ooit",
    certificaatOmschrijving: "De meeste vakmensen doen er maanden over om 10 klussen te pakken. Jij deed het in minder dan een maand. Niemand stopt jou.",
    certificaatDatum: "15 jan 2026", kleur: "#8b5cf6",
  },
  {
    icon: "👑", label: "Koningsrang", earned: false,
    desc: "#1 positie op het leaderboard",
    certificaatTitel: "De Nummer Één",
    certificaatOmschrijving: "De absolute top van het leaderboard. Er is maar één nummer één en dat ben jij. Klanten zoeken jou specifiek op. Absolute legende.",
    kleur: "#d85a30", zeldzaam: true,
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({
  icon, label, value, sub, color,
}: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</p>
      </div>
      <p className="font-black text-2xl" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

// ─── Stripe Connect gate ──────────────────────────────────────────────────────

function StripeConnectGate() {
  const [loading, setLoading] = useState(false);
  const [fout, setFout]       = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setFout(null);
    try {
      const returnUrl = `${window.location.origin}/bedrijf`;
      const res  = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl }),
      });
      const data = await res.json();
      if (!data.url) {
        setFout(data.error ?? "Kan Stripe niet starten");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setFout("Kan Stripe niet bereiken");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-8"
        style={{ background: "linear-gradient(160deg, #635BFF 0%, #4b44cc 100%)" }}>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl">Vakman Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <CreditCard size={32} color="white" />
          </div>
          <div>
            <p className="text-white font-black text-lg leading-tight">
              Koppel eerst<br />je Stripe account
            </p>
            <p className="text-white/70 text-xs mt-1">
              Verplicht om klussen te ontvangen
            </p>
          </div>
        </div>
      </div>

      {/* Uitleg */}
      <div className="px-5 pt-6 flex flex-col gap-4">
        <div className="card p-5 flex flex-col gap-4">
          <p className="font-bold text-base">Waarom Stripe verplicht is</p>

          {[
            { icon: "💳", titel: "Directe uitbetalingen", tekst: "Klanten betalen via Servr. Jij ontvangt automatisch jouw deel op je rekening." },
            { icon: "🔒", titel: "Veilige transacties", tekst: "Stripe is een gecertificeerde betaalverwerker. Je bankgegevens zijn altijd beschermd." },
            { icon: "📊", titel: "Transparante fee",    tekst: "Servr houdt 8% commissie in. Je ontvangt altijd 92% van jouw tarief." },
          ].map(item => (
            <div key={item.icon} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "#635BFF" + "15" }}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm">{item.titel}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{item.tekst}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Voorbeeld breakdown */}
        <div className="card p-4 flex flex-col gap-2">
          <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>Voorbeeld: vakman vraagt €100</p>

          {/* Klant-kant */}
          <p className="text-[10px] font-bold uppercase mt-1" style={{ color: "var(--muted)" }}>Wat de klant betaalt</p>
          {[
            { label: "Jouw tarief",             waarde: "€100,00", kleur: "var(--foreground)" },
            { label: "+ Service fee klant (5%)", waarde: "+€5,00",  kleur: "var(--muted)" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>{r.label}</span>
              <span style={{ color: r.kleur }}>{r.waarde}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t pt-1.5"
            style={{ borderColor: "var(--border)" }}>
            <span>Klant betaalt totaal</span>
            <span>€105,00</span>
          </div>

          {/* Vakman-kant */}
          <p className="text-[10px] font-bold uppercase mt-3" style={{ color: "var(--muted)" }}>Wat jij ontvangt</p>
          {[
            { label: "Jouw tarief",              waarde: "€100,00", kleur: "var(--foreground)" },
            { label: "− Servr commissie (8%)",   waarde: "−€8,00",  kleur: "var(--muted)" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span style={{ color: "var(--muted)" }}>{r.label}</span>
              <span style={{ color: r.kleur }}>{r.waarde}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black border-t pt-1.5"
            style={{ borderColor: "var(--border)", color: "#16a34a" }}>
            <span>Jij ontvangt netto</span>
            <span>€92,00</span>
          </div>

          {/* Servr totaal */}
          <div className="flex justify-between text-xs mt-1 pt-1.5 border-t"
            style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--muted)" }}>Servr verdient totaal (€5 + €8)</span>
            <span style={{ color: "var(--muted)" }}>€13,00</span>
          </div>
        </div>

        {fout && (
          <div className="p-3 rounded-xl text-sm" style={{ background: "#fee2e2", color: "#dc2626" }}>
            ⚠️ {fout}
          </div>
        )}

        <button
          disabled={loading}
          onClick={handleConnect}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: loading ? "var(--muted)" : "#635BFF" }}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Even wachten…</>
            : <><ExternalLink size={18} /> Stripe account koppelen</>}
        </button>
        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          Je wordt doorgestuurd naar Stripe · Gratis · Duurt ~2 minuten
        </p>
      </div>
    </div>
  );
}

// ─── Vakman certificaat modal ─────────────────────────────────────────────────

function VakmanCertificaatModal({ badge, onSluit }: { badge: VakmanBadge; onSluit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onSluit}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--background)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-8 flex flex-col items-center gap-3 relative"
          style={{ background: `linear-gradient(135deg, ${badge.kleur}22 0%, ${badge.kleur}08 100%)` }}>
          <button onClick={onSluit}
            className="absolute top-4 right-4 touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <X size={14} />
          </button>

          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: badge.earned ? `${badge.kleur}18` : "var(--surface-2)",
              border: `2px solid ${badge.earned ? badge.kleur + "40" : "var(--border)"}`,
            }}>
            {badge.earned ? badge.icon : "🔒"}
          </div>

          {badge.zeldzaam && badge.earned && (
            <span className="text-[10px] font-black px-3 py-1 rounded-full"
              style={{ background: badge.kleur, color: "white" }}>
              ✨ ZELDZAME BADGE
            </span>
          )}

          <div className="text-center">
            <h2 className="font-black text-xl">{badge.earned ? badge.certificaatTitel : badge.label}</h2>
            <p className="text-sm mt-1 font-semibold" style={{ color: badge.earned ? badge.kleur : "var(--muted)" }}>
              {badge.earned ? badge.label : badge.desc}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          {badge.earned ? (
            <>
              <div className="rounded-2xl p-4"
                style={{ background: `${badge.kleur}08`, border: `1px solid ${badge.kleur}25` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📜</span>
                  <p className="font-black text-xs uppercase tracking-wider" style={{ color: badge.kleur }}>
                    Officieel certificaat
                  </p>
                </div>
                <p className="text-sm leading-relaxed">{badge.certificaatOmschrijving}</p>
                {badge.certificaatDatum && (
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>Behaald op {badge.certificaatDatum}</p>
                )}
              </div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-2xl">⭐</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
                <p className="font-bold text-sm mb-1">Hoe te ontgrendelen</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{badge.desc}</p>
              </div>
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: `${badge.kleur}08`, border: `1px solid ${badge.kleur}20` }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-bold text-sm">Beloning na behalen</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    Officieel certificaat + zichtbaar op jouw profiel
                  </p>
                </div>
              </div>
            </>
          )}
          <button onClick={onSluit}
            className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: badge.earned ? badge.kleur : "var(--muted)" }}>
            {badge.earned ? "Geweldig! 🎉" : "Begrepen, ik ga ervoor!"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Notificatie banner ───────────────────────────────────────────────────────

function NotificatieBanner({ notificatie, onSluit }: { notificatie: Notificatie; onSluit: () => void }) {
  return (
    <div className="mx-5 mt-4 card p-4 flex flex-col gap-2 border-l-4"
      style={{ borderLeftColor: "#16a34a" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#dcfce7" }}>
            <Bell size={14} style={{ color: "#16a34a" }} />
          </div>
          <p className="font-bold text-sm">{notificatie.titel}</p>
        </div>
        <button onClick={onSluit} className="touch-scale text-lg leading-none" style={{ color: "var(--muted)" }}>×</button>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        {notificatie.bericht}
      </p>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: "Klant betaald",  waarde: `€${fmt(notificatie.klantBetaald)}`,   kleur: "var(--foreground)" },
          { label: "Servr fee",      waarde: `€${fmt(notificatie.klantBetaald - notificatie.vakmanOntvangt)}`, kleur: "var(--muted)" },
          { label: "Jij ontvangt",   waarde: `€${fmt(notificatie.vakmanOntvangt)}`, kleur: "#16a34a" },
        ].map(r => (
          <div key={r.label} className="flex flex-col items-center p-2 rounded-xl"
            style={{ background: "var(--surface-2)" }}>
            <span className="font-black text-sm" style={{ color: r.kleur }}>{r.waarde}</span>
            <span className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{r.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
        Offerte {notificatie.offerte} · {new Date(notificatie.timestamp).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
      </p>
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<"overzicht" | "wachtrij" | "badges">("overzicht");
  const { name: userName } = useUserStore();
  const { onboarded } = useStripeConnectStore();
  const { notificaties, markeerGelezen } = useNotificatieStore();
  const [gesloten, setGesloten] = useState<string[]>([]);
  const [geweigerd, setGeweigerd] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeBadge, setActiveBadge] = useState<VakmanBadge | null>(null);

  useEffect(() => setMounted(true), []);

  // Toon gate als Stripe niet gekoppeld is
  if (mounted && !onboarded) {
    return <StripeConnectGate />;
  }

  // Ongelezon notificaties die nog niet gesloten zijn
  const zichtbaar = notificaties.filter(
    (n) => !n.gelezen && !gesloten.includes(n.id)
  );

  const sluitNotificatie = (id: string) => {
    markeerGelezen(id);
    setGesloten((v) => [...v, id]);
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--coral) 0%, #b84820 100%)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/profile"
              className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft size={18} color="white" />
            </Link>
            <h1 className="text-white font-black text-xl">Vakman Dashboard</h1>
          </div>
          {/* Online toggle */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-dot" />
            <span className="text-white text-xs font-bold">Online</span>
          </div>
        </div>

        {/* Servr Score groot */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - 0.94)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-xl leading-none">94</span>
              <span className="text-white/60 text-[9px]">score</span>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-xs">Servr Score</p>
            <p className="text-white font-black text-2xl">{userName || "Vakman"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/80 text-sm">🏆 Topvakman</span>
              <span className="text-white/80 text-sm">·</span>
              <Star size={13} className="fill-yellow-300 text-yellow-300" />
              <span className="text-white font-bold text-sm">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nieuwe betalingen notificaties */}
      {zichtbaar.map((n) => (
        <NotificatieBanner key={n.id} notificatie={n} onSluit={() => sluitNotificatie(n.id)} />
      ))}

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: "var(--surface-2)" }}>
          {(["overzicht", "wachtrij", "badges"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all"
              style={{
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "var(--foreground)" : "var(--muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overzicht tab */}
        {tab === "overzicht" && (
          <div className="flex flex-col gap-5">

            {/* Snelle toegang */}
            <div>
              <p className="font-bold text-xs uppercase mb-3" style={{ color: "var(--muted)" }}>Beheer</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: "/bedrijf", icon: <Building2 size={20} style={{ color: "var(--coral)" }} />, label: "Bedrijfsprofiel", sub: "KvK, BTW, IBAN" },
                  { href: "/diensten", icon: <Wrench size={20} style={{ color: "var(--coral)" }} />, label: "Diensten & Prijzen", sub: "Beheer je aanbod" },
                  { href: "/agenda", icon: <CalendarDays size={20} style={{ color: "var(--coral)" }} />, label: "Agenda", sub: "Boekingen & planning" },
                  { href: "/documenten", icon: <FileText size={20} style={{ color: "var(--coral)" }} />, label: "Offertes & Facturen", sub: "Beheer documenten" },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="touch-scale card p-4 flex flex-col gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--coral)" + "12" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Openstaande facturen */}
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "#fef3c7" }}>
                <Receipt size={20} style={{ color: "#d97706" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">1 openstaande factuur</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ahmed Mansour · €298,04 · vervalt over 11 dagen</p>
              </div>
              <Link href="/documenten?tab=facturen"
                className="touch-scale px-3 py-1.5 rounded-xl font-bold text-xs"
                style={{ background: "#fef3c7", color: "#d97706" }}>
                Bekijk
              </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/verdiensten" className="touch-scale">
                <StatCard icon="💰" label="Verdiensten netto" value="€ 758" sub="Na 8% Servr commissie" color="var(--coral)" />
              </Link>
              <Link href="/klussen" className="touch-scale">
                <StatCard icon="📋" label="Klussen (week)" value="11" sub="8 voltooid, 3 lopend" color="var(--foreground)" />
              </Link>
              <StatCard icon="⭐" label="Gem. beoordeling" value="4.9" sub="127 reviews totaal" color="#f59e0b" />
              <StatCard icon="⚡" label="Reactietijd" value="3 min" sub="Gemiddeld" color="var(--coral)" />
            </div>

            {/* Verdiensten grafiek */}
            <Link href="/verdiensten">
              <div className="card p-4 touch-scale">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm">Netto verdiensten</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Na 8% Servr commissie</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: "var(--coral)" + "18", color: "var(--coral)" }}>
                    Deze week →
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 108, 76, 180, 144, 126, 83].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height: `${(v / 180) * 80}px`, background: i === 3 ? "var(--coral)" : "var(--surface-2)" }} />
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Leaderboard positie */}
            <Link href="/leaderboard" className="touch-scale">
              <div className="card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "#fef3c7" }}>🏆</div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Leaderboard — Loodgieter</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Jordaan, Amsterdam · 34 vakmensen</p>
                  <p className="font-black text-lg mt-1" style={{ color: "var(--coral)" }}>#2 van 34</p>
                </div>
                <TrendingUp size={20} className="text-green-500" />
              </div>
            </Link>
          </div>
        )}

        {/* Wachtrij tab */}
        {tab === "wachtrij" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{JOBS_QUEUE.filter(j => !geweigerd.includes(j.id)).length} nieuwe opdrachten</p>
              <Link href="/scan" className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--coral)" }}>
                <Zap size={13} /> Leads
              </Link>
            </div>

            {/* Uitleg locatie-privacy */}
            <div className="p-3 rounded-2xl flex items-start gap-2"
              style={{ background: "var(--coral)" + "10" }}>
              <span className="text-base">📍</span>
              <p className="text-xs leading-relaxed" style={{ color: "var(--coral)" }}>
                Je ziet de buurt van de klant. Het <strong>exacte adres</strong> wordt pas zichtbaar nadat de klant jouw offerte accepteert.
              </p>
            </div>

            {geweigerd.length > 0 && geweigerd.length === JOBS_QUEUE.length && (
              <div className="flex flex-col items-center py-10 gap-3 text-center">
                <span className="text-4xl">📭</span>
                <p className="font-bold text-sm">Geen opdrachten in wachtrij</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Je hebt alle opdrachten geweigerd. Klanten krijgen een melding om een andere vakman te zoeken.</p>
              </div>
            )}
            {JOBS_QUEUE.filter(j => !geweigerd.includes(j.id)).map(job => (
              <div key={job.id} className="card p-4">
                {job.urgent && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="animate-dot w-2 h-2 rounded-full" style={{ background: "var(--coral)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--coral)" }}>SPOED</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm">{job.task}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      👤 {job.user} · 📍 {job.address}
                    </p>
                  </div>
                  <span className="font-black text-sm flex-shrink-0" style={{ color: "var(--coral)" }}>
                    {job.budget}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1" style={{ color: "var(--muted)" }}>
                    <Clock size={13} />
                    <span className="text-xs font-semibold">{job.time}</span>
                  </div>
                  <button
                    onClick={() => setGeweigerd(v => [...v, job.id])}
                    className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    ✕ Weigeren
                  </button>
                  <Link href={`/opdracht/${job.id === "q1" ? "o1" : job.id === "q2" ? "o2" : "o3"}`}
                    className="touch-scale px-3 py-2 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--coral)" }}>
                    Offerte sturen →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges tab */}
        {tab === "badges" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                Klik op een badge voor details & certificaat
              </p>
              <span className="text-xs font-bold" style={{ color: "var(--coral)" }}>
                {BADGES_PROVIDER.filter(b => b.earned).length}/{BADGES_PROVIDER.length} behaald
              </span>
            </div>
            {BADGES_PROVIDER.map(b => (
              <button key={b.label}
                onClick={() => setActiveBadge(b)}
                className="touch-scale card p-4 flex items-center gap-4 w-full text-left"
                style={{ opacity: b.earned ? 1 : 0.55 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 relative"
                  style={{ background: b.earned ? `${b.kleur}18` : "var(--surface-2)", border: `1.5px solid ${b.earned ? b.kleur + "30" : "var(--border)"}` }}>
                  {b.earned ? b.icon : "🔒"}
                  {b.zeldzaam && b.earned && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] px-1 py-0.5 rounded-full font-black"
                      style={{ background: b.kleur, color: "white" }}>✨</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm">{b.label}</p>
                    {b.earned && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: b.kleur, color: "white" }}>
                        ✓ Verdiend
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{b.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badge certificaat modal */}
      {activeBadge && (
        <VakmanCertificaatModal badge={activeBadge} onSluit={() => setActiveBadge(null)} />
      )}
    </div>
  );
}
