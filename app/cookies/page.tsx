"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

type CookieCategorie = {
  id: string;
  naam: string;
  beschrijving: string;
  verplicht: boolean;
  voorbeelden: string[];
};

const COOKIES: CookieCategorie[] = [
  {
    id: "noodzakelijk",
    naam: "Noodzakelijke cookies",
    beschrijving: "Deze cookies zijn vereist voor de basisfunctionaliteit van de app. Ze kunnen niet worden uitgeschakeld.",
    verplicht: true,
    voorbeelden: ["Inlogsessie", "Beveiligingstokens", "Winkelwagen / boekingsstatus"],
  },
  {
    id: "functioneel",
    naam: "Functionele cookies",
    beschrijving: "Onthouden jouw voorkeuren zoals taal, thema en locatie-instellingen.",
    verplicht: false,
    voorbeelden: ["Taalvoorkeur", "Dark/light mode", "Onthoud mijn adres"],
  },
  {
    id: "analytisch",
    naam: "Analytische cookies",
    beschrijving: "Helpen ons het gebruik van de app te begrijpen en te verbeteren. Alle data is anoniem.",
    verplicht: false,
    voorbeelden: ["Paginabezoeken", "Klikgedrag (anoniem)", "App-prestaties"],
  },
  {
    id: "marketing",
    naam: "Marketing cookies",
    beschrijving: "Worden gebruikt voor gepersonaliseerde aanbevelingen en relevante advertenties.",
    verplicht: false,
    voorbeelden: ["Gepersonaliseerde vakman-aanbevelingen", "Retargeting", "Social media integratie"],
  },
];

export default function CookiesPage() {
  const [actief, setActief] = useState<Record<string, boolean>>({
    noodzakelijk: true,
    functioneel: true,
    analytisch: false,
    marketing: false,
  });
  const [opgeslagen, setOpgeslagen] = useState(false);

  const toggle = (id: string) => {
    if (id === "noodzakelijk") return;
    setActief(v => ({ ...v, [id]: !v[id] }));
    setOpgeslagen(false);
  };

  const slaOp = () => {
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2500);
  };

  const accepteerAlle = () => {
    setActief({ noodzakelijk: true, functioneel: true, analytisch: true, marketing: true });
    setOpgeslagen(true);
    setTimeout(() => setOpgeslagen(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-full pb-32 animate-fade-in">
      <div className="px-5 pt-12 pb-5 sticky top-0 z-10"
        style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/instellingen"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-black text-xl">Cookie-instellingen</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Beheer jouw cookievoorkeuren</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Servr gebruikt cookies en vergelijkbare technologieën om de app te laten werken en jouw ervaring te verbeteren. Hieronder kun je per categorie jouw voorkeuren instellen.
        </p>

        {COOKIES.map((cat) => (
          <div key={cat.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-sm">{cat.naam}</p>
                  {cat.verplicht && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                      Verplicht
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {cat.beschrijving}
                </p>
              </div>
              <button
                onClick={() => toggle(cat.id)}
                className="touch-scale relative w-12 h-6 rounded-full flex-shrink-0 transition-all duration-200"
                style={{
                  background: actief[cat.id] ? "var(--teal)" : "var(--surface-2)",
                  opacity: cat.verplicht ? 0.6 : 1,
                }}>
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: actief[cat.id] ? "calc(100% - 22px)" : "2px" }}
                />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cat.voorbeelden.map(v => (
                <span key={v} className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky opslaan */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-5 pb-6 pt-4"
        style={{ background: "var(--background)", borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-3">
          <button onClick={accepteerAlle}
            className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm border"
            style={{ borderColor: "var(--teal)", color: "var(--teal)" }}>
            Alle accepteren
          </button>
          <button onClick={slaOp}
            className="touch-scale flex-1 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: opgeslagen ? "#16a34a" : "var(--teal)" }}>
            {opgeslagen ? <><Check size={16} /> Opgeslagen!</> : "Opslaan"}
          </button>
        </div>
      </div>
    </div>
  );
}
