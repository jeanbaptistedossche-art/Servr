"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Search, Zap, User, LayoutDashboard,
  ListChecks, CalendarDays, ArrowLeftRight,
  MessageCircle, LucideIcon,
} from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useInstellingenStore } from "@/lib/instellingenStore";
import { useT } from "@/lib/translations";

const HIDDEN_ON = ["/onboarding", "/chat"];

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  isPanic?: boolean;
  badge?: number;
};

export default function BottomNav() {
  const pathname = usePathname();
  const { role, activeView, setActiveView, isLoggedIn } = useUserStore();
  const { taal } = useInstellingenStore();
  const t = useT(taal);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hide = HIDDEN_ON.some(p => pathname.startsWith(p));
  if (!mounted || hide || !isLoggedIn) return null;

  const isVakman = activeView === "vakman";

  const navItems: NavItem[] = isVakman
    ? [
        { href: "/dashboard",  icon: LayoutDashboard, label: t("dashboard") },
        { href: "/diensten",   icon: ListChecks,      label: t("diensten") },
        { href: "/panic",      icon: Zap,             label: "Spoed", isPanic: true },
        { href: "/agenda",     icon: CalendarDays,    label: t("agenda") },
        { href: "/profile",    icon: User,            label: t("profiel") },
      ]
    : [
        { href: "/",          icon: Home,          label: t("home") },
        { href: "/search",    icon: Search,        label: t("zoeken") },
        { href: "/panic",     icon: Zap,           label: "Spoed", isPanic: true },
        { href: "/berichten", icon: MessageCircle, label: t("berichten") },
        { href: "/profile",   icon: User,          label: t("profiel") },
      ];

  return (
    <>
      {/* Role switcher — minimal pill */}
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2"
        style={{ bottom: "calc(var(--bottom-nav-height) + 6px)" }}
      >
        <button
          onClick={() => setActiveView(isVakman ? "klant" : "vakman")}
          className="touch-scale flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold"
          style={{
            background: isVakman
              ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
              : "linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)",
            color: "white",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}
        >
          <ArrowLeftRight size={10} />
          {isVakman ? "Vakmansmodus" : "Klantmodus"}
        </button>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-safe"
        style={{
          background: "rgba(255,255,255,0.98)",
          borderTop: "1px solid #F3F4F6",
          height: "var(--bottom-nav-height)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-around h-full px-1">
          {navItems.map(({ href, icon: Icon, label, isPanic, badge }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

            if (isPanic) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center justify-center -mt-4 touch-scale"
                  aria-label="Spoeddienst"
                >
                  <span
                    className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                      boxShadow: "0 4px 20px rgba(239,68,68,0.45)",
                    }}
                  >
                    <Icon size={20} color="white" strokeWidth={2.5} />
                    <span className="text-[9px] text-white font-black mt-0.5 leading-none tracking-wide">SPOED</span>
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-scale"
                aria-label={label}
              >
                {badge && badge > 0 && !isActive && (
                  <span className="absolute top-2 right-3 w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ background: "#EF4444", zIndex: 1 }}>
                    <span className="text-[9px] font-black">{badge > 9 ? "9+" : badge}</span>
                  </span>
                )}
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? "#4F46E5" : "#9CA3AF" }}
                />
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: isActive ? "#4F46E5" : "#9CA3AF" }}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-1 w-4 h-0.5 rounded-full"
                    style={{ background: "#4F46E5" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
