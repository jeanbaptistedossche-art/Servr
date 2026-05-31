"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, Star, SlidersHorizontal, MessageCircle, Phone,
  Calendar, List, MapPin, CheckCircle,
} from "lucide-react";
import { PROVIDERS, CATEGORIES, type Provider } from "@/lib/mockData";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Filter chips ──────────────────────────────────────────────
const FILTERS = [
  { id: "beschikbaar", label: "Nu beschikbaar" },
  { id: "5km",         label: "≤ 5 km" },
  { id: "cert",        label: "Gecertificeerd" },
];

// ── Vakman card ───────────────────────────────────────────────
function VakmanKaart({ p }: { p: Provider }) {
  const initial = p.name.split(" ")[0].charAt(0);
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
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 17, margin: 0, color: "#1A1D1A", lineHeight: 1.2 }}>
            {p.name}
          </p>
          <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>
            {p.category} · {p.distance}
          </p>

          {/* Rating + reviews */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Star size={11} style={{ color: "#C97A4D" }} fill="#C97A4D" />
            <span style={{ fontFamily: SERIF, fontSize: 13, color: "#1A1D1A" }}>{p.rating}</span>
            <span style={{ fontSize: 11, color: "#8A8A83" }}>({p.reviewCount})</span>
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030", margin: 0 }}>€{p.priceMin}/u</p>
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
        <span style={{
          fontSize: 11, padding: "3px 8px",
          background: "#EDE4D2", borderRadius: 6, color: "#5C5C56",
        }}>€{p.priceMin}–€{p.priceMax}/u</span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        {/* Primary action — always enabled (fix B1) */}
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
        <a href={`tel:${p.phone}`} style={{ textDecoration: "none" }}>
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

  const catLabel = catParam
    ? CATEGORIES.find(c => c.id === catParam)?.label ?? "Zoekresultaten"
    : "Alle vakmensen";

  const toggleFilter = (id: string) =>
    setActiveFilters(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);

  // Apply filters
  let results = [...PROVIDERS];
  if (catParam) results = results.filter(p => p.category.toLowerCase() === catParam.toLowerCase() ||
    p.category.toLowerCase().includes(catParam.toLowerCase()));
  if (query) results = results.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase()));
  if (activeFilters.includes("beschikbaar")) results = results.filter(p => p.available);
  if (activeFilters.includes("5km")) results = results.filter(p => parseFloat(p.distance) <= 5);
  if (activeFilters.includes("cert")) results = results.filter(p =>
    p.badges.some(b => b.toLowerCase().includes("top")));

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>
            {results.length} resultaten
          </p>
          <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "2px 0 0", color: "#1A1D1A" }}>
            {catLabel}
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

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {FILTERS.map(f => {
            const active = activeFilters.includes(f.id);
            return (
              <button key={f.id} className="touch-scale" onClick={() => toggleFilter(f.id)} style={{
                fontSize: 11, padding: "5px 11px", whiteSpace: "nowrap",
                background: active ? "#1A1D1A" : "transparent",
                color: active ? "#F5EFE5" : "#5C5C56",
                border: active ? "none" : "0.5px solid #E5DDD0",
                borderRadius: 99, cursor: "pointer", flexShrink: 0,
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 500 : 400,
              }}>
                {f.label}
              </button>
            );
          })}
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
        <div className="sticky top-0 z-20 px-5 pt-14 pb-4"
          style={{ background: "rgba(245,239,229,0.97)" }}>
          <div style={{ height: 26, width: 160, background: "#E5DDD0", borderRadius: 8 }} />
        </div>
      </div>
    }>
      <ZoekenInner />
    </Suspense>
  );
}
