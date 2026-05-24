"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, Euro, Download, X } from "lucide-react";

type Periode = "dag" | "week" | "maand" | "6maanden" | "jaar" | "alletijd";

const DATA: Record<Periode, {
  bruto: number; servr: number; netto: number; klussen: number;
  bars: number[]; labels: string[];
  detail: { label: string; klussen: number; bruto: number }[];
}> = {
  dag: {
    bruto: 195, servr: 15.6, netto: 179.4, klussen: 2,
    bars: [0, 0, 65, 130, 0, 0, 0, 0, 130, 65],
    labels: ["8u","9u","10u","11u","12u","13u","14u","15u","16u","17u"],
    detail: [
      { label: "10u – Lekkage reparatie", klussen: 1, bruto: 65 },
      { label: "11u – Toilet installatie", klussen: 1, bruto: 130 },
    ],
  },
  week: {
    bruto: 842, servr: 67.36, netto: 774.64, klussen: 11,
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
    bruto: 3240, servr: 259.2, netto: 2980.8, klussen: 43,
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
    bruto: 18650, servr: 1492, netto: 17158, klussen: 248,
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
    bruto: 36800, servr: 2944, netto: 33856, klussen: 489,
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
    bruto: 94200, servr: 7536, netto: 86664, klussen: 1247,
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

const RECENTE_KLUSSEN = [
  { naam: "Lekkage reparatie — Lisa de Vries", datum: "19 mei", bruto: 102, fee: 8.16 },
  { naam: "Toilet installatie — Ahmed Mansour", datum: "19 mei", bruto: 236, fee: 18.88 },
  { naam: "CV ketel inspectie — Petra Jansen", datum: "19 mei", bruto: 99, fee: 7.92 },
  { naam: "Kraan vervangen — Sandra Hoek", datum: "18 mei", bruto: 65, fee: 5.2 },
  { naam: "Lekkage reparatie — Daan Roos", datum: "17 mei", bruto: 85, fee: 6.8 },
];

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadPDF(periode: Periode) {
  const d = DATA[periode];
  const periodeLabel = PERIODE_LABELS[periode];
  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

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
  <h1>💰 Verdiensten Overzicht</h1>
  <p>Gegenereerd op ${datum}</p>
  <div class="periode">${periodeLabel}</div>
</div>

<div class="stats">
  <div class="stat netto">
    <div class="label">Netto ontvangen</div>
    <div class="value">€${fmt(d.netto)}</div>
    <div class="sub">Na 8% Servr commissie</div>
  </div>
  <div class="stat">
    <div class="label">Bruto omzet</div>
    <div class="value">€${fmt(d.bruto)}</div>
    <div class="sub">${d.klussen} klussen</div>
  </div>
  <div class="stat fee">
    <div class="label">Servr commissie (8%)</div>
    <div class="value">€${fmt(d.servr)}</div>
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
      ${RECENTE_KLUSSEN.map(k => `
        <tr>
          <td>${k.naam}</td>
          <td>${k.datum}</td>
          <td>€${fmt(k.bruto)}</td>
          <td style="color:#dc2626">€${fmt(k.fee)}</td>
          <td class="td-netto">€${fmt(k.bruto - k.fee)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>

<div class="footer">
  Servr BV · Automatisch gegenereerd rapport · <span class="badge">✓ Officieel document</span><br/>
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
  const [periode, setPeriode] = useState<Periode>("week");
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const d = DATA[periode];
  const maxBar = Math.max(...d.bars, 1);
  const activeDetail = activeBar !== null ? d.detail[activeBar] : null;

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, #d85a30 0%, #b84820 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Verdiensten</h1>
          <button
            onClick={() => downloadPDF(periode)}
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Download size={16} color="white" />
          </button>
        </div>

        {/* Hoofdcijfers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Netto ontvangen</p>
            <p className="text-white font-black text-2xl">€{fmt(d.netto)}</p>
            <p className="text-white/60 text-xs mt-1">Na 8% Servr commissie</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Bruto omzet</p>
            <p className="text-white font-black text-2xl">€{fmt(d.bruto)}</p>
            <p className="text-white/60 text-xs mt-1">{d.klussen} klus{d.klussen !== 1 ? "sen" : ""}</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} color="rgba(255,255,255,0.7)" />
            <span className="text-white/70 text-sm">Servr commissie (8%)</span>
          </div>
          <span className="text-white font-bold">- €{fmt(d.servr)}</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">
        {/* Periode selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5">
          {(Object.keys(PERIODE_LABELS) as Periode[]).map(p => (
            <button key={p} onClick={() => { setPeriode(p); setActiveBar(null); }}
              className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
              style={{
                borderColor: periode === p ? "#d85a30" : "var(--border)",
                background: periode === p ? "#d85a30" : "transparent",
                color: periode === p ? "white" : "var(--muted)",
              }}>
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Klikbaar staafdiagram */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm">Netto verdiensten</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#d85a30" + "15", color: "#d85a30" }}>
              {PERIODE_LABELS[periode]}
            </span>
          </div>

          {/* Detail popup */}
          {activeDetail && (
            <div className="mb-4 p-3 rounded-2xl flex items-center justify-between animate-slide-up"
              style={{ background: "#d85a30" + "12" }}>
              <div>
                <p className="font-bold text-sm">{activeDetail.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {activeDetail.klussen} klus{activeDetail.klussen !== 1 ? "sen" : ""} · bruto €{fmt(activeDetail.bruto)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-base" style={{ color: "#d85a30" }}>
                  €{fmt(activeDetail.bruto * 0.92)}
                </p>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>netto</p>
              </div>
              <button onClick={() => setActiveBar(null)} className="ml-2 touch-scale">
                <X size={14} style={{ color: "var(--muted)" }} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 h-28">
            {d.bars.map((v, i) => {
              const netto = v * 0.92;
              const h = v === 0 ? 4 : Math.max((netto / (maxBar * 0.92)) * 88, 8);
              const isActive = activeBar === i;
              const isHighest = d.bars.indexOf(Math.max(...d.bars)) === i;
              return (
                <button key={i}
                  onClick={() => setActiveBar(isActive ? null : i)}
                  className="flex-1 flex flex-col items-center gap-1 touch-scale">
                  <div className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${h}px`,
                      background: v === 0 ? "var(--surface-2)" :
                        isActive ? "#d85a30" :
                        isHighest ? "#d85a30" + "aa" :
                        "var(--surface-2)",
                      outline: isActive ? "2px solid #d85a30" : "none",
                      outlineOffset: "2px",
                    }} />
                  <span className="text-[9px]" style={{ color: isActive ? "#d85a30" : "var(--muted)" }}>
                    {d.labels[i]}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-center mt-3" style={{ color: "var(--muted)" }}>
            Tik op een balk voor details
          </p>
        </div>

        {/* Fee breakdown */}
        <div className="card p-5">
          <p className="font-bold text-sm mb-4">Breakdown {PERIODE_LABELS[periode]}</p>
          <div className="space-y-3">
            {[
              { label: "Bruto omzet", value: d.bruto, color: "var(--foreground)", bold: false },
              { label: "Servr commissie (8%)", value: -d.servr, color: "#dc2626", bold: false },
              { label: "Netto ontvangen", value: d.netto, color: "#d85a30", bold: true },
            ].map(row => (
              <div key={row.label} className={`flex justify-between items-center ${row.bold ? "pt-2 border-t" : ""}`}
                style={row.bold ? { borderColor: "var(--border)" } : {}}>
                <span className={`text-sm ${row.bold ? "font-black" : ""}`}
                  style={{ color: row.bold ? "var(--foreground)" : "var(--muted)" }}>
                  {row.label}
                </span>
                <span className={`${row.bold ? "font-black text-base" : "font-semibold text-sm"}`}
                  style={{ color: row.color }}>
                  {row.value >= 0 ? "" : "- "}€{fmt(Math.abs(row.value))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recente klussen */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-sm">Recente uitbetalingen</p>
            <button onClick={() => downloadPDF(periode)}
              className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#d85a30" + "15", color: "#d85a30" }}>
              <Download size={12} /> PDF
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {RECENTE_KLUSSEN.map((k, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#d85a30" + "12" }}>
                  <Euro size={16} style={{ color: "#d85a30" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{k.naam}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{k.datum}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm" style={{ color: "#d85a30" }}>€{fmt(k.bruto - k.fee)}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>-€{fmt(k.fee)} fee</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
