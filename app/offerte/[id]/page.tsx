"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Star, CheckCircle, MapPin, MessageCircle, Clock,
  CreditCard, Building2, Smartphone, Phone, FileText,
} from "lucide-react";
import { MOCK_OFFERTES, MOCK_OPDRACHTEN } from "@/lib/store";

type BetaalMethode = "ideal" | "kaart" | "paypal";
type Fase = "overzicht" | "geaccepteerd" | "betalen" | "succes";

const BANKEN = ["ING", "ABN AMRO", "Rabobank", "SNS", "ASN", "Bunq", "Triodos", "RegioBank"];

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Extra document-data per offerte (niet in de store, want klant-gericht)
type Regel = { omschrijving: string; qty?: number; eenheid?: string; tarief?: number; bedrag: number };

const OFFERTE_DATA: Record<string, {
  nummer: string;
  datum: string;
  regels: Regel[];
  btw: boolean;
  chatId: string;
  vakmanBedrijf: string;
  vakmanTel: string;
}> = {
  off1: {
    nummer: "OFF-2026-041",
    datum: "18 mei 2026",
    regels: [
      { omschrijving: "Arbeid loodgieterswerk", qty: 2, eenheid: "uur", tarief: 32.50, bedrag: 65 },
      { omschrijving: "Afdichtingsmateriaal & pakkingen", bedrag: 8 },
      { omschrijving: "Voorrijkosten", bedrag: 0 },
    ],
    btw: false,
    chatId: "p1",
    vakmanBedrijf: "Marco Loodgieter",
    vakmanTel: "06-12 34 56 78",
  },
  off2: {
    nummer: "OFF-2026-042",
    datum: "18 mei 2026",
    regels: [
      { omschrijving: "Arbeid loodgieterswerk", qty: 2, eenheid: "uur", tarief: 40, bedrag: 80 },
      { omschrijving: "Nieuw afdichtingsmateriaal", bedrag: 5 },
    ],
    btw: false,
    chatId: "p5",
    vakmanBedrijf: "Aydın Installaties",
    vakmanTel: "06-98 76 54 32",
  },
};

const FALLBACK_DATA = OFFERTE_DATA["off1"];

