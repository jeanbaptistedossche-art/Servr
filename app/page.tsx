"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ChevronDown, Search, Zap, ChevronRight, Mic, MicOff } from "lucide-react";
import { useUserStore } from "@/lib/store";

const SERIF = "'Source Serif 4', Georgia, serif";

// ── Categorieën (2-koloms grid, PDF spec) ─────────────────────
const CATS = [
  { id: "loodgieter",  label: "Loodgieter",  emoji: "🔧", count: 8  },
  { id: "elektricien", label: "Elektricien", emoji: "⚡", count: 12 },
  { id: "schilder",    label: "Schilder",    emoji: "🖌️", count: 5  },
  { id: "schoonmaak",  label: "Schoonmaak",  emoji: "🧹", count: 14 },
  { id: "tuinman",     label: "Tuinier",     emoji: "🌿", count: 6  },
  { id: "klusser",     label: "Klusser",     emoji: "🔨", count: 9  },
];

// ── Lopende opdrachten mock ───────────────────────────────────
const OPDRACHTEN = [
  {
    id: "o1",
    vakman: "Marco van den Berg",
    beroep: "Loodgieter",
    omschrijving: "CV-ketel inspectie",
    status: "Bezig",
    bedrag: "€95",
    urgent: true,
  },
  {
    id: "o2",
    vakman: "Kim Nguyen",
    beroep: "Schilder",
    omschrijving: "Schilderwerk woonkamer",
    status: "Gepland",
    bedrag: "€350",
    urgent: false,
  },
];

