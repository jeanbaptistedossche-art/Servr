"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, FileText, Receipt, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Send, X, ExternalLink, Loader2,
} from "lucide-react";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";
import { useUserStore } from "@/lib/store";

// ─── Mock data ────────────────────────────────────────────────────────────────

type OfferteStatus = "concept" | "verstuurd" | "geaccepteerd" | "verlopen" | "geweigerd";
type FactuurStatus = "open" | "herinnering" | "betaald" | "verlopen";

type DocOfferte = {
  id: string;
  nummer: string;
  klantNaam: string;
  klantAvatar: string;
  datum: string;
  geldigTot: string;
  totaal: number;
  status: OfferteStatus;
  omschrijving: string;
};

type DocFactuur = {
  id: string;
  nummer: string;
  klantNaam: string;
  klantAvatar: string;
  datum: string;
  vervaldatum: string;
  totaal: number;
  status: FactuurStatus;
  omschrijving: string;
};

const MOCK_OFFERTES: DocOfferte[] = [
  {
    id: "off-pro-1",
    nummer: "OFF-1042",
    klantNaam: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    datum: "18 mei 2026",
    geldigTot: "1 jun 2026",
    totaal: 122.00,
    status: "verstuurd",
    omschrijving: "Lekkage reparatie kraan keuken",
  },
  {
    id: "off-pro-2",
    nummer: "OFF-1041",
    klantNaam: "Sandra Hoek",
    klantAvatar: "https://i.pravatar.cc/150?img=56",
    datum: "14 mei 2026",
    geldigTot: "28 mei 2026",
    totaal: 195.00,
    status: "geaccepteerd",
    omschrijving: "Toilet installatie — materiaal inbegrepen",
  },
  {
    id: "off-pro-3",
    nummer: "OFF-1040",
    klantNaam: "Pieter van Dam",
    klantAvatar: "https://i.pravatar.cc/150?img=15",
    datum: "5 mei 2026",
    geldigTot: "19 mei 2026",
    totaal: 75.00,
    status: "verlopen",
    omschrijving: "Kraan vervangen badkamer",
  },
  {
    id: "off-pro-4",
    nummer: "OFF-1039",
    klantNaam: "Concept",
    klantAvatar: "https://i.pravatar.cc/150?img=1",
    datum: "17 mei 2026",
    geldigTot: "31 mei 2026",
    totaal: 240.00,
    status: "concept",
    omschrijving: "CV ketel inspectie + kleine reparatie",
  },
];

const MOCK_FACTUREN: DocFactuur[] = [
  {
    id: "fac-1",
    nummer: "FAC-876",
    klantNaam: "Ahmed Mansour",
    klantAvatar: "https://i.pravatar.cc/150?img=33",
    datum: "18 mei 2026",
    vervaldatum: "1 jun 2026",
    totaal: 298.04,
    status: "open",
    omschrijving: "Toilet installatie + CV ketel inspectie",
  },
  {
    id: "fac-2",
    nummer: "FAC-875",
    klantNaam: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    datum: "10 mei 2026",
    vervaldatum: "24 mei 2026",
    totaal: 122.00,
    status: "betaald",
    omschrijving: "Lekkage reparatie keuken",
  },
  {
    id: "fac-3",
    nummer: "FAC-874",
    klantNaam: "Petra Jansen",
    klantAvatar: "https://i.pravatar.cc/150?img=47",
    datum: "28 apr 2026",
    vervaldatum: "12 mei 2026",
    totaal: 99.00,
    status: "verlopen",
    omschrijving: "CV ketel inspectie jaarlijks",
  },
  {
    id: "fac-4",
    nummer: "FAC-873",
    klantNaam: "Sandra Hoek",
    klantAvatar: "https://i.pravatar.cc/150?img=56",
    datum: "20 apr 2026",
    vervaldatum: "4 mei 2026",
    totaal: 195.00,
    status: "betaald",
    omschrijving: "Toilet installatie",
  },
  {
    id: "fac-5",
    nummer: "FAC-872",
    klantNaam: "Rob Smeets",
    klantAvatar: "https://i.pravatar.cc/150?img=52",
    datum: "15 apr 2026",
    vervaldatum: "29 apr 2026",
    totaal: 165.00,
    status: "herinnering",
    omschrijving: "Badkamer kraan + sifon vervangen",
  },
];

// ─── Status config ────────────────────────────────────────────────────────────

const OFFERTE_STATUS: Record<OfferteStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  concept:     { label: "Concept",     color: "var(--muted)", bg: "var(--surface-2)", icon: <FileText size={12} /> },
  verstuurd:   { label: "Verstuurd",   color: "#0ea5e9",      bg: "#e0f2fe",          icon: <Send size={12} /> },
  geaccepteerd:{ label: "Geaccepteerd",color: "#16a34a",      bg: "#dcfce7",          icon: <CheckCircle2 size={12} /> },
  verlopen:    { label: "Verlopen",    color: "#d97706",      bg: "#fef3c7",          icon: <Clock size={12} /> },
  geweigerd:   { label: "Geweigerd",   color: "#dc2626",      bg: "#fee2e2",          icon: <XCircle size={12} /> },
};

