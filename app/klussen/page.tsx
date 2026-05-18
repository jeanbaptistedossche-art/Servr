"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Download, Sparkles, ChevronDown, ChevronUp, Clock, CheckCircle, AlertTriangle, TrendingUp, BarChart2, Lightbulb } from "lucide-react";

type Categorie = "alle" | "loodgieter" | "hvac";

const KLUSSEN = [
  {
    id: "k1", naam: "Lekkage reparatie", klant: "Lisa de Vries", avatar: "https://i.pravatar.cc/150?img=32",
    datum: "19 mei 2026", prijs: 85, duur: "1u 10m", categorie: "loodgieter",
    rating: 5, review: "Super snel en netjes gewerkt. Lekkage binnen het uur opgelost! Marco is echt een vakman.",
    status: "afgerond",
  },
  {
    id: "k2", naam: "Toilet installatie", klant: "Ahmed Mansour", avatar: "https://i.pravatar.cc/150?img=33",
    datum: "19 mei 2026", prijs: 195, duur: "2u 15m", categorie: "loodgieter",
    rating: 5, review: "Professioneel en eerlijke prijs. Toilet werkt perfect. Zeker aanbevelen!",
    status: "afgerond",
  },
  {
    id: "k3", naam: "CV ketel inspectie", klant: "Petra Jansen", avatar: "https://i.pravatar.cc/150?img=47",
    datum: "19 mei 2026", prijs: 99, duur: "1u 35m", categorie: "hvac",
    rating: 4, review: "Goed werk, wel wat later dan gepland. Uiteindelijk keurig opgeleverd.",
    status: "afgerond",
  },
  {
    id: "k4", naam: "Kraan vervangen", klant: "Sandra Hoek", avatar: "https://i.pravatar.cc/150?img=56",
    datum: "18 mei 2026", prijs: 65, duur: "50m", categorie: "loodgieter",
    rating: 5, review: "Snel geregeld, geen gedoe. Precies wat ik nodig had.",
    status: "afgerond",
  },
  {
    id: "k5", naam: "CV ketel inspectie", klant: "Tom Bakker", avatar: "https://i.pravatar.cc/150?img=12",
    datum: "17 mei 2026", prijs: 99, duur: "1u 20m", categorie: "hvac",
    rating: 5, review: "Erg vriendelijk en vakkundig. Alles uitgelegd. Top!",
    status: "afgerond",
  },
  {
    id: "k6", naam: "Lekkage reparatie", klant: "Daan Roos", avatar: "https://i.pravatar.cc/150?img=15",
    datum: "17 mei 2026", prijs: 85, duur: "1u", categorie: "loodgieter",
    rating: 4, review: "Goede vakman, al had ik liever wat meer uitleg gekregen over de oorzaak.",
    status: "afgerond",
  },
];

const RAPPORT = {
  gegenereerd: "19 mei 2026",
  naam: "Marco van den Berg",
  aantalReviews: 127,
  gemRating: 4.9,
  sterkePunten: [
    {
      titel: "Snelheid & reactietijd",
      omschrijving: "Klanten waarderen jouw snelle aankomst en werksnelheid. Woorden als 'snel', 'vlot' en 'meteen' komen 43× voor in reviews.",
    },
    {
      titel: "Vakmanschap",
      omschrijving: "'Netjes', 'vakkundig' en 'strak' worden herhaaldelijk genoemd. Klanten vertrouwen op jouw technische kwaliteit.",
    },
    {
      titel: "Betrouwbaarheid",
      omschrijving: "Je doet wat je belooft. Klanten geven aan dat je afspraken nakomt en transparant bent over kosten.",
    },
  ],
  verbeterpunten: [
    {
      nummer: 1,
      titel: "Communicatie bij vertraging",
      percentage: 12,
      probleem: "12% van je reviews noemt dat je later arriveerde dan verwacht zonder tijdige melding.",
      tip: "Stuur een bericht als je meer dan 15 minuten vertraging hebt. Één simpel berichtje voorkomt frustratie.",
      impact: "hoog",
    },
    {
      nummer: 2,
      titel: "Uitleg na de klus",
      percentage: 8,
      probleem: "8% van klanten wilde meer uitleg over de oorzaak van het probleem en wat er gedaan is.",
      tip: "Neem 2 minuten na de klus om kort te bespreken wat het probleem was en hoe je het hebt opgelost.",
      impact: "middel",
    },
    {
      nummer: 3,
      titel: "Opruimen na werkzaamheden",
      percentage: 5,
      probleem: "5% van reviews benoemt dat er wat troep achterbleef na de werkzaamheden.",
      tip: "Een klein zakje voor afval meenemen en de werkplek netjes achterlaten maakt een groot verschil.",
      impact: "laag",
    },
  ],
  categorieën: [
    { naam: "Loodgieterwerk", emoji: "🔧", rating: 4.85, klussen: 89, kleur: "#0F6E56" },
    { naam: "HVAC", emoji: "❄️", rating: 4.90, klussen: 38, kleur: "#4f46e5" },
  ],
  aanbeveling: "Focus op proactieve communicatie bij vertragingen. Dit ene verbeterpunt kan jouw gemiddelde score van 4.9 naar 5.0 tillen — waardoor je de #1 positie op het leaderboard kunt bereiken.",
};

