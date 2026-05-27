"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Edit, CheckCheck, X, ChevronRight,
  Archive, Circle, ArchiveRestore, ArrowLeft, Settings2,
  Phone, Video,
} from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";
import { useUserStore } from "@/lib/store";

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const WA_GREEN = "#25D366";
const WA_DARK  = "#075E54";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "gesprekken" | "whatsapp" | "archief";

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
  via?: "whatsapp";
  phone?: string;
};

// ── Mock in-app gesprekken ────────────────────────────────────────────────────
const GESPREKKEN_INIT: Gesprek[] = [
  {
    id: "p1",
    name: "Marco van den Berg",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMsg: "Duidelijk! Dat is een simpele lekkage. Dat is zo opgelost 🔧",
    time: "10:07",
    unread: 0,
    online: true,
    delivered: true,
    read: true,
    archived: false,
    via: "whatsapp",
    phone: "+31612345678",
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
    phone: "+31670234567",
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
    via: "whatsapp",
    phone: "+31698765432",
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
    phone: "+31670123456",
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
    via: "whatsapp",
    phone: "+31655512345",
  },
];

// ── Mock WhatsApp gesprekken (openen in-app) ──────────────────────────────────
const WA_GESPREKKEN: Gesprek[] = [
  {
    id: "p1",
    name: "Marco van den Berg",
    avatar: "https://i.pravatar.cc/150?img=11",
    lastMsg: "📱 Ik ben er om 14:00, tot dan! 👋",
    time: "14:02",
    unread: 1,
    online: true,
    delivered: true,
    read: false,
    archived: false,
    via: "whatsapp",
    phone: "+31612345678",
  },
  {
    id: "p3",
    name: "Kim Nguyen",
    avatar: "https://i.pravatar.cc/150?img=56",
    lastMsg: "📱 Foto gestuurd van de lekkage ✓✓",
    time: "Gisteren",
    unread: 0,
    online: false,
    delivered: true,
    read: true,
    archived: false,
    via: "whatsapp",
    phone: "+31698765432",
  },
  {
    id: "p5",
    name: "Yusuf Aydın",
    avatar: "https://i.pravatar.cc/150?img=33",
    lastMsg: "📱 Offerte goedgekeurd ✅",
    time: "Ma",
    unread: 2,
    online: true,
    delivered: true,
    read: false,
    archived: false,
    via: "whatsapp",
    phone: "+31655512345",
  },
  {
    id: "wa-petra",
    name: "Petra Jansen",
    avatar: "https://i.pravatar.cc/150?img=49",
    lastMsg: "📱 Wanneer kan je langskomen voor de inspectie?",
    time: "Zo",
    unread: 0,
    online: false,
    delivered: true,
    read: true,
    archived: false,
    via: "whatsapp",
    phone: "+31677889900",
  },
  {
    id: "wa-ahmed",
    name: "Ahmed Mansour",
    avatar: "https://i.pravatar.cc/150?img=51",
    lastMsg: "📱 Hartelijk dank voor de snelle service 🙏",
    time: "Za",
    unread: 0,
    online: false,
    delivered: true,
    read: true,
    archived: false,
    via: "whatsapp",
    phone: "+31688001122",
  },
];

const SWIPE_REVEAL = 152;
const SWIPE_SNAP   = 72;

