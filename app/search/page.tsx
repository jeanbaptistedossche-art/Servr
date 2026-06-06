"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, SlidersHorizontal, MessageCircle, Phone,
  Calendar, List, MapPin, CheckCircle,
} from "lucide-react";
import { PROVIDERS, CATEGORIES, type Provider } from "@/lib/mockData";
import { supabase, supabaseReady } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Filter chips ──────────────────────────────────────────────
const FILTERS = [
  { id: "beschikbaar", label: "Nu beschikbaar" },
  { id: "cert",        label: "Gecertificeerd" },
];

// ── Categorie chips ────────────────────────────────────────────
const CAT_CHIPS = [
  { id: "",            label: "Alle",        emoji: "🔍" },
  { id: "loodgieter",  label: "Loodgieter",  emoji: "🔧" },
  { id: "elektricien", label: "Elektricien", emoji: "⚡" },
  { id: "schilder",    label: "Schilder",    emoji: "🖌️" },
  { id: "schoonmaak",  label: "Schoonmaak",  emoji: "🧹" },
  { id: "timmerman",   label: "Timmerman",   emoji: "🪚" },
  { id: "tuinman",     label: "Tuinman",     emoji: "🌿" },
  { id: "hvac",        label: "HVAC",        emoji: "❄️" },
  { id: "slotenmaker", label: "Slotenmaker", emoji: "🔑" },
  { id: "dakdekker",   label: "Dakdekker",   emoji: "🏠" },
  { id: "verhuizen",   label: "Verhuizen",   emoji: "📦" },
];

// ── Slimme trefwoorden → categorie ────────────────────────────
const TREFWOORDEN: Record<string, string> = {
  // Loodgieter
  kraan: "loodgieter", lek: "loodgieter", lekkage: "loodgieter",
  toilet: "loodgieter", douche: "loodgieter", bad: "loodgieter",
  sanitair: "loodgieter", boiler: "loodgieter", cv: "loodgieter",
  afvoer: "loodgieter", riool: "loodgieter", pijp: "loodgieter",
  loodgieter: "loodgieter", water: "loodgieter",

  // Elektricien
  stroom: "elektricien", stopcontact: "elektricien", elektra: "elektricien",
  zekering: "elektricien", schakelaar: "elektricien", verlichting: "elektricien",
  lamp: "elektricien", kabel: "elektricien", elektricien: "elektricien",
  groepenkast: "elektricien", kortsluting: "elektricien",

  // Schilder
  verf: "schilder", schilderen: "schilder", primer: "schilder",
  muur: "schilder", plafond: "schilder", lakken: "schilder",
  schilder: "schilder", behangers: "schilder", behang: "schilder",

  // Schoonmaak
  schoonmaken: "schoonmaak", poetsen: "schoonmaak", poetsvrouw: "schoonmaak",
  poetsman: "schoonmaak", stofzuigen: "schoonmaak", dweilen: "schoonmaak",
  schoonmaak: "schoonmaak", reinigen: "schoonmaak", kuisen: "schoonmaak",
  proper: "schoonmaak", poetsbedrijf: "schoonmaak",

  // Timmerman
  hout: "timmerman", timmeren: "timmerman", planken: "timmerman",
  vloer: "timmerman", deur: "timmerman", kozijn: "timmerman",
  timmerman: "timmerman", meubels: "timmerman", kast: "timmerman",
  parket: "timmerman", trap: "timmerman",

  // Tuinman
  gras: "tuinman", gazon: "tuinman", tuin: "tuinman",
  snoeien: "tuinman", maaien: "tuinman", planten: "tuinman",
  tuinman: "tuinman", haag: "tuinman", struik: "tuinman",
  boom: "tuinman", bladeren: "tuinman", onkruid: "tuinman",

  // HVAC
  airco: "hvac", verwarming: "hvac", radiator: "hvac",
  warmtepomp: "hvac", ventilatie: "hvac", hvac: "hvac",
  koeling: "hvac", ketel: "hvac", thermostaat: "hvac",

  // Slotenmaker
  slot: "slotenmaker", sleutel: "slotenmaker", inbraak: "slotenmaker",
  cilinder: "slotenmaker", slotenmaker: "slotenmaker", deurslot: "slotenmaker",

  // Dakdekker
  dak: "dakdekker", dakpan: "dakdekker", goot: "dakdekker",
  regenpijp: "dakdekker", dakdekker: "dakdekker", platdak: "dakdekker",

  // Verhuizen
  verhuizen: "verhuizen", dozen: "verhuizen", inpakken: "verhuizen",
  transport: "verhuizen", verhuis: "verhuizen",
};

