"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Shield, CheckCircle2, Clock, X,
  Camera, Upload, AlertCircle, User, FileText,
  Fingerprint, Star, ChevronRight, Lock, Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type VerifStatus = "niet_geverifieerd" | "in_behandeling" | "geverifieerd" | "afgekeurd";
type DocType = "paspoort" | "id_kaart" | "rijbewijs";

interface VerifStap {
  id: string;
  titel: string;
  beschrijving: string;
  status: "wacht" | "bezig" | "klaar" | "fout";
  vereist: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<VerifStatus, { label: string; color: string; bg: string; emoji: string; beschrijving: string }> = {
  niet_geverifieerd: { label: "Niet geverifieerd", color: "#DC2626", bg: "#FEF2F2", emoji: "⚠️", beschrijving: "Verifieer je identiteit om te kunnen werken via Servr." },
  in_behandeling:    { label: "In behandeling",    color: "#D97706", bg: "#FFFBEB", emoji: "⏳", beschrijving: "Je verificatie wordt gecontroleerd. Dit duurt 1-2 werkdagen." },
  geverifieerd:      { label: "Geverifieerd",       color: "#059669", bg: "#ECFDF5", emoji: "✅", beschrijving: "Je identiteit is bevestigd. Je hebt volledig toegang tot Servr." },
  afgekeurd:         { label: "Afgekeurd",          color: "#DC2626", bg: "#FEF2F2", emoji: "❌", beschrijving: "Je verificatie is niet geslaagd. Probeer opnieuw met duidelijker documenten." },
};

const VERIFIED_BADGES = [
  { label: "Identiteit", emoji: "🪪", kleur: "#4F46E5" },
  { label: "Adres",      emoji: "🏠", kleur: "#10B981" },
  { label: "KvK / BTW",  emoji: "🏢", kleur: "#0EA5E9" },
  { label: "VOG",        emoji: "📋", kleur: "#8B5CF6" },
];

const INIT_STAPPEN: VerifStap[] = [
  { id:"1", titel: "Persoonlijke gegevens",  beschrijving: "Naam, geboortedatum en adres invullen", status: "klaar",   vereist: true },
  { id:"2", titel: "Identiteitsdocument",    beschrijving: "Foto van paspoort, ID-kaart of rijbewijs", status: "klaar",  vereist: true },
  { id:"3", titel: "Selfie verificatie",     beschrijving: "Maak een selfie om je identiteit te bevestigen", status: "bezig", vereist: true },
  { id:"4", titel: "KvK registratie",        beschrijving: "Koppel je KvK-nummer (voor vakmans)", status: "wacht",  vereist: false },
  { id:"5", titel: "VOG aanvragen",          beschrijving: "Verklaring Omtrent Gedrag via overheid.nl", status: "wacht",  vereist: false },
  { id:"6", titel: "Bankrekening koppelen",  beschrijving: "Verify je IBAN voor uitbetalingen", status: "wacht",   vereist: true },
];

// ── Self-capture screen ────────────────────────────────────────────────────
function SelfieScreen({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [stap, setStap] = useState<"instructie" | "camera" | "review">("instructie");
  const [progress, setProgress] = useState(0);

  const startScan = () => {
    setStap("camera");
    let p = 0;
    const interval = setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStap("review");
      }
    }, 60);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#000" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4"
        style={{ background: "rgba(0,0,0,0.8)" }}>
        <button onClick={onClose}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <X size={18} color="white" />
        </button>
        <p className="font-black text-white text-base">Selfie verificatie</p>
        <div className="w-10" />
      </div>

