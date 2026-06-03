"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

const LICENTIES = [
  { naam: "Next.js",                versie: "16.2.6",  licentie: "MIT",        auteur: "Vercel, Inc.",             url: "https://nextjs.org" },
  { naam: "React",                  versie: "19.0.0",  licentie: "MIT",        auteur: "Meta Platforms, Inc.",     url: "https://react.dev" },
  { naam: "Stripe.js",              versie: "5.x",     licentie: "MIT",        auteur: "Stripe, Inc.",             url: "https://stripe.com" },
  { naam: "Zustand",                versie: "5.x",     licentie: "MIT",        auteur: "pmndrs",                   url: "https://zustand-demo.pmnd.rs" },
  { naam: "Tailwind CSS",           versie: "4.x",     licentie: "MIT",        auteur: "Tailwind Labs",            url: "https://tailwindcss.com" },
  { naam: "Lucide React",           versie: "latest",  licentie: "ISC",        auteur: "Lucide Contributors",      url: "https://lucide.dev" },
  { naam: "Supabase",               versie: "2.x",     licentie: "Apache 2.0", auteur: "Supabase, Inc.",           url: "https://supabase.com" },
  { naam: "Nominatim / OpenStreetMap", versie: "—",   licentie: "ODbL",       auteur: "OpenStreetMap Foundation", url: "https://nominatim.org" },
  { naam: "TypeScript",             versie: "5.x",     licentie: "Apache 2.0", auteur: "Microsoft Corporation",    url: "https://typescriptlang.org" },
];

const LICENTIE_KLEUREN: Record<string, { bg: string; color: string }> = {
  "MIT":        { bg: "#E8F0EA", color: "#2B4030" },
  "Apache 2.0": { bg: "#F9EDE3", color: "#C97A4D" },
  "ISC":        { bg: "#EFEFEC", color: "#5C5C56" },
  "ODbL":       { bg: "#FBF7F0", color: "#8A8A83" },
};

export default function LicentiesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#F5EFE5", fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div className="px-5 pt-14 pb-4" style={{ background: "rgba(245,239,229,0.97)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/profile')}
            className="touch-scale w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0" }}>
            <ArrowLeft size={18} style={{ color: "#2B4030" }} />
          </button>
          <div>
            <h1 className="font-bold text-xl" style={{ color: "#1A1D1A", fontFamily: "'Source Serif 4', Georgia, serif" }}>Licenties</h1>
            <p className="text-xs" style={{ color: "#8A8A83" }}>Open-source software gebruikt door Servr</p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-28 flex flex-col gap-3">

        {/* Intro */}
        <div className="p-4 text-sm leading-relaxed"
          style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14, color: "#5C5C56" }}>
          Servr is gebouwd op de schouders van geweldige open-source projecten. Hieronder vind je een overzicht van de software die we gebruiken en de bijbehorende licenties.
        </div>

        {/* Library list */}
        {LICENTIES.map((lib) => {
          const kleur = LICENTIE_KLEUREN[lib.licentie] ?? { bg: "#FBF7F0", color: "#8A8A83" };
          return (
            <div key={lib.naam} className="flex items-center gap-3 p-4"
              style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm" style={{ color: "#1A1D1A" }}>{lib.naam}</p>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: kleur.bg, color: kleur.color }}>
                    {lib.licentie}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "#8A8A83" }}>
                  {lib.auteur} · v{lib.versie}
                </p>
              </div>
              <a href={lib.url} target="_blank" rel="noopener noreferrer"
                className="touch-scale w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#F5EFE5", border: "0.5px solid #E5DDD0" }}>
                <ExternalLink size={14} style={{ color: "#8A8A83" }} />
              </a>
            </div>
          );
        })}

        {/* Servr own code */}
        <div className="p-4" style={{ background: "#FBF7F0", border: "0.5px solid #E5DDD0", borderRadius: 14 }}>
          <p className="font-medium text-sm mb-1" style={{ color: "#1A1D1A" }}>Servr eigen code</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8A8A83" }}>
            De eigen code van Servr is proprietary en auteursrechtelijk beschermd. © 2026 Servr BV. Alle rechten voorbehouden.
          </p>
        </div>

        <div className="text-xs text-center pb-4" style={{ color: "#8A8A83" }}>
          Vragen over licenties? legal@servr.app
        </div>
      </div>
    </div>
  );
}
