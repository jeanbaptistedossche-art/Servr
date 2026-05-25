"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Check, Clock, Bell, BellOff,
  Calendar, ChevronRight, Wrench, AlertTriangle,
  RefreshCw, CheckCircle, Circle, Flame, Droplets,
  Zap, Home, Leaf, MoreHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Frequentie = "wekelijks" | "maandelijks" | "kwartaal" | "halfjaarlijks" | "jaarlijks" | "twee_jaarlijks" | "vijf_jaarlijks";
type Prioriteit = "laag" | "normaal" | "hoog" | "kritiek";
type Categorie = "verwarming" | "sanitair" | "elektra" | "tuin" | "ventilatie" | "veiligheid" | "overig";
type Status = "gepland" | "te_laat" | "gedaan" | "overgeslagen";

type TaakTemplate = {
  id: string;
  titel: string;
  beschrijving: string;
  categorie: Categorie;
  frequentie: Frequentie;
  prioriteit: Prioriteit;
  tip?: string;
  herinneringDagen: number;
};

type Taak = TaakTemplate & {
  volgende: string;   // ISO date
  laatsGedaan?: string;
  notificaties: boolean;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const FREQ_LABELS: Record<Frequentie, string> = {
  wekelijks:      "Wekelijks",
  maandelijks:    "Maandelijks",
  kwartaal:       "Per kwartaal",
  halfjaarlijks:  "Halfjaarlijks",
  jaarlijks:      "Jaarlijks",
  twee_jaarlijks: "Elke 2 jaar",
  vijf_jaarlijks: "Elke 5 jaar",
};

const FREQ_DAGEN: Record<Frequentie, number> = {
  wekelijks: 7, maandelijks: 30, kwartaal: 91,
  halfjaarlijks: 182, jaarlijks: 365, twee_jaarlijks: 730, vijf_jaarlijks: 1825,
};

const PRIO_CFG: Record<Prioriteit, { bg: string; color: string; label: string }> = {
  laag:    { bg: "#F1F5F9", color: "#64748b", label: "Laag" },
  normaal: { bg: "#EEF2FF", color: "#4F46E5", label: "Normaal" },
  hoog:    { bg: "#FFFBEB", color: "#D97706", label: "Hoog" },
  kritiek: { bg: "#FEF2F2", color: "#EF4444", label: "Kritiek" },
};

const CAT_CFG: Record<Categorie, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  verwarming:  { icon: <Flame size={15}/>,        color: "#EF4444", bg: "#FEF2F2", label: "Verwarming" },
  sanitair:    { icon: <Droplets size={15}/>,     color: "#0EA5E9", bg: "#F0F9FF", label: "Sanitair" },
  elektra:     { icon: <Zap size={15}/>,          color: "#F59E0B", bg: "#FFFBEB", label: "Elektra" },
  tuin:        { icon: <Leaf size={15}/>,         color: "#10B981", bg: "#ECFDF5", label: "Tuin" },
  ventilatie:  { icon: <RefreshCw size={15}/>,    color: "#8B5CF6", bg: "#F5F3FF", label: "Ventilatie" },
  veiligheid:  { icon: <AlertTriangle size={15}/>,color: "#F97316", bg: "#FFF7ED", label: "Veiligheid" },
  overig:      { icon: <Wrench size={15}/>,       color: "#64748b", bg: "#F1F5F9", label: "Overig" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date();
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10);
}

