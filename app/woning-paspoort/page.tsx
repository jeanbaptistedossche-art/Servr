"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Home, Zap, Droplets, Flame, Wrench,
  Plus, Edit3, Check, X, ChevronRight, Calendar,
  FileText, Shield, Star, Camera, MapPin, Ruler,
  Building2, Thermometer, Sun, BarChart3, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type WoningType = "appartement" | "tussenwoning" | "hoekwoning" | "twee_onder_een_kap" | "vrijstaand";
type EpcLabel = "A+++" | "A++" | "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G";
type VerbouwingCategorie = "sanitair" | "elektra" | "verwarming" | "isolatie" | "dak" | "gevel" | "vloer" | "tuin" | "overig";

type Installatie = {
  id: string;
  naam: string;
  merk: string;
  bouwjaar: number;
  lastService?: string;  // ISO date
  nextService?: string;
  notities?: string;
  icon: string;
};

type Verbouwing = {
  id: string;
  datum: string;
  titel: string;
  categorie: VerbouwingCategorie;
  vakman: string;
  bedrag: number;
  garantieTot?: string;
  foto?: string;
  notities?: string;
};

type WoningInfo = {
  adres: string;
  postcode: string;
  stad: string;
  type: WoningType;
  bouwjaar: number;
  oppervlak: number;   // m²
  perceel?: number;
  slaapkamers: number;
  badkamers: number;
  verdiepingen: number;
  epcLabel: EpcLabel;
  energieScore?: number;
  foto?: string;
  notities?: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const WONING_TYPE_LABELS: Record<WoningType, string> = {
  appartement: "Appartement",
  tussenwoning: "Tussenwoning",
  hoekwoning: "Hoekwoning",
  twee_onder_een_kap: "2-onder-1-kap",
  vrijstaand: "Vrijstaand",
};

const EPC_COLORS: Record<EpcLabel, { bg: string; color: string }> = {
  "A+++": { bg: "#064E3B", color: "#fff" },
  "A++":  { bg: "#065F46", color: "#fff" },
  "A+":   { bg: "#047857", color: "#fff" },
  "A":    { bg: "#059669", color: "#fff" },
  "B":    { bg: "#10B981", color: "#fff" },
  "C":    { bg: "#6EE7B7", color: "#065F46" },
  "D":    { bg: "#FCD34D", color: "#78350F" },
  "E":    { bg: "#FBBF24", color: "#78350F" },
  "F":    { bg: "#F97316", color: "#fff" },
  "G":    { bg: "#EF4444", color: "#fff" },
};

const CAT_CFG: Record<VerbouwingCategorie, { icon: string; color: string; bg: string }> = {
  sanitair:    { icon: "🚿", color: "#0EA5E9", bg: "#F0F9FF" },
  elektra:     { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB" },
  verwarming:  { icon: "🔥", color: "#EF4444", bg: "#FEF2F2" },
  isolatie:    { icon: "🏠", color: "#8B5CF6", bg: "#F5F3FF" },
  dak:         { icon: "🏚️", color: "#6B7280", bg: "#F9FAFB" },
  gevel:       { icon: "🧱", color: "#92400E", bg: "#FFFBEB" },
  vloer:       { icon: "🪵", color: "#B45309", bg: "#FEF3C7" },
  tuin:        { icon: "🌿", color: "#10B981", bg: "#ECFDF5" },
  overig:      { icon: "🔧", color: "#64748b", bg: "#F1F5F9" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_INFO: WoningInfo = {
  adres: "Kerkstraat 45",
  postcode: "1017 GB",
  stad: "Amsterdam",
  type: "tussenwoning",
  bouwjaar: 1923,
  oppervlak: 112,
  perceel: 85,
  slaapkamers: 3,
  badkamers: 1,
  verdiepingen: 3,
  epcLabel: "C",
  energieScore: 148,
  notities: "Monument pand, geen grote wijzigingen zonder vergunning.",
};

const INIT_INSTALLATIES: Installatie[] = [
  { id: "i1", naam: "CV Ketel", merk: "Nefit Trendline 30", bouwjaar: 2019, lastService: "2024-11-15", nextService: "2025-11-15", notities: "Jaarlijks service Remmerswaal Installaties", icon: "🔥" },
  { id: "i2", naam: "Warmwaterboiler", merk: "AO Smith 120L", bouwjaar: 2021, lastService: "2025-01-10", nextService: "2026-01-10", icon: "💧" },
  { id: "i3", naam: "Groepenkast", merk: "Hager 3-fase", bouwjaar: 2018, notities: "16 groepen, zonnepanelen aangesloten op groep 12", icon: "⚡" },
  { id: "i4", naam: "Zonnepanelen", merk: "SunPower 8x 400W", bouwjaar: 2022, lastService: "2025-03-20", nextService: "2026-03-20", notities: "Omvormer: SolarEdge SE3000H", icon: "☀️" },
  { id: "i5", naam: "Ventilatiesysteem", merk: "Zehnder ComfoAir Q350", bouwjaar: 2022, lastService: "2025-02-05", nextService: "2025-08-05", icon: "💨" },
];

const INIT_VERBOUWINGEN: Verbouwing[] = [
  { id: "v1", datum: "2025-03-15", titel: "Badkamer renovatie", categorie: "sanitair", vakman: "Loodgieter de Vries", bedrag: 8400, garantieTot: "2035-03-15", notities: "Volledig vernieuwd, nieuwe vloer- en wandtegels, inloopdouche, toilet en wastafel." },
  { id: "v2", datum: "2024-09-20", titel: "Keuken vervangen", categorie: "overig", vakman: "Keukenstudio Ams", bedrag: 15200, garantieTot: "2034-09-20" },
  { id: "v3", datum: "2024-04-08", titel: "Dakisolatie spouwmuur", categorie: "isolatie", vakman: "IsolatieXpert", bedrag: 3200, garantieTot: "2044-04-08" },
  { id: "v4", datum: "2023-11-12", titel: "Zonnepanelen + omvormer", categorie: "elektra", vakman: "Zonnestroom BV", bedrag: 9800, garantieTot: "2048-11-12" },
  { id: "v5", datum: "2022-07-01", titel: "Vloerverwarming begane grond", categorie: "verwarming", vakman: "Warmtespecialist", bedrag: 4600, garantieTot: "2032-07-01" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type Tab = "overzicht" | "installaties" | "verbouwingen" | "documenten";

export default function WoningPaspoortPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overzicht");
  const [info] = useState<WoningInfo>(INIT_INFO);
  const [installaties, setInstallaties] = useState<Installatie[]>(INIT_INSTALLATIES);
  const [verbouwingen] = useState<Verbouwing[]>(INIT_VERBOUWINGEN);
  const [showDetail, setShowDetail] = useState<Verbouwing | null>(null);
  const [showInstDetail, setShowInstDetail] = useState<Installatie | null>(null);
  const [editMode, setEditMode] = useState(false);

  const totaalInvest = useMemo(() => verbouwingen.reduce((s, v) => s + v.bedrag, 0), [verbouwingen]);
  const actieveGaranties = useMemo(() =>
    verbouwingen.filter(v => v.garantieTot && new Date(v.garantieTot) > new Date()).length,
    [verbouwingen]);
  const serviceNodig = useMemo(() =>
    installaties.filter(i => i.nextService && daysUntil(i.nextService) < 60).length,
    [installaties]);

  const epc = EPC_COLORS[info.epcLabel];

  const TABS: { key: Tab; label: string }[] = [
    { key: "overzicht",    label: "Overzicht" },
    { key: "installaties", label: "Installaties" },
    { key: "verbouwingen", label: "Verbouwingen" },
    { key: "documenten",   label: "Documenten" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Woning Paspoort</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>{info.adres} · {info.stad}</p>
          </div>
          <button onClick={() => setEditMode(v => !v)}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: editMode ? "#4F46E5" : "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <Edit3 size={18} style={{ color: editMode ? "#fff" : "#0f172a" }} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all"
              style={{
                background: tab === t.key ? "#4F46E5" : "#fff",
                color: tab === t.key ? "#fff" : "#64748b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {/* ── OVERZICHT ──────────────────────────────────────────────────────── */}
        {tab === "overzicht" && (
          <>
            {/* Hero card */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
              {/* Gradient header */}
              <div className="px-5 pt-5 pb-4"
                style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white text-opacity-80 text-xs font-semibold mb-1"
                      style={{ color: "rgba(255,255,255,0.8)" }}>
                      {WONING_TYPE_LABELS[info.type]} · {info.bouwjaar}
                    </p>
                    <h2 className="text-white font-black text-xl">{info.adres}</h2>
                    <p className="text-sm font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {info.postcode} {info.stad}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(255,255,255,0.2)" }}>
                    🏠
                  </div>
                </div>

                {/* EPC badge */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black"
                    style={{ background: epc.bg, color: epc.color }}>
                    Energielabel {info.epcLabel}
                  </span>
                  {info.energieScore && (
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {info.energieScore} kWh/m²·jaar
                    </span>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 divide-x" style={{ borderTop: "1px solid #F1F5F9" }}>
                {[
                  { label: "m²", value: info.oppervlak, icon: "📐" },
                  { label: "kamers", value: info.slaapkamers, icon: "🛏️" },
                  { label: "badkamers", value: info.badkamers, icon: "🚿" },
                  { label: "lagen", value: info.verdiepingen, icon: "🏢" },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center py-3 gap-0.5">
                    <span className="text-base">{s.icon}</span>
                    <span className="font-black text-base" style={{ color: "#0f172a" }}>{s.value}</span>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl p-3 flex flex-col gap-1"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Wrench size={18} style={{ color: "#4F46E5" }} />
                <p className="font-black text-xl" style={{ color: "#0f172a" }}>{verbouwingen.length}</p>
                <p className="text-xs leading-tight" style={{ color: "#94a3b8" }}>verbouwingen</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col gap-1"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Shield size={18} style={{ color: "#10B981" }} />
                <p className="font-black text-xl" style={{ color: "#0f172a" }}>{actieveGaranties}</p>
                <p className="text-xs leading-tight" style={{ color: "#94a3b8" }}>garanties actief</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col gap-1"
                style={{ background: serviceNodig > 0 ? "#FEF2F2" : "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Clock size={18} style={{ color: serviceNodig > 0 ? "#EF4444" : "#F59E0B" }} />
                <p className="font-black text-xl" style={{ color: serviceNodig > 0 ? "#EF4444" : "#0f172a" }}>{serviceNodig}</p>
                <p className="text-xs leading-tight" style={{ color: "#94a3b8" }}>service nodig</p>
              </div>
            </div>

            {/* Totaal investering */}
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <div>
                <p className="text-xs font-bold" style={{ color: "#4F46E5" }}>Totaal geïnvesteerd</p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>Verbouwingen & renovaties</p>
              </div>
              <p className="font-black text-xl" style={{ color: "#4F46E5" }}>{fmtEur(totaalInvest)}</p>
            </div>

            {/* Notities */}
            {info.notities && (
              <div className="rounded-2xl p-4"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#D97706" }}>📝 Notities</p>
                <p className="text-sm" style={{ color: "#374151" }}>{info.notities}</p>
              </div>
            )}

            {/* Recente verbouwingen */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#94a3b8" }}>
                Recente verbouwingen
              </p>
              <div className="flex flex-col gap-2">
                {verbouwingen.slice(0, 3).map(v => {
                  const cat = CAT_CFG[v.categorie];
                  return (
                    <div key={v.id} onClick={() => setShowDetail(v)}
                      className="touch-scale rounded-2xl p-3 flex items-center gap-3 cursor-pointer"
                      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: cat.bg }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{v.titel}</p>
                        <p className="text-xs truncate" style={{ color: "#64748b" }}>{fmtDate(v.datum)} · {v.vakman}</p>
                      </div>
                      <p className="text-sm font-bold flex-shrink-0" style={{ color: "#4F46E5" }}>{fmtEur(v.bedrag)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── INSTALLATIES ───────────────────────────────────────────────────── */}
        {tab === "installaties" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                {installaties.length} installaties
              </p>
              {serviceNodig > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  ⚠️ {serviceNodig} binnenkort service
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {installaties.map(inst => {
                const soonService = inst.nextService && daysUntil(inst.nextService) < 60;
                const overdue = inst.nextService && daysUntil(inst.nextService) < 0;
                return (
                  <div key={inst.id} onClick={() => setShowInstDetail(inst)}
                    className="touch-scale rounded-2xl p-4 cursor-pointer"
                    style={{
                      background: "#fff",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                      border: overdue ? "1px solid #FCA5A5" : soonService ? "1px solid #FCD34D" : "1px solid transparent",
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "#F1F5F9" }}>
                        {inst.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{inst.naam}</p>
                          {overdue && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#FEF2F2", color: "#EF4444" }}>Verlopen</span>
                          )}
                          {!overdue && soonService && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: "#FFFBEB", color: "#D97706" }}>
                              {daysUntil(inst.nextService!)}d
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{inst.merk} · {inst.bouwjaar}</p>
                        {inst.nextService && (
                          <p className="text-xs mt-1" style={{ color: overdue ? "#EF4444" : soonService ? "#D97706" : "#10B981" }}>
                            🔧 Volgende service: {fmtDate(inst.nextService)}
                          </p>
                        )}
                      </div>
                    </div>
                    {inst.notities && (
                      <p className="text-xs mt-2 ml-15" style={{ color: "#94a3b8", paddingLeft: 60 }}>
                        {inst.notities.length > 80 ? inst.notities.slice(0, 80) + "…" : inst.notities}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {editMode && (
              <button className="touch-scale w-full py-3 rounded-2xl font-bold text-sm border-2 border-dashed flex items-center justify-center gap-2"
                style={{ borderColor: "#C7D2FE", color: "#4F46E5" }}>
                <Plus size={18} /> Installatie toevoegen
              </button>
            )}
          </>
        )}

        {/* ── VERBOUWINGEN ───────────────────────────────────────────────────── */}
        {tab === "verbouwingen" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                {verbouwingen.length} verbouwingen · {fmtEur(totaalInvest)} totaal
              </p>
            </div>

            {/* Timeline */}
            <div className="flex flex-col gap-3">
              {verbouwingen.map((v, idx) => {
                const cat = CAT_CFG[v.categorie];
                const garantieActief = v.garantieTot && new Date(v.garantieTot) > new Date();
                return (
                  <div key={v.id} onClick={() => setShowDetail(v)}
                    className="touch-scale rounded-2xl p-4 cursor-pointer"
                    style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: cat.bg }}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{v.titel}</p>
                          <p className="font-black text-sm flex-shrink-0" style={{ color: "#4F46E5" }}>{fmtEur(v.bedrag)}</p>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                          {fmtDate(v.datum)} · {v.vakman}
                        </p>
                        {garantieActief && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield size={10} style={{ color: "#10B981" }} />
                            <p className="text-xs font-semibold" style={{ color: "#10B981" }}>
                              Garantie t/m {fmtDate(v.garantieTot!)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {editMode && (
              <button className="touch-scale w-full py-3 rounded-2xl font-bold text-sm border-2 border-dashed flex items-center justify-center gap-2"
                style={{ borderColor: "#C7D2FE", color: "#4F46E5" }}>
                <Plus size={18} /> Verbouwing toevoegen
              </button>
            )}
          </>
        )}

        {/* ── DOCUMENTEN ─────────────────────────────────────────────────────── */}
        {tab === "documenten" && (
          <>
            <div className="rounded-2xl p-4 flex gap-3"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <FileText size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Documenten kluis</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                  Bewaar alle woning-gerelateerde documenten in de beveiligde documenten kluis.
                </p>
              </div>
            </div>

            {[
              { icon: "🏠", titel: "Koopakte + notarisakte", datum: "2018-06-15", type: "Juridisch" },
              { icon: "⚡", titel: "Energielabel certificaat", datum: "2022-11-30", type: "Energie" },
              { icon: "🔧", titel: "Garantiecertificaat badkamer", datum: "2025-03-15", type: "Garantie" },
              { icon: "☀️", titel: "Installatierapport zonnepanelen", datum: "2023-11-12", type: "Technisch" },
              { icon: "🏚️", titel: "Omgevingsvergunning dakkapel", datum: "2021-04-20", type: "Vergunning" },
            ].map((doc, idx) => (
              <div key={idx} className="touch-scale rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "#F8FAFC" }}>
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{doc.titel}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{fmtDate(doc.datum)}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: "#F1F5F9", color: "#64748b" }}>
                  {doc.type}
                </span>
              </div>
            ))}

            <button onClick={() => router.push("/documenten-kluis")}
              className="touch-scale w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <FileText size={16} /> Alle documenten bekijken
            </button>
          </>
        )}
      </div>

      {/* ── Detail sheet: Verbouwing ─────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "80dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-2">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: CAT_CFG[showDetail.categorie].bg }}>
                  {CAT_CFG[showDetail.categorie].icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showDetail.titel}</h2>
                  <p className="text-sm" style={{ color: "#64748b" }}>{showDetail.vakman}</p>
                </div>
                <p className="font-black text-xl flex-shrink-0" style={{ color: "#4F46E5" }}>{fmtEur(showDetail.bedrag)}</p>
              </div>

              <div className="flex flex-col gap-3 pb-6">
                {[
                  { label: "Datum", value: fmtDate(showDetail.datum) },
                  { label: "Categorie", value: showDetail.categorie.charAt(0).toUpperCase() + showDetail.categorie.slice(1) },
                  ...(showDetail.garantieTot ? [{ label: "Garantie t/m", value: fmtDate(showDetail.garantieTot) }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{row.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{row.value}</p>
                  </div>
                ))}

                {showDetail.notities && (
                  <div className="rounded-2xl p-3 mt-1" style={{ background: "#F8FAFC" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: "#94a3b8" }}>NOTITIES</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{showDetail.notities}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail sheet: Installatie ────────────────────────────────────────── */}
      {showInstDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowInstDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "80dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "#F1F5F9" }}>
                  {showInstDetail.icon}
                </div>
                <div>
                  <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showInstDetail.naam}</h2>
                  <p className="text-sm" style={{ color: "#64748b" }}>{showInstDetail.merk}</p>
                </div>
              </div>

              <div className="flex flex-col gap-0">
                {[
                  { label: "Merk / Model", value: showInstDetail.merk },
                  { label: "Bouwjaar", value: showInstDetail.bouwjaar.toString() },
                  ...(showInstDetail.lastService ? [{ label: "Laatste service", value: fmtDate(showInstDetail.lastService) }] : []),
                  ...(showInstDetail.nextService ? [{ label: "Volgende service", value: fmtDate(showInstDetail.nextService) }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3"
                    style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{row.label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{row.value}</p>
                  </div>
                ))}
              </div>

              {showInstDetail.notities && (
                <div className="rounded-2xl p-3 mt-3" style={{ background: "#F8FAFC" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#94a3b8" }}>NOTITIES</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{showInstDetail.notities}</p>
                </div>
              )}

              <button className="touch-scale w-full py-4 rounded-2xl font-bold text-sm mt-4 flex items-center justify-center gap-2"
                style={{ background: "#4F46E5", color: "#fff" }}>
                <Calendar size={16} /> Service inplannen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
