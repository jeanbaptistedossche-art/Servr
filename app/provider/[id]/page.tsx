"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, MessageCircle, Heart, Share2, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

export default function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const provider = PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<"diensten" | "reviews" | "fotos">("diensten");

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Hero foto */}
      <div className="relative h-64 overflow-hidden" style={{ background: "var(--surface-2)" }}>
        <img src={provider.photos[0]} alt={provider.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)" }} />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <Link href="/" className="touch-scale w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setLiked(l => !l)}
              className="touch-scale w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Heart size={18} color="white" fill={liked ? "white" : "none"} />
            </button>
            <button className="touch-scale w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Share2 size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Beschikbaarheidsdot */}
        <div className="absolute top-14 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <span className={`w-2 h-2 rounded-full ${provider.available ? "bg-green-400 animate-dot" : "bg-gray-400"}`} />
          <span className="text-white text-xs font-medium">
            {provider.available ? "Beschikbaar" : "Bezet"}
          </span>
        </div>
      </div>

      {/* Profiel info */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <img src={provider.avatar} alt={provider.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white" />
              {/* Servr Score */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white"
                style={{ background: "var(--teal)", color: "white" }}>
                {provider.servrScore}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="font-black text-lg leading-tight">{provider.name}</h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {provider.categoryIcon} {provider.category}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold">{provider.rating}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>({provider.reviewCount})</span>
                </div>
                <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
                  <MapPin size={12} />
                  <span className="text-xs">{provider.distance}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-base" style={{ color: "var(--teal)" }}>
                €{provider.priceMin}
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>per uur</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {provider.badges.map(badge => (
              <span key={badge} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "var(--teal)" + "18", color: "var(--teal)" }}>
                <CheckCircle size={11} />
                {badge}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
            {provider.bio}
          </p>
        </div>

        {/* Acties */}
        <div className="flex gap-3 mt-4">
          <Link href={`/chat/${provider.id}`}
            className="touch-scale flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border"
            style={{ borderColor: "var(--teal)", color: "var(--teal)", background: "transparent" }}>
            <MessageCircle size={17} />
            Stuur bericht
          </Link>
          <button className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
            style={{ background: "var(--teal)" }}>
            📅 Boek nu
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          {(["diensten", "reviews", "fotos"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-sm capitalize transition-all"
              style={{
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "var(--foreground)" : "var(--muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-4">
          {tab === "diensten" && (
            <div className="flex flex-col gap-3">
              {provider.services.map(s => (
                <div key={s.name} className="card p-4 flex items-center justify-between touch-scale">
                  <div>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <div className="flex items-center gap-1 mt-1" style={{ color: "var(--muted)" }}>
                      <Clock size={12} />
                      <span className="text-xs">{s.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black" style={{ color: "var(--teal)" }}>€{s.price}</span>
                    <button className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "var(--teal)", color: "white" }}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="flex flex-col gap-3">
              {provider.reviews.map((r, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{r.author}</p>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={12} className={j < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{r.text}</p>
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>{r.date}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "fotos" && (
            <div className="grid grid-cols-2 gap-2">
              {provider.photos.concat(provider.photos).map((photo, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden touch-scale">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
