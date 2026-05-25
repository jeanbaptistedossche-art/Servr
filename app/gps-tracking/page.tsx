"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, MapPin, Navigation, Clock, Phone,
  MessageCircle, X, CheckCircle2, AlertCircle,
  Wrench, Star, ChevronRight, Zap, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type TrackStatus = "onderweg" | "op_locatie" | "klaar" | "wacht" | "gepauzeerd";

interface Vakman {
  id: string;
  naam: string;
  avatar: string;
  specialiteit: string;
  telefoon: string;
  rating: number;
  klus: string;
  status: TrackStatus;
  eta: number;          // minutes
  afstand: number;      // km
  lat: number;
  lng: number;
  vertrekTijd: string;
  aankomstTijd?: string;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<TrackStatus, { label: string; color: string; bg: string; dot: string; emoji: string }> = {
  onderweg:  { label: "Onderweg",    color: "#4F46E5", bg: "#EEF2FF", dot: "#4F46E5", emoji: "🚐" },
  op_locatie:{ label: "Op locatie",  color: "#059669", bg: "#ECFDF5", dot: "#10B981", emoji: "📍" },
  klaar:     { label: "Klus klaar",  color: "#7C3AED", bg: "#F5F3FF", dot: "#8B5CF6", emoji: "✅" },
  wacht:     { label: "Wacht op jou",color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B", emoji: "⏳" },
  gepauzeerd:{ label: "Pauze",       color: "#64748b", bg: "#F1F5F9", dot: "#94a3b8", emoji: "☕" },
};

const VAKMANS: Vakman[] = [
  {
    id: "1", naam: "Marco van den Berg", avatar: "https://i.pravatar.cc/150?img=11",
    specialiteit: "Loodgieter", telefoon: "+31 6 12 34 56 78",
    rating: 4.9, klus: "Lekkage reparatie · Keizersgracht 45",
    status: "onderweg", eta: 12, afstand: 2.4,
    lat: 52.3680, lng: 4.9036, vertrekTijd: "09:15",
  },
  {
    id: "2", naam: "Erik van Dijk", avatar: "https://i.pravatar.cc/150?img=57",
    specialiteit: "Elektricien", telefoon: "+31 6 23 45 67 89",
    rating: 4.8, klus: "Meterkast vernieuwen · Herengracht 112",
    status: "op_locatie", eta: 0, afstand: 0,
    lat: 52.3745, lng: 4.8990, vertrekTijd: "08:30", aankomstTijd: "09:02",
  },
];

// Simulated route points (simplified)
const ROUTE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function MapPlaceholder({ vakman }: { vakman: Vakman }) {
  const cfg = STATUS_CFG[vakman.status];

  // Simple SVG map visualization
  return (
    <div className="relative rounded-3xl overflow-hidden"
      style={{ height: 240, background: "linear-gradient(145deg, #E8EEF5, #D1DBE8)" }}>
      {/* Fake map grid */}
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.25 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${i * 30}px`} x2="100%" y2={`${i * 30}px`} stroke="#8899AA" strokeWidth="1" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={`${i * 30}px`} y1="0" x2={`${i * 30}px`} y2="100%" stroke="#8899AA" strokeWidth="1" />
        ))}
        {/* Fake roads */}
        <path d="M 0 80 Q 120 60 240 90 T 480 75" stroke="#AABBCC" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 60 0 Q 90 120 80 240" stroke="#AABBCC" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 200 0 L 210 240" stroke="#AABBCC" strokeWidth="5" fill="none" />
        {/* Route */}
        {vakman.status === "onderweg" && (
          <path d="M 100 200 Q 150 150 200 120 T 280 80" stroke={cfg.dot} strokeWidth="3" fill="none" strokeDasharray="8 4" strokeLinecap="round" />
        )}
      </svg>

      {/* Destination pin */}
      <div className="absolute flex flex-col items-center" style={{ top: "30%", left: "58%", transform: "translate(-50%, -100%)" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shadow-lg"
          style={{ background: "#F1F4FA", border: "3px solid #4F46E5" }}>
          🏠
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: "#4F46E5", marginTop: -2 }} />
      </div>

      {/* Vakman pin */}
      <div className="absolute flex flex-col items-center" style={{
        top: vakman.status === "onderweg" ? "65%" : "30%",
        left: vakman.status === "onderweg" ? "38%" : "58%",
        transform: "translate(-50%, -100%)",
      }}>
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: "3px solid " + cfg.dot, width: 44, height: 44 }}>
          <img src={vakman.avatar} alt={vakman.naam} className="w-full h-full object-cover" />
        </div>
        <div className="w-0 h-0" style={{
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `8px solid ${cfg.dot}`,
        }} />
      </div>

      {/* ETA badge */}
      <div className="absolute bottom-3 left-3 right-3 rounded-2xl px-4 py-2.5 flex items-center gap-3"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
        <span className="text-2xl">{cfg.emoji}</span>
        <div className="flex-1">
          <p className="font-black text-sm" style={{ color: "#0f172a" }}>
            {vakman.status === "onderweg" ? `${vakman.eta} minuten` : cfg.label}
          </p>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            {vakman.status === "onderweg"
              ? `${vakman.afstand} km · Verwacht aankomst ${new Date(Date.now() + vakman.eta * 60000).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`
              : vakman.aankomstTijd ? `Aangekomen om ${vakman.aankomstTijd}` : cfg.label}
          </p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: cfg.dot }} />
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function GpsTrackingPage() {
  const router = useRouter();
  const [vakmans] = useState<Vakman[]>(VAKMANS);
  const [selectedId, setSelectedId] = useState<string>(VAKMANS[0].id);
  const [tick, setTick] = useState(0);

  // Simulate ETA countdown
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const selected = vakmans.find(v => v.id === selectedId) ?? vakmans[0];
  const cfg = STATUS_CFG[selected.status];

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
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Live Tracking</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Volg jouw vakman in real-time</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: "#ECFDF5" }}>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold" style={{ color: "#059669" }}>Live</span>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Vakman selector */}
        {vakmans.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {vakmans.map(v => {
              const vCfg = STATUS_CFG[v.status];
              return (
                <button key={v.id} onClick={() => setSelectedId(v.id)}
                  className="touch-scale flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{
                    background: selectedId === v.id ? vCfg.bg : "#fff",
                    border: `2px solid ${selectedId === v.id ? vCfg.dot : "#E5E7EB"}`,
                  }}>
                  <img src={v.avatar} className="w-7 h-7 rounded-xl object-cover" alt="" />
                  <div className="text-left">
                    <p className="text-xs font-bold" style={{ color: "#0f172a" }}>{v.naam.split(" ")[0]}</p>
                    <p className="text-[10px]" style={{ color: vCfg.color }}>{vCfg.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Map */}
        <MapPlaceholder vakman={selected} />

        {/* Status card */}
        <div className="rounded-3xl p-5"
          style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <img src={selected.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={selected.naam} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs"
                style={{ background: cfg.bg }}>
                {cfg.emoji}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base" style={{ color: "#0f172a" }}>{selected.naam}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{selected.specialiteit}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold" style={{ color: "#374151" }}>{selected.rating}</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              <a href={`tel:${selected.telefoon}`}
                className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "#EEF2FF" }}>
                <Phone size={16} style={{ color: "#4F46E5" }} />
              </a>
              <button className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "#ECFDF5" }}>
                <MessageCircle size={16} style={{ color: "#059669" }} />
              </button>
            </div>
          </div>

          {/* Klus info */}
          <div className="mt-4 p-3 rounded-2xl" style={{ background: "#F8FAFF" }}>
            <div className="flex items-start gap-2">
              <MapPin size={14} style={{ color: "#4F46E5" }} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium" style={{ color: "#374151" }}>{selected.klus}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-4 flex items-center gap-0">
            {[
              { label: "Vertrek",     time: selected.vertrekTijd, done: true },
              { label: "Onderweg",    time: selected.status === "onderweg" ? `${selected.eta} min` : "✓", done: selected.status !== "wacht" },
              { label: "Aankomst",    time: selected.aankomstTijd ?? "--:--", done: !!selected.aankomstTijd },
              { label: "Klaar",       time: "--:--", done: selected.status === "klaar" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center" style={{ flex: i < arr.length - 1 ? "1" : undefined }}>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: step.done ? "#4F46E5" : "#E5E7EB" }}>
                    {step.done && <Check size={10} color="white" strokeWidth={3} />}
                  </div>
                  <p className="text-[9px] font-bold mt-1" style={{ color: step.done ? "#4F46E5" : "#94a3b8" }}>{step.label}</p>
                  <p className="text-[9px]" style={{ color: "#94a3b8" }}>{step.time}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-5" style={{ background: step.done ? "#4F46E5" : "#E5E7EB" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* All vakmans */}
        {vakmans.length > 1 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Alle ingeplande vakmans</p>
            <div className="flex flex-col gap-2">
              {vakmans.map(v => {
                const vCfg = STATUS_CFG[v.status];
                return (
                  <button key={v.id} onClick={() => setSelectedId(v.id)}
                    className="touch-scale w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <img src={v.avatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{v.naam}</p>
                      <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{v.klus}</p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl flex-shrink-0"
                      style={{ background: vCfg.bg, color: vCfg.color }}>{vCfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
