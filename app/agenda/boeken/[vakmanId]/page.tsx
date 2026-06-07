"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { supabase, supabaseReady } from "@/lib/supabase";

const DAGEN        = ["Ma","Di","Wo","Do","Vr","Za","Zo"];
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
  const router = useRouter();

  const { activeView, setActiveView, name: userName } = useUserStore();
  const { schema: storeSchema } = useAgendaStore();
  const { voegBoeking } = useBookingStore();

  const [vakman, setVakman] = useState(VAKMAN_FALLBACK);
  const [vakmanGeladen, setVakmanGeladen] = useState(false);

  useEffect(() => {
    // Kijk of het een mock ID is (bijv. "p1", "p2")
    const mock = PROVIDERS.find(p => p.id === vakmanId);
    if (mock) {
      setVakman({ naam: mock.name, avatar: mock.avatar, categorie: mock.category, rating: mock.rating });
      setVakmanGeladen(true);
      return;
    }
    // Echte UUID — laad uit Supabase
    async function laad() {
      await supabaseReady;
      const [{ data: prof }, { data: vak }] = await Promise.all([
        (supabase.from("profiles") as any).select("name").eq("id", vakmanId).single(),
        (supabase.from("vakmensen") as any).select("specialty, gemiddelde_rating").eq("id", vakmanId).single(),
      ]);
      setVakman({
        naam: prof?.name ?? "Vakman",
        avatar: `https://i.pravatar.cc/150?u=${vakmanId}`,
        categorie: vak?.specialty ?? "Vakman",
        rating: vak?.gemiddelde_rating ?? 0,
      });
      setVakmanGeladen(true);
    }
    laad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vakmanId]);

  const activeDiensten = MOCK_DIENSTEN.filter(d => d.actief);

  const [stap, setStap]     = useState<Stap>("dienst");
  const [dienst, setDienst] = useState<Dienst | null>(null);
  const [weekBase, setWeekBase] = useState(() => new Date());
  const [datum, setDatum]   = useState<string | null>(null);
  const [slot, setSlot]     = useState<{ start: string; eind: string } | null>(null);

  // Locatie
  const [showLocatie, setShowLocatie]   = useState(false);
  const [locatieAdres, setLocatieAdres] = useState("");
  const [locatieMode, setLocatieMode]   = useState<"keuze" | "andere" | "laden" | "klaar">("keuze");
  const [anderAdres, setAnderAdres]     = useState("");

  const boekingToegevoegd = useRef(false);
  useEffect(() => {
    if (stap === "bevestigd" && dienst && datum && slot && !boekingToegevoegd.current) {
      boekingToegevoegd.current = true;

      // 1. Lokale store (voor klant boekingsgeschiedenis)
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

      // 2. Supabase — schrijf naar boekingen tabel zodat vakman het ziet in zijn agenda
      if (supabaseReady) {
        const startTijd = new Date(`${datum}T${slot.start}:00`).toISOString();
        const eindTijd  = new Date(`${datum}T${slot.eind}:00`).toISOString();
        const klantId = useUserStore.getState().userId;

        (supabase.from("boekingen") as any).insert({
          klant_id:   klantId,
          vakman_id:  vakmanId,
          status:     "gepland",
          start_tijd: startTijd,
          eind_tijd:  eindTijd,
          adres:      locatieAdres || null,
          bedrag:     dienst.prijs,
          notities:   dienst.naam,
        }).then(({ error }: { error: unknown }) => {
          if (error) console.error("Boeking opslaan mislukt:", error);
        });
      }
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
    <div style={{ background: "#F5EFE5" }} className="flex flex-col min-h-full items-center justify-center px-6 text-center gap-5">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
        <ArrowLeftRight size={32} style={{ color: "#EF4444" }} />
      </div>
      <div>
        <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 24, fontWeight: 700 }} className="mb-2">
          Je bent vakman
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "#8A8A83" }}>
          Zet de app op <strong>klantmodus</strong> om te boeken.
        </p>
      </div>
      <button
        onClick={() => setActiveView("klant")}
        className="w-full"
        style={{
          background: "#2B4030",
          color: "#F5EFE5",
          borderRadius: 10,
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 500,
          border: "none",
          cursor: "pointer",
        }}>
        Overschakelen naar klantmodus
      </button>
    </div>
  );

  // ── BEVESTIGD ──────────────────────────────────────────────────────────────
  if (stap === "bevestigd" && dienst && datum && slot) {
    const datumObj = new Date(datum + "T12:00:00");
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-5 pb-10"
        style={{ background: "#F5EFE5" }}>
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "#2B4030" }}>
          <CheckCircle size={48} color="#F5EFE5" />
        </div>
        <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 30, fontWeight: 700 }} className="text-center mb-2">
          Geboekt!
        </h1>
        <p className="text-lg text-center mb-8" style={{ color: "#5C5C56" }}>
          {userName || "Uw afspraak"} is bevestigd bij {vakman.naam}.
        </p>

        <div className="w-full rounded-2xl overflow-hidden mb-5"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          <div className="flex items-center gap-4 p-4" style={{ borderBottom: "0.5px solid #E5DDD0" }}>
            <img src={vakman.avatar} className="w-16 h-16 rounded-xl object-cover" alt="" />
            <div>
              <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 18, fontWeight: 600 }}>
                {vakman.naam}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ color: "#C97A4D", fontSize: 16 }}>★</span>
                <span style={{ color: "#1A1D1A", fontWeight: 600, fontSize: 15 }}>{vakman.rating}</span>
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
              <div key={r.label} className="flex items-center justify-between px-4 py-4"
                style={{ borderBottom: i < arr.length - 1 ? "0.5px solid #E5DDD0" : "none" }}>
                <span style={{ fontSize: 14, color: "#8A8A83", fontWeight: 500 }}>{r.label}</span>
                <span style={{ fontSize: 14, color: "#1A1D1A", fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex items-center gap-3 p-4 rounded-xl mb-6"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          <Shield size={20} style={{ color: "#2B4030", flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: "#5C5C56" }}>
            Uw adres wordt pas gedeeld nadat de vakman bevestigt.
          </p>
        </div>

        <Link href="/"
          className="w-full text-center block"
          style={{
            background: "#2B4030",
            color: "#F5EFE5",
            borderRadius: 10,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}>
          Terug naar home
        </Link>
      </div>
    );
  }

  // ── BOOKING FLOW ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)", borderBottom: "0.5px solid #E5DDD0" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (stap === "dienst") router.back();
              else { setStap("dienst"); setDatum(null); setSlot(null); }
            }}
            className="flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#FBF7F0",
              border: "0.5px solid #E5DDD0",
              cursor: "pointer",
              flexShrink: 0,
            }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div className="flex-1">
            <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 20, fontWeight: 600 }}>
              Boek {vakman.naam.split(" ")[0]}
            </h1>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-1">
              {(["dienst", "wanneer"] as const).map((s, i) => {
                const isActive    = stap === s;
                const isCompleted = stap === "wanneer" && s === "dienst";
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: isCompleted ? "#2B4030" : isActive ? "#C97A4D" : "#E5DDD0",
                        flexShrink: 0,
                      }}>
                      {isCompleted
                        ? <span style={{ color: "#F5EFE5", fontSize: 10, fontWeight: 700 }}>✓</span>
                        : <span style={{ color: isActive ? "#F5EFE5" : "#8A8A83", fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                      }
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? "#2B4030" : "#8A8A83" }}>
                      {s === "dienst" ? "Dienst" : "Wanneer"}
                    </span>
                    {i === 0 && <div style={{ width: 16, height: 1, background: "#E5DDD0" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28 pt-6 flex flex-col gap-5">

        {/* ── STAP 1: Dienst ── */}
        {stap === "dienst" && (
          <div>
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 22, fontWeight: 600 }} className="mb-1">
              Wat wil je laten doen?
            </p>
            <p style={{ color: "#8A8A83", fontSize: 15 }} className="mb-5">Kies een dienst</p>
            <div className="flex flex-col gap-3">
              {activeDiensten.map(d => (
                <button key={d.id}
                  onClick={() => { setDienst(d); setStap("wanneer"); }}
                  className="w-full text-left"
                  style={{
                    background: "#FBF7F0",
                    border: "0.5px solid #E5DDD0",
                    borderRadius: 14,
                    padding: 16,
                    cursor: "pointer",
                  }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p style={{ color: "#1A1D1A", fontSize: 16, fontWeight: 600 }}>{d.naam}</p>
                      <p style={{ color: "#8A8A83", fontSize: 13, marginTop: 4 }}>{d.beschrijving}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030", fontSize: 16, fontWeight: 600 }}>
                          €{d.prijs} {d.eenheid}
                        </span>
                        <span style={{ color: "#8A8A83", fontSize: 13 }}>
                          {d.duurMinuten < 60 ? `${d.duurMinuten} min` : `${d.duurMinuten / 60} uur`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 40, height: 40, borderRadius: 10, background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                      <ChevronRight size={18} style={{ color: "#2B4030" }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STAP 2: Datum + tijdslot ── */}
        {stap === "wanneer" && dienst && (
          <div>
            <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#1A1D1A", fontSize: 22, fontWeight: 600 }} className="mb-1">
              Wanneer?
            </p>
            <p style={{ color: "#8A8A83", fontSize: 15 }} className="mb-5">Kies een dag en tijdstip</p>

            {/* Week navigator */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()-7); setWeekBase(d); }}
                className="flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#FBF7F0",
                  border: "0.5px solid #E5DDD0",
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                <ChevronLeft size={18} style={{ color: "#1A1D1A" }} />
              </button>
              <p style={{ flex: 1, textAlign: "center", fontWeight: 500, fontSize: 14, color: "#5C5C56" }}>
                {weekDagen[0].getDate()} {MAANDEN_KORT[weekDagen[0].getMonth()]} – {weekDagen[6].getDate()} {MAANDEN_KORT[weekDagen[6].getMonth()]}
              </p>
              <button
                onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate()+7); setWeekBase(d); }}
                className="flex items-center justify-center"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "#FBF7F0",
                  border: "0.5px solid #E5DDD0",
                  cursor: "pointer",
                  flexShrink: 0,
                }}>
                <ChevronRight size={18} style={{ color: "#1A1D1A" }} />
              </button>
            </div>

            {/* Dag-knoppen */}
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {weekDagen.map((dag, i) => {
                const ymd      = toYMD(dag);
                const dagSlots = getSlotsForDate(ymd, dienst, MOCK_AGENDA, storeSchema);
                const beschikbaar = dagSlots.filter(s => s.beschikbaar).length;
                const isGek    = ymd === datum;
                const isVerleden = dag < new Date(new Date().setHours(0,0,0,0));
                return (
                  <button key={i}
                    onClick={() => { if (!isVerleden && beschikbaar > 0) { setDatum(ymd); setSlot(null); } }}
                    disabled={isVerleden || beschikbaar === 0}
                    className="flex flex-col items-center py-3 transition-all"
                    style={{
                      background: isGek ? "#2B4030" : beschikbaar > 0 && !isVerleden ? "#FBF7F0" : "transparent",
                      border: `0.5px solid ${isGek ? "#2B4030" : "#E5DDD0"}`,
                      borderRadius: 10,
                      opacity: isVerleden || beschikbaar === 0 ? 0.35 : 1,
                      cursor: isVerleden || beschikbaar === 0 ? "not-allowed" : "pointer",
                    }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: isGek ? "rgba(245,239,229,0.75)" : "#8A8A83" }}>
                      {DAGEN[i]}
                    </span>
                    <span style={{
                      fontFamily: "'Source Serif 4', Georgia, serif",
                      fontSize: 15,
                      fontWeight: 600,
                      marginTop: 2,
                      color: isGek ? "#F5EFE5" : "#1A1D1A",
                    }}>
                      {dag.getDate()}
                    </span>
                    {beschikbaar > 0 && !isVerleden && (
                      <span style={{ fontSize: 9, fontWeight: 600, marginTop: 2, color: isGek ? "rgba(245,239,229,0.7)" : "#C97A4D" }}>
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
                <p style={{ color: "#1A1D1A", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
                  Kies een tijdstip op{" "}
                  {new Date(datum+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})}:
                </p>
                {slots.length === 0 ? (
                  <div className="text-center py-8 rounded-xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                    <p style={{ fontSize: 32, marginBottom: 8 }}>😔</p>
                    <p style={{ color: "#1A1D1A", fontWeight: 600, fontSize: 15 }}>Geen vrije uren op deze dag</p>
                    <p style={{ color: "#8A8A83", fontSize: 13, marginTop: 4 }}>Kies een andere dag</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {slots.map((s, i) => {
                      const isGek = slot?.start === s.start;
                      return (
                        <button key={i}
                          onClick={() => s.beschikbaar && setSlot({ start: s.start, eind: s.eind })}
                          disabled={!s.beschikbaar}
                          className="py-4 transition-all"
                          style={{
                            background: isGek ? "#2B4030" : s.beschikbaar ? "#FBF7F0" : "#F5EFE5",
                            border: `0.5px solid ${isGek ? "#2B4030" : "#E5DDD0"}`,
                            borderRadius: 14,
                            opacity: s.beschikbaar ? 1 : 0.4,
                            cursor: s.beschikbaar ? "pointer" : "not-allowed",
                          }}>
                          <p style={{
                            fontFamily: "'Source Serif 4', Georgia, serif",
                            fontSize: 20,
                            fontWeight: 600,
                            color: isGek ? "#F5EFE5" : "#1A1D1A",
                          }}>
                            {s.start}
                          </p>
                          <p style={{ fontSize: 13, marginTop: 2, color: isGek ? "rgba(245,239,229,0.75)" : "#8A8A83" }}>
                            tot {s.eind}
                          </p>
                          {!s.beschikbaar && (
                            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: "#EF4444" }}>Bezet</p>
                          )}
                          {isGek && (
                            <CheckCircle size={16} style={{ color: "#F5EFE5", margin: "6px auto 0" }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Bevestig-knop */}
            {slot && (
              <div className="mt-6">
                <div className="rounded-xl p-4 mb-4"
                  style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
                  <p style={{ color: "#2B4030", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Uw boeking:</p>
                  <p style={{ color: "#1A1D1A", fontSize: 15, fontWeight: 500 }}>{dienst.naam}</p>
                  <p style={{ color: "#5C5C56", fontSize: 13, marginTop: 2 }}>
                    {new Date(datum+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"})} · {slot.start} – {slot.eind}
                  </p>
                  <p style={{ fontFamily: "'Source Serif 4', Georgia, serif", color: "#2B4030", fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                    €{dienst.prijs} {dienst.eenheid}
                  </p>
                </div>
                <button
                  onClick={() => { setLocatieMode("keuze"); setAnderAdres(""); setShowLocatie(true); }}
                  className="w-full"
                  style={{
                    background: "#2B4030",
                    color: "#F5EFE5",
                    borderRadius: 10,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}>
                  Bevestig boeking ✓
                </button>
                <p style={{ textAlign: "center", fontSize: 13, marginTop: 12, color: "#8A8A83" }}>
                  Geen betaling vereist — u betaalt na de klus
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LOCATIE MODAL ── */}
      {showLocatie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-[440px]"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
            <div className="px-5 pt-6 pb-7 flex flex-col gap-5">

              {/* Titel */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center flex-shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 10, background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                  <MapPin size={20} style={{ color: "#2B4030" }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: 18, fontWeight: 600, color: "#1A1D1A" }}>
                    Waar is de klus?
                  </h2>
                  <p style={{ fontSize: 13, color: "#8A8A83", marginTop: 2 }}>
                    Verplicht om de boeking te bevestigen
                  </p>
                </div>
              </div>

              {/* Keuze */}
              {locatieMode === "keuze" && (
                <div className="flex flex-col gap-3">
                  <button onClick={vraagHuidigeLocatie}
                    className="flex items-center gap-4 text-left"
                    style={{
                      padding: "16px",
                      background: "#F5EFE5",
                      border: "0.5px solid #2B4030",
                      borderRadius: 14,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 10, background: "#2B4030" }}>
                      <Navigation size={20} color="#F5EFE5" />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1D1A" }}>Mijn huidige locatie</p>
                      <p style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>Gebruik GPS — snel en automatisch</p>
                    </div>
                  </button>
                  <button onClick={() => setLocatieMode("andere")}
                    className="flex items-center gap-4 text-left"
                    style={{
                      padding: "16px",
                      background: "#FBF7F0",
                      border: "0.5px solid #E5DDD0",
                      borderRadius: 14,
                      cursor: "pointer",
                    }}>
                    <div className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 44, height: 44, borderRadius: 10, background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                      <Search size={20} style={{ color: "#5C5C56" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#1A1D1A" }}>Ander adres</p>
                      <p style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>Voer het adres handmatig in</p>
                    </div>
                  </button>
                </div>
              )}

              {/* GPS laden */}
              {locatieMode === "laden" && (
                <div className="flex flex-col items-center gap-4 py-6">
                  <Loader2 size={40} style={{ color: "#2B4030" }} className="animate-spin" />
                  <p style={{ fontSize: 15, fontWeight: 500, color: "#5C5C56" }}>Locatie ophalen...</p>
                </div>
              )}

              {/* Locatie gevonden */}
              {locatieMode === "klaar" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ background: "#F5EFE5", border: "0.5px solid #2B4030" }}>
                    <MapPin size={18} style={{ color: "#2B4030", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#2B4030", marginBottom: 4, letterSpacing: "0.06em" }}>
                        LOCATIE GEVONDEN
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#1A1D1A" }}>{locatieAdres}</p>
                    </div>
                  </div>
                  <button onClick={bevestigLocatie}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      background: "#2B4030",
                      color: "#F5EFE5",
                      borderRadius: 10,
                      padding: "14px 0",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                    }}>
                    <CheckCircle size={18} /> Bevestig boeking
                  </button>
                  <button onClick={() => setLocatieMode("andere")}
                    style={{ fontSize: 13, color: "#8A8A83", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
                    Toch ander adres gebruiken
                  </button>
                </div>
              )}

              {/* Ander adres */}
              {locatieMode === "andere" && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#8A8A83", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
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
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: `0.5px solid ${anderAdres ? "#2B4030" : "#E5DDD0"}`,
                        fontSize: 15,
                        fontWeight: 400,
                        color: "#1A1D1A",
                        background: "#F5EFE5",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <button onClick={bevestigLocatie}
                    disabled={!anderAdres.trim()}
                    className="w-full flex items-center justify-center gap-2"
                    style={{
                      background: anderAdres.trim() ? "#2B4030" : "#E5DDD0",
                      color: anderAdres.trim() ? "#F5EFE5" : "#8A8A83",
                      borderRadius: 10,
                      padding: "14px 0",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                      cursor: anderAdres.trim() ? "pointer" : "not-allowed",
                    }}>
                    <CheckCircle size={18} /> Bevestig boeking
                  </button>
                  <button onClick={() => setLocatieMode("keuze")}
                    style={{ fontSize: 13, color: "#8A8A83", fontWeight: 500, background: "none", border: "none", cursor: "pointer" }}>
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