      {stap === "instructie" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-48 h-48 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}>
            <User size={72} color="rgba(255,255,255,0.4)" />
          </div>
          <div className="text-center">
            <p className="font-black text-white text-xl">Selfie verificatie</p>
            <div className="flex flex-col gap-2 mt-4">
              {["Zorg voor goede belichting", "Kijk recht in de camera", "Houd jouw gezicht in het kader"].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <Check size={14} color="#4ade80" />
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={startScan}
            className="touch-scale w-full max-w-xs py-4 rounded-2xl font-black text-white"
            style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 32px rgba(79,70,229,0.5)" }}>
            <Camera size={18} className="inline mr-2" /> Scan starten
          </button>
        </div>
      )}

      {stap === "camera" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative w-64 h-64">
            <div className="w-full h-full rounded-full border-4 flex items-center justify-center"
              style={{ borderColor: `rgba(79,70,229,${progress / 100})`, background: "rgba(79,70,229,0.1)" }}>
              <User size={80} color="rgba(255,255,255,0.5)" />
            </div>
            {/* Scanning animation */}
            <div className="absolute inset-0 rounded-full border-4 animate-spin"
              style={{ borderColor: "transparent", borderTopColor: "#4F46E5", animationDuration: "1s" }} />
          </div>
          <div className="w-48 rounded-full overflow-hidden" style={{ height: 6, background: "rgba(255,255,255,0.1)" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "#4F46E5", transition: "width 0.1s" }} />
          </div>
          <p className="text-white font-medium">Bezig met analyseren... {progress}%</p>
        </div>
      )}

      {stap === "review" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 0 60px rgba(16,185,129,0.4)" }}>
            <CheckCircle2 size={60} color="white" />
          </div>
          <div className="text-center">
            <p className="font-black text-white text-2xl">Selfie goedgekeurd!</p>
            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>Je gezicht is succesvol gematcht met je identiteitsbewijs.</p>
          </div>
          <button onClick={onDone}
            className="touch-scale w-full max-w-xs py-4 rounded-2xl font-black text-white"
            style={{ background: "linear-gradient(135deg, #10B981, #34D399)", boxShadow: "0 8px 32px rgba(16,185,129,0.4)" }}>
            Doorgaan
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function IdVerificatiePage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerifStatus>("in_behandeling");
  const [stappen, setStappen] = useState<VerifStap[]>(INIT_STAPPEN);
  const [selectedDoc, setSelectedDoc] = useState<DocType>("paspoort");
  const [showSelfie, setShowSelfie] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "stappen" | "voordelen">("status");

  const statusCfg = STATUS_CFG[status];
  const klaarCount = stappen.filter(s => s.status === "klaar").length;
  const pct = Math.round((klaarCount / stappen.length) * 100);

  const afrondenSelfie = () => {
    setStappen(ss => ss.map(s => s.id === "3" ? { ...s, status: "klaar" } : s));
    setShowSelfie(false);
  };

  return (
    <>
      {showSelfie && <SelfieScreen onClose={() => setShowSelfie(false)} onDone={afrondenSelfie} />}

      <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

        {/* Header */}
        <div className="px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <ChevronLeft size={20} style={{ color: "#475569" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>ID Verificatie</h1>
            <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Verifieer jouw identiteit als vakman</p>
          </div>
        </div>

        <div className="px-5 flex flex-col gap-5">

          {/* Status hero */}
          <div className="rounded-3xl p-5"
            style={{ background: statusCfg.bg, border: `2px solid ${statusCfg.color}25`, boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">{statusCfg.emoji}</div>
              <div className="flex-1">
                <p className="font-black text-xl" style={{ color: statusCfg.color }}>{statusCfg.label}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#64748b" }}>{statusCfg.beschrijving}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(0,0,0,0.08)" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: statusCfg.color, borderRadius: 99 }} />
              </div>
              <span className="font-black text-sm flex-shrink-0" style={{ color: statusCfg.color }}>{klaarCount}/{stappen.length}</span>
            </div>
          </div>

          {/* Verified badges (if verified) */}
          {status === "geverifieerd" && (
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Verificatie badges</p>
              <div className="grid grid-cols-4 gap-2">
                {VERIFIED_BADGES.map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <span className="text-2xl">{b.emoji}</span>
                    <p className="text-[9px] font-black text-center" style={{ color: b.kleur }}>{b.label}</p>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: b.kleur }}>
                      <Check size={9} color="white" strokeWidth={3} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex p-1.5 rounded-2xl gap-1" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            {([["status","Status"], ["stappen","Stappen"], ["voordelen","Voordelen"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
                style={{
                  background: activeTab === key ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "transparent",
                  color: activeTab === key ? "#fff" : "#94a3b8",
                  boxShadow: activeTab === key ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Stappen */}
          {activeTab === "stappen" && (
            <div className="flex flex-col gap-3">
              {stappen.map((stap, i) => (
                <button key={stap.id}
                  onClick={() => stap.id === "3" && stap.status !== "klaar" ? setShowSelfie(true) : undefined}
                  className="w-full rounded-3xl p-4 text-left"
                  style={{
                    background: stap.status === "klaar" ? "#ECFDF5" : "#fff",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: stap.status === "bezig" ? "2px solid #4F46E5" : stap.status === "fout" ? "2px solid #EF4444" : "none",
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          stap.status === "klaar" ? "#059669" :
                          stap.status === "bezig" ? "#EEF2FF" :
                          stap.status === "fout" ? "#FEF2F2" : "#F1F5F9",
                      }}>
                      {stap.status === "klaar"
                        ? <Check size={18} color="white" strokeWidth={3} />
                        : stap.status === "bezig"
                        ? <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                        : stap.status === "fout"
                        ? <AlertCircle size={18} style={{ color: "#EF4444" }} />
                        : <span className="text-sm font-black" style={{ color: "#94a3b8" }}>{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{stap.titel}</p>
                        {!stap.vereist && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg"
                            style={{ background: "#F1F5F9", color: "#64748b" }}>Optioneel</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{stap.beschrijving}</p>
                    </div>
                    {stap.status === "bezig" && (
                      <ChevronRight size={16} style={{ color: "#4F46E5" }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tab: Status */}
          {activeTab === "status" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-3xl p-5 flex flex-col gap-3"
                style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <Fingerprint size={20} style={{ color: "#4F46E5" }} />
                  <p className="font-black text-sm" style={{ color: "#0f172a" }}>Documenttype kiezen</p>
                </div>
                {(["paspoort", "id_kaart", "rijbewijs"] as DocType[]).map(doc => {
                  const labels: Record<DocType, string> = { paspoort: "🛂 Paspoort", id_kaart: "🪪 ID-kaart", rijbewijs: "🚗 Rijbewijs" };
                  return (
                    <button key={doc} onClick={() => setSelectedDoc(doc)}
                      className="touch-scale w-full flex items-center gap-3 p-3.5 rounded-2xl"
                      style={{
                        background: selectedDoc === doc ? "#EEF2FF" : "#F8FAFC",
                        border: `2px solid ${selectedDoc === doc ? "#4F46E5" : "#E5E7EB"}`,
                      }}>
                      <span className="text-xl">{labels[doc].split(" ")[0]}</span>
                      <p className="font-bold text-sm" style={{ color: selectedDoc === doc ? "#4F46E5" : "#374151" }}>
                        {labels[doc].substring(labels[doc].indexOf(" ") + 1)}
                      </p>
                      {selectedDoc === doc && <Check size={16} style={{ color: "#4F46E5" }} className="ml-auto" />}
                    </button>
                  );
                })}
              </div>
              <button
                className="touch-scale w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 8px 24px rgba(79,70,229,0.4)" }}>
                <Upload size={18} /> Document uploaden
              </button>
              <button onClick={() => setShowSelfie(true)}
                className="touch-scale w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                style={{ background: "#F5F3FF", color: "#7C3AED" }}>
                <Camera size={18} /> Selfie verificatie starten
              </button>
            </div>
          )}

          {/* Tab: Voordelen */}
          {activeTab === "voordelen" && (
            <div className="flex flex-col gap-3">
              {[
                { emoji: "⭐", titel: "Vertrouwensbadge", desc: "Een verificatievinkje op je profiel vergroot het vertrouwen van klanten en geeft meer boekingen." },
                { emoji: "💰", titel: "Hogere tarieven", desc: "Geverifieerde vakmans kunnen gemiddeld 15-20% hogere tarieven rekenen op het platform." },
                { emoji: "🔝", titel: "Hogere ranking", desc: "Geverifieerde profielen verschijnen hoger in zoekresultaten en worden eerder aanbevolen." },
                { emoji: "🚀", titel: "Snellere uitbetaling", desc: "Geverifieerde vakmans ontvangen hun betalingen binnen 24 uur in plaats van 3-5 werkdagen." },
                { emoji: "🛡️", titel: "Geschilbescherming", desc: "Bij een geschil krijgen geverifieerde vakmans prioriteit bij de behandeling door Servr." },
              ].map(v => (
                <div key={v.titel} className="flex items-start gap-3 p-4 rounded-3xl"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: "#EEF2FF" }}>
                    {v.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{v.titel}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#64748b" }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
