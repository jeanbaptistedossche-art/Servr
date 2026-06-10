"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, Briefcase, Zap, MessageCircle, User,
  Home, Search, ClipboardList, Terminal, LucideIcon,
} from "lucide-react";
import { useUserStore } from "@/lib/store";

const HIDDEN_ON = ["/onboarding", "/chat"];

const SERIF = "'Source Serif 4', Georgia, serif";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  isSpoed?: boolean;
};

const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL;

export default function BottomNav() {
  const pathname = usePathname();
  const { activeView, isLoggedIn, unreadBerichten } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    // Read email directly from Supabase session — more reliable than store
    import("@/lib/supabase").then(({ supabase, supabaseReady }) => {
      if (!supabaseReady) return;
      supabase.auth.getSession().then(({ data }) => {
        setSessionEmail(data.session?.user?.email ?? null);
      });
    });
  }, [isLoggedIn]);

  const hide = HIDDEN_ON.some(p => pathname.startsWith(p));
  if (!mounted || hide || !isLoggedIn) return null;

  const isVakman = activeView === "vakman";
  const isFounder = !!FOUNDER_EMAIL && sessionEmail === FOUNDER_EMAIL;

  const baseVakman: NavItem[] = [
    { href: "/agenda",     icon: CalendarDays,   label: "Vandaag" },
    { href: "/feed",       icon: ClipboardList,  label: "Opdrachten" },
    { href: "/panic",      icon: Zap,            label: "Spoed", isSpoed: true },
    { href: "/berichten",  icon: MessageCircle,  label: "Berichten" },
  ];
  const baseKlant: NavItem[] = [
    { href: "/",           icon: Home,           label: "Home" },
    { href: "/search",     icon: Search,         label: "Zoeken" },
    { href: "/panic",      icon: Zap,            label: "Spoed", isSpoed: true },
    { href: "/berichten",  icon: MessageCircle,  label: "Berichten" },
  ];

  const osItem: NavItem = { href: "/os", icon: Terminal, label: "OS" };

  const navItems: NavItem[] = isVakman
    ? (isFounder ? [...baseVakman, osItem] : baseVakman)
    : (isFounder ? [...baseKlant, osItem] : baseKlant);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-safe"
      style={{
        background: "#FBF7F0",
        borderTop: "0.5px solid #E5DDD0",
        height: "var(--bottom-nav-height)",
      }}
    >
      <div className="flex items-center h-full">
        {navItems.map(({ href, icon: Icon, label, isSpoed }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          const color = isSpoed
            ? "#C97A4D"
            : isActive
              ? "#1A1D1A"
              : "#8A8A83";
          const weight = isActive ? 500 : 400;

          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 h-full touch-scale"
              aria-label={label}
            >
              {/* Unread badge for berichten */}
              {label === "Berichten" && unreadBerichten > 0 && !isActive && (
                <span
                  className="absolute flex items-center justify-center text-white"
                  style={{
                    top: 10,
                    right: "calc(50% - 18px)",
                    minWidth: 16,
                    height: 16,
                    borderRadius: 99,
                    fontSize: 9,
                    fontWeight: 600,
                    background: "#C97A4D",
                    border: "1.5px solid #FBF7F0",
                    zIndex: 1,
                    paddingInline: 3,
                  }}
                >
                  {unreadBerichten > 9 ? "9+" : unreadBerichten}
                </span>
              )}

              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.6}
                style={{ color }}
              />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  fontWeight: weight,
                  color,
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
