"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Lock, CheckCircle2, Clock,
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
  wacht_betaling: { label: "Wacht op betaling",  color: "#C97A4D", bg: "#C97A4D15", icon: Clock },
  in_bewaring:    { label: "In bewaring",         color: "#2B4030", bg: "#2B403015", icon: Lock },
  klus_bezig:     { label: "Klus bezig",          color: "#5C5C56", bg: "#E5DDD0",   icon: Wrench },
  oplevering:     { label: "Oplevering",          color: "#C97A4D", bg: "#C97A4D15", icon: CheckCircle2 },
  vrijgegeven:    { label: "Vrijgegeven",         color: "#2B4030", bg: "#2B403020", icon: Unlock },
  geschil:        { label: "Geschil",             color: "#DC2626", bg: "#FEF2F2",   icon: AlertCircle },
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
              Escrow Betaling
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
              Veilig betalen via Servr
            </p>
          </div>
          <button onClick={() => setShowInfo(true)}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <Info size={18} style={{ color: "#5C5C56" }} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5">

        {/* Hero stat card */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#2B4030" }}>
              <Shield size={20} color="#F5EFE5" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                Servr Escrow
              </p>
              <p className="text-xs" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                Beschermd voor klant én vakman
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3" style={{ borderTop: "0.5px solid #E5DDD0", paddingTop: 12 }}>
            {[
              { l: "In bewaring",   v: `€${stats.bewaring.toLocaleString("nl-NL")}` },
              { l: "Actief",        v: stats.actief },
              { l: "Vrijgegeven",   v: `€${stats.vrijgeg.toLocaleString("nl-NL")}` },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center gap-0.5">
                <span className="font-bold text-sm" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                  {s.v}
                </span>
                <span className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setFilterStatus("alles")}
            className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: filterStatus === "alles" ? "#2B4030" : "#FBF7F0",
              color: filterStatus === "alles" ? "#F5EFE5" : "#5C5C56",
              border: "0.5px solid #E5DDD0",
            }}>
            Alles
          </button>
          {(["in_bewaring","klus_bezig","oplevering","vrijgegeven"] as EscrowStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: filterStatus === s ? "#2B4030" : "#FBF7F0",
                  color: filterStatus === s ? "#F5EFE5" : "#5C5C56",
                  border: "0.5px solid #E5DDD0",
                }}>
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Deal list */}
        <div className="flex flex-col gap-2">
          {filtered.map(deal => {
            const sCfg = STATUS_CFG[deal.status];
            const SIcon = sCfg.icon;
            const pct = Math.round((deal.mijlpalen.filter(m => m.afgerond).length / deal.mijlpalen.length) * 100);
            return (
              <button key={deal.id} onClick={() => setSelectedId(deal.id)}
                className="touch-scale w-full text-left"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                      {deal.titel}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                      <span>{deal.klant}</span>
                      <ArrowRight size={10} />
                      <span>{deal.vakman}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>
                      €{deal.bedrag.toLocaleString("nl-NL")}
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
                  <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "#2B4030", fontFamily: "'Inter', sans-serif" }}>
                    {pct}%
                  </span>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
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
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                  {selected.titel}
                </h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={16} style={{ color: "#5C5C56" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Amount */}
              <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 20 }}
                className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                  In escrow bewaring
                </p>
                <p className="font-bold mt-1" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 36, color: "#2B4030" }}>
                  €{selected.bedrag.toLocaleString("nl-NL")}
                </p>
                <span className="text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-block"
                  style={{
                    background: STATUS_CFG[selected.status].bg,
                    color: STATUS_CFG[selected.status].color,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                  {STATUS_CFG[selected.status].label}
                </span>
              </div>
              {/* Parties */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { role: "Klant",  naam: selected.klant,  avatar: selected.klantAvatar,  icon: User },
                  { role: "Vakman", naam: selected.vakman, avatar: selected.vakmanAvatar, icon: Wrench },
                ].map(p => (
                  <div key={p.role} className="rounded-2xl p-3 flex items-center gap-2"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                    <img src={p.avatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                        {p.role}
                      </p>
                      <p className="text-xs font-semibold truncate" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                        {p.naam}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Mijlpalen */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                  Mijlpalen
                </p>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  {selected.mijlpalen.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < selected.mijlpalen.length - 1 ? "0.5px solid #E5DDD0" : "none" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: m.afgerond ? "#2B403015" : "#E5DDD0" }}>
                        {m.afgerond
                          ? <CheckCircle2 size={14} style={{ color: "#2B4030" }} />
                          : <div className="w-3 h-3 rounded-full" style={{ background: "#8A8A83" }} />}
                      </div>
                      <p className="flex-1 text-sm font-medium" style={{ color: m.afgerond ? "#5C5C56" : "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                        {m.label}
                      </p>
                      <p className="text-sm font-bold flex-shrink-0"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: m.afgerond ? "#8A8A83" : "#2B4030" }}>
                        €{m.bedrag}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Action */}
              {selected.status === "oplevering" && (
                <button onClick={() => vrijgeven(selected.id)}
                  className="touch-scale w-full py-4 font-semibold flex items-center justify-center gap-2"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none", fontFamily: "'Inter', sans-serif" }}>
                  <Unlock size={18} /> Betaling vrijgeven
                </button>
              )}
              {selected.status === "vrijgegeven" && (
                <div className="py-4 rounded-full font-semibold text-center"
                  style={{ background: "#2B403020", color: "#2B4030", fontFamily: "'Inter', sans-serif" }}>
                  Betaling succesvol vrijgegeven
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
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <h2 className="font-bold text-xl text-center"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                Hoe werkt Escrow?
              </h2>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {FLOW_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: "#2B4030", color: "#F5EFE5", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                      {step.label}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
              <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                <p className="font-semibold text-sm mb-1" style={{ color: "#2B4030", fontFamily: "'Inter', sans-serif" }}>
                  100% veilig & beschermd
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
                  Het geld wordt bewaard door Servr als betrouwbare derde partij. Nooit meer onbetaalde facturen of slechte klussen.
                </p>
              </div>
              <button onClick={() => setShowInfo(false)}
                className="touch-scale w-full py-4 font-semibold"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none", fontFamily: "'Inter', sans-serif" }}>
                Begrepen!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
