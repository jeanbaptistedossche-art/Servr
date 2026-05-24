"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Edit, Check, CheckCheck, X, ChevronRight, Archive, Circle, ArchiveRestore, ArrowLeft } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

type Gesprek = {
  id: string;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  delivered: boolean;
  read: boolean;
  archived: boolean;
};

const GESPREKKEN_INIT: Gesprek[] = [
  {
    id: "p1",
    name: "Marco van den Berg",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMsg: "Duidelijk! Dat is een simpele lekkage bij de aansluiting. Dat is zo opgelost 🔧",
    time: "10:07",
    unread: 0,
    online: true,
    delivered: true,
    read: true,
    archived: false,
  },
  {
    id: "p2",
    name: "Sofia Martins",
    avatar: "https://i.pravatar.cc/150?img=47",
    lastMsg: "Ik kan morgen om 9:00 langskomen voor de schoonmaak.",
    time: "Gisteren",
    unread: 2,
    online: true,
    delivered: true,
    read: false,
    archived: false,
  },
  {
    id: "p3",
    name: "Kim Nguyen",
    avatar: "https://i.pravatar.cc/150?img=56",
    lastMsg: "De offerte is verstuurd. Neem even de tijd om te bekijken!",
    time: "Ma",
    unread: 1,
    online: false,
    delivered: true,
    read: false,
    archived: false,
  },
  {
    id: "p4",
    name: "Lars Visser",
    avatar: "https://i.pravatar.cc/150?img=7",
    lastMsg: "Top, ik zie je dan dinsdag! 👍",
    time: "Zo",
    unread: 0,
    online: false,
    delivered: true,
    read: true,
    archived: false,
  },
  {
    id: "p5",
    name: "Yusuf Aydın",
    avatar: "https://i.pravatar.cc/150?img=33",
    lastMsg: "Kan ik ook een foto sturen van de meterkast?",
    time: "Vr",
    unread: 0,
    online: true,
    delivered: true,
    read: true,
    archived: false,
  },
];

// Swipe constants
const SWIPE_REVEAL = 152; // total width of action buttons (2 × 76px)
const SWIPE_SNAP   = 72;  // threshold to snap open vs snap back

