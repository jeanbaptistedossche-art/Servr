"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Play, Pause, Square, Clock, Plus,
  Euro, TrendingUp, Calendar, Trash2, X, Check,
  ChevronDown, MoreVertical, Download, Filter,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type TimerStatus = "idle" | "running" | "paused";

type UurEntry = {
  id: string;
  klusNaam: string;
  klusId?: string;
  klant: string;
  datum: string;         // ISO date string
  startTijd: string;     // HH:MM
  eindTijd?: string;     // HH:MM
  duurSec: number;       // total seconds
  tarief: number;        // €/uur
  notitie?: string;
  status: "lopend" | "afgerond";
};

type ActiveTimer = {
  klusNaam: string;
  klant: string;
  startEpoch: number;   // Date.now() when started
  pausedSec: number;    // accumulated paused seconds
  pauseStart?: number;  // epoch when paused
  status: TimerStatus;
  tarief: number;
  notitie: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_KLUSSEN = [
  { id: "k1", naam: "Lekkende kraan keuken", klant: "Lisa de Vries" },
  { id: "k2", naam: "CV ketel inspectie",    klant: "Ahmed Mansour" },
  { id: "k3", naam: "Woonkamer schilderen",  klant: "Petra Jansen" },
  { id: "k4", naam: "Badkamer tegels",       klant: "Robin Smit" },
  { id: "k5", naam: "Elektra keuken",        klant: "Sara Bakker" },
];

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const DAY3 = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

const INIT_ENTRIES: UurEntry[] = [
  { id: "u1", klusNaam: "Woonkamer schilderen", klusId: "k3", klant: "Petra Jansen",  datum: TODAY,     startTijd: "08:00", eindTijd: "11:30", duurSec: 3.5 * 3600,  tarief: 65, status: "afgerond", notitie: "Plafond + 1e laag muren" },
  { id: "u2", klusNaam: "Badkamer tegels",      klusId: "k4", klant: "Robin Smit",    datum: TODAY,     startTijd: "13:00", eindTijd: "16:45", duurSec: 3.75 * 3600, tarief: 75, status: "afgerond", notitie: "Oud tegelwerk verwijderd" },
  { id: "u3", klusNaam: "CV ketel inspectie",   klusId: "k2", klant: "Ahmed Mansour", datum: YESTERDAY, startTijd: "09:30", eindTijd: "10:45", duurSec: 1.25 * 3600, tarief: 85, status: "afgerond" },
  { id: "u4", klusNaam: "Elektra keuken",       klusId: "k5", klant: "Sara Bakker",   datum: YESTERDAY, startTijd: "14:00", eindTijd: "17:00", duurSec: 3 * 3600,    tarief: 80, status: "afgerond", notitie: "Groepenkast uitgebreid" },
  { id: "u5", klusNaam: "Lekkende kraan",       klusId: "k1", klant: "Lisa de Vries", datum: DAY3,      startTijd: "10:00", eindTijd: "11:15", duurSec: 1.25 * 3600, tarief: 65, status: "afgerond" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSec(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtDuur(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}u`;
  return `${h}u ${m}m`;
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
}

function calcVerdienst(entry: UurEntry): number {
  return (entry.duurSec / 3600) * entry.tarief;
}

function datumLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Vandaag";
  if (diff === 1) return "Gisteren";
  return d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UrenregistratiePage() {
  const router = useRouter();
  const uurtarief = useUserStore((s) => s.uurtarief) || 65;

  const [entries, setEntries] = useState<UurEntry[]>(INIT_ENTRIES);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tab, setTab] = useState<"lopend" | "overzicht" | "statistieken">("overzicht");
  const [showNieuw, setShowNieuw] = useState(false);
  const [showDetails, setShowDetails] = useState<UurEntry | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<"week" | "maand" | "alles">("week");

  // New timer form
  const [newKlus, setNewKlus] = useState(MOCK_KLUSSEN[0]);
  const [newTarief, setNewTarief] = useState(uurtarief);
  const [newNotitie, setNewNotitie] = useState("");
  const [customKlus, setCustomKlus] = useState("");
  const [customKlant, setCustomKlant] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick
  useEffect(() => {
    if (activeTimer?.status === "running") {
      intervalRef.current = setInterval(() => {
        const raw = (Date.now() - activeTimer.startEpoch) / 1000;
        setElapsedSec(Math.max(0, raw - activeTimer.pausedSec));
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeTimer]);

  const startTimer = useCallback(() => {
    const klus = isCustom
      ? { naam: customKlus || "Onbenoemde klus", klant: customKlant || "Onbekende klant" }
      : { naam: newKlus.naam, klant: newKlus.klant };

    setActiveTimer({
      klusNaam: klus.naam,
      klant: klus.klant,
      startEpoch: Date.now(),
      pausedSec: 0,
      status: "running",
      tarief: newTarief,
      notitie: newNotitie,
    });
    setElapsedSec(0);
    setShowNieuw(false);
    setTab("lopend");
  }, [isCustom, customKlus, customKlant, newKlus, newTarief, newNotitie]);

  const pauseTimer = useCallback(() => {
    if (!activeTimer || activeTimer.status !== "running") return;
    setActiveTimer({ ...activeTimer, status: "paused", pauseStart: Date.now() });
  }, [activeTimer]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.status !== "paused") return;
    const extraPaused = activeTimer.pauseStart ? (Date.now() - activeTimer.pauseStart) / 1000 : 0;
    setActiveTimer({ ...activeTimer, status: "running", pausedSec: activeTimer.pausedSec + extraPaused, pauseStart: undefined });
  }, [activeTimer]);

  const stopTimer = useCallback(() => {
    if (!activeTimer) return;
    const now = new Date();
    const totalPaused = activeTimer.status === "paused" && activeTimer.pauseStart
      ? activeTimer.pausedSec + (Date.now() - activeTimer.pauseStart) / 1000
      : activeTimer.pausedSec;
    const totalSec = Math.max(0, (Date.now() - activeTimer.startEpoch) / 1000 - totalPaused);
    const startDate = new Date(activeTimer.startEpoch);

    const entry: UurEntry = {
      id: `u${Date.now()}`,
      klusNaam: activeTimer.klusNaam,
      klant: activeTimer.klant,
      datum: startDate.toISOString().slice(0, 10),
      startTijd: startDate.toTimeString().slice(0, 5),
      eindTijd: now.toTimeString().slice(0, 5),
      duurSec: totalSec,
      tarief: activeTimer.tarief,
      notitie: activeTimer.notitie || undefined,
      status: "afgerond",
    };

    setEntries((prev) => [entry, ...prev]);
    setActiveTimer(null);
    setElapsedSec(0);
    setTab("overzicht");
  }, [activeTimer]);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setShowDetails(null);
  }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filteredEntries = entries.filter((e) => {
    if (filterPeriod === "alles") return true;
    const d = new Date(e.datum);
    const now = new Date();
    if (filterPeriod === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= weekAgo;
    }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalSec = filteredEntries.reduce((s, e) => s + e.duurSec, 0);
  const totalVerdienst = filteredEntries.reduce((s, e) => s + calcVerdienst(e), 0);
  const gemTarief = totalSec > 0 ? totalVerdienst / (totalSec / 3600) : 0;
  const aantalKlussen = new Set(filteredEntries.map((e) => e.klusNaam)).size;

  // ── Group by date ───────────────────────────────────────────────────────────
  const grouped: Record<string, UurEntry[]> = {};
  for (const e of filteredEntries) {
    (grouped[e.datum] ??= []).push(e);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // ── Day stats ───────────────────────────────────────────────────────────────
  // Per-day bar chart for statistieken
  const last7: { label: string; sec: number; eur: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const dayEntries = entries.filter((e) => e.datum === iso);
    const sec = dayEntries.reduce((s, e) => s + e.duurSec, 0);
    const eur = dayEntries.reduce((s, e) => s + calcVerdienst(e), 0);
    last7.push({ label: d.toLocaleDateString("nl-NL", { weekday: "short" }), sec, eur });
  }
  const maxSec = Math.max(...last7.map((d) => d.sec), 3600);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Urenregistratie</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Tijdregistratie per klus</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="touch-scale flex items-center gap-1.5 px-3 py-2.5 rounded-2xl font-bold text-sm text-white flex-shrink-0 whitespace-nowrap"
            style={{ background: "#4F46E5" }}>
            <Plus size={15} />
            Timer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E2E8F0" }}>
          {(["lopend", "overzicht", "statistieken"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all relative"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#4F46E5" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
              }}>
              {t === "lopend" && activeTimer && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full"
                  style={{ background: activeTimer.status === "running" ? "#10B981" : "#F59E0B" }} />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28">
        {/* ── LOPEND TAB ───────────────────────────────────────────────────────── */}
        {tab === "lopend" && (
          <div className="mt-4 flex flex-col gap-4">
            {!activeTimer ? (
              <div className="rounded-3xl p-8 flex flex-col items-center gap-4"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "#EEF2FF" }}>
                  <Clock size={36} style={{ color: "#4F46E5" }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#0f172a" }}>Geen actieve timer</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>Tap op "Start timer" om te beginnen</p>
                </div>
                <button onClick={() => setShowNieuw(true)}
                  className="touch-scale px-6 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "#4F46E5" }}>
                  Start nieuwe timer
                </button>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                {/* Status bar */}
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ background: activeTimer.status === "running" ? "#10B981" : "#F59E0B" }}>
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    {activeTimer.status === "running" ? "⏱ Timer loopt" : "⏸ Gepauzeerd"}
                  </span>
                </div>
                <div className="p-5">
                  {/* Clock display */}
                  <div className="flex flex-col items-center py-6">
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#94a3b8" }}>Verstreken tijd</p>
                    <p className="font-black tracking-tight"
                      style={{ fontSize: 52, color: "#0f172a", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {fmtSec(elapsedSec)}
                    </p>
                    <p className="text-sm font-semibold mt-3" style={{ color: "#10B981" }}>
                      {fmtEur((elapsedSec / 3600) * activeTimer.tarief)} (€{activeTimer.tarief}/u)
                    </p>
                  </div>

                  {/* Klus info */}
                  <div className="rounded-2xl p-4 mb-5" style={{ background: "#F8FAFC" }}>
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{activeTimer.klusNaam}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{activeTimer.klant}</p>
                    {activeTimer.notitie && (
                      <p className="text-xs mt-2 italic" style={{ color: "#94a3b8" }}>"{activeTimer.notitie}"</p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3">
                    {activeTimer.status === "running" ? (
                      <button onClick={pauseTimer}
                        className="touch-scale flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                        style={{ background: "#FFF7ED", color: "#F59E0B" }}>
                        <Pause size={20} />
                        Pauzeer
                      </button>
                    ) : (
                      <button onClick={resumeTimer}
                        className="touch-scale flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                        style={{ background: "#F0FDF4", color: "#10B981" }}>
                        <Play size={20} />
                        Hervat
                      </button>
                    )}
                    <button onClick={stopTimer}
                      className="touch-scale flex-1 py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                      style={{ background: "#EF4444" }}>
                      <Square size={20} />
                      Stop & sla op
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent today */}
            {grouped[TODAY] && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>Vandaag</p>
                <div className="flex flex-col gap-2">
                  {grouped[TODAY].map((e) => (
                    <EntryRow key={e.id} entry={e} onClick={() => setShowDetails(e)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── OVERZICHT TAB ────────────────────────────────────────────────────── */}
        {tab === "overzicht" && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard icon={<Clock size={18} style={{ color: "#4F46E5" }} />}
                label="Gewerkte tijd" value={fmtDuur(totalSec)}
                sub={filterPeriod === "week" ? "deze week" : filterPeriod === "maand" ? "deze maand" : "totaal"}
                color="#EEF2FF" />
              <SummaryCard icon={<Euro size={18} style={{ color: "#10B981" }} />}
                label="Verdiend" value={fmtEur(totalVerdienst)}
                sub={`gem. ${fmtEur(gemTarief)}/u`}
                color="#ECFDF5" />
              <SummaryCard icon={<TrendingUp size={18} style={{ color: "#F59E0B" }} />}
                label="Klussen" value={String(aantalKlussen)}
                sub={`${filteredEntries.length} sessies`}
                color="#FFFBEB" />
              <SummaryCard icon={<Calendar size={18} style={{ color: "#8B5CF6" }} />}
                label="Gem. dag" value={fmtDuur(totalSec / Math.max(1, sortedDates.length))}
                sub="per werkdag"
                color="#F5F3FF" />
            </div>

            {/* Period filter */}
            <div className="flex gap-2">
              {(["week", "maand", "alles"] as const).map((p) => (
                <button key={p} onClick={() => setFilterPeriod(p)}
                  className="px-4 py-2 rounded-full text-xs font-bold"
                  style={{
                    background: filterPeriod === p ? "#4F46E5" : "#fff",
                    color: filterPeriod === p ? "#fff" : "#64748b",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}>
                  {p === "week" ? "Deze week" : p === "maand" ? "Deze maand" : "Alles"}
                </button>
              ))}
            </div>

            {/* Grouped entries */}
            {sortedDates.length === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <p className="text-3xl mb-2">📋</p>
                <p className="font-bold" style={{ color: "#0f172a" }}>Geen uren gevonden</p>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>Start een timer of pas de filter aan</p>
              </div>
            ) : sortedDates.map((datum) => {
              const dayEntries = grouped[datum];
              const daySec = dayEntries.reduce((s, e) => s + e.duurSec, 0);
              const dayEur = dayEntries.reduce((s, e) => s + calcVerdienst(e), 0);
              return (
                <div key={datum}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold" style={{ color: "#374151" }}>{datumLabel(datum)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: "#4F46E5" }}>{fmtDuur(daySec)}</span>
                      <span className="text-xs font-bold" style={{ color: "#10B981" }}>{fmtEur(dayEur)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayEntries.map((e) => (
                      <EntryRow key={e.id} entry={e} onClick={() => setShowDetails(e)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATISTIEKEN TAB ─────────────────────────────────────────────────── */}
        {tab === "statistieken" && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Weekly bar chart */}
            <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Uren per dag (afgelopen 7 dagen)</p>
              <div className="flex items-end gap-2 h-28">
                {last7.map((d, i) => {
                  const pct = d.sec / maxSec;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs font-semibold" style={{ color: "#4F46E5", fontSize: 10 }}>
                        {d.sec > 0 ? fmtDuur(d.sec) : ""}
                      </p>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{
                          height: Math.max(4, pct * 80),
                          background: isToday ? "#4F46E5" : d.sec > 0 ? "#A5B4FC" : "#E2E8F0",
                        }} />
                      <p className="text-xs" style={{ color: isToday ? "#4F46E5" : "#94a3b8", fontWeight: isToday ? 700 : 400 }}>
                        {d.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top klussen */}
            <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Meeste uren per klus</p>
              {(() => {
                const klusMap: Record<string, { sec: number; eur: number; klant: string }> = {};
                for (const e of entries) {
                  if (!klusMap[e.klusNaam]) klusMap[e.klusNaam] = { sec: 0, eur: 0, klant: e.klant };
                  klusMap[e.klusNaam].sec += e.duurSec;
                  klusMap[e.klusNaam].eur += calcVerdienst(e);
                }
                const sorted = Object.entries(klusMap).sort((a, b) => b[1].sec - a[1].sec).slice(0, 5);
                const maxK = Math.max(...sorted.map((s) => s[1].sec), 1);
                return sorted.map(([naam, data], i) => (
                  <div key={naam} className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{naam}</p>
                        <p className="text-xs" style={{ color: "#94a3b8" }}>{data.klant}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{fmtDuur(data.sec)}</p>
                        <p className="text-xs font-semibold" style={{ color: "#10B981" }}>{fmtEur(data.eur)}</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${(data.sec / maxK) * 100}%`, background: i === 0 ? "#4F46E5" : "#A5B4FC" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Gem. dag stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Productiviteit</p>
                <p className="text-2xl font-black" style={{ color: "#0f172a" }}>
                  {Math.round((entries.reduce((s, e) => s + e.duurSec, 0) / 3600 / Math.max(1, sortedDates.length)) * 10) / 10}u
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>gem. per werkdag</p>
              </div>
              <div className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Eff. tarief</p>
                <p className="text-2xl font-black" style={{ color: "#0f172a" }}>
                  {fmtEur(gemTarief)}<span className="text-sm font-semibold">/u</span>
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>gewogen gem.</p>
              </div>
            </div>

            {/* Tip */}
            <div className="rounded-2xl p-4 flex gap-3 items-start"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Tip: verhoog je tarief</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                  Jouw gemiddeld eff. uurtarief is {fmtEur(gemTarief)}. Overweeg je starttarief te verhogen naar €{Math.ceil(gemTarief / 5) * 5}/u.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Nieuwe timer bottom sheet ───────────────────────────────────────── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>Nieuwe timer</h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F3F4F6" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              {/* Klus selectie */}
              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                  Klus
                </label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setIsCustom(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: !isCustom ? "#4F46E5" : "#F3F4F6", color: !isCustom ? "#fff" : "#64748b" }}>
                    Bestaande klus
                  </button>
                  <button onClick={() => setIsCustom(true)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{ background: isCustom ? "#4F46E5" : "#F3F4F6", color: isCustom ? "#fff" : "#64748b" }}>
                    Nieuwe klus
                  </button>
                </div>

                {!isCustom ? (
                  <div className="relative">
                    <select
                      value={newKlus.id}
                      onChange={(e) => {
                        const found = MOCK_KLUSSEN.find((k) => k.id === e.target.value);
                        if (found) setNewKlus(found);
                      }}
                      className="w-full appearance-none rounded-2xl px-4 py-3.5 pr-10 text-sm font-semibold"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }}>
                      {MOCK_KLUSSEN.map((k) => (
                        <option key={k.id} value={k.id}>{k.naam} — {k.klant}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#94a3b8" }} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input value={customKlus} onChange={(e) => setCustomKlus(e.target.value)}
                      placeholder="Naam van de klus…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                    <input value={customKlant} onChange={(e) => setCustomKlant(e.target.value)}
                      placeholder="Naam van de klant…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm font-semibold"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </div>
                )}
              </div>

              {/* Tarief */}
              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                  Uurtarief (€)
                </label>
                <div className="flex items-center gap-2">
                  {[45, 55, 65, 75, 85, 95].map((t) => (
                    <button key={t} onClick={() => setNewTarief(t)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: newTarief === t ? "#4F46E5" : "#F3F4F6",
                        color: newTarief === t ? "#fff" : "#64748b",
                      }}>
                      €{t}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
                  <Euro size={16} style={{ color: "#94a3b8" }} />
                  <input type="number" value={newTarief}
                    onChange={(e) => setNewTarief(Number(e.target.value))}
                    className="flex-1 bg-transparent text-sm font-bold"
                    style={{ color: "#0f172a", outline: "none" }} />
                  <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>/uur</span>
                </div>
              </div>

              {/* Notitie */}
              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                  Notitie (optioneel)
                </label>
                <textarea value={newNotitie} onChange={(e) => setNewNotitie(e.target.value)}
                  placeholder="Wat ga je doen? Bijv. 'badkamer betegelen — 1e laag'"
                  rows={2}
                  className="w-full rounded-2xl px-4 py-3.5 text-sm resize-none"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </div>

              <button onClick={startTimer}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "#4F46E5" }}>
                <Play size={20} />
                Start timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Entry detail bottom sheet ────────────────────────────────────────── */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetails(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{showDetails.klusNaam}</h2>
                  <p className="text-sm" style={{ color: "#64748b" }}>{showDetails.klant}</p>
                </div>
                <button onClick={() => setShowDetails(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F3F4F6" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <DetailField label="Datum" value={datumLabel(showDetails.datum)} />
                <DetailField label="Tijd" value={`${showDetails.startTijd} – ${showDetails.eindTijd ?? "lopend"}`} />
                <DetailField label="Duur" value={fmtDuur(showDetails.duurSec)} accent="#4F46E5" />
                <DetailField label="Verdienst" value={fmtEur(calcVerdienst(showDetails))} accent="#10B981" />
              </div>

              {showDetails.notitie && (
                <div className="rounded-2xl p-3 mb-4" style={{ background: "#F8FAFC" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Notitie</p>
                  <p className="text-sm italic" style={{ color: "#374151" }}>"{showDetails.notitie}"</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => deleteEntry(showDetails.id)}
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444" }}>
                  <Trash2 size={16} />
                  Verwijder
                </button>
                <button onClick={() => setShowDetails(null)}
                  className="touch-scale flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: "#4F46E5", color: "#fff" }}>
                  <Check size={16} />
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function EntryRow({ entry, onClick }: { entry: UurEntry; onClick: () => void }) {
  const verdienst = calcVerdienst(entry);
  return (
    <button onClick={onClick}
      className="touch-scale w-full rounded-2xl p-4 flex items-center gap-3 text-left"
      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "#EEF2FF" }}>
        <Clock size={18} style={{ color: "#4F46E5" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{entry.klusNaam}</p>
        <p className="text-xs truncate" style={{ color: "#64748b" }}>
          {entry.startTijd}–{entry.eindTijd ?? "…"} · {entry.klant}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{fmtDuur(entry.duurSec)}</p>
        <p className="text-xs font-semibold" style={{ color: "#10B981" }}>{fmtEur(verdienst)}</p>
      </div>
    </button>
  );
}

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
        style={{ background: color }}>
        {icon}
      </div>
      <p className="text-2xl font-black leading-tight" style={{ color: "#0f172a" }}>{value}</p>
      <p className="text-xs font-bold" style={{ color: "#374151" }}>{label}</p>
      <p className="text-xs" style={{ color: "#94a3b8" }}>{sub}</p>
    </div>
  );
}

function DetailField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#F8FAFC" }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#0f172a" }}>{value}</p>
    </div>
  );
}