function zoekCategorie(q: string): string | null {
  const woorden = q.toLowerCase().trim().split(/\s+/);
  for (const woord of woorden) {
    if (TREFWOORDEN[woord]) return TREFWOORDEN[woord];
    // Gedeeltelijke match
    for (const [tref, cat] of Object.entries(TREFWOORDEN)) {
      if (woord.length >= 3 && tref.startsWith(woord)) return cat;
    }
  }
  return null;
}

// ── Real vakman shape from Supabase ──────────────────────────
type RealVakman = {
  id: string;
  specialty: string;
  beschikbaar: boolean;
  profile?: { name?: string; address?: string; city?: string } | null;
  isReal: true;
};

// ── Unified card item type ────────────────────────────────────
type CardItem = (Provider & { isReal?: false }) | (RealVakman & {
  name: string; category: string; distance: string;
  rating: number; reviewCount: number; priceMin: number; priceMax: number;
  available: boolean; badges: string[]; phone: string;
});

// ── Vakman card ───────────────────────────────────────────────
function VakmanKaart({ p }: { p: CardItem }) {
  const initial = p.name.split(" ")[0].charAt(0).toUpperCase();
  const isCert = p.badges.some(b => b.toLowerCase().includes("top") || b.toLowerCase().includes("cert"));

  return (
    <div style={{
      background: "#FBF7F0", border: "0.5px solid #E5DDD0",
      borderRadius: 14, padding: 16, marginBottom: 10,
    }}>
      {/* Top row: avatar + info + price */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        {/* Avatar with status dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: p.available ? "#2B4030" : "#C97A4D",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 20,
            color: p.available ? "#F5EFE5" : "#1A1D1A",
          }}>
            {initial}
          </div>
          {/* Status dot */}
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: p.available ? "#2B4030" : "#C97A4D",
            border: "2px solid #FBF7F0",
          }} />
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            {/* Status text */}
            <span style={{
              fontSize: 10, fontWeight: 500,
              color: p.available ? "#2B4030" : "#C97A4D",
            }}>
              {p.available ? "● Beschikbaar" : "● Bezet"}
            </span>
            {!p.available && (
              <span style={{ fontSize: 10, color: "#8A8A83" }}>tot 14:30</span>
            )}
            {/* "Echt" badge for real Supabase vakmensen */}
            {p.isReal && (
              <span style={{
                fontSize: 9, fontWeight: 600,
                background: "#2B4030", color: "#F5EFE5",
                padding: "1px 6px", borderRadius: 99,
                letterSpacing: "0.03em",
              }}>
                Echt
              </span>
            )}
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A", lineHeight: 1.2 }}>
            {p.name}
          </p>
          <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>
            {p.category}{p.distance ? ` · ${p.distance}` : ""}
          </p>

          {/* Rating + reviews */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Star size={11} style={{ color: "#C97A4D" }} fill="#C97A4D" />
            <span style={{ fontFamily: SERIF, fontSize: 13, color: "#1A1D1A" }}>{p.rating || "—"}</span>
            {p.reviewCount > 0 && (
              <span style={{ fontSize: 11, color: "#8A8A83" }}>({p.reviewCount})</span>
            )}
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {p.priceMin > 0 ? (
            <p style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030", margin: 0 }}>€{p.priceMin}/u</p>
          ) : (
            <p style={{ fontFamily: SERIF, fontSize: 13, color: "#8A8A83", margin: 0 }}>Op aanvraag</p>
          )}
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {isCert && (
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11, padding: "3px 8px",
            background: "#EDE4D2", borderRadius: 6, color: "#2B4030",
          }}>
            <CheckCircle size={10} /> Gecertificeerd
          </span>
        )}
        {p.priceMin > 0 && (
          <span style={{
            fontSize: 11, padding: "3px 8px",
            background: "#EDE4D2", borderRadius: 6, color: "#5C5C56",
          }}>€{p.priceMin}–€{p.priceMax}/u</span>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        {/* Primary action */}
        <Link href={`/agenda/boeken/${p.id}`} style={{ flex: 2, textDecoration: "none" }}>
          <button className="touch-scale" style={{
            width: "100%", padding: 10, fontSize: 13, fontWeight: 500,
            background: p.available ? "#2B4030" : "transparent",
            color: p.available ? "#F5EFE5" : "#5C5C56",
            border: p.available ? "none" : "0.5px solid #E5DDD0",
            borderRadius: 10, cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>
            {p.available ? "Boek direct" : "Plan later"}
          </button>
        </Link>

        {/* Message */}
        <Link href={`/chat/${p.id}`} style={{ textDecoration: "none" }}>
          <button className="touch-scale" style={{
            padding: "10px 13px", background: "transparent",
            color: "#5C5C56", border: "0.5px solid #E5DDD0",
            borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
          }} aria-label="Bericht">
            <MessageCircle size={15} />
          </button>
        </Link>

        {/* Call */}
        <a href={p.phone ? `tel:${p.phone}` : "#"} style={{ textDecoration: "none" }}>
          <button className="touch-scale" style={{
            padding: "10px 13px", background: "transparent",
            color: "#5C5C56", border: "0.5px solid #E5DDD0",
            borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
          }} aria-label="Bellen">
            <Phone size={15} />
          </button>
        </a>
      </div>
    </div>
  );
}

// ── Inner search component (uses useSearchParams) ─────────────
function ZoekenInner() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState(catParam ?? "");
  const [realVakmensen, setRealVakmensen] = useState<CardItem[]>([]);
  const [loadingReal, setLoadingReal] = useState(true);

  // Load real vakmensen from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await supabaseReady;

        // Laad vakmensen
        const { data: vakData } = await (supabase.from("vakmensen") as any)
          .select("id, specialty, beschikbaar, gemiddelde_rating, uurtarief");

        if (cancelled || !vakData?.length) return;

        // Laad bijhorende profielen apart (geen directe FK tussen vakmensen en profiles)
        const ids = vakData.map((v: any) => v.id);
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, name, address, city, phone")
          .in("id", ids);

        const profMap: Record<string, any> = {};
        (profData ?? []).forEach((p: any) => { profMap[p.id] = p; });

        const mapped: CardItem[] = vakData.map((v: any) => {
          const prof = profMap[v.id] ?? {};
          return {
            id: v.id,
            specialty: v.specialty ?? "",
            beschikbaar: v.beschikbaar,
            isReal: true as const,
            name: prof.name ?? "Vakman",
            category: v.specialty ?? "Vakman",
            distance: prof.city ?? "",
            rating: v.gemiddelde_rating ?? 0,
            reviewCount: 0,
            priceMin: v.uurtarief ?? 0,
            priceMax: v.uurtarief ?? 0,
            available: v.beschikbaar ?? true,
            badges: ["Echt"],
            phone: prof.phone ?? "",
            photos: [],
            reviews: [],
            avatar: "",
          };
        });
        setRealVakmensen(mapped);
      } catch {
        // silently ignore — fall back to mock only
      } finally {
        if (!cancelled) setLoadingReal(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const toggleFilter = (id: string) =>
    setActiveFilters(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  // Alleen echte vakmensen uit Supabase — geen nep data
  const allItems: CardItem[] = [...realVakmensen];

  // Slimme categorie detectie uit zoekterm
  const gevondenCat = query ? zoekCategorie(query) : null;
  const effectieveCat = activeCat || gevondenCat || catParam || "";

  // Apply filters
  let results = [...allItems];

  // Categorie filter (via chip of slimme zoekterm)
  if (effectieveCat) results = results.filter(p =>
    p.category.toLowerCase() === effectieveCat.toLowerCase() ||
    p.category.toLowerCase().includes(effectieveCat.toLowerCase()));

  // Tekstzoeking op naam (als geen categorie gevonden uit de query)
  if (query && !gevondenCat) results = results.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()));

  if (activeFilters.includes("beschikbaar")) results = results.filter(p => p.available);
  if (activeFilters.includes("cert")) results = results.filter(p =>
    p.badges.some(b => b.toLowerCase().includes("top")));

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Sticky header ── */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
            {loadingReal ? "Laden…" : `${results.length} resultaten`}
          </p>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
            {effectieveCat ? CAT_CHIPS.find(c => c.id === effectieveCat)?.label ?? "Zoekresultaten" : "Alle vakmensen"}
          </h2>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 10, padding: "10px 14px", marginBottom: 12,
        }}>
          <Search size={15} style={{ color: "#8A8A83", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek vakman of dienst…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
              color: query ? "#1A1D1A" : "#8A8A83",
            }}
          />
          <button className="touch-scale" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#8A8A83", display: "flex", alignItems: "center",
          }}>
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Categorie chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 6 }}>
          {CAT_CHIPS.map(c => {
            const active = activeCat === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
                fontSize: 11, padding: "5px 11px", whiteSpace: "nowrap",
                background: active ? "#2B4030" : "transparent",
                color: active ? "#F5EFE5" : "#5C5C56",
                border: active ? "none" : "0.5px solid #E5DDD0",
                borderRadius: 99, cursor: "pointer", flexShrink: 0,
                fontFamily: "'Inter', sans-serif", fontWeight: active ? 500 : 400,
              }}>
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>

        {/* Extra filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.id);
            return (
              <button key={f.id} onClick={() => toggleFilter(f.id)} style={{
                fontSize: 11, padding: "5px 11px", whiteSpace: "nowrap",
                background: active ? "#1A1D1A" : "transparent",
                color: active ? "#F5EFE5" : "#5C5C56",
                border: active ? "none" : "0.5px solid #E5DDD0",
                borderRadius: 99, cursor: "pointer", flexShrink: 0,
                fontFamily: "'Inter', sans-serif", fontWeight: active ? 500 : 400,
              }}>
                {f.label}
              </button>
            );
          })}
          {/* Toon gevonden categorie als badge */}
          {query && gevondenCat && !activeCat && (
            <span style={{
              fontSize: 11, padding: "5px 11px", whiteSpace: "nowrap",
              background: "#EAF0EC", color: "#2B4030",
              borderRadius: 99, fontFamily: "'Inter', sans-serif", fontWeight: 500,
            }}>
              → {CAT_CHIPS.find(c => c.id === gevondenCat)?.emoji} {gevondenCat}
            </span>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="px-5 pb-28">
        {results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 20, color: "#1A1D1A", margin: "0 0 8px" }}>
              Geen resultaten
            </p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>
              Probeer een andere zoekterm of filter
            </p>
          </div>
        ) : (
          results.map(p => <VakmanKaart key={p.id} p={p} />)
        )}
      </div>
    </div>
  );
}

// ── Page wrapper (Suspense for useSearchParams) ───────────────
export default function ZoekenPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
        <div className="px-5 pt-14 pb-4"
          style={{ background: "rgba(245,239,229,0.97)" }}>
          <div style={{ height: 26, width: 160, background: "#E5DDD0", borderRadius: 8 }} />
        </div>
      </div>
    }>
      <ZoekenInner />
    </Suspense>
  );
}
