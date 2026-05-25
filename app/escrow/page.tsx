"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Shield, Lock, CheckCircle2, Clock,
  AlertCircle, X, ChevronRight, Euro, ArrowRight,
  Unlock, FileText, User, Wrench, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type EscrowStatus =
  | "wacht_betaling"
  | "in_bewaring"
  | "klus_bezig"
  | "oplevering"
  | "vrijgegeven"
  | "geschil";

interface EscrowDeal {
  id: string;
  titel: string;
  klant: string;
  vakman: string;
  bedrag: number;
  status: EscrowStatus;
  datum: string;
  deadline: string;
  mijlpalen: Mijlpaal[];
  klantAvatar: string;
  vakmanAvatar: string;
}

interface Mijlpaal {
  id: string;
  label: string;
  bedrag: number;
  afgerond: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<EscrowStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  wacht_betaling: { label: "Wacht op betaling",  color: "#D97706", bg: "#FFFBEB", icon: Clock },
  in_bewaring:    { label: "In bewaring",         color: "#4F46E5", bg: "#EEF2FF", icon: Lock },
  klus_bezig:     { label: "Klus bezig",          color: "#0EA5E9", bg: "#F0F9FF", icon: Wrench },
  oplevering:     { label: "Oplevering",          color: "#8B5CF6", bg: "#F5F3FF", icon: CheckCircle2 },
  vrijgegeven:    { label: "Vrijgegeven",         color: "#059669", bg: "#ECFDF5", icon: Unlock },
  geschil:        { label: "Geschil",             color: "#DC2626", bg: "#FEF2F2", icon: AlertCircle },
};

const FLOW_STEPS = [
  { label: "Klant betaalt",    desc: "Bedrag wordt veilig gestort bij Servr Escrow" },
  { label: "In bewaring",      desc: "Geld is geblokkeerd, vakman start de klus" },
  { label: "Klus voltooid",    desc: "Vakman meldt op dat het werk af is" },
  { label: "Klant keurt goed", desc: "Klant beoordeelt het werk en keurt goed" },
  { label: "Uitbetaling",      desc: "Geld wordt direct vrijgegeven aan vakman" },
];

