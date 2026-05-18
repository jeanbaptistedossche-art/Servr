"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Mic, Phone, MoreVertical, Plus, Camera, FileText, X, Trash2, CheckCircle } from "lucide-react";
import { PROVIDERS } from "@/lib/mockData";

type FactuurRegel = { naam: string; aantal: number; prijs: number };

type FactuurData = {
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
  time: string;
};

const GESPREKKEN: Record<string, Msg[]> = {
  p1: [
    { from: "them", text: "Hoi! Ik heb je bericht ontvangen. Wanneer heb je mij nodig?", time: "10:02" },
    { from: "me", text: "Hoi Marco! Zo snel mogelijk, ik heb een lekkende kraan in de keuken.", time: "10:04" },
    { from: "them", text: "Ik kan er over een uur zijn. Kun je een foto sturen van de situatie?", time: "10:05" },
    { from: "me", img: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400", time: "10:06" },
    { from: "them", text: "Duidelijk! Dat is een simpele lekkage bij de aansluiting. Dat is zo opgelost 🔧", time: "10:07" },
  ],
  p2: [
    { from: "me", text: "Hoi Sofia, kan ik een afspraak maken voor een grondige schoonmaak?", time: "Gisteren 09:15" },
    { from: "them", text: "Hoi! Natuurlijk, voor hoeveel m² is het ongeveer?", time: "Gisteren 09:22" },
    { from: "me", text: "Zo'n 80m², appartement op de 2e verdieping.", time: "Gisteren 09:25" },
    { from: "them", text: "Dan schat ik ongeveer 3 uur. Ik reken €32/uur. Wanneer schikt het?", time: "Gisteren 09:30" },
    { from: "me", text: "Morgenochtend? Rond 9 uur?", time: "Gisteren 09:33" },
    { from: "them", text: "Ik kan morgen om 9:00 langskomen voor de schoonmaak.", time: "Gisteren 09:35" },
  ],
  p3: [
    { from: "them", text: "Goedemiddag! Ik heb uw aanvraag ontvangen voor schilderwerk.", time: "Ma 14:10" },
    { from: "me", text: "Hoi Kim, ja ik wil graag de woonkamer laten schilderen. 3 muren.", time: "Ma 14:15" },
    { from: "them", text: "Begrepen. Welke kleur heeft u in gedachten? En is het momenteel wit of een donkere kleur?", time: "Ma 14:18" },
    { from: "me", img: "https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?w=400", time: "Ma 14:20" },
    { from: "them", text: "Ah, donkergrijs momenteel. Dan heb ik waarschijnlijk 2 lagen nodig. De offerte is verstuurd. Neem even de tijd om te bekijken!", time: "Ma 14:45" },
  ],
  p4: [
    { from: "me", text: "Hoi Lars, klopt het dat je ook deuren kunt vervangen?", time: "Zo 11:02" },
    { from: "them", text: "Ja zeker! Binnendeur of buitendeur?", time: "Zo 11:10" },
    { from: "me", text: "Binnendeur, 3 stuks. Plus wat plinten plaatsen.", time: "Zo 11:12" },
    { from: "them", text: "Geen probleem. Stuur me de maten even dan maak ik een prijsinschatting.", time: "Zo 11:15" },
    { from: "me", text: "Standaard 201x83. Plinten zo'n 25 meter totaal.", time: "Zo 11:20" },
    { from: "them", text: "Top, ik zie je dan dinsdag! 👍", time: "Zo 11:45" },
  ],
  p5: [
    { from: "me", text: "Hoi Yusuf, ik heb een probleem met mijn groepenkast. Steeds springt er een zekering eruit.", time: "Vr 16:30" },
    { from: "them", text: "Hoi! Dat klinkt als een overbelaste groep of een defect apparaat. Is het altijd dezelfde zekering?", time: "Vr 16:35" },
    { from: "me", text: "Ja, altijd groep 4. Dat is de keuken groep.", time: "Vr 16:37" },
    { from: "them", text: "Dan is waarschijnlijk de vaatwasser of magnetron de boosdoener. Kan ik ook een foto sturen van de meterkast?", time: "Vr 16:40" },
  ],
};

function fmt(n: number) {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FactuurBubble({ factuur, fromMe }: { factuur: FactuurData; fromMe: boolean }) {
  const subtotaal = factuur.regels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const btwBedrag = factuur.btw ? subtotaal * 0.21 : 0;
  const totaal = subtotaal + btwBedrag;
  const isPaid = factuur.status === "betaald";

  return (
    <div className="rounded-2xl overflow-hidden w-64"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderBottomRightRadius: fromMe ? 4 : 16,
        borderBottomLeftRadius: fromMe ? 16 : 4,
      }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ background: isPaid ? "#dcfce7" : "var(--teal)", }}>
        <FileText size={15} color={isPaid ? "#166534" : "white"} />
        <div className="flex-1">
          <p className="font-black text-xs" style={{ color: isPaid ? "#166534" : "white" }}>
            Factuur
          </p>
          <p className="text-[10px] opacity-80 truncate" style={{ color: isPaid ? "#166534" : "white" }}>
            {factuur.omschrijving}
          </p>
        </div>
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: isPaid ? "#bbf7d0" : "rgba(255,255,255,0.25)", color: isPaid ? "#166534" : "white" }}>
          {isPaid ? "✓ Betaald" : "Verstuurd"}
        </span>
      </div>

      {/* Regels */}
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

      {/* Totaal */}
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

      {/* Actie knop */}
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

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const provider = PROVIDERS.find(p => p.id === id) ?? PROVIDERS[0];
  const initMsgs = GESPREKKEN[id] ?? GESPREKKEN["p1"];
  const [messages, setMessages] = useState<Msg[]>(initMsgs);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showFactuur, setShowFactuur] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Factuur formulier state
  const [fOmschrijving, setFOmschrijving] = useState("");
  const [fRegels, setFRegels] = useState<FactuurRegel[]>([{ naam: "", aantal: 1, prijs: 0 }]);
  const [fBtw, setFBtw] = useState(true);

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
    setMessages(m => [...m, { from: "me", text: input, time: t }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, { from: "them", text: "Begrepen! Ik kom er zo aan 🚗", time: t }]);
    }, 1200);
  };

  const sendVoice = () => {
    setRecording(false);
    setMessages(m => [...m, { from: "me", voice: true, time: now() }]);
  };

  const sendFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setMessages(m => [...m, { from: "me", img: ev.target?.result as string, time: now() }]);
    };
    reader.readAsDataURL(file);
    setShowAttach(false);
  };

  const sendFactuur = () => {
    const geldig = fOmschrijving.trim() && fRegels.some(r => r.naam && r.prijs > 0);
    if (!geldig) return;
    const factuur: FactuurData = {
      id: `fac-chat-${Date.now()}`,
      omschrijving: fOmschrijving,
      regels: fRegels.filter(r => r.naam && r.prijs > 0),
      btw: fBtw,
      status: "verstuurd",
    };
    setMessages(m => [...m, { from: "me", factuur, time: now() }]);
    // Reset form
    setFOmschrijving("");
    setFRegels([{ naam: "", aantal: 1, prijs: 0 }]);
    setFBtw(true);
    setShowFactuur(false);
  };

  const addRegel = () => setFRegels(r => [...r, { naam: "", aantal: 1, prijs: 0 }]);
  const updateRegel = (i: number, field: keyof FactuurRegel, val: string | number) =>
    setFRegels(r => r.map((x, j) => j === i ? { ...x, [field]: val } : x));
  const removeRegel = (i: number) => setFRegels(r => r.filter((_, j) => j !== i));

  const fSubtotaal = fRegels.reduce((s, r) => s + r.aantal * r.prijs, 0);
  const fTotaal = fSubtotaal * (fBtw ? 1.21 : 1);

  return (
    <div className="flex flex-col h-dvh animate-fade-in" onClick={() => showAttach && setShowAttach(false)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
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
        <button className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--surface-2)" }}>
          <Phone size={17} />
        </button>
        <button className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--surface-2)" }}>
          <MoreVertical size={17} />
        </button>
      </div>

      {/* Berichten */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} animate-fade-in`}>
            {msg.from === "them" && (
              <img src={provider.avatar} className="w-7 h-7 rounded-full object-cover mr-2 self-end flex-shrink-0" alt="" />
            )}
            <div style={{ maxWidth: "80%" }}>
              {msg.factuur ? (
                <FactuurBubble factuur={msg.factuur} fromMe={msg.from === "me"} />
              ) : msg.img ? (
                <div className="rounded-2xl overflow-hidden"
                  style={{ borderBottomRightRadius: msg.from === "me" ? 4 : 16, borderBottomLeftRadius: msg.from === "me" ? 16 : 4 }}>
                  <img src={msg.img} alt="foto" className="w-48 h-36 object-cover" />
                </div>
              ) : msg.voice ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "var(--teal)", borderBottomRightRadius: 4 }}>
                  <Mic size={16} color="white" />
                  <div className="flex gap-0.5 items-center h-4">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <div key={j} className="w-0.5 rounded-full bg-white/70"
                        style={{ height: `${Math.random() * 12 + 4}px` }} />
                    ))}
                  </div>
                  <span className="text-white text-xs">0:08</span>
                </div>
              ) : (
                <div className="px-4 py-3 rounded-2xl"
                  style={{
                    background: msg.from === "me" ? "var(--teal)" : "var(--surface)",
                    color: msg.from === "me" ? "white" : "var(--foreground)",
                    borderBottomRightRadius: msg.from === "me" ? 4 : 16,
                    borderBottomLeftRadius: msg.from === "me" ? 16 : 4,
                    border: msg.from === "them" ? "1px solid var(--border)" : "none",
                  }}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              )}
              <p className="text-[10px] mt-1 px-1"
                style={{ color: "var(--muted)", textAlign: msg.from === "me" ? "right" : "left" }}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t pb-safe" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="px-4 py-3 flex items-end gap-2">
          {/* Bijlage knop met popup */}
          <div className="relative flex-shrink-0">
            {showAttach && (
              <div className="absolute bottom-12 left-0 rounded-2xl overflow-hidden shadow-lg animate-slide-up"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: 160 }}
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
              style={{ background: showAttach ? "var(--teal)" : "var(--surface-2)" }}>
              <Plus size={18} style={{ color: showAttach ? "white" : "var(--muted)" }} />
            </button>
          </div>

          <div className="flex-1 flex items-end rounded-2xl border px-4 py-2 min-h-[44px]"
            style={{ borderColor: "var(--border)", background: "var(--background)" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Typ een bericht..."
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
              style={{ color: "var(--foreground)", maxHeight: "100px" }}
              rows={1}
            />
          </div>

          {input.trim() ? (
            <button onClick={send}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--teal)" }}>
              <Send size={17} color="white" />
            </button>
          ) : (
            <button
              onMouseDown={() => setRecording(true)}
              onMouseUp={sendVoice}
              onTouchStart={() => setRecording(true)}
              onTouchEnd={sendVoice}
              className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: recording ? "var(--coral)" : "var(--teal)", transition: "background 0.15s" }}>
              <Mic size={17} color="white" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={sendFoto} />

      {/* Factuur modal */}
      {showFactuur && (
        <div className="fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowFactuur(false); }}>
          <div className="w-full max-w-[480px] mx-auto rounded-t-3xl flex flex-col animate-slide-up overflow-hidden"
            style={{ background: "var(--background)", maxHeight: "90dvh" }}>

            {/* Modal header */}
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

            {/* Form */}
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
              {/* Omschrijving */}
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

              {/* Regels */}
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
                      <input
                        type="number"
                        value={r.aantal}
                        onChange={e => updateRegel(i, "aantal", Number(e.target.value))}
                        min={1}
                        className="w-12 px-2 py-2.5 rounded-xl border outline-none text-sm text-center"
                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--muted)" }}>€</span>
                        <input
                          type="number"
                          value={r.prijs || ""}
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

              {/* BTW toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-semibold text-sm">BTW (21%)</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Inclusief BTW op factuur</p>
                </div>
                <button
                  onClick={() => setFBtw(v => !v)}
                  className="touch-scale relative w-12 h-6 rounded-full transition-all"
                  style={{ background: fBtw ? "var(--teal)" : "var(--surface-2)" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: fBtw ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>

              {/* Totaal preview */}
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

            {/* Verstuur knop */}
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
