"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Clock, Navigation, MessageCircle,
  Star, CheckCircle2, X, AlertTriangle, QrCode,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import {
  supabase, supabaseReady, formatEuro, wazeUrl, afstandKm, stuurNotificatie,
  type Opdracht, type Offerte,
} from "@/lib/supabase";
import { accepteerOfferte, weigerOfferte, annuleerOpdracht } from "@/lib/flow";
import { OPDRACHT_LABEL, OFFERTE_LABEL, wieAanZet, type OpdrachtStatus, type BoekingStatus } from "@/lib/status";

const SERIF = "'Source Serif 4', Georgia, serif";

const CAT_EMOJI: Record<string, string> = {
  loodgieter: "🔧", elektricien: "⚡", schilder: "🖌️",
  schoonmaak: "🧹", tuinman: "🌿", tuinier: "🌿", klusser: "🔨", timmerman: "🪚",
};
function emoji(cat: string | null) {
  return CAT_EMOJI[(cat ?? "").toLowerCase()] ?? "🔨";
}

const URGENTIE: Record<string, { label: string; color: string; bg: string }> = {
  hoog:   { label: "Urgent",   color: "#C97A4D", bg: "#F5EDE5" },
  middel: { label: "Normaal",  color: "#8A8A83", bg: "#F0EDEA" },
  laag:   { label: "Flexibel", color: "#2B4030", bg: "#EAF0EC" },
};

// Statuslabels uit lib/status.ts — geen losse strings hier

