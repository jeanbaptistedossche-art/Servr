"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, Settings, Bell, ChevronRight, Camera, CreditCard,
  Building2, CheckCircle, Plus, Wrench,
  CalendarDays, LayoutDashboard, LogOut, ShieldCheck, X,
  MessageCircle, Heart, ClipboardList, MapPin,
  Scan, FileText, Banknote, User, Clock, Zap,
  Trash2, LucideIcon, TrendingUp, ArrowRight,
  Edit3, Phone, Mail, Globe, Euro, Image, Check,
  ChevronLeft, Package, Users, Shield, Award, PenTool, QrCode,
  Home, CalendarCheck, ShieldCheck as ShieldTick, BarChart3, PiggyBank,
  BookOpen, Lock, Video, Fingerprint, RefreshCw, Navigation,
  GraduationCap, Wallet,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useInstellingenStore } from "@/lib/instellingenStore";

// ── Types ──────────────────────────────────────────────────────────────────
type Badge = {
  icon: string; label: string; desc: string; earned: boolean;
  certificaatTitel: string; certificaatOmschrijving: string;
  certificaatDatum?: string; kleur: string; zeldzaam?: boolean;
};

const BADGES_KLANT: Badge[] = [
  { icon: "⚡", label: "Betaalflits",  earned: true,  desc: "Altijd binnen 24u betaald",  kleur: "#F59E0B", certificaatTitel: "Snelste Betaler",   certificaatOmschrijving: "Jij betaalt altijd binnen 24 uur.", certificaatDatum: "12 feb 2026" },
  { icon: "🔁", label: "Vaste klant",  earned: true,  desc: "10+ klussen geboekt",         kleur: "#4F46E5", certificaatTitel: "Trouwe Supporter",  certificaatOmschrijving: "Meer dan 10 klussen geboekt via Servr.", certificaatDatum: "1 mei 2026" },
  { icon: "🥇", label: "First mover", earned: true,  desc: "Eerste boeking geplaatst",    kleur: "#10B981", certificaatTitel: "Eerste Stap Gezet", certificaatOmschrijving: "Jij durfde als eerste de stap te zetten.", certificaatDatum: "3 jan 2026" },
  { icon: "🚨", label: "Spoedheld",   earned: false, desc: "Eerste spoedjob ingediend",    kleur: "#EF4444", certificaatTitel: "Paniekknop Expert", certificaatOmschrijving: "Jij wacht niet af.", zeldzaam: true },
  { icon: "👑", label: "Platinum",    earned: false, desc: "25+ klussen geboekt",          kleur: "#8B5CF6", certificaatTitel: "Platinum Status",   certificaatOmschrijving: "De absolute top.", zeldzaam: true },
];

const HISTORY = [
  { provider: "Marco van den Berg", category: "Loodgieter",  date: "12 mei 2026", price: 85,  rating: 5, avatar: "https://i.pravatar.cc/150?img=11" },
  { provider: "Sofia Martins",      category: "Schoonmaak",  date: "3 mei 2026",  price: 35,  rating: 5, avatar: "https://i.pravatar.cc/150?img=47" },
  { provider: "Kim Nguyen",         category: "Schilder",    date: "22 apr 2026", price: 350, rating: 4, avatar: "https://i.pravatar.cc/150?img=56" },
];

