"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft, Clock, Euro, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useUserStore } from "@/lib/store";
import { accepteerOfferte, weigerOfferte } from "@/lib/flow";

const CATEGORIE_ICONS: Record<string, string> = {
  Loodgieter: "🔧",
  Elektricien: "⚡",
  Schilder: "🖌️",
  Schoonmaak: "🧹",
  Timmerman: "🪚",
  Slotenmaker: "🔑",
  HVAC: "❄️",
  Dakdekker: "🏠",
  Tuinman: "🌿",
  Verhuizen: "📦",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open:               { label: "Wacht op offertes",  color: "#C97A4D", bg: "#FAF0E6", icon: "⏳" },
  offerte_ontvangen:  { label: "Offerte ontvangen!",  color: "#2B4030", bg: "#EAF0EC", icon: "📬" },
  bevestigd:          { label: "Bevestigd",           color: "#2B4030", bg: "#EAF0EC", icon: "✅" },
  afgerond:           { label: "Afgerond",            color: "#5C5C56", bg: "#F0EFE8", icon: "🏁" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u geleden`;
  return `${Math.floor(hrs / 24)}d geleden`;
}

type Offerte = {
  id: string;
  opdracht_id: string;
  vakman_id: string;
  prijs: number;
  omschrijving: string;
  eta: string;
  status: string;
  created_at: string;
  vakman?: { name: string } | null;
};

type Opdracht = {
  id: string;
  klant_id: string;
  titel: string;
  beschrijving: string;
  categorie: string;
  adres: string;
  urgentie: string;
  budget: string | null;
  status: string;
  created_at: string;
};

function OfferteRij({
  offerte,
  opdrachtId,
  opdrachtTitel,
  opdrachtAdres,
  onAction,
}: {
  offerte: Offerte;
  opdrachtId: string;
  opdrachtTitel: string;
  opdrachtAdres: string | null;
  onAction: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    let userId = useUserStore.getState().userId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }
    if (!userId) { alert("Niet ingelogd"); setLoading(false); return; }

    const res = await accepteerOfferte(userId, offerte, { id: opdrachtId, titel: opdrachtTitel, adres: opdrachtAdres });
    setLoading(false);
    if (!res.ok) { alert(res.reden); onAction(); return; }
    router.push(`/te-betalen?boeking=${res.boekingId}`);
  };

  const handleWeiger = async () => {
    setLoading(true);
    const err = await weigerOfferte(offerte.id, offerte.vakman_id, opdrachtTitel);
    if (err) console.error(err);
    onAction();
    setLoading(false);
  };

  return (
    <div style={{ background: "#F5EFE5", borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: "#1A1D1A" }}>
            {offerte.vakman?.name ?? "Vakman"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>{offerte.omschrijving}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base" style={{ color: "#2B4030" }}>€{offerte.prijs}</p>
          <p className="text-xs" style={{ color: "#8A8A83" }}>{offerte.eta}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
          style={{ background: "#2B4030" }}
        >
          <CheckCircle size={14} />
          Accepteren
        </button>
        <button
          onClick={handleWeiger}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
          style={{ border: "1.5px solid #E5DDD0", color: "#1A1D1A", background: "transparent" }}
        >
          <XCircle size={14} />
          Weigeren
        </button>
      </div>
    </div>
  );
}

function OpdrachtKaart({
  opdracht,
  offertes,
  highlight,
  onAction,
}: {
  opdracht: Opdracht;
  offertes: Offerte[];
  highlight?: boolean;
  onAction: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[opdracht.status] ?? STATUS_CONFIG.open;
  const wachtende = offertes.filter(o => o.status === "wachtend");
  const icon = CATEGORIE_ICONS[opdracht.categorie] ?? "📋";

  return (
    <div style={{
      background: "#FBF7F0",
      border: highlight ? "1.5px solid #2B4030" : "0.5px solid #E5DDD0",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {highlight && (
        <div className="py-1.5 text-center text-xs font-semibold"
          style={{ background: "#2B4030", color: "#F5EFE5" }}>
          Nieuw geplaatst!
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "#F5EFE5", borderRadius: 10, border: "0.5px solid #E5DDD0" }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#1A1D1A" }}>{opdracht.titel}</p>
            <p className="text-xs mt-0.5" style={{ color: "#8A8A83" }}>
              {opdracht.adres ? `📍 ${opdracht.adres.split(",")[0]} · ` : ""}{timeAgo(opdracht.created_at)}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs font-medium px-2 py-1"
            style={{ background: cfg.bg, color: cfg.color, borderRadius: 99 }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {wachtende.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between p-3 mb-3"
            style={{ background: "#EAF0EC", borderRadius: 10 }}>
            <span className="text-sm font-semibold" style={{ color: "#2B4030" }}>
              {wachtende.length} offerte{wachtende.length > 1 ? "s" : ""} ontvangen — bekijk nu
            </span>
            <ChevronRight
              size={15}
              style={{ color: "#2B4030", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>
        )}

        {expanded && wachtende.map(offerte => (
          <OfferteRij
            key={offerte.id}
            offerte={offerte}
            opdrachtId={opdracht.id}
            opdrachtTitel={opdracht.titel}
            opdrachtAdres={opdracht.adres ?? null}
            onAction={onAction}
          />
        ))}

        <div className="flex items-center gap-3" style={{ borderTop: "0.5px solid #E5DDD0", paddingTop: 12 }}>
          {opdracht.budget && (
            <div className="flex items-center gap-1.5" style={{ color: "#8A8A83" }}>
              <Euro size={12} />
              <span className="text-xs">€{opdracht.budget}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5" style={{ color: "#8A8A83" }}>
            <Clock size={12} />
            <span className="text-xs capitalize">{opdracht.urgentie === "hoog" ? "Spoed" : opdracht.urgentie}</span>
          </div>
          {opdracht.status === "open" && wachtende.length === 0 && (
            <span className="ml-auto text-xs" style={{ color: "#8A8A83" }}>Wacht op reacties...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNieuw = searchParams.get("nieuw") === "1";
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>([]);
  const [offerteMap, setOfferteMap] = useState<Record<string, Offerte[]>>({});
  const [loading, setLoading] = useState(true);

  // Reactief: ook ophalen uit Supabase auth als store leeg is
  const { userId: storeUserId } = useUserStore();
  const [userId, setUserId] = useState<string | null>(storeUserId);

  useEffect(() => {
    if (storeUserId) { setUserId(storeUserId); return; }
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, [storeUserId]);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const { data: opds } = await (supabase.from("opdrachten") as any)
        .select("*")
        .eq("klant_id", uid)
        .order("created_at", { ascending: false });

      const list: Opdracht[] = opds ?? [];
      setOpdrachten(list);

      // Laad alle offertes voor deze opdrachten in één query
      const opdrachtIds = list.map((o: Opdracht) => o.id);
      const { data: alleOffertes } = await (supabase.from("offertes") as any)
        .select("*")
        .in("opdracht_id", opdrachtIds.length ? opdrachtIds : ["none"]);

      // Haal vakman namen op
      const vakmanIds = [...new Set((alleOffertes ?? []).map((o: Offerte) => o.vakman_id))];
      const vakmanNamen: Record<string, string> = {};
      if (vakmanIds.length) {
        const { data: profielen } = await supabase.from("profiles").select("id, name").in("id", vakmanIds);
        (profielen ?? []).forEach((p: { id: string; name: string }) => { vakmanNamen[p.id] = p.name; });
      }

      // Bouw map op
      const map: Record<string, Offerte[]> = {};
      list.forEach((o: Opdracht) => { map[o.id] = []; });
      (alleOffertes ?? []).forEach((off: Offerte) => {
        if (map[off.opdracht_id] !== undefined) {
          map[off.opdracht_id].push({
            ...off,
            vakman: vakmanNamen[off.vakman_id] ? { name: vakmanNamen[off.vakman_id] } : null,
          });
        }
      });
      setOfferteMap(map);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId) loadData(userId);
  }, [userId]);

  // Realtime: herlaad als er een nieuwe offerte binnenkomt
  useEffect(() => {
    if (!supabaseReady || !userId) return;
    const channel = supabase.channel("offertes_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "offertes" },
        () => loadData(userId))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const totalCount = opdrachten.length;
  const openCount = opdrachten.filter(o => o.status === "open").length;
  const bevestigdCount = opdrachten.filter(o => o.status === "bevestigd").length;

  return (
    <div className="min-h-screen" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>
      {/* Sticky header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
              <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
            </button>
            <h1 className="text-xl font-bold"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Mijn opdrachten
            </h1>
          </div>
          <Link href="/opdracht/nieuw"
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#2B4030" }}>
            <Plus size={20} color="#F5EFE5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14 }}>
          {[
            { label: "Totaal",     value: totalCount,    icon: "📋" },
            { label: "Open",       value: openCount,     icon: "⏳" },
            { label: "Bevestigd",  value: bevestigdCount, icon: "✅" },
          ].map((s, idx) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5"
              style={idx === 1 ? { borderLeft: "0.5px solid #E5DDD0", borderRight: "0.5px solid #E5DDD0" } : {}}>
              <p className="font-bold text-xl leading-tight"
                style={{ color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {s.icon} {s.value}
              </p>
              <p className="text-xs" style={{ color: "#8A8A83" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28 mt-4 flex flex-col gap-4">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: "#E5DDD0", borderTopColor: "#2B4030" }} />
          </div>
        )}

        {!loading && opdrachten.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl">🔧</span>
            <p className="font-bold text-lg"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Nog geen opdrachten
            </p>
            <p className="text-sm" style={{ color: "#8A8A83" }}>
              Nog geen opdrachten — tik op + om je eerste klus te plaatsen
            </p>
            <Link href="/opdracht/nieuw"
              className="mt-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white"
              style={{ background: "#2B4030" }}>
              Eerste opdracht plaatsen
            </Link>
          </div>
        )}

        {!loading && opdrachten.length > 0 && (
          <div className="flex flex-col gap-3">
            {opdrachten.map((o, i) => (
              <OpdrachtKaart
                key={o.id}
                opdracht={o}
                offertes={offerteMap[o.id] ?? []}
                highlight={isNieuw && i === 0}
                onAction={() => userId && loadData(userId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MijnOpdrachtenPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
