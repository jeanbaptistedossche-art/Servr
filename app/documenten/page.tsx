"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Plus, FileText, Receipt, ChevronRight,
  Clock, CheckCircle2, XCircle, AlertCircle, Send, X, ExternalLink,
} from "lucide-react";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";
import { useUserStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { supabase, supabaseReady } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Supabase offerte row type ────────────────────────────────────────────────

type SupabaseOfferte = {
  id: string;
  prijs: number;
  omschrijving: string | null;
  status: string | null;
  created_at: string;
  opdracht: {
    titel: string;
    klant: { name: string } | null;
  } | null;
};

// ─── Map Supabase status → DocOfferte status ──────────────────────────────────

function mapStatus(raw: string | null): OfferteStatus {
  switch (raw) {
    case "geaccepteerd": return "geaccepteerd";
    case "geweigerd":    return "geweigerd";
    case "verlopen":     return "verlopen";
    case "concept":      return "concept";
    default:             return "verstuurd";
  }
}

function mapToDocOfferte(row: SupabaseOfferte, index: number): DocOfferte {
  const date = new Date(row.created_at);
  const geldig = new Date(date);
  geldig.setDate(geldig.getDate() + 14);
  return {
    id:          row.id,
    nummer:      `OFF-${String(index + 1).padStart(4, "0")}`,
    klantNaam:   row.opdracht?.klant?.name ?? "Onbekende klant",
    klantAvatar: `https://i.pravatar.cc/150?u=${row.id}`,
    datum:       date.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }),
    geldigTot:   geldig.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }),
    totaal:      row.prijs ?? 0,
    status:      mapStatus(row.status),
    omschrijving: row.opdracht?.titel ?? row.omschrijving ?? "",
  };
}

// ─── Mock facturen (facturen not implemented yet) ─────────────────────────────

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
  concept:      { label: "Concept",      color: "#8A8A83", bg: "#F0EDE8",  icon: <FileText size={12} /> },
  verstuurd:    { label: "Verstuurd",    color: "#2B4030", bg: "#E8EDE9",  icon: <Send size={12} /> },
  geaccepteerd: { label: "Geaccepteerd", color: "#2B4030", bg: "#E8EDE9",  icon: <CheckCircle2 size={12} /> },
  verlopen:     { label: "Verlopen",     color: "#C97A4D", bg: "#F7EDE4",  icon: <Clock size={12} /> },
  geweigerd:    { label: "Geweigerd",    color: "#dc2626", bg: "#fee2e2",  icon: <XCircle size={12} /> },
};

