"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Star, MessageCircle, Clock, FileText, Shield, X,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import {
  supabase, supabaseReady, formatEuro,
  type Offerte, type Opdracht,
} from "@/lib/supabase";
import { accepteerOfferte, weigerOfferte, trekOfferteIn } from "@/lib/flow";
import { OFFERTE_LABEL, statusKleur, type OfferteStatus } from "@/lib/status";

const SERIF = "'Source Serif 4', Georgia, serif";

type OfferteVol = Offerte & {
  vakman: { name: string; phone: string | null; vakmensen: { specialty: string | null; rating: number; review_count: number } | null } | null;
  opdracht: (Opdracht & { klant: { name: string } | null }) | null;
};

// Labels en kleuren komen uit lib/status.ts — geen losse status-strings hier

export default function OfferteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId } = useUserStore();

  const [offerte, setOfferte] = useState<OfferteVol | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const laad = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }
    const { data } = await supabase
      .from("offertes")
      .select(`*,
        vakman:profiles!offertes_vakman_id_fkey(name, phone, vakmensen(specialty, rating, review_count)),
        opdracht:opdrachten(*, klant:profiles!opdrachten_klant_id_fkey(name))`)
      .eq("id", id)
      .maybeSingle();
    setOfferte((data as unknown as OfferteVol | null) ?? null);
    setLoading(false);
  }, [id]);

  useEffect(() => { laad(); }, [laad]);

  // Realtime status-updates
  useEffect(() => {
    if (!supabaseReady) return;
    const channel = supabase.channel(`offerte_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offertes", filter: `id=eq.${id}` }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, laad]);

  const isVakman = offerte != null && userId === offerte.vakman_id;
  const isKlant = offerte?.opdracht != null && userId === offerte.opdracht.klant_id;

  // ── Acties ──────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!userId || !offerte?.opdracht || busy) return;
    setBusy(true);
    const res = await accepteerOfferte(userId, offerte, offerte.opdracht);
    setBusy(false);
    if (!res.ok) { alert(res.reden); laad(); return; }
    router.push(`/te-betalen?boeking=${res.boekingId}`);
  };

  const handleWeiger = async () => {
    if (!offerte || busy) return;
    setBusy(true);
    const err = await weigerOfferte(offerte.id, offerte.vakman_id, offerte.opdracht?.titel ?? "Opdracht");
    setBusy(false);
    if (err) { alert("Weigeren mislukt: " + err); return; }
    router.push(offerte.opdracht ? `/opdracht/${offerte.opdracht.id}` : "/mijn-opdrachten");
  };

  const handleIntrekken = async () => {
    if (!offerte || busy) return;
    if (!confirm("Offerte intrekken? De klant kan hem daarna niet meer accepteren.")) return;
    setBusy(true);
    const err = await trekOfferteIn(offerte.id);
    setBusy(false);
    if (err) alert("Intrekken lukte niet: " + err);
    laad();
  };

  // ── Loading / niet gevonden ─────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5", padding: "80px 20px" }}>
      <div className="skeleton" style={{ height: 28, width: "50%", marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 56 }} />
    </div>
  );

  if (!offerte) return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
      <p style={{ fontFamily: SERIF, fontSize: 19, color: "#1A1D1A", margin: "0 0 8px" }}>Offerte niet gevonden</p>
      <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 20px" }}>Deze offerte bestaat niet meer.</p>
      <button onClick={() => router.back()} className="touch-scale" style={{ padding: "12px 24px", background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        ← Terug
      </button>
    </div>
  );

  const badgeStatus = (offerte.status ?? "wachtend") as OfferteStatus;
  const badge = { label: OFFERTE_LABEL[badgeStatus] ?? badgeStatus, ...statusKleur(badgeStatus) };
  const serviceFee = Math.round(offerte.prijs * 0.05 * 100) / 100;
  const klantTotaal = Math.round((offerte.prijs + serviceFee) * 100) / 100;
  const vakmanNaam = offerte.vakman?.name ?? "Vakman";
  const vm = offerte.vakman?.vakmensen;

  return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5" }} className="animate-fade-in">

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => router.back()} className="touch-scale" style={{
          width: 36, height: 36, borderRadius: "50%", background: "#EDE4D2",
          display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer",
        }}>
          <ArrowLeft size={17} color="#1A1D1A" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>Offerte</h1>
          <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
            {offerte.opdracht?.titel ?? "Opdracht"}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: badge.color, background: badge.bg, borderRadius: 99, padding: "4px 10px", flexShrink: 0 }}>
          {badge.label}
        </span>
      </div>

      <div className="px-5 pb-28">

        {/* Offerte-document */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>

          {/* Document header */}
          <div style={{ padding: "20px 18px", background: "linear-gradient(135deg, #2B4030 0%, #1A2D22 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} color="rgba(255,255,255,0.85)" />
                <span style={{ color: "#F5EFE5", fontFamily: SERIF, fontSize: 18 }}>Offerte</span>
              </div>
              <span style={{ color: "rgba(245,239,229,0.6)", fontSize: 11 }}>
                {new Date(offerte.created_at).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Vakman */}
          <div style={{ padding: 16, borderBottom: "0.5px solid #E5DDD0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 17, color: "#F5EFE5", flexShrink: 0 }}>
              {vakmanNaam.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{vakmanNaam}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                {vm?.specialty ?? "Vakman"}
                {(vm?.review_count ?? 0) > 0 && (
                  <><Star size={10} style={{ color: "#C97A4D", fill: "#C97A4D" }} /> {vm?.rating} ({vm?.review_count} reviews)</>
                )}
              </p>
            </div>
            {offerte.gesprek_id && (
              <Link href={`/chat/${offerte.gesprek_id}`} className="touch-scale" style={{
                display: "flex", alignItems: "center", gap: 5, padding: "8px 12px",
                border: "0.5px solid #2B4030", borderRadius: 99, color: "#2B4030",
                fontSize: 12, fontWeight: 500, textDecoration: "none", flexShrink: 0,
              }}>
                <MessageCircle size={13} /> Chat
              </Link>
            )}
          </div>

          {/* Werkzaamheden */}
          <div style={{ padding: 16, borderBottom: "0.5px solid #E5DDD0" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#8A8A83", margin: "0 0 8px", textTransform: "uppercase" }}>Werkzaamheden</p>
            <p style={{ fontSize: 14, color: "#1A1D1A", lineHeight: 1.6, margin: 0 }}>
              {offerte.omschrijving ?? offerte.opdracht?.titel ?? "Klus"}
            </p>
            {offerte.eta && (
              <p style={{ fontSize: 12, color: "#8A8A83", margin: "10px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={12} /> Geschat: {offerte.eta}
              </p>
            )}
          </div>

          {/* Totalen */}
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "#8A8A83" }}>Klus (vakman-tarief)</span>
              <span style={{ color: "#1A1D1A" }}>{formatEuro(offerte.prijs)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: "#8A8A83" }}>Servr service fee (5%)</span>
              <span style={{ color: "#8A8A83" }}>{formatEuro(serviceFee)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "0.5px solid #E5DDD0" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{isVakman ? "Klant betaalt" : "Jij betaalt"}</p>
                <p style={{ fontSize: 10, color: "#8A8A83", margin: "1px 0 0" }}>Incl. service fee</p>
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 28, margin: 0, color: "#2B4030" }}>{formatEuro(klantTotaal)}</p>
            </div>
          </div>
        </div>

        {/* Escrow uitleg */}
        <div style={{ background: "#EDE4D2", borderRadius: 12, padding: 14, display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
          <Shield size={15} style={{ color: "#2B4030", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "#5C5C56", margin: 0, lineHeight: 1.5 }}>
            Je betaling staat veilig bij Servr en wordt pas aan de vakman uitbetaald nadat jij de afronding hebt bevestigd.
          </p>
        </div>

        {/* ═══ KLANT ACTIES ═══ */}
        {isKlant && offerte.status === "wachtend" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleWeiger} disabled={busy} className="touch-scale" style={{
              width: 52, height: 52, borderRadius: 12, background: "transparent",
              border: "0.5px solid #E5DDD0", color: "#8A8A83", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <X size={19} />
            </button>
            <button onClick={handleAccept} disabled={busy} className="touch-scale" style={{
              flex: 1, height: 52, borderRadius: 12, background: busy ? "#8A8A83" : "#2B4030",
              color: "#F5EFE5", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}>
              {busy ? "Bezig…" : `Accepteren · ${formatEuro(klantTotaal)}`}
            </button>
          </div>
        )}

        {isKlant && offerte.status === "geaccepteerd" && (
          <Link href={offerte.opdracht ? `/opdracht/${offerte.opdracht.id}` : "/mijn-opdrachten"} className="touch-scale" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 52, borderRadius: 12, background: "#2B4030", color: "#F5EFE5",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            Naar opdracht-status
          </Link>
        )}

        {/* ═══ VAKMAN ACTIES ═══ */}
        {isVakman && offerte.status === "wachtend" && (
          <button onClick={handleIntrekken} disabled={busy} className="touch-scale" style={{
            width: "100%", padding: "14px 0", background: "transparent",
            border: "0.5px solid #E5DDD0", color: "#8A8A83", borderRadius: 12,
            fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            Offerte intrekken
          </button>
        )}

        {isVakman && offerte.status === "geaccepteerd" && (
          <Link href="/agenda" className="touch-scale" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 52, borderRadius: 12, background: "#2B4030", color: "#F5EFE5",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            🎉 Geaccepteerd — naar je agenda
          </Link>
        )}
      </div>
    </div>
  );
}
