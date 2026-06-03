"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, CalendarDays, Plus, Check, X, Clock,
  Repeat, Zap, Home, Droplets, Flame, Wifi, Leaf,
  AlertCircle, CheckCircle2, ChevronRight, Wrench,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Categorie = "cv" | "elektra" | "loodgieter" | "dakwerk" | "tuin" | "ventilatie" | "overig";
type Frequentie = "maandelijks" | "kwartaal" | "halfjaarlijks" | "jaarlijks" | "2jaar" | "5jaar";
type AutoBoek = { enabled: boolean; vakmanType?: string; budget?: number };

interface TaakSchema {
  id: string;
  naam: string;
  categorie: Categorie;
  frequentie: Frequentie;
  volgende: string;   // ISO date string
  autoBoek: AutoBoek;
  beschrijving: string;
  geschatteKosten: number;
  geboektVoor?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const CAT_CFG: Record<Categorie, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  cv:          { label: "CV & Verwarming",    icon: Flame,   color: "#EF4444", bg: "#FEF2F2" },
  elektra:     { label: "Elektra",            icon: Zap,     color: "#F59E0B", bg: "#FFFBEB" },
  loodgieter:  { label: "Loodgieter",         icon: Droplets,color: "#0EA5E9", bg: "#F0F9FF" },
  dakwerk:     { label: "Dakwerk",            icon: Home,    color: "#8B5CF6", bg: "#F5F3FF" },
  tuin:        { label: "Tuin & Buiten",      icon: Leaf,    color: "#10B981", bg: "#ECFDF5" },
  ventilatie:  { label: "Ventilatie",         icon: Wifi,    color: "#6366F1", bg: "#EEF2FF" },
  overig:      { label: "Overig",             icon: Wrench,  color: "#475569", bg: "#F1F5F9" },
};

const FREQ_LABEL: Record<Frequentie, string> = {
  maandelijks:   "Maandelijks",
  kwartaal:      "Per kwartaal",
  halfjaarlijks: "Halfjaarlijks",
  jaarlijks:     "Jaarlijks",
  "2jaar":       "Elke 2 jaar",
  "5jaar":       "Elke 5 jaar",
};

const FREQ_DAYS: Record<Frequentie, number> = {
  maandelijks: 30, kwartaal: 91, halfjaarlijks: 183,
  jaarlijks: 365, "2jaar": 730, "5jaar": 1825,
};

const VAKMAN_TYPES = ["Loodgieter", "Elektricien", "CV-monteur", "Dakdekker", "Schilder", "Timmerman", "Tuinman"];

