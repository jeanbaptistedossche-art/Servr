"use client";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const LICENTIES = [
  { naam: "Next.js", versie: "16.2.6", licentie: "MIT", auteur: "Vercel, Inc.", url: "https://nextjs.org" },
  { naam: "React", versie: "19.0.0", licentie: "MIT", auteur: "Meta Platforms, Inc.", url: "https://react.dev" },
  { naam: "Stripe.js", versie: "5.x", licentie: "MIT", auteur: "Stripe, Inc.", url: "https://stripe.com" },
  { naam: "Zustand", versie: "5.x", licentie: "MIT", auteur: "pmndrs", url: "https://zustand-demo.pmnd.rs" },
  { naam: "Tailwind CSS", versie: "4.x", licentie: "MIT", auteur: "Tailwind Labs", url: "https://tailwindcss.com" },
  { naam: "Lucide React", versie: "latest", licentie: "ISC", auteur: "Lucide Contributors", url: "https://lucide.dev" },
  { naam: "Supabase", versie: "2.x", licentie: "Apache 2.0", auteur: "Supabase, Inc.", url: "https://supabase.com" },
  { naam: "Nominatim / OpenStreetMap", versie: "—", licentie: "ODbL", auteur: "OpenStreetMap Foundation", url: "https://nominatim.org" },
  { naam: "TypeScript", versie: "5.x", licentie: "Apache 2.0", auteur: "Microsoft Corporation", url: "https://typescriptlang.org" },
];

const LICENTIE_KLEUREN: Record<string, { bg: string; color: string }> = {
  "MIT":        { bg: "#dcfce7", color: "#16a34a" },
  "Apache 2.0": { bg: "#dbeafe", color: "#1d4ed8" },
  "ISC":        { bg: "#fef9c3", color: "#a16207" },
  "ODbL":       { bg: "#ede9fe", color: "#6d28d9" },
};

export default function LicentiesPage() {
  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      <div className="px-5 pt-12 pb-5 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/instellingen"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-black text-xl">Licenties</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Open-source software gebruikt door Servr</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-3">
        <div className="p-3 rounded-2xl text-xs leading-relaxed"
          style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
          Servr is gebouwd op de schouders van geweldige open-source projecten. Hieronder vind je een overzicht van de software die we gebruiken en de bijbehorende licenties.
        </div>

        {LICENTIES.map((lib) => {
          const kleur = LICENTIE_KLEUREN[lib.licentie] ?? { bg: "var(--surface-2)", color: "var(--muted)" };
          return (
            <div key={lib.naam} className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm">{lib.naam}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: kleur.bg, color: kleur.color }}>
                    {lib.licentie}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {lib.auteur} · v{lib.versie}
                </p>
              </div>
              <a href={lib.url} target="_blank" rel="noopener noreferrer"
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--surface-2)" }}>
                <ExternalLink size={14} style={{ color: "var(--muted)" }} />
              </a>
            </div>
          );
        })}

        <div className="card p-4 mt-2">
          <p className="font-bold text-sm mb-1">Servr eigen code</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            De eigen code van Servr is proprietary en auteursrechtelijk beschermd. © 2026 Servr BV. Alle rechten voorbehouden.
          </p>
        </div>

        <div className="text-xs text-center pb-4" style={{ color: "var(--muted)" }}>
          Vragen over licenties? legal@servr.app
        </div>
      </div>
    </div>
  );
}
