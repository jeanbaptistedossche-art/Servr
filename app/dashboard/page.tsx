"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Star, Clock, CheckCircle, ChevronRight, Zap, Building2, Wrench, CalendarDays, FileText, Receipt } from "lucide-react";

const JOBS_QUEUE = [
  { id: "q1", user: "Lisa de Vries", task: "Lekkende kraan keuken", address: "Prinsengracht 124", time: "Nu", budget: "€65-85", urgent: true },
  { id: "q2", user: "Ahmed M.", task: "CV inspectie", address: "Keizersgracht 88", time: "14:00", budget: "€75", urgent: false },
  { id: "q3", user: "Sandra H.", task: "Toilet reparatie", address: "Westerstraat 45", time: "Morgen 10:00", budget: "€90-120", urgent: false },
];

const BADGES_PROVIDER = [
  { icon: "🏆", label: "Topvakman", earned: true, desc: "Top 10% in categorie" },
  { icon: "⚡", label: "Snel reageren", earned: true, desc: "< 5 min reactietijd" },
  { icon: "🔥", label: "50 klussen", earned: true, desc: "50 voltooide opdrachten" },
  { icon: "💎", label: "Diamant", earned: false, desc: "Nog 23 klussen nodig" },
  { icon: "🌟", label: "100 klussen", earned: false, desc: "Nog 73 klussen nodig" },
];

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</p>
      </div>
      <p className="font-black text-2xl" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

import { useUserStore } from "@/lib/store";

