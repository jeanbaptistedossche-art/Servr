"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Camera, Upload, Zap, AlertTriangle,
  Check, RefreshCw, Euro, Clock, Wrench, ChevronRight,
  Scan, Info, Star, FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AnalyseStatus = "idle" | "uploading" | "analysing" | "done" | "error";

type SchadeItem = {
  type: string;
  ernst: "laag" | "gemiddeld" | "hoog" | "kritiek";
  beschrijving: string;
  kans: number;       // 0-100
  kostenMin: number;
  kostenMax: number;
  urgentie: "kan wachten" | "binnenkort" | "urgent" | "direct";
  aanbevelingen: string[];
};

type AnalyseResultaat = {
  overzicht: string;
  score: number;    // 0-100, hogere score = betere conditie
  items: SchadeItem[];
  totalKostenMin: number;
  totalKostenMax: number;
  urgentieKleur: string;
};

// ─── Mock analyse resultaten ──────────────────────────────────────────────────
const MOCK_RESULTATEN: AnalyseResultaat = {
  overzicht: "De AI heeft meerdere problemen gedetecteerd. Er is vochtschade zichtbaar op de muur en het plafond vertoont haarscheuren. De dakgoot rechts is mogelijk verstopt.",
  score: 62,
  items: [
    {
      type: "Vochtschade muur",
      ernst: "hoog",
      beschrijving: "Zichtbare vochtvlekken op de ondermuur, vermoedelijk door lekkage via fundering of spouwmuur.",
      kans: 92,
      kostenMin: 450,
      kostenMax: 1800,
      urgentie: "urgent",
      aanbevelingen: ["Bron van vocht opsporen", "Vochtmeting laten uitvoeren", "Eventueel injecties spouwmuur"],
    },
    {
      type: "Haarscheuren plafond",
      ernst: "gemiddeld",
      beschrijving: "Meerdere fijne scheuren in het stucwerk, waarschijnlijk door krimp of lichte zetting.",
      kans: 85,
      kostenMin: 120,
      kostenMax: 350,
      urgentie: "binnenkort",
      aanbevelingen: ["Scheuren vullen met elastisch kit", "Overschilderen met dampopen verf"],
    },
    {
      type: "Verstopte dakgoot",
      ernst: "gemiddeld",
      beschrijving: "Op basis van de waterstrepen op de gevel lijkt de dakgoot overlopend bij regen.",
      kans: 73,
      kostenMin: 80,
      kostenMax: 150,
      urgentie: "binnenkort",
      aanbevelingen: ["Dakgoten uitspuiten en reinigen", "Controle afvoerleidingen"],
    },
    {
      type: "Verouderd verfwerk buitengevel",
      ernst: "laag",
      beschrijving: "Schilderwerk vertoont slijtage, maar nog geen acuut gevaar voor houtrot.",
      kans: 68,
      kostenMin: 800,
      kostenMax: 2200,
      urgentie: "kan wachten",
      aanbevelingen: ["Schuren en 2 lagen buiten latex", "Houtwerk inspecteren op rot"],
    },
  ],
  totalKostenMin: 1450,
  totalKostenMax: 4500,
  urgentieKleur: "#F59E0B",
};

// ─── Config ───────────────────────────────────────────────────────────────────
const ERNST_CFG = {
  laag:      { bg: "#DCFCE7", color: "#16A34A", label: "Laag" },
  gemiddeld: { bg: "#FEF3C7", color: "#D97706", label: "Gemiddeld" },
  hoog:      { bg: "#FEE2E2", color: "#DC2626", label: "Hoog" },
  kritiek:   { bg: "#500724", color: "#FDA4AF", label: "Kritiek" },
};
const URGENTIE_CFG = {
  "kan wachten": { color: "#64748b", label: "Kan wachten" },
  "binnenkort":  { color: "#D97706", label: "Binnenkort aanpakken" },
  "urgent":      { color: "#EF4444", label: "Urgent" },
  "direct":      { color: "#7F1D1D", label: "Direct handelen!" },
};

