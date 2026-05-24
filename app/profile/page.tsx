"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Settings, Bell, ChevronRight, Camera, CreditCard,
  Building2, CheckCircle, Plus, ArrowLeftRight, Wrench,
  CalendarDays, LayoutDashboard, LogOut, ShieldCheck, X,
  TrendingUp, MessageCircle, Heart, ClipboardList, MapPin,
  Scan, FileText, Banknote, User, Trophy, Clock, Zap,
  Trash2, LucideIcon,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useInstellingenStore } from "@/lib/instellingenStore";

// ── Types ─────────────────────────────────────────────────────────────────
type Badge = {
  icon: string; label: string; desc: string; earned: boolean;
  certificaatTitel: string; certificaatOmschrijving: string;
  certificaatDatum?: string; kleur: string; zeldzaam?: boolean;
};

const BADGES_KLANT: Badge[] = [
  { icon: "⚡", label: "Betaalflits",   earned: true,  desc: "Altijd binnen 24u betaald",  kleur: "#F59E0B", certificaatTitel: "Snelste Betaler",   certificaatOmschrijving: "Jij betaalt altijd binnen 24 uur. Vakmensen houden van jou.", certificaatDatum: "12 feb 2026" },
  { icon: "🔁", label: "Vaste klant",   earned: true,  desc: "10+ klussen geboekt",        kleur: "#4F46E5", certificaatTitel: "Trouwe Supporter",  certificaatOmschrijving: "Meer dan 10 klussen geboekt via Servr. Absolute topklant!", certificaatDatum: "1 mei 2026" },
  { icon: "🥇", label: "First mover",  earned: true,  desc: "Eerste boeking geplaatst",   kleur: "#10B981", certificaatTitel: "Eerste Stap Gezet", certificaatOmschrijving: "Jij durfde als eerste de stap te zetten en een vakman te boeken via Servr.", certificaatDatum: "3 jan 2026" },
  { icon: "🚨", label: "Spoedheld",    earned: false, desc: "Eerste spoedjob ingediend",   kleur: "#EF4444", certificaatTitel: "Paniekknop Expert", certificaatOmschrijving: "Jij wacht niet af. Je drukt op de spoedknop en krijgt binnen minuten hulp.", zeldzaam: true },
  { icon: "🌍", label: "Reizig",       earned: false, desc: "Vakmensen in 5 steden",       kleur: "#6366F1", certificaatTitel: "De Reizende Klant", certificaatOmschrijving: "Van Amsterdam tot Antwerpen — vakmensen geboekt in 5 steden.", zeldzaam: true },
  { icon: "👑", label: "Platinum",     earned: false, desc: "25+ klussen geboekt",         kleur: "#8B5CF6", certificaatTitel: "Platinum Status",   certificaatOmschrijving: "De absolute top. Meer dan 25 klussen geboekt.", zeldzaam: true },
];

const HISTORY = [
  { provider: "Marco van den Berg", category: "Loodgieter",  date: "12 mei 2026", price: 85,  rating: 5, avatar: "https://i.pravatar.cc/150?img=11" },
  { provider: "Sofia Martins",      category: "Schoonmaak",  date: "3 mei 2026",  price: 35,  rating: 5, avatar: "https://i.pravatar.cc/150?img=47" },
  { provider: "Kim Nguyen",         category: "Schilder",    date: "22 apr 2026", price: 350, rating: 4, avatar: "https://i.pravatar.cc/150?img=56" },
];