const INIT_TAKEN: TaakSchema[] = [
  {
    id: "1", naam: "CV-ketel onderhoud", categorie: "cv", frequentie: "jaarlijks",
    volgende: "2026-10-01", autoBoek: { enabled: true, vakmanType: "CV-monteur", budget: 120 },
    beschrijving: "Jaarlijkse reiniging en inspectie van de CV-ketel voor optimale werking en veiligheid.",
    geschatteKosten: 120,
  },
  {
    id: "2", naam: "Dakgoten reinigen", categorie: "dakwerk", frequentie: "halfjaarlijks",
    volgende: "2026-06-15", autoBoek: { enabled: false },
    beschrijving: "Verwijder bladeren en vuil uit de dakgoten om wateroverlast te voorkomen.",
    geschatteKosten: 85,
  },
  {
    id: "3", naam: "Stopcontacten & zekeringen check", categorie: "elektra", frequentie: "jaarlijks",
    volgende: "2026-11-01", autoBoek: { enabled: false },
    beschrijving: "Visuele inspectie van alle stopcontacten en de meterkast.",
    geschatteKosten: 65,
  },
  {
    id: "4", naam: "Ventilatie filters vervangen", categorie: "ventilatie", frequentie: "kwartaal",
    volgende: "2026-06-01", autoBoek: { enabled: true, vakmanType: "Loodgieter", budget: 50 },
    beschrijving: "Vervang de filters van het ventilatiesysteem elke 3 maanden.",
    geschatteKosten: 35,
  },
  {
    id: "5", naam: "Tuin voorjaarssnoei", categorie: "tuin", frequentie: "jaarlijks",
    volgende: "2026-03-01", autoBoek: { enabled: false },
    beschrijving: "Snoei struiken en bomen, bewerk de perken voor het groeiseizoen.",
    geschatteKosten: 200, geboektVoor: "15 mrt 2026",
  },
  {
    id: "6", naam: "Waterleiding inspectie", categorie: "loodgieter", frequentie: "2jaar",
    volgende: "2027-01-01", autoBoek: { enabled: false },
    beschrijving: "Laat alle waterleidingen controleren op corrosie of lekkage.",
    geschatteKosten: 95,
  },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function OnderhoudSchemaPage() {
  const router = useRouter();
  const [taken, setTaken] = useState<TaakSchema[]>(INIT_TAKEN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState<Categorie | "alles">("alles");

  // New task form state
  const [newTaak, setNewTaak] = useState<Partial<TaakSchema>>({
    categorie: "cv", frequentie: "jaarlijks", autoBoek: { enabled: false }, geschatteKosten: 0,
  });

  const gesorteerd = useMemo(() => {
    const filtered = filterCat === "alles" ? taken : taken.filter(t => t.categorie === filterCat);
    return filtered.sort((a, b) => new Date(a.volgende).getTime() - new Date(b.volgende).getTime());
  }, [taken, filterCat]);

  const stats = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const te_laat = taken.filter(t => daysUntil(t.volgende) < 0).length;
    const deze_maand = taken.filter(t => { const d = daysUntil(t.volgende); return d >= 0 && d <= 30; }).length;
    const auto = taken.filter(t => t.autoBoek.enabled).length;
    const jaar_kosten = taken.reduce((sum, t) => {
      const days = FREQ_DAYS[t.frequentie];
      return sum + (t.geschatteKosten * (365 / days));
    }, 0);
    return { te_laat, deze_maand, auto, jaar_kosten };
  }, [taken]);

  const selected = taken.find(t => t.id === selectedId) ?? null;

  const toggleAutoBoek = (id: string) => {
    setTaken(ts => ts.map(t => t.id === id
      ? { ...t, autoBoek: { ...t.autoBoek, enabled: !t.autoBoek.enabled } }
      : t
    ));
  };

  const boekNu = (id: string) => {
    setTaken(ts => ts.map(t => t.id === id
      ? { ...t, geboektVoor: fmtDate(addDays(new Date().toISOString().split("T")[0], 7)) }
      : t
    ));
  };

  const markDone = (id: string) => {
    setTaken(ts => ts.map(t => {
      if (t.id !== id) return t;
      const today = new Date().toISOString().split("T")[0];
      return { ...t, volgende: addDays(today, FREQ_DAYS[t.frequentie]), geboektVoor: undefined };
    }));
    setSelectedId(null);
  };

  const addTaak = () => {
    if (!newTaak.naam?.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    const taak: TaakSchema = {
      id: Date.now().toString(),
      naam: newTaak.naam,
      categorie: newTaak.categorie as Categorie,
      frequentie: newTaak.frequentie as Frequentie,
      volgende: addDays(today, FREQ_DAYS[newTaak.frequentie as Frequentie]),
      autoBoek: newTaak.autoBoek ?? { enabled: false },
      beschrijving: newTaak.beschrijving ?? "",
      geschatteKosten: newTaak.geschatteKosten ?? 0,
    };
    setTaken(ts => [...ts, taak]);
    setShowAdd(false);
    setNewTaak({ categorie: "cv", frequentie: "jaarlijks", autoBoek: { enabled: false }, geschatteKosten: 0 });
  };

  const urgency = (d: number) => {
    if (d < 0) return { label: "Te laat", bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" };
    if (d <= 14) return { label: `${d}d`, bg: "#FFF7ED", color: "#D97706", dot: "#F59E0B" };
    if (d <= 30) return { label: `${d}d`, bg: "#FFFBEB", color: "#CA8A04", dot: "#EAB308" };
    return { label: `${Math.round(d / 30)}mnd`, bg: "#F0FDF4", color: "#16A34A", dot: "#22C55E" };
  };

  return (
    <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.push('/profile')}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ChevronLeft size={20} style={{ color: "#475569" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Onderhoud Schema</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Automatisch boeken & plannen</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.4)" }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { v: stats.te_laat,             l: "Te laat",     c: stats.te_laat > 0 ? "#DC2626" : "#10B981", bg: stats.te_laat > 0 ? "#FEF2F2" : "#ECFDF5" },
            { v: stats.deze_maand,          l: "Deze maand",  c: "#F59E0B", bg: "#FFFBEB" },
            { v: stats.auto,                l: "Auto-boek",   c: "#4F46E5", bg: "#EEF2FF" },
            { v: `€${Math.round(stats.jaar_kosten)}`, l: "Per jaar", c: "#0EA5E9", bg: "#F0F9FF" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
              style={{ background: s.bg }}>
              <span className="font-black text-base leading-tight" style={{ color: s.c }}>{s.v}</span>
              <span className="text-[9px] font-bold text-center leading-tight" style={{ color: s.c }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Auto-boek promo banner */}
        <div className="rounded-3xl p-4 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.3)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <Repeat size={22} color="white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-sm">Slim Auto-Boeken</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
              Servr boekt automatisch een vakman in op basis van jouw schema.
            </p>
          </div>
          <span className="text-[10px] font-black px-2 py-1 rounded-xl flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.25)", color: "white" }}>ACTIEF</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setFilterCat("alles")}
            className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
            style={{ background: filterCat === "alles" ? "#4F46E5" : "#fff", color: filterCat === "alles" ? "#fff" : "#64748b", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            Alles ({taken.length})
          </button>
          {(Object.keys(CAT_CFG) as Categorie[]).map(cat => {
            const cfg = CAT_CFG[cat];
            const count = taken.filter(t => t.categorie === cat).length;
            if (count === 0) return null;
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
                style={{
                  background: filterCat === cat ? cfg.color : "#fff",
                  color: filterCat === cat ? "#fff" : "#64748b",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-3">
          {gesorteerd.map(taak => {
            const cfg = CAT_CFG[taak.categorie];
            const Icon = cfg.icon;
            const days = daysUntil(taak.volgende);
            const urg = urgency(days);
            return (
              <button key={taak.id} onClick={() => setSelectedId(taak.id)}
                className="touch-scale w-full rounded-3xl p-4 text-left"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{taak.naam}</p>
                      {taak.autoBoek.enabled && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg"
                          style={{ background: "#EEF2FF", color: "#4F46E5" }}>AUTO</span>
                      )}
                      {taak.geboektVoor && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg"
                          style={{ background: "#ECFDF5", color: "#059669" }}>GEBOEKT</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      {cfg.label} · {FREQ_LABEL[taak.frequentie]}
                    </p>
                    <p className="text-xs mt-1 font-medium" style={{ color: "#64748b" }}>
                      {taak.geboektVoor ? `Vakman ingepland: ${taak.geboektVoor}` : `Gepland: ${fmtDate(taak.volgende)}`}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl"
                      style={{ background: urg.bg, color: urg.color }}>
                      {days < 0 ? "Te laat" : urg.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>€{taak.geschatteKosten}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail sheet ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{selected.naam}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Info card */}
              <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{selected.beschrijving}</p>
                <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: "1px solid #F1F5F9" }}>
                  {[
                    { l: "Frequentie", v: FREQ_LABEL[selected.frequentie] },
                    { l: "Volgende datum", v: fmtDate(selected.volgende) },
                    { l: "Geschatte kosten", v: `€${selected.geschatteKosten}` },
                    { l: "Categorie", v: CAT_CFG[selected.categorie].label },
                  ].map(r => (
                    <div key={r.l}>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{r.l}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#0f172a" }}>{r.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-boek toggle */}
              <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Automatisch boeken</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                      Servr plant automatisch een vakman in
                    </p>
                  </div>
                  <button onClick={() => toggleAutoBoek(selected.id)}
                    className="touch-scale w-14 h-7 rounded-full flex items-center transition-all"
                    style={{
                      background: selected.autoBoek.enabled ? "#4F46E5" : "#E2E8F0",
                      justifyContent: selected.autoBoek.enabled ? "flex-end" : "flex-start",
                      padding: "2px",
                    }}>
                    <div className="w-6 h-6 rounded-full bg-white" style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                  </button>
                </div>
                {selected.autoBoek.enabled && (
                  <div className="mt-3 p-3 rounded-xl flex items-center gap-2"
                    style={{ background: "#EEF2FF" }}>
                    <CheckCircle2 size={14} style={{ color: "#4F46E5" }} />
                    <p className="text-xs font-medium" style={{ color: "#4F46E5" }}>
                      Servr boekt automatisch een {selected.autoBoek.vakmanType ?? "vakman"} voor je in.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => boekNu(selected.id)}
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
                  Nu boeken
                </button>
                <button onClick={() => markDone(selected.id)}
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm"
                  style={{ background: "#ECFDF5", color: "#059669" }}>
                  <div className="flex items-center justify-center gap-1.5">
                    <Check size={16} /> Gedaan
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add taak sheet ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[92dvh] overflow-y-auto"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>Taak toevoegen</h2>
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Naam */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>Naam taak *</label>
                <input value={newTaak.naam ?? ""}
                  onChange={e => setNewTaak(n => ({ ...n, naam: e.target.value }))}
                  placeholder="bijv. CV-ketel onderhoud"
                  className="w-full px-4 py-3.5 rounded-2xl font-semibold text-sm outline-none"
                  style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#0f172a" }} />
              </div>
              {/* Categorie */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>Categorie</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(CAT_CFG) as Categorie[]).map(cat => {
                    const cfg = CAT_CFG[cat];
                    const Icon = cfg.icon;
                    const active = newTaak.categorie === cat;
                    return (
                      <button key={cat} onClick={() => setNewTaak(n => ({ ...n, categorie: cat }))}
                        className="touch-scale flex flex-col items-center gap-1.5 py-3 rounded-2xl"
                        style={{ background: active ? cfg.bg : "#fff", border: `2px solid ${active ? cfg.color + "50" : "#E5E7EB"}` }}>
                        <Icon size={16} style={{ color: active ? cfg.color : "#94a3b8" }} />
                        <span className="text-[10px] font-bold text-center leading-tight" style={{ color: active ? cfg.color : "#94a3b8" }}>
                          {cfg.label.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Frequentie */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>Frequentie</label>
                <select value={newTaak.frequentie}
                  onChange={e => setNewTaak(n => ({ ...n, frequentie: e.target.value as Frequentie }))}
                  className="w-full px-4 py-3.5 rounded-2xl font-semibold text-sm outline-none appearance-none"
                  style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#0f172a" }}>
                  {(Object.keys(FREQ_LABEL) as Frequentie[]).map(f => (
                    <option key={f} value={f}>{FREQ_LABEL[f]}</option>
                  ))}
                </select>
              </div>
              {/* Kosten */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>Geschatte kosten (€)</label>
                <input type="number" inputMode="decimal"
                  value={newTaak.geschatteKosten || ""}
                  onChange={e => setNewTaak(n => ({ ...n, geschatteKosten: +e.target.value }))}
                  placeholder="0"
                  className="w-full px-4 py-3.5 rounded-2xl font-semibold text-sm outline-none"
                  style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#0f172a" }} />
              </div>
              {/* Auto-boek */}
              <div className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: "#fff", border: "2px solid #E5E7EB" }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Auto-boeken inschakelen</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Servr plant automatisch een vakman in</p>
                </div>
                <button onClick={() => setNewTaak(n => ({ ...n, autoBoek: { ...(n.autoBoek ?? { enabled: false }), enabled: !(n.autoBoek?.enabled) } }))}
                  className="touch-scale w-14 h-7 rounded-full flex items-center transition-all"
                  style={{
                    background: newTaak.autoBoek?.enabled ? "#4F46E5" : "#E2E8F0",
                    justifyContent: newTaak.autoBoek?.enabled ? "flex-end" : "flex-start",
                    padding: "2px",
                  }}>
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              </div>
              {newTaak.autoBoek?.enabled && (
                <div>
                  <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>Vakman type</label>
                  <select value={newTaak.autoBoek?.vakmanType ?? ""}
                    onChange={e => setNewTaak(n => ({ ...n, autoBoek: { ...(n.autoBoek ?? { enabled: true }), vakmanType: e.target.value } }))}
                    className="w-full px-4 py-3.5 rounded-2xl font-semibold text-sm outline-none appearance-none"
                    style={{ background: "#fff", border: "2px solid #E5E7EB", color: "#0f172a" }}>
                    {VAKMAN_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}
              <button onClick={addTaak}
                className="touch-scale w-full py-4 rounded-2xl font-black text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                Taak toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
