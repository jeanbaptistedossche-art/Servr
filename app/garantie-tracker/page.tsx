"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Plus, AlertTriangle, Check,
  Clock, FileText, Search, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type GarantieStatus = "geldig" | "verloopt_binnenkort" | "verlopen";
type GarantieCategorie = "sanitair" | "elektra" | "keuken" | "bouw" | "apparaat" | "schilderwerk" | "overig";

type Garantie = {
  id: string;
  product: string;
  categorie: GarantieCategorie;
  merk?: string;
  vakman: string;
  aanschafdatum: string;
  garantieTot: string;
  bedrag?: number;
  serienummer?: string;
  bon?: string;
  notities?: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────
const CAT_CFG: Record<GarantieCategorie, { icon: string; color: string; bg: string }> = {
  sanitair:    { icon: "🚿", color: "#0EA5E9", bg: "#F0F9FF" },
  elektra:     { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB" },
  keuken:      { icon: "🍳", color: "#EC4899", bg: "#FDF2F8" },
  bouw:        { icon: "🏗️", color: "#2B4030", bg: "#E8F0EA" },
  apparaat:    { icon: "📱", color: "#06B6D4", bg: "#ECFEFF" },
  schilderwerk:{ icon: "🎨", color: "#C97A4D", bg: "#F9EDE3" },
  overig:      { icon: "🔧", color: "#5C5C56", bg: "#EFEFEC" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date();
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); }

const INIT_GARANTIES: Garantie[] = [
  { id: "g1", product: "Badkamer renovatie",    categorie: "sanitair",     vakman: "Loodgieter de Vries",     aanschafdatum: "2025-03-15", garantieTot: "2035-03-15", bedrag: 8400,  notities: "Inclusief tegels en sanitair" },
  { id: "g2", product: "Keukenapparatuur Bosch",categorie: "keuken",       merk: "Bosch",  vakman: "Keukenstudio Ams",  aanschafdatum: "2024-09-20", garantieTot: "2029-09-20", bedrag: 3200,  serienummer: "BSH-4721-2024" },
  { id: "g3", product: "Zonnepanelen SunPower", categorie: "elektra",      merk: "SunPower", vakman: "Zonnestroom BV", aanschafdatum: "2023-11-12", garantieTot: "2048-11-12", bedrag: 9800 },
  { id: "g4", product: "CV Ketel Nefit",        categorie: "elektra",      merk: "Nefit",  vakman: "Remmerswaal",       aanschafdatum: "2019-08-10", garantieTot: addDays(TODAY, 45),  bedrag: 2800 },
  { id: "g5", product: "Vloerverwarming",        categorie: "bouw",         vakman: "Warmtespecialist",        aanschafdatum: "2022-07-01", garantieTot: "2032-07-01", bedrag: 4600 },
  { id: "g6", product: "Buitenschilderwerk",     categorie: "schilderwerk", vakman: "Schildersbedrijf Jansen", aanschafdatum: "2021-05-20", garantieTot: addDays(TODAY, -30), bedrag: 1800 },
  { id: "g7", product: "Koelkast Samsung",       categorie: "apparaat",     merk: "Samsung", vakman: "MediaMarkt",      aanschafdatum: "2023-02-14", garantieTot: addDays(TODAY, 12), serienummer: "SAM-RF23A8-2023" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcStatus(g: Garantie): GarantieStatus {
  const days = Math.round((new Date(g.garantieTot).getTime() - Date.now()) / 86400000);
  if (days < 0) return "verlopen";
  if (days < 90) return "verloopt_binnenkort";
  return "geldig";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function daysLeft(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
}

const STATUS_CFG = {
  geldig:             { bg: "#E8F0EA", color: "#2B4030",  label: "Geldig",     borderColor: "#C5D9CC" },
  verloopt_binnenkort:{ bg: "#FEF3C7", color: "#D97706",  label: "Binnenkort", borderColor: "#FCD34D" },
  verlopen:           { bg: "#FEE2E2", color: "#DC2626",  label: "Verlopen",   borderColor: "#FCA5A5" },
};

export default function GarantieTrackerPage() {
  const router = useRouter();
  const [garanties] = useState<Garantie[]>(INIT_GARANTIES);
  const [zoek, setZoek] = useState("");
  const [filterStatus, setFilterStatus] = useState<GarantieStatus | "alle">("alle");
  const [showDetail, setShowDetail] = useState<Garantie | null>(null);

  const withStatus = useMemo(() =>
    garanties.map(g => ({ ...g, _status: calcStatus(g) })),
    [garanties]);

  const filtered = useMemo(() => {
    let list = withStatus;
    if (filterStatus !== "alle") list = list.filter(g => g._status === filterStatus);
    if (zoek.trim()) list = list.filter(g =>
      g.product.toLowerCase().includes(zoek.toLowerCase()) ||
      g.vakman.toLowerCase().includes(zoek.toLowerCase()) ||
      (g.merk || "").toLowerCase().includes(zoek.toLowerCase())
    );
    return list.sort((a, b) => new Date(a.garantieTot).getTime() - new Date(b.garantieTot).getTime());
  }, [withStatus, filterStatus, zoek]);

  const telGeldig = withStatus.filter(g => g._status === "geldig").length;
  const telBinnenkort = withStatus.filter(g => g._status === "verloopt_binnenkort").length;
  const telVerlopen = withStatus.filter(g => g._status === "verlopen").length;
  const totaalWaarde = garanties.reduce((s, g) => s + (g.bedrag || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>Garantie Tracker</h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83" }}>{garanties.length} garanties bijgehouden</p>
          </div>
          <button className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#2B4030", border: "none" }}>
            <Plus size={18} color="#F5EFE5" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2.5 mb-3"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
          <Search size={16} style={{ color: "#8A8A83" }} />
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek product of vakman…"
            className="flex-1 bg-transparent"
            style={{ color: "#1A1D1A", outline: "none", fontSize: 14 }} />
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {([
            { key: "alle",               label: `Alles (${garanties.length})` },
            { key: "verloopt_binnenkort",label: `Binnenkort (${telBinnenkort})` },
            { key: "verlopen",           label: `Verlopen (${telVerlopen})` },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className="touch-scale flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium"
              style={{
                background: filterStatus === f.key ? "#2B4030" : "#FBF7F0",
                color: filterStatus === f.key ? "#F5EFE5" : "#5C5C56",
                border: filterStatus === f.key ? "none" : "0.5px solid #E5DDD0",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28 mt-4 flex flex-col gap-4">

        {/* Stats — 3-col grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 py-4"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
            <span className="font-bold text-2xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{telGeldig}</span>
            <span className="text-[11px]" style={{ color: "#8A8A83" }}>actief</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-4"
            style={{ background: "#FEF3C7", border: "0.5px solid #FCD34D", borderRadius: 14 }}>
            <span className="font-bold text-2xl" style={{ color: "#D97706", fontFamily: "'Source Serif 4', Georgia, serif" }}>{telBinnenkort}</span>
            <span className="text-[11px]" style={{ color: "#D97706" }}>binnenkort</span>
          </div>
          <div className="flex flex-col items-center gap-1 py-4"
            style={{ background: "#FEE2E2", border: "0.5px solid #FCA5A5", borderRadius: 14 }}>
            <span className="font-bold text-2xl" style={{ color: "#DC2626", fontFamily: "'Source Serif 4', Georgia, serif" }}>{telVerlopen}</span>
            <span className="text-[11px]" style={{ color: "#DC2626" }}>verlopen</span>
          </div>
        </div>

        {/* Totaal waarde */}
        <div className="flex items-center justify-between p-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <div>
            <p className="text-xs font-medium" style={{ color: "#2B4030" }}>Totale garantiewaarde</p>
            <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>Som van alle gegarandeerde aankopen</p>
          </div>
          <p className="font-bold text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{fmtEur(totaalWaarde)}</p>
        </div>

        {/* Lijst */}
        <div className="flex flex-col gap-3">
          {filtered.map(g => {
            const cat = CAT_CFG[g.categorie];
            const st = STATUS_CFG[g._status];
            const days = daysLeft(g.garantieTot);
            return (
              <div key={g.id} onClick={() => setShowDetail(g)}
                className="touch-scale p-4 cursor-pointer"
                style={{
                  background: "#FBF7F0",
                  border: `0.5px solid ${g._status === "geldig" ? "#E5DDD0" : st.borderColor}`,
                  borderRadius: 14,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: cat.bg }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1D1A" }}>{g.product}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#8A8A83" }}>{g.vakman}{g.merk ? ` · ${g.merk}` : ""}</p>
                    <p className="text-xs mt-0.5 font-medium"
                      style={{ color: g._status === "verlopen" ? "#DC2626" : g._status === "verloopt_binnenkort" ? "#D97706" : "#8A8A83" }}>
                      {g._status === "verlopen"
                        ? `Verlopen ${Math.abs(days)}d geleden`
                        : `Geldig t/m ${fmtDate(g.garantieTot)}${days < 90 ? ` (${days}d)` : ""}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      {g._status === "geldig" ? "✓" : g._status === "verlopen" ? "✗" : "⚠"}
                    </span>
                    {g.bedrag && (
                      <p className="text-xs font-medium" style={{ color: "#8A8A83" }}>{fmtEur(g.bedrag)}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#F5EFE5", maxHeight: "85dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />

              {/* Detail header */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: CAT_CFG[showDetail.categorie].bg }}>
                  {CAT_CFG[showDetail.categorie].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{showDetail.product}</h2>
                  <p className="text-sm" style={{ color: "#8A8A83" }}>{showDetail.vakman}</p>
                </div>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_CFG[calcStatus(showDetail)].bg, color: STATUS_CFG[calcStatus(showDetail)].color }}>
                  {STATUS_CFG[calcStatus(showDetail)].label}
                </span>
              </div>

              {/* Detail rows */}
              {[
                { label: "Aanschafdatum",  value: fmtDate(showDetail.aanschafdatum) },
                { label: "Garantie tot",   value: fmtDate(showDetail.garantieTot) },
                ...(showDetail.bedrag      ? [{ label: "Aankoopbedrag", value: fmtEur(showDetail.bedrag) }]        : []),
                ...(showDetail.merk        ? [{ label: "Merk",          value: showDetail.merk }]                  : []),
                ...(showDetail.serienummer ? [{ label: "Serienummer",   value: showDetail.serienummer }]           : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-3"
                  style={{ borderBottom: "0.5px solid #E5DDD0" }}>
                  <p className="text-xs font-medium" style={{ color: "#8A8A83" }}>{r.label}</p>
                  <p className="text-sm font-medium" style={{ color: "#1A1D1A" }}>{r.value}</p>
                </div>
              ))}

              {showDetail.notities && (
                <div className="p-3 mt-3" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10 }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#8A8A83" }}>NOTITIES</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#5C5C56" }}>{showDetail.notities}</p>
                </div>
              )}

              <button className="touch-scale w-full py-4 rounded-full font-medium mt-5 flex items-center justify-center gap-2"
                style={{ background: "#2B4030", color: "#F5EFE5", border: "none" }}>
                <FileText size={18} /> Document bekijken / uploaden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
