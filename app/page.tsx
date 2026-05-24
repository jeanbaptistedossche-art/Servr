"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Bell, MapPin, Star, ChevronRight, Zap, Shield,
  Search, ArrowRight, Phone, Map as MapIcon,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Flame, Wind,
  Layers, Bell as BellIcon, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, FileText, CreditCard, LucideIcon, Clock, TrendingUp,
} from "lucide-react";
import { CATEGORIES, PROVIDERS, HOT_JOBS } from "@/lib/mockData";
import { useOfferteStore } from "@/lib/offerteStore";
import { useUserStore } from "@/lib/store";

const ProviderMap = dynamic(() => import("@/components/ProviderMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-2xl" style={{ height: "100%", background: "#F3F4F6" }}>
      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#4F46E5" }} />
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
  return <Icon size={size} strokeWidth={1.8} />;
}

export default function HomePage() {
  const { offertes } = useOfferteStore();
  const name = useUserStore(s => s.name);
  const openstaand = offertes.filter(o => o.status === "openstaand").length;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Goedemorgen";
    if (h < 18) return "Goedemiddag";
    return "Goedenavond";
  };

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F9FAFB" }}>

      {/* ══════════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════════ */}
      <div className="sticky top-0 z-30 px-4 pt-14 pb-3"
        style={{ background: "rgba(255,255,255,0.97)", borderBottom: "1px solid #F3F4F6", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between">
          {/* Logo + location */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
              <span className="font-black text-white text-sm">S</span>
            </div>
            <button className="flex items-center gap-1 touch-scale">
              <MapPin size={13} style={{ color: "#4F46E5" }} />
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>Jordaan, Amsterdam</span>
              <ChevronRight size={12} style={{ color: "#9CA3AF", transform: "rotate(90deg)" }} />
            </button>
          </div>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2">
            <Link href="/meldingen" className="touch-scale relative w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#F3F4F6" }}>
              <Bell size={15} style={{ color: "#4B5563" }} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "#EF4444" }}>2</span>
            </Link>
            <Link href="/profile">
              <img src="https://i.pravatar.cc/150?img=68"
                className="w-8 h-8 rounded-xl object-cover touch-scale" alt="profiel" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          HERO — Light indigo gradient
      ══════════════════════════════════════════════ */}
      <div className="px-4 pt-6 pb-7" style={{ background: "linear-gradient(160deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)" }}>
        {/* Greeting */}
        <div className="mb-5">
          {mounted && name && (
            <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
              {greeting()}, {name.split(" ")[0]}
            </p>
          )}
          <h1 className="font-black text-white leading-tight" style={{ fontSize: 28, letterSpacing: "-0.02em" }}>
            Welke vakman<br />heb je nodig?
          </h1>
        </div>

        {/* Search pill — Airbnb style */}
        <Link href="/search">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
            <Search size={17} style={{ color: "#9CA3AF", flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "#111827" }}>Welke dienst zoek je?</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Loodgieter · Elektricien · Schilder…</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
              <ArrowRight size={14} color="white" />
            </div>
          </div>
        </Link>

        {/* Quick stats strip */}
        <div className="flex items-center gap-3 mt-4">
          {[
            { v: "2.400+", l: "vakmensen" },
            { v: "4.8 / 5", l: "beoordeling" },
            { v: "< 90 sec", l: "reactietijd" },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>·</span>}
              <span className="text-xs font-bold text-white">{s.v}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════════════════════ */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/opdracht/nieuw"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #F3F4F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#EEF2FF" }}>
              <FileText size={18} style={{ color: "#4F46E5" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#111827" }}>Opdracht</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>Nieuw plaatsen</p>
            </div>
          </Link>
          <Link href="/te-betalen"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", border: "1px solid #F3F4F6" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: openstaand > 0 ? "#FEF2F2" : "#F0FDF4" }}>
              <CreditCard size={18} style={{ color: openstaand > 0 ? "#EF4444" : "#10B981" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#111827" }}>Offertes</p>
              <p className="text-xs" style={{ color: openstaand > 0 ? "#EF4444" : "#9CA3AF" }}>
                {openstaand > 0 ? `${openstaand} openstaand` : "Alles bekeken"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          DIENSTEN — Horizontal category scroll
      ══════════════════════════════════════════════ */}
      <section className="mt-7 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base" style={{ color: "#111827" }}>Populaire diensten</h2>
          <Link href="/search" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#4F46E5" }}>
            Alle {CATEGORIES.length} <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1">
          {CATEGORIES.slice(0, 12).map(cat => (
            <Link key={cat.id} href={`/search?cat=${cat.id}`}
              className="touch-scale flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: cat.color + "15", border: `1px solid ${cat.color}20` }}>
                <span style={{ color: cat.color }}>
                  <CatIcon id={cat.id} size={22} />
                </span>
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight"
                style={{ color: "#4B5563", maxWidth: 56 }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          KAART
      ══════════════════════════════════════════════ */}
      <section className="mt-7 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapIcon size={15} style={{ color: "#4F46E5" }} />
            <h2 className="font-bold text-base" style={{ color: "#111827" }}>In jouw buurt</h2>
          </div>
          <Link href="/search?view=map" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#4F46E5" }}>
            Volledig scherm <ChevronRight size={12} />
          </Link>
        </div>
        <div style={{ height: 200 }}>
          <ProviderMap providers={PROVIDERS} height={200} interactive={false} showNavButtons={false} zoom={12} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          VAKMENSEN — Airbnb-style tall cards
      ══════════════════════════════════════════════ */}
      <section className="mt-7">
        <div className="flex items-center justify-between mb-4 px-4">
          <h2 className="font-bold text-base" style={{ color: "#111827" }}>Top vakmensen</h2>
          <Link href="/search" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#4F46E5" }}>
            Alle bekijken <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto -mx-0 px-4 pb-2">
          {PROVIDERS.map(p => {
            const openWaze = (e: React.MouseEvent) => {
              e.preventDefault();
              window.open(`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`, "_blank");
            };
            const openMaps = (e: React.MouseEvent) => {
              e.preventDefault();
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, "_blank");
            };
            return (
              <div key={p.id} className="flex-shrink-0 touch-scale" style={{ width: 200 }}>
                <Link href={`/provider/${p.id}`}>
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: "#fff", boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }}>
                    {/* Photo */}
                    <div className="relative" style={{ height: 150 }}>
                      <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)" }} />
                      {/* Rating badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg"
                        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}>
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-white text-[11px] font-bold">{p.rating}</span>
                      </div>
                      {/* Availability */}
                      {p.available && (
                        <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full"
                          style={{ background: "#10B981", boxShadow: "0 0 0 2px white" }} />
                      )}
                      {/* Bottom name */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <p className="font-bold text-white text-sm leading-tight">{p.name}</p>
                        <p className="text-white/70 text-xs">{p.category} · {p.distance}</p>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Vanaf</span>
                        <span className="font-bold text-sm" style={{ color: "#4F46E5" }}>€{p.priceMin}/u</span>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Nav buttons */}
                <div className="flex gap-1.5 mt-2">
                  <button onClick={openWaze}
                    className="touch-scale flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold"
                    style={{ background: "#fff", color: "#0a93b5", border: "1px solid #E5E7EB" }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Waze_logo.svg/32px-Waze_logo.svg.png" alt="" width={12} height={12} />
                    Waze
                  </button>
                  <button onClick={openMaps}
                    className="touch-scale flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-semibold"
                    style={{ background: "#fff", color: "#c53929", border: "1px solid #E5E7EB" }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Google_Maps_icon_%282020%29.svg/32px-Google_Maps_icon_%282020%29.svg.png" alt="" width={12} height={12} />
                    Maps
                  </button>
                  <a href={`tel:${p.phone}`}
                    className="touch-scale px-2.5 py-1.5 rounded-xl flex items-center justify-center"
                    style={{ background: "#fff", color: "#4F46E5", border: "1px solid #E5E7EB" }}>
                    <Phone size={12} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PANIC — Vibrant red CTA
      ══════════════════════════════════════════════ */}
      <section className="mt-7 px-4">
        <Link href="/panic">
          <div className="touch-scale rounded-2xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}>
            {/* Decorative circle */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20"
              style={{ background: "rgba(255,255,255,0.4)" }} />
            <div className="p-5 flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,0,0,0.15)" }}>
                <Zap size={26} color="white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-black text-white text-lg leading-tight">Spoeddienst</p>
                <p className="text-white/70 text-sm mt-0.5">3 vakmensen bieden in 90 seconden</p>
                <div className="flex items-center gap-2 mt-2.5">
                  {["24/7 beschikbaar", "Direct ter plaatse"].map(t => (
                    <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.9)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
            </div>
          </div>
        </Link>
      </section>

      {/* ══════════════════════════════════════════════
          RECENT JOBS
      ══════════════════════════════════════════════ */}
      <section className="mt-7 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color: "#4F46E5" }} />
            <h2 className="font-bold text-base" style={{ color: "#111827" }}>Recent in de buurt</h2>
          </div>
          <Link href="/feed" className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#4F46E5" }}>
            Alle opdrachten <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {HOT_JOBS.slice(0, 3).map(job => {
            const Icon = CAT_ICONS[job.category] ?? Settings2;
            return (
              <div key={job.id} className="flex gap-3 p-4 rounded-2xl touch-scale"
                style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EEF2FF" }}>
                  <Icon size={18} style={{ color: "#4F46E5" }} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug" style={{ color: "#111827" }}>{job.description}</p>
                    <span className="font-bold text-sm flex-shrink-0" style={{ color: "#EF4444" }}>{job.budget}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                      <MapPin size={10} />{job.location}
                    </p>
                    <p className="text-xs flex items-center gap-1" style={{ color: "#9CA3AF" }}>
                      <Clock size={10} />{job.time}
                    </p>
                    <span className="ml-auto text-[11px] font-medium" style={{ color: "#9CA3AF" }}>
                      {job.bids} bod{job.bids !== 1 ? "den" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRUST FOOTER
      ══════════════════════════════════════════════ */}
      <div className="mx-4 mt-7 mb-8 flex items-center justify-center gap-2 py-3.5 rounded-2xl"
        style={{ background: "#fff", border: "1px solid #F3F4F6" }}>
        <Shield size={12} style={{ color: "#10B981" }} />
        <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
          100% veilig betalen · Gecertificeerde vakmensen
        </span>
      </div>

    </div>
  );
}
