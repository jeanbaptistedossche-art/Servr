"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, Award, TrendingUp, MessageSquare,
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
  brons:   { label: "Brons",   kleur: "#C97A4D", bg: "#FAF0E6" },
  zilver:  { label: "Zilver",  kleur: "#8A8A83", bg: "#F0EFE8" },
  goud:    { label: "Goud",    kleur: "#C97A4D", bg: "#FAF0E6" },
  platina: { label: "Platina", kleur: "#2B4030", bg: "#EAF0EC" },
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
    id: "b1", naam: "Topper", icon: "⭐", tier: "goud", kleur: "#C97A4D", zeldzaam: false,
    beschrijving: "5-sterren gemiddelde over 10+ reviews",
    criteria: "Behaal een gemiddelde score van 5.0 over minstens 10 reviews",
    verdiend: true, verdienddatum: "2026-04-01",
  },
  {
    id: "b2", naam: "Punctueel", icon: "⏱️", tier: "zilver", kleur: "#8A8A83", zeldzaam: false,
    beschrijving: "Altijd op tijd",
    criteria: "90%+ van de klanten beoordeelt je als punctueel",
    verdiend: true, verdienddatum: "2026-02-15",
  },
  {
    id: "b3", naam: "Super schoon", icon: "✨", tier: "brons", kleur: "#C97A4D", zeldzaam: false,
    beschrijving: "Werkt altijd netjes",
    criteria: "95%+ van de klanten beoordeelt je werkplek als schoon en netjes",
    verdiend: true, verdienddatum: "2026-01-10",
  },
  {
    id: "b4", naam: "Snelle reageerder", icon: "⚡", tier: "zilver", kleur: "#8A8A83", zeldzaam: false,
    beschrijving: "Reageert binnen 30 min",
    criteria: "Gemiddelde reactietijd onder 30 minuten",
    verdiend: true, verdienddatum: "2025-11-20",
  },
  {
    id: "b5", naam: "Honderd klussen", icon: "🏆", tier: "platina", kleur: "#2B4030", zeldzaam: true,
    beschrijving: "100 klussen voltooid",
    criteria: "Voltooi 100 klussen via Servr",
    verdiend: false,
  },
  {
    id: "b6", naam: "Perfect score", icon: "💯", tier: "platina", kleur: "#2B4030", zeldzaam: true,
    beschrijving: "25× 5 sterren op rij",
    criteria: "Ontvang 25 opeenvolgende 5-sterren reviews",
    verdiend: false,
  },
  {
    id: "b7", naam: "Eerste klus", icon: "🚀", tier: "brons", kleur: "#C97A4D", zeldzaam: false,
    beschrijving: "Eerste klus via Servr",
    criteria: "Voltooi je eerste klus via het platform",
    verdiend: true, verdienddatum: "2025-06-01",
  },
  {
    id: "b8", naam: "Terugkomend talent", icon: "🔁", tier: "zilver", kleur: "#8A8A83", zeldzaam: false,
    beschrijving: "5 terugkerende klanten",
    criteria: "5 klanten die je meer dan eens boeken",
    verdiend: true, verdienddatum: "2026-03-01",
  },
  {
    id: "b9", naam: "Top verdiener", icon: "💰", tier: "goud", kleur: "#C97A4D", zeldzaam: false,
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
        <Star key={i} size={size} fill={i < Math.round(n) ? "#C97A4D" : "none"}
          style={{ color: i < Math.round(n) ? "#C97A4D" : "#E5DDD0" }} />
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
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Reviews & Badges
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83" }}>Reputatie & prestaties</p>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <Share2 size={17} style={{ color: "#2B4030" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#EDE8DF" }}>
          {(["reviews", "badges"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize"
              style={{
                background: tab === t ? "#FBF7F0" : "transparent",
                color: tab === t ? "#2B4030" : "#8A8A83",
              }}>
              {t === "reviews" ? `Reviews (${MOCK_REVIEWS.length})` : `Badges (${verdiendeBadges.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28 mt-4 flex flex-col gap-4">
        {/* ── REVIEWS TAB ─────────────────────────────────────────────────────── */}
        {tab === "reviews" && (
          <>
            {/* Score overzicht */}
            <div className="flex gap-5 p-4"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                <p className="font-bold leading-none"
                  style={{ fontSize: 48, color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {gem.toFixed(1)}
                </p>
                <Stars n={gem} size={15} />
                <p className="text-xs mt-1" style={{ color: "#8A8A83" }}>{MOCK_REVIEWS.length} reviews</p>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                {dist.map((count, i) => {
                  const stars = 5 - i;
                  const pct = Math.round((count / MOCK_REVIEWS.length) * 100);
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-4 text-right" style={{ color: "#5C5C56" }}>{stars}</span>
                      <Star size={10} fill="#C97A4D" style={{ color: "#C97A4D", flexShrink: 0 }} />
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E5DDD0" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "#C97A4D" }} />
                      </div>
                      <span className="text-xs w-6" style={{ color: "#8A8A83" }}>{count}</span>
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
                <div key={kw.label} className="flex items-center gap-2 px-3 py-2"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 99 }}>
                  <span className="text-sm">{kw.icon}</span>
                  <span className="text-xs font-medium" style={{ color: "#5C5C56" }}>{kw.label}</span>
                  <span className="text-xs font-semibold px-1.5 py-0.5"
                    style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99 }}>{kw.count}×</span>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
                {(["alle", 5, 4, 3, 2, 1] as const).map((r) => (
                  <button key={String(r)} onClick={() => setFilterRating(r)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: filterRating === r ? "#2B4030" : "transparent",
                      color: filterRating === r ? "#F5EFE5" : "#5C5C56",
                      borderRadius: 99,
                      border: filterRating === r ? "none" : "0.5px solid #E5DDD0",
                    }}>
                    {r === "alle" ? "Alle" : `${"★".repeat(r)}`}
                  </button>
                ))}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-shrink-0 px-2 py-1.5 text-xs font-semibold appearance-none"
                style={{ background: "#FBF7F0", color: "#5C5C56", border: "0.5px solid #E5DDD0", borderRadius: 8 }}>
                <option value="recent">Recent</option>
                <option value="rating">Beoordeling</option>
                <option value="helpful">Nuttig</option>
              </select>
            </div>

            {/* Review list */}
            <div className="flex flex-col gap-3">
              {filtered.map((r) => (
                <div key={r.id} onClick={() => setShowDetail(r)}
                  className="w-full text-left cursor-pointer"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={r.klantAvatar} alt={r.klant}
                      className="w-10 h-10 object-cover flex-shrink-0"
                      style={{ borderRadius: 10, border: "0.5px solid #E5DDD0" }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: "#1A1D1A" }}>{r.klant}</p>
                        {r.geverifieerd && (
                          <CheckCircle size={12} style={{ color: "#2B4030" }} />
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#8A8A83" }}>{r.klus} · {r.datum}</p>
                    </div>
                    <Stars n={r.rating} size={13} />
                  </div>

                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#5C5C56" }}>
                    {r.tekst.length > 120 ? r.tekst.slice(0, 120) + "…" : r.tekst}
                  </p>

                  {r.reactie && (
                    <div className="p-2.5 mb-2"
                      style={{ background: "#EAF0EC", borderRadius: 8 }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "#2B4030" }}>Jouw reactie:</p>
                      <p className="text-xs" style={{ color: "#5C5C56" }}>
                        {r.reactie.length > 60 ? r.reactie.slice(0, 60) + "…" : r.reactie}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleHelpful(r.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: helpful[r.id] ? "#EAF0EC" : "transparent",
                        color: helpful[r.id] ? "#2B4030" : "#8A8A83",
                        borderRadius: 99,
                        border: "0.5px solid #E5DDD0",
                      }}>
                      <ThumbsUp size={11} />
                      {r.helpful + (helpful[r.id] ? 1 : 0)} nuttig
                    </button>
                    <span className="text-xs px-2 py-1"
                      style={{ background: "#F0EFE8", color: "#5C5C56", borderRadius: 99 }}>
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
            <div className="grid grid-cols-3 gap-2"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              <div className="flex flex-col items-center gap-0.5">
                <p className="font-bold text-2xl leading-tight"
                  style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{verdiendeBadges.length}</p>
                <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Verdiend</p>
              </div>
              <div className="flex flex-col items-center gap-0.5" style={{ borderLeft: "0.5px solid #E5DDD0", borderRight: "0.5px solid #E5DDD0" }}>
                <p className="font-bold text-2xl leading-tight"
                  style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{MOCK_BADGES.length}</p>
                <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Totaal</p>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <p className="font-bold text-2xl leading-tight"
                  style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {MOCK_BADGES.filter((b) => b.zeldzaam && b.verdiend).length}
                </p>
                <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Zeldzaam</p>
              </div>
            </div>

            {/* Verdiende badges */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8A8A83" }}>
                Verdiend ({verdiendeBadges.length})
              </p>
              <div className="grid grid-cols-3 gap-3">
                {verdiendeBadges.map((b) => {
                  const tierCfg = TIER_CFG[b.tier];
                  return (
                    <button key={b.id} onClick={() => setShowBadge(b)}
                      className="flex flex-col items-center gap-2"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12 }}>
                      <div className="w-14 h-14 flex items-center justify-center text-3xl relative"
                        style={{ background: tierCfg.bg, border: `0.5px solid #E5DDD0`, borderRadius: 12 }}>
                        {b.icon}
                        {b.zeldzaam && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: "#C97A4D" }}>
                            <span style={{ fontSize: 8, color: "#fff" }}>⚡</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-center" style={{ color: "#1A1D1A" }}>{b.naam}</p>
                      <span className="text-xs font-medium px-2 py-0.5"
                        style={{ background: tierCfg.bg, color: tierCfg.kleur, borderRadius: 99 }}>
                        {tierCfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Te verdienen badges */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8A8A83" }}>
                Nog te verdienen ({openBadges.length})
              </p>
              <div className="flex flex-col gap-2">
                {openBadges.map((b) => {
                  const tierCfg = TIER_CFG[b.tier];
                  return (
                    <button key={b.id} onClick={() => setShowBadge(b)}
                      className="w-full flex items-center gap-3 text-left"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14 }}>
                      <div className="w-11 h-11 flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "#F0EFE8", borderRadius: 10, opacity: 0.6 }}>
                        🔒
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: "#8A8A83" }}>{b.naam}</p>
                          {b.zeldzaam && (
                            <span className="text-xs font-medium px-1.5 py-0.5"
                              style={{ background: "#FAF0E6", color: "#C97A4D", borderRadius: 99 }}>Zeldzaam</span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "#E5DDD0" }}>{b.criteria}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 flex-shrink-0"
                        style={{ background: tierCfg.bg, color: tierCfg.kleur, borderRadius: 99 }}>
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
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden max-h-[88dvh] overflow-y-auto"
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center gap-3 mb-4">
                <img src={showDetail.klantAvatar} alt={showDetail.klant}
                  className="w-12 h-12 object-cover"
                  style={{ borderRadius: 10, border: "0.5px solid #E5DDD0" }} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: "#1A1D1A" }}>{showDetail.klant}</p>
                    {showDetail.geverifieerd && (
                      <span className="text-xs font-medium px-2 py-0.5"
                        style={{ background: "#EAF0EC", color: "#2B4030", borderRadius: 99 }}>
                        ✓ Geverifieerd
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "#8A8A83" }}>{showDetail.klus}</p>
                </div>
                <Stars n={showDetail.rating} size={15} />
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "#5C5C56" }}>
                {showDetail.tekst}
              </p>

              {showDetail.reactie && (
                <div className="p-4 mb-4" style={{ background: "#EAF0EC", borderRadius: 12 }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#2B4030" }}>Jouw reactie:</p>
                  <p className="text-sm" style={{ color: "#5C5C56" }}>{showDetail.reactie}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "#8A8A83" }}>{showDetail.datum}</p>
                <button onClick={() => toggleHelpful(showDetail.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold"
                  style={{
                    background: helpful[showDetail.id] ? "#EAF0EC" : "transparent",
                    color: helpful[showDetail.id] ? "#2B4030" : "#8A8A83",
                    borderRadius: 99,
                    border: "0.5px solid #E5DDD0",
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
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowBadge(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden"
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex flex-col items-center gap-3 mb-5 py-4"
                style={{ background: "#F5EFE5", borderRadius: 16 }}>
                <div className="w-20 h-20 flex items-center justify-center text-4xl"
                  style={{ background: showBadge.verdiend ? TIER_CFG[showBadge.tier].bg : "#F0EFE8", borderRadius: 18, border: "0.5px solid #E5DDD0" }}>
                  {showBadge.verdiend ? showBadge.icon : "🔒"}
                </div>
                <h2 className="font-bold text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {showBadge.naam}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-3 py-1"
                    style={{ background: TIER_CFG[showBadge.tier].bg, color: TIER_CFG[showBadge.tier].kleur, borderRadius: 99 }}>
                    {TIER_CFG[showBadge.tier].label}
                  </span>
                  {showBadge.zeldzaam && (
                    <span className="text-xs font-medium px-3 py-1"
                      style={{ background: "#FAF0E6", color: "#C97A4D", borderRadius: 99 }}>
                      ⚡ Zeldzaam
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-semibold mb-2" style={{ color: "#1A1D1A" }}>{showBadge.beschrijving}</p>
              <div className="p-4 mb-4" style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#8A8A83" }}>HOE TE VERDIENEN</p>
                <p className="text-sm" style={{ color: "#5C5C56" }}>{showBadge.criteria}</p>
              </div>

              {showBadge.verdienddatum && (
                <p className="text-xs text-center mb-3" style={{ color: "#8A8A83" }}>
                  ✓ Behaald op {showBadge.verdienddatum}
                </p>
              )}

              <button onClick={() => setShowBadge(null)}
                className="w-full py-4 font-semibold"
                style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
                {showBadge.verdiend ? "Top! 🎉" : "Begrepen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