const INIT_TAKEN: Taak[] = [
  {
    id: "t1", titel: "CV ketel service", beschrijving: "Jaarlijkse inspectie en reiniging van de CV ketel door erkend monteur.",
    categorie: "verwarming", frequentie: "jaarlijks", prioriteit: "hoog",
    tip: "Plan dit in het najaar, voor het stookseizoen begint.", herinneringDagen: 14,
    volgende: addDays(TODAY, -5), notificaties: true,
  },
  {
    id: "t2", titel: "Ventilatiefilters vervangen", beschrijving: "Filters van het WTW/ventilatiesysteem reinigen of vervangen.",
    categorie: "ventilatie", frequentie: "halfjaarlijks", prioriteit: "normaal",
    herinneringDagen: 7, volgende: addDays(TODAY, 12), notificaties: true,
  },
  {
    id: "t3", titel: "Rookmelders testen", beschrijving: "Test alle rookmelders en koolmonoxidemelders. Vervang batterijen indien nodig.",
    categorie: "veiligheid", frequentie: "jaarlijks", prioriteit: "kritiek",
    tip: "Zorg dat elke verdieping minimaal 1 rookmelder heeft.", herinneringDagen: 7,
    volgende: addDays(TODAY, 45), notificaties: true,
  },
  {
    id: "t4", titel: "Dakgoot reinigen", beschrijving: "Bladeren en vuil verwijderen uit dakgoten en regenafvoeren.",
    categorie: "overig", frequentie: "halfjaarlijks", prioriteit: "normaal",
    herinneringDagen: 7, volgende: addDays(TODAY, 60), notificaties: false,
  },
  {
    id: "t5", titel: "Radiatoren ontluchten", beschrijving: "Lucht ontluchten uit radiatoren voor een efficiënte werking.",
    categorie: "verwarming", frequentie: "jaarlijks", prioriteit: "laag",
    tip: "Doe dit aan het begin van het stookseizoen.", herinneringDagen: 7,
    volgende: addDays(TODAY, 90), notificaties: true,
  },
  {
    id: "t6", titel: "Tuin winterklaar maken", beschrijving: "Planten snoeien, tuinmeubelen opbergen, waterleiding afsluiten.",
    categorie: "tuin", frequentie: "jaarlijks", prioriteit: "laag",
    herinneringDagen: 14, volgende: addDays(TODAY, 120), notificaties: false,
  },
  {
    id: "t7", titel: "Watermeter stand opnemen", beschrijving: "Meterstand water registreren voor het jaarverbruik.",
    categorie: "sanitair", frequentie: "jaarlijks", prioriteit: "laag",
    herinneringDagen: 3, volgende: addDays(TODAY, 180), notificaties: true,
  },
  {
    id: "t8", titel: "Elektriciteitsmeter stand", beschrijving: "Meterstand stroom en teruglevering registreren.",
    categorie: "elektra", frequentie: "jaarlijks", prioriteit: "laag",
    herinneringDagen: 3, volgende: addDays(TODAY, 180), notificaties: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
}
function getStatus(taak: Taak): Status {
  const days = daysUntil(taak.volgende);
  if (days < 0) return "te_laat";
  return "gepland";
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type View = "lijst" | "agenda";

export default function OnderhoudPlannerPage() {
  const router = useRouter();
  const [taken, setTaken] = useState<Taak[]>(INIT_TAKEN);
  const [view, setView] = useState<View>("lijst");
  const [filter, setFilter] = useState<"alles" | "binnenkort" | "te_laat">("alles");
  const [showDetail, setShowDetail] = useState<Taak | null>(null);
  const [doneAnim, setDoneAnim] = useState<string | null>(null);

  const markDone = (id: string) => {
    setDoneAnim(id);
    setTimeout(() => {
      setTaken(prev => prev.map(t => {
        if (t.id !== id) return t;
        const days = FREQ_DAGEN[t.frequentie];
        return { ...t, laatsGedaan: new Date().toISOString().slice(0, 10), volgende: addDays(new Date(), days) };
      }));
      setDoneAnim(null);
      setShowDetail(null);
    }, 600);
  };

  const toggleNotif = (id: string) => {
    setTaken(prev => prev.map(t => t.id === id ? { ...t, notificaties: !t.notificaties } : t));
  };

  const sorted = useMemo(() => [...taken].sort((a, b) =>
    new Date(a.volgende).getTime() - new Date(b.volgende).getTime()
  ), [taken]);

  const filtered = useMemo(() => {
    if (filter === "te_laat") return sorted.filter(t => daysUntil(t.volgende) < 0);
    if (filter === "binnenkort") return sorted.filter(t => daysUntil(t.volgende) >= 0 && daysUntil(t.volgende) <= 30);
    return sorted;
  }, [sorted, filter]);

  const telaat = taken.filter(t => daysUntil(t.volgende) < 0).length;
  const binnenkort = taken.filter(t => daysUntil(t.volgende) >= 0 && daysUntil(t.volgende) <= 30).length;

  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Onderhoud Planner</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Herinneringen & schema</p>
          </div>
          <button className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: "#4F46E5" }}>
            <Plus size={20} />
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {([
            { key: "alles" as const,      label: `Alles (${taken.length})`,           urgent: false },
            { key: "te_laat" as const,    label: `⚠️ Te laat (${telaat})`,           urgent: telaat > 0 },
            { key: "binnenkort" as const, label: `Binnenkort (${binnenkort})`,        urgent: false },
          ]).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
              style={{
                background: filter === f.key ? (f.urgent ? "#EF4444" : "#4F46E5") : "#fff",
                color: filter === f.key ? "#fff" : f.urgent ? "#EF4444" : "#64748b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: telaat > 0 ? "#FEF2F2" : "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <AlertTriangle size={18} style={{ color: telaat > 0 ? "#EF4444" : "#94a3b8" }} />
            <p className="font-black text-xl" style={{ color: telaat > 0 ? "#EF4444" : "#0f172a" }}>{telaat}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>achterstallig</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Clock size={18} style={{ color: "#F59E0B" }} />
            <p className="font-black text-xl" style={{ color: "#0f172a" }}>{binnenkort}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>binnenkort</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <CheckCircle size={18} style={{ color: "#10B981" }} />
            <p className="font-black text-xl" style={{ color: "#0f172a" }}>{taken.filter(t => t.laatsGedaan).length}</p>
            <p className="text-xs" style={{ color: "#94a3b8" }}>gedaan dit jaar</p>
          </div>
        </div>

        {/* Takenlijst */}
        <div className="flex flex-col gap-3">
          {filtered.map(taak => {
            const days = daysUntil(taak.volgende);
            const cat = CAT_CFG[taak.categorie];
            const prio = PRIO_CFG[taak.prioriteit];
            const isLate = days < 0;
            const isSoon = days >= 0 && days <= 14;
            const isDone = doneAnim === taak.id;

            return (
              <div key={taak.id}
                onClick={() => setShowDetail(taak)}
                className="touch-scale rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  background: isDone ? "#ECFDF5" : "#fff",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                  border: isLate ? "1px solid #FCA5A5" : isSoon ? "1px solid #FCD34D" : "1px solid transparent",
                  transform: isDone ? "scale(0.98)" : undefined,
                }}>
                <div className="flex items-center gap-3">
                  {/* Category icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cat.bg, color: cat.color }}>
                    {cat.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate" style={{ color: isDone ? "#10B981" : "#0f172a" }}>
                        {isDone ? "✓ Gedaan!" : taak.titel}
                      </p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: prio.bg, color: prio.color }}>
                        {prio.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs font-semibold"
                        style={{ color: isLate ? "#EF4444" : isSoon ? "#D97706" : "#64748b" }}>
                        {isLate ? `⚠️ ${Math.abs(days)}d te laat` : days === 0 ? "⚡ Vandaag!" : `${days}d — ${fmtDate(taak.volgende)}`}
                      </p>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>·</span>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{FREQ_LABELS[taak.frequentie]}</p>
                    </div>
                  </div>

                  {/* Bell toggle */}
                  <button onClick={e => { e.stopPropagation(); toggleNotif(taak.id); }}
                    className="touch-scale w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: taak.notificaties ? "#EEF2FF" : "#F1F5F9" }}>
                    {taak.notificaties
                      ? <Bell size={14} style={{ color: "#4F46E5" }} />
                      : <BellOff size={14} style={{ color: "#94a3b8" }} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-bold" style={{ color: "#0f172a" }}>Alles is up-to-date!</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Geen achterstallig onderhoud gevonden.</p>
          </div>
        )}
      </div>

      {/* ── Detail sheet ─────────────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "88dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#E2E8F0" }} />

              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: CAT_CFG[showDetail.categorie].bg, color: CAT_CFG[showDetail.categorie].color }}>
                  <div style={{ transform: "scale(1.5)" }}>{CAT_CFG[showDetail.categorie].icon}</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showDetail.titel}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {CAT_CFG[showDetail.categorie].label} · {FREQ_LABELS[showDetail.frequentie]}
                  </p>
                </div>
              </div>

              {/* Beschrijving */}
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>
                {showDetail.beschrijving}
              </p>

              {/* Tip */}
              {showDetail.tip && (
                <div className="rounded-2xl p-3 mb-4" style={{ background: "#FFFBEB" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#D97706" }}>💡 Tip</p>
                  <p className="text-sm" style={{ color: "#374151" }}>{showDetail.tip}</p>
                </div>
              )}

              {/* Info rijen */}
              {[
                { label: "Gepland voor", value: fmtDate(showDetail.volgende) },
                { label: "Herinnering", value: `${showDetail.herinneringDagen} dagen van tevoren` },
                { label: "Prioriteit", value: PRIO_CFG[showDetail.prioriteit].label },
                ...(showDetail.laatsGedaan ? [{ label: "Laatste keer gedaan", value: fmtDate(showDetail.laatsGedaan) }] : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{r.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{r.value}</p>
                </div>
              ))}

              {/* Acties */}
              <div className="flex flex-col gap-3 mt-5">
                <button onClick={() => markDone(showDetail.id)}
                  className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                  <Check size={20} /> Gedaan! Volgende inplannen
                </button>
                <button className="touch-scale w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <Calendar size={18} /> Vakman inplannen via Servr
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
