"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Search, Zap, ChevronRight, Mic, MicOff, Crosshair, X } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, afstandKm, formatEuro, type Opdracht } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Minimale Web Speech API types (niet in standaard TS lib) ──
type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};

// ── Categorieën (counts komen live uit Supabase) ──────────────
const CATS = [
  { id: "loodgieter",  label: "Loodgieter",  emoji: "🔧" },
  { id: "elektricien", label: "Elektricien", emoji: "⚡" },
  { id: "schilder",    label: "Schilder",    emoji: "🖌️" },
  { id: "schoonmaak",  label: "Schoonmaak",  emoji: "🧹" },
  { id: "tuinman",     label: "Tuinier",     emoji: "🌿" },
  { id: "klusser",     label: "Klusser",     emoji: "🔨" },
];

const STATUS_LABEL: Record<string, string> = {
  open: "Wacht op offertes",
  offerte_ontvangen: "Offerte ontvangen",
  geaccepteerd: "Geaccepteerd",
  bevestigd: "Ingepland",
  afgerond: "Afgerond",
};

export default function KlantHomePage() {
  const { name, address, role, activeView, setActiveView, setProfile, userId, lat, lng } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // ── Live data ───────────────────────────────────────────────
  const [mijnOpdrachten, setMijnOpdrachten] = useState<Opdracht[]>([]);
  const [catCounts, setCatCounts] = useState<Record<string, number> | null>(null);
  const [spoedCount, setSpoedCount] = useState<number | null>(null);

  // ── Locatie-editor ──────────────────────────────────────────
  const [locOpen, setLocOpen] = useState(false);
  const [locInput, setLocInput] = useState("");
  const [locBusy, setLocBusy] = useState(false);

  // ── Stem-opdracht ───────────────────────────────────────────
  const [stemStatus, setStemStatus] = useState<"idle" | "luisteren" | "analyseren" | "bevestigen" | "verzonden" | "fout">("idle");
  const [stemTekst, setStemTekst] = useState("");
  const stemTekstRef = useRef("");   // synchroon bijgewerkt — geen stale closure in onend
  const [stemResultaat, setStemResultaat] = useState<{ categorie: string; urgentie: string; titel: string } | null>(null);
  const [stemVersturen, setStemVersturen] = useState(false);
  const recognitionRef = useRef<SpeechRec | null>(null);

  const toggleStem = () => {
    if (stemStatus === "luisteren") {
      recognitionRef.current?.stop();
      return;
    }

    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const SpeechRecCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecCtor) {
      setStemStatus("fout");
      setStemTekst("Spraakherkenning niet beschikbaar in deze browser.");
      return;
    }

    const rec = new SpeechRecCtor();
    rec.lang = "nl-NL";
    rec.continuous = true;
    rec.interimResults = false;
    recognitionRef.current = rec;
    stemTekstRef.current = "";
    setStemTekst("");

    rec.onstart = () => setStemStatus("luisteren");
    rec.onerror = () => { setStemStatus("fout"); setStemTekst("Kon je niet horen, probeer opnieuw."); };
    rec.onresult = (e) => {
      const tekst = Array.from(e.results, r => r[0].transcript)
        .join(" ")
        .trim();
      stemTekstRef.current = tekst;   // ref eerst — onend leest dit
      setStemTekst(tekst);
    };
    rec.onend = async () => {
      const tekst = stemTekstRef.current;
      if (!tekst) { setStemStatus("idle"); return; }

      setStemStatus("analyseren");
      try {
        const res = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beschrijving: tekst }),
        });
        const data = await res.json();
        if (data.categorie) {
          setStemResultaat(data);
          setStemStatus("bevestigen");
        } else {
          setStemStatus("fout");
          setStemTekst("AI kon dit niet verwerken. Probeer opnieuw.");
        }
      } catch {
        setStemStatus("fout");
        setStemTekst("Verbindingsfout, probeer opnieuw.");
      }
    };
    rec.start();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vakman hoort op /agenda, niet hier
  useEffect(() => {
    if (mounted && activeView === "vakman") {
      router.replace("/vakman");
    }
  }, [mounted, activeView, router]);

  // ── Live data laden ─────────────────────────────────────────
  const laadData = useCallback(async () => {
    if (!supabaseReady) return;
    let uid = userId;
    if (!uid) {
      const { data: { session } } = await supabase.auth.getSession();
      uid = session?.user?.id ?? null;
    }

    // Eigen lopende opdrachten (max 3)
    if (uid) {
      const { data } = await supabase
        .from("opdrachten")
        .select("*")
        .eq("klant_id", uid)
        .not("status", "in", '("afgerond","geannuleerd")')
        .order("created_at", { ascending: false })
        .limit(3);
      setMijnOpdrachten((data as Opdracht[]) ?? []);
    }

    // Vakmensen per categorie + spoed-beschikbaar — één query, client-side tellen
    const { data: vakliedenRaw } = await supabase
      .from("vakmensen")
      .select("specialty, beschikbaar, profiles(lat, lng)");
    if (vakliedenRaw) {
      const sLat = useUserStore.getState().lat;
      const sLng = useUserStore.getState().lng;
      const counts: Record<string, number> = {};
      let spoed = 0;
      for (const v of vakliedenRaw as unknown as { specialty: string | null; beschikbaar: boolean; profiles: { lat: number | null; lng: number | null } | null }[]) {
        // Binnen 30 km als beide locaties bekend zijn; anders telt iedereen mee
        const pLat = v.profiles?.lat;
        const pLng = v.profiles?.lng;
        const binnenBereik = sLat == null || sLng == null || pLat == null || pLng == null
          ? true
          : afstandKm(sLat, sLng, pLat, pLng) <= 30;
        if (!binnenBereik) continue;
        if (v.beschikbaar) spoed++;
        const sp = (v.specialty ?? "").toLowerCase();
        for (const cat of CATS) {
          if (sp.includes(cat.id) || sp.includes(cat.label.toLowerCase())) counts[cat.id] = (counts[cat.id] ?? 0) + 1;
        }
      }
      setCatCounts(counts);
      setSpoedCount(spoed);
    }
  }, [userId]);

  useEffect(() => { if (mounted) laadData(); }, [mounted, laadData]);

  // Realtime: eigen opdrachten live bijwerken
  useEffect(() => {
    if (!supabaseReady || !userId) return;
    const channel = supabase.channel("home_opdrachten")
      .on("postgres_changes", { event: "*", schema: "public", table: "opdrachten", filter: `klant_id=eq.${userId}` }, () => laadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, laadData]);

  // ── Locatie opslaan ─────────────────────────────────────────
  const gebruikGps = async () => {
    setLocBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const nLat = pos.coords.latitude;
      const nLng = pos.coords.longitude;
      setProfile({ lat: nLat, lng: nLng, address: locInput || address || "Mijn locatie" });
      if (supabaseReady && userId) {
        await supabase.from("profiles").update({ lat: nLat, lng: nLng, ...(locInput ? { address: locInput } : {}) } as never).eq("id", userId);
      }
      setLocOpen(false);
      laadData();
    } catch {
      alert("GPS niet beschikbaar — vul je adres handmatig in.");
    } finally {
      setLocBusy(false);
    }
  };

  const bewaarAdres = async () => {
    if (!locInput.trim()) return;
    setLocBusy(true);
    setProfile({ address: locInput.trim() });
    if (supabaseReady && userId) {
      await supabase.from("profiles").update({ address: locInput.trim() } as never).eq("id", userId);
    }
    setLocBusy(false);
    setLocOpen(false);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = (mounted && name) ? name.split(" ")[0] : "";
  const displayAddress = (mounted && address) ? address : "Stel je locatie in";
  const isKlant = !mounted || activeView === "klant";
  const hasBoth = role === "beide";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "var(--paper)" }}>

      {/* ── Header (scrollt mee) ── */}
      <div className="px-5 pt-14 pb-4">

        {/* Top row: location + role toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "0 0 2px" }}>
              {mounted ? `${greeting}${firstName ? `, ${firstName}` : ""}` : greeting} 👋
            </p>
            <button className="touch-scale" onClick={() => { setLocInput(address ?? ""); setLocOpen(true); }} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              <MapPin size={13} style={{ color: "var(--forest)" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{displayAddress}</span>
              <ChevronDown size={12} style={{ color: "var(--ink-fade)" }} />
            </button>
          </div>

          {hasBoth && (
            <button className="touch-scale" onClick={() => { const next = isKlant ? "vakman" : "klant"; setActiveView(next); router.push(next === "vakman" ? "/vakman" : "/"); }}
              style={{ display: "flex", padding: 3, background: "var(--accent-bg)", borderRadius: 99, border: "none", cursor: "pointer" }}>
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isKlant ? "var(--paper)" : "var(--ink-soft)",
                background: isKlant ? "var(--forest)" : "transparent",
                borderRadius: 99, fontWeight: isKlant ? 500 : 400,
                fontFamily: "'Inter', sans-serif",
              }}>Klant</span>
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isKlant ? "var(--ink-soft)" : "var(--paper)",
                background: isKlant ? "transparent" : "var(--forest)",
                borderRadius: 99, fontWeight: isKlant ? 400 : 500,
                fontFamily: "'Inter', sans-serif",
              }}>Vakman</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        <form onSubmit={e => { e.preventDefault(); router.push(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`); }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--surface)", border: "0.5px solid var(--border)",
            borderRadius: 10, padding: "11px 14px",
          }}>
            <Search size={16} style={{ color: "var(--ink-fade)", flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Zoek een vakman of dienst…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
                color: query ? "var(--ink)" : "var(--ink-fade)",
              }}
            />
          </div>
        </form>
      </div>

      {/* ── Locatie-editor sheet ── */}
      {locOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(26,29,26,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setLocOpen(false)}>
          <div className="animate-slide-up" onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 480, background: "var(--surface)",
            borderRadius: "20px 20px 0 0", padding: "20px 20px 32px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 400, margin: 0 }}>Jouw locatie</h3>
              <button onClick={() => setLocOpen(false)} className="touch-scale" style={{ background: "var(--accent-bg)", border: "none", borderRadius: 99, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={15} />
              </button>
            </div>
            <input
              type="text"
              value={locInput}
              onChange={e => setLocInput(e.target.value)}
              placeholder="Straat + stad, bv. Korenmarkt 1, Gent"
              style={{ width: "100%", padding: "12px 14px", background: "var(--paper)", border: "0.5px solid var(--border)", borderRadius: 10, fontSize: 14, marginBottom: 10 }}
            />
            <button onClick={bewaarAdres} disabled={locBusy || !locInput.trim()} className="touch-scale" style={{
              width: "100%", padding: "13px 0", background: "var(--forest)", color: "var(--paper)",
              border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 8,
              opacity: locBusy || !locInput.trim() ? 0.5 : 1,
            }}>
              {locBusy ? "Opslaan…" : "Adres opslaan"}
            </button>
            <button onClick={gebruikGps} disabled={locBusy} className="touch-scale" style={{
              width: "100%", padding: "13px 0", background: "transparent", color: "var(--forest)",
              border: "0.5px solid var(--forest)", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Crosshair size={15} /> {locBusy ? "Bezig…" : "Gebruik mijn GPS-locatie"}
            </button>
            <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "10px 0 0", textAlign: "center" }}>
              Je locatie bepaalt welke vakmensen je ziet.
            </p>
          </div>
        </div>
      )}

      <div className="px-5 pb-28">

        {/* Hero */}
        <h1 style={{
          fontFamily: SERIF, fontSize: 32, fontWeight: 400,
          margin: "0 0 22px", color: "var(--ink)", lineHeight: 1.1,
        }}>
          Wat heb je<br />
          <span style={{ color: "var(--ink-fade)", fontStyle: "italic" }}>nodig?</span>
        </h1>

        {/* Klus plaatsen CTA */}
        <Link href="/opdracht/nieuw" style={{ textDecoration: "none", display: "block", marginBottom: 14 }}>
          <div className="touch-scale" style={{
            background: "var(--forest)", color: "var(--paper)",
            borderRadius: 14, padding: "18px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>🔧</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: SERIF, fontSize: 17, margin: "0 0 3px" }}>Klus plaatsen</p>
              <p style={{ fontSize: 12, color: "rgba(245,239,229,0.65)", margin: 0 }}>
                Ontvang offertes van vakmensen bij jou in de buurt
              </p>
            </div>
            <ChevronRight size={18} style={{ color: "rgba(245,239,229,0.5)", flexShrink: 0 }} />
          </div>
        </Link>

        {/* Stem-opdracht kaart */}
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={toggleStem}
            style={{
              width: "100%", padding: "18px 20px",
              background: stemStatus === "luisteren" ? "var(--copper)" :
                          stemStatus === "analyseren" ? "var(--ink)" :
                          stemStatus === "bevestigen" ? "var(--forest)" : "var(--accent-bg)",
              borderRadius: 14, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14,
              transition: "all 0.2s",
            }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: stemStatus === "idle" ? "#D8D0C4" : "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {stemStatus === "luisteren"
                ? <MicOff size={20} style={{ color: "var(--paper)" }} />
                : <Mic size={20} style={{ color: stemStatus === "idle" ? "var(--ink-soft)" : "var(--paper)" }} />
              }
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{
                fontFamily: SERIF, fontSize: 16, margin: "0 0 3px",
                color: stemStatus === "idle" ? "var(--ink)" : "var(--paper)",
              }}>
                {stemStatus === "idle" ? "Spreek je klus in" :
                 stemStatus === "luisteren" ? "Luisteren… klik om te stoppen" :
                 stemStatus === "analyseren" ? "AI analyseert…" :
                 stemStatus === "bevestigen" ? "✓ Klus herkend!" : "Probeer opnieuw"}
              </p>
              <p style={{
                fontSize: 12, margin: 0,
                color: stemStatus === "idle" ? "var(--ink-fade)" : "rgba(245,239,229,0.65)",
              }}>
                {stemStatus === "idle" ? "Klik, spreek je klus in, klik opnieuw"
                  : stemStatus === "luisteren" ? (stemTekst || "Spreek nu… klik opnieuw om te stoppen")
                  : stemTekst || "Verwerken…"}
              </p>
            </div>
          </button>
        </div>

        {/* Bevestigingskaart na stem */}
        {stemStatus === "bevestigen" && stemResultaat && (
          <div style={{ background: "var(--ink)", borderRadius: 14, padding: 18, marginBottom: 14, color: "var(--paper)" }}>
            <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "0 0 8px" }}>AI herkende:</p>
            <p style={{ fontFamily: SERIF, fontSize: 20, margin: "0 0 4px" }}>{stemResultaat.titel || stemTekst}</p>
            <p style={{ fontSize: 12, color: "#B8B4A8", margin: "0 0 16px" }}>
              {stemResultaat.categorie} · {stemResultaat.urgentie === "hoog" ? "🔴 Spoed" : stemResultaat.urgentie === "laag" ? "🟢 Niet urgent" : "🟡 Normaal"}
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "0 0 14px", fontStyle: "italic" }}>&ldquo;{stemTekst}&rdquo;</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={stemVersturen}
                onClick={async () => {
                  setStemVersturen(true);
                  try {
                    let uid = useUserStore.getState().userId;
                    if (!uid && supabaseReady) {
                      const { data: { session } } = await supabase.auth.getSession();
                      uid = session?.user?.id ?? null;
                    }
                    if (!uid) { alert("Log eerst in"); setStemVersturen(false); return; }

                    // Locatie ophalen (gebruikt gecachede toestemming)
                    let opdrachtLat: number | null = null;
                    let opdrachtLng: number | null = null;
                    try {
                      const pos = await new Promise<GeolocationPosition>((res, rej) =>
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000, maximumAge: 3600000 })
                      );
                      opdrachtLat = pos.coords.latitude;
                      opdrachtLng = pos.coords.longitude;
                    } catch { /* geen locatie */ }

                    const { data: opdracht } = await supabase.from("opdrachten").insert({
                      klant_id: uid,
                      titel: stemResultaat.titel || stemTekst.slice(0, 60),
                      beschrijving: stemTekst,
                      categorie: stemResultaat.categorie,
                      urgentie: (stemResultaat.urgentie ?? "middel") as "laag" | "middel" | "hoog",
                      status: "open",
                      lat: opdrachtLat,
                      lng: opdrachtLng,
                    } as never).select("id").single();

                    // Stuur push notificatie naar vakmensen binnen straal
                    fetch("/api/push/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        categorie: stemResultaat.categorie,
                        titel: stemResultaat.titel || stemTekst.slice(0, 60),
                        beschrijving: stemTekst,
                        opdrachtId: (opdracht as { id: string } | null)?.id,
                        lat: opdrachtLat,
                        lng: opdrachtLng,
                      }),
                    });
                    setStemStatus("verzonden");
                    setTimeout(() => { setStemStatus("idle"); setStemTekst(""); setStemResultaat(null); }, 2000);
                    router.push("/mijn-opdrachten?nieuw=1");
                  } catch { setStemVersturen(false); }
                }}
                style={{ flex: 1, padding: "11px 0", background: stemVersturen ? "var(--ink-soft)" : "var(--forest)", color: "var(--paper)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                {stemVersturen ? "Versturen…" : "✓ Verstuur naar vakmensen"}
              </button>
              <button onClick={() => { setStemStatus("idle"); setStemTekst(""); setStemResultaat(null); setStemVersturen(false); }}
                style={{ padding: "11px 14px", background: "transparent", border: "0.5px solid var(--ink-soft)", color: "var(--ink-fade)", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {stemStatus === "verzonden" && (
          <div style={{ background: "var(--success-bg)", borderRadius: 14, padding: 16, marginBottom: 14, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "var(--forest)", margin: 0 }}>✓ Opdracht verstuurd naar alle vakmensen!</p>
          </div>
        )}

        {/* Spoed focus-card */}
        <Link href="/panic" style={{ textDecoration: "none", display: "block", marginBottom: 22 }}>
          <div className="touch-scale" style={{
            background: "var(--ink)", color: "var(--paper)",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "var(--copper)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Zap size={20} style={{ color: "var(--ink)" }} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>Spoedhulp nodig?</p>
              <p style={{ fontSize: 12, color: "#B8B4A8", margin: 0 }}>
                {spoedCount != null && spoedCount > 0
                  ? `${spoedCount} ${spoedCount === 1 ? "vakman" : "vakmensen"} nu beschikbaar`
                  : "Direct verbonden met een vakman"}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--ink-fade)", flexShrink: 0 }} />
          </div>
        </Link>

        {/* Categorie grid 2-koloms */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: "0 0 12px" }}>
            Categorieën
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CATS.map(cat => {
              const count = catCounts?.[cat.id] ?? 0;
              return (
                <Link key={cat.id} href={`/search?cat=${cat.id}`} style={{ textDecoration: "none" }}>
                  <div className="touch-scale" style={{
                    background: "var(--surface)", border: "0.5px solid var(--border)",
                    borderRadius: 12, padding: "14px 14px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "var(--ink)" }}>{cat.label}</p>
                      <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "1px 0 0" }}>
                        {catCounts == null ? "—" : count > 0 ? `${count} in de buurt` : "Plaats een opdracht"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {/* Meer tile */}
            <Link href="/search" style={{ textDecoration: "none" }}>
              <div className="touch-scale" style={{
                background: "var(--surface)", border: "0.5px solid var(--border)",
                borderRadius: 12, padding: "14px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🛠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "var(--ink)" }}>Meer</p>
                  <p style={{ fontSize: 11, color: "var(--ink-fade)", margin: "1px 0 0" }}>Alle categorieën</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Lopende opdrachten — live uit Supabase */}
        {mijnOpdrachten.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                Mijn lopende opdrachten
              </h2>
              <Link href="/mijn-opdrachten" style={{
                fontSize: 12, color: "var(--forest)", fontWeight: 500, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 2,
              }}>
                Alle <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mijnOpdrachten.map(op => {
                const urgent = op.urgentie === "hoog";
                return (
                  <Link key={op.id} href={`/opdracht/${op.id}`} style={{ textDecoration: "none" }}>
                    <div className="touch-scale" style={{
                      background: "var(--surface)", border: "0.5px solid var(--border)",
                      borderRadius: 12, padding: 14,
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: urgent ? "var(--copper)" : "var(--forest)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: SERIF, fontSize: 16,
                        color: urgent ? "var(--ink)" : "var(--paper)",
                        flexShrink: 0,
                      }}>
                        {op.titel.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {op.titel}
                        </p>
                        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "var(--ink-fade)", margin: "1px 0 0" }}>
                          {op.categorie ?? "Opdracht"} · {STATUS_LABEL[op.status] ?? op.status}
                        </p>
                      </div>

                      {op.status === "offerte_ontvangen" ? (
                        <span style={{
                          fontSize: 10, fontWeight: 500, padding: "3px 8px",
                          background: "var(--copper)", color: "var(--ink)",
                          borderRadius: 99, flexShrink: 0,
                        }}>Actie</span>
                      ) : op.budget ? (
                        <span style={{
                          fontFamily: SERIF, fontSize: 14, color: "var(--ink)", flexShrink: 0,
                        }}>{formatEuro(Number(op.budget) || 0)}</span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
