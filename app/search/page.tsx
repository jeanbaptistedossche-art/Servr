"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, MapPin, X, CalendarDays, Phone, Plus, ChevronRight, Zap,
  List, Map as MapIcon, MessageCircle, SlidersHorizontal, ArrowLeft,
  Wrench, Paintbrush, Hammer, Sparkles, Leaf, Package, Lock,
  Thermometer, Building2, Waves, Monitor, Sun, Flame, Wind,
  Layers, Bell, LayoutGrid, Car, Droplets, Grid3X3,
  Settings2, LucideIcon, CheckCircle,
} from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/mockData";

const ProviderMap = dynamic(() => import("@/components/ProviderMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center rounded-xl" style={{ height: "100%", background: "#f1f5f9" }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--teal)" }} />
    </div>
  ),
});

const CAT_ICONS: Record<string, LucideIcon> = {
  loodgieter: Wrench, elektricien: Zap, schilder: Paintbrush,
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
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) setActiveCategory(cat);
    const q = searchParams.get("q");
    if (q) setQuery(q);
    const mode = searchParams.get("view");
    if (mode === "map") setViewMode("map");
    // Only focus if no preselected category (keyboard pops up when browsing categories is bad UX)
    if (!cat) inputRef.current?.focus();
  }, [searchParams]);

  const filtered = PROVIDERS.filter(p => {
    const q = query.toLowerCase();
    const matchQuery = q === ""
      || p.name.toLowerCase().includes(q)
      || p.category.toLowerCase().includes(q)
      || p.bio.toLowerCase().includes(q)
      || p.badges.some(b => b.toLowerCase().includes(q));

    let matchCat = !activeCategory;
    if (activeCategory) {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      if (cat) {
        matchCat = p.category.toLowerCase() === cat.label.toLowerCase()
          // fallback: check if category id is contained in category string
          || p.category.toLowerCase().includes(activeCategory.toLowerCase())
          || activeCategory.toLowerCase().includes(p.category.toLowerCase().split("/")[0].trim());
      }
    }

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
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 pt-14 pb-3"
        style={{ background: "rgba(241,244,250,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 mb-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
              <ArrowLeft size={18} style={{ color: "#475569" }} />
            </Link>
            <div>
              <h1 className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>
                {activeCat ? activeCat.label : "Zoeken"}
              </h1>
              {activeCat && (
                <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                  {filtered.length} vakman{filtered.length !== 1 ? "nen" : ""} gevonden
                </p>
              )}
            </div>
          </div>

          {/* List / Map toggle */}
          <div className="flex items-center rounded-2xl p-1"
            style={{ background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: viewMode === "list" ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "transparent",
                color: viewMode === "list" ? "white" : "#94a3b8",
                boxShadow: viewMode === "list" ? "0 2px 8px rgba(79,70,229,0.35)" : "none",
              }}>
              <List size={13} /> Lijst
            </button>
            <button onClick={() => setViewMode("map")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: viewMode === "map" ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "transparent",
                color: viewMode === "map" ? "white" : "#94a3b8",
                boxShadow: viewMode === "map" ? "0 2px 8px rgba(79,70,229,0.35)" : "none",
              }}>
              <MapIcon size={13} /> Kaart
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 mb-2.5">
          <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-2xl"
            style={{
              background: "#fff",
              boxShadow: query ? "0 0 0 2px #4F46E5, 0 4px 20px rgba(79,70,229,0.12)" : "0 4px 20px rgba(0,0,0,0.07)",
              transition: "box-shadow 0.2s",
            }}>
            <Search size={16} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Naam, dienst of categorie..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm font-medium"
              style={{ color: "#0f172a" }}
              autoComplete="off"
            />
            {query ? (
              <button onClick={() => setQuery("")} className="touch-scale w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#f1f5f9" }}>
                <X size={12} style={{ color: "#64748b" }} />
              </button>
            ) : (
              <button onClick={() => setShowFilters(v => !v)} className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: showFilters ? "#4F46E5" : "#F1F5F9" }}>
                <SlidersHorizontal size={14} style={{ color: showFilters ? "white" : "#64748b" }} />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-2 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setOnlyAvailable(v => !v)}
            className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"
            style={{
              background: onlyAvailable ? "#10B981" : "#fff",
              color: onlyAvailable ? "white" : "#475569",
              boxShadow: onlyAvailable ? "0 4px 12px rgba(16,185,129,0.35)" : "0 2px 8px rgba(0,0,0,0.07)",
            }}>
            <span className={`w-1.5 h-1.5 rounded-full ${onlyAvailable ? "bg-white" : "bg-emerald-500"}`} />
            Nu beschikbaar
          </button>
          {CATEGORIES.slice(0, 14).map(cat => (
            <button key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"
              style={{
                background: activeCategory === cat.id ? cat.color : "#fff",
                color: activeCategory === cat.id ? "white" : "#475569",
                boxShadow: activeCategory === cat.id ? `0 4px 12px ${cat.color}50` : "0 2px 8px rgba(0,0,0,0.07)",
              }}>
              <span style={{ color: activeCategory === cat.id ? "white" : cat.color }}>
                <CatIcon id={cat.id} size={12} />
              </span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active category hero banner */}
      {activeCat && viewMode === "list" && (
        <div className="px-5 pt-4">
          <div className="relative overflow-hidden rounded-3xl p-5 flex items-center gap-4"
            style={{
              background: `linear-gradient(135deg, ${activeCat.color}, ${activeCat.color}cc)`,
              boxShadow: `0 12px 32px ${activeCat.color}40`,
            }}>
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-15" style={{ background: "white" }} />
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
              <span style={{ color: "white" }}><CatIcon id={activeCat.id} size={28} /></span>
            </div>
            <div className="flex-1">
              <h2 className="font-black text-white leading-tight" style={{ fontSize: 22 }}>{activeCat.label}</h2>
              <p className="text-white/75 text-sm mt-0.5">{filtered.length} gekwalificeerde vakmensen</p>
            </div>
            <button onClick={() => setActiveCategory(null)}
              className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
              <X size={15} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {viewMode === "map" && (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 400, height: "calc(100svh - var(--bottom-nav-height) - 200px)" }}>
            <ProviderMap providers={filtered} height="100%" interactive showNavButtons zoom={13} />
          </div>
          <div className="sticky bottom-0 px-5 py-3"
            style={{ background: "rgba(241,244,250,0.97)", borderTop: "1px solid #e8edf4", backdropFilter: "blur(10px)" }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                <span className="font-black" style={{ color: "#0f172a" }}>{filtered.length}</span> vakmensen op de kaart
              </p>
              <Link href="/opdracht/nieuw"
                className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.35)" }}>
                <Plus size={13} /> Opdracht plaatsen
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="px-5 pt-4 flex flex-col gap-3 pb-8">

          {/* Count - only when no category */}
          {!activeCat && (
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
              {filtered.length} vakman{filtered.length !== 1 ? "nen" : ""} gevonden
              {query && <span> voor &ldquo;<strong style={{ color: "#475569" }}>{query}</strong>&rdquo;</span>}
            </p>
          )}

          {/* Provider cards */}
          {filtered.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 28, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.09)" }}>

              {/* Photo banner */}
              <Link href={`/provider/${p.id}`} className="touch-scale block">
                <div className="relative" style={{ height: 200 }}>
                  <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)" }} />

                  {/* Top: available + S-score */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between">
                    {p.available ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-white"
                        style={{ background: "rgba(16,185,129,0.92)", backdropFilter: "blur(8px)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Nu beschikbaar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-medium"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.65)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Bezet
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
                        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}>
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span className="text-white font-bold text-xs">{p.rating}</span>
                      </span>
                      <span className="px-2.5 py-1.5 rounded-2xl text-[11px] font-black text-white"
                        title={`Servr Score ${p.servrScore}/100`}
                        style={{ background: "rgba(79,70,229,0.9)", backdropFilter: "blur(8px)" }}>
                        S{p.servrScore}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: avatar + name + price */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
                    <img src={p.avatar} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                      style={{ border: "2.5px solid rgba(255,255,255,0.9)" }} alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white leading-tight" style={{ fontSize: 17 }}>{p.name}</p>
                      <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {p.category} · {p.distance}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 pb-0.5">
                      <p className="font-black text-white" style={{ fontSize: 19 }}>€{p.priceMin}</p>
                      <p className="text-white/55 text-[10px]">/uur</p>
                    </div>
                  </div>
                </div>

                {/* Info strip */}
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12}
                          className={s <= Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                      <span className="text-xs font-medium ml-1.5" style={{ color: "#94a3b8" }}>
                        {p.reviewCount} reviews
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "#ECFDF5", color: "#059669" }}>
                      €{p.priceMin}–{p.priceMax}/u
                    </span>
                  </div>
                  {p.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.badges.slice(0, 3).map(b => (
                        <span key={b} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                          <CheckCircle size={10} /> {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {/* CTA buttons */}
              <div className="px-4 pb-4 pt-1 flex gap-2.5">
                <Link
                  href={p.available ? `/agenda/boeken/${p.id}` : `/agenda/boeken/${p.id}?later=1`}
                  className="touch-scale flex-1 flex items-center justify-center gap-2 font-bold text-sm"
                  style={{
                    height: 50, borderRadius: 18,
                    background: p.available
                      ? "linear-gradient(135deg, #4F46E5, #818CF8)"
                      : "linear-gradient(135deg, #F59E0B, #D97706)",
                    color: "white",
                    boxShadow: p.available
                      ? "0 4px 16px rgba(79,70,229,0.35)"
                      : "0 4px 16px rgba(245,158,11,0.35)",
                  }}>
                  <CalendarDays size={15} />
                  {p.available ? "Boek direct" : "Plan later"}
                </Link>
                <Link href={`/chat/${p.id}`}
                  className="touch-scale flex items-center justify-center"
                  style={{ width: 50, height: 50, borderRadius: 18, background: "#EEF2FF", color: "#4F46E5" }}>
                  <MessageCircle size={18} />
                </Link>
                <a href={`tel:${p.phone}`}
                  className="touch-scale flex items-center justify-center"
                  style={{ width: 50, height: 50, borderRadius: 18, background: "#ECFDF5", color: "#16a34a" }}>
                  <Phone size={18} />
                </a>
              </div>
            </div>
          ))}

          {/* Categories matching query but no providers */}
          {matchingCats.length > 0 && (
            <div className="mt-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#94a3b8" }}>
                Categorieën voor &ldquo;{query}&rdquo;
              </p>
              <div className="flex flex-col gap-2.5">
                {matchingCats.map(cat => (
                  <Link key={cat.id} href={`/opdracht/nieuw?categorie=${cat.id}`}
                    className="touch-scale flex items-center gap-3.5 p-4 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cat.color + "15", color: cat.color }}>
                      <CatIcon id={cat.id} size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{cat.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        Geen vakmensen live — plaats een opdracht
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs text-white flex-shrink-0"
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
            <div className="flex flex-col items-center py-14 gap-5 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.09)" }}>
                <Search size={30} style={{ color: "#94a3b8" }} />
              </div>
              <div>
                <p className="font-black text-lg" style={{ color: "#0f172a" }}>Geen vakmensen gevonden</p>
                <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                  {query ? `Geen vakman voor "${query}" in jouw buurt.` : "Probeer een andere filter."}
                </p>
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                {query && (
                  <Link href={`/opdracht/nieuw?dienst=${encodeURIComponent(query)}`}
                    className="touch-scale flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 6px 20px rgba(79,70,229,0.35)" }}>
                    <Plus size={14} /> Opdracht plaatsen voor &ldquo;{query}&rdquo;
                  </Link>
                )}
                <Link href="/panic"
                  className="touch-scale flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #DC2626, #991B1B)", boxShadow: "0 6px 20px rgba(220,38,38,0.3)" }}>
                  <Zap size={14} /> Spoeddienst — direct hulp
                </Link>
              </div>
            </div>
          )}

          {/* Place job CTA */}
          {(filtered.length > 0 || matchingCats.length > 0) && (
            <Link href="/opdracht/nieuw"
              className="touch-scale flex items-center gap-3.5 p-4 rounded-2xl"
              style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.07)", border: "1.5px dashed #e2e8f0" }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#EEF2FF" }}>
                <Plus size={18} style={{ color: "#4F46E5" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Vrije opdracht plaatsen</p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Beschrijf zelf wat je nodig hebt</p>
              </div>
              <ChevronRight size={15} style={{ color: "#cbd5e1" }} />
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
