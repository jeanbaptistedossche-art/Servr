"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Search, Package, AlertTriangle,
  TrendingDown, Euro, X, Check, Trash2, Edit3,
  ChevronDown, Filter, ShoppingCart, BarChart2,
  ArrowUpRight, ArrowDownRight, Boxes,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Categorie = "sanitair" | "elektra" | "verf" | "gereedschap" | "isolatie" | "overig";
type Eenheid = "stuks" | "m" | "m²" | "liter" | "kg" | "rol" | "doos";

type Materiaal = {
  id: string;
  naam: string;
  categorie: Categorie;
  eenheid: Eenheid;
  voorraad: number;
  minVoorraad: number;     // alert below this
  inkoopprijs: number;     // € per eenheid
  verkoopprijs?: number;
  leverancier?: string;
  leverancierUrl?: string;
  locatie?: string;        // bijv. "Witte bus", "Magazijn rek 3"
  artikelnummer?: string;
  notitie?: string;
};

type Mutatie = {
  id: string;
  materiaalId: string;
  datum: string;
  type: "inkoop" | "gebruik" | "correctie";
  aantal: number;         // positive = add, negative = remove
  klusNaam?: string;
  prijs?: number;         // total price for inkoop
  notitie?: string;
};

// ─── Cat config ───────────────────────────────────────────────────────────────
const CAT_CFG: Record<Categorie, { label: string; icon: string; color: string; bg: string }> = {
  sanitair:    { label: "Sanitair",    icon: "🔧", color: "#0EA5E9", bg: "#F0F9FF" },
  elektra:     { label: "Elektra",     icon: "⚡", color: "#F59E0B", bg: "#FFFBEB" },
  verf:        { label: "Verf",        icon: "🖌️", color: "#8B5CF6", bg: "#F5F3FF" },
  gereedschap: { label: "Gereedschap", icon: "🔨", color: "#6366F1", bg: "#EEF2FF" },
  isolatie:    { label: "Isolatie",    icon: "🧱", color: "#10B981", bg: "#ECFDF5" },
  overig:      { label: "Overig",      icon: "📦", color: "#64748b", bg: "#F8FAFC" },
};

