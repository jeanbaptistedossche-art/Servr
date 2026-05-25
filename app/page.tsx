"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, MapPin, Star, ChevronRight, Zap, Shield,
  Search, ArrowRight, Map as MapIcon,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Flame, Wind,
  Layers, Bell as BellIcon, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, FileText, CreditCard, LucideIcon, Clock,
} from "lucide-react";
import { CATEGORIES, PROVIDERS, HOT_JOBS, tijdGeleden } from "@/lib/mockData";
import { useOfferteStore } from "@/lib/offerteStore";
import { useUserStore } from "@/lib/store";

const ProviderMap = dynamic(() => import("@/components/ProviderMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-3xl" style={{ height: "100%", background: "#F1F5F9" }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--teal)" }} />
    </div>
  ),
});

const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
  timmerman: Hammer, schoonmaak: Sparkles, tuinman: Leaf,
  verhuizen: Package, sloten: Lock, hvac: Thermometer,
  dak: Building2, zwembad: Waves, glas: Grid3X3,
  "tuin-aanleg": Leaf, it: Monitor, bestrating: Layers,
  klusser: Settings2, zonnepanelen: Sun, gevel: Building2,
  verwarming: Flame, garage: Car, isolatie: Layers,
  riolering: Droplets, intercom: BellIcon, tegels: LayoutGrid,
  parket: Layers, airco: Wind, pergola: Leaf,
  oprit: Hammer, rolluiken: Layers, andere: Settings2,
};

function CatIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = CAT_ICONS[id] ?? Settings2;
  return <Icon size={size} strokeWidth={2} />;
}

