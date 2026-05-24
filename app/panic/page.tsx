"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Zap, ChevronRight, Clock, AlertTriangle, CheckCircle, Phone } from "lucide-react";
import { PROVIDERS, CATEGORIES } from "@/lib/mockData";
import { useUserStore } from "@/lib/store";

// ─── Klant types ──────────────────────────────────────────────────────────────

type Phase = "select" | "auction" | "done";

const BIDS = [
  { provider: PROVIDERS[0], price: 85, eta: "8 min" },
  { provider: PROVIDERS[2], price: 95, eta: "12 min" },
  { provider: PROVIDERS[3], price: 75, eta: "18 min" },
];

// ─── Vakman types ─────────────────────────────────────────────────────────────

type SpoedStatus = "nieuw" | "geaccepteerd" | "vervallen";

type SpoedJob = {
  id: string;
  klant: string;
  klantAvatar: string;
  categorie: string;
  categorieIcon: string;
  omschrijving: string;
  buurt: string;
  afstand: string;
  geplaatst: string;       // "X min geleden"
  budget: string;
  spoedBonus: string;      // extra toeslag
  status: SpoedStatus;
};

const SPOED_JOBS: SpoedJob[] = [
  {
    id: "s1",
    klant: "Lisa de Vries",
    klantAvatar: "https://i.pravatar.cc/150?img=32",
    categorie: "Loodgieter",
    categorieIcon: "🔧",
    omschrijving: "Water stroomt onder gootsteen vandaan, vloer staat blank. DRINGEND!",
    buurt: "Jordaan, Amsterdam",
    afstand: "0.8 km",
    geplaatst: "1 min geleden",
    budget: "€85–€120",
    spoedBonus: "+€15",
    status: "nieuw",
  },
  {
    id: "s2",
    klant: "Ahmad Mansour",
    klantAvatar: "https://i.pravatar.cc/150?img=33",
    categorie: "Elektricien",
    categorieIcon: "⚡",
    omschrijving: "Kortsluiting in meterkast, helft huis zonder stroom. Kinderen thuis.",
    buurt: "De Pijp, Amsterdam",
    afstand: "1.4 km",
    geplaatst: "3 min geleden",
    budget: "€100–€150",
    spoedBonus: "+€20",
    status: "nieuw",
  },
  {
    id: "s3",
    klant: "Noor Al Farsi",
    klantAvatar: "https://i.pravatar.cc/150?img=25",
    categorie: "Slotenmaker",
    categorieIcon: "🔑",
    omschrijving: "Sleutel afgebroken in slot voordeur, kan huis niet in.",
    buurt: "Oud-West, Amsterdam",
    afstand: "2.1 km",
    geplaatst: "5 min geleden",
    budget: "€60–€90",
    spoedBonus: "+€10",
    status: "nieuw",
  },
  {
    id: "s4",
    klant: "Petra Jansen",
    klantAvatar: "https://i.pravatar.cc/150?img=47",
    categorie: "HVAC",
    categorieIcon: "❄️",
    omschrijving: "CV-ketel slaat af, geen verwarming. Ouder echtpaar, koud.",
    buurt: "Bos en Lommer, Amsterdam",
    afstand: "3.0 km",
    geplaatst: "8 min geleden",
    budget: "€75–€110",
    spoedBonus: "+€12",
    status: "nieuw",
  },
];

// ─── Vakman panic view ────────────────────────────────────────────────────────

// Countdown startwaarden (seconden) per job — oudere jobs hebben minder tijd over
const COUNTDOWN_START: Record<string, number> = {
  s1: 420, // 7 min
  s2: 300, // 5 min
  s3: 180, // 3 min
  s4: 60,  // 1 min
};

// Nieuwe job die na 15s live binnenkomt
const NIEUWE_JOB: SpoedJob = {
  id: "s5",
  klant: "Bram Claes",
  klantAvatar: "https://i.pravatar.cc/150?img=52",
  categorie: "Timmerman",
  categorieIcon: "🔨",
  omschrijving: "Deur hangt scheef, kan niet meer sluiten. Inbreker was gisteravond actief in buurt.",
  buurt: "Oost, Amsterdam",
  afstand: "1.1 km",
  geplaatst: "Zonet",
  budget: "€90–€130",
  spoedBonus: "+€18",
  status: "nieuw",
};