const FACTUUR_STATUS: Record<FactuurStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        color: "#C97A4D", bg: "#F7EDE4",  icon: <Clock size={12} /> },
  herinnering: { label: "Herinnering", color: "#dc2626", bg: "#fee2e2",  icon: <AlertCircle size={12} /> },
  betaald:     { label: "Betaald",     color: "#2B4030", bg: "#E8EDE9",  icon: <CheckCircle2 size={12} /> },
  verlopen:    { label: "Verlopen",    color: "#8A8A83", bg: "#F0EDE8",  icon: <XCircle size={12} /> },
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
      className="touch-scale p-4 flex gap-3 items-start"
      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
      <img src={o.klantAvatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-sm truncate" style={{ color: "#1A1D1A" }}>{o.klantNaam}</p>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color: "#8A8A83" }}>{o.omschrijving}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#8A8A83" }}>{o.nummer} · {o.datum}</span>
          <span className="font-black text-sm" style={{ color: "#2B4030" }}>€{fmt(o.totaal)}</span>
        </div>
        {(o.status === "verstuurd" || o.status === "concept") && (
          <p className="text-[11px] mt-1" style={{ color: "#8A8A83" }}>
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
      className="touch-scale p-4 flex gap-3 items-start"
      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
      <img src={f.klantAvatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-sm truncate" style={{ color: "#1A1D1A" }}>{f.klantNaam}</p>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <p className="text-xs truncate mb-1.5" style={{ color: "#8A8A83" }}>{f.omschrijving}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#8A8A83" }}>{f.nummer} · {f.datum}</span>
          <span className="font-black text-sm" style={{ color: f.status === "betaald" ? "#2B4030" : "#C97A4D" }}>
            €{fmt(f.totaal)}
          </span>
        </div>
        {f.status !== "betaald" && (
          <p className="text-[11px] mt-1"
            style={{ color: f.status === "verlopen" || f.status === "herinnering" ? "#dc2626" : "#8A8A83" }}>
            Vervaldatum: {f.vervaldatum}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function DocumentenContent() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get("tab") === "facturen" ? "facturen" : "offertes";
  const [tab, setTab] = useState<"offertes" | "facturen">(initTab);
  const [showNieuw, setShowNieuw] = useState(false);
  const { activeView, userId: storeUserId } = useUserStore();
  const router = useRouter();
  const terugHref = "/profile";

  // Real offertes state
  const [offertes, setOffertes] = useState<DocOfferte[]>([]);
  const [loadingOffertes, setLoadingOffertes] = useState(true);
  const [userId, setUserId] = useState(storeUserId);

  // userId fallback
  useEffect(() => {
    if (storeUserId) { setUserId(storeUserId); return; }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, [storeUserId]);

  // Load offertes from Supabase
  useEffect(() => {
    if (!userId) return;
    setLoadingOffertes(true);
    (supabase.from("offertes") as any)
      .select("*, opdracht:opdrachten(titel, klant_id, klant:profiles!opdrachten_klant_id_fkey(name))")
      .eq("vakman_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: SupabaseOfferte[] | null }) => {
        setOffertes((data ?? []).map((row, i) => mapToDocOfferte(row, i)));
        setLoadingOffertes(false);
      });
  }, [userId]);

  const offVerstuurd   = offertes.filter(o => o.status === "verstuurd").length;
  const facOpen        = MOCK_FACTUREN.filter(f => f.status === "open" || f.status === "herinnering").length;
  const facTotaalOpen  = MOCK_FACTUREN.filter(f => f.status === "open" || f.status === "herinnering")
    .reduce((s, f) => s + f.totaal, 0);

  return (
    <div className="flex flex-col min-h-full pb-24 animate-fade-in" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push(terugHref)}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", cursor: "pointer" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <h1 className="text-xl font-black flex-1" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Offertes &amp; Facturen
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: loadingOffertes ? "…" : offertes.length, label: "Offertes" },
            { value: MOCK_FACTUREN.length,                     label: "Facturen" },
            { value: `€${fmt(facTotaalOpen)}`,                 label: "Openstaand" },
          ].map((s, i) => (
            <div key={i} className="p-3 text-center"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <p className="font-black text-lg"
                style={{ color: i === 2 ? "#C97A4D" : "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {s.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#8A8A83" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          <button onClick={() => setTab("offertes")}
            className="touch-scale flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: tab === "offertes" ? "#2B4030" : "transparent",
              color: tab === "offertes" ? "#F5EFE5" : "#8A8A83",
            }}>
            <FileText size={15} />
            Offertes
            {offVerstuurd > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: tab === "offertes" ? "#F5EFE5" : "#E8EDE9", color: "#2B4030" }}>
                {offVerstuurd}
              </span>
            )}
          </button>
          <button onClick={() => setTab("facturen")}
            className="touch-scale flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: tab === "facturen" ? "#2B4030" : "transparent",
              color: tab === "facturen" ? "#F5EFE5" : "#8A8A83",
            }}>
            <Receipt size={15} />
            Facturen
            {facOpen > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: tab === "facturen" ? "#F5EFE5" : "#F7EDE4", color: "#C97A4D" }}>
                {facOpen}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-28 pt-3 flex flex-col gap-3">

        {tab === "offertes" && (
          <>
            {loadingOffertes ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "#2B4030", borderTopColor: "transparent" }} />
                <p className="text-sm" style={{ color: "#8A8A83" }}>Offertes laden…</p>
              </div>
            ) : (
              <>
                {offertes.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(OFFERTE_STATUS) as [OfferteStatus, typeof OFFERTE_STATUS[OfferteStatus]][]).map(([key, cfg]) => {
                      const count = offertes.filter(o => o.status === key).length;
                      if (count === 0) return null;
                      return (
                        <span key={key} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {count} {cfg.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {offertes.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3 text-center">
                    <span className="text-5xl">📋</span>
                    <p className="font-semibold text-base" style={{ color: "#1A1D1A" }}>Nog geen offertes verstuurd</p>
                    <p className="text-sm" style={{ color: "#8A8A83" }}>
                      Maak je eerste offerte aan via de + knop hieronder.
                    </p>
                  </div>
                ) : (
                  offertes.map(o => <OfferteKaart key={o.id} o={o} />)
                )}
              </>
            )}
          </>
        )}

        {tab === "facturen" && (
          <>
            {facOpen > 0 && (
              <div className="p-4 flex items-center gap-3"
                style={{ background: "#F7EDE4", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <AlertCircle size={19} style={{ color: "#C97A4D", flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>
                    {facOpen} {facOpen === 1 ? "openstaande factuur" : "openstaande facturen"}
                  </p>
                  <p className="text-xs" style={{ color: "#8A8A83" }}>
                    Totaal openstaand: €{fmt(facTotaalOpen)}
                  </p>
                </div>
              </div>
            )}

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

      {/* FAB */}
      <button
        onClick={() => setShowNieuw(true)}
        className="touch-scale fixed z-40 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "#2B4030",
          bottom: "calc(var(--bottom-nav-height, 80px) + 16px)",
          right: "calc(50% - 240px + 20px)",
          boxShadow: "0 4px 20px rgba(43,64,48,0.35)",
          border: "none",
        }}>
        <Plus size={24} color="#F5EFE5" />
      </button>

      {/* Nieuw document modal */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full rounded-t-3xl p-5 animate-slide-up overflow-y-auto"
            style={{
              background: "#FBF7F0",
              maxHeight: "calc(100dvh - var(--bottom-nav-height, 80px) - 52px)",
              paddingBottom: "calc(var(--bottom-nav-height, 80px) + 16px)",
            }}
            onClick={e => e.stopPropagation()}>

            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#E5DDD0" }} />

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                Nieuw document
              </h2>
              <button onClick={() => setShowNieuw(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                <X size={15} style={{ color: "#5C5C56" }} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/offerte/maak" onClick={() => setShowNieuw(false)}
                className="touch-scale flex items-center gap-4 p-4"
                style={{ background: "#E8EDE9", border: "0.5px solid #2B4030", borderRadius: 14 }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#2B4030" }}>
                  <FileText size={21} style={{ color: "#F5EFE5" }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-base" style={{ color: "#1A1D1A" }}>Nieuwe offerte</p>
                  <p className="text-sm mt-0.5" style={{ color: "#8A8A83" }}>
                    Prijsopgave sturen naar klant · geldig 14 dagen
                  </p>
                </div>
                <ChevronRight size={17} style={{ color: "#2B4030" }} />
              </Link>

              <Link href="/factuur/nieuw" onClick={() => setShowNieuw(false)}
                className="touch-scale flex items-center gap-4 p-4"
                style={{ background: "#F7EDE4", border: "0.5px solid #C97A4D", borderRadius: 14 }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#C97A4D" }}>
                  <Receipt size={21} style={{ color: "#F5EFE5" }} />
                </div>
                <div className="flex-1">
                  <p className="font-black text-base" style={{ color: "#1A1D1A" }}>Nieuwe factuur</p>
                  <p className="text-sm mt-0.5" style={{ color: "#8A8A83" }}>
                    Betalingsverzoek na voltooide opdracht
                  </p>
                </div>
                <ChevronRight size={17} style={{ color: "#C97A4D" }} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StripeGateDocumenten() {
  return (
    <div className="flex flex-col min-h-full items-center justify-center px-6 text-center animate-fade-in"
      style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: "#E8EDE9", border: "0.5px solid #E5DDD0" }}>
        <span className="text-4xl">💳</span>
      </div>
      <h1 className="font-black text-xl mb-2" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Stripe vereist
      </h1>
      <p className="text-sm mb-6 leading-relaxed" style={{ color: "#8A8A83" }}>
        Je moet eerst je Stripe-account koppelen voordat je offertes en facturen kan aanmaken en versturen.
      </p>
      <Link href="/bedrijf?tab=financieel"
        className="touch-scale flex items-center gap-2 px-6 py-3.5 font-bold mb-4"
        style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
        <ExternalLink size={15} /> Stripe koppelen in Bedrijfsprofiel
      </Link>
      <Link href="/profile"
        className="touch-scale text-sm font-semibold"
        style={{ color: "#8A8A83" }}>
        ← Terug naar dashboard
      </Link>
    </div>
  );
}

export default function DocumentenPage() {
  const { onboarded } = useStripeConnectStore();
  const { activeView } = useUserStore();

  if (activeView === "vakman" && !onboarded) {
    return <StripeGateDocumenten />;
  }

  return (
    <Suspense>
      <DocumentenContent />
    </Suspense>
  );
}
