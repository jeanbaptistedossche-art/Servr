"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Zap, ChevronRight } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

type Phase = "select" | "auction" | "done";

const CATEGORIES_PANIC = [
  { icon: "🔧", label: "Loodgieter" },
  { icon: "⚡", label: "Elektricien" },
  { icon: "🔑", label: "Slotenmaker" },
  { icon: "🧹", label: "Schoonmaak" },
  { icon: "🪚", label: "Timmerman" },
  { icon: "❄️", label: "HVAC" },
];

const BIDS = [
  { provider: PROVIDERS[0], price: 85, eta: "8 min" },
  { provider: PROVIDERS[2], price: 95, eta: "12 min" },
  { provider: PROVIDERS[3], price: 75, eta: "18 min" },
];

export default function PanicPage() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [bidsVisible, setBidsVisible] = useState<number[]>([]);
  const [winner, setWinner] = useState<typeof BIDS[0] | null>(null);

  useEffect(() => {
    if (phase !== "auction") return;

    // Biedingen gefaseerd tonen
    const t1 = setTimeout(() => setBidsVisible([0]), 3000);
    const t2 = setTimeout(() => setBidsVisible([0, 1]), 6000);
    const t3 = setTimeout(() => setBidsVisible([0, 1, 2]), 10000);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setPhase("done");
          setWinner(BIDS[2]); // laagste bieder wint
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase]);

  const startAuction = () => {
    if (!selected) return;
    setPhase("auction");
    setTimeLeft(90);
    setBidsVisible([]);
  };

  const pct = (timeLeft / 90) * 100;
  const circumference = 2 * Math.PI * 44;

  if (phase === "done" && winner) {
    return (
      <div className="flex flex-col min-h-dvh px-5 pt-14 pb-10 items-center justify-center animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-black mb-2">Vakman gevonden!</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Beste prijs & snelste beschikbaarheid
          </p>
        </div>

        <div className="card p-5 w-full mb-6">
          <div className="flex items-center gap-4 mb-4">
            <img src={winner.provider.avatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
            <div>
              <p className="font-black text-lg">{winner.provider.name}</p>
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold">{winner.provider.rating}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>({winner.provider.reviewCount})</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="font-black text-lg" style={{ color: "var(--teal)" }}>€{winner.price}</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>Per uur</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="font-black text-lg">{winner.eta}</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>ETA</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
              <p className="font-black text-lg">{winner.provider.servrScore}</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>Score</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href={`/chat/${winner.provider.id}`}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center text-base"
            style={{ background: "var(--teal)" }}>
            💬 Chat met {winner.provider.name.split(" ")[0]}
          </Link>
          <Link href="/"
            className="touch-scale w-full py-3 text-center text-sm font-medium"
            style={{ color: "var(--muted)" }}>
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "auction") {
    return (
      <div className="flex flex-col min-h-dvh px-5 pt-14 pb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setPhase("select")} className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-black text-xl">Live Veiling</h1>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full animate-dot"
            style={{ background: "var(--coral)", color: "white" }}>
            LIVE
          </span>
        </div>

        {/* Timer cirkel */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none"
                stroke={timeLeft <= 20 ? "var(--coral)" : "var(--teal)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (pct / 100) * circumference}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-black text-3xl" style={{ color: timeLeft <= 20 ? "var(--coral)" : "var(--foreground)" }}>
                {timeLeft}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>seconden</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm mb-6" style={{ color: "var(--muted)" }}>
          3 vakmensen bieden op jouw opdracht in <strong>{selected}</strong>
        </p>

        {/* Biedingen */}
        <div className="flex flex-col gap-3">
          {bidsVisible.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
                style={{ animation: "spin 0.8s linear infinite", borderColor: "var(--teal)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Vakmensen worden gealarmeerd...</p>
            </div>
          )}
          {bidsVisible.map(i => (
            <div key={i} className="card p-4 flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}>
              <img src={BIDS[i].provider.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <p className="font-bold text-sm">{BIDS[i].provider.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{BIDS[i].provider.rating}</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: "var(--muted)" }}>
                    <MapPin size={11} />
                    <span className="text-xs">{BIDS[i].provider.distance}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg" style={{ color: "var(--teal)" }}>€{BIDS[i].price}</p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>ETA {BIDS[i].eta}</p>
              </div>
            </div>
          ))}
        </div>

        {bidsVisible.length > 0 && (
          <button
            onClick={() => { setWinner(BIDS[bidsVisible[bidsVisible.length - 1]]); setPhase("done"); }}
            className="touch-scale mt-6 w-full py-4 rounded-2xl font-bold text-white"
            style={{ background: "var(--teal)" }}>
            Nu kiezen
          </button>
        )}
      </div>
    );
  }

  // Selecteer categorie
  return (
    <div className="flex flex-col min-h-dvh px-5 pt-14 pb-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-black text-xl">Panic Button</h1>
      </div>

      {/* Rode knop */}
      <div className="flex justify-center my-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full animate-pulse-ring scale-125"
            style={{ background: "rgba(216,90,48,0.2)" }} />
          <div className="absolute inset-0 rounded-full animate-pulse-ring scale-110"
            style={{ background: "rgba(216,90,48,0.15)", animationDelay: "0.4s" }} />
          <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <Zap size={32} color="white" />
            <span className="text-white text-xs font-black tracking-wide">PANIC</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="font-black text-xl mb-2">Noodhulp nodig?</h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Kies de categorie en 3 vakmensen in jouw buurt<br />bieden op jouw opdracht binnen 90 seconden.
        </p>
      </div>

      <h3 className="font-bold text-sm mb-3" style={{ color: "var(--muted)" }}>Kies een categorie</h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {CATEGORIES_PANIC.map(cat => (
          <button
            key={cat.label}
            onClick={() => setSelected(cat.label)}
            className="touch-scale flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all"
            style={{
              borderColor: selected === cat.label ? "var(--coral)" : "var(--border)",
              background: selected === cat.label ? "rgba(216,90,48,0.08)" : "var(--surface)",
            }}>
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-xs font-semibold" style={{ color: selected === cat.label ? "var(--coral)" : "var(--foreground)" }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={startAuction}
        disabled={!selected}
        className="touch-scale w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
        style={{
          background: selected ? "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" : "var(--muted)",
          transition: "background 0.2s",
        }}>
        <Zap size={20} />
        Start 90-sec veiling
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
