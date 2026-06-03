"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, TrendingUp, Euro, PiggyBank, Shield,
  Info, ChevronRight, Plus, X, Calendar, Clock,
  Target, CheckCircle2, AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type ProductType = "lijfrente" | "banksparen" | "beleggersrekening" | "aov";

interface Product {
  id: string;
  type: ProductType;
  naam: string;
  aanbieder: string;
  maandBedrag: number;
  saldo: number;
  rendement: number;
  actief: boolean;
}

interface JaarUitbetaling {
  jaar: number;
  bedrag: number;
}

// ── Config ─────────────────────────────────────────────────────────────────
const PROD_CFG: Record<ProductType, { label: string; emoji: string; color: string; bg: string; uitleg: string }> = {
  lijfrente:          { label: "Lijfrente",           emoji: "🏦", color: "#4F46E5", bg: "#EEF2FF", uitleg: "Belastingvoordeel via jaarruimte. Uitkering start op pensioenleeftijd." },
  banksparen:         { label: "Banksparen",          emoji: "🐷", color: "#EC4899", bg: "#FDF2F8", uitleg: "Sparen op geblokkeerde rekening. Fiscaal aantrekkelijk als zzp'er." },
  beleggersrekening:  { label: "Beleggingsrekening",  emoji: "📈", color: "#10B981", bg: "#ECFDF5", uitleg: "Vrij beleggen voor extra vermogen opbouw naast je pensioen." },
  aov:                { label: "AOV Verzekering",     emoji: "🛡️", color: "#0EA5E9", bg: "#F0F9FF", uitleg: "Arbeidsongeschiktheidsverzekering. Beschermt je inkomen bij ziekte." },
};

const INIT_PRODUCTEN: Product[] = [
  {
    id: "1", type: "lijfrente", naam: "Lijfrente Basis",
    aanbieder: "Brand New Day", maandBedrag: 200, saldo: 8400, rendement: 4.2, actief: true,
  },
  {
    id: "2", type: "banksparen", naam: "Pensioensparen ZZP",
    aanbieder: "Nationale Nederlanden", maandBedrag: 150, saldo: 5100, rendement: 2.8, actief: true,
  },
  {
    id: "3", type: "aov", naam: "AOV Compact",
    aanbieder: "Interpolis", maandBedrag: 85, saldo: 0, rendement: 0, actief: true,
  },
];

function calcPrognose(saldo: number, maandBedrag: number, rendement: number, jaren: number): number {
  // Future value of savings with monthly contributions
  const r = rendement / 100 / 12;
  const n = jaren * 12;
  if (r === 0) return saldo + maandBedrag * n;
  const fvSaldo = saldo * Math.pow(1 + r, n);
  const fvBijdragen = maandBedrag * ((Math.pow(1 + r, n) - 1) / r);
  return Math.round(fvSaldo + fvBijdragen);
}

