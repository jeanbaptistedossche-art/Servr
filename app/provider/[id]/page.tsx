"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, MessageCircle, Heart, Share2, ChevronRight, Clock, CheckCircle, CalendarDays, X, Send } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";
import { useReviewStore } from "@/lib/reviewStore";

export default function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const provider = PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
  const [liked, setLiked] = useState(false);
  const [tab, setTab] = useState<"diensten" | "reviews" | "fotos">("diensten");

  // Reviews
  const { reviews: userReviews, voegReview, getReviewsVoorVakman } = useReviewStore();
  const extraReviews = getReviewsVoorVakman(provider.id);
  const allReviews = [
    ...provider.reviews,
    ...extraReviews.map(r => ({ author: r.auteur, rating: r.rating, text: r.tekst, date: r.datum })),
  ];
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTekst, setReviewTekst] = useState("");
  const [reviewVerstuurd, setReviewVerstuurd] = useState(false);

  const verstuurReview = () => {
    if (!reviewTekst.trim()) return;
    voegReview({
      vakmanId: provider.id,
      boekingId: `anon_${Date.now()}`,
      auteur: "Jij",
      rating: reviewRating,
      tekst: reviewTekst.trim(),
    });
    setReviewVerstuurd(true);
    setShowReviewForm(false);
    setReviewTekst("");
    setTab("reviews");
  };

  return (
    <div style={{ minHeight: "100%", background: "#F5EFE5", display: "flex", flexDirection: "column" }}>

      {/* Hero foto */}
      <div className="relative overflow-hidden" style={{ height: 280, background: "#EDE4D2" }}>
        <img src={provider.photos[0]} alt={provider.name} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%, rgba(0,0,0,0.65) 100%)" }}
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="touch-scale"
            style={{
              width: 36, height: 36, borderRadius: 99,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} color="#F5EFE5" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setLiked(l => !l)}
              className="touch-scale"
              style={{
                width: 36, height: 36, borderRadius: 99,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer",
              }}
            >
              <Heart size={18} color="#F5EFE5" fill={liked ? "#F5EFE5" : "none"} />
            </button>
            <button
              className="touch-scale"
              style={{
                width: 36, height: 36, borderRadius: 99,
                background: "rgba(0,0,0,0.45)",
                backdropFilter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", cursor: "pointer",
              }}
            >
              <Share2 size={18} color="#F5EFE5" />
            </button>
          </div>
        </div>

        {/* Beschikbaarheidsdot */}
        <div
          className="absolute"
          style={{
            top: 56, right: 16,
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 99,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              width: 8, height: 8, borderRadius: 99,
              background: provider.available ? "#2B4030" : "#8A8A83",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#F5EFE5", fontSize: 12, fontWeight: 600 }}>
            {provider.available ? "Beschikbaar" : "Bezet"}
          </span>
        </div>
      </div>

      {/* Profiel info */}
      <div className="px-5" style={{ marginTop: -32, position: "relative", zIndex: 10 }}>

        {/* Hoofd profiel card */}
        <div style={{
          background: "#FBF7F0",
          border: "0.5px solid #E5DDD0",
          borderRadius: 20,
          padding: 20,
          boxShadow: "0 8px 32px rgba(43,64,48,0.10)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={provider.avatar}
                alt={provider.name}
                className="object-cover"
                style={{ width: 72, height: 72, borderRadius: 18, border: "3px solid #FBF7F0", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}
              />
              {/* Servr Score */}
              <div
                style={{
                  position: "absolute", bottom: -6, right: -6,
                  width: 30, height: 30, borderRadius: 99,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900,
                  background: "#2B4030", color: "#F5EFE5",
                  border: "2.5px solid #FBF7F0",
                  boxShadow: "0 2px 8px rgba(43,64,48,0.35)",
                }}
                title={`Servr Score ${provider.servrScore}/100`}
              >
                {provider.servrScore}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "'Source Serif 4', Georgia, serif",
                  fontSize: 20, fontWeight: 900,
                  color: "#1A1D1A", lineHeight: 1.2, margin: 0,
                }}
              >
                {provider.name}
              </h1>
              <p style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>
                {provider.categoryIcon} {provider.category}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={12}
                    color={s <= Math.round(provider.rating) ? "#C97A4D" : "#E5DDD0"}
                    fill={s <= Math.round(provider.rating) ? "#C97A4D" : "#E5DDD0"}
                  />
                ))}
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1D1A", marginLeft: 4 }}>{provider.rating}</span>
                <span style={{ fontSize: 12, color: "#8A8A83" }}>({provider.reviewCount})</span>
              </div>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 22, fontWeight: 900, color: "#2B4030", lineHeight: 1, margin: 0 }}>
                €{provider.priceMin}
              </p>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#8A8A83", marginTop: 2 }}>/uur</p>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 4, justifyContent: "flex-end", color: "#8A8A83" }}>
                <MapPin size={11} color="#8A8A83" />
                <span style={{ fontSize: 11, color: "#8A8A83" }}>{provider.distance}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {provider.badges.map(badge => (
              <span
                key={badge}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 700,
                  padding: "5px 12px", borderRadius: 99,
                  background: "#EDE4D2", color: "#2B4030",
                  border: "0.5px solid #E5DDD0",
                }}
              >
                <CheckCircle size={11} color="#2B4030" />
                {badge}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p style={{ fontSize: 14, color: "#5C5C56", marginTop: 14, lineHeight: 1.6 }}>
            {provider.bio}
          </p>
        </div>

        {/* Acties */}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link
            href={`/chat/${provider.id}`}
            className="touch-scale"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              height: 52, borderRadius: 99,
              border: "1.5px solid #2B4030",
              color: "#2B4030", background: "#FBF7F0",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
            }}
          >
            <MessageCircle size={17} color="#2B4030" />
            Stuur bericht
          </Link>
          <Link
            href={`/agenda/boeken/${provider.id}`}
            className="touch-scale"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              height: 52, borderRadius: 99,
              background: "#2B4030", color: "#F5EFE5",
              fontWeight: 700, fontSize: 14, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(43,64,48,0.30)",
            }}
          >
            <CalendarDays size={15} color="#F5EFE5" />
            Boek nu
          </Link>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex", gap: 6, marginTop: 20,
            padding: 5, borderRadius: 18,
            background: "#EDE4D2",
          }}
        >
          {(["diensten", "reviews", "fotos"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="touch-scale"
              style={{
                flex: 1, padding: "9px 0", borderRadius: 13,
                fontWeight: 600, fontSize: 14,
                textTransform: "capitalize",
                border: tab === t ? "none" : "0.5px solid #E5DDD0",
                background: tab === t ? "#1A1D1A" : "transparent",
                color: tab === t ? "#F5EFE5" : "#5C5C56",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-28" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 112, marginTop: 16 }}>

          {tab === "diensten" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {provider.services.map(s => (
                <div
                  key={s.name}
                  className="touch-scale"
                  style={{
                    background: "#FBF7F0",
                    border: "0.5px solid #E5DDD0",
                    borderRadius: 14, padding: 16,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1D1A", margin: 0 }}>{s.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, color: "#8A8A83" }}>
                      <Clock size={12} color="#8A8A83" />
                      <span style={{ fontSize: 12, color: "#8A8A83" }}>{s.duration}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 900, color: "#2B4030", fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 16 }}>
                      €{s.price}
                    </span>
                    <button
                      className="touch-scale"
                      style={{
                        width: 32, height: 32, borderRadius: 99,
                        background: "#2B4030", color: "#F5EFE5",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", cursor: "pointer",
                      }}
                    >
                      <ChevronRight size={16} color="#F5EFE5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Gemiddelde score strip */}
              <div style={{
                background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                borderRadius: 14, padding: 16,
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{
                    fontFamily: "'Source Serif 4', Georgia, serif",
                    fontWeight: 900, fontSize: 40, color: "#2B4030", lineHeight: 1, margin: 0,
                  }}>
                    {provider.rating}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "center", marginTop: 4 }}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={11}
                        color={j < Math.round(provider.rating) ? "#C97A4D" : "#E5DDD0"}
                        fill={j < Math.round(provider.rating) ? "#C97A4D" : "#E5DDD0"}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "#8A8A83", marginTop: 4 }}>{allReviews.length} reviews</p>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const cnt = allReviews.filter(r => r.rating === n).length;
                    const pct = allReviews.length ? (cnt / allReviews.length) * 100 : 0;
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

              {/* Review schrijven knop */}
              {reviewVerstuurd ? (
                <div style={{
                  background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                  borderRadius: 14, padding: 12,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <CheckCircle size={16} color="#2B4030" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#2B4030", margin: 0 }}>Review verstuurd — bedankt!</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowReviewForm(v => !v)}
                  className="touch-scale"
                  style={{
                    background: "#FBF7F0",
                    border: showReviewForm ? "1px solid #2B4030" : "0.5px solid #E5DDD0",
                    borderRadius: 14, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", textAlign: "left", cursor: "pointer",
                  }}
                >
                  <Star size={16} color="#C97A4D" fill="#C97A4D" />
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#2B4030" }}>Schrijf een review</span>
                </button>
              )}

              {/* Review form */}
              {showReviewForm && (
                <div
                  className="animate-slide-up"
                  style={{
                    background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                    borderRadius: 14, padding: 16,
                    display: "flex", flexDirection: "column", gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1D1A", margin: 0 }}>Jouw beoordeling</p>
                    <button onClick={() => setShowReviewForm(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <X size={16} color="#8A8A83" />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setReviewRating(n)}
                        className="touch-scale"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        <Star
                          size={28}
                          color={n <= reviewRating ? "#C97A4D" : "#E5DDD0"}
                          fill={n <= reviewRating ? "#C97A4D" : "#E5DDD0"}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewTekst}
                    onChange={e => setReviewTekst(e.target.value)}
                    placeholder={`Hoe was je ervaring met ${provider.name.split(" ")[0]}?`}
                    rows={3}
                    style={{
                      width: "100%", padding: "12px 16px",
                      borderRadius: 12, border: "0.5px solid #E5DDD0",
                      outline: "none", fontSize: 14, resize: "none",
                      background: "#F5EFE5", color: "#1A1D1A",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={verstuurReview}
                    disabled={!reviewTekst.trim()}
                    className="touch-scale"
                    style={{
                      padding: "12px 0", borderRadius: 99,
                      fontWeight: 700, fontSize: 14,
                      color: "#F5EFE5",
                      background: reviewTekst.trim() ? "#2B4030" : "#8A8A83",
                      border: "none", cursor: reviewTekst.trim() ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <Send size={14} color="#F5EFE5" />
                    Verstuur review
                  </button>
                </div>
              )}

              {/* Reviews lijst */}
              {allReviews.map((r, i) => (
                <div
                  key={i}
                  style={{
                    background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                    borderRadius: 14, padding: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#1A1D1A", margin: 0 }}>{r.author}</p>
                    <div style={{ display: "flex", gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star
                          key={j}
                          size={12}
                          color={j < r.rating ? "#C97A4D" : "#E5DDD0"}
                          fill={j < r.rating ? "#C97A4D" : "#E5DDD0"}
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: "#5C5C56", lineHeight: 1.55, margin: 0 }}>{r.text}</p>
                  <p style={{ fontSize: 12, color: "#8A8A83", marginTop: 8, marginBottom: 0 }}>{r.date}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "fotos" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {provider.photos.concat(provider.photos).map((photo, i) => (
                <div
                  key={i}
                  className="touch-scale"
                  style={{ aspectRatio: "1", borderRadius: 14, overflow: "hidden" }}
                >
                  <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
