"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Award } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, formatEuro, stuurNotificatie, type Review } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

type ReviewRij = Review & {
  klant: { name: string } | null;
  vakman: { profiles: { name: string } | null } | null;
};

type TeBeoordelen = {
  id: string;                 // boeking id
  klant_id: string;
  vakman_id: string;
  notities: string | null;
  bedrag: number | null;
  profiles: { name: string } | null;   // de andere partij
  opdrachten: { titel: string } | null;
};

function tijdLabel(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "vandaag";
  if (d === 1) return "gisteren";
  if (d < 30) return `${d} dagen geleden`;
  return new Date(iso).toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}

function Sterren({ score, size = 13 }: { score: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size} style={{
          color: s <= score ? "#C97A4D" : "#E5DDD0",
          fill: s <= score ? "#C97A4D" : "transparent",
        }} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const { userId, activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVakman = mounted && activeView === "vakman";

  const [ontvangen, setOntvangen] = useState<ReviewRij[]>([]);
  const [gegeven, setGegeven] = useState<ReviewRij[]>([]);
  const [teBeoordelen, setTeBeoordelen] = useState<TeBeoordelen[]>([]);
  const [stats, setStats] = useState<{ rating: number; count: number; klussen: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ontvangen" | "gegeven">("ontvangen");

  // Review-form state
  const [openForm, setOpenForm] = useState<string | null>(null);   // boeking id
  const [score, setScore] = useState(0);
  const [tekst, setTekst] = useState("");
  const [busy, setBusy] = useState(false);

  const laad = useCallback(async () => {
    if (!userId || !supabaseReady) { setLoading(false); return; }
    const mijnVeld = isVakman ? "vakman_id" : "klant_id";
    const mijnRol = isVakman ? "vakman" : "klant";
    const andereRol = isVakman ? "klant" : "vakman";

    const reviewSelect = "*, klant:profiles!reviews_klant_id_fkey(name), vakman:vakmensen!reviews_vakman_id_fkey(profiles(name))";

    // Ontvangen: reviews over mij, geschreven door de andere rol
    const { data: ontv } = await supabase
      .from("reviews")
      .select(reviewSelect)
      .eq(mijnVeld, userId)
      .eq("reviewer_rol", andereRol)
      .order("created_at", { ascending: false });
    setOntvangen((ontv as unknown as ReviewRij[]) ?? []);

    // Gegeven: reviews door mij
    const { data: gegv } = await supabase
      .from("reviews")
      .select(reviewSelect)
      .eq(mijnVeld, userId)
      .eq("reviewer_rol", mijnRol)
      .order("created_at", { ascending: false });
    setGegeven((gegv as unknown as ReviewRij[]) ?? []);

    // Nog te beoordelen: afgeronde boekingen zonder eigen review
    const naamJoin = isVakman
      ? "profiles!boekingen_klant_id_fkey(name)"
      : "profiles!boekingen_vakman_id_fkey(name)";
    const { data: klaar } = await supabase
      .from("boekingen")
      .select(`id, klant_id, vakman_id, notities, bedrag, ${naamJoin}, opdrachten(titel)`)
      .eq(mijnVeld, userId)
      .in("status", ["afgerond", "bevestigd", "uitbetaald"]);
    const klaarRijen = (klaar as unknown as TeBeoordelen[]) ?? [];
    const eigenReviewBoekingen = new Set(((gegv as unknown as Review[]) ?? []).map(r => r.boeking_id));
    setTeBeoordelen(klaarRijen.filter(b => !eigenReviewBoekingen.has(b.id)));

    // Vakman-stats voor badge
    if (isVakman) {
      const { data: vm } = await supabase
        .from("vakmensen")
        .select("rating, review_count, klus_count")
        .eq("id", userId)
        .maybeSingle();
      const v = vm as { rating: number; review_count: number; klus_count: number } | null;
      if (v) setStats({ rating: Number(v.rating), count: v.review_count, klussen: v.klus_count });
    }
    setLoading(false);
  }, [userId, isVakman]);

  useEffect(() => { if (mounted) laad(); }, [mounted, laad]);

  const verstuurReview = async (b: TeBeoordelen) => {
    if (!userId || score === 0 || busy) return;
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      boeking_id: b.id,
      klant_id: b.klant_id,
      vakman_id: b.vakman_id,
      score,
      tekst: tekst.trim() || null,
      reviewer_rol: isVakman ? "vakman" : "klant",
    } as never);
    setBusy(false);
    if (error) { alert("Review opslaan mislukt: " + error.message); return; }
    stuurNotificatie({
      user_id: isVakman ? b.klant_id : b.vakman_id,
      type: "review_ontvangen",
      titel: `Nieuwe review: ${"★".repeat(score)}`,
      bericht: `${b.opdrachten?.titel ?? b.notities ?? "Een klus"} — je ontving een beoordeling.`,
      link: "/reviews",
    });
    setOpenForm(null);
    setScore(0);
    setTekst("");
    laad();
  };

  const gemiddelde = ontvangen.length > 0
    ? Math.round((ontvangen.reduce((s, r) => s + r.score, 0) / ontvangen.length) * 10) / 10
    : null;
  const topVakman = isVakman && stats != null && stats.rating >= 4.8 && stats.count >= 10;
  const lijst = tab === "ontvangen" ? ontvangen : gegeven;

  return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5" }} className="animate-fade-in">

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} className="touch-scale" style={{
          width: 36, height: 36, borderRadius: "50%", background: "#EDE4D2",
          display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer",
        }}>
          <ArrowLeft size={17} color="#1A1D1A" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Reviews</h1>
          {gemiddelde != null && (
            <p style={{ fontSize: 12, color: "#8A8A83", margin: "1px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={11} style={{ color: "#C97A4D", fill: "#C97A4D" }} />
              {gemiddelde} gemiddeld · {ontvangen.length} review{ontvangen.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {topVakman && (
          <span style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
            background: "linear-gradient(135deg, #2B4030, #1A2D22)", color: "#F5EFE5",
            borderRadius: 99, fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}>
            <Award size={12} /> Top vakman
          </span>
        )}
      </div>

      <div className="px-5 pb-28">

        {/* Nog te beoordelen */}
        {teBeoordelen.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#1A1D1A", margin: "0 0 10px" }}>
              Nog te beoordelen
            </p>
            {teBeoordelen.map(b => (
              <div key={b.id} style={{ background: "#FBF7F0", border: "0.5px solid #C97A4D", borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#C97A4D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 15, color: "#1A1D1A", flexShrink: 0 }}>
                    {(b.profiles?.name ?? "?").charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{b.profiles?.name ?? (isVakman ? "Klant" : "Vakman")}</p>
                    <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                      {b.opdrachten?.titel ?? b.notities ?? "Klus"}{b.bedrag ? ` · ${formatEuro(b.bedrag)}` : ""}
                    </p>
                  </div>
                  {openForm !== b.id && (
                    <button onClick={() => { setOpenForm(b.id); setScore(0); setTekst(""); }} className="touch-scale" style={{
                      padding: "8px 14px", background: "#2B4030", color: "#F5EFE5", border: "none",
                      borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    }}>
                      Beoordeel
                    </button>
                  )}
                </div>

                {openForm === b.id && (
                  <div className="animate-fade-in" style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setScore(s)} className="touch-scale" style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                          <Star size={30} style={{
                            color: s <= score ? "#C97A4D" : "#E5DDD0",
                            fill: s <= score ? "#C97A4D" : "transparent",
                          }} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={tekst}
                      onChange={e => setTekst(e.target.value)}
                      placeholder={isVakman ? "Hoe was de samenwerking met deze klant?" : "Hoe was deze vakman?"}
                      rows={2}
                      style={{ width: "100%", padding: "10px 12px", background: "#F5EFE5", border: "0.5px solid #E5DDD0", borderRadius: 10, fontSize: 13, resize: "none", marginBottom: 10, fontFamily: "Inter, sans-serif" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setOpenForm(null)} className="touch-scale" style={{
                        padding: "11px 16px", background: "transparent", border: "0.5px solid #E5DDD0",
                        color: "#8A8A83", borderRadius: 10, fontSize: 13, cursor: "pointer",
                      }}>
                        Later
                      </button>
                      <button onClick={() => verstuurReview(b)} disabled={score === 0 || busy} className="touch-scale" style={{
                        flex: 1, padding: "11px 0", background: score === 0 || busy ? "#8A8A83" : "#2B4030",
                        color: "#F5EFE5", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      }}>
                        {busy ? "Opslaan…" : "Review versturen"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {(["ontvangen", "gegeven"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="touch-scale" style={{
              fontSize: 12, padding: "7px 16px", borderRadius: 99, cursor: "pointer",
              background: tab === t ? "#1A1D1A" : "transparent",
              color: tab === t ? "#F5EFE5" : "#5C5C56",
              border: tab === t ? "none" : "0.5px solid #E5DDD0",
              fontWeight: tab === t ? 500 : 400,
            }}>
              {t === "ontvangen" ? `Ontvangen (${ontvangen.length})` : `Gegeven (${gegeven.length})`}
            </button>
          ))}
        </div>

        {/* Skeletons */}
        {loading && <><div className="skeleton" style={{ height: 90, marginBottom: 10 }} /><div className="skeleton" style={{ height: 90 }} /></>}

        {/* Lege state */}
        {!loading && lijst.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>⭐</p>
            <p style={{ fontFamily: SERIF, fontSize: 17, color: "#1A1D1A", margin: "0 0 6px" }}>
              {tab === "ontvangen" ? "Nog geen reviews ontvangen" : "Nog geen reviews gegeven"}
            </p>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>
              {tab === "ontvangen"
                ? "Na elke afgeronde klus kan de andere partij je beoordelen."
                : "Rond een klus af om een beoordeling achter te laten."}
            </p>
          </div>
        )}

        {/* Review-lijst */}
        {lijst.map(r => {
          const vakmanNaam = r.vakman?.profiles?.name;
          const naam = (tab === "ontvangen"
            ? (r.reviewer_rol === "klant" ? r.klant?.name : vakmanNaam)
            : (isVakman ? r.klant?.name : vakmanNaam)) ?? "Anoniem";
          return (
            <div key={r.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 14, color: "#F5EFE5", flexShrink: 0 }}>
                  {naam.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{naam}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>{tijdLabel(r.created_at)}</p>
                </div>
                <Sterren score={r.score} />
              </div>
              {r.tekst && (
                <p style={{ fontSize: 13, color: "#5C5C56", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                  &ldquo;{r.tekst}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
