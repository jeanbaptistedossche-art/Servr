"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, PenTool, Check, X, Download, Share2,
  RefreshCw, User, MapPin, Calendar, Clock,
  ChevronRight, Star, FileText, Stamp,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

// ─── Types ────────────────────────────────────────────────────────────────────
type Stap = "klus_selectie" | "overzicht" | "handtekening" | "bevestiging";

type KlusItem = {
  omschrijving: string;
  aantal: number;
  eenheid: string;
  prijs: number;
};

type Klus = {
  id: string;
  titel: string;
  klant: string;
  klantAdres: string;
  datum: string;
  tijdStart: string;
  tijdEind?: string;
  items: KlusItem[];
  opmerkingen?: string;
  rating?: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);
const MOCK_KLUSSEN: Klus[] = [
  {
    id: "k1",
    titel: "Lekkende kraan keuken",
    klant: "Lisa de Vries",
    klantAdres: "Prinsengracht 88, Amsterdam",
    datum: TODAY,
    tijdStart: "09:00",
    items: [
      { omschrijving: "Arbeid loodgieter", aantal: 1.5, eenheid: "uur", prijs: 97.50 },
      { omschrijving: "Kraanset Grohe",     aantal: 1,   eenheid: "st",  prijs: 42.00 },
      { omschrijving: "Flexibele slangen",  aantal: 2,   eenheid: "st",  prijs: 8.50  },
    ],
    opmerkingen: "Kraan vervangen + aansluiting nieuw gemonteerd. Getest op lekkage.",
  },
  {
    id: "k2",
    titel: "CV ketel inspectie",
    klant: "Ahmed Mansour",
    klantAdres: "Ferdinand Bolstraat 45, Amsterdam",
    datum: TODAY,
    tijdStart: "13:30",
    items: [
      { omschrijving: "Arbeid HVAC monteur", aantal: 1.25, eenheid: "uur", prijs: 106.25 },
      { omschrijving: "Inspectie rapport",   aantal: 1,    eenheid: "st",  prijs: 15.00  },
    ],
  },
  {
    id: "k3",
    titel: "Woonkamer schilderen",
    klant: "Petra Jansen",
    klantAdres: "Kinkerstraat 120, Amsterdam",
    datum: TODAY,
    tijdStart: "08:00",
    tijdEind: "16:30",
    items: [
      { omschrijving: "Schilderwerk woonkamer 45m²", aantal: 8,   eenheid: "uur", prijs: 520.00 },
      { omschrijving: "Muurverf wit (2 bakken)",     aantal: 2,   eenheid: "st",  prijs: 76.00  },
      { omschrijving: "Primer",                      aantal: 1,   eenheid: "st",  prijs: 28.00  },
    ],
    opmerkingen: "Inclusief plafond en 2 lagen verf. Vensterbanken afgedekt.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtEur(n: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);
}

function totaal(klus: Klus) {
  const sub = klus.items.reduce((s, i) => s + i.prijs, 0);
  const btw = sub * 0.21;
  return { sub, btw, totaal: sub + btw };
}

// ─── Signature canvas ─────────────────────────────────────────────────────────
function SignatureCanvas({
  onSave, onClear,
}: {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setHasStrokes(true);
  }, []);

  const endDraw = useCallback(() => {
    drawing.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onClear();
  }, [onClear]);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  }, [onSave]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "#F8FAFC", border: "2px solid #E2E8F0" }}>
        {/* Guideline */}
        <div className="absolute bottom-12 left-8 right-8 h-px" style={{ background: "#CBD5E1" }} />
        <p className="absolute bottom-6 left-8 text-xs" style={{ color: "#CBD5E1" }}>Teken hier je handtekening</p>

        <canvas
          ref={canvasRef}
          width={600}
          height={220}
          className="w-full touch-none"
          style={{ cursor: "crosshair" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={clear}
          className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: "#F3F4F6", color: "#64748b" }}>
          <RefreshCw size={16} />
          Wis
        </button>
        <button onClick={save} disabled={!hasStrokes}
          className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: "#4F46E5" }}>
          <Check size={16} />
          Bevestig handtekening
        </button>
      </div>
    </div>
  );
}

