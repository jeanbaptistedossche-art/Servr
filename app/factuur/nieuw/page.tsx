"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Send, Eye, Euro, CheckCircle2 } from "lucide-react";
import { MOCK_BEDRIJF, type OfferteRegel } from "@/lib/bedrijfStore";

type Fase = "opstellen" | "preview" | "verstuurd";

type Regel = {
  id: string;
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs: number;
  btwPercentage: number;
};

const EENHEDEN = ["uur", "dag", "stuk", "m²", "klus", "vast"];

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function FactuurNieuwPage() {
  const bedrijf = MOCK_BEDRIJF;
  const [fase, setFase] = useState<Fase>("opstellen");

  // Klant
  const [klantNaam, setKlantNaam] = useState("");
  const [klantEmail, setKlantEmail] = useState("");
  const [klantAdres, setKlantAdres] = useState("");

  // Regels
  const [regels, setRegels] = useState<Regel[]>([
    { id: "r1", omschrijving: "", aantal: 1, eenheid: "uur", prijs: 0, btwPercentage: 21 },
  ]);

  // Betaalinformatie
  const [betalingstermijn, setBetalingstermijn] = useState(14);
  const [notities, setNotities] = useState("");

  // Bereken totalen
  const subtotaal = regels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const totaalBtw = regels.reduce((s, r) => s + r.aantal * r.prijs * (r.btwPercentage / 100), 0);
  const totaal = subtotaal + totaalBtw;

  const datum = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const vervaldatum = new Date(Date.now() + betalingstermijn * 86400000)
    .toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const nummer = `FAC-${bedrijf.factuurVolgNr}`;

  // Regel helpers
  const updateRegel = (id: string, field: keyof Regel, value: string | number) =>
    setRegels(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  const voegRegelToe = () =>
    setRegels(rs => [...rs, { id: `r${Date.now()}`, omschrijving: "", aantal: 1, eenheid: "uur", prijs: 0, btwPercentage: 21 }]);
  const verwijderRegel = (id: string) =>
    setRegels(rs => rs.filter(r => r.id !== id));

  const kanVersturen = klantNaam.trim() && regels.some(r => r.omschrijving.trim() && r.prijs > 0);

  // ── Verstuurd ──────────────────────────────────────────────────────────────
  if (fase === "verstuurd") return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-bounce-in pb-24">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#fef3c7" }}>
        <Send size={32} style={{ color: "#d97706" }} />
      </div>
      <div>
        <h2 className="font-black text-2xl mb-2">Factuur verstuurd!</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Factuur <strong>{nummer}</strong> is verstuurd naar <strong>{klantNaam}</strong>.
          Vervaldatum: <strong>{vervaldatum}</strong>.
        </p>
      </div>
      <div className="card p-4 w-full text-left flex flex-col gap-2">
        {regels.filter(r => r.prijs > 0).map(r => (
          <div key={r.id} className="flex justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>{r.omschrijving || "Werkzaamheden"}</span>
            <span>€{fmt(r.aantal * r.prijs)}</span>
          </div>
        ))}
        {totaalBtw > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>BTW</span>
            <span>€{fmt(totaalBtw)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-base pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Totaal</span>
          <span style={{ color: "#d97706" }}>€{fmt(totaal)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <Link href="/factuur/nieuw"
          className="touch-scale w-full py-4 rounded-2xl font-bold text-center"
          style={{ background: "#fef3c7", color: "#d97706" }}>
          Nieuwe factuur maken
        </Link>
        <Link href="/documenten?tab=facturen"
          className="touch-scale py-3 text-center text-sm font-medium"
          style={{ color: "var(--muted)" }}>
          Terug naar overzicht
        </Link>
      </div>
    </div>
  );

  // ── Preview ────────────────────────────────────────────────────────────────
  if (fase === "preview") return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setFase("opstellen")}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-black text-lg flex-1">Voorbeeld factuur</h1>
        <button onClick={() => setFase("verstuurd")}
          className="touch-scale flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-white text-sm"
          style={{ background: "#d97706" }}>
          <Send size={14} /> Versturen
        </button>
      </div>

      {/* Factuur document */}
      <div className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-lg mb-5"
        style={{ background: "white", color: "#111" }}>

        {/* Header amber */}
        <div className="p-6" style={{ background: "#92400e" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                <span className="text-white font-black text-xl">{bedrijf.handelsnaam.charAt(0)}</span>
              </div>
              <p className="text-white font-black text-lg">{bedrijf.handelsnaam}</p>
              <p className="text-white/70 text-xs">{bedrijf.email}</p>
              <p className="text-white/70 text-xs">{bedrijf.telefoon}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Factuur</p>
              <p className="text-white font-black text-2xl">{nummer}</p>
              <p className="text-white/70 text-xs mt-1">Datum: {datum}</p>
              <p className="text-white/70 text-xs">Vervaldatum: {vervaldatum}</p>
            </div>
          </div>
        </div>

        {/* Aan */}
        {klantNaam && (
          <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
            <p className="text-xs font-bold uppercase mb-1" style={{ color: "#888" }}>Factuur aan</p>
            <p className="font-bold text-sm">{klantNaam}</p>
            {klantEmail && <p className="text-xs" style={{ color: "#888" }}>{klantEmail}</p>}
            {klantAdres && <p className="text-xs" style={{ color: "#888" }}>{klantAdres}</p>}
          </div>
        )}

        {/* Regeloverzicht */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: "#888" }}>Werkzaamheden & diensten</p>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <th className="text-left pb-2 font-semibold" style={{ color: "#999" }}>Omschrijving</th>
                <th className="text-right pb-2 font-semibold w-10" style={{ color: "#999" }}>Aant.</th>
                <th className="text-right pb-2 font-semibold w-14" style={{ color: "#999" }}>Prijs</th>
                <th className="text-right pb-2 font-semibold w-8" style={{ color: "#999" }}>BTW</th>
                <th className="text-right pb-2 font-semibold w-16" style={{ color: "#999" }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {regels.filter(r => r.prijs > 0 || r.omschrijving).map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td className="py-2 font-medium">{r.omschrijving || "—"}</td>
                  <td className="py-2 text-right">{r.aantal} {r.eenheid}</td>
                  <td className="py-2 text-right">€{fmt(r.prijs)}</td>
                  <td className="py-2 text-right">{r.btwPercentage}%</td>
                  <td className="py-2 text-right font-semibold">€{fmt(r.aantal * r.prijs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totalen */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "#888" }}>Subtotaal excl. BTW</span>
            <span>€{fmt(subtotaal)}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span style={{ color: "#888" }}>BTW</span>
            <span>€{fmt(totaalBtw)}</span>
          </div>
          <div className="flex justify-between font-black text-base pt-2 border-t"
            style={{ borderColor: "#92400e", color: "#92400e" }}>
            <span>Totaal te betalen</span>
            <span>€{fmt(totaal)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ background: "#fffbeb" }}>
          <p className="text-xs font-bold" style={{ color: "#92400e" }}>
            Gelieve binnen {betalingstermijn} dagen te betalen
          </p>
          <p className="text-xs mt-1" style={{ color: "#b45309" }}>
            IBAN: {bedrijf.iban} · t.n.v. {bedrijf.naam}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
            Vermeld factuurnummer <strong>{nummer}</strong> bij betaling
          </p>
          {notities && <p className="text-xs mt-2 italic" style={{ color: "#888" }}>{notities}</p>}
        </div>
      </div>

      <div className="px-5">
        <button onClick={() => setFase("verstuurd")}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "#d97706" }}>
          <Send size={18} /> Factuur versturen naar {klantNaam || "klant"}
        </button>
      </div>
    </div>
  );

  // ── Opstellen ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/documenten?tab=facturen"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-lg">Nieuwe factuur</h1>
          <p className="text-xs font-semibold" style={{ color: "#d97706" }}>{nummer}</p>
        </div>
        <button
          onClick={() => kanVersturen && setFase("preview")}
          className="touch-scale flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm"
          style={{
            background: kanVersturen ? "#fef3c7" : "var(--surface-2)",
            color: kanVersturen ? "#d97706" : "var(--muted)",
            border: `1.5px solid ${kanVersturen ? "#d97706" : "transparent"}`,
          }}>
          <Eye size={14} /> Preview
        </button>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">

        {/* ── Klant ── */}
        <section className="card p-4 flex flex-col gap-3">
          <p className="font-black text-sm">👤 Klantgegevens</p>
          {[
            { label: "Naam *", value: klantNaam, set: setKlantNaam, placeholder: "Bedrijfsnaam of contactpersoon" },
            { label: "E-mailadres", value: klantEmail, set: setKlantEmail, placeholder: "klant@email.nl" },
            { label: "Adres", value: klantAdres, set: setKlantAdres, placeholder: "Straat 1, 1234 AB Stad" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>
                {f.label}
              </label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm"
                style={{
                  borderColor: f.value ? "#d97706" : "var(--border)",
                  background: "var(--surface)", color: "var(--foreground)",
                }} />
            </div>
          ))}
        </section>

        {/* ── Regeloverzicht ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-sm">📋 Werkzaamheden & diensten</p>
            {subtotaal > 0 && (
              <span className="text-xs font-bold" style={{ color: "#d97706" }}>€{fmt(subtotaal)} excl. BTW</span>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {regels.map((r, i) => (
              <div key={r.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase" style={{ color: "var(--muted)" }}>
                    Regel {i + 1}
                  </p>
                  {regels.length > 1 && (
                    <button onClick={() => verwijderRegel(r.id)} className="touch-scale">
                      <Trash2 size={13} style={{ color: "#dc2626" }} />
                    </button>
                  )}
                </div>

                {/* Omschrijving */}
                <input value={r.omschrijving}
                  onChange={e => updateRegel(r.id, "omschrijving", e.target.value)}
                  placeholder="Bijv. Loodgieterswerkzaamheden"
                  className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm"
                  style={{
                    borderColor: r.omschrijving ? "#d97706" : "var(--border)",
                    background: "var(--surface)", color: "var(--foreground)",
                  }} />

                {/* Aantal × eenheid × prijs */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Aantal</label>
                    <input type="number" min={1} value={r.aantal}
                      onChange={e => updateRegel(r.id, "aantal", Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm text-center font-bold"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Eenheid</label>
                    <select value={r.eenheid}
                      onChange={e => updateRegel(r.id, "eenheid", e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border outline-none text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
                      {EENHEDEN.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase mb-1 block" style={{ color: "var(--muted)" }}>Prijs/stuk</label>
                    <div className="flex items-center gap-1 px-2 py-2.5 rounded-xl border"
                      style={{ borderColor: r.prijs ? "#d97706" : "var(--border)", background: "var(--surface)" }}>
                      <Euro size={11} style={{ color: "#d97706", flexShrink: 0 }} />
                      <input type="number" min={0} value={r.prijs || ""}
                        onChange={e => updateRegel(r.id, "prijs", Number(e.target.value))}
                        placeholder="0"
                        className="flex-1 bg-transparent outline-none text-sm font-bold w-0"
                        style={{ color: "#d97706" }} />
                    </div>
                  </div>
                </div>

                {/* BTW */}
                <div className="flex items-center gap-2">
                  <p className="text-xs flex-1" style={{ color: "var(--muted)" }}>BTW tarief</p>
                  {[0, 9, 21].map(pct => (
                    <button key={pct}
                      onClick={() => updateRegel(r.id, "btwPercentage", pct)}
                      className="touch-scale px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                      style={{
                        borderColor: r.btwPercentage === pct ? "#d97706" : "var(--border)",
                        background: r.btwPercentage === pct ? "#fef3c7" : "var(--surface)",
                        color: r.btwPercentage === pct ? "#d97706" : "var(--muted)",
                      }}>
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Regeltotaal */}
                {r.prijs > 0 && (
                  <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                    <span style={{ color: "var(--muted)" }}>Regeltotaal incl. BTW</span>
                    <span className="font-bold" style={{ color: "#d97706" }}>
                      €{fmt(r.aantal * r.prijs * (1 + r.btwPercentage / 100))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={voegRegelToe}
            className="touch-scale w-full mt-3 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border-2 border-dashed"
            style={{ borderColor: "#d9770640", color: "#d97706" }}>
            <Plus size={15} /> Regel toevoegen
          </button>
        </section>

        {/* ── Betaalinformatie ── */}
        <section className="card p-4 flex flex-col gap-4">
          <p className="font-black text-sm">💶 Betaalinformatie</p>
          <div>
            <label className="text-[10px] font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
              Betalingstermijn
            </label>
            <div className="flex gap-2">
              {[7, 14, 30, 60].map(d => (
                <button key={d}
                  onClick={() => setBetalingstermijn(d)}
                  className="touch-scale flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: betalingstermijn === d ? "#d97706" : "var(--border)",
                    background: betalingstermijn === d ? "#fef3c7" : "var(--surface)",
                    color: betalingstermijn === d ? "#d97706" : "var(--muted)",
                  }}>
                  {d} dagen
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Vervaldatum: <strong>{vervaldatum}</strong>
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Betaling op: <strong>{bedrijf.iban}</strong> t.n.v. {bedrijf.naam}
            </p>
          </div>
        </section>

        {/* ── Totaaloverzicht ── */}
        {subtotaal > 0 && (
          <div className="card p-4">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>Totaaloverzicht</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Subtotaal excl. BTW</span>
                <span>€{fmt(subtotaal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>BTW</span>
                <span>€{fmt(totaalBtw)}</span>
              </div>
              <div className="flex justify-between font-black text-lg pt-2 border-t"
                style={{ borderColor: "var(--border)", color: "#d97706" }}>
                <span>Totaal te betalen</span>
                <span>€{fmt(totaal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Notities ── */}
        <div>
          <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
            Notities (optioneel)
          </label>
          <textarea value={notities} onChange={e => setNotities(e.target.value)}
            placeholder="Bijv. betalingsreferentie, afspraken over deelbetaling..."
            rows={2} className="w-full px-4 py-3 rounded-2xl border outline-none text-sm resize-none"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }} />
        </div>

        <button
          onClick={() => kanVersturen && setFase("preview")}
          disabled={!kanVersturen}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: kanVersturen ? "#d97706" : "var(--muted)" }}>
          <Eye size={18} /> Preview & versturen
        </button>
      </div>
    </div>
  );
}
