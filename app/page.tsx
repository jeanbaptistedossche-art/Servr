"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, MapPin, Star, ChevronRight, Zap, Shield } from "lucide-react";
import { CATEGORIES, PROVIDERS, TICKER_ITEMS, HOT_JOBS } from "@/lib/mockData";
import { useOfferteStore } from "@/lib/offerteStore";

/* ── Live ticker ─────────────────────────────────────────────────────────── */
function LiveTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % TICKER_ITEMS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="animate-dot w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: "var(--teal)" }} />
        <span className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: "var(--teal)" }}>Live</span>
      </div>
      <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--border)" }} />
      <p className="text-xs font-medium truncate animate-fade-in" key={index}>
        {TICKER_ITEMS[index]}
      </p>
    </div>
  );
}

/* ── Provider card ───────────────────────────────────────────────────────── */
function ProviderCard({ provider }: { provider: typeof PROVIDERS[0] }) {
  return (
    <Link href={`/provider/${provider.id}`}
      className="touch-scale flex-shrink-0 w-52 rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Cover foto */}
      <div className="relative h-32 overflow-hidden"
        style={{ background: "var(--surface-2)" }}>
        <img src={provider.photos[0]} alt={provider.name}
          className="w-full h-full object-cover" />
        {/* Bottom gradient */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />
        {/* Available pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
          style={{
            background: provider.available ? "rgba(16,185,129,0.92)" : "rgba(107,114,128,0.85)",
            backdropFilter: "blur(4px)",
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-[10px] font-bold text-white">
            {provider.available ? "Beschikbaar" : "Bezet"}
          </span>
        </div>
        {/* Servr score */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full"
          style={{ background: "rgba(15,110,86,0.9)", backdropFilter: "blur(4px)" }}>
          <span className="text-[10px] font-black text-white">Servr {provider.servrScore}</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2.5">
          <img src={provider.avatar} alt={provider.name}
            className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
            style={{ border: "2px solid var(--border)" }} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{provider.name}</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              {provider.categoryIcon} {provider.category}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{provider.rating}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>({provider.reviewCount})</span>
          </div>
          <p className="text-xs font-bold" style={{ color: "var(--teal)" }}>
            v.a. €{provider.priceMin}/u
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Hot job card ────────────────────────────────────────────────────────── */
function HotJobCard({ job }: { job: typeof HOT_JOBS[0] }) {
  return (
    <div className="touch-scale rounded-2xl p-4 flex gap-3 items-start"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: "var(--surface-2)" }}>
        {job.category.split(" ")[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-bold text-sm leading-snug">{job.description}</p>
          <span className="text-sm font-black flex-shrink-0"
            style={{ color: "var(--coral)" }}>{job.budget}</span>
        </div>
        <p className="text-xs mb-3 flex items-center gap-1" style={{ color: "var(--muted)" }}>
          <MapPin size={11} />
          {job.location}
          <span className="opacity-40">·</span>
          {job.time}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
            {job.bids} {job.bids === 1 ? "bod" : "biedingen"}
          </span>
          <button className="touch-scale text-xs font-bold px-3.5 py-1.5 rounded-full"
            style={{ background: "var(--teal)", color: "white" }}>
            Bied mee
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Section header ──────────────────────────────────────────────────────── */
function SectionHeader({
  title, href, accent = "var(--teal)",
}: {
  title: string; href?: string; accent?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: accent }} />
        <h2 className="font-black text-base">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-0.5 text-xs font-semibold"
          style={{ color: accent }}>
          Alles <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}

/* ── Home page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { offertes } = useOfferteStore();
  const openstaandCount = offertes.filter(o => o.status === "openstaand").length;

  return (
    <div className="flex flex-col min-h-full pb-6 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-14 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1.5px solid rgba(255,255,255,0.3)",
              }}>
              <span className="font-black text-white" style={{ fontSize: 20, lineHeight: 1 }}>S</span>
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-medium leading-none">Goedemorgen 👋</p>
              <h1 className="text-white text-lg font-black leading-tight">Wat heb je nodig?</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/meldingen"
              className="touch-scale relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
              style={{ border: "1.5px solid rgba(255,255,255,0.2)" }}>
              <Bell size={17} color="white" />
              <span className="absolute -top-1 -right-1 rounded-full text-[9px] font-black flex items-center justify-center"
                style={{
                  background: "var(--coral)", color: "white",
                  width: 18, height: 18, lineHeight: "18px",
                }}>2</span>
            </Link>
            <Link href="/profile">
              <img src="https://i.pravatar.cc/150?img=68"
                className="w-9 h-9 rounded-xl object-cover touch-scale"
                style={{ border: "2px solid rgba(255,255,255,0.4)" }} alt="profiel" />
            </Link>
          </div>
        </div>

        {/* Locatie + openstaande offertes */}
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin size={12} color="rgba(255,255,255,0.6)" />
          <span className="text-white/60 text-xs">Jordaan, Amsterdam</span>
          {openstaandCount > 0 && (
            <>
              <span className="text-white/30 text-xs mx-0.5">·</span>
              <Link href="/te-betalen">
                <span className="text-white/85 text-xs font-semibold underline underline-offset-2">
                  {openstaandCount} {openstaandCount === 1 ? "offerte te betalen" : "offertes te betalen"} →
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Zoekbalk */}
        <Link href="/search">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-4"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>
            <span className="text-base">🔍</span>
            <span className="text-white/65 text-sm flex-1">Zoek vakman of dienst...</span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}>
              Zoeken
            </span>
          </div>
        </Link>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { emoji: "👷", value: "2.4K+", label: "Vakmensen" },
            { emoji: "⭐", value: "4.8", label: "Gem. rating" },
            { emoji: "🔒", value: "100%", label: "Veilig betalen" },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-2.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
              <span className="text-base">{s.emoji}</span>
              <span className="text-white font-black text-sm leading-none mt-0.5">{s.value}</span>
              <span className="text-white/50 text-[10px] mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-5 flex flex-col gap-6 mt-5">

        {/* Snelle acties */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/opdracht/nieuw"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-white font-black text-sm">Opdracht</p>
              <p className="text-white/70 text-xs">Nieuw plaatsen</p>
            </div>
          </Link>
          <Link href="/te-betalen"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--teal-light) 0%, var(--teal) 100%)" }}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📬</span>
            </div>
            <div>
              <p className="text-white font-black text-sm">Offertes</p>
              <p className="text-white/70 text-xs">
                {openstaandCount > 0 ? `${openstaandCount} te betalen` : "Bekijken"}
              </p>
            </div>
          </Link>
        </div>

        {/* Live ticker */}
        <LiveTicker />

        {/* Hoe werkt het */}
        <div className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}>Hoe werkt Servr?</p>
          <div className="grid grid-cols-3 gap-1">
            {[
              { icon: "🔍", title: "Zoek", sub: "Vind vakman in jouw buurt" },
              { icon: "📋", title: "Offerte", sub: "Vergelijk prijzen" },
              { icon: "✅", title: "Betaal", sub: "Veilig & direct" },
            ].map((item, i) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-1 relative">
                {i < 2 && (
                  <div className="absolute right-0 top-4 translate-x-1/2 z-10"
                    style={{ color: "var(--muted)", fontSize: 12 }}>›</div>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-0.5"
                  style={{ background: "var(--surface-2)" }}>
                  {item.icon}
                </div>
                <p className="font-bold text-xs">{item.title}</p>
                <p className="text-[10px] leading-tight" style={{ color: "var(--muted)" }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Categorieën */}
        <section>
          <SectionHeader title="Categorieën" href="/search" />
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.slice(0, 10).map(cat => (
              <Link key={cat.id} href={`/search?cat=${cat.id}`}
                className="touch-scale flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: cat.color + "18" }}>
                  {cat.icon}
                </div>
                <span className="text-[10px] font-medium text-center leading-tight"
                  style={{ color: "var(--muted)" }}>
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Nearby providers */}
        <section>
          <SectionHeader title="Dichtbij jou" href="/search" />
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2">
            {PROVIDERS.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>

        {/* Panic button promo */}
        <Link href="/panic">
          <div className="touch-scale relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }} />
            <div className="relative flex-shrink-0">
              <div className="animate-pulse-ring absolute inset-0 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)" }} />
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
                <Zap size={26} color="white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-base">⚡ Panic Button</p>
              <p className="text-white/80 text-sm mt-0.5">3 vakmensen bieden in 90 sec</p>
              <span className="inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
                Direct hulp →
              </span>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
          </div>
        </Link>

        {/* Hot jobs */}
        <section>
          <SectionHeader title="🔥 Hot Jobs" href="/feed" accent="var(--coral)" />
          <div className="flex flex-col gap-3">
            {HOT_JOBS.slice(0, 3).map(job => <HotJobCard key={job.id} job={job} />)}
          </div>
        </section>

        {/* Trust badge footer */}
        <div className="flex items-center justify-center gap-2 py-3.5 rounded-2xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Shield size={13} style={{ color: "var(--teal)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Veilig betalen via Servr · Geverifieerde vakmensen
          </span>
        </div>

      </div>
    </div>
  );
}
