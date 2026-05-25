"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Clock, MapPin, Phone, ChevronRight, ChevronLeft,
  Navigation, Zap, X, Check, Coffee, Edit3, Trash2, User,
  Package, Euro, TrendingUp, Route, CalendarDays, List,
  Grid3X3, ChevronDown, AlertCircle, Car, Wrench, CheckCircle,
  Flame, Star, Camera, FileText,
} from "lucide-react";
import { useAgendaStore, DAG_LABELS_LANG } from "@/lib/agendaStore";

/* ═══════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════ */
type Status = "gepland" | "onderweg" | "bezig" | "klaar" | "gefactureerd";

type Afspraak = {
  id: string;
  datum: string;
  start: string;
  eind: string;
  status: Status;
  klant: string;
  klantTelefoon: string;
  klantAdres: string;
  lat: number;
  lng: number;
  dienst: string;
  categorie: string;
  notitie: string;
  materialen: string[];
  prijs: number;
};

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; next: Status | null }> = {
  gepland:      { label: "Gepland",      color: "#6366F1", bg: "#EEF2FF",  next: "onderweg"    },
  onderweg:     { label: "Onderweg",     color: "#F59E0B", bg: "#FFFBEB",  next: "bezig"       },
  bezig:        { label: "Bezig",        color: "#3B82F6", bg: "#EFF6FF",  next: "klaar"       },
  klaar:        { label: "Klaar",        color: "#10B981", bg: "#ECFDF5",  next: "gefactureerd"},
  gefactureerd: { label: "Gefactureerd", color: "#8B5CF6", bg: "#F5F3FF",  next: null          },
};

const CAT_COLORS: Record<string, string> = {
  loodgieter: "#3B82F6", elektricien: "#F59E0B", schilder: "#EC4899",
  timmerman: "#92400E",  schoonmaak: "#10B981",  tuinman: "#16A34A",
  hvac: "#06B6D4",       klusser: "#8B5CF6",     tegels: "#0EA5E9",
  airco: "#22D3EE",      parket: "#D97706",      andere: "#6366F1",
};
function catColor(c: string) { return CAT_COLORS[c] ?? "#6366F1"; }

const MAANDEN_LANG = ["januari","februari","maart","april","mei","juni",
  "juli","augustus","september","oktober","november","december"];
const DAG_SHORT = ["Zo","Ma","Di","Wo","Do","Vr","Za"];

/* ═══════════════════════════════════════════════
   MOCK DATA — rijke afspraken
═══════════════════════════════════════════════ */
const VANDAAG = "2026-05-25";
const HOME_LAT = 52.3676, HOME_LNG = 4.9041; // Marco's home base

const INIT_AFSPRAKEN: Afspraak[] = [
  {
    id: "a1", datum: "2026-05-25", start: "08:00", eind: "09:30",
    status: "klaar",
    klant: "Anita van der Berg", klantTelefoon: "06-12345678",
    klantAdres: "Prinsengracht 124, Amsterdam",
    lat: 52.3738, lng: 4.8847,
    dienst: "Lekkende kraan repareren", categorie: "loodgieter",
    notitie: "Kraan onder aanrecht links lekt bij aansluiting",
    materialen: ["Pakking set ½\"", "Moersleutel 17-19mm", "Teflon tape", "Emmer"],
    prijs: 85,
  },
  {
    id: "a2", datum: "2026-05-25", start: "10:00", eind: "12:00",
    status: "bezig",
    klant: "Thomas Bakker", klantTelefoon: "06-98765432",
    klantAdres: "Keizersgracht 312, Amsterdam",
    lat: 52.3713, lng: 4.8894,
    dienst: "CV ketel inspectie + onderhoud", categorie: "hvac",
    notitie: "Jaarlijkse beurt. Heeft magneet filter laten weten.",
    materialen: ["Analyzer kit", "CV vloeistof", "Filter magneet", "Onderdelen kit"],
    prijs: 120,
  },
  {
    id: "a3", datum: "2026-05-25", start: "13:30", eind: "15:00",
    status: "onderweg",
    klant: "Sofia Martins", klantTelefoon: "06-55512345",
    klantAdres: "Ferdinand Bolstraat 88, Amsterdam",
    lat: 52.3546, lng: 4.8975,
    dienst: "Stopcontact plaatsen (3x)", categorie: "elektricien",
    notitie: "3 extra stopcontacten slaapkamer + werkkamer",
    materialen: ["Stopcontacten 16A (3x)", "Kabelgoot", "Kruiskopschroevendraaier", "Tester"],
    prijs: 95,
  },
  {
    id: "a4", datum: "2026-05-25", start: "15:30", eind: "17:30",
    status: "gepland",
    klant: "Piet Jansen", klantTelefoon: "06-11112222",
    klantAdres: "Overtoom 201, Amsterdam",
    lat: 52.3634, lng: 4.8747,
    dienst: "Badkamertegels herstellen", categorie: "tegels",
    notitie: "4 losliggende tegels + voegen bijwerken",
    materialen: ["Tegellijm", "Voegmiddel grijs", "Spatel set", "Slijper", "Reservetegels (6x)"],
    prijs: 110,
  },
  {
    id: "a5", datum: "2026-05-26", start: "09:00", eind: "11:00",
    status: "gepland",
    klant: "Mia Dubois", klantTelefoon: "06-33334444",
    klantAdres: "Vondelstraat 45, Amsterdam",
    lat: 52.3602, lng: 4.8775,
    dienst: "Houten vloer schuren + lakken", categorie: "parket",
    notitie: "Woonkamer 28m² — 2 lagen lak",
    materialen: ["Schuurmachine", "Schuurpapier P80/P120", "Houten vloerlak (3L)", "Kwast 10cm", "Afplaktape"],
    prijs: 280,
  },
  {
    id: "a6", datum: "2026-05-27", start: "10:00", eind: "12:30",
    status: "gepland",
    klant: "Kevin de Groot", klantTelefoon: "06-77778888",
    klantAdres: "Rozengracht 78, Amsterdam",
    lat: 52.3721, lng: 4.8776,
    dienst: "Airco installeren (3.5kW)", categorie: "airco",
    notitie: "Mural split unit. Buiten unit op balkon.",
    materialen: ["Airco unit + remote", "Koelleiding 3m", "Boorset", "Muurbeugel buiten"],
    prijs: 350,
  },
];

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function reistijd(km: number) { return Math.max(5, Math.round(km / 25 * 60)); }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tmin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function datumLabel(ymd: string) {
  const d = new Date(ymd + "T12:00");
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => { const nd = new Date(d); nd.setDate(d.getDate() + i); return nd; });
}

