"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SECTIONS = [
  {
    titel: "1. Wie zijn wij?",
    tekst: `Servr BV (hierna "Servr") is een online marktplaats die klanten verbindt met vakbekwame dienstverleners ("vakmensen"). Servr is ingeschreven in het Belgisch Crossroads Bank for Enterprises (KBO) onder nummer BE 1234.567.890.`,
  },
  {
    titel: "2. Toepasselijkheid",
    tekst: `Deze gebruikersvoorwaarden zijn van toepassing op alle gebruik van het Servr-platform, inclusief de mobiele app, website en alle bijbehorende diensten. Door gebruik te maken van Servr ga je akkoord met deze voorwaarden.`,
  },
  {
    titel: "3. Account en registratie",
    tekst: `Je dient minimaal 18 jaar oud te zijn om een account aan te maken. Je bent verantwoordelijk voor de beveiliging van je inloggegevens. Servr behoudt zich het recht voor accounts te verwijderen bij misbruik of overtreding van deze voorwaarden.`,
  },
  {
    titel: "4. Gebruik van het platform",
    tekst: `Servr is uitsluitend bedoeld voor legitieme zakelijke transacties tussen klanten en vakmensen. Het is verboden het platform te gebruiken voor frauduleuze activiteiten, spam, of het verspreiden van schadelijke inhoud.`,
  },
  {
    titel: "5. Commissies en betalingen",
    tekst: `Servr hanteert de volgende fee-structuur:\n• Klanten betalen een service fee van 5% bovenop het vakmanstarief\n• Vakmensen betalen een commissie van 8% aan Servr\n• Bij spoedopdrachten (Panic) geldt: klant +7%, vakman -6%\n\nBetalingen worden verwerkt via Stripe. Uitbetalingen aan vakmensen vinden plaats binnen 2 werkdagen na bevestigde betaling.`,
  },
  {
    titel: "6. Aansprakelijkheid",
    tekst: `Servr fungeert uitsluitend als intermediair en is niet aansprakelijk voor de kwaliteit van uitgevoerd werk, letsel of schade die voortvloeit uit overeenkomsten tussen klanten en vakmensen. Vakmensen zijn zelf verantwoordelijk voor hun werkzaamheden en verzekeringen.`,
  },
  {
    titel: "7. Klachten en geschillen",
    tekst: `Klachten kunnen worden ingediend via support@servr.app. Servr streeft ernaar klachten binnen 5 werkdagen te behandelen. Bij geschillen tussen klanten en vakmensen treedt Servr op als bemiddelaar, maar is niet verplicht uitspraken te doen.`,
  },
  {
    titel: "8. Wijzigingen",
    tekst: `Servr behoudt zich het recht voor deze voorwaarden op elk moment te wijzigen. Gebruikers worden per e-mail op de hoogte gesteld van significante wijzigingen. Voortgezet gebruik na wijzigingen impliceert acceptatie.`,
  },
  {
    titel: "9. Toepasselijk recht",
    tekst: `Op deze overeenkomst is Belgisch recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechtbanken van Gent, België.`,
  },
];

export default function VoorwaardenPage() {
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
            <h1 className="font-black text-xl">Gebruikersvoorwaarden</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Versie 1.0 · Geldig vanaf 1 januari 2026</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-6">
        <div className="p-4 rounded-2xl" style={{ background: "var(--teal)" + "10" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--teal)" }}>
            <strong>Samenvatting:</strong> Servr verbindt klanten met vakmensen. Je betaalt veilig via Stripe. Vakmensen ontvangen 92% van hun tarief (8% commissie). Klanten betalen 5% service fee bovenop het tarief.
          </p>
        </div>

        {SECTIONS.map((s) => (
          <div key={s.titel}>
            <h2 className="font-black text-base mb-2">{s.titel}</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--muted)" }}>
              {s.tekst}
            </p>
          </div>
        ))}

        <div className="text-xs text-center pb-4" style={{ color: "var(--muted)" }}>
          © 2026 Servr BV · support@servr.app
        </div>
      </div>
    </div>
  );
}
