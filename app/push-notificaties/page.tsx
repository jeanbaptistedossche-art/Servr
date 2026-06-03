"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Bell, BellOff, Check, X, Zap,
  MessageCircle, Calendar, Euro, Star, MapPin,
  Shield, AlertCircle, Volume2, VolumeX, Moon,
  Clock, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type NotifCategorie =
  | "berichten"
  | "boekingen"
  | "betalingen"
  | "reviews"
  | "tracking"
  | "onderhoud"
  | "promoties"
  | "veiligheid";

interface NotifInstelling {
  categorie: NotifCategorie;
  push: boolean;
  email: boolean;
  sms: boolean;
  geluid: boolean;
}

interface RecentNotif {
  id: string;
  titel: string;
  tekst: string;
  categorie: NotifCategorie;
  tijd: string;
  gelezen: boolean;
}

// ── Config ─────────────────────────────────────────────────────────────────
const CAT_CFG: Record<NotifCategorie, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  berichten:  { label: "Berichten",      icon: MessageCircle, color: "#4F46E5", bg: "#EEF2FF", desc: "Nieuwe chat berichten van klanten en vakmans" },
  boekingen:  { label: "Boekingen",      icon: Calendar,      color: "#10B981", bg: "#ECFDF5", desc: "Bevestigingen, annuleringen en herinneringen" },
  betalingen: { label: "Betalingen",     icon: Euro,          color: "#F59E0B", bg: "#FFFBEB", desc: "Ontvangen betalingen en openstaande facturen" },
  reviews:    { label: "Reviews",        icon: Star,          color: "#8B5CF6", bg: "#F5F3FF", desc: "Nieuwe beoordelingen van klanten" },
  tracking:   { label: "GPS Tracking",   icon: MapPin,        color: "#0EA5E9", bg: "#F0F9FF", desc: "Statusupdates van onderweg zijnde vakmans" },
  onderhoud:  { label: "Onderhoud",      icon: Bell,          color: "#EC4899", bg: "#FDF2F8", desc: "Herinneringen voor geplande onderhoudstaken" },
  promoties:  { label: "Promoties",      icon: Zap,           color: "#D97706", bg: "#FFFBEB", desc: "Aanbiedingen, tips en nieuwsbrief" },
  veiligheid: { label: "Veiligheid",     icon: Shield,        color: "#DC2626", bg: "#FEF2F2", desc: "Inlogpogingen en verdachte activiteit" },
};

const INIT_INSTELLINGEN: NotifInstelling[] = (Object.keys(CAT_CFG) as NotifCategorie[]).map(cat => ({
  categorie: cat,
  push: cat !== "promoties",
  email: cat === "betalingen" || cat === "boekingen" || cat === "veiligheid",
  sms: cat === "veiligheid",
  geluid: cat !== "promoties" && cat !== "onderhoud",
}));

const RECENTE_NOTIFS: RecentNotif[] = [
  { id:"1", titel: "💬 Nieuw bericht", tekst: "Jan Bakker: Wanneer kunt u langskomen?", categorie: "berichten", tijd: "2 min geleden", gelezen: false },
  { id:"2", titel: "💳 Betaling ontvangen", tekst: "€1.200,00 ontvangen van Ria Verhoeven", categorie: "betalingen", tijd: "1 uur geleden", gelezen: false },
  { id:"3", titel: "⭐ Nieuwe review", tekst: "Marco van den Berg heeft je 5 sterren gegeven", categorie: "reviews", tijd: "3 uur geleden", gelezen: true },
  { id:"4", titel: "📅 Boeking bevestigd", tekst: "Kees Pietersen heeft jouw offerte geaccepteerd", categorie: "boekingen", tijd: "gisteren", gelezen: true },
  { id:"5", titel: "🔧 Onderhoud herinnering", tekst: "CV-ketel onderhoud is over 7 dagen gepland", categorie: "onderhoud", tijd: "gisteren", gelezen: true },
];

