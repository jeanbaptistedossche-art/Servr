"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Minus, Trophy, Crown } from "lucide-react";
import { CATEGORIES } from "@/lib/mockData";

type CatFilter = "alle" | string;

const LEADERBOARD = [
  {
    rank: 1, naam: "Erik de Boer", avatar: "https://i.pravatar.cc/150?img=8",
    score: 97, rating: 5.0, klussen: 342, badge: "🏆", categorie: "loodgieter",
    stad: "Amsterdam", trend: "up", trendVal: 0, isJij: false,
  },
  {
    rank: 2, naam: "Marco van den Berg", avatar: "https://i.pravatar.cc/150?img=12",
    score: 94, rating: 4.9, klussen: 289, badge: "🏆", categorie: "loodgieter",
    stad: "Amsterdam", trend: "same", trendVal: 0, isJij: true,
  },
  {
    rank: 3, naam: "Yusuf Aydın", avatar: "https://i.pravatar.cc/150?img=33",
    score: 91, rating: 4.8, klussen: 203, badge: "⚡", categorie: "elektricien",
    stad: "Amsterdam", trend: "up", trendVal: 1, isJij: false,
  },
  {
    rank: 4, naam: "Sofia Martins", avatar: "https://i.pravatar.cc/150?img=47",
    score: 88, rating: 4.8, klussen: 189, badge: "🌟", categorie: "schoonmaak",
    stad: "Amsterdam", trend: "down", trendVal: 1, isJij: false,
  },
  {
    rank: 5, naam: "Kim Nguyen", avatar: "https://i.pravatar.cc/150?img=56",
    score: 85, rating: 4.9, klussen: 164, badge: "🌟", categorie: "schilder",
    stad: "Amsterdam", trend: "up", trendVal: 2, isJij: false,
  },
  {
    rank: 6, naam: "Lars Visser", avatar: "https://i.pravatar.cc/150?img=7",
    score: 82, rating: 4.7, klussen: 147, badge: null, categorie: "timmerman",
    stad: "Amsterdam", trend: "down", trendVal: 1, isJij: false,
  },
  {
    rank: 7, naam: "Amina Osei", avatar: "https://i.pravatar.cc/150?img=48",
    score: 80, rating: 4.7, klussen: 132, badge: null, categorie: "schoonmaak",
    stad: "Amsterdam", trend: "up", trendVal: 3, isJij: false,
  },
  {
    rank: 8, naam: "Piet Hein Smit", avatar: "https://i.pravatar.cc/150?img=14",
    score: 78, rating: 4.6, klussen: 128, badge: null, categorie: "loodgieter",
    stad: "Amsterdam", trend: "same", trendVal: 0, isJij: false,
  },
  {
    rank: 9, naam: "Roos van Dam", avatar: "https://i.pravatar.cc/150?img=23",
    score: 76, rating: 4.6, klussen: 115, badge: null, categorie: "tuinman",
    stad: "Amsterdam", trend: "down", trendVal: 2, isJij: false,
  },
  {
    rank: 10, naam: "Mohammed Al-Rashid", avatar: "https://i.pravatar.cc/150?img=6",
    score: 74, rating: 4.5, klussen: 98, badge: null, categorie: "elektricien",
    stad: "Amsterdam", trend: "up", trendVal: 1, isJij: false,
  },
  {
    rank: 11, naam: "Ingrid Bakker", avatar: "https://i.pravatar.cc/150?img=26",
    score: 71, rating: 4.5, klussen: 87, badge: null, categorie: "schilder",
    stad: "Amsterdam", trend: "same", trendVal: 0, isJij: false,
  },
  {
    rank: 12, naam: "Bas Meijer", avatar: "https://i.pravatar.cc/150?img=18",
    score: 68, rating: 4.4, klussen: 76, badge: null, categorie: "timmerman",
    stad: "Amsterdam", trend: "up", trendVal: 2, isJij: false,
  },
];

const PODIUM_COLORS = ["#f59e0b", "#94a3b8", "#d97706"];
const PODIUM_LABELS = ["#1", "#2", "#3"];

function TrendIcon({ trend, val }: { trend: string; val: number }) {
  if (trend === "up") return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#22c55e" }}>
      <TrendingUp size={11} /> +{val}
    </span>
  );
  if (trend === "down") return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "#dc2626" }}>
      <TrendingDown size={11} /> -{val}
    </span>
  );
  return <Minus size={12} style={{ color: "var(--muted)" }} />;
}