export default function HomePage() {
  const { offertes } = useOfferteStore();
  const name            = useUserStore(s => s.name);
  const userAddress     = useUserStore(s => s.address);
  const unreadMeldingen = useUserStore(s => s.unreadMeldingen);
  const openstaand = offertes.filter(o => o.status === "openstaand").length;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const [homeQuery, setHomeQuery] = useState("");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ─── STICKY HEADER ─── */}
      <div className="sticky top-0 z-30 px-5 pt-14 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
              <span className="font-black text-white text-sm">S</span>
            </div>
            <button className="flex items-center gap-1 touch-scale">
              <MapPin size={12} style={{ color: "#4F46E5" }} />
              <span className="text-sm font-bold" style={{ color: "#1e293b" }}>{mounted && userAddress ? userAddress : "Amsterdam"}</span>
              <ChevronRight size={11} style={{ color: "#94a3b8", transform: "rotate(90deg)" }} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/meldingen" className="touch-scale relative w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Bell size={17} style={{ color: "#475569" }} />
              {mounted && unreadMeldingen > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center text-white"
                  style={{ background: "#EF4444", boxShadow: "0 2px 6px rgba(239,68,68,0.5)" }}>
                  {unreadMeldingen > 9 ? "9+" : unreadMeldingen}
                </span>
              )}
            </Link>
            <Link href="/profile" className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white"
              style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", fontSize: 15, boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
              {mounted && name ? name.charAt(0).toUpperCase() : "?"}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── GREETING + SEARCH ─── */}
      <div className="px-5 pt-5 pb-6" style={{ background: "#F1F4FA" }}>
        {mounted && name && (
          <p className="text-sm font-semibold mb-1" style={{ color: "#64748b" }}>
            {greeting}, {name.split(" ")[0]} 👋
          </p>
        )}
        <h1 className="font-black mb-5" style={{ fontSize: 28, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Welke vakman<br />heb je nodig?
        </h1>

        {/* Search */}
        <form onSubmit={e => { e.preventDefault(); router.push(`/search${homeQuery ? `?q=${encodeURIComponent(homeQuery)}` : ""}`); }}>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 4px 20px rgba(79,70,229,0.12)", border: "1.5px solid transparent" }}>
            <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              type="text"
              value={homeQuery}
              onChange={e => setHomeQuery(e.target.value)}
              placeholder="Zoek een vakman of dienst..."
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              style={{ color: homeQuery ? "#0f172a" : "#94a3b8" }}
              autoComplete="off"
            />
            <button type="submit" className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 touch-scale"
              style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 10px rgba(79,70,229,0.4)" }}>
              <ArrowRight size={15} color="white" />
            </button>
          </div>
        </form>

        {/* Trust strip */}
        <div className="flex items-center gap-0 mt-4">
          {[
            { emoji: "👷", v: "2.400+", l: "vakmensen" },
            { emoji: "⭐", v: "4.8", l: "gemiddeld" },
            { emoji: "⚡", v: "90 sec", l: "reactietijd" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center">
              {i > 0 && <span className="mx-2.5 text-xs" style={{ color: "#cbd5e1" }}>·</span>}
              <span className="text-xs font-bold" style={{ color: "#334155" }}>{s.emoji} {s.v}</span>
              <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CATEGORIEËN ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>Diensten</h2>
          <Link href="/search" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            Meer <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.slice(0, 12).map(cat => (
            <Link key={cat.id} href={`/search?cat=${cat.id}`}
              className="touch-scale flex-shrink-0 flex flex-col items-center gap-2.5">
              <div className="w-[62px] h-[62px] rounded-3xl flex items-center justify-center"
                style={{ background: "#fff", boxShadow: `0 4px 16px ${cat.color}30` }}>
                <span style={{ color: cat.color }}><CatIcon id={cat.id} size={22} /></span>
              </div>
              <span className="text-[10px] font-bold text-center" style={{ color: "#475569", maxWidth: 58, lineHeight: 1.3 }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── TOP VAKMENSEN ─── */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>Top vakmensen</h2>
          <Link href="/search" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            Alle <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 pb-2" style={{ scrollbarWidth: "none" }}>
          {PROVIDERS.slice(0, 6).map(p => (
            <Link key={p.id} href={`/provider/${p.id}`} className="touch-scale flex-shrink-0 block" style={{ width: 160 }}>
              <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,0.09)" }}>
                <div className="relative" style={{ height: 130 }}>
                  <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
                  {p.available && (
                    <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: "#10B981", boxShadow: "0 0 0 2px white" }} />
                  )}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="font-black text-white text-sm leading-tight truncate">{p.name}</p>
                    <p className="text-white/60 text-[10px]">{p.category}</p>
                  </div>
                </div>
                <div className="px-3 pt-2.5 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold" style={{ color: "#0f172a" }}>{p.rating}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: "#4F46E5" }}>€{p.priceMin}/u</span>
                  </div>
                  <div className="flex items-center justify-center py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}>
                    Boek
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── KAART ─── */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>In jouw buurt</h2>
          <Link href="/search?view=map" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            Kaart <ChevronRight size={11} />
          </Link>
        </div>
        <div style={{ borderRadius: 24, overflow: "hidden", height: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
          <ProviderMap providers={PROVIDERS} height={200} interactive={false} showNavButtons={false} zoom={12} />
        </div>
      </div>

      {/* ─── SPOEDDIENST CTA ─── */}
      <div className="px-5 mb-6">
        <Link href="/panic">
          <div className="touch-scale relative overflow-hidden"
            style={{ borderRadius: 28, background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)", boxShadow: "0 16px 40px rgba(220,38,38,0.4)", padding: "22px 22px" }}>
            <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-15" style={{ background: "white" }} />
            <div className="absolute -left-6 bottom-0 w-32 h-32 rounded-full opacity-10" style={{ background: "black" }} />
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }}>
                <Zap size={30} color="white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-black text-white" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>Spoeddienst</p>
                <p className="text-white/70 text-sm mt-0.5 mb-3">3 vakmensen bieden in 90 seconden</p>
                <div className="flex gap-2">
                  {["⚡ 24/7 beschikbaar", "🚗 Direct ter plaatse"].map(t => (
                    <span key={t} className="text-[10px] font-bold px-2.5 py-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.95)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── QUICK ACTIES ─── */}
      <div className="px-5 mb-6">
        <h2 className="font-black text-base mb-3" style={{ color: "#0f172a" }}>Snelle acties</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/opdracht/nieuw", icon: FileText, label: "Opdracht", emoji: "📋", color: "#4F46E5", bg: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" },
            { href: "/te-betalen", icon: CreditCard, label: "Offertes", emoji: openstaand > 0 ? "🔴" : "✅", color: openstaand > 0 ? "#DC2626" : "#059669", bg: openstaand > 0 ? "linear-gradient(135deg, #FEF2F2, #FEE2E2)" : "linear-gradient(135deg, #F0FDF4, #DCFCE7)" },
            { href: "/scan", icon: Search, label: "AI Scan", emoji: "🔍", color: "#7C3AED", bg: "linear-gradient(135deg, #F5F3FF, #EDE9FE)" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="touch-scale flex flex-col items-center gap-2 py-4 rounded-2xl"
                style={{ background: item.bg, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "#fff", boxShadow: `0 4px 12px ${item.color}25` }}>
                  <Icon size={19} style={{ color: item.color }} strokeWidth={1.8} />
                </div>
                <span className="text-xs font-bold" style={{ color: "#334155" }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── RECENT IN DE BUURT ─── */}
      <div className="px-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-base" style={{ color: "#0f172a" }}>Recent in de buurt</h2>
          <Link href="/feed" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            Feed <ChevronRight size={11} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {HOT_JOBS.slice(0, 3).map(job => {
            const Icon = CAT_ICONS[job.category] ?? Settings2;
            return (
              <Link key={job.id} href={`/feed`} className="touch-scale flex gap-3.5 p-4 block"
                style={{ background: "#fff", borderRadius: 22, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}>
                  <Icon size={20} style={{ color: "#4F46E5" }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-snug" style={{ color: "#0f172a" }}>{job.description}</p>
                    <span className="font-black text-sm flex-shrink-0 px-2.5 py-0.5 rounded-xl"
                      style={{ background: "#FEF2F2", color: "#DC2626" }}>{job.budget}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
                      <MapPin size={10} />{job.location}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: "#94a3b8" }}>
                      <Clock size={10} />{tijdGeleden(job.postedAt)}
                    </span>
                    <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "#F0FDF4", color: "#059669" }}>
                      {job.bids} biedingen
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Trust badge */}
        <div className="mt-5 flex items-center justify-center gap-2.5 py-4 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #F0FDF4, #DCFCE7)", border: "1px solid #BBF7D0" }}>
          <Shield size={14} style={{ color: "#16a34a" }} />
          <span className="text-xs font-semibold" style={{ color: "#15803d" }}>
            100% veilig betalen · Gecertificeerde vakmensen
          </span>
        </div>
      </div>

    </div>
  );
}
