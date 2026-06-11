"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, MessageCircle, Shield, Loader2, Lock, Star,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, formatEuro } from "@/lib/supabase";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const SERIF = "'Source Serif 4', Georgia, serif";

let stripeCache: Awaited<ReturnType<typeof loadStripe>> | null = null;

type BoekingRij = {
  id: string;
  klant_id: string;
  vakman_id: string;
  status: string;
  betaald: boolean;
  bedrag: number | null;
  notities: string | null;
  opdracht_id: string | null;
  stripe_intent: string | null;
  vakman: {
    name: string;
    vakmensen: { specialty: string | null; rating: number; review_count: number; stripe_account: string | null } | null;
  } | null;
  offerte: { omschrijving: string | null; eta: string | null; gesprek_id: string | null } | null;
  opdracht: { titel: string } | null;
};

function titelVan(b: BoekingRij) {
  return b.opdracht?.titel ?? b.notities ?? "Klus";
}

// ─── Stripe checkout form ─────────────────────────────────────
function StripeForm({ boeking, chargeAmount, serviceFee, onCancel }: {
  boeking: BoekingRij;
  chargeAmount: number;
  serviceFee: number;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBezig(true);
    setFout(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${appUrl}/te-betalen?betaald=1&boeking=${boeking.id}`,
      },
    });

    if (error) {
      setFout(error.message ?? "Betaling mislukt");
      setBezig(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#EAF0EC", borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{boeking.vakman?.name ?? "Vakman"}</p>
            <p style={{ fontSize: 12, color: "#8A8A83", margin: "1px 0 0" }}>{titelVan(boeking)}</p>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: 26, margin: 0, color: "#2B4030" }}>{formatEuro(chargeAmount)}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: 8, marginTop: 8, borderTop: "0.5px solid rgba(43,64,48,0.2)" }}>
          <span style={{ color: "#8A8A83" }}>Klus {formatEuro(boeking.bedrag ?? 0)} + service fee {formatEuro(serviceFee)}</span>
        </div>
      </div>

      <div style={{ borderRadius: 14, overflow: "hidden", border: "0.5px solid #E5DDD0", background: "#FFFFFF", padding: 4 }}>
        <PaymentElement options={{ layout: "tabs", paymentMethodOrder: ["bancontact", "card", "ideal"] }} />
      </div>

      {fout && (
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#F9EDEA", color: "#dc2626", fontSize: 13 }}>
          ⚠️ {fout}
        </div>
      )}

      <button type="submit" disabled={!stripe || bezig} className="touch-scale" style={{
        width: "100%", padding: "16px 0", borderRadius: 12, border: "none", cursor: "pointer",
        background: stripe && !bezig ? "#2B4030" : "#8A8A83", color: "#F5EFE5",
        fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        {bezig ? <><Loader2 size={17} className="animate-spin" /> Even wachten…</> : <><Lock size={16} /> Betaal {formatEuro(chargeAmount)}</>}
      </button>
      <button type="button" onClick={onCancel} className="touch-scale" style={{
        width: "100%", padding: "12px 0", borderRadius: 12, border: "0.5px solid #E5DDD0",
        background: "transparent", color: "#8A8A83", fontSize: 13, fontWeight: 500, cursor: "pointer",
      }}>
        Annuleren
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: "#8A8A83", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, margin: 0 }}>
        <Lock size={10} /> Beveiligd door Stripe · escrow tot jij bevestigt
      </p>
    </form>
  );
}

// ─── Hoofdpagina ──────────────────────────────────────────────
export default function TeBetalenPage() {
  const { userId } = useUserStore();
  const [boekingen, setBoekingen] = useState<BoekingRij[]>([]);
  const [loading, setLoading] = useState(true);

  // Betaalsheet
  const [betalendId, setBetalendId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeNietActief, setStripeNietActief] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number | null>(null);
  const [serviceFee, setServiceFee] = useState<number | null>(null);

  // Verificatie na redirect
  const [verifieren, setVerifieren] = useState(false);
  const [netBetaald, setNetBetaald] = useState<string | null>(null);     // boeking-id
  const [betaalFout, setBetaalFout] = useState<string | null>(null);

  const laad = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id ?? null;
    }
    if (!uid) { setLoading(false); return; }

    const { data } = await supabase
      .from("boekingen")
      .select(`*,
        vakman:profiles!boekingen_vakman_id_fkey(name, vakmensen(specialty, rating, review_count, stripe_account)),
        offerte:offertes(omschrijving, eta, gesprek_id),
        opdracht:opdrachten(titel)`)
      .eq("klant_id", uid)
      .eq("betaald", false)
      .eq("status", "gepland")
      .order("created_at", { ascending: false });
    setBoekingen((data as unknown as BoekingRij[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { laad(); }, [laad]);

  // URL-params: ?boeking={id} opent betaalsheet · ?betaald=1 verifieert
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const boekingParam = params.get("boeking");
    const isReturn = params.get("betaald") === "1";
    const intentParam = params.get("payment_intent");

    if (isReturn && boekingParam) {
      setVerifieren(true);
      fetch("/api/stripe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boekingId: boekingParam, paymentIntentId: intentParam }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.status === "betaald") setNetBetaald(boekingParam);
          else setBetaalFout(d.error ?? `Betaling niet voltooid (status: ${d.status ?? "onbekend"}). Probeer opnieuw.`);
        })
        .catch(() => setBetaalFout("Kon de betaling niet verifiëren. Herlaad de pagina."))
        .finally(() => { setVerifieren(false); laad(); });
      window.history.replaceState({}, "", "/te-betalen");
    } else if (boekingParam) {
      setBetalendId(boekingParam);
      window.history.replaceState({}, "", "/te-betalen");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Betaalsheet openen → intent aanmaken
  const betalende = boekingen.find(b => b.id === betalendId) ?? null;
  useEffect(() => {
    if (!betalende || clientSecret || loadingSecret) return;
    (async () => {
      setLoadingSecret(true);
      setStripeError(null);
      setStripeNietActief(false);
      try {
        const stripeAccount = betalende.vakman?.vakmensen?.stripe_account ?? null;
        const res = await fetch("/api/stripe/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: betalende.bedrag ?? 0,
            offerteNummer: `BOEK-${betalende.id.slice(0, 8).toUpperCase()}`,
            stripeAccountId: stripeAccount ?? undefined,
            boekingId: betalende.id,
          }),
        });
        const data = await res.json();
        if (res.status === 503) { setStripeNietActief(true); return; }
        if (!data.clientSecret || !data.publishableKey) {
          setStripeError(data.error ?? "Stripe kon geen betaling aanmaken");
          return;
        }
        if (!stripeCache) stripeCache = await loadStripe(data.publishableKey);
        setStripeInstance(stripeCache);
        setClientSecret(data.clientSecret);
        setChargeAmount(data.chargeAmount ?? null);
        setServiceFee(data.serviceFee ?? null);
      } catch {
        setStripeError("Kan Stripe niet bereiken.");
      } finally {
        setLoadingSecret(false);
      }
    })();
  }, [betalende, clientSecret, loadingSecret]);

  const sluitSheet = () => {
    setBetalendId(null);
    setClientSecret(null);
    setStripeError(null);
    setStripeNietActief(false);
    setChargeAmount(null);
    setServiceFee(null);
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: "100dvh", background: "#F5EFE5", paddingBottom: 32 }}>

      {/* Header */}
      <div className="px-5 pt-12 pb-5" style={{ background: "linear-gradient(160deg, #2B4030 0%, #1A2D22 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Link href="/mijn-opdrachten" className="touch-scale" style={{
            width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
          }}>
            <ArrowLeft size={17} color="white" />
          </Link>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: "#F5EFE5", margin: 0, flex: 1 }}>Te betalen</h1>
          {boekingen.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 99, background: "#C97A4D", color: "#1A1D1A" }}>
              {boekingen.length} openstaand
            </span>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={15} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, margin: 0 }}>
            Je geld staat veilig in escrow en gaat pas naar de vakman nadat jij de klus bevestigt.
          </p>
        </div>
      </div>

      <div className="px-5 pt-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Verificatie na redirect */}
        {verifieren && (
          <div style={{ background: "#FBF7F0", borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "#2B4030" }} />
            <p style={{ fontSize: 14, color: "#1A1D1A", margin: 0 }}>Betaling verifiëren bij Stripe…</p>
          </div>
        )}

        {netBetaald && (
          <div className="animate-bounce-in" style={{ background: "#EAF0EC", borderRadius: 14, padding: 20, textAlign: "center" }}>
            <CheckCircle2 size={36} style={{ color: "#2B4030", margin: "0 auto 10px" }} />
            <p style={{ fontFamily: SERIF, fontSize: 19, color: "#1A1D1A", margin: "0 0 6px" }}>Betaling gelukt!</p>
            <p style={{ fontSize: 13, color: "#5C5C56", margin: "0 0 14px" }}>
              De vakman is op de hoogte. Je geld staat veilig tot jij de afronding bevestigt.
            </p>
            <Link href="/mijn-opdrachten" className="touch-scale" style={{
              display: "inline-block", padding: "12px 24px", background: "#2B4030", color: "#F5EFE5",
              borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}>
              Naar mijn opdrachten
            </Link>
          </div>
        )}

        {betaalFout && (
          <div style={{ background: "#F9EDEA", borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", margin: "0 0 4px" }}>Betaling niet gelukt</p>
            <p style={{ fontSize: 12, color: "#5C5C56", margin: 0 }}>{betaalFout}</p>
          </div>
        )}

        {/* Skeleton */}
        {loading && <><div className="skeleton" style={{ height: 110 }} /><div className="skeleton" style={{ height: 110 }} /></>}

        {/* Openstaande boekingen */}
        {!loading && boekingen.map(b => {
          const vm = b.vakman?.vakmensen;
          const fee = Math.round((b.bedrag ?? 0) * 0.05 * 100) / 100;
          return (
            <div key={b.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 17, color: "#F5EFE5", flexShrink: 0 }}>
                  {(b.vakman?.name ?? "V").charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{b.vakman?.name ?? "Vakman"}</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                    {titelVan(b)}
                    {(vm?.review_count ?? 0) > 0 && (
                      <><Star size={10} style={{ color: "#C97A4D", fill: "#C97A4D" }} /> {vm?.rating}</>
                    )}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: SERIF, fontSize: 22, margin: 0, color: "#2B4030" }}>{formatEuro(b.bedrag ?? 0)}</p>
                  <p style={{ fontSize: 10, color: "#8A8A83", margin: 0 }}>+{formatEuro(fee)} fee</p>
                </div>
              </div>

              {b.offerte?.omschrijving && (
                <p style={{ fontSize: 12, color: "#5C5C56", margin: "0 0 12px", background: "#EDE4D2", borderRadius: 8, padding: "8px 12px" }}>
                  {b.offerte.omschrijving}
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                {b.offerte?.gesprek_id && (
                  <Link href={`/chat/${b.offerte.gesprek_id}`} className="touch-scale" style={{
                    flex: 1, height: 44, borderRadius: 10, border: "0.5px solid #2B4030", color: "#2B4030",
                    fontSize: 13, fontWeight: 500, textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <MessageCircle size={14} /> Vraag stellen
                  </Link>
                )}
                <button onClick={() => setBetalendId(b.id)} className="touch-scale" style={{
                  flex: 1.4, height: 44, borderRadius: 10, background: "#2B4030", color: "#F5EFE5",
                  border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <Lock size={13} /> Betaal {formatEuro((b.bedrag ?? 0) + fee)}
                </button>
              </div>
            </div>
          );
        })}

        {/* Lege state */}
        {!loading && boekingen.length === 0 && !netBetaald && !verifieren && (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>✅</p>
            <p style={{ fontFamily: SERIF, fontSize: 18, color: "#1A1D1A", margin: "0 0 6px" }}>Geen openstaande betalingen</p>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 20px" }}>
              Accepteer een offerte om hier te betalen.
            </p>
            <Link href="/mijn-opdrachten" className="touch-scale" style={{
              display: "inline-block", padding: "12px 24px", background: "#2B4030", color: "#F5EFE5",
              borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
            }}>
              Naar mijn opdrachten
            </Link>
          </div>
        )}
      </div>

      {/* ══ BETAALSHEET ══ */}
      {betalende && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }}
          onClick={sluitSheet}>
          <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={{
            width: "100%", maxHeight: "88dvh", overflowY: "auto",
            background: "#F5EFE5", borderRadius: "24px 24px 0 0", padding: "20px 24px 40px",
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: "#E5DDD0", margin: "0 auto 20px" }} />
            <h2 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 400, margin: "0 0 2px", color: "#1A1D1A" }}>Betaling</h2>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 20px" }}>{titelVan(betalende)} · {betalende.vakman?.name}</p>

            {loadingSecret ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#2B4030" }} />
                <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>Betaalmethoden laden…</p>
              </div>
            ) : stripeNietActief ? (
              <div style={{ background: "#FAF0E6", borderRadius: 14, padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 26, margin: "0 0 8px" }}>🚧</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1A1D1A", margin: "0 0 6px" }}>Online betalen is nog niet actief</p>
                <p style={{ fontSize: 13, color: "#5C5C56", margin: 0 }}>
                  De beheerder moet de Stripe-sleutels nog instellen. Probeer het later opnieuw.
                </p>
              </div>
            ) : stripeError ? (
              <div style={{ background: "#F9EDEA", borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", margin: "0 0 4px" }}>⚠️ Stripe fout</p>
                <p style={{ fontSize: 12, color: "#5C5C56", margin: 0 }}>{stripeError}</p>
              </div>
            ) : clientSecret && stripeInstance ? (
              <Elements
                stripe={stripeInstance}
                options={{
                  clientSecret,
                  appearance: { theme: "stripe", variables: { colorPrimary: "#2B4030", borderRadius: "12px" } },
                }}>
                <StripeForm
                  boeking={betalende}
                  chargeAmount={chargeAmount ?? (betalende.bedrag ?? 0) * 1.05}
                  serviceFee={serviceFee ?? Math.round((betalende.bedrag ?? 0) * 0.05 * 100) / 100}
                  onCancel={sluitSheet}
                />
              </Elements>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                <Loader2 size={28} className="animate-spin" style={{ color: "#2B4030" }} />
                <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>Verbinden met Stripe…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