export default function BerichtenPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [gesprekken, setGesprekken] = useState(GESPREKKEN_INIT);
  const [showNieuw, setShowNieuw] = useState(false);
  const [zoekNieuw, setZoekNieuw] = useState("");
  const [showArchief, setShowArchief] = useState(false);

  // ─── Swipe state ─────────────────────────────────────────────────
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const touchStartX = useRef<Record<string, number>>({});
  const touchActive = useRef<Record<string, boolean>>({});

  const closeAllSwipes = useCallback(() => {
    setSwipeOffsets({});
    setOpenSwipeId(null);
  }, []);

  const onTouchStart = (id: string, e: React.TouchEvent) => {
    touchStartX.current[id] = e.touches[0].clientX;
    touchActive.current[id] = false;
    // close other open swipes
    if (openSwipeId && openSwipeId !== id) {
      setSwipeOffsets(s => ({ ...s, [openSwipeId]: 0 }));
      setOpenSwipeId(null);
    }
  };

  const onTouchMove = (id: string, e: React.TouchEvent) => {
    const startX = touchStartX.current[id] ?? e.touches[0].clientX;
    const delta = e.touches[0].clientX - startX;

    if (delta > 8 || touchActive.current[id]) {
      touchActive.current[id] = true;
      const clamped = Math.min(Math.max(delta, 0), SWIPE_REVEAL + 20);
      setSwipeOffsets(s => ({ ...s, [id]: clamped }));
    }
  };

  const onTouchEnd = (id: string) => {
    const offset = swipeOffsets[id] ?? 0;
    if (offset > SWIPE_SNAP) {
      setSwipeOffsets(s => ({ ...s, [id]: SWIPE_REVEAL }));
      setOpenSwipeId(id);
    } else {
      setSwipeOffsets(s => ({ ...s, [id]: 0 }));
      setOpenSwipeId(null);
    }
    touchActive.current[id] = false;
  };

  // ─── Acties ──────────────────────────────────────────────────────
  const archiveer = (id: string) => {
    setGesprekken(prev => prev.map(g => g.id === id ? { ...g, archived: true } : g));
    closeAllSwipes();
  };

  const toggleGelezen = (id: string) => {
    setGesprekken(prev => prev.map(g => {
      if (g.id !== id) return g;
      if (g.read || g.unread === 0) {
        return { ...g, unread: 1, read: false };   // markeer ongeopend
      } else {
        return { ...g, unread: 0, read: true };    // markeer gelezen
      }
    }));
    closeAllSwipes();
  };

  const herstelUitArchief = (id: string) => {
    setGesprekken(prev => prev.map(g => g.id === id ? { ...g, archived: false } : g));
  };

  // ─── Filters ─────────────────────────────────────────────────────
  const bestaandeIds = gesprekken.map(g => g.id);
  const alleVakmensen = PROVIDERS.filter(p =>
    p.name.toLowerCase().includes(zoekNieuw.toLowerCase()) ||
    p.category.toLowerCase().includes(zoekNieuw.toLowerCase())
  );

  const startGesprek = (p: typeof PROVIDERS[0]) => {
    if (!bestaandeIds.includes(p.id)) {
      setGesprekken(prev => [{
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        lastMsg: "Start een gesprek...",
        time: "Nu",
        unread: 0,
        online: p.available,
        delivered: false,
        read: false,
        archived: false,
      }, ...prev]);
    }
    setShowNieuw(false);
    setZoekNieuw("");
    router.push(`/chat/${p.id}`);
  };

  const actief    = gesprekken.filter(g => !g.archived && (g.name.toLowerCase().includes(query.toLowerCase()) || g.lastMsg.toLowerCase().includes(query.toLowerCase())));
  const gearchiveerd = gesprekken.filter(g => g.archived);
  const visible   = showArchief ? gearchiveerd : actief;
  const totaalOngelezen = gesprekken.filter(g => !g.archived).reduce((s, g) => s + g.unread, 0);

  return (
    <div className="flex flex-col min-h-full animate-fade-in" onClick={closeAllSwipes}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/profile"
              className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--surface-2)" }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-black text-2xl">Berichten</h1>
              {totaalOngelezen > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {totaalOngelezen} ongelezen
                </p>
              )}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setShowNieuw(true); }}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "var(--teal)" + "15" }}>
            <Edit size={17} style={{ color: "var(--teal)" }} />
          </button>
        </div>

        {/* Zoekbalk */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl mb-3"
          style={{ background: "var(--surface-2)" }}>
          <Search size={16} style={{ color: "var(--muted)" }} />
          <input
            type="text"
            placeholder="Zoek gesprekken..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="touch-scale">
              <X size={14} style={{ color: "var(--muted)" }} />
            </button>
          )}
        </div>

        {/* Archief tab */}
        <div className="flex gap-2">
          <button onClick={e => { e.stopPropagation(); setShowArchief(false); }}
            className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: !showArchief ? "var(--teal)" + "18" : "var(--surface-2)",
              color: !showArchief ? "var(--teal)" : "var(--muted)",
            }}>
            💬 Gesprekken
            {totaalOngelezen > 0 && !showArchief && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-black"
                style={{ background: "var(--teal)" }}>
                {totaalOngelezen}
              </span>
            )}
          </button>
          <button onClick={e => { e.stopPropagation(); setShowArchief(true); closeAllSwipes(); }}
            className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              background: showArchief ? "var(--teal)" + "18" : "var(--surface-2)",
              color: showArchief ? "var(--teal)" : "var(--muted)",
            }}>
            🗂️ Archief
            {gearchiveerd.length > 0 && (
              <span className="ml-1.5 text-[10px]" style={{ color: "var(--muted)" }}>
                ({gearchiveerd.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Gesprekken */}
      <div className="flex flex-col">
        {visible.map(g => {
          const offset = swipeOffsets[g.id] ?? 0;
          const isOpen = openSwipeId === g.id;
          const isRead = g.unread === 0 && g.read;

          return (
            <div key={g.id} className="relative overflow-hidden border-b"
              style={{ borderColor: "var(--border)" }}>

              {/* ── Swipe actie-knoppen (links, worden onthuld) ── */}
              <div className="absolute inset-y-0 left-0 flex"
                style={{ width: SWIPE_REVEAL }}>
                {/* Archiveer knop */}
                {!showArchief ? (
                  <button
                    onClick={e => { e.stopPropagation(); archiveer(g.id); }}
                    className="flex flex-col items-center justify-center gap-1 flex-1"
                    style={{ background: "#475569" }}>
                    <Archive size={17} color="white" />
                    <span className="text-[9px] text-white font-black uppercase tracking-wide">Archief</span>
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); herstelUitArchief(g.id); }}
                    className="flex flex-col items-center justify-center gap-1 flex-1"
                    style={{ background: "#475569" }}>
                    <ArchiveRestore size={17} color="white" />
                    <span className="text-[9px] text-white font-black uppercase tracking-wide">Herstel</span>
                  </button>
                )}

                {/* Gelezen / Ongeopend knop */}
                <button
                  onClick={e => { e.stopPropagation(); toggleGelezen(g.id); }}
                  className="flex flex-col items-center justify-center gap-1 flex-1"
                  style={{ background: "var(--teal)" }}>
                  {isRead
                    ? <Circle size={17} color="white" />
                    : <CheckCheck size={17} color="white" />
                  }
                  <span className="text-[9px] text-white font-black uppercase tracking-wide">
                    {isRead ? "Ongeopend" : "Gelezen"}
                  </span>
                </button>
              </div>

              {/* ── Gesprek rij (schuift naar rechts) ── */}
              <Link
                href={`/chat/${g.id}`}
                onClick={e => {
                  if (isOpen) { e.preventDefault(); closeAllSwipes(); return; }
                  if (g.unread > 0) {
                    setGesprekken(prev =>
                      prev.map(x => x.id === g.id ? { ...x, unread: 0, read: true } : x)
                    );
                  }
                }}
                onTouchStart={e => { e.stopPropagation(); onTouchStart(g.id, e); }}
                onTouchMove={e => { e.stopPropagation(); onTouchMove(g.id, e); }}
                onTouchEnd={e => { e.stopPropagation(); onTouchEnd(g.id); }}
                className="flex items-center gap-3 px-5 py-4 active:bg-gray-50"
                style={{
                  transform: `translateX(${offset}px)`,
                  transition: touchActive.current[g.id] ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)",
                  background: "var(--background)",
                  position: "relative",
                  zIndex: 1,
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {/* Avatar + online dot */}
                <div className="relative flex-shrink-0">
                  <img src={g.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
                  {g.online && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 bg-green-500"
                      style={{ borderColor: "var(--background)" }} />
                  )}
                </div>

                {/* Tekst */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-bold text-sm truncate"
                      style={{ fontWeight: g.unread > 0 ? 800 : 600 }}>
                      {g.name}
                    </p>
                    <span className="text-[11px] flex-shrink-0"
                      style={{ color: g.unread > 0 ? "var(--teal)" : "var(--muted)", fontWeight: g.unread > 0 ? 700 : 400 }}>
                      {g.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {g.unread === 0 && g.read && (
                      <CheckCheck size={13} style={{ color: "var(--teal)", flexShrink: 0 }} />
                    )}
                    {g.unread === 0 && !g.read && g.delivered && (
                      <CheckCheck size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    )}
                    <p className="text-sm truncate"
                      style={{
                        color: g.unread > 0 ? "var(--foreground)" : "var(--muted)",
                        fontWeight: g.unread > 0 ? 600 : 400,
                      }}>
                      {g.lastMsg}
                    </p>
                  </div>
                </div>

                {/* Ongelezen badge */}
                {g.unread > 0 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--teal)" }}>
                    <span className="text-[10px] font-black text-white">{g.unread}</span>
                  </div>
                )}
              </Link>
            </div>
          );
        })}

        {/* Lege staat */}
        {visible.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="text-5xl">{showArchief ? "🗂️" : "💬"}</span>
            <p className="font-bold text-base">
              {showArchief ? "Archief is leeg" : "Geen gesprekken"}
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {showArchief
                ? "Gearchiveerde gesprekken verschijnen hier"
                : query ? "Geen resultaten voor je zoekopdracht" : "Start een gesprek via een vakmansprofiel"}
            </p>
            {!query && !showArchief && (
              <Link href="/search"
                className="touch-scale mt-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: "var(--teal)" }}>
                Vakmensen zoeken
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Swipe hint (eerste keer) */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ opacity: 0.45 }}>
        <span className="text-sm">👈</span>
        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
          Swipe naar rechts voor archiveren of markeren
        </p>
      </div>

      <div className="pb-8" />

      {/* Nieuw bericht modal */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowNieuw(false); setZoekNieuw(""); } }}>
          <div className="w-full max-w-[440px] rounded-3xl flex flex-col animate-fade-in"
            style={{ background: "var(--background)", maxHeight: "78dvh", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => { setShowNieuw(false); setZoekNieuw(""); }}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-2)" }}>
                <X size={15} style={{ color: "var(--muted)" }} />
              </button>
              <p className="font-black text-base flex-1">Nieuw bericht</p>
            </div>

            {/* Zoekbalk */}
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{ background: "var(--surface-2)" }}>
                <Search size={15} style={{ color: "var(--muted)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Zoek een vakman..."
                  value={zoekNieuw}
                  onChange={e => setZoekNieuw(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--foreground)" }}
                />
              </div>
            </div>

            {/* Lijst vakmensen */}
            <div className="overflow-y-auto flex-1">
              {alleVakmensen.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Geen vakmensen gevonden</p>
                </div>
              ) : (
                alleVakmensen.map(p => (
                  <button key={p.id} onClick={() => startGesprek(p)}
                    className="touch-scale w-full flex items-center gap-3 px-5 py-3.5 text-left"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="relative flex-shrink-0">
                      <img src={p.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                      {p.available && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2"
                          style={{ borderColor: "var(--background)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {p.categoryIcon} {p.category} · {p.distance}
                      </p>
                    </div>
                    {bestaandeIds.includes(p.id)
                      ? <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                          style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                          Open
                        </span>
                      : <ChevronRight size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                    }
                  </button>
                ))
              )}
              <div className="h-6" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
