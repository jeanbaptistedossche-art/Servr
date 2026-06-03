"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, TrendingUp, Star, Clock, ChevronRight,
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
    certificaatDatum: "1 apr 2026", kleur: "#C97A4D",
  },
  {
    icon: "⚡", label: "Bliksemreactie", earned: true,
    desc: "Reageerde in < 2 min op een spoedjob",
    certificaatTitel: "De Bliksemman",
    certificaatOmschrijving: "Op het moment dat iemand in paniek de hulp-knop indrukte, was jij er binnen 2 minuten. Jij bent de reden dat mensen vertrouwen op Servr.",
    certificaatDatum: "14 apr 2026", kleur: "#C97A4D",
  },
  {
    icon: "🔥", label: "Brand gezet", earned: true,
    desc: "50 voltooide klussen",
    certificaatTitel: "50 Klussen Club",
    certificaatOmschrijving: "Vijftig klussen afgerond. Vijftig tevreden klanten. Vijftig keer jouw naam in de zoekopdrachten. Je bent officieel een vaste kracht in de buurt.",
    certificaatDatum: "3 mei 2026", kleur: "#2B4030",
  },
  {
    icon: "🦅", label: "Nachtadder", earned: false,
    desc: "3 spoedjobs na middernacht opgelost",
    certificaatTitel: "Nacht Sheriff",
    certificaatOmschrijving: "Als andere vakmensen sliepen, was jij wakker. Drie keer heb je midden in de nacht iemand uit de brand geholpen. Legendarisch.",
    kleur: "#5C5C56", zeldzaam: true,
  },
  {
    icon: "💎", label: "Diamant klasse", earned: false,
    desc: "100 voltooide klussen",
    certificaatTitel: "De 100 Klussen Legende",
    certificaatOmschrijving: "Honderd klussen. Niet veel vakmensen halen dit. Jij wel. Dit certificaat bewijst dat je geen gewone vakman bent — je bent een instelling.",
    kleur: "#5C5C56", zeldzaam: true,
  },
  {
    icon: "🎯", label: "Precieze offerte", earned: false,
    desc: "5 offertes die exact klopten",
    certificaatTitel: "Master Offereur",
    certificaatOmschrijving: "Vijf keer heb jij een offerte gemaakt die tot op de cent klopte met het eindresultaat. Dat is het teken van een échte professional.",
    kleur: "#2B4030", zeldzaam: true,
  },
  {
    icon: "🚀", label: "Raketstart", earned: true,
    desc: "Eerste 10 klussen in < 1 maand",
    certificaatTitel: "Snelste Start Ooit",
    certificaatOmschrijving: "De meeste vakmensen doen er maanden over om 10 klussen te pakken. Jij deed het in minder dan een maand. Niemand stopt jou.",
    certificaatDatum: "15 jan 2026", kleur: "#C97A4D",
  },
  {
    icon: "👑", label: "Koningsrang", earned: false,
    desc: "#1 positie op het leaderboard",
    certificaatTitel: "De Nummer Één",
    certificaatOmschrijving: "De absolute top van het leaderboard. Er is maar één nummer één en dat ben jij. Klanten zoeken jou specifiek op. Absolute legende.",
    kleur: "#C97A4D", zeldzaam: true,
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Stripe Connect gate ──────────────────────────────────────────────────────

function StripeConnectGate() {
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setFout(null);
    try {
      const returnUrl = `${window.location.origin}/bedrijf`;
      const res = await fetch("/api/stripe/connect", {
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
    <div className="flex flex-col min-h-full pb-8 animate-fade-in" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </Link>
          <h1 className="font-black text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Vakman Dashboard
          </h1>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        <div className="flex items-center gap-4 p-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#E8EDE9" }}>
            <CreditCard size={28} style={{ color: "#2B4030" }} />
          </div>
          <div>
            <p className="font-black text-base" style={{ color: "#1A1D1A" }}>Koppel eerst je Stripe account</p>
            <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>Verplicht om klussen te ontvangen</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <p className="font-bold text-base" style={{ color: "#1A1D1A" }}>Waarom Stripe verplicht is</p>
          {[
            { icon: "💳", titel: "Directe uitbetalingen", tekst: "Klanten betalen via Servr. Jij ontvangt automatisch jouw deel op je rekening." },
            { icon: "🔒", titel: "Veilige transacties",   tekst: "Stripe is een gecertificeerde betaalverwerker. Je bankgegevens zijn altijd beschermd." },
            { icon: "📊", titel: "Transparante fee",      tekst: "Servr houdt 8% commissie in. Je ontvangt altijd 92% van jouw tarief." },
          ].map(item => (
            <div key={item.icon} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: "#E8EDE9" }}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{item.titel}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#8A8A83" }}>{item.tekst}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 flex flex-col gap-2"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <p className="text-xs font-bold uppercase mb-1" style={{ color: "#8A8A83" }}>Voorbeeld: vakman vraagt €100</p>
          <p className="text-[10px] font-bold uppercase mt-1" style={{ color: "#8A8A83" }}>Wat de klant betaalt</p>
          {[
            { label: "Jouw tarief",              waarde: "€100,00", kleur: "#1A1D1A" },
            { label: "+ Service fee klant (5%)", waarde: "+€5,00",  kleur: "#8A8A83" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span style={{ color: "#8A8A83" }}>{r.label}</span>
              <span style={{ color: r.kleur }}>{r.waarde}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold border-t pt-1.5"
            style={{ borderColor: "#E5DDD0" }}>
            <span style={{ color: "#1A1D1A" }}>Klant betaalt totaal</span>
            <span style={{ color: "#1A1D1A" }}>€105,00</span>
          </div>
          <p className="text-[10px] font-bold uppercase mt-3" style={{ color: "#8A8A83" }}>Wat jij ontvangt</p>
          {[
            { label: "Jouw tarief",            waarde: "€100,00", kleur: "#1A1D1A" },
            { label: "− Servr commissie (8%)", waarde: "−€8,00",  kleur: "#8A8A83" },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span style={{ color: "#8A8A83" }}>{r.label}</span>
              <span style={{ color: r.kleur }}>{r.waarde}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-black border-t pt-1.5"
            style={{ borderColor: "#E5DDD0", color: "#2B4030" }}>
            <span>Jij ontvangt netto</span>
            <span>€92,00</span>
          </div>
          <div className="flex justify-between text-xs mt-1 pt-1.5 border-t"
            style={{ borderColor: "#E5DDD0" }}>
            <span style={{ color: "#8A8A83" }}>Servr verdient totaal (€5 + €8)</span>
            <span style={{ color: "#8A8A83" }}>€13,00</span>
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
          className="touch-scale w-full py-4 font-bold flex items-center justify-center gap-2"
          style={{ background: loading ? "#8A8A83" : "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Even wachten…</>
            : <><ExternalLink size={17} /> Stripe account koppelen</>}
        </button>
        <p className="text-center text-xs" style={{ color: "#8A8A83" }}>
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
        style={{ background: "#FBF7F0" }}
        onClick={e => e.stopPropagation()}>
        <div className="p-8 flex flex-col items-center gap-3 relative"
          style={{ background: `${badge.kleur}12` }}>
          <button onClick={onSluit}
            className="absolute top-4 right-4 touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
            <X size={14} style={{ color: "#5C5C56" }} />
          </button>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background: badge.earned ? `${badge.kleur}18` : "#F0EDE8",
              border: `2px solid ${badge.earned ? badge.kleur + "40" : "#E5DDD0"}`,
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
            <h2 className="font-black text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              {badge.earned ? badge.certificaatTitel : badge.label}
            </h2>
            <p className="text-sm mt-1 font-semibold" style={{ color: badge.earned ? badge.kleur : "#8A8A83" }}>
              {badge.earned ? badge.label : badge.desc}
            </p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {badge.earned ? (
            <>
              <div className="p-4"
                style={{ background: `${badge.kleur}08`, border: `0.5px solid ${badge.kleur}25`, borderRadius: 14 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">📜</span>
                  <p className="font-black text-xs uppercase tracking-wider" style={{ color: badge.kleur }}>
                    Officieel certificaat
                  </p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1D1A" }}>{badge.certificaatOmschrijving}</p>
                {badge.certificaatDatum && (
                  <p className="text-xs mt-2" style={{ color: "#8A8A83" }}>Behaald op {badge.certificaatDatum}</p>
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
              <div className="p-4" style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <p className="font-bold text-sm mb-1" style={{ color: "#1A1D1A" }}>Hoe te ontgrendelen</p>
                <p className="text-sm leading-relaxed" style={{ color: "#8A8A83" }}>{badge.desc}</p>
              </div>
              <div className="p-4 flex items-center gap-3"
                style={{ background: `${badge.kleur}08`, border: `0.5px solid ${badge.kleur}20`, borderRadius: 14 }}>
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>Beloning na behalen</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>
                    Officieel certificaat + zichtbaar op jouw profiel
                  </p>
                </div>
              </div>
            </>
          )}
          <button onClick={onSluit}
            className="touch-scale w-full py-3.5 font-bold text-sm"
            style={{ background: badge.earned ? badge.kleur : "#8A8A83", color: "white", borderRadius: 99, border: "none" }}>
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
    <div className="mx-5 mt-4 p-4 flex flex-col gap-2"
      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, borderLeft: "3px solid #2B4030" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#E8EDE9" }}>
            <Bell size={14} style={{ color: "#2B4030" }} />
          </div>
          <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{notificatie.titel}</p>
        </div>
        <button onClick={onSluit} className="touch-scale text-lg leading-none" style={{ color: "#8A8A83" }}>×</button>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#1A1D1A" }}>{notificatie.bericht}</p>
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[
          { label: "Klant betaald", waarde: `€${fmt(notificatie.klantBetaald)}`,   kleur: "#1A1D1A" },
          { label: "Servr fee",     waarde: `€${fmt(notificatie.klantBetaald - notificatie.vakmanOntvangt)}`, kleur: "#8A8A83" },
          { label: "Jij ontvangt",  waarde: `€${fmt(notificatie.vakmanOntvangt)}`, kleur: "#2B4030" },
        ].map(r => (
          <div key={r.label} className="flex flex-col items-center p-2 rounded-xl"
            style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
            <span className="font-black text-sm" style={{ color: r.kleur }}>{r.waarde}</span>
            <span className="text-[10px] mt-0.5" style={{ color: "#8A8A83" }}>{r.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "#8A8A83" }}>
        Offerte {notificatie.offerte} · {new Date(notificatie.timestamp).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}
      </p>
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<"overzicht" | "wachtrij" | "badges">("overzicht");
  const { name: userName, activeView } = useUserStore();
  const { onboarded } = useStripeConnectStore();
  const { notificaties, markeerGelezen } = useNotificatieStore();
  const [gesloten, setGesloten] = useState<string[]>([]);
  const [geweigerd, setGeweigerd] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeBadge, setActiveBadge] = useState<VakmanBadge | null>(null);

  useEffect(() => setMounted(true), []);

  // Stripe Connect is alleen vereist voor vakmensen, niet voor klanten
  if (mounted && activeView === "vakman" && !onboarded) {
    return <StripeConnectGate />;
  }

  const zichtbaar = notificaties.filter(
    (n) => !n.gelezen && !gesloten.includes(n.id)
  );

  const sluitNotificatie = (id: string) => {
    markeerGelezen(id);
    setGesloten((v) => [...v, id]);
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/profile"
              className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
              <ArrowLeft size={18} style={{ color: "#2B4030" }} />
            </Link>
            <h1 className="font-black text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Vakman Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold" style={{ color: "#2B4030" }}>Online</span>
          </div>
        </div>

        {/* Score strip */}
        <div className="flex items-center gap-4 p-4 mb-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5DDD0" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#2B4030" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - 0.94)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-lg leading-none" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>94</span>
              <span className="text-[9px]" style={{ color: "#8A8A83" }}>score</span>
            </div>
          </div>
          <div>
            <p className="text-xs" style={{ color: "#8A8A83" }}>Servr Score</p>
            <p className="font-black text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{userName || "Vakman"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">🏆 Topvakman</span>
              <span style={{ color: "#E5DDD0" }}>·</span>
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-sm" style={{ color: "#1A1D1A" }}>4.9</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          {(["overzicht", "wachtrij", "badges"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all"
              style={{
                background: tab === t ? "#2B4030" : "transparent",
                color: tab === t ? "#F5EFE5" : "#8A8A83",
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notificaties */}
      {zichtbaar.map((n) => (
        <NotificatieBanner key={n.id} notificatie={n} onSluit={() => sluitNotificatie(n.id)} />
      ))}

      <div className="px-5 pb-28 mt-4">

        {/* Overzicht tab */}
        {tab === "overzicht" && (
          <div className="flex flex-col gap-5">

            {/* Beheer grid */}
            <div>
              <p className="font-bold text-xs uppercase mb-3" style={{ color: "#8A8A83" }}>Beheer</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: "/bedrijf",    icon: <Building2 size={19} style={{ color: "#2B4030" }} />, label: "Bedrijfsprofiel",     sub: "KvK, BTW, IBAN" },
                  { href: "/diensten",   icon: <Wrench size={19} style={{ color: "#2B4030" }} />,    label: "Diensten & Prijzen",  sub: "Beheer je aanbod" },
                  { href: "/agenda",     icon: <CalendarDays size={19} style={{ color: "#2B4030" }} />, label: "Agenda",           sub: "Boekingen & planning" },
                  { href: "/documenten", icon: <FileText size={19} style={{ color: "#2B4030" }} />,  label: "Offertes & Facturen", sub: "Beheer documenten" },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="touch-scale p-4 flex flex-col gap-2.5"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "#E8EDE9" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{item.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Openstaande facturen */}
            <div className="p-4 flex items-center gap-3"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#F7EDE4" }}>
                <Receipt size={19} style={{ color: "#C97A4D" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>1 openstaande factuur</p>
                <p className="text-xs" style={{ color: "#8A8A83" }}>Ahmed Mansour · €298,04 · vervalt over 11 dagen</p>
              </div>
              <Link href="/documenten?tab=facturen"
                className="touch-scale px-3 py-1.5 text-xs font-bold"
                style={{ background: "#F7EDE4", color: "#C97A4D", borderRadius: 99, border: "none" }}>
                Bekijk
              </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Verdiensten", value: "€758", sub: "Na 8% commissie", color: "#C97A4D", href: "/verdiensten" },
                { label: "Klussen", value: "11", sub: "8 voltooid, 3 lopend", color: "#1A1D1A", href: "/klussen" },
                { label: "Beoordeling", value: "4.9", sub: "127 reviews", color: "#C97A4D", href: undefined },
              ].map((s, i) => (
                <div key={i} className="p-3 text-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                  <p className="font-black text-xl" style={{ color: s.color, fontFamily: "'Source Serif 4', Georgia, serif" }}>{s.value}</p>
                  <p className="text-[10px] font-bold mt-0.5" style={{ color: "#1A1D1A" }}>{s.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#8A8A83" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Verdiensten grafiek */}
            <Link href="/verdiensten">
              <div className="p-4 touch-scale" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>Netto verdiensten</p>
                    <p className="text-xs" style={{ color: "#8A8A83" }}>Na 8% Servr commissie</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: "#F7EDE4", color: "#C97A4D" }}>
                    Deze week →
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 108, 76, 180, 144, 126, 83].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height: `${(v / 180) * 80}px`, background: i === 3 ? "#2B4030" : "#E5DDD0" }} />
                      <span className="text-[10px]" style={{ color: "#8A8A83" }}>
                        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Leaderboard */}
            <Link href="/leaderboard" className="touch-scale">
              <div className="p-4 flex items-center gap-4" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "#F7EDE4" }}>🏆</div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>Leaderboard — Loodgieter</p>
                  <p className="text-xs" style={{ color: "#8A8A83" }}>Jordaan, Amsterdam · 34 vakmensen</p>
                  <p className="font-black text-lg mt-1" style={{ color: "#C97A4D", fontFamily: "'Source Serif 4', Georgia, serif" }}>#2 van 34</p>
                </div>
                <TrendingUp size={19} className="text-green-500" />
              </div>
            </Link>
          </div>
        )}

        {/* Wachtrij tab */}
        {tab === "wachtrij" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>
                {JOBS_QUEUE.filter(j => !geweigerd.includes(j.id)).length} nieuwe opdrachten
              </p>
              <Link href="/scan" className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#C97A4D" }}>
                <Zap size={13} /> Leads
              </Link>
            </div>

            <div className="p-3 flex items-start gap-2"
              style={{ background: "#F7EDE4", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <span className="text-base">📍</span>
              <p className="text-xs leading-relaxed" style={{ color: "#C97A4D" }}>
                Je ziet de buurt van de klant. Het <strong>exacte adres</strong> wordt pas zichtbaar nadat de klant jouw offerte accepteert.
              </p>
            </div>

            {geweigerd.length > 0 && geweigerd.length === JOBS_QUEUE.length && (
              <div className="flex flex-col items-center py-10 gap-3 text-center">
                <span className="text-4xl">📭</span>
                <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>Geen opdrachten in wachtrij</p>
                <p className="text-xs" style={{ color: "#8A8A83" }}>Je hebt alle opdrachten geweigerd.</p>
              </div>
            )}
            {JOBS_QUEUE.filter(j => !geweigerd.includes(j.id)).map(job => (
              <div key={job.id} className="p-4"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                {job.urgent && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#C97A4D" }} />
                    <span className="text-xs font-bold" style={{ color: "#C97A4D" }}>SPOED</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{job.task}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>
                      👤 {job.user} · 📍 {job.address}
                    </p>
                  </div>
                  <span className="font-black text-sm flex-shrink-0" style={{ color: "#C97A4D" }}>
                    {job.budget}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1" style={{ color: "#8A8A83" }}>
                    <Clock size={13} />
                    <span className="text-xs font-semibold">{job.time}</span>
                  </div>
                  <button
                    onClick={() => setGeweigerd(v => [...v, job.id])}
                    className="touch-scale flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                    style={{ background: "transparent", border: "0.5px solid #E5DDD0", color: "#5C5C56", borderRadius: 99 }}>
                    ✕ Weigeren
                  </button>
                  <Link href={`/opdracht/${job.id === "q1" ? "o1" : job.id === "q2" ? "o2" : "o3"}`}
                    className="touch-scale px-3 py-2 text-xs font-bold"
                    style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
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
              <p className="text-sm font-semibold" style={{ color: "#8A8A83" }}>
                Klik op een badge voor details & certificaat
              </p>
              <span className="text-xs font-bold" style={{ color: "#C97A4D" }}>
                {BADGES_PROVIDER.filter(b => b.earned).length}/{BADGES_PROVIDER.length} behaald
              </span>
            </div>
            {BADGES_PROVIDER.map(b => (
              <button key={b.label}
                onClick={() => setActiveBadge(b)}
                className="touch-scale p-4 flex items-center gap-4 w-full text-left"
                style={{ opacity: b.earned ? 1 : 0.55, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 relative"
                  style={{ background: b.earned ? `${b.kleur}18` : "#F5EFE5", border: `1.5px solid ${b.earned ? b.kleur + "30" : "#E5DDD0"}` }}>
                  {b.earned ? b.icon : "🔒"}
                  {b.zeldzaam && b.earned && (
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] px-1 py-0.5 rounded-full font-black"
                      style={{ background: b.kleur, color: "white" }}>✨</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{b.label}</p>
                    {b.earned && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: b.kleur, color: "white" }}>
                        ✓ Verdiend
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#8A8A83" }}>{b.desc}</p>
                </div>
                <ChevronRight size={15} style={{ color: "#8A8A83", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {activeBadge && (
        <VakmanCertificaatModal badge={activeBadge} onSluit={() => setActiveBadge(null)} />
      )}
    </div>
  );
}