// ── Badge modal ────────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="w-full max-w-[480px] rounded-t-[32px] overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
        <div className="p-6 flex flex-col items-center gap-3 relative"
          style={{ background: `linear-gradient(160deg, ${badge.kleur}15 0%, transparent 100%)` }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-2" style={{ background: "#E5E7EB" }} />
          <button onClick={onClose} className="absolute top-4 right-4 touch-scale w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#F3F4F6" }}>
            <X size={14} style={{ color: "#6B7280" }} />
          </button>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{ background: badge.earned ? `${badge.kleur}15` : "#F3F4F6", border: `2px solid ${badge.earned ? badge.kleur + "30" : "#E5E7EB"}` }}>
            {badge.earned ? badge.icon : "🔒"}
          </div>
          <div className="text-center">
            <h2 className="font-black text-xl" style={{ color: "#0f172a" }}>{badge.earned ? badge.certificaatTitel : badge.label}</h2>
            <p className="text-sm mt-1 font-semibold" style={{ color: badge.kleur }}>{badge.label}</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="rounded-2xl p-4" style={{ background: `${badge.kleur}08`, border: `1px solid ${badge.kleur}20` }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: badge.kleur }}>
              {badge.earned ? "Officieel certificaat" : "Hoe te ontgrendelen"}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>
              {badge.earned ? badge.certificaatOmschrijving : badge.desc}
            </p>
            {badge.certificaatDatum && badge.earned && (
              <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Behaald op {badge.certificaatDatum}</p>
            )}
          </div>
          <button onClick={onClose} className="touch-scale w-full py-4 rounded-2xl font-bold text-white text-sm"
            style={{ background: badge.earned ? badge.kleur : "#94a3b8" }}>
            {badge.earned ? "Geweldig! 🎉" : "Begrepen"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Profile Sheet ─────────────────────────────────────────────────────
function EditProfileSheet({ isVakman, onClose }: { isVakman: boolean; onClose: () => void }) {
  const store = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name:      store.name      || "",
    address:   store.address   || "",
    phone:     store.phone     || "",
    email:     store.email     || "",
    bio:       store.bio       || "",
    website:   store.website   || "",
    specialty: store.specialty || "",
    uurtarief: store.uurtarief || 0,
    avatar:    store.avatar    || "",
  });
  const [saved, setSaved] = useState(false);

  const up = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => up("avatar", ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    store.setProfile({
      name:      form.name.trim() || store.name,
      address:   form.address.trim(),
      phone:     form.phone.trim(),
      email:     form.email.trim(),
      bio:       form.bio.trim(),
      website:   form.website.trim(),
      specialty: form.specialty.trim(),
      uurtarief: form.uurtarief,
      avatar:    form.avatar,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  const initials = form.name
    ? form.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatarGradient = isVakman
    ? "linear-gradient(135deg, #1e1b4b, #3730a3)"
    : "linear-gradient(135deg, #4F46E5, #818CF8)";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[95dvh] animate-slide-up"
        style={{
          background: "#F1F4FA",
          borderRadius: "28px 28px 0 0",
          maxWidth: 480,
          margin: "0 auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3"
          style={{ background: "#F1F4FA", borderRadius: "28px 28px 0 0" }}>
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "#E2E8F0" }} />
          <div className="flex items-center justify-between">
            <button onClick={onClose}
              className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <X size={18} style={{ color: "#475569" }} />
            </button>
            <h2 className="font-black text-lg" style={{ color: "#0f172a" }}>Profiel bewerken</h2>
            <button onClick={handleSave}
              className="touch-scale px-4 py-2.5 rounded-2xl font-black text-sm transition-all"
              style={{
                background: saved ? "linear-gradient(135deg, #10B981, #34D399)" : "linear-gradient(135deg, #4F46E5, #818CF8)",
                color: "white",
                boxShadow: "0 4px 14px rgba(79,70,229,0.4)",
              }}>
              {saved ? "✓ Opgeslagen" : "Opslaan"}
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-10">

          {/* Photo section */}
          <div className="flex flex-col items-center py-6">
            <div className="relative">
              {form.avatar ? (
                <img src={form.avatar} alt="Profiel"
                  className="w-24 h-24 rounded-3xl object-cover"
                  style={{ border: "3px solid white", boxShadow: "0 8px 28px rgba(0,0,0,0.18)" }} />
              ) : (
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center font-black text-white text-3xl"
                  style={{ background: avatarGradient, border: "3px solid white", boxShadow: "0 8px 28px rgba(79,70,229,0.3)" }}>
                  {initials}
                </div>
              )}
              {/* Camera button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="touch-scale absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #4F46E5, #818CF8)",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
                }}>
                <Camera size={16} color="white" />
              </button>
              {form.avatar && (
                <button
                  onClick={() => up("avatar", "")}
                  className="touch-scale absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "#EF4444", boxShadow: "0 2px 8px rgba(239,68,68,0.5)" }}>
                  <X size={12} color="white" />
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm font-bold touch-scale"
              style={{ color: "#4F46E5" }}>
              {form.avatar ? "Foto wijzigen" : "Foto toevoegen"}
            </button>
            <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>JPG, PNG of WEBP · Max 10 MB</p>
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4">

            {/* Naam */}
            <FormField icon={User} label="Naam" required>
              <input value={form.name} onChange={e => up("name", e.target.value)}
                placeholder="Voor- en achternaam"
                style={inputStyle(!!form.name)} />
            </FormField>

            {/* Bio */}
            <FormField icon={Edit3} label={isVakman ? "Over mij" : "Korte bio"}>
              <textarea value={form.bio} onChange={e => up("bio", e.target.value)}
                placeholder={isVakman
                  ? "Vertel klanten over je ervaring, specialiteiten en werkwijze..."
                  : "Stel jezelf kort voor..."}
                rows={3}
                style={{ ...inputStyle(!!form.bio), resize: "none" }} />
              <p className="text-[11px] mt-1.5 text-right" style={{ color: "#94a3b8" }}>
                {form.bio.length}/150
              </p>
            </FormField>

            {isVakman && (
              <>
                {/* Specialiteit */}
                <FormField icon={Wrench} label="Hoofdspecialiteit">
                  <input value={form.specialty} onChange={e => up("specialty", e.target.value)}
                    placeholder="bijv. Loodgieter, Elektricien..."
                    style={inputStyle(!!form.specialty)} />
                </FormField>

                {/* Uurtarief */}
                <FormField icon={Euro} label="Starttarief (€/uur)">
                  <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl"
                    style={{ background: form.uurtarief ? "#F8F8FF" : "#fff", border: `2px solid ${form.uurtarief ? "#4F46E5" : "#E5E7EB"}` }}>
                    <span className="font-black text-lg" style={{ color: "#4F46E5" }}>€</span>
                    <input type="number" value={form.uurtarief || ""} onChange={e => up("uurtarief", +e.target.value)}
                      placeholder="0"
                      inputMode="decimal"
                      className="flex-1 bg-transparent outline-none font-black text-lg"
                      style={{ color: "#0f172a" }} />
                    <span className="text-sm font-semibold" style={{ color: "#94a3b8" }}>/uur</span>
                  </div>
                </FormField>

                {/* Website */}
                <FormField icon={Globe} label="Website">
                  <input value={form.website} onChange={e => up("website", e.target.value)}
                    placeholder="https://jouwwebsite.nl"
                    type="url"
                    style={inputStyle(!!form.website)} />
                </FormField>
              </>
            )}

            {/* Telefoon */}
            <FormField icon={Phone} label="Telefoonnummer">
              <input value={form.phone} onChange={e => up("phone", e.target.value)}
                placeholder="+31 6 12345678"
                type="tel"
                style={inputStyle(!!form.phone)} />
            </FormField>

            {/* E-mail */}
            <FormField icon={Mail} label="E-mailadres">
              <input value={form.email} onChange={e => up("email", e.target.value)}
                placeholder="jij@email.com"
                type="email"
                style={inputStyle(!!form.email)} />
            </FormField>

            {/* Adres */}
            <FormField icon={MapPin} label="Adres / Stad">
              <input value={form.address} onChange={e => up("address", e.target.value)}
                placeholder="bijv. Jordaan, Amsterdam"
                style={inputStyle(!!form.address)} />
            </FormField>

            {/* Save button (also at bottom) */}
            <button onClick={handleSave}
              className="touch-scale w-full py-4 rounded-2xl font-black text-white mt-2"
              style={{
                background: saved ? "linear-gradient(135deg, #10B981, #34D399)" : "linear-gradient(135deg, #4F46E5, #818CF8)",
                boxShadow: "0 8px 28px rgba(79,70,229,0.4)",
              }}>
              {saved ? "✓ Profiel opgeslagen!" : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function inputStyle(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: `2px solid ${active ? "#4F46E5" : "#E5E7EB"}`,
    background: active ? "#F8F8FF" : "#fff",
    fontSize: 15,
    fontWeight: 600,
    color: "#0f172a",
    outline: "none",
    boxShadow: active ? "0 0 0 4px rgba(79,70,229,0.08)" : "none",
    boxSizing: "border-box" as const,
  };
}

function FormField({ icon: Icon, label, required, children }: {
  icon: LucideIcon; label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest mb-2"
        style={{ color: "#94a3b8" }}>
        <Icon size={11} /> {label}{required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { role, activeView, setActiveView, logout, isAdmin,
    name: userName, address: userAddress, avatar: userAvatar,
    phone: userPhone, email: userEmail, bio: userBio,
    specialty: userSpecialty, uurtarief: userUurtarief,
  } = useUserStore();
  const { betaalmethoden, voegBetaalMethodeToe, verwijderBetaalMethode } = useInstellingenStore();
  const router = useRouter();
  const isVakman = activeView === "vakman";

  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
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

  const initials = userName ? userName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const avatarGradient = isVakman
    ? "linear-gradient(135deg, #1e1b4b, #3730a3)"
    : "linear-gradient(135deg, #4F46E5, #818CF8)";

  const klantStats = [
    { v: "13", l: "Boekingen", icon: "📅" },
    { v: "€470", l: "Uitgegeven", icon: "💳" },
    { v: "4.9★", l: "Jouw score", icon: "⭐" },
  ];
  const vakmanStats = [
    { v: "47", l: "Klussen", icon: "🔧" },
    { v: "€2.840", l: "Verdiend", icon: "💰" },
    { v: "4.9★", l: "Rating", icon: "⭐" },
  ];
  const stats = isVakman ? vakmanStats : klantStats;

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in" style={{ background: "#F1F4FA" }}>

      {/* ══════════════════════════
          PROFIEL HEADER CARD
      ══════════════════════════ */}
      <div className="relative" style={{ background: "#F1F4FA" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-14 pb-3">
          <h1 className="font-black text-xl" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>Profiel</h1>
          <div className="flex items-center gap-2">
            <Link href="/meldingen" className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Bell size={17} style={{ color: "#475569" }} />
            </Link>
            <button onClick={() => setShowEditProfile(true)}
              className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Edit3 size={17} style={{ color: "#475569" }} />
            </button>
            <Link href="/instellingen" className="touch-scale w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Settings size={17} style={{ color: "#475569" }} />
            </Link>
          </div>
        </div>

        {/* Profile card */}
        <div className="mx-5 mb-5 overflow-hidden" style={{ borderRadius: 28, background: avatarGradient, boxShadow: "0 20px 60px rgba(79,70,229,0.3)" }}>
          {/* Decoratieve achtergrond cirkels */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full opacity-10" style={{ background: "white" }} />
          <div className="absolute -left-8 bottom-0 w-36 h-36 rounded-full opacity-10" style={{ background: "white" }} />

          <div className="relative p-6">
            {/* Avatar + naam */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName}
                    className="w-20 h-20 rounded-3xl object-cover"
                    style={{ border: "2.5px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }} />
                ) : (
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-2xl text-white"
                    style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)" }}>
                    {initials}
                  </div>
                )}
                <button onClick={() => setShowEditProfile(true)}
                  className="touch-scale absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white flex items-center justify-center"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                  <Camera size={13} style={{ color: "#4F46E5" }} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-white truncate" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>
                  {userName || "Gebruiker"}
                </h2>
                {userBio ? (
                  <p className="text-sm mt-0.5 line-clamp-1" style={{ color: "rgba(255,255,255,0.7)" }}>{userBio}</p>
                ) : (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} color="rgba(255,255,255,0.55)" />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{userAddress || "Amsterdam"}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                    {isVakman ? "🔧 Vakman" : "🏠 Klant"}
                  </span>
                  {isVakman && userSpecialty && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                      {userSpecialty}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>⚙️ Admin</span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map(s => (
                <div key={s.l} className="flex flex-col items-center py-3.5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
                  <span className="text-lg mb-0.5">{s.icon}</span>
                  <span className="font-black text-white text-base leading-tight">{s.v}</span>
                  <span className="text-[10px] mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profiel bewerken knop */}
        <div className="mx-5 mb-3">
          <button onClick={() => setShowEditProfile(true)}
            className="touch-scale w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
            style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
            <Edit3 size={15} /> Profiel bewerken
          </button>
        </div>

        {/* Role switcher */}
        {role === "beide" && (
          <div className="mx-5 mb-5">
            <div className="flex p-1.5 rounded-2xl" style={{ background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              {(["klant", "vakman"] as const).map(r => (
                <button key={r} onClick={() => setActiveView(r)}
                  className="touch-scale flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: activeView === r
                      ? r === "vakman" ? "linear-gradient(135deg, #1e1b4b, #3730a3)" : "linear-gradient(135deg, #4F46E5, #818CF8)"
                      : "transparent",
                    color: activeView === r ? "white" : "#94a3b8",
                    boxShadow: activeView === r ? "0 4px 12px rgba(79,70,229,0.3)" : "none",
                  }}>
                  {r === "klant" ? <User size={15} /> : <Wrench size={15} />}
                  {r === "klant" ? "Klant" : "Vakman"}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 flex flex-col gap-5">

        {/* ══════════════════════════
            VAKMAN — Verdiensten card
        ══════════════════════════ */}
        {isVakman && (
          <div className="overflow-hidden" style={{ borderRadius: 24, background: "linear-gradient(135deg, #0f172a, #1e293b)", boxShadow: "0 12px 40px rgba(15,23,42,0.3)" }}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Maand omzet</p>
                <TrendingUp size={14} color="rgba(255,255,255,0.4)" />
              </div>
              <p className="font-black text-white" style={{ fontSize: 36, letterSpacing: "-0.03em" }}>€ 2.840</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Na 8% Servr commissie</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Klussen</p>
                  <p className="font-black text-white text-lg">47</p>
                </div>
                <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Openstaand</p>
                  <p className="font-black text-white text-lg">3</p>
                </div>
                <div className="flex-1 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Rating</p>
                  <p className="font-black text-white text-lg">4.9★</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════
            VAKMAN — Beheer
        ══════════════════════════ */}
        {isVakman && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Beheer</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/dashboard",         icon: LayoutDashboard, label: "Dashboard",         sub: "Stats & omzet",      color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/agenda",            icon: CalendarDays,    label: "Agenda",             sub: "Boekingen",          color: "#10B981", bg: "#ECFDF5" },
                { href: "/urenregistratie",   icon: Clock,           label: "Urenregistratie",    sub: "Timer per klus",     color: "#8B5CF6", bg: "#F5F3FF" },
                { href: "/materialen",        icon: Package,         label: "Materialen",         sub: "Voorraad & inkoop",  color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/klanten",           icon: Users,           label: "Klantenbestand",     sub: "CRM & contacten",    color: "#EC4899", bg: "#FDF2F8" },
                { href: "/sociale-bijdragen", icon: Shield,          label: "Soc. bijdragen",     sub: "Kwartaalafdrachten",  color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/documenten-kluis", icon: Award,           label: "Documenten kluis",   sub: "Certs & verzekeringen",color: "#F59E0B", bg: "#FFFBEB" },
                { href: "/portfolio",        icon: Camera,          label: "Portfolio",          sub: "Voor & na foto's",    color: "#EC4899", bg: "#FDF2F8" },
                { href: "/handtekening",    icon: PenTool,         label: "Oplevering",         sub: "Digitaal tekenen",    color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/reviews",         icon: Star,            label: "Reviews",            sub: "Beoordelingen",       color: "#F59E0B", bg: "#FFFBEB" },
                { href: "/inchecken",       icon: QrCode,          label: "QR Check-in",        sub: "Aanwezigheid",        color: "#10B981", bg: "#ECFDF5" },
                { href: "/diensten",          icon: Wrench,          label: "Diensten",           sub: "Prijzen & aanbod",   color: "#6366F1", bg: "#EEF2FF" },
                { href: "/verdiensten",       icon: Banknote,        label: "Verdiensten",        sub: "Uitbetalingen",      color: "#F59E0B", bg: "#FFFBEB" },
                { href: "/boekhouding",       icon: TrendingUp,      label: "Boekhouding",        sub: "BTW & belasting",    color: "#10B981", bg: "#ECFDF5" },
                { href: "/offerte/maak",      icon: FileText,        label: "Offerte",            sub: "PDF maken",          color: "#8B5CF6", bg: "#F5F3FF" },
                { href: "/bedrijf",           icon: Building2,       label: "Bedrijf",            sub: "KvK & BTW",          color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/opleidingen",       icon: GraduationCap,   label: "Opleidingen",        sub: "Certificaten",        color: "#8B5CF6", bg: "#F5F3FF" },
                { href: "/personeel",         icon: Users,           label: "Personeel",          sub: "Team & subbies",      color: "#EC4899", bg: "#FDF2F8" },
                { href: "/pensioen",          icon: Wallet,          label: "Pensioen",           sub: "Spaarassistent",      color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/onderhoud-schema",  icon: RefreshCw,       label: "Onderhoud Schema",   sub: "Auto-boeken",         color: "#10B981", bg: "#ECFDF5" },
                { href: "/id-verificatie",    icon: Fingerprint,     label: "ID Verificatie",     sub: "Vertrouwensbadge",    color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/escrow",            icon: Lock,            label: "Escrow",             sub: "Veilig betalen",      color: "#7C3AED", bg: "#F5F3FF" },
                { href: "/betalingen",        icon: CreditCard,      label: "Betalingen",         sub: "iDEAL & Bancontact",  color: "#D97706", bg: "#FFFBEB" },
                { href: "/betaalplan",        icon: CalendarDays,    label: "Betaalplan",         sub: "Gespreide betaling",  color: "#EC4899", bg: "#FDF2F8" },
                { href: "/gps-tracking",      icon: Navigation,      label: "GPS Tracking",       sub: "Locatie delen",       color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/video-bellen",      icon: Video,           label: "Video Bellen",       sub: "Gratis in-app",       color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/push-notificaties", icon: Bell,            label: "Notificaties",       sub: "Push & SMS",          color: "#F59E0B", bg: "#FFFBEB" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="touch-scale flex items-center gap-2.5 p-3 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}>
                      <Icon size={17} style={{ color: item.color }} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate" style={{ color: "#0f172a" }}>{item.label}</p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>{item.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            VAKMAN — Recente klussen
        ══════════════════════════ */}
        {isVakman && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Recente klussen</p>
            <div className="flex flex-col gap-3">
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3.5 p-4"
                  style={{ background: "#fff", borderRadius: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                  <img src={h.avatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{h.provider}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{h.category} · {h.date}</p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={10} className={j < h.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="font-black text-base" style={{ color: "#4F46E5" }}>+€{h.price}</span>
                    <p className="text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>betaald</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            KLANT — Snelle acties
        ══════════════════════════ */}
        {!isVakman && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Snelle acties</p>
            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { href: "/te-betalen",      icon: CreditCard,    color: "#4F46E5", bg: "#EEF2FF",  label: "Betalingen",  sub: "Overzicht & iDEAL" },
                { href: "/offerte-vergelijker", icon: ClipboardList, color: "#10B981", bg: "#ECFDF5",  label: "Offertes",    sub: "Vergelijken & keuren" },
                { href: "/mijn-opdrachten",  icon: Clock,         color: "#F59E0B", bg: "#FFFBEB",  label: "Klussen",     sub: "Mijn geschiedenis" },
                { href: "/favorieten",       icon: Heart,         color: "#EF4444", bg: "#FEF2F2",  label: "Favorieten",  sub: "Mijn vakmans" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}>
                      <Icon size={18} style={{ color: item.color }} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate" style={{ color: "#0f172a" }}>{item.label}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "#94a3b8" }}>{item.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            {/* Full-width AI prijsscanner */}
            <Link href="/scan"
              className="touch-scale flex items-center gap-3 p-4 rounded-2xl w-full"
              style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", boxShadow: "0 4px 16px rgba(124,58,237,0.12)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#7C3AED" }}>
                <Scan size={18} color="white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs" style={{ color: "#4C1D95" }}>AI prijsscanner</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#6D28D9" }}>Scan een offerte — AI vergelijkt eerlijke prijs</p>
              </div>
              <span className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black text-white"
                style={{ background: "#7C3AED" }}>
                Scan
              </span>
            </Link>
          </div>
        )}

        {/* ══════════════════════════
            KLANT — Recente boekingen
        ══════════════════════════ */}
        {!isVakman && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>Recente boekingen</p>
              <Link href="/mijn-opdrachten" className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-0.5"
                style={{ background: "#fff", color: "#4F46E5", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                Alle <ChevronRight size={11} />
              </Link>
            </div>
            <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
              {HISTORY.map((h, i) => (
                <div key={i} className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderBottom: i < HISTORY.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <img src={h.avatar} className="w-12 h-12 rounded-2xl object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{h.provider}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{h.category} · {h.date}</p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {Array.from({ length: h.rating }).map((_, j) => (
                        <Star key={j} size={10} className="fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="font-black text-base" style={{ color: "#4F46E5" }}>€{h.price}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "#F0FDF4", color: "#059669" }}>Betaald</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            KLANT — Badges
        ══════════════════════════ */}
        {/* ══════════════════════════
            KLANT — Mijn woning
        ══════════════════════════ */}
        {!isVakman && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Mijn woning</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/woning-paspoort",    icon: Home,          label: "Woning Paspoort",   sub: "Digitaal dossier",    color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/onderhoud-planner",  icon: CalendarCheck, label: "Onderhoud Planner", sub: "Herinneringen",       color: "#10B981", bg: "#ECFDF5" },
                { href: "/garantie-tracker",   icon: Shield,        label: "Garantie Tracker",  sub: "Bewaar garanties",    color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/offerte-vergelijker",icon: BarChart3,     label: "Offertes Vergelijken",sub: "Beste keuze",       color: "#8B5CF6", bg: "#F5F3FF" },
                { href: "/spaarplan",          icon: PiggyBank,     label: "Spaarplan Woning",  sub: "Renovatiedoelen",     color: "#EC4899", bg: "#FDF2F8" },
                { href: "/schadedetectie",     icon: Scan,          label: "Schadedetectie",    sub: "AI fotoanalyse",      color: "#EF4444", bg: "#FEF2F2" },
                { href: "/onderhoud-schema",   icon: RefreshCw,     label: "Onderhoud Schema",  sub: "Auto-boeken",         color: "#10B981", bg: "#ECFDF5" },
                { href: "/gps-tracking",       icon: Navigation,    label: "GPS Tracking",      sub: "Volg vakman",         color: "#0EA5E9", bg: "#F0F9FF" },
                { href: "/video-bellen",       icon: Video,         label: "Video Bellen",      sub: "Gratis in-app",       color: "#4F46E5", bg: "#EEF2FF" },
                { href: "/escrow",             icon: Lock,          label: "Escrow",            sub: "Veilig betalen",      color: "#7C3AED", bg: "#F5F3FF" },
                { href: "/betaalplan",         icon: CalendarDays,  label: "Betaalplan",        sub: "Gespreide betaling",  color: "#D97706", bg: "#FFFBEB" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="touch-scale flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: item.bg }}>
                      <Icon size={20} style={{ color: item.color }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "#334155" }}>{item.label}</p>
                      <p className="text-xs truncate" style={{ color: "#94a3b8" }}>{item.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {!isVakman && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>
                Badges · {BADGES_KLANT.filter(b => b.earned).length}/{BADGES_KLANT.length}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {BADGES_KLANT.map(b => (
                <button key={b.label} onClick={() => setActiveBadge(b)}
                  className="touch-scale flex-shrink-0 flex flex-col items-center gap-2 py-4 px-4 rounded-2xl"
                  style={{
                    background: b.earned ? `${b.kleur}10` : "#fff",
                    border: `1.5px solid ${b.earned ? b.kleur + "35" : "#f1f5f9"}`,
                    minWidth: 88,
                    opacity: b.earned ? 1 : 0.55,
                    boxShadow: b.earned ? `0 4px 16px ${b.kleur}20` : "none",
                  }}>
                  <span className="text-3xl">{b.earned ? b.icon : "🔒"}</span>
                  <p className="text-[10px] font-black text-center leading-tight"
                    style={{ color: b.earned ? b.kleur : "#94a3b8" }}>{b.label}</p>
                  {b.zeldzaam && b.earned && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: b.kleur }}>ZELDZAAM</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════
            BETAALMETHODEN
        ══════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#94a3b8" }}>Betaalmethoden</p>
            <button onClick={() => setShowAddPayment(true)}
              className="touch-scale flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <Plus size={11} /> Toevoegen
            </button>
          </div>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            {betaalmethoden.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-14 h-14 rounded-3xl flex items-center justify-center" style={{ background: "#EEF2FF" }}>
                  <CreditCard size={22} style={{ color: "#4F46E5" }} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: "#0f172a" }}>Geen betaalmethode</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Voeg er een toe om te betalen</p>
                </div>
                <button onClick={() => setShowAddPayment(true)}
                  className="touch-scale px-5 py-2.5 rounded-2xl text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)" }}>
                  + Toevoegen
                </button>
              </div>
            ) : (
              betaalmethoden.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderBottom: i < betaalmethoden.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EEF2FF" }}>
                    <CreditCard size={19} style={{ color: "#4F46E5" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{m.label}</p>
                    {m.vervaldatum && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Verloopt {m.vervaldatum}</p>}
                  </div>
                  <button onClick={() => verwijderBetaalMethode(m.id)}
                    className="touch-scale w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: "#FEF2F2" }}>
                    <Trash2 size={15} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              ))
            )}
          </div>
          {showAddPayment && (
            <div className="mt-3 p-5 rounded-2xl flex flex-col gap-4 animate-slide-up"
              style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <p className="font-black text-sm" style={{ color: "#0f172a" }}>Betaalmethode toevoegen</p>
              <div className="flex gap-2">
                {(["ideal", "kaart", "paypal"] as const).map(type => (
                  <button key={type} onClick={() => setNieuwMethode(type)}
                    className="touch-scale flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: nieuwMethode === type ? "#4F46E5" : "#E5E7EB",
                      background: nieuwMethode === type ? "#EEF2FF" : "transparent",
                      color: nieuwMethode === type ? "#4F46E5" : "#94a3b8",
                    }}>
                    {type === "ideal" ? "🏦 iDEAL" : type === "kaart" ? "💳 Kaart" : "🅿️ PayPal"}
                  </button>
                ))}
              </div>
              {nieuwMethode === "ideal" && (
                <select value={nieuwBank} onChange={e => setNieuwBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm font-medium"
                  style={{ borderColor: "#E5E7EB", background: "#F8FAFF", color: "#0f172a", outline: "none" }}>
                  {["ING", "ABN AMRO", "Rabobank", "SNS", "ASN", "Bunq", "Triodos"].map(b =>
                    <option key={b} value={b}>{b}</option>
                  )}
                </select>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowAddPayment(false)}
                  className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm"
                  style={{ background: "#F1F5F9", color: "#64748b" }}>Annuleren</button>
                <button onClick={voegMethodeToe}
                  className="touch-scale flex-1 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #818CF8)", boxShadow: "0 4px 12px rgba(79,70,229,0.4)" }}>
                  Opslaan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════
            ACCOUNT INSTELLINGEN
        ══════════════════════════ */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Account</p>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            {[
              { href: "/instellingen", icon: Settings,    color: "#475569", bg: "#F1F5F9", label: "Instellingen",    sub: "Taal, notificaties, privacy" },
              { href: "/meldingen",    icon: Bell,        color: "#F59E0B", bg: "#FFFBEB", label: "Meldingen",       sub: "Berichten & updates" },
              ...(isAdmin ? [{ href: "/admin", icon: ShieldCheck, color: "#4F46E5", bg: "#EEF2FF", label: "Servr Admin", sub: "Beheer & statistieken" }] : []),
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="touch-scale flex items-center gap-3.5 px-4 py-4"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg }}>
                    <Icon size={18} style={{ color: item.color }} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{item.sub}</p>
                  </div>
                  <ChevronRight size={16} style={{ color: "#cbd5e1" }} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Uitloggen */}
        <button onClick={() => { logout(); router.push("/onboarding"); }}
          className="touch-scale flex items-center justify-center gap-2.5 font-bold text-sm py-4 w-full rounded-2xl"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA" }}>
          <LogOut size={16} />
          Uitloggen
        </button>

      </div>

      {activeBadge && <BadgeModal badge={activeBadge} onClose={() => setActiveBadge(null)} />}
      {showEditProfile && (
        <EditProfileSheet isVakman={isVakman} onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}