function VakmanPanicView() {
  const [jobs, setJobs] = useState<SpoedJob[]>(SPOED_JOBS);
  const [actief, setActief] = useState<string | null>(null);
  const [geaccepteerd, setGeaccepteerd] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, number>>(COUNTDOWN_START);
  const [nieuweJobZichtbaar, setNieuweJobZichtbaar] = useState(false);

  // Tick: countdown per seconde + nieuwe job na 15s
  useEffect(() => {
    let elapsed = 0;
    const t = setInterval(() => {
      elapsed += 1;
      // Nieuwe job na 15 seconden
      if (elapsed === 15) {
        setNieuweJobZichtbaar(true);
        setJobs(v => [NIEUWE_JOB, ...v]);
        setCountdowns(c => ({ ...c, s5: 600 }));
      }
      setCountdowns(prev => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([k, v]) => { next[k] = Math.max(0, v - 1); });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleAccepteer = (id: string) => {
    setJobs(v => v.map(j => j.id === id ? { ...j, status: "geaccepteerd" } : j));
    setGeaccepteerd(id);
    setActief(null);
  };

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${String(sec).padStart(2, "0")}s` : `${sec}s`;
  };

  const accepteerdeJob = jobs.find(j => j.id === geaccepteerd);
  const nieuweJobs     = jobs.filter(j => j.status === "nieuw");

  if (geaccepteerd && accepteerdeJob) {
    return (
      <div className="flex flex-col min-h-dvh px-5 pt-14 pb-10 animate-fade-in">
        {/* Succes header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <CheckCircle size={38} color="white" />
          </div>
          <h1 className="font-black text-2xl mb-1">Spoedklus geaccepteerd</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            De klant wordt op de hoogte gebracht. Ga zo snel mogelijk!
          </p>
        </div>

        {/* Klant kaart */}
        <div className="card p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <img src={accepteerdeJob.klantAvatar} className="w-14 h-14 rounded-2xl object-cover" alt="" />
            <div className="flex-1">
              <p className="font-black text-base">{accepteerdeJob.klant}</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {accepteerdeJob.categorieIcon} {accepteerdeJob.categorie}
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-lg" style={{ color: "var(--coral)" }}>{accepteerdeJob.budget}</p>
              <p className="text-xs font-bold" style={{ color: "#22c55e" }}>{accepteerdeJob.spoedBonus} bonus</p>
            </div>
          </div>

          <div className="rounded-2xl p-3 mb-3" style={{ background: "var(--surface-2)" }}>
            <p className="text-sm leading-relaxed">&ldquo;{accepteerdeJob.omschrijving}&rdquo;</p>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={13} style={{ color: "var(--coral)" }} />
            <p className="text-sm font-semibold">{accepteerdeJob.buurt}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "var(--coral)" + "15", color: "var(--coral)" }}>
              {accepteerdeJob.afstand}
            </span>
          </div>
        </div>

        {/* Spoedtoeslag uitleg */}
        <div className="rounded-2xl p-4 mb-4 flex items-start gap-3"
          style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
          <Zap size={18} style={{ color: "#d97706" }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm" style={{ color: "#92400e" }}>Spoedtoeslag actief</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#78350f" }}>
              Jij betaalt slechts <strong>6% Servr commissie</strong> (normaal 8%) omdat dit een spoedklus is. De klant betaalt 7% service fee.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard"
            className="touch-scale flex-1 py-3.5 rounded-2xl font-semibold text-sm border flex items-center justify-center"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Dashboard
          </Link>
          <a href={`tel:${accepteerdeJob.klant === "Lisa de Vries" ? "+32470123456" : "+32470234567"}`}
            className="touch-scale flex-[2] py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
            <Phone size={18} /> Bel klant
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-5"
        style={{ background: "linear-gradient(160deg, var(--coral) 0%, #b84820 100%)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/dashboard"
            className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} color="white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-black text-xl">Spoedopdrachten</h1>
            <p className="text-white/70 text-xs">Live meldingen in jouw buurt</p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-dot" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
        </div>

        {/* Stats rij */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Meldingen", value: nieuweJobs.length.toString() },
            { label: "Buurt", value: "< 3 km" },
            { label: "Gem. budget", value: "€95" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2.5 bg-white/15 text-center">
              <p className="text-white font-black text-base">{s.value}</p>
              <p className="text-white/60 text-[10px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Uitleg banner */}
      <div className="mx-5 mt-4 rounded-2xl p-3 flex items-start gap-2.5"
        style={{ background: "var(--coral)" + "10", border: "1px solid " + "var(--coral)" + "25" }}>
        <Zap size={15} style={{ color: "var(--coral)", flexShrink: 0, marginTop: 1 }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--coral)" }}>
          <strong>Spoedklus voordeel:</strong> Jij betaalt maar <strong>6% commissie</strong> (normaal 8%). Reageer snel voor de beste kans.
        </p>
      </div>

      {/* Jobs lijst */}
      <div className="px-5 pt-4 pb-24 flex flex-col gap-3">
        {nieuweJobs.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <CheckCircle size={40} style={{ color: "var(--teal)" }} />
            <p className="font-bold text-base">Alle meldingen zijn al opgepakt</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Controleer later opnieuw voor nieuwe spoedopdrachten.
            </p>
            <Link href="/dashboard"
              className="touch-scale mt-2 px-6 py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: "var(--coral)" }}>
              Terug naar dashboard
            </Link>
          </div>
        )}

        {nieuweJobs.map(job => {
          const secs = countdowns[job.id] ?? 300;
          const isUrgent = secs <= 60;
          const isNew = job.id === "s5" && nieuweJobZichtbaar;

          return (
            <div key={job.id} className={isNew ? "animate-slide-up" : ""}>
              {/* Compact kaart */}
              <button
                onClick={() => setActief(actief === job.id ? null : job.id)}
                className="touch-scale w-full card p-4 text-left"
                style={{ borderLeft: isNew ? "3px solid var(--coral)" : "none" }}>
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={job.klantAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                      style={{ background: "var(--coral)" }}>
                      <span className="text-white text-[8px] font-black">!</span>
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{job.klant}</p>
                          {isNew && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: "var(--coral)" }}>NIEUW</span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {job.categorie} · {job.geplaatst}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm" style={{ color: "var(--coral)" }}>{job.budget}</p>
                        <p className="text-[10px] font-bold" style={{ color: "#22c55e" }}>{job.spoedBonus}</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--muted)" }}>
                      {job.omschrijving}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={10} style={{ color: "var(--coral)" }} />
                        <span className="text-xs font-semibold">{job.buurt}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "var(--coral)" + "12", color: "var(--coral)" }}>
                        {job.afstand}
                      </span>
                      {/* Countdown */}
                      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ml-auto"
                        style={{
                          background: isUrgent ? "#FEF2F2" : "#FFF7ED",
                          color: isUrgent ? "#EF4444" : "#D97706",
                        }}>
                        <Clock size={9} />
                        {fmtTime(secs)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Uitklapbaar detail + acties */}
              {actief === job.id && (
                <div className="card mx-0 -mt-3 pt-6 px-4 pb-4 rounded-b-2xl animate-slide-up"
                  style={{ background: "var(--surface-2)" }}>
                  <p className="text-sm leading-relaxed mb-4">&ldquo;{job.omschrijving}&rdquo;</p>
                  {isUrgent && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl mb-3"
                      style={{ background: "#FEF2F2" }}>
                      <AlertTriangle size={14} style={{ color: "#EF4444" }} />
                      <p className="text-xs font-bold" style={{ color: "#EF4444" }}>
                        Nog {fmtTime(secs)} — verloopt snel!
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActief(null)}
                      className="touch-scale flex-1 py-3 rounded-xl font-semibold text-sm border"
                      style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      Sluiten
                    </button>
                    <button
                      onClick={() => handleAccepteer(job.id)}
                      className="touch-scale flex-[2] py-3 rounded-xl font-black text-white flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
                      <Zap size={16} /> Accepteer spoedklus
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Klant panic view ─────────────────────────────────────────────────────────

function KlantPanicView() {
  const [phase, setPhase] = useState<Phase>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [andereText, setAndereText] = useState("");
  const [timeLeft, setTimeLeft] = useState(90);
  const [bidsVisible, setBidsVisible] = useState<number[]>([]);
  const [winner, setWinner] = useState<typeof BIDS[0] | null>(null);

  useEffect(() => {
    if (phase !== "auction") return;

    const t1 = setTimeout(() => setBidsVisible([0]), 3000);
    const t2 = setTimeout(() => setBidsVisible([0, 1]), 6000);
    const t3 = setTimeout(() => setBidsVisible([0, 1, 2]), 10000);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          setPhase("done");
          setWinner(BIDS[2]);
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
    const effectief = selected === "Andere" ? andereText.trim() : selected;
    if (!effectief) return;
    if (selected === "Andere") setSelected(andereText.trim());
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)" }}>
            <CheckCircle size={32} color="white" />
          </div>
          <h1 className="text-2xl font-black mb-2">Vakman gevonden!</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Beste prijs & snelste beschikbaarheid</p>
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
            {[
              { label: "Per uur", value: `€${winner.price}`, color: "var(--teal)" },
              { label: "ETA",     value: winner.eta,          color: "var(--foreground)" },
              { label: "Score",   value: winner.provider.servrScore.toString(), color: "var(--foreground)" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                <p className="font-black text-lg" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href={`/chat/${winner.provider.id}`}
            className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-center text-base"
            style={{ background: "var(--teal)" }}>
            Chat met {winner.provider.name.split(" ")[0]}
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
          <button onClick={() => setPhase("select")}
            className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-black text-xl">Live Veiling</h1>
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full animate-dot"
            style={{ background: "var(--coral)", color: "white" }}>
            LIVE
          </span>
        </div>

        {/* Timer */}
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
              <span className="font-black text-3xl"
                style={{ color: timeLeft <= 20 ? "var(--coral)" : "var(--foreground)" }}>
                {timeLeft}
              </span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>seconden</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm mb-6" style={{ color: "var(--muted)" }}>
          3 vakmensen bieden op jouw opdracht in <strong>{selected}</strong>
        </p>

        <div className="flex flex-col gap-3">
          {bidsVisible.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
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

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-14 pb-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="touch-scale w-9 h-9 rounded-full card flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-black text-xl">Panic Button</h1>
      </div>

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

      <h3 className="font-bold text-sm mb-3" style={{ color: "var(--muted)" }}>
        Kies een categorie — <span style={{ color: "var(--foreground)" }}>{CATEGORIES.length} soorten beschikbaar</span>
      </h3>

      {/* Alle categorieën — scrollbare grid */}
      <div className="overflow-y-auto mb-4" style={{ maxHeight: "38vh" }}>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => {
            const isSelected = selected === cat.label;
            return (
              <button key={cat.id} onClick={() => setSelected(cat.label)}
                className="touch-scale flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all"
                style={{
                  borderColor: isSelected ? "var(--coral)" : "var(--border)",
                  background:  isSelected ? "rgba(216,90,48,0.08)" : "var(--surface)",
                }}>
                <span className="text-[11px] font-semibold text-center leading-tight px-1"
                  style={{ color: isSelected ? "var(--coral)" : "var(--foreground)" }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vrij invullen */}
      <div className="mb-5">
        <p className="text-xs font-bold mb-2" style={{ color: "var(--muted)" }}>
          Staat jouw dienst er niet tussen?
        </p>
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2"
          style={{
            borderColor: selected === "Andere" ? "var(--coral)" : "var(--border)",
            background: "var(--surface)",
          }}>
          <input
            type="text"
            placeholder="Bijv. Zwembad kuisen, Asbestsanering..."
            value={andereText}
            onChange={e => { setAndereText(e.target.value); if (e.target.value) setSelected("Andere"); else if (selected === "Andere") setSelected(null); }}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--foreground)" }}
          />
        </div>
      </div>

      <button
        onClick={startAuction}
        disabled={!selected || (selected === "Andere" && !andereText.trim())}
        className="touch-scale w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
        style={{
          background: (selected && (selected !== "Andere" || andereText.trim()))
            ? "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)"
            : "var(--muted)",
          transition: "background 0.2s",
        }}>
        <Zap size={20} /> Start 90-sec veiling <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ─── Router: klant vs vakman ──────────────────────────────────────────────────

export default function PanicPage() {
  const { activeView } = useUserStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return activeView === "vakman" ? <VakmanPanicView /> : <KlantPanicView />;
}