const FACTUUR_STATUS: Record<FactuurStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        color: "#d97706",      bg: "#fef3c7",          icon: <Clock size={12} /> },
  herinnering: { label: "Herinnering", color: "#dc2626",      bg: "#fee2e2",          icon: <AlertCircle size={12} /> },
  betaald:     { label: "Betaald",     color: "#16a34a",      bg: "#dcfce7",          icon: <CheckCircle2 size={12} /> },
  verlopen:    { label: "Verlopen",    color: "#6b7280",      bg: "var(--surface-2)", icon: <XCircle size={12} /> },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Offerte kaart ────────────────────────────────────────────────────────────

function OfferteKaart({ o }: { o: DocOfferte }) {
  const cfg = OFFERTE_STATUS[o.status];
  return (
    <Link href={`/offerte/${o.id}`}
      className="touch-scale card p-4 flex gap-3 items-start">
      <img src={o.klantAvatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-sm truncate">{o.klantNaam}</p>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color: "var(--muted)" }}>{o.omschrijving}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)" }}>{o.nummer} · {o.datum}</span>
          <span className="font-black text-sm" style={{ color: "var(--teal)" }}>€{fmt(o.totaal)}</span>
        </div>
        {(o.status === "verstuurd" || o.status === "concept") && (
          <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
            Geldig tot {o.geldigTot}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Factuur kaart ────────────────────────────────────────────────────────────

function FactuurKaart({ f }: { f: DocFactuur }) {
  const cfg = FACTUUR_STATUS[f.status];
  return (
    <Link href={`/factuur/${f.id}`}
      className="touch-scale card p-4 flex gap-3 items-start">
      <img src={f.klantAvatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-sm truncate">{f.klantNaam}</p>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color: "var(--muted)" }}>{f.omschrijving}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)" }}>{f.nummer} · {f.datum}</span>
          <span className="font-black text-sm" style={{ color: f.status === "betaald" ? "#16a34a" : "var(--teal)" }}>
            €{fmt(f.totaal)}
          </span>
        </div>
        {f.status !== "betaald" && (
          <p className="text-[11px] mt-1" style={{ color: f.status === "verlopen" || f.status === "herinnering" ? "#dc2626" : "var(--muted)" }}>
            Vervaldatum: {f.vervaldatum}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function DocumentenContent() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get("tab") === "facturen" ? "facturen" : "offertes";
  const [tab, setTab] = useState<"offertes" | "facturen">(initTab);
  const [showNieuw, setShowNieuw] = useState(false);

  // Stats
  const offVerstuurd  = MOCK_OFFERTES.filter(o => o.status === "verstuurd").length;
  const offAccepteerd = MOCK_OFFERTES.filter(o => o.status === "geaccepteerd").length;
  const facOpen       = MOCK_FACTUREN.filter(f => f.status === "open" || f.status === "herinnering").length;
  const facTotaalOpen = MOCK_FACTUREN.filter(f => f.status === "open" || f.status === "herinnering")
    .reduce((s, f) => s + f.totaal, 0);

  return (
    <div className="flex flex-col min-h-full pb-24 animate-fade-in">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Offertes & Facturen</h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-white font-black text-xl">{MOCK_OFFERTES.length}</p>
            <p className="text-white/70 text-[11px]">Offertes</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-white font-black text-xl">{MOCK_FACTUREN.length}</p>
            <p className="text-white/70 text-[11px]">Facturen</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-white font-black text-lg">€{fmt(facTotaalOpen)}</p>
            <p className="text-white/70 text-[11px]">Openstaand</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="px-5 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          <button onClick={() => setTab("offertes")}
            className="touch-scale flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: tab === "offertes" ? "var(--background)" : "transparent",
              color: tab === "offertes" ? "var(--foreground)" : "var(--muted)",
              boxShadow: tab === "offertes" ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            }}>
            <FileText size={16} />
            Offertes
            {offVerstuurd > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--teal)", color: "white" }}>
                {offVerstuurd}
              </span>
            )}
          </button>
          <button onClick={() => setTab("facturen")}
            className="touch-scale flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: tab === "facturen" ? "var(--background)" : "transparent",
              color: tab === "facturen" ? "var(--foreground)" : "var(--muted)",
              boxShadow: tab === "facturen" ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
            }}>
            <Receipt size={16} />
            Facturen
            {facOpen > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--coral)", color: "white" }}>
                {facOpen}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-5 pt-3 flex flex-col gap-3">

        {tab === "offertes" && (
          <>
            {/* Filter summary */}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(OFFERTE_STATUS) as [OfferteStatus, typeof OFFERTE_STATUS[OfferteStatus]][]).map(([key, cfg]) => {
                const count = MOCK_OFFERTES.filter(o => o.status === key).length;
                if (count === 0) return null;
                return (
                  <span key={key} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {count} {cfg.label}
                  </span>
                );
              })}
            </div>

            {MOCK_OFFERTES.map(o => <OfferteKaart key={o.id} o={o} />)}
          </>
        )}

        {tab === "facturen" && (
          <>
            {/* Openstaand bedrag banner */}
            {facOpen > 0 && (
              <div className="card p-4 flex items-center gap-3"
                style={{ borderColor: "#fbbf24", background: "#fef9c3" }}>
                <AlertCircle size={20} style={{ color: "#d97706", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#92400e" }}>
                    {facOpen} {facOpen === 1 ? "openstaande factuur" : "openstaande facturen"}
                  </p>
                  <p className="text-xs" style={{ color: "#b45309" }}>
                    Totaal openstaand: €{fmt(facTotaalOpen)}
                  </p>
                </div>
              </div>
            )}

            {/* Filter summary */}
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(FACTUUR_STATUS) as [FactuurStatus, typeof FACTUUR_STATUS[FactuurStatus]][]).map(([key, cfg]) => {
                const count = MOCK_FACTUREN.filter(f => f.status === key).length;
                if (count === 0) return null;
                return (
                  <span key={key} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {count} {cfg.label}
                  </span>
                );
              })}
            </div>

            {MOCK_FACTUREN.map(f => <FactuurKaart key={f.id} f={f} />)}
          </>
        )}
      </div>

      {/* ── FAB — Nieuw document ── */}
      <button
        onClick={() => setShowNieuw(true)}
        className="touch-scale fixed z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)",
          bottom: "calc(var(--bottom-nav-height) + 16px)",
          right: "calc(50% - 240px + 20px)",
          boxShadow: "0 4px 20px rgba(15,110,86,0.45)",
        }}>
        <Plus size={24} color="white" />
      </button>

      {/* ── Nieuw document keuze modal ── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full rounded-t-3xl p-5 animate-slide-up overflow-y-auto"
            style={{
              background: "var(--background)",
              maxHeight: "calc(100dvh - var(--bottom-nav-height) - 52px)",
              paddingBottom: "calc(var(--bottom-nav-height) + 16px)",
            }}
            onClick={e => e.stopPropagation()}>

            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-lg">Nieuw document</h2>
              <button onClick={() => setShowNieuw(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-2)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Offerte */}
              <Link href="/offerte/maak" onClick={() => setShowNieuw(false)}
                className="touch-scale flex items-center gap-4 p-4 rounded-2xl border-2"
                style={{ borderColor: "var(--teal)", background: "var(--teal)" + "08" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--teal)" + "15" }}>
                  <FileText size={22} style={{ color: "var(--teal)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-base">Nieuwe offerte</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    Prijsopgave sturen naar klant · geldig 14 dagen
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: "var(--teal)" }} />
              </Link>

              {/* Factuur */}
              <Link href="/factuur/nieuw" onClick={() => setShowNieuw(false)}
                className="touch-scale flex items-center gap-4 p-4 rounded-2xl border-2"
                style={{ borderColor: "#d97706", background: "#fef3c7" + "60" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fef3c7" }}>
                  <Receipt size={22} style={{ color: "#d97706" }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-base">Nieuwe factuur</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    Betalingsverzoek na voltooide opdracht
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: "#d97706" }} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StripeGateDocumenten() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col min-h-full items-center justify-center px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "#635BFF" + "15" }}>
        <span className="text-4xl">💳</span>
      </div>
      <h1 className="font-black text-xl mb-2">Stripe vereist</h1>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
        Je moet eerst je Stripe-account koppelen voordat je offertes en facturen kan aanmaken en versturen.
      </p>
      <Link href="/bedrijf?tab=financieel"
        className="touch-scale flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white mb-4"
        style={{ background: "#635BFF" }}>
        <ExternalLink size={16} /> Stripe koppelen in Bedrijfsprofiel
      </Link>
      <Link href="/dashboard"
        className="touch-scale text-sm font-semibold"
        style={{ color: "var(--muted)" }}>
        ← Terug naar dashboard
      </Link>
    </div>
  );
}

export default function DocumentenPage() {
  const { onboarded } = useStripeConnectStore();
  const { activeView } = useUserStore();

  // Alleen vakmensen zijn geblokkeerd zonder Stripe
  if (activeView === "vakman" && !onboarded) {
    return <StripeGateDocumenten />;
  }

  return (
    <Suspense>
      <DocumentenContent />
    </Suspense>
  );
}
