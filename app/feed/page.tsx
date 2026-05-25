"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart, MessageCircle, Share2, Zap, MapPin, Clock,
  Star, TrendingUp, ChevronRight, Plus, Flame,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Wind,
  Layers, Bell, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, LucideIcon,
} from "lucide-react";
import { HOT_JOBS, BEFORE_AFTER, PROVIDERS, tijdGeleden } from "@/lib/mockData";

const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
  timmerman: Hammer, schoonmaak: Sparkles, tuinman: Leaf,
  verhuizen: Package, sloten: Lock, hvac: Thermometer,
  dak: Building2, zwembad: Waves, glas: Grid3X3,
  "tuin-aanleg": Leaf, it: Monitor, bestrating: Layers,
  klusser: Settings2, zonnepanelen: Sun, gevel: Building2,
  verwarming: Flame, garage: Car, isolatie: Layers,
  riolering: Droplets, intercom: Bell, tegels: LayoutGrid,
  parket: Layers, airco: Wind, pergola: Leaf,
  oprit: Hammer, rolluiken: Layers, andere: Settings2,
};

const CAT_COLORS: Record<string, string> = {
  loodgieter: "#3B82F6", elektricien: "#F59E0B", schilder: "#EC4899",
  timmerman: "#92400E", schoonmaak: "#10B981", tuinman: "#16A34A",
  verhuizen: "#6366F1", sloten: "#64748B", hvac: "#06B6D4",
  dak: "#78716C", klusser: "#8B5CF6", tegels: "#0EA5E9",
  airco: "#22D3EE", parket: "#D97706", zonnepanelen: "#F59E0B",
  verhuizen2: "#7C3AED",
};

function getCatColor(category: string): string {
  return CAT_COLORS[category] ?? "#4F46E5";
}

function CatIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = CAT_ICONS[id] ?? Settings2;
  return <Icon size={size} strokeWidth={2} />;
}

