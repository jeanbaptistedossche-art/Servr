"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, MapPin, Star, ChevronRight, Zap, Shield,
  Search, Phone, MessageCircle, Calendar,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Lock,
  Thermometer, Building2, Sun, Settings2, Grid3X3,
  Layers, Car, Droplets, Wind, BellIcon,
  LucideIcon, Clock, LayoutGrid, MoreHorizontal,
} from "lucide-react";
import { CATEGORIES, PROVIDERS } from "@/lib/mockData";
import { useUserStore } from "@/lib/store";

// ── Cat icons ────────────────────────────────────────────────────────────────
const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
  timmerman: Hammer, schoonmaak: Sparkles, tuinman: Leaf,
  verhuizen: Layers, sloten: Lock, hvac: Thermometer,
  dak: Building2, zonnepanelen: Sun, glas: Grid3X3,
  it: LayoutGrid, klusser: Hammer, verwarming: Zap,
  airco: Wind, riolering: Droplets, intercom: Bell,
  andere: Settings2,
};

function CatIcon({ id, size = 20 }: { id: string; size?: number }) {
  const Icon = CAT_ICONS[id] ?? Settings2;
  return <Icon size={size} strokeWidth={2} />;
}

// ── Grid categories (8 items incl. Meer) ─────────────────────────────────────
const GRID_CATS = [
  { id: "elektricien", label: "Elektro",       bg: "#FEF3C7", color: "#D97706" },
  { id: "loodgieter",  label: "Loodgieter",    bg: "#DBEAFE", color: "#2563EB" },
  { id: "schilder",    label: "Schilder",      bg: "#FCE7F3", color: "#DB2777" },
  { id: "timmerman",   label: "Timmerman",     bg: "#FED7AA", color: "#EA580C" },
  { id: "zonnepanelen",label: "Zonnepanelen",  bg: "#D1FAE5", color: "#059669" },
  { id: "dak",         label: "Dakdekker",     bg: "#FFF7ED", color: "#C2410C" },
  { id: "hvac",        label: "HVAC / Ketel",  bg: "#CCFBF1", color: "#0D9488" },
];

