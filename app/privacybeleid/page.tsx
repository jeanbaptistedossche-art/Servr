"use client";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

const SECTIONS = [
  {
    titel: "Welke gegevens verzamelen wij?",
    items: [
      "Naam, e-mailadres en telefoonnummer bij registratie",
      "Locatiegegevens (alleen met jouw toestemming) om vakmensen in de buurt te vinden",
      "Betalingsinformatie — verwerkt en beveiligd door Stripe (Servr slaat nooit volledige kaartgegevens op)",
      "Conversaties via het chatplatform",
      "Beoordelingen en reviews die je plaatst",
      "Technische gegevens zoals IP-adres, apparaattype en app-versie",
    ],
  },
  {
    titel: "Waarvoor gebruiken wij jouw gegevens?",
    items: [
      "Om je account te beheren en toe te wijzen aan de juiste vakmensen",
      "Voor de verwerking van betalingen via Stripe",
      "Om je op de hoogte te houden van je boekingen en opdrachten",
      "Voor klantenservice en klachtenafhandeling",
      "Om fraude en misbruik te detecteren",
      "Voor anonieme statistieken om ons platform te verbeteren",
    ],
  },
  {
    titel: "Met wie delen wij jouw gegevens?",
    items: [
      "Stripe — voor beveiligde betalingsverwerking",
      "De vakman die jouw opdracht uitvoert (naam, telefoonnummer pas na acceptatie offerte)",
      "Overheidsinstanties wanneer wij daartoe wettelijk verplicht zijn",
      "Wij verkopen jouw gegevens nooit aan derden",
    ],
  },
  {
    titel: "Jouw rechten",
    items: [
      "Recht op inzage: vraag een overzicht van jouw gegevens op via support@servr.app",
      "Recht op correctie: laat onjuiste gegevens aanpassen",
      "Recht op verwijdering: verzoek je account en gegevens te wissen",
      "Recht op dataportabiliteit: ontvang jouw gegevens in een leesbaar formaat",
      "Recht op bezwaar: bezwaar maken tegen bepaalde verwerking",
    ],
  },
  {
    titel: "Beveiliging",
    items: [
      "SSL/TLS-versleuteling voor alle communicatie",
      "Wachtwoorden worden gehasht opgeslagen (bcrypt)",
      "Betaalgegevens worden uitsluitend verwerkt door Stripe (PCI DSS Level 1)",
      "Regelmatige beveiligingsaudits",
      "Twee-factor authenticatie beschikbaar",
    ],
  },
  {
    titel: "Bewaartermijnen",
    items: [
      "Accountgegevens: zolang je account actief is + 1 jaar",
      "Betalingstransacties: 7 jaar (wettelijke verplichting)",
      "Chatberichten: 2 jaar na het laatste bericht",
      "Locatiegegevens: maximaal 30 dagen",
    ],
  },
];

export default function PrivacybeleidPage() {
  return (
    <div className="flex flex-col min-h-full pb-10 animate-fade-in">
      <div className="px-5 pt-12 pb-5 sticky top-0 z-10"
        style={{ background: "#F5EFE5", borderBottom: "1px solid #E5DDD0" }}>
        <div className="flex items-center gap-3">
          <Link href="/instellingen"
            className="touch-scale w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#EDE4D2" }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-black text-xl">Privacybeleid</h1>
            <p className="text-xs" style={{ color: "#8A8A83" }}>Versie 1.0 · Geldig vanaf 1 januari 2026</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">
        <div className="p-4 rounded-2xl flex items-start gap-3"
          style={{ background: "#2B4030" + "10" }}>
          <Shield size={18} style={{ color: "#2B4030", flexShrink: 0, marginTop: 2 }} />
          <p className="text-sm leading-relaxed" style={{ color: "#2B4030" }}>
            <strong>Jouw privacy is onze prioriteit.</strong> Servr verkoopt nooit jouw gegevens. Locatie wordt alleen gedeeld met toestemming. Betalingen lopen via de beveiligde Stripe infrastructuur.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <div key={s.titel}>
            <h2 className="font-black text-base mb-3">{s.titel}</h2>
            <div className="flex flex-col gap-2">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ background: "#2B4030" }} />
                  <p className="text-sm leading-relaxed" style={{ color: "#8A8A83" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="card p-4">
          <p className="font-bold text-sm mb-1">Contact DPO</p>
          <p className="text-xs" style={{ color: "#8A8A83" }}>
            Vragen over jouw privacy? Neem contact op met onze Data Protection Officer via{" "}
            <span style={{ color: "#2B4030" }}>privacy@servr.app</span>
          </p>
        </div>

        <div className="text-xs text-center pb-4" style={{ color: "#8A8A83" }}>
          © 2026 Servr BV · Gebaseerd op GDPR / AVG
        </div>
      </div>
    </div>
  );
}