const EENHEDEN: Eenheid[] = ["stuks", "m", "m²", "liter", "kg", "rol", "doos"];

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_MATERIALEN: Materiaal[] = [
  { id: "m1", naam: "PVC afvoerbuis 40mm", categorie: "sanitair",    eenheid: "m",     voorraad: 8,   minVoorraad: 5,  inkoopprijs: 3.20,  leverancier: "Rexel", artikelnummer: "PVC40-2M",   locatie: "Witte bus" },
  { id: "m2", naam: "Teflon tape",          categorie: "sanitair",    eenheid: "rol",   voorraad: 12,  minVoorraad: 4,  inkoopprijs: 1.10,  leverancier: "Gamma", locatie: "Witte bus" },
  { id: "m3", naam: "Rubber O-ringen set",  categorie: "sanitair",    eenheid: "doos",  voorraad: 2,   minVoorraad: 3,  inkoopprijs: 6.50,  leverancier: "Rexel", notitie: "Bestellen!" },
  { id: "m4", naam: "Aardedraad 2.5mm²",   categorie: "elektra",     eenheid: "m",     voorraad: 45,  minVoorraad: 20, inkoopprijs: 0.95,  leverancier: "Technische Unie", locatie: "Magazijn" },
  { id: "m5", naam: "Wandcontactdoos wit",  categorie: "elektra",     eenheid: "stuks", voorraad: 7,   minVoorraad: 5,  inkoopprijs: 4.20,  verkoopprijs: 8.50, leverancier: "Technische Unie" },
  { id: "m6", naam: "Zekeringen 16A",       categorie: "elektra",     eenheid: "stuks", voorraad: 3,   minVoorraad: 10, inkoopprijs: 2.80,  leverancier: "Technische Unie", notitie: "Bijna op!" },
  { id: "m7", naam: "Muurverf wit 10L",     categorie: "verf",        eenheid: "stuks", voorraad: 4,   minVoorraad: 2,  inkoopprijs: 38.00, verkoopprijs: 52.00, leverancier: "Gamma" },
  { id: "m8", naam: "Primer universeel",    categorie: "verf",        eenheid: "liter", voorraad: 6,   minVoorraad: 3,  inkoopprijs: 9.50,  leverancier: "Gamma", locatie: "Bestelbus" },
  { id: "m9", naam: "Schildersrol 23cm",    categorie: "verf",        eenheid: "stuks", voorraad: 15,  minVoorraad: 5,  inkoopprijs: 3.80,  leverancier: "Gamma" },
  { id: "m10",naam: "Rockwool platen 100mm",categorie: "isolatie",    eenheid: "m²",    voorraad: 22,  minVoorraad: 10, inkoopprijs: 12.50, leverancier: "Bouwmaat", locatie: "Magazijn rek 2" },
  { id: "m11",naam: "Boormachine SDS",      categorie: "gereedschap", eenheid: "stuks", voorraad: 1,   minVoorraad: 1,  inkoopprijs: 189.00,leverancier: "Eigen" },
  { id: "m12",naam: "Siliconekit sanitair", categorie: "sanitair",    eenheid: "stuks", voorraad: 0,   minVoorraad: 4,  inkoopprijs: 5.60,  leverancier: "Gamma", notitie: "UITVERKOCHT" },
];

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const INIT_MUTATIES: Mutatie[] = [
  { id: "mut1", materiaalId: "m7", datum: TODAY,     type: "gebruik",   aantal: -2, klusNaam: "Woonkamer schilderen" },
  { id: "mut2", materiaalId: "m1", datum: TODAY,     type: "gebruik",   aantal: -3, klusNaam: "Lekkende kraan reparatie" },
  { id: "mut3", materiaalId: "m4", datum: YESTERDAY, type: "inkoop",    aantal: 20, prijs: 19.00, leverancier: "Technische Unie" } as Mutatie & { leverancier: string },
  { id: "mut4", materiaalId: "m6", datum: YESTERDAY, type: "gebruik",   aantal: -5, klusNaam: "Elektra renovatie" },
  { id: "mut5", materiaalId: "m8", datum: YESTERDAY, type: "correctie", aantal: -2, notitie: "Defect aangetroffen" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function stockPct(m: Materiaal) {
  if (m.minVoorraad === 0) return 100;
  return Math.min(100, Math.round((m.voorraad / (m.minVoorraad * 2)) * 100));
}

function stockColor(m: Materiaal) {
  if (m.voorraad === 0) return "#EF4444";
  if (m.voorraad < m.minVoorraad) return "#F59E0B";
  return "#10B981";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaterialenPage() {
  const router = useRouter();

  const [materialen, setMaterialen] = useState<Materiaal[]>(INIT_MATERIALEN);
  const [mutaties, setMutaties] = useState<Mutatie[]>(INIT_MUTATIES);
  const [tab, setTab] = useState<"voorraad" | "bewegingen" | "statistieken">("voorraad");
  const [zoek, setZoek] = useState("");
  const [catFilter, setCatFilter] = useState<Categorie | "alle">("alle");
  const [showNieuw, setShowNieuw] = useState(false);
  const [showDetail, setShowDetail] = useState<Materiaal | null>(null);
  const [showMutatie, setShowMutatie] = useState<Materiaal | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);

  // New materiaal form
  const [form, setForm] = useState<Partial<Materiaal>>({
    categorie: "overig", eenheid: "stuks", voorraad: 0, minVoorraad: 2, inkoopprijs: 0,
  });

  // Mutatie form
  const [mutForm, setMutForm] = useState<{ type: "inkoop" | "gebruik" | "correctie"; aantal: number; klus: string; prijs: number; notitie: string }>({
    type: "gebruik", aantal: 1, klus: "", prijs: 0, notitie: "",
  });

  // ── Derived ─────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => materialen.filter((m) => m.voorraad <= m.minVoorraad), [materialen]);

  const filtered = useMemo(() => {
    let list = materialen;
    if (catFilter !== "alle") list = list.filter((m) => m.categorie === catFilter);
    if (zoek) {
      const q = zoek.toLowerCase();
      list = list.filter((m) => m.naam.toLowerCase().includes(q) || m.leverancier?.toLowerCase().includes(q));
    }
    return list;
  }, [materialen, catFilter, zoek]);

  const totalWaarde = useMemo(() =>
    materialen.reduce((s, m) => s + m.voorraad * m.inkoopprijs, 0), [materialen]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const saveMutatie = useCallback(() => {
    if (!showMutatie) return;
    const delta = mutForm.type === "inkoop"
      ? Math.abs(mutForm.aantal)
      : mutForm.type === "gebruik"
        ? -Math.abs(mutForm.aantal)
        : mutForm.aantal;

    const mutatie: Mutatie = {
      id: `mut${Date.now()}`,
      materiaalId: showMutatie.id,
      datum: TODAY,
      type: mutForm.type,
      aantal: delta,
      klusNaam: mutForm.klus || undefined,
      prijs: mutForm.type === "inkoop" ? mutForm.prijs : undefined,
      notitie: mutForm.notitie || undefined,
    };

    setMutaties((prev) => [mutatie, ...prev]);
    setMaterialen((prev) => prev.map((m) =>
      m.id === showMutatie.id
        ? { ...m, voorraad: Math.max(0, m.voorraad + delta) }
        : m
    ));
    setShowMutatie(null);
    setMutForm({ type: "gebruik", aantal: 1, klus: "", prijs: 0, notitie: "" });
  }, [showMutatie, mutForm]);

  const saveNieuw = useCallback(() => {
    if (!form.naam) return;
    const m: Materiaal = {
      id: `m${Date.now()}`,
      naam: form.naam,
      categorie: form.categorie ?? "overig",
      eenheid: form.eenheid ?? "stuks",
      voorraad: form.voorraad ?? 0,
      minVoorraad: form.minVoorraad ?? 2,
      inkoopprijs: form.inkoopprijs ?? 0,
      verkoopprijs: form.verkoopprijs,
      leverancier: form.leverancier,
      locatie: form.locatie,
      artikelnummer: form.artikelnummer,
      notitie: form.notitie,
    };
    setMaterialen((prev) => [m, ...prev]);
    setForm({ categorie: "overig", eenheid: "stuks", voorraad: 0, minVoorraad: 2, inkoopprijs: 0 });
    setShowNieuw(false);
  }, [form]);

  const deleteMateriaal = useCallback((id: string) => {
    setMaterialen((prev) => prev.filter((m) => m.id !== id));
    setShowDetail(null);
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const catStats = useMemo(() => {
    return (Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
      const items = materialen.filter((m) => m.categorie === cat);
      const waarde = items.reduce((s, m) => s + m.voorraad * m.inkoopprijs, 0);
      const laag = items.filter((m) => m.voorraad < m.minVoorraad).length;
      return { cat, items: items.length, waarde, laag };
    }).filter((s) => s.items > 0);
  }, [materialen]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black" style={{ color: "#0f172a" }}>Materialen</h1>
            <p className="text-xs whitespace-nowrap" style={{ color: "#64748b" }}>Voorraad & inkoop</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {alerts.length > 0 && (
              <button onClick={() => setShowAlerts(true)}
                className="touch-scale relative w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#FEF2F2" }}>
                <AlertTriangle size={18} style={{ color: "#EF4444" }} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ background: "#EF4444", fontSize: 10 }}>
                  {alerts.length}
                </span>
              </button>
            )}
            <button onClick={() => setShowNieuw(true)}
              className="touch-scale flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-white"
              style={{ background: "#4F46E5" }}>
              <Plus size={16} />
              Nieuw
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 mb-3"
          style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Search size={16} style={{ color: "#94a3b8" }} />
          <input value={zoek} onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek materiaal of leverancier…"
            className="flex-1 text-sm bg-transparent"
            style={{ color: "#0f172a", outline: "none" }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E2E8F0" }}>
          {(["voorraad", "bewegingen", "statistieken"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#4F46E5" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4">
        {/* ── VOORRAAD TAB ─────────────────────────────────────────────────────── */}
        {tab === "voorraad" && (
          <div className="flex flex-col gap-4">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Boxes size={16} style={{ color: "#4F46E5" }} />
                <p className="font-black text-lg leading-tight" style={{ color: "#0f172a" }}>{materialen.length}</p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Producten</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Euro size={16} style={{ color: "#10B981" }} />
                <p className="font-black text-lg leading-tight" style={{ color: "#0f172a" }}>
                  {fmtEur(totalWaarde).replace("€ ", "€")}
                </p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Totaal waarde</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: alerts.length > 0 ? "#FEF2F2" : "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <AlertTriangle size={16} style={{ color: alerts.length > 0 ? "#EF4444" : "#94a3b8" }} />
                <p className="font-black text-lg leading-tight"
                  style={{ color: alerts.length > 0 ? "#EF4444" : "#0f172a" }}>
                  {alerts.length}
                </p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Lage voorraad</p>
              </div>
            </div>

            {/* Category filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button onClick={() => setCatFilter("alle")}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: catFilter === "alle" ? "#4F46E5" : "#fff",
                  color: catFilter === "alle" ? "#fff" : "#64748b",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                Alles
              </button>
              {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
                const cfg = CAT_CFG[cat];
                const active = catFilter === cat;
                return (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
                    style={{
                      background: active ? cfg.color : "#fff",
                      color: active ? "#fff" : "#64748b",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                    {cfg.icon} {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Materiaal list */}
            {filtered.length === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <p className="text-3xl mb-2">📦</p>
                <p className="font-bold" style={{ color: "#0f172a" }}>Geen materialen gevonden</p>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>Pas de zoekfilter aan of voeg een nieuw materiaal toe</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((m) => {
                  const cfg = CAT_CFG[m.categorie];
                  const isLow = m.voorraad < m.minVoorraad;
                  const pct = stockPct(m);
                  const sc = stockColor(m);
                  return (
                    <button key={m.id} onClick={() => setShowDetail(m)}
                      className="touch-scale w-full rounded-2xl p-4 text-left"
                      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-tight truncate" style={{ color: "#0f172a" }}>
                              {m.naam}
                            </p>
                            {isLow && (
                              <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: m.voorraad === 0 ? "#FEE2E2" : "#FEF3C7", color: m.voorraad === 0 ? "#EF4444" : "#D97706" }}>
                                {m.voorraad === 0 ? "Uitverkocht" : "Laag"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                            {m.leverancier ?? "—"} · {fmtEur(m.inkoopprijs)}/{m.eenheid}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: "#F1F5F9" }}>
                              <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${pct}%`, background: sc }} />
                            </div>
                            <p className="text-xs font-bold" style={{ color: sc }}>
                              {m.voorraad} {m.eenheid}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BEWEGINGEN TAB ────────────────────────────────────────────────────── */}
        {tab === "bewegingen" && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
              Recente mutaties ({mutaties.length})
            </p>
            {mutaties.length === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: "#fff" }}>
                <p className="text-3xl mb-2">📋</p>
                <p className="font-bold" style={{ color: "#0f172a" }}>Geen mutaties</p>
              </div>
            ) : mutaties.map((mut) => {
              const mat = materialen.find((m) => m.id === mut.materiaalId);
              const isPos = mut.aantal > 0;
              return (
                <div key={mut.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isPos ? "#ECFDF5" : "#FEF2F2" }}>
                    {isPos
                      ? <ArrowUpRight size={18} style={{ color: "#10B981" }} />
                      : <ArrowDownRight size={18} style={{ color: "#EF4444" }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>
                      {mat?.naam ?? "Onbekend materiaal"}
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      {mut.datum} · {mut.type === "inkoop" ? "Inkoop" : mut.type === "gebruik" ? "Gebruikt" : "Correctie"}
                      {mut.klusNaam ? ` · ${mut.klusNaam}` : ""}
                    </p>
                    {mut.notitie && (
                      <p className="text-xs italic mt-0.5" style={{ color: "#94a3b8" }}>"{mut.notitie}"</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold"
                      style={{ color: isPos ? "#10B981" : "#EF4444" }}>
                      {isPos ? "+" : ""}{mut.aantal} {mat?.eenheid ?? ""}
                    </p>
                    {mut.prijs && (
                      <p className="text-xs font-semibold" style={{ color: "#64748b" }}>{fmtEur(mut.prijs)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATISTIEKEN TAB ─────────────────────────────────────────────────── */}
        {tab === "statistieken" && (
          <div className="flex flex-col gap-4">
            {/* Waarde per categorie */}
            <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Voorraadwaarde per categorie</p>
              {catStats.map(({ cat, items, waarde, laag }) => {
                const cfg = CAT_CFG[cat];
                const pct = Math.round((waarde / Math.max(totalWaarde, 1)) * 100);
                return (
                  <div key={cat} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{cfg.icon}</span>
                        <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{cfg.label}</p>
                        {laag > 0 && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "#FEF3C7", color: "#D97706" }}>
                            {laag} laag
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{fmtEur(waarde)}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>{items} producten</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                      <div className="h-2 rounded-full"
                        style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top waarde items */}
            <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Hoogste voorraadwaarde</p>
              {[...materialen]
                .sort((a, b) => b.voorraad * b.inkoopprijs - a.voorraad * a.inkoopprijs)
                .slice(0, 5)
                .map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 mb-3">
                    <span className="text-lg w-6 text-center">{CAT_CFG[m.categorie].icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{m.naam}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        {m.voorraad} {m.eenheid} × {fmtEur(m.inkoopprijs)}
                      </p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>
                      {fmtEur(m.voorraad * m.inkoopprijs)}
                    </p>
                  </div>
                ))}
            </div>

            {/* Bestellijst */}
            {alerts.length > 0 && (
              <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart size={18} style={{ color: "#EF4444" }} />
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Bestellijst ({alerts.length})</p>
                </div>
                {alerts.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 mb-2 p-3 rounded-xl"
                    style={{ background: "#FEF2F2" }}>
                    <AlertTriangle size={14} style={{ color: "#EF4444" }} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{m.naam}</p>
                      <p className="text-xs" style={{ color: "#EF4444" }}>
                        Huidig: {m.voorraad} {m.eenheid} · Min: {m.minVoorraad} {m.eenheid}
                      </p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#64748b" }}>
                      Bestel {Math.max(0, m.minVoorraad * 2 - m.voorraad)} {m.eenheid}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Alerts sheet ────────────────────────────────────────────────────── */}
      {showAlerts && (
        <BottomSheet onClose={() => setShowAlerts(false)} title={`⚠️ Lage voorraad (${alerts.length})`}>
          <div className="flex flex-col gap-2 pb-2">
            {alerts.map((m) => {
              const cfg = CAT_CFG[m.categorie];
              return (
                <div key={m.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: m.voorraad === 0 ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${m.voorraad === 0 ? "#FECACA" : "#FDE68A"}` }}>
                  <span className="text-xl">{cfg.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{m.naam}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {m.voorraad === 0 ? "Uitverkocht" : `Nog ${m.voorraad} ${m.eenheid}`}
                      {m.leverancier ? ` · ${m.leverancier}` : ""}
                    </p>
                  </div>
                  <button onClick={() => { setShowAlerts(false); setShowMutatie(m); setMutForm({ type: "inkoop", aantal: m.minVoorraad * 2 - m.voorraad, klus: "", prijs: 0, notitie: "" }); }}
                    className="touch-scale px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "#4F46E5" }}>
                    Inkoop
                  </button>
                </div>
              );
            })}
          </div>
        </BottomSheet>
      )}

      {/* ── Materiaal detail sheet ────────────────────────────────────────────── */}
      {showDetail && (
        <BottomSheet onClose={() => setShowDetail(null)} title={showDetail.naam}>
          <div className="flex flex-col gap-4 pb-2">
            {/* Stock bar */}
            <div className="rounded-2xl p-4" style={{ background: "#F8FAFC" }}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Voorraad</p>
                <p className="font-black text-2xl" style={{ color: stockColor(showDetail) }}>
                  {showDetail.voorraad} <span className="text-sm font-semibold">{showDetail.eenheid}</span>
                </p>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                <div className="h-2 rounded-full" style={{ width: `${stockPct(showDetail)}%`, background: stockColor(showDetail) }} />
              </div>
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Minimum: {showDetail.minVoorraad} {showDetail.eenheid}</p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoField label="Inkoopprijs" value={`${fmtEur(showDetail.inkoopprijs)} / ${showDetail.eenheid}`} />
              {showDetail.verkoopprijs && <InfoField label="Verkoopprijs" value={`${fmtEur(showDetail.verkoopprijs)} / ${showDetail.eenheid}`} accent="#10B981" />}
              {showDetail.leverancier && <InfoField label="Leverancier" value={showDetail.leverancier} />}
              {showDetail.locatie && <InfoField label="Locatie" value={showDetail.locatie} />}
              {showDetail.artikelnummer && <InfoField label="Artikelnummer" value={showDetail.artikelnummer} />}
              <InfoField label="Categorie" value={`${CAT_CFG[showDetail.categorie].icon} ${CAT_CFG[showDetail.categorie].label}`} />
            </div>

            {showDetail.notitie && (
              <div className="rounded-2xl p-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-xs font-bold mb-0.5" style={{ color: "#D97706" }}>Notitie</p>
                <p className="text-sm" style={{ color: "#374151" }}>{showDetail.notitie}</p>
              </div>
            )}

            {/* Waarde */}
            <div className="rounded-2xl p-3 flex justify-between items-center"
              style={{ background: "#EEF2FF" }}>
              <p className="text-sm font-semibold" style={{ color: "#4F46E5" }}>Totale waarde in voorraad</p>
              <p className="font-black text-lg" style={{ color: "#4F46E5" }}>
                {fmtEur(showDetail.voorraad * showDetail.inkoopprijs)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => { setShowDetail(null); setShowMutatie(showDetail); setMutForm({ type: "inkoop", aantal: 1, klus: "", prijs: 0, notitie: "" }); }}
                className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#ECFDF5", color: "#10B981" }}>
                <ArrowUpRight size={16} />
                Inkoop
              </button>
              <button onClick={() => { setShowDetail(null); setShowMutatie(showDetail); setMutForm({ type: "gebruik", aantal: 1, klus: "", prijs: 0, notitie: "" }); }}
                className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#FEF2F2", color: "#EF4444" }}>
                <ArrowDownRight size={16} />
                Gebruik
              </button>
              <button onClick={() => deleteMateriaal(showDetail.id)}
                className="touch-scale w-12 py-3.5 rounded-2xl flex items-center justify-center"
                style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ── Mutatie sheet ────────────────────────────────────────────────────── */}
      {showMutatie && (
        <BottomSheet onClose={() => setShowMutatie(null)}
          title={`${mutForm.type === "inkoop" ? "📦 Inkoop" : mutForm.type === "gebruik" ? "🔧 Gebruik" : "✏️ Correctie"}: ${showMutatie.naam}`}>
          <div className="flex flex-col gap-4 pb-2">
            {/* Type */}
            <div className="flex gap-2">
              {(["inkoop", "gebruik", "correctie"] as const).map((t) => (
                <button key={t} onClick={() => setMutForm((f) => ({ ...f, type: t }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold capitalize"
                  style={{
                    background: mutForm.type === t ? "#4F46E5" : "#F3F4F6",
                    color: mutForm.type === t ? "#fff" : "#64748b",
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Aantal */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                Aantal ({showMutatie.eenheid})
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setMutForm((f) => ({ ...f, aantal: Math.max(1, f.aantal - 1) }))}
                  className="w-11 h-11 rounded-xl font-bold text-xl flex items-center justify-center"
                  style={{ background: "#F3F4F6", color: "#374151" }}>−</button>
                <input type="number" value={mutForm.aantal}
                  onChange={(e) => setMutForm((f) => ({ ...f, aantal: Math.max(0, Number(e.target.value)) }))}
                  className="flex-1 text-center rounded-2xl py-3 text-xl font-black"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                <button onClick={() => setMutForm((f) => ({ ...f, aantal: f.aantal + 1 }))}
                  className="w-11 h-11 rounded-xl font-bold text-xl flex items-center justify-center"
                  style={{ background: "#4F46E5", color: "#fff" }}>+</button>
              </div>
            </div>

            {/* Klus (gebruik only) */}
            {mutForm.type === "gebruik" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                  Klus (optioneel)
                </label>
                <input value={mutForm.klus} onChange={(e) => setMutForm((f) => ({ ...f, klus: e.target.value }))}
                  placeholder="Naam van de klus…"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </div>
            )}

            {/* Prijs (inkoop only) */}
            {mutForm.type === "inkoop" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                  Aankoopprijs (€ totaal)
                </label>
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
                  <Euro size={16} style={{ color: "#94a3b8" }} />
                  <input type="number" value={mutForm.prijs}
                    onChange={(e) => setMutForm((f) => ({ ...f, prijs: Number(e.target.value) }))}
                    className="flex-1 bg-transparent text-sm font-bold"
                    style={{ color: "#0f172a", outline: "none" }} />
                </div>
              </div>
            )}

            {/* Notitie */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                Notitie (optioneel)
              </label>
              <input value={mutForm.notitie} onChange={(e) => setMutForm((f) => ({ ...f, notitie: e.target.value }))}
                placeholder="Opmerking…"
                className="w-full rounded-2xl px-4 py-3.5 text-sm"
                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
            </div>

            <button onClick={saveMutatie}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "#4F46E5" }}>
              <Check size={18} />
              Opslaan
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ── Nieuw materiaal sheet ────────────────────────────────────────────── */}
      {showNieuw && (
        <BottomSheet onClose={() => setShowNieuw(false)} title="Nieuw materiaal">
          <div className="flex flex-col gap-4 pb-2">
            {/* Naam */}
            <FormField label="Naam" required>
              <input value={form.naam ?? ""} onChange={(e) => setForm((f) => ({ ...f, naam: e.target.value }))}
                placeholder="Bijv. PVC buis 32mm…"
                className="w-full rounded-2xl px-4 py-3.5 text-sm"
                style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
            </FormField>

            {/* Categorie */}
            <FormField label="Categorie">
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
                  const cfg = CAT_CFG[cat];
                  return (
                    <button key={cat} onClick={() => setForm((f) => ({ ...f, categorie: cat }))}
                      className="py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: form.categorie === cat ? cfg.color : "#F3F4F6",
                        color: form.categorie === cat ? "#fff" : "#64748b",
                      }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            {/* Eenheid */}
            <FormField label="Eenheid">
              <div className="flex gap-2 flex-wrap">
                {EENHEDEN.map((e) => (
                  <button key={e} onClick={() => setForm((f) => ({ ...f, eenheid: e }))}
                    className="px-3 py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: form.eenheid === e ? "#4F46E5" : "#F3F4F6",
                      color: form.eenheid === e ? "#fff" : "#64748b",
                    }}>
                    {e}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Aantallen */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Beginvoorraad">
                <input type="number" value={form.voorraad ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, voorraad: Number(e.target.value) }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
              <FormField label="Min. voorraad">
                <input type="number" value={form.minVoorraad ?? 2}
                  onChange={(e) => setForm((f) => ({ ...f, minVoorraad: Number(e.target.value) }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
            </div>

            {/* Prijzen */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Inkoopprijs (€)">
                <input type="number" value={form.inkoopprijs ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, inkoopprijs: Number(e.target.value) }))}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
              <FormField label="Verkoopprijs (€)">
                <input type="number" value={form.verkoopprijs ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, verkoopprijs: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Optioneel"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
            </div>

            {/* Leverancier + locatie */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Leverancier">
                <input value={form.leverancier ?? ""} onChange={(e) => setForm((f) => ({ ...f, leverancier: e.target.value }))}
                  placeholder="Gamma, Rexel…"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
              <FormField label="Locatie">
                <input value={form.locatie ?? ""} onChange={(e) => setForm((f) => ({ ...f, locatie: e.target.value }))}
                  placeholder="Witte bus…"
                  className="w-full rounded-2xl px-4 py-3.5 text-sm"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </FormField>
            </div>

            <button onClick={saveNieuw} disabled={!form.naam}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: "#4F46E5" }}>
              <Plus size={18} />
              Materiaal opslaan
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────
function BottomSheet({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[88dvh] overflow-y-auto"
        style={{ background: "#fff" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 pb-3">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-base leading-tight pr-4" style={{ color: "#0f172a" }}>{title}</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#F3F4F6" }}>
              <X size={16} style={{ color: "#6B7280" }} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#F8FAFC" }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#0f172a" }}>{value}</p>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
