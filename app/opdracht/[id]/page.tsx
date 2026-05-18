"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Euro, AlertTriangle, MessageCircle, X, Check } from "lucide-react";
import { MOCK_OPDRACHTEN } from "@/lib/store";

export default function OpdrachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const opdracht = MOCK_OPDRACHTEN.find(o => o.id === id) ?? MOCK_OPDRACHTEN[0];
  const [actie, setActie] = useState<"idle" | "offerte" | "geweigerd" | "verstuurd">("idle");
  const [prijs, setPrijs] = useState("");
  const [offerteText, setOfferteText] = useState("");
  const [eta, setEta] = useState("Vandaag");

  const urgentieKleur = { laag: "#16a34a", middel: "#d97706", hoog: "#dc2626" }[opdracht.urgentie];
  const urgentieLabel = { laag: "Niet urgent", middel: "Komende week", hoog: "SPOED" }[opdracht.urgentie];

  if (actie === "geweigerd") return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-bounce-in">
      <span className="text-6xl">👋</span>
      <div>
        <h2 className="font-black text-xl mb-2">Opdracht geweigerd</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Geen probleem — er komen meer opdrachten in jouw buurt.
        </p>
      </div>
      <button onClick={() => router.push("/dashboard")}
        className="touch-scale px-6 py-3.5 rounded-2xl font-bold text-white"
        style={{ background: "var(--teal)" }}>
        Terug naar dashboard
      </button>
    </div>
  );

  if (actie === "verstuurd") return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-bounce-in">
      <span className="text-6xl">🎉</span>
      <div>
        <h2 className="font-black text-xl mb-2">Offerte verstuurd!</h2>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Je offerte van <strong>€{prijs}</strong> is verstuurd naar {opdracht.klant}.<br />
          Je hoort het zodra zij accepteren.
        </p>
      </div>
      <div className="card p-4 w-full text-left">
        <p className="text-xs font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Jouw offerte</p>
        <p className="font-black text-2xl mb-1" style={{ color: "var(--teal)" }}>€{prijs}</p>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{offerteText}</p>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>📅 {eta}</p>
      </div>
      <button onClick={() => router.push("/dashboard")}
        className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white"
        style={{ background: "var(--teal)" }}>
        Terug naar dashboard
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.back()}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-black text-lg flex-1 truncate">{opdracht.title}</h1>
        {opdracht.urgentie === "hoog" && (
          <span className="text-xs font-black px-2.5 py-1 rounded-full animate-dot"
            style={{ background: "#fee2e2", color: "#dc2626" }}>
            SPOED
          </span>
        )}
      </div>

      <div className="px-5 pt-4 flex flex-col gap-5">
        {/* Klant info */}
        <div className="card p-4 flex items-center gap-4">
          <img src={opdracht.klantAvatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
          <div className="flex-1">
            <p className="font-bold text-base">{opdracht.klant}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Klant</p>
          </div>
          <Link href={`/chat/new`}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
            <MessageCircle size={18} />
          </Link>
        </div>

        {/* Foto */}
        {opdracht.foto && (
          <div className="rounded-3xl overflow-hidden">
            <img src={opdracht.foto} alt="opdracht" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Details */}
        <div className="card p-4 flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>Categorie</p>
            <p className="font-semibold">{opdracht.categorieIcon} {opdracht.categorie}</p>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <div>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>Beschrijving</p>
            <p className="text-sm leading-relaxed">{opdracht.beschrijving}</p>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>Urgentie</p>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={14} style={{ color: urgentieKleur }} />
                <span className="font-semibold text-sm" style={{ color: urgentieKleur }}>{urgentieLabel}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>Budget</p>
              <p className="font-semibold text-sm" style={{ color: "var(--teal)" }}>{opdracht.budget}</p>
            </div>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <div>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "var(--muted)" }}>⏰ Geplaatst</p>
            <p className="text-sm">{opdracht.aangemaakt}</p>
          </div>
        </div>

        {/* KAART — klantadres */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-black text-base">📍 Locatie klant</p>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
              {opdracht.afstand} van jou
            </span>
          </div>

          {/* Kaart placeholder — vervang door Mapbox met echte token */}
          <div className="relative h-44 rounded-3xl overflow-hidden"
            style={{ background: "#dde8dd" }}>
            {/* Grid lijnen */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg,#0F6E56 0,#0F6E56 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#0F6E56 0,#0F6E56 1px,transparent 0,transparent 40px)",
                backgroundSize: "40px 40px",
              }} />
            {/* Straten */}
            <div className="absolute" style={{ top: "40%", left: 0, right: 0, height: 6, background: "rgba(255,255,255,0.5)" }} />
            <div className="absolute" style={{ top: 0, bottom: 0, left: "35%", width: 6, background: "rgba(255,255,255,0.5)" }} />
            <div className="absolute" style={{ top: 0, bottom: 0, left: "65%", width: 4, background: "rgba(255,255,255,0.3)" }} />
            <div className="absolute" style={{ top: "65%", left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.3)" }} />

            {/* Klant pin */}
            <div className="absolute" style={{ top: "35%", left: "50%", transform: "translate(-50%,-50%)" }}>
              <div className="relative">
                <div className="animate-pulse-ring absolute inset-0 w-10 h-10 rounded-full"
                  style={{ background: "rgba(220,38,38,0.2)" }} />
                <div className="w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center"
                  style={{ background: "#dc2626", borderWidth: 3 }}>
                  <MapPin size={14} color="white" />
                </div>
              </div>
            </div>

            {/* Adres label */}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 flex items-center gap-2">
              <MapPin size={14} style={{ color: "var(--coral)", flexShrink: 0 }} />
              <div>
                <p className="font-bold text-xs">{opdracht.adres}</p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Exact adres zichtbaar na acceptatie
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offerte formulier */}
        {actie === "offerte" ? (
          <div className="card p-4 flex flex-col gap-4 animate-slide-up">
            <p className="font-black text-base">Stuur een offerte</p>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                Jouw prijs *
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2"
                style={{ borderColor: prijs ? "var(--teal)" : "var(--border)", background: "var(--surface)" }}>
                <Euro size={17} style={{ color: "var(--teal)" }} />
                <input value={prijs} onChange={e => setPrijs(e.target.value.replace(/\D/g, ""))}
                  placeholder="85" inputMode="numeric"
                  className="flex-1 bg-transparent outline-none text-2xl font-black"
                  style={{ color: "var(--teal)" }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>totaal</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                Wanneer kun je?
              </label>
              <div className="flex gap-2">
                {["Vandaag", "Morgen", "Deze week", "Volgende week"].map(t => (
                  <button key={t} onClick={() => setEta(t)}
                    className="touch-scale flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      borderColor: eta === t ? "var(--teal)" : "var(--border)",
                      background: eta === t ? "var(--teal)" : "var(--surface)",
                      color: eta === t ? "white" : "var(--foreground)",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                Toelichting
              </label>
              <textarea value={offerteText} onChange={e => setOfferteText(e.target.value)}
                placeholder="Beschrijf wat je gaat doen en wat er in de prijs is inbegrepen..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setActie("idle")}
                className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm border"
                style={{ borderColor: "var(--border)" }}>
                Annuleren
              </button>
              <button
                onClick={() => prijs && setActie("verstuurd")}
                className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-white text-sm"
                style={{ background: prijs ? "var(--teal)" : "var(--muted)" }}>
                Offerte sturen ✓
              </button>
            </div>
          </div>
        ) : (
          /* Accepteer / Weiger knoppen */
          <div className="flex flex-col gap-3">
            <button onClick={() => setActie("offerte")}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2"
              style={{ background: "var(--teal)" }}>
              <Check size={20} /> Offerte sturen
            </button>
            <button onClick={() => setActie("geweigerd")}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 border"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <X size={18} /> Weigeren
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
