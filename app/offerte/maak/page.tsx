"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Send, Eye, Euro,
  Package, CheckCircle2, CircleDashed,
} from "lucide-react";
import { MOCK_BEDRIJF, MOCK_DIENSTEN, type OfferteRegel } from "@/lib/bedrijfStore";
import { useOfferteStore } from "@/lib/offerteStore";

type Fase = "opstellen" | "preview" | "verstuurd";
type KostenType = "alles_inbegrepen" | "plus_materiaal";

type MateriaalRegel = {
  id: string;
  naam: string;
  aantal: number;
  prijs: number; // per stuk
};

const MATERIAAL_SUGGESTIES = [
  { naam: "Mengkraan", prijs: 45 },
  { naam: "Eengreepskraan", prijs: 65 },
  { naam: "Pakkingset", prijs: 8 },
  { naam: "Toiletvulventiel", prijs: 12 },
  { naam: "Sifon", prijs: 14 },
  { naam: "Koppeling / nipple", prijs: 5 },
  { naam: "Siliconekit", prijs: 7 },
  { naam: "Teflon tape", prijs: 2 },
  { naam: "Kabel 2,5mm² (p/m)", prijs: 2 },
  { naam: "Schakelaar", prijs: 12 },
  { naam: "Stopcontact", prijs: 10 },
  { naam: "Zekering 16A", prijs: 8 },
  { naam: "Muurverf 10L", prijs: 38 },
  { naam: "Primer 5L", prijs: 24 },
  { naam: "Verfroller set", prijs: 9 },
  { naam: "Wandpluggen + schroeven", prijs: 3 },
];

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function OffertesMaakPage() {
  const router = useRouter();
  const bedrijf = MOCK_BEDRIJF;
  const { verstuurOfferte } = useOfferteStore();

  const [fase, setFase] = useState<Fase>("opstellen");

  // Klant
  const [klantNaam, setKlantNaam] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [klantTelefoon, setKlantTelefoon] = useState("");

  // Werk
  const [omschrijving, setOmschrijving] = useState("");
  const [arbeidsPrijs, setArbeidsPrijs] = useState<number | "">("");
  const [btw, setBtw] = useState(false);

  // Kostentype
  const [kostenType, setKostenType] = useState<KostenType>("alles_inbegrepen");

  // Materiaal
  const [materialen, setMaterialen] = useState<MateriaalRegel[]>([]);
  const [nieuwNaam, setNieuwNaam] = useState("");
  const [nieuwAantal, setNieuwAantal] = useState(1);
  const [nieuwPrijs, setNieuwPrijs] = useState<number | "">("");
  const [showMatForm, setShowMatForm] = useState(false);

  // Notities
  const [notities, setNotities] = useState("");

  // ─── Berekeningen ─────────────────────────────────────────────
  const prijs         = Number(arbeidsPrijs) || 0;
  const matSubtotaal  = materialen.reduce((s, m) => s + m.aantal * m.prijs, 0);
  const subtotaal     = kostenType === "plus_materiaal" ? prijs + matSubtotaal : prijs;
  const btwBedrag     = btw ? subtotaal * 0.21 : 0;
  const totaal        = subtotaal + btwBedrag;

  const nummer    = `${bedrijf.offertePrefix}${bedrijf.offerteVolgNr}`;
  const datum     = new Date().toLocaleDateString("nl-NL");
  const geldigTot = new Date(Date.now() + 14 * 86400000).toLocaleDateString("nl-NL");

  // ─── Materiaal helpers ────────────────────────────────────────
  const voegMatToe = () => {
    if (!nieuwNaam || Number(nieuwPrijs) <= 0) return;
    setMaterialen(ms => [...ms, { id: `m${Date.now()}`, naam: nieuwNaam, aantal: nieuwAantal, prijs: Number(nieuwPrijs) }]);
    setNieuwNaam(""); setNieuwAantal(1); setNieuwPrijs(""); setShowMatForm(false);
  };
  const voegSuggestieToe = (s: { naam: string; prijs: number }) =>
    setMaterialen(ms => [...ms, { id: `m${Date.now()}`, naam: s.naam, aantal: 1, prijs: s.prijs }]);
  const updateAantal = (id: string, aantal: number) =>
    setMaterialen(ms => ms.map(m => m.id === id ? { ...m, aantal } : m));
  const verwijderMat = (id: string) =>
    setMaterialen(ms => ms.filter(m => m.id !== id));

  const kanVersturen = omschrijving.trim() && prijs > 0;

  // ── Versturen naar store ─────────────────────────────────────
  const handleVersturen = () => {
    const regels: OfferteRegel[] = [
      {
        id: "r1",
        omschrijving,
        aantal: 1,
        eenheid: "klus",
        prijsPerEenheid: prijs,
        btwPercentage: btw ? 21 : 0,
      },
      ...(kostenType === "plus_materiaal"
        ? materialen.map((m, i) => ({
            id: `rm${i + 1}`,
            omschrijving: m.naam,
            aantal: m.aantal,
            eenheid: "stuk",
            prijsPerEenheid: m.prijs,
            btwPercentage: btw ? 21 : 0,
          }))
        : []),
    ];
    verstuurOfferte({
      nummer,
      datum,
      geldigTot,
      vakmanNaam: bedrijf.handelsnaam,
      vakmanAvatar: "https://i.pravatar.cc/150?img=11",
      vakmanChatId: "p1",
      klantNaam: klantNaam || "Klant",
      klantAvatar: "https://i.pravatar.cc/150?img=68",
      regels,
      subtotaal,
      totaalBtw: btwBedrag,
      totaal,
      notities,
    });
    setFase("verstuurd");
  };

  // ── Verstuurd ────────────────────────────────────────────────
  if (fase === "verstuurd") return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-bounce-in pb-24">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--teal)" }}>
        <Send size={32} color="white" />
      </div>
      <div>
        <h2 className="font-black text-2xl mb-2">Offerte verstuurd!</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Offerte <strong>{nummer}</strong> is verstuurd{klantNaam ? ` naar ${klantNaam}` : ""}.
          De klant ontvangt een melding in de app.
        </p>
      </div>
      <div className="card p-4 w-full text-left flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span style={{ color: "var(--muted)" }}>Arbeid / werkzaamheden</span>
          <span>€{fmt(prijs)}</span>
        </div>
        {kostenType === "plus_materiaal" && matSubtotaal > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>Materiaal ({materialen.length} art.)</span>
            <span>€{fmt(matSubtotaal)}</span>
          </div>
        )}
        {btw && (
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
            <span>€{fmt(btwBedrag)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-base pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Totaal</span>
          <span style={{ color: "var(--teal)" }}>€{fmt(totaal)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Link href="/offerte/maak"
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center"
          style={{ background: "var(--teal)" }}>
          Nieuwe offerte maken
        </Link>
        <Link href="/dashboard"
          className="touch-scale py-3 text-center text-sm font-medium"
          style={{ color: "var(--muted)" }}>
          Terug naar dashboard
        </Link>
      </div>
    </div>
  );

  // ── Preview ──────────────────────────────────────────────────
  if (fase === "preview") return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setFase("opstellen")}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-black text-lg flex-1">Voorbeeld</h1>
        <button onClick={handleVersturen}
          className="touch-scale flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: "var(--teal)" }}>
          <Send size={14} /> Versturen
        </button>
      </div>

      {/* Document */}
      <div className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-lg mb-5"
        style={{ background: "white", color: "#111" }}>

        {/* Header */}
        <div className="p-6" style={{ background: "#0F6E56" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <span className="text-white font-black text-xl">{bedrijf.handelsnaam.charAt(0)}</span>
              </div>
              <p className="text-white font-black text-lg">{bedrijf.handelsnaam}</p>
              <p className="text-white/70 text-xs">{bedrijf.email} · {bedrijf.telefoon}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs font-semibold uppercase">Offerte</p>
              <p className="text-white font-black text-2xl">{nummer}</p>
              <p className="text-white/70 text-xs mt-1">Datum: {datum}</p>
              <p className="text-white/70 text-xs">Geldig tot: {geldigTot}</p>
            </div>
          </div>
        </div>

        {/* Aan */}
        {klantNaam && (
          <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#888" }}>Aan</p>
            <p className="font-bold text-sm">{klantNaam}</p>
            {klantEmail    && <p className="text-xs" style={{ color: "#888" }}>{klantEmail}</p>}
            {klantTelefoon && <p className="text-xs" style={{ color: "#888" }}>{klantTelefoon}</p>}
          </div>
        )}

        {/* Werkzaamheden */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ color: "#888" }}>Werkzaamheden</p>
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm leading-relaxed flex-1">{omschrijving}</p>
            <p className="font-black text-lg flex-shrink-0" style={{ color: "#0F6E56" }}>€{fmt(prijs)}</p>
          </div>
          <p className="text-xs mt-2 font-medium" style={{ color: kostenType === "alles_inbegrepen" ? "#16a34a" : "#d97706" }}>
            {kostenType === "alles_inbegrepen"
              ? "✓ Alles inbegrepen — geen extra kosten"
              : "📦 Exclusief materiaalkosten (zie hieronder)"}
          </p>
        </div>

        {/* Materiaal */}
        {kostenType === "plus_materiaal" && materialen.length > 0 && (
          <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "#888" }}>Materiaal & onderdelen</p>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid #eee" }}>
                  <th className="text-left pb-2 font-semibold" style={{ color: "#999" }}>Artikel</th>
                  <th className="text-right pb-2 font-semibold w-12" style={{ color: "#999" }}>Aant.</th>
                  <th className="text-right pb-2 font-semibold w-16" style={{ color: "#999" }}>Per stuk</th>
                  <th className="text-right pb-2 font-semibold w-16" style={{ color: "#999" }}>Totaal</th>
                </tr>
              </thead>
              <tbody>
                {materialen.map(m => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td className="py-1.5 font-medium">{m.naam}</td>
                    <td className="py-1.5 text-right">{m.aantal}</td>
                    <td className="py-1.5 text-right">€{fmt(m.prijs)}</td>
                    <td className="py-1.5 text-right font-semibold">€{fmt(m.aantal * m.prijs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totaal */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          {kostenType === "plus_materiaal" && (
            <>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "#888" }}>Arbeid</span>
                <span>€{fmt(prijs)}</span>
              </div>
              {matSubtotaal > 0 && (
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#888" }}>Materiaal</span>
                  <span>€{fmt(matSubtotaal)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs mb-2">
                <span style={{ color: "#888" }}>Subtotaal</span>
                <span>€{fmt(subtotaal)}</span>
              </div>
            </>
          )}
          {btw && (
            <div className="flex justify-between text-xs mb-2">
              <span style={{ color: "#888" }}>BTW (21%)</span>
              <span>€{fmt(btwBedrag)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base pt-2 border-t"
            style={{ borderColor: "#0F6E56", color: "#0F6E56" }}>
            <span>Totaal {btw ? "incl. BTW" : ""}</span>
            <span>€{fmt(totaal)}</span>
          </div>
        </div>

        <div className="px-6 py-4" style={{ background: "#f9fafb" }}>
          <p className="text-xs" style={{ color: "#666" }}>IBAN: {bedrijf.iban} · t.n.v. {bedrijf.naam}</p>
          <p className="text-xs mt-0.5" style={{ color: "#666" }}>Betalingstermijn: {bedrijf.betalingstermijn} dagen</p>
          {notities && <p className="text-xs mt-2 italic" style={{ color: "#888" }}>{notities}</p>}
        </div>
      </div>

      <div className="px-5">
        <button onClick={handleVersturen}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "var(--teal)" }}>
          <Send size={18} /> Offerte versturen naar {klantNaam || "klant"}
        </button>
      </div>
    </div>
  );

  // ── Opstellen ────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-lg">Nieuwe offerte</h1>
          <p className="text-xs font-semibold" style={{ color: "var(--teal)" }}>{nummer}</p>
        </div>
        <button
          onClick={() => kanVersturen && setFase("preview")}
          className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm"
          style={{
            background: kanVersturen ? "var(--teal)" + "15" : "var(--surface-2)",
            color: kanVersturen ? "var(--teal)" : "var(--muted)",
            border: `1.5px solid ${kanVersturen ? "var(--teal)" : "transparent"}`,
          }}>
          <Eye size={14} /> Preview
        </button>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* ── Klant ── */}
        <section className="card p-4 flex flex-col gap-3">
          <p className="font-black text-sm">👤 Klant</p>
          {[
            { label: "Naam", value: klantNaam, set: setKlantNaam, placeholder: "Lisa de Vries", required: false },
            { label: "E-mail", value: klantEmail, set: setKlantEmail, placeholder: "lisa@email.nl", required: false },
            { label: "Telefoon", value: klantTelefoon, set: setKlantTelefoon, placeholder: "06-98765432", required: false },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm"
                style={{ borderColor: f.value ? "var(--teal)" : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
            </div>
          ))}
        </section>

        {/* ── Prijs & omschrijving ── */}
        <section className="card p-4 flex flex-col gap-4">
          <p className="font-black text-sm">💶 Prijs & werkzaamheden</p>

          {/* Prijs */}
          <div>
            <label className="text-[10px] font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
              Prijs arbeid / werkzaamheden *
            </label>
            <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border"
              style={{ borderColor: arbeidsPrijs ? "var(--teal)" : "var(--border)", background: "var(--surface)" }}>
              <Euro size={18} style={{ color: "var(--teal)", flexShrink: 0 }} />
              <input
                type="number"
                value={arbeidsPrijs}
                onChange={e => setArbeidsPrijs(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0,00"
                className="flex-1 bg-transparent outline-none font-black text-xl"
                style={{ color: "var(--teal)" }}
              />
            </div>
          </div>

          {/* Omschrijving */}
          <div>
            <label className="text-[10px] font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
              Omschrijving werkzaamheden *
            </label>
            <textarea
              value={omschrijving}
              onChange={e => setOmschrijving(e.target.value)}
              placeholder="Bijv. lekkage reparatie keuken inclusief afdichting. Duurt ca. 1,5 uur."
              rows={3}
              className="w-full px-3 py-3 rounded-2xl border outline-none text-sm resize-none"
              style={{ borderColor: omschrijving ? "var(--teal)" : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
            />
          </div>

          {/* BTW toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">BTW (21%) toevoegen</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Voor zakelijke klanten</p>
            </div>
            <button
              onClick={() => setBtw(v => !v)}
              className="touch-scale relative w-12 h-6 rounded-full transition-all"
              style={{ background: btw ? "var(--teal)" : "var(--surface-2)" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: btw ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
        </section>

        {/* ── Kostentype ── */}
        <section>
          <p className="font-black text-sm mb-3">📋 Zijn er extra kosten?</p>
          <div className="flex flex-col gap-2">
            {([
              {
                id: "alles_inbegrepen" as KostenType,
                icon: "✅",
                titel: "Alles inbegrepen",
                sub: "Prijs is all-in, geen extra kosten voor de klant",
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                id: "plus_materiaal" as KostenType,
                icon: "📦",
                titel: "Plus materiaalkosten",
                sub: "Materiaal en onderdelen worden apart aangerekend",
                color: "#d97706",
                bg: "#fef3c7",
              },
            ]).map(opt => {
              const actief = kostenType === opt.id;
              return (
                <button key={opt.id} onClick={() => setKostenType(opt.id)}
                  className="touch-scale flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
                  style={{
                    borderColor: actief ? opt.color : "var(--border)",
                    background: actief ? opt.bg + "80" : "var(--surface)",
                  }}>
                  <span className="text-2xl flex-shrink-0">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{opt.titel}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{opt.sub}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: actief ? opt.color : "var(--border)" }}>
                    {actief && <div className="w-2.5 h-2.5 rounded-full" style={{ background: opt.color }} />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Materiaal (alleen zichtbaar als "plus_materiaal") ── */}
        {kostenType === "plus_materiaal" && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-sm">📦 Materiaal & onderdelen</p>
              {materialen.length > 0 && (
                <span className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: "#fef3c7", color: "#d97706" }}>
                  €{fmt(matSubtotaal)}
                </span>
              )}
            </div>

            {/* Toegevoegde materialen */}
            {materialen.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {materialen.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                    style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                    <Package size={14} style={{ color: "#d97706", flexShrink: 0 }} />
                    <p className="flex-1 font-semibold text-sm truncate">{m.naam}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateAantal(m.id, Math.max(1, m.aantal - 1))}
                        className="touch-scale w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: "var(--surface-2)" }}>−</button>
                      <span className="text-sm font-bold w-5 text-center">{m.aantal}</span>
                      <button onClick={() => updateAantal(m.id, m.aantal + 1)}
                        className="touch-scale w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ background: "var(--surface-2)" }}>+</button>
                    </div>
                    <span className="text-sm font-bold w-16 text-right flex-shrink-0"
                      style={{ color: "var(--teal)" }}>
                      €{fmt(m.aantal * m.prijs)}
                    </span>
                    <button onClick={() => verwijderMat(m.id)} className="touch-scale flex-shrink-0">
                      <Trash2 size={13} style={{ color: "#dc2626" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Snelkeuze */}
            <div className="mb-3">
              <p className="text-xs font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Snel toevoegen</p>
              <div className="flex flex-wrap gap-2">
                {MATERIAAL_SUGGESTIES.map(s => (
                  <button key={s.naam} onClick={() => voegSuggestieToe(s)}
                    className="touch-scale flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                    <Plus size={9} /> {s.naam}
                    <span style={{ color: "var(--teal)" }}>€{s.prijs}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Eigen artikel */}
            {showMatForm ? (
              <div className="card p-4 animate-slide-up">
                <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>Eigen artikel</p>
                <input value={nieuwNaam} onChange={e => setNieuwNaam(e.target.value)}
                  placeholder="Naam artikel (bijv. Mengkraan Grohe)"
                  className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm mb-2"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Aantal</label>
                    <input type="number" value={nieuwAantal} min={1}
                      onChange={e => setNieuwAantal(+e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm text-center font-bold"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Prijs per stuk</label>
                    <div className="flex items-center gap-1 px-3 py-2.5 rounded-xl border"
                      style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                      <Euro size={12} style={{ color: "#d97706" }} />
                      <input type="number" value={nieuwPrijs}
                        onChange={e => setNieuwPrijs(e.target.value === "" ? "" : +e.target.value)}
                        placeholder="0"
                        className="flex-1 bg-transparent outline-none text-sm font-bold w-0"
                        style={{ color: "#d97706" }} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowMatForm(false)}
                    className="touch-scale flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    Annuleren
                  </button>
                  <button onClick={voegMatToe}
                    disabled={!nieuwNaam || Number(nieuwPrijs) <= 0}
                    className="touch-scale flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: nieuwNaam && Number(nieuwPrijs) > 0 ? "#d97706" : "var(--muted)" }}>
                    Toevoegen
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowMatForm(true)}
                className="touch-scale w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border-2 border-dashed"
                style={{ borderColor: "#d9770640", color: "#d97706" }}>
                <Plus size={15} /> Eigen artikel invoeren
              </button>
            )}
          </section>
        )}

        {/* ── Totaal preview ── */}
        {prijs > 0 && (
          <div className="card p-4">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>Overzicht</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Werkzaamheden</span>
                <span>€{fmt(prijs)}</span>
              </div>
              {kostenType === "plus_materiaal" && matSubtotaal > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>Materiaal</span>
                  <span>€{fmt(matSubtotaal)}</span>
                </div>
              )}
              {btw && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
                  <span>€{fmt(btwBedrag)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-lg pt-2 border-t"
                style={{ borderColor: "var(--border)", color: "var(--teal)" }}>
                <span>Totaal</span>
                <span>€{fmt(totaal)}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {kostenType === "alles_inbegrepen"
                  ? "✅ All-in prijs — geen verrassingen voor de klant"
                  : `📦 Arbeid + materiaal (${materialen.length} artikel${materialen.length !== 1 ? "en" : ""})`}
              </p>
            </div>
          </div>
        )}

        {/* ── Notities ── */}
        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
            Notities (optioneel)
          </label>
          <textarea value={notities} onChange={e => setNotities(e.target.value)}
            placeholder="Bijv. parkeerkosten niet inbegrepen, geldigheidsduur..."
            rows={2} className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
        </div>

        <button
          onClick={() => kanVersturen && setFase("preview")}
          disabled={!kanVersturen}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: kanVersturen ? "var(--teal)" : "var(--muted)" }}>
          <Eye size={18} /> Preview & versturen
        </button>
      </div>
    </div>
  );
}
