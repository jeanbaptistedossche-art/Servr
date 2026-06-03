"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Camera, Star, Eye, Share2,
  X, Check, ChevronRight, ChevronDown, Image,
  Trash2, Heart, Filter, Globe, Lock,
  ArrowRight, Edit3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Categorie = "loodgieter" | "schilder" | "elektra" | "tegels" | "timmer" | "overig";

type PortfolioItem = {
  id: string;
  titel: string;
  beschrijving?: string;
  categorie: Categorie;
  datumAfgerond: string;
  fotoVoor: string;
  fotoNa: string;
  klant?: string;
  locatie?: string;
  duur?: string;
  prijs?: number;
  rating?: number;
  klantReview?: string;
  publiek: boolean;
  likes: number;
  views: number;
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CFG: Record<Categorie, { label: string; icon: string; color: string; bg: string }> = {
  loodgieter: { label: "Loodgieter",  icon: "🔧", color: "#2B4030", bg: "#EAF0EC" },
  schilder:   { label: "Schilder",    icon: "🖌️", color: "#5C5C56", bg: "#F0EFE8" },
  elektra:    { label: "Elektra",     icon: "⚡", color: "#C97A4D", bg: "#FAF0E6" },
  tegels:     { label: "Tegels",      icon: "🔲", color: "#2B4030", bg: "#EAF0EC" },
  timmer:     { label: "Timmerwerk",  icon: "🔨", color: "#5C5C56", bg: "#F0EFE8" },
  overig:     { label: "Overig",      icon: "⭐", color: "#8A8A83", bg: "#F5EFE5" },
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
        <Star key={i} size={12} fill={i <= n ? "#C97A4D" : "none"} style={{ color: i <= n ? "#C97A4D" : "#E5DDD0" }} />
      ))}
    </div>
  );
}

