"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Navigation, QrCode } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, formatEuro, wazeUrl, stuurNotificatie } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";
const DAYS_NL = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const MONTHS_NL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

type BoekingRow = {
  id: string;
  klant_id: string;
  opdracht_id: string | null;
  status: string;
  start_tijd: string;
  eind_tijd: string | null;
  adres: string | null;
  bedrag: number | null;
  notities: string | null;
  profiles: { name: string; phone: string | null; address: string | null } | null;
  diensten: { naam: string } | null;
  opdrachten: { titel: string; lat: number | null; lng: number | null; adres: string | null } | null;
};

function tijdLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

export default function VandaagPage() {
  const { name, role, activeView, setActiveView, userId } = useUserStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [boekingen, setBoekingen] = useState<BoekingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bezig, setBezig] = useState<string | null>(null); // id van actieve boeking

  useEffect(() => { setMounted(true); }, []);

  const laad = useCallback(async () => {
    if (!userId || !supabaseReady) { setLoading(false); return; }
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0);
    const morgen = new Date(vandaag); morgen.setDate(morgen.getDate() + 1);

    const { data } = await supabase
      .from("boekingen")
      .select(`*, profiles!boekingen_klant_id_fkey(name, phone, address), diensten(naam), opdrachten(titel, lat, lng, adres)`)
      .eq("vakman_id", userId)
      .gte("start_tijd", vandaag.toISOString())
      .lt("start_tijd", morgen.toISOString())
      .in("status", ["gepland", "bezig", "ingecheckt"])
      .order("start_tijd");

    const rows = (data ?? []) as BoekingRow[];
    setBoekingen(rows);
    // Markeer de eerst-bezig/gepland als actief
    const actief = rows.find(b => b.status === "bezig") ?? rows[0] ?? null;
    if (actief) setBezig(actief.id);
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (mounted) laad(); }, [mounted, laad]);

  // Realtime: herlaad agenda als er een nieuwe boeking binnenkomt
  useEffect(() => {
    if (!supabaseReady || !userId) return;
    const channel = supabase
      .channel("agenda_realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "boekingen",
        filter: `vakman_id=eq.${userId}`,
      }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, laad]);

  const markeerKlaar = async (b: BoekingRow) => {
    setBoekingen(bs => bs.map(x => x.id === b.id ? { ...x, status: "afgerond" } : x));
    if (!supabaseReady) return;
    const nu = new Date().toISOString();
    await supabase.from("boekingen")
      .update({ status: "afgerond", eind_tijd: nu, afgerond_at: nu } as never)
      .eq("id", b.id);
    stuurNotificatie({
      user_id: b.klant_id,
      type: "klus_afgerond",
      titel: "Klus afgerond ✓",
      bericht: `${b.opdrachten?.titel ?? b.notities ?? "Je klus"} is klaar. Bevestig de afronding zodat de vakman uitbetaald wordt.`,
      link: b.opdracht_id ? `/opdracht/${b.opdracht_id}` : "/mijn-opdrachten",
    });
  };

  // Chat openen: vind (of maak) het gesprek met deze klant
  const openChat = async (b: BoekingRow) => {
    if (!supabaseReady || !userId) return;
    const { data: bestaandRaw } = await supabase
      .from("gesprekken")
      .select("id")
      .eq("klant_id", b.klant_id)
      .eq("vakman_id", userId)
      .order("laatste_tijd", { ascending: false })
      .limit(1)
      .maybeSingle();
    const bestaand = bestaandRaw as { id: string } | null;
    if (bestaand?.id) { router.push(`/chat/${bestaand.id}`); return; }
    const { data: nieuwRaw } = await supabase
      .from("gesprekken")
      .insert({
        klant_id: b.klant_id,
        vakman_id: userId,
        context: b.opdrachten?.titel ?? b.notities ?? "Klus",
        laatste_bericht: null,
        ongelezen_klant: 0,
        ongelezen_vakman: 0,
        gearchiveerd: false,
        boeking_id: b.id,
        spoed_id: null,
      } as never)
      .select("id")
      .single();
    const nieuw = nieuwRaw as { id: string } | null;
    if (nieuw?.id) router.push(`/chat/${nieuw.id}`);
  };

  // Waze: coördinaten van de opdracht, anders adres-zoekterm
  const openWaze = (b: BoekingRow) => {
    const url = wazeUrl(b.opdrachten?.lat, b.opdrachten?.lng, b.adres ?? b.opdrachten?.adres ?? b.profiles?.address);
    if (url) window.open(url, "_blank");
    else alert("Geen adres of locatie bekend voor deze klus.");
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Goedemorgen," : hour < 18 ? "Goedemiddag," : "Goedenavond,";
  const firstName = mounted && name ? name.split(" ")[0] : "";
  const dateStr = `${DAYS_NL[now.getDay()]} ${now.getDate()} ${MONTHS_NL[now.getMonth()]}`;
  const isVakman = mounted ? activeView === "vakman" : true;
  const hasBoth = role === "beide";

  const zichtbaar = boekingen.filter(b => b.status !== "afgerond");
  const nuBezig = zichtbaar.find(b => b.id === bezig);
  const daarna = zichtbaar.filter(b => b.id !== bezig);

  // Omzetberekening
  const omzet = boekingen.reduce((t, b) => t + (b.bedrag ?? 0), 0);
  const reisKm = boekingen.length * 2.5; // schatting

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#8A8A83", margin: 0 }}>{greeting}</p>
            <p style={{ fontSize: 16, fontWeight: 500, margin: "2px 0 0", color: "#1A1D1A" }}>{firstName}</p>
          </div>
          {hasBoth && (
            <button style={{ padding: 3, background: "#EDE4D2", borderRadius: 99, border: "none", cursor: "pointer", display: "flex" }}
              onClick={() => { const next = isVakman ? "klant" : "vakman"; setActiveView(next); router.push(next === "klant" ? "/" : "/agenda"); }}>
              <span style={{ fontSize: 11, padding: "5px 11px", color: isVakman ? "#5C5C56" : "#F5EFE5", background: isVakman ? "transparent" : "#2B4030", borderRadius: 99, fontWeight: isVakman ? 400 : 500 }}>Klant</span>
              <span style={{ fontSize: 11, padding: "5px 11px", color: isVakman ? "#F5EFE5" : "#5C5C56", background: isVakman ? "#2B4030" : "transparent", borderRadius: 99, fontWeight: isVakman ? 500 : 400 }}>Vakman</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-28">
        <p style={{ fontSize: 11, color: "#8A8A83", margin: "0 0 4px" }}>{dateStr}</p>

        {loading ? (
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: "#8A8A83", margin: "0 0 26px" }}>Laden…</p>
        ) : (
          <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, margin: "0 0 26px", color: "#1A1D1A", lineHeight: 1.05 }}>
            {zichtbaar.length === 0
              ? <><span style={{ color: "#8A8A83", fontStyle: "italic" }}>Geen klussen</span><br />vandaag.</>
              : <>{zichtbaar.length} klus{zichtbaar.length !== 1 ? "sen" : ""}<br /><span style={{ color: "#8A8A83", fontStyle: "italic" }}>vandaag.</span></>
            }
          </h1>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: "#E5DDD0", gap: "0.5px", borderRadius: 12, overflow: "hidden", marginBottom: 26 }}>
          {[
            { label: "Klussen", value: String(zichtbaar.length), color: "#1A1D1A" },
            { label: "Reizen",  value: `${reisKm.toFixed(0)} km`, color: "#1A1D1A" },
            { label: "Omzet",   value: formatEuro(omzet), color: "#2B4030" },
          ].map(s => (
            <div key={s.label} style={{ background: "#FBF7F0", padding: "14px 10px" }}>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: 0 }}>{s.label}</p>
              <p style={{ fontFamily: SERIF, fontSize: 22, margin: "4px 0 0", color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Nu bezig */}
        {nuBezig && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#C97A4D", flexShrink: 0 }} />
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: 0 }}>Nu bezig</p>
            </div>
            <div style={{ background: "#1A1D1A", color: "#F5EFE5", borderRadius: 14, padding: 18, marginBottom: 26 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: "#8A8A83", margin: 0 }}>
                  {tijdLabel(nuBezig.start_tijd)}{nuBezig.eind_tijd ? ` – ${tijdLabel(nuBezig.eind_tijd)}` : ""}
                </p>
                {nuBezig.status === "bezig" && (
                  <span style={{ fontSize: 11, padding: "3px 9px", background: "#C97A4D", color: "#1A1D1A", borderRadius: 99, fontWeight: 500 }}>Bezig</span>
                )}
              </div>
              <p style={{ fontFamily: SERIF, fontSize: 22, margin: "6px 0 3px" }}>
                {nuBezig.opdrachten?.titel ?? nuBezig.diensten?.naam ?? nuBezig.notities ?? "Klus"}
              </p>
              <p style={{ fontSize: 12, color: "#B8B4A8", margin: "0 0 18px" }}>
                {nuBezig.profiles?.name ?? "Klant"} · {nuBezig.adres ?? nuBezig.opdrachten?.adres ?? nuBezig.profiles?.address ?? "Adres onbekend"}
                {nuBezig.bedrag ? ` · ${formatEuro(nuBezig.bedrag)}` : ""}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {nuBezig.status === "gepland" ? (
                  <button onClick={() => router.push("/inchecken")} style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 500, background: "#C97A4D", color: "#1A1D1A", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <QrCode size={15} /> Inchecken op locatie
                  </button>
                ) : (
                  <button onClick={() => markeerKlaar(nuBezig)} style={{ flex: 1, padding: 11, fontSize: 13, fontWeight: 500, background: "#C97A4D", color: "#1A1D1A", border: "none", borderRadius: 10, cursor: "pointer" }}>
                    Klaar markeren
                  </button>
                )}
                <button onClick={() => openChat(nuBezig)} aria-label="Chat met klant" style={{ padding: "11px 12px", background: "transparent", color: "#F5EFE5", border: "0.5px solid #5C5C56", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <MessageCircle size={15} />
                </button>
                <button onClick={() => openWaze(nuBezig)} aria-label="Navigeer met Waze" style={{ padding: "11px 12px", background: "transparent", color: "#F5EFE5", border: "0.5px solid #5C5C56", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <Navigation size={15} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Daarna */}
        {daarna.length > 0 && (
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 0" }}>Daarna</p>
        )}
        {daarna.map(b => (
          <div key={b.id} style={{ display: "flex", padding: "14px 0", borderTop: "0.5px solid #E5DDD0", alignItems: "baseline" }}>
            <div style={{ width: 44, fontFamily: SERIF, fontSize: 16, color: "#1A1D1A", flexShrink: 0 }}>
              {tijdLabel(b.start_tijd)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{b.opdrachten?.titel ?? b.diensten?.naam ?? b.notities ?? "Klus"}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>
                {b.profiles?.name ?? "Klant"} · {b.adres ?? b.opdrachten?.adres ?? b.profiles?.address ?? ""}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {b.bedrag ? (
                <span style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030" }}>{formatEuro(b.bedrag)}</span>
              ) : null}
              <button onClick={() => openWaze(b)} aria-label="Navigeer met Waze" className="touch-scale" style={{ padding: 7, background: "transparent", border: "0.5px solid #E5DDD0", borderRadius: 99, cursor: "pointer", display: "flex", color: "#2B4030" }}>
                <Navigation size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Leeg scherm */}
        {!loading && zichtbaar.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <p style={{ fontSize: 13, color: "#8A8A83" }}>Vrij vandaag — geen boekingen gepland.</p>
          </div>
        )}
      </div>
    </div>
  );
}
