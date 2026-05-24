"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, MapPin, X, CalendarDays, Phone, Plus, ChevronRight, Zap,
  List, Map as MapIcon, Navigation,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Flame, Wind,
  Layers, Bell, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, LucideIcon,
} from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/mockData";
import NavButtons from "@/components/NavButtons";

// Lazy-load kaart (vermijdt SSR problemen met maplibre)
const ProviderMap = dynamic(() => import("@/components/ProviderMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-xl" style={{ height: "100%", background: "#f1f5f9" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--teal)" }} />
    </div>
  ),
});

// ── Category icon mapping ─────────────────────────────────────────────────
const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Flame, schilder: Paintbrush,
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

function CatIcon({ id, size = 16 }: { id: string; size?: number }) {
  const Icon = CAT_ICONS[id] ?? Settings2;
  return <Icon size={size} strokeWidth={1.8} />;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const cat = searchParams.get("cat");
    if (cat) setActiveCategory(cat);
    const q = searchParams.get("q");
    if (q) setQuery(q);
    const mode = searchParams.get("view");
    if (mode === "map") setViewMode("map");
  }, [searchParams]);

  const filtered = PROVIDERS.filter(p => {
    const q = query.toLowerCase();
    const matchQuery = q === ""
      || p.name.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.bio.toLowerCase().includes(q)
      || p.badges.some(b => b.toLowerCase().includes(q));
    const matchCat = !activeCategory
      || p.category.toLowerCase() === CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase();
    const matchAvail = !onlyAvailable || p.available;
    return matchQuery && matchCat && matchAvail;
  });

  const matchingCats = query.length >= 2
    ? CATEGORIES.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase())
        && !filtered.some(p => p.category.toLowerCase() === c.label.toLowerCase())
      )
    : [];

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#f8fafc" }}>

      {/* ── Sticky header ── */}
      <div className="px-4 pt-14 pb-3 sticky top-0 z-20"
        style={{ background: "rgba(255,255,255,0.97)", borderBottom: "1px solid #F3F4F6", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl" style={{ color: "#111827" }}>Zoeken</h1>

          {/* List / Map toggle */}
          <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: viewMode === "list" ? "#4F46E5" : "#fff",
                color: viewMode === "list" ? "white" : "#6B7280",
              }}
            >
              <List size={13} /> Lijst
            </button>
            <button
              onClick={() => setViewMode("map")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: viewMode === "map" ? "#4F46E5" : "#fff",
                color: viewMode === "map" ? "white" : "#6B7280",
              }}
            >
              <MapIcon size={13} /> Kaart
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border"
          style={{ borderColor: query ? "#4F46E5" : "#E5E7EB", background: "#F9FAFB", boxShadow: query ? "0 0 0 3px #EEF2FF" : "none" }}>
          <Search size={15} style={{ color: "#9CA3AF" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Naam, dienst of categorie..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#111827" }}
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery("")} className="touch-scale">
              <X size={14} style={{ color: "#9CA3AF" }} />
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-0.5 -mx-1 px-1">
          <button
            onClick={() => setOnlyAvailable(v => !v)}
            className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{
              borderColor: onlyAvailable ? "#4F46E5" : "#E5E7EB",
              background: onlyAvailable ? "#4F46E5" : "#fff",
              color: onlyAvailable ? "white" : "#4B5563",
            }}>
            <span className={`w-1.5 h-1.5 rounded-full ${onlyAvailable ? "bg-white" : "bg-emerald-500"}`} />
            Beschikbaar
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                borderColor: activeCategory === cat.id ? cat.color : "#E5E7EB",
                background: activeCategory === cat.id ? cat.color + "15" : "#fff",
                color: activeCategory === cat.id ? cat.color : "#4B5563",
              }}>
              <span style={{ color: activeCategory === cat.id ? cat.color : "#9CA3AF" }}>
                <CatIcon id={cat.id} size={12} />
              </span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAP VIEW ── */}
      {viewMode === "map" && (
        <div className="flex-1 relative">
          {/* Full-height interactive map */}
          <div style={{ height: "calc(100dvh - 220px)", position: "relative" }}>
            <ProviderMap
              providers={filtered}
              height="100%"
              interactive
              showNavButtons
              zoom={13}
            />
          </div>

          {/* Bottom strip with count */}
          <div className="sticky bottom-0 px-4 py-3"
            style={{ background: "rgba(255,255,255,0.97)", borderTop: "1px solid #f1f5f9", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                <span className="font-bold" style={{ color: "#0f172a" }}>{filtered.length}</span> vakmensen op de kaart
              </p>
              <Link href="/opdracht/nieuw"
                className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: "var(--teal)" }}>
                <Plus size={13} /> Opdracht
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="px-4 pt-3 flex flex-col gap-2.5 pb-6">

          {/* Active category banner */}
          {activeCat && (
            <div className="px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ background: activeCat.color + "10", border: `1px solid ${activeCat.color}25` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: activeCat.color + "20", color: activeCat.color }}>
                <CatIcon id={activeCat.id} size={16} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{activeCat.label}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>{filtered.length} vakmensen gevonden</p>
              </div>
              <button onClick={() => setActiveCategory(null)}
                className="touch-scale w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#f1f5f9" }}>
                <X size={12} style={{ color: "#94a3b8" }} />
              </button>
            </div>
          )}

          {/* Count */}
          {!activeCat && (
            <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              {filtered.length} vakman{filtered.length !== 1 ? "nen" : ""} gevonden
              {query && <span> voor &ldquo;<strong style={{ color: "#475569" }}>{query}</strong>&rdquo;</span>}
            </p>
          )}

          {/* Provider cards */}
          {filtered.map(p => (
            <div key={p.id} className="rounded-xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <Link href={`/provider/${p.id}`} className="touch-scale flex gap-3 p-3.5">
                <div className="relative flex-shrink-0">
                  <img src={p.avatar} className="w-14 h-14 rounded-xl object-cover" alt={p.name} />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${p.available ? "bg-green-500" : "bg-gray-300"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight" style={{ color: "#0f172a" }}>{p.name}</p>
                    <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{ background: "var(--teal)", color: "white" }}>
                      S{p.servrScore}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{p.category}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold" style={{ color: "#0f172a" }}>{p.rating}</span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>({p.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: "#94a3b8" }}>
                      <MapPin size={10} />
                      <span className="text-xs">{p.distance}</span>
                    </div>
                    <span className="text-xs font-semibold ml-auto" style={{ color: "var(--teal)" }}>
                      €{p.priceMin}–{p.priceMax}/u
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.badges.slice(0, 2).map(b => (
                      <span key={b} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                        style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #f1f5f9" }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>

              {/* Action buttons */}
              {p.available && (
                <div className="px-3.5 pb-3.5 flex flex-col gap-2" style={{ borderTop: "1px solid #f8fafc", paddingTop: 10 }}>
                  {/* Book + Chat + Call */}
                  <div className="flex gap-2">
                    <Link href={`/agenda/boeken/${p.id}`}
                      className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-semibold text-xs text-white"
                      style={{ background: "var(--teal)" }}>
                      <CalendarDays size={12} /> Boek direct
                    </Link>
                    <Link href={`/chat/${p.id}`}
                      className="touch-scale px-3 py-2 rounded-lg font-medium text-xs border flex items-center gap-1"
                      style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                      Chat
                    </Link>
                    <a href={`tel:${p.phone}`}
                      className="touch-scale px-3 py-2 rounded-lg border flex items-center justify-center"
                      style={{ borderColor: "#e2e8f0", color: "var(--teal)" }}>
                      <Phone size={13} />
                    </a>
                  </div>
                  {/* Navigation */}
                  <NavButtons provider={p} size="sm" />
                </div>
              )}
            </div>
          ))}

          {/* Categories matching query but no providers */}
          {matchingCats.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: "#94a3b8", letterSpacing: "0.05em" }}>
                Categorieën voor &ldquo;{query}&rdquo;
              </p>
              <div className="flex flex-col gap-2">
                {matchingCats.map(cat => (
                  <Link key={cat.id} href={`/opdracht/nieuw?categorie=${cat.id}`}
                    className="touch-scale flex items-center gap-3 p-3.5 rounded-xl border"
                    style={{ borderColor: cat.color + "35", background: "#fff" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color + "15", color: cat.color }}>
                      <CatIcon id={cat.id} size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{cat.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        Geen vakmensen live — plaats een opdracht
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold text-xs text-white flex-shrink-0"
                      style={{ background: cat.color }}>
                      <Plus size={11} /> Opdracht
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && matchingCats.length === 0 && (
            <div className="flex flex-col items-center py-10 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#f1f5f9" }}>
                <Search size={24} style={{ color: "#94a3b8" }} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Geen vakmensen gevonden</p>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  {query ? `Geen vakman voor "${query}" in jouw buurt.` : "Probeer een andere zoekterm of filter."}
                </p>
              </div>
              {query && (
                <Link href={`/opdracht/nieuw?dienst=${encodeURIComponent(query)}`}
                  className="touch-scale flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "var(--teal)" }}>
                  <Plus size={14} /> Opdracht plaatsen voor &ldquo;{query}&rdquo;
                </Link>
              )}
              <Link href="/panic"
                className="touch-scale flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
                <Zap size={14} /> Panic — direct hulp
              </Link>
            </div>
          )}

          {(filtered.length > 0 || matchingCats.length > 0) && (
            <Link href="/opdracht/nieuw"
              className="touch-scale flex items-center gap-3 p-3.5 rounded-xl border border-dashed"
              style={{ borderColor: "#e2e8f0" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#f8fafc" }}>
                <Plus size={16} style={{ color: "var(--teal)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>Vrije opdracht plaatsen</p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>Beschrijf zelf wat je nodig hebt</p>
              </div>
              <ChevronRight size={14} style={{ color: "#94a3b8", marginLeft: "auto" }} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--teal)" }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
