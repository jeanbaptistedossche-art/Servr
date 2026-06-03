"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Pause, Square, Clock, Plus,
  Euro, TrendingUp, Calendar, Trash2, X, Check,
  ChevronDown, ArrowLeft,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type TimerStatus = "idle" | "running" | "paused";

type UurEntry = {
  id: string;
  klusNaam: string;
  klusId?: string;
  klant: string;
  datum: string;
  startTijd: string;
  eindTijd?: string;
  duurSec: number;
  tarief: number;
  notitie?: string;
  status: "lopend" | "afgerond";
};

type ActiveTimer = {
  klusNaam: string;
  klant: string;
  startEpoch: number;
  pausedSec: number;
  pauseStart?: number;
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

  const [newKlus, setNewKlus] = useState(MOCK_KLUSSEN[0]);
  const [newTarief, setNewTarief] = useState(uurtarief);
  const [newNotitie, setNewNotitie] = useState("");
  const [customKlus, setCustomKlus] = useState("");
  const [customKlant, setCustomKlant] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const totalSec = filteredEntries.reduce((s, e) => s + e.duurSec, 0);
  const totalVerdienst = filteredEntries.reduce((s, e) => s + calcVerdienst(e), 0);
  const gemTarief = totalSec > 0 ? totalVerdienst / (totalSec / 3600) : 0;
  const aantalKlussen = new Set(filteredEntries.map((e) => e.klusNaam)).size;

  const grouped: Record<string, UurEntry[]> = {};
  for (const e of filteredEntries) {
    (grouped[e.datum] ??= []).push(e);
  }
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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

  return (
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Urenregistratie
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83" }}>Tijdregistratie per klus</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="touch-scale flex items-center gap-1.5 px-4 py-2.5 font-bold text-sm flex-shrink-0"
            style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
            <Plus size={15} />
            Timer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          {(["lopend", "overzicht", "statistieken"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all relative"
              style={{
                background: tab === t ? "#2B4030" : "transparent",
                color: tab === t ? "#F5EFE5" : "#8A8A83",
              }}>
              {t === "lopend" && activeTimer && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full"
                  style={{ background: activeTimer.status === "running" ? "#22C55E" : "#C97A4D" }} />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* ── LOPEND TAB ───────────────────────────────────────────────────────── */}
        {tab === "lopend" && (
          <div className="mt-4 flex flex-col gap-4">
            {!activeTimer ? (
              <div className="p-8 flex flex-col items-center gap-4"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "#E8EDE9" }}>
                  <Clock size={36} style={{ color: "#2B4030" }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#1A1D1A" }}>Geen actieve timer</p>
                  <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>Tap op "Start timer" om te beginnen</p>
                </div>
                <button onClick={() => setShowNieuw(true)}
                  className="touch-scale px-6 py-3 font-bold text-sm"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
                  Start nieuwe timer
                </button>
              </div>
            ) : (
              <div className="overflow-hidden"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ background: activeTimer.status === "running" ? "#2B4030" : "#C97A4D" }}>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#F5EFE5" }}>
                    {activeTimer.status === "running" ? "⏱ Timer loopt" : "⏸ Gepauzeerd"}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex flex-col items-center py-6">
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#8A8A83" }}>Verstreken tijd</p>
                    <p className="font-black tracking-tight"
                      style={{ fontSize: 52, color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                      {fmtSec(elapsedSec)}
                    </p>
                    <p className="text-sm font-semibold mt-3" style={{ color: "#2B4030" }}>
                      {fmtEur((elapsedSec / 3600) * activeTimer.tarief)} (€{activeTimer.tarief}/u)
                    </p>
                  </div>

                  <div className="p-4 mb-5" style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
                    <p className="font-bold text-sm" style={{ color: "#1A1D1A" }}>{activeTimer.klusNaam}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#5C5C56" }}>{activeTimer.klant}</p>
                    {activeTimer.notitie && (
                      <p className="text-xs mt-2 italic" style={{ color: "#8A8A83" }}>"{activeTimer.notitie}"</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {activeTimer.status === "running" ? (
                      <button onClick={pauseTimer}
                        className="touch-scale flex-1 py-4 font-bold flex items-center justify-center gap-2"
                        style={{ background: "#F7EDE4", color: "#C97A4D", borderRadius: 14, border: "0.5px solid #E5DDD0" }}>
                        <Pause size={20} />
                        Pauzeer
                      </button>
                    ) : (
                      <button onClick={resumeTimer}
                        className="touch-scale flex-1 py-4 font-bold flex items-center justify-center gap-2"
                        style={{ background: "#E8EDE9", color: "#2B4030", borderRadius: 14, border: "0.5px solid #E5DDD0" }}>
                        <Play size={20} />
                        Hervat
                      </button>
                    )}
                    <button onClick={stopTimer}
                      className="touch-scale flex-1 py-4 font-bold flex items-center justify-center gap-2"
                      style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 14, border: "none" }}>
                      <Square size={20} />
                      Stop &amp; sla op
                    </button>
                  </div>
                </div>
              </div>
            )}

            {grouped[TODAY] && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#8A8A83" }}>Vandaag</p>
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
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard icon={<Clock size={17} style={{ color: "#2B4030" }} />}
                label="Gewerkte tijd" value={fmtDuur(totalSec)}
                sub={filterPeriod === "week" ? "deze week" : filterPeriod === "maand" ? "deze maand" : "totaal"}
                bg="#E8EDE9" />
              <SummaryCard icon={<Euro size={17} style={{ color: "#C97A4D" }} />}
                label="Verdiend" value={fmtEur(totalVerdienst)}
                sub={`gem. ${fmtEur(gemTarief)}/u`}
                bg="#F7EDE4" />
              <SummaryCard icon={<TrendingUp size={17} style={{ color: "#2B4030" }} />}
                label="Klussen" value={String(aantalKlussen)}
                sub={`${filteredEntries.length} sessies`}
                bg="#E8EDE9" />
              <SummaryCard icon={<Calendar size={17} style={{ color: "#5C5C56" }} />}
                label="Gem. dag" value={fmtDuur(totalSec / Math.max(1, sortedDates.length))}
                sub="per werkdag"
                bg="#F0EDE8" />
            </div>

            <div className="flex gap-2">
              {(["week", "maand", "alles"] as const).map((p) => (
                <button key={p} onClick={() => setFilterPeriod(p)}
                  className="px-4 py-2 text-xs font-bold"
                  style={{
                    background: filterPeriod === p ? "#2B4030" : "#FBF7F0",
                    color: filterPeriod === p ? "#F5EFE5" : "#5C5C56",
                    borderRadius: 99,
                    border: "0.5px solid #E5DDD0",
                  }}>
                  {p === "week" ? "Deze week" : p === "maand" ? "Deze maand" : "Alles"}
                </button>
              ))}
            </div>

            {sortedDates.length === 0 ? (
              <div className="p-8 text-center"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <p className="text-3xl mb-2">📋</p>
                <p className="font-bold" style={{ color: "#1A1D1A" }}>Geen uren gevonden</p>
                <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>Start een timer of pas de filter aan</p>
              </div>
            ) : sortedDates.map((datum) => {
              const dayEntries = grouped[datum];
              const daySec = dayEntries.reduce((s, e) => s + e.duurSec, 0);
              const dayEur = dayEntries.reduce((s, e) => s + calcVerdienst(e), 0);
              return (
                <div key={datum}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold" style={{ color: "#1A1D1A" }}>{datumLabel(datum)}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: "#2B4030" }}>{fmtDuur(daySec)}</span>
                      <span className="text-xs font-bold" style={{ color: "#C97A4D" }}>{fmtEur(dayEur)}</span>
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
            <div className="p-5" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#1A1D1A" }}>Uren per dag (afgelopen 7 dagen)</p>
              <div className="flex items-end gap-2 h-28">
                {last7.map((d, i) => {
                  const pct = d.sec / maxSec;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs font-semibold" style={{ color: "#2B4030", fontSize: 10 }}>
                        {d.sec > 0 ? fmtDuur(d.sec) : ""}
                      </p>
                      <div className="w-full rounded-t-lg transition-all"
                        style={{
                          height: Math.max(4, pct * 80),
                          background: isToday ? "#2B4030" : d.sec > 0 ? "#C97A4D" : "#E5DDD0",
                        }} />
                      <p className="text-xs" style={{ color: isToday ? "#2B4030" : "#8A8A83", fontWeight: isToday ? 700 : 400 }}>
                        {d.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <p className="font-bold text-sm mb-4" style={{ color: "#1A1D1A" }}>Meeste uren per klus</p>
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
                        <p className="text-sm font-semibold" style={{ color: "#1A1D1A" }}>{naam}</p>
                        <p className="text-xs" style={{ color: "#8A8A83" }}>{data.klant}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: "#2B4030" }}>{fmtDuur(data.sec)}</p>
                        <p className="text-xs font-semibold" style={{ color: "#C97A4D" }}>{fmtEur(data.eur)}</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "#E5DDD0" }}>
                      <div className="h-2 rounded-full transition-all"
                        style={{ width: `${(data.sec / maxK) * 100}%`, background: i === 0 ? "#2B4030" : "#C97A4D" }} />
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 flex flex-col gap-1"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8A8A83" }}>Productiviteit</p>
                <p className="text-2xl font-black" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {Math.round((entries.reduce((s, e) => s + e.duurSec, 0) / 3600 / Math.max(1, sortedDates.length)) * 10) / 10}u
                </p>
                <p className="text-xs" style={{ color: "#8A8A83" }}>gem. per werkdag</p>
              </div>
              <div className="p-4 flex flex-col gap-1"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8A8A83" }}>Eff. tarief</p>
                <p className="text-2xl font-black" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {fmtEur(gemTarief)}<span className="text-sm font-semibold">/u</span>
                </p>
                <p className="text-xs" style={{ color: "#8A8A83" }}>gewogen gem.</p>
              </div>
            </div>

            <div className="p-4 flex gap-3 items-start"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#2B4030" }}>Tip: verhoog je tarief</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#5C5C56" }}>
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
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>Nieuwe timer</h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#5C5C56" }} />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>Klus</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setIsCustom(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: !isCustom ? "#2B4030" : "#F5EFE5",
                      color: !isCustom ? "#F5EFE5" : "#5C5C56",
                      border: "0.5px solid #E5DDD0",
                    }}>
                    Bestaande klus
                  </button>
                  <button onClick={() => setIsCustom(true)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold"
                    style={{
                      background: isCustom ? "#2B4030" : "#F5EFE5",
                      color: isCustom ? "#F5EFE5" : "#5C5C56",
                      border: "0.5px solid #E5DDD0",
                    }}>
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
                      className="w-full appearance-none pr-10"
                      style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none" }}>
                      {MOCK_KLUSSEN.map((k) => (
                        <option key={k.id} value={k.id}>{k.naam} — {k.klant}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#8A8A83" }} />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input value={customKlus} onChange={(e) => setCustomKlus(e.target.value)}
                      placeholder="Naam van de klus…"
                      style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                    <input value={customKlant} onChange={(e) => setCustomKlant(e.target.value)}
                      placeholder="Naam van de klant…"
                      style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>Uurtarief (€)</label>
                <div className="flex items-center gap-2 mb-2">
                  {[45, 55, 65, 75, 85, 95].map((t) => (
                    <button key={t} onClick={() => setNewTarief(t)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                      style={{
                        background: newTarief === t ? "#2B4030" : "#F5EFE5",
                        color: newTarief === t ? "#F5EFE5" : "#5C5C56",
                        border: "0.5px solid #E5DDD0",
                      }}>
                      €{t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px" }}>
                  <Euro size={15} style={{ color: "#8A8A83" }} />
                  <input type="number" value={newTarief}
                    onChange={(e) => setNewTarief(Number(e.target.value))}
                    className="flex-1 bg-transparent text-sm font-bold"
                    style={{ color: "#1A1D1A", outline: "none", fontSize: 14 }} />
                  <span className="text-xs font-semibold" style={{ color: "#8A8A83" }}>/uur</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>Notitie (optioneel)</label>
                <textarea value={newNotitie} onChange={(e) => setNewNotitie(e.target.value)}
                  placeholder="Wat ga je doen?"
                  rows={2}
                  className="w-full resize-none"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none" }} />
              </div>

              <button onClick={startTimer}
                className="touch-scale w-full py-4 font-bold flex items-center justify-center gap-2"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
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
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-black text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{showDetails.klusNaam}</h2>
                  <p className="text-sm" style={{ color: "#5C5C56" }}>{showDetails.klant}</p>
                </div>
                <button onClick={() => setShowDetails(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#5C5C56" }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <DetailField label="Datum" value={datumLabel(showDetails.datum)} />
                <DetailField label="Tijd" value={`${showDetails.startTijd} – ${showDetails.eindTijd ?? "lopend"}`} />
                <DetailField label="Duur" value={fmtDuur(showDetails.duurSec)} accent="#2B4030" />
                <DetailField label="Verdienst" value={fmtEur(calcVerdienst(showDetails))} accent="#C97A4D" />
              </div>

              {showDetails.notitie && (
                <div className="p-3 mb-4" style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#8A8A83" }}>Notitie</p>
                  <p className="text-sm italic" style={{ color: "#1A1D1A" }}>"{showDetails.notitie}"</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => deleteEntry(showDetails.id)}
                  className="touch-scale flex-1 py-3.5 font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#EF4444", borderRadius: 14, border: "none" }}>
                  <Trash2 size={15} />
                  Verwijder
                </button>
                <button onClick={() => setShowDetails(null)}
                  className="touch-scale flex-1 py-3.5 font-bold flex items-center justify-center gap-2"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 14, border: "none" }}>
                  <Check size={15} />
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
      className="touch-scale w-full p-4 flex items-center gap-3 text-left"
      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "#E8EDE9" }}>
        <Clock size={17} style={{ color: "#2B4030" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "#1A1D1A" }}>{entry.klusNaam}</p>
        <p className="text-xs truncate" style={{ color: "#8A8A83" }}>
          {entry.startTijd}–{entry.eindTijd ?? "…"} · {entry.klant}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: "#2B4030" }}>{fmtDuur(entry.duurSec)}</p>
        <p className="text-xs font-semibold" style={{ color: "#C97A4D" }}>{fmtEur(verdienst)}</p>
      </div>
    </button>
  );
}

function SummaryCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; bg: string;
}) {
  return (
    <div className="p-4 flex flex-col gap-1"
      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-1"
        style={{ background: bg }}>
        {icon}
      </div>
      <p className="text-2xl font-black leading-tight" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>{value}</p>
      <p className="text-xs font-bold" style={{ color: "#1A1D1A" }}>{label}</p>
      <p className="text-xs" style={{ color: "#8A8A83" }}>{sub}</p>
    </div>
  );
}

function DetailField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="p-3" style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#8A8A83" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#1A1D1A" }}>{value}</p>
    </div>
  );
}
