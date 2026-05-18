"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Zap, User, LayoutDashboard, ListChecks, CalendarDays, ArrowLeftRight, CreditCard, LucideIcon } from "lucide-react";
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
  const { role, setRole, isLoggedIn } = useUserStore();
  const { taal } = useInstellingenStore();
  const t = useT(taal);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hide = HIDDEN_ON.some(p => pathname.startsWith(p));
  if (!mounted || hide || !isLoggedIn) return null;

  const isVakman = role === "vakman";

  const navItems: NavItem[] = isVakman
    ? [
        { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
        { href: "/diensten", icon: ListChecks, label: t("diensten") },
        { href: "/panic", icon: Zap, label: "Panic", isPanic: true },
        { href: "/agenda", icon: CalendarDays, label: t("agenda") },
        { href: "/profile", icon: User, label: t("profiel") },
      ]
    : [
        { href: "/", icon: Home, label: t("home") },
        { href: "/search", icon: Search, label: t("zoeken") },
        { href: "/panic", icon: Zap, label: "Panic", isPanic: true },
        { href: "/te-betalen", icon: CreditCard, label: "Betalen" },
        { href: "/profile", icon: User, label: t("profiel") },
      ];

  return (
    <>
      {/* Rol-switcher pill — zweeft boven de nav */}
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2"
        style={{ bottom: "calc(var(--bottom-nav-height) + 8px)" }}
      >
        <button
          onClick={() => setRole(isVakman ? "klant" : "vakman")}
          className="touch-scale flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg"
          style={{
            background: isVakman
              ? "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)"
              : "linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)",
            color: "white",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
        >
          <ArrowLeftRight size={11} />
          {isVakman ? "Vakmansmodus" : "Klantmodus"}
          <span className="opacity-60">→ wissel</span>
        </button>
      </div>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 pb-safe"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          height: "var(--bottom-nav-height)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map(({ href, icon: Icon, label, isPanic, badge }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

            if (isPanic) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex items-center justify-center -mt-6 touch-scale"
                  aria-label="Panic Button"
                >
                  <span className="absolute w-16 h-16 rounded-full animate-pulse-ring"
                    style={{ background: "rgba(216,90,48,0.22)" }} />
                  <span className="absolute w-16 h-16 rounded-full animate-pulse-ring"
                    style={{ background: "rgba(216,90,48,0.12)", animationDelay: "0.55s" }} />
                  <span
                    className="relative flex flex-col items-center justify-center w-14 h-14 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, var(--coral) 0%, #b84820 100%)",
                      boxShadow: "0 4px 20px rgba(216,90,48,0.5)",
                    }}
                  >
                    <Icon size={20} color="white" strokeWidth={2.5} />
                    <span className="text-[9px] text-white font-black mt-0.5 leading-none tracking-wide">PANIC</span>
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
                {/* Badge */}
                {badge && badge > 0 && !isActive && (
                  <span className="absolute top-2 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "var(--coral)", zIndex: 1 }}>
                    <span className="text-[9px] font-black text-white">{badge > 9 ? "9+" : badge}</span>
                  </span>
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? "var(--teal)" : "var(--muted)" }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? "var(--teal)" : "var(--muted)" }}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ background: "var(--teal)" }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
