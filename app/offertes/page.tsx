"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Clock, CheckCircle, ChevronRight, MessageCircle, X } from "lucide-react";
import { MOCK_OFFERTES, MOCK_OPDRACHTEN } from "@/lib/store";

// Koppeling offerte → chat-id van de vakman
const CHAT_IDS: Record<string, string> = {
  off1: "p1",
  off2: "p5",
};

export default function OffertesPage() {
  const opdracht = MOCK_OPDRACHTEN[0];
  const [geweigerd, setGeweigerd] = useState<string[]>([]);

  const zichtbaar = MOCK_OFFERTES.filter(o => !geweigerd.includes(o.id));

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/mijn-opdrachten"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-lg flex-1">Offertes ontvangen</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
            {zichtbaar.length} offertes
          </span>
        </div>
        <div className="bg-white/15 rounded-2xl p-4">
          <p className="text-white/70 text-xs mb-1">Jouw opdracht</p>
          <p className="text-white font-bold">{opdracht.categorieIcon} {opdracht.title}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-white/70 text-xs">📍 Adres verborgen</span>
            <span className="text-white/70 text-xs">💰 {opdracht.budget}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "#fee2e2", color: "#dc2626" }}>
              SPOED
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {zichtbaar.map((off, i) => (
          <div key={off.id} className="card overflow-hidden">
            {i === 0 && (
              <div className="py-1.5 text-center text-xs font-black"
                style={{ background: "var(--teal)", color: "white" }}>
                ⭐ AANBEVOLEN — Laagste prijs
              </div>
            )}
            <div className="p-4">
              {/* Vakman info */}
              <div className="flex items-center gap-3 mb-3">
                <img src={off.vakmanAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{off.vakman}</p>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--teal)", color: "white" }}>
                      S{off.vakmanScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">4.9</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>· 127 reviews</span>
                  </div>
                </div>
                <p className="font-black text-2xl" style={{ color: "var(--teal)" }}>€{off.prijs}</p>
              </div>

              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
                {off.beschrijving}
              </p>

              <div className="flex items-center gap-4 text-xs mb-4" style={{ color: "var(--muted)" }}>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{off.eta}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={12} style={{ color: "var(--teal)" }} />
                  <span style={{ color: "var(--teal)" }}>Geverifieerd</span>
                </div>
              </div>

              {/* Knoppen */}
              <div className="flex gap-2">
                <button
                  onClick={() => setGeweigerd(v => [...v, off.id])}
                  className="touch-scale w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <X size={16} />
                </button>
                <Link href={`/chat/${CHAT_IDS[off.id] ?? "p1"}`}
                  className="touch-scale flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 border"
                  style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
                  <MessageCircle size={14} /> Vraag stellen
                </Link>
                <Link href={`/offerte/${off.id}`}
                  className="touch-scale flex-1 h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                  style={{ background: "var(--teal)" }}>
                  Bekijken <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {zichtbaar.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-5xl">📭</span>
            <p className="font-bold text-base">Alle offertes verwerkt</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Je hebt alle offertes geweigerd</p>
            <Link href="/search"
              className="touch-scale mt-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              Nieuwe vakmensen zoeken
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
