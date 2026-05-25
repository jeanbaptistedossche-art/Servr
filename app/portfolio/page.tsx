"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Camera, Star, Eye, Share2,
  X, Check, ChevronRight, ChevronDown, Image,
  Trash2, Heart, Filter, Globe, Lock,
  ArrowLeft, ArrowRight, Edit3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Categorie = "loodgieter" | "schilder" | "elektra" | "tegels" | "timmer" | "overig";

type PortfolioItem = {
  id: string;
  titel: string;
  beschrijving?: string;
  categorie: Categorie;
  datumAfgerond: string;
  fotoVoor: string;    // URL or base64
  fotoNa: string;      // URL or base64
  klant?: string;
  locatie?: string;
  duur?: string;       // "3 uur", "2 dagen"
  prijs?: number;
  rating?: number;
  klantReview?: string;
  publiek: boolean;
  likes: number;
  views: number;
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CFG: Record<Categorie, { label: string; icon: string; color: string; bg: string }> = {
  loodgieter: { label: "Loodgieter",  icon: "🔧", color: "#0EA5E9", bg: "#F0F9FF" },
  schilder:   { label: "Schilder",    icon: "🖌️", color: "#8B5CF6", bg: "#F5F3FF" },
  elektra:    { label: "Elektra",     icon: "⚡", color: "#F59E0B", bg: "#FFFBEB" },
  tegels:     { label: "Tegels",      icon: "🔲", color: "#10B981", bg: "#ECFDF5" },
  timmer:     { label: "Timmerwerk",  icon: "🔨", color: "#6366F1", bg: "#EEF2FF" },
  overig:     { label: "Overig",      icon: "⭐", color: "#64748b", bg: "#F8FAFC" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ITEMS: PortfolioItem[] = [
  {
    id: "p1",
    titel: "Badkamer renovatie",
    beschrijving: "Complete renovatie inclusief nieuwe tegels, sanitair en inbouwverlichting.",
    categorie: "tegels",
    datumAfgerond: "2026-05-10",
    fotoVoor: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80",
    fotoNa:   "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&sat=-80",
    klant: "Petra Jansen",
    locatie: "Amsterdam",
    duur: "3 dagen",
    prijs: 2800,
    rating: 5,
    klantReview: "Geweldig resultaat! Vakmanschap op topniveau.",
    publiek: true,
    likes: 24,
    views: 187,
  },
  {
    id: "p2",
    titel: "Woonkamer schilderwerk",
    beschrijving: "Volledige woonkamer + hal geschilderd in warm wit. Ca. 65m².",
    categorie: "schilder",
    datumAfgerond: "2026-04-22",
    fotoVoor: "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80",
    fotoNa:   "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=80",
    klant: "Lisa de Vries",
    locatie: "Amsterdam",
    duur: "2 dagen",
    prijs: 520,
    rating: 5,
    klantReview: "Super nette afwerking en altijd op tijd!",
    publiek: true,
    likes: 18,
    views: 134,
  },
  {
    id: "p3",
    titel: "CV installatie nieuwbouw",
    beschrijving: "Complete CV-installatie in nieuwbouwwoning. Alle leidingen, radiatoren en ketel.",
    categorie: "loodgieter",
    datumAfgerond: "2026-03-14",
    fotoVoor: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
    fotoNa:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    klant: "Ahmed Mansour",
    locatie: "Utrecht",
    duur: "4 dagen",
    prijs: 4200,
    rating: 4,
    publiek: true,
    likes: 31,
    views: 256,
  },
  {
    id: "p4",
    titel: "Vloer schuren en lakken",
    beschrijving: "Oude houten vloer nieuw leven ingeblazen. Schuren + 2 lagen lak.",
    categorie: "timmer",
    datumAfgerond: "2026-05-01",
    fotoVoor: "https://images.unsplash.com/photo-1562184552-997c461abbe6?w=600&q=80",
    fotoNa:   "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    klant: "Kim Nguyen",
    locatie: "Haarlem",
    duur: "2 dagen",
    prijs: 480,
    rating: 5,
    publiek: true,
    likes: 42,
    views: 320,
  },
  {
    id: "p5",
    titel: "Groepenkast uitbreiding",
    beschrijving: "Moderne groepenkast met aardlekschakelaars voor uitbouw.",
    categorie: "elektra",
    datumAfgerond: "2026-02-18",
    fotoVoor: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d7b?w=600&q=80",
    fotoNa:   "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80",
    locatie: "Rotterdam",
    duur: "6 uur",
    prijs: 380,
    publiek: false,
    likes: 0,
    views: 12,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12} fill={i <= n ? "#F59E0B" : "none"} style={{ color: i <= n ? "#F59E0B" : "#D1D5DB" }} />
      ))}
    </div>
  );
}