// ── Initials helper ───────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#4F46E5","#059669","#D97706","#DC2626","#7C3AED","#0284C7","#DB2777",
];
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const name            = useUserStore(s => s.name);
  const userAddress     = useUserStore(s => s.address);
  const unreadMeldingen = useUserStore(s => s.unreadMeldingen);
  const [mounted, setMounted]   = useState(false);
  const [homeQuery, setHomeQuery] = useState("");
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = mounted && name ? name.split(" ")[0] : "";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F1F4FA" }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 px-5 pt-14 pb-4"
        style={{ background: "rgba(241,244,250,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

        <div className="flex items-start justify-between">
          {/* Greeting + location */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
              {mounted ? `${greeting}${firstName ? `, ${firstName}` : ""}` : greeting} 👋
            </p>
            <button className="flex items-center gap-1 mt-0.5 touch-scale">
              <MapPin size={13} style={{ color: "#4F46E5" }} />
              <span className="font-bold text-sm" style={{ color: "#0f172a" }}>
                {mounted && userAddress ? userAddress : "Amsterdam"}
              </span>
              <ChevronRight size={12} style={{ color: "#94a3b8", transform: "rotate(90deg)" }} />
            </button>
          </div>

          {/* Bell + Avatar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/meldingen"
              className="touch-scale relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Bell size={17} style={{ color: "#475569" }} />
              {mounted && unreadMeldingen > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  style={{ background: "#EF4444", width: 18, height: 18 }}>
                  {unreadMeldingen > 9 ? "9+" : unreadMeldingen}
                </span>
              )}
            </Link>
            <Link href="/profile"
              className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
              {mounted && name ? name.charAt(0).toUpperCase() : "?"}
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <form className="mt-4" onSubmit={e => { e.preventDefault(); router.push(`/search${homeQuery ? `?q=${encodeURIComponent(homeQuery)}` : ""}`); }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              type="text"
              value={homeQuery}
              onChange={e => setHomeQuery(e.target.value)}
              placeholder="Zoek een vakman of dienst..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: homeQuery ? "#0f172a" : "#94a3b8" }}
              autoComplete="off"
            />
            <button type="submit"
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 touch-scale"
              style={{ background: "#4F46E5" }}>
              <Search size={14} color="white" />
            </button>
          </div>
        </form>
      </div>

      {/* ── CATEGORIES GRID ───────────────────────────────────────────── */}
      <div className="px-5 mt-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>Diensten</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {GRID_CATS.map(cat => (
            <Link key={cat.id} href={`/search?cat=${cat.id}`}
              className="touch-scale flex flex-col items-center gap-2">
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center"
                style={{ background: cat.bg, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <span style={{ color: cat.color }}><CatIcon id={cat.id} size={22} /></span>
              </div>
              <span className="text-[10px] font-bold text-center leading-tight w-full"
                style={{ color: "#475569" }}>
                {cat.label}
              </span>
            </Link>
          ))}
          {/* "Meer" tile */}
          <Link href="/search" className="touch-scale flex flex-col items-center gap-2">
            <div className="w-full aspect-square rounded-2xl flex items-center justify-center"
              style={{ background: "#EDE9FE", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <MoreHorizontal size={22} style={{ color: "#7C3AED" }} />
            </div>
            <span className="text-[10px] font-bold text-center leading-tight w-full"
              style={{ color: "#475569" }}>
              Meer
            </span>
          </Link>
        </div>
      </div>

      {/* ── SPOED BANNER ──────────────────────────────────────────────── */}
      <div className="px-5 mb-5">
        <Link href="/panic" className="touch-scale block">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #FEE2E2, #FECACA)", border: "1.5px solid #FCA5A5" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EF4444" }}>
              <Zap size={18} color="white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm" style={{ color: "#991B1B" }}>Spoed nodig?</p>
              <p className="text-xs" style={{ color: "#B91C1C" }}>Vakman binnen 30 min bij jou</p>
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-white"
              style={{ background: "#EF4444" }}>
              Nu
            </span>
          </div>
        </Link>
      </div>

      {/* ── AANBEVOLEN VAKMANSEN ──────────────────────────────────────── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>Aanbevolen</h2>
          <Link href="/search" className="text-xs font-bold flex items-center gap-0.5"
            style={{ color: "#4F46E5" }}>
            Alle <ChevronRight size={13} />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {PROVIDERS.slice(0, 4).map(p => {
            const initials = getInitials(p.name);
            const avatarColor = getAvatarColor(p.name);
            return (
              <div key={p.id}
                className="rounded-3xl p-4"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                {/* Top row */}
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm"
                      style={{ background: avatarColor }}>
                      {initials}
                    </div>
                    {p.available && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ background: "#10B981" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{p.name}</p>
                    <p className="text-xs truncate" style={{ color: "#64748b" }}>
                      {p.category} · {p.distance}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={11} style={{ color: "#F59E0B" }} fill="#F59E0B" />
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>{p.rating}</span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>({p.reviewCount})</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-black text-sm" style={{ color: "#4F46E5" }}>€{p.priceMin}/u</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <a href={`tel:${p.phone}`}
                    className="touch-scale flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "#F1F5F9", color: "#334155" }}>
                    <Phone size={13} />
                    Bellen
                  </a>
                  <Link href={`/chat/${p.id}`}
                    className="touch-scale flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: "#F1F5F9", color: "#334155" }}>
                    <MessageCircle size={13} />
                    Bericht
                  </Link>
                  <Link href={`/agenda/boeken/${p.id}`}
                    className="touch-scale flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "#4F46E5" }}>
                    <Calendar size={13} />
                    Boeken
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TRUST BADGE ───────────────────────────────────────────────── */}
      <div className="px-5 pb-28">
        <div className="flex items-center justify-center gap-2 py-4 rounded-2xl"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Shield size={14} style={{ color: "#10B981" }} />
          <span className="text-xs font-semibold" style={{ color: "#374151" }}>
            100% veilig betalen · Gecertificeerde vakmensen
          </span>
        </div>
      </div>

    </div>
  );
}