const DEALS: EscrowDeal[] = [
  {
    id: "1", titel: "Badkamerrenovatie", klant: "Jan de Vries", vakman: "Marco van den Berg",
    bedrag: 2400, status: "klus_bezig", datum: "18 mei 2026", deadline: "1 jun 2026",
    klantAvatar: "https://i.pravatar.cc/150?img=15",
    vakmanAvatar: "https://i.pravatar.cc/150?img=11",
    mijlpalen: [
      { id: "m1", label: "Sloopwerk",         bedrag: 400,  afgerond: true },
      { id: "m2", label: "Installatie",        bedrag: 1200, afgerond: true },
      { id: "m3", label: "Afwerking & tegel",  bedrag: 600,  afgerond: false },
      { id: "m4", label: "Eindoplevering",     bedrag: 200,  afgerond: false },
    ],
  },
  {
    id: "2", titel: "Elektra vernieuwing", klant: "Sandra Koopman", vakman: "Erik van Dijk",
    bedrag: 850, status: "oplevering", datum: "10 mei 2026", deadline: "25 mei 2026",
    klantAvatar: "https://i.pravatar.cc/150?img=23",
    vakmanAvatar: "https://i.pravatar.cc/150?img=57",
    mijlpalen: [
      { id: "m1", label: "Meterkast",    bedrag: 350, afgerond: true },
      { id: "m2", label: "Bedrading",    bedrag: 350, afgerond: true },
      { id: "m3", label: "Eindkeuring",  bedrag: 150, afgerond: false },
    ],
  },
  {
    id: "3", titel: "Dakgoot vervangen", klant: "Tom Bakker", vakman: "Daan Willems",
    bedrag: 650, status: "vrijgegeven", datum: "1 mei 2026", deadline: "15 mei 2026",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    vakmanAvatar: "https://i.pravatar.cc/150?img=12",
    mijlpalen: [
      { id: "m1", label: "Verwijderen",   bedrag: 150, afgerond: true },
      { id: "m2", label: "Installatie",   bedrag: 400, afgerond: true },
      { id: "m3", label: "Afronding",     bedrag: 100, afgerond: true },
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function EscrowPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<EscrowDeal[]>(DEALS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [filterStatus, setFilterStatus] = useState<EscrowStatus | "alles">("alles");

  const stats = useMemo(() => ({
    bewaring: deals.filter(d => ["in_bewaring","klus_bezig","oplevering"].includes(d.status)).reduce((s, d) => s + d.bedrag, 0),
    actief:   deals.filter(d => d.status !== "vrijgegeven").length,
    vrijgeg:  deals.filter(d => d.status === "vrijgegeven").reduce((s, d) => s + d.bedrag, 0),
  }), [deals]);

  const filtered = useMemo(() =>
    filterStatus === "alles" ? deals : deals.filter(d => d.status === filterStatus),
    [deals, filterStatus]
  );

  const selected = deals.find(d => d.id === selectedId) ?? null;

  const vrijgeven = (id: string) => {
    setDeals(ds => ds.map(d => d.id === id ? { ...d, status: "vrijgegeven" as EscrowStatus } : d));
    setSelectedId(null);
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
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Escrow Betaling</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Veilig betalen via Servr</p>
        </div>
        <button onClick={() => setShowInfo(true)}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <Info size={18} style={{ color: "#475569" }} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Hero */}
        <div className="rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 12px 40px rgba(79,70,229,0.4)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <p className="font-black text-white text-base">Servr Escrow</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>Beschermd voor klant én vakman</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "In bewaring",   v: `€${stats.bewaring.toLocaleString("nl-NL")}` },
              { l: "Actief",        v: stats.actief },
              { l: "Vrijgegeven",   v: `€${stats.vrijgeg.toLocaleString("nl-NL")}` },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="font-black text-white text-base">{s.v}</span>
                <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setFilterStatus("alles")}
            className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
            style={{ background: filterStatus === "alles" ? "#4F46E5" : "#fff", color: filterStatus === "alles" ? "#fff" : "#64748b", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            Alles
          </button>
          {(["in_bewaring","klus_bezig","oplevering","vrijgegeven"] as EscrowStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
                style={{
                  background: filterStatus === s ? cfg.color : "#fff",
                  color: filterStatus === s ? "#fff" : "#64748b",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Deal list */}
        <div className="flex flex-col gap-3">
          {filtered.map(deal => {
            const sCfg = STATUS_CFG[deal.status];
            const SIcon = sCfg.icon;
            const pct = Math.round((deal.mijlpalen.filter(m => m.afgerond).length / deal.mijlpalen.length) * 100);
            return (
              <button key={deal.id} onClick={() => setSelectedId(deal.id)}
                className="touch-scale w-full rounded-3xl p-4 text-left"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{deal.titel}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "#94a3b8" }}>
                      <span>{deal.klant}</span>
                      <ArrowRight size={10} />
                      <span>{deal.vakman}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-base" style={{ color: "#4F46E5" }}>€{deal.bedrag.toLocaleString("nl-NL")}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "#E5E7EB" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #4F46E5, #818CF8)", borderRadius: 99 }} />
                  </div>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#4F46E5" }}>{pct}%</span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#94a3b8" }}>
                    {deal.mijlpalen.filter(m => m.afgerond).length}/{deal.mijlpalen.length} mijlpalen
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Deal detail ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{selected.titel}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Amount */}
              <div className="rounded-3xl p-5 text-center"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 8px 24px rgba(79,70,229,0.35)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>In escrow bewaring</p>
                <p className="font-black text-white mt-1" style={{ fontSize: 36, letterSpacing: "-0.03em" }}>
                  €{selected.bedrag.toLocaleString("nl-NL")}
                </p>
                <span className="text-xs font-black px-3 py-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                  {STATUS_CFG[selected.status].label}
                </span>
              </div>
              {/* Parties */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: "Klant",  naam: selected.klant,  avatar: selected.klantAvatar,  icon: User },
                  { role: "Vakman", naam: selected.vakman, avatar: selected.vakmanAvatar, icon: Wrench },
                ].map(p => {
                  const Icon = p.icon;
                  return (
                    <div key={p.role} className="rounded-2xl p-3 flex items-center gap-2"
                      style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                      <img src={p.avatar} className="w-10 h-10 rounded-2xl object-cover flex-shrink-0" alt="" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>{p.role}</p>
                        <p className="text-xs font-bold truncate" style={{ color: "#0f172a" }}>{p.naam}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Mijlpalen */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Mijlpalen</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  {selected.mijlpalen.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < selected.mijlpalen.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: m.afgerond ? "#ECFDF5" : "#F1F5F9" }}>
                        {m.afgerond
                          ? <CheckCircle2 size={14} style={{ color: "#059669" }} />
                          : <div className="w-3 h-3 rounded-full" style={{ background: "#E2E8F0" }} />}
                      </div>
                      <p className="flex-1 text-sm font-medium" style={{ color: m.afgerond ? "#374151" : "#94a3b8" }}>{m.label}</p>
                      <p className="text-sm font-black flex-shrink-0"
                        style={{ color: m.afgerond ? "#059669" : "#94a3b8" }}>€{m.bedrag}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action */}
              {selected.status === "oplevering" && (
                <button onClick={() => vrijgeven(selected.id)}
                  className="touch-scale w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}>
                  <Unlock size={18} /> Betaling vrijgeven
                </button>
              )}
              {selected.status === "vrijgegeven" && (
                <div className="py-4 rounded-2xl font-black text-center"
                  style={{ background: "#ECFDF5", color: "#059669" }}>
                  ✓ Betaling succesvol vrijgegeven
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <h2 className="font-black text-xl text-center" style={{ color: "#0f172a" }}>Hoe werkt Escrow?</h2>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {FLOW_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{step.label}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#64748b" }}>{step.desc}</p>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <div className="absolute" style={{ display: "none" }} />
                  )}
                </div>
              ))}
              <div className="rounded-2xl p-4" style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}>
                <p className="font-black text-sm" style={{ color: "#4F46E5" }}>🛡️ 100% veilig & beschermd</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "#4338CA" }}>
                  Het geld wordt bewaard door Servr als betrouwbare derde partij. Nooit meer onbetaalde facturen of slechte klussen.
                </p>
              </div>
              <button onClick={() => setShowInfo(false)}
                className="touch-scale w-full py-4 rounded-2xl font-black text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                Begrepen!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
