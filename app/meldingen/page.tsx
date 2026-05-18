"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, MessageCircle, Euro, CalendarCheck, Star, Zap, Package } from "lucide-react";

type MeldingType = "bericht" | "boeking" | "betaling" | "review" | "systeem" | "panic";

type Melding = {
  id: string;
  type: MeldingType;
  titel: string;
  tekst: string;
  tijd: string;
  gelezen: boolean;
  href?: string;
};

const MOCK_MELDINGEN: Melding[] = [
  {
    id: "m1",
    type: "betaling",
    titel: "Betaling ontvangen 💰",
    tekst: "Sofia Martins heeft factuur #FAC-2026-041 betaald. €96,00 bijgeschreven.",
    tijd: "5 min geleden",
    gelezen: false,
    href: "/factuur/fac-2026-041",
  },
  {
    id: "m2",
    type: "bericht",
    titel: "Nieuw bericht van Kim Nguyen",
    tekst: "\"Ik ga akkoord met de offerte! Wanneer kun je starten?\"",
    tijd: "23 min geleden",
    gelezen: false,
    href: "/chat/p3",
  },
  {
    id: "m3",
    type: "boeking",
    titel: "Nieuwe boeking ingepland",
    tekst: "Lars Visser heeft dinsdag 21 mei om 10:00 geboekt. Timmerwerkzaamheden — 3 uur.",
    tijd: "1 uur geleden",
    gelezen: false,
    href: "/agenda",
  },
  {
    id: "m4",
    type: "review",
    titel: "Nieuwe review ⭐⭐⭐⭐⭐",
    tekst: "Marco van den Berg heeft je een 5 sterren review gegeven: \"Super vakman, snel en netjes!\"",
    tijd: "3 uur geleden",
    gelezen: true,
    href: "/klussen",
  },
  {
    id: "m5",
    type: "panic",
    titel: "🚨 Panic-aanvraag in jouw buurt",
    tekst: "Nieuwe spoedklus: lekkage in de keuken — Jordaan, 0.4 km van jou. Reageer snel!",
    tijd: "4 uur geleden",
    gelezen: true,
    href: "/panic",
  },
  {
    id: "m6",
    type: "betaling",
    titel: "Herinnering: onbetaalde factuur",
    tekst: "Factuur #FAC-2026-039 staat nog open (€127,05). Betalingstermijn verloopt morgen.",
    tijd: "Gisteren",
    gelezen: true,
    href: "/verdiensten",
  },
  {
    id: "m7",
    type: "systeem",
    titel: "Servr Score gestegen 🏆",
    tekst: "Gefeliciteerd! Jouw Servr Score is gestegen naar 94. Je staat nu op plek 3 in de buurt.",
    tijd: "Gisteren",
    gelezen: true,
    href: "/leaderboard",
  },
  {
    id: "m8",
    type: "bericht",
    titel: "Nieuw bericht van Yusuf Aydın",
    tekst: "\"Kan ik ook een foto sturen van de meterkast?\"",
    tijd: "Vr",
    gelezen: true,
    href: "/chat/p5",
  },
];

const TYPE_CONFIG: Record<MeldingType, { icon: React.ReactNode; bg: string; color: string }> = {
  bericht: {
    icon: <MessageCircle size={16} />,
    bg: "#e0f2fe",
    color: "#0284c7",
  },
  boeking: {
    icon: <CalendarCheck size={16} />,
    bg: "var(--teal)" + "20",
    color: "var(--teal)",
  },
  betaling: {
    icon: <Euro size={16} />,
    bg: "#dcfce7",
    color: "#16a34a",
  },
  review: {
    icon: <Star size={16} />,
    bg: "#fef9c3",
    color: "#ca8a04",
  },
  systeem: {
    icon: <Bell size={16} />,
    bg: "var(--surface-2)",
    color: "var(--muted)",
  },
  panic: {
    icon: <Zap size={16} />,
    bg: "var(--coral)" + "15",
    color: "var(--coral)",
  },
};

export default function MeldingenPage() {
  const [meldingen, setMeldingen] = useState(MOCK_MELDINGEN);
  const [filter, setFilter] = useState<"alle" | "ongelezen">("alle");

  const markAllRead = () => setMeldingen(m => m.map(x => ({ ...x, gelezen: true })));
  const markRead = (id: string) => setMeldingen(m => m.map(x => x.id === id ? { ...x, gelezen: true } : x));

  const ongelezen = meldingen.filter(m => !m.gelezen).length;
  const visible = filter === "ongelezen" ? meldingen.filter(m => !m.gelezen) : meldingen;

  return (
    <div className="flex flex-col min-h-full animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl">Meldingen</h1>
            {ongelezen > 0 && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>{ongelezen} ongelezen</p>
            )}
          </div>
          {ongelezen > 0 && (
            <button onClick={markAllRead}
              className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
              <CheckCheck size={12} /> Alles gelezen
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "var(--surface-2)" }}>
          {(["alle", "ongelezen"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
              style={{
                background: filter === f ? "white" : "transparent",
                color: filter === f ? "var(--foreground)" : "var(--muted)",
                boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {f === "alle" ? "Alle" : `Ongelezen ${ongelezen > 0 ? `(${ongelezen})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* Meldingen lijst */}
      <div className="flex flex-col">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="text-5xl">🔔</span>
            <p className="font-bold text-base">Geen meldingen</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Je bent helemaal bij!</p>
          </div>
        ) : (
          visible.map(m => {
            const cfg = TYPE_CONFIG[m.type];
            return (
              <Link
                key={m.id}
                href={m.href ?? "#"}
                onClick={() => markRead(m.id)}
                className="touch-scale flex items-start gap-3 px-5 py-4 border-b transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: m.gelezen ? "transparent" : "var(--teal)" + "06",
                }}>
                {/* Icoon */}
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon}
                </div>

                {/* Tekst */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm leading-tight"
                      style={{ fontWeight: m.gelezen ? 600 : 800 }}>
                      {m.titel}
                    </p>
                    <span className="text-[10px] flex-shrink-0 mt-0.5"
                      style={{ color: "var(--muted)" }}>
                      {m.tijd}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--muted)" }}>
                    {m.tekst}
                  </p>
                </div>

                {/* Ongelezen dot */}
                {!m.gelezen && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ background: "var(--teal)" }} />
                )}
              </Link>
            );
          })
        )}
      </div>

      <div className="pb-8" />
    </div>
  );
}
