"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, ChevronRight, MessageCircle,
  Shield, X, Loader2, Lock, Star, Phone, FileText,
  CalendarDays, User, Building2, CheckCircle, Clock,
} from "lucide-react";
import { useOfferteStore, type VerstuurdeOfferte } from "@/lib/offerteStore";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";
import { useNotificatieStore } from "@/lib/notificatieStore";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let stripeCache: Awaited<ReturnType<typeof loadStripe>> | null = null;

// ─── Offerte preview (volledige opmaak) ───────────────────────────────────────

function OffertePreview({
  offerte,
  onBetaal,
  onWeiger,
  onSluit,
}: {
  offerte: VerstuurdeOfferte;
  onBetaal: () => void;
  onWeiger: () => void;
  onSluit: () => void;
}) {
  const serviceFee = Math.round(offerte.totaal * 0.05 * 100) / 100;
  const klantTotaal = Math.round((offerte.totaal + serviceFee) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "var(--background)" }}>

      {/* Sticky header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={onSluit}
          className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--surface-2)" }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-lg">Offerte bekijken</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{offerte.nummer}</p>
        </div>
        <Link href={`/chat/${offerte.vakmanChatId}`}
          className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border"
          style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
          <MessageCircle size={13} /> Chat
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-4">

        {/* Offerte document */}
        <div className="mx-5 mt-5 rounded-3xl overflow-hidden border"
          style={{ borderColor: "var(--border)" }}>

          {/* ── Document header ── */}
          <div className="px-6 py-6"
            style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <FileText size={16} color="white" />
                  </div>
                  <span className="text-white font-black text-xl tracking-wide">OFFERTE</span>
                </div>
                <p className="text-white/60 text-xs">{offerte.nummer}</p>
              </div>
              {/* Servr logo badge */}
              <div className="px-3 py-1.5 rounded-xl bg-white/20">
                <p className="text-white font-black text-sm">✦ Servr</p>
              </div>
            </div>

            {/* Datum rij */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Datum", value: offerte.datum },
                { label: "Geldig tot", value: offerte.geldigTot },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 bg-white/10">
                  <p className="text-white/60 text-[10px] uppercase font-bold mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Van / Aan ── */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: "var(--border)" }}>

            {/* Van (vakman) */}
            <div className="px-4 py-4 border-r" style={{ borderColor: "var(--border)" }}>
              <p className="text-[10px] font-black uppercase mb-2" style={{ color: "var(--muted)" }}>Van</p>
              <div className="flex items-center gap-2 mb-2">
                <img src={offerte.vakmanAvatar} className="w-9 h-9 rounded-xl object-cover" alt="" />
                <div className="min-w-0">
                  <p className="font-black text-xs leading-tight truncate">{offerte.vakmanNaam.split(" ")[0]}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>
                    {offerte.vakmanNaam.split(" ").slice(1).join(" ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold">4.9</span>
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>(127)</span>
              </div>
            </div>

            {/* Aan (klant) */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-black uppercase mb-2" style={{ color: "var(--muted)" }}>Aan</p>
              <div className="flex items-center gap-2 mb-2">
                <img src={offerte.klantAvatar} className="w-9 h-9 rounded-xl object-cover" alt="" />
                <div className="min-w-0">
                  <p className="font-black text-xs leading-tight truncate">{offerte.klantNaam}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>Klant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>Verified klant</span>
              </div>
            </div>
          </div>

          {/* ── Regels / prijsopbouw ── */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-[10px] font-black uppercase mb-3" style={{ color: "var(--muted)" }}>
              Werkzaamheden
            </p>

            {/* Header */}
            <div className="grid grid-cols-12 gap-1 mb-2 pb-1.5 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="col-span-6 text-[10px] font-bold uppercase" style={{ color: "var(--muted)" }}>Omschrijving</p>
              <p className="col-span-2 text-[10px] font-bold uppercase text-center" style={{ color: "var(--muted)" }}>Aantal</p>
              <p className="col-span-2 text-[10px] font-bold uppercase text-right" style={{ color: "var(--muted)" }}>P/stuk</p>
              <p className="col-span-2 text-[10px] font-bold uppercase text-right" style={{ color: "var(--muted)" }}>Totaal</p>
            </div>

            {/* Regels */}
            {offerte.regels.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-1 py-2 border-b last:border-0"
                style={{ borderColor: "var(--border)" + "60" }}>
                <div className="col-span-6">
                  <p className="text-xs font-semibold leading-tight">{r.omschrijving}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{r.eenheid}</p>
                </div>
                <p className="col-span-2 text-xs text-center self-center">{r.aantal}</p>
                <p className="col-span-2 text-xs text-right self-center">€{fmt(r.prijsPerEenheid)}</p>
                <p className="col-span-2 text-xs font-bold text-right self-center">
                  €{fmt(r.aantal * r.prijsPerEenheid)}
                </p>
              </div>
            ))}
          </div>

          {/* ── Totalen ── */}
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-col gap-1.5">
              {offerte.subtotaal !== offerte.totaal && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted)" }}>Subtotaal</span>
                  <span>€{fmt(offerte.subtotaal)}</span>
                </div>
              )}
              {offerte.totaalBtw > 0 && (
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
                  <span>€{fmt(offerte.totaalBtw)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t mt-0.5"
                style={{ borderColor: "var(--border)" }}>
                <span>Klus totaal (vakman tarief)</span>
                <span>€{fmt(offerte.totaal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--muted)" }}>+ Servr service fee (5%)</span>
                <span style={{ color: "var(--muted)" }}>€{fmt(serviceFee)}</span>
              </div>
            </div>

            {/* Groot totaal */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t"
              style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="font-black text-base">Jij betaalt</p>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>Incl. Servr service fee</p>
              </div>
              <p className="font-black text-3xl" style={{ color: "var(--teal)" }}>€{fmt(klantTotaal)}</p>
            </div>
          </div>

          {/* ── Notities ── */}
          {offerte.notities && (
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-[10px] font-black uppercase mb-2" style={{ color: "var(--muted)" }}>Notities</p>
              <p className="text-sm leading-relaxed italic" style={{ color: "var(--foreground)" }}>
                &ldquo;{offerte.notities}&rdquo;
              </p>
            </div>
          )}

          {/* ── Garantie / bescherming ── */}
          <div className="px-5 py-4">
            <div className="flex flex-col gap-2">
              {[
                { icon: "🔒", tekst: "Betaal pas nadat de klus klaar is en jij tevreden bent" },
                { icon: "🛡️", tekst: "Geld wordt pas vrijgegeven aan de vakman na jouw akkoord" },
                { icon: "⭐", tekst: "Na betaling kun je een review achterlaten" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{item.tekst}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Extra ruimte onderaan */}
        <div className="h-4" />
      </div>

      {/* ── Sticky footer met knoppen ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-8 flex flex-col gap-3"
        style={{ borderTop: "1px solid var(--border)", background: "var(--background)" }}>

        {/* Prijs samenvatting */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="font-bold text-sm">Te betalen</p>
            <p className="text-[11px]" style={{ color: "var(--muted)" }}>
              €{fmt(offerte.totaal)} klus + €{fmt(serviceFee)} fee
            </p>
          </div>
          <p className="font-black text-2xl" style={{ color: "var(--teal)" }}>
            €{fmt(klantTotaal)}
          </p>
        </div>

        {/* Knoppen */}
        <div className="flex gap-3">
          <button onClick={onWeiger}
            className="touch-scale w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <X size={18} />
          </button>
          <button onClick={onBetaal}
            className="touch-scale flex-1 py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{ background: "var(--teal)" }}>
            <Lock size={18} /> Betaal nu · €{fmt(klantTotaal)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stripe checkout form ─────────────────────────────────────────────────────

function StripeForm({
  onSuccess,
  onCancel,
  offerte,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  offerte: { totaal: number; chargeAmount: number; serviceFee: number; nummer: string; vakmanNaam: string };
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [bezig, setBezig] = useState(false);
  const [fout,  setFout]  = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBezig(true);
    setFout(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${appUrl}/te-betalen?betaald=1&offerte=${offerte.nummer}`,
      },
    });

    if (error) {
      setFout(error.message ?? "Betaling mislukt");
      setBezig(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ background: "var(--teal)" + "12" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-sm">{offerte.vakmanNaam}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{offerte.nummer}</p>
          </div>
          <p className="font-black text-2xl" style={{ color: "var(--teal)" }}>
            €{fmt(offerte.chargeAmount)}
          </p>
        </div>
        {offerte.serviceFee > 0 && (
          <>
            <div className="flex justify-between text-xs pt-1 border-t" style={{ borderColor: "var(--teal)" + "30" }}>
              <span style={{ color: "var(--muted)" }}>Klus</span>
              <span>€{fmt(offerte.totaal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--muted)" }}>Service fee (5%)</span>
              <span>€{fmt(offerte.serviceFee)}</span>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["apple_pay", "google_pay", "card", "bancontact", "ideal"],
          }}
        />
      </div>

      {fout && (
        <div className="p-3 rounded-xl text-sm flex items-center gap-2"
          style={{ background: "#fee2e2", color: "#dc2626" }}>
          <span>⚠️</span> {fout}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button type="submit" disabled={!stripe || bezig}
          className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: stripe && !bezig ? "var(--teal)" : "var(--muted)" }}>
          {bezig
            ? <><Loader2 size={18} className="animate-spin" /> Even wachten…</>
            : <><Lock size={18} /> Betaling bevestigen · €{fmt(offerte.chargeAmount)}</>}
        </button>
        <button type="button" onClick={onCancel}
          className="touch-scale w-full py-3 rounded-2xl font-semibold text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Terug naar offerte
        </button>
      </div>

      <p className="text-center text-xs flex items-center justify-center gap-1"
        style={{ color: "var(--muted)" }}>
        <Lock size={10} /> Beveiligd door Stripe · SSL versleuteld
      </p>
    </form>
  );
}

// ─── mock betaalflow ─────────────────────────────────────────────────────────

type BetaalFase = "selectie" | "loading" | "bank_auth";

type BankBrand = { bg: string; dark: string; naam: string };

const BANK_BRANDS: Record<string, BankBrand> = {
  "ING":                { bg: "#FF6200", dark: "#CC4E00", naam: "ING" },
  "ABN AMRO":           { bg: "#009FE3", dark: "#0077B0", naam: "ABN AMRO" },
  "Rabobank":           { bg: "#EC0000", dark: "#B80000", naam: "Rabobank" },
  "SNS Bank":           { bg: "#00589C", dark: "#003D70", naam: "SNS Bank" },
  "Triodos Bank":       { bg: "#00A650", dark: "#007D3C", naam: "Triodos Bank" },
  "Bunq":               { bg: "#00D7B0", dark: "#00A88A", naam: "bunq" },
  "Bancontact":         { bg: "#005298", dark: "#003D74", naam: "Bancontact" },
};

function getBankBrand(key: string): BankBrand {
  return BANK_BRANDS[key] ?? { bg: "#1a1a2e", dark: "#0d0f18", naam: key };
}

const DEFAULT_METHODES = [
  { naam: "iDEAL",      icoon: "🏦", sub: "Via jouw bank",     type: "ideal"      },
  { naam: "Creditcard", icoon: "💳", sub: "Visa / Mastercard", type: "creditcard" },
  { naam: "Bancontact", icoon: "🇧🇪", sub: "Belgische kaart",  type: "bancontact" },
];

// ─── hoofdpagina ──────────────────────────────────────────────────────────────

export default function TeBetalenPage() {
  const { offertes, betaalOfferte, weigerOfferte } = useOfferteStore();
  const { accountId: vakmanAccountId } = useStripeConnectStore();
  const { addNotificatie } = useNotificatieStore();

  // Welke offerte bekijken we? (preview)
  const [bekijkId, setBekijkId]             = useState<string | null>(null);
  // Welke offerte betalen we? (betaalsheet)
  const [betalendId, setBetalendId]         = useState<string | null>(null);
  const [betaaldIds, setBetaaldIds]         = useState<string[]>([]);
  const [clientSecret, setClientSecret]     = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [loadingSecret, setLoadingSecret]   = useState(false);
  const [stripeError, setStripeError]       = useState<string | null>(null);
  const [chargeAmount, setChargeAmount]     = useState<number | null>(null);
  const [serviceFee, setServiceFee]         = useState<number | null>(null);

  // Mock-fallback state
  const [gekozenIdx, setGekozenIdx]     = useState(0);
  const [betaalFase, setBetaalFase]     = useState<BetaalFase>("selectie");
  const [redirectBank, setRedirectBank] = useState<BankBrand | null>(null);

  const openstaand = offertes.filter(o => o.status === "openstaand");
  const bekijkende = openstaand.find(o => o.id === bekijkId);
  const betalende  = openstaand.find(o => o.id === betalendId);

  // URL-param ?betaald=1 afhandelen (Stripe return_url)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("betaald") === "1") {
      const num   = params.get("offerte");
      const match = offertes.find(o => o.nummer === num);
      if (match) {
        betaalOfferte(match.id);
        setBetaaldIds(v => [...v, match.id]);
      }
      window.history.replaceState({}, "", "/te-betalen");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stap 1: open offerte preview
  const handleBekijk = (id: string) => {
    setBekijkId(id);
  };

  // Stap 2: vanuit preview → open betaalsheet
  const handleOpenBetalen = async () => {
    if (!bekijkende) return;
    const id = bekijkende.id;
    setBekijkId(null);           // sluit preview
    setBetalendId(id);           // open betaalsheet
    setBetaalFase("selectie");
    setGekozenIdx(0);
    setRedirectBank(null);
    setClientSecret(null);
    setStripeError(null);
    setStripeInstance(null);
    setChargeAmount(null);
    setServiceFee(null);
    setLoadingSecret(true);

    const offerte = openstaand.find(o => o.id === id);
    if (!offerte) { setLoadingSecret(false); return; }

    try {
      const res = await fetch("/api/stripe/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: offerte.totaal,
          offerteNummer: offerte.nummer,
          stripeAccountId: vakmanAccountId ?? undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 503) { setLoadingSecret(false); return; }
      if (!data.clientSecret) {
        setStripeError(data.error ?? "Stripe kon geen betaling aanmaken");
        setLoadingSecret(false);
        return;
      }
      const pk = data.publishableKey;
      if (!pk) {
        setStripeError("Publishable key ontbreekt");
        setLoadingSecret(false);
        return;
      }
      if (!stripeCache) stripeCache = await loadStripe(pk);
      setStripeInstance(stripeCache);
      setClientSecret(data.clientSecret);
      if (data.chargeAmount) setChargeAmount(data.chargeAmount);
      if (data.serviceFee)   setServiceFee(data.serviceFee);
    } catch {
      setStripeError("Kan Stripe niet bereiken.");
    } finally {
      setLoadingSecret(false);
    }
  };

  const handleStripeSuccess = () => {
    if (!betalende) return;
    betaalOfferte(betalende.id);
    setBetaaldIds(v => [...v, betalende.id]);
    const tarief   = betalende.totaal;
    const klantB   = Math.round(tarief * 1.05 * 100) / 100;
    const ontvangt = Math.round(tarief * 0.92 * 100) / 100;
    addNotificatie({
      type: "betaling_ontvangen",
      titel: "✅ Betaling ontvangen!",
      bericht: `Klus betaald voor offerte ${betalende.nummer}. Je ontvangt €${ontvangt.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} (na 8% Servr fee). Bedrag staat binnen 2 werkdagen op je rekening.`,
      vakmanOntvangt: ontvangt,
      klantBetaald:  klantB,
      vakmanTarief:  tarief,
      offerte:       betalende.nummer,
    });
    setBetalendId(null);
    setClientSecret(null);
  };

  const handleMockBevestig = () => {
    if (!betalende) return;
    const methode = DEFAULT_METHODES[gekozenIdx];
    if (methode.type === "ideal" || methode.type === "bancontact") {
      const brand = getBankBrand(methode.type === "bancontact" ? "Bancontact" : "ING");
      setRedirectBank(brand);
      setBetaalFase("loading");
      setTimeout(() => setBetaalFase("bank_auth"), 1600);
    } else {
      _voltooi(betalende);
      setBetalendId(null);
    }
  };

  const handleMockBankAutoriseer = () => {
    if (!betalende) return;
    _voltooi(betalende);
    setBetalendId(null);
    setBetaalFase("selectie");
    setRedirectBank(null);
  };

  const _voltooi = (o: typeof betalende) => {
    if (!o) return;
    betaalOfferte(o.id);
    setBetaaldIds(v => [...v, o.id]);
    const tarief   = o.totaal;
    const klantB   = Math.round(tarief * 1.05 * 100) / 100;
    const ontvangt = Math.round(tarief * 0.92 * 100) / 100;
    addNotificatie({
      type: "betaling_ontvangen",
      titel: "✅ Betaling ontvangen!",
      bericht: `Klus betaald voor offerte ${o.nummer}. Je ontvangt €${ontvangt.toLocaleString("nl-NL", { minimumFractionDigits: 2 })} (na 8% Servr fee). Bedrag staat binnen 2 werkdagen op je rekening.`,
      vakmanOntvangt: ontvangt,
      klantBetaald:  klantB,
      vakmanTarief:  tarief,
      offerte:       o.nummer,
    });
  };

  const handleAnnuleer = () => {
    setBetalendId(null);
    setClientSecret(null);
    setBetaalFase("selectie");
    setRedirectBank(null);
  };

  const handleWeigerVanPreview = () => {
    if (!bekijkende) return;
    weigerOfferte(bekijkende.id);
    setBekijkId(null);
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
              Bekijk de offerte, controleer alles en betaal pas als de klus klaar is.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* Net betaalde feedback */}
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

        {/* Openstaande offertes — compacte kaartjes */}
        {openstaand.map(o => (
          <div key={o.id} className="card overflow-hidden">
            {/* Vakman info */}
            <div className="p-4 pb-3">
              <div className="flex items-center gap-3 mb-3">
                <img src={o.vakmanAvatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{o.vakmanNaam}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {o.nummer} · Geldig tot {o.geldigTot}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">4.9</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl" style={{ color: "var(--teal)" }}>
                    €{fmt(o.totaal)}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                    +€{fmt(Math.round(o.totaal * 0.05 * 100) / 100)} fee
                  </p>
                </div>
              </div>

              {/* Korte preview van regels */}
              <div className="rounded-xl p-3 mb-3" style={{ background: "var(--surface-2)" }}>
                {o.regels.slice(0, 2).map(r => (
                  <div key={r.id} className="flex justify-between text-xs py-0.5">
                    <span className="truncate pr-2" style={{ color: "var(--muted)" }}>{r.omschrijving}</span>
                    <span className="font-semibold flex-shrink-0">€{fmt(r.aantal * r.prijsPerEenheid)}</span>
                  </div>
                ))}
                {o.regels.length > 2 && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    +{o.regels.length - 2} meer...
                  </p>
                )}
              </div>

              {/* Knoppen */}
              <div className="flex gap-2">
                <button onClick={() => weigerOfferte(o.id)}
                  className="touch-scale w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  <X size={16} />
                </button>
                <Link href={`/chat/${o.vakmanChatId}`}
                  className="touch-scale flex-1 h-10 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 border"
                  style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
                  <MessageCircle size={14} /> Vraag stellen
                </Link>
                <button onClick={() => handleBekijk(o.id)}
                  className="touch-scale flex-1 h-10 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1"
                  style={{ background: "var(--teal)" }}>
                  Bekijk offerte <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Lege states */}
        {openstaand.length === 0 && betaaldIds.length > 0 && (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#dcfce7" }}>
              <CheckCircle2 size={38} style={{ color: "#16a34a" }} />
            </div>
            <h2 className="font-black text-lg">Alles betaald! 🎉</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>De vakman is op de hoogte en kan aan de slag.</p>
            <Link href="/mijn-opdrachten"
              className="touch-scale mt-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--teal)" }}>
              Terug naar opdrachten
            </Link>
          </div>
        )}

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

      {/* ══ OFFERTE PREVIEW (full screen) ══ */}
      {bekijkende && (
        <OffertePreview
          offerte={bekijkende}
          onBetaal={handleOpenBetalen}
          onWeiger={handleWeigerVanPreview}
          onSluit={() => setBekijkId(null)}
        />
      )}

      {/* ══ BETAALSHEET ══ */}
      {betalende && betaalFase === "selectie" && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={handleAnnuleer}>
          <div className="w-full rounded-t-3xl animate-slide-up overflow-y-auto"
            style={{
              background: "var(--background)",
              maxHeight: "calc(100dvh - var(--bottom-nav-height) - 52px)",
              paddingBottom: "calc(var(--bottom-nav-height) + 20px)",
            }}
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5">
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--border)" }} />
              <h2 className="font-black text-xl mb-0.5">Betaling</h2>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                {betalende.nummer} · {betalende.vakmanNaam}
              </p>

              {(stripeInstance || loadingSecret || stripeError) ? (
                loadingSecret ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--teal)" }} />
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Betaalmethoden laden…</p>
                  </div>
                ) : stripeError ? (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-2xl text-sm" style={{ background: "#fee2e2", color: "#dc2626" }}>
                      <p className="font-bold mb-1">⚠️ Stripe fout</p>
                      <p className="text-xs">{stripeError}</p>
                    </div>
                    <MockBetaalForm
                      betalende={betalende}
                      gekozenIdx={gekozenIdx}
                      setGekozenIdx={setGekozenIdx}
                      onBevestig={handleMockBevestig}
                    />
                  </div>
                ) : clientSecret ? (
                  <Elements
                    stripe={stripeInstance}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: { colorPrimary: "#0F6E56", borderRadius: "16px" },
                      },
                    }}>
                    <StripeForm
                      offerte={{
                        ...betalende,
                        chargeAmount: chargeAmount ?? betalende.totaal,
                        serviceFee: serviceFee ?? 0,
                      }}
                      onSuccess={handleStripeSuccess}
                      onCancel={handleAnnuleer}
                    />
                  </Elements>
                ) : (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--teal)" }} />
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Verbinden met Stripe…</p>
                  </div>
                )
              ) : (
                <MockBetaalForm
                  betalende={betalende}
                  gekozenIdx={gekozenIdx}
                  setGekozenIdx={setGekozenIdx}
                  onBevestig={handleMockBevestig}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mock bank loading */}
      {betalende && betaalFase === "loading" && redirectBank && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: redirectBank.bg }}>
          <p className="text-white font-black text-3xl">{redirectBank.naam}</p>
          <Loader2 size={36} color="rgba(255,255,255,0.85)" className="animate-spin" />
          <p className="text-white/75 text-sm font-medium">Doorsturen naar {redirectBank.naam}…</p>
        </div>
      )}

      {/* Mock bank auth */}
      {betalende && betaalFase === "bank_auth" && redirectBank && (
        <div className="fixed inset-0 z-50 flex flex-col animate-fade-in"
          style={{ background: "var(--background)" }}>
          <div className="px-5 pt-12 pb-6 flex items-center gap-3"
            style={{ background: redirectBank.bg }}>
            <button onClick={handleAnnuleer}
              className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <ArrowLeft size={18} color="white" />
            </button>
            <div className="flex-1">
              <p className="text-white font-black text-xl">{redirectBank.naam}</p>
              <p className="text-white/70 text-xs">Internetbankieren · Beveiligde verbinding</p>
            </div>
            <Lock size={16} color="rgba(255,255,255,0.7)" />
          </div>
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
            <p className="font-black text-lg mb-1">Betaalopdracht bevestigen</p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              Controleer de gegevens en autoriseer.
            </p>
            <div className="card p-4 mb-4">
              {[
                ["Begunstigde", "Servr B.V."],
                ["IBAN", "NL18 SERV •••• 0001"],
                ["Omschrijving", betalende.nummer],
                ["Vakman", betalende.vakmanNaam],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{k}</span>
                  <span className="font-semibold text-sm">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-1">
                <span className="font-black">Bedrag</span>
                <span className="font-black text-2xl" style={{ color: redirectBank.bg }}>
                  €{fmt(betalende.totaal)}
                </span>
              </div>
            </div>
            <div className="rounded-2xl p-3 flex items-start gap-2.5 mb-4"
              style={{ background: redirectBank.bg + "12" }}>
              <Lock size={14} style={{ color: redirectBank.bg, marginTop: 2 }} />
              <p className="text-xs" style={{ color: redirectBank.bg }}>
                <strong>Beveiligd door {redirectBank.naam}.</strong> Uw bankgegevens worden nooit gedeeld.
              </p>
            </div>
          </div>
          <div className="px-5 pb-10 pt-4 flex flex-col gap-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button onClick={handleMockBankAutoriseer}
              className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: redirectBank.bg }}>
              <Lock size={18} /> Betaling autoriseren · €{fmt(betalende.totaal)}
            </button>
            <button onClick={handleAnnuleer}
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

// ─── Mock betaalform component ────────────────────────────────────────────────

function MockBetaalForm({
  betalende,
  gekozenIdx,
  setGekozenIdx,
  onBevestig,
}: {
  betalende: VerstuurdeOfferte;
  gekozenIdx: number;
  setGekozenIdx: (i: number) => void;
  onBevestig: () => void;
}) {
  return (
    <>
      <div className="card p-4 mb-5">
        {betalende.regels.map(r => (
          <div key={r.id} className="flex justify-between text-sm mb-1">
            <span className="truncate pr-2" style={{ color: "var(--muted)" }}>{r.omschrijving}</span>
            <span>€{fmt(r.aantal * r.prijsPerEenheid)}</span>
          </div>
        ))}
        {betalende.totaalBtw > 0 && (
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: "var(--muted)" }}>BTW (21%)</span>
            <span>€{fmt(betalende.totaalBtw)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs border-t pt-2 mt-1"
          style={{ borderColor: "var(--border)" }}>
          <span style={{ color: "var(--muted)" }}>Service fee (5%)</span>
          <span>€{fmt(Math.round(betalende.totaal * 0.05 * 100) / 100)}</span>
        </div>
        <div className="flex justify-between font-black text-lg pt-2 mt-1 border-t"
          style={{ borderColor: "var(--border)", color: "var(--teal)" }}>
          <span>Te betalen</span>
          <span>€{fmt(Math.round(betalende.totaal * 1.05 * 100) / 100)}</span>
        </div>
      </div>

      <p className="text-xs font-bold uppercase mb-3" style={{ color: "var(--muted)" }}>
        Betaalmethode
      </p>
      <div className="flex flex-col gap-2 mb-5">
        {DEFAULT_METHODES.map((m, i) => (
          <button key={m.naam} onClick={() => setGekozenIdx(i)}
            className="touch-scale flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left"
            style={{
              borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)",
              background:  gekozenIdx === i ? "var(--teal)" + "12" : "var(--surface)",
            }}>
            <span className="text-xl">{m.icoon}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{m.naam}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{m.sub}</p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: gekozenIdx === i ? "var(--teal)" : "var(--border)" }}>
              {gekozenIdx === i && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--teal)" }} />}
            </div>
          </button>
        ))}
      </div>
      <button onClick={onBevestig}
        className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: "var(--teal)" }}>
        <Lock size={18} /> Bevestig betaling · €{fmt(Math.round(betalende.totaal * 1.05 * 100) / 100)}
      </button>
    </>
  );
}
