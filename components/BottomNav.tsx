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
  const { role, activeView, setActiveView, isLoggedIn, unreadBerichten } = useUserStore();
  const { taal } = useInstellingenStore();
  const t = useT(taal);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hide = HIDDEN_ON.some(p => pathname.startsWith(p));
  if (!mounted || hide || !isLoggedIn) return null;

  const isVakman = activeView === "vakman";

  // Vakman kleur schema: donkerblauw/navy tint
  const PRIMARY   = isVakman ? "#3730A3" : "#4F46E5";
  const PRIMARY_BG = isVakman ? "#EEF2FF" : "#EEF2FF";

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
        { href: "/berichten", icon: MessageCircle, label: t("berichten"), badge: unreadBerichten },
        { href: "/profile",   icon: User,          label: t("profiel") },
      ];

  return (
    <>
      {/* Role switcher — only shown when user has both roles */}
      {role === "beide" && (
        <div
          className="fixed z-50"
          style={{ bottom: "calc(var(--bottom-nav-height) + 10px)", right: 16 }}
        >
          <button
            onClick={() => setActiveView(isVakman ? "klant" : "vakman")}
            className="touch-scale flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black"
            style={{
              background: isVakman
                ? "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)"
                : "linear-gradient(135deg, #1e1b4b 0%, #3730A3 100%)",
              color: "white",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <ArrowLeftRight size={11} />
            {isVakman ? "Naar klant" : "Naar vakman"}
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-safe"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderTop: "1.5px solid #F1F4FA",
          height: "var(--bottom-nav-height)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center h-full px-2">
          {navItems.map(({ href, icon: Icon, label, isPanic, badge }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

            if (isPanic) {
              return (
                <div key={href} className="flex-1 flex items-center justify-center">
                  <Link
                    href={href}
                    className="relative flex items-center justify-center -mt-5 touch-scale"
                    aria-label="Spoeddienst"
                  >
                    {/* Pulse ring */}
                    <span
                      className="absolute w-14 h-14 rounded-[20px] animate-pulse-ring"
                      style={{ background: "rgba(239,68,68,0.2)" }}
                    />
                    <span
                      className="relative flex flex-col items-center justify-center w-14 h-14 rounded-[20px]"
                      style={{
                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                        boxShadow: "0 6px 24px rgba(239,68,68,0.5)",
                      }}
                    >
                      <Icon size={21} color="white" strokeWidth={2.5} />
                      <span className="text-[9px] text-white font-black mt-0.5 leading-none tracking-widest uppercase">
                        Spoed
                      </span>
                    </span>
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 h-full touch-scale"
                aria-label={label}
              >
                {/* Badge */}
                {!!(badge && badge > 0 && !isActive) && (
                  <span
                    className="absolute flex items-center justify-center text-white font-black"
                    style={{
                      top: 10, right: "calc(50% - 22px)",
                      minWidth: 17, height: 17,
                      borderRadius: 999,
                      fontSize: 9,
                      background: "#EF4444",
                      border: "2px solid white",
                      zIndex: 1,
                      paddingInline: 3,
                    }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}

                {/* Icon container — pill highlight when active */}
                <div
                  className="flex items-center justify-center w-10 h-8 rounded-2xl transition-all"
                  style={{
                    background: isActive ? PRIMARY_BG : "transparent",
                    transform: isActive ? "scale(1.0)" : "scale(1)",
                  }}
                >
                  <Icon
                    size={isActive ? 20 : 21}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? PRIMARY : "#9CA3AF" }}
                  />
                </div>

                {/* Label */}
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: isActive ? PRIMARY : "#9CA3AF" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