function generateHtmlRapport(): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Servr AI Verbeterrapport — ${RAPPORT.naam}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px 16px; }
    .wrapper { max-width: 680px; margin: 0 auto; }

    /* Header */
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; color: white; }
    .header-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .header-logo-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .header-logo-text { font-size: 18px; font-weight: 900; }
    .header-logo-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }
    .header-name { font-size: 28px; font-weight: 900; margin-bottom: 4px; }
    .header-meta { opacity: 0.75; font-size: 13px; }
    .header-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 20px; }
    .header-stat { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; text-align: center; }
    .header-stat-val { font-size: 22px; font-weight: 900; }
    .header-stat-label { font-size: 11px; opacity: 0.7; margin-top: 2px; }

    /* Sections */
    .section { background: white; border-radius: 16px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .section-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 800; margin-bottom: 18px; }
    .section-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }

    /* Sterke punten */
    .sterk-item { display: flex; gap: 12px; padding: 14px; background: #f0fdf4; border-radius: 12px; margin-bottom: 10px; border-left: 3px solid #22c55e; }
    .sterk-icon { width: 28px; height: 28px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; flex-shrink: 0; margin-top: 1px; }
    .sterk-titel { font-size: 14px; font-weight: 700; color: #166534; margin-bottom: 3px; }
    .sterk-omschrijving { font-size: 13px; color: #4b5563; line-height: 1.5; }

    /* Verbeterpunten */
    .verbeter-item { background: #fffbeb; border-radius: 12px; padding: 16px; margin-bottom: 12px; border-left: 3px solid #f59e0b; }
    .verbeter-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .verbeter-nr { width: 24px; height: 24px; background: #f59e0b; color: white; border-radius: 50%; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .verbeter-titel { font-size: 14px; font-weight: 700; color: #92400e; flex: 1; }
    .impact-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .impact-hoog { background: #fecaca; color: #dc2626; }
    .impact-middel { background: #fde68a; color: #d97706; }
    .impact-laag { background: #d1fae5; color: #059669; }
    .verbeter-pct { font-size: 12px; color: #78350f; margin-bottom: 6px; }
    .verbeter-probleem { font-size: 13px; color: #4b5563; margin-bottom: 10px; line-height: 1.5; }
    .tip-box { background: rgba(245,158,11,0.1); border-radius: 8px; padding: 10px 12px; display: flex; gap: 8px; }
    .tip-label { font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .tip-text { font-size: 13px; color: #374151; line-height: 1.4; }

    /* Categorieën */
    .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .cat-item { border-radius: 12px; padding: 16px; text-align: center; }
    .cat-emoji { font-size: 28px; margin-bottom: 8px; display: block; }
    .cat-naam { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .cat-rating { font-size: 22px; font-weight: 900; }
    .cat-klussen { font-size: 11px; opacity: 0.7; margin-top: 3px; }
    .stars { color: #f59e0b; font-size: 14px; margin-bottom: 4px; }

    /* Aanbeveling */
    .aanbeveling { background: linear-gradient(135deg, #0F6E56 0%, #065f46 100%); border-radius: 16px; padding: 24px; color: white; margin-bottom: 16px; }
    .aanbeveling-title { font-size: 15px; font-weight: 800; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
    .aanbeveling-text { font-size: 14px; line-height: 1.6; opacity: 0.9; }

    /* Footer */
    .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 16px; }
    .footer strong { color: #7c3aed; }
  </style>
</head>
<body>
<div class="wrapper">

  <div class="header">
    <div class="header-logo">
      <div class="header-logo-icon">✦</div>
      <div>
        <div class="header-logo-text">Servr AI Verbeterrapport</div>
        <div class="header-logo-sub">Gegenereerd op ${RAPPORT.gegenereerd}</div>
      </div>
    </div>
    <div class="header-name">${RAPPORT.naam}</div>
    <div class="header-meta">Analyse op basis van ${RAPPORT.aantalReviews} klantreviews</div>
    <div class="header-stats">
      <div class="header-stat">
        <div class="header-stat-val">${RAPPORT.aantalReviews}</div>
        <div class="header-stat-label">Reviews</div>
      </div>
      <div class="header-stat">
        <div class="header-stat-val">⭐ ${RAPPORT.gemRating}</div>
        <div class="header-stat-label">Gem. rating</div>
      </div>
      <div class="header-stat">
        <div class="header-stat-val">#2</div>
        <div class="header-stat-label">Leaderboard</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <div class="section-icon" style="background:#dcfce7;">✓</div>
      Sterke punten
    </div>
    ${RAPPORT.sterkePunten.map(s => `
    <div class="sterk-item">
      <div class="sterk-icon">✓</div>
      <div>
        <div class="sterk-titel">${s.titel}</div>
        <div class="sterk-omschrijving">${s.omschrijving}</div>
      </div>
    </div>`).join("")}
  </div>

  <div class="section">
    <div class="section-title">
      <div class="section-icon" style="background:#fef3c7;">▲</div>
      Verbeterpunten
    </div>
    ${RAPPORT.verbeterpunten.map(v => `
    <div class="verbeter-item">
      <div class="verbeter-header">
        <div class="verbeter-nr">${v.nummer}</div>
        <div class="verbeter-titel">${v.titel}</div>
        <span class="impact-badge impact-${v.impact}">${v.impact.charAt(0).toUpperCase() + v.impact.slice(1)}</span>
      </div>
      <div class="verbeter-pct">Voorkomt in ${v.percentage}% van reviews</div>
      <div class="verbeter-probleem">${v.probleem}</div>
      <div class="tip-box">
        <div>
          <div class="tip-label">💡 Tip</div>
          <div class="tip-text">${v.tip}</div>
        </div>
      </div>
    </div>`).join("")}
  </div>

  <div class="section">
    <div class="section-title">
      <div class="section-icon" style="background:#ede9fe;">📊</div>
      Categorie-analyse
    </div>
    <div class="cat-grid">
      ${RAPPORT.categorieën.map(c => `
      <div class="cat-item" style="background:${c.kleur}12;">
        <span class="cat-emoji">${c.emoji}</span>
        <div class="stars">${"★".repeat(Math.round(c.rating))}${"☆".repeat(5 - Math.round(c.rating))}</div>
        <div class="cat-naam">${c.naam}</div>
        <div class="cat-rating" style="color:${c.kleur}">${c.rating}/5</div>
        <div class="cat-klussen">${c.klussen} klussen</div>
      </div>`).join("")}
    </div>
  </div>

  <div class="aanbeveling">
    <div class="aanbeveling-title">🎯 Aanbeveling</div>
    <div class="aanbeveling-text">${RAPPORT.aanbeveling}</div>
  </div>

  <div class="footer">
    Gegenereerd door <strong>Servr AI</strong> · ${RAPPORT.gegenereerd} · Vertrouwelijk document voor ${RAPPORT.naam}
  </div>

</div>
</body>
</html>`;
}

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

const IMPACT_STYLE: Record<string, { bg: string; color: string }> = {
  hoog: { bg: "#fecaca", color: "#dc2626" },
  middel: { bg: "#fde68a", color: "#d97706" },
  laag: { bg: "#d1fae5", color: "#059669" },
};

export default function KlussenPage() {
  const [catFilter, setCatFilter] = useState<Categorie>("alle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRapport, setShowRapport] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const filtered = KLUSSEN.filter(k => catFilter === "alle" || k.categorie === catFilter);

  const gemRating = (KLUSSEN.reduce((s, k) => s + k.rating, 0) / KLUSSEN.length).toFixed(1);
  const totaalNetto = KLUSSEN.reduce((s, k) => s + k.prijs, 0) * 0.9;

  const handleDownload = () => {
    const html = generateHtmlRapport();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Servr_AI_Verbeterrapport_Marco.html";
    a.click();
    URL.revokeObjectURL(url);
    setDownloadDone(true);
    setTimeout(() => setDownloadDone(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-xl">Mijn klussen</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{KLUSSEN.length} afgerond · ⭐ {gemRating} gem.</p>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Klussen", value: KLUSSEN.length.toString(), color: "var(--foreground)" },
            { label: "Gem. rating", value: `⭐ ${gemRating}`, color: "#f59e0b" },
            { label: "Netto", value: `€${Math.round(totaalNetto)}`, color: "var(--teal)" },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className="font-black text-xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* AI Rapport banner */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} color="white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-sm">AI Verbeterrapport</p>
                <p className="text-white/70 text-xs mt-0.5">
                  Gegenereerd op basis van {RAPPORT.aantalReviews} reviews · {RAPPORT.gegenereerd}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowRapport(!showRapport)}
                className="touch-scale flex-1 py-2.5 rounded-xl bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5">
                {showRapport ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showRapport ? "Verberg" : "Bekijk rapport"}
              </button>
              <button onClick={handleDownload}
                className="touch-scale flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                style={{ background: downloadDone ? "#22c55e" : "white", color: downloadDone ? "white" : "#7c3aed" }}>
                {downloadDone
                  ? <><CheckCircle size={13} /> Gedownload!</>
                  : <><Download size={13} /> Download rapport</>}
              </button>
            </div>
          </div>

          {/* In-app rapport weergave */}
          {showRapport && (
            <div className="border-t border-white/20">

              {/* Overzicht stats */}
              <div className="grid grid-cols-3 gap-0 border-b border-white/20">
                {[
                  { val: RAPPORT.aantalReviews, label: "Reviews" },
                  { val: `⭐ ${RAPPORT.gemRating}`, label: "Gem. rating" },
                  { val: "#2", label: "Leaderboard" },
                ].map((s, i) => (
                  <div key={i} className="py-4 text-center"
                    style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.15)" : "none" }}>
                    <p className="text-white font-black text-xl">{s.val}</p>
                    <p className="text-white/60 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Sterke punten */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.25)" }}>
                    <TrendingUp size={13} color="#86efac" />
                  </div>
                  <p className="text-white font-black text-xs uppercase tracking-wider">Sterke punten</p>
                </div>
                <div className="flex flex-col gap-2">
                  {RAPPORT.sterkePunten.map((s, i) => (
                    <div key={i} className="rounded-xl p-3 flex gap-2.5"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-white">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{s.titel}</p>
                        <p className="text-white/65 text-[11px] mt-0.5 leading-relaxed">{s.omschrijving}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verbeterpunten */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(251,191,36,0.25)" }}>
                    <AlertTriangle size={13} color="#fde68a" />
                  </div>
                  <p className="text-white font-black text-xs uppercase tracking-wider">Verbeterpunten</p>
                </div>
                <div className="flex flex-col gap-2">
                  {RAPPORT.verbeterpunten.map((v) => (
                    <div key={v.nummer} className="rounded-xl overflow-hidden"
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "#f59e0b" }}>
                            <span className="text-[9px] font-black text-white">{v.nummer}</span>
                          </div>
                          <p className="text-white font-bold text-xs flex-1">{v.titel}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: IMPACT_STYLE[v.impact].bg, color: IMPACT_STYLE[v.impact].color }}>
                            {v.impact.charAt(0).toUpperCase() + v.impact.slice(1)}
                          </span>
                        </div>
                        <p className="text-white/60 text-[10px] mb-2">Voorkomt in {v.percentage}% van reviews</p>
                        <p className="text-white/75 text-[11px] leading-relaxed">{v.probleem}</p>
                      </div>
                      <div className="px-3 pb-3">
                        <div className="rounded-lg p-2.5 flex gap-2"
                          style={{ background: "rgba(245,158,11,0.15)" }}>
                          <Lightbulb size={12} color="#fde68a" className="flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-yellow-200 text-[9px] font-black uppercase tracking-wider mb-0.5">Tip</p>
                            <p className="text-white/80 text-[11px] leading-relaxed">{v.tip}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categorie analyse */}
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.15)" }}>
                    <BarChart2 size={13} color="white" />
                  </div>
                  <p className="text-white font-black text-xs uppercase tracking-wider">Categorie-analyse</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {RAPPORT.categorieën.map((c) => (
                    <div key={c.naam} className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.1)" }}>
                      <span className="text-2xl">{c.emoji}</span>
                      <div className="flex justify-center gap-0.5 my-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={9} className={i < Math.round(c.rating) ? "fill-yellow-300 text-yellow-300" : "fill-white/20 text-white/20"} />
                        ))}
                      </div>
                      <p className="text-white font-bold text-xs">{c.naam}</p>
                      <p className="text-white font-black text-lg mt-0.5">{c.rating}/5</p>
                      <p className="text-white/50 text-[10px]">{c.klussen} klussen</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aanbeveling */}
              <div className="mx-4 mb-4 rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🎯</span>
                  <p className="text-white font-black text-xs">Aanbeveling</p>
                </div>
                <p className="text-white/80 text-[11px] leading-relaxed">{RAPPORT.aanbeveling}</p>
              </div>

            </div>
          )}
        </div>

        {/* Categorie filter */}
        <div className="flex gap-2">
          {[
            { id: "alle", label: "Alle categorieën" },
            { id: "loodgieter", label: "🔧 Loodgieter" },
            { id: "hvac", label: "❄️ HVAC" },
          ].map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id as Categorie)}
              className="touch-scale px-3 py-2 rounded-full text-xs font-semibold border transition-all flex-shrink-0"
              style={{
                borderColor: catFilter === c.id ? "var(--teal)" : "var(--border)",
                background: catFilter === c.id ? "var(--teal)" + "15" : "transparent",
                color: catFilter === c.id ? "var(--teal)" : "var(--muted)",
              }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Klussen lijst */}
        <div className="flex flex-col gap-3">
          {filtered.map(k => (
            <div key={k.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === k.id ? null : k.id)}
                className="w-full p-4 flex items-start gap-3 text-left">
                <img src={k.avatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm">{k.naam}</p>
                    <span className="font-black text-sm flex-shrink-0" style={{ color: "var(--teal)" }}>
                      €{fmt(k.prijs * 0.9)}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{k.klant} · {k.datum}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Stars rating={k.rating} />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      <Clock size={10} className="inline mr-0.5" />{k.duur}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "var(--teal)" + "12", color: "var(--teal)" }}>
                      ✓ Afgerond
                    </span>
                  </div>
                </div>
                {expandedId === k.id
                  ? <ChevronUp size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  : <ChevronDown size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />}
              </button>

              {expandedId === k.id && (
                <div className="px-4 pb-4 animate-slide-up">
                  <div className="border-t pt-3 mt-1" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Stars rating={k.rating} />
                      <span className="font-bold text-xs">{k.rating}/5</span>
                    </div>
                    <p className="text-sm italic leading-relaxed" style={{ color: "var(--muted)" }}>
                      "{k.review}"
                    </p>
                    <p className="text-xs mt-2 font-semibold" style={{ color: "var(--muted)" }}>— {k.klant}</p>

                    <div className="mt-3 p-3 rounded-xl grid grid-cols-3 gap-2" style={{ background: "var(--surface-2)" }}>
                      <div className="text-center">
                        <p className="font-bold text-sm">€{fmt(k.prijs)}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>Bruto</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm" style={{ color: "#dc2626" }}>-€{fmt(k.prijs * 0.1)}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>Servr (10%)</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm" style={{ color: "var(--teal)" }}>€{fmt(k.prijs * 0.9)}</p>
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>Netto</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
