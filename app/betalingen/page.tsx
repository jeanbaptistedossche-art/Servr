"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, CreditCard, Check, X, Clock, ArrowUpRight,
  ArrowDownLeft, Shield, Zap, QrCode, ChevronRight,
  Euro, RefreshCw, AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type BetaalMethode = "ideal" | "bancontact" | "creditcard" | "paypal" | "bankoverschrijving";
type TransactieStatus = "geslaagd" | "wacht" | "mislukt" | "teruggestort";
type Richting = "in" | "uit";

interface Transactie {
  id: string;
  omschrijving: string;
  bedrag: number;
  methode: BetaalMethode;
  status: TransactieStatus;
  richting: Richting;
  datum: string;
  referentie: string;
  klant?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const METHODE_CFG: Record<BetaalMethode, { label: string; kleur: string; bg: string; emoji: string; desc: string }> = {
  ideal:            { label: "iDEAL",              kleur: "#CC0066", bg: "#FDF0F7", emoji: "🏦", desc: "Directe betaling via jouw bank (NL)" },
  bancontact:       { label: "Bancontact",          kleur: "#005499", bg: "#EFF5FF", emoji: "💳", desc: "Populaire betaalmethode in België" },
  creditcard:       { label: "Credit Card",         kleur: "#1C1C1E", bg: "#F1F5F9", emoji: "💳", desc: "Visa, Mastercard, Amex" },
  paypal:           { label: "PayPal",              kleur: "#003087", bg: "#EEF4FF", emoji: "🅿️", desc: "Online betalen via PayPal account" },
  bankoverschrijving: { label: "Overboeking",       kleur: "#10B981", bg: "#ECFDF5", emoji: "🏛️", desc: "Traditionele bankoverschrijving" },
};

const STATUS_CFG: Record<TransactieStatus, { label: string; color: string; bg: string }> = {
  geslaagd:    { label: "Geslaagd",     color: "#059669", bg: "#ECFDF5" },
  wacht:       { label: "In behandeling", color: "#D97706", bg: "#FFFBEB" },
  mislukt:     { label: "Mislukt",      color: "#DC2626", bg: "#FEF2F2" },
  teruggestort:{ label: "Teruggestort", color: "#7C3AED", bg: "#F5F3FF" },
};

const TRANS: Transactie[] = [
  { id:"1", omschrijving: "Badkamerrenovatie Bakker", bedrag: 1200, methode: "ideal",    status: "geslaagd", richting: "in",  datum: "22 mei 2026",  referentie: "SRV-2026-0542", klant: "Jan Bakker" },
  { id:"2", omschrijving: "Dakwerk Verhoeven",        bedrag: 850,  methode: "ideal",    status: "geslaagd", richting: "in",  datum: "20 mei 2026",  referentie: "SRV-2026-0541", klant: "Ria Verhoeven" },
  { id:"3", omschrijving: "Materialen Gamma",         bedrag: 245,  methode: "creditcard", status: "geslaagd", richting: "uit", datum: "19 mei 2026", referentie: "INK-2026-0123" },
  { id:"4", omschrijving: "Schilderwerk Pietersen",   bedrag: 480,  methode: "bancontact", status: "wacht",   richting: "in",  datum: "18 mei 2026", referentie: "SRV-2026-0539", klant: "Kees Pietersen" },
  { id:"5", omschrijving: "Terugbetaling klant",      bedrag: 120,  methode: "bankoverschrijving", status: "teruggestort", richting: "uit", datum: "15 mei 2026", referentie: "SRV-2026-0510" },
  { id:"6", omschrijving: "Elektra Jansen",           bedrag: 320,  methode: "ideal",    status: "geslaagd", richting: "in",  datum: "12 mei 2026",  referentie: "SRV-2026-0498", klant: "Piet Jansen" },
];

function fmtEuro(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function BetalingenPage() {
  const router = useRouter();
  const [trans] = useState<Transactie[]>(TRANS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overzicht" | "methodes" | "qr">("overzicht");
  const [betalingBedrag, setBetalingBedrag] = useState("");
  const [gekozenMethode, setGekozenMethode] = useState<BetaalMethode>("ideal");

  const stats = useMemo(() => ({
    ontvangen: trans.filter(t => t.richting === "in" && t.status === "geslaagd").reduce((s, t) => s + t.bedrag, 0),
    uitgegeven: trans.filter(t => t.richting === "uit" && t.status === "geslaagd").reduce((s, t) => s + t.bedrag, 0),
    wacht: trans.filter(t => t.status === "wacht").reduce((s, t) => s + t.bedrag, 0),
  }), [trans]);

  const selected = trans.find(t => t.id === selectedId) ?? null;

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
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Betalingen</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>iDEAL · Bancontact · Mollie</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Balance */}
        <div className="rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", boxShadow: "0 12px 40px rgba(15,23,42,0.35)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Maand omzet</p>
          <p className="font-black text-white mt-1" style={{ fontSize: 36, letterSpacing: "-0.03em" }}>
            €{fmtEuro(stats.ontvangen)}
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { l: "Ontvangen",  v: `€${fmtEuro(stats.ontvangen)}`,  c: "#4ade80" },
              { l: "Uitgegeven", v: `€${fmtEuro(stats.uitgegeven)}`, c: "#f87171" },
              { l: "In wacht",   v: `€${fmtEuro(stats.wacht)}`,      c: "#fbbf24" },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <span className="font-black text-sm" style={{ color: s.c }}>{s.v}</span>
                <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 rounded-2xl gap-1" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          {([["overzicht","Transacties"], ["methodes","Methodes"], ["qr","QR Betaling"]] as const).map(([key, label]) => (
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

        {/* Tab: Transacties */}
        {activeTab === "overzicht" && (
          <div className="flex flex-col gap-3">
            {trans.map(t => {
              const sCfg = STATUS_CFG[t.status];
              const mCfg = METHODE_CFG[t.methode];
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className="touch-scale w-full rounded-3xl p-4 text-left"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: mCfg.bg }}>
                      {mCfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{t.omschrijving}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{t.datum} · {mCfg.label}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-black text-base"
                        style={{ color: t.richting === "in" ? "#059669" : "#DC2626" }}>
                        {t.richting === "in" ? "+" : "-"}€{fmtEuro(t.bedrag)}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                        style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab: Methodes */}
        {activeTab === "methodes" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold leading-relaxed" style={{ color: "#64748b" }}>
              Servr gebruikt Mollie als betaalverwerker. Alle methodes zijn beschikbaar voor klanten in Nederland en België.
            </p>
            {(Object.keys(METHODE_CFG) as BetaalMethode[]).map(methode => {
              const cfg = METHODE_CFG[methode];
              return (
                <div key={methode} className="flex items-center gap-3 p-4 rounded-3xl"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{cfg.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{cfg.desc}</p>
                  </div>
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#ECFDF5" }}>
                    <Check size={11} style={{ color: "#059669" }} />
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl p-4" style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}>
              <div className="flex items-start gap-2">
                <Shield size={16} style={{ color: "#4F46E5" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm" style={{ color: "#3730A3" }}>Beveiligd door Mollie</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#4338CA" }}>
                    Alle betalingen worden verwerkt via Mollie, een gecertificeerde Europese betaalverwerker (PCI-DSS Level 1).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: QR */}
        {activeTab === "qr" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl p-5 flex flex-col items-center gap-4"
              style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Bedrag instellen</p>
              <div className="flex items-center gap-2">
                <span className="font-black text-3xl" style={{ color: "#4F46E5" }}>€</span>
                <input type="number" inputMode="decimal"
                  value={betalingBedrag}
                  onChange={e => setBetalingBedrag(e.target.value)}
                  placeholder="0,00"
                  className="font-black text-4xl outline-none w-40 text-center"
                  style={{ color: "#0f172a", background: "transparent" }} />
              </div>
              {/* QR Placeholder */}
              <div className="w-48 h-48 rounded-3xl flex items-center justify-center"
                style={{ background: "#F8FAFF", border: "2px dashed #C7D2FE" }}>
                <div className="flex flex-col items-center gap-3">
                  <QrCode size={48} style={{ color: "#4F46E5" }} />
                  <p className="text-xs font-medium text-center" style={{ color: "#94a3b8" }}>
                    {betalingBedrag ? `QR voor €${betalingBedrag}` : "Voer bedrag in"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {(["ideal", "bancontact"] as BetaalMethode[]).map(m => {
                  const cfg = METHODE_CFG[m];
                  return (
                    <button key={m} onClick={() => setGekozenMethode(m)}
                      className="touch-scale py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{
                        background: gekozenMethode === m ? cfg.kleur : cfg.bg,
                        color: gekozenMethode === m ? "#fff" : cfg.kleur,
                        border: `2px solid ${cfg.kleur}40`,
                      }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <button className="touch-scale w-full py-4 rounded-2xl font-black text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                <Zap size={16} className="inline mr-2" />
                Betaallink genereren
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction detail ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[85dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>Transactiedetails</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              <div className="rounded-3xl p-5 text-center"
                style={{ background: selected.richting === "in" ? "#ECFDF5" : "#FEF2F2" }}>
                <p className="font-black" style={{ fontSize: 40, color: selected.richting === "in" ? "#059669" : "#DC2626" }}>
                  {selected.richting === "in" ? "+" : "-"}€{fmtEuro(selected.bedrag)}
                </p>
                <p className="font-semibold text-sm mt-1" style={{ color: "#374151" }}>{selected.omschrijving}</p>
                <span className="text-xs font-black px-3 py-1 rounded-xl mt-2 inline-block"
                  style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color }}>
                  {STATUS_CFG[selected.status].label}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                {[
                  { l: "Datum",        v: selected.datum },
                  { l: "Methode",      v: METHODE_CFG[selected.methode].label },
                  { l: "Referentie",   v: selected.referentie },
                  ...(selected.klant ? [{ l: "Klant", v: selected.klant }] : []),
                ].map((row, i, arr) => (
                  <div key={row.l} className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{row.l}</p>
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{row.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
