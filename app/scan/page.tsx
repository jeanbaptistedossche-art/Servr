"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Upload, Zap, AlertTriangle, Clock, ChevronRight } from "lucide-react";

type Result = {
  categorie: string;
  beschrijving: string;
  prijsMin: number;
  prijsMax: number;
  urgentie: "laag" | "middel" | "hoog";
  tijdschatting: string;
  tips: string[];
};

const URGENCY_COLOR = { laag: "#16a34a", middel: "#d97706", hoog: "#dc2626" };
const URGENCY_LABEL = { laag: "Laag", middel: "Gemiddeld", hoog: "Hoog" };

export default function ScanPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = async e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type;
      setLoading(true);
      try {
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Er is iets misgegaan");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col min-h-full px-5 pt-14 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-black text-xl">AI Prijsscanner</h1>
          <p className="text-xs" style={{ color: "#8A8A83" }}>Foto → direct prijsschatting</p>
        </div>
        <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: "#2B4030", color: "white" }}>
          AI
        </span>
      </div>

      {/* Upload zone */}
      {!preview ? (
        <div
          className="flex flex-col items-center justify-center gap-5 py-16 rounded-3xl border-2 border-dashed"
          style={{ borderColor: "#E5DDD0", background: "#FBF7F0" }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "#2B4030" + "18" }}>
            <Camera size={40} style={{ color: "#2B4030" }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-base">Foto toevoegen</p>
            <p className="text-sm mt-1" style={{ color: "#8A8A83" }}>
              Maak een foto of kies uit je galerij<br />en krijg direct een prijsschatting
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Camera knop — opent rechtstreeks de camera */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="touch-scale flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm"
              style={{ background: "#2B4030", color: "white" }}>
              <Camera size={15} /> Camera
            </button>
            {/* Galerij knop — opent foto-galerij / bestanden */}
            <button
              onClick={() => galleryRef.current?.click()}
              className="touch-scale flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border"
              style={{ borderColor: "#E5DDD0" }}>
              <Upload size={15} /> Galerij
            </button>
          </div>

          {/* Hidden inputs — één voor camera, één voor galerij */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ""; } }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = ""; } }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Preview */}
          <div className="relative rounded-3xl overflow-hidden">
            <img src={preview} alt="scan" className="w-full h-56 object-cover" />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: "rgba(15,110,86,0.85)", backdropFilter: "blur(4px)" }}>
                <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full"
                  style={{ animation: "spin 0.8s linear infinite", borderWidth: 3, borderColor: "white", borderTopColor: "transparent" }} />
                <p className="text-white font-semibold text-sm">AI analyseert foto...</p>
              </div>
            )}
            <button
              onClick={() => { setPreview(null); setResult(null); }}
              className="absolute top-3 right-3 touch-scale w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <span className="text-white text-sm font-bold">✕</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "#fee2e2", color: "#dc2626" }}>
              <AlertTriangle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Resultaat */}
          {result && (
            <div className="flex flex-col gap-4 animate-slide-up">
              {/* Prijs banner */}
              <div className="rounded-3xl p-5 text-center"
                style={{ background: "linear-gradient(135deg, #2B4030 0%, #1A2D22 100%)" }}>
                <p className="text-white/70 text-sm mb-1">Geschatte prijs</p>
                <p className="text-white text-4xl font-black">
                  €{result.prijsMin} – €{result.prijsMax}
                </p>
                <p className="text-white/80 text-sm mt-1">{result.categorie}</p>
              </div>

              {/* Details */}
              <div className="card p-4 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: "#8A8A83" }}>Probleem</p>
                  <p className="text-sm font-medium">{result.beschrijving}</p>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 p-3 rounded-xl" style={{ background: "#EDE4D2" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle size={13} style={{ color: URGENCY_COLOR[result.urgentie] }} />
                      <p className="text-xs font-bold" style={{ color: "#8A8A83" }}>Urgentie</p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: URGENCY_COLOR[result.urgentie] }}>
                      {URGENCY_LABEL[result.urgentie]}
                    </p>
                  </div>
                  <div className="flex-1 p-3 rounded-xl" style={{ background: "#EDE4D2" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock size={13} style={{ color: "#8A8A83" }} />
                      <p className="text-xs font-bold" style={{ color: "#8A8A83" }}>Tijd</p>
                    </div>
                    <p className="text-sm font-bold">{result.tijdschatting}</p>
                  </div>
                </div>

                {result.tips?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase mb-2" style={{ color: "#8A8A83" }}>Tips</p>
                    <div className="flex flex-col gap-1.5">
                      {result.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-sm mt-0.5" style={{ color: "#2B4030" }}>💡</span>
                          <p className="text-sm" style={{ color: "#8A8A83" }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-3">
                <Link href="/panic"
                  className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center flex items-center justify-center gap-2"
                  style={{ background: "#C97A4D" }}>
                  <Zap size={18} /> Panic Button — direct vakman
                </Link>
                <Link href="/search"
                  className="touch-scale w-full py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2 border"
                  style={{ borderColor: "#2B4030", color: "#2B4030" }}>
                  Zoek vakman <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {!preview && (
        <div className="mt-8 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase" style={{ color: "#8A8A83" }}>Hoe werkt het?</p>
          {[
            ["📸", "Maak een foto van het probleem"],
            ["🤖", "AI analyseert de situatie"],
            ["💰", "Je krijgt een eerlijke prijsrange"],
            ["🔧", "Boek direct de juiste vakman"],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl w-8 flex-shrink-0">{icon}</span>
              <p className="text-sm" style={{ color: "#8A8A83" }}>{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
