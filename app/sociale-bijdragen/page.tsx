"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Shield, Calendar, Euro, Check,
  AlertTriangle, ChevronDown, Info, TrendingUp,
  X, Clock, Building2,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import type { Land } from "@/lib/store";

// ─── Country config ───────────────────────────────────────────────────────────
type Kwartaal = { label: string; vervaldatum: string; maanden: number[] };
type Fonds = { naam: string; tarief: number; basis: "winst" | "omzet" | "vast"; vastBedrag?: number; info: string };

type LandSBConfig = {
  naam: string;
  vlag: string;
  instantie: string;
  instantieUrl: string;
  fondsen: Fonds[];
  kwartalen: Kwartaal[];
  drempel?: number;          // Under this net income = reduced contribution
  drempelTarief?: number;
  maxBasis?: number;         // Max contribution basis
  opmerkingen: string[];
};

const LAND_SB: Record<Land, LandSBConfig> = {
  NL: {
    naam: "Nederland",
    vlag: "🇳🇱",
    instantie: "Belastingdienst (ZVW)",
    instantieUrl: "https://www.belastingdienst.nl",
    fondsen: [
      { naam: "Inkomensafhankelijke bijdrage ZVW",  tarief: 0.0543, basis: "winst", info: "5,43% over winst uit onderneming (max €71.628 grondslag)" },
      { naam: "Inkomstenbelasting (voorlopige aanslag)", tarief: 0.0,   basis: "winst", info: "Wordt apart berekend via boekhouding" },
    ],
    kwartalen: [
      { label: "1e kwartaal", vervaldatum: "2026-04-30", maanden: [1,2,3] },
      { label: "2e kwartaal", vervaldatum: "2026-07-31", maanden: [4,5,6] },
      { label: "3e kwartaal", vervaldatum: "2026-10-31", maanden: [7,8,9] },
      { label: "4e kwartaal", vervaldatum: "2027-01-31", maanden: [10,11,12] },
    ],
    maxBasis: 71628,
    opmerkingen: [
      "ZZP'ers betalen geen aparte pensioenpremie via de Belastingdienst",
      "Zorg voor je eigen AOV (arbeidsongeschiktheidsverzekering)",
      "Reserveer ook voor IB via de belastingmodule",
    ],
  },
  BE: {
    naam: "België",
    vlag: "🇧🇪",
    instantie: "Sociale verzekeringskas",
    instantieUrl: "https://www.rsvz.be",
    fondsen: [
      { naam: "Voorlopige bijdrage (start)",       tarief: 0.0, basis: "vast", vastBedrag: 883.76, info: "Voorlopige kwartaalbijdrage eerste 3 jaar: €883,76/kwartaal" },
      { naam: "Definitieve bijdrage (20,5%)",      tarief: 0.205, basis: "winst", info: "20,5% op netto belastbaar beroepsinkomen. Minimum €905/jaar." },
      { naam: "Ziekteverzekering (klein risico)",  tarief: 0.0, basis: "vast", vastBedrag: 98.50, info: "Kwartaalbijdrage kleine risico's: ~€98,50 (bij lage inkomens vrijgesteld)" },
    ],
    kwartalen: [
      { label: "1e kwartaal", vervaldatum: "2026-03-31", maanden: [1,2,3] },
      { label: "2e kwartaal", vervaldatum: "2026-06-30", maanden: [4,5,6] },
      { label: "3e kwartaal", vervaldatum: "2026-09-30", maanden: [7,8,9] },
      { label: "4e kwartaal", vervaldatum: "2026-12-31", maanden: [10,11,12] },
    ],
    drempel: 17524,
    opmerkingen: [
      "Eerste 3 jaar: voorlopige bijdragen op basis van minimumdrempel",
      "Na 3 jaar: definitieve afrekening op basis van werkelijk inkomen",
      "Kies een erkende sociale verzekeringskas (Acerta, Xerius, Liantis…)",
      "Startersvrijstelling mogelijk bij nieuwe zelfstandige activiteit",
    ],
  },
  DE: {
    naam: "Deutschland",
    vlag: "🇩🇪",
    instantie: "Deutsche Rentenversicherung / Krankenkasse",
    instantieUrl: "https://www.drv.de",
    fondsen: [
      { naam: "Krankenversicherung",  tarief: 0.148, basis: "winst", info: "14,8% Krankenversicherung (GKV) op bruto-inkomen. Sommige zelfstandigen vrijgesteld." },
      { naam: "Rentenversicherung",   tarief: 0.186, basis: "winst", info: "18,6% rentenversicherung (verplicht voor bepaalde beroepen)" },
      { naam: "Pflegeversicherung",   tarief: 0.036, basis: "winst", info: "3,6% verpleegverzekering (3,9% zonder kinderen)" },
    ],
    kwartalen: [
      { label: "1. Quartal", vervaldatum: "2026-03-15", maanden: [1,2,3] },
      { label: "2. Quartal", vervaldatum: "2026-06-15", maanden: [4,5,6] },
      { label: "3. Quartal", vervaldatum: "2026-09-15", maanden: [7,8,9] },
      { label: "4. Quartal", vervaldatum: "2026-12-15", maanden: [10,11,12] },
    ],
    maxBasis: 96600,
    opmerkingen: [
      "Krankenkasse: keuze vrij tussen GKV of private Krankenversicherung (PKV)",
      "PKV kan goedkoper zijn voor hogere inkomens",
      "Künstlersozialkasse (KSK) voor kunstenaars/creatieven",
    ],
  },
  FR: {
    naam: "France",
    vlag: "🇫🇷",
    instantie: "URSSAF / SSI",
    instantieUrl: "https://www.urssaf.fr",
    fondsen: [
      { naam: "Maladie-maternité",     tarief: 0.068, basis: "winst", info: "6,8% ziekte/moederschapsverzekering" },
      { naam: "Allocations familiales", tarief: 0.022, basis: "winst", info: "2,2% gezinstoeslagen" },
      { naam: "Retraite de base",       tarief: 0.1775, basis: "winst", info: "17,75% basispensioen" },
      { naam: "Retraite complémentaire",tarief: 0.07,  basis: "winst", info: "7% aanvullend pensioen" },
      { naam: "Invalidité-décès",       tarief: 0.013, basis: "winst", info: "1,3% invaliditeit/overlijden" },
      { naam: "Formation professionnelle", tarief: 0.0025, basis: "winst", info: "0,25% beroepsopleiding" },
    ],
    kwartalen: [
      { label: "1er trimestre", vervaldatum: "2026-05-05", maanden: [1,2,3] },
      { label: "2e trimestre",  vervaldatum: "2026-08-05", maanden: [4,5,6] },
      { label: "3e trimestre",  vervaldatum: "2026-11-05", maanden: [7,8,9] },
      { label: "4e trimestre",  vervaldatum: "2027-02-05", maanden: [10,11,12] },
    ],
    opmerkingen: [
      "Micro-entrepreneur: forfaitaire tarieven (12,3% diensten, 6,4% verkoop)",
      "Régime réel: werkelijke bijdragen op nettowinst (~45% totaal)",
      "ACRE vrijstelling eerste jaar voor nieuwe zelfstandigen",
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number, dec = 0) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: dec }).format(n);
}

