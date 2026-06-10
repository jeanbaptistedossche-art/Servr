"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, MapPin, MessageCircle, Heart, Share2,
  ChevronRight, Clock, CheckCircle, CalendarDays, X, Send, Loader2,
} from "lucide-react";
import { supabase, supabaseReady, type Dienst } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

// ─── Types ────────────────────────────────────────────────────────────────────
type VakmanProfiel = {
  id: string;
  name: string;
  phone: string | null;
  city: string;
  avatar_url: string | null;
  specialty: string | null;
  bio: string | null;
  beschikbaar: boolean;
  rating: number;
  review_count: number;
  klus_count: number;
  stripe_account: string | null;
};

type ReviewRij = {
  id: string;
  score: number;
  tekst: string | null;
  created_at: string;
  klant?: { name: string } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initiaal(naam: string) {
  return naam?.charAt(0)?.toUpperCase() ?? "?";
}

function sterren(score: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={12}
      color={i < Math.round(score) ? "#C97A4D" : "#E5DDD0"}
      fill={i < Math.round(score) ? "#C97A4D" : "#E5DDD0"}
    />
  ));
}

// ─── Sub-componenten ──────────────────────────────────────────────────────────

function LaadSkeleton() {
  return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5" }}>
      <div style={{ height: 280, background: "#EDE4D2", animation: "pulse 2s infinite" }} />
      <div style={{ padding: "0 20px", marginTop: -32 }}>
        <div style={{ background: "#FBF7F0", borderRadius: 20, padding: 20, border: "0.5px solid #E5DDD0" }}>
          <div style={{ height: 20, width: 160, background: "#E5DDD0", borderRadius: 8, marginBottom: 12 }} />
          <div style={{ height: 14, width: 220, background: "#E5DDD0", borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

function NietGevonden({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100dvh", background: "#F5EFE5",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>🔍</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 22, color: "#1A1D1A", margin: "0 0 10px" }}>
        Vakman niet gevonden
      </h2>
      <p style={{ fontSize: 14, color: "#5C5C56", margin: "0 0 28px" }}>
        ID <code style={{ background: "#EDE4D2", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{id}</code> bestaat niet of is niet meer actief.
      </p>
      <button
        onClick={() => router.push("/search")}
        style={{
          padding: "14px 28px", borderRadius: 12, background: "#2B4030",
          color: "#F5EFE5", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
        }}
      >
        Andere vakmensen zoeken
      </button>
    </div>
  );
}

// ─── Hoofd component ──────────────────────────────────────────────────────────
export default function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [vakman, setVakman] = useState<VakmanProfiel | null>(null);
  const [diensten, setDiensten] = useState<Dienst[]>([]);
  const [reviews, setReviews] = useState<ReviewRij[]>([]);

  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<"diensten" | "reviews">("diensten");

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTekst, setReviewTekst] = useState("");
  const [reviewVerstuurd, setReviewVerstuurd] = useState(false);
  const [reviewSending, setReviewSending] = useState(false);

  // ── Data laden ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function laad() {
      if (!supabaseReady) { setLoading(false); return; }

      try {
        // Vakman + profiel join
        const { data: vak } = await (supabase.from("vakmensen") as any)
          .select(`
            id, specialty, bio, beschikbaar, rating, review_count, klus_count, stripe_account,
            profiles!inner(name, phone, city, avatar_url)
          `)
          .eq("id", id)
          .single();

        if (cancelled) return;

        if (!vak) { setLoading(false); return; }

        const prof = (vak.profiles as any) ?? {};
        setVakman({
          id: vak.id,
          name: prof.name ?? "Vakman",
          phone: prof.phone ?? null,
          city: prof.city ?? "",
          avatar_url: prof.avatar_url ?? null,
          specialty: vak.specialty ?? null,
          bio: vak.bio ?? null,
          beschikbaar: vak.beschikbaar ?? false,
          rating: vak.rating ?? 0,
          review_count: vak.review_count ?? 0,
          klus_count: vak.klus_count ?? 0,
          stripe_account: vak.stripe_account ?? null,
        });

        // Diensten
        const { data: dData } = await supabase
          .from("diensten")
          .select("*")
          .eq("vakman_id", id)
          .eq("actief", true)
          .order("prijs", { ascending: true });
        if (!cancelled) setDiensten((dData as Dienst[]) ?? []);

        // Reviews (met klant naam)
        const { data: rData } = await (supabase.from("reviews") as any)
          .select(`id, score, tekst, created_at, klant:profiles!reviews_klant_id_fkey(name)`)
          .eq("vakman_id", id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!cancelled) setReviews((rData as ReviewRij[]) ?? []);

      } catch {
        // lege state — NietGevonden toont zich
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    laad();
    return () => { cancelled = true; };
  }, [id]);

  // ── Review versturen ────────────────────────────────────────────────────────
  async function verstuurReview() {
    if (!reviewTekst.trim() || reviewSending) return;
    setReviewSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert("Je moet ingelogd zijn om een review te schrijven.");
        setReviewSending(false);
        return;
      }
      await (supabase.from("reviews") as any).insert({
        boeking_id: `direct_${Date.now()}`, // tijdelijk zonder echte boeking
        klant_id: session.user.id,
        vakman_id: id,
        score: reviewRating,
        tekst: reviewTekst.trim(),
      });
      setReviewVerstuurd(true);
      setShowReviewForm(false);
      setReviewTekst("");
      setTab("reviews");
      // Herlaad reviews
      const { data: rData } = await (supabase.from("reviews") as any)
        .select(`id, score, tekst, created_at, klant:profiles!reviews_klant_id_fkey(name)`)
        .eq("vakman_id", id)
        .order("created_at", { ascending: false })
        .limit(20);
      setReviews((rData as ReviewRij[]) ?? []);
    } catch {
      alert("Review kon niet worden opgeslagen. Probeer opnieuw.");
    } finally {
      setReviewSending(false);
    }
  }

  // ── Render states ───────────────────────────────────────────────────────────
  if (loading) return <LaadSkeleton />;
  if (!vakman) return <NietGevonden id={id} />;

  const gemScore = reviews.length
    ? reviews.reduce((s, r) => s + r.score, 0) / reviews.length
    : vakman.rating;

  return (
    <div style={{ minHeight: "100%", background: "#F5EFE5", display: "flex", flexDirection: "column" }}>

      {/* ── Hero ── */}
      <div style={{ height: 280, background: "#EDE4D2", position: "relative", overflow: "hidden" }}>
        {vakman.avatar_url ? (
          <img src={vakman.avatar_url} alt={vakman.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: vakman.beschikbaar ? "#2B4030" : "#5C5C56",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 80, color: "rgba(255,255,255,0.2)",
          }}>
            {initiaal(vakman.name)}
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.65) 100%)" }} />

        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 16px 0" }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 99, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
            <ArrowLeft size={18} color="#F5EFE5" />
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setLiked(l => !l)} style={{ width: 36, height: 36, borderRadius: 99, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <Heart size={18} color="#F5EFE5" fill={liked ? "#F5EFE5" : "none"} />
            </button>
            <button style={{ width: 36, height: 36, borderRadius: 99, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
              <Share2 size={18} color="#F5EFE5" />
            </button>
          </div>
        </div>

        {/* Beschikbaarheidsdot */}
        <div style={{ position: "absolute", top: 56, right: 16, display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: vakman.beschikbaar ? "#4ade80" : "#8A8A83", display: "inline-block" }} />
          <span style={{ color: "#F5EFE5", fontSize: 12, fontWeight: 600 }}>
            {vakman.beschikbaar ? "Beschikbaar" : "Bezet"}
          </span>
        </div>
      </div>

      {/* ── Profiel card ── */}
      <div style={{ padding: "0 20px", marginTop: -32, position: "relative", zIndex: 10 }}>
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 20, padding: 20, boxShadow: "0 8px 32px rgba(43,64,48,0.10)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 28, color: "#F5EFE5", border: "3px solid #FBF7F0", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                {vakman.avatar_url
                  ? <img src={vakman.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initiaal(vakman.name)
                }
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 900, color: "#1A1D1A", lineHeight: 1.2, margin: 0 }}>
                {vakman.name}
              </h1>
              <p style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>
                {vakman.specialty ?? "Vakman"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                {sterren(gemScore)}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginLeft: 4 }}>
                  {gemScore > 0 ? gemScore.toFixed(1) : "—"}
                </span>
                <span style={{ fontSize: 12, color: "#8A8A83" }}>({reviews.length || vakman.review_count})</span>
              </div>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {vakman.klus_count > 0 && (
                <>
                  <p style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, color: "#2B4030", lineHeight: 1, margin: 0 }}>
                    {vakman.klus_count}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "#8A8A83", marginTop: 2 }}>klussen</p>
                </>
              )}
              {vakman.city && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4, justifyContent: "flex-end" }}>
                  <MapPin size={11} color="#8A8A83" />
                  <span style={{ fontSize: 11, color: "#8A8A83" }}>{vakman.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, background: "#EDE4D2", color: "#2B4030", border: "0.5px solid #E5DDD0" }}>
              <CheckCircle size={11} color="#2B4030" /> Geverifieerd
            </span>
            {vakman.beschikbaar && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, background: "#EAF0EC", color: "#2B4030", border: "0.5px solid #c6e4ce" }}>
                ● Nu beschikbaar
              </span>
            )}
          </div>

          {/* Bio */}
          {vakman.bio && (
            <p style={{ fontSize: 14, color: "#5C5C56", marginTop: 14, lineHeight: 1.6 }}>
              {vakman.bio}
            </p>
          )}
        </div>

        {/* ── Acties ── */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link href={`/chat/${vakman.id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 99, border: "1.5px solid #2B4030", color: "#2B4030", background: "#FBF7F0", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            <MessageCircle size={17} color="#2B4030" />
            Bericht
          </Link>
          <Link href={`/agenda/boeken/${vakman.id}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 99, background: "#2B4030", color: "#F5EFE5", fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 16px rgba(43,64,48,0.30)" }}>
            <CalendarDays size={15} color="#F5EFE5" />
            Boek nu
          </Link>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 6, marginTop: 20, padding: 5, borderRadius: 18, background: "#EDE4D2" }}>
          {(["diensten", "reviews"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 13, fontWeight: 600, fontSize: 14,
                textTransform: "capitalize", border: tab === t ? "none" : "0.5px solid #E5DDD0",
                background: tab === t ? "#1A1D1A" : "transparent",
                color: tab === t ? "#F5EFE5" : "#5C5C56",
                cursor: "pointer", transition: "background 0.15s, color 0.15s",
              }}
            >
              {t === "diensten" ? `Diensten (${diensten.length})` : `Reviews (${reviews.length || vakman.review_count})`}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ paddingBottom: 112, marginTop: 16 }}>

          {/* DIENSTEN */}
          {tab === "diensten" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {diensten.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#8A8A83" }}>
                  <p style={{ fontFamily: SERIF, fontSize: 16, color: "#5C5C56", margin: "0 0 6px" }}>Geen diensten vermeld</p>
                  <p style={{ fontSize: 13 }}>Stuur een bericht voor een offerte op maat.</p>
                </div>
              ) : diensten.map(s => (
                <div key={s.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1D1A", margin: 0 }}>{s.naam}</p>
                    {s.beschrijving && (
                      <p style={{ fontSize: 12, color: "#8A8A83", margin: "4px 0 0" }}>{s.beschrijving}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, color: "#8A8A83" }}>
                      <Clock size={12} color="#8A8A83" />
                      <span style={{ fontSize: 12, color: "#8A8A83" }}>{s.duur_minuten} min</span>
                      <span style={{ fontSize: 12, color: "#8A8A83" }}>· {s.eenheid}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 900, color: "#2B4030", fontFamily: SERIF, fontSize: 16 }}>
                      €{Math.round(s.prijs / 100)}
                    </span>
                    <Link href={`/agenda/boeken/${vakman.id}?dienst=${s.id}`}>
                      <button style={{ width: 32, height: 32, borderRadius: 99, background: "#2B4030", color: "#F5EFE5", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}>
                        <ChevronRight size={16} color="#F5EFE5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REVIEWS */}
          {tab === "reviews" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Score strip */}
              {reviews.length > 0 && (
                <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: "#2B4030", lineHeight: 1, margin: 0 }}>
                      {gemScore.toFixed(1)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center", marginTop: 4 }}>
                      {sterren(gemScore)}
                    </div>
                    <p style={{ fontSize: 10, color: "#8A8A83", marginTop: 4 }}>{reviews.length} reviews</p>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    {[5, 4, 3, 2, 1].map(n => {
                      const cnt = reviews.filter(r => r.score === n).length;
                      const pct = reviews.length ? (cnt / reviews.length) * 100 : 0;
                      return (
                        <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, width: 12, color: "#8A8A83" }}>{n}</span>
                          <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#EDE4D2" }}>
                            <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: "#2B4030" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review knop */}
              {reviewVerstuurd ? (
                <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} color="#2B4030" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2B4030", margin: 0 }}>Review verstuurd — bedankt!</p>
                </div>
              ) : (
                <button onClick={() => setShowReviewForm(v => !v)} style={{ background: "#FBF7F0", border: showReviewForm ? "1px solid #2B4030" : "0.5px solid #E5DDD0", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", cursor: "pointer" }}>
                  <Star size={16} color="#C97A4D" fill="#C97A4D" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#2B4030" }}>Schrijf een review</span>
                </button>
              )}

              {/* Review form */}
              {showReviewForm && (
                <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1D1A", margin: 0 }}>Jouw beoordeling</p>
                    <button onClick={() => setShowReviewForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <X size={16} color="#8A8A83" />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star size={28} color={n <= reviewRating ? "#C97A4D" : "#E5DDD0"} fill={n <= reviewRating ? "#C97A4D" : "#E5DDD0"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewTekst}
                    onChange={e => setReviewTekst(e.target.value)}
                    placeholder={`Hoe was je ervaring met ${vakman.name.split(" ")[0]}?`}
                    rows={3}
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "0.5px solid #E5DDD0", outline: "none", fontSize: 14, resize: "none", background: "#F5EFE5", color: "#1A1D1A", fontFamily: "inherit", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={verstuurReview}
                    disabled={!reviewTekst.trim() || reviewSending}
                    style={{ padding: "12px 0", borderRadius: 99, fontWeight: 700, fontSize: 14, color: "#F5EFE5", background: reviewTekst.trim() && !reviewSending ? "#2B4030" : "#8A8A83", border: "none", cursor: reviewTekst.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {reviewSending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} color="#F5EFE5" />}
                    {reviewSending ? "Opslaan…" : "Verstuur review"}
                  </button>
                </div>
              )}

              {/* Reviews lijst */}
              {reviews.length === 0 && !showReviewForm && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#8A8A83" }}>
                  <p style={{ fontFamily: SERIF, fontSize: 16, color: "#5C5C56", margin: "0 0 6px" }}>Nog geen reviews</p>
                  <p style={{ fontSize: 13 }}>Wees de eerste om een review te schrijven.</p>
                </div>
              )}

              {reviews.map((r) => (
                <div key={r.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1D1A", margin: 0 }}>
                      {(r.klant as any)?.name ?? "Klant"}
                    </p>
                    <div style={{ display: "flex", gap: 2 }}>{sterren(r.score)}</div>
                  </div>
                  {r.tekst && (
                    <p style={{ fontSize: 14, color: "#5C5C56", lineHeight: 1.55, margin: 0 }}>{r.tekst}</p>
                  )}
                  <p style={{ fontSize: 12, color: "#8A8A83", marginTop: 8, marginBottom: 0 }}>
                    {new Date(r.created_at).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
