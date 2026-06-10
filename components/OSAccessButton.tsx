"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const FOUNDER_EMAIL = process.env.NEXT_PUBLIC_FOUNDER_EMAIL;

export default function OSAccessButton() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    import("@/lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email === FOUNDER_EMAIL) setShow(true);
      });
    });
  }, []);

  if (!show || pathname.startsWith("/os")) return null;

  return (
    <Link
      href="/os"
      style={{
        position: "fixed",
        bottom: 80,
        right: 20,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2060ff, #7030ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        boxShadow: "0 0 24px rgba(60,100,255,.7)",
        zIndex: 9998,
        textDecoration: "none",
      }}
      title="Servr OS"
    >
      ⚡
    </Link>
  );
}