export default function LeaderboardPage() {
  const [catFilter, setCatFilter] = useState<CatFilter>("alle");

  const filtered = LEADERBOARD.filter(p =>
    catFilter === "alle" || p.categorie === catFilter
  );
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const mijnPositie = filtered.find(p => p.isJij);

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-6"
        style={{ background: "linear-gradient(160deg, #7c3aed 0%, #4f46e5 100%)" }}>
        <div className="flex items-center gap-3 mb-5">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">Leaderboard</h1>
            <p className="text-white/70 text-xs">Jordaan & omgeving · Amsterdam</p>
          </div>
          <Trophy size={24} color="rgba(255,255,255,0.8)" />
        </div>

        {/* Jouw positie */}
        {mijnPositie && (
          <div className="bg-white/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl"
              style={{ background: "#f59e0b40", color: "#fbbf24" }}>
              #{mijnPositie.rank}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Jouw positie</p>
              <p className="text-white/70 text-xs">Score: {mijnPositie.score} · {mijnPositie.klussen} klussen</p>
            </div>
            <TrendIcon trend={mijnPositie.trend} val={mijnPositie.trendVal} />
          </div>
        )}
      </div>

      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Categorie filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          <button onClick={() => setCatFilter("alle")}
            className="touch-scale flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
            style={{
              borderColor: catFilter === "alle" ? "#7c3aed" : "var(--border)",
              background: catFilter === "alle" ? "#7c3aed10" : "transparent",
              color: catFilter === "alle" ? "#7c3aed" : "var(--muted)",
            }}>
            🏆 Alles
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)}
              className="touch-scale flex-shrink-0 px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all"
              style={{
                borderColor: catFilter === c.id ? c.color : "var(--border)",
                background: catFilter === c.id ? c.color + "15" : "transparent",
                color: catFilter === c.id ? c.color : "var(--muted)",
              }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Podium top 3 */}
        {top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-2">
            {/* Positie 2 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <img src={top3[1].avatar} className="w-14 h-14 rounded-2xl object-cover border-2"
                style={{ borderColor: PODIUM_COLORS[1] }} alt="" />
              <p className="font-bold text-xs text-center truncate w-full">{top3[1].naam.split(" ")[0]}</p>
              <div className="w-full rounded-t-xl flex items-center justify-center py-3 font-black text-sm"
                style={{ background: PODIUM_COLORS[1], color: "white", height: 60 }}>
                #2
              </div>
            </div>
            {/* Positie 1 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <Crown size={20} style={{ color: "#f59e0b" }} />
              <img src={top3[0].avatar} className="w-16 h-16 rounded-2xl object-cover border-2"
                style={{ borderColor: PODIUM_COLORS[0] }} alt="" />
              <p className="font-bold text-xs text-center truncate w-full">{top3[0].naam.split(" ")[0]}</p>
              <div className="w-full rounded-t-xl flex items-center justify-center py-3 font-black text-sm"
                style={{ background: PODIUM_COLORS[0], color: "white", height: 80 }}>
                #1
              </div>
            </div>
            {/* Positie 3 */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <img src={top3[2].avatar} className="w-14 h-14 rounded-2xl object-cover border-2"
                style={{ borderColor: PODIUM_COLORS[2] }} alt="" />
              <p className="font-bold text-xs text-center truncate w-full">{top3[2].naam.split(" ")[0]}</p>
              <div className="w-full rounded-t-xl flex items-center justify-center py-3 font-black text-sm"
                style={{ background: PODIUM_COLORS[2], color: "white", height: 50 }}>
                #3
              </div>
            </div>
          </div>
        )}

        {/* Volledige lijst */}
        <div className="flex flex-col gap-2">
          {filtered.map((p, i) => (
            <div key={p.rank}
              className="card p-4 flex items-center gap-3"
              style={p.isJij ? { borderColor: "#7c3aed", border: "2px solid #7c3aed" } : {}}>

              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {p.rank <= 3
                  ? <span className="text-lg">{["🥇", "🥈", "🥉"][p.rank - 1]}</span>
                  : <span className="font-black text-sm" style={{ color: "var(--muted)" }}>#{p.rank}</span>}
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img src={p.avatar} className="w-11 h-11 rounded-xl object-cover" alt="" />
                {p.badge && (
                  <span className="absolute -top-1 -right-1 text-xs">{p.badge}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm truncate">{p.naam}</p>
                  {p.isJij && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "#7c3aed", color: "white" }}>
                      JIJ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{p.rating}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{p.klussen} klussen</span>
                </div>
              </div>

              {/* Score + trend */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-black text-lg" style={{ color: p.isJij ? "#7c3aed" : "var(--foreground)" }}>
                  {p.score}
                </span>
                <TrendIcon trend={p.trend} val={p.trendVal} />
              </div>
            </div>
          ))}
        </div>

        {/* Hoe werkt de score */}
        <div className="card p-5">
          <p className="font-bold text-sm mb-3">Hoe wordt de Servr Score berekend?</p>
          <div className="space-y-2.5">
            {[
              { label: "⭐ Gem. beoordeling", pct: "40%" },
              { label: "⚡ Reactietijd", pct: "25%" },
              { label: "✅ Voltooiingspercentage", pct: "20%" },
              { label: "📋 Aantal klussen", pct: "15%" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xs flex-1">{f.label}</span>
                <div className="w-24 h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: f.pct, background: "#7c3aed" }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: "#7c3aed" }}>{f.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