export default function BerichtenPage() {
  const router = useRouter();
  const markBerichtenRead = useUserStore(s => s.markBerichtenRead);
  const [activeTab, setActiveTab] = useState<Tab>("gesprekken");
  const [query, setQuery] = useState("");
  const [gesprekken, setGesprekken] = useState(GESPREKKEN_INIT);

  // Wis de berichten-badge wanneer de pagina geopend wordt
  useEffect(() => { markBerichtenRead(); }, [markBerichtenRead]);
  const [showNieuw, setShowNieuw] = useState(false);
  const [zoekNieuw, setZoekNieuw] = useState("");

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

  const archiveer = (id: string) => {
    setGesprekken(prev => prev.map(g => g.id === id ? { ...g, archived: true } : g));
    closeAllSwipes();
  };

  const toggleGelezen = (id: string) => {
    setGesprekken(prev => prev.map(g => {
      if (g.id !== id) return g;
      if (g.read || g.unread === 0) return { ...g, unread: 1, read: false };
      return { ...g, unread: 0, read: true };
    }));
    closeAllSwipes();
  };

  const herstelUitArchief = (id: string) => {
    setGesprekken(prev => prev.map(g => g.id === id ? { ...g, archived: false } : g));
  };

  const actief = gesprekken.filter(g =>
    !g.archived &&
    (g.name.toLowerCase().includes(query.toLowerCase()) ||
     g.lastMsg.toLowerCase().includes(query.toLowerCase()))
  );
  const gearchiveerd = gesprekken.filter(g => g.archived);
  const waFiltered = WA_GESPREKKEN.filter(g =>
    g.name.toLowerCase().includes(query.toLowerCase()) ||
    g.lastMsg.toLowerCase().includes(query.toLowerCase())
  );

  const totaalOngelezen = gesprekken.filter(g => !g.archived).reduce((s, g) => s + g.unread, 0);
  const waOngelezen = WA_GESPREKKEN.reduce((s, g) => s + g.unread, 0);

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

  // ── Gesprek rij ───────────────────────────────────────────────────────────
  const renderRow = (g: Gesprek, isArchief = false) => {
    const offset = swipeOffsets[g.id] ?? 0;
    const isOpen = openSwipeId === g.id;
    const isRead = g.unread === 0 && g.read;

    return (
      <div key={g.id} className="relative overflow-hidden border-b"
        style={{ borderColor: "var(--border)" }}>

        <div className="absolute inset-y-0 left-0 flex" style={{ width: SWIPE_REVEAL }}>
          {!isArchief ? (
            <button onClick={e => { e.stopPropagation(); archiveer(g.id); }}
              className="flex flex-col items-center justify-center gap-1 flex-1"
              style={{ background: "#475569" }}>
              <Archive size={17} color="white" />
              <span className="text-[9px] text-white font-black uppercase tracking-wide">Archief</span>
            </button>
          ) : (
            <button onClick={e => { e.stopPropagation(); herstelUitArchief(g.id); }}
              className="flex flex-col items-center justify-center gap-1 flex-1"
              style={{ background: "#475569" }}>
              <ArchiveRestore size={17} color="white" />
              <span className="text-[9px] text-white font-black uppercase tracking-wide">Herstel</span>
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); toggleGelezen(g.id); }}
            className="flex flex-col items-center justify-center gap-1 flex-1"
            style={{ background: "var(--teal)" }}>
            {isRead ? <Circle size={17} color="white" /> : <CheckCheck size={17} color="white" />}
            <span className="text-[9px] text-white font-black uppercase tracking-wide">
              {isRead ? "Ongeopend" : "Gelezen"}
            </span>
          </button>
        </div>

        <Link
          href={`/chat/${g.id}`}
          onClick={e => {
            if (isOpen) { e.preventDefault(); closeAllSwipes(); return; }
            if (g.unread > 0) {
              setGesprekken(prev => prev.map(x => x.id === g.id ? { ...x, unread: 0, read: true } : x));
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
          <div className="relative flex-shrink-0">
            <img src={g.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
            {g.online && (
              <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 bg-green-500"
                style={{ borderColor: "var(--background)" }} />
            )}
            {g.via === "whatsapp" && (
              <span className={`absolute ${g.online ? "top-0" : "bottom-0"} right-0 w-4 h-4 rounded-full flex items-center justify-center border border-white`}
                style={{ background: WA_GREEN }}>
                <WaIcon size={9} color="white" />
              </span>
            )}
          </div>

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
              {isRead && <CheckCheck size={13} style={{ color: "var(--teal)", flexShrink: 0 }} />}
              {!isRead && g.unread === 0 && g.delivered && (
                <CheckCheck size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
              )}
              <p className="text-sm truncate"
                style={{ color: g.unread > 0 ? "var(--foreground)" : "var(--muted)", fontWeight: g.unread > 0 ? 600 : 400 }}>
                {g.lastMsg}
              </p>
            </div>
            {g.via === "whatsapp" && (
              <div className="flex items-center gap-1 mt-0.5">
                <WaIcon size={9} color={WA_GREEN} />
                <span className="text-[10px]" style={{ color: WA_GREEN }}>WhatsApp</span>
              </div>
            )}
          </div>

          {/* Quick action buttons — must be <button> not <a>/<Link> since parent is already <Link> */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
            {g.phone && (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${g.phone}`; }}
                className="w-8 h-8 rounded-full flex items-center justify-center touch-scale"
                style={{ background: "#F1F5F9" }}>
                <Phone size={13} style={{ color: "#4F46E5" }} />
              </button>
            )}
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push("/video-bellen"); }}
              className="w-8 h-8 rounded-full flex items-center justify-center touch-scale"
              style={{ background: "#F1F5F9" }}>
              <Video size={13} style={{ color: "#4F46E5" }} />
            </button>
            {g.unread > 0 && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--teal)" }}>
                <span className="text-[9px] font-black text-white">{g.unread}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  };

  // ── WhatsApp rij (navigeert ook in-app) ─────────────────────────────────
  const renderWaRow = (g: Gesprek) => (
    <Link
      key={g.id}
      href={`/chat/${g.id}?channel=whatsapp`}
      className="flex items-center gap-3 px-5 py-4 border-b active:opacity-70"
      style={{ borderColor: "var(--border)", background: "var(--background)" }}
    >
      <div className="relative flex-shrink-0">
        <img src={g.avatar} className="w-14 h-14 rounded-full object-cover" alt="" />
        {g.online && (
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 bg-green-500"
            style={{ borderColor: "var(--background)" }} />
        )}
        <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2"
          style={{ background: WA_GREEN, borderColor: "var(--background)" }}>
          <WaIcon size={11} color="white" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-bold text-sm truncate"
            style={{ fontWeight: g.unread > 0 ? 800 : 600 }}>
            {g.name}
          </p>
          <span className="text-[11px] flex-shrink-0"
            style={{ color: g.unread > 0 ? WA_GREEN : "var(--muted)", fontWeight: g.unread > 0 ? 700 : 400 }}>
            {g.time}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {g.unread === 0 && g.read && <CheckCheck size={13} style={{ color: WA_GREEN, flexShrink: 0 }} />}
          {g.unread === 0 && !g.read && g.delivered && <CheckCheck size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />}
          <p className="text-sm truncate"
            style={{ color: g.unread > 0 ? "var(--foreground)" : "var(--muted)", fontWeight: g.unread > 0 ? 600 : 400 }}>
            {g.lastMsg}
          </p>
        </div>
      </div>

      {g.unread > 0 && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: WA_GREEN }}>
          <span className="text-[10px] font-black text-white">{g.unread}</span>
        </div>
      )}
    </Link>
  );

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
              {(totaalOngelezen + waOngelezen) > 0 && (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {totaalOngelezen + waOngelezen} ongelezen
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

        {/* Tabs */}
        <div className="flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); setActiveTab("gesprekken"); closeAllSwipes(); }}
            className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold"
            style={{
              background: activeTab === "gesprekken" ? "var(--teal)" + "18" : "var(--surface-2)",
              color: activeTab === "gesprekken" ? "var(--teal)" : "var(--muted)",
            }}>
            💬 Gesprekken
            {totaalOngelezen > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white text-[9px] font-black"
                style={{ background: "var(--teal)" }}>
                {totaalOngelezen}
              </span>
            )}
          </button>

          <button onClick={e => { e.stopPropagation(); setActiveTab("whatsapp"); closeAllSwipes(); }}
            className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
            style={{
              background: activeTab === "whatsapp" ? WA_GREEN + "18" : "var(--surface-2)",
              color: activeTab === "whatsapp" ? WA_DARK : "var(--muted)",
            }}>
            <WaIcon size={11} color={activeTab === "whatsapp" ? WA_DARK : "var(--muted)"} />
            WhatsApp
            {waOngelezen > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-[9px] font-black"
                style={{ background: WA_GREEN }}>
                {waOngelezen}
              </span>
            )}
          </button>

          <button onClick={e => { e.stopPropagation(); setActiveTab("archief"); closeAllSwipes(); }}
            className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold"
            style={{
              background: activeTab === "archief" ? "var(--teal)" + "18" : "var(--surface-2)",
              color: activeTab === "archief" ? "var(--teal)" : "var(--muted)",
            }}>
            🗂️ Archief
            {gearchiveerd.length > 0 && (
              <span className="ml-1 text-[10px]" style={{ color: "var(--muted)" }}>
                ({gearchiveerd.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── WhatsApp tab ── */}
      {activeTab === "whatsapp" && (
        <div className="flex flex-col">

          {/* WA Business header */}
          <div className="mx-4 mt-4 mb-3 rounded-2xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${WA_DARK} 0%, ${WA_GREEN} 100%)` }}>
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <WaIcon size={26} color="white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-base text-white">WhatsApp Business</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse" />
                  <span className="text-xs text-white/80">Verbonden · Berichten in de app</span>
                </div>
              </div>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center touch-scale"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Settings2 size={16} color="white" />
              </button>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              {[
                { label: "Berichten", value: "247" },
                { label: "Gesprekken", value: "18" },
                { label: "Reactietijd", value: "< 5 min" },
              ].map(s => (
                <div key={s.label} className="rounded-xl px-3 py-2 text-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}>
                  <p className="font-black text-sm text-white">{s.value}</p>
                  <p className="text-[10px] text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}>
            WhatsApp gesprekken
          </p>

          {waFiltered.map(renderWaRow)}

          {waFiltered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: WA_GREEN + "15" }}>
                <WaIcon size={32} color={WA_GREEN} />
              </div>
              <p className="font-bold">Geen WhatsApp gesprekken</p>
              <p className="text-sm text-center px-8" style={{ color: "var(--muted)" }}>
                Berichten via WhatsApp Business verschijnen hier in de app
              </p>
            </div>
          )}

          <div className="pb-8" />
        </div>
      )}

      {/* ── Gesprekken / Archief ── */}
      {(activeTab === "gesprekken" || activeTab === "archief") && (
        <div className="flex flex-col">
          {(activeTab === "gesprekken" ? actief : gearchiveerd).map(g =>
            renderRow(g, activeTab === "archief")
          )}

          {(activeTab === "gesprekken" ? actief : gearchiveerd).length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3">
              <span className="text-5xl">{activeTab === "archief" ? "🗂️" : "💬"}</span>
              <p className="font-bold text-base">
                {activeTab === "archief" ? "Archief is leeg" : "Geen gesprekken"}
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {activeTab === "archief"
                  ? "Gearchiveerde gesprekken verschijnen hier"
                  : query ? "Geen resultaten" : "Start een gesprek via een vakmansprofiel"}
              </p>
              {!query && activeTab === "gesprekken" && (
                <Link href="/search"
                  className="touch-scale mt-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "var(--teal)" }}>
                  Vakmensen zoeken
                </Link>
              )}
            </div>
          )}

          {activeTab === "gesprekken" && actief.length > 0 && (
            <div className="px-5 py-3 flex items-center gap-2" style={{ opacity: 0.45 }}>
              <span className="text-sm">👈</span>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                Swipe naar rechts voor archiveren of markeren
              </p>
            </div>
          )}

          <div className="pb-8" />
        </div>
      )}

      {/* ── Nieuw bericht modal ── */}
      {showNieuw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={e => { if (e.target === e.currentTarget) { setShowNieuw(false); setZoekNieuw(""); } }}>
          <div className="w-full max-w-[440px] rounded-3xl flex flex-col animate-fade-in"
            style={{ background: "var(--background)", maxHeight: "78dvh", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

            <div className="flex items-center gap-3 px-5 pt-5 pb-4"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => { setShowNieuw(false); setZoekNieuw(""); }}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-2)" }}>
                <X size={15} style={{ color: "var(--muted)" }} />
              </button>
              <p className="font-black text-base flex-1">Nieuw bericht</p>
            </div>

            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{ background: "var(--surface-2)" }}>
                <Search size={15} style={{ color: "var(--muted)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Zoek een vakman of klant..."
                  value={zoekNieuw}
                  onChange={e => setZoekNieuw(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--foreground)" }}
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {alleVakmensen.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Niemand gevonden</p>
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
