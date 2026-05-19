"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Settings, Bell, ChevronRight, Camera, CreditCard, Building2, Smartphone, CheckCircle, Plus, ArrowLeftRight, Wrench, CalendarDays, FileText, LayoutDashboard, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useInstellingenStore } from "@/lib/instellingenStore";

const BADGES_KLANT = [
  { icon: "🏆", label: "Topklant", desc: "10+ boekingen" },
  { icon: "⚡", label: "Snelle betaler", desc: "Altijd op tijd betaald" },
  { icon: "⭐", label: "Top reviewer", desc: "15 reviews geschreven" },
];

const HISTORY = [
  { provider: "Marco van den Berg", category: "Loodgieter", date: "12 mei 2026", price: 85, rating: 5, avatar: "https://i.pravatar.cc/150?img=11" },
  { provider: "Sofia Martins", category: "Schoonmaak", date: "3 mei 2026", price: 35, rating: 5, avatar: "https://i.pravatar.cc/150?img=47" },
  { provider: "Kim Nguyen", category: "Schilder", date: "22 apr 2026", price: 350, rating: 4, avatar: "https://i.pravatar.cc/150?img=56" },
];


export default function ProfilePage() {
  const { role, activeView, setActiveView, logout, isAdmin, name: userName, address: userAddress } = useUserStore();
  const { betaalmethoden, voegBetaalMethodeToe, verwijderBetaalMethode } = useInstellingenStore();
  const router = useRouter();
  const isVakman = activeView === "vakman";

  const handleLogout = () => {
    logout();
    router.push("/onboarding");
  };

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [nieuwMethode, setNieuwMethode] = useState<"ideal" | "kaart" | "paypal">("ideal");
  const [nieuwBank, setNieuwBank] = useState("ING");

  const voegMethodeToe = () => {
    const labels: Record<string, string> = {
      ideal: `iDEAL — ${nieuwBank}`,
      kaart: "Nieuwe kaart",
      paypal: "PayPal",
    };
    const icons: Record<string, string> = { ideal: "🏦", kaart: "💳", paypal: "📱" };
    voegBetaalMethodeToe({
      type: nieuwMethode === "kaart" ? "creditcard" : nieuwMethode === "ideal" ? "ideal" : "ideal",
      label: labels[nieuwMethode],
      icoon: icons[nieuwMethode],
      bankNaam: nieuwMethode === "ideal" ? nieuwBank : undefined,
    });
    setShowAddPayment(false);
  };

  return (
    <div className="flex flex-col min-h-full pb-8 animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-14 pb-6"
        style={{ background: `linear-gradient(160deg, ${isVakman ? "var(--coral)" : "var(--teal)"} 0%, ${isVakman ? "#b84820" : "var(--teal-dark)"} 100%)` }}>
        <div className="flex items-start justify-between mb-5">
          <h1 className="text-white font-black text-xl">Mijn Profiel</h1>
          <div className="flex items-center gap-2">
            <Link href="/meldingen"
              className="touch-scale relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} color="white" />
              {/* Ongelezen badge */}
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400 border border-white/40" />
            </Link>
            <Link href="/instellingen"
              className="touch-scale w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Settings size={18} color="white" />
            </Link>
          </div>
        </div>

        {/* Rol switcher */}
        <div className="flex gap-2 mb-5">
          {(["klant", "vakman"] as const).map(r => (
            <button key={r} onClick={() => setActiveView(r)}
              className="touch-scale flex-1 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: activeView === r ? "white" : "rgba(255,255,255,0.15)",
                color: activeView === r ? (r === "vakman" ? "var(--coral)" : "var(--teal)") : "rgba(255,255,255,0.9)",
              }}>
              {r === "klant" ? "👤" : "🔧"} {r === "klant" ? "Klant" : "Vakman"}
            </button>
          ))}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src="https://i.pravatar.cc/150?img=68"
              className="w-20 h-20 rounded-3xl object-cover" style={{ border: "3px solid rgba(255,255,255,0.5)" }} alt="profiel" />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center touch-scale">
              <Camera size={14} style={{ color: isVakman ? "var(--coral)" : "var(--teal)" }} />
            </button>
          </div>
          <div>
            <h2 className="text-white text-xl font-black">{userName || "Gebruiker"}</h2>
            <p className="text-white/70 text-sm">{userAddress || "Amsterdam"}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                <Star size={11} className="fill-yellow-300 text-yellow-300" /> 4.9
              </span>
              <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                {isVakman ? "13 klussen" : "13 boekingen"}
              </span>
              <span className="text-white/80 text-xs font-bold px-2.5 py-1 rounded-full capitalize"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                {isVakman ? "🔧 Vakman" : "👤 Klant"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-6 mt-5">

        {/* Vakman beheer */}
        {isVakman && (
          <section>
            <h2 className="font-black text-base mb-3">Vakman beheer</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/dashboard", icon: <LayoutDashboard size={20} style={{ color: "var(--coral)" }} />, label: "Dashboard", sub: "Overzicht & stats" },
                { href: "/bedrijf", icon: <Building2 size={20} style={{ color: "var(--coral)" }} />, label: "Bedrijfsprofiel", sub: "KvK, BTW, IBAN" },
                { href: "/diensten", icon: <Wrench size={20} style={{ color: "var(--coral)" }} />, label: "Diensten", sub: "Prijzen & aanbod" },
                { href: "/agenda", icon: <CalendarDays size={20} style={{ color: "var(--coral)" }} />, label: "Agenda", sub: "Boekingen" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="touch-scale card p-4 flex flex-col gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--coral)" + "12" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Badges */}
        {!isVakman && (
          <section>
            <h2 className="font-black text-base mb-3">Jouw badges</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
              {BADGES_KLANT.map(b => (
                <div key={b.label} className="touch-scale flex-shrink-0 card p-4 flex flex-col items-center gap-2 w-28 text-center">
                  <span className="text-3xl">{b.icon}</span>
                  <p className="font-bold text-xs">{b.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>{b.desc}</p>
                </div>
              ))}
              <div className="touch-scale flex-shrink-0 card p-4 flex flex-col items-center gap-2 w-28 text-center">
                <span className="text-3xl opacity-30">🔒</span>
                <p className="text-xs font-bold" style={{ color: "var(--muted)" }}>Volgende</p>
                <p className="text-[10px]" style={{ color: "var(--muted)" }}>Nog 2 boekingen</p>
              </div>
            </div>
          </section>
        )}

        {/* Betaalmethoden */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-base">Betaalmethoden</h2>
            <button onClick={() => setShowAddPayment(true)}
              className="touch-scale flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "var(--teal)" + "15", color: "var(--teal)" }}>
              <Plus size={13} /> Toevoegen
            </button>
          </div>

          <div className="card overflow-hidden">
            {betaalmethoden.length === 0 && (
              <p className="px-4 py-4 text-sm" style={{ color: "var(--muted)" }}>
                Nog geen betaalmethode toegevoegd
              </p>
            )}
            {betaalmethoden.map((m) => (
              <div key={m.id}
                className="flex items-center gap-3 px-4 py-3.5 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}>
                <span className="text-xl flex-shrink-0">{m.icoon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{m.label}</p>
                  {m.kaarthouder && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{m.kaarthouder}</p>
                  )}
                  {m.vervaldatum && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Verloopt {m.vervaldatum}</p>
                  )}
                </div>
                <button
                  onClick={() => verwijderBetaalMethode(m.id)}
                  className="touch-scale w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#fee2e2" }}>
                  <Trash2 size={14} style={{ color: "#dc2626" }} />
                </button>
              </div>
            ))}
          </div>

          {showAddPayment && (
            <div className="card p-5 mt-3 flex flex-col gap-4 animate-slide-up">
              <p className="font-bold text-sm">Betaalmethode toevoegen</p>
              <div className="flex gap-2">
                {(["ideal", "kaart", "paypal"] as const).map(type => (
                  <button key={type} onClick={() => setNieuwMethode(type)}
                    className="touch-scale flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                    style={{
                      borderColor: nieuwMethode === type ? "var(--teal)" : "var(--border)",
                      background: nieuwMethode === type ? "var(--teal)" + "10" : "transparent",
                      color: nieuwMethode === type ? "var(--teal)" : "var(--muted)",
                    }}>
                    {type === "ideal" ? "🏦 iDEAL" : type === "kaart" ? "💳 Kaart" : "📱 PayPal"}
                  </button>
                ))}
              </div>
              {nieuwMethode === "ideal" && (
                <select value={nieuwBank} onChange={e => setNieuwBank(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}>
                  {["ING", "ABN AMRO", "Rabobank", "SNS", "ASN", "Bunq", "Triodos"].map(b =>
                    <option key={b} value={b}>{b}</option>
                  )}
                </select>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowAddPayment(false)}
                  className="touch-scale flex-1 py-3 rounded-2xl font-semibold text-sm border"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  Annuleren
                </button>
                <button onClick={voegMethodeToe}
                  className="touch-scale flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "var(--teal)" }}>
                  Toevoegen
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="card overflow-hidden">
          {(isVakman
            ? [
                { icon: "💰", label: "Verdiensten", href: "/verdiensten", sub: "Na Servr commissie (10%)" },
                { icon: "🔨", label: "Mijn klussen", href: "/klussen", sub: "Geschiedenis & reviews" },
                { icon: "🏆", label: "Leaderboard", href: "/leaderboard", sub: "Positie in jouw buurt" },
                { icon: "📄", label: "Nieuwe offerte", href: "/offerte/maak", sub: "PDF-stijl generator" },
                { icon: "💬", label: "Berichten", href: "/chat/p1", sub: "2 ongelezen" },
              ]
            : [
                { icon: "📱", label: "AI Prijsscanner", href: "/scan", sub: "Foto → direct prijsschatting" },
                { icon: "💬", label: "Berichten", href: "/chat/p1", sub: "2 ongelezen berichten" },
                { icon: "❤️", label: "Favorieten", href: "/search", sub: "4 opgeslagen vakmensen" },
                { icon: "📋", label: "Mijn opdrachten", href: "/mijn-opdrachten", sub: "3 actief" },
                { icon: "🏠", label: "Mijn adressen", href: "#", sub: "2 adressen opgeslagen" },
              ]
          ).map(item => (
            <Link key={item.label} href={item.href}
              className="touch-scale flex items-center gap-4 px-4 py-4 border-b last:border-0"
              style={{ borderColor: "var(--border)" }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "var(--surface-2)" }}>
                {item.icon}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{item.sub}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted)" }} />
            </Link>
          ))}
        </section>

        {/* Recente boekingen (klant) */}
        {!isVakman && (
          <section>
            <h2 className="font-black text-base mb-3">Recente boekingen</h2>
            <div className="flex flex-col gap-3">
              {HISTORY.map((h, i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <img src={h.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{h.provider}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{h.category} · {h.date}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={11} className={j < h.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                      ))}
                    </div>
                  </div>
                  <p className="font-black text-base" style={{ color: "var(--teal)" }}>€{h.price}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wissel modus banner */}
        <button onClick={() => setActiveView(isVakman ? "klant" : "vakman")}
          className="touch-scale flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: isVakman
            ? "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)"
            : "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)" }}>
          <span className="text-3xl">{isVakman ? "👤" : "🔧"}</span>
          <div>
            <p className="text-white font-black text-base">
              {isVakman ? "Klantmodus" : "Vakmanmodus"} activeren
            </p>
            <p className="text-white/70 text-xs">
              {isVakman ? "Boek diensten als klant" : "Verdien geld als vakman"}
            </p>
          </div>
          <ArrowLeftRight size={20} color="rgba(255,255,255,0.7)" className="ml-auto" />
        </button>

        {/* Servr Admin — alleen zichtbaar voor de eigenaar */}
        {isAdmin && <Link href="/admin"
          className="touch-scale flex items-center gap-3 p-4 rounded-2xl border-2"
          style={{ borderColor: "var(--teal)", background: "var(--teal)" + "08" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--teal)" }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: "var(--teal)" }}>Servr Admin</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Omzet · Klanten · Vakmensen · Commissie</p>
          </div>
          <ChevronRight size={16} style={{ color: "var(--teal)" }} />
        </Link>}

        <button
          onClick={handleLogout}
          className="touch-scale flex items-center justify-center gap-2 text-sm font-semibold py-3 text-center w-full rounded-2xl"
          style={{ color: "var(--coral)", background: "var(--coral)" + "10" }}>
          <LogOut size={16} style={{ color: "var(--coral)" }} />
          Uitloggen
        </button>
      </div>
    </div>
  );
}
