"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video, VideoOff, Mic, MicOff,
  PhoneOff, Camera, RotateCcw, MessageCircle,
  Maximize2, ArrowLeft,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type CallStatus = "idle" | "bellen" | "verbonden" | "bezig" | "afgelopen";

interface Contact {
  id: string;
  naam: string;
  avatar: string;
  rol: "klant" | "vakman";
  specialiteit?: string;
  online: boolean;
  recentGesprek?: string;
}

interface Gesprek {
  id: string;
  met: string;
  avatar: string;
  datum: string;
  duur: string;
  gemist: boolean;
}

// ── Data ───────────────────────────────────────────────────────────────────
const CONTACTS: Contact[] = [
  { id:"1", naam: "Marco van den Berg", avatar: "https://i.pravatar.cc/150?img=11", rol: "vakman", specialiteit: "Loodgieter",  online: true,  recentGesprek: "gisteren" },
  { id:"2", naam: "Erik van Dijk",       avatar: "https://i.pravatar.cc/150?img=57", rol: "vakman", specialiteit: "Elektricien", online: true,  recentGesprek: "2 dagen geleden" },
  { id:"3", naam: "Jan Bakker",          avatar: "https://i.pravatar.cc/150?img=15", rol: "klant",  online: false, recentGesprek: "vorige week" },
  { id:"4", naam: "Ria Verhoeven",       avatar: "https://i.pravatar.cc/150?img=23", rol: "klant",  online: true  },
  { id:"5", naam: "Daan Willems",        avatar: "https://i.pravatar.cc/150?img=12", rol: "vakman", specialiteit: "CV-monteur", online: false },
];

const GESPREKKEN: Gesprek[] = [
  { id:"1", met: "Marco van den Berg", avatar: "https://i.pravatar.cc/150?img=11", datum: "22 mei · 14:30", duur: "8 min 42 sec", gemist: false },
  { id:"2", met: "Jan Bakker",          avatar: "https://i.pravatar.cc/150?img=15", datum: "21 mei · 11:15", duur: "Gemist",        gemist: true  },
  { id:"3", met: "Erik van Dijk",       avatar: "https://i.pravatar.cc/150?img=57", datum: "20 mei · 09:05", duur: "3 min 20 sec",  gemist: false },
];