export default function DashboardPage() {
  const [tab, setTab] = useState<"overzicht" | "wachtrij" | "badges">("overzicht");
  const { name: userName } = useUserStore();

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/profile"
              className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft size={18} color="white" />
            </Link>
            <h1 className="text-white font-black text-xl">Vakman Dashboard</h1>
          </div>
          {/* Online toggle */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-dot" />
            <span className="text-white text-xs font-bold">Online</span>
          </div>
        </div>

        {/* Servr Score groot */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 * (1 - 0.94)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-black text-xl leading-none">94</span>
              <span className="text-white/60 text-[9px]">score</span>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-xs">Servr Score</p>
            <p className="text-white font-black text-2xl">{userName || "Vakman"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/80 text-sm">🏆 Topvakman</span>
              <span className="text-white/80 text-sm">·</span>
              <Star size={13} className="fill-yellow-300 text-yellow-300" />
              <span className="text-white font-bold text-sm">4.9</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: "var(--surface-2)" }}>
          {(["overzicht", "wachtrij", "badges"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-xs capitalize transition-all"
              style={{
                background: tab === t ? "white" : "transparent",
                color: tab === t ? "var(--foreground)" : "var(--muted)",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overzicht tab */}
        {tab === "overzicht" && (
          <div className="flex flex-col gap-5">

            {/* Snelle toegang */}
            <div>
              <p className="font-bold text-xs uppercase mb-3" style={{ color: "var(--muted)" }}>Beheer</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { href: "/bedrijf", icon: <Building2 size={20} style={{ color: "var(--teal)" }} />, label: "Bedrijfsprofiel", sub: "KvK, BTW, IBAN" },
                  { href: "/diensten", icon: <Wrench size={20} style={{ color: "var(--teal)" }} />, label: "Diensten & Prijzen", sub: "Beheer je aanbod" },
                  { href: "/agenda", icon: <CalendarDays size={20} style={{ color: "var(--teal)" }} />, label: "Agenda", sub: "Boekingen & planning" },
                  { href: "/documenten", icon: <FileText size={20} style={{ color: "var(--teal)" }} />, label: "Offertes & Facturen", sub: "Beheer documenten" },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="touch-scale card p-4 flex flex-col gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "var(--teal)" + "12" }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.sub}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Openstaande facturen */}
            <div className="card p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "#fef3c7" }}>
                <Receipt size={20} style={{ color: "#d97706" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">1 openstaande factuur</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Ahmed Mansour · €298,04 · vervalt over 11 dagen</p>
              </div>
              <Link href="/documenten?tab=facturen"
                className="touch-scale px-3 py-1.5 rounded-xl font-bold text-xs"
                style={{ background: "#fef3c7", color: "#d97706" }}>
                Bekijk
              </Link>
            </div>

            {/* Stats grid */}
            {/* Stats grid — klikbaar */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/verdiensten" className="touch-scale">
                <StatCard icon="💰" label="Verdiensten netto" value="€ 758" sub="Na 10% Servr commissie" color="var(--teal)" />
              </Link>
              <Link href="/klussen" className="touch-scale">
                <StatCard icon="📋" label="Klussen (week)" value="11" sub="8 voltooid, 3 lopend" color="var(--foreground)" />
              </Link>
              <StatCard icon="⭐" label="Gem. beoordeling" value="4.9" sub="127 reviews totaal" color="#f59e0b" />
              <StatCard icon="⚡" label="Reactietijd" value="3 min" sub="Gemiddeld" color="var(--coral)" />
            </div>

            {/* Verdiensten grafiek */}
            <Link href="/verdiensten">
              <div className="card p-4 touch-scale">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm">Netto verdiensten</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Na 10% Servr commissie</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: "var(--teal)" + "18", color: "var(--teal)" }}>
                    Deze week →
                  </span>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 108, 76, 180, 144, 126, 83].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-lg transition-all"
                        style={{ height: `${(v / 180) * 80}px`, background: i === 3 ? "var(--teal)" : "var(--surface-2)" }} />
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Leaderboard positie */}
            <Link href="/leaderboard" className="touch-scale">
              <div className="card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "#fef3c7" }}>🏆</div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Leaderboard — Loodgieter</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Jordaan, Amsterdam · 34 vakmensen</p>
                  <p className="font-black text-lg mt-1" style={{ color: "var(--teal)" }}>#2 van 34</p>
                </div>
                <TrendingUp size={20} className="text-green-500" />
              </div>
            </Link>
          </div>
        )}

        {/* Wachtrij tab */}
        {tab === "wachtrij" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-sm">{JOBS_QUEUE.length} nieuwe opdrachten</p>
              <Link href="/scan" className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--teal)" }}>
                <Zap size={13} /> Leads
              </Link>
            </div>

            {/* Uitleg locatie-privacy */}
            <div className="p-3 rounded-2xl flex items-start gap-2"
              style={{ background: "var(--teal)" + "10" }}>
              <span className="text-base">📍</span>
              <p className="text-xs leading-relaxed" style={{ color: "var(--teal)" }}>
                Je ziet de buurt van de klant. Het <strong>exacte adres</strong> wordt pas zichtbaar nadat de klant jouw offerte accepteert.
              </p>
            </div>

            {JOBS_QUEUE.map(job => (
              <div key={job.id} className="card p-4">
                {job.urgent && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="animate-dot w-2 h-2 rounded-full" style={{ background: "var(--coral)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--coral)" }}>SPOED</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm">{job.task}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      👤 {job.user} · 📍 {job.address}
                    </p>
                  </div>
                  <span className="font-black text-sm flex-shrink-0" style={{ color: "var(--teal)" }}>
                    {job.budget}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1" style={{ color: "var(--muted)" }}>
                    <Clock size={13} />
                    <span className="text-xs font-semibold">{job.time}</span>
                  </div>
                  <button className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    ✕ Weigeren
                  </button>
                  <Link href={`/opdracht/${job.id === "q1" ? "o1" : job.id === "q2" ? "o2" : "o3"}`}
                    className="touch-scale px-3 py-2 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--teal)" }}>
                    Offerte sturen →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges tab */}
        {tab === "badges" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Verdien badges door uitmuntend werk te leveren
            </p>
            {BADGES_PROVIDER.map(b => (
              <div key={b.label}
                className="card p-4 flex items-center gap-4"
                style={{ opacity: b.earned ? 1 : 0.5 }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: b.earned ? "var(--teal)" + "18" : "var(--surface-2)" }}>
                  {b.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{b.label}</p>
                    {b.earned && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--teal)", color: "white" }}>
                        ✓ Verdiend
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{b.desc}</p>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
