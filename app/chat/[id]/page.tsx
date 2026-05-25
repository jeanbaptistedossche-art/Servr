"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Mic, Phone, MoreVertical, Plus, Camera, FileText, X, Trash2, CheckCircle } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

// ── WhatsApp icon ─────────────────────────────────────────────────────────────
function WaIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const WA_GREEN   = "#25D366";
const WA_DARK    = "#075E54";
const WA_MSG_IN  = "#DCF8C6";   // inkomend WA bericht (lichtgroen)
const WA_MSG_OUT = "#25D366";   // uitgaand WA bericht

// ── Types ─────────────────────────────────────────────────────────────────────
type Channel = "app" | "whatsapp";

type FactuurRegel = { naam: string; aantal: number; prijs: number };
type FactuurData  = {
  id: string;
  omschrijving: string;
  regels: FactuurRegel[];
  btw: boolean;
  status: "verstuurd" | "betaald";
};

type Msg = {
  from: "me" | "them";
  text?: string;
  img?: string;
  voice?: boolean;
  factuur?: FactuurData;
  channel: Channel;
  time: string;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const GESPREKKEN: Record<string, Msg[]> = {
  p1: [
    { from: "them", text: "Hoi! Ik heb je bericht ontvangen. Wanneer heb je mij nodig?", channel: "app", time: "10:02" },
    { from: "me",   text: "Hoi Marco! Zo snel mogelijk, ik heb een lekkende kraan in de keuken.", channel: "app", time: "10:04" },
    { from: "them", text: "Ik kan er over een uur zijn. Kun je een foto sturen van de situatie?", channel: "app", time: "10:05" },
    { from: "me",   img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", channel: "app", time: "10:06" },
    { from: "them", text: "Duidelijk! Dat is een simpele lekkage bij de aansluiting. Dat is zo opgelost 🔧", channel: "app", time: "10:07" },
    { from: "them", text: "Ik ben er om 14:00, tot dan! 👋", channel: "whatsapp", time: "14:02" },
    { from: "me",   text: "Top! Ik ben thuis.", channel: "whatsapp", time: "14:03" },
  ],
  p2: [
    { from: "me",   text: "Hoi Sofia, kan ik een afspraak maken voor een grondige schoonmaak?", channel: "app", time: "09:15" },
    { from: "them", text: "Hoi! Natuurlijk, voor hoeveel m² is het ongeveer?", channel: "app", time: "09:22" },
    { from: "me",   text: "Zo'n 80m², appartement op de 2e verdieping.", channel: "app", time: "09:25" },
    { from: "them", text: "Dan schat ik ongeveer 3 uur. Ik reken €32/uur. Wanneer schikt het?", channel: "app", time: "09:30" },
    { from: "me",   text: "Morgenochtend? Rond 9 uur?", channel: "app", time: "09:33" },
    { from: "them", text: "Ik kan morgen om 9:00 langskomen voor de schoonmaak.", channel: "app", time: "09:35" },
  ],
  p3: [
    { from: "them", text: "Goedemiddag! Ik heb uw aanvraag ontvangen voor schilderwerk.", channel: "app", time: "14:10" },
    { from: "me",   text: "Hoi Kim, ja ik wil graag de woonkamer laten schilderen. 3 muren.", channel: "app", time: "14:15" },
    { from: "them", text: "Welke kleur heeft u in gedachten?", channel: "app", time: "14:18" },
    { from: "me",   img: "https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=400", channel: "app", time: "14:20" },
    { from: "them", text: "Donkergrijs momenteel — 2 lagen nodig. Offerte is verstuurd!", channel: "app", time: "14:45" },
    { from: "me",   text: "Wanneer kan je starten?", channel: "whatsapp", time: "15:10" },
    { from: "them", text: "Volgende week dinsdag schikt mij het beste 👍", channel: "whatsapp", time: "15:22" },
  ],
  p4: [
    { from: "me",   text: "Hoi Lars, klopt het dat je ook deuren kunt vervangen?", channel: "app", time: "11:02" },
    { from: "them", text: "Ja zeker! Binnendeur of buitendeur?", channel: "app", time: "11:10" },
    { from: "me",   text: "Binnendeur, 3 stuks. Plus wat plinten plaatsen.", channel: "app", time: "11:12" },
    { from: "them", text: "Geen probleem. Stuur me de maten even.", channel: "app", time: "11:15" },
    { from: "me",   text: "Standaard 201x83. Plinten zo'n 25 meter totaal.", channel: "app", time: "11:20" },
    { from: "them", text: "Top, ik zie je dan dinsdag! 👍", channel: "app", time: "11:45" },
  ],
  p5: [
    { from: "me",   text: "Hoi Yusuf, steeds springt er een zekering eruit bij groep 4.", channel: "app", time: "16:30" },
    { from: "them", text: "Dat klinkt als een overbelaste groep of defect apparaat.", channel: "app", time: "16:35" },
    { from: "me",   text: "Ja, altijd groep 4. Dat is de keuken groep.", channel: "app", time: "16:37" },
    { from: "them", text: "Kan ik ook een foto sturen van de meterkast?", channel: "whatsapp", time: "16:40" },
    { from: "me",   text: "Ja hier is de foto 📸", channel: "whatsapp", time: "16:41" },
  ],
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Factuur bubble ────────────────────────────────────────────────────────────
function FactuurBubble({ factuur, fromMe }: { factuur: FactuurData; fromMe: boolean }) {
  const subtotaal = factuur.regels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const btwBedrag = factuur.btw ? subtotaal * 0.21 : 0;
  const totaal    = subtotaal + btwBedrag;
  const isPaid    = factuur.status === "betaald";

  return (
    <div className="rounded-2xl overflow-hidden w-64"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderBottomRightRadius: fromMe ? 4 : 16,
        borderBottomLeftRadius: fromMe ? 16 : 4,
      }}>
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ background: isPaid ? "#dcfce7" : "var(--teal)" }}>
        <FileText size={15} color={isPaid ? "#166534" : "white"} />
        <div className="flex-1">
          <p className="font-black text-xs" style={{ color: isPaid ? "#166534" : "white" }}>Factuur</p>
          <p className="text-[10px] opacity-80 truncate" style={{ color: isPaid ? "#166534" : "white" }}>
            {factuur.omschrijving}
          </p>
        </div>
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: isPaid ? "#bbf7d0" : "rgba(255,255,255,0.25)", color: isPaid ? "#166534" : "white" }}>
          {isPaid ? "✓ Betaald" : "Verstuurd"}
        </span>
      </div>
      <div className="px-4 pt-3 pb-2 space-y-1.5">
        {factuur.regels.map((r, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <p className="text-xs truncate flex-1" style={{ color: "var(--muted)" }}>
              {r.naam} {r.aantal > 1 ? `×${r.aantal}` : ""}
            </p>
            <p className="text-xs font-semibold flex-shrink-0">€{fmt(r.aantal * r.prijs)}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mb-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        {factuur.btw && (
          <div className="flex justify-between mb-1">
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>BTW (21%)</span>
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>€{fmt(btwBedrag)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-black text-sm">Totaal</span>
          <span className="font-black text-sm" style={{ color: "var(--teal)" }}>€{fmt(totaal)}</span>
        </div>
      </div>
      {!fromMe && !isPaid && (
        <div className="px-4 pb-3">
          <Link href={`/factuur/${factuur.id}`}
            className="touch-scale block w-full py-2.5 rounded-xl font-bold text-white text-xs text-center"
            style={{ background: "var(--teal)" }}>
            Bekijk & betaal →
          </Link>
        </div>
      )}
      {fromMe && !isPaid && (
        <div className="px-4 pb-3">
          <Link href={`/factuur/${factuur.id}`}
            className="touch-scale block w-full py-2.5 rounded-xl font-bold text-xs text-center border"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            Factuur bekijken
          </Link>
        </div>
      )}
      {isPaid && (
        <div className="px-4 pb-3 flex items-center justify-center gap-1.5">
          <CheckCircle size={13} style={{ color: "#22c55e" }} />
          <span className="text-xs font-bold" style={{ color: "#22c55e" }}>Betaald ontvangen</span>
        </div>
      )}
    </div>
  );
}

// ── Day separator ─────────────────────────────────────────────────────────────
function DaySep({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialChannel: Channel = searchParams.get("channel") === "whatsapp" ? "whatsapp" : "app";

  const provider  = PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
  const initMsgs  = GESPREKKEN[id] ?? GESPREKKEN["p1"];

  const [messages, setMessages]       = useState<Msg[]>(initMsgs);
  const [input, setInput]             = useState("");
  const [channel, setChannel]         = useState<Channel>(initialChannel);
  const [recording, setRecording]     = useState(false);
  const [showAttach, setShowAttach]   = useState(false);
  const [showFactuur, setShowFactuur] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef    = useRef<HTMLDivElement>(null);

  // Factuur
  const [fOmschrijving, setFOmschrijving] = useState("");
  const [fRegels, setFRegels]             = useState<FactuurRegel[]>([{ naam: "", aantal: 1, prijs: 0 }]);
  const [fBtw, setFBtw]                   = useState(true);

  const hasWa = ["p1", "p3", "p5"].includes(id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const now = () => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const send = () => {
    if (!input.trim()) return;
    const t = now();
    setMessages(m => [...m, { from: "me", text: input, channel, time: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, {
        from: "them",
        text: channel === "whatsapp" ? "👍 Begrepen! Tot straks." : "Begrepen! Ik kom er zo aan 🚗",
        channel,
        time: t,
      }]);
    }, 1200);
  };

  const sendVoice = () => {
    setRecording(false);
    setMessages(m => [...m, { from: "me", voice: true, channel, time: now() }]);
  };

  const sendFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setMessages(m => [...m, { from: "me", img: ev.target?.result as string, channel, time: now() }]);
    };
    reader.readAsDataURL(file);
    setShowAttach(false);
  };

  const sendFactuur = () => {
    const geldig = fOmschrijving.trim() && fRegels.some(r => r.naam && r.prijs > 0);
    if (!geldig) return;
    const factuur: FactuurData = {
      id: `fac-${Date.now()}`,
      omschrijving: fOmschrijving,
      regels: fRegels.filter(r => r.naam && r.prijs > 0),
      btw: fBtw,
      status: "verstuurd",
    };
    setMessages(m => [...m, { from: "me", factuur, channel, time: now() }]);
    setFOmschrijving("");
    setFRegels([{ naam: "", aantal: 1, prijs: 0 }]);
    setFBtw(true);
    setShowFactuur(false);
  };

  const addRegel    = () => setFRegels(r => [...r, { naam: "", aantal: 1, prijs: 0 }]);
  const updateRegel = (i: number, field: keyof FactuurRegel, val: string | number) =>
    setFRegels(r => r.map((x, j) => j === i ? { ...x, [field]: val } : x));
  const removeRegel = (i: number) => setFRegels(r => r.filter((_, j) => j !== i));

  const fSubtotaal = fRegels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const fTotaal    = fSubtotaal * (fBtw ? 1.21 : 1);

  // Bubble styling per channel
  const getBubbleBg = (msg: Msg) => {
    if (msg.channel === "whatsapp") {
      return msg.from === "me" ? WA_MSG_OUT : WA_MSG_IN;
    }
    return msg.from === "me" ? "var(--teal)" : "var(--surface)";
  };
  const getBubbleColor = (msg: Msg) => {
    if (msg.channel === "whatsapp") {
      return msg.from === "me" ? "white" : "#1a1a1a";
    }
    return msg.from === "me" ? "white" : "var(--foreground)";
  };

  // Channel-wisselen: berichten scheiden met dag-separator
  let lastChannel: Channel | null = null;

  return (
    <div className="flex flex-col h-dvh animate-fade-in" onClick={() => showAttach && setShowAttach(false)}>

      {/* ── Header ── */}
      <div className="border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/berichten"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <ArrowLeft size={18} />
          </Link>

          <Link href={`/provider/${id}`} className="touch-scale flex items-center gap-3 flex-1 min-w-0">
            <img src={provider.avatar} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" alt="" />
            <div className="min-w-0">
              <p className="font-bold text-sm">{provider.name}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-dot" />
                <span className="text-xs" style={{ color: "var(--muted)" }}>Online</span>
              </div>
            </div>
          </Link>

          {/* Kanaal-indicator in header */}
          {hasWa && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{ background: channel === "whatsapp" ? WA_GREEN + "15" : "var(--surface-2)" }}>
              {channel === "whatsapp"
                ? <WaIcon size={13} color={WA_GREEN} />
                : <span className="text-xs">💬</span>
              }
              <span className="text-[11px] font-bold"
                style={{ color: channel === "whatsapp" ? WA_GREEN : "var(--muted)" }}>
                {channel === "whatsapp" ? "WhatsApp" : "In-app"}
              </span>
            </div>
          )}

          <button className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <Phone size={17} />
          </button>
          <button className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <MoreVertical size={17} />
          </button>
        </div>

        {/* ── Kanaal-switcher (alleen als WA beschikbaar) ── */}
        {hasWa && (
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={() => setChannel("app")}
              className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: channel === "app" ? "var(--teal)" : "var(--surface-2)",
                color: channel === "app" ? "white" : "var(--muted)",
              }}>
              💬 In-app bericht
            </button>
            <button
              onClick={() => setChannel("whatsapp")}
              className="touch-scale flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: channel === "whatsapp" ? WA_GREEN : "var(--surface-2)",
                color: channel === "whatsapp" ? "white" : "var(--muted)",
              }}>
              <WaIcon size={12} color={channel === "whatsapp" ? "white" : "var(--muted)"} />
              WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* ── Berichten ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2"
        style={{ background: channel === "whatsapp" ? "#e5ddd5" : "var(--background)" }}>

        {messages.map((msg, i) => {
          // Separator wanneer kanaal wisselt
          const showSep = lastChannel !== null && lastChannel !== msg.channel;
          if (i === 0 || showSep) lastChannel = msg.channel;
          else lastChannel = msg.channel;

          return (
            <div key={i}>
              {showSep && (
                <DaySep label={msg.channel === "whatsapp" ? "Voortgezet via WhatsApp" : "Voortgezet in app"} />
              )}
              <div className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} animate-fade-in`}>
                {msg.from === "them" && (
                  <img src={provider.avatar}
                    className="w-7 h-7 rounded-full object-cover mr-2 self-end flex-shrink-0" alt="" />
                )}
                <div style={{ maxWidth: "80%" }}>

                  {msg.factuur ? (
                    <FactuurBubble factuur={msg.factuur} fromMe={msg.from === "me"} />
                  ) : msg.img ? (
                    <div className="rounded-2xl overflow-hidden"
                      style={{
                        borderBottomRightRadius: msg.from === "me" ? 4 : 16,
                        borderBottomLeftRadius: msg.from === "me" ? 16 : 4,
                        outline: msg.channel === "whatsapp" ? `2px solid ${WA_GREEN}40` : "none",
                      }}>
                      <img src={msg.img} alt="foto" className="w-48 h-36 object-cover" />
                    </div>
                  ) : msg.voice ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{
                        background: msg.channel === "whatsapp"
                          ? (msg.from === "me" ? WA_MSG_OUT : WA_MSG_IN)
                          : "var(--teal)",
                        borderBottomRightRadius: 4,
                      }}>
                      <Mic size={16} color={msg.channel === "whatsapp" && msg.from === "them" ? WA_DARK : "white"} />
                      <div className="flex gap-0.5 items-center h-4">
                        {Array.from({ length: 12 }).map((_, j) => (
                          <div key={j} className="w-0.5 rounded-full"
                            style={{
                              height: `${Math.random() * 12 + 4}px`,
                              background: msg.channel === "whatsapp" && msg.from === "them"
                                ? WA_DARK + "80"
                                : "rgba(255,255,255,0.7)",
                            }} />
                        ))}
                      </div>
                      <span className="text-xs"
                        style={{ color: msg.channel === "whatsapp" && msg.from === "them" ? WA_DARK : "white" }}>
                        0:08
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-2xl"
                      style={{
                        background: getBubbleBg(msg),
                        color: getBubbleColor(msg),
                        borderBottomRightRadius: msg.from === "me" ? 4 : 16,
                        borderBottomLeftRadius: msg.from === "me" ? 16 : 4,
                        border: msg.from === "them" && msg.channel === "app"
                          ? "1px solid var(--border)" : "none",
                        boxShadow: msg.channel === "whatsapp"
                          ? "0 1px 2px rgba(0,0,0,0.13)"
                          : "none",
                      }}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    </div>
                  )}

                  {/* Tijdstip + kanaal indicator */}
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                    {msg.channel === "whatsapp" && (
                      <WaIcon size={9} color={WA_GREEN} />
                    )}
                    <p className="text-[10px]" style={{ color: "var(--muted)" }}>{msg.time}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="border-t pb-safe"
        style={{
          borderColor: channel === "whatsapp" ? WA_GREEN + "40" : "var(--border)",
          background: channel === "whatsapp" ? "#f0f2f5" : "var(--surface)",
          borderTopWidth: channel === "whatsapp" ? 2 : 1,
        }}>
        <div className="px-4 py-3 flex items-end gap-2">

          {/* + knop */}
          <div className="relative flex-shrink-0">
            {showAttach && (
              <div className="absolute bottom-12 left-0 rounded-2xl overflow-hidden shadow-lg animate-slide-up"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 180 }}
                onClick={e => e.stopPropagation()}>
                <button onClick={() => { fileInputRef.current?.click(); }}
                  className="touch-scale w-full flex items-center gap-3 px-4 py-3 text-left"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#e0f2fe" }}>
                    <Camera size={15} style={{ color: "#0284c7" }} />
                  </div>
                  <span className="text-sm font-semibold">Foto sturen</span>
                </button>
                <button onClick={() => { setShowAttach(false); setShowFactuur(true); }}
                  className="touch-scale w-full flex items-center gap-3 px-4 py-3 text-left">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--teal)" + "15" }}>
                    <FileText size={15} style={{ color: "var(--teal)" }} />
                  </div>
                  <span className="text-sm font-semibold">Factuur sturen</span>
                </button>
              </div>
            )}
            <button
              onClick={e => { e.stopPropagation(); setShowAttach(v => !v); }}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: showAttach
                  ? channel === "whatsapp" ? WA_GREEN : "var(--teal)"
                  : "var(--surface-2)",
              }}>
              <Plus size={18} style={{ color: showAttach ? "white" : "var(--muted)" }} />
            </button>
          </div>

          {/* Tekstveld */}
          <div className="flex-1 flex items-end rounded-2xl border px-4 py-2 min-h-[44px]"
            style={{
              borderColor: channel === "whatsapp" ? WA_GREEN + "50" : "var(--border)",
              background: "white",
            }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={channel === "whatsapp" ? "WhatsApp bericht..." : "Typ een bericht..."}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
              style={{ color: "#1a1a1a", maxHeight: "100px" }}
              rows={1}
            />
          </div>

          {/* Verstuur / Mic */}
          {input.trim() ? (
            <button onClick={send}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: channel === "whatsapp" ? WA_GREEN : "var(--teal)" }}>
              <Send size={17} color="white" />
            </button>
          ) : (
            <button
              onMouseDown={() => setRecording(true)}
              onMouseUp={sendVoice}
              onTouchStart={() => setRecording(true)}
              onTouchEnd={sendVoice}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: recording
                  ? "#ef4444"
                  : channel === "whatsapp" ? WA_GREEN : "var(--teal)",
                transition: "background 0.15s",
              }}>
              <Mic size={17} color="white" />
            </button>
          )}
        </div>

        {/* WA kanaal label in inputbalk */}
        {channel === "whatsapp" && (
          <div className="px-5 pb-2 flex items-center gap-1.5">
            <WaIcon size={11} color={WA_GREEN} />
            <span className="text-[11px] font-semibold" style={{ color: WA_GREEN }}>
              Verzonden via WhatsApp Business
            </span>
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>· End-to-end versleuteld</span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={sendFoto} />

      {/* ── Factuur modal ── */}
      {showFactuur && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowFactuur(false); }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col animate-slide-up overflow-hidden"
            style={{ background: "var(--background)", maxHeight: "90dvh" }}>

            <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "var(--teal)" + "15" }}>
                <FileText size={17} style={{ color: "var(--teal)" }} />
              </div>
              <p className="font-black text-base flex-1">Factuur opstellen</p>
              <button onClick={() => setShowFactuur(false)}
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "var(--surface-2)" }}>
                <X size={15} style={{ color: "var(--muted)" }} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 block" style={{ color: "var(--muted)" }}>
                  Omschrijving *
                </label>
                <input
                  value={fOmschrijving}
                  onChange={e => setFOmschrijving(e.target.value)}
                  placeholder="Bijv. Schoonmaak appartement 80m²"
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: fOmschrijving ? "var(--teal)" : "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase mb-2 block" style={{ color: "var(--muted)" }}>
                  Regelposten *
                </label>
                <div className="flex flex-col gap-2">
                  {fRegels.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={r.naam}
                        onChange={e => updateRegel(i, "naam", e.target.value)}
                        placeholder="Omschrijving"
                        className="flex-1 px-3 py-2.5 rounded-xl border outline-none text-sm min-w-0"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                      <input type="number" value={r.aantal}
                        onChange={e => updateRegel(i, "aantal", Number(e.target.value))}
                        min={1}
                        className="w-12 px-2 py-2.5 rounded-xl border outline-none text-sm text-center"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--muted)" }}>€</span>
                        <input type="number" value={r.prijs || ""}
                          onChange={e => updateRegel(i, "prijs", Number(e.target.value))}
                          placeholder="0"
                          className="w-20 pl-7 pr-2 py-2.5 rounded-xl border outline-none text-sm"
                          style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                        />
                      </div>
                      {fRegels.length > 1 && (
                        <button onClick={() => removeRegel(i)}
                          className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#fee2e2" }}>
                          <Trash2 size={13} style={{ color: "#dc2626" }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addRegel}
                  className="touch-scale mt-2 flex items-center gap-1.5 text-xs font-semibold py-1"
                  style={{ color: "var(--teal)" }}>
                  <Plus size={13} /> Regel toevoegen
                </button>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-semibold text-sm">BTW (21%)</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Inclusief BTW op factuur</p>
                </div>
                <button onClick={() => setFBtw(v => !v)}
                  className="touch-scale relative w-12 h-6 rounded-full transition-all"
                  style={{ background: fBtw ? "var(--teal)" : "var(--surface-2)" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: fBtw ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>

              {fSubtotaal > 0 && (
                <div className="p-4 rounded-2xl" style={{ background: "var(--surface-2)" }}>
                  <p className="font-bold text-xs uppercase mb-3" style={{ color: "var(--muted)" }}>Overzicht</p>
                  <div className="space-y-1.5">
                    {fRegels.filter(r => r.naam && r.prijs > 0).map((r, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span style={{ color: "var(--muted)" }}>{r.naam}{r.aantal > 1 ? ` ×${r.aantal}` : ""}</span>
                        <span>€{fmt(r.aantal * r.prijs)}</span>
                      </div>
                    ))}
                    {fBtw && (
                      <div className="flex justify-between text-sm" style={{ color: "var(--muted)" }}>
                        <span>BTW 21%</span>
                        <span>€{fmt(fSubtotaal * 0.21)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-base pt-2 border-t"
                      style={{ borderColor: "var(--border)", color: "var(--teal)" }}>
                      <span>Totaal</span>
                      <span>€{fmt(fTotaal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <button
                onClick={sendFactuur}
                disabled={!fOmschrijving.trim() || !fRegels.some(r => r.naam && r.prijs > 0)}
                className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{
                  background: fOmschrijving.trim() && fRegels.some(r => r.naam && r.prijs > 0)
                    ? "var(--teal)" : "var(--muted)"
                }}>
                <Send size={16} /> Factuur versturen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
