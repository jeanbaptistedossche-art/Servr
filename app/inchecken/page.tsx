"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, QrCode, MapPin, Clock, Check, X,
  Smartphone, Share2, Download, Zap, Shield,
  RefreshCw, Camera, CheckCircle, User,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type CheckInStatus = "idle" | "scanning" | "locating" | "verified" | "failed";

type CheckInRecord = {
  id: string;
  klusId: string;
  klusTitel: string;
  klant: string;
  tijdstip: string;  // ISO
  locatie: string;
  afstand: number;   // meter
  verified: boolean;
};

type Klus = {
  id: string;
  titel: string;
  klant: string;
  adres: string;
  tijd: string;
  qrCode: string;    // mock QR data
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY_KLUSSEN: Klus[] = [
  {
    id: "k1", titel: "Lekkende kraan keuken",  klant: "Lisa de Vries",
    adres: "Prinsengracht 88, Amsterdam", tijd: "09:00",
    qrCode: "SERVR-K1-2026-LISA-KRAAN",
  },
  {
    id: "k2", titel: "CV ketel inspectie",     klant: "Ahmed Mansour",
    adres: "Ferdinand Bolstraat 45, Amsterdam", tijd: "13:30",
    qrCode: "SERVR-K2-2026-AHMED-CV",
  },
  {
    id: "k3", titel: "Woonkamer schilderen",   klant: "Petra Jansen",
    adres: "Kinkerstraat 120, Amsterdam", tijd: "08:00",
    qrCode: "SERVR-K3-2026-PETRA-SCHILDER",
  },
];

const INIT_RECORDS: CheckInRecord[] = [
  {
    id: "ci1", klusId: "k3", klusTitel: "Woonkamer schilderen",
    klant: "Petra Jansen", tijdstip: new Date(Date.now() - 3600000 * 3).toISOString(),
    locatie: "Kinkerstraat 120, Amsterdam", afstand: 12, verified: true,
  },
];

// ─── QR Code SVG generator (simplified visual) ───────────────────────────────
function QrCodeDisplay({ data, size = 200 }: { data: string; size?: number }) {
  // Generate a deterministic but pseudo-random QR-like pattern from the string
  const hash = data.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells = 25;
  const cellSize = size / cells;

  const grid: boolean[][] = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      // Fixed position markers (finder patterns)
      const inTopLeft     = row < 8 && col < 8;
      const inTopRight    = row < 8 && col >= cells - 8;
      const inBottomLeft  = row >= cells - 8 && col < 8;

      if (inTopLeft || inTopRight || inBottomLeft) {
        const r = inTopLeft ? row : inTopRight ? row : row - (cells - 8);
        const c = inTopLeft ? col : inTopRight ? col - (cells - 8) : col;
        // Outer ring
        if (r === 0 || r === 6 || c === 0 || c === 6) return true;
        // Inner square
        if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
        return false;
      }

      // Data modules — pseudo-random based on position + hash
      const seed = (row * cells + col + hash) * 2654435761;
      return (seed >>> 16) % 3 !== 0;
    })
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 12 }}>
      <rect width={size} height={size} fill="white" rx="12" />
      {grid.map((row, r) =>
        row.map((dark, c) =>
          dark ? (
            <rect key={`${r}-${c}`}
              x={c * cellSize + 1} y={r * cellSize + 1}
              width={cellSize - 1} height={cellSize - 1}
              fill="#0f172a" rx="1" />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function IncheckenPage() {
  const router = useRouter();
  const naam = useUserStore((s) => s.name);
  const activeView = useUserStore((s) => s.activeView);

  const [tab, setTab] = useState<"inchecken" | "qr_tonen" | "geschiedenis">("inchecken");
  const [selectedKlus, setSelectedKlus] = useState<Klus | null>(null);
  const [status, setStatus] = useState<CheckInStatus>("idle");
  const [records, setRecords] = useState<CheckInRecord[]>(INIT_RECORDS);
  const [showQrFor, setShowQrFor] = useState<Klus | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Simulate QR scan + location check ───────────────────────────────────────
  const startCheckIn = useCallback((klus: Klus) => {
    setSelectedKlus(klus);
    setStatus("scanning");

    // Simulate scan delay
    timerRef.current = setTimeout(() => {
      setStatus("locating");
      timerRef.current = setTimeout(() => {
        // 95% success chance
        const success = Math.random() > 0.05;
        if (success) {
          setStatus("verified");
          const record: CheckInRecord = {
            id: `ci${Date.now()}`,
            klusId: klus.id,
            klusTitel: klus.titel,
            klant: klus.klant,
            tijdstip: new Date().toISOString(),
            locatie: klus.adres,
            afstand: Math.floor(Math.random() * 50) + 5,
            verified: true,
          };
          setRecords((prev) => [record, ...prev]);
        } else {
          setStatus("failed");
        }
      }, 1500);
    }, 1500);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setSelectedKlus(null);
    setScanResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });

  // ── Download QR code as SVG ────────────────────────────────────────────────
  const downloadQr = (klus: Klus) => {
    const size = 250;
    const cells = 25;
    const cellSize = size / cells;
    const hash = klus.qrCode.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const grid: boolean[][] = Array.from({ length: cells }, (_, row) =>
      Array.from({ length: cells }, (_, col) => {
        const inTopLeft     = row < 8 && col < 8;
        const inTopRight    = row < 8 && col >= cells - 8;
        const inBottomLeft  = row >= cells - 8 && col < 8;
        if (inTopLeft || inTopRight || inBottomLeft) {
          const r = inTopLeft ? row : inTopRight ? row : row - (cells - 8);
          const c = inTopLeft ? col : inTopRight ? col - (cells - 8) : col;
          if (r === 0 || r === 6 || c === 0 || c === 6) return true;
          if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
          return false;
        }
        const seed = (row * cells + col + hash) * 2654435761;
        return (seed >>> 16) % 3 !== 0;
      })
    );

    const rects = grid.flatMap((row, r) =>
      row.map((dark, c) =>
        dark
          ? `<rect x="${c * cellSize + 1}" y="${r * cellSize + 1}" width="${cellSize - 1}" height="${cellSize - 1}" fill="#0f172a" rx="1"/>`
          : ""
      )
    ).filter(Boolean).join("");

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="white" rx="12"/>
      ${rects}
      <text x="${size/2}" y="${size + 18}" text-anchor="middle" font-size="10" font-family="monospace" fill="#94a3b8">${klus.qrCode}</text>
    </svg>`;

    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${klus.id}-${klus.klant.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
            <ChevronLeft size={20} style={{ color: "#0f172a" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>QR Check-in</h1>
            <p className="text-xs truncate" style={{ color: "#64748b" }}>Aanwezigheid registreren bij klus</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#E2E8F0" }}>
          {(["inchecken", "qr_tonen", "geschiedenis"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#4F46E5" : "#64748b",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
              }}>
              {t === "inchecken" ? "Inchecken" : t === "qr_tonen" ? "QR tonen" : "Geschiedenis"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-28 mt-4">
        {/* ── INCHECKEN TAB ────────────────────────────────────────────────────── */}
        {tab === "inchecken" && (
          <div className="flex flex-col gap-4">
            {status === "idle" && (
              <>
                {/* Uitleg */}
                <div className="rounded-2xl p-4 flex gap-3"
                  style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
                  <QrCode size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Hoe werkt het?</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                      Scan de QR-code op de werkbon of laat de klant jouw QR-code scannen om
                      je aanwezigheid automatisch te registreren.
                    </p>
                  </div>
                </div>

                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                  Klussen vandaag
                </p>

                {TODAY_KLUSSEN.map((k) => {
                  const alChecked = records.some((r) => r.klusId === k.id);
                  return (
                    <div key={k.id} className="rounded-2xl overflow-hidden"
                      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ background: alChecked ? "#ECFDF5" : "#EEF2FF" }}>
                          {alChecked ? "✅" : "🔧"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{k.titel}</p>
                          <p className="text-xs" style={{ color: "#64748b" }}>{k.klant} · {k.tijd}</p>
                          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{k.adres}</p>
                        </div>
                        {alChecked
                          ? <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                              style={{ background: "#ECFDF5", color: "#10B981" }}>✓ Ingecheckt</span>
                          : <button onClick={() => startCheckIn(k)}
                              className="touch-scale flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "#4F46E5" }}>
                              <QrCode size={12} />
                              Scan
                            </button>
                        }
                      </div>
                    </div>
                  );
                })}

                {/* Handmatig inchecken */}
                <div className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                  <Camera size={20} style={{ color: "#64748b" }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Externe QR-code scannen</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>Scan een QR-code van een andere werkbon</p>
                  </div>
                  <button className="touch-scale px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ background: "#F3F4F6", color: "#64748b" }}>
                    Open camera
                  </button>
                </div>
              </>
            )}

            {(status === "scanning" || status === "locating") && selectedKlus && (
              <div className="rounded-3xl p-8 flex flex-col items-center gap-4"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                {/* Animatie */}
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: status === "scanning" ? "#EEF2FF" : "#ECFDF5", opacity: 0.6 }} />
                  <div className="relative w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: status === "scanning" ? "#EEF2FF" : "#ECFDF5" }}>
                    {status === "scanning"
                      ? <QrCode size={36} style={{ color: "#4F46E5" }} />
                      : <MapPin size={36} style={{ color: "#10B981" }} />
                    }
                  </div>
                </div>

                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#0f172a" }}>
                    {status === "scanning" ? "QR-code scannen…" : "Locatie verifiëren…"}
                  </p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                    {status === "scanning"
                      ? "Identificeer de klus via QR-code"
                      : "Controleer of je op de juiste locatie bent"
                    }
                  </p>
                  <p className="text-xs mt-2 font-semibold" style={{ color: "#4F46E5" }}>
                    {selectedKlus.titel} — {selectedKlus.klant}
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{ background: "#4F46E5", opacity: 0.3 + (i * 0.35),
                        animation: `pulse ${0.8 + i * 0.2}s ease-in-out infinite alternate` }} />
                  ))}
                </div>
              </div>
            )}

            {status === "verified" && selectedKlus && (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-3xl p-8 flex flex-col items-center gap-4 w-full"
                  style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    <Check size={44} style={{ color: "#fff", strokeWidth: 3 }} />
                  </div>

                  <div className="text-center">
                    <p className="font-black text-xl" style={{ color: "#0f172a" }}>Ingecheckt! ✅</p>
                    <p className="text-sm mt-1" style={{ color: "#64748b" }}>{selectedKlus.klant} — {selectedKlus.titel}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "#F8FAFC" }}>
                      <Clock size={14} style={{ color: "#94a3b8" }} />
                      <p className="text-sm font-bold" style={{ color: "#0f172a" }}>
                        {new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>Check-in tijd</p>
                    </div>
                    <div className="rounded-2xl p-3 flex flex-col gap-1" style={{ background: "#F8FAFC" }}>
                      <MapPin size={14} style={{ color: "#94a3b8" }} />
                      <p className="text-sm font-bold" style={{ color: "#0f172a" }}>~20m</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>Van adres</p>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl px-4 py-3 flex items-center gap-2"
                    style={{ background: "#ECFDF5" }}>
                    <Shield size={14} style={{ color: "#10B981" }} />
                    <p className="text-xs font-semibold" style={{ color: "#10B981" }}>
                      Locatie geverifieerd — digitaal bewijs opgeslagen
                    </p>
                  </div>
                </div>

                <button onClick={reset}
                  className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                  <RefreshCw size={16} />
                  Nieuwe check-in
                </button>
              </div>
            )}

            {status === "failed" && (
              <div className="rounded-3xl p-8 flex flex-col items-center gap-4"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "#FEF2F2" }}>
                  <X size={44} style={{ color: "#EF4444", strokeWidth: 3 }} />
                </div>
                <div className="text-center">
                  <p className="font-black text-xl" style={{ color: "#0f172a" }}>Verificatie mislukt</p>
                  <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                    Je bevindt je meer dan 200 meter van het opgegeven adres. Controleer je locatie en probeer opnieuw.
                  </p>
                </div>
                <button onClick={reset}
                  className="touch-scale px-6 py-3 rounded-2xl font-bold text-white flex items-center gap-2"
                  style={{ background: "#4F46E5" }}>
                  <RefreshCw size={16} />
                  Opnieuw proberen
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── QR TONEN TAB ─────────────────────────────────────────────────────── */}
        {tab === "qr_tonen" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl p-4 flex gap-3"
              style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
              <Smartphone size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
              <div>
                <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Toon jouw QR-code</p>
                <p className="text-xs mt-0.5" style={{ color: "#374151" }}>
                  Laat de klant jouw persoonlijke QR-code scannen om je aankomst te bevestigen.
                </p>
              </div>
            </div>

            {TODAY_KLUSSEN.map((k) => (
              <div key={k.id} className="rounded-3xl overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-base" style={{ color: "#0f172a" }}>{k.titel}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{k.klant} · {k.tijd}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                      {k.adres.split(",")[1]?.trim() || "Amsterdam"}
                    </span>
                  </div>
                </div>

                {/* QR code */}
                <div className="flex justify-center py-5 px-5">
                  <div className="p-4 rounded-3xl" style={{ background: "#F8FAFC" }}>
                    <QrCodeDisplay data={k.qrCode} size={180} />
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <p className="text-xs text-center font-mono mb-3"
                    style={{ color: "#94a3b8" }}>{k.qrCode}</p>
                  <div className="flex gap-2">
                    <button onClick={() => downloadQr(k)}
                      className="touch-scale flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                      <Download size={14} />
                      Opslaan
                    </button>
                    <button className="touch-scale flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{ background: "#F3F4F6", color: "#64748b" }}>
                      <Share2 size={14} />
                      Delen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── GESCHIEDENIS TAB ─────────────────────────────────────────────────── */}
        {tab === "geschiedenis" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                Check-in log ({records.length})
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                <p className="text-xs" style={{ color: "#10B981" }}>
                  {records.filter((r) => r.verified).length} geverifieerd
                </p>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="rounded-3xl p-8 text-center"
                style={{ background: "#fff" }}>
                <p className="text-3xl mb-2">📋</p>
                <p className="font-bold" style={{ color: "#0f172a" }}>Nog geen check-ins</p>
              </div>
            ) : records.map((r) => (
              <div key={r.id} className="rounded-2xl p-4"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: r.verified ? "#ECFDF5" : "#FEF2F2" }}>
                    {r.verified
                      ? <CheckCircle size={18} style={{ color: "#10B981" }} />
                      : <X size={18} style={{ color: "#EF4444" }} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#0f172a" }}>{r.klusTitel}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{r.klant}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        🕐 {fmtTime(r.tijdstip)}
                      </span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        📅 {fmtDate(r.tijdstip)}
                      </span>
                      <span className="text-xs" style={{ color: "#94a3b8" }}>
                        📍 {r.afstand}m
                      </span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: r.verified ? "#ECFDF5" : "#FEF2F2",
                      color: r.verified ? "#10B981" : "#EF4444",
                    }}>
                    {r.verified ? "✓" : "✕"}
                  </span>
                </div>
                {r.locatie && (
                  <p className="text-xs mt-2 truncate" style={{ color: "#CBD5E1" }}>
                    <MapPin size={10} style={{ display: "inline", marginRight: 2 }} />
                    {r.locatie}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
