"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Users, Phone, Mail, MapPin,
  Clock, Euro, CheckCircle2, X, Star, Wrench, ChevronRight,
  Calendar, TrendingUp, AlertCircle, MoreHorizontal,
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
  monteur:        { label: "Monteur",        color: "#4F46E5", bg: "#EEF2FF" },
  leerling:       { label: "Leerling",       color: "#10B981", bg: "#ECFDF5" },
  assistent:      { label: "Assistent",      color: "#0EA5E9", bg: "#F0F9FF" },
  onderaannemer:  { label: "Onderaannemer",  color: "#8B5CF6", bg: "#F5F3FF" },
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
    <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ChevronLeft size={20} style={{ color: "#475569" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Personeel</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Team & onderaannemers beheren</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.4)" }}>
          <Plus size={20} />
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { v: stats.actief,                       l: "Actief",       c: "#10B981", bg: "#ECFDF5" },
            { v: `${stats.week_uren}u`,               l: "Uren/week",    c: "#4F46E5", bg: "#EEF2FF" },
            { v: `€${(stats.maand_kosten/1000).toFixed(1)}k`, l: "Maand kosten", c: "#0EA5E9", bg: "#F0F9FF" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl p-4 flex flex-col items-center gap-1"
              style={{ background: s.bg }}>
              <span className="font-black text-xl" style={{ color: s.c }}>{s.v}</span>
              <span className="text-[10px] font-bold" style={{ color: s.c }}>{s.l}</span>
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
                className="touch-scale flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold"
                style={{
                  background: active ? (cfg?.color ?? "#4F46E5") : "#fff",
                  color: active ? "#fff" : "#64748b",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                {cfg && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: active ? "rgba(255,255,255,0.8)" : cfg.dot }} />}
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
                className="touch-scale w-full rounded-3xl p-4 text-left"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={p.avatar} alt={p.naam}
                      className="w-14 h-14 rounded-2xl object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ background: sCfg.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{p.naam}</p>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg flex-shrink-0"
                        style={{ background: rCfg.bg, color: rCfg.color }}>{rCfg.label}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.specialiteit}</p>
                    {p.lopende_klus && (
                      <p className="text-xs mt-1 truncate" style={{ color: "#4F46E5" }}>
                        🔧 {p.lopende_klus}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <span className="text-xs font-black px-2 py-1 rounded-xl"
                      style={{ background: sCfg.bg, color: sCfg.color }}>{sCfg.label}</span>
                    <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>€{p.uurtarief}/u</span>
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
              {/* Profile */}
              <div className="rounded-3xl p-5 flex flex-col items-center gap-3"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <img src={selected.avatar} alt={selected.naam}
                  className="w-20 h-20 rounded-3xl object-cover"
                  style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }} />
                <div className="text-center">
                  <p className="font-black text-lg" style={{ color: "#0f172a" }}>{selected.naam}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: ROL_CFG[selected.rol].bg, color: ROL_CFG[selected.rol].color }}>
                      {ROL_CFG[selected.rol].label}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
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
                    <div key={r.l} className="rounded-2xl py-3 flex flex-col items-center"
                      style={{ background: "#F8FAFF" }}>
                      <p className="font-black text-base" style={{ color: "#4F46E5" }}>{r.v}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>{r.l}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Contact */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                {[
                  { icon: Phone,   label: "Telefoon",     value: selected.telefoon },
                  { icon: Mail,    label: "E-mail",        value: selected.email },
                  { icon: Euro,    label: "Uurtarief",     value: `€${selected.uurtarief}/uur` },
                  { icon: Calendar, label: "In dienst",    value: `Sinds ${selected.in_dienst_sinds}` },
                ].map((row, i, arr) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-3.5"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "#EEF2FF" }}>
                        <Icon size={14} style={{ color: "#4F46E5" }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>{row.label}</p>
                        <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Status change */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Status wijzigen</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CFG) as PersoonStatus[]).map(s => {
                    const cfg = STATUS_CFG[s];
                    return (
                      <button key={s} onClick={() => changeStatus(selected.id, s)}
                        className="touch-scale py-3 rounded-2xl font-bold text-xs"
                        style={{
                          background: selected.status === s ? cfg.color : cfg.bg,
                          color: selected.status === s ? "#fff" : cfg.color,
                          border: `1.5px solid ${cfg.color}30`,
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
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <Phone size={16} /> Bellen
                </a>
                <a href={`mailto:${selected.email}`}
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "#F0F9FF", color: "#0EA5E9" }}>
                  <Mail size={16} /> E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add sheet (simplified) ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl p-6"
            style={{ background: "#F1F4FA" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: "#E2E8F0" }} />
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: "#EEF2FF" }}>
                <Users size={28} style={{ color: "#4F46E5" }} />
              </div>
              <div className="text-center">
                <h2 className="font-black text-xl" style={{ color: "#0f172a" }}>Teamlid toevoegen</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: "#64748b" }}>
                  Nodig een collega of onderaannemer uit via WhatsApp of e-mail om deel te nemen aan jouw Servr team.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 8px 24px rgba(37,211,102,0.35)" }}>
                  📱 Uitnodigen via WhatsApp
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="touch-scale w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                  style={{ background: "#EEF2FF", color: "#4F46E5" }}>
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
