"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, Zap, MapPin, Clock } from "lucide-react";
import { HOT_JOBS, BEFORE_AFTER, PROVIDERS } from "@/lib/mockData";

function BeforeAfterCard({ item }: { item: typeof BEFORE_AFTER[0] }) {
  const [liked, setLiked] = useState(false);
  const [view, setView] = useState<"before" | "after">("after");

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <img src={item.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
        <div className="flex-1">
          <p className="font-bold text-sm">{item.provider}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{item.category}</span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>·</span>
            <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
              <MapPin size={11} />
              <span className="text-xs">{item.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voor/Na toggle */}
      <div className="relative">
        <img
          src={view === "before" ? item.before : item.after}
          alt={view}
          className="w-full h-64 object-cover"
          style={{ transition: "opacity 0.3s" }}
        />
        {/* Toggle buttons */}
        <div className="absolute top-3 left-3 flex gap-2">
          {(["before", "after"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="touch-scale px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: view === v ? "white" : "rgba(0,0,0,0.4)",
                color: view === v ? "var(--teal)" : "white",
                backdropFilter: "blur(4px)",
              }}>
              {v === "before" ? "Voor" : "Na"}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <p className="text-sm mb-3 leading-relaxed">{item.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(l => !l)}
              className="touch-scale flex items-center gap-1.5">
              <Heart size={20} fill={liked ? "var(--coral)" : "none"} stroke={liked ? "var(--coral)" : "currentColor"} />
              <span className="text-sm font-semibold">{item.likes + (liked ? 1 : 0)}</span>
            </button>
            <button className="touch-scale flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              <MessageCircle size={20} />
              <span className="text-sm">12</span>
            </button>
          </div>
          <button className="touch-scale" style={{ color: "var(--muted)" }}>
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: typeof HOT_JOBS[0] }) {
  const [bid, setBid] = useState(false);
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "var(--surface-2)" }}>
            {job.category.split(" ")[0]}
          </div>
          <div>
            <p className="font-bold text-sm">{job.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <MapPin size={11} />
                <span className="text-xs">{job.location}</span>
              </div>
              <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <Clock size={11} />
                <span className="text-xs">{job.time}</span>
              </div>
            </div>
          </div>
        </div>
        <span className="font-black text-sm flex-shrink-0 ml-2" style={{ color: "var(--coral)" }}>
          {job.budget}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
          {job.bids} biedingen
        </span>
        <button
          onClick={() => setBid(true)}
          className="touch-scale text-xs font-bold px-4 py-2 rounded-full transition-all"
          style={{
            background: bid ? "var(--surface-2)" : "var(--teal)",
            color: bid ? "var(--muted)" : "white",
          }}>
          {bid ? "✓ Geboden" : "Bied mee"}
        </button>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [tab, setTab] = useState<"jobs" | "gallery">("jobs");

  return (
    <div className="flex flex-col min-h-full pb-6 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "var(--surface)" }}>
        <h1 className="font-black text-2xl mb-4">Feed</h1>
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          <button onClick={() => setTab("jobs")}
            className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: tab === "jobs" ? "white" : "transparent",
              color: tab === "jobs" ? "var(--foreground)" : "var(--muted)",
              boxShadow: tab === "jobs" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            🔥 Hot Jobs
          </button>
          <button onClick={() => setTab("gallery")}
            className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: tab === "gallery" ? "white" : "transparent",
              color: tab === "gallery" ? "var(--foreground)" : "var(--muted)",
              boxShadow: tab === "gallery" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            📸 Voor & Na
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        {tab === "jobs" ? (
          <>
            {/* Jouw opdracht plaatsen */}
            <Link href="/scan"
              className="touch-scale flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap size={24} color="white" />
              </div>
              <div>
                <p className="text-white font-black text-base">Opdracht plaatsen</p>
                <p className="text-white/70 text-xs">Foto scannen voor eerlijke prijs</p>
              </div>
            </Link>

            {HOT_JOBS.map(job => <JobCard key={job.id} job={job} />)}
          </>
        ) : (
          <>
            {BEFORE_AFTER.map(item => <BeforeAfterCard key={item.id} item={item} />)}

            {/* Leaderboard preview */}
            <div className="card p-4">
              <p className="font-black text-base mb-4">🏆 Top Vakmensen — Jordaan</p>
              {PROVIDERS.slice(0, 3).map((p, i) => (
                <Link key={p.id} href={`/provider/${p.id}`}
                  className="touch-scale flex items-center gap-3 py-3 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <span className="w-6 text-center font-black text-sm"
                    style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b45309" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                  <img src={p.avatar} className="w-9 h-9 rounded-xl object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm" style={{ color: "var(--teal)" }}>S {p.servrScore}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>⭐ {p.rating}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