export default function KlantHomePage() {
  const { name, address, role, activeView, setActiveView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Stem-opdracht
  const [stemStatus, setStemStatus] = useState<"idle" | "luisteren" | "analyseren" | "bevestigen" | "verzonden" | "fout">("idle");
  const [stemTekst, setStemTekst] = useState("");
  const [stemResultaat, setStemResultaat] = useState<{ categorie: string; urgentie: string; titel: string } | null>(null);
  const [stemVersturen, setStemVersturen] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleStem = () => {
    if (stemStatus === "luisteren") {
      // Stop opname
      recognitionRef.current?.stop();
      setStemStatus("idle");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStemStatus("fout");
      setStemTekst("Spraakherkenning niet beschikbaar in deze browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "nl-NL";
    rec.continuous = true;   // blijft luisteren tot je zelf stopt
    rec.interimResults = false;
    recognitionRef.current = rec;

    rec.onstart = () => setStemStatus("luisteren");
    rec.onerror = () => { setStemStatus("fout"); setStemTekst("Kon je niet horen, probeer opnieuw."); };
    rec.onresult = async (e: any) => {
      // Neem het laatste resultaat
      const tekst = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      setStemTekst(tekst);
    };
    rec.onend = async () => {
      if (!stemTekst && recognitionRef.current?.stemTekstRef) return;
      const tekst = stemTekst || (recognitionRef.current as any)._lastTekst;
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
      router.replace("/agenda");
    }
  }, [mounted, activeView, router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
  const firstName = (mounted && name) ? name.split(" ")[0] : "";
  const displayAddress = (mounted && address) ? address : "Amsterdam";
  const isKlant = !mounted || activeView === "klant";
  const hasBoth = role === "beide";

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5" }}>

      {/* ── Header (scrollt mee) ── */}
      <div className="px-5 pt-14 pb-4">

        {/* Top row: location + role toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 2px" }}>
              {mounted ? `${greeting}${firstName ? `, ${firstName}` : ""}` : greeting} 👋
            </p>
            <button className="touch-scale" style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              <MapPin size={13} style={{ color: "#2B4030" }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1D1A" }}>{displayAddress}</span>
              <ChevronDown size={12} style={{ color: "#8A8A83" }} />
            </button>
          </div>

          {hasBoth && (
            <button className="touch-scale" onClick={() => { const next = isKlant ? "vakman" : "klant"; setActiveView(next); router.push(next === "vakman" ? "/agenda" : "/"); }}
              style={{ display: "flex", padding: 3, background: "#EDE4D2", borderRadius: 99, border: "none", cursor: "pointer" }}>
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isKlant ? "#F5EFE5" : "#5C5C56",
                background: isKlant ? "#2B4030" : "transparent",
                borderRadius: 99, fontWeight: isKlant ? 500 : 400,
                fontFamily: "'Inter', sans-serif",
              }}>Klant</span>
              <span style={{
                fontSize: 11, padding: "5px 11px",
                color: isKlant ? "#5C5C56" : "#F5EFE5",
                background: isKlant ? "transparent" : "#2B4030",
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
            background: "#FBF7F0", border: "0.5px solid #E5DDD0",
            borderRadius: 10, padding: "11px 14px",
          }}>
            <Search size={16} style={{ color: "#8A8A83", flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Zoek een vakman of dienst…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: SERIF, fontStyle: "italic", fontSize: 14,
                color: query ? "#1A1D1A" : "#8A8A83",
              }}
            />
          </div>
        </form>
      </div>

      <div className="px-5 pb-28">

        {/* Hero */}
        <h1 style={{
          fontFamily: SERIF, fontSize: 32, fontWeight: 400,
          margin: "0 0 22px", color: "#1A1D1A", lineHeight: 1.1,
        }}>
          Wat heb je<br />
          <span style={{ color: "#8A8A83", fontStyle: "italic" }}>nodig?</span>
        </h1>

        {/* Klus plaatsen CTA */}
        <Link href="/opdracht/nieuw" style={{ textDecoration: "none", display: "block", marginBottom: 14 }}>
          <div className="touch-scale" style={{
            background: "#2B4030", color: "#F5EFE5",
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
              background: stemStatus === "luisteren" ? "#C97A4D" :
                          stemStatus === "analyseren" ? "#1A1D1A" :
                          stemStatus === "bevestigen" ? "#2B4030" : "#EDE4D2",
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
                ? <MicOff size={20} style={{ color: "#F5EFE5" }} />
                : <Mic size={20} style={{ color: stemStatus === "idle" ? "#5C5C56" : "#F5EFE5" }} />
              }
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{
                fontFamily: SERIF, fontSize: 16, margin: "0 0 3px",
                color: stemStatus === "idle" ? "#1A1D1A" : "#F5EFE5",
              }}>
                {stemStatus === "idle" ? "Spreek je klus in" :
                 stemStatus === "luisteren" ? "Luisteren… laat los om te stoppen" :
                 stemStatus === "analyseren" ? "AI analyseert…" :
                 stemStatus === "bevestigen" ? "✓ Klus herkend!" : "Probeer opnieuw"}
              </p>
              <p style={{
                fontSize: 12, margin: 0,
                color: stemStatus === "idle" ? "#8A8A83" : "rgba(245,239,229,0.65)",
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
          <div style={{ background: "#1A1D1A", borderRadius: 14, padding: 18, marginBottom: 14, color: "#F5EFE5" }}>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 8px" }}>AI herkende:</p>
            <p style={{ fontFamily: SERIF, fontSize: 20, margin: "0 0 4px" }}>{stemResultaat.titel || stemTekst}</p>
            <p style={{ fontSize: 12, color: "#B8B4A8", margin: "0 0 16px" }}>
              {stemResultaat.categorie} · {stemResultaat.urgentie === "hoog" ? "🔴 Spoed" : stemResultaat.urgentie === "laag" ? "🟢 Niet urgent" : "🟡 Normaal"}
            </p>
            <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 14px", fontStyle: "italic" }}>"{stemTekst}"</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                disabled={stemVersturen}
                onClick={async () => {
                  setStemVersturen(true);
                  try {
                    const { supabase: sb, supabaseReady: ready } = await import("@/lib/supabase");
                    const { useUserStore: us } = await import("@/lib/store");
                    let userId = us.getState().userId;
                    if (!userId && ready) {
                      const { data: { session } } = await sb.auth.getSession();
                      userId = session?.user?.id ?? null;
                    }
                    if (!userId) { alert("Log eerst in"); setStemVersturen(false); return; }
                    const { data: opdracht } = await (sb.from("opdrachten") as any).insert({
                      klant_id: userId,
                      titel: stemResultaat.titel || stemTekst.slice(0, 60),
                      beschrijving: stemTekst,
                      categorie: stemResultaat.categorie,
                      urgentie: stemResultaat.urgentie ?? "middel",
                      status: "open",
                    }).select("id").single();

                    // Stuur push notificatie naar alle vakmensen van die categorie
                    fetch("/api/push/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        categorie: stemResultaat.categorie,
                        titel: stemResultaat.titel || stemTekst.slice(0, 60),
                        beschrijving: stemTekst,
                        opdrachtId: opdracht?.id,
                      }),
                    });
                    setStemStatus("verzonden");
                    setTimeout(() => { setStemStatus("idle"); setStemTekst(""); setStemResultaat(null); }, 2000);
                    router.push("/mijn-opdrachten?nieuw=1");
                  } catch { setStemVersturen(false); }
                }}
                style={{ flex: 1, padding: "11px 0", background: stemVersturen ? "#5C5C56" : "#2B4030", color: "#F5EFE5", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                {stemVersturen ? "Versturen…" : "✓ Verstuur naar vakmensen"}
              </button>
              <button onClick={() => { setStemStatus("idle"); setStemTekst(""); setStemResultaat(null); setStemVersturen(false); }}
                style={{ padding: "11px 14px", background: "transparent", border: "0.5px solid #5C5C56", color: "#8A8A83", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {stemStatus === "verzonden" && (
          <div style={{ background: "#EAF0EC", borderRadius: 14, padding: 16, marginBottom: 14, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: "#2B4030", margin: 0 }}>✓ Opdracht verstuurd naar alle vakmensen!</p>
          </div>
        )}

        {/* Spoed focus-card */}
        <Link href="/panic" style={{ textDecoration: "none", display: "block", marginBottom: 22 }}>
          <div className="touch-scale" style={{
            background: "#1A1D1A", color: "#F5EFE5",
            borderRadius: 14, padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "#C97A4D",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Zap size={20} style={{ color: "#1A1D1A" }} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 2px" }}>Spoedhulp nodig?</p>
              <p style={{ fontSize: 12, color: "#B8B4A8", margin: 0 }}>
                8 vakmensen beschikbaar in de buurt
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "#8A8A83", flexShrink: 0 }} />
          </div>
        </Link>

        {/* Categorie grid 2-koloms */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: "0 0 12px" }}>
            Categorieën
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {CATS.map(cat => (
              <Link key={cat.id} href={`/search?cat=${cat.id}`} style={{ textDecoration: "none" }}>
                <div className="touch-scale" style={{
                  background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                  borderRadius: 12, padding: "14px 14px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{cat.label}</p>
                    <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                      {cat.count} in de buurt
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {/* Meer tile */}
            <Link href="/search" style={{ textDecoration: "none" }}>
              <div className="touch-scale" style={{
                background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                borderRadius: 12, padding: "14px 14px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🛠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>Meer</p>
                  <p style={{ fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>Alle categorieën</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Lopende opdrachten */}
        {OPDRACHTEN.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: 0 }}>
                Mijn lopende opdrachten
              </h2>
              <Link href="/klussen" style={{
                fontSize: 12, color: "#2B4030", fontWeight: 500, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 2,
              }}>
                Alle <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {OPDRACHTEN.map(op => (
                <Link key={op.id} href={`/opdracht/${op.id}`} style={{ textDecoration: "none" }}>
                  <div className="touch-scale" style={{
                    background: "#FBF7F0", border: "0.5px solid #E5DDD0",
                    borderRadius: 12, padding: 14,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: op.urgent ? "#C97A4D" : "#2B4030",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: SERIF, fontSize: 16,
                      color: op.urgent ? "#1A1D1A" : "#F5EFE5",
                      flexShrink: 0,
                    }}>
                      {op.vakman.charAt(0)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {op.vakman}
                      </p>
                      <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: "#8A8A83", margin: "1px 0 0" }}>
                        {op.beroep} · {op.omschrijving}
                      </p>
                    </div>

                    {/* Status badge or amount */}
                    {op.urgent ? (
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: "3px 8px",
                        background: "#C97A4D", color: "#1A1D1A",
                        borderRadius: 99, flexShrink: 0,
                      }}>Actie</span>
                    ) : (
                      <span style={{
                        fontFamily: SERIF, fontSize: 14, color: "#1A1D1A", flexShrink: 0,
                      }}>{op.bedrag}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
