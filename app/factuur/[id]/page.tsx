"use client";

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle2, Clock, XCircle, Download, Share2 } from "lucide-react";
import { MOCK_BEDRIJF } from "@/lib/bedrijfStore";

type FactuurStatus = "open" | "herinnering" | "betaald" | "verlopen";

const FACTUREN: Record<string, {
  nummer: string; datum: string; vervaldatum: string; status: FactuurStatus;
  klantNaam: string; klantAvatar: string; klantEmail: string; chatId: string;
  regels: { id: string; omschrijving: string; aantal: number; eenheid: string; prijs: number; btwPercentage: number }[];
  notities: string;
}> = {
  "fac-1": {
    nummer: "FAC-876",
    datum: "18 mei 2026",
    vervaldatum: "1 juni 2026",
    status: "open",
    klantNaam: "Ahmed Mansour",
    klantAvatar: "https://i.pravatar.cc/150?img=33",
    klantEmail: "ahmed@email.nl",
    chatId: "p2",
    regels: [
      { id: "r1", omschrijving: "Toilet installatie (arbeid)", aantal: 1, eenheid: "klus", prijs: 195, btwPercentage: 21 },
      { id: "r2", omschrijving: "CV ketel inspectie", aantal: 1, eenheid: "klus", prijs: 99, btwPercentage: 21 },
      { id: "r3", omschrijving: "Voorrijkosten", aantal: 1, eenheid: "vast", prijs: 25, btwPercentage: 21 },
    ],
    notities: "Graag factuurnummer vermelden bij betaling.",
  },
  "fac-2": {
    nummer: "FAC-875",
    datum: "10 mei 2026",
    vervaldatum: "24 mei 2026",
    status: "betaald",
    klantNaam: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    klantEmail: "lisa@email.nl",
    chatId: "p1",
    regels: [
      { id: "r1", omschrijving: "Lekkage reparatie kraan keuken", aantal: 1, eenheid: "klus", prijs: 75, btwPercentage: 21 },
      { id: "r2", omschrijving: "Afdichtingsmateriaal", aantal: 1, eenheid: "stuk", prijs: 12, btwPercentage: 21 },
      { id: "r3", omschrijving: "Mengkraan vervangen", aantal: 1, eenheid: "klus", prijs: 48, btwPercentage: 21 },
    ],
    notities: "",
  },
  "fac-3": {
    nummer: "FAC-874",
    datum: "28 april 2026",
    vervaldatum: "12 mei 2026",
    status: "verlopen",
    klantNaam: "Petra Jansen",
    klantAvatar: "https://i.pravatar.cc/150?img=47",
    klantEmail: "petra@email.nl",
    chatId: "p3",
    regels: [
      { id: "r1", omschrijving: "CV ketel jaarlijkse inspectie", aantal: 1, eenheid: "klus", prijs: 99, btwPercentage: 21 },
    ],
    notities: "",
  },
  "fac-4": {
    nummer: "FAC-873",
    datum: "20 april 2026",
    vervaldatum: "4 mei 2026",
    status: "betaald",
    klantNaam: "Sandra Hoek",
    klantAvatar: "https://i.pravatar.cc/150?img=56",
    klantEmail: "sandra@email.nl",
    chatId: "p4",
    regels: [
      { id: "r1", omschrijving: "Toilet installatie", aantal: 1, eenheid: "klus", prijs: 195, btwPercentage: 21 },
    ],
    notities: "",
  },
  "fac-5": {
    nummer: "FAC-872",
    datum: "15 april 2026",
    vervaldatum: "29 april 2026",
    status: "herinnering",
    klantNaam: "Rob Smeets",
    klantAvatar: "https://i.pravatar.cc/150?img=52",
    klantEmail: "rob@email.nl",
    chatId: "p5",
    regels: [
      { id: "r1", omschrijving: "Badkamer kraan vervangen", aantal: 1, eenheid: "klus", prijs: 85, btwPercentage: 21 },
      { id: "r2", omschrijving: "Sifon vervangen", aantal: 1, eenheid: "klus", prijs: 65, btwPercentage: 21 },
      { id: "r3", omschrijving: "Sifon (materiaal)", aantal: 1, eenheid: "stuk", prijs: 14, btwPercentage: 21 },
    ],
    notities: "Tweede herinnering verstuurd op 2 mei 2026.",
  },
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_CFG: Record<FactuurStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:        { label: "Openstaand",  color: "#d97706", bg: "#fef3c7",          icon: <Clock size={14} /> },
  herinnering: { label: "Herinnering", color: "#dc2626", bg: "#fee2e2",          icon: <AlertCircle size={14} /> },
  betaald:     { label: "Betaald",     color: "#16a34a", bg: "#dcfce7",          icon: <CheckCircle2 size={14} /> },
  verlopen:    { label: "Verlopen",    color: "#6b7280", bg: "#EDE4D2", icon: <XCircle size={14} /> },
};