export default function OffertePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const offerte = MOCK_OFFERTES.find(o => o.id === id) ?? MOCK_OFFERTES[0];
  const opdracht = MOCK_OPDRACHTEN.find(o => o.id === offerte.opdrachtId) ?? MOCK_OPDRACHTEN[0];
  const extra = OFFERTE_DATA[id] ?? FALLBACK_DATA;

  const [fase, setFase] = useState<Fase>("overzicht");
  const [methode, setMethode] = useState<BetaalMethode>("ideal");
  const [bank, setBank] = useState("ING");
  const [processing, setProcessing] = useState(false);

  const subtotaal = extra.regels.reduce((s, r) => s + r.bedrag, 0);
  const btwBedrag = extra.btw ? subtotaal * 0.21 : 0;
  const totaal = subtotaal + btwBedrag;

  const betaal = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2200));
    setFase("succes");
  };

  // ── Succes ───────────────────────────────────────────────────────────────
  if (fase === "succes") return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-6 text-center animate-bounce-in pb-24">
      <div className="relative">
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "var(--teal)" }}>
          <CheckCircle size={48} color="white" />
        </div>
        <div className="animate-pulse-ring absolute inset-0 rounded-full" style={{ background: "rgba(15,110,86,0.2)" }} />
      </div>
      <div>
        <h2 className="font-black text-2xl mb-2">Betaald! 🎉</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <strong>€{fmt(totaal)}</strong> betaald via {methode === "ideal" ? `iDEAL (${bank})` : methode === "kaart" ? "creditcard" : "PayPal"}.
        </p>
      </div>
      <div className="w-full card p-4 text-left flex flex-col gap-2">
        <p className="font-bold text-sm mb-1">Betalingsbevestiging</p>
        {extra.regels.filter(r => r.bedrag > 0).map((r, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>{r.omschrijving}</span>
            <span>€{fmt(r.bedrag)}</span>
          </div>
        ))}
        <div className="flex justify-between text-base font-black pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Totaal betaald</span>
          <span style={{ color: "var(--teal)" }}>€{fmt(totaal)}</span>
        </div>
      </div>
      <Link href="/" className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center" style={{ background: "var(--teal)" }}>
        Terug naar home
      </Link>
    </div>
  );

  // ── Betalen ───────────────────────────────────────────────────────────────
  if (fase === "betalen") return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setFase("geaccepteerd")}
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-black text-lg">Klus betalen</h1>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-5">
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <p className="font-bold text-sm">Overzicht {extra.nummer}</p>
          </div>
          <div className="px-4 py-3 flex flex-col gap-2">
            {extra.regels.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: r.bedrag === 0 ? "var(--muted)" : "var(--foreground)" }}>
                  {r.omschrijving}
                  {r.qty && r.tarief ? ` (${r.qty}× €${fmt(r.tarief)})` : ""}
                </span>
                <span style={{ color: r.bedrag === 0 ? "var(--muted)" : "var(--foreground)" }}>
                  {r.bedrag === 0 ? "Gratis" : `€${fmt(r.bedrag)}`}
                </span>
              </div>
            ))}
            {extra.btw && (
              <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
                <span>BTW (21%)</span>
                <span>€{fmt(btwBedrag)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="font-black text-base">Totaal te betalen</span>
            <span className="font-black text-xl" style={{ color: "var(--teal)" }}>€{fmt(totaal)}</span>
          </div>
        </div>

        <div>
          <p className="font-black text-base mb-3">Betaalmethode</p>
          <div className="flex flex-col gap-2">
            {[
              { id: "ideal" as const, label: "iDEAL", icon: <Building2 size={20} />, sub: "Direct via jouw bank" },
              { id: "kaart" as const, label: "Creditcard / Debitcard", icon: <CreditCard size={20} />, sub: "Visa, Mastercard, Maestro" },
              { id: "paypal" as const, label: "PayPal", icon: <Smartphone size={20} />, sub: "PayPal account" },
            ].map(m => (
              <button key={m.id} onClick={() => setMethode(m.id)}
                className="touch-scale flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all"
                style={{
                  borderColor: methode === m.id ? "var(--teal)" : "var(--border)",
                  background: methode === m.id ? "var(--teal)" + "08" : "var(--surface)",
                }}>
                <div style={{ color: methode === m.id ? "var(--teal)" : "var(--muted)" }}>{m.icon}</div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{m.sub}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: methode === m.id ? "var(--teal)" : "var(--border)" }}>
                  {methode === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />}
                </div>
              </button>
            ))}
          </div>

          {methode === "ideal" && (
            <div className="mt-3">
              <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>Kies je bank</label>
              <div className="grid grid-cols-4 gap-2">
                {BANKEN.map(b => (
                  <button key={b} onClick={() => setBank(b)}
                    className="touch-scale py-2.5 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      borderColor: bank === b ? "var(--teal)" : "var(--border)",
                      background: bank === b ? "var(--teal)" + "10" : "var(--surface)",
                      color: bank === b ? "var(--teal)" : "var(--foreground)",
                    }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={betaal} disabled={processing}
          className="touch-scale w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
          style={{ background: "var(--teal)" }}>
          {processing
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Betaling verwerken...</>
            : <><CreditCard size={20} /> Betaal €{fmt(totaal)}</>}
        </button>
        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
          🔒 Beveiligde betaling via Servr Payments
        </p>
      </div>
    </div>
  );

  // ── Geaccepteerd ─────────────────────────────────────────────────────────
  if (fase === "geaccepteerd") return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/mijn-opdrachten"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-black text-lg">Klus in uitvoering</h1>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
          <div className="px-6 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} color="white" />
            </div>
            <h2 className="text-white font-black text-xl mb-1">Offerte geaccepteerd!</h2>
            <p className="text-white/80 text-sm">Jouw adres is gedeeld met {offerte.vakman.split(" ")[0]}</p>
          </div>
        </div>

        <div className="card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--teal)" + "15" }}>
            <MapPin size={18} style={{ color: "var(--teal)" }} />
          </div>
          <div>
            <p className="font-bold text-sm">Jouw adres is nu zichtbaar</p>
            <p className="font-semibold text-sm mt-0.5">{opdracht.adres}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              {offerte.vakman} kan nu naar jou toe komen.
            </p>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <img src={offerte.vakmanAvatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
            <div className="flex-1">
              <p className="font-bold text-base">{offerte.vakman}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold">4.9</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>(127 reviews)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <Clock size={14} style={{ color: "var(--teal)" }} />
            <p className="text-sm font-semibold">Komt: <strong>{offerte.eta}</strong></p>
          </div>
        </div>

        <Link href={`/chat/${extra.chatId}`}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center flex items-center justify-center gap-2"
          style={{ background: "var(--teal)" }}>
          <MessageCircle size={18} /> Chat met {offerte.vakman.split(" ")[0]}
        </Link>

        <div className="card p-5">
          <p className="font-bold text-sm mb-1">Klus afgerond?</p>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Betaal pas nadat de vakman zijn werk heeft gedaan en jij tevreden bent.
          </p>
          <button onClick={() => setFase("betalen")}
            className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: "var(--teal)" }}>
            💳 Klus betalen — €{fmt(totaal)}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Overzicht — het eigenlijke offerte-document ───────────────────────────
  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <Link href="/offertes"
          className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-black text-lg">Offerte</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{extra.nummer}</p>
        </div>
        <Link href={`/chat/${extra.chatId}`}
          className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
          style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
          <MessageCircle size={13} /> Vraag stellen
        </Link>
      </div>

      <div className="px-5 pt-4 flex flex-col gap-4">

        {/* ── Document kaart ── */}
        <div className="card overflow-hidden">

          {/* Document header */}
          <div className="px-5 py-5"
            style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText size={18} color="white" />
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-none">OFFERTE</p>
                    <p className="text-white/70 text-[11px]">{extra.nummer}</p>
                  </div>
                </div>
                <p className="text-white/70 text-xs">Datum: {extra.datum}</p>
                <p className="text-white/70 text-xs">Geldig tot: {offerte.geldigTot}</p>
              </div>
              <img src={offerte.vakmanAvatar}
                className="w-14 h-14 rounded-2xl object-cover"
                style={{ border: "2px solid rgba(255,255,255,0.3)" }} alt="" />
            </div>
          </div>

          {/* Van */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Van</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-black text-sm">{offerte.vakman}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{extra.vakmanBedrijf}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">4.9</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>(127)</span>
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--teal)", color: "white" }}>
                    S{offerte.vakmanScore}
                  </span>
                </div>
              </div>
              <a href={`tel:${extra.vakmanTel}`}
                className="touch-scale w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "12" }}>
                <Phone size={16} style={{ color: "var(--teal)" }} />
              </a>
            </div>
          </div>

          {/* Voor */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Voor</p>
            <p className="font-bold text-sm">{opdracht.categorieIcon} {opdracht.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={11} style={{ color: "var(--muted)" }} />
              <p className="text-xs" style={{ color: "var(--muted)" }}>Adres gedeeld na acceptatie</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock size={11} style={{ color: "var(--teal)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--teal)" }}>Uitvoering: {offerte.eta}</p>
            </div>
          </div>

          {/* Omschrijving */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--muted)" }}>Omschrijving werkzaamheden</p>
            <p className="text-sm leading-relaxed">{offerte.beschrijving}</p>
          </div>

          {/* Prijsregels */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>Prijsopbouw</p>
            <div className="flex flex-col gap-2.5">
              {extra.regels.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{r.omschrijving}</p>
                    {r.qty && r.tarief ? (
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {r.qty} {r.eenheid} × €{fmt(r.tarief)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0"
                    style={{ color: r.bedrag === 0 ? "var(--muted)" : "var(--foreground)" }}>
                    {r.bedrag === 0 ? "Gratis" : `€${fmt(r.bedrag)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totaalberekening */}
          <div className="px-5 py-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--muted)" }}>Subtotaal</span>
                <span>€{fmt(subtotaal)}</span>
              </div>
              {extra.btw ? (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
                  <span>€{fmt(btwBedrag)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--muted)" }}>BTW</span>
                  <span style={{ color: "var(--muted)" }}>Vrijgesteld (particulier)</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 mt-1 border-t"
                style={{ borderColor: "var(--border)" }}>
                <span className="font-black text-base">Totaal</span>
                <span className="font-black text-2xl" style={{ color: "var(--teal)" }}>€{fmt(totaal)}</span>
              </div>
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              Je betaalt pas nadat de klus naar wens is afgerond.
            </p>
          </div>
        </div>

        {/* Adres privacy */}
        <div className="card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--coral)" + "15" }}>
            <MapPin size={18} style={{ color: "var(--coral)" }} />
          </div>
          <div>
            <p className="font-bold text-sm mb-0.5">Adres wordt gedeeld na acceptatie</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              Zodra jij accepteert, ontvangt <strong>{offerte.vakman}</strong> je exacte adres.
            </p>
          </div>
        </div>

        {/* Knoppen */}
        <div className="flex gap-3 pt-1">
          <Link href="/offertes"
            className="touch-scale flex-1 py-4 rounded-2xl font-bold text-sm text-center border"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            ✕ Weigeren
          </Link>
          <button onClick={() => setFase("geaccepteerd")}
            className="touch-scale flex-[2] py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"
            style={{ background: "var(--teal)" }}>
            <CheckCircle size={18} /> Accepteer offerte
          </button>
        </div>

        <p className="text-xs text-center pb-2" style={{ color: "var(--muted)" }}>
          Door te accepteren ga je akkoord met de Servr gebruiksvoorwaarden
        </p>
      </div>
    </div>
  );
}