function fmtEuro(n: number): string {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${Math.round(n / 1000)}k`;
  return `€${n}`;
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PensioenPage() {
  const router = useRouter();
  const [producten, setProducten] = useState<Product[]>(INIT_PRODUCTEN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leeftijd, setLeeftijd] = useState(38);
  const [pensioenLeeftijd, setPensioenLeeftijd] = useState(68);
  const [activeTab, setActiveTab] = useState<"overzicht" | "prognose" | "belasting">("overzicht");

  const actief = producten.filter(p => p.actief && p.type !== "aov");
  const jaren = pensioenLeeftijd - leeftijd;

  const prognose = useMemo(() => {
    const totaalSaldo = actief.reduce((s, p) => s + p.saldo, 0);
    const totaalMaand = actief.reduce((s, p) => s + p.maandBedrag, 0);
    const gemRendement = actief.length > 0
      ? actief.reduce((s, p) => s + p.rendement, 0) / actief.length : 3;
    const eindwaarde = calcPrognose(totaalSaldo, totaalMaand, gemRendement, jaren);
    const maandPensioen = Math.round(eindwaarde / (20 * 12));
    return { eindwaarde, maandPensioen, totaalMaand, totaalSaldo, jaren };
  }, [producten, jaren]);

  const jaarruimte = useMemo(() => {
    // Simplified jaarruimte calculation
    const inkomen = 4200 * 12; // mock
    const jaarruimte = Math.round(inkomen * 0.3 * 0.131);
    const gebruikt = actief.filter(p => p.type === "lijfrente" || p.type === "banksparen")
      .reduce((s, p) => s + p.maandBedrag * 12, 0);
    const resterend = Math.max(0, jaarruimte - gebruikt);
    return { jaarruimte, gebruikt, resterend };
  }, [producten]);

  const selected = producten.find(p => p.id === selectedId) ?? null;

  const grafiekPunten = useMemo(() => {
    return Array.from({ length: Math.min(jaren, 30) + 1 }, (_, i) => {
      const saldo = actief.reduce((s, p) => s + p.saldo, 0);
      const maand = actief.reduce((s, p) => s + p.maandBedrag, 0);
      const r = actief.length > 0
        ? actief.reduce((s, p) => s + p.rendement, 0) / actief.length : 3;
      return calcPrognose(saldo, maand, r, i);
    });
  }, [producten, jaren]);

  const maxPrognose = Math.max(...grafiekPunten);

  return (
    <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.push('/profile')}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ChevronLeft size={20} style={{ color: "#475569" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Pensioen</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Spaarassistent voor vakmannen</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Hero prognose card */}
        <div className="rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", boxShadow: "0 12px 40px rgba(15,23,42,0.35)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            Verwacht pensioenkapitaal
          </p>
          <p className="font-black text-white mt-1" style={{ fontSize: 38, letterSpacing: "-0.03em" }}>
            {fmtEuro(prognose.eindwaarde)}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            ≈ {fmtEuro(prognose.maandPensioen)}/maand bij pensioen
          </p>

          {/* Slider visualisatie */}
          <div className="mt-4 flex gap-3 items-end" style={{ height: 60 }}>
            {grafiekPunten.filter((_, i) => i % Math.max(1, Math.floor(grafiekPunten.length / 10)) === 0)
              .map((v, i) => (
                <div key={i} className="flex-1 rounded-t-lg"
                  style={{
                    height: `${Math.max(4, (v / maxPrognose) * 60)}px`,
                    background: i === Math.floor(grafiekPunten.length / Math.max(1, Math.floor(grafiekPunten.length / 10))) - 1
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.2)",
                  }} />
              ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { l: "Jaren resterend", v: `${prognose.jaren}jr` },
              { l: "Maandlijks inleg", v: fmtEuro(prognose.totaalMaand) },
              { l: "Huidig saldo",     v: fmtEuro(prognose.totaalSaldo) },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <span className="font-black text-white text-sm">{s.v}</span>
                <span className="text-[9px] mt-0.5 font-medium text-center leading-tight"
                  style={{ color: "rgba(255,255,255,0.5)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leeftijd sliders */}
        <div className="rounded-3xl p-4 flex flex-col gap-4" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <p className="font-black text-sm" style={{ color: "#0f172a" }}>Instellingen</p>
          {[
            { label: "Huidige leeftijd", value: leeftijd, min: 18, max: 65, setter: setLeeftijd },
            { label: "Pensioenleeftijd", value: pensioenLeeftijd, min: 60, max: 75, setter: setPensioenLeeftijd },
          ].map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: "#64748b" }}>{s.label}</span>
                <span className="text-sm font-black" style={{ color: "#4F46E5" }}>{s.value} jaar</span>
              </div>
              <input type="range" min={s.min} max={s.max} value={s.value}
                onChange={e => s.setter(+e.target.value)}
                className="w-full" style={{ accentColor: "#4F46E5" }} />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 rounded-2xl gap-1" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          {([["overzicht", "Producten"], ["prognose", "Analyse"], ["belasting", "Belasting"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
              style={{
                background: activeTab === key ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "transparent",
                color: activeTab === key ? "#fff" : "#94a3b8",
                boxShadow: activeTab === key ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Producten */}
        {activeTab === "overzicht" && (
          <div className="flex flex-col gap-3">
            {producten.map(p => {
              const cfg = PROD_CFG[p.type];
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className="touch-scale w-full rounded-3xl p-4 text-left"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      {cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{p.naam}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{p.aanbieder}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {p.saldo > 0 && (
                        <p className="font-black text-sm" style={{ color: "#4F46E5" }}>{fmtEuro(p.saldo)}</p>
                      )}
                      <p className="text-xs" style={{ color: "#94a3b8" }}>€{p.maandBedrag}/mnd</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <button className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#EEF2FF", color: "#4F46E5", border: "2px dashed #C7D2FE" }}>
              <Plus size={16} /> Product toevoegen
            </button>
          </div>
        )}

        {/* Tab: Analyse */}
        {activeTab === "prognose" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Scenario analyse</p>
              {[
                { l: "Conservatief (2%)",  v: calcPrognose(prognose.totaalSaldo, prognose.totaalMaand, 2, jaren),  c: "#F59E0B" },
                { l: "Neutraal (4%)",      v: prognose.eindwaarde,                                                  c: "#4F46E5" },
                { l: "Optimistisch (7%)",  v: calcPrognose(prognose.totaalSaldo, prognose.totaalMaand, 7, jaren),  c: "#10B981" },
              ].map(s => (
                <div key={s.l} className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <p className="text-sm font-medium" style={{ color: "#64748b" }}>{s.l}</p>
                  <p className="font-black text-base" style={{ color: s.c }}>{fmtEuro(s.v)}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} style={{ color: "#059669" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm" style={{ color: "#065F46" }}>Goed op schema</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#064E3B" }}>
                    Bij jouw huidige inleg bereik je naar verwachting {fmtEuro(prognose.maandPensioen)}/maand pensioen. Dat is een comfortabele basis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Belasting */}
        {activeTab === "belasting" && (
          <div className="flex flex-col gap-3">
            <div className="rounded-3xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Jaarruimte benutting</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Benut</span>
                  <span className="font-black" style={{ color: "#4F46E5" }}>€{jaarruimte.gebruikt}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 8, background: "#E5E7EB" }}>
                  <div style={{ width: `${Math.min(100, (jaarruimte.gebruikt / jaarruimte.jaarruimte) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #4F46E5, #818CF8)", borderRadius: 99 }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: "#94a3b8" }}>Max. jaarruimte: €{jaarruimte.jaarruimte}</span>
                  <span className="font-semibold" style={{ color: "#10B981" }}>€{jaarruimte.resterend} resterend</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
              <div className="flex items-start gap-2">
                <Info size={16} style={{ color: "#D97706" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm" style={{ color: "#92400E" }}>Belastingvoordeel</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#78350F" }}>
                    Lijfrente en banksparen premies zijn fiscaal aftrekbaar binnen jouw jaarruimte.
                    Dat bespaart je tot 49,5% belasting op je inleg.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Product detail sheet ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{selected.naam}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              <div className="rounded-3xl p-5 text-center"
                style={{ background: PROD_CFG[selected.type].bg }}>
                <div className="text-5xl mb-3">{PROD_CFG[selected.type].emoji}</div>
                <p className="font-black text-xl" style={{ color: "#0f172a" }}>{PROD_CFG[selected.type].label}</p>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#64748b" }}>{PROD_CFG[selected.type].uitleg}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Aanbieder",    v: selected.aanbieder },
                  { l: "Maandpremie", v: `€${selected.maandBedrag}` },
                  { l: "Huidig saldo", v: selected.saldo > 0 ? fmtEuro(selected.saldo) : "N.v.t." },
                  { l: "Rendement",    v: selected.rendement > 0 ? `${selected.rendement}%` : "N.v.t." },
                ].map(r => (
                  <div key={r.l} className="rounded-2xl p-3"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{r.l}</p>
                    <p className="font-black text-base mt-1" style={{ color: "#4F46E5" }}>{r.v}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedId(null)}
                className="touch-scale w-full py-4 rounded-2xl font-black"
                style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                Naar aanbieder website
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
