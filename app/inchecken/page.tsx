"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, QrCode, CheckCircle, MapPin, Clock, Check, X, Camera, CreditCard, ScanLine } from "lucide-react";
import { useUserStore } from "@/lib/store";
import Link from "next/link";

const SERIF = "'Source Serif 4', Georgia, serif";

// ─── Vakman data ──────────────────────────────────────────────────────────────
const TODAY_KLUSSEN = [
  { id: "k1", titel: "Lekkende kraan keuken",  klant: "Lisa de Vries",  adres: "Prinsengracht 88",        tijd: "09:00", betaald: true },
  { id: "k2", titel: "CV ketel inspectie",     klant: "Ahmed Mansour", adres: "Ferdinand Bolstraat 45",  tijd: "13:30", betaald: false },
  { id: "k3", titel: "Woonkamer schilderen",   klant: "Petra Jansen",  adres: "Kinkerstraat 120",        tijd: "08:00", betaald: true },
];

// QR-code lookup voor demo (in productie: Supabase query)
const QR_DATABASE: Record<string, { dienst: string; vakman: string; bedrag: number; betaald: boolean; betalingId: string }> = {
  "SERVR-K1-2026-LISA-KRAAN":    { dienst: "Lekkende kraan keuken",  vakman: "Marco van den Berg", bedrag: 85,  betaald: true,  betalingId: "OFF-1040" },
  "SERVR-K2-2026-AHMED-CV":      { dienst: "CV ketel inspectie",     vakman: "Marco van den Berg", bedrag: 99,  betaald: false, betalingId: "OFF-1041" },
  "SERVR-K3-2026-PETRA-SCHILDER":{ dienst: "Woonkamer schilderen",   vakman: "Kim Nguyen",         bedrag: 350, betaald: false, betalingId: "OFF-1042" },
};