// ── Call Screen ────────────────────────────────────────────────────────────
function CallScreen({
  contact, onEnd
}: { contact: Contact; onEnd: () => void }) {
  const [status, setStatus] = useState<CallStatus>("bellen");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStatus("verbonden"), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (status !== "verbonden") return;
    const interval = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "#000" }}>
      <div className="flex-1 relative overflow-hidden"
        style={{
          background: status === "verbonden"
            ? "linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)"
            : "linear-gradient(160deg, #0f172a, #1e293b)",
        }}>
        {status === "verbonden" && (
          <>
            <div className="absolute inset-0 opacity-20"
              style={{ background: "radial-gradient(ellipse at 30% 40%, #2B4030 0%, transparent 60%)" }} />
            <div className="absolute inset-0 opacity-10"
              style={{ background: "radial-gradient(ellipse at 70% 60%, #C97A4D 0%, transparent 50%)" }} />
          </>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <img src={contact.avatar} alt={contact.naam}
              className="w-28 h-28 rounded-3xl object-cover"
              style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.2), 0 20px 60px rgba(0,0,0,0.5)" }} />
            {status === "bellen" && (
              <div className="absolute inset-0 rounded-3xl animate-ping"
                style={{ background: "rgba(43,64,48,0.4)", animationDuration: "1.5s" }} />
            )}
          </div>
          <div className="text-center">
            <p className="font-black text-white text-xl" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>{contact.naam}</p>
            {contact.specialiteit && (
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', sans-serif" }}>{contact.specialiteit}</p>
            )}
            <p className="text-sm mt-2 font-medium" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>
              {status === "bellen" ? "Belt..." : status === "verbonden" ? fmtTime(secs) : "Verbinding verbroken"}
            </p>
          </div>
        </div>

        {camOn && status === "verbonden" && (
          <div className="absolute top-12 right-4 w-24 h-36 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.2)" }}>
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)" }}>
              <Camera size={24} color="rgba(255,255,255,0.4)" />
            </div>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12 pb-4"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}>
          <button onClick={onEnd}
            className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={20} color="white" />
          </button>
          {status === "verbonden" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-bold">Live · HD</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-8 flex flex-col gap-6"
        style={{ background: "linear-gradient(to top, #000, #0f172a)" }}>
        <div className="flex justify-center gap-5">
          {[
            { icon: RotateCcw, label: "Wisselen",   action: () => {} },
            { icon: MessageCircle, label: "Chat",    action: () => {} },
            { icon: Maximize2, label: "Volledig",    action: () => {} },
          ].map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.label} onClick={btn.action}
                className="touch-scale flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon size={20} color="white" />
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>{btn.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-6">
          <button onClick={() => setMicOn(m => !m)}
            className="touch-scale flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: micOn ? "rgba(255,255,255,0.15)" : "#EF4444" }}>
              {micOn ? <Mic size={22} color="white" /> : <MicOff size={22} color="white" />}
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>{micOn ? "Dempen" : "Aan"}</span>
          </button>

          <button onClick={onEnd}
            className="touch-scale flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "#EF4444", boxShadow: "0 8px 32px rgba(239,68,68,0.5)" }}>
              <PhoneOff size={28} color="white" />
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>Ophangen</span>
          </button>

          <button onClick={() => setCamOn(c => !c)}
            className="touch-scale flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: camOn ? "rgba(255,255,255,0.15)" : "#EF4444" }}>
              {camOn ? <Video size={22} color="white" /> : <VideoOff size={22} color="white" />}
            </div>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Inter', sans-serif" }}>{camOn ? "Camera uit" : "Camera aan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function VideoBellenPage() {
  const router = useRouter();
  const [calling, setCalling] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<"contacten" | "recenten">("contacten");

  if (calling) {
    return <CallScreen contact={calling} onEnd={() => setCalling(null)} />;
  }

  return (
    <div className="flex flex-col min-h-full animate-fade-in" style={{ background: "#F5EFE5" }}>

      {/* Sticky Header */}
      <div className="px-5 pt-14 pb-4"
        style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black truncate"
              style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              Video Bellen
            </h1>
            <p className="text-xs truncate" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
              Bel gratis met klanten &amp; vakmensen
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
          {([["contacten","Contacten"], ["recenten","Recente gesprekken"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-xs transition-all"
              style={{
                background: activeTab === key ? "#2B4030" : "transparent",
                color: activeTab === key ? "#F5EFE5" : "#8A8A83",
                fontFamily: "'Inter', sans-serif",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-5">

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: "📹", label: "HD Video",    desc: "1080p" },
            { emoji: "🔒", label: "Versleuteld", desc: "End-to-end" },
            { emoji: "💸", label: "Gratis",       desc: "Geen kosten" },
          ].map(f => (
            <div key={f.label} className="rounded-2xl p-3 flex flex-col items-center gap-1"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <span className="text-2xl">{f.emoji}</span>
              <p className="font-bold text-xs" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>{f.label}</p>
              <p className="text-[10px]" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Contacts */}
        {activeTab === "contacten" && (
          <div className="flex flex-col gap-3">
            {CONTACTS.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-4"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <div className="relative flex-shrink-0">
                  <img src={c.avatar} className="w-14 h-14 rounded-2xl object-cover" alt={c.naam} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full"
                    style={{ background: c.online ? "#22C55E" : "#E5DDD0", border: "2px solid #F5EFE5" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>{c.naam}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                    {c.specialiteit ?? (c.rol === "klant" ? "Klant" : "Vakman")} · {c.online ? "Online" : "Offline"}
                  </p>
                  {c.recentGesprek && (
                    <p className="text-xs mt-0.5" style={{ color: "#8A8A83", fontFamily: "'Inter', sans-serif" }}>Gesprek: {c.recentGesprek}</p>
                  )}
                </div>
                <button onClick={() => c.online && setCalling(c)}
                  className="touch-scale w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: c.online ? "#2B4030" : "#FBF7F0",
                    border: c.online ? "none" : "0.5px solid #E5DDD0",
                  }}>
                  <Video size={17} color={c.online ? "#F5EFE5" : "#8A8A83"} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recent calls */}
        {activeTab === "recenten" && (
          <div className="flex flex-col gap-2">
            {GESPREKKEN.map(g => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3.5"
                style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
                <img src={g.avatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "#1A1D1A", fontFamily: "'Inter', sans-serif" }}>{g.met}</p>
                  <p className="text-xs mt-0.5" style={{ color: g.gemist ? "#EF4444" : "#8A8A83", fontFamily: "'Inter', sans-serif" }}>
                    {g.datum}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-semibold" style={{ color: g.gemist ? "#EF4444" : "#5C5C56", fontFamily: "'Inter', sans-serif" }}>
                    {g.duur}
                  </span>
                  <button onClick={() => {
                    const contact = CONTACTS.find(c => c.naam === g.met);
                    if (contact) setCalling(contact);
                  }}
                    className="touch-scale text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: "#2B4030", color: "#F5EFE5", border: "none", fontFamily: "'Inter', sans-serif" }}>
                    Terugbellen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
