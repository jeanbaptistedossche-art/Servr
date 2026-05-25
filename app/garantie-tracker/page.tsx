"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Shield, Plus, AlertTriangle, Check,
  Clock, FileText, ChevronRight, Search, X,
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
  bouw:        { icon: "🏗️", color: "#8B5CF6", bg: "#F5F3FF" },
  apparaat:    { icon: "📱", color: "#06B6D4", bg: "#ECFEFF" },
  schilderwerk:{ icon: "🎨", color: "#10B981", bg: "#ECFDF5" },
  overig:      { icon: "🔧", color: "#64748b", bg: "#F1F5F9" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date();
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r.toISOString().slice(0, 10); }

const INIT_GARANTIES: Garantie[] = [
  { id: "g1", product: "Badkamer renovatie", categorie: "sanitair", vakman: "Loodgieter de Vries", aanschafdatum: "2025-03-15", garantieTot: "2035-03-15", bedrag: 8400, notities: "Inclusief tegels en sanitair" },
  { id: "g2", product: "Keukenapparatuur Bosch", categorie: "keuken", merk: "Bosch", vakman: "Keukenstudio Ams", aanschafdatum: "2024-09-20", garantieTot: "2029-09-20", bedrag: 3200, serienummer: "BSH-4721-2024" },
  { id: "g3", product: "Zonnepanelen SunPower", categorie: "elektra", merk: "SunPower", vakman: "Zonnestroom BV", aanschafdatum: "2023-11-12", garantieTot: "2048-11-12", bedrag: 9800 },
  { id: "g4", product: "CV Ketel Nefit", categorie: "elektra", merk: "Nefit", vakman: "Remmerswaal", aanschafdatum: "2019-08-10", garantieTot: addDays(TODAY, 45), bedrag: 2800 },
  { id: "g5", product: "Vloerverwarming begane grond", categorie: "bouw", vakman: "Warmtespecialist", aanschafdatum: "2022-07-01", garantieTot: "2032-07-01", bedrag: 4600 },
  { id: "g6", product: "Buitenschilderwerk", categorie: "schilderwerk", vakman: "Schildersbedrijf Jansen", aanschafdatum: "2021-05-20", garantieTot: addDays(TODAY, -30), bedrag: 1800 },
  { id: "g7", product: "Koelkast Samsung", categorie: "apparaat", merk: "Samsung", vakman: "MediaMarkt", aanschafdatum: "2023-02-14", garantieTot: addDays(TODAY, 12), serienummer: "SAM-RF23A8-2023" },
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
  geldig:             { bg: "#DCFCE7", color: "#16A34A", label: "✓ Geldig", icon: <Check size={12}/> },
  verloopt_binnenkort:{ bg: "#FEF3C7", color: "#D97706", label: "⚠ Binnenkort", icon: <Clock size={12}/> },
  verlopen:           { bg: "#FEE2E2", color: "#DC2626", label: "✗ Verlopen", icon: <X size={12}/> },
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
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Garantie Tracker</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>{garanties.length} garanties bijgehouden</p>
          </div>
          <button className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: "#4F46E5" }}>
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mb-3"
          style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Search size={16} style={{ color: "#94a3b8" }} />
          <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek product of vakman…"
            className="flex-1 text-sm bg-transparent" style={{ color: "#0f172a" }} />
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {([
            { key: "alle",               label: `Alles (${garanties.length})` },
            { key: "verloopt_binnenkort",label: `⚠️ Binnenkort (${telBinnenkort})` },
            { key: "verlopen",           label: `✗ Verlopen (${telVerlopen})` },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)}
              className="touch-scale flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold"
              style={{
                background: filterStatus === f.key ? "#4F46E5" : "#fff",
                color: filterStatus === f.key ? "#fff" : "#64748b",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "#DCFCE7", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Shield size={18} style={{ color: "#16A34A" }} />
            <p className="font-black text-xl" style={{ color: "#16A34A" }}>{telGeldig}</p>
            <p className="text-xs" style={{ color: "#166534" }}>actief</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "#FEF3C7", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Clock size={18} style={{ color: "#D97706" }} />
            <p className="font-black text-xl" style={{ color: "#D97706" }}>{telBinnenkort}</p>
            <p className="text-xs" style={{ color: "#92400E" }}>binnenkort</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col gap-1"
            style={{ background: "#FEE2E2", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <AlertTriangle size={18} style={{ color: "#DC2626" }} />
            <p className="font-black text-xl" style={{ color: "#DC2626" }}>{telVerlopen}</p>
            <p className="text-xs" style={{ color: "#7F1D1D" }}>verlopen</p>
          </div>
        </div>

        {/* Totaal */}
        <div className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <div>
            <p className="text-xs font-bold" style={{ color: "#4F46E5" }}>Totale garantiewaarde</p>
            <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>Som van alle gegarandeerde aankopen</p>
          </div>
          <p className="font-black text-xl" style={{ color: "#4F46E5" }}>{fmtEur(totaalWaarde)}</p>
        </div>

        {/* Lijst */}
        <div className="flex flex-col gap-3">
          {filtered.map(g => {
            const cat = CAT_CFG[g.categorie];
            const st = STATUS_CFG[g._status];
            const days = daysLeft(g.garantieTot);
            return (
              <div key={g.id} onClick={() => setShowDetail(g)}
                className="touch-scale rounded-2xl p-4 cursor-pointer"
                style={{
                  background: "#fff",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                  border: g._status === "verlopen" ? "1px solid #FCA5A5" :
                          g._status === "verloopt_binnenkort" ? "1px solid #FCD34D" : "1px solid transparent",
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: cat.bg }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{g.product}</p>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#64748b" }}>{g.vakman}{g.merk ? ` · ${g.merk}` : ""}</p>
                    <p className="text-xs mt-0.5 font-semibold"
                      style={{ color: g._status === "verlopen" ? "#DC2626" : g._status === "verloopt_binnenkort" ? "#D97706" : "#64748b" }}>
                      {g._status === "verlopen"
                        ? `Verlopen ${Math.abs(days)}d geleden`
                        : `Geldig t/m ${fmtDate(g.garantieTot)}${days < 90 ? ` (${days}d)` : ""}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: st.bg, color: st.color }}>
                      {g._status === "geldig" ? "✓" : g._status === "verlopen" ? "✗" : "⚠"}
                    </span>
                    {g.bedrag && (
                      <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{fmtEur(g.bedrag)}</p>
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
            style={{ background: "#fff", maxHeight: "85dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-start gap-3 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: CAT_CFG[showDetail.categorie].bg }}>
                  {CAT_CFG[showDetail.categorie].icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showDetail.product}</h2>
                  <p className="text-sm" style={{ color: "#64748b" }}>{showDetail.vakman}</p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: STATUS_CFG[calcStatus(showDetail)].bg, color: STATUS_CFG[calcStatus(showDetail)].color }}>
                  {STATUS_CFG[calcStatus(showDetail)].label}
                </span>
              </div>

              {[
                { label: "Aanschafdatum", value: fmtDate(showDetail.aanschafdatum) },
                { label: "Garantie tot", value: fmtDate(showDetail.garantieTot) },
                ...(showDetail.bedrag ? [{ label: "Aankoopbedrag", value: fmtEur(showDetail.bedrag) }] : []),
                ...(showDetail.merk ? [{ label: "Merk", value: showDetail.merk }] : []),
                ...(showDetail.serienummer ? [{ label: "Serienummer", value: showDetail.serienummer }] : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{r.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{r.value}</p>
                </div>
              ))}

              {showDetail.notities && (
                <div className="rounded-2xl p-3 mt-3" style={{ background: "#F8FAFC" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#94a3b8" }}>NOTITIES</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{showDetail.notities}</p>
                </div>
              )}

              <button className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
                style={{ background: "#4F46E5" }}>
                <FileText size={18} /> Document bekijken / uploaden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