// ─── Slider component ─────────────────────────────────────────────────────────
function VoorNaSlider({ voor, na, titel }: { voor: string; na: string; titel: string }) {
  const [pos, setPos] = useState(50);
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
      className="relative overflow-hidden select-none"
      style={{ aspectRatio: "4/3", cursor: "ew-resize", borderRadius: 12 }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchStart={(e) => updatePos(e.touches[0].clientX)}
    >
      <img src={na} alt={`${titel} na`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false} />
      <div className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={voor} alt={`${titel} voor`}
          className="w-full h-full object-cover"
          draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
        style={{ left: `${pos}%`, background: "#FBF7F0", boxShadow: "0 0 8px rgba(0,0,0,0.3)" }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "#FBF7F0", boxShadow: "0 2px 12px rgba(0,0,0,0.2)", left: "50%", border: "0.5px solid #E5DDD0" }}>
          <div className="flex gap-1">
            <ArrowLeft size={12} style={{ color: "#5C5C56" }} />
            <ArrowRight size={12} style={{ color: "#5C5C56" }} />
          </div>
        </div>
      </div>
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="text-xs font-semibold px-2 py-1 text-white"
          style={{ background: "rgba(0,0,0,0.5)", borderRadius: 99 }}>VOOR</span>
      </div>
      <div className="absolute top-3 right-3 pointer-events-none">
        <span className="text-xs font-semibold px-2 py-1 text-white"
          style={{ background: "rgba(0,0,0,0.5)", borderRadius: 99 }}>NA</span>
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
              Portfolio
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83" }}>Voor & na foto's per klus</p>
          </div>
          <button onClick={() => setShowNieuw(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
            style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
            <Plus size={15} />
            Toevoegen
          </button>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setCatFilter("alle")}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold"
            style={{
              background: catFilter === "alle" ? "#2B4030" : "transparent",
              color: catFilter === "alle" ? "#F5EFE5" : "#5C5C56",
              borderRadius: 99,
              border: catFilter === "alle" ? "none" : "0.5px solid #E5DDD0",
            }}>
            Alles ({items.length})
          </button>
          {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
            const cnt = items.filter((i) => i.categorie === cat).length;
            if (cnt === 0) return null;
            const cfg = CAT_CFG[cat];
            return (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: catFilter === cat ? "#2B4030" : "transparent",
                  color: catFilter === cat ? "#F5EFE5" : "#5C5C56",
                  borderRadius: 99,
                  border: catFilter === cat ? "none" : "0.5px solid #E5DDD0",
                }}>
                {cfg.icon} {cfg.label} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-28 mt-4 flex flex-col gap-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-bold text-2xl leading-tight"
              style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{items.length}</p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Projecten</p>
          </div>
          <div className="flex flex-col items-center gap-0.5"
            style={{ borderLeft: "0.5px solid #E5DDD0", borderRight: "0.5px solid #E5DDD0" }}>
            <p className="font-bold text-2xl leading-tight"
              style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{totaalViews}</p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Bekeken</p>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <p className="font-bold text-2xl leading-tight"
              style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>{totaalLikes}</p>
            <p className="text-xs text-center" style={{ color: "#8A8A83" }}>Likes</p>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="p-8 text-center"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
            <p className="text-3xl mb-2">📸</p>
            <p className="font-semibold" style={{ color: "#1A1D1A" }}>Geen projecten gevonden</p>
            <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>Voeg je eerste voor/na project toe</p>
            <button onClick={() => setShowNieuw(true)}
              className="mt-4 px-6 py-3 font-semibold text-sm"
              style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
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
                  className="text-left overflow-hidden"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <img src={item.fotoNa} alt="na" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 50% 0 0)" }}>
                      <img src={item.fotoVoor} alt="voor" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-y-0 left-1/2 w-0.5" style={{ background: "#FBF7F0" }} />
                    <span className="absolute top-2 left-2 text-xs font-semibold px-1.5 py-0.5 text-white"
                      style={{ background: "rgba(0,0,0,0.45)", borderRadius: 99, fontSize: 9 }}>V</span>
                    <span className="absolute top-2 right-2 text-xs font-semibold px-1.5 py-0.5 text-white"
                      style={{ background: "rgba(0,0,0,0.45)", borderRadius: 99, fontSize: 9 }}>N</span>
                    {!item.publiek && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.45)" }}>
                        <Lock size={10} style={{ color: "#fff" }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "10px 12px 12px" }}>
                    <p className="text-sm font-semibold leading-tight" style={{ color: "#1A1D1A" }}>{item.titel}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs">{cfg.icon}</span>
                      <span className="text-xs" style={{ color: "#8A8A83" }}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Heart size={11} style={{ color: "#C97A4D" }} />
                        <span className="text-xs" style={{ color: "#8A8A83" }}>{item.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={11} style={{ color: "#8A8A83" }} />
                        <span className="text-xs" style={{ color: "#8A8A83" }}>{item.views}</span>
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
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden max-h-[92dvh] flex flex-col"
            style={{ background: "#F5EFE5" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-2 flex-shrink-0" style={{ background: "#F5EFE5" }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                    {showDetail.titel}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span>{CAT_CFG[showDetail.categorie].icon}</span>
                    <span className="text-xs font-medium" style={{ color: "#5C5C56" }}>
                      {CAT_CFG[showDetail.categorie].label}
                    </span>
                    {showDetail.rating && <Stars n={showDetail.rating} />}
                  </div>
                </div>
                <button onClick={() => setShowDetail(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#8A8A83" }} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="mt-3 mb-4">
                <VoorNaSlider voor={showDetail.fotoVoor} na={showDetail.fotoNa} titel={showDetail.titel} />
                <p className="text-xs text-center mt-2" style={{ color: "#8A8A83" }}>
                  ← Sleep om voor/na te vergelijken →
                </p>
              </div>

              {showDetail.beschrijving && (
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#5C5C56" }}>
                  {showDetail.beschrijving}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-4">
                {showDetail.klant    && <DField label="Klant"    value={showDetail.klant} />}
                {showDetail.locatie  && <DField label="Locatie"  value={showDetail.locatie} />}
                {showDetail.duur     && <DField label="Duur"     value={showDetail.duur} />}
                {showDetail.prijs    && <DField label="Prijs"    value={fmtEur(showDetail.prijs)} accent="#2B4030" />}
                <DField label="Datum" value={new Date(showDetail.datumAfgerond).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })} />
                <DField label="Views" value={`${showDetail.views} × bekeken`} />
              </div>

              {showDetail.klantReview && (
                <div className="p-4 mb-4"
                  style={{ background: "#FAF0E6", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                  <div className="flex items-center gap-2 mb-2">
                    {showDetail.rating && <Stars n={showDetail.rating} />}
                    <p className="text-xs font-medium" style={{ color: "#C97A4D" }}>{showDetail.klant}</p>
                  </div>
                  <p className="text-sm italic" style={{ color: "#5C5C56" }}>"{showDetail.klantReview}"</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-3">
                <button onClick={() => toggleLike(showDetail.id)}
                  className="py-3 flex flex-col items-center gap-1"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                  <Heart size={17} style={{ color: "#C97A4D" }} />
                  <span className="text-xs font-semibold" style={{ color: "#C97A4D" }}>{showDetail.likes}</span>
                </button>
                <button onClick={() => togglePubliek(showDetail.id)}
                  className="py-3 flex flex-col items-center gap-1"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                  {showDetail.publiek
                    ? <Globe size={17} style={{ color: "#2B4030" }} />
                    : <Lock size={17} style={{ color: "#8A8A83" }} />
                  }
                  <span className="text-xs font-semibold" style={{ color: showDetail.publiek ? "#2B4030" : "#8A8A83" }}>
                    {showDetail.publiek ? "Publiek" : "Privé"}
                  </span>
                </button>
                <button className="py-3 flex flex-col items-center gap-1"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                  <Share2 size={17} style={{ color: "#5C5C56" }} />
                  <span className="text-xs font-semibold" style={{ color: "#5C5C56" }}>Delen</span>
                </button>
              </div>

              <button onClick={() => deleteItem(showDetail.id)}
                className="w-full py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "#F9EDEA", color: "#8A3A2A", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                <Trash2 size={15} />
                Project verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nieuw project sheet ──────────────────────────────────────────────── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowNieuw(false)}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-[24px] overflow-hidden max-h-[92dvh] overflow-y-auto"
            style={{ background: "#FBF7F0" }}
            onClick={(e) => e.stopPropagation()}>
            <input ref={voorRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhoto("voor", e)} />
            <input ref={naRef}   type="file" accept="image/*" className="hidden"
              onChange={(e) => handlePhoto("na", e)} />

            <div className="p-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E5DDD0" }} />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold"
                  style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  Nieuw project
                </h2>
                <button onClick={() => setShowNieuw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                  <X size={15} style={{ color: "#8A8A83" }} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Foto upload */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>
                      Foto VOOR *
                    </label>
                    <button onClick={() => voorRef.current?.click()}
                      className="w-full overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1", background: "#F5EFE5", border: "0.5px dashed #E5DDD0", borderRadius: 12 }}>
                      {voorPreview ? (
                        <img src={voorPreview} alt="voor" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={22} style={{ color: "#8A8A83" }} />
                          <span className="text-xs" style={{ color: "#8A8A83" }}>Foto voor</span>
                        </div>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>
                      Foto NA *
                    </label>
                    <button onClick={() => naRef.current?.click()}
                      className="w-full overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1", background: "#F5EFE5", border: "0.5px dashed #E5DDD0", borderRadius: 12 }}>
                      {naPreview ? (
                        <img src={naPreview} alt="na" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera size={22} style={{ color: "#8A8A83" }} />
                          <span className="text-xs" style={{ color: "#8A8A83" }}>Foto na</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                <FormField label="Projectnaam *">
                  <input value={form.titel ?? ""} onChange={(e) => setForm((f) => ({ ...f, titel: e.target.value }))}
                    placeholder="Badkamer renovatie…"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                </FormField>

                <FormField label="Categorie">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CAT_CFG) as Categorie[]).map((cat) => {
                      const cfg = CAT_CFG[cat];
                      return (
                        <button key={cat} onClick={() => setForm((f) => ({ ...f, categorie: cat }))}
                          className="py-2.5 text-xs font-semibold"
                          style={{
                            background: form.categorie === cat ? "#2B4030" : "transparent",
                            color: form.categorie === cat ? "#F5EFE5" : "#5C5C56",
                            borderRadius: 8,
                            border: form.categorie === cat ? "none" : "0.5px solid #E5DDD0",
                          }}>
                          {cfg.icon} {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Beschrijving">
                  <textarea value={form.beschrijving ?? ""} onChange={(e) => setForm((f) => ({ ...f, beschrijving: e.target.value }))}
                    placeholder="Omschrijf het project…" rows={2}
                    className="w-full resize-none"
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none" }} />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Klant">
                    <input value={form.klant ?? ""} onChange={(e) => setForm((f) => ({ ...f, klant: e.target.value }))}
                      placeholder="Naam klant…"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </FormField>
                  <FormField label="Locatie">
                    <input value={form.locatie ?? ""} onChange={(e) => setForm((f) => ({ ...f, locatie: e.target.value }))}
                      placeholder="Amsterdam…"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Duur">
                    <input value={form.duur ?? ""} onChange={(e) => setForm((f) => ({ ...f, duur: e.target.value }))}
                      placeholder="3 uur, 2 dagen…"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </FormField>
                  <FormField label="Prijs (€)">
                    <input type="number" value={form.prijs ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, prijs: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="480"
                      style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                  </FormField>
                </div>

                <FormField label="Datum afgerond">
                  <input type="date" value={form.datumAfgerond ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, datumAfgerond: e.target.value }))}
                    style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#1A1D1A", outline: "none", width: "100%" }} />
                </FormField>

                {/* Publiek toggle */}
                <div className="flex items-center justify-between p-4"
                  style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 12 }}>
                  <div className="flex items-center gap-3">
                    {form.publiek ? <Globe size={17} style={{ color: "#2B4030" }} /> : <Lock size={17} style={{ color: "#8A8A83" }} />}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#1A1D1A" }}>
                        {form.publiek ? "Publiek zichtbaar" : "Privé (alleen voor jou)"}
                      </p>
                      <p className="text-xs" style={{ color: "#8A8A83" }}>Zichtbaar op je publiek profiel</p>
                    </div>
                  </div>
                  <button onClick={() => setForm((f) => ({ ...f, publiek: !f.publiek }))}
                    className="w-12 h-7 rounded-full transition-all"
                    style={{ background: form.publiek ? "#2B4030" : "#E5DDD0" }}>
                    <div className="w-5 h-5 rounded-full bg-white transition-all mx-1"
                      style={{ transform: form.publiek ? "translateX(20px)" : "translateX(0)" }} />
                  </button>
                </div>

                <button onClick={saveItem}
                  disabled={!form.titel || !form.fotoVoor || !form.fotoNa}
                  className="w-full py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: "#2B4030", color: "#F5EFE5", borderRadius: 99, border: "none" }}>
                  <Check size={17} />
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
    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 10, padding: 12 }}>
      <p className="text-xs font-medium mb-0.5" style={{ color: "#8A8A83" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: accent ?? "#1A1D1A" }}>{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "#8A8A83" }}>{label}</label>
      {children}
    </div>
  );
}
