"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingDown, Euro, Download, X } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";

type Periode = "dag" | "week" | "maand" | "6maanden" | "jaar" | "alletijd";

// ── Static chart/detail data (visual decoration) ─────────────
const CHART_DATA: Record<Periode, { bars: number[]; labels: string[]; detail: { label: string; klussen: number; bruto: number }[] }> = {
  dag: {
    bars: [0, 0, 65, 130, 0, 0, 0, 0, 130, 65],
    labels: ["8u","9u","10u","11u","12u","13u","14u","15u","16u","17u"],
    detail: [
      { label: "10u – Lekkage reparatie", klussen: 1, bruto: 65 },
      { label: "11u – Toilet installatie", klussen: 1, bruto: 130 },
    ],
  },
  week: {
    bars: [45, 120, 85, 200, 160, 140, 92],
    labels: ["Ma","Di","Wo","Do","Vr","Za","Zo"],
    detail: [
      { label: "Maandag", klussen: 1, bruto: 45 },
      { label: "Dinsdag", klussen: 2, bruto: 120 },
      { label: "Woensdag", klussen: 1, bruto: 85 },
      { label: "Donderdag", klussen: 3, bruto: 200 },
      { label: "Vrijdag", klussen: 2, bruto: 160 },
      { label: "Zaterdag", klussen: 1, bruto: 140 },
      { label: "Zondag", klussen: 1, bruto: 92 },
    ],
  },
  maand: {
    bars: [620, 780, 850, 990],
    labels: ["Week 1","Week 2","Week 3","Week 4"],
    detail: [
      { label: "Week 1", klussen: 9, bruto: 620 },
      { label: "Week 2", klussen: 11, bruto: 780 },
      { label: "Week 3", klussen: 12, bruto: 850 },
      { label: "Week 4", klussen: 11, bruto: 990 },
    ],
  },
  "6maanden": {
    bars: [2800, 3100, 3400, 2900, 3250, 3200],
    labels: ["Dec","Jan","Feb","Mrt","Apr","Mei"],
    detail: [
      { label: "December", klussen: 38, bruto: 2800 },
      { label: "Januari", klussen: 41, bruto: 3100 },
      { label: "Februari", klussen: 45, bruto: 3400 },
      { label: "Maart", klussen: 40, bruto: 2900 },
      { label: "April", klussen: 43, bruto: 3250 },
      { label: "Mei", klussen: 41, bruto: 3200 },
    ],
  },
  jaar: {
    bars: [2800,3100,2600,3200,3400,2900,3100,3300,3200,3000,3000,3200],
    labels: ["J","F","M","A","M","J","J","A","S","O","N","D"],
    detail: [
      { label: "Januari", klussen: 37, bruto: 2800 },
      { label: "Februari", klussen: 41, bruto: 3100 },
      { label: "Maart", klussen: 35, bruto: 2600 },
      { label: "April", klussen: 43, bruto: 3200 },
      { label: "Mei", klussen: 45, bruto: 3400 },
      { label: "Juni", klussen: 38, bruto: 2900 },
      { label: "Juli", klussen: 41, bruto: 3100 },
      { label: "Augustus", klussen: 44, bruto: 3300 },
      { label: "September", klussen: 43, bruto: 3200 },
      { label: "Oktober", klussen: 40, bruto: 3000 },
      { label: "November", klussen: 40, bruto: 3000 },
      { label: "December", klussen: 42, bruto: 3200 },
    ],
  },
  alletijd: {
    bars: [12000, 18000, 22000, 25000, 17200],
    labels: ["2022","2023","2024","2025","2026"],
    detail: [
      { label: "2022", klussen: 142, bruto: 12000 },
      { label: "2023", klussen: 218, bruto: 18000 },
      { label: "2024", klussen: 290, bruto: 22000 },
      { label: "2025", klussen: 386, bruto: 25000 },
      { label: "2026 (tot nu)", klussen: 211, bruto: 17200 },
    ],
  },
};