// ─── Slider component ─────────────────────────────────────────────────────────
function VoorNaSlider({ voor, na, titel }: { voor: string; na: string; titel: string }) {
  const [pos, setPos] = useState(50); // 0-100
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    updatePos(e.clientX);
  };
  const onMouseMove = (e: React.MouseEvent) => { if (dragging.current) updatePos(e.clientX); };
  const onMouseUp   = () => { dragging.current = false; };
  const onTouchMove = (e: React.TouchEvent) => updatePos(e.touches[0].clientX);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: "4/3", cursor: "ew-resize" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchStart={(e) => updatePos(e.touches[0].clientX)}
    >
      {/* NA foto (onderste laag) */}
      <img src={na} alt={`${titel} na`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false} />

      {/* VOOR foto (clip) */}
      <div className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={voor} alt={`${titel} voor`}
          className="w-full h-full object-cover"
          draggable={false} />
      </div>

      {/* Divider lijn */}
      <div className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
        style={{ left: `${pos}%`, background: "#fff", boxShadow: "0 0 8px rgba(0,0,0,0.4)" }}>
        {/* Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.25)", left: "50%" }}>
          <div className="flex gap-1">
            <ArrowLeft size={12} style={{ color: "#374151" }} />
            <ArrowRight size={12} style={{ color: "#374151" }} />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
          style={{ background: "rgba(0,0,0,0.55)" }}>VOOR</span>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="text-xs font-bold px-2 py-1 rounded-full text-white"
          style={{ background: "rgba(0,0,0,0.55)" }}>NA</span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const router = useRouter();
  const voorRef = useRef<HTMLInputElement>(null);
  const naRef   = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<PortfolioItem[]>(MOCK_ITEMS);
  const [catFilter, setCatFilter] = useState<Categorie | "alle">("alle");
  const [showDetail, setShowDetail] = useState<PortfolioItem | null>(null);
  const [showNieuw, setShowNieuw] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // New item form
  const [form, setForm] = useState<Partial<PortfolioItem>>({
    categorie: "overig", publiek: true, likes: 0, views: 0,
  });
  const [voorPreview, setVoorPreview] = useState<string | null>(null);
  const [naPreview,   setNaPreview]   = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (catFilter === "alle") return items;
    return items.filter((i) => i.categorie === catFilter);
  }, [items, catFilter]);

  const totaalViews  = items.reduce((s, i) => s + i.views, 0);
  const totaalLikes  = items.reduce((s, i) => s + i.likes, 0);
  const publiekItems = items.filter((i) => i.publiek).length;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handlePhoto = useCallback((side: "voor" | "na", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (side === "voor") {
        setVoorPreview(url);
        setForm((f) => ({ ...f, fotoVoor: url }));
      } else {
        setNaPreview(url);
        setForm((f) => ({ ...f, fotoNa: url }));
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const saveItem = useCallback(() => {
    if (!form.titel || !form.fotoVoor || !form.fotoNa) return;
    const item: PortfolioItem = {
      id: `p${Date.now()}`,
      titel: form.titel,
      beschrijving: form.beschrijving,
      categorie: form.categorie ?? "overig",
      datumAfgerond: form.datumAfgerond ?? new Date().toISOString().slice(0, 10),
      fotoVoor: form.fotoVoor,
      fotoNa:   form.fotoNa,
      klant:    form.klant,
      locatie:  form.locatie,
      duur:     form.duur,
      prijs:    form.prijs,
      publiek:  form.publiek ?? true,
      likes: 0,
      views: 0,
    };
    setItems((prev) => [item, ...prev]);
    setForm({ categorie: "overig", publiek: true, likes: 0, views: 0 });
    setVoorPreview(null);
    setNaPreview(null);
    setShowNieuw(false);
  }, [form]);

  const toggleLike = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, likes: i.likes + 1 } : i));
    if (showDetail?.id === id) setShowDetail((d) => d ? { ...d, likes: d.likes + 1 } : d);
  }, [showDetail]);

  const togglePubliek = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, publiek: !i.publiek } : i));
    if (showDetail?.id === id) setShowDetail((d) => d ? { ...d, publiek: !d.publiek } : d);
  }, [showDetail]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setShowDetail(null);
  }, []);

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
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Portfolio</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Voor & na foto's per klus</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="touch-scale flex items-center gap-1.5 px-4 py-2 rounded-2xl font-bold text-sm text-white"
            style={{ background: "#4F46E5" }}>
            <Plus size={16} />
            Toevoegen
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setCatFilter("alle")}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold"
            style={{
              background: catFilter === "alle" ? "#4F46E5" : "#fff",
              color: catFilter === "alle" ? "#fff" : "#64748b",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
            Alles ({items.length})
          </button>
          {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
            const cnt = items.filter((i) => i.categorie === cat).length;
            if (cnt === 0) return null;
            const cfg = CAT_CFG[cat];
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold"
                style={{
                  background: catFilter === cat ? cfg.color : "#fff",
                  color: catFilter === cat ? "#fff" : "#64748b",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                {cfg.icon} {cfg.label} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Image size={16} style={{ color: "#4F46E5" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{items.length}</p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Projecten</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Eye size={16} style={{ color: "#10B981" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{totaalViews}</p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Bekeken</p>
          </div>
          <div className="rounded-2xl p-3 flex flex-col items-center gap-0.5"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <Heart size={16} style={{ color: "#EF4444" }} />
            <p className="font-black text-xl leading-tight" style={{ color: "#0f172a" }}>{totaalLikes}</p>
            <p className="text-xs text-center" style={{ color: "#94a3b8" }}>Likes</p>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl p-8 text-center"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <p className="text-3xl mb-2">📸</p>
            <p className="font-bold" style={{ color: "#0f172a" }}>Geen projecten gevonden</p>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>Voeg je eerste voor/na project toe</p>
            <button onClick={() => setShowNieuw(true)}
              className="touch-scale mt-4 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "#4F46E5" }}>
              Eerste project toevoegen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => {
              const cfg = CAT_CFG[item.categorie];
              return (
                <button key={item.id}
                  onClick={() => setShowDetail(item)}
                  className="touch-scale rounded-2xl overflow-hidden text-left"
                  style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  {/* Voor/Na thumbnail */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    {/* NA */}
                    <img src={item.fotoNa} alt="na" className="absolute inset-0 w-full h-full object-cover" />
                    {/* VOOR halve overlay */}
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 50% 0 0)" }}>
                      <img src={item.fotoVoor} alt="voor" className="w-full h-full object-cover" />
                    </div>
                    {/* Center divider */}
                    <div className="absolute inset-y-0 left-1/2 w-0.5" style={{ background: "#fff" }} />
                    {/* Labels */}
                    <span className="absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "rgba(0,0,0,0.5)", fontSize: 9 }}>V</span>
                    <span className="absolute top-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "rgba(0,0,0,0.5)", fontSize: 9 }}>N</span>
                    {/* Public badge */}
                    {!item.publiek && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Lock size={10} style={{ color: "#fff" }} />
                      </div>
                    )}
                  </div>

                  {/* Card info */}
                  <div className="p-3">
                    <p className="text-sm font-bold leading-tight" style={{ color: "#0f172a" }}>{item.titel}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Heart size={11} style={{ color: "#EF4444" }} />
                        <span className="text-xs" style={{ color: "#94a3b8" }}>{item.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={11} style={{ color: "#64748b" }} />
                        <span className="text-xs" style={{ color: "#94a3b8" }}>{item.views}</span>
                      </div>
                      {item.rating && <Stars n={item.rating} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail sheet ─────────────────────────────────────────────────────── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[92dvh] flex flex-col"
            style={{ background: "#F1F4FA" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0" style={{ background: "#F1F4FA" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: "#CBD5E1" }} />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>{showDetail.titel}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ color: CAT_CFG[showDetail.categorie].color }}>
                      {CAT_CFG[showDetail.categorie].icon}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "#64748b" }}>
                      {CAT_CFG[showDetail.categorie].label}
                    </span>
                    {showDetail.rating && <Stars n={showDetail.rating} />}
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#E2E8F0" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {/* Interactive slider */}
              <div className="mt-3 mb-4">
                <VoorNaSlider voor={showDetail.fotoVoor} na={showDetail.fotoNa} titel={showDetail.titel} />
                <p className="text-xs text-center mt-2" style={{ color: "#94a3b8" }}>
                  ← Sleep om voor/na te vergelijken →
                </p>
              </div>

              {/* Beschrijving */}
              {showDetail.beschrijving && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>
                  {showDetail.beschrijving}
                </p>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {showDetail.klant    && <DField label="Klant"    value={showDetail.klant} />}
                {showDetail.locatie  && <DField label="Locatie"  value={showDetail.locatie} />}
                {showDetail.duur     && <DField label="Duur"     value={showDetail.duur} />}
                {showDetail.prijs    && <DField label="Prijs"    value={fmtEur(showDetail.prijs)} accent="#10B981" />}
                <DField label="Datum" value={new Date(showDetail.datumAfgerond).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} />
                <DField label="Views" value={`${showDetail.views} × bekeken`} />
              </div>

              {/* Review */}
              {showDetail.klantReview && (
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <div className="flex items-center gap-2 mb-2">
                    {showDetail.rating && <Stars n={showDetail.rating} />}
                    <p className="text-xs font-bold" style={{ color: "#D97706" }}>{showDetail.klant}</p>
                  </div>
                  <p className="text-sm italic" style={{ color: "#374151" }}>"{showDetail.klantReview}"</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => toggleLike(showDetail.id)}
                  className="touch-scale py-3 rounded-2xl flex flex-col items-center gap-1"
                  style={{ background: "#FEF2F2" }}>
                  <Heart size={18} style={{ color: "#EF4444" }} />
                  <span className="text-xs font-bold" style={{ color: "#EF4444" }}>{showDetail.likes}</span>
                </button>
                <button onClick={() => togglePubliek(showDetail.id)}
                  className="touch-scale py-3 rounded-2xl flex flex-col items-center gap-1"
                  style={{ background: showDetail.publiek ? "#ECFDF5" : "#F3F4F6" }}>
                  {showDetail.publiek
                    ? <Globe size={18} style={{ color: "#10B981" }} />
                    : <Lock size={18} style={{ color: "#94a3b8" }} />
                  }
                  <span className="text-xs font-bold" style={{ color: showDetail.publiek ? "#10B981" : "#94a3b8" }}>
                    {showDetail.publiek ? "Publiek" : "Privé"}
                  </span>
                </button>
                <button className="touch-scale py-3 rounded-2xl flex flex-col items-center gap-1"
                  style={{ background: "#EEF2FF" }}>
                  <Share2 size={18} style={{ color: "#4F46E5" }} />
                  <span className="text-xs font-bold" style={{ color: "#4F46E5" }}>Delen</span>
                </button>
              </div>

              <button onClick={() => deleteItem(showDetail.id)}
                className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "#FEF2F2", color: "#EF4444" }}>
                <Trash2 size={16} />
                Project verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nieuw project sheet ──────────────────────────────────────────────── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[32px] overflow-hidden max-h-[92dvh] overflow-y-auto"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}>
            <input ref={voorRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhoto("voor", e)} />
            <input ref={naRef}   type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhoto("na", e)} />

            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5E7EB" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>Nieuw project</h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F3F4F6" }}>
                  <X size={16} style={{ color: "#6B7280" }} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Foto upload */}
                <div className="grid grid-cols-2 gap-3">
                  {/* VOOR */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                      Foto VOOR *
                    </label>
                    <button onClick={() => voorRef.current?.click()}
                      className="touch-scale w-full rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1", background: "#F8FAFC", border: "2px dashed #CBD5E1" }}>
                      {voorPreview ? (
                        <img src={voorPreview} alt="voor" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={24} style={{ color: "#94a3b8" }} />
                          <span className="text-xs" style={{ color: "#94a3b8" }}>Foto voor</span>
                        </div>
                      )}
                    </button>
                  </div>
                  {/* NA */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>
                      Foto NA *
                    </label>
                    <button onClick={() => naRef.current?.click()}
                      className="touch-scale w-full rounded-2xl overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1", background: "#F8FAFC", border: "2px dashed #CBD5E1" }}>
                      {naPreview ? (
                        <img src={naPreview} alt="na" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={24} style={{ color: "#94a3b8" }} />
                          <span className="text-xs" style={{ color: "#94a3b8" }}>Foto na</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Titel */}
                <FormField label="Projectnaam *">
                  <input value={form.titel ?? ""} onChange={(e) => setForm((f) => ({ ...f, titel: e.target.value }))}
                    placeholder="Badkamer renovatie…"
                    className="w-full rounded-2xl px-4 py-3.5 text-sm"
                    style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                </FormField>

                {/* Categorie */}
                <FormField label="Categorie">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
                      const cfg = CAT_CFG[cat];
                      return (
                        <button key={cat} onClick={() => setForm((f) => ({ ...f, categorie: cat }))}
                          className="py-2.5 rounded-xl text-xs font-bold"
                          style={{
                            background: form.categorie === cat ? cfg.color : "#F3F4F6",
                            color: form.categorie === cat ? "#fff" : "#64748b",
                          }}>
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {/* Beschrijving */}
                <FormField label="Beschrijving">
                  <textarea value={form.beschrijving ?? ""} onChange={(e) => setForm((f) => ({ ...f, beschrijving: e.target.value }))}
                    placeholder="Omschrijf het project…" rows={2}
                    className="w-full rounded-2xl px-4 py-3.5 text-sm resize-none"
                    style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                </FormField>

                {/* Klant + locatie */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Klant">
                    <input value={form.klant ?? ""} onChange={(e) => setForm((f) => ({ ...f, klant: e.target.value }))}
                      placeholder="Naam klant…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </FormField>
                  <FormField label="Locatie">
                    <input value={form.locatie ?? ""} onChange={(e) => setForm((f) => ({ ...f, locatie: e.target.value }))}
                      placeholder="Amsterdam…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </FormField>
                </div>

                {/* Duur + prijs */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Duur">
                    <input value={form.duur ?? ""} onChange={(e) => setForm((f) => ({ ...f, duur: e.target.value }))}
                      placeholder="3 uur, 2 dagen…"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </FormField>
                  <FormField label="Prijs (€)">
                    <input type="number" value={form.prijs ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, prijs: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="480"
                      className="w-full rounded-2xl px-4 py-3.5 text-sm"
                      style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                  </FormField>
                </div>

                {/* Datum */}
                <FormField label="Datum afgerond">
                  <input type="date" value={form.datumAfgerond ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, datumAfgerond: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-3.5 text-sm"
                    style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
                </FormField>

                {/* Publiek toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0" }}>
                  <div className="flex items-center gap-3">
                    {form.publiek ? <Globe size={18} style={{ color: "#10B981" }} /> : <Lock size={18} style={{ color: "#94a3b8" }} />}
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#0f172a" }}>
                        {form.publiek ? "Publiek zichtbaar" : "Privé (alleen voor jou)"}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>Zichtbaar op je publiek profiel</p>
                    </div>
                  </div>
                  <button onClick={() => setForm((f) => ({ ...f, publiek: !f.publiek }))}
                    className="w-12 h-7 rounded-full transition-all"
                    style={{ background: form.publiek ? "#10B981" : "#CBD5E1" }}>
                    <div className="w-5 h-5 rounded-full bg-white transition-all mx-1"
                      style={{ transform: form.publiek ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>

                <button onClick={saveItem}
                  disabled={!form.titel || !form.fotoVoor || !form.fotoNa}
                  className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#4F46E5" }}>
                  <Check size={18} />
                  Project opslaan
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
function DField({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "#fff" }}>
      <p className="text-xs font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: accent ?? "#0f172a" }}>{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: "#64748b" }}>{label}</label>
      {children}
    </div>
  );
}