// ─── Stars picker ─────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-3 justify-center">
      {[1,2,3,4,5].map((n) => (
        <button key={n} onClick={() => onChange(n)}
          className="touch-scale w-12 h-12 flex items-center justify-center rounded-2xl"
          style={{ background: n <= value ? "#FFFBEB" : "#F3F4F6" }}>
          <Star size={28} fill={n <= value ? "#F59E0B" : "none"}
            style={{ color: n <= value ? "#F59E0B" : "#D1D5DB" }} />
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HandtekeningPage() {
  const router = useRouter();
  const naam = useUserStore((s) => s.name);

  const [stap, setStap] = useState<Stap>("klus_selectie");
  const [geselecteerd, setGeselecteerd] = useState<Klus | null>(null);
  const [handtekening, setHandtekening] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [opmerking, setOpmerking] = useState("");
  const [tijdEindNu] = useState(
    new Date().toTimeString().slice(0, 5)
  );

  // ── PDF download ──────────────────────────────────────────────────────────
  const downloadBon = () => {
    if (!geselecteerd) return;
    const { sub, btw, totaal: tot } = totaal(geselecteerd);
    const now = new Date();
    const datumTijd = now.toLocaleDateString("nl-NL", { day: "2-digit", month: "long", year: "numeric" });
    const tijdStr = now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    const fmtEurLocal = (n: number) =>
      new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

    const regels = geselecteerd.items
      .map(i => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i.omschrijving}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.aantal} ${i.eenheid}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtEurLocal(i.prijs)}</td>
      </tr>`).join("");

    const handtekeningHtml = handtekening
      ? `<div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
          <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Handtekening klant</p>
          <img src="${handtekening}" style="max-height:80px;display:block;" />
          <p style="margin:8px 0 0 0;font-size:11px;color:#10b981;">✓ Digitaal getekend op ${datumTijd} om ${tijdStr}</p>
        </div>`
      : "";

    const html = `<!DOCTYPE html><html lang="nl"><head>
      <meta charset="UTF-8"/>
      <title>Opleveringsbon – ${geselecteerd.titel}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;padding:32px;max-width:680px;margin:0 auto;}
        @media print{body{padding:16px}button{display:none!important}}
      </style>
    </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
        <div>
          <h1 style="font-size:24px;font-weight:900;color:#4f46e5;">Servr</h1>
          <p style="font-size:12px;color:#64748b;margin-top:2px;">Digitale Opleveringsbon</p>
        </div>
        <div style="text-align:right;">
          <p style="font-size:13px;font-weight:700;">${naam || "Vakman"}</p>
          <p style="font-size:12px;color:#64748b;">${datumTijd}</p>
        </div>
      </div>
      <div style="padding:16px;background:#eef2ff;border-radius:12px;margin-bottom:24px;">
        <h2 style="font-size:16px;font-weight:800;color:#4f46e5;margin-bottom:4px;">${geselecteerd.titel}</h2>
        <p style="font-size:13px;color:#374151;">${geselecteerd.klant} · ${geselecteerd.klantAdres}</p>
        <p style="font-size:12px;color:#64748b;margin-top:2px;">${geselecteerd.datum} van ${geselecteerd.tijdStart} tot ${tijdEindNu}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Omschrijving</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Hoeveelheid</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;">Prijs</th>
        </tr></thead>
        <tbody>${regels}</tbody>
      </table>
      <div style="text-align:right;padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:8px;">
        <p style="font-size:13px;color:#64748b;margin-bottom:4px;">Subtotaal: ${fmtEurLocal(sub)}</p>
        <p style="font-size:13px;color:#64748b;margin-bottom:8px;">BTW (21%): ${fmtEurLocal(btw)}</p>
        <p style="font-size:20px;font-weight:900;color:#4f46e5;">Totaal: ${fmtEurLocal(tot)}</p>
      </div>
      ${geselecteerd.opmerkingen ? `<p style="font-size:12px;color:#64748b;font-style:italic;padding:12px;background:#fffbeb;border-radius:8px;margin-bottom:16px;">${geselecteerd.opmerkingen}</p>` : ""}
      ${handtekeningHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
        <p style="font-size:11px;color:#94a3b8;">Gegenereerd door Servr · ${datumTijd} ${tijdStr}</p>
      </div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  // ── Stap: klus selectie ────────────────────────────────────────────────────
  if (stap === "klus_selectie") {
    return (
      <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
        <div className="sticky top-0 z-30 px-4 pt-12 pb-4"
          style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/profile')}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
              <ChevronLeft size={20} style={{ color: "#0f172a" }} />
            </button>
            <div>
              <h1 className="text-xl font-black" style={{ color: "#0f172a" }}>Oplevering</h1>
              <p className="text-xs" style={{ color: "#64748b" }}>Selecteer de klus om af te ronden</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-10 mt-4 flex flex-col gap-3">
          {/* Uitleg card */}
          <div className="rounded-2xl p-4 flex gap-3"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <PenTool size={20} style={{ color: "#4F46E5", flexShrink: 0 }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>Digitale oplevering</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                Laat de klant het opleveringsdocument ondertekenen op hun smartphone of tablet.
                Je ontvangt een digitaal bewijs van akkoord.
              </p>
            </div>
          </div>

          {MOCK_KLUSSEN.map((k) => {
            const { totaal: tot } = totaal(k);
            return (
              <button key={k.id}
                onClick={() => { setGeselecteerd(k); setStap("overzicht"); }}
                className="touch-scale w-full rounded-2xl p-4 text-left"
                style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: "#EEF2FF" }}>
                    🔧
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{k.titel}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>{k.klant} · {k.tijdStart}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>{k.klantAdres}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: "#4F46E5" }}>{fmtEur(tot)}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>incl. BTW</p>
                    <ChevronRight size={14} style={{ color: "#CBD5E1", marginLeft: "auto", marginTop: 4 }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!geselecteerd) return null;
  const { sub, btw, totaal: tot } = totaal(geselecteerd);

  // ── Stap: overzicht ────────────────────────────────────────────────────────
  if (stap === "overzicht") {
    return (
      <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
        <div className="sticky top-0 z-30 px-4 pt-12 pb-4"
          style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setStap("klus_selectie")}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
              <ChevronLeft size={20} style={{ color: "#0f172a" }} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black" style={{ color: "#0f172a" }}>Opleveringsbon</h1>
              <p className="text-xs" style={{ color: "#64748b" }}>Controleer voor ondertekening</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-32 mt-4 flex flex-col gap-4">
          {/* Document card */}
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}>
            {/* Header */}
            <div className="px-5 py-4"
              style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-lg text-white">{geselecteerd.titel}</p>
                  <p className="text-xs text-indigo-200 mt-0.5">Opleveringsdocument</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  <Stamp size={20} style={{ color: "#fff" }} />
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Klant + vakman info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#94a3b8" }}>Klant</p>
                  <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{geselecteerd.klant}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{geselecteerd.klantAdres}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#94a3b8" }}>Vakman</p>
                  <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{naam || "Vakman"}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Servr Professional</p>
                </div>
              </div>

              {/* Datum + tijd */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "#F8FAFC" }}>
                  <Calendar size={12} style={{ color: "#94a3b8" }} />
                  <p className="text-xs font-bold" style={{ color: "#0f172a" }}>
                    {new Date(geselecteerd.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                  </p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Datum</p>
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "#F8FAFC" }}>
                  <Clock size={12} style={{ color: "#94a3b8" }} />
                  <p className="text-xs font-bold" style={{ color: "#0f172a" }}>{geselecteerd.tijdStart}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Start</p>
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "#F8FAFC" }}>
                  <Clock size={12} style={{ color: "#94a3b8" }} />
                  <p className="text-xs font-bold" style={{ color: "#0f172a" }}>{geselecteerd.tijdEind ?? tijdEindNu}</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Eind</p>
                </div>
              </div>

              {/* Werkzaamheden */}
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#94a3b8" }}>
                Werkzaamheden
              </p>
              <div className="flex flex-col gap-1 mb-3">
                {geselecteerd.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start py-1.5"
                    style={{ borderBottom: i < geselecteerd.items.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: "#374151" }}>{item.omschrijving}</p>
                      <p className="text-xs" style={{ color: "#94a3b8" }}>{item.aantal} {item.eenheid}</p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0" style={{ color: "#0f172a" }}>
                      {fmtEur(item.prijs)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtotaal, BTW, totaal */}
              <div className="rounded-2xl p-3 mb-3 flex flex-col gap-1.5" style={{ background: "#F8FAFC" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>Subtotaal</span>
                  <span style={{ color: "#374151" }}>{fmtEur(sub)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#64748b" }}>BTW (21%)</span>
                  <span style={{ color: "#374151" }}>{fmtEur(btw)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-1"
                  style={{ borderTop: "1px solid #E2E8F0" }}>
                  <span style={{ color: "#0f172a" }}>Totaal</span>
                  <span style={{ color: "#4F46E5" }}>{fmtEur(tot)}</span>
                </div>
              </div>

              {/* Opmerkingen */}
              {geselecteerd.opmerkingen && (
                <div className="rounded-2xl p-3 mb-3" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#D97706" }}>Opmerkingen</p>
                  <p className="text-sm" style={{ color: "#374151" }}>{geselecteerd.opmerkingen}</p>
                </div>
              )}

              {/* Locatie */}
              <div className="flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
                <MapPin size={12} />
                <span>{geselecteerd.klantAdres}</span>
              </div>
            </div>
          </div>

          {/* Naar handtekening */}
          <button onClick={() => setStap("handtekening")}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "#4F46E5" }}>
            <PenTool size={20} />
            Laat klant ondertekenen
          </button>
        </div>
      </div>
    );
  }

  // ── Stap: handtekening ─────────────────────────────────────────────────────
  if (stap === "handtekening") {
    return (
      <div className="min-h-screen" style={{ background: "#F1F4FA" }}>
        <div className="sticky top-0 z-30 px-4 pt-12 pb-4"
          style={{ background: "rgba(241,244,250,0.96)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setStap("overzicht")}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}>
              <ChevronLeft size={20} style={{ color: "#0f172a" }} />
            </button>
            <div>
              <h1 className="text-xl font-black" style={{ color: "#0f172a" }}>Handtekening</h1>
              <p className="text-xs" style={{ color: "#64748b" }}>Laat de klant hieronder tekenen</p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-10 mt-4 flex flex-col gap-4">
          {/* Akkoord verklaring */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "#0f172a" }}>Verklaring van akkoord</p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              Ondergetekende, <strong>{geselecteerd.klant}</strong>, verklaart hierbij dat de werkzaamheden
              beschreven in de opleveringsbon van <strong>{fmtEur(tot)} incl. BTW</strong> naar tevredenheid
              zijn uitgevoerd en worden aanvaard.
            </p>
          </div>

          {/* Handtekeningveld */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#64748b" }}>
              Handtekening klant — {geselecteerd.klant}
            </p>
            <SignatureCanvas
              onSave={(url) => { setHandtekening(url); setStap("bevestiging"); }}
              onClear={() => setHandtekening(null)}
            />
          </div>

          {/* Beoordeling */}
          <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#0f172a" }}>
              Hoe tevreden ben je over het werk?
            </p>
            <StarPicker value={rating} onChange={setRating} />
            {rating > 0 && (
              <div className="mt-3">
                <textarea value={opmerking} onChange={(e) => setOpmerking(e.target.value)}
                  placeholder="Optioneel: laat een reactie achter…" rows={2}
                  className="w-full rounded-2xl px-4 py-3 text-sm resize-none"
                  style={{ background: "#F8FAFC", border: "1.5px solid #E2E8F0", color: "#0f172a" }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Stap: bevestiging ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F1F4FA" }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Succes icoon */}
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
          <Check size={44} style={{ color: "#fff", strokeWidth: 3 }} />
        </div>

        <h1 className="text-2xl font-black text-center mb-2" style={{ color: "#0f172a" }}>
          Klus afgerond! 🎉
        </h1>
        <p className="text-sm text-center mb-6" style={{ color: "#64748b" }}>
          {geselecteerd.klant} heeft getekend voor akkoord.
        </p>

        {/* Handtekening preview */}
        {handtekening && (
          <div className="w-full rounded-3xl p-4 mb-4"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#94a3b8" }}>
                Handtekening
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>{geselecteerd.klant}</p>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <img src={handtekening} alt="handtekening" className="w-full" style={{ maxHeight: 100, objectFit: "contain" }} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
              <p className="text-xs font-semibold" style={{ color: "#10B981" }}>
                Digitaal getekend op {new Date().toLocaleDateString("nl-NL")} om {new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        )}

        {/* Review */}
        {rating > 0 && (
          <div className="w-full rounded-3xl p-4 mb-4"
            style={{ background: "#FFFBEB", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} size={16} fill={n <= rating ? "#F59E0B" : "none"}
                    style={{ color: n <= rating ? "#F59E0B" : "#D1D5DB" }} />
                ))}
              </div>
              <span className="text-xs font-bold" style={{ color: "#D97706" }}>{geselecteerd.klant}</span>
            </div>
            {opmerking && <p className="text-sm italic" style={{ color: "#374151" }}>"{opmerking}"</p>}
          </div>
        )}

        {/* Samenvatting */}
        <div className="w-full rounded-3xl p-4 mb-6"
          style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold" style={{ color: "#0f172a" }}>{geselecteerd.titel}</p>
            <p className="font-black text-lg" style={{ color: "#4F46E5" }}>{fmtEur(tot)}</p>
          </div>
          <p className="text-xs" style={{ color: "#64748b" }}>
            {geselecteerd.klant} · {geselecteerd.datum}
          </p>
        </div>

        {/* Acties */}
        <div className="w-full flex flex-col gap-3">
          <button onClick={downloadBon}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: "#4F46E5" }}>
            <Download size={20} />
            Download PDF bon
          </button>
          <button className="touch-scale w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
            <Share2 size={20} />
            Stuur naar klant
          </button>
          <button onClick={() => router.push("/profile")}
            className="touch-scale w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ color: "#94a3b8" }}>
            Terug naar profiel
          </button>
        </div>
      </div>
    </div>
  );
}
