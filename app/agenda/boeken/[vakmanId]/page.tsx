"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Euro, ChevronLeft, ChevronRight, CheckCircle, Shield, Camera, X, Image } from "lucide-react";
import { MOCK_DIENSTEN, MOCK_AGENDA, type Dienst } from "@/lib/bedrijfStore";
import { useAgendaStore, getSlotsForDate } from "@/lib/agendaStore";

const DAGEN = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const VAKMAN = {
  naam: "Marco van den Berg",
  handelsnaam: "Marco Loodgieter",
  score: 94,
  rating: 4.9,
  reviews: 127,
  avatar: "https://i.pravatar.cc/150?img=12",
  categorie: "Loodgieter",
  stad: "Amsterdam",
  badge: "🏆 Topvakman",
};

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    return nd;
  });
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type BookingStap = "dienst" | "datum" | "tijdslot" | "contact" | "bevestigd";

export default function BoekenPage({ params }: { params: { vakmanId: string } }) {
  const activeDiensten = MOCK_DIENSTEN.filter(d => d.actief);

  const { schema: storeSchema } = useAgendaStore();

  const [stap, setStap] = useState<BookingStap>("dienst");
  const [gekozenDienst, setGekozenDienst] = useState<Dienst | null>(null);
  const [weekBase, setWeekBase] = useState(new Date("2026-05-19"));
  const [gekozenDatum, setGekozenDatum] = useState<string | null>(null);
  const [gekozenSlot, setGekozenSlot] = useState<{ start: string; eind: string } | null>(null);
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [notitie, setNotitie] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const weekDagen = getWeekDates(weekBase);

  const beschikbareSlots = gekozenDienst && gekozenDatum
    ? getSlotsForDate(gekozenDatum, gekozenDienst, MOCK_AGENDA, storeSchema)
    : [];

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };

  const stapNummers: Record<BookingStap, number> = { dienst: 1, datum: 2, tijdslot: 3, contact: 4, bevestigd: 5 };
  const huidigStapNr = stapNummers[stap];

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const goBack = () => {
    if (stap === "datum") setStap("dienst");
    else if (stap === "tijdslot") setStap("datum");
    else if (stap === "contact") setStap("tijdslot");
  };

  if (stap === "bevestigd") {
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-5 animate-bounce-in">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "var(--teal)" + "15" }}>
          <CheckCircle size={40} style={{ color: "var(--teal)" }} />
        </div>
        <h1 className="font-black text-2xl text-center mb-2">Boeking bevestigd!</h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--muted)" }}>
          {naam}, je afspraak is ingepland bij {VAKMAN.handelsnaam}.
        </p>

        <div className="card p-5 w-full max-w-sm mb-4">
          <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <img src={VAKMAN.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div>
              <p className="font-bold text-sm">{VAKMAN.handelsnaam}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{VAKMAN.badge} · ⭐ {VAKMAN.rating}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "15" }}>
                <CheckCircle size={15} style={{ color: "var(--teal)" }} />
              </div>
              <div>
                <p className="font-bold text-sm">{gekozenDienst?.naam}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Dienst</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "15" }}>
                <Clock size={15} style={{ color: "var(--teal)" }} />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {gekozenDatum && new Date(gekozenDatum + "T12:00:00").toLocaleDateString("nl-NL", {
                    weekday: "long", day: "numeric", month: "long"
                  })}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {gekozenSlot?.start} – {gekozenSlot?.eind}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "15" }}>
                <Euro size={15} style={{ color: "var(--teal)" }} />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {gekozenDienst?.eenheid === "per uur"
                    ? `€${gekozenDienst.prijs}/uur`
                    : `€${gekozenDienst?.prijs} ${gekozenDienst?.eenheid}`}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Prijs (excl. BTW)</p>
              </div>
            </div>

            {fotoPreview && (
              <div className="mt-2 rounded-xl overflow-hidden">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>Jouw foto</p>
                <img src={fotoPreview} alt="taakfoto" className="w-full h-32 object-cover rounded-xl" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl w-full max-w-sm mb-6"
          style={{ background: "var(--teal)" + "10" }}>
          <Shield size={16} style={{ color: "var(--teal)" }} />
          <p className="text-xs" style={{ color: "var(--teal)" }}>
            Je adres wordt pas gedeeld na akkoord van de vakman
          </p>
        </div>

        <Link href="/"
          className="touch-scale w-full max-w-sm py-4 rounded-2xl font-bold text-white text-sm text-center"
          style={{ background: "var(--teal)" }}>
          Terug naar home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={stap !== "dienst" ? goBack : undefined}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          {stap === "dienst"
            ? <Link href="/"><ArrowLeft size={18} /></Link>
            : <ArrowLeft size={18} />}
        </button>
        <div className="flex-1">
          <h1 className="font-black text-xl">Boeken bij {VAKMAN.handelsnaam}</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Stap {huidigStapNr} van 4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-5 mt-3 rounded-full" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(huidigStapNr / 4) * 100}%`, background: "var(--teal)" }} />
      </div>

      <div className="px-5 pt-6 flex flex-col gap-5">
        {/* Vakman kaartje */}
        <div className="card p-4 flex items-center gap-3">
          <img src={VAKMAN.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
          <div className="flex-1">
            <p className="font-bold text-sm">{VAKMAN.handelsnaam}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {VAKMAN.badge} · ⭐ {VAKMAN.rating} ({VAKMAN.reviews} reviews)
            </p>
          </div>
          <div className="text-center">
            <p className="font-black text-lg" style={{ color: "var(--teal)" }}>{VAKMAN.score}</p>
            <p className="text-[10px]" style={{ color: "var(--muted)" }}>score</p>
          </div>
        </div>

        {/* STAP 1: Dienst kiezen */}
        {stap === "dienst" && (
          <div className="animate-slide-up">
            <p className="font-black text-lg mb-1">Welke dienst heb je nodig?</p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Kies een dienst om tijdsloten te zien</p>
            <div className="flex flex-col gap-3">
              {activeDiensten.map(d => (
                <button key={d.id} onClick={() => { setGekozenDienst(d); setStap("datum"); }}
                  className="touch-scale card p-4 text-left w-full transition-all"
                  style={{
                    borderColor: gekozenDienst?.id === d.id ? "var(--teal)" : "transparent",
                    border: "2px solid",
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{d.naam}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{d.beschrijving}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
                          <Euro size={10} /> {d.prijs} {d.eenheid}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                          <Clock size={10} />
                          {d.duurMinuten < 60 ? `${d.duurMinuten}m` :
                           d.duurMinuten % 60 === 0 ? `${d.duurMinuten / 60}u` :
                           `${Math.floor(d.duurMinuten / 60)}u${d.duurMinuten % 60}m`}
                        </span>
                        {d.bufferMinuten > 0 && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "#fef3c7", color: "#d97706" }}>
                            +{d.bufferMinuten}m reistijd
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STAP 2: Datum kiezen */}
        {stap === "datum" && gekozenDienst && (
          <div className="animate-slide-up">
            <p className="font-black text-lg mb-1">Kies een datum</p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Beschikbare dagen voor <strong>{gekozenDienst.naam}</strong>
            </p>

            {/* Week navigator */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={prevWeek} className="touch-scale w-9 h-9 card rounded-full flex items-center justify-center">
                <ChevronLeft size={16} />
              </button>
              <p className="flex-1 text-center font-bold text-sm">
                {weekDagen[0].getDate()} {MAANDEN[weekDagen[0].getMonth()]} – {weekDagen[6].getDate()} {MAANDEN[weekDagen[6].getMonth()]}
              </p>
              <button onClick={nextWeek} className="touch-scale w-9 h-9 card rounded-full flex items-center justify-center">
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {weekDagen.map((dag, i) => {
                const ymd = toYMD(dag);
                const slotsVoorDag = getSlotsForDate(ymd, gekozenDienst, MOCK_AGENDA, storeSchema);
                const aantalBeschikbaar = slotsVoorDag.filter(s => s.beschikbaar).length;
                const isSelected = ymd === gekozenDatum;
                const isPast = dag < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button key={i}
                    onClick={() => !isPast && aantalBeschikbaar > 0 && (setGekozenDatum(ymd), setStap("tijdslot"))}
                    disabled={isPast || aantalBeschikbaar === 0}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all touch-scale"
                    style={{
                      background: isSelected ? "var(--teal)" : aantalBeschikbaar > 0 && !isPast ? "var(--surface-2)" : "transparent",
                      opacity: isPast || aantalBeschikbaar === 0 ? 0.3 : 1,
                    }}>
                    <span className="text-[10px] font-semibold"
                      style={{ color: isSelected ? "white" : "var(--muted)" }}>
                      {DAGEN[i]}
                    </span>
                    <span className="font-black text-sm"
                      style={{ color: isSelected ? "white" : "var(--foreground)" }}>
                      {dag.getDate()}
                    </span>
                    {aantalBeschikbaar > 0 && !isPast && (
                      <span className="text-[9px] font-bold"
                        style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--teal)" }}>
                        {aantalBeschikbaar}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl" style={{ background: "var(--teal)" + "10" }}>
              <p className="text-xs" style={{ color: "var(--teal)" }}>
                📅 Kies een datum om beschikbare tijdsloten te zien. Het systeem houdt rekening met de duur van <strong>{gekozenDienst.naam}</strong> ({gekozenDienst.duurMinuten}m) + {gekozenDienst.bufferMinuten}m reistijd en de werkuren van {VAKMAN.naam}.
              </p>
            </div>
          </div>
        )}

        {/* STAP 3: Tijdslot kiezen */}
        {stap === "tijdslot" && gekozenDienst && gekozenDatum && (
          <div className="animate-slide-up">
            <p className="font-black text-lg mb-1">Kies een tijdslot</p>
            <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
              {new Date(gekozenDatum + "T12:00:00").toLocaleDateString("nl-NL", {
                weekday: "long", day: "numeric", month: "long"
              })}
            </p>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
              Inclusief {gekozenDienst.bufferMinuten}m reistijd na de afspraak
            </p>

            {beschikbareSlots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">😔</p>
                <p className="font-bold text-sm">Geen vrije tijdsloten</p>
                <p className="text-xs mt-2 mb-4" style={{ color: "var(--muted)" }}>
                  Op deze dag is {VAKMAN.naam} niet beschikbaar. Kies een andere datum.
                </p>
                <button onClick={() => setStap("datum")}
                  className="touch-scale px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "var(--teal)" }}>
                  ← Andere datum kiezen
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {beschikbareSlots.map((slot, i) => {
                    const isGekozen = gekozenSlot?.start === slot.start;
                    return (
                      <button key={i}
                        onClick={() => slot.beschikbaar && setGekozenSlot({ start: slot.start, eind: slot.eind })}
                        disabled={!slot.beschikbaar}
                        className="touch-scale p-4 rounded-2xl border-2 transition-all text-left"
                        style={{
                          borderColor: isGekozen ? "var(--teal)" : slot.beschikbaar ? "var(--border)" : "var(--border)",
                          background: isGekozen ? "var(--teal)" + "10" : slot.beschikbaar ? "var(--surface)" : "var(--surface-2)",
                          opacity: slot.beschikbaar ? 1 : 0.4,
                        }}>
                        <p className="font-black text-base" style={{ color: isGekozen ? "var(--teal)" : "var(--foreground)" }}>
                          {slot.start}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>tot {slot.eind}</p>
                        {!slot.beschikbaar && (
                          <p className="text-[10px] mt-1 font-semibold" style={{ color: "#dc2626" }}>Bezet</p>
                        )}
                        {isGekozen && (
                          <CheckCircle size={14} style={{ color: "var(--teal)", marginTop: 4 }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {gekozenSlot && (
                  <button onClick={() => setStap("contact")}
                    className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm animate-slide-up"
                    style={{ background: "var(--teal)" }}>
                    Doorgaan met {gekozenSlot.start} – {gekozenSlot.eind} →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* STAP 4: Contactgegevens + foto */}
        {stap === "contact" && (
          <div className="animate-slide-up">
            <p className="font-black text-lg mb-1">Jouw gegevens</p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Zodat {VAKMAN.handelsnaam} contact kan opnemen
            </p>

            {/* Samenvatting */}
            <div className="card p-4 mb-5">
              <p className="font-bold text-xs uppercase mb-2" style={{ color: "var(--muted)" }}>Jouw boeking</p>
              <p className="font-black text-sm">{gekozenDienst?.naam}</p>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {gekozenDatum && new Date(gekozenDatum + "T12:00:00").toLocaleDateString("nl-NL", {
                  weekday: "short", day: "numeric", month: "short"
                })} · {gekozenSlot?.start} – {gekozenSlot?.eind}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Euro size={13} style={{ color: "var(--teal)" }} />
                <span className="font-bold text-sm" style={{ color: "var(--teal)" }}>
                  €{gekozenDienst?.prijs} {gekozenDienst?.eenheid}
                </span>
                {gekozenDienst?.btw && (
                  <span className="text-xs" style={{ color: "var(--muted)" }}>excl. BTW</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Naam */}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Naam *</label>
                <input value={naam} onChange={e => setNaam(e.target.value)}
                  placeholder="Jouw volledige naam"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: naam ? "var(--teal)" : "var(--border)", background: "var(--surface)" }} />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>E-mail *</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jouw@email.nl" type="email"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: email ? "var(--teal)" : "var(--border)", background: "var(--surface)" }} />
              </div>

              {/* Telefoon */}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Telefoon</label>
                <input value={telefoon} onChange={e => setTelefoon(e.target.value)}
                  placeholder="06-12345678" type="tel"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
              </div>

              {/* Notitie */}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>Notitie (optioneel)</label>
                <textarea value={notitie} onChange={e => setNotitie(e.target.value)}
                  placeholder="Omschrijf het probleem... Bijv. lekkende kraan onder aanrecht."
                  rows={3} className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
              </div>

              {/* Foto van de taak */}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Foto van de situatie <span className="font-normal normal-case">(optioneel)</span>
                </label>

                {fotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={fotoPreview} alt="taakfoto" className="w-full h-44 object-cover" />
                    <button
                      onClick={() => { setFotoPreview(null); setFotoFile(null); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.5)" }}>
                      <X size={14} color="white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold"
                      style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
                      ✓ Foto toegevoegd
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="touch-scale w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <Camera size={24} style={{ color: "var(--muted)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Foto toevoegen</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      Helpt de vakman de situatie in te schatten
                    </p>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFoto}
                />
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 mt-4 p-3 rounded-2xl"
              style={{ background: "var(--teal)" + "10" }}>
              <Shield size={15} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--teal)" }}>
                Je exacte adres wordt <strong>pas gedeeld</strong> nadat je de offerte accepteert via Servr.
              </p>
            </div>

            <button
              onClick={() => naam && email ? setStap("bevestigd") : undefined}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm mt-5"
              style={{ background: naam && email ? "var(--teal)" : "var(--muted)" }}>
              Boeking bevestigen →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
