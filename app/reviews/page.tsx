"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Star, Award, TrendingUp, MessageSquare,
  ThumbsUp, Filter, ChevronDown, Share2, X,
  Trophy, Zap, Shield, Heart, Clock, CheckCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Review = {
  id: string;
  klant: string;
  klantAvatar: string;
  klus: string;
  datum: string;
  rating: number;
  tekst: string;
  categorie: string;
  geverifieerd: boolean;
  helpful: number;
  reactie?: string;
};

type Badge = {
  id: string;
  naam: string;
  icon: string;
  beschrijving: string;
  criteria: string;
  verdiend: boolean;
  verdienddatum?: string;
  kleur: string;
  zeldzaam: boolean;
  tier: "brons" | "zilver" | "goud" | "platina";
};

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_CFG = {
  brons:   { label: "Brons",   kleur: "#CD7F32", bg: "#FEF3C7" },
  zilver:  { label: "Zilver",  kleur: "#9CA3AF", bg: "#F1F5F9" },
  goud:    { label: "Goud",    kleur: "#F59E0B", bg: "#FFFBEB" },
  platina: { label: "Platina", kleur: "#8B5CF6", bg: "#F5F3FF" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_REVIEWS: Review[] = [
  {
    id: "r1", klant: "Lisa de Vries", klantAvatar: "https://i.pravatar.cc/150?img=32",
    klus: "Lekkende kraan keuken", datum: "2026-05-20", rating: 5,
    tekst: "Ontzettend vakkundig werk! Marco was op tijd, netjes en heeft het probleem direct opgelost. Ga zeker weer bellen als er iets is.",
    categorie: "Loodgieter", geverifieerd: true, helpful: 12,
    reactie: "Dank je wel Lisa! Fijn dat je tevreden bent. Tot de volgende keer! 🔧",
  },
  {
    id: "r2", klant: "Petra Jansen", klantAvatar: "https://i.pravatar.cc/150?img=47",
    klus: "Woonkamer schilderen", datum: "2026-04-22", rating: 5,
    tekst: "Perfecte afwerking, super nette oplevering. De woonkamer ziet er prachtig uit. Aanrader!",
    categorie: "Schilder", geverifieerd: true, helpful: 8,
  },
  {
    id: "r3", klant: "Kim Nguyen", klantAvatar: "https://i.pravatar.cc/150?img=44",
    klus: "Vloer schuren en lakken", datum: "2026-05-10", rating: 5,
    tekst: "Top vakmanschap! De vloer is als nieuw. Duidelijke communicatie, netjes gewerkt en goed opgeruimd.",
    categorie: "Timmerwerk", geverifieerd: true, helpful: 15,
  },
  {
    id: "r4", klant: "Ahmed Mansour", klantAvatar: "https://i.pravatar.cc/150?img=33",
    klus: "CV ketel inspectie", datum: "2026-05-15", rating: 4,
    tekst: "Goede inspectie en duidelijk rapport. Iets later dan afgesproken maar verder prima werk.",
    categorie: "HVAC", geverifieerd: true, helpful: 5,
  },
  {
    id: "r5", klant: "Robin Smit", klantAvatar: "https://i.pravatar.cc/150?img=15",
    klus: "Badkamer tegels", datum: "2026-03-08", rating: 5,
    tekst: "Geweldig resultaat! De badkamer is compleet getransformeerd. Echt een professional.",
    categorie: "Tegels", geverifieerd: true, helpful: 19,
  },
  {
    id: "r6", klant: "Sara Bakker", klantAvatar: "https://i.pravatar.cc/150?img=56",
    klus: "Elektra keuken", datum: "2025-12-01", rating: 3,
    tekst: "Werk is goed gedaan maar het duurde langer dan gepland. Communicatie kon beter.",
    categorie: "Elektra", geverifieerd: true, helpful: 2,
  },
];

const MOCK_BADGES: Badge[] = [
  {
    id: "b1", naam: "Topper", icon: "⭐", tier: "goud", kleur: "#F59E0B", zeldzaam: false,
    beschrijving: "5-sterren gemiddelde over 10+ reviews",
    criteria: "Behaal een gemiddelde score van 5.0 over minstens 10 reviews",
    verdiend: true, verdienddatum: "2026-04-01",
  },
  {
    id: "b2", naam: "Punctueel", icon: "⏱️", tier: "zilver", kleur: "#9CA3AF", zeldzaam: false,
    beschrijving: "Altijd op tijd",
    criteria: "90%+ van de klanten beoordeelt je als punctueel",
    verdiend: true, verdienddatum: "2026-02-15",
  },
  {
    id: "b3", naam: "Super schoon", icon: "✨", tier: "brons", kleur: "#CD7F32", zeldzaam: false,
    beschrijving: "Werkt altijd netjes",
    criteria: "95%+ van de klanten beoordeelt je werkplek als schoon en netjes",
    verdiend: true, verdienddatum: "2026-01-10",
  },
  {
    id: "b4", naam: "Snelle reageerder", icon: "⚡", tier: "zilver", kleur: "#9CA3AF", zeldzaam: false,
    beschrijving: "Reageert binnen 30 min",
    criteria: "Gemiddelde reactietijd onder 30 minuten",
    verdiend: true, verdienddatum: "2025-11-20",
  },
  {
    id: "b5", naam: "Honderd klussen", icon: "🏆", tier: "platina", kleur: "#8B5CF6", zeldzaam: true,
    beschrijving: "100 klussen voltooid",
    criteria: "Voltooi 100 klussen via Servr",
    verdiend: false,
  },
  {
    id: "b6", naam: "Perfect score", icon: "💯", tier: "platina", kleur: "#8B5CF6", zeldzaam: true,
    beschrijving: "25× 5 sterren op rij",
    criteria: "Ontvang 25 opeenvolgende 5-sterren reviews",
    verdiend: false,
  },
  {
    id: "b7", naam: "Eerste klus", icon: "🚀", tier: "brons", kleur: "#CD7F32", zeldzaam: false,
    beschrijving: "Eerste klus via Servr",
    criteria: "Voltooi je eerste klus via het platform",
    verdiend: true, verdienddatum: "2025-06-01",
  },
  {
    id: "b8", naam: "Terugkomend talent", icon: "🔁", tier: "zilver", kleur: "#9CA3AF", zeldzaam: false,
    beschrijving: "5 terugkerende klanten",
    criteria: "5 klanten die je meer dan eens boeken",
    verdiend: true, verdienddatum: "2026-03-01",
  },
  {
    id: "b9", naam: "Top verdiener", icon: "💰", tier: "goud", kleur: "#F59E0B", zeldzaam: false,
    beschrijving: "€10.000+ omzet",
    criteria: "Genereer €10.000 of meer omzet via Servr",
    verdiend: true, verdienddatum: "2026-01-30",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gemiddelde(reviews: Review[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function ratingDist(reviews: Review[]) {
  const dist = [0, 0, 0, 0, 0];
  for (const r of reviews) dist[r.rating - 1]++;
  return dist.reverse();
}

function Stars({ n, max = 5, size = 14 }: { n: number; max?: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={size} fill={i < Math.round(n) ? "#F59E0B" : "none"}
          style={{ color: i < Math.round(n) ? "#F59E0B" : "#D1D5DB" }} />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const router = useRouter();

  const [tab, setTab] = useState<"reviews" | "badges">("reviews");
  const [filterRating, setFilterRating] = useState<number | "alle">("alle");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "helpful">("recent");
  const [showDetail, setShowDetail] = useState<Review | null>(null);
  const [showBadge, setShowBadge] = useState<Badge | null>(null);
  const [helpful, setHelpful] = useState<Record<string, boolean>>({});

  // ── Derived ─────────────────────────────────────────────────────────────────
  const gem = useMemo(() => gemiddelde(MOCK_REVIEWS), []);
  const dist = useMemo(() => ratingDist(MOCK_REVIEWS), []);

  const filtered = useMemo(() => {
    let list = [...MOCK_REVIEWS];
    if (filterRating !== "alle") list = list.filter((r) => r.rating === filterRating);
    if (sortBy === "recent")  list.sort((a, b) => b.datum.localeCompare(a.datum));
    if (sortBy === "rating")  list.sort((a, b) => b.rating - a.rating);
    if (sortBy === "helpful") list.sort((a, b) => b.helpful - a.helpful);
    return list;
  }, [filterRating, sortBy]);

  const verdiendeBadges = MOCK_BADGES.filter((b) => b.verdiend);
  const openBadges = MOCK_BADGES.filter((b) => !b.verdiend);

  const toggleHelpful = (id: string) => {
    setHelpful((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Reviews & Badges</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Reputatie & prestaties</p>
          </div>
          <button className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Share2 size={18} style={{ color: "#4F46E5" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E2E8F0" }}>
          {(["reviews", "badges"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold capitalize"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#4F46E5" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
              }}>
              {t === "reviews" ? `Reviews (${MOCK_REVIEWS.length})` : `Badges (${verdiendeBadges.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">
        {/* ── REVIEWS TAB ─────────────────────────────────────────────────────── */}
        {tab === "reviews" && (
          <>
            {/* Score overzicht */}
            <div className="rounded-3xl p-5 flex gap-5"
              style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {/* Grote score */}
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                <p className="font-black leading-none" style={{ fontSize: 52, color: "#0f172a" }}>
                  {gem.toFixed(1)}
                </p>
                <Stars n={gem} size={16} />
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{MOCK_REVIEWS.length} reviews</p>
              </div>

              {/* Verdeling */}
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                {dist.map((count, i) => {
                  const stars = 5 - i;
                  const pct = Math.round((count / MOCK_REVIEWS.length) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs font-semibold w-4 text-right" style={{ color: "#64748b" }}>{stars}</span>
                      <Star size={10} fill="#F59E0B" style={{ color: "#F59E0B", flexShrink: 0 }} />
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#F1F5F9" }}>
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: "#F59E0B" }} />
                      </div>
                      <span className="text-xs w-6" style={{ color: "#94a3b8" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sterkte punten chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Netjes gewerkt", count: 5, icon: "✨" },
                { label: "Punctueel",      count: 4, icon: "⏱️" },
                { label: "Goede prijs",    count: 4, icon: "💰" },
                { label: "Kwaliteit",      count: 6, icon: "🏆" },
              ].map((kw) => (
                <div key={kw.label} className="flex items-center gap-2 px-3 py-2 rounded-full"
                  style={{ background: "#EEF2FF" }}>
                  <span className="text-sm">{kw.icon}</span>
                  <span className="text-xs font-bold" style={{ color: "#4F46E5" }}>{kw.label}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#4F46E5", color: "#fff" }}>{kw.count}×</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
                {(["alle", 5, 4, 3, 2, 1] as const).map((r) => (
                  <button key={String(r)} onClick={() => setFilterRating(r)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: filterRating === r ? "#F59E0B" : "#fff",
                      color: filterRating === r ? "#fff" : "#64748b",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                    {r === "alle" ? "Alle" : `${"★".repeat(r)}`}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-shrink-0 rounded-xl px-2 py-1.5 text-xs font-bold appearance-none"
                style={{ background: "#fff", color: "#64748b", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "none" }}>
                <option value="recent">Recent</option>
                <option value="rating">Beoordeling</option>
                <option value="helpful">Nuttig</option>
              </select>
            </div>

            {/* Review list */}
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <div key={r.id} onClick={() => setShowDetail(r)}
                  className="touch-scale w-full rounded-3xl p-4 text-left cursor-pointer"
                  style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={r.klantAvatar} alt={r.klant}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      style={{ border: "2px solid #E2E8F0" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{r.klant}</p>
                        {r.geverifieerd && (
                          <CheckCircle size={12} style={{ color: "#10B981" }} />
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{r.klus} · {r.datum}</p>
                    </div>
                    <Stars n={r.rating} size={13} />
                  </div>

                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#374151" }}>
                    {r.tekst.length > 120 ? r.tekst.slice(0, 120) + "…" : r.tekst}
                  </p>

                  {/* Reactie preview */}
                  {r.reactie && (
                    <div className="rounded-xl p-2.5 mb-2" style={{ background: "#EEF2FF" }}>
                      <p className="text-xs font-bold mb-0.5" style={{ color: "#4F46E5" }}>Jouw reactie:</p>
                      <p className="text-xs" style={{ color: "#374151" }}>
                        {r.reactie.length > 60 ? r.reactie.slice(0, 60) + "…" : r.reactie}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHelpful(r.id); }}
                      className="touch-scale flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        background: helpful[r.id] ? "#EEF2FF" : "#F3F4F6",
                        color: helpful[r.id] ? "#4F46E5" : "#64748b",
                      }}>
                      <ThumbsUp size={12} />
                      {r.helpful + (helpful[r.id] ? 1 : 0)} nuttig
                    </button>
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "#F1F5F9", color: "#64748b" }}>
                      {r.categorie}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── BADGES TAB ──────────────────────────────────────────────────────── */}
        {tab === "badges" && (
          <>
            {/* Samenvatting */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Trophy size={16} style={{ color: "#F59E0B" }} />
                <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{verdiendeBadges.length}</p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Verdiend</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Award size={16} style={{ color: "#8B5CF6" }} />
                <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{MOCK_BADGES.length}</p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Totaal</p>
              </div>
              <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
                style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <Zap size={16} style={{ color: "#EF4444" }} />
                <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>
                  {MOCK_BADGES.filter((b) => b.zeldzaam && b.verdiend).length}
                </p>
                <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Zeldzaam</p>
              </div>
            </div>

            {/* Verdiende badges */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>
                Verdiend ({verdiendeBadges.length})
              </p>
              <div className="grid grid-cols-3 gap-3">
                {verdiendeBadges.map((b) => {
                  const tierCfg = TIER_CFG[b.tier];
                  return (
                    <button key={b.id} onClick={() => setShowBadge(b)}
                      className="touch-scale rounded-2xl p-3 flex flex-col items-center gap-2"
                      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl relative"
                        style={{ background: tierCfg.bg, border: `2px solid ${tierCfg.kleur}30` }}>
                        {b.icon}
                        {b.zeldzaam && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "#EF4444" }}>
                            <span style={{ fontSize: 8, color: "#fff" }}>⚡</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold text-center" style={{ color: "#0f172a" }}>{b.naam}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: tierCfg.bg, color: tierCfg.kleur }}>
                        {tierCfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Te verdienen badges */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>
                Nog te verdienen ({openBadges.length})
              </p>
              <div className="flex flex-col gap-2">
                {openBadges.map((b) => {
                  const tierCfg = TIER_CFG[b.tier];
                  return (
                    <button key={b.id} onClick={() => setShowBadge(b)}
                      className="touch-scale w-full rounded-2xl p-4 flex items-center gap-3 text-left"
                      style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "#F3F4F6", opacity: 0.5 }}>
                        🔒
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold" style={{ color: "#94a3b8" }}>{b.naam}</p>
                          {b.zeldzaam && (
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: "#FEF2F2", color: "#EF4444" }}>Zeldzaam</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#CBD5E1" }}>{b.criteria}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: tierCfg.bg, color: tierCfg.kleur }}>
                        {tierCfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Review detail sheet ─────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <div className="flex items-center gap-3 mb-4">
                <img src={showDetail.klantAvatar} alt={showDetail.klant}
                  className="w-12 h-12 rounded-2xl object-cover"
                  style={{ border: "2px solid #E2E8F0" }} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold" style={{ color: "#0f172a" }}>{showDetail.klant}</p>
                    {showDetail.geverifieerd && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#ECFDF5", color: "#10B981" }}>
                        ✓ Geverifieerd
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>{showDetail.klus}</p>
                </div>
                <Stars n={showDetail.rating} size={16} />
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>
                {showDetail.tekst}
              </p>

              {showDetail.reactie && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#EEF2FF" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#4F46E5" }}>Jouw reactie:</p>
                  <p className="text-sm" style={{ color: "#374151" }}>{showDetail.reactie}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#94a3b8" }}>{showDetail.datum}</p>
                <button onClick={() => toggleHelpful(showDetail.id)}
                  className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: helpful[showDetail.id] ? "#EEF2FF" : "#F3F4F6",
                    color: helpful[showDetail.id] ? "#4F46E5" : "#64748b",
                  }}>
                  <ThumbsUp size={12} />
                  {showDetail.helpful + (helpful[showDetail.id] ? 1 : 0)} nuttig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Badge detail sheet ───────────────────────────────────────────────── */}
      {showBadge && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowBadge(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              {/* Badge header */}
              <div className="flex flex-col items-center gap-3 mb-5 py-4"
                style={{ background: `${showBadge.kleur}10`, borderRadius: 20 }}>
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                  style={{ background: showBadge.verdiend ? `${showBadge.kleur}20` : "#F3F4F6" }}>
                  {showBadge.verdiend ? showBadge.icon : "🔒"}
                </div>
                <h2 className="font-black text-xl" style={{ color: "#0f172a" }}>{showBadge.naam}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: TIER_CFG[showBadge.tier].bg, color: TIER_CFG[showBadge.tier].kleur }}>
                    {TIER_CFG[showBadge.tier].label}
                  </span>
                  {showBadge.zeldzaam && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: "#FEF2F2", color: "#EF4444" }}>
                      ⚡ Zeldzaam
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-bold mb-2" style={{ color: "#0f172a" }}>{showBadge.beschrijving}</p>
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#F8FAFC" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#94a3b8" }}>HOE TE VERDIENEN</p>
                <p className="text-sm" style={{ color: "#374151" }}>{showBadge.criteria}</p>
              </div>

              {showBadge.verdienddatum && (
                <p className="text-xs text-center mb-3" style={{ color: "#94a3b8" }}>
                  ✓ Behaald op {showBadge.verdienddatum}
                </p>
              )}

              <button onClick={() => setShowBadge(null)}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white"
                style={{ background: showBadge.verdiend ? showBadge.kleur : "#94a3b8" }}>
                {showBadge.verdiend ? "Top! 🎉" : "Begrepen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
