"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, SlidersHorizontal, MessageCircle, Phone,
  MapPin, CheckCircle, X, Navigation,
} from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
type RadiusKm = (typeof RADIUS_OPTIONS)[number];

const FILTERS = [
  { id: "beschikbaar", label: "Nu beschikbaar" },
  { id: "cert",        label: "Gecertificeerd" },
];

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

const TREFWOORDEN: Record<string, string> = {
  kraan: "loodgieter", lek: "loodgieter", lekkage: "loodgieter",
  toilet: "loodgieter", douche: "loodgieter", bad: "loodgieter",
  sanitair: "loodgieter", boiler: "loodgieter", cv: "loodgieter",
  afvoer: "loodgieter", riool: "loodgieter", pijp: "loodgieter",
  loodgieter: "loodgieter", water: "loodgieter",
  stroom: "elektricien", stopcontact: "elektricien", elektra: "elektricien",
  zekering: "elektricien", schakelaar: "elektricien", verlichting: "elektricien",
  lamp: "elektricien", kabel: "elektricien", elektricien: "elektricien",
  groepenkast: "elektricien", kortsluting: "elektricien",
  verf: "schilder", schilderen: "schilder", primer: "schilder",
  muur: "schilder", plafond: "schilder", lakken: "schilder",
  schilder: "schilder", behangers: "schilder", behang: "schilder",
  schoonmaken: "schoonmaak", poetsen: "schoonmaak", poetsvrouw: "schoonmaak",
  poetsman: "schoonmaak", stofzuigen: "schoonmaak", dweilen: "schoonmaak",
  schoonmaak: "schoonmaak", reinigen: "schoonmaak", kuisen: "schoonmaak",
  proper: "schoonmaak", poetsbedrijf: "schoonmaak",
  hout: "timmerman", timmeren: "timmerman", planken: "timmerman",
  vloer: "timmerman", deur: "timmerman", kozijn: "timmerman",
  timmerman: "timmerman", meubels: "timmerman", kast: "timmerman",
  parket: "timmerman", trap: "timmerman",
  gras: "tuinman", gazon: "tuinman", tuin: "tuinman",
  snoeien: "tuinman", maaien: "tuinman", planten: "tuinman",
  tuinman: "tuinman", haag: "tuinman", struik: "tuinman",
  boom: "tuinman", bladeren: "tuinman", onkruid: "tuinman",
  airco: "hvac", verwarming: "hvac", radiator: "hvac",
  warmtepomp: "hvac", ventilatie: "hvac", hvac: "hvac",
  koeling: "hvac", ketel: "hvac", thermostaat: "hvac",
  slot: "slotenmaker", sleutel: "slotenmaker", inbraak: "slotenmaker",
  cilinder: "slotenmaker", slotenmaker: "slotenmaker", deurslot: "slotenmaker",
  dak: "dakdekker", dakpan: "dakdekker", goot: "dakdekker",
  regenpijp: "dakdekker", dakdekker: "dakdekker", platdak: "dakdekker",
  verhuizen: "verhuizen", dozen: "verhuizen", inpakken: "verhuizen",
  transport: "verhuizen", verhuis: "verhuizen",
};

