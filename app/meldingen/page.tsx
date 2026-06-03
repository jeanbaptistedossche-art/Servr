"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, MessageCircle, Euro, CalendarCheck, Star, Zap } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { supabase, supabaseReady } from "@/lib/supabase";

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

type RealNotif = {
  id: string;
  user_id: string;
  type: string;
  titel: string;
  bericht: string;
  gelezen: boolean;
  data?: Record<string, unknown> | null;
  created_at: string;
};

function timeAgoNotif(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "zojuist";
  if (mins < 60) return `${mins}m geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u geleden`;
  return `${Math.floor(hrs / 24)}d geleden`;
}

const TYPE_CONFIG: Record<MeldingType, { icon: React.ReactNode; bg: string; color: string }> = {
  bericht:  { icon: <MessageCircle size={16} />, bg: "#E8EDE9", color: "#2B4030" },
  boeking:  { icon: <CalendarCheck size={16} />, bg: "#E8EDE9", color: "#2B4030" },
  betaling: { icon: <Euro size={16} />,          bg: "#E8EDE9", color: "#2B4030" },
  review:   { icon: <Star size={16} />,          bg: "#F7EDE4", color: "#C97A4D" },
  systeem:  { icon: <Bell size={16} />,          bg: "#F0EDE8", color: "#8A8A83" },
  panic:    { icon: <Zap size={16} />,           bg: "#F7EDE4", color: "#C97A4D" },
};

export default function MeldingenPage() {
  const markMeldingenRead = useUserStore(s => s.markMeldingenRead);
  const { userId } = useUserStore();
  const [meldingen, setMeldingen] = useState(MOCK_MELDINGEN);
  const [realNotifs, setRealNotifs] = useState<RealNotif[]>([]);
  const [filter, setFilter] = useState<"alle" | "ongelezen">("alle");

  useEffect(() => { markMeldingenRead(); }, [markMeldingenRead]);

  // Load real notifications from Supabase
  useEffect(() => {
    if (!userId || !supabaseReady) return;
    (supabase.from("notificaties") as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        setRealNotifs(data ?? []);
      });
  }, [userId]);

  const markAllRead = () => {
    setMeldingen(m => m.map(x => ({ ...x, gelezen: true })));
    // Mark all real notifs as read in Supabase
    if (userId && supabaseReady && realNotifs.some(n => !n.gelezen)) {
      (supabase.from("notificaties") as any)
        .update({ gelezen: true })
        .eq("user_id", userId)
        .eq("gelezen", false);
      setRealNotifs(n => n.map(x => ({ ...x, gelezen: true })));
    }
  };

  const markRead = (id: string) => setMeldingen(m => m.map(x => x.id === id ? { ...x, gelezen: true } : x));

  const markRealRead = (id: string) => {
    if (supabaseReady) {
      (supabase.from("notificaties") as any).update({ gelezen: true }).eq("id", id);
    }
    setRealNotifs(n => n.map(x => x.id === id ? { ...x, gelezen: true } : x));
  };

  const ongelezenReal = realNotifs.filter(n => !n.gelezen).length;
  const ongelezenLocal = meldingen.filter(m => !m.gelezen).length;
  const ongelezen = ongelezenReal + ongelezenLocal;

  const visibleReal = filter === "ongelezen" ? realNotifs.filter(n => !n.gelezen) : realNotifs;
  const visible = filter === "ongelezen" ? meldingen.filter(m => !m.gelezen) : meldingen;

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/profile"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </Link>
          <div className="flex-1">
            <h1 className="font-black text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Meldingen
            </h1>
            {ongelezen > 0 && (
              <p className="text-xs" style={{ color: "#8A8A83" }}>{ongelezen} ongelezen</p>
            )}
          </div>
          {ongelezen > 0 && (
            <button onClick={markAllRead}
              className="touch-scale flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#E8EDE9", color: "#2B4030", border: "0.5px solid #E5DDD0" }}>
              <CheckCheck size={12} /> Alles gelezen
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          {(["alle", "ongelezen"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
              style={{
                background: filter === f ? "#2B4030" : "transparent",
                color: filter === f ? "#F5EFE5" : "#8A8A83",
              }}>
              {f === "alle" ? "Alle" : `Ongelezen ${ongelezen > 0 ? `(${ongelezen})` : ""}`}
            </button>
          ))}
        </div>
      </div>

      {/* Meldingen lijst */}
      <div className="flex flex-col px-5 pb-28 gap-2 mt-2">
        {visibleReal.length === 0 && visible.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="text-5xl">🔔</span>
            <p className="font-bold text-base" style={{ color: "#1A1D1A" }}>Geen meldingen</p>
            <p className="text-sm" style={{ color: "#8A8A83" }}>Je bent helemaal bij!</p>
          </div>
        ) : (
          <>
            {/* Real Supabase notifications (shown first) */}
            {visibleReal.map(n => (
              <button
                key={n.id}
                onClick={() => markRealRead(n.id)}
                className="touch-scale flex items-start gap-3 p-4 transition-colors text-left w-full"
                style={{
                  background: n.gelezen ? "#FBF7F0" : "#F7EDE4",
                  border: "0.5px solid #E5DDD0",
                  borderRadius: 14,
                }}>
                {/* Icoon */}
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "#E8EDE9", color: "#2B4030" }}>
                  <Bell size={16} />
                </div>

                {/* Tekst */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-tight"
                      style={{ fontWeight: n.gelezen ? 600 : 800, color: "#1A1D1A" }}>
                      {n.titel}
                    </p>
                    <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "#8A8A83" }}>
                      {timeAgoNotif(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A8A83" }}>
                    {n.bericht}
                  </p>
                  {!n.gelezen && (
                    <span className="text-[10px] font-semibold mt-1 inline-block"
                      style={{ color: "#C97A4D" }}>
                      Tik om te markeren als gelezen
                    </span>
                  )}
                </div>

                {/* Ongelezen dot */}
                {!n.gelezen && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ background: "#C97A4D" }} />
                )}
              </button>
            ))}

            {/* Local mock notifications */}
            {visible.map(m => {
              const cfg = TYPE_CONFIG[m.type];
              return (
                <Link
                  key={m.id}
                  href={m.href ?? "#"}
                  onClick={() => markRead(m.id)}
                  className="touch-scale flex items-start gap-3 p-4 transition-colors"
                  style={{
                    background: m.gelezen ? "#FBF7F0" : "#F7EDE4",
                    border: "0.5px solid #E5DDD0",
                    borderRadius: 14,
                  }}>
                  {/* Icoon */}
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </div>

                  {/* Tekst */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-tight"
                        style={{ fontWeight: m.gelezen ? 600 : 800, color: "#1A1D1A" }}>
                        {m.titel}
                      </p>
                      <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "#8A8A83" }}>
                        {m.tijd}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#8A8A83" }}>
                      {m.tekst}
                    </p>
                  </div>

                  {/* Ongelezen dot */}
                  {!m.gelezen && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ background: "#C97A4D" }} />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
