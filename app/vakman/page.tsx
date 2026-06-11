"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, ChevronRight, Star, CalendarDays, Wallet, Navigation } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, formatEuro, afstandKm, wazeUrl } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

type MiniBoeking = {
  id: string;
  start_tijd: string;
  status: string;
  bedrag: number | null;
  adres: string | null;
  notities: string | null;
  profiles: { name: string } | null;
  opdrachten: { titel: string; lat: number | null; lng: number | null; adres: string | null } | null;
};

type MiniOpdracht = {
  id: string;
  titel: string;
  categorie: string | null;
  budget: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  afstand_km?: number;
};

function tijd(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export default function VakmanHomePage() {
  const { name, role, activeView, setActiveView, userId } = useUserStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [vandaag, setVandaag] = useState<MiniBoeking[]>([]);
  const [nieuwe, setNieuwe] = useState<MiniOpdracht[]>([]);
  const [weekOmzet, setWeekOmzet] = useState(0);
  const [rating, setRating] = useState<{ score: number; count: number } | null>(null);
  const [beschikbaar, setBeschikbaar] = useState<boolean | null>(null);
  const [radiusKm, setRadiusKm] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  // Klant-view hoort op /
  useEffect(() => {
    if (mounted && activeView === "klant") router.replace("/");
  }, [mounted, activeView, router]);

  const laad = useCallback(async () => {
    if (!userId || !supabaseReady) { setLoading(false); return; }

    // Vakman-profiel: rating, beschikbaar, radius
    const { data: vm } = await supabase
      .from("vakmensen")
      .select("rating, review_count, beschikbaar, radius_km")
      .eq("id", userId)
      .maybeSingle();
    const v = vm as { rating: number; review_count: number; beschikbaar: boolean; radius_km: number | null } | null;
    if (v) {
      setRating({ score: Number(v.rating), count: v.review_count });
      setBeschikbaar(v.beschikbaar);
      if (v.radius_km && v.radius_km > 0) setRadiusKm(v.radius_km);
    }

    // Vandaag (max 3)
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const eind = new Date(start); eind.setDate(eind.getDate() + 1);
    const { data: bk } = await supabase
      .from("boekingen")
      .select("id, start_tijd, status, bedrag, adres, notities, profiles!boekingen_klant_id_fkey(name), opdrachten(titel, lat, lng, adres)")
      .eq("vakman_id", userId)
      .gte("start_tijd", start.toISOString())
      .lt("start_tijd", eind.toISOString())
      .in("status", ["gepland", "ingecheckt", "bezig"])
      .order("start_tijd")
      .limit(3);
    setVandaag((bk as unknown as MiniBoeking[]) ?? []);

    // Week-inkomsten (netto, -7%)
    const maandag = new Date(start);
    maandag.setDate(maandag.getDate() - ((maandag.getDay() + 6) % 7));
    const { data: week } = await supabase
      .from("boekingen")
      .select("bedrag")
      .eq("vakman_id", userId)
      .eq("betaald", true)
      .gte("start_tijd", maandag.toISOString());
    setWeekOmzet(Math.round(((week ?? []) as { bedrag: number | null }[]).reduce((t, b) => t + (b.bedrag ?? 0), 0) * 0.93));

    // Nieuwe opdrachten in de buurt (max 3)
    const { data: opd } = await supabase
      .from("opdrachten")
      .select("id, titel, categorie, budget, lat, lng, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(20);
    let rijen = ((opd ?? []) as MiniOpdracht[]);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000, maximumAge: 3600000 }));
      rijen = rijen
        .map(o => o.lat != null && o.lng != null
          ? { ...o, afstand_km: Math.round(afstandKm(pos.coords.latitude, pos.coords.longitude, o.lat, o.lng) * 10) / 10 }
          : o)
        .filter(o => o.afstand_km == null || o.afstand_km <= radiusKm)
        .sort((a, b) => (a.afstand_km ?? 999) - (b.afstand_km ?? 999));
    } catch { /* geen locatie — toon nieuwste */ }
    setNieuwe(rijen.slice(0, 3));
    setLoading(false);
  }, [userId, radiusKm]);

  useEffect(() => { if (mounted) laad(); }, [mounted, laad]);

  const toggleBeschikbaar = async () => {
    if (beschikbaar == null || !userId) return;
    const nieuw = !beschikbaar;
    setBeschikbaar(nieuw);
    await supabase.from("vakmensen").update({ beschikbaar: nieuw } as never).eq("id", userId);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = mounted && name ? name.split(" ")[0] : "";
  const isVakman = !mounted || activeView === "vakman";
  const hasBoth = role === "beide";

  return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5" }} className="animate-fade-in">

      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 2px" }}>{greeting}{firstName ? `, ${firstName}` : ""} 👋</p>
            {rating && rating.count > 0 ? (
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={12} style={{ color: "#C97A4D", fill: "#C97A4D" }} /> {rating.score} · {rating.count} reviews
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>Nog geen reviews</p>
            )}
          </div>

          {hasBoth && (
            <button className="touch-scale" onClick={() => { const next = isVakman ? "klant" : "vakman"; setActiveView(next); router.push(next === "klant" ? "/" : "/vakman"); }}
              style={{ display: "flex", padding: 3, background: "#EDE4D2", borderRadius: 99, border: "none", cursor: "pointer" }}>
              <span style={{ fontSize: 11, padding: "5px 11px", color: isVakman ? "#5C5C56" : "#F5EFE5", background: isVakman ? "transparent" : "#2B4030", borderRadius: 99 }}>Klant</span>
              <span style={{ fontSize: 11, padding: "5px 11px", color: isVakman ? "#F5EFE5" : "#5C5C56", background: isVakman ? "#2B4030" : "transparent", borderRadius: 99, fontWeight: 500 }}>Vakman</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* Beschikbaar-toggle */}
        {beschikbaar != null && (
          <button onClick={toggleBeschikbaar} className="touch-scale" style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            background: beschikbaar ? "#EAF0EC" : "#FBF7F0",
            border: `0.5px solid ${beschikbaar ? "#2B4030" : "#E5DDD0"}`,
            borderRadius: 12, padding: "13px 16px", marginBottom: 14, cursor: "pointer",
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
              background: beschikbaar ? "#16a34a" : "#8A8A83",
            }} className={beschikbaar ? "animate-dot" : ""} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1D1A", flex: 1, textAlign: "left" }}>
              {beschikbaar ? "Beschikbaar voor spoedklussen" : "Niet beschikbaar"}
            </span>
            <span style={{
              padding: 2, width: 40, height: 22, borderRadius: 99, flexShrink: 0,
              background: beschikbaar ? "#2B4030" : "#E5DDD0", position: "relative",
            }}>
              <span style={{
                position: "absolute", top: 2, left: beschikbaar ? 20 : 2,
                width: 18, height: 18, borderRadius: "50%", background: "#FBF7F0",
                transition: "left 0.15s",
              }} />
            </span>
          </button>
        )}

        {/* Grote CTA: feed */}
        <Link href="/feed" style={{ textDecoration: "none", display: "block", marginBottom: 14 }}>
          <div className="touch-scale" style={{
            background: "#2B4030", color: "#F5EFE5", borderRadius: 14, padding: "18px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ClipboardList size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 3px" }}>Nieuwe opdrachten</p>
              <p style={{ fontSize: 12, color: "rgba(245,239,229,0.65)", margin: 0 }}>
                Bekijk de feed en stuur offertes
              </p>
            </div>
            <ChevronRight size={18} style={{ color: "rgba(245,239,229,0.5)", flexShrink: 0 }} />
          </div>
        </Link>

        {/* Week-inkomsten */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12, padding: "14px 16px", marginBottom: 22 }}>
          <Wallet size={17} style={{ color: "#2B4030", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#5C5C56", flex: 1 }}>Inkomsten deze week</span>
          <span style={{ fontFamily: SERIF, fontSize: 20, color: "#2B4030" }}>{formatEuro(weekOmzet)}</span>
        </div>

        {/* Vandaag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: 0 }}>Vandaag</h2>
          <Link href="/agenda" style={{ fontSize: 12, color: "#2B4030", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
            Agenda <ChevronRight size={12} />
          </Link>
        </div>

        {loading && <div className="skeleton" style={{ height: 70, marginBottom: 20 }} />}

        {!loading && vandaag.length === 0 && (
          <div style={{ background: "#FBF7F0", border: "0.5px dashed #E5DDD0", borderRadius: 12, padding: 18, textAlign: "center", marginBottom: 22 }}>
            <CalendarDays size={20} style={{ color: "#8A8A83", margin: "0 auto 6px" }} />
            <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>Vrij vandaag — geen klussen gepland.</p>
          </div>
        )}

        {vandaag.map(b => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <span style={{ fontFamily: SERIF, fontSize: 15, color: "#1A1D1A", flexShrink: 0, width: 42 }}>{tijd(b.start_tijd)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.opdrachten?.titel ?? b.notities ?? "Klus"}
              </p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                {b.profiles?.name ?? "Klant"}{b.bedrag ? ` · ${formatEuro(b.bedrag)}` : ""}
              </p>
            </div>
            {(() => {
              const url = wazeUrl(b.opdrachten?.lat, b.opdrachten?.lng, b.adres ?? b.opdrachten?.adres);
              return url ? (
                <button onClick={() => window.open(url, "_blank")} aria-label="Waze" className="touch-scale" style={{ padding: 8, background: "#EDE4D2", border: "none", borderRadius: 99, cursor: "pointer", display: "flex", color: "#2B4030", flexShrink: 0 }}>
                  <Navigation size={14} />
                </button>
              ) : null;
            })()}
          </div>
        ))}

        {/* Nieuwe opdrachten in de buurt */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0 10px" }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: 0 }}>In de buurt</h2>
          <Link href="/feed" style={{ fontSize: 12, color: "#2B4030", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 2 }}>
            Alle <ChevronRight size={12} />
          </Link>
        </div>

        {!loading && nieuwe.length === 0 && (
          <p style={{ fontSize: 13, color: "#8A8A83", textAlign: "center", padding: "12px 0" }}>
            Geen open opdrachten binnen {radiusKm} km.
          </p>
        )}

        {nieuwe.map(o => (
          <Link key={o.id} href={`/opdracht/${o.id}`} style={{ textDecoration: "none" }}>
            <div className="touch-scale" style={{ display: "flex", alignItems: "center", gap: 12, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.titel}</p>
                <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                  {o.categorie ?? "Klus"}{o.afstand_km != null ? ` · ${o.afstand_km} km` : ""}
                </p>
              </div>
              {o.budget && <span style={{ fontFamily: SERIF, fontSize: 15, color: "#2B4030", flexShrink: 0 }}>{formatEuro(Number(o.budget) || 0)}</span>}
              <ChevronRight size={14} style={{ color: "#8A8A83", flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
