"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Star, Check, X, TrendingDown,
  Clock, Shield, Award, ChevronRight, AlertCircle,
  BarChart3, Users, ThumbsUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type OfferteStatus = "wachten" | "ontvangen" | "geaccepteerd" | "afgewezen";

type Offerte = {
  id: string;
  vakman: string;
  avatar: string;
  rating: number;
  aantalReviews: number;
  prijs: number;
  btw: number;        // % (0 or 21)
  doorlooptijd: number; // werkdagen
  garantie: number;   // maanden
  beschrijving: string;
  inclusieven: string[];
  exclusieven?: string[];
  status: OfferteStatus;
  gecertificeerd: boolean;
  aanbieding?: string;  // bijv. "10% korting bij snel akkoord"
};

type Aanvraag = {
  id: string;
  titel: string;
  beschrijving: string;
  categorie: string;
  datum: string;
  offertes: Offerte[];
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const AANVRAAG: Aanvraag = {
  id: "a1",
  titel: "Badkamer renovatie",
  beschrijving: "Complete renovatie badkamer 6m², inclusief nieuwe douchebak, toilet, wastafel en tegels.",
  categorie: "Sanitair",
  datum: "2026-05-20",
  offertes: [
    {
      id: "o1", vakman: "Marco de Loodgieter", avatar: "https://i.pravatar.cc/64?img=11",
      rating: 4.9, aantalReviews: 187, prijs: 7800, btw: 21, doorlooptijd: 8,
      garantie: 60, gecertificeerd: true,
      beschrijving: "Complete renovatie inclusief sloopwerk, leggen van leidingwerk, plaatsen sanitair en afwerking.",
      inclusieven: ["Sloopwerk & afvoer", "Loodgieterwerk", "Tegelwerk (40x40cm)", "Sanitair plaatsen", "Afwerking & kitten"],
      aanbieding: "10% korting bij akkoord vóór 1 juni",
      status: "ontvangen",
    },
    {
      id: "o2", vakman: "Sanitair Pro Amsterdam", avatar: "https://i.pravatar.cc/64?img=22",
      rating: 4.7, aantalReviews: 94, prijs: 6950, btw: 21, doorlooptijd: 12,
      garantie: 24, gecertificeerd: true,
      beschrijving: "Renovatie badkamer met A-merk sanitair. Tegelwerk in overleg.",
      inclusieven: ["Sloopwerk", "Loodgieterswerk", "Sanitair A-merk", "Tegelwerk"],
      exclusieven: ["Afvoer puin (€120 extra)"],
      status: "ontvangen",
    },
    {
      id: "o3", vakman: "Jan de Klusselman", avatar: "https://i.pravatar.cc/64?img=33",
      rating: 4.2, aantalReviews: 31, prijs: 5400, btw: 0, doorlooptijd: 6,
      garantie: 12, gecertificeerd: false,
      beschrijving: "Badkamer opknappen tegen gunstige prijs. Materialen niet inbegrepen.",
      inclusieven: ["Arbeid loodgieter", "Tegelwerk"],
      exclusieven: ["Sanitair (aanleveren door klant)", "Tegels (aanleveren door klant)", "Sloopwerk"],
      status: "ontvangen",
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number, inclBtw = false, btw = 21) {
  const val = inclBtw ? n * (1 + btw / 100) : n;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}
function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= Math.round(n) ? "#F59E0B" : "none"}
          style={{ color: i <= Math.round(n) ? "#F59E0B" : "#D1D5DB" }} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OfferteVergelijkerPage() {
  const router = useRouter();
  const [aanvraag] = useState<Aanvraag>(AANVRAAG);
  const [showInclBtw, setShowInclBtw] = useState(false);
  const [showDetail, setShowDetail] = useState<Offerte | null>(null);
  const [gekozen, setGekozen] = useState<string | null>(null);

  const offertes = aanvraag.offertes;
  const laagstePrijs = Math.min(...offertes.map(o => o.prijs));
  const hoogsteRating = Math.max(...offertes.map(o => o.rating));
  const kortsteLooptijd = Math.min(...offertes.map(o => o.doorlooptijd));

  const getBadges = (o: Offerte) => {
    const badges: { label: string; color: string; bg: string }[] = [];
    if (o.prijs === laagstePrijs) badges.push({ label: "🏷️ Laagste prijs", color: "#16A34A", bg: "#DCFCE7" });
    if (o.rating === hoogsteRating) badges.push({ label: "⭐ Beste reviews", color: "#D97706", bg: "#FEF3C7" });
    if (o.doorlooptijd === kortsteLooptijd) badges.push({ label: "⚡ Snelst", color: "#7C3AED", bg: "#F5F3FF" });
    if (o.garantie >= 60) badges.push({ label: "🛡️ Lange garantie", color: "#0EA5E9", bg: "#F0F9FF" });
    return badges;
  };

  const prijsScore = (o: Offerte) => Math.round(100 - ((o.prijs - laagstePrijs) / laagstePrijs) * 100);
  const totalScore = (o: Offerte) => Math.round(
    (o.rating / 5) * 35 +
    (prijsScore(o) / 100) * 30 +
    ((kortsteLooptijd / o.doorlooptijd)) * 20 +
    (o.garantie / 60) * 10 +
    (o.gecertificeerd ? 5 : 0)
  );

  const rankedOffertes = useMemo(() =>
    [...offertes].sort((a, b) => totalScore(b) - totalScore(a)),
    [offertes]);

  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Offerte Vergelijker</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>{aanvraag.titel} · {offertes.length} offertes</p>
          </div>
          <button onClick={() => setShowInclBtw(v => !v)}
            className="touch-scale px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
            style={{ background: showInclBtw ? "#4F46E5" : "#fff", color: showInclBtw ? "#fff" : "#64748b",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            {showInclBtw ? "Incl. BTW" : "Excl. BTW"}
          </button>
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {/* Aanvraag samenvatting */}
        <div className="rounded-2xl p-4"
          style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#4F46E5" }}>Jouw aanvraag</p>
          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{aanvraag.titel}</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "#374151" }}>{aanvraag.beschrijving}</p>
        </div>

        {/* Offertes */}
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
          Vergelijk offertes — gesorteerd op beste score
        </p>

        {rankedOffertes.map((o, idx) => {
          const badges = getBadges(o);
          const score = totalScore(o);
          const isGekozen = gekozen === o.id;
          const isBest = idx === 0;

          return (
            <div key={o.id}
              className="rounded-3xl overflow-hidden cursor-pointer"
              onClick={() => setShowDetail(o)}
              style={{
                background: "#fff",
                boxShadow: isBest ? "0 4px 20px rgba(79,70,229,0.18)" : "0 1px 8px rgba(0,0,0,0.07)",
                border: isGekozen ? "2px solid #10B981" : isBest ? "2px solid #4F46E5" : "2px solid transparent",
              }}>

              {isBest && !isGekozen && (
                <div className="px-4 py-1.5 text-center"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                  <p className="text-xs font-black text-white">🏆 Beste keuze op basis van prijs, reviews en garantie</p>
                </div>
              )}
              {isGekozen && (
                <div className="px-4 py-1.5 text-center"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                  <p className="text-xs font-black text-white">✓ Jouw keuze — vakman wordt gecontacteerd</p>
                </div>
              )}

              <div className="p-4">
                {/* Vakman info */}
                <div className="flex items-center gap-3 mb-3">
                  <img src={o.avatar} alt={o.vakman}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black truncate" style={{ color: "#0f172a" }}>{o.vakman}</p>
                      {o.gecertificeerd && (
                        <Shield size={13} style={{ color: "#4F46E5", flexShrink: 0 }} />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Stars n={o.rating} size={11} />
                      <p className="text-xs font-bold" style={{ color: "#F59E0B" }}>{o.rating}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>({o.aantalReviews})</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-xl" style={{ color: "#4F46E5" }}>
                      {fmtEur(o.prijs, showInclBtw, o.btw)}
                    </p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>
                      {o.btw === 0 ? "incl. BTW" : showInclBtw ? "incl. BTW" : "excl. BTW"}
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${score}%`, background: score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <p className="text-xs font-bold flex-shrink-0" style={{ color: "#64748b" }}>Score: {score}/100</p>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {badges.map(b => (
                      <span key={b.label} className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: b.bg, color: b.color }}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: <Clock size={12}/>, label: `${o.doorlooptijd}d looptijd` },
                    { icon: <Shield size={12}/>, label: `${o.garantie}mnd garantie` },
                    { icon: <Award size={12}/>, label: o.gecertificeerd ? "Gecertificeerd" : "Niet gecert." },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl"
                      style={{ background: "#F8FAFC" }}>
                      <span style={{ color: "#64748b" }}>{s.icon}</span>
                      <p className="text-xs" style={{ color: "#374151" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Aanbieding */}
                {o.aanbieding && (
                  <div className="rounded-xl px-3 py-2 mb-3" style={{ background: "#ECFDF5" }}>
                    <p className="text-xs font-bold" style={{ color: "#065F46" }}>🎁 {o.aanbieding}</p>
                  </div>
                )}

                {/* Actie knop */}
                <button
                  onClick={e => { e.stopPropagation(); setGekozen(o.id); }}
                  className="touch-scale w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    background: isGekozen ? "#10B981" : isBest ? "#4F46E5" : "#F1F5F9",
                    color: isGekozen ? "#fff" : isBest ? "#fff" : "#64748b",
                  }}>
                  {isGekozen ? <><Check size={16}/> Gekozen</> : <><ThumbsUp size={16}/> Kies deze vakman</>}
                </button>
              </div>
            </div>
          );
        })}

        {/* Vergelijkingstabel */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <p className="text-sm font-bold" style={{ color: "#0f172a" }}>📊 Snelle vergelijking</p>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
              <thead>
                <tr style={{ background: "#F8FAFC" }}>
                  <th className="text-xs font-bold px-3 py-2 text-left" style={{ color: "#94a3b8" }}>Factor</th>
                  {offertes.map(o => (
                    <th key={o.id} className="text-xs font-bold px-3 py-2 text-center" style={{ color: "#0f172a" }}>
                      {o.vakman.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Prijs (excl.)",  vals: offertes.map(o => `€${(o.prijs/1000).toFixed(1)}k`) },
                  { label: "Looptijd",        vals: offertes.map(o => `${o.doorlooptijd}d`) },
                  { label: "Garantie",        vals: offertes.map(o => `${o.garantie}mnd`) },
                  { label: "BTW",             vals: offertes.map(o => `${o.btw}%`) },
                  { label: "Gecertificeerd",  vals: offertes.map(o => o.gecertificeerd ? "✓" : "✗") },
                ].map((row, ri) => (
                  <tr key={row.label} style={{ background: ri % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                    <td className="text-xs font-bold px-3 py-2" style={{ color: "#64748b" }}>{row.label}</td>
                    {row.vals.map((v, ci) => (
                      <td key={ci} className="text-xs text-center px-3 py-2 font-semibold"
                        style={{ color: "#0f172a" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail sheet */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDetail(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "88dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-center gap-3 mb-4">
                <img src={showDetail.avatar} alt={showDetail.vakman}
                  className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showDetail.vakman}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Stars n={showDetail.rating} />
                    <p className="text-sm font-bold" style={{ color: "#F59E0B" }}>{showDetail.rating}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>({showDetail.aantalReviews} reviews)</p>
                  </div>
                </div>
                <p className="font-black text-2xl flex-shrink-0" style={{ color: "#4F46E5" }}>
                  {fmtEur(showDetail.prijs, showInclBtw, showDetail.btw)}
                </p>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>{showDetail.beschrijving}</p>

              <div className="mb-4">
                <p className="text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>INCLUSIEF</p>
                {showDetail.inclusieven.map(i => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <Check size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                    <p className="text-sm" style={{ color: "#374151" }}>{i}</p>
                  </div>
                ))}
              </div>

              {showDetail.exclusieven && (
                <div className="mb-4">
                  <p className="text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>EXCLUSIEF / EXTRA</p>
                  {showDetail.exclusieven.map(i => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
                      <p className="text-sm" style={{ color: "#374151" }}>{i}</p>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => { setGekozen(showDetail.id); setShowDetail(null); }}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: gekozen === showDetail.id ? "#10B981" : "#4F46E5" }}>
                {gekozen === showDetail.id
                  ? <><Check size={20}/> Al gekozen</>
                  : <><ThumbsUp size={20}/> Deze vakman kiezen</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