// ── Badge modal ────────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-t-3xl overflow-hidden animate-slide-up max-h-[85vh] overflow-y-auto"
        style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>

        <div className="p-6 flex flex-col items-center gap-3 relative"
          style={{ background: `linear-gradient(160deg, ${badge.kleur}18 0%, transparent 100%)` }}>
          <div className="w-1 h-1 rounded-full mx-auto mt-0 mb-2" style={{ background: "#E5E7EB", width: 40, height: 4 }} />
          <button onClick={onClose}
            className="absolute top-4 right-4 touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F3F4F6" }}>
            <X size={14} style={{ color: "#6B7280" }} />
          </button>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
            style={{ background: badge.earned ? `${badge.kleur}18` : "#F3F4F6", border: `2px solid ${badge.earned ? badge.kleur + "40" : "#E5E7EB"}` }}>
            {badge.earned ? badge.icon : "🔒"}
          </div>
          {badge.zeldzaam && badge.earned && (
            <span className="text-[10px] font-black px-3 py-1 rounded-full text-white"
              style={{ background: badge.kleur }}>ZELDZAAM</span>
          )}
          <div className="text-center">
            <h2 className="font-black text-xl" style={{ color: "#111827" }}>{badge.earned ? badge.certificaatTitel : badge.label}</h2>
            <p className="text-sm mt-1 font-semibold" style={{ color: badge.kleur }}>{badge.label}</p>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {badge.earned ? (
            <div className="rounded-2xl p-4" style={{ background: `${badge.kleur}08`, border: `1px solid ${badge.kleur}25` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: badge.kleur }}>Officieel certificaat</p>
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{badge.certificaatOmschrijving}</p>
              {badge.certificaatDatum && (
                <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Behaald op {badge.certificaatDatum}</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-4" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <p className="font-bold text-sm mb-1" style={{ color: "#111827" }}>Hoe te ontgrendelen</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>{badge.desc}</p>
            </div>
          )}
          <button onClick={onClose}
            className="touch-scale w-full py-3.5 rounded-2xl font-bold text-white text-sm"
            style={{ background: badge.earned ? badge.kleur : "#9CA3AF" }}>
            {badge.earned ? "Top!" : "Begrepen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionTitle({ label }: { label: string }) {
  return <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF", letterSpacing: "0.06em" }}>{label}</h2>;
}

// ── Menu row ───────────────────────────────────────────────────────────────
function MenuRow({ href, icon: Icon, iconColor, iconBg, label, sub, badge }: {
  href: string; icon: LucideIcon; iconColor: string; iconBg: string;
  label: string; sub?: string; badge?: string;
}) {
  return (
    <Link href={href} className="touch-scale flex items-center gap-3.5 px-4 py-3.5 border-b last:border-0"
      style={{ borderColor: "#F3F4F6" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "#111827" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</p>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0"
          style={{ background: "#EF4444" }}>{badge}</span>
      )}
      <ChevronRight size={15} style={{ color: "#D1D5DB" }} />
    </Link>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { role, activeView, setActiveView, logout, isAdmin, name: userName, address: userAddress } = useUserStore();
  const { betaalmethoden, voegBetaalMethodeToe, verwijderBetaalMethode } = useInstellingenStore();
  const router = useRouter();
  const isVakman = activeView === "vakman";

  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [nieuwMethode, setNieuwMethode] = useState<"ideal" | "kaart" | "paypal">("ideal");
  const [nieuwBank, setNieuwBank] = useState("ING");

  const voegMethodeToe = () => {
    const labels: Record<string, string> = { ideal: `iDEAL — ${nieuwBank}`, kaart: "Creditcard", paypal: "PayPal" };
    voegBetaalMethodeToe({
      type: nieuwMethode === "kaart" ? "creditcard" : "ideal",
      label: labels[nieuwMethode],
      icoon: nieuwMethode === "kaart" ? "💳" : nieuwMethode === "paypal" ? "🅿️" : "🏦",
      bankNaam: nieuwMethode === "ideal" ? nieuwBank : undefined,
    });
    setShowAddPayment(false);
  };

  // ── Gradient per modus ─────────────────────────────────────────────────
  const heroGradient = isVakman
    ? "linear-gradient(160deg, #312e81 0%, #4338CA 60%, #6366F1 100%)"
    : "linear-gradient(160deg, #4F46E5 0%, #6366F1 60%, #818CF8 100%)";

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in" style={{ background: "#F9FAFB" }}>

      {/* ════════════════════════════════════
          HERO HEADER
      ════════════════════════════════════ */}
      <div style={{ background: heroGradient }}>
        <div className="px-5 pt-14 pb-8">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white font-black text-xl tracking-tight">Profiel</h1>
            <div className="flex items-center gap-2">
              <Link href="/meldingen"
                className="touch-scale relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Bell size={17} color="white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 border border-white/30" />
              </Link>
              <Link href="/instellingen"
                className="touch-scale w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <Settings size={17} color="white" />
              </Link>
            </div>
          </div>

          {/* Avatar + naam */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-shrink-0">
              <img src="https://i.pravatar.cc/150?img=68"
                className="w-20 h-20 rounded-2xl object-cover"
                style={{ border: "3px solid rgba(255,255,255,0.35)" }} alt="profiel" />
              <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white flex items-center justify-center touch-scale shadow">
                <Camera size={13} style={{ color: "#4F46E5" }} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-xl truncate">{userName || "Gebruiker"}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} color="rgba(255,255,255,0.6)" />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{userAddress || "Amsterdam"}</p>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                  <Star size={10} className="fill-amber-300 text-amber-300" /> 4.9
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.18)", color: "white" }}>
                  {isVakman ? "Vakman" : "Klant"}
                </span>
                {isAdmin && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.25)", color: "white" }}>Admin</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {(isVakman
              ? [
                  { v: "47",    l: "Klussen" },
                  { v: "€2.840",l: "Verdiend" },
                  { v: "4.9",   l: "Rating" },
                ]
              : [
                  { v: "13",   l: "Boekingen" },
                  { v: "€470", l: "Uitgegeven" },
                  { v: "100%", l: "Betaald" },
                ]
            ).map(s => (
              <div key={s.l} className="flex flex-col items-center py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.12)" }}>
                <span className="font-black text-white text-base">{s.v}</span>
                <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          ROL SWITCHER
      ════════════════════════════════════ */}
      {role === "beide" && (
        <div className="px-4 -mt-4 relative z-10 mb-1">
          <div className="rounded-2xl overflow-hidden flex"
            style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "1px solid #F3F4F6" }}>
            {(["klant", "vakman"] as const).map(r => (
              <button key={r} onClick={() => setActiveView(r)}
                className="touch-scale flex-1 py-3.5 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                style={{
                  background: activeView === r ? (r === "vakman" ? "#312e81" : "#4F46E5") : "transparent",
                  color: activeView === r ? "white" : "#9CA3AF",
                }}>
                {r === "klant" ? <User size={15} /> : <Wrench size={15} />}
                {r === "klant" ? "Klantmodus" : "Vakmanmodus"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-6 mt-5">

        {/* ════════════════════════════════════
            VAKMAN — Snelle acties
        ════════════════════════════════════ */}
        {isVakman && (
          <section>
            <SectionTitle label="Beheer" />
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              <MenuRow href="/dashboard"   icon={LayoutDashboard} iconColor="#4F46E5" iconBg="#EEF2FF" label="Dashboard"       sub="Overzicht, stats & omzet" />
              <MenuRow href="/agenda"      icon={CalendarDays}    iconColor="#10B981" iconBg="#ECFDF5" label="Agenda"           sub="Aankomende boekingen" />
              <MenuRow href="/diensten"    icon={Wrench}          iconColor="#6366F1" iconBg="#EEF2FF" label="Mijn diensten"    sub="Prijzen & aanbod beheren" />
              <MenuRow href="/verdiensten" icon={Banknote}        iconColor="#F59E0B" iconBg="#FFFBEB" label="Verdiensten"      sub="Na 10% Servr commissie" />
              <MenuRow href="/offerte/maak" icon={FileText}       iconColor="#8B5CF6" iconBg="#F5F3FF" label="Offerte maken"    sub="PDF-generator" />
              <MenuRow href="/bedrijf"     icon={Building2}       iconColor="#0EA5E9" iconBg="#F0F9FF" label="Bedrijfsprofiel"  sub="KvK, BTW, IBAN" />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            VAKMAN — Recente klussen
        ════════════════════════════════════ */}
        {isVakman && (
          <section>
            <SectionTitle label="Recente klussen" />
            <div className="flex flex-col gap-2.5">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #F3F4F6" }}>
                  <img src={h.avatar} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#111827" }}>{h.provider}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{h.category} · {h.date}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={10} className={j < h.rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <span className="font-black text-base flex-shrink-0" style={{ color: "#4F46E5" }}>€{h.price}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            KLANT — Snelle acties
        ════════════════════════════════════ */}
        {!isVakman && (
          <section>
            <SectionTitle label="Snelle acties" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/opdracht/nieuw",  icon: ClipboardList, color: "#4F46E5", bg: "#EEF2FF", label: "Opdracht plaatsen",  sub: "Nieuwe aanvraag" },
                { href: "/berichten",        icon: MessageCircle, color: "#10B981", bg: "#ECFDF5", label: "Berichten",          sub: "2 ongelezen" },
                { href: "/mijn-opdrachten",  icon: Clock,         color: "#F59E0B", bg: "#FFFBEB", label: "Mijn opdrachten",   sub: "3 actief" },
                { href: "/favorieten",       icon: Heart,         color: "#EF4444", bg: "#FEF2F2", label: "Favorieten",        sub: "4 vakmensen" },
                { href: "/scan",             icon: Scan,          color: "#8B5CF6", bg: "#F5F3FF", label: "AI Prijsscanner",   sub: "Foto → prijsschatting" },
                { href: "/te-betalen",       icon: CreditCard,    color: "#0EA5E9", bg: "#F0F9FF", label: "Betalen",           sub: "Openstaande offertes" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="touch-scale flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}>
                      <Icon size={18} style={{ color: item.color }} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight" style={{ color: "#111827" }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{item.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            KLANT — Recente boekingen
        ════════════════════════════════════ */}
        {!isVakman && (
          <section>
            <SectionTitle label="Recente boekingen" />
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3.5 px-4 py-3.5 border-b last:border-0"
                  style={{ borderColor: "#F3F4F6" }}>
                  <img src={h.avatar} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#111827" }}>{h.provider}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{h.category} · {h.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: "#4F46E5" }}>€{h.price}</p>
                    <div className="flex items-center gap-0.5 mt-1 justify-end">
                      {Array.from({ length: h.rating }).map((_, j) => (
                        <Star key={j} size={9} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            KLANT — Badges
        ════════════════════════════════════ */}
        {!isVakman && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle label={`Badges · ${BADGES_KLANT.filter(b => b.earned).length}/${BADGES_KLANT.length}`} />
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
              {BADGES_KLANT.map(b => (
                <button key={b.label} onClick={() => setActiveBadge(b)}
                  className="touch-scale flex-shrink-0 flex flex-col items-center gap-2 p-3.5 rounded-2xl"
                  style={{ background: "#fff", border: `1.5px solid ${b.earned ? b.kleur + "40" : "#E5E7EB"}`, width: 90, opacity: b.earned ? 1 : 0.5 }}>
                  <span className="text-3xl">{b.earned ? b.icon : "🔒"}</span>
                  <p className="text-[10px] font-bold text-center leading-tight" style={{ color: b.earned ? b.kleur : "#9CA3AF" }}>{b.label}</p>
                  {b.zeldzaam && b.earned && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: b.kleur }}>ZELDZAAM</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ════════════════════════════════════
            BETAALMETHODEN
        ════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle label="Betaalmethoden" />
            <button onClick={() => setShowAddPayment(true)}
              className="touch-scale flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl -mt-3"
              style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <Plus size={12} /> Toevoegen
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            {betaalmethoden.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                  <CreditCard size={20} style={{ color: "#4F46E5" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>Geen betaalmethode</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Voeg een betaalmethode toe om te betalen</p>
                <button onClick={() => setShowAddPayment(true)}
                  className="touch-scale mt-1 px-4 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "#4F46E5" }}>
                  Toevoegen
                </button>
              </div>
            ) : (
              betaalmethoden.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                  style={{ borderColor: "#F3F4F6" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#F3F4F6" }}>
                    <CreditCard size={18} style={{ color: "#6B7280" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#111827" }}>{m.label}</p>
                    {m.vervaldatum && <p className="text-xs" style={{ color: "#9CA3AF" }}>Verloopt {m.vervaldatum}</p>}
                  </div>
                  <button onClick={() => verwijderBetaalMethode(m.id)}
                    className="touch-scale w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "#FEF2F2" }}>
                    <Trash2 size={14} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add payment form */}
          {showAddPayment && (
            <div className="mt-3 rounded-2xl p-4 flex flex-col gap-3 animate-slide-up"
              style={{ background: "#fff", border: "1px solid #E5E7EB" }}>
              <p className="font-bold text-sm" style={{ color: "#111827" }}>Betaalmethode toevoegen</p>
              <div className="flex gap-2">
                {(["ideal", "kaart", "paypal"] as const).map(type => (
                  <button key={type} onClick={() => setNieuwMethode(type)}
                    className="touch-scale flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: nieuwMethode === type ? "#4F46E5" : "#E5E7EB",
                      background: nieuwMethode === type ? "#EEF2FF" : "transparent",
                      color: nieuwMethode === type ? "#4F46E5" : "#9CA3AF",
                    }}>
                    {type === "ideal" ? "iDEAL" : type === "kaart" ? "Kaart" : "PayPal"}
                  </button>
                ))}
              </div>
              {nieuwMethode === "ideal" && (
                <select value={nieuwBank} onChange={e => setNieuwBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ borderColor: "#E5E7EB", background: "#F9FAFB", color: "#111827", outline: "none" }}>
                  {["ING", "ABN AMRO", "Rabobank", "SNS", "ASN", "Bunq", "Triodos"].map(b =>
                    <option key={b} value={b}>{b}</option>
                  )}
                </select>
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowAddPayment(false)}
                  className="touch-scale flex-1 py-2.5 rounded-xl font-semibold text-sm border"
                  style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                  Annuleren
                </button>
                <button onClick={voegMethodeToe}
                  className="touch-scale flex-1 py-2.5 rounded-xl font-bold text-white text-sm"
                  style={{ background: "#4F46E5" }}>
                  Opslaan
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════
            INSTELLINGEN
        ════════════════════════════════════ */}
        <section>
          <SectionTitle label="Account" />
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#fff", border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            <MenuRow href="/instellingen" icon={Settings}   iconColor="#6B7280" iconBg="#F3F4F6" label="Instellingen"    sub="Taal, notificaties, privacy" />
            <MenuRow href="/meldingen"    icon={Bell}       iconColor="#F59E0B" iconBg="#FFFBEB" label="Meldingen"       sub="2 ongelezen" badge="2" />
            {isAdmin && (
              <MenuRow href="/admin" icon={ShieldCheck} iconColor="#4F46E5" iconBg="#EEF2FF" label="Servr Admin" sub="Omzet · Klanten · Commissie" />
            )}
          </div>
        </section>

        {/* Uitloggen */}
        <button onClick={() => { logout(); router.push("/onboarding"); }}
          className="touch-scale flex items-center justify-center gap-2 text-sm font-semibold py-3.5 w-full rounded-2xl"
          style={{ color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <LogOut size={15} />
          Uitloggen
        </button>

      </div>

      {activeBadge && <BadgeModal badge={activeBadge} onClose={() => setActiveBadge(null)} />}
    </div>
  );
}