const PERIODE_LABELS: Record<Periode, string> = {
  dag: "Vandaag", week: "Deze week", maand: "Deze maand",
  "6maanden": "6 maanden", jaar: "Dit jaar", alletijd: "Alles",
};

// ── Booking shape from Supabase ───────────────────────────────
type Boeking = {
  id: string;
  klant_id: string;
  vakman_id: string;
  status: string;
  start_tijd: string;
  bedrag: number;
  notities?: string;
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

// ── Derived stats from bookings ───────────────────────────────
function calcStats(boekingen: Boeking[]) {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const prevMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let totalBruto = 0;
  let thisMaandBruto = 0;
  let vorigeMaandBruto = 0;

  for (const b of boekingen) {
    const euros = (b.bedrag ?? 0) / 100;
    totalBruto += euros;
    const d = new Date(b.start_tijd);
    if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
      thisMaandBruto += euros;
    }
    if (d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth) {
      vorigeMaandBruto += euros;
    }
  }

  const servr = totalBruto * 0.08;
  const netto = totalBruto - servr;
  const klussen = boekingen.length;

  return { totalBruto, netto, servr, klussen, thisMaandBruto, vorigeMaandBruto };
}

function downloadPDF(
  periode: Periode,
  stats: ReturnType<typeof calcStats>,
  boekingen: Boeking[],
) {
  const periodeLabel = PERIODE_LABELS[periode];
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const d = CHART_DATA[periode];

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8"/>
<title>Servr Verdiensten — ${periodeLabel}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
  .header { background: linear-gradient(135deg, #0F6E56 0%, #0a4f3d 100%); color: white; padding: 36px 40px; border-radius: 20px; margin-bottom: 32px; }
  .header h1 { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
  .header p { opacity: 0.75; font-size: 14px; }
  .header .periode { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 12px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  .stat .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
  .stat .value { font-size: 28px; font-weight: 900; }
  .stat .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
  .stat.netto .value { color: #0F6E56; }
  .stat.fee .value { color: #dc2626; }
  .section { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
  .section h2 { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
  td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  td:last-child, th:last-child { text-align: right; }
  .td-netto { color: #0F6E56; font-weight: 700; }
  .footer { text-align: center; color: #94a3b8; font-size: 11px; margin-top: 32px; }
  .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
</style>
</head>
<body>
<div class="header">
  <h1>Verdiensten Overzicht</h1>
  <p>Gegenereerd op ${datum}</p>
  <div class="periode">${periodeLabel}</div>
</div>

<div class="stats">
  <div class="stat netto">
    <div class="label">Netto ontvangen</div>
    <div class="value">€${fmt(stats.netto)}</div>
    <div class="sub">Na 8% Servr commissie</div>
  </div>
  <div class="stat">
    <div class="label">Bruto omzet</div>
    <div class="value">€${fmt(stats.totalBruto)}</div>
    <div class="sub">${stats.klussen} klussen</div>
  </div>
  <div class="stat fee">
    <div class="label">Servr commissie (8%)</div>
    <div class="value">€${fmt(stats.servr)}</div>
    <div class="sub">Platform fee</div>
  </div>
</div>

<div class="section">
  <h2>Verdeling per periode</h2>
  <table>
    <thead>
      <tr><th>Periode</th><th>Klussen</th><th>Bruto</th><th>Servr (8%)</th><th>Netto</th></tr>
    </thead>
    <tbody>
      ${d.detail.map(r => `
        <tr>
          <td>${r.label}</td>
          <td>${r.klussen}</td>
          <td>€${fmt(r.bruto)}</td>
          <td style="color:#dc2626">€${fmt(r.bruto * 0.08)}</td>
          <td class="td-netto">€${fmt(r.bruto * 0.92)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>

<div class="section">
  <h2>Recente klussen</h2>
  <table>
    <thead>
      <tr><th>Klus</th><th>Datum</th><th>Bruto</th><th>Fee (8%)</th><th>Netto</th></tr>
    </thead>
    <tbody>
      ${boekingen.slice(0, 10).map(k => {
        const bruto = (k.bedrag ?? 0) / 100;
        const fee = bruto * 0.08;
        return `
        <tr>
          <td>Klus #${k.id.slice(0, 8)}</td>
          <td>${fmtDate(k.start_tijd)}</td>
          <td>€${fmt(bruto)}</td>
          <td style="color:#dc2626">€${fmt(fee)}</td>
          <td class="td-netto">€${fmt(bruto - fee)}</td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>
</div>

<div class="footer">
  Servr BV · Automatisch gegenereerd rapport · <span class="badge">Officieel document</span><br/>
  Bewaar dit document voor je boekhouding.
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `servr-verdiensten-${periode}-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VerdiennstenPage() {
  const router = useRouter();
  const [periode, setPeriode] = useState<Periode>("week");
  const [activeBar, setActiveBar] = useState<number | null>(null);

  // Real data state
  const { userId: storeUserId } = useUserStore();
  const [userId, setUserId] = useState(storeUserId);
  const [boekingen, setBoekingen] = useState<Boeking[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve userId
  useEffect(() => {
    if (storeUserId) { setUserId(storeUserId); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, [storeUserId]);

  // Load bookings
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        await supabaseReady;
        const { data, error } = await (supabase.from("boekingen") as any)
          .select("*")
          .eq("vakman_id", userId)
          .in("status", ["afgerond", "betaald"])
          .order("start_tijd", { ascending: false });

        if (!cancelled && !error && data) {
          setBoekingen(data);
        }
      } catch {
        // silently ignore — show zeros
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const stats = calcStats(boekingen);
  const chart = CHART_DATA[periode];
  const maxBar = Math.max(...chart.bars, 1);
  const activeDetail = activeBar !== null ? chart.detail[activeBar] : null;

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F5EFE5" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <h1 className="flex-1 text-xl font-bold" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
            Verdiensten
          </h1>
          <button
            onClick={() => downloadPDF(periode, stats, boekingen)}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <Download size={16} style={{ color: "#2B4030" }} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5">

        {/* Hoofdcijfers — real data */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2">
              <p className="text-xs mb-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Netto ontvangen</p>
              <p className="font-bold" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 28, color: "#2B4030" }}>
                {loading ? "…" : `€${fmt(stats.netto)}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Na 8% Servr commissie</p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Bruto</p>
              <p className="font-bold text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                {loading ? "…" : `€${fmt(stats.totalBruto)}`}
              </p>
              <p className="text-xs mt-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                {loading ? "" : `${stats.klussen} klus${stats.klussen !== 1 ? "sen" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
            <div className="flex items-center gap-2">
              <TrendingDown size={14} style={{ color: "#8A8A83" }} />
              <span className="text-sm" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>Servr commissie (8%)</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: "#C97A4D", fontFamily: "'Inter', sans-serif" }}>
              {loading ? "…" : `- €${fmt(stats.servr)}`}
            </span>
          </div>
        </div>

        {/* Stats grid — deze maand / vorige maand */}
        <div className="grid grid-cols-2 gap-3">
          <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
            <p className="text-xs mb-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Deze maand</p>
            <p className="font-bold" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, color: "#2B4030" }}>
              {loading ? "…" : `€${fmt(stats.thisMaandBruto * 0.92)}`}
            </p>
            <p className="text-xs mt-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>netto</p>
          </div>
          <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
            <p className="text-xs mb-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Vorige maand</p>
            <p className="font-bold" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 20, color: "#1A1D1A" }}>
              {loading ? "…" : `€${fmt(stats.vorigeMaandBruto * 0.92)}`}
            </p>
            <p className="text-xs mt-1" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>netto</p>
          </div>
        </div>

        {/* Periode selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5">
          {(Object.keys(PERIODE_LABELS) as Periode[]).map(p => (
            <button key={p} onClick={() => { setPeriode(p); setActiveBar(null); }}
              className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: periode === p ? "#2B4030" : "#FBF7F0",
                color: periode === p ? "#F5EFE5" : "#5C5C56",
                border: "0.5px solid #E5DDD0",
              }}>
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Klikbaar staafdiagram (visual decoration) */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
              Netto verdiensten
            </p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#2B403015", color: "#2B4030", fontFamily: "'Inter', sans-serif" }}>
              {PERIODE_LABELS[periode]}
            </span>
          </div>

          {activeDetail && (
            <div className="mb-4 p-3 rounded-xl flex items-center justify-between"
              style={{ background: "#2B403010", border: "0.5px solid #E5DDD0" }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                  {activeDetail.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                  {activeDetail.klussen} klus{activeDetail.klussen !== 1 ? "sen" : ""} · bruto €{fmt(activeDetail.bruto)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-base" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>
                  €{fmt(activeDetail.bruto * 0.92)}
                </p>
                <p className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>netto</p>
              </div>
              <button onClick={() => setActiveBar(null)} className="ml-2 touch-scale">
                <X size={14} style={{ color: "#8A8A83" }} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 h-28">
            {chart.bars.map((v, i) => {
              const netto = v * 0.92;
              const h = v === 0 ? 4 : Math.max((netto / (maxBar * 0.92)) * 88, 8);
              const isActive = activeBar === i;
              const isHighest = chart.bars.indexOf(Math.max(...chart.bars)) === i;
              return (
                <button key={i}
                  onClick={() => setActiveBar(isActive ? null : i)}
                  className="flex-1 flex flex-col items-center gap-1 touch-scale">
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${h}px`,
                      background: v === 0 ? "#E5DDD0" :
                        isActive ? "#2B4030" :
                        isHighest ? "#2B403080" :
                        "#E5DDD0",
                      outline: isActive ? `2px solid #2B4030` : "none",
                      outlineOffset: "2px",
                    }} />
                  <span className="text-[9px]" style={{ color: isActive ? "#2B4030" : "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                    {chart.labels[i]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-center mt-3" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
            Tik op een balk voor details
          </p>
        </div>

        {/* Fee breakdown — real totals */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <p className="font-semibold text-sm mb-4" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
            Totaal overzicht
          </p>
          <div className="space-y-3">
            {[
              { label: "Bruto omzet", value: stats.totalBruto, color: "#1A1D1A", bold: false },
              { label: "Servr commissie (8%)", value: -stats.servr, color: "#C97A4D", bold: false },
              { label: "Netto ontvangen", value: stats.netto, color: "#2B4030", bold: true },
            ].map(row => (
              <div key={row.label}
                className={`flex justify-between items-center ${row.bold ? "pt-2" : ""}`}
                style={row.bold ? { borderTop: "0.5px solid #E5DDD0" } : {}}>
                <span className="text-sm" style={{
                  color: row.bold ? "#1A1D1A" : "#5C5C56",
                  fontWeight: row.bold ? 700 : 400,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {row.label}
                </span>
                <span style={{
                  color: row.color,
                  fontFamily: row.bold ? "'Source Serif 4', Georgia, serif" : "'Inter', sans-serif",
                  fontWeight: row.bold ? 700 : 600,
                  fontSize: row.bold ? 16 : 14,
                }}>
                  {loading ? "…" : `${row.value >= 0 ? "" : "- "}€${fmt(Math.abs(row.value))}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recente klussen — real bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
              Recente uitbetalingen
            </p>
            <button onClick={() => downloadPDF(periode, stats, boekingen)}
              className="touch-scale flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "transparent", border: "0.5px solid #E5DDD0", color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
              <Download size={12} /> PDF
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ fontSize: 13, color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Laden…</p>
            </div>
          ) : boekingen.length === 0 ? (
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 24, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                Nog geen uitbetalingen
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {boekingen.slice(0, 10).map((k) => {
                const bruto = (k.bedrag ?? 0) / 100;
                const fee = bruto * 0.08;
                return (
                  <div key={k.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}
                    className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#2B403015" }}>
                      <Euro size={16} style={{ color: "#2B4030" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                        {k.notities ? k.notities.slice(0, 40) : `Klus #${k.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                        {fmtDate(k.start_tijd)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>
                        €{fmt(bruto - fee)}
                      </p>
                      <p className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>-€{fmt(fee)} fee</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
