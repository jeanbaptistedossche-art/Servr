"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, ChevronRight, CreditCard,
  MessageCircle, Shield, X, Loader2, Lock,
} from "lucide-react";
import { useOfferteStore } from "@/lib/offerteStore";
import { useInstellingenStore } from "@/lib/instellingenStore";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── bank brand lookup ────────────────────────────────────────────────────────

type BankBrand = { bg: string; dark: string; naam: string };

const BANK_BRANDS: Record<string, BankBrand> = {
  "ING":                { bg: "#FF6200", dark: "#CC4E00", naam: "ING" },
  "ABN AMRO":           { bg: "#009FE3", dark: "#0077B0", naam: "ABN AMRO" },
  "Rabobank":           { bg: "#EC0000", dark: "#B80000", naam: "Rabobank" },
  "SNS Bank":           { bg: "#00589C", dark: "#003D70", naam: "SNS Bank" },
  "Triodos Bank":       { bg: "#00A650", dark: "#007D3C", naam: "Triodos Bank" },
  "ASN Bank":           { bg: "#56A629", dark: "#3D7A1C", naam: "ASN Bank" },
  "Bunq":               { bg: "#00D7B0", dark: "#00A88A", naam: "bunq" },
  "Knab":               { bg: "#FF6E00", dark: "#CC5800", naam: "Knab" },
  "RegioBank":          { bg: "#E8002B", dark: "#B80022", naam: "RegioBank" },
  "Revolut":            { bg: "#191C1F", dark: "#0D0F11", naam: "Revolut" },
  "Belfius":            { bg: "#E22226", dark: "#B01A1D", naam: "Belfius" },
  "KBC":                { bg: "#00659A", dark: "#004D74", naam: "KBC" },
  "ING België":         { bg: "#FF6200", dark: "#CC4E00", naam: "ING" },
  "BNP Paribas Fortis": { bg: "#00965E", dark: "#006E45", naam: "BNP Paribas Fortis" },
  "Argenta":            { bg: "#006EAA", dark: "#005285", naam: "Argenta" },
  "Fintro":             { bg: "#005298", dark: "#003D74", naam: "Fintro" },
  "Bancontact":         { bg: "#005298", dark: "#003D74", naam: "Bancontact" },
};

function getBankBrand(key: string): BankBrand {
  return BANK_BRANDS[key] ?? { bg: "#1a1a2e", dark: "#0d0f18", naam: key };
}

// ─── default payment options (when no saved methods) ─────────────────────────

const DEFAULT_METHODES = [
  { naam: "iDEAL",      icoon: "🏦", sub: "Via jouw bank",     type: "ideal"      },
  { naam: "Creditcard", icoon: "💳", sub: "Visa / Mastercard", type: "creditcard" },
  { naam: "Bancontact", icoon: "🇧🇪", sub: "Belgische kaart",  type: "bancontact" },
];

type BetaalFase = "selectie" | "loading" | "bank_auth";

// ─── main page ────────────────────────────────────────────────────────────────

