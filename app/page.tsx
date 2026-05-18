"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, MapPin, Star, ChevronRight, Zap } from "lucide-react";
import { CATEGORIES, PROVIDERS, TICKER_ITEMS, HOT_JOBS } from "@/lib/mockData";
import { useOfferteStore } from "@/lib/offerteStore";

function LiveTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % TICKER_ITEMS.length), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-hidden"
      style={{ background: "var(--teal)", borderRadius: 12 }}>
      <span className="animate-dot w-2 h-2 rounded-full bg-white flex-shrink-0" />
      <p className="text-white text-xs font-medium truncate animate-fade-in" key={index}>
        {TICKER_ITEMS[index]}
      </p>
    </div>
  );
}

function ProviderCard({ provider }: { provider: typeof PROVIDERS[0] }) {
  return (
    <Link href={`/provider/${provider.id}`}
      className="touch-scale flex-shrink-0 w-52 card overflow-hidden">
      {/* Header foto */}
      <div className="relative h-28 overflow-hidden"
        style={{ background: "var(--surface-2)" }}>
        <img src={provider.photos[0]} alt={provider.name}
          className="w-full h-full object-cover" />
        {/* Beschikbaarheidsdot */}
        <div className="absolute top-2 right-2">
          <span className={`w-3 h-3 rounded-full block border-2 border-white ${provider.available ? "bg-green-500" : "bg-gray-400"}`} />
        </div>
        {/* Servr Score badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "var(--teal)", color: "white" }}>
          S {provider.servrScore}
        </div>
      </div>
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <img src={provider.avatar} alt={provider.name}
            className="w-6 h-6 rounded-full object-cover" />
          <p className="font-bold text-sm truncate">{provider.name}</p>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
          {provider.categoryIcon} {provider.category}
        </p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{provider.rating}</span>
            <span style={{ color: "var(--muted)" }}>({provider.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
            <MapPin size={11} />
            <span>{provider.distance}</span>
          </div>
        </div>
        <p className="text-xs font-semibold mt-2" style={{ color: "var(--teal)" }}>
          €{provider.priceMin}–€{provider.priceMax}/uur
        </p>
      </div>
    </Link>
  );
}

function HotJobCard({ job }: { job: typeof HOT_JOBS[0] }) {
  return (
    <div className="touch-scale card p-4 flex gap-3 items-start">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: "var(--surface-2)" }}>
        {job.category.split(" ")[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm truncate">{job.description}</p>
          <span className="text-xs font-bold ml-2 flex-shrink-0"
            style={{ color: "var(--coral)" }}>{job.budget}</span>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
          📍 {job.location} · {job.time}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {job.bids} {job.bids === 1 ? "bod" : "biedingen"}
          </span>
          <button className="touch-scale text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "var(--teal)", color: "white" }}>
            Bied mee
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { offertes } = useOfferteStore();
  const openstaandCount = offertes.filter(o => o.status === "openstaand").length;

  return (
    <div className="flex flex-col min-h-full pb-6 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "linear-gradient(180deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/70 text-xs font-medium">Goedemorgen 👋</p>
            <h1 className="text-white text-xl font-black">Wat heb je nodig?</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notificatie badge */}
            <Link href="/meldingen"
              className="touch-scale relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} color="white" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                style={{ background: "var(--coral)", color: "white" }}>2</span>
            </Link>
            <Link href="/profile">
              <img src="https://i.pravatar.cc/150?img=68"
                className="w-9 h-9 rounded-full object-cover border-2 border-white/50 touch-scale" alt="profiel" />
            </Link>
          </div>
        </div>

        {/* Locatie */}
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin size={13} color="rgba(255,255,255,0.7)" />
          <span className="text-white/70 text-xs">Jordaan, Amsterdam</span>
          <span className="text-white/40 text-xs mx-1">·</span>
          {openstaandCount > 0 && (
            <Link href="/te-betalen">
              <span className="text-white/80 text-xs font-semibold underline-offset-2 underline">
                {openstaandCount} {openstaandCount === 1 ? "offerte te betalen" : "offertes te betalen"} →
              </span>
            </Link>
          )}
        </div>

        {/* Zoekbalk */}
        <Link href="/search">
          <div className="mt-4 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <span className="text-white/60 text-sm">🔍 Zoek een dienst of vakman...</span>
          </div>
        </Link>
      </div>

      <div className="px-5 flex flex-col gap-6 mt-5">
        {/* Snelle acties */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/opdracht/nieuw"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-white font-black text-sm">Opdracht</p>
              <p className="text-white/70 text-xs">Plaatsen</p>
            </div>
          </Link>
          <Link href="/te-betalen"
            className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--teal-light) 0%, var(--teal) 100%)" }}>
            <span className="text-2xl">📬</span>
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

        {/* Categorieën */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">Categorieën</h2>
            <Link href="/search" className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--teal)" }}>
              Alles <ChevronRight size={14} />
            </Link>
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">Dichtbij jou</h2>
            <Link href="/search" className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--teal)" }}>
              Meer <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2">
            {PROVIDERS.map(p => <ProviderCard key={p.id} provider={p} />)}
          </div>
        </section>

        {/* Panic button promo */}
        <Link href="/panic">
          <div className="touch-scale relative overflow-hidden rounded-2xl p-4 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <div className="relative">
              <div className="animate-pulse-ring absolute inset-0 rounded-full"
                style={{ background: "rgba(255,255,255,0.3)" }} />
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Zap size={24} color="white" />
              </div>
            </div>
            <div>
              <p className="text-white font-black text-base">Panic Button</p>
              <p className="text-white/80 text-xs">3 vakmensen bieden in 90 seconden</p>
            </div>
            <ChevronRight size={20} color="rgba(255,255,255,0.7)" className="ml-auto" />
          </div>
        </Link>

        {/* Hot jobs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">🔥 Hot Jobs</h2>
            <Link href="/feed" className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "var(--teal)" }}>
              Feed <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {HOT_JOBS.slice(0, 3).map(job => <HotJobCard key={job.id} job={job} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