function tijdGeleden(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min}m geleden`;
  const uur = Math.floor(min / 60);
  if (uur < 24) return `${uur}u geleden`;
  return `${Math.floor(uur / 24)}d geleden`;
}

type OfferteRij = Offerte & {
  vakman: { name: string; vakmensen: { specialty: string | null; rating: number; review_count: number } | null } | null;
};

type Boekinkje = { id: string; status: string; betaald: boolean; vakman_id: string; bedrag: number | null };

export default function OpdrachtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { userId, activeView } = useUserStore();

  const [opdracht, setOpdracht] = useState<(Opdracht & { klant: { name: string } | null }) | null>(null);
  const [offertes, setOffertes] = useState<OfferteRij[]>([]);
  const [boeking, setBoeking] = useState<Boekinkje | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [eigenLat, setEigenLat] = useState<number | null>(null);
  const [eigenLng, setEigenLng] = useState<number | null>(null);

  const laad = useCallback(async () => {
    if (!supabaseReady) { setLoading(false); return; }
    const { data: o } = await supabase
      .from("opdrachten")
      .select("*, klant:profiles!opdrachten_klant_id_fkey(name)")
      .eq("id", id)
      .maybeSingle();
    setOpdracht((o as (Opdracht & { klant: { name: string } | null }) | null) ?? null);

    if (o) {
      const { data: offs } = await supabase
        .from("offertes")
        .select("*, vakman:profiles!offertes_vakman_id_fkey(name, vakmensen(specialty, rating, review_count))")
        .eq("opdracht_id", id)
        .order("created_at", { ascending: false });
      setOffertes((offs as unknown as OfferteRij[]) ?? []);

      const { data: b } = await supabase
        .from("boekingen")
        .select("id, status, betaald, vakman_id, bedrag")
        .eq("opdracht_id", id)
        .neq("status", "geannuleerd")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setBoeking((b as Boekinkje | null) ?? null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { laad(); }, [laad]);

  // Realtime: offertes + opdracht + boeking voor deze pagina
  useEffect(() => {
    if (!supabaseReady) return;
    const channel = supabase.channel(`opdracht_${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offertes", filter: `opdracht_id=eq.${id}` }, () => laad())
      .on("postgres_changes", { event: "*", schema: "public", table: "opdrachten", filter: `id=eq.${id}` }, () => laad())
      .on("postgres_changes", { event: "*", schema: "public", table: "boekingen", filter: `opdracht_id=eq.${id}` }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, laad]);

  // Eigen locatie voor afstandsbadge (vakman)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => { setEigenLat(pos.coords.latitude); setEigenLng(pos.coords.longitude); },
      () => {}, { timeout: 5000, maximumAge: 3600000 }
    );
  }, []);

  const isEigenaar = opdracht != null && userId === opdracht.klant_id;
  const isVakmanView = !isEigenaar && activeView === "vakman";
  const eigenOfferte = userId ? offertes.find(of => of.vakman_id === userId) : undefined;
  const afstand = opdracht?.lat != null && opdracht?.lng != null && eigenLat != null && eigenLng != null
    ? Math.round(afstandKm(eigenLat, eigenLng, opdracht.lat, opdracht.lng) * 10) / 10
    : null;

  // ── Acties ──────────────────────────────────────────────────
  const handleAccept = async (off: OfferteRij) => {
    if (!userId || !opdracht || busy) return;
    setBusy(true);
    const res = await accepteerOfferte(userId, off, opdracht);
    setBusy(false);
    if (!res.ok) { alert(res.reden); laad(); return; }
    router.push(`/te-betalen?boeking=${res.boekingId}`);
  };

  const handleWeiger = async (off: OfferteRij) => {
    if (busy || !opdracht) return;
    setBusy(true);
    const err = await weigerOfferte(off.id, off.vakman_id, opdracht.titel);
    setBusy(false);
    if (err) alert("Weigeren mislukt: " + err);
    laad();
  };

  const handleAnnuleer = async () => {
    if (!opdracht || busy) return;
    if (!confirm("Weet je zeker dat je deze opdracht wil annuleren?")) return;
    setBusy(true);
    // Betaalde boeking → via Stripe refund-route; anders gewoon annuleren
    if (boeking?.betaald) {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ boekingId: boeking.id }),
      });
      const d = await res.json();
      setBusy(false);
      if (d.error) { alert(d.error); return; }
      alert(d.status === "geschil"
        ? "De klus is al gestart — we hebben een geschil geopend en nemen contact op."
        : "Geannuleerd. Je betaling wordt volledig teruggestort.");
      laad();
      return;
    }
    const err = await annuleerOpdracht(opdracht);
    setBusy(false);
    if (err) { alert(err); return; }
    laad();
  };

  // ── Klant bevestigt afronding: review verplicht → uitbetaling ──
  const [reviewOpen, setReviewOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [reviewTekst, setReviewTekst] = useState("");

  const handleBevestig = async () => {
    if (!userId || !boeking || score === 0 || busy) return;
    setBusy(true);
    try {
      // 1. Boeking bevestigen
      const { error: e1 } = await supabase
        .from("boekingen")
        .update({ status: "bevestigd", bevestigd_at: new Date().toISOString() } as never)
        .eq("id", boeking.id)
        .eq("status", "afgerond");
      if (e1) throw new Error(e1.message);

      // 2. Review opslaan (verplicht vóór uitbetaling)
      const { error: e2 } = await supabase.from("reviews").insert({
        boeking_id: boeking.id,
        klant_id: userId,
        vakman_id: boeking.vakman_id,
        score,
        tekst: reviewTekst.trim() || null,
        reviewer_rol: "klant",
      } as never);
      if (e2 && !e2.message.includes("duplicate")) throw new Error(e2.message);

      // 3. Escrow vrijgeven
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/stripe/uitbetalen", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ boekingId: boeking.id }),
      });
      const d = await res.json();
      if (d.error) {
        // Bevestiging + review staan al — uitbetaling kan later opnieuw
        alert("Bevestigd! Uitbetaling kon nog niet verwerkt worden: " + d.error);
      }

      // 4. Vakman uitnodigen om jou ook te beoordelen
      stuurNotificatie({
        user_id: boeking.vakman_id,
        type: "review_ontvangen",
        titel: `Nieuwe review: ${"★".repeat(score)}`,
        bericht: `${opdracht?.titel ?? "Je klus"} is bevestigd. Beoordeel de klant ook via Reviews.`,
        link: "/reviews",
      });

      setReviewOpen(false);
      laad();
    } catch (err) {
      alert("Bevestigen mislukt: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  // ── Loading / niet gevonden ─────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5", padding: "80px 20px" }}>
      <div className="skeleton" style={{ height: 28, width: "60%", marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 80 }} />
    </div>
  );

  if (!opdracht) return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🔍</p>
      <p style={{ fontFamily: SERIF, fontSize: 19, color: "#1A1D1A", margin: "0 0 8px" }}>Opdracht niet gevonden</p>
      <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 20px" }}>Deze opdracht bestaat niet meer of is verwijderd.</p>
      <button onClick={() => router.back()} className="touch-scale" style={{ padding: "12px 24px", background: "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
        ← Terug
      </button>
    </div>
  );

  const urg = URGENTIE[opdracht.urgentie] ?? URGENTIE.middel;
  const waze = wazeUrl(opdracht.lat, opdracht.lng, opdracht.adres);

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
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, margin: 0, color: "#1A1D1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {opdracht.titel}
          </h1>
          <p style={{ fontSize: 13, color: "#8A8A83", margin: "1px 0 0" }}>
            {OPDRACHT_LABEL[opdracht.status as OpdrachtStatus] ?? opdracht.status} · {tijdGeleden(opdracht.created_at)}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: urg.color, background: urg.bg, borderRadius: 99, padding: "4px 10px", flexShrink: 0 }}>
          {urg.label}
        </span>
      </div>

      <div className="px-5 pb-28">

        {/* Opdracht-kaart */}
        <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 18, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#EAF0EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
              {emoji(opdracht.categorie)}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{opdracht.categorie ?? "Klus"}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                {isEigenaar ? "Jouw opdracht" : `Geplaatst door ${opdracht.klant?.name ?? "klant"}`}
              </p>
            </div>
          </div>

          {opdracht.beschrijving && (
            <p style={{ fontSize: 14, color: "#1A1D1A", lineHeight: 1.6, margin: "0 0 14px" }}>
              {opdracht.beschrijving}
            </p>
          )}

          {opdracht.foto_url && (
            <img src={opdracht.foto_url} alt="opdracht foto" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(opdracht.adres || afstand != null) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5C5C56" }}>
                <MapPin size={14} style={{ color: "#2B4030", flexShrink: 0 }} />
                {afstand != null ? `${afstand} km — ` : ""}{opdracht.adres ?? "Exacte locatie na acceptatie"}
                {waze && !isEigenaar && (
                  <button onClick={() => window.open(waze, "_blank")} className="touch-scale" style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                    padding: "5px 10px", background: "#EDE4D2", border: "none", borderRadius: 99,
                    fontSize: 11, fontWeight: 600, color: "#1A1D1A", cursor: "pointer", flexShrink: 0,
                  }}>
                    <Navigation size={11} /> Waze
                  </button>
                )}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5C5C56" }}>
              <Clock size={14} style={{ color: "#2B4030", flexShrink: 0 }} />
              {tijdGeleden(opdracht.created_at)}
              {opdracht.budget && (
                <span style={{ marginLeft: "auto", fontFamily: SERIF, fontSize: 16, color: "#2B4030" }}>
                  Budget: {formatEuro(Number(opdracht.budget) || 0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ VAKMAN VIEW ═══ */}
        {isVakmanView && (
          <>
            {opdracht.status === "geannuleerd" ? (
              <div style={{ background: "#F9EDEA", borderRadius: 12, padding: 14, display: "flex", gap: 10, alignItems: "center" }}>
                <AlertTriangle size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>Deze opdracht is geannuleerd door de klant.</p>
              </div>
            ) : eigenOfferte ? (
              <div style={{
                background: eigenOfferte.status === "geaccepteerd" ? "#EAF0EC" : eigenOfferte.status === "geweigerd" ? "#F9EDEA" : "#FAF0E6",
                borderRadius: 12, padding: 16,
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "#1A1D1A" }}>
                  {eigenOfferte.status === "geaccepteerd" ? "✓ Jouw offerte is geaccepteerd!"
                    : eigenOfferte.status === "geweigerd" ? "Jouw offerte is geweigerd"
                    : "Jouw offerte is verstuurd"}
                </p>
                <p style={{ fontSize: 12, color: "#5C5C56", margin: 0 }}>
                  {formatEuro(eigenOfferte.prijs)} · {eigenOfferte.omschrijving}
                </p>
                {eigenOfferte.status === "geaccepteerd" && (
                  <Link href="/agenda" className="touch-scale" style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12,
                    padding: "12px 0", background: "#2B4030", color: "#F5EFE5",
                    borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: "none",
                  }}>
                    <QrCode size={14} /> Naar je agenda
                  </Link>
                )}
              </div>
            ) : opdracht.status === "open" || opdracht.status === "offerte_ontvangen" ? (
              <button
                onClick={() => router.push(`/offerte/maak?opdracht_id=${opdracht.id}&titel=${encodeURIComponent(opdracht.titel)}&klant_id=${opdracht.klant_id}`)}
                className="touch-scale"
                style={{
                  width: "100%", padding: "16px 0", background: "#2B4030", color: "#F5EFE5",
                  border: "none", borderRadius: 12, fontSize: 15, fontWeight: 500, cursor: "pointer",
                }}>
                Offerte sturen
              </button>
            ) : (
              <div style={{ background: "#F0EDEA", borderRadius: 12, padding: 14 }}>
                <p style={{ fontSize: 13, color: "#5C5C56", margin: 0 }}>Deze opdracht is al vergeven.</p>
              </div>
            )}
          </>
        )}

        {/* ═══ KLANT VIEW (eigenaar) ═══ */}
        {isEigenaar && (
          <>
            {/* Boeking-status */}
            {boeking && (
              <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#8A8A83", margin: "0 0 8px", textTransform: "uppercase" }}>Status</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={18} style={{ color: "#2B4030", flexShrink: 0 }} />
                  <p style={{ fontSize: 15, color: "#1A1D1A", margin: 0, flex: 1 }}>
                    {wieAanZet(boeking.status as BoekingStatus, boeking.betaald, true)}
                  </p>
                  {boeking.status === "gepland" && !boeking.betaald && (
                    <Link href={`/te-betalen?boeking=${boeking.id}`} className="touch-scale" style={{
                      padding: "8px 14px", background: "#C97A4D", color: "#1A1D1A", borderRadius: 99,
                      fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0,
                    }}>
                      Betaal nu
                    </Link>
                  )}
                </div>
                {boeking.status === "afgerond" && (
                  <button onClick={() => setReviewOpen(true)} className="touch-scale" style={{
                    width: "100%", marginTop: 12, padding: "14px 0", background: "#2B4030",
                    color: "#F5EFE5", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>
                    ✓ Bevestig afronding & beoordeel
                  </button>
                )}
              </div>
            )}

            {/* Bevestig + review sheet */}
            {reviewOpen && boeking && (
              <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(26,29,26,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
                onClick={() => setReviewOpen(false)}>
                <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={{
                  width: "100%", maxWidth: 480, background: "#FBF7F0",
                  borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
                }}>
                  <h3 style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, margin: "0 0 4px", color: "#1A1D1A" }}>
                    Hoe was de klus?
                  </h3>
                  <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 18px" }}>
                    Na je beoordeling geven we {formatEuro((boeking.bedrag ?? 0) * 0.93)} vrij aan de vakman.
                  </p>

                  {/* Sterren */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setScore(s)} className="touch-scale" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Star size={34} style={{
                          color: s <= score ? "#C97A4D" : "#E5DDD0",
                          fill: s <= score ? "#C97A4D" : "transparent",
                          transition: "all 0.15s",
                        }} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewTekst}
                    onChange={e => setReviewTekst(e.target.value)}
                    placeholder="Vertel kort hoe het ging (optioneel)…"
                    rows={3}
                    style={{
                      width: "100%", padding: "12px 14px", background: "#F5EFE5",
                      border: "0.5px solid #E5DDD0", borderRadius: 10, fontSize: 14,
                      resize: "none", marginBottom: 16, fontFamily: "Inter, sans-serif",
                    }}
                  />

                  <button onClick={handleBevestig} disabled={score === 0 || busy} className="touch-scale" style={{
                    width: "100%", padding: "15px 0", borderRadius: 12, border: "none", cursor: "pointer",
                    background: score === 0 || busy ? "#8A8A83" : "#2B4030", color: "#F5EFE5",
                    fontSize: 15, fontWeight: 600,
                  }}>
                    {busy ? "Verwerken…" : score === 0 ? "Kies eerst een score" : "Bevestig & geef vrij"}
                  </button>
                  <p style={{ fontSize: 11, color: "#8A8A83", textAlign: "center", margin: "10px 0 0" }}>
                    Niet tevreden? Open eerst een gesprek met je vakman of annuleer voor een geschil.
                  </p>
                </div>
              </div>
            )}

            {/* Ontvangen offertes */}
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: "#1A1D1A", margin: "4px 0 10px" }}>
              {offertes.length === 0 ? "Nog geen offertes" : `${offertes.length} offerte${offertes.length !== 1 ? "s" : ""}`}
            </p>

            {offertes.length === 0 && opdracht.status === "open" && (
              <div style={{ background: "#FBF7F0", border: "0.5px dashed #E5DDD0", borderRadius: 14, padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 26, margin: "0 0 8px" }}>⏳</p>
                <p style={{ fontSize: 13, color: "#8A8A83", margin: 0 }}>
                  Vakmensen in de buurt zijn op de hoogte gebracht.<br />Offertes verschijnen hier direct.
                </p>
              </div>
            )}

            {offertes.map(off => (
              <div key={off.id} style={{
                background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10,
                opacity: off.status === "geweigerd" ? 0.55 : 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 16, color: "#F5EFE5", flexShrink: 0 }}>
                    {(off.vakman?.name ?? "V").charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{off.vakman?.name ?? "Vakman"}</p>
                    <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                      {off.vakman?.vakmensen?.specialty ?? "Vakman"}
                      {(off.vakman?.vakmensen?.review_count ?? 0) > 0 && (
                        <><Star size={10} style={{ color: "#C97A4D", fill: "#C97A4D" }} /> {off.vakman?.vakmensen?.rating} ({off.vakman?.vakmensen?.review_count})</>
                      )}
                    </p>
                  </div>
                  <span style={{ fontFamily: SERIF, fontSize: 20, color: "#2B4030", flexShrink: 0 }}>{formatEuro(off.prijs)}</span>
                </div>

                {off.omschrijving && <p style={{ fontSize: 13, color: "#5C5C56", margin: "0 0 6px", lineHeight: 1.5 }}>{off.omschrijving}</p>}
                {off.eta && <p style={{ fontSize: 12, color: "#8A8A83", margin: "0 0 10px" }}>📅 {off.eta}</p>}

                {off.status === "wachtend" ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleWeiger(off)} disabled={busy} className="touch-scale" style={{
                      width: 44, height: 44, borderRadius: 10, background: "transparent",
                      border: "0.5px solid #E5DDD0", color: "#8A8A83", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <X size={17} />
                    </button>
                    <Link href={`/offerte/${off.id}`} className="touch-scale" style={{
                      flex: 1, height: 44, borderRadius: 10, border: "0.5px solid #2B4030",
                      color: "#2B4030", fontSize: 13, fontWeight: 500, textDecoration: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      Bekijken
                    </Link>
                    <button onClick={() => handleAccept(off)} disabled={busy} className="touch-scale" style={{
                      flex: 1, height: 44, borderRadius: 10, background: busy ? "#8A8A83" : "#2B4030",
                      color: "#F5EFE5", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>
                      {busy ? "Bezig…" : "Accepteren"}
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: off.status === "geaccepteerd" ? "#2B4030" : "#8A8A83" }}>
                    {off.status === "geaccepteerd" ? "✓ Geaccepteerd" : off.status === "geweigerd" ? "Geweigerd" : off.status}
                  </p>
                )}
              </div>
            ))}

            {/* Chat met geaccepteerde vakman */}
            {offertes.find(o => o.status === "geaccepteerd")?.gesprek_id && (
              <Link href={`/chat/${offertes.find(o => o.status === "geaccepteerd")!.gesprek_id}`} className="touch-scale" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 0", marginTop: 4, border: "0.5px solid #2B4030", color: "#2B4030",
                borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none",
              }}>
                <MessageCircle size={16} /> Chat met je vakman
              </Link>
            )}

            {/* Annuleren */}
            {["open", "offerte_ontvangen", "geaccepteerd"].includes(opdracht.status) && !boeking?.betaald && (
              <button onClick={handleAnnuleer} disabled={busy} className="touch-scale" style={{
                width: "100%", marginTop: 16, padding: "13px 0", background: "transparent",
                border: "none", color: "#dc2626", fontSize: 13, fontWeight: 500, cursor: "pointer",
                textDecoration: "underline",
              }}>
                Opdracht annuleren
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