function zoekCategorie(q: string): string | null {
  const woorden = q.toLowerCase().trim().split(/\s+/);
  for (const woord of woorden) {
    if (TREFWOORDEN[woord]) return TREFWOORDEN[woord];
    for (const [tref, cat] of Object.entries(TREFWOORDEN)) {
      if (woord.length >= 3 && tref.startsWith(woord)) return cat;
    }
  }
  return null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Vakman = {
  id: string;
  name: string;
  category: string;
  city: string;
  lat: number | null;
  lng: number | null;
  rating: number;
  reviewCount: number;
  priceMin: number;
  available: boolean;
  phone: string;
  isReal: true;
  afstand_km?: number;
};

function VakmanKaart({ p }: { p: Vakman }) {
  const initial = p.name.split(" ")[0].charAt(0).toUpperCase();

  return (
    <div style={{
      background: "#FBF7F0", border: "0.5px solid #E5DDD0",
      borderRadius: 14, padding: 16, marginBottom: 10,
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
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
          <span style={{
            position: "absolute", bottom: 1, right: 1,
            width: 10, height: 10, borderRadius: "50%",
            background: p.available ? "#2B4030" : "#C97A4D",
            border: "2px solid #FBF7F0",
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: p.available ? "#2B4030" : "#C97A4D" }}>
              {p.available ? "● Beschikbaar" : "● Bezet"}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600,
              background: "#2B4030", color: "#F5EFE5",
              padding: "1px 6px", borderRadius: 99, letterSpacing: "0.03em",
            }}>
              Echt
            </span>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A", lineHeight: 1.2 }}>
            {p.name}
          </p>
          <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>
            {p.category}
            {p.afstand_km != null
              ? ` · ${p.afstand_km} km`
              : p.city ? ` · ${p.city}` : ""}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Star size={11} style={{ color: "#C97A4D" }} fill="#C97A4D" />
            <span style={{ fontFamily: SERIF, fontSize: 13, color: "#1A1D1A" }}>{p.rating || "—"}</span>
            {p.reviewCount > 0 && (
              <span style={{ fontSize: 11, color: "#8A8A83" }}>({p.reviewCount})</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {p.priceMin > 0 ? (
            <p style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030", margin: 0 }}>€{p.priceMin}/u</p>
          ) : (
            <p style={{ fontFamily: SERIF, fontSize: 13, color: "#8A8A83", margin: 0 }}>Op aanvraag</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, padding: "3px 8px",
          background: "#EDE4D2", borderRadius: 6, color: "#2B4030",
        }}>
          <CheckCircle size={10} /> Gecertificeerd
        </span>
        {p.priceMin > 0 && (
          <span style={{ fontSize: 11, padding: "3px 8px", background: "#EDE4D2", borderRadius: 6, color: "#5C5C56" }}>
            €{p.priceMin}/u
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Link href={`/agenda/boeken/${p.id}`} style={{ flex: 2, textDecoration: "none" }}>
          <button className="touch-scale" style={{
            width: "100%", padding: 10, fontSize: 13, fontWeight: 500,
            background: p.available ? "#2B4030" : "transparent",
            color: p.available ? "#F5EFE5" : "#5C5C56",
            border: p.available ? "none" : "0.5px solid #E5DDD0",
            borderRadius: 10, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>
            {p.available ? "Boek direct" : "Plan later"}
          </button>
        </Link>
        <Link href={`/chat/${p.id}`} style={{ textDecoration: "none" }}>
          <button className="touch-scale" style={{
            padding: "10px 13px", background: "transparent",
            color: "#5C5C56", border: "0.5px solid #E5DDD0",
            borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
          }} aria-label="Bericht">
            <MessageCircle size={15} />
          </button>
        </Link>
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

function ZoekenInner() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat");
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState(catParam ?? "");
  const [vakmensen, setVakmensen] = useState<Vakman[]>([]);
  const [loading, setLoading] = useState(true);

  // Geo state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radius, setRadius] = useState<RadiusKm>(25);
  const [locationActive, setLocationActive] = useState(false);
  const [showRadiusPanel, setShowRadiusPanel] = useState(false);

  // Load vakmensen from Supabase
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await supabaseReady;
        const { data: vakData } = await (supabase.from("vakmensen") as any)
          .select("id, specialty, beschikbaar, gemiddelde_rating, uurtarief, review_count");

        if (cancelled || !vakData?.length) { setLoading(false); return; }

        const ids = vakData.map((v: any) => v.id);
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, name, address, city, phone, lat, lng")
          .in("id", ids);

        const profMap: Record<string, any> = {};
        (profData ?? []).forEach((p: any) => { profMap[p.id] = p; });

        const mapped: Vakman[] = vakData.map((v: any) => {
          const prof = profMap[v.id] ?? {};
          return {
            id: v.id,
            isReal: true as const,
            name: prof.name ?? "Vakman",
            category: v.specialty ?? "Vakman",
            city: prof.city ?? "",
            lat: prof.lat ?? null,
            lng: prof.lng ?? null,
            rating: v.gemiddelde_rating ?? 0,
            reviewCount: v.review_count ?? 0,
            priceMin: v.uurtarief ?? 0,
            available: v.beschikbaar ?? false,
            phone: prof.phone ?? "",
          };
        });

        if (!cancelled) setVakmensen(mapped);
      } catch {
        // fall through — empty list shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function requestGeo() {
    if (!("geolocation" in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationActive(true);
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000, maximumAge: 3600000 }
    );
  }

  function disableGeo() {
    setLocationActive(false);
    setUserLat(null);
    setUserLng(null);
    setShowRadiusPanel(false);
  }

  const toggleFilter = (id: string) =>
    setActiveFilters(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  const gevondenCat = query ? zoekCategorie(query) : null;
  const effectieveCat = activeCat || gevondenCat || catParam || "";

  // Compute distances and apply filters
  let results = vakmensen.map(v => {
    if (locationActive && userLat != null && userLng != null && v.lat != null && v.lng != null) {
      const km = Math.round(haversineKm(userLat, userLng, v.lat, v.lng) * 10) / 10;
      return { ...v, afstand_km: km };
    }
    return v;
  });

  // Location radius filter
  if (locationActive && userLat != null && userLng != null) {
    results = results.filter(v =>
      v.afstand_km == null // no coords → don't exclude (fallback: show)
        ? true
        : v.afstand_km! <= radius
    );
    // Sort by distance when location active
    results.sort((a, b) => (a.afstand_km ?? 999) - (b.afstand_km ?? 999));
  }

  // Category filter
  if (effectieveCat) {
    results = results.filter(v =>
      v.category.toLowerCase() === effectieveCat.toLowerCase() ||
      v.category.toLowerCase().includes(effectieveCat.toLowerCase())
    );
  }

  // Text search (when no category matched)
  if (query && !gevondenCat) {
    results = results.filter(v =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase()) ||
      v.city.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (activeFilters.includes("beschikbaar")) results = results.filter(v => v.available);

  const headerLabel = effectieveCat
    ? CAT_CHIPS.find(c => c.id === effectieveCat)?.label ?? "Zoekresultaten"
    : "Alle vakmensen";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* Sticky header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
            {loading ? "Laden…" : `${results.length} resultaten`}
            {locationActive && userLat != null && (
              <span style={{ marginLeft: 6, color: "#2B4030" }}>· binnen {radius} km</span>
            )}
          </p>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
            {headerLabel}
          </h2>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#FBF7F0", border: "0.5px solid #E5DDD0",
          borderRadius: 10, padding: "10px 14px", marginBottom: 10,
        }}>
          <Search size={15} style={{ color: "#8A8A83", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek vakman, dienst of stad…"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
              color: query ? "#1A1D1A" : "#8A8A83",
            }}
          />
          <button
            onClick={() => setShowRadiusPanel(s => !s)}
            className="touch-scale"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: showRadiusPanel ? "#2B4030" : "#8A8A83",
              display: "flex", alignItems: "center",
            }}
            aria-label="Filters"
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>

        {/* Location + radius panel */}
        {showRadiusPanel && (
          <div style={{
            background: "#FBF7F0", border: "0.5px solid #E5DDD0",
            borderRadius: 10, padding: "12px 14px", marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#1A1D1A", margin: 0 }}>Locatie filter</p>
              {locationActive && (
                <button onClick={disableGeo} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#8A8A83", display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                }}>
                  <X size={12} /> Uitschakelen
                </button>
              )}
            </div>

            {!locationActive ? (
              <button
                onClick={requestGeo}
                disabled={geoLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "10px 14px",
                  background: "#2B4030", color: "#F5EFE5",
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                }}
              >
                <Navigation size={14} />
                {geoLoading ? "Locatie ophalen…" : "Gebruik mijn locatie"}
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 11, color: "#2B4030", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} /> Locatie actief
                </p>
                <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 8px" }}>Straal: <strong>{radius} km</strong></p>
                <div style={{ display: "flex", gap: 6 }}>
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      style={{
                        flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 500,
                        background: radius === r ? "#2B4030" : "transparent",
                        color: radius === r ? "#F5EFE5" : "#5C5C56",
                        border: radius === r ? "none" : "0.5px solid #E5DDD0",
                        borderRadius: 8, cursor: "pointer",
                      }}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Category chips */}
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
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, flexWrap: "wrap" }}>
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
          {locationActive && (
            <span style={{
              fontSize: 11, padding: "5px 11px", whiteSpace: "nowrap",
              background: "#EAF0EC", color: "#2B4030",
              borderRadius: 99, display: "flex", alignItems: "center", gap: 4,
              fontFamily: "'Inter', sans-serif", fontWeight: 500,
            }}>
              <MapPin size={10} /> {radius} km
            </span>
          )}
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

      {/* Results */}
      <div className="px-5 pb-28">
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#8A8A83", fontSize: 14 }}>
            Vakmensen laden…
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontFamily: SERIF, fontSize: 20, color: "#1A1D1A", margin: "0 0 8px" }}>
              Geen resultaten
            </p>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>
              {locationActive ? `Geen vakmensen gevonden binnen ${radius} km. Vergroot de straal.` : "Probeer een andere zoekterm of filter."}
            </p>
            {locationActive && (
              <button
                onClick={() => setRadius(r => (r < 100 ? RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(r) + 1] ?? 100 : 100))}
                style={{
                  marginTop: 12, padding: "8px 16px",
                  background: "#2B4030", color: "#F5EFE5",
                  border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13,
                }}
              >
                Straal vergroten
              </button>
            )}
          </div>
        ) : (
          results.map(v => <VakmanKaart key={v.id} p={v} />)
        )}
      </div>
    </div>
  );
}

export default function ZoekenPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>
        <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
          <div style={{ height: 26, width: 160, background: "#E5DDD0", borderRadius: 8 }} />
        </div>
      </div>
    }>
      <ZoekenInner />
    </Suspense>
  );
}
