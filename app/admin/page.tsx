"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, TrendingUp, Users, Wrench, Euro, ChevronRight, Star, BarChart3, ShieldCheck, Download, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "@/lib/store";

type Periode = "week" | "maand" | "6maanden" | "jaar";

// ─── Mock platform data ───────────────────────────────────────────
// Servr haalt 10% commissie op elke transactie (baked in, nooit zichtbaar voor klant/vakman)

const PLATFORM_DATA: Record<Periode, {
  transactiewaarde: number;
  commissie: number;        // 10% van transactiewaarde
  aantalTransacties: number;
  nieuweKlanten: number;
  nieuweVakmensen: number;
  bars: number[];
  labels: string[];
}> = {
  week: {
    transactiewaarde: 8420,
    commissie: 842,
    aantalTransacties: 94,
    nieuweKlanten: 23,
    nieuweVakmensen: 4,
    bars: [850, 1200, 980, 1400, 1560, 1430, 1000],
    labels: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
  },
  maand: {
    transactiewaarde: 36800,
    commissie: 3680,
    aantalTransacties: 412,
    nieuweKlanten: 87,
    nieuweVakmensen: 14,
    bars: [8200, 9400, 10600, 8600],
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "6maanden": {
    transactiewaarde: 198400,
    commissie: 19840,
    aantalTransacties: 2341,
    nieuweKlanten: 420,
    nieuweVakmensen: 68,
    bars: [28000, 31000, 34000, 29000, 35200, 41200],
    labels: ["Dec", "Jan", "Feb", "Mrt", "Apr", "Mei"],
  },
  jaar: {
    transactiewaarde: 384000,
    commissie: 38400,
    aantalTransacties: 4812,
    nieuweKlanten: 1247,
    nieuweVakmensen: 186,
    bars: [28000, 31000, 26000, 34000, 38000, 31000, 34000, 36000, 33000, 32000, 33000, 38000],
    labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  },
};

const MOCK_VAKMENSEN = [
  { id: "v1", name: "Marco van den Berg", avatar: "https://i.pravatar.cc/150?img=11", category: "Loodgieter", klussen: 127, omzet: 9420, commissie: 942, score: 94, actief: true },
  { id: "v2", name: "Kim Nguyen", avatar: "https://i.pravatar.cc/150?img=56", category: "Schilder", klussen: 84, omzet: 7120, commissie: 712, score: 91, actief: true },
  { id: "v3", name: "Lars Visser", avatar: "https://i.pravatar.cc/150?img=7", category: "Timmerman", klussen: 63, omzet: 5840, commissie: 584, score: 88, actief: true },
  { id: "v4", name: "Yusuf Aydın", avatar: "https://i.pravatar.cc/150?img=33", category: "Elektricien", klussen: 98, omzet: 8250, commissie: 825, score: 92, actief: true },
  { id: "v5", name: "Sofia Martins", avatar: "https://i.pravatar.cc/150?img=47", category: "Schoonmaak", klussen: 201, omzet: 6030, commissie: 603, score: 97, actief: true },
  { id: "v6", name: "Björn Dekker", avatar: "https://i.pravatar.cc/150?img=12", category: "Dakdekker", klussen: 31, omzet: 12400, commissie: 1240, score: 85, actief: false },
];

const MOCK_KLANTEN = [
  { id: "k1", name: "Lisa de Vries", avatar: "https://i.pravatar.cc/150?img=32", boekingen: 14, totaalBetaald: 1240, lid_sinds: "Mrt 2025", actief: true },
  { id: "k2", name: "Ahmed Mansour", avatar: "https://i.pravatar.cc/150?img=21", boekingen: 7, totaalBetaald: 590, lid_sinds: "Jan 2026", actief: true },
  { id: "k3", name: "Petra Jansen", avatar: "https://i.pravatar.cc/150?img=41", boekingen: 22, totaalBetaald: 3120, lid_sinds: "Jun 2024", actief: true },
  { id: "k4", name: "Jeanb", avatar: "https://i.pravatar.cc/150?img=68", boekingen: 13, totaalBetaald: 1050, lid_sinds: "Feb 2026", actief: true },
  { id: "k5", name: "David Cohen", avatar: "https://i.pravatar.cc/150?img=25", boekingen: 4, totaalBetaald: 280, lid_sinds: "Apr 2026", actief: true },
  { id: "k6", name: "Maria Santos", avatar: "https://i.pravatar.cc/150?img=44", boekingen: 18, totaalBetaald: 2340, lid_sinds: "Sep 2024", actief: false },
];

const PERIODE_LABELS: Record<Periode, string> = {
  week: "Deze week",
  maand: "Deze maand",
  "6maanden": "6 maanden",
  jaar: "Dit jaar",
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export default function AdminPage() {
  const { isAdmin } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace("/");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  const [periode, setPeriode] = useState<Periode>("maand");
  const [tab, setTab] = useState<"overzicht" | "vakmensen" | "klanten">("overzicht");
  const [showCommissie, setShowCommissie] = useState(true);
  const data = PLATFORM_DATA[periode];

  const maxBar = Math.max(...data.bars);

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} color="var(--teal)" />
              <span className="text-xs font-bold" style={{ color: "var(--teal)" }}>SERVR ADMIN</span>
            </div>
            <h1 className="text-white font-black text-xl">Platform Beheer</h1>
          </div>
          <button
            onClick={() => setShowCommissie(v => !v)}
            className="touch-scale w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            {showCommissie ? <Eye size={16} color="white" /> : <EyeOff size={16} color="white" />}
          </button>
        </div>

        {/* Commissie hero */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-white/60 text-xs font-semibold uppercase mb-1">Servr Commissie (10%)</p>
          <p className="text-white font-black text-4xl mb-1">
            {showCommissie ? `€${fmt(data.commissie)}` : "••••••"}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp size={12} color="#4ade80" />
            <span className="text-[11px] font-semibold" style={{ color: "#4ade80" }}>+12% t.o.v. vorige periode</span>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/40 text-xs">
              Totale transactiewaarde: {showCommissie ? `€${fmt(data.transactiewaarde)}` : "••••"} · {data.aantalTransacties} transacties
            </p>
          </div>
        </div>

        {/* Periode selector */}
        <div className="flex gap-2">
          {(["week", "maand", "6maanden", "jaar"] as Periode[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className="touch-scale flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all"
              style={{
                background: periode === p ? "var(--teal)" : "rgba(255,255,255,0.08)",
                color: periode === p ? "white" : "rgba(255,255,255,0.5)",
              }}>
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {[
          { label: "Transacties", value: data.aantalTransacties.toString(), icon: <BarChart3 size={14} />, color: "var(--teal)" },
          { label: "Nieuwe klanten", value: `+${data.nieuweKlanten}`, icon: <Users size={14} />, color: "#7c3aed" },
          { label: "Nieuwe vakm.", value: `+${data.nieuweVakmensen}`, icon: <Wrench size={14} />, color: "var(--coral)" },
        ].map(s => (
          <div key={s.label} className="card p-3 flex flex-col gap-1.5 items-center text-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: s.color + "15", color: s.color }}>
              {s.icon}
            </div>
            <p className="font-black text-lg leading-none">{s.value}</p>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          {([
            { id: "overzicht", label: "📊 Omzet" },
            { id: "vakmensen", label: `🔧 Vakm. (${MOCK_VAKMENSEN.length})` },
            { id: "klanten", label: `👤 Klanten (${MOCK_KLANTEN.length})` },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="touch-scale flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: tab === t.id ? "white" : "transparent",
                color: tab === t.id ? "var(--foreground)" : "var(--muted)",
                boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-8">

        {/* ─── OVERZICHT ─── */}
        {tab === "overzicht" && (
          <>
            {/* Bar chart */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-black text-sm">Commissie-inkomsten</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>10% op alle transacties</p>
                </div>
                <button className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                  <Download size={11} /> Export
                </button>
              </div>
              <div className="flex items-end gap-1 h-28">
                {data.bars.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${(v / maxBar) * 96}px`,
                        background: `linear-gradient(to top, var(--teal), var(--teal-dark))`,
                        opacity: 0.8,
                      }} />
                    <span className="text-[8px]" style={{ color: "var(--muted)" }}>{data.labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue breakdown */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="font-black text-sm">Financieel overzicht</p>
              </div>
              {[
                { label: "Bruto transactiewaarde", value: `€${fmt(data.transactiewaarde)}`, sub: "Totaal betaald door klanten", color: "var(--foreground)" },
                { label: "Vakmannen uitbetaald", value: `€${fmt(data.transactiewaarde - data.commissie)}`, sub: "90% naar vakmansen", color: "var(--foreground)" },
                { label: "Servr commissie (10%)", value: `€${showCommissie ? fmt(data.commissie) : "••••••"}`, sub: "Jouw platform-inkomsten", color: "var(--teal)", bold: true },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3.5 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className={`text-sm ${row.bold ? "font-black" : "font-semibold"}`}>{row.label}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{row.sub}</p>
                  </div>
                  <p className={`font-black text-base ${row.bold ? "" : "text-sm"}`}
                    style={{ color: row.color }}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Top vakmensen bijdragers */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="font-black text-sm">Top commissie-bijdragers</p>
              </div>
              {[...MOCK_VAKMENSEN]
                .sort((a, b) => b.commissie - a.commissie)
                .slice(0, 4)
                .map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="w-5 text-xs font-black" style={{ color: "var(--muted)" }}>#{i + 1}</span>
                    <img src={v.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{v.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{v.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm" style={{ color: "var(--teal)" }}>
                        {showCommissie ? `€${fmt(v.commissie)}` : "••••"}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>van €{fmt(v.omzet)}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </>
        )}

        {/* ─── VAKMENSEN ─── */}
        {tab === "vakmensen" && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-2xl font-black">{MOCK_VAKMENSEN.filter(v => v.actief).length}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Actieve vakmensen</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-black" style={{ color: "var(--teal)" }}>
                  €{fmt(MOCK_VAKMENSEN.reduce((s, v) => s + v.commissie, 0))}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Totale commissie (all-time)</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              {MOCK_VAKMENSEN.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="relative flex-shrink-0">
                    <img src={v.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${v.actief ? "bg-green-500" : "bg-gray-300"}`}
                      style={{ borderColor: "var(--background)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{v.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{v.category} · {v.klussen} klussen</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-semibold">{v.score} score</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm" style={{ color: "var(--teal)" }}>
                      {showCommissie ? `€${fmtK(v.commissie)}` : "••••"}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>commissie</p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>€{fmtK(v.omzet)} omzet</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── KLANTEN ─── */}
        {tab === "klanten" && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-2xl font-black">{MOCK_KLANTEN.filter(k => k.actief).length}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Actieve klanten</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-black">
                  €{fmtK(Math.round(MOCK_KLANTEN.reduce((s, k) => s + k.totaalBetaald, 0) / MOCK_KLANTEN.length))}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Gem. besteding per klant</p>
              </div>
            </div>

            <div className="card overflow-hidden">
              {MOCK_KLANTEN.map(k => (
                <div key={k.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <div className="relative flex-shrink-0">
                    <img src={k.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${k.actief ? "bg-green-500" : "bg-gray-300"}`}
                      style={{ borderColor: "var(--background)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{k.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{k.boekingen} boekingen · lid sinds {k.lid_sinds}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-sm">€{fmtK(k.totaalBetaald)}</p>
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                      {showCommissie ? `→ €${fmtK(Math.round(k.totaalBetaald * 0.1))} commissie` : "••••"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Commissie model uitleg */}
            <div className="card p-4 flex gap-3"
              style={{ background: "var(--teal)" + "08", border: "1px solid var(--teal)" + "30" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--teal)" }}>
                <Euro size={14} color="white" />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "var(--teal)" }}>Commissie model</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
                  Servr rekent <strong>10% commissie</strong> op elke transactie.
                  Dit bedrag is <strong>verborgen in de marge</strong> — klanten en vakmensen
                  zien alleen de netto bedragen. De klant betaalt de marktprijs,
                  de vakman ontvangt 90%, Servr behoudt 10%.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
