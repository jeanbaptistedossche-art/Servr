"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Euro, Download } from "lucide-react";

type Periode = "dag" | "week" | "maand" | "6maanden" | "jaar" | "alletijd";

// Mock verdiensten data
const DATA: Record<Periode, {
  bruto: number;
  servr: number;
  netto: number;
  klussen: number;
  bars: number[];
  labels: string[];
}> = {
  dag: {
    bruto: 195, servr: 19.5, netto: 175.5, klussen: 2,
    bars: [0, 0, 65, 130, 0, 0, 0, 0, 130, 65],
    labels: ["8u", "9u", "10u", "11u", "12u", "13u", "14u", "15u", "16u", "17u"],
  },
  week: {
    bruto: 842, servr: 84.2, netto: 757.8, klussen: 11,
    bars: [45, 120, 85, 200, 160, 140, 92],
    labels: ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"],
  },
  maand: {
    bruto: 3240, servr: 324, netto: 2916, klussen: 43,
    bars: [620, 780, 850, 990],
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  },
  "6maanden": {
    bruto: 18650, servr: 1865, netto: 16785, klussen: 248,
    bars: [2800, 3100, 3400, 2900, 3250, 3200],
    labels: ["Dec", "Jan", "Feb", "Mrt", "Apr", "Mei"],
  },
  jaar: {
    bruto: 36800, servr: 3680, netto: 33120, klussen: 489,
    bars: [2800, 3100, 2600, 3200, 3400, 2900, 3100, 3300, 3200, 3000, 3000, 3200],
    labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
  },
  alletijd: {
    bruto: 94200, servr: 9420, netto: 84780, klussen: 1247,
    bars: [12000, 18000, 22000, 25000, 17200],
    labels: ["2022", "2023", "2024", "2025", "2026"],
  },
};

const PERIODE_LABELS: Record<Periode, string> = {
  dag: "Vandaag",
  week: "Deze week",
  maand: "Deze maand",
  "6maanden": "6 maanden",
  jaar: "Dit jaar",
  alletijd: "Alles",
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Per-klus details (mock)
const RECENTE_KLUSSEN = [
  { naam: "Lekkage reparatie — Lisa de Vries", datum: "19 mei 2026", bruto: 102, servr: 10.2 },
  { naam: "Toilet installatie — Ahmed Mansour", datum: "19 mei 2026", bruto: 236, servr: 23.6 },
  { naam: "CV ketel inspectie — Petra Jansen", datum: "19 mei 2026", bruto: 99, servr: 9.9 },
  { naam: "Kraan vervangen — Sandra Hoek", datum: "18 mei 2026", bruto: 65, servr: 6.5 },
  { naam: "Lekkage reparatie — Daan Roos", datum: "17 mei 2026", bruto: 85, servr: 8.5 },
];

export default function VerdiennstenPage() {
  const [periode, setPeriode] = useState<Periode>("week");
  const d = DATA[periode];
  const maxBar = Math.max(...d.bars, 1);

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Verdiensten</h1>
          <button className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Download size={16} color="white" />
          </button>
        </div>

        {/* Hoofdcijfers */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Netto ontvangen</p>
            <p className="text-white font-black text-2xl">€{fmt(d.netto)}</p>
            <p className="text-white/60 text-xs mt-1">Na 10% Servr commissie</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Bruto omzet</p>
            <p className="text-white font-black text-2xl">€{fmt(d.bruto)}</p>
            <p className="text-white/60 text-xs mt-1">{d.klussen} klus{d.klussen !== 1 ? "sen" : ""}</p>
          </div>
        </div>

        {/* Servr fee */}
        <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} color="rgba(255,255,255,0.7)" />
            <span className="text-white/70 text-sm">Servr commissie (10%)</span>
          </div>
          <span className="text-white font-bold">- €{fmt(d.servr)}</span>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">
        {/* Periode selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5">
          {(Object.keys(PERIODE_LABELS) as Periode[]).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
              style={{
                borderColor: periode === p ? "var(--teal)" : "var(--border)",
                background: periode === p ? "var(--teal)" : "transparent",
                color: periode === p ? "white" : "var(--muted)",
              }}>
              {PERIODE_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Staafdiagram */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm">Netto verdiensten</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
              {PERIODE_LABELS[periode]}
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-28">
            {d.bars.map((v, i) => {
              const netto = v * 0.9;
              const h = Math.max((netto / (maxBar * 0.9)) * 88, 4);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg transition-all"
                    style={{ height: `${h}px`, background: i === d.bars.length - 1 || d.bars.indexOf(Math.max(...d.bars)) === i ? "var(--teal)" : "var(--surface-2)" }} />
                  <span className="text-[9px]" style={{ color: "var(--muted)" }}>{d.labels[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="w-3 h-3 rounded" style={{ background: "var(--teal)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>Netto (na Servr 10%)</span>
          </div>
        </div>

        {/* Fee breakdown */}
        <div className="card p-5">
          <p className="font-bold text-sm mb-4">Breakdown</p>
          <div className="space-y-3">
            {[
              { label: "Bruto omzet", value: d.bruto, color: "var(--foreground)", bold: false },
              { label: "Servr commissie (10%)", value: -d.servr, color: "#dc2626", bold: false },
              { label: "Netto ontvangen", value: d.netto, color: "var(--teal)", bold: true },
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

        {/* Recente klussen met fees */}
        <div>
          <p className="font-black text-sm mb-3">Recente uitbetalingen</p>
          <div className="flex flex-col gap-2">
            {RECENTE_KLUSSEN.map((k, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--teal)" + "12" }}>
                  <Euro size={16} style={{ color: "var(--teal)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{k.naam}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{k.datum}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm" style={{ color: "var(--teal)" }}>€{fmt(k.bruto - k.servr)}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>-€{fmt(k.servr)} fee</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