export default function FactuurDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bedrijf = MOCK_BEDRIJF;
  const data = FACTUREN[id];
  const [downloadToast, setDownloadToast] = useState(false);

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-6 text-center">
      <span className="text-5xl">🧾</span>
      <p className="font-black text-xl">Factuur niet gevonden</p>
      <Link href="/documenten?tab=facturen"
        className="touch-scale px-6 py-3 rounded-2xl font-bold text-white text-sm"
        style={{ background: "#2B4030" }}>
        Terug naar overzicht
      </Link>
    </div>
  );

  const cfg = STATUS_CFG[data.status];
  const subtotaal = data.regels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const totaalBtw = data.regels.reduce((s, r) => s + r.aantal * r.prijs * (r.btwPercentage / 100), 0);
  const totaal = subtotaal + totaalBtw;

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "#F5EFE5", borderBottom: "1px solid #E5DDD0" }}>
        <Link href="/documenten?tab=facturen"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-lg">{data.nummer}</h1>
          <span className="flex items-center gap-1 text-xs font-bold" style={{ color: cfg.color }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>
        <Link href={`/chat/${data.chatId}`}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <MessageCircle size={18} style={{ color: "#2B4030" }} />
        </Link>
      </div>

      {/* Factuur document */}
      <div className="mx-5 mt-5 rounded-3xl overflow-hidden shadow-lg"
        style={{ background: "white", color: "#111" }}>

        {/* Amber header */}
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
              <p className="text-white font-black text-2xl">{data.nummer}</p>
              <p className="text-white/70 text-xs mt-1">Datum: {data.datum}</p>
              <p className="text-white/70 text-xs">Vervalt: {data.vervaldatum}</p>
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div className="px-6 py-3 flex items-center gap-2"
          style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.icon}
          <span className="font-bold text-sm">{cfg.label}</span>
          {data.status === "open" && <span className="ml-auto text-xs">Betaal voor {data.vervaldatum}</span>}
          {data.status === "betaald" && <span className="ml-auto text-xs">✓ Ontvangen</span>}
          {data.status === "herinnering" && <span className="ml-auto text-xs font-bold">Betaling achterstallig!</span>}
        </div>

        {/* Klant */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ color: "#888" }}>Factuur aan</p>
          <div className="flex items-center gap-3">
            <img src={data.klantAvatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div>
              <p className="font-bold text-sm">{data.klantNaam}</p>
              <p className="text-xs" style={{ color: "#888" }}>{data.klantEmail}</p>
            </div>
          </div>
        </div>

        {/* Regeloverzicht */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: "#888" }}>Werkzaamheden</p>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #eee" }}>
                <th className="text-left pb-2 font-semibold" style={{ color: "#999" }}>Omschrijving</th>
                <th className="text-right pb-2 font-semibold w-16" style={{ color: "#999" }}>Aantal</th>
                <th className="text-right pb-2 font-semibold w-16" style={{ color: "#999" }}>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {data.regels.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td className="py-2 font-medium">{r.omschrijving}</td>
                  <td className="py-2 text-right">{r.aantal}× {r.eenheid}</td>
                  <td className="py-2 text-right font-semibold">€{fmt(r.aantal * r.prijs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totalen */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "#f0f0f0" }}>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: "#888" }}>Subtotaal excl. BTW</span>
            <span>€{fmt(subtotaal)}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span style={{ color: "#888" }}>BTW (21%)</span>
            <span>€{fmt(totaalBtw)}</span>
          </div>
          <div className="flex justify-between font-black text-base pt-2 border-t"
            style={{ borderColor: "#92400e", color: "#92400e" }}>
            <span>Totaal te betalen</span>
            <span>€{fmt(totaal)}</span>
          </div>
        </div>

        {/* Betaalgegevens */}
        <div className="px-6 py-4" style={{ background: "#fffbeb" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#92400e" }}>Betaalgegevens</p>
          <p className="text-xs" style={{ color: "#b45309" }}>IBAN: {bedrijf.iban}</p>
          <p className="text-xs" style={{ color: "#b45309" }}>t.n.v. {bedrijf.naam}</p>
          <p className="text-xs mt-1" style={{ color: "#b45309" }}>
            Vermeld: <strong>{data.nummer}</strong>
          </p>
          {data.notities ? (
            <p className="text-xs mt-2 italic" style={{ color: "#888" }}>{data.notities}</p>
          ) : null}
        </div>
      </div>

      {/* Acties */}
      <div className="px-5 mt-5 pb-10 flex flex-col gap-3">

        {/* Download PDF — voor iedereen zichtbaar */}
        <button
          onClick={() => {
            setDownloadToast(true);
            setTimeout(() => setDownloadToast(false), 2500);
          }}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
          <Download size={18} /> Download PDF
        </button>

        {/* Delen */}
        <button
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({ title: `Factuur ${data.nummer}`, text: `Factuur van ${bedrijf.handelsnaam} — €${fmt(totaal)}` });
            }
          }}
          className="touch-scale w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2"
          style={{ background: "#F1F5F9", color: "#475569" }}>
          <Share2 size={16} /> Delen
        </button>

        {(data.status === "open" || data.status === "herinnering") && (
          <button
            className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "#d97706" }}>
            <AlertCircle size={18} /> Herinnering sturen
          </button>
        )}
        <Link href={`/chat/${data.chatId}`}
          className="touch-scale w-full py-3.5 rounded-2xl font-bold text-center border flex items-center justify-center gap-2"
          style={{ borderColor: "#E5DDD0", color: "#2B4030" }}>
          <MessageCircle size={16} /> Stuur een bericht
        </Link>
      </div>

      {/* Download toast */}
      {downloadToast && (
        <div
          className="fixed bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl animate-bounce-in"
          style={{ background: "#0f172a", color: "white", zIndex: 99, boxShadow: "0 8px 32px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          <CheckCircle2 size={18} style={{ color: "#10B981" }} />
          <span className="font-bold text-sm">{data.nummer}.pdf wordt gedownload…</span>
        </div>
      )}
    </div>
  );
}
