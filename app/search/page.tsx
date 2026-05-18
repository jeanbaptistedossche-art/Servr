"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Star, MapPin, X, CalendarDays } from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/mockData";

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Read initial category from URL param (?cat=loodgieter)
  useEffect(() => {
    const cat = searchParams.get("cat");
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const filtered = PROVIDERS.filter(p => {
    const matchQuery = query === "" || p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase());
    const matchCat = !activeCategory || p.category.toLowerCase() === CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase();
    const matchAvail = !onlyAvailable || p.available;
    return matchQuery && matchCat && matchAvail;
  });

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="flex flex-col min-h-full pb-6 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <h1 className="font-black text-2xl mb-4">Zoeken</h1>

        {/* Zoekbalk */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <Search size={18} style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Zoek op naam of dienst..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="touch-scale">
              <X size={16} style={{ color: "var(--muted)" }} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setOnlyAvailable(v => !v)}
            className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all"
            style={{
              borderColor: onlyAvailable ? "var(--teal)" : "var(--border)",
              background: onlyAvailable ? "var(--teal)" : "var(--surface)",
              color: onlyAvailable ? "white" : "var(--foreground)",
            }}>
            <span className={`w-2 h-2 rounded-full ${onlyAvailable ? "bg-white" : "bg-green-500"}`} />
            Beschikbaar
          </button>

          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="touch-scale flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all"
              style={{
                borderColor: activeCategory === cat.id ? cat.color : "var(--border)",
                background: activeCategory === cat.id ? cat.color + "18" : "var(--surface)",
                color: activeCategory === cat.id ? cat.color : "var(--foreground)",
              }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active category header */}
      {activeCat && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: activeCat.color + "12" }}>
          <span className="text-2xl">{activeCat.icon}</span>
          <div className="flex-1">
            <p className="font-black text-base">{activeCat.label}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{filtered.length} vakmensen gevonden</p>
          </div>
          <button onClick={() => setActiveCategory(null)}
            className="touch-scale w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <X size={13} style={{ color: "var(--muted)" }} />
          </button>
        </div>
      )}

      {/* Resultaten */}
      <div className="px-5 pt-4">
        {!activeCat && (
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            {filtered.length} vakman{filtered.length !== 1 ? "nen" : ""} gevonden
          </p>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map(p => (
            <div key={p.id} className="card overflow-hidden">
              <Link href={`/provider/${p.id}`} className="touch-scale flex gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <img src={p.avatar} className="w-16 h-16 rounded-2xl object-cover" alt={p.name} />
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${p.available ? "bg-green-500" : "bg-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-base leading-tight">{p.name}</p>
                    <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--teal)", color: "white" }}>
                      S{p.servrScore}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{p.categoryIcon} {p.category}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold">{p.rating}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>({p.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      <MapPin size={12} />
                      <span className="text-xs">{p.distance}</span>
                    </div>
                    <span className="text-xs font-semibold ml-auto" style={{ color: "var(--teal)" }}>
                      €{p.priceMin}–{p.priceMax}/u
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.badges.slice(0, 2).map(b => (
                      <span key={b} className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>

              {/* Boek direct knop */}
              {p.available && (
                <div className="px-4 pb-4 flex gap-2">
                  <Link href={`/agenda/boeken/${p.id}`}
                    className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs text-white"
                    style={{ background: "var(--teal)" }}>
                    <CalendarDays size={13} /> Boek direct
                  </Link>
                  <Link href={`/chat/${p.id}`}
                    className="touch-scale px-4 py-2.5 rounded-xl font-semibold text-xs border"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    💬 Chat
                  </Link>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-4">
              <span className="text-5xl">🔍</span>
              <p className="font-bold text-base">Geen resultaten</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Probeer een andere zoekterm of filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--teal)" }} />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
