"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Heart, CalendarDays, ChevronRight } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

// Use first 4 providers as favorites
const FAVORIETEN = PROVIDERS.slice(0, 4);

export default function FavorietenPage() {
  const [verwijderd, setVerwijderd] = useState<string[]>([]);

  const actief = FAVORIETEN.filter(p => !verwijderd.includes(p.id));

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl">Favorieten</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {actief.length} opgeslagen {actief.length === 1 ? "vakman" : "vakmensen"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-3">
        {actief.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "var(--surface-2)" }}>
              <Heart size={28} style={{ color: "var(--muted)" }} />
            </div>
            <p className="font-bold text-base">Geen favorieten</p>
            <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
              Voeg vakmensen toe aan je favorieten om ze hier te zien.
            </p>
            <Link href="/search"
              className="touch-scale mt-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              Vakmensen zoeken
            </Link>
          </div>
        )}

        {actief.map(p => (
          <div key={p.id} className="card p-4 flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img src={p.avatar} className="w-14 h-14 rounded-2xl object-cover" alt={p.name} />
              {p.available && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                  style={{ background: "#22c55e" }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{p.category}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-0.5">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold">{p.rating}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>({p.reviewCount})</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <MapPin size={10} style={{ color: "var(--muted)" }} />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{p.distance}</span>
                </div>
              </div>
              <p className="text-xs mt-1 font-semibold" style={{ color: "var(--teal)" }}>
                Vanaf €{p.priceMin}/u
              </p>
            </div>

            {/* Acties */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link href={`/agenda/boeken/${p.id}`}
                className="touch-scale flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: "var(--teal)" }}>
                <CalendarDays size={12} /> Boek
              </Link>
              <button
                onClick={() => setVerwijderd(v => [...v, p.id])}
                className="touch-scale flex items-center justify-center w-full py-1.5 rounded-xl text-xs font-semibold border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <Heart size={12} className="fill-red-400 text-red-400 mr-1" /> Verwijder
              </button>
            </div>
          </div>
        ))}

        {actief.length > 0 && (
          <Link href="/search"
            className="touch-scale card p-4 flex items-center gap-3 mt-2"
            style={{ borderStyle: "dashed", borderWidth: 2, borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--teal)" + "12" }}>
              <span className="text-2xl">🔍</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Meer vakmensen ontdekken</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Zoek en voeg toe aan je favorieten</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </Link>
        )}
      </div>
    </div>
  );
}
