"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ExternalLink, Loader2, ArrowRight, Wrench, CreditCard } from "lucide-react";
import { useStripeConnectStore } from "@/lib/stripeConnectStore";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

type Stap = "welkom" | "bedrijf" | "stripe" | "klaar";

export default function VakmanSetupPage() {
  const router = useRouter();
  const { name, specialty, setProfile } = useUserStore();
  const { onboarded, setAccountId } = useStripeConnectStore();

  const [stap, setStap] = useState<Stap>("welkom");
  const [specialiteit, setSpecialiteit] = useState(specialty || "");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Kijk of we terugkomen van Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("stripeAccountId");
    if (sid) {
      setAccountId(sid);
      window.history.replaceState({}, "", "/vakman-setup");
      setStap("klaar");
    }
  }, [setAccountId]);

  // Al eerder Stripe gedaan → stuur door
  useEffect(() => {
    if (onboarded && stap !== "klaar") {
      router.replace("/feed");
    }
  }, [onboarded, stap, router]);

  const firstName = name?.split(" ")[0] || "daar";

  // ─── STAP: WELKOM ───────────────────────────────────────────
  if (stap === "welkom") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>
      <div style={{ background: "#2B4030", padding: "72px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#C97A4D", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Wrench size={28} color="white" />
        </div>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 32, lineHeight: 1.2, margin: "0 0 12px" }}>
          Welkom, {firstName}!
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          Je bent er bijna. Nog 2 snelle stappen en je kan opdrachten ontvangen.
        </p>
      </div>

      <div style={{ padding: "32px 24px", flex: 1 }}>
        {/* Stappen overzicht */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "0.5px solid #E5DDD0", borderRadius: 16, overflow: "hidden", background: "#FBF7F0", marginBottom: 32 }}>
          {[
            { n: "1", t: "Jouw specialiteit", d: "Wat doe jij het beste?", color: "#2B4030" },
            { n: "2", t: "Stripe account koppelen", d: "Zo ontvang je betalingen", color: "#C97A4D" },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderBottom: i < 1 ? "0.5px solid #E5DDD0" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "white", fontSize: 14, fontWeight: 900 }}>{s.n}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1D1A" }}>{s.t}</div>
                <div style={{ fontSize: 13, color: "#5C5C56", marginTop: 2 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStap("bedrijf")}
          style={{ width: "100%", padding: "18px", borderRadius: 14, background: "#2B4030", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          Aan de slag <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );

  // ─── STAP: BEDRIJF / SPECIALITEIT ───────────────────────────
  if (stap === "bedrijf") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>
      <div style={{ background: "#2B4030", padding: "64px 24px 40px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <div style={{ height: 4, borderRadius: 2, flex: 1, background: "white" }} />
          <div style={{ height: 4, borderRadius: 2, flex: 1, background: "rgba(255,255,255,0.25)" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Stap 1 van 2
        </p>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 28, margin: 0 }}>Wat is jouw vak?</h1>
      </div>

      <div style={{ padding: "32px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 14, color: "#5C5C56", margin: 0 }}>
          Klanten zoeken vakmensen op categorie. Kies de categorie die het beste bij jou past.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          {["Loodgieter", "Elektricien", "Schilder", "Schoonmaak", "Timmerman", "Tuinman", "HVAC", "Slotenmaker", "Dakdekker", "Algemeen klusser"].map(s => (
            <button
              key={s}
              onClick={() => setSpecialiteit(s)}
              style={{
                padding: "14px 12px",
                borderRadius: 12,
                border: `2px solid ${specialiteit === s ? "#2B4030" : "#E5DDD0"}`,
                background: specialiteit === s ? "rgba(43,64,48,0.08)" : "#FBF7F0",
                color: "#1A1D1A",
                fontSize: 14,
                fontWeight: specialiteit === s ? 700 : 500,
                cursor: "pointer",
                textAlign: "left" as const,
                transition: "all 0.15s",
              }}>
              {specialiteit === s && <span style={{ color: "#2B4030", marginRight: 6 }}>✓</span>}
              {s}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button
            onClick={() => {
              if (specialiteit) setProfile({ specialty: specialiteit });
              setStap("stripe");
            }}
            disabled={!specialiteit}
            style={{ width: "100%", padding: "18px", borderRadius: 14, background: !specialiteit ? "#E5DDD0" : "#2B4030", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: !specialiteit ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            Volgende stap <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  // ─── STAP: STRIPE ────────────────────────────────────────────
  if (stap === "stripe") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F5EFE5" }}>
      <div style={{ background: "#2B4030", padding: "64px 24px 40px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <div style={{ height: 4, borderRadius: 2, flex: 1, background: "rgba(255,255,255,0.25)" }} />
          <div style={{ height: 4, borderRadius: 2, flex: 1, background: "white" }} />
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Stap 2 van 2
        </p>
        <h1 style={{ fontFamily: SERIF, color: "white", fontSize: 28, margin: 0 }}>Betalingen instellen</h1>
      </div>

      <div style={{ padding: "32px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#635BFF20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CreditCard size={24} style={{ color: "#635BFF" }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1A1D1A", margin: 0 }}>Stripe</p>
              <p style={{ fontSize: 13, color: "#5C5C56", margin: "2px 0 0" }}>Veilig betalingen ontvangen</p>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "#5C5C56", lineHeight: 1.6, margin: 0 }}>
            Via Stripe ontvang je betalingen rechtstreeks op jouw rekening. Servr houdt <strong style={{ color: "#1A1D1A" }}>10% commissie</strong> in. Jij krijgt <strong style={{ color: "#1A1D1A" }}>90%</strong>.
          </p>

          <div style={{ background: "#EDE4D2", borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "✓ Gratis account aanmaken",
              "✓ Uitbetaling in 2-3 werkdagen",
              "✓ Bankoverschrijving, kaart, Bancontact",
              "✓ Jouw geld, jouw rekening",
            ].map(t => (
              <p key={t} style={{ fontSize: 13, color: "#2B4030", margin: 0, fontWeight: 500 }}>{t}</p>
            ))}
          </div>

          {stripeError && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fee2e2", fontSize: 13, color: "#dc2626" }}>
              ⚠️ {stripeError}
            </div>
          )}

          <button
            disabled={stripeLoading}
            onClick={async () => {
              setStripeLoading(true);
              setStripeError(null);
              try {
                const returnUrl = `${window.location.origin}/vakman-setup`;
                const res = await fetch("/api/stripe/connect", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ returnUrl }),
                });
                const data = await res.json();
                if (!data.url) {
                  setStripeError(data.error ?? "Kan Stripe niet starten");
                  setStripeLoading(false);
                  return;
                }
                window.location.href = data.url;
              } catch {
                setStripeError("Kan Stripe niet bereiken. Probeer opnieuw.");
                setStripeLoading(false);
              }
            }}
            style={{ width: "100%", padding: "18px", borderRadius: 14, background: stripeLoading ? "#8A8A83" : "#635BFF", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: stripeLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {stripeLoading
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Openen…</>
              : <><ExternalLink size={18} /> Stripe account aanmaken</>}
          </button>
          <p style={{ textAlign: "center", fontSize: 12, color: "#8A8A83", margin: 0 }}>
            Je wordt doorgestuurd naar Stripe — kom daarna automatisch terug
          </p>
        </div>

        <button
          onClick={() => setStap("bedrijf")}
          style={{ background: "none", border: "none", color: "#8A8A83", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
          ← Terug naar stap 1
        </button>
      </div>
    </div>
  );

  // ─── STAP: KLAAR ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F5EFE5", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#EAF0EC", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <CheckCircle size={40} style={{ color: "#2B4030" }} />
      </div>
      <h1 style={{ fontFamily: SERIF, fontSize: 30, color: "#1A1D1A", margin: "0 0 12px" }}>
        Je bent klaar!
      </h1>
      <p style={{ fontSize: 16, color: "#5C5C56", lineHeight: 1.6, maxWidth: 280, margin: "0 0 40px" }}>
        Stripe is gekoppeld. Je kan nu opdrachten ontvangen en betalingen incasseren.
      </p>
      <button
        onClick={() => router.replace("/feed")}
        style={{ padding: "18px 40px", borderRadius: 14, background: "#2B4030", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" }}>
        Bekijk opdrachten →
      </button>
    </div>
  );
}
