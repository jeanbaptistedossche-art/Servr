"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, PiggyBank, Plus, TrendingUp, Target,
  Check, ChevronRight, Calendar, Euro, Home,
  AlertTriangle, Star, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type DoelPrioriteit = "laag" | "normaal" | "hoog";
type DoelStatus = "actief" | "behaald" | "gepauzeerd";

type Doel = {
  id: string;
  titel: string;
  beschrijving: string;
  doelbedrag: number;
  huidigBedrag: number;
  maandelijksBijdrage: number;
  prioriteit: DoelPrioriteit;
  status: DoelStatus;
  emoji: string;
  categorie: string;
  deadline?: string;
};

type Storting = {
  id: string;
  doelId: string;
  datum: string;
  bedrag: number;
  notitie?: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const INIT_DOELEN: Doel[] = [
  {
    id: "d1", titel: "Badkamer renovatie", beschrijving: "Nieuwe badkamer inclusief inloopdouche",
    doelbedrag: 9500, huidigBedrag: 4250, maandelijksBijdrage: 350, prioriteit: "hoog",
    status: "actief", emoji: "🚿", categorie: "Renovatie", deadline: "2027-03-01",
  },
  {
    id: "d2", titel: "Noodfonds woning", beschrijving: "Reserve voor onverwachte reparaties",
    doelbedrag: 5000, huidigBedrag: 2800, maandelijksBijdrage: 200, prioriteit: "hoog",
    status: "actief", emoji: "🛡️", categorie: "Reserve",
  },
  {
    id: "d3", titel: "Zonnepanelen", beschrijving: "8 zonnepanelen + omvormer",
    doelbedrag: 8000, huidigBedrag: 8000, maandelijksBijdrage: 0, prioriteit: "hoog",
    status: "behaald", emoji: "☀️", categorie: "Duurzaamheid",
  },
  {
    id: "d4", titel: "Keuken vervangen", beschrijving: "Nieuwe keuken met eiland",
    doelbedrag: 15000, huidigBedrag: 1500, maandelijksBijdrage: 250, prioriteit: "normaal",
    status: "actief", emoji: "🍳", categorie: "Renovatie", deadline: "2029-01-01",
  },
  {
    id: "d5", titel: "Tuin herinrichten", beschrijving: "Nieuwe bestrating en terras",
    doelbedrag: 3500, huidigBedrag: 600, maandelijksBijdrage: 100, prioriteit: "laag",
    status: "actief", emoji: "🌿", categorie: "Tuin",
  },
];

const INIT_STORTINGEN: Storting[] = [
  { id: "s1", doelId: "d1", datum: "2026-05-01", bedrag: 350, notitie: "Maandelijkse bijdrage" },
  { id: "s2", doelId: "d2", datum: "2026-05-01", bedrag: 200 },
  { id: "s3", doelId: "d4", datum: "2026-05-01", bedrag: 250 },
  { id: "s4", doelId: "d1", datum: "2026-04-01", bedrag: 350 },
  { id: "s5", doelId: "d2", datum: "2026-04-01", bedrag: 200 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function progress(doel: Doel) {
  return Math.min(100, Math.round((doel.huidigBedrag / doel.doelbedrag) * 100));
}
function maandenTotDoel(doel: Doel) {
  if (doel.status === "behaald") return 0;
  const restant = doel.doelbedrag - doel.huidigBedrag;
  if (doel.maandelijksBijdrage <= 0) return Infinity;
  return Math.ceil(restant / doel.maandelijksBijdrage);
}
function fmtMaanden(m: number) {
  if (m === Infinity) return "∞";
  if (m <= 0) return "Behaald!";
  if (m < 12) return `${m} mnd`;
  return `${Math.round(m / 12 * 10) / 10} jr`;
}

const PRIO_COLORS: Record<DoelPrioriteit, { color: string; bg: string }> = {
  laag:    { color: "#64748b", bg: "#F1F5F9" },
  normaal: { color: "#4F46E5", bg: "#EEF2FF" },
  hoog:    { color: "#EF4444", bg: "#FEF2F2" },
};

export default function SpaarplanPage() {
  const router = useRouter();
  const [doelen, setDoelen] = useState<Doel[]>(INIT_DOELEN);
  const [stortingen] = useState<Storting[]>(INIT_STORTINGEN);
  const [showDetail, setShowDetail] = useState<Doel | null>(null);
  const [tab, setTab] = useState<"doelen" | "overzicht">("doelen");

  const actief = doelen.filter(d => d.status === "actief");
  const behaald = doelen.filter(d => d.status === "behaald");
  const totaalGespaard = doelen.reduce((s, d) => s + d.huidigBedrag, 0);
  const totaalDoel = doelen.filter(d => d.status === "actief").reduce((s, d) => s + d.doelbedrag, 0);
  const maandelijksTotal = actief.reduce((s, d) => s + d.maandelijksBijdrage, 0);
  const totaalProg = Math.round((totaalGespaard / (totaalDoel + behaald.reduce((s,d)=>s+d.doelbedrag,0))) * 100);

  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Spaarplan Woning</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Renovaties & verbeteringen</p>
          </div>
          <button className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: "#4F46E5" }}>
            <Plus size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E2E8F0" }}>
          {(["doelen", "overzicht"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
              style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
              {t === "doelen" ? "Spaardoelen" : "Overzicht"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {tab === "doelen" && (
          <>
            {/* Totaaloverzicht card */}
            <div className="rounded-3xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", boxShadow: "0 4px 20px rgba(79,70,229,0.3)" }}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white text-opacity-80 text-xs font-semibold"
                      style={{ color: "rgba(255,255,255,0.8)" }}>Totaal gespaard</p>
                    <p className="text-white font-black text-3xl mt-0.5">{fmtEur(totaalGespaard)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "rgba(255,255,255,0.2)" }}>
                    🏠
                  </div>
                </div>

                {/* Progress bar totaal */}
                <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${totaalProg}%`, background: "rgba(255,255,255,0.9)" }} />
                </div>
                <div className="flex justify-between">
                  <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {totaalProg}% van alle doelen
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {fmtEur(maandelijksTotal)}/mnd
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x px-2 py-3"
                style={{ background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                {[
                  { label: "Actief", value: actief.length },
                  { label: "Behaald", value: behaald.length },
                  { label: "Per mnd", value: fmtEur(maandelijksTotal) },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center gap-0.5">
                    <p className="font-black text-base text-white">{s.value}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actieve doelen */}
            {actief.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                  Actieve doelen
                </p>
                {actief.map(doel => {
                  const prog = progress(doel);
                  const mnd = maandenTotDoel(doel);
                  const prio = PRIO_COLORS[doel.prioriteit];
                  return (
                    <div key={doel.id} onClick={() => setShowDetail(doel)}
                      className="touch-scale rounded-2xl p-4 cursor-pointer"
                      style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl flex-shrink-0">{doel.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-black truncate" style={{ color: "#0f172a" }}>{doel.titel}</p>
                            <p className="text-xs truncate" style={{ color: "#64748b" }}>{doel.categorie}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black" style={{ color: "#4F46E5" }}>{fmtEur(doel.huidigBedrag)}</p>
                          <p className="text-xs" style={{ color: "#94a3b8" }}>/ {fmtEur(doel.doelbedrag)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "#F1F5F9" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${prog}%`,
                            background: prog >= 75 ? "#10B981" : prog >= 40 ? "#4F46E5" : "#F59E0B",
                          }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold" style={{ color: "#64748b" }}>
                          {prog}% gespaard
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: prio.bg, color: prio.color }}>
                            {doel.prioriteit}
                          </span>
                          <p className="text-xs font-bold" style={{ color: "#64748b" }}>
                            ⏱️ {fmtMaanden(mnd)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Behaalde doelen */}
            {behaald.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide mt-2" style={{ color: "#94a3b8" }}>
                  Behaald 🎉
                </p>
                {behaald.map(doel => (
                  <div key={doel.id} className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                    <span className="text-2xl">{doel.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "#065F46" }}>{doel.titel}</p>
                      <p className="text-xs" style={{ color: "#059669" }}>{fmtEur(doel.doelbedrag)} gespaard ✓</p>
                    </div>
                    <Check size={20} style={{ color: "#10B981", flexShrink: 0 }} />
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {tab === "overzicht" && (
          <>
            {/* Maandelijkse bijdrage overzicht */}
            <div className="rounded-2xl p-4"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <p className="text-sm font-black mb-3" style={{ color: "#4F46E5" }}>Maandelijkse bijdragen</p>
              {actief.filter(d => d.maandelijksBijdrage > 0).map(d => (
                <div key={d.id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(79,70,229,0.1)" }}>
                  <div className="flex items-center gap-2">
                    <span>{d.emoji}</span>
                    <p className="text-sm" style={{ color: "#374151" }}>{d.titel}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{fmtEur(d.maandelijksBijdrage)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Totaal per maand</p>
                <p className="font-black text-lg" style={{ color: "#4F46E5" }}>{fmtEur(maandelijksTotal)}</p>
              </div>
            </div>

            {/* Recente stortingen */}
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
              Recente stortingen
            </p>
            {stortingen.slice(0, 5).map(st => {
              const doel = doelen.find(d => d.id === st.doelId);
              return (
                <div key={st.id} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "#ECFDF5" }}>
                    {doel?.emoji || "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{doel?.titel}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      {new Date(st.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })}
                      {st.notitie ? ` · ${st.notitie}` : ""}
                    </p>
                  </div>
                  <p className="font-bold flex-shrink-0" style={{ color: "#10B981" }}>+{fmtEur(st.bedrag)}</p>
                </div>
              );
            })}

            {/* Prognose */}
            <div className="rounded-2xl p-4"
              style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
              <p className="text-sm font-black mb-3" style={{ color: "#0f172a" }}>📈 Prognose</p>
              {actief.filter(d => d.maandelijksBijdrage > 0).map(d => {
                const mnd = maandenTotDoel(d);
                const datum = mnd === Infinity ? null : new Date(Date.now() + mnd * 30 * 86400000);
                return (
                  <div key={d.id} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0">{d.emoji}</span>
                      <p className="text-xs font-semibold truncate" style={{ color: "#374151" }}>{d.titel}</p>
                    </div>
                    <p className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: "#4F46E5" }}>
                      {datum ? datum.toLocaleDateString("nl-NL", { month: "short", year: "numeric" }) : "∞"}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "88dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{showDetail.emoji}</span>
                <div className="flex-1">
                  <h2 className="text-xl font-black" style={{ color: "#0f172a" }}>{showDetail.titel}</h2>
                  <p className="text-sm" style={{ color: "#64748b" }}>{showDetail.beschrijving}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#EEF2FF" }}>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>
                    {fmtEur(showDetail.huidigBedrag)} gespaard
                  </p>
                  <p className="text-sm font-bold" style={{ color: "#94a3b8" }}>
                    Doel: {fmtEur(showDetail.doelbedrag)}
                  </p>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(79,70,229,0.15)" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${progress(showDetail)}%`, background: "#4F46E5" }} />
                </div>
                <p className="text-xs mt-1 text-right font-semibold" style={{ color: "#4F46E5" }}>
                  {progress(showDetail)}% · nog {fmtEur(showDetail.doelbedrag - showDetail.huidigBedrag)} te gaan
                </p>
              </div>

              {[
                { label: "Maandelijkse bijdrage", value: fmtEur(showDetail.maandelijksBijdrage) },
                { label: "Verwacht klaar", value: fmtMaanden(maandenTotDoel(showDetail)) },
                { label: "Prioriteit", value: showDetail.prioriteit },
                ...(showDetail.deadline ? [{ label: "Deadline", value: new Date(showDetail.deadline).toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) }] : []),
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <p className="text-xs font-bold" style={{ color: "#94a3b8" }}>{r.label}</p>
                  <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{r.value}</p>
                </div>
              ))}

              <button className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
                style={{ background: "#4F46E5" }}>
                <Plus size={18} /> Storting toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