function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SchadedetectiePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<AnalyseStatus>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [resultaat, setResultaat] = useState<AnalyseResultaat | null>(null);
  const [showItem, setShowItem] = useState<SchadeItem | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      setPreview(e.target?.result as string);
      setStatus("uploading");
      setProgress(0);

      // Simulate upload + analysis
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 15;
        setProgress(Math.min(p, 95));
        if (p >= 40) setStatus("analysing");
        if (p >= 95) {
          clearInterval(iv);
          setProgress(100);
          setTimeout(() => {
            setStatus("done");
            setResultaat(MOCK_RESULTAAT_FROM_FILE());
          }, 500);
        }
      }, 200);
    };
    reader.readAsDataURL(file);
  }, []);

  function MOCK_RESULTAAT_FROM_FILE() {
    // Return mock with slight randomization
    return { ...MOCK_RESULTATEN, score: 55 + Math.round(Math.random() * 20) };
  }

  const scoreColor = resultaat
    ? resultaat.score >= 80 ? "#10B981"
    : resultaat.score >= 60 ? "#F59E0B"
    : "#EF4444"
    : "#94a3b8";

  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>AI Schadedetectie</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Foto analyseren op schade</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 mt-4 flex flex-col gap-4">

        {/* Upload zone */}
        {status === "idle" && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <div className="rounded-2xl p-4 flex gap-3"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <Zap size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>AI-gestuurde schadeanalyse</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                  Maak een foto van de schade. Onze AI herkent het type, schat de ernst en geeft een kostenraming.
                </p>
              </div>
            </div>

            <button onClick={() => fileRef.current?.click()}
              className="touch-scale w-full rounded-3xl flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed"
              style={{ borderColor: "#C7D2FE", background: "#fff" }}>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
                <Camera size={36} style={{ color: "#fff" }} />
              </div>
              <div className="text-center">
                <p className="font-black text-lg" style={{ color: "#0f172a" }}>Foto uploaden</p>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>Muur · dak · vloer · fundering</p>
              </div>
              <span className="text-xs font-bold px-4 py-2 rounded-full"
                style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                Tik om te selecteren
              </span>
            </button>

            {/* Voorbeeld categorieën */}
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
              AI detecteert o.a.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: "💧", label: "Vochtschade", desc: "Vochtvlekken, condensatie, lekkage" },
                { icon: "🪨", label: "Scheuren", desc: "Haarscheuren, zettingsscheuren" },
                { icon: "🦠", label: "Schimmel", desc: "Zwarte/groene aanslag, sporen" },
                { icon: "🎨", label: "Verfschade", desc: "Blaren, schilferen, roestdoorslag" },
                { icon: "🪟", label: "Kozijnrot", desc: "Houtrot, kitranden, condensatie DP" },
                { icon: "🏗️", label: "Structureel", desc: "Fundering, steenverband, dakconstructie" },
              ].map(c => (
                <div key={c.label} className="rounded-2xl p-3 flex items-center gap-2.5"
                  style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <span className="text-xl">{c.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: "#0f172a" }}>{c.label}</p>
                    <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Uploading / Analysing */}
        {(status === "uploading" || status === "analysing") && (
          <div className="flex flex-col items-center gap-6 py-8">
            {preview && (
              <div className="w-full rounded-3xl overflow-hidden"
                style={{ maxHeight: 260, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <img src={preview} alt="upload" className="w-full object-cover" style={{ maxHeight: 260 }} />
              </div>
            )}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold" style={{ color: "#0f172a" }}>
                  {status === "uploading" ? "📤 Foto uploaden…" : "🤖 AI analyseert foto…"}
                </p>
                <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{Math.round(progress)}%</p>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #4F46E5, #7C3AED)" }} />
              </div>
              <p className="text-xs mt-2 text-center" style={{ color: "#64748b" }}>
                {status === "uploading" ? "Beveiligde verbinding…" : "Schadepatronen worden herkend…"}
              </p>
            </div>
          </div>
        )}

        {/* Resultaat */}
        {status === "done" && resultaat && (
          <>
            {/* Preview + score */}
            <div className="rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}>
              {preview && (
                <img src={preview} alt="analyse" className="w-full object-cover" style={{ maxHeight: 200 }} />
              )}
              <div className="p-4" style={{ background: "#fff" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Conditiescore</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>Op basis van gedetecteerde problemen</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: `${scoreColor}15` }}>
                      <p className="font-black text-2xl" style={{ color: scoreColor }}>{resultaat.score}</p>
                    </div>
                  </div>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${resultaat.score}%`, background: scoreColor }} />
                </div>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: "#374151" }}>
                  {resultaat.overzicht}
                </p>
              </div>
            </div>

            {/* Kostenraming */}
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <div>
                <p className="text-xs font-bold" style={{ color: "#D97706" }}>Geschatte herstelkosten</p>
                <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>Alle gedetecteerde problemen samen</p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg" style={{ color: "#D97706" }}>
                  {fmtEur(resultaat.totalKostenMin)} – {fmtEur(resultaat.totalKostenMax)}
                </p>
              </div>
            </div>

            {/* Gevonden problemen */}
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
              {resultaat.items.length} problemen gedetecteerd
            </p>
            <div className="flex flex-col gap-3">
              {resultaat.items.map((item, idx) => {
                const ernst = ERNST_CFG[item.ernst];
                const urg = URGENTIE_CFG[item.urgentie];
                return (
                  <div key={idx} onClick={() => setShowItem(item)}
                    className="touch-scale rounded-2xl p-4 cursor-pointer"
                    style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{item.type}</p>
                        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#64748b" }}>
                          {item.beschrijving.length > 80 ? item.beschrijving.slice(0, 80) + "…" : item.beschrijving}
                        </p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: ernst.bg, color: ernst.color }}>
                        {ernst.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: urg.color }}>
                        ⚡ {urg.label}
                      </p>
                      <p className="text-xs font-bold" style={{ color: "#4F46E5" }}>
                        {fmtEur(item.kostenMin)} – {fmtEur(item.kostenMax)}
                      </p>
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${item.kans}%`, background: ernst.color }} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        {item.kans}% zekerheid
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acties */}
            <button className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}>
              <Wrench size={20} /> Vakman zoeken via Servr
            </button>
            <button onClick={() => { setStatus("idle"); setPreview(null); setResultaat(null); }}
              className="touch-scale w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: "#fff", color: "#64748b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <RefreshCw size={16} /> Nieuwe foto analyseren
            </button>
          </>
        )}
      </div>

      {/* Detail sheet */}
      {showItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowItem(null)}>
          <div className="rounded-t-3xl overflow-y-auto"
            style={{ background: "#fff", maxHeight: "85dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>{showItem.type}</h2>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: ERNST_CFG[showItem.ernst].bg, color: ERNST_CFG[showItem.ernst].color }}>
                  {ERNST_CFG[showItem.ernst].label}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>
                {showItem.beschrijving}
              </p>
              <div className="rounded-2xl p-4 mb-4"
                style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-xs font-bold mb-1" style={{ color: "#D97706" }}>Kostenraming</p>
                <p className="font-black text-xl" style={{ color: "#D97706" }}>
                  {fmtEur(showItem.kostenMin)} – {fmtEur(showItem.kostenMax)}
                </p>
              </div>
              <p className="text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>AANBEVELINGEN</p>
              {showItem.aanbevelingen.map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-2"
                  style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <Check size={14} style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }} />
                  <p className="text-sm" style={{ color: "#374151" }}>{a}</p>
                </div>
              ))}
              <button className="touch-scale w-full py-4 rounded-2xl font-bold text-white mt-5 flex items-center justify-center gap-2"
                style={{ background: "#4F46E5" }}>
                <Wrench size={18} /> Vakman zoeken voor dit probleem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
