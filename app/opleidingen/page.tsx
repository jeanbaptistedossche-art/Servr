"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Play, Award, BookOpen, Clock, Star,
  Lock, CheckCircle2, X, ChevronRight, Zap, Users,
  TrendingUp, Filter,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type Niveau = "beginner" | "gevorderd" | "expert";
type Status = "beschikbaar" | "bezig" | "afgerond" | "vergrendeld";
type Categorie = "veiligheid" | "vakkennis" | "business" | "certificering" | "digitaal";

interface Module {
  id: string;
  titel: string;
  categorie: Categorie;
  niveau: Niveau;
  status: Status;
  duur: number;        // minutes
  lessen: number;
  voortgang: number;   // 0-100
  punten: number;
  beschrijving: string;
  docent: string;
  rating: number;
  studenten: number;
  certificaat?: string;
  vereist?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const CAT_CFG: Record<Categorie, { label: string; color: string; bg: string; emoji: string }> = {
  veiligheid:    { label: "Veiligheid",    color: "#EF4444", bg: "#FEF2F2", emoji: "🦺" },
  vakkennis:     { label: "Vakkennis",     color: "#0EA5E9", bg: "#F0F9FF", emoji: "🔧" },
  business:      { label: "Business",      color: "#10B981", bg: "#ECFDF5", emoji: "📊" },
  certificering: { label: "Certificering", color: "#8B5CF6", bg: "#F5F3FF", emoji: "🏆" },
  digitaal:      { label: "Digitaal",      color: "#F59E0B", bg: "#FFFBEB", emoji: "💻" },
};

const NIV_CFG: Record<Niveau, { label: string; color: string }> = {
  beginner:   { label: "Beginner",   color: "#10B981" },
  gevorderd:  { label: "Gevorderd",  color: "#F59E0B" },
  expert:     { label: "Expert",     color: "#EF4444" },
};

const MODULES: Module[] = [
  {
    id: "1", titel: "VCA Basisveiligheid",
    categorie: "veiligheid", niveau: "beginner",
    status: "afgerond", duur: 120, lessen: 8, voortgang: 100, punten: 150,
    beschrijving: "Leer de basisprincipes van veiligheid op de bouwplaats. Verplicht voor werken op locatie.",
    docent: "Tom Verhulst", rating: 4.8, studenten: 1247,
    certificaat: "VCA-B Certificaat",
  },
  {
    id: "2", titel: "CV & Warmtepompen 2025",
    categorie: "vakkennis", niveau: "gevorderd",
    status: "bezig", duur: 240, lessen: 14, voortgang: 45, punten: 300,
    beschrijving: "Alles over moderne CV-installaties en warmtepompen. Van diagnose tot installatie.",
    docent: "Pieter de Waard", rating: 4.9, studenten: 892,
    vereist: "1",
  },
  {
    id: "3", titel: "Slimme Offertestrategie",
    categorie: "business", niveau: "beginner",
    status: "beschikbaar", duur: 90, lessen: 6, voortgang: 0, punten: 100,
    beschrijving: "Vergroot je kans op een opdracht met strategische offertes en klantgesprekken.",
    docent: "Sandra Koopman", rating: 4.7, studenten: 2103,
  },
  {
    id: "4", titel: "NEN 1010 Elektrotechniek",
    categorie: "certificering", niveau: "expert",
    status: "vergrendeld", duur: 480, lessen: 24, voortgang: 0, punten: 500,
    beschrijving: "Officiële NEN 1010 norm voor elektrotechnische installaties. Inclusief examen.",
    docent: "Erik van Dijk", rating: 4.9, studenten: 567,
    vereist: "2",
    certificaat: "NEN 1010 Certificaat",
  },
  {
    id: "5", titel: "Digitaal Werken met Servr",
    categorie: "digitaal", niveau: "beginner",
    status: "beschikbaar", duur: 45, lessen: 4, voortgang: 0, punten: 75,
    beschrijving: "Haal alles uit het Servr platform: agenda, boekhouding, reviews en meer.",
    docent: "Servr Academy", rating: 4.6, studenten: 3891,
  },
  {
    id: "6", titel: "Isolatie & Duurzaamheid",
    categorie: "vakkennis", niveau: "gevorderd",
    status: "beschikbaar", duur: 180, lessen: 10, voortgang: 0, punten: 200,
    beschrijving: "Leer over spouwmuurisolatie, dakisolatie en vloerisolatie. Inclusief subsidieadvies.",
    docent: "Bas Verhoeven", rating: 4.7, studenten: 734,
  },
  {
    id: "7", titel: "BTW & Belasting voor ZZP'ers",
    categorie: "business", niveau: "gevorderd",
    status: "beschikbaar", duur: 120, lessen: 8, voortgang: 0, punten: 125,
    beschrijving: "Alles over je fiscale verplichtingen als zelfstandig vakman in Nederland en België.",
    docent: "Lisa Jansen RA", rating: 4.8, studenten: 1560,
  },
];

function fmtDuur(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}u ${m}m` : `${h} uur`;
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function OpleidingenPage() {
  const router = useRouter();
  const [filterCat, setFilterCat] = useState<Categorie | "alles">("alles");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>(MODULES);

  const stats = useMemo(() => ({
    afgerond: modules.filter(m => m.status === "afgerond").length,
    bezig:    modules.filter(m => m.status === "bezig").length,
    punten:   modules.filter(m => m.status === "afgerond").reduce((s, m) => s + m.punten, 0),
    certs:    modules.filter(m => m.status === "afgerond" && m.certificaat).length,
  }), [modules]);

  const filtered = useMemo(() =>
    filterCat === "alles" ? modules : modules.filter(m => m.categorie === filterCat),
    [modules, filterCat]
  );

  const selected = modules.find(m => m.id === selectedId) ?? null;

  const startModule = (id: string) => {
    setModules(ms => ms.map(m => m.id === id && m.status === "beschikbaar"
      ? { ...m, status: "bezig", voortgang: 5 }
      : m
    ));
    setSelectedId(null);
  };

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
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Opleidingen</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Vakman certificaten & cursussen</p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Progress card */}
        <div className="rounded-3xl p-5"
          style={{ background: "linear-gradient(135deg, #1e1b4b, #3730a3)", boxShadow: "0 12px 40px rgba(55,48,163,0.4)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>Jouw voortgang</p>
          <p className="font-black text-white mt-1" style={{ fontSize: 36, letterSpacing: "-0.03em" }}>
            {stats.punten} <span className="text-base font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>punten</span>
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { v: stats.afgerond, l: "Afgerond" },
              { v: stats.bezig,    l: "Bezig" },
              { v: stats.certs,    l: "Certificaten" },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-3 flex flex-col items-center"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <span className="font-black text-white text-lg">{s.v}</span>
                <span className="text-[10px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bezig modules */}
        {modules.filter(m => m.status === "bezig").length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Doorgaan</p>
            {modules.filter(m => m.status === "bezig").map(m => {
              const cfg = CAT_CFG[m.categorie];
              return (
                <button key={m.id} onClick={() => setSelectedId(m.id)}
                  className="touch-scale w-full rounded-3xl p-4 text-left"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{ background: cfg.bg }}>
                      {cfg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: "#0f172a" }}>{m.titel}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{m.docent}</p>
                    </div>
                    <Play size={18} style={{ color: "#4F46E5" }} className="flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: "#E5E7EB" }}>
                      <div style={{ width: `${m.voortgang}%`, height: "100%", background: "linear-gradient(90deg, #4F46E5, #818CF8)", borderRadius: 99 }} />
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: "#4F46E5" }}>{m.voortgang}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setFilterCat("alles")}
            className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
            style={{ background: filterCat === "alles" ? "#4F46E5" : "#fff", color: filterCat === "alles" ? "#fff" : "#64748b", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            Alles
          </button>
          {(Object.keys(CAT_CFG) as Categorie[]).map(cat => {
            const cfg = CAT_CFG[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
                style={{
                  background: filterCat === cat ? cfg.color : "#fff",
                  color: filterCat === cat ? "#fff" : "#64748b",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Module list */}
        <div className="flex flex-col gap-3">
          {filtered.map(m => {
            const cfg = CAT_CFG[m.categorie];
            const niv = NIV_CFG[m.niveau];
            const locked = m.status === "vergrendeld";
            return (
              <button key={m.id} onClick={() => !locked && setSelectedId(m.id)}
                className="touch-scale w-full rounded-3xl p-4 text-left"
                style={{
                  background: locked ? "#F8FAFC" : "#fff",
                  boxShadow: locked ? "none" : "0 4px 16px rgba(0,0,0,0.06)",
                  border: locked ? "1.5px solid #E5E7EB" : "none",
                  opacity: locked ? 0.7 : 1,
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: cfg.bg }}>
                    {locked ? "🔒" : cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{m.titel}</p>
                      {m.status === "afgerond" && (
                        <CheckCircle2 size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                      )}
                      {m.certificaat && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg flex-shrink-0"
                          style={{ background: "#F5F3FF", color: "#7C3AED" }}>CERT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold" style={{ color: niv.color }}>{niv.label}</span>
                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>·</span>
                      <Clock size={10} style={{ color: "#94a3b8" }} />
                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>{fmtDuur(m.duur)}</span>
                      <span className="text-[10px]" style={{ color: "#94a3b8" }}>·</span>
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold" style={{ color: "#64748b" }}>{m.rating}</span>
                    </div>
                    {m.status === "bezig" && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "#E5E7EB" }}>
                          <div style={{ width: `${m.voortgang}%`, height: "100%", background: "#4F46E5", borderRadius: 99 }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: "#4F46E5" }}>{m.voortgang}%</span>
                      </div>
                    )}
                    {locked && m.vereist && (
                      <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>
                        Vereist: {modules.find(x => x.id === m.vereist)?.titel}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-black" style={{ color: "#4F46E5" }}>+{m.punten}pt</span>
                    <ChevronRight size={14} style={{ color: "#cbd5e1" }} />
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
                <h2 className="font-black text-lg flex-1 min-w-0 pr-3 truncate" style={{ color: "#0f172a" }}>{selected.titel}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fff" }}>
                  <X size={16} style={{ color: "#475569" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4">
              {/* Hero */}
              <div className="rounded-3xl p-5 flex flex-col gap-3"
                style={{ background: CAT_CFG[selected.categorie].bg, border: `2px solid ${CAT_CFG[selected.categorie].color}20` }}>
                <div className="text-4xl text-center py-2">{CAT_CFG[selected.categorie].emoji}</div>
                <p className="text-sm leading-relaxed text-center" style={{ color: "#374151" }}>{selected.beschrijving}</p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { l: "Duur",       v: fmtDuur(selected.duur) },
                    { l: "Lessen",     v: `${selected.lessen}x` },
                    { l: "Studenten",  v: selected.studenten.toLocaleString("nl-NL") },
                  ].map(r => (
                    <div key={r.l} className="text-center rounded-xl py-2" style={{ background: "rgba(255,255,255,0.7)" }}>
                      <p className="font-black text-sm" style={{ color: "#0f172a" }}>{r.v}</p>
                      <p className="text-[10px]" style={{ color: "#94a3b8" }}>{r.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Docent */}
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EEF2FF" }}>
                  <span className="text-xl">👨‍🏫</span>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{selected.docent}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={10} className={i < Math.round(selected.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                    ))}
                    <span className="text-[10px] ml-1" style={{ color: "#94a3b8" }}>{selected.rating}</span>
                  </div>
                </div>
                <span className="ml-auto text-sm font-black" style={{ color: "#4F46E5" }}>+{selected.punten}pt</span>
              </div>
              {/* Certificaat */}
              {selected.certificaat && (
                <div className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "#F5F3FF", border: "1.5px solid #DDD6FE" }}>
                  <Award size={20} style={{ color: "#7C3AED" }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#5B21B6" }}>Certificaat inbegrepen</p>
                    <p className="text-xs mt-0.5" style={{ color: "#7C3AED" }}>{selected.certificaat}</p>
                  </div>
                </div>
              )}
              {/* CTA */}
              {selected.status === "beschikbaar" && (
                <button onClick={() => startModule(selected.id)}
                  className="touch-scale w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                  <Play size={18} fill="white" /> Beginnen
                </button>
              )}
              {selected.status === "bezig" && (
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                  <Play size={18} fill="white" /> Doorgaan ({selected.voortgang}%)
                </button>
              )}
              {selected.status === "afgerond" && (
                <div className="w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                  style={{ background: "#ECFDF5", color: "#059669" }}>
                  <CheckCircle2 size={18} /> Module afgerond!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