export default function TeBetalenPage() {
  const { offertes, betaalOfferte, weigerOfferte } = useOfferteStore();
  const { betaalmethoden } = useInstellingenStore();

  const [betalendId, setBetalendId]       = useState<string | null>(null);
  const [betaaldIds, setBetaaldIds]       = useState<string[]>([]);
  const [gekozenIdx, setGekozenIdx]       = useState(0);
  const [betaalFase, setBetaalFase]       = useState<BetaalFase>("selectie");
  const [redirectBank, setRedirectBank]   = useState<BankBrand | null>(null);

  const openstaand = offertes.filter(o => o.status === "openstaand");
  const betalende  = openstaand.find(o => o.id === betalendId);

  const heeftOpgeslaanMethoden = betaalmethoden.length > 0;

  // Open the payment sheet
  const handleOpenSheet = (id: string) => {
    setBetalendId(id);
    setBetaalFase("selectie");
    setGekozenIdx(0);
    setRedirectBank(null);
  };

  // Confirm payment — either redirect to bank or complete directly
  const handleBevestig = () => {
    if (!betalende) return;

    let type: string;
    let bankNaam: string | undefined;

    if (heeftOpgeslaanMethoden) {
      const m = betaalmethoden[gekozenIdx];
      type     = m.type;
      bankNaam = m.bankNaam;
    } else {
      const m = DEFAULT_METHODES[gekozenIdx];
      type     = m.type;
    }

    if (type === "ideal" || type === "bancontact") {
      const key    = bankNaam ?? (type === "bancontact" ? "Bancontact" : "ING");
      const brand  = getBankBrand(key);
      setRedirectBank(brand);
      setBetaalFase("loading");
      setTimeout(() => setBetaalFase("bank_auth"), 1600);
    } else {
      // Creditcard / IBAN — direct
      betaalOfferte(betalende.id);
      setBetaaldIds(v => [...v, betalende.id]);
      setBetalendId(null);
    }
  };

  // User clicked "Betaling autoriseren" on the bank screen
  const handleBankAutoriseer = () => {
    if (!betalende) return;
    betaalOfferte(betalende.id);
    setBetaaldIds(v => [...v, betalende.id]);
    setBetalendId(null);
    setBetaalFase("selectie");
    setRedirectBank(null);
  };

  const handleAnnuleer = () => {
    setBetaalFase("selectie");
    setRedirectBank(null);
    setBetalendId(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-5"
        style={{ background: "linear-gradient(160deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/mijn-opdrachten"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <h1 className="text-white font-black text-xl flex-1">Te betalen</h1>
          {openstaand.length > 0 && (
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--coral)", color: "white" }}>
              {openstaand.length} openstaand
            </span>
          )}
        </div>
        {openstaand.length > 0 && (
          <div className="bg-white/15 rounded-2xl p-3 flex items-center gap-3">
            <Shield size={16} color="rgba(255,255,255,0.8)" />
            <p className="text-white/80 text-xs">
              Betaal veilig via Servr. Geld gaat pas naar vakman na akkoord.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* ── Net betaalde offertes (feedback) ── */}
        {betaaldIds.map(id => {
          const o = offertes.find(x => x.id === id);
          if (!o) return null;
          return (
            <div key={id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#dcfce7" }}>
                <CheckCircle2 size={20} style={{ color: "#16a34a" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{o.vakmanNaam}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{o.nummer} · Betaald ✓</p>
              </div>
              <span className="font-black text-base flex-shrink-0" style={{ color: "#16a34a" }}>
                €{fmt(o.totaal)}
              </span>
            </div>
          );
        })}

        {/* ── Openstaande offertes ── */}
        {openstaand.map(o => (
          <div key={o.id} className="card overflow-hidden">
            <div className="p-4">

              {/* Vakman header */}
              <div className="flex items-center gap-3 mb-4">
                <img src={o.vakmanAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{o.vakmanNaam}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                    {o.nummer} · Geldig tot {o.geldigTot}
                  </p>
                </div>
                <p className="font-black text-2xl flex-shrink-0" style={{ color: "var(--teal)" }}>
                  €{fmt(o.totaal)}
                </p>
              </div>

              {/* Regeloverzicht */}
              <div className="flex flex-col gap-1.5 mb-4 p-3 rounded-2xl"
                style={{ background: "var(--surface-2)" }}>
                {o.regels.map(r => (
                  <div key={r.id} className="flex justify-between text-xs">
                    <span className="truncate pr-2" style={{ color: "var(--muted)" }}>{r.omschrijving}</span>
                    <span className="font-semibold flex-shrink-0">€{fmt(r.aantal * r.prijsPerEenheid)}</span>
                  </div>
                ))}
                {o.totaalBtw > 0 && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
                    <span className="font-semibold">€{fmt(o.totaalBtw)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 border-t"
                  style={{ borderColor: "var(--border)" }}>
                  <span>Totaal</span>
                  <span style={{ color: "var(--teal)" }}>€{fmt(o.totaal)}</span>
                </div>
              </div>

              {o.notities ? (
                <p className="text-xs italic mb-4 px-1" style={{ color: "var(--muted)" }}>
                  &ldquo;{o.notities}&rdquo;
                </p>
              ) : null}

              {/* Actieknoppen */}
              <div className="flex gap-2">
                <button
                  onClick={() => weigerOfferte(o.id)}
                  className="touch-scale w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <X size={16} />
                </button>
                <Link href={`/chat/${o.vakmanChatId}`}
                  className="touch-scale flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 border"
                  style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
                  <MessageCircle size={14} /> Vraag stellen
                </Link>
                <button
                  onClick={() => handleOpenSheet(o.id)}
                  className="touch-scale flex-1 h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                  style={{ background: "var(--teal)" }}>
                  Betaal nu <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* ── Leeg: alles betaald ── */}
        {openstaand.length === 0 && betaaldIds.length > 0 && (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#dcfce7" }}>
              <CheckCircle2 size={38} style={{ color: "#16a34a" }} />
            </div>
            <h2 className="font-black text-lg">Alles betaald! 🎉</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              De vakman is op de hoogte en kan aan de slag.
            </p>
            <Link href="/mijn-opdrachten"
              className="touch-scale mt-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              Terug naar opdrachten
            </Link>
          </div>
        )}

        {/* ── Leeg: geen openstaande betalingen ── */}
        {openstaand.length === 0 && betaaldIds.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="text-5xl">✅</span>
            <p className="font-bold text-base">Geen openstaande betalingen</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Ontvang een offerte van een vakman om hier te betalen.
            </p>
            <Link href="/mijn-opdrachten"
              className="touch-scale mt-2 px-5 py-2.5 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              Naar mijn opdrachten
            </Link>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SHEET — betaalmethode selectie
      ══════════════════════════════════════════════════════════════════════ */}
      {betalende && betaalFase === "selectie" && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={handleAnnuleer}>
          <div
            className="w-full rounded-t-3xl animate-slide-up overflow-y-auto"
            style={{
              background: "var(--background)",
              maxHeight: "calc(100dvh - var(--bottom-nav-height) - 52px)",
              paddingBottom: "calc(var(--bottom-nav-height) + 20px)",
            }}
            onClick={e => e.stopPropagation()}>

            <div className="px-6 pt-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-5"
                style={{ background: "var(--border)" }} />

              <h2 className="font-black text-xl mb-0.5">Betaling bevestigen</h2>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                {betalende.nummer} · {betalende.vakmanNaam}
              </p>

              {/* Bedrag overzicht */}
              <div className="card p-4 mb-5">
                {betalende.regels.map(r => (
                  <div key={r.id} className="flex justify-between text-sm mb-1">
                    <span className="truncate pr-2" style={{ color: "var(--muted)" }}>{r.omschrijving}</span>
                    <span className="flex-shrink-0">€{fmt(r.aantal * r.prijsPerEenheid)}</span>
                  </div>
                ))}
                {betalende.totaalBtw > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
                    <span>€{fmt(betalende.totaalBtw)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-lg pt-3 mt-1 border-t"
                  style={{ borderColor: "var(--border)", color: "var(--teal)" }}>
                  <span>Te betalen</span>
                  <span>€{fmt(betalende.totaal)}</span>
                </div>
              </div>

              {/* Betaalmethode keuze */}
              <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>
                Betaalmethode
              </p>

              {heeftOpgeslaanMethoden ? (
                /* ── Opgeslagen methoden ── */
                <div className="flex flex-col gap-2 mb-5">
                  {betaalmethoden.map((m, i) => (
                    <button key={m.id} onClick={() => setGekozenIdx(i)}
                      className="touch-scale flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all"
                      style={{
                        borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)",
                        background:  gekozenIdx === i ? "var(--teal)" + "12" : "var(--surface)",
                      }}>
                      <span className="text-xl flex-shrink-0">{m.icoon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{m.label}</p>
                        {m.kaarthouder && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{m.kaarthouder}</p>
                        )}
                        {m.bankNaam && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{m.bankNaam}</p>
                        )}
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)" }}>
                        {gekozenIdx === i && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* ── Standaard opties ── */
                <div className="flex flex-col gap-2 mb-5">
                  {DEFAULT_METHODES.map((m, i) => (
                    <button key={m.naam} onClick={() => setGekozenIdx(i)}
                      className="touch-scale flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all"
                      style={{
                        borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)",
                        background:  gekozenIdx === i ? "var(--teal)" + "12" : "var(--surface)",
                      }}>
                      <span className="text-xl flex-shrink-0">{m.icoon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{m.naam}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{m.sub}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)" }}>
                        {gekozenIdx === i && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleBevestig}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "var(--teal)" }}>
                <CreditCard size={18} />
                Bevestig betaling · €{fmt(betalende.totaal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BANK REDIRECT — loading screen
      ══════════════════════════════════════════════════════════════════════ */}
      {betalende && betaalFase === "loading" && redirectBank && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: redirectBank.bg }}>
          <p className="text-white font-black text-3xl tracking-tight">{redirectBank.naam}</p>
          <Loader2 size={36} color="rgba(255,255,255,0.85)" className="animate-spin" />
          <p className="text-white/75 text-sm font-medium">
            Doorsturen naar {redirectBank.naam}…
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BANK AUTH — bank-branded authorisation screen
      ══════════════════════════════════════════════════════════════════════ */}
      {betalende && betaalFase === "bank_auth" && redirectBank && (
        <div className="fixed inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--background)" }}>

          {/* Bank header */}
          <div className="px-5 pt-12 pb-6 flex items-center gap-3"
            style={{ background: redirectBank.bg }}>
            <button onClick={handleAnnuleer}
              className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ArrowLeft size={18} color="white" />
            </button>
            <div>
              <p className="text-white font-black text-xl leading-tight">{redirectBank.naam}</p>
              <p className="text-white/70 text-xs">Internetbankieren · Beveiligde verbinding</p>
            </div>
            <Lock size={16} color="rgba(255,255,255,0.7)" className="ml-auto flex-shrink-0" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">

            <p className="font-black text-lg mb-1">Betaalopdracht bevestigen</p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Controleer de gegevens hieronder en autoriseer de betaling.
            </p>

            {/* Payment detail card */}
            <div className="card p-4 mb-4">
              <div className="flex justify-between items-center py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Begunstigde</span>
                <span className="font-bold text-sm">Servr B.V.</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>IBAN</span>
                <span className="font-semibold text-sm font-mono">NL18 SERV •••• 0001</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Omschrijving</span>
                <span className="font-semibold text-sm">{betalende.nummer}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>Opdrachtnemer</span>
                <span className="font-semibold text-sm">{betalende.vakmanNaam}</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="font-black text-base">Bedrag</span>
                <span className="font-black text-2xl" style={{ color: redirectBank.bg }}>
                  €{fmt(betalende.totaal)}
                </span>
              </div>
            </div>

            {/* Security notice */}
            <div className="rounded-2xl p-3 flex items-start gap-2.5 mb-4"
              style={{ background: redirectBank.bg + "12" }}>
              <Lock size={14} style={{ color: redirectBank.bg, flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: redirectBank.bg }}>
                <strong>Beveiligd door {redirectBank.naam}.</strong> Servr ontvangt uw betaling via een beveiligde verbinding. Uw bankgegevens worden nooit gedeeld.
              </p>
            </div>

            {/* Escrow notice */}
            <div className="rounded-2xl p-3 flex items-start gap-2.5"
              style={{ background: "var(--teal)" + "10" }}>
              <Shield size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--teal)" }}>
                <strong>Servr Escrow.</strong> Uw betaling wordt vastgehouden totdat u het werk heeft goedgekeurd. U betaalt nooit voor niet-geleverd werk.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-10 pt-4 flex flex-col gap-3"
            style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleBankAutoriseer}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: redirectBank.bg }}>
              <Lock size={18} />
              Betaling autoriseren · €{fmt(betalende.totaal)}
            </button>
            <button
              onClick={handleAnnuleer}
              className="touch-scale w-full py-3.5 rounded-2xl font-semibold text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