function dagenTot(iso: string): number {
  const target = new Date(iso);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function urgentieKleur(dagen: number) {
  if (dagen < 0)   return "#EF4444";
  if (dagen < 14)  return "#EF4444";
  if (dagen < 30)  return "#F59E0B";
  return "#10B981";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SocialeBijdragenPage() {
  const router = useRouter();
  const land = useUserStore((s) => s.land);
  const setLandStore = useUserStore((s) => s.setLand);

  const [jaarWinst, setJaarWinst] = useState(42000);
  const [betaald, setBetaald] = useState<string[]>(["2026-04-30"]); // kvartaal vervaldatums betaald
  const [showInfo, setShowInfo] = useState<string | null>(null);
  const [showLandPicker, setShowLandPicker] = useState(false);

  const cfg = LAND_SB[land];

  // ── Berekeningen ─────────────────────────────────────────────────────────────
  const berekenBijdrage = useMemo(() => {
    const basis = Math.min(jaarWinst, cfg.maxBasis ?? jaarWinst);
    let totaal = 0;
    const breakdown: { naam: string; bedrag: number; tarief: number; info: string }[] = [];

    for (const fonds of cfg.fondsen) {
      let bedrag = 0;
      if (fonds.basis === "winst") {
        bedrag = Math.round(basis * fonds.tarief);
      } else if (fonds.basis === "vast" && fonds.vastBedrag) {
        bedrag = fonds.vastBedrag * 4; // 4 kwartalen
      }
      if (bedrag > 0) {
        totaal += bedrag;
        breakdown.push({ naam: fonds.naam, bedrag, tarief: fonds.tarief, info: fonds.info });
      }
    }

    const perKwartaal = Math.round(totaal / 4);
    const perMaand = Math.round(totaal / 12);

    return { totaal, perKwartaal, perMaand, breakdown };
  }, [jaarWinst, cfg, land]);

  const currentMonth = new Date().getMonth() + 1;
  const currentKwartaal = Math.ceil(currentMonth / 3);

  const toggleBetaald = (datum: string) => {
    setBetaald((prev) =>
      prev.includes(datum) ? prev.filter((d) => d !== datum) : [...prev, datum]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Sociale bijdragen</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Verplichte afdrachten als zelfstandige</p>
          </div>
          <button onClick={() => setShowLandPicker(true)}
            className="touch-scale flex items-center gap-2 px-3 py-2 rounded-2xl font-bold text-sm"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", color: "#374151" }}>
            <span className="font-black">{land}</span>
            <ChevronDown size={14} style={{ color: "#94a3b8" }} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">
        {/* Instantie badge */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <Building2 size={20} style={{ color: "#4F46E5" }} />
          <div>
            <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{cfg.instantie}</p>
            <p className="text-xs" style={{ color: "#6366F1" }}>{cfg.naam} — sociale zekerheid zelfstandigen</p>
          </div>
        </div>

        {/* Inkomen slider */}
        <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="font-bold text-sm mb-1" style={{ color: "#0f172a" }}>Geschatte jaarwinst</p>
          <p className="text-xs mb-4" style={{ color: "#64748b" }}>Netto belastbaar beroepsinkomen</p>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1 rounded-2xl px-4 py-3"
              style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
              <Euro size={16} style={{ color: "#94a3b8" }} />
              <input type="number" value={jaarWinst}
                onChange={(e) => setJaarWinst(Math.max(0, Number(e.target.value)))}
                className="flex-1 bg-transparent text-xl font-black"
                style={{ color: "#0f172a", outline: "none" }} />
              <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>/jaar</span>
            </div>
          </div>

          <input type="range" min={0} max={150000} step={1000} value={jaarWinst}
            onChange={(e) => setJaarWinst(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "#4F46E5", background: `linear-gradient(to right, #4F46E5 ${(jaarWinst/150000)*100}%, #E2E8F0 0%)` }} />

          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "#94a3b8" }}>€0</span>
            <span className="text-xs" style={{ color: "#94a3b8" }}>€150.000</span>
          </div>
        </div>

        {/* Totaaloverzicht */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Per jaar</p>
            <p className="font-black text-lg leading-tight" style={{ color: "#EF4444" }}>
              {fmtEur(berekenBijdrage.totaal)}
            </p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Per kwartaal</p>
            <p className="font-black text-lg leading-tight" style={{ color: "#F59E0B" }}>
              {fmtEur(berekenBijdrage.perKwartaal)}
            </p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Per maand</p>
            <p className="font-black text-lg leading-tight" style={{ color: "#4F46E5" }}>
              {fmtEur(berekenBijdrage.perMaand)}
            </p>
          </div>
        </div>

        {/* Kwartaaloverzicht */}
        <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Kwartaalplanning {new Date().getFullYear()}</p>
          <div className="flex flex-col gap-3">
            {cfg.kwartalen.map((kw, i) => {
              const isPaid = betaald.includes(kw.vervaldatum);
              const dagen = dagenTot(kw.vervaldatum);
              const isCurrent = i + 1 === currentKwartaal;
              const kleur = isPaid ? "#10B981" : urgentieKleur(dagen);
              return (
                <div key={kw.label}
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{
                    background: isCurrent && !isPaid ? "#FFFBEB" : "#F8FAFC",
                    border: isCurrent && !isPaid ? "1.5px solid #FDE68A" : "1.5px solid transparent",
                  }}>
                  <button onClick={() => toggleBetaald(kw.vervaldatum)}
                    className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isPaid ? "#ECFDF5" : "#F3F4F6" }}>
                    {isPaid
                      ? <Check size={16} style={{ color: "#10B981" }} />
                      : <div className="w-4 h-4 rounded border-2" style={{ borderColor: "#CBD5E1" }} />
                    }
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{kw.label}</p>
                      {isCurrent && !isPaid && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "#FEF3C7", color: "#D97706" }}>
                          Huidig
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      Uiterlijk {new Date(kw.vervaldatum).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                      {!isPaid && ` · nog ${Math.max(0, dagen)} dagen`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: isPaid ? "#10B981" : kleur }}>
                      {fmtEur(berekenBijdrage.perKwartaal)}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: isPaid ? "#10B981" : kleur }}>
                      {isPaid ? "✓ Betaald" : dagen < 0 ? "Verlopen" : dagen === 0 ? "Vandaag!" : `${dagen}d`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown per fonds */}
        <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Uitsplitsing bijdragen</p>
          {berekenBijdrage.breakdown.map((item, i) => (
            <div key={i} className="mb-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{item.naam}</p>
                    <button onClick={() => setShowInfo(showInfo === item.naam ? null : item.naam)}
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "#F3F4F6" }}>
                      <Info size={10} style={{ color: "#94a3b8" }} />
                    </button>
                  </div>
                  {showInfo === item.naam && (
                    <p className="text-xs mt-1 leading-relaxed p-2 rounded-xl"
                      style={{ background: "#F0F9FF", color: "#0369A1" }}>
                      {item.info}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{fmtEur(item.bedrag)}/j</p>
                  {item.tarief > 0 && (
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{(item.tarief * 100).toFixed(1)}%</p>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#F1F5F9" }}>
                <div className="h-1.5 rounded-full"
                  style={{ width: `${(item.bedrag / berekenBijdrage.totaal) * 100}%`, background: "#4F46E5" }} />
              </div>
            </div>
          ))}

          {/* Totaalregel */}
          <div className="mt-4 pt-4 flex justify-between items-center"
            style={{ borderTop: "1.5px solid #F1F5F9" }}>
            <p className="font-bold" style={{ color: "#0f172a" }}>Totaal jaar</p>
            <p className="font-black text-xl" style={{ color: "#EF4444" }}>
              {fmtEur(berekenBijdrage.totaal)}
            </p>
          </div>

          {/* % van winst */}
          <div className="mt-2 rounded-2xl px-4 py-3 flex justify-between items-center"
            style={{ background: "#FEF2F2" }}>
            <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>% van jaarwinst</p>
            <p className="font-black" style={{ color: "#EF4444" }}>
              {jaarWinst > 0 ? `${Math.round((berekenBijdrage.totaal / jaarWinst) * 100)}%` : "—"}
            </p>
          </div>
        </div>

        {/* Reserveer tip */}
        <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} style={{ color: "#10B981" }} />
            <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Spaaradvies</p>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: "#ECFDF5" }}>
            <p className="text-sm font-bold" style={{ color: "#10B981" }}>
              Reserveer {fmtEur(berekenBijdrage.perMaand)}/maand
            </p>
            <p className="text-xs mt-1" style={{ color: "#374151" }}>
              Zet dit bedrag elke maand opzij voor je sociale bijdragen.
              Zo sta je nooit voor verrassingen bij je kwartaalbetaling.
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "#EEF2FF" }}>
            <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>
              Rekenregel: {jaarWinst > 0 ? Math.round((berekenBijdrage.totaal / jaarWinst) * 100) : 0}% opzijzetten
            </p>
            <p className="text-xs mt-1" style={{ color: "#374151" }}>
              Van elke {fmtEur(100)} die je verdient, reserveer je {fmtEur(jaarWinst > 0 ? (berekenBijdrage.totaal / jaarWinst) * 100 : 0)} voor sociale bijdragen.
            </p>
          </div>
        </div>

        {/* Land-specifieke opmerkingen */}
        <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p className="font-bold text-sm mb-3" style={{ color: "#0f172a" }}>
            {cfg.vlag} Informatie voor {cfg.naam}
          </p>
          <div className="flex flex-col gap-2">
            {cfg.opmerkingen.map((opm, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#EEF2FF" }}>
                  <Info size={10} style={{ color: "#4F46E5" }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{opm}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>
            De berekeningen zijn schattingen o.b.v. gepubliceerde tarieven. Raadpleeg altijd een erkende boekhouder
            of sociale verzekeringskas voor je definitieve bijdragen.
          </p>
        </div>
      </div>

      {/* ── Land picker ──────────────────────────────────────────────────────── */}
      {showLandPicker && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowLandPicker(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <h2 className="font-black text-lg mb-4" style={{ color: "#0f172a" }}>Kies land</h2>
              <div className="flex flex-col gap-2">
                {(["NL","BE","DE","FR"] as Land[]).map((l) => {
                  const c = LAND_SB[l];
                  return (
                    <button key={l}
                      onClick={() => { setLandStore(l); setShowLandPicker(false); }}
                      className="touch-scale flex items-center gap-3 p-4 rounded-2xl text-left"
                      style={{
                        background: land === l ? "#EEF2FF" : "#F8FAFC",
                        border: land === l ? "2px solid #4F46E5" : "2px solid transparent",
                      }}>
                      <span className="text-2xl">{c.vlag}</span>
                      <div>
                        <p className="font-bold" style={{ color: "#0f172a" }}>{c.naam}</p>
                        <p className="text-xs" style={{ color: "#64748b" }}>{c.instantie}</p>
                      </div>
                      {land === l && <Check size={18} style={{ color: "#4F46E5", marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
