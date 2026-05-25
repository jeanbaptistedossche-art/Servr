"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, Shield, ArrowLeftRight,
  MapPin, Navigation, Search, Loader2,
} from "lucide-react";
import { MOCK_DIENSTEN, MOCK_AGENDA, type Dienst } from "@/lib/bedrijfStore";
import { useAgendaStore, getSlotsForDate } from "@/lib/agendaStore";
import { useUserStore } from "@/lib/store";
import { useBookingStore } from "@/lib/bookingStore";
import { PROVIDERS } from "@/lib/mockData";

const DAGEN       = ["Ma","Di","Wo","Do","Vr","Za","Zo"];
const MAANDEN_KORT = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

const VAKMAN_FALLBACK = {
  naam: "Marco van den Berg",
  avatar: "https://i.pravatar.cc/150?img=12",
  categorie: "Loodgieter",
  rating: 4.9,
};

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

type Stap = "dienst" | "wanneer" | "bevestigd";

export default function BoekenPage({ params }: { params: Promise<{ vakmanId: string }> }) {
  const { vakmanId } = use(params);

  const { activeView, setActiveView, name: userName } = useUserStore();
  const { schema: storeSchema } = useAgendaStore();
  const { voegBoeking } = useBookingStore();

  const provider = PROVIDERS.find(p => p.id === vakmanId);
  const vakman   = provider
    ? { naam: provider.name, avatar: provider.avatar, categorie: provider.category, rating: provider.rating }
    : VAKMAN_FALLBACK;

  const activeDiensten = MOCK_DIENSTEN.filter(d => d.actief);

  const [stap, setStap]     = useState<Stap>("dienst");
  const [dienst, setDienst] = useState<Dienst | null>(null);
  const [weekBase, setWeekBase] = useState(() => {
    const d = new Date();
    // Start altijd op de huidige week zodat vandaag zichtbaar en selecteerbaar is
    return d;
  });
  const [datum, setDatum]   = useState<string | null>(null);
  const [slot, setSlot]     = useState<{ start: string; eind: string } | null>(null);

  // Locatie
  const [showLocatie, setShowLocatie]   = useState(false);
  const [locatieAdres, setLocatieAdres] = useState("");
  const [locatieMode, setLocatieMode]   = useState<"keuze" | "andere" | "laden" | "klaar">("keuze");
  const [anderAdres, setAnderAdres]     = useState("");

  // Boeking opslaan via useEffect — niet tijdens render
  // Ref voorkomt dubbele boeking bij StrictMode / herrender
  const boekingToegevoegd = useRef(false);
  useEffect(() => {
    if (stap === "bevestigd" && dienst && datum && slot && !boekingToegevoegd.current) {
      boekingToegevoegd.current = true;
      voegBoeking({
        vakmanId: vakmanId ?? "p1",
        vakmanNaam: vakman.naam,
        vakmanAvatar: vakman.avatar,
        dienst: dienst.naam,
        datum,
        tijd: slot.start,
        tijdEind: slot.eind,
        omschrijving: locatieAdres,
        prijs: dienst.prijs,
        eenheid: dienst.eenheid,
        status: "bevestigd",
        reviewGegeven: false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stap]);

  const vraagHuidigeLocatie = () => {
    setLocatieMode("laden");
    if (!navigator.geolocation) {
      setLocatieMode("andere");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
            { headers: { "Accept-Language": "nl" } }
          );
          const data = await res.json();
          const adres = data.display_name?.split(",").slice(0, 3).join(", ") ?? "Uw huidige locatie";
          setLocatieAdres(adres);
        } catch {
          setLocatieAdres("Uw huidige locatie");
        }
        setLocatieMode("klaar");
      },
      () => setLocatieMode("andere"),
      { timeout: 8000 }
    );
  };

  const bevestigLocatie = () => {
    const adres = locatieMode === "klaar"
      ? locatieAdres
      : anderAdres.trim();
    if (!adres) return;
    setLocatieAdres(adres);
    setShowLocatie(false);
    setStap("bevestigd");
  };

  const weekDagen = getWeekDates(weekBase);
  const slots     = dienst && datum ? getSlotsForDate(datum, dienst, MOCK_AGENDA, storeSchema) : [];

  // ── Vakmanmodus blokkade ───────────────────────────────────────────────────
  if (activeView === "vakman") return (
    <div className="flex flex-col min-h-full items-center justify-center px-6 text-center gap-5">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
        <ArrowLeftRight size={32} style={{ color: "#EF4444" }} />
      </div>
      <div>
        <h1 className="font-black text-2xl mb-2">Je bent vakman</h1>
        <p className="text-base leading-relaxed" style={{ color: "#6B7280" }}>
          Zet de app op <strong>klantmodus</strong> om te boeken.
        </p>
      </div>
      <button onClick={() => setActiveView("klant")}
        className="touch-scale w-full py-5 rounded-2xl font-black text-white text-lg"
        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
        Overschakelen naar klantmodus
      </button>
    </div>
  );

  // ── BEVESTIGD ──────────────────────────────────────────────────────────────
  if (stap === "bevestigd" && dienst && datum && slot) {
    const datumObj = new Date(datum + "T12:00:00");
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-5 pb-10 animate-fade-in"
        style={{ background: "#F9FAFB" }}>
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          <CheckCircle size={48} color="white" />
        </div>
        <h1 className="font-black text-3xl text-center mb-2">Geboekt!</h1>
        <p className="text-lg text-center mb-8" style={{ color: "#6B7280" }}>
          {userName || "Uw afspraak"} is bevestigd bij {vakman.naam}.
        </p>

        <div className="w-full rounded-3xl overflow-hidden mb-5"
          style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-4 p-5 border-b" style={{ borderColor: "#F3F4F6" }}>
            <img src={vakman.avatar} className="w-16 h-16 rounded-2xl object-cover" alt="" />
            <div>
              <p className="font-black text-lg">{vakman.naam}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-400 text-base">★</span>
                <span className="font-bold text-base">{vakman.rating}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            {[
              { label: "Dienst",  value: dienst.naam },
              { label: "Locatie", value: locatieAdres || "Niet opgegeven" },
              { label: "Datum",   value: datumObj.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }) },
              { label: "Tijd",    value: `${slot.start} – ${slot.eind}` },
              { label: "Prijs",   value: `€${dienst.prijs} ${dienst.eenheid}` },
            ].map((r, i, arr) => (
              <div key={r.label} className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <span className="text-base font-semibold" style={{ color: "#9CA3AF" }}>{r.label}</span>
                <span className="text-base font-black" style={{ color: "#111827" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: "#EEF2FF" }}>
          <Shield size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "#4F46E5" }}>
            Uw adres wordt pas gedeeld nadat de vakman bevestigt.
          </p>
        </div>

        <Link href="/"
          className="touch-scale w-full py-5 rounded-2xl font-black text-white text-lg text-center"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
          Terug naar home
        </Link>
      </div>
    );
  }

  // ── BOOKING FLOW ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in" style={{ background: "#F9FAFB" }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-5 pt-12 pb-4"
        style={{ background: "rgba(249,250,251,0.97)", borderBottom: "1px solid #F3F4F6", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (stap === "dienst") history.back();
              else { setStap("dienst"); setDatum(null); setSlot(null); }
            }}
            className="touch-scale w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
            <ArrowLeft size={20} style={{ color: "#111827" }} />
          </button>
          <div className="flex-1">
            <h1 className="font-black text-xl" style={{ color: "#111827" }}>
              Boek {vakman.naam.split(" ")[0]}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {(["dienst", "wanneer"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: stap === s ? "#4F46E5" : (stap === "wanneer" && s === "dienst") ? "#10B981" : "#E5E7EB",
                      color: (stap === s || (stap === "wanneer" && s === "dienst")) ? "white" : "#9CA3AF",
                    }}>
                    {stap === "wanneer" && s === "dienst" ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: stap === s ? "#4F46E5" : "#9CA3AF" }}>
                    {s === "dienst" ? "Dienst" : "Wanneer"}
                  </span>
                  {i === 0 && <div className="w-4 h-px" style={{ background: "#E5E7EB" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 flex flex-col gap-5">

        {/* ── STAP 1: Dienst ── */}
        {stap === "dienst" && (
          <div className="animate-slide-up">
            <p className="font-black text-2xl mb-1" style={{ color: "#111827" }}>Wat wil je laten doen?</p>
            <p className="text-base mb-5" style={{ color: "#9CA3AF" }}>Kies een dienst</p>
            <div className="flex flex-col gap-3">
              {activeDiensten.map(d => (
                <button key={d.id}
                  onClick={() => { setDienst(d); setStap("wanneer"); }}
                  className="touch-scale w-full text-left rounded-3xl p-5"
                  style={{ background: "#fff", border: "2px solid #F3F4F6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-black text-lg" style={{ color: "#111827" }}>{d.naam}</p>
                      <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>{d.beschrijving}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-base font-black" style={{ color: "#4F46E5" }}>
                          €{d.prijs} {d.eenheid}
                        </span>
                        <span className="text-sm" style={{ color: "#9CA3AF" }}>
                          {d.duurMinuten < 60 ? `${d.duurMinuten} min` : `${d.duurMinuten / 60} uur`}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EEF2FF" }}>
                      <ChevronRight size={22} style={{ color: "#4F46E5" }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STAP 2: Datum + tijdslot ── */}
        {stap === "wanneer" && dienst && (
          <div className="animate-slide-up">
            <p className="font-black text-2xl mb-1" style={{ color: "#111827" }}>Wanneer?</p>
            <p className="text-base mb-5" style={{ color: "#9CA3AF" }}>Kies een dag en tijdstip</p>

            {/* Week navigator */}
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); }}
                className="touch-scale w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                <ChevronLeft size={20} />
              </button>
              <p className="flex-1 text-center font-bold text-base">
                {weekDagen[0].getDate()} {MAANDEN_KORT[weekDagen[0].getMonth()]} – {weekDagen[6].getDate()} {MAANDEN_KORT[weekDagen[6].getMonth()]}
              </p>
              <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); }}
                className="touch-scale w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Dag-knoppen */}
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {weekDagen.map((dag, i) => {
                const ymd    = toYMD(dag);
                const dagSlots = getSlotsForDate(ymd, dienst, MOCK_AGENDA, storeSchema);
                const beschikbaar = dagSlots.filter(s => s.beschikbaar).length;
                const isGek  = ymd === datum;
                const isVerleden = dag < new Date(new Date().setHours(0,0,0,0));
                return (
                  <button key={i}
                    onClick={() => { if (!isVerleden && beschikbaar > 0) { setDatum(ymd); setSlot(null); } }}
                    disabled={isVerleden || beschikbaar === 0}
                    className="touch-scale flex flex-col items-center py-3 rounded-2xl transition-all"
                    style={{
                      background: isGek ? "#4F46E5" : beschikbaar > 0 && !isVerleden ? "#fff" : "transparent",
                      border: `2px solid ${isGek ? "#4F46E5" : "#F3F4F6"}`,
                      opacity: isVerleden || beschikbaar === 0 ? 0.35 : 1,
                    }}>
                    <span className="text-xs font-bold" style={{ color: isGek ? "rgba(255,255,255,0.8)" : "#9CA3AF" }}>{DAGEN[i]}</span>
                    <span className="font-black text-base mt-0.5" style={{ color: isGek ? "white" : "#111827" }}>{dag.getDate()}</span>
                    {beschikbaar > 0 && !isVerleden && (
                      <span className="text-[9px] font-bold mt-0.5" style={{ color: isGek ? "rgba(255,255,255,0.7)" : "#4F46E5" }}>
                        {beschikbaar}x
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tijdsloten */}
            {datum && (
              <>
                <p className="font-bold text-base mb-3" style={{ color: "#111827" }}>
                  Kies een tijdstip op {new Date(datum+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})}:
                </p>
                {slots.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl" style={{ background: "#fff" }}>
                    <p className="text-4xl mb-2">😔</p>
                    <p className="font-bold text-base">Geen vrije uren op deze dag</p>
                    <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>Kies een andere dag</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((s, i) => {
                      const isGek = slot?.start === s.start;
                      return (
                        <button key={i}
                          onClick={() => s.beschikbaar && setSlot({ start: s.start, eind: s.eind })}
                          disabled={!s.beschikbaar}
                          className="touch-scale py-4 rounded-2xl border-2 transition-all"
                          style={{
                            borderColor: isGek ? "#4F46E5" : s.beschikbaar ? "#E5E7EB" : "#F3F4F6",
                            background: isGek ? "#EEF2FF" : s.beschikbaar ? "#fff" : "#F9FAFB",
                            opacity: s.beschikbaar ? 1 : 0.4,
                          }}>
                          <p className="font-black text-xl" style={{ color: isGek ? "#4F46E5" : "#111827" }}>{s.start}</p>
                          <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>tot {s.eind}</p>
                          {!s.beschikbaar && <p className="text-xs mt-1 font-bold" style={{ color: "#EF4444" }}>Bezet</p>}
                          {isGek && <CheckCircle size={16} style={{ color: "#4F46E5", margin: "6px auto 0" }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Bevestig-knop — opent locatiemodal */}
            {slot && (
              <div className="mt-6 animate-slide-up">
                <div className="rounded-2xl p-4 mb-4" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                  <p className="font-black text-base mb-1" style={{ color: "#4F46E5" }}>Uw boeking:</p>
                  <p className="text-base font-semibold" style={{ color: "#111827" }}>{dienst.naam}</p>
                  <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                    {new Date(datum+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})} · {slot.start} – {slot.eind}
                  </p>
                  <p className="font-black text-lg mt-1" style={{ color: "#4F46E5" }}>€{dienst.prijs} {dienst.eenheid}</p>
                </div>
                <button
                  onClick={() => { setLocatieMode("keuze"); setAnderAdres(""); setShowLocatie(true); }}
                  className="touch-scale w-full py-6 rounded-3xl font-black text-white text-xl"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", boxShadow: "0 6px 24px rgba(79,70,229,0.4)" }}>
                  Bevestig boeking ✓
                </button>
                <p className="text-center text-sm mt-3" style={{ color: "#9CA3AF" }}>
                  Geen betaling vereist — u betaalt na de klus
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LOCATIE MODAL (niet-wegklikbaar) ── */}
      {showLocatie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-[440px] rounded-3xl animate-slide-up"
            style={{ background: "#fff", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            <div className="px-6 pt-7 pb-8 flex flex-col gap-5">

              {/* Titel */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#EEF2FF" }}>
                  <MapPin size={22} style={{ color: "#4F46E5" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>Waar is de klus?</h2>
                  <p style={{ fontSize: 14, color: "#9CA3AF", marginTop: 2 }}>
                    Verplicht om de boeking te bevestigen
                  </p>
                </div>
              </div>

              {/* Keuze */}
              {locatieMode === "keuze" && (
                <div className="flex flex-col gap-3">
                  <button onClick={vraagHuidigeLocatie}
                    className="touch-scale flex items-center gap-4 text-left rounded-2xl"
                    style={{ padding: "18px 20px", background: "#EEF2FF", border: "2px solid #4F46E5" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#4F46E5" }}>
                      <Navigation size={22} color="white" />
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>Mijn huidige locatie</p>
                      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Gebruik GPS — snel en automatisch</p>
                    </div>
                  </button>
                  <button onClick={() => setLocatieMode("andere")}
                    className="touch-scale flex items-center gap-4 text-left rounded-2xl"
                    style={{ padding: "18px 20px", background: "#fff", border: "2px solid #E5E7EB" }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#F3F4F6" }}>
                      <Search size={22} style={{ color: "#6B7280" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>Ander adres</p>
                      <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Voer het adres handmatig in</p>
                    </div>
                  </button>
                </div>
              )}

              {/* GPS laden */}
              {locatieMode === "laden" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 size={44} style={{ color: "#4F46E5" }} className="animate-spin" />
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#6B7280" }}>Locatie ophalen...</p>
                </div>
              )}

              {/* Locatie gevonden */}
              {locatieMode === "klaar" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl"
                    style={{ background: "#ECFDF5", border: "2px solid #6EE7B7" }}>
                    <MapPin size={20} style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 3 }}>LOCATIE GEVONDEN</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{locatieAdres}</p>
                    </div>
                  </div>
                  <button onClick={bevestigLocatie}
                    className="touch-scale w-full flex items-center justify-center gap-2"
                    style={{ padding: "20px", borderRadius: 18, background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "white", fontSize: 18, fontWeight: 900, border: "none", boxShadow: "0 6px 24px rgba(79,70,229,0.4)", cursor: "pointer" }}>
                    <CheckCircle size={20} /> Bevestig boeking
                  </button>
                  <button onClick={() => setLocatieMode("andere")}
                    style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    Toch ander adres gebruiken
                  </button>
                </div>
              )}

              {/* Ander adres */}
              {locatieMode === "andere" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 700, color: "#6B7280", display: "block", marginBottom: 8 }}>
                      ADRES VAN DE KLUS
                    </label>
                    <input
                      autoFocus
                      value={anderAdres}
                      onChange={e => setAnderAdres(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && anderAdres.trim() && bevestigLocatie()}
                      placeholder="Bijv. Kerkstraat 12, Gent"
                      style={{
                        width: "100%",
                        padding: "16px 18px",
                        borderRadius: 14,
                        border: `2px solid ${anderAdres ? "#4F46E5" : "#E5E7EB"}`,
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#111827",
                        background: "#F9FAFB",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button onClick={bevestigLocatie}
                    disabled={!anderAdres.trim()}
                    className="touch-scale w-full flex items-center justify-center gap-2"
                    style={{
                      padding: "20px", borderRadius: 18,
                      background: anderAdres.trim() ? "linear-gradient(135deg, #4F46E5, #6366F1)" : "#D1D5DB",
                      color: "white", fontSize: 18, fontWeight: 900, border: "none",
                      boxShadow: anderAdres.trim() ? "0 6px 24px rgba(79,70,229,0.4)" : "none",
                      cursor: anderAdres.trim() ? "pointer" : "not-allowed",
                    }}>
                    <CheckCircle size={20} /> Bevestig boeking
                  </button>
                  <button onClick={() => setLocatieMode("keuze")}
                    style={{ fontSize: 14, color: "#9CA3AF", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                    ← Terug
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
