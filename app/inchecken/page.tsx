"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { ArrowLeft, QrCode, Camera, CheckCircle2, KeyRound, MapPin, Clock } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady, formatEuro, stuurNotificatie } from "@/lib/supabase";

const SERIF = "'Source Serif 4', Georgia, serif";
const QR_PREFIX = "servr:checkin:";

type BoekingRij = {
  id: string;
  klant_id: string;
  vakman_id: string;
  status: string;
  start_tijd: string;
  adres: string | null;
  bedrag: number | null;
  notities: string | null;
  opdracht_id: string | null;
  profiles: { name: string } | null;
  opdrachten: { titel: string; adres: string | null } | null;
};

function tijdLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

/** Korte incheckcode: eerste 6 tekens van het boeking-ID */
function korteCode(id: string) {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
}

function titelVan(b: BoekingRij) {
  return b.opdrachten?.titel ?? b.notities ?? "Klus";
}

// ─── Vandaag-boekingen laden voor een rol ──────────────────────
function useVandaagBoekingen(rol: "klant" | "vakman") {
  const { userId } = useUserStore();
  const [boekingen, setBoekingen] = useState<BoekingRij[]>([]);
  const [loading, setLoading] = useState(true);

  const laad = useCallback(async () => {
    if (!userId || !supabaseReady) { setLoading(false); return; }
    const vandaag = new Date(); vandaag.setHours(0, 0, 0, 0);
    const morgen = new Date(vandaag); morgen.setDate(morgen.getDate() + 1);
    const field = rol === "vakman" ? "vakman_id" : "klant_id";
    const naamJoin = rol === "vakman"
      ? "profiles!boekingen_klant_id_fkey(name)"
      : "profiles!boekingen_vakman_id_fkey(name)";

    const { data } = await supabase
      .from("boekingen")
      .select(`*, ${naamJoin}, opdrachten(titel, adres)`)
      .eq(field, userId)
      .gte("start_tijd", vandaag.toISOString())
      .lt("start_tijd", morgen.toISOString())
      .in("status", ["gepland", "ingecheckt", "bezig"])
      .order("start_tijd");
    setBoekingen((data as unknown as BoekingRij[]) ?? []);
    setLoading(false);
  }, [userId, rol]);

  useEffect(() => { laad(); }, [laad]);

  // Realtime status-updates (incheck verschijnt live bij beide partijen)
  useEffect(() => {
    if (!supabaseReady || !userId) return;
    const channel = supabase.channel(`inchecken_${rol}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "boekingen" }, () => laad())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, rol, laad]);

  return { boekingen, loading, laad };
}

// ─── Incheck uitvoeren ─────────────────────────────────────────
async function checkIn(b: BoekingRij): Promise<string | null> {
  const nu = new Date().toISOString();
  const { error } = await supabase
    .from("boekingen")
    .update({ status: "ingecheckt", ingecheckt_at: nu } as never)
    .eq("id", b.id)
    .eq("status", "gepland");   // dubbel inchecken onmogelijk
  if (error) return error.message;
  stuurNotificatie({
    user_id: b.klant_id,
    type: "ingecheckt",
    titel: "Vakman is gearriveerd ✓",
    bericht: `${titelVan(b)} — de vakman is ingecheckt en gaat aan de slag.`,
    link: b.opdracht_id ? `/opdracht/${b.opdracht_id}` : "/mijn-opdrachten",
  });
  stuurNotificatie({
    user_id: b.vakman_id,
    type: "ingecheckt",
    titel: "Ingecheckt ✓",
    bericht: `${titelVan(b)} staat nu op "in uitvoering".`,
    link: "/agenda",
  });
  return null;
}

// ─── QR-canvas ─────────────────────────────────────────────────
function QrCanvas({ value }: { value: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, value, { width: 220, margin: 2, color: { dark: "#1A1D1A", light: "#FBF7F0" } });
    }
  }, [value]);
  return <canvas ref={ref} style={{ borderRadius: 12 }} />;
}

// ═══ VAKMAN: toont QR per klus van vandaag ═════════════════════
function VakmanView() {
  const { boekingen, loading } = useVandaagBoekingen("vakman");
  const [actieveQr, setActieveQr] = useState<string | null>(null);

  const open = boekingen.filter(b => b.status === "gepland");
  const ingecheckt = boekingen.filter(b => b.status !== "gepland");

  return (
    <div className="px-5 pb-28">
      <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 18px" }}>
        Toon de QR-code aan je klant bij aankomst — of geef de cijfercode door.
      </p>

      {loading && <div className="skeleton" style={{ height: 90, marginBottom: 10 }} />}

      {!loading && boekingen.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>📅</p>
          <p style={{ fontFamily: SERIF, fontSize: 17, color: "#1A1D1A", margin: "0 0 6px" }}>Geen klussen vandaag</p>
          <p style={{ fontSize: 13, color: "#8A8A83" }}>Boekingen van vandaag verschijnen hier met hun incheck-QR.</p>
        </div>
      )}

      {open.map(b => (
        <div key={b.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{titelVan(b)}</p>
              <p style={{ fontSize: 12, color: "#8A8A83", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {tijdLabel(b.start_tijd)}
                {(b.adres ?? b.opdrachten?.adres) && <><MapPin size={11} style={{ marginLeft: 6 }} /> {b.adres ?? b.opdrachten?.adres}</>}
              </p>
            </div>
            {b.bedrag != null && <span style={{ fontFamily: SERIF, fontSize: 16, color: "#2B4030" }}>{formatEuro(b.bedrag)}</span>}
          </div>

          {actieveQr === b.id ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 12 }}>
              <QrCanvas value={`${QR_PREFIX}${b.id}`} />
              <p style={{ fontSize: 12, color: "#8A8A83", margin: 0 }}>Of laat de klant deze code invoeren:</p>
              <p style={{ fontFamily: SERIF, fontSize: 28, letterSpacing: 6, margin: 0, color: "#1A1D1A" }}>{korteCode(b.id)}</p>
              <button onClick={() => setActieveQr(null)} className="touch-scale" style={{ fontSize: 12, color: "#8A8A83", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Verbergen
              </button>
            </div>
          ) : (
            <button onClick={() => setActieveQr(b.id)} className="touch-scale" style={{
              width: "100%", marginTop: 10, padding: "12px 0", background: "#2B4030", color: "#F5EFE5",
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <QrCode size={15} /> QR tonen aan klant
            </button>
          )}
        </div>
      ))}

      {ingecheckt.length > 0 && (
        <>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "20px 0 10px" }}>Ingecheckt</p>
          {ingecheckt.map(b => (
            <div key={b.id} style={{ background: "#EAF0EC", borderRadius: 14, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <CheckCircle2 size={20} style={{ color: "#2B4030", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{titelVan(b)}</p>
                <p style={{ fontSize: 12, color: "#5C5C56", margin: "2px 0 0" }}>In uitvoering — markeer als klaar via je agenda.</p>
              </div>
              <Link href="/agenda" style={{ fontSize: 12, fontWeight: 500, color: "#2B4030", textDecoration: "underline", flexShrink: 0 }}>Agenda</Link>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ═══ KLANT: scant QR of voert code in ══════════════════════════
function KlantView() {
  const { boekingen, loading, laad } = useVandaagBoekingen("klant");
  const [code, setCode] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [succes, setSucces] = useState<BoekingRij | null>(null);
  const [bezig, setBezig] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);

  const open = boekingen.filter(b => b.status === "gepland");

  const valideerEnCheckIn = async (b: BoekingRij | undefined, foutmelding: string) => {
    if (!b) { setFout(foutmelding); return; }
    setBezig(true);
    const err = await checkIn(b);
    setBezig(false);
    if (err) { setFout("Inchecken mislukt: " + err); return; }
    setSucces(b);
    setFout(null);
    laad();
  };

  // QR uit foto decoderen met jsQR
  const scanFoto = async (file: File) => {
    setFout(null);
    setBezig(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      // Schaal naar max 1000px voor snelheid
      const schaal = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * schaal);
      canvas.height = Math.round(bitmap.height * schaal);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imgData.data, imgData.width, imgData.height);
      setBezig(false);

      if (!result?.data?.startsWith(QR_PREFIX)) {
        setFout("Geen geldige Servr QR-code gevonden op de foto. Probeer opnieuw of voer de cijfercode in.");
        return;
      }
      const boekingId = result.data.slice(QR_PREFIX.length);
      await valideerEnCheckIn(
        open.find(b => b.id === boekingId),
        "Deze QR-code hoort niet bij een van jouw boekingen van vandaag."
      );
    } catch {
      setBezig(false);
      setFout("Kon de foto niet verwerken. Probeer opnieuw.");
    }
  };

  const checkCode = async () => {
    const ingevoerd = code.trim().toUpperCase();
    if (ingevoerd.length < 6) { setFout("Voer de volledige 6-cijferige code in."); return; }
    await valideerEnCheckIn(
      open.find(b => korteCode(b.id) === ingevoerd),
      "Code niet herkend. Controleer de code bij je vakman."
    );
  };

  if (succes) return (
    <div className="px-5 pb-28 animate-bounce-in" style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#2B4030", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <CheckCircle2 size={36} color="#F5EFE5" />
      </div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: "0 0 8px", color: "#1A1D1A" }}>Vakman ingecheckt!</h2>
      <p style={{ fontSize: 14, color: "#8A8A83", margin: "0 0 24px" }}>
        {titelVan(succes)} staat nu op &ldquo;in uitvoering&rdquo;.<br />Je krijgt bericht zodra de klus klaar is.
      </p>
      <Link href="/mijn-opdrachten" className="touch-scale" style={{
        display: "inline-block", padding: "13px 28px", background: "#2B4030", color: "#F5EFE5",
        borderRadius: 10, fontSize: 14, fontWeight: 500, textDecoration: "none",
      }}>
        Naar mijn opdrachten
      </Link>
    </div>
  );

  return (
    <div className="px-5 pb-28">
      <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 18px" }}>
        Is je vakman gearriveerd? Scan zijn QR-code of voer de cijfercode in om de start van de klus te bevestigen.
      </p>

      {loading && <div className="skeleton" style={{ height: 90, marginBottom: 10 }} />}

      {!loading && open.length === 0 && (
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>📅</p>
          <p style={{ fontFamily: SERIF, fontSize: 17, color: "#1A1D1A", margin: "0 0 6px" }}>Geen boeking vandaag</p>
          <p style={{ fontSize: 13, color: "#8A8A83" }}>Zodra een vakman voor vandaag is ingepland, kan je hier inchecken.</p>
        </div>
      )}

      {open.length > 0 && (
        <>
          {/* Vandaag gepland */}
          {open.map(b => (
            <div key={b.id} style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={16} style={{ color: "#C97A4D", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#1A1D1A" }}>{titelVan(b)}</p>
                <p style={{ fontSize: 12, color: "#8A8A83", margin: "2px 0 0" }}>{b.profiles?.name ?? "Vakman"} · {tijdLabel(b.start_tijd)}</p>
              </div>
            </div>
          ))}

          {/* Scan knop */}
          <button onClick={() => cameraRef.current?.click()} disabled={bezig} className="touch-scale" style={{
            width: "100%", marginTop: 8, padding: "16px 0", background: "#2B4030", color: "#F5EFE5",
            border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: bezig ? 0.6 : 1,
          }}>
            <Camera size={17} /> {bezig ? "Verwerken…" : "Scan QR-code van vakman"}
          </button>
          <input
            ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) { scanFoto(e.target.files[0]); e.target.value = ""; } }}
          />

          {/* Handmatige code */}
          <div style={{ marginTop: 16, background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#8A8A83", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <KeyRound size={13} /> OF VOER DE CODE IN
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setFout(null); }}
                placeholder="bv. 4F7A2B"
                maxLength={6}
                style={{
                  flex: 1, padding: "12px 14px", background: "#F5EFE5", border: "0.5px solid #E5DDD0",
                  borderRadius: 10, fontSize: 16, letterSpacing: 4, fontFamily: SERIF, textTransform: "uppercase",
                }}
              />
              <button onClick={checkCode} disabled={bezig || code.trim().length < 6} className="touch-scale" style={{
                padding: "12px 18px", background: code.trim().length >= 6 ? "#C97A4D" : "#E5DDD0",
                color: code.trim().length >= 6 ? "#1A1D1A" : "#8A8A83",
                border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Check in
              </button>
            </div>
          </div>

          {fout && (
            <div style={{ marginTop: 12, padding: "12px 14px", background: "#F9EDEA", borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: "#dc2626", margin: 0 }}>{fout}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══ PAGE ══════════════════════════════════════════════════════
export default function IncheckenPage() {
  const { activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVakman = mounted && activeView === "vakman";

  return (
    <div style={{ minHeight: "100dvh", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={isVakman ? "/agenda" : "/mijn-opdrachten"} className="touch-scale" style={{
          width: 36, height: 36, borderRadius: "50%", background: "#EDE4D2",
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
        }}>
          <ArrowLeft size={17} color="#1A1D1A" />
        </Link>
        <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>
          {isVakman ? "QR Check-in" : "Vakman inchecken"}
        </h2>
      </div>
      {!mounted ? null : isVakman ? <VakmanView /> : <KlantView />}
    </div>
  );
}