// ─── QR code display (vakman toont dit aan klant) ─────────────────────────────
function QrDisplay({ klus }: { klus: typeof TODAY_KLUSSEN[0] }) {
  const [getoond, setGetoond] = useState(false);
  const code = `SERVR-${klus.id.toUpperCase()}-2026-${klus.klant.split(" ")[0].toUpperCase()}-${klus.titel.split(" ").pop()?.toUpperCase()}`;

  return (
    <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: "#1A1D1A" }}>{klus.titel}</p>
          <p style={{ fontSize: 11, color: "#8A8A83", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} /> {klus.tijd} · <MapPin size={10} /> {klus.adres}
          </p>
        </div>
        <span style={{
          fontSize: 10, padding: "3px 8px", borderRadius: 99, fontWeight: 500,
          background: klus.betaald ? "#EAF0EC" : "#FAF0E6",
          color: klus.betaald ? "#2B4030" : "#C97A4D",
        }}>
          {klus.betaald ? "Betaald" : "Openstaand"}
        </span>
      </div>

      {!getoond ? (
        <button onClick={() => setGetoond(true)} style={{
          width: "100%", padding: "10px 0", background: "#2B4030", color: "#F5EFE5",
          border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <QrCode size={14} /> QR tonen aan klant
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          {/* Mock QR code als blok patroon */}
          <div style={{
            width: 140, height: 140, margin: "0 auto 10px",
            background: "#1A1D1A", borderRadius: 8, padding: 12,
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2,
          }}>
            {Array.from({ length: 49 }, (_, i) => (
              <div key={i} style={{
                borderRadius: 2,
                background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,40,41,42,43,44,45,46,47,48,8,15,22,29,36].includes(i) ? "#F5EFE5" : "transparent",
              }} />
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#8A8A83", margin: "0 0 8px", fontFamily: "monospace" }}>{code}</p>
          <button onClick={() => setGetoond(false)} style={{
            padding: "6px 14px", background: "transparent", border: "0.5px solid #E5DDD0",
            borderRadius: 99, fontSize: 11, color: "#8A8A83", cursor: "pointer",
          }}>
            Verbergen
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Klant scan resultaat ─────────────────────────────────────────────────────
type ScanResultaat = {
  dienst: string;
  vakman: string;
  bedrag: number;
  betaald: boolean;
  betalingId: string;
} | "niet_gevonden" | null;

// ─── Vakman view ──────────────────────────────────────────────────────────────
function VakmanView() {
  const router = useRouter();
  const betaald = TODAY_KLUSSEN.filter(k => k.betaald).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/profile")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Vandaag</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>QR Check-in</h2>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">
        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          background: "#E5DDD0", gap: "0.5px", borderRadius: 12,
          overflow: "hidden", marginBottom: 24,
        }}>
          {[
            { label: "Klussen", value: String(TODAY_KLUSSEN.length) },
            { label: "Betaald",  value: String(betaald), groen: true },
            { label: "Open",     value: String(TODAY_KLUSSEN.length - betaald), koper: true },
          ].map(s => (
            <div key={s.label} style={{ background: "#FBF7F0", padding: "14px 10px" }}>
              <p style={{ fontFamily: SERIF, fontSize: 20, margin: 0, color: s.groen ? "#2B4030" : s.koper ? "#C97A4D" : "#1A1D1A" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#8A8A83", margin: "2px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: "#1A1D1A", margin: "0 0 12px" }}>
          Toon QR aan klant bij aankomst
        </p>

        {TODAY_KLUSSEN.map(k => <QrDisplay key={k.id} klus={k} />)}
      </div>
    </div>
  );
}

// ─── Klant view ───────────────────────────────────────────────────────────────
function KlantView() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState("");
  const [resultaat, setResultaat] = useState<ScanResultaat>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const verwerk = (ingevoerdeCode: string) => {
    const trimmed = ingevoerdeCode.trim().toUpperCase();
    const gevonden = QR_DATABASE[trimmed];
    setResultaat(gevonden ?? "niet_gevonden");
    setScanning(false);
  };

  const reset = () => {
    setResultaat(null);
    setCode("");
    setScanning(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F5EFE5" }}>
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.push("/profile")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={18} style={{ color: "#1A1D1A" }} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 12, color: "#8A8A83", margin: 0 }}>Betaling verifiëren</p>
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 400, margin: 0, color: "#1A1D1A" }}>QR Scannen</h2>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28">

        {/* Resultaat — betaald */}
        {resultaat && resultaat !== "niet_gevonden" && resultaat.betaald && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#EAF0EC",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CheckCircle size={40} style={{ color: "#2B4030" }} />
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "0 0 8px", color: "#1A1D1A" }}>
              Betaald ✓
            </h2>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 24px" }}>
              Deze klus is al volledig betaald.
            </p>
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, textAlign: "left", marginBottom: 24 }}>
              {[
                { label: "Dienst",  value: resultaat.dienst },
                { label: "Vakman",  value: resultaat.vakman },
                { label: "Bedrag",  value: `€${resultaat.bedrag}` },
                { label: "Status",  value: "Betaald" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #E5DDD0" }}>
                  <span style={{ fontSize: 13, color: "#8A8A83" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: r.label === "Status" ? "#2B4030" : "#1A1D1A" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <button onClick={reset} style={{
              padding: "11px 24px", background: "transparent", border: "0.5px solid #E5DDD0",
              borderRadius: 99, fontSize: 13, color: "#5C5C56", cursor: "pointer",
            }}>
              Nog een scannen
            </button>
          </div>
        )}

        {/* Resultaat — niet betaald */}
        {resultaat && resultaat !== "niet_gevonden" && !resultaat.betaald && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#FAF0E6",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <CreditCard size={36} style={{ color: "#C97A4D" }} />
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, margin: "0 0 8px", color: "#1A1D1A" }}>
              Nog niet betaald
            </h2>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 24px" }}>
              Deze klus wacht nog op jouw betaling.
            </p>
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16, textAlign: "left", marginBottom: 24 }}>
              {[
                { label: "Dienst",  value: resultaat.dienst },
                { label: "Vakman",  value: resultaat.vakman },
                { label: "Bedrag",  value: `€${resultaat.bedrag}` },
                { label: "Status",  value: "Openstaand" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #E5DDD0" }}>
                  <span style={{ fontSize: 13, color: "#8A8A83" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: r.label === "Status" ? "#C97A4D" : "#1A1D1A" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <Link href="/te-betalen" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "13px 0", background: "#2B4030", color: "#F5EFE5",
              borderRadius: 12, fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 12,
            }}>
              <CreditCard size={16} /> Nu betalen — €{resultaat.bedrag}
            </Link>
            <button onClick={reset} style={{
              width: "100%", padding: "11px 0", background: "transparent",
              border: "0.5px solid #E5DDD0", borderRadius: 12,
              fontSize: 13, color: "#5C5C56", cursor: "pointer",
            }}>
              Nog een scannen
            </button>
          </div>
        )}

        {/* Resultaat — niet gevonden */}
        {resultaat === "niet_gevonden" && (
          <div style={{ textAlign: "center", paddingTop: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", background: "#F0EFE8",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <X size={36} style={{ color: "#8A8A83" }} />
            </div>
            <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, margin: "0 0 8px", color: "#1A1D1A" }}>
              Code niet herkend
            </h2>
            <p style={{ fontSize: 13, color: "#8A8A83", margin: "0 0 24px" }}>
              Vraag je vakman om de QR code opnieuw te tonen.
            </p>
            <button onClick={reset} style={{
              padding: "11px 24px", background: "#2B4030", color: "#F5EFE5",
              border: "none", borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
              Opnieuw proberen
            </button>
          </div>
        )}

        {/* Scan interface */}
        {!resultaat && (
          <>
            {/* Scan viewport */}
            <div style={{
              background: "#1A1D1A", borderRadius: 20, padding: 32,
              textAlign: "center", marginBottom: 24, position: "relative", overflow: "hidden",
            }}>
              {/* Hoekmarkeringen */}
              {[
                { top: 16, left: 16 }, { top: 16, right: 16 },
                { bottom: 16, left: 16 }, { bottom: 16, right: 16 },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: "absolute", width: 24, height: 24,
                  borderTop: i < 2 ? "3px solid #2B4030" : "none",
                  borderBottom: i >= 2 ? "3px solid #2B4030" : "none",
                  borderLeft: i % 2 === 0 ? "3px solid #2B4030" : "none",
                  borderRight: i % 2 === 1 ? "3px solid #2B4030" : "none",
                  borderRadius: i === 0 ? "4px 0 0 0" : i === 1 ? "0 4px 0 0" : i === 2 ? "0 0 0 4px" : "0 0 4px 0",
                  ...pos,
                }} />
              ))}
              <ScanLine size={48} style={{ color: "#2B4030", margin: "0 auto 12px" }} />
              <p style={{ color: "#F5EFE5", fontSize: 14, margin: "0 0 4px" }}>
                {scanning ? "Scannen…" : "Richt op QR code van vakman"}
              </p>
              <p style={{ color: "#8A8A83", fontSize: 12, margin: 0 }}>
                De vakman toont een QR code bij aankomst
              </p>
            </div>

            {/* Camera knop */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={() => {
                // In productie: decode QR uit afbeelding
                // Voor demo: toon handmatige invoer
                setScanning(true);
              }}
            />
            <button onClick={() => fileRef.current?.click()} style={{
              width: "100%", padding: 14, background: "#2B4030", color: "#F5EFE5",
              border: "none", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12,
            }}>
              <Camera size={18} /> Camera openen
            </button>

            {/* Handmatige code invoer */}
            <div style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#1A1D1A", margin: "0 0 10px" }}>
                Of voer code handmatig in
              </p>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="SERVR-K1-2026-..."
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "0.5px solid #E5DDD0", background: "#F5EFE5",
                  fontSize: 13, color: "#1A1D1A", marginBottom: 10,
                  fontFamily: "monospace", boxSizing: "border-box",
                }}
              />
              <button onClick={() => verwerk(code)} disabled={!code.trim()} style={{
                width: "100%", padding: 10, background: code.trim() ? "#2B4030" : "#E5DDD0",
                color: code.trim() ? "#F5EFE5" : "#8A8A83",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: code.trim() ? "pointer" : "default",
              }}>
                Controleren
              </button>
            </div>

            {/* Demo hint */}
            <div style={{ background: "#EDE4D2", borderRadius: 10, padding: "10px 14px", marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "#5C5C56", margin: 0 }}>
                <strong>Demo:</strong> Probeer code <code style={{ background: "#D8D0C4", padding: "1px 4px", borderRadius: 4 }}>SERVR-K2-2026-AHMED-CV</code> (onbetaald) of <code style={{ background: "#D8D0C4", padding: "1px 4px", borderRadius: 4 }}>SERVR-K1-2026-LISA-KRAAN</code> (betaald)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IncheckenPage() {
  const { activeView } = useUserStore();
  return activeView === "vakman" ? <VakmanView /> : <KlantView />;
}
