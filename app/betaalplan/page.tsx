"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Check, X, Calendar, Euro,
  Clock, AlertCircle, CheckCircle2, ChevronRight,
  TrendingDown, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type BetaalplanStatus = "actief" | "afgerond" | "achterstallig" | "gepauzeerd";

interface Termijn {
  id: string;
  nummer: number;
  datum: string;
  bedrag: number;
  betaald: boolean;
}

interface Betaalplan {
  id: string;
  omschrijving: string;
  klant: string;
  klantAvatar: string;
  totaal: number;
  status: BetaalplanStatus;
  termijnen: Termijn[];
  aangemaakt: string;
  rente: number;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<BetaalplanStatus, { label: string; color: string; bg: string }> = {
  actief:       { label: "Actief",       color: "#2B4030", bg: "#2B403015" },
  afgerond:     { label: "Afgerond",     color: "#5C5C56", bg: "#E5DDD0" },
  achterstallig:{ label: "Achterstallig",color: "#DC2626", bg: "#FEF2F2" },
  gepauzeerd:   { label: "Gepauzeerd",   color: "#C97A4D", bg: "#C97A4D15" },
};

function addMonths(dateStr: string, m: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + m);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

const START = "2026-02-01";

const PLANNEN: Betaalplan[] = [
  {
    id: "1", omschrijving: "Badkamerrenovatie €2.400", klant: "Jan Bakker",
    klantAvatar: "https://i.pravatar.cc/150?img=15",
    totaal: 2400, status: "actief", aangemaakt: "1 feb 2026", rente: 0,
    termijnen: Array.from({ length: 4 }, (_, i) => ({
      id: `t${i}`, nummer: i + 1,
      datum: addMonths(START, i),
      bedrag: 600, betaald: i < 2,
    })),
  },
  {
    id: "2", omschrijving: "Dakisolatie €1.800", klant: "Ria Verhoeven",
    klantAvatar: "https://i.pravatar.cc/150?img=23",
    totaal: 1800, status: "actief", aangemaakt: "15 mrt 2026", rente: 0,
    termijnen: Array.from({ length: 3 }, (_, i) => ({
      id: `t${i}`, nummer: i + 1,
      datum: addMonths("2026-03-15", i),
      bedrag: 600, betaald: i < 1,
    })),
  },
  {
    id: "3", omschrijving: "Vloerverwarming €950", klant: "Kees Pietersen",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    totaal: 950, status: "afgerond", aangemaakt: "1 jan 2026", rente: 0,
    termijnen: Array.from({ length: 2 }, (_, i) => ({
      id: `t${i}`, nummer: i + 1,
      datum: addMonths("2026-01-01", i),
      bedrag: 475, betaald: true,
    })),
  },
];

// ── New plan form ──────────────────────────────────────────────────────────
interface NewPlan {
  omschrijving: string;
  klant: string;
  totaal: string;
  termijnen: number;
  rente: number;
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function BetaalplanPage() {
  const router = useRouter();
  const [plannen, setPlannen] = useState<Betaalplan[]>(PLANNEN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPlan, setNewPlan] = useState<NewPlan>({ omschrijving: "", klant: "", totaal: "", termijnen: 3, rente: 0 });

  const stats = useMemo(() => {
    const totaal_actief = plannen.filter(p => p.status === "actief" || p.status === "achterstallig")
      .reduce((s, p) => s + p.totaal, 0);
    const ontvangen = plannen.reduce((s, p) =>
      s + p.termijnen.filter(t => t.betaald).reduce((a, t) => a + t.bedrag, 0), 0);
    const wacht = plannen.reduce((s, p) =>
      s + p.termijnen.filter(t => !t.betaald).reduce((a, t) => a + t.bedrag, 0), 0);
    return { totaal_actief, ontvangen, wacht };
  }, [plannen]);

  const selected = plannen.find(p => p.id === selectedId) ?? null;

  const markBetaald = (planId: string, termijnId: string) => {
    setPlannen(ps => ps.map(p => {
      if (p.id !== planId) return p;
      const newTermijnen = p.termijnen.map(t => t.id === termijnId ? { ...t, betaald: true } : t);
      const allBetaald = newTermijnen.every(t => t.betaald);
      return { ...p, termijnen: newTermijnen, status: allBetaald ? "afgerond" : p.status };
    }));
  };

  const addPlan = () => {
    if (!newPlan.omschrijving || !newPlan.klant || !newPlan.totaal) return;
    const totaal = parseFloat(newPlan.totaal);
    const termijnBedrag = Math.round(totaal / newPlan.termijnen * 100) / 100;
    const plan: Betaalplan = {
      id: Date.now().toString(),
      omschrijving: newPlan.omschrijving,
      klant: newPlan.klant,
      klantAvatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      totaal,
      status: "actief",
      aangemaakt: new Date().toLocaleDateString("nl-NL"),
      rente: newPlan.rente,
      termijnen: Array.from({ length: newPlan.termijnen }, (_, i) => ({
        id: `t${i}`,
        nummer: i + 1,
        datum: addMonths(new Date().toISOString().split("T")[0], i),
        bedrag: termijnBedrag,
        betaald: false,
      })),
    };
    setPlannen(ps => [plan, ...ps]);
    setShowAdd(false);
    setNewPlan({ omschrijving: "", klant: "", totaal: "", termijnen: 3, rente: 0 });
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
              Betaalplan
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
              Gespreide betalingen voor klanten
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#2B4030", border: "none" }}>
            <Plus size={18} color="#F5EFE5" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5">

        {/* Stats grid */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: `€${stats.ontvangen.toLocaleString("nl-NL")}`, l: "Ontvangen",  c: "#2B4030" },
              { v: `€${stats.wacht.toLocaleString("nl-NL")}`,     l: "Openstaand", c: "#C97A4D" },
              { v: plannen.filter(p=>p.status==="actief").length,  l: "Actief",     c: "#5C5C56" },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-base" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: s.c }}>
                  {s.v}
                </span>
                <span className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}
          className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#2B4030" }}>
            <TrendingDown size={18} color="#F5EFE5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
              0% rente betaalplannen
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
              Bied klanten rente-vrije gespreid betalen aan. Jij ontvangt altijd het volledige bedrag.
            </p>
          </div>
        </div>

        {/* Plans list */}
        <div className="flex flex-col gap-2">
          {plannen.map(p => {
            const sCfg = STATUS_CFG[p.status];
            const betaald = p.termijnen.filter(t => t.betaald).length;
            const pct = Math.round((betaald / p.termijnen.length) * 100);
            const volgende = p.termijnen.find(t => !t.betaald);
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className="touch-scale w-full text-left"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                <div className="flex items-start gap-3 mb-3">
                  <img src={p.klantAvatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                      {p.omschrijving}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{p.klant}</p>
                    {volgende && (
                      <p className="text-xs mt-1 truncate" style={{ color: "#C97A4D", fontFamily: "'Inter', sans-serif" }}>
                        €{volgende.bedrag} · {volgende.datum}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>
                      €{p.totaal.toLocaleString("nl-NL")}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: sCfg.bg, color: sCfg.color, fontFamily: "'Inter', sans-serif" }}>
                      {sCfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "#E5DDD0" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#2B4030", borderRadius: 99 }} />
                  </div>
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
                    {betaald}/{p.termijnen.length} termijnen
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Plan detail ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex-1 min-w-0 pr-3 truncate"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                  {selected.omschrijving}
                </h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={16} style={{ color: "#5C5C56" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Summary */}
              <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 20 }}
                className="flex items-center gap-4">
                <img src={selected.klantAvatar} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1">
                  <p className="font-bold text-xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>
                    €{selected.totaal.toLocaleString("nl-NL")}
                  </p>
                  <p className="font-medium text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                    {selected.klant}
                  </p>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color, fontFamily: "'Inter', sans-serif" }}>
                    {STATUS_CFG[selected.status].label}
                  </span>
                </div>
              </div>
              {/* Termijnen */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                  Termijnen
                </p>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  {selected.termijnen.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < selected.termijnen.length - 1 ? "0.5px solid #E5DDD0" : "none" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: t.betaald ? "#2B403015" : "#F5EFE5" }}>
                        {t.betaald
                          ? <Check size={14} style={{ color: "#2B4030" }} />
                          : <span className="text-xs font-bold" style={{ color: "#8A8A83", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                              {t.nummer}
                            </span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: t.betaald ? "#8A8A83" : "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                          Termijn {t.nummer} · {t.datum}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-bold text-sm"
                          style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: t.betaald ? "#8A8A83" : "#2B4030" }}>
                          €{t.bedrag}
                        </p>
                        {!t.betaald && (
                          <button onClick={() => markBetaald(selected.id, t.id)}
                            className="touch-scale text-[10px] font-semibold px-2 py-1 rounded-full"
                            style={{ background: "#2B403015", color: "#2B4030", fontFamily: "'Inter', sans-serif" }}>
                            Betaald
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add plan ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[92dvh] overflow-y-auto"
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                  Betaalplan aanmaken
                </h2>
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={16} style={{ color: "#5C5C56" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {[
                { label: "Omschrijving", key: "omschrijving" as const, placeholder: "bijv. Badkamerrenovatie", type: "text" },
                { label: "Klantnaam",    key: "klant"       as const, placeholder: "bijv. Jan Bakker",       type: "text" },
                { label: "Totaalbedrag (€)", key: "totaal"  as const, placeholder: "0.00",                   type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                    style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                    {f.label}
                  </label>
                  <input type={f.type} inputMode={f.type === "number" ? "decimal" : "text"}
                    value={newPlan[f.key]}
                    onChange={e => setNewPlan(n => ({ ...n, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full outline-none text-sm"
                    style={{
                      background: "#FBF7F0",
                      border: "0.5px solid #E5DDD0",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 14,
                      color: "#1A1D1A",
                      fontFamily: "'Inter', sans-serif",
                    }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block"
                  style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                  Aantal termijnen: <span style={{ color: "#2B4030" }}>{newPlan.termijnen}x</span>
                  {newPlan.totaal && (
                    <span style={{ color: "#C97A4D" }}> (€{(parseFloat(newPlan.totaal) / newPlan.termijnen || 0).toFixed(2)}/mnd)</span>
                  )}
                </label>
                <div className="flex gap-2">
                  {[2,3,4,6,12].map(n => (
                    <button key={n} onClick={() => setNewPlan(p => ({ ...p, termijnen: n }))}
                      className="touch-scale flex-1 py-2.5 rounded-full font-semibold text-sm"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        background: newPlan.termijnen === n ? "#2B4030" : "transparent",
                        color: newPlan.termijnen === n ? "#F5EFE5" : "#5C5C56",
                        border: "0.5px solid #E5DDD0",
                      }}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addPlan}
                className="touch-scale w-full py-4 font-semibold"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none", fontFamily: "'Inter', sans-serif" }}>
                Betaalplan aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
