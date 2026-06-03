"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Users, Phone, Mail,
  Clock, Euro, X, Star,
  Calendar,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type PersoonStatus = "actief" | "verlof" | "ziek" | "inactief";
type Rol = "monteur" | "leerling" | "assistent" | "onderaannemer";

interface Persoon {
  id: string;
  naam: string;
  rol: Rol;
  specialiteit: string;
  status: PersoonStatus;
  telefoon: string;
  email: string;
  uurtarief: number;
  uren_week: number;
  klussen_maand: number;
  rating: number;
  avatar: string;
  in_dienst_sinds: string;
  lopende_klus?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<PersoonStatus, { label: string; color: string; bg: string; dot: string }> = {
  actief:   { label: "Actief",    color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  verlof:   { label: "Verlof",    color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  ziek:     { label: "Ziek",      color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  inactief: { label: "Inactief",  color: "#475569", bg: "#F1F5F9", dot: "#94a3b8" },
};

const ROL_CFG: Record<Rol, { label: string; color: string; bg: string }> = {
  monteur:        { label: "Monteur",        color: "#2B4030", bg: "#E8F0EA" },
  leerling:       { label: "Leerling",       color: "#C97A4D", bg: "#F9EDE3" },
  assistent:      { label: "Assistent",      color: "#5C5C56", bg: "#EFEFEC" },
  onderaannemer:  { label: "Onderaannemer",  color: "#2B4030", bg: "#E8F0EA" },
};

const INIT_PERSONEEL: Persoon[] = [
  {
    id: "1", naam: "Daan Willems", rol: "monteur", specialiteit: "CV & Loodgieter",
    status: "actief", telefoon: "+31 6 12 34 56 78", email: "daan@voorbeeld.nl",
    uurtarief: 28, uren_week: 40, klussen_maand: 12, rating: 4.8,
    avatar: "https://i.pravatar.cc/150?img=12",
    in_dienst_sinds: "jan 2025", lopende_klus: "Leidingwerk Amstelstraat",
  },
  {
    id: "2", naam: "Kevin Peters", rol: "leerling", specialiteit: "Elektra",
    status: "actief", telefoon: "+31 6 23 45 67 89", email: "kevin@voorbeeld.nl",
    uurtarief: 16, uren_week: 32, klussen_maand: 8, rating: 4.5,
    avatar: "https://i.pravatar.cc/150?img=33",
    in_dienst_sinds: "sep 2025",
  },
  {
    id: "3", naam: "Lisa van der Berg", rol: "assistent", specialiteit: "Algemeen",
    status: "verlof", telefoon: "+31 6 34 56 78 90", email: "lisa@voorbeeld.nl",
    uurtarief: 20, uren_week: 0, klussen_maand: 0, rating: 4.7,
    avatar: "https://i.pravatar.cc/150?img=47",
    in_dienst_sinds: "mrt 2025",
  },
  {
    id: "4", naam: "Erwin Bakker", rol: "onderaannemer", specialiteit: "Dakwerk",
    status: "actief", telefoon: "+31 6 45 67 89 01", email: "erwin@bakker-bouw.nl",
    uurtarief: 45, uren_week: 24, klussen_maand: 4, rating: 4.9,
    avatar: "https://i.pravatar.cc/150?img=57",
    in_dienst_sinds: "jun 2024", lopende_klus: "Dakrenovatie Keizersgracht",
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function PersoneelPage() {
  const router = useRouter();
  const [personeel, setPersoneel] = useState<Persoon[]>(INIT_PERSONEEL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PersoonStatus | "alles">("alles");
  const [showAdd, setShowAdd] = useState(false);

  const stats = useMemo(() => {
    const actief = personeel.filter(p => p.status === "actief").length;
    const week_uren = personeel.filter(p => p.status === "actief").reduce((s, p) => s + p.uren_week, 0);
    const maand_kosten = personeel.reduce((s, p) => s + p.uurtarief * p.uren_week * 4, 0);
    return { actief, week_uren, maand_kosten };
  }, [personeel]);

  const filtered = useMemo(() =>
    filterStatus === "alles" ? personeel : personeel.filter(p => p.status === filterStatus),
    [personeel, filterStatus]
  );

  const selected = personeel.find(p => p.id === selectedId) ?? null;

  const changeStatus = (id: string, status: PersoonStatus) => {
    setPersoneel(ps => ps.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F5EFE5" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>Personeel</h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Team & onderaannemers beheren</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#2B4030", border: "none" }}>
            <Plus size={18} color="#F5EFE5" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: stats.actief,                                   l: "Actief" },
            { v: `${stats.week_uren}u`,                          l: "Uren/week" },
            { v: `€${(stats.maand_kosten / 1000).toFixed(1)}k`,  l: "Maand kosten" },
          ].map(s => (
            <div key={s.l} className="flex flex-col items-center gap-1 py-4"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              <span className="font-bold text-2xl"
                style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{s.v}</span>
              <span className="text-[11px]" style={{ color: "#8A8A83" }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {([["alles", "Iedereen"], ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label])] as [string, string][]).map(([key, label]) => {
            const active = filterStatus === key;
            const cfg = key !== "alles" ? STATUS_CFG[key as PersoonStatus] : null;
            return (
              <button key={key} onClick={() => setFilterStatus(key as PersoonStatus | "alles")}
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium"
                style={{
                  background: active ? "#2B4030" : "#FBF7F0",
                  color: active ? "#F5EFE5" : "#5C5C56",
                  border: active ? "none" : "0.5px solid #E5DDD0",
                }}>
                {cfg && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: active ? "rgba(245,239,229,0.7)" : cfg.dot }} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Team list */}
        <div className="flex flex-col gap-3">
          {filtered.map(p => {
            const sCfg = STATUS_CFG[p.status];
            const rCfg = ROL_CFG[p.rol];
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className="touch-scale w-full text-left"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={p.avatar} alt={p.naam}
                      className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ background: sCfg.dot, borderColor: "#FBF7F0" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate" style={{ color: "#1A1D1A" }}>{p.naam}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: rCfg.bg, color: rCfg.color }}>{rCfg.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{p.specialiteit}</p>
                    {p.lopende_klus && (
                      <p className="text-xs mt-1 truncate" style={{ color: "#C97A4D" }}>
                        🔧 {p.lopende_klus}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    <span className="text-xs" style={{ color: "#8A8A83" }}>€{p.uurtarief}/u</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Detail sheet ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelectedId(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 sticky top-0" style={{ background: "rgba(245,239,229,0.97)" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{selected.naam}</h2>
                <button onClick={() => setSelectedId(null)}
                  className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={16} style={{ color: "#5C5C56" }} />
                </button>
              </div>
            </div>
            <div className="px-5 pb-10 flex flex-col gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              {/* Profile */}
              <div className="flex flex-col items-center gap-3 p-5"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <img src={selected.avatar} alt={selected.naam}
                  className="w-20 h-20 rounded-3xl object-cover" />
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{selected.naam}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: ROL_CFG[selected.rol].bg, color: ROL_CFG[selected.rol].color }}>
                      {ROL_CFG[selected.rol].label}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: STATUS_CFG[selected.status].bg, color: STATUS_CFG[selected.status].color }}>
                      {STATUS_CFG[selected.status].label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {[
                    { v: `${selected.uren_week}u`, l: "Uren/week" },
                    { v: `${selected.klussen_maand}`, l: "Klussen/mnd" },
                    { v: `${selected.rating}★`, l: "Rating" },
                  ].map(r => (
                    <div key={r.l} className="flex flex-col items-center py-3"
                      style={{ background: "#F5EFE5", borderRadius: 10, border: "0.5px solid #E5DDD0" }}>
                      <p className="font-bold text-base" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{r.v}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#8A8A83" }}>{r.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Contact */}
              <div className="overflow-hidden" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                {[
                  { icon: Phone,    label: "Telefoon",  value: selected.telefoon },
                  { icon: Mail,     label: "E-mail",    value: selected.email },
                  { icon: Euro,     label: "Uurtarief", value: `€${selected.uurtarief}/uur` },
                  { icon: Calendar, label: "In dienst", value: `Sinds ${selected.in_dienst_sinds}` },
                ].map((row, i, arr) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #E5DDD0" : "none" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "#F5EFE5" }}>
                        <Icon size={14} style={{ color: "#2B4030" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-medium" style={{ color: "#8A8A83" }}>{row.label}</p>
                        <p className="text-sm font-medium" style={{ color: "#1A1D1A" }}>{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Status change */}
              <div>
                <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "#8A8A83" }}>Status wijzigen</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CFG) as PersoonStatus[]).map(s => {
                    const cfg = STATUS_CFG[s];
                    return (
                      <button key={s} onClick={() => changeStatus(selected.id, s)}
                        className="touch-scale py-3 rounded-full font-medium text-xs"
                        style={{
                          background: selected.status === s ? cfg.color : cfg.bg,
                          color: selected.status === s ? "#fff" : cfg.color,
                          border: `0.5px solid ${cfg.color}40`,
                        }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                          style={{ background: selected.status === s ? "rgba(255,255,255,0.8)" : cfg.dot }} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-3">
                <a href={`tel:${selected.telefoon}`}
                  className="touch-scale flex-1 py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2"
                  style={{ background: "#2B4030", color: "#F5EFE5", border: "none" }}>
                  <Phone size={16} /> Bellen
                </a>
                <a href={`mailto:${selected.email}`}
                  className="touch-scale flex-1 py-3.5 rounded-full font-medium text-sm flex items-center justify-center gap-2"
                  style={{ background: "transparent", border: "0.5px solid #E5DDD0", color: "#5C5C56" }}>
                  <Mail size={16} /> E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add sheet ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl p-6"
            style={{ background: "#F5EFE5" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "#E5DDD0" }} />
            <div className="flex flex-col items-center gap-4 py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                <Users size={28} style={{ color: "#2B4030" }} />
              </div>
              <div className="text-center">
                <h2 className="font-bold text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>Teamlid toevoegen</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#5C5C56" }}>
                  Nodig een collega of onderaannemer uit via WhatsApp of e-mail om deel te nemen aan jouw Servr team.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-full py-4 rounded-full font-medium text-white flex items-center justify-center gap-2"
                  style={{ background: "#2B4030", border: "none" }}>
                  📱 Uitnodigen via WhatsApp
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-full py-4 rounded-full font-medium flex items-center justify-center gap-2"
                  style={{ background: "transparent", border: "0.5px solid #E5DDD0", color: "#5C5C56" }}>
                  <Mail size={18} /> Uitnodigen via e-mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
