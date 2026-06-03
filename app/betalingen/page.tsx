"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CreditCard, Check, X, Clock, ArrowUpRight,
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
  geslaagd:    { label: "Geslaagd",       color: "#2B4030", bg: "#2B403015" },
  wacht:       { label: "In behandeling", color: "#C97A4D", bg: "#C97A4D15" },
  mislukt:     { label: "Mislukt",        color: "#DC2626", bg: "#FEF2F2" },
  teruggestort:{ label: "Teruggestort",   color: "#5C5C56", bg: "#E5DDD0" },
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
              Betalingen
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
              iDEAL · Bancontact · Mollie
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5">

        {/* Stats grid */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
            Maand omzet
          </p>
          <p className="font-bold mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 32, color: "#2B4030" }}>
            €{fmtEuro(stats.ontvangen)}
          </p>
          <div className="grid grid-cols-3 gap-3" style={{ borderTop: "0.5px solid #E5DDD0", paddingTop: 12 }}>
            {[
              { l: "Ontvangen",  v: `€${fmtEuro(stats.ontvangen)}`,  c: "#2B4030" },
              { l: "Uitgegeven", v: `€${fmtEuro(stats.uitgegeven)}`, c: "#C97A4D" },
              { l: "In wacht",   v: `€${fmtEuro(stats.wacht)}`,      c: "#8A8A83" },
            ].map((s, i) => (
              <div key={s.l} className="flex flex-col items-center gap-0.5">
                {i > 0 && <div />}
                <span className="font-bold text-sm" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: s.c }}>
                  {s.v}
                </span>
                <span className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([["overzicht","Transacties"], ["methodes","Methodes"], ["qr","QR Betaling"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="touch-scale flex-1 py-2.5 rounded-full font-semibold text-xs transition-all"
              style={{
                fontFamily: "'Inter', sans-serif",
                background: activeTab === key ? "#2B4030" : "#FBF7F0",
                color: activeTab === key ? "#F5EFE5" : "#5C5C56",
                border: "0.5px solid #E5DDD0",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Transacties */}
        {activeTab === "overzicht" && (
          <div className="flex flex-col gap-2">
            {trans.map(t => {
              const sCfg = STATUS_CFG[t.status];
              const mCfg = METHODE_CFG[t.methode];
              return (
                <button key={t.id} onClick={() => setSelectedId(t.id)}
                  className="touch-scale w-full text-left"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: "#F5EFE5" }}>
                      {mCfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                        {t.omschrijving}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                        {t.datum} · {mCfg.label}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="font-bold text-base"
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: t.richting === "in" ? "#2B4030" : "#C97A4D" }}>
                        {t.richting === "in" ? "+" : "-"}€{fmtEuro(t.bedrag)}
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: sCfg.bg, color: sCfg.color, fontFamily: "'Inter', sans-serif" }}>
                        {sCfg.label}
                      </span>
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
            <p className="text-sm leading-relaxed" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
              Servr gebruikt Mollie als betaalverwerker. Alle methodes zijn beschikbaar voor klanten in Nederland en België.
            </p>
            {(Object.keys(METHODE_CFG) as BetaalMethode[]).map(methode => {
              const cfg = METHODE_CFG[methode];
              return (
                <div key={methode} className="flex items-center gap-3"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "#F5EFE5" }}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                      {cfg.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                      {cfg.desc}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#2B403015" }}>
                    <Check size={11} style={{ color: "#2B4030" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              <div className="flex items-start gap-2">
                <Shield size={16} style={{ color: "#2B4030" }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                    Beveiligd door Mollie
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
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
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}
              className="flex flex-col items-center gap-4">
              <p className="font-semibold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                Bedrag instellen
              </p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-3xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030" }}>€</span>
                <input type="number" inputMode="decimal"
                  value={betalingBedrag}
                  onChange={e => setBetalingBedrag(e.target.value)}
                  placeholder="0,00"
                  className="font-bold text-4xl outline-none w-40 text-center"
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", background: "transparent" }} />
              </div>
              <div className="w-48 h-48 rounded-2xl flex items-center justify-center"
                style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                <div className="flex flex-col items-center gap-3">
                  <QrCode size={48} style={{ color: "#2B4030" }} />
                  <p className="text-xs font-medium text-center" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                    {betalingBedrag ? `QR voor €${betalingBedrag}` : "Voer bedrag in"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {(["ideal", "bancontact"] as BetaalMethode[]).map(m => {
                  const cfg = METHODE_CFG[m];
                  return (
                    <button key={m} onClick={() => setGekozenMethode(m)}
                      className="touch-scale py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        background: gekozenMethode === m ? "#2B4030" : "transparent",
                        color: gekozenMethode === m ? "#F5EFE5" : "#5C5C56",
                        border: "0.5px solid #E5DDD0",
                      }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <button className="touch-scale w-full py-4 rounded-full font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none", fontFamily: "'Inter', sans-serif" }}>
                <Zap size={16} />
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
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A" }}>
                  Transactiedetails
                </h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={16} style={{ color: "#5C5C56" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              <div className="rounded-2xl p-5 text-center"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                <p className="font-bold" style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 36,
                  color: selected.richting === "in" ? "#2B4030" : "#C97A4D",
                }}>
                  {selected.richting === "in" ? "+" : "-"}€{fmtEuro(selected.bedrag)}
                </p>
                <p className="font-medium text-sm mt-1" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>
                  {selected.omschrijving}
                </p>
                <span className="text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-block"
                  style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color, fontFamily: "'Inter', sans-serif" }}>
                  {STATUS_CFG[selected.status].label}
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                {[
                  { l: "Datum",        v: selected.datum },
                  { l: "Methode",      v: METHODE_CFG[selected.methode].label },
                  { l: "Referentie",   v: selected.referentie },
                  ...(selected.klant ? [{ l: "Klant", v: selected.klant }] : []),
                ].map((row, i, arr) => (
                  <div key={row.l} className="flex items-center justify-between px-4 py-3.5"
                    style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #E5DDD0" : "none" }}>
                    <p className="text-xs font-semibold" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{row.l}</p>
                    <p className="text-sm font-medium" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>{row.v}</p>
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
