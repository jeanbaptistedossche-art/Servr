"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Check, X, Calendar, Euro,
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
  actief:       { label: "Actief",       color: "#059669", bg: "#ECFDF5" },
  afgerond:     { label: "Afgerond",     color: "#4F46E5", bg: "#EEF2FF" },
  achterstallig:{ label: "Achterstallig",color: "#DC2626", bg: "#FEF2F2" },
  gepauzeerd:   { label: "Gepauzeerd",   color: "#D97706", bg: "#FFFBEB" },
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
    <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ChevronLeft size={20} style={{ color: "#475569" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Betaalplan</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Gespreide betalingen voor klanten</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.4)" }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: `€${stats.ontvangen.toLocaleString("nl-NL")}`, l: "Ontvangen",   c: "#059669", bg: "#ECFDF5" },
            { v: `€${stats.wacht.toLocaleString("nl-NL")}`,     l: "Openstaand",  c: "#D97706", bg: "#FFFBEB" },
            { v: plannen.filter(p=>p.status==="actief").length,  l: "Actief",      c: "#4F46E5", bg: "#EEF2FF" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
              style={{ background: s.bg }}>
              <span className="font-black text-sm leading-tight" style={{ color: s.c }}>{s.v}</span>
              <span className="text-[9px] font-bold" style={{ color: s.c }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div className="rounded-3xl p-4 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.3)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <TrendingDown size={22} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm">0% rente betaalplannen</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
              Bied klanten rente-vrije gespreid betalen aan. Jij ontvangt altijd het volledige bedrag.
            </p>
          </div>
        </div>

        {/* Plans list */}
        <div className="flex flex-col gap-3">
          {plannen.map(p => {
            const sCfg = STATUS_CFG[p.status];
            const betaald = p.termijnen.filter(t => t.betaald).length;
            const pct = Math.round((betaald / p.termijnen.length) * 100);
            const volgende = p.termijnen.find(t => !t.betaald);
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className="touch-scale w-full rounded-3xl p-4 text-left"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <img src={p.klantAvatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{p.omschrijving}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{p.klant}</p>
                    {volgende && (
                      <p className="text-xs mt-1" style={{ color: "#4F46E5" }}>
                        Volgende: €{volgende.bedrag} op {volgende.datum}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base" style={{ color: "#4F46E5" }}>€{p.totaal.toLocaleString("nl-NL")}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "#E5E7EB" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #4F46E5, #818CF8)", borderRadius: 99 }} />
                  </div>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#4F46E5" }}>{betaald}/{p.termijnen.length} termijnen</span>
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
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg flex-1 min-w-0 pr-3 truncate" style={{ color: "#0f172a" }}>{selected.omschrijving}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Summary */}
              <div className="rounded-3xl p-5 flex items-center gap-4"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <img src={selected.klantAvatar} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1">
                  <p className="font-black text-lg" style={{ color: "#4F46E5" }}>€{selected.totaal.toLocaleString("nl-NL")}</p>
                  <p className="font-medium text-sm" style={{ color: "#0f172a" }}>{selected.klant}</p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
                    style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color }}>
                    {STATUS_CFG[selected.status].label}
                  </span>
                </div>
              </div>
              {/* Termijnen */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Termijnen</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  {selected.termijnen.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < selected.termijnen.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: t.betaald ? "#ECFDF5" : "#F8FAFC" }}>
                        {t.betaald
                          ? <Check size={14} style={{ color: "#059669" }} />
                          : <span className="text-xs font-black" style={{ color: "#94a3b8" }}>{t.nummer}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: t.betaald ? "#9CA3AF" : "#0f172a" }}>
                          Termijn {t.nummer} · {t.datum}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-black text-sm" style={{ color: t.betaald ? "#9CA3AF" : "#4F46E5" }}>
                          €{t.bedrag}
                        </p>
                        {!t.betaald && (
                          <button onClick={() => markBetaald(selected.id, t.id)}
                            className="touch-scale text-[10px] font-black px-2 py-1 rounded-lg"
                            style={{ background: "#ECFDF5", color: "#059669" }}>
                            ✓ Betaald
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
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>Betaalplan aanmaken</h2>
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
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
                  <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>{f.label}</label>
                  <input type={f.type} inputMode={f.type === "number" ? "decimal" : "text"}
                    value={newPlan[f.key]}
                    onChange={e => setNewPlan(n => ({ ...n, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3.5 rounded-2xl font-semibold text-sm outline-none"
                    style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#0f172a" }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>
                  Aantal termijnen: <span style={{ color: "#4F46E5" }}>{newPlan.termijnen}x</span>
                  {newPlan.totaal && <span style={{ color: "#10B981" }}> (€{(parseFloat(newPlan.totaal) / newPlan.termijnen || 0).toFixed(2)}/mnd)</span>}
                </label>
                <div className="flex gap-2">
                  {[2,3,4,6,12].map(n => (
                    <button key={n} onClick={() => setNewPlan(p => ({ ...p, termijnen: n }))}
                      className="touch-scale flex-1 py-2.5 rounded-2xl font-black text-sm"
                      style={{
                        background: newPlan.termijnen === n ? "#4F46E5" : "#fff",
                        color: newPlan.termijnen === n ? "#fff" : "#64748b",
                        border: `2px solid ${newPlan.termijnen === n ? "#4F46E5" : "#E5E7EB"}`,
                      }}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={addPlan}
                className="touch-scale w-full py-4 rounded-2xl font-black text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                Betaalplan aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