// ── Main ───────────────────────────────────────────────────────────────────
export default function PushNotificatiesPage() {
  const router = useRouter();
  const [instellingen, setInstellingen] = useState<NotifInstelling[]>(INIT_INSTELLINGEN);
  const [activeTab, setActiveTab] = useState<"instellingen" | "recent" | "stilteperiode">("instellingen");
  const [masterPush, setMasterPush] = useState(true);
  const [stilteAan, setStilteAan] = useState(false);
  const [stilteVan, setStilteVan] = useState("22:00");
  const [stilteTot, setStilteTot] = useState("07:00");
  const [testSent, setTestSent] = useState(false);

  const ungelezen = RECENTE_NOTIFS.filter(n => !n.gelezen).length;

  const toggle = (cat: NotifCategorie, kanaal: keyof Omit<NotifInstelling, "categorie">) => {
    setInstellingen(is => is.map(i =>
      i.categorie === cat ? { ...i, [kanaal]: !i[kanaal as keyof NotifInstelling] } : i
    ));
  };

  const sendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-full pb-28 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.push('/profile')}
          className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <ChevronLeft size={20} style={{ color: "#475569" }} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate" style={{ color: "#0f172a" }}>Notificaties</h1>
          <p className="text-xs truncate" style={{ color: "#94a3b8" }}>Push, e-mail & SMS instellingen</p>
        </div>
        {ungelezen > 0 && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "#EF4444" }}>
            <span className="text-white text-[10px] font-black">{ungelezen}</span>
          </div>
        )}
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* Master toggle */}
        <div className="rounded-3xl p-5"
          style={{
            background: masterPush ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "#F1F5F9",
            boxShadow: masterPush ? "0 12px 40px rgba(79,70,229,0.35)" : "none",
          }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: masterPush ? "rgba(255,255,255,0.2)" : "#E5E7EB" }}>
              {masterPush ? <Bell size={26} color="white" /> : <BellOff size={26} style={{ color: "#94a3b8" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-base" style={{ color: masterPush ? "white" : "#0f172a" }}>
                Push-notificaties
              </p>
              <p className="text-xs mt-0.5" style={{ color: masterPush ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                {masterPush ? "Alle notificaties staan aan" : "Alle notificaties uitgeschakeld"}
              </p>
            </div>
            <button onClick={() => setMasterPush(m => !m)}
              className="touch-scale flex-shrink-0 w-14 h-7 rounded-full flex items-center transition-all"
              style={{
                background: masterPush ? "rgba(255,255,255,0.3)" : "#E2E8F0",
                justifyContent: masterPush ? "flex-end" : "flex-start",
                padding: "2px",
              }}>
              <div className="w-6 h-6 rounded-full" style={{ background: masterPush ? "white" : "#94a3b8" }} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 rounded-2xl gap-1" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          {([["instellingen","Instellingen"], ["recent","Recent"], ["stilteperiode","Stilteperiode"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-[11px] transition-all"
              style={{
                background: activeTab === key ? "linear-gradient(135deg, #4F46E5, #818CF8)" : "transparent",
                color: activeTab === key ? "#fff" : "#94a3b8",
                boxShadow: activeTab === key ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab: Instellingen */}
        {activeTab === "instellingen" && (
          <div className="flex flex-col gap-3">
            {instellingen.map(inst => {
              const cfg = CAT_CFG[inst.categorie];
              const Icon = cfg.icon;
              return (
                <div key={inst.categorie} className="rounded-3xl p-4 flex flex-col gap-3"
                  style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  {/* Category header */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{cfg.label}</p>
                      <p className="text-[10px] leading-tight truncate" style={{ color: "#94a3b8" }}>{cfg.desc}</p>
                    </div>
                  </div>
                  {/* Toggles row */}
                  <div className="grid grid-cols-4 gap-2">
                    {(["push","email","sms","geluid"] as const).map(kanaal => (
                      <button key={kanaal} onClick={() => toggle(inst.categorie, kanaal)}
                        className="touch-scale flex flex-col items-center gap-1 py-2 rounded-2xl"
                        style={{
                          background: inst[kanaal] ? cfg.bg : "#F8FAFC",
                          border: `1.5px solid ${inst[kanaal] ? cfg.color + "30" : "#E5E7EB"}`,
                        }}>
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                          style={{ background: inst[kanaal] ? cfg.color : "#E5E7EB" }}>
                          {inst[kanaal] && <Check size={10} color="white" strokeWidth={3} />}
                        </div>
                        <span className="text-[9px] font-black uppercase" style={{ color: inst[kanaal] ? cfg.color : "#94a3b8" }}>{kanaal}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Test button */}
            <button onClick={sendTest}
              className="touch-scale w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{
                background: testSent ? "#ECFDF5" : "#EEF2FF",
                color: testSent ? "#059669" : "#4F46E5",
              }}>
              {testSent ? <><Check size={16} /> Testmelding verzonden!</> : <><Bell size={16} /> Testmelding versturen</>}
            </button>
          </div>
        )}

        {/* Tab: Recent */}
        {activeTab === "recent" && (
          <div className="flex flex-col gap-2">
            {RECENTE_NOTIFS.map(n => {
              const cfg = CAT_CFG[n.categorie];
              return (
                <div key={n.id} className="flex items-start gap-3 p-4 rounded-3xl"
                  style={{
                    background: n.gelezen ? "#fff" : cfg.bg,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    border: n.gelezen ? "none" : `1.5px solid ${cfg.color}20`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: n.gelezen ? "#F1F5F9" : "rgba(255,255,255,0.7)" }}>
                    <span className="text-lg">{n.titel.split(" ")[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{n.titel.substring(n.titel.indexOf(" ") + 1)}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "#64748b" }}>{n.tekst}</p>
                    <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>{n.tijd}</p>
                  </div>
                  {!n.gelezen && (
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: cfg.color }} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Stilteperiode */}
        {activeTab === "stilteperiode" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: stilteAan ? "#EEF2FF" : "#F1F5F9" }}>
                    <Moon size={18} style={{ color: stilteAan ? "#4F46E5" : "#94a3b8" }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Stilteperiode</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>Geen notificaties in deze periode</p>
                  </div>
                </div>
                <button onClick={() => setStilteAan(s => !s)}
                  className="touch-scale w-14 h-7 rounded-full flex items-center transition-all flex-shrink-0"
                  style={{
                    background: stilteAan ? "#4F46E5" : "#E2E8F0",
                    justifyContent: stilteAan ? "flex-end" : "flex-start",
                    padding: "2px",
                  }}>
                  <div className="w-6 h-6 rounded-full bg-white" />
                </button>
              </div>
              {stilteAan && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Van", value: stilteVan, setter: setStilteVan },
                    { label: "Tot", value: stilteTot, setter: setStilteTot },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-xs font-black uppercase tracking-widest mb-2 block" style={{ color: "#94a3b8" }}>{f.label}</label>
                      <input type="time" value={f.value} onChange={e => f.setter(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl font-bold text-sm outline-none"
                        style={{ background: "#F8FAFF", border: "2px solid #4F46E5", color: "#0f172a" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl p-4" style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}>
              <div className="flex items-start gap-2">
                <Shield size={16} style={{ color: "#4F46E5" }} className="flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: "#3730A3" }}>
                  Veiligheidsnotificaties (zoals verdachte inlogpogingen) worden altijd verstuurd, ook tijdens de stilteperiode.
                </p>
              </div>
            </div>
            <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Notificatie geluid</p>
              <div className="grid grid-cols-3 gap-2">
                {["Standaard", "Zacht", "Geen"].map(s => (
                  <button key={s}
                    className="touch-scale py-3 rounded-2xl font-bold text-xs"
                    style={{
                      background: s === "Standaard" ? "#EEF2FF" : "#F8FAFC",
                      color: s === "Standaard" ? "#4F46E5" : "#64748b",
                      border: `2px solid ${s === "Standaard" ? "#4F46E5" : "#E5E7EB"}`,
                    }}>
                    {s === "Geen" ? <VolumeX size={14} className="mx-auto" /> : <Volume2 size={14} className="mx-auto" />}
                    <span className="block mt-1">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