function getMaandDates(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ═══════════════════════════════════════════════
   DAG PLANNER SHEET  (route + materialen)
═══════════════════════════════════════════════ */
function DagPlannerSheet({ afspraken, datum, onClose }: {
  afspraken: Afspraak[]; datum: string; onClose: () => void;
}) {
  const sorted = [...afspraken].sort((a, b) => a.start.localeCompare(b.start));
  const totalOmzet = sorted.reduce((t, a) => t + a.prijs, 0);
  const totalWerk = sorted.reduce((t, a) => t + tmin(a.eind) - tmin(a.start), 0);

  // Route calculation
  type Leg = { km: number; min: number };
  const legs: Leg[] = [];
  let prevLat = HOME_LAT, prevLng = HOME_LNG;
  sorted.forEach(a => {
    const km = haversine(prevLat, prevLng, a.lat, a.lng);
    legs.push({ km: Math.round(km * 10) / 10, min: reistijd(km) });
    prevLat = a.lat; prevLng = a.lng;
  });
  const retKm = haversine(prevLat, prevLng, HOME_LAT, HOME_LNG);
  const totalKm = legs.reduce((t, l) => t + l.km, 0) + retKm;

  // Google Maps multi-stop route
  const mapsUrl = sorted.length > 0
    ? `https://www.google.com/maps/dir/${HOME_LAT},${HOME_LNG}/${sorted.map(a => `${a.lat},${a.lng}`).join("/")}/${HOME_LAT},${HOME_LNG}`
    : "";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[96dvh]"
        style={{ background: "#F1F4FA", borderRadius: "28px 28px 0 0", maxWidth: 480, margin: "0 auto" }}
        onClick={e => e.stopPropagation()}>

        {/* Handle + header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-4"
          style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: "28px 28px 0 0" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-white" style={{ fontSize: 20 }}>🗺️ Dag plannen</h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{datumLabel(datum)}</p>
            </div>
            <button onClick={onClose}
              className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <X size={17} color="white" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: String(sorted.length), l: "klussen", icon: "🔧" },
              { v: `${Math.round(totalWerk / 60 * 10) / 10}u`, l: "werk", icon: "⏱️" },
              { v: `${Math.round(totalKm)}km`, l: "rijden", icon: "🚗" },
              { v: `€${totalOmzet}`, l: "omzet", icon: "💰" },
            ].map(s => (
              <div key={s.l} className="flex flex-col items-center py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                <span className="text-base mb-0.5">{s.icon}</span>
                <span className="font-black text-white text-sm leading-none">{s.v}</span>
                <span className="text-[9px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable route */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-0">

          {/* Navigate button */}
          {sorted.length > 0 && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="touch-scale flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-black text-white text-sm mb-5"
              style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 6px 20px rgba(16,185,129,0.4)" }}>
              <Navigation size={17} /> Volledige route in Google Maps
            </a>
          )}

          {/* Start: thuis */}
          <div className="flex items-center gap-3 mb-0">
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "#EEF2FF" }}>
                <span style={{ fontSize: 20 }}>🏠</span>
              </div>
              <div className="w-0.5 flex-1 mt-1" style={{ background: "#E2E8F0", minHeight: 24 }} />
            </div>
            <div className="pb-5">
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Thuis — vertrekpunt</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Prinsengracht 263, Amsterdam</p>
            </div>
          </div>

          {sorted.map((a, i) => {
            const sc = STATUS_CFG[a.status];
            const leg = legs[i];
            return (
              <div key={a.id} className="flex gap-3">
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
                  {/* Travel indicator */}
                  <div className="flex flex-col items-center py-2 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl"
                      style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <Car size={12} style={{ color: "#D97706" }} />
                      <span className="text-[9px] font-black" style={{ color: "#D97706" }}>{leg.min}m</span>
                      <span className="text-[9px] font-medium" style={{ color: "#D97706" }}>{leg.km}km</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: catColor(a.categorie) + "20", border: `2px solid ${catColor(a.categorie)}` }}>
                    <span className="font-black text-sm" style={{ color: catColor(a.categorie) }}>{i + 1}</span>
                  </div>
                  {i < sorted.length - 1 && (
                    <div className="w-0.5 flex-1 mt-1" style={{ background: "#E2E8F0", minHeight: 16 }} />
                  )}
                </div>

                {/* Job card */}
                <div className="flex-1 mb-3">
                  {/* Travel time label */}
                  <div className="flex items-center gap-1.5 py-2">
                    <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
                  </div>

                  <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                    <div style={{ height: 3, background: catColor(a.categorie) }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-black text-sm" style={{ color: "#0f172a" }}>{a.dienst}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color: "#94a3b8" }}>{a.start} – {a.eind}</p>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full ml-2"
                          style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-2">
                        <User size={12} style={{ color: "#64748b" }} />
                        <p className="text-xs font-semibold" style={{ color: "#0f172a" }}>{a.klant}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin size={12} style={{ color: "#64748b" }} />
                        <p className="text-xs" style={{ color: "#64748b" }}>{a.klantAdres}</p>
                      </div>
                      {a.notitie && (
                        <div className="px-3 py-2 rounded-xl mb-2" style={{ background: "#F8FAFC" }}>
                          <p className="text-xs" style={{ color: "#64748b" }}>📝 {a.notitie}</p>
                        </div>
                      )}

                      {/* Materialen */}
                      <div className="mt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>
                          🧰 Meenemen
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {a.materialen.map(m => (
                            <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                              style={{ background: catColor(a.categorie) + "15", color: catColor(a.categorie) }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2"
                        style={{ borderTop: "1px solid #F1F5F9" }}>
                        <a href={`tel:${a.klantTelefoon}`}
                          className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                          style={{ background: "#ECFDF5", color: "#10B981" }}>
                          <Phone size={12} /> Bellen
                        </a>
                        <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noopener noreferrer"
                          className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                          style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                          <Navigation size={12} /> Navigeer
                        </a>
                        <span className="font-black text-sm" style={{ color: "#0f172a" }}>€{a.prijs}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Return home */}
          {sorted.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex flex-col items-center flex-shrink-0" style={{ width: 40 }}>
                <div className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl mb-2"
                  style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <Car size={12} style={{ color: "#D97706" }} />
                  <span className="text-[9px] font-black" style={{ color: "#D97706" }}>{reistijd(retKm)}m</span>
                  <span className="text-[9px]" style={{ color: "#D97706" }}>{Math.round(retKm * 10) / 10}km</span>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#F1F5F9" }}>
                  <span style={{ fontSize: 20 }}>🏠</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#94a3b8" }}>Terug naar huis</p>
                <p className="text-xs" style={{ color: "#cbd5e1" }}>Totaal: {Math.round(totalKm)} km gereden</p>
              </div>
            </div>
          )}

          {sorted.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-3 text-center">
              <span style={{ fontSize: 48 }}>🗓️</span>
              <p className="font-bold" style={{ color: "#0f172a" }}>Geen afspraken vandaag</p>
              <p className="text-sm" style={{ color: "#94a3b8" }}>Voeg klanten toe via de "+" knop</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   AFSPRAAK FORM — voeg klant toe / bewerken
═══════════════════════════════════════════════ */
const TIJDEN = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
).flat().filter(t => t >= "06:00" && t <= "20:30");

const CATEGORIEËN = [
  { id: "loodgieter", label: "Loodgieter" },
  { id: "elektricien", label: "Elektricien" },
  { id: "schilder", label: "Schilder" },
  { id: "timmerman", label: "Timmerman" },
  { id: "hvac", label: "HVAC / Verwarming" },
  { id: "tegels", label: "Tegels" },
  { id: "parket", label: "Parket" },
  { id: "airco", label: "Airco" },
  { id: "klusser", label: "Klusser" },
  { id: "schoonmaak", label: "Schoonmaak" },
  { id: "andere", label: "Andere" },
];

type AfspraakFormData = Omit<Afspraak, "id" | "lat" | "lng" | "materialen"> & { materiaalInput: string; materialen: string[] };

function AfspraakFormSheet({ datum, existing, onSave, onClose }: {
  datum: string;
  existing?: Afspraak;
  onSave: (a: Afspraak) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AfspraakFormData>({
    datum,
    start: existing?.start ?? "09:00",
    eind: existing?.eind ?? "10:30",
    status: existing?.status ?? "gepland",
    klant: existing?.klant ?? "",
    klantTelefoon: existing?.klantTelefoon ?? "",
    klantAdres: existing?.klantAdres ?? "",
    dienst: existing?.dienst ?? "",
    categorie: existing?.categorie ?? "andere",
    notitie: existing?.notitie ?? "",
    materialen: existing?.materialen ?? [],
    materiaalInput: "",
    prijs: existing?.prijs ?? 0,
  });

  const up = <K extends keyof AfspraakFormData>(k: K, v: AfspraakFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const addMateriaal = () => {
    if (!form.materiaalInput.trim()) return;
    up("materialen", [...form.materialen, form.materiaalInput.trim()]);
    up("materiaalInput", "");
  };

  const isValid = !!(form.klant.trim() && form.dienst.trim() && form.klantAdres.trim());

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      id: existing?.id ?? `a${Date.now()}`,
      datum: form.datum,
      start: form.start, eind: form.eind,
      status: form.status,
      klant: form.klant.trim(),
      klantTelefoon: form.klantTelefoon.trim(),
      klantAdres: form.klantAdres.trim(),
      lat: existing?.lat ?? 52.37 + Math.random() * 0.02 - 0.01,
      lng: existing?.lng ?? 4.89 + Math.random() * 0.02 - 0.01,
      dienst: form.dienst.trim(),
      categorie: form.categorie,
      notitie: form.notitie.trim(),
      materialen: form.materialen,
      prijs: form.prijs,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[96dvh]"
        style={{ background: "#F1F4FA", borderRadius: "28px 28px 0 0", maxWidth: 480, margin: "0 auto" }}
        onClick={e => e.stopPropagation()}>

        <div className="flex-shrink-0 px-5 pt-4 pb-4" style={{ borderBottom: "1px solid #E8EDF4" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>
                {existing ? "Afspraak bewerken" : "Klant toevoegen"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{datumLabel(form.datum)}</p>
            </div>
            <button onClick={onClose} className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "#F1F5F9" }}>
              <X size={16} style={{ color: "#64748b" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">

          {/* Klant info */}
          <Section label="👤 Klantgegevens">
            <FInput label="Naam klant *" value={form.klant} onChange={v => up("klant", v)} placeholder="Voor- en achternaam" />
            <FInput label="Telefoon" value={form.klantTelefoon} onChange={v => up("klantTelefoon", v)} placeholder="+31 6 ..." type="tel" />
            <FInput label="Adres *" value={form.klantAdres} onChange={v => up("klantAdres", v)} placeholder="Straat 12, Amsterdam" />
          </Section>

          {/* Dienst */}
          <Section label="🔧 Dienst">
            <FInput label="Omschrijving *" value={form.dienst} onChange={v => up("dienst", v)} placeholder="bijv. Lekkage repareren keuken" />
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Categorie</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIEËN.map(c => (
                  <button key={c.id} onClick={() => up("categorie", c.id)}
                    className="touch-scale px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: form.categorie === c.id ? catColor(c.id) : "#fff",
                      color: form.categorie === c.id ? "white" : "#64748b",
                      boxShadow: form.categorie === c.id ? `0 4px 12px ${catColor(c.id)}50` : "0 2px 6px rgba(0,0,0,0.06)",
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Prijs */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Prijs (€)</label>
              <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                style={{ background: "#fff", border: `2px solid ${form.prijs ? "#4F46E5" : "#E5E7EB"}` }}>
                <span className="font-black" style={{ color: "#4F46E5" }}>€</span>
                <input type="number" value={form.prijs || ""} onChange={e => up("prijs", +e.target.value)}
                  inputMode="decimal" className="flex-1 bg-transparent outline-none font-black text-lg"
                  style={{ color: "#0f172a" }} />
              </div>
            </div>
          </Section>

          {/* Tijden */}
          <Section label="⏰ Tijdstip">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Van</label>
                <select value={form.start} onChange={e => up("start", e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "2px solid #4F46E5", background: "#F8F8FF", color: "#0f172a", fontWeight: 700, fontSize: 15, outline: "none" }}>
                  {TIJDEN.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Tot</label>
                <select value={form.eind} onChange={e => up("eind", e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#FAFAFA", color: "#0f172a", fontWeight: 700, fontSize: 15, outline: "none" }}>
                  {TIJDEN.filter(t => t > form.start).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Notitie */}
          <Section label="📝 Notitie">
            <textarea value={form.notitie} onChange={e => up("notitie", e.target.value)}
              placeholder="Instructies, aandachtspunten, toegang, ..."
              rows={2}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "2px solid #E5E7EB", background: "#fff", fontSize: 14, color: "#0f172a", resize: "none", outline: "none", boxSizing: "border-box" }} />
          </Section>

          {/* Materialen */}
          <Section label="🧰 Benodigde materialen">
            <div className="flex gap-2">
              <input value={form.materiaalInput} onChange={e => up("materiaalInput", e.target.value)}
                onKeyDown={e => e.key === "Enter" && addMateriaal()}
                placeholder="bijv. Teflon tape"
                style={{ flex: 1, padding: "12px 14px", borderRadius: 14, border: "2px solid #E5E7EB", background: "#fff", fontSize: 14, color: "#0f172a", outline: "none" }} />
              <button onClick={addMateriaal}
                className="touch-scale w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}>
                <Plus size={18} color="white" />
              </button>
            </div>
            {form.materialen.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.materialen.map((m, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: catColor(form.categorie) + "15", color: catColor(form.categorie) }}>
                    {m}
                    <button onClick={() => up("materialen", form.materialen.filter((_, j) => j !== i))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Section>

          <button onClick={handleSave} disabled={!isValid}
            className="touch-scale w-full py-4 rounded-2xl font-black text-white"
            style={{
              background: isValid ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#E2E8F0",
              color: isValid ? "white" : "#94a3b8",
              boxShadow: isValid ? "0 8px 28px rgba(79,70,229,0.4)" : "none",
            }}>
            {existing ? "Wijzigingen opslaan" : "Klant toevoegen ✓"}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: "#94a3b8" }}>{label}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>
        {label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", padding: "13px 15px", borderRadius: 14,
          border: `2px solid ${value ? "#4F46E5" : "#E5E7EB"}`,
          background: value ? "#F8F8FF" : "#fff",
          fontSize: 14, fontWeight: 600, color: "#0f172a", outline: "none",
          boxShadow: value ? "0 0 0 4px rgba(79,70,229,0.07)" : "none",
          boxSizing: "border-box" as const,
        }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AFSPRAAK KAART — in dag/week view
═══════════════════════════════════════════════ */
function AfspraakKaart({ afspraak, onStatusNext, onEdit, onDelete }: {
  afspraak: Afspraak;
  onStatusNext: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sc = STATUS_CFG[afspraak.status];
  const cc = catColor(afspraak.categorie);
  const duur = tmin(afspraak.eind) - tmin(afspraak.start);
  const [expanded, setExpanded] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div style={{ background: "#fff", borderRadius: 22, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      {/* Color bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${cc}, ${cc}88)` }} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Time */}
          <div className="flex-shrink-0 text-center" style={{ minWidth: 52 }}>
            <p className="font-black text-base leading-none" style={{ color: cc }}>{afspraak.start}</p>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#94a3b8" }}>{afspraak.eind}</p>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: "#cbd5e1" }}>{duur}m</p>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight" style={{ color: "#0f172a" }}>{afspraak.dienst}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <User size={11} style={{ color: "#94a3b8" }} />
              <p className="text-xs font-semibold" style={{ color: "#475569" }}>{afspraak.klant}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin size={11} style={{ color: "#94a3b8" }} />
              <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{afspraak.klantAdres}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <button onClick={onStatusNext} disabled={!sc.next}
              className="touch-scale text-[11px] font-black px-2.5 py-1.5 rounded-full"
              style={{ background: sc.bg, color: sc.color, opacity: sc.next ? 1 : 0.6 }}>
              {sc.label} {sc.next && "→"}
            </button>
            <span className="font-black text-sm" style={{ color: "#0f172a" }}>€{afspraak.prijs}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(e => !e)}
          className="touch-scale flex items-center gap-1.5 mt-3 text-xs font-bold"
          style={{ color: "#94a3b8" }}>
          <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          {expanded ? "Minder" : "Details + materialen"}
        </button>

        {expanded && (
          <div className="mt-3 flex flex-col gap-3 animate-slide-up">
            {/* Materialen */}
            {afspraak.materialen.length > 0 && (
              <div className="px-3 py-3 rounded-2xl" style={{ background: "#F8FAFC" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
                  🧰 Meenemen
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {afspraak.materialen.map(m => (
                    <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cc + "15", color: cc }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notitie */}
            {afspraak.notitie && (
              <div className="px-3 py-2.5 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-xs" style={{ color: "#92400E" }}>📝 {afspraak.notitie}</p>
              </div>
            )}

            {/* Actions */}
            {confirmDel ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#FEF2F2" }}>
                <p className="flex-1 text-xs font-semibold" style={{ color: "#DC2626" }}>Verwijderen?</p>
                <button onClick={() => setConfirmDel(false)} className="touch-scale px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "#fff", color: "#64748b" }}>Nee</button>
                <button onClick={onDelete} className="touch-scale px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: "#DC2626" }}>Ja</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <a href={`tel:${afspraak.klantTelefoon}`}
                  className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: "#ECFDF5", color: "#10B981" }}>
                  <Phone size={13} /> {afspraak.klantTelefoon || "Bellen"}
                </a>
                <a href={`https://maps.google.com/?q=${afspraak.lat},${afspraak.lng}`} target="_blank" rel="noopener noreferrer"
                  className="touch-scale flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold px-4"
                  style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  <Navigation size={13} />
                </a>
                <button onClick={onEdit}
                  className="touch-scale flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold px-4"
                  style={{ background: "#F1F5F9", color: "#475569" }}>
                  <Edit3 size={13} />
                </button>
                <button onClick={() => setConfirmDel(true)}
                  className="touch-scale flex items-center justify-center py-2.5 rounded-xl text-xs px-4"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   WERKSCHEMA TAB (compact)
═══════════════════════════════════════════════ */
const SCHEMA_TIJDEN = Array.from({ length: 24 }, (_, h) =>
  ["00", "30"].map(m => `${String(h).padStart(2, "0")}:${m}`)
).flat().filter(t => t >= "05:00" && t <= "22:00");

function WerkschemaTab() {
  const { schema, setDag, addPauze, removePauze } = useAgendaStore();
  const [saved, setSaved] = useState(false);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [newP, setNewP] = useState({ start: "12:00", eind: "13:00" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 px-4 py-4 rounded-2xl" style={{ background: "#EEF2FF" }}>
        <CalendarDays size={15} style={{ color: "#4F46E5", marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: "#3730A3" }}>
          <strong>Werkschema:</strong> Klanten kunnen alleen boeken in jouw beschikbare uren.
        </p>
      </div>
      {[1,2,3,4,5,6,0].map(di => {
        const d = schema[di];
        return (
          <div key={di} style={{ background: "#fff", borderRadius: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button onClick={() => setDag(di, { actief: !d.actief })}
                className="touch-scale w-11 h-6 rounded-full flex-shrink-0 relative"
                style={{ background: d.actief ? "#4F46E5" : "#E2E8F0" }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                  style={{ left: d.actief ? "calc(100% - 22px)" : "2px", transition: "left 0.2s" }} />
              </button>
              <p className="flex-1 font-black text-sm" style={{ color: d.actief ? "#0f172a" : "#94a3b8" }}>
                {DAG_LABELS_LANG[di]}
              </p>
              {d.actief && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                  {d.start}–{d.eind}
                </span>
              )}
            </div>
            {d.actief && (
              <div className="px-4 pb-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid #F1F5F9" }}>
                <div className="pt-3 grid grid-cols-2 gap-2">
                  {["start", "eind"].map(k => (
                    <div key={k}>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
                        {k === "start" ? "Begin" : "Einde"}
                      </label>
                      <select value={d[k as "start" | "eind"]}
                        onChange={e => setDag(di, { [k]: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 12, border: "2px solid #E5E7EB", background: "#FAFAFA", color: "#0f172a", fontWeight: 700, fontSize: 13, outline: "none" }}>
                        {SCHEMA_TIJDEN.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                {d.pauzes.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                    <Coffee size={12} style={{ color: "#D97706" }} />
                    <span className="flex-1 text-xs font-bold" style={{ color: "#92400E" }}>Pauze {p.start}–{p.eind}</span>
                    <button onClick={() => removePauze(di, i)}
                      className="touch-scale w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "#FDE68A" }}>
                      <X size={10} style={{ color: "#D97706" }} />
                    </button>
                  </div>
                ))}
                {addingFor === di ? (
                  <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "#F8FAFC" }}>
                    <div className="grid grid-cols-2 gap-2">
                      {["start","eind"].map(k => (
                        <select key={k} value={newP[k as "start"|"eind"]}
                          onChange={e => setNewP(p => ({ ...p, [k]: e.target.value }))}
                          style={{ padding: "8px 10px", borderRadius: 10, border: "2px solid #E5E7EB", background: "white", color: "#0f172a", fontWeight: 600, fontSize: 12, outline: "none" }}>
                          {SCHEMA_TIJDEN.filter(t => k === "start" ? (t >= d.start && t < d.eind) : (t > newP.start && t <= d.eind)).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setAddingFor(null)} className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold"
                        style={{ background: "#F1F5F9", color: "#64748b" }}>Annuleren</button>
                      <button onClick={() => { addPauze(di, newP); setAddingFor(null); setNewP({ start: "12:00", eind: "13:00" }); }}
                        className="touch-scale flex-1 py-2 rounded-xl text-xs font-black text-white"
                        style={{ background: "#D97706" }}>Toevoegen</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingFor(di)}
                    className="touch-scale flex items-center gap-1.5 text-xs font-bold"
                    style={{ color: "#D97706" }}>
                    <Coffee size={12} /> + Pauze
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button onClick={() => setSaved(true)}
        className="touch-scale w-full py-4 rounded-2xl font-black text-white"
        style={{
          background: saved ? "linear-gradient(135deg,#10B981,#34D399)" : "linear-gradient(135deg,#4F46E5,#818CF8)",
          boxShadow: "0 6px 20px rgba(79,70,229,0.35)",
        }}>
        {saved ? "✓ Opgeslagen!" : "Werkschema opslaan"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAAND VIEW
═══════════════════════════════════════════════ */
function MaandView({ afspraken, selectedDay, onSelectDay }: {
  afspraken: Afspraak[]; selectedDay: string; onSelectDay: (d: string) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date("2026-05-01"));
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const cells = getMaandDates(year, month);
  const vandaag = toYMD(new Date());

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <ChevronLeft size={17} style={{ color: "#475569" }} />
        </button>
        <p className="font-black text-base capitalize" style={{ color: "#0f172a" }}>
          {MAANDEN_LANG[month]} {year}
        </p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <ChevronRight size={17} style={{ color: "#475569" }} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d => (
          <p key={d} className="text-center text-[11px] font-black" style={{ color: "#94a3b8" }}>{d}</p>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const ymd = toYMD(date);
          const dayAfspraken = afspraken.filter(a => a.datum === ymd);
          const isSelected = ymd === selectedDay;
          const isVandaag = ymd === vandaag;
          const hasAfspraken = dayAfspraken.length > 0;
          return (
            <button key={i} onClick={() => onSelectDay(ymd)}
              className="touch-scale flex flex-col items-center py-2 rounded-xl"
              style={{
                background: isSelected ? "linear-gradient(135deg, #4F46E5, #818CF8)" : isVandaag ? "#EEF2FF" : "transparent",
                boxShadow: isSelected ? "0 4px 12px rgba(79,70,229,0.35)" : "none",
              }}>
              <span className="font-black text-sm" style={{ color: isSelected ? "white" : isVandaag ? "#4F46E5" : "#0f172a" }}>
                {date.getDate()}
              </span>
              {hasAfspraken ? (
                <div className="flex gap-0.5 mt-0.5">
                  {dayAfspraken.slice(0, 3).map((a, j) => (
                    <span key={j} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isSelected ? "rgba(255,255,255,0.8)" : catColor(a.categorie) }} />
                  ))}
                </div>
              ) : <div className="h-2" />}
            </button>
          );
        })}
      </div>

      {/* Selected day afspraken */}
      {selectedDay && (
        <div className="mt-5">
          <p className="font-black text-sm mb-3" style={{ color: "#0f172a" }}>
            {datumLabel(selectedDay)}
          </p>
          {afspraken.filter(a => a.datum === selectedDay).length === 0 ? (
            <div className="flex items-center gap-3 py-4 px-4 rounded-2xl" style={{ background: "#fff" }}>
              <CalendarDays size={18} style={{ color: "#94a3b8" }} />
              <p className="text-sm" style={{ color: "#94a3b8" }}>Niets gepland</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {afspraken.filter(a => a.datum === selectedDay).map(a => {
                const sc = STATUS_CFG[a.status];
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", borderLeft: `4px solid ${catColor(a.categorie)}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{a.dienst}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{a.start}–{a.eind} · {a.klant}</p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <span className="font-black text-sm flex-shrink-0" style={{ color: "#0f172a" }}>€{a.prijs}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
type View = "dag" | "week" | "maand" | "schema";

export default function AgendaPage() {
  const [afspraken, setAfspraken] = useState<Afspraak[]>(INIT_AFSPRAKEN);
  const [view, setView] = useState<View>("dag");
  const [selectedDay, setSelectedDay] = useState(VANDAAG);
  const [weekBase, setWeekBase] = useState(new Date("2026-05-19"));
  const [showPlanner, setShowPlanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAfspraak, setEditAfspraak] = useState<Afspraak | undefined>();

  const weekDagen = getWeekDates(weekBase);
  const vandaagAfspraken = afspraken.filter(a => a.datum === selectedDay)
    .sort((a, b) => a.start.localeCompare(b.start));
  const vandaagOmzet = vandaagAfspraken.reduce((t, a) => t + a.prijs, 0);
  const vandaagKlaar = vandaagAfspraken.filter(a => a.status === "klaar" || a.status === "gefactureerd").length;

  const statusNext = (id: string) => {
    setAfspraken(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = STATUS_CFG[a.status].next;
      return next ? { ...a, status: next } : a;
    }));
  };
  const deleteAfspraak = (id: string) => setAfspraken(prev => prev.filter(a => a.id !== id));
  const saveAfspraak = (a: Afspraak) => {
    setAfspraken(prev => prev.some(x => x.id === a.id) ? prev.map(x => x.id === a.id ? a : x) : [...prev, a]);
    setEditAfspraak(undefined);
  };

  const maandLabel = `${MAANDEN_LANG[weekDagen[0].getMonth()]} ${weekDagen[0].getFullYear()}`;

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 pt-14 pb-3"
        style={{ background: "rgba(241,244,250,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

        {/* Title row */}
        <div className="flex items-center gap-3 px-5 mb-3">
          <Link href="/profile"
            className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <ArrowLeft size={18} style={{ color: "#475569" }} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>Agenda</h1>
            <p className="text-xs font-medium mt-0.5" style={{ color: "#94a3b8" }}>
              {vandaagAfspraken.length} afspraken · €{vandaagOmzet} vandaag
            </p>
          </div>
          {/* Dag plannen CTA */}
          <button onClick={() => setShowPlanner(true)}
            className="touch-scale flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-black text-white text-xs"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              boxShadow: "0 4px 14px rgba(245,158,11,0.45)",
            }}>
            <Route size={14} /> Dag plannen
          </button>
        </div>

        {/* View tabs */}
        <div className="flex gap-1.5 px-5 mb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {([
            { v: "dag",    l: "Dag",      i: "📅" },
            { v: "week",   l: "Week",     i: "📆" },
            { v: "maand",  l: "Maand",    i: "🗓️" },
            { v: "schema", l: "Schema",   i: "⚙️" },
          ] as { v: View; l: string; i: string }[]).map(tab => (
            <button key={tab.v} onClick={() => setView(tab.v)}
              className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all"
              style={{
                background: view === tab.v ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#fff",
                color: view === tab.v ? "white" : "#94a3b8",
                boxShadow: view === tab.v ? "0 4px 12px rgba(79,70,229,0.35)" : "0 2px 6px rgba(0,0,0,0.06)",
              }}>
              {tab.i} {tab.l}
            </button>
          ))}
        </div>

        {/* Week navigator — dag/week views */}
        {(view === "dag" || view === "week") && (
          <>
            <div className="flex items-center px-5 gap-2 mb-2.5">
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); }}
                className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                <ChevronLeft size={16} style={{ color: "#475569" }} />
              </button>
              <p className="flex-1 text-center font-black text-sm capitalize" style={{ color: "#0f172a" }}>{maandLabel}</p>
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); }}
                className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                <ChevronRight size={16} style={{ color: "#475569" }} />
              </button>
            </div>

            {/* Day pills */}
            <div className="grid grid-cols-7 gap-1 px-5">
              {weekDagen.map((dag, i) => {
                const ymd = toYMD(dag);
                const cnt = afspraken.filter(a => a.datum === ymd).length;
                const isSelected = ymd === selectedDay;
                const isVandaag = ymd === VANDAAG;
                return (
                  <button key={i} onClick={() => { setSelectedDay(ymd); setView("dag"); }}
                    className="touch-scale flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all"
                    style={{
                      background: isSelected ? "linear-gradient(135deg, #4F46E5, #818CF8)" : isVandaag ? "#EEF2FF" : "#fff",
                      boxShadow: isSelected ? "0 4px 12px rgba(79,70,229,0.35)" : "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                    <span className="text-[10px] font-bold" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                      {DAG_SHORT[dag.getDay()]}
                    </span>
                    <span className="font-black text-sm leading-none"
                      style={{ color: isSelected ? "white" : isVandaag ? "#4F46E5" : "#0f172a" }}>
                      {dag.getDate()}
                    </span>
                    {cnt > 0 ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "#EEF2FF", color: isSelected ? "white" : "#4F46E5" }}>
                        {cnt}
                      </span>
                    ) : <div className="h-4" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="px-5 pt-4 flex flex-col gap-3">

        {/* DAG VIEW */}
        {view === "dag" && (
          <>
            {/* Stats strip */}
            {vandaagAfspraken.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: String(vandaagAfspraken.length), l: "Afspraken", color: "#4F46E5", bg: "#EEF2FF", icon: "📅" },
                  { v: `${vandaagKlaar}/${vandaagAfspraken.length}`, l: "Klaar", color: "#10B981", bg: "#ECFDF5", icon: "✅" },
                  { v: `€${vandaagOmzet}`, l: "Omzet dag", color: "#F59E0B", bg: "#FFFBEB", icon: "💰" },
                ].map(s => (
                  <div key={s.l} className="flex flex-col items-center py-3.5 rounded-2xl"
                    style={{ background: s.bg }}>
                    <span className="text-base mb-0.5">{s.icon}</span>
                    <span className="font-black text-lg leading-none" style={{ color: s.color }}>{s.v}</span>
                    <span className="text-[10px] mt-0.5 font-semibold" style={{ color: s.color + "99" }}>{s.l}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Day header + add button */}
            <div className="flex items-center justify-between">
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>{datumLabel(selectedDay)}</p>
              <button onClick={() => { setEditAfspraak(undefined); setShowForm(true); }}
                className="touch-scale flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-white text-xs"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
                <Plus size={14} /> Klant toevoegen
              </button>
            </div>

            {/* Afspraken */}
            {vandaagAfspraken.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-4 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,0.09)" }}>
                  <CalendarDays size={30} style={{ color: "#94a3b8" }} />
                </div>
                <div>
                  <p className="font-black text-base" style={{ color: "#0f172a" }}>Niets gepland</p>
                  <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Voeg een klant toe om te beginnen</p>
                </div>
                <button onClick={() => { setEditAfspraak(undefined); setShowForm(true); }}
                  className="touch-scale flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 6px 20px rgba(79,70,229,0.35)" }}>
                  <Plus size={16} /> Klant toevoegen
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {vandaagAfspraken.map((a, i) => (
                  <div key={a.id}>
                    {/* Vertical connector between cards */}
                    {i > 0 && (() => {
                      const prev = vandaagAfspraken[i - 1];
                      const km = haversine(prev.lat, prev.lng, a.lat, a.lng);
                      const min = reistijd(km);
                      const gapMin = tmin(a.start) - tmin(prev.eind);
                      return (
                        <div className="flex items-center gap-3 py-1.5 px-3">
                          <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 52 }}>
                            <div className="w-0.5 h-3" style={{ background: "#E2E8F0" }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: "#FFFBEB", color: "#D97706" }}>
                              🚗 {min} min · {Math.round(km * 10) / 10} km
                            </span>
                            {gapMin > 0 && gapMin < 60 && (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: "#F1F5F9", color: "#64748b" }}>
                                {gapMin}m vrij
                              </span>
                            )}
                            {gapMin < min && gapMin >= 0 && (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-full"
                                style={{ background: "#FEF2F2", color: "#DC2626" }}>
                                ⚠ Krap!
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <AfspraakKaart
                      afspraak={a}
                      onStatusNext={() => statusNext(a.id)}
                      onEdit={() => { setEditAfspraak(a); setShowForm(true); }}
                      onDelete={() => deleteAfspraak(a.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* WEEK VIEW */}
        {view === "week" && (
          <div className="flex flex-col gap-3">
            {weekDagen.map(dag => {
              const ymd = toYMD(dag);
              const dagAfspraken = afspraken.filter(a => a.datum === ymd);
              const isVandaag = ymd === VANDAAG;
              if (dagAfspraken.length === 0) return (
                <div key={ymd} className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", opacity: 0.5 }}>
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: isVandaag ? "#EEF2FF" : "#F8FAFC" }}>
                    <span className="text-[10px] font-black" style={{ color: isVandaag ? "#4F46E5" : "#94a3b8" }}>
                      {DAG_SHORT[dag.getDay()]}
                    </span>
                    <span className="font-black text-sm" style={{ color: isVandaag ? "#4F46E5" : "#94a3b8" }}>
                      {dag.getDate()}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>Vrij</p>
                </div>
              );
              return (
                <div key={ymd}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{ background: isVandaag ? "linear-gradient(135deg,#4F46E5,#818CF8)" : "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                      <span className="text-[10px] font-black" style={{ color: isVandaag ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                        {DAG_SHORT[dag.getDay()]}
                      </span>
                      <span className="font-black text-sm" style={{ color: isVandaag ? "white" : "#0f172a" }}>
                        {dag.getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#0f172a" }}>
                        {dagAfspraken.length} afspraak{dagAfspraken.length !== 1 ? "en" : ""}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>
                        €{dagAfspraken.reduce((t, a) => t + a.prijs, 0)} omzet
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pl-12">
                    {dagAfspraken.map(a => {
                      const sc = STATUS_CFG[a.status];
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-2xl"
                          style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", borderLeft: `4px solid ${catColor(a.categorie)}` }}>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{a.dienst}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{a.start}–{a.eind} · {a.klant}</p>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                            style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                          <span className="font-black text-sm flex-shrink-0" style={{ color: "#0f172a" }}>€{a.prijs}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MAAND VIEW */}
        {view === "maand" && (
          <MaandView afspraken={afspraken} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        )}

        {/* SCHEMA VIEW */}
        {view === "schema" && <WerkschemaTab />}
      </div>

      {/* Modals */}
      {showPlanner && (
        <DagPlannerSheet
          afspraken={afspraken.filter(a => a.datum === selectedDay)}
          datum={selectedDay}
          onClose={() => setShowPlanner(false)}
        />
      )}
      {showForm && (
        <AfspraakFormSheet
          datum={selectedDay}
          existing={editAfspraak}
          onSave={saveAfspraak}
          onClose={() => { setShowForm(false); setEditAfspraak(undefined); }}
        />
      )}
    </div>
  );
}