function BeforeAfterCard({ item }: { item: typeof BEFORE_AFTER[0] }) {
  const [liked, setLiked] = useState(false);
  const [view, setView] = useState<"before" | "after">("after");

  return (
    <div style={{ background: "#fff", borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.09)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <img src={item.avatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{item.provider}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-semibold" style={{ color: "#4F46E5" }}>{item.category}</span>
            <span style={{ color: "#e2e8f0" }}>·</span>
            <div className="flex items-center gap-1" style={{ color: "#94a3b8" }}>
              <MapPin size={10} />
              <span className="text-xs">{item.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={11} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
      </div>

      {/* Photo */}
      <div className="relative mx-4 mb-4 rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <img src={view === "before" ? item.before : item.after} alt={view}
          className="w-full h-full object-cover" style={{ transition: "opacity 0.3s" }} />
        {/* Gradient bottom */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
        {/* Toggle buttons */}
        <div className="absolute top-3 left-3 flex gap-2">
          {(["before", "after"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="touch-scale px-3.5 py-1.5 rounded-full text-xs font-black"
              style={{
                background: view === v ? "white" : "rgba(0,0,0,0.45)",
                color: view === v ? "#4F46E5" : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(8px)",
                boxShadow: view === v ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
              }}>
              {v === "before" ? "Voor" : "Na"}
            </button>
          ))}
        </div>
        {/* Label bottom */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", color: "white" }}>
            {view === "before" ? "Situatie voor" : "Eindresultaat ✨"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#475569" }}>{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(l => !l)}
              className="touch-scale flex items-center gap-1.5">
              <Heart size={20} fill={liked ? "#EF4444" : "none"} stroke={liked ? "#EF4444" : "#94a3b8"} strokeWidth={2} />
              <span className="text-sm font-bold" style={{ color: liked ? "#EF4444" : "#94a3b8" }}>{item.likes + (liked ? 1 : 0)}</span>
            </button>
            <button className="touch-scale flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
              <MessageCircle size={20} strokeWidth={2} />
              <span className="text-sm font-bold">12</span>
            </button>
          </div>
          <button className="touch-scale flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Share2 size={13} /> Delen
          </button>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: typeof HOT_JOBS[0] }) {
  const [bid, setBid] = useState(false);
  const color = getCatColor(job.category);

  return (
    <div style={{ background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      {/* Color accent top bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div className="p-4">
        <div className="flex items-start gap-3.5">
          {/* Category icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + "15" }}>
            <span style={{ color }}><CatIcon id={job.category} size={22} /></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="font-black text-sm leading-snug" style={{ color: "#0f172a" }}>{job.description}</p>
              <span className="font-black text-sm flex-shrink-0 px-2.5 py-1 rounded-xl"
                style={{ background: "#FEF2F2", color: "#DC2626", fontSize: 12 }}>{job.budget}</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#94a3b8" }}>
                <MapPin size={11} />{job.location}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#94a3b8" }}>
                <Clock size={11} />{tijdGeleden(job.postedAt)}
              </span>
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: "#F0FDF4", color: "#059669" }}>
                {job.bids} biedingen
              </span>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-2.5 mt-3.5">
          <span className="flex-1 text-xs font-bold px-3 py-1.5 rounded-xl text-center"
            style={{ background: color + "12", color }}>
            {job.categoryLabel}
          </span>
          <button
            onClick={() => setBid(true)}
            disabled={bid}
            className="touch-scale flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
            style={{
              background: bid ? "#F0FDF4" : `linear-gradient(135deg, ${color}, ${color}bb)`,
              color: bid ? "#059669" : "white",
              boxShadow: bid ? "none" : `0 4px 14px ${color}45`,
              minWidth: 100,
            }}>
            {bid ? "✓ Geboden!" : <><Zap size={12} /> Bied mee</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<"jobs" | "gallery">("jobs");

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 pt-14 pb-4"
        style={{ background: "rgba(241,244,250,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="px-5 mb-4">
          <h1 className="font-black" style={{ fontSize: 28, color: "#0f172a", letterSpacing: "-0.03em" }}>Opdrachten</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: "#64748b" }}>Live in jouw regio</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-5">
          <button onClick={() => setTab("jobs")}
            className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: tab === "jobs" ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#fff",
              color: tab === "jobs" ? "white" : "#94a3b8",
              boxShadow: tab === "jobs" ? "0 6px 20px rgba(79,70,229,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}>
            <Flame size={15} /> Hot jobs
          </button>
          <button onClick={() => setTab("gallery")}
            className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: tab === "gallery" ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#fff",
              color: tab === "gallery" ? "white" : "#94a3b8",
              boxShadow: tab === "gallery" ? "0 6px 20px rgba(79,70,229,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
            }}>
            <Star size={15} /> Voor & Na
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        {tab === "jobs" ? (
          <>
            {/* Opdracht plaatsen CTA */}
            <Link href="/opdracht/nieuw"
              className="touch-scale flex items-center gap-4 p-5 rounded-3xl"
              style={{
                background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
                boxShadow: "0 16px 40px rgba(79,70,229,0.4)",
              }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                <Plus size={26} color="white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="font-black text-white" style={{ fontSize: 18 }}>Opdracht plaatsen</p>
                <p className="text-white/70 text-sm mt-0.5">Krijg snel biedingen van vakmensen</p>
              </div>
              <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
            </Link>

            {/* Stats strip */}
            <div className="flex gap-3">
              {[
                { v: `${HOT_JOBS.length}`, l: "opdrachten", color: "#4F46E5", bg: "#EEF2FF" },
                { v: HOT_JOBS.filter(j => (Date.now() - j.postedAt) < 60 * 60 * 1000).length.toString(), l: "afgelopen uur", color: "#EF4444", bg: "#FEF2F2" },
                { v: "90s", l: "gem. reactie", color: "#10B981", bg: "#ECFDF5" },
              ].map(s => (
                <div key={s.l} className="flex-1 flex flex-col items-center py-3.5 rounded-2xl"
                  style={{ background: s.bg }}>
                  <span className="font-black text-xl leading-tight" style={{ color: s.color }}>{s.v}</span>
                  <span className="text-[10px] mt-0.5 font-semibold text-center" style={{ color: s.color + "aa" }}>{s.l}</span>
                </div>
              ))}
            </div>

            {/* Job cards */}
            {HOT_JOBS.map(job => <JobCard key={job.id} job={job} />)}
          </>
        ) : (
          <>
            {/* Voor & Na intro */}
            <div className="py-4 px-5 rounded-3xl"
              style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", boxShadow: "0 16px 40px rgba(15,23,42,0.25)" }}>
              <p className="font-black text-white" style={{ fontSize: 18 }}>Werk van vakmensen 📸</p>
              <p className="text-white/60 text-sm mt-1">Echte voor-en-na projecten in jouw buurt</p>
            </div>

            {BEFORE_AFTER.map(item => <BeforeAfterCard key={item.id} item={item} />)}

            {/* Top vakmensen leaderboard */}
            <div style={{ background: "#fff", borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.09)" }}>
              <div className="p-5 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} style={{ color: "#4F46E5" }} />
                    <p className="font-black text-base" style={{ color: "#0f172a" }}>Top Vakmensen</p>
                  </div>
                  <Link href="/search" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
                    style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                    Alle <ChevronRight size={11} />
                  </Link>
                </div>
                {PROVIDERS.slice(0, 3).map((p, i) => (
                  <Link key={p.id} href={`/provider/${p.id}`}
                    className="touch-scale flex items-center gap-3.5 py-3.5"
                    style={{ borderBottom: i < 2 ? "1px solid #F8FAFC" : "none" }}>
                    <span className="w-8 text-center font-black text-lg">
                      {["🥇", "🥈", "🥉"][i]}
                    </span>
                    <img src={p.avatar} className="w-11 h-11 rounded-2xl object-cover flex-shrink-0" alt="" />
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{p.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm" style={{ color: "#4F46E5" }}>S {p.servrScore}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>⭐ {p.rating}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
