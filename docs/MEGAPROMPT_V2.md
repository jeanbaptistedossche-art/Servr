# SERVR — MEGAPROMPT V2 (verrijkt met codebase-audit, juni 2026)

> Vervangt `servr_fable5_megaprompt.md`. Verschil met v1: elke fase heeft nu
> concrete acceptatiecriteria, de audit-bevindingen zijn verwerkt, edge cases
> zijn benoemd en er is een testmatrix. Volgorde is aangepast aan wat de
> E2E-flow echt blokkeert.

---

## CONTEXT

**Servr** — hyperlocale Belgische marketplace (klanten ↔ vakmensen).
Stack: Next.js 14 App Router · Supabase · Vercel · Tailwind · TypeScript.
Startregio: **Gent + ~25-30 km radius**.

Commissiemodel (bron of waarheid = `/api/stripe/intent`):
- Klant betaalt **+5%** bovenop klusbedrag (spoed: +7%)
- Vakman ontvangt **−7%** (spoed: −6%)
- Stripe Connect Express, escrow via PaymentIntent + uitgestelde Transfer
- Navigatie: **alleen Waze deeplinks** (`https://waze.com/ul?ll={lat},{lng}&navigate=yes`)

⚠️ V1 zei "vakman −7%", de code gebruikte −8%. **Beslissing: −7% wordt de
standaard** — pas `/api/stripe/intent` aan zodat code en prompt overeenkomen.

---

## AUDIT-BEVINDINGEN (samenvatting — juni 2026)

**E2E-blockers (must fix):**
1. `/opdracht/[id]` — 100% mock (`MOCK_OPDRACHTEN`), offerte-form schrijft niet naar DB
2. `/offerte/[id]` — 100% mock (`MOCK_OFFERTES`), klant accepteert nep-data
3. `/te-betalen` — alleen Zustand/localStorage; refresh = data weg; Stripe return_url breekt
4. `/inchecken` — hardcoded `TODAY_KLUSSEN` + `QR_DATABASE`, camera decodeert niets
5. `/reviews` — 100% mock, `reviews` tabel wordt nooit beschreven

**Dode elementen:** home locatie-knop, chat kebab-menu, agenda chat/navigatie-knoppen,
berichten PenSquare + zoekbalk, reviews share-knop, foto-upload (opdracht + chat) alleen
lokale preview.

**Type-gaten:** `opdrachten`, `offertes`, `notificaties` ontbreken in `lib/supabase.ts`
Database type — de drie meest gebruikte tabellen.

**Hardcodes:** `vakmanChatId = "p1"` (offerte/maak), `MOCK_BEDRIJF` (offerte/maak),
`boekingen.start_tijd` = morgen 10:00, feed `RADIUS_KM = 30`, categorie-counts op home.

---

## WERKMETHODE — STRIKT

1. Lees CLAUDE.md eerst. 2. Audit voor je bouwt. 3. Trace elke interactie.
4. **Nul mock data** — elke hardcoded array/count/lijst wordt een Supabase query of verdwijnt.
5. Na elke fix: mentale user-trace (klik elke knop, submit elke form, volg elke link).
6. Commit per fase, duidelijke messages, push naar origin.
7. Alles werkt, of het bestaat niet. Geen TODO's, geen placeholders.

---

## FASE 0 — FUNDAMENT (nieuw t.o.v. v1)

1. **DB types**: voeg `Opdracht`, `Offerte`, `Notificatie` types + tabel-entries toe aan
   `lib/supabase.ts`.
2. **Status machine** (één bron van waarheid, exporteer als const):
   `open → offerte_ontvangen → geaccepteerd → betaald → ingecheckt → afgerond → bevestigd → uitbetaald`
   plus zijpaden: `geannuleerd`, `geschil`.
3. **Design tokens**: CSS-variabelen in `globals.css` voor het bestaande warme palet
   (zie FASE 8) — daarna geen hex-codes meer inline in nieuwe code.
4. **SQL-migratie** (`docs/migration.sql`): kolommen die de flow nodig heeft —
   `boekingen.opdracht_id`, `boekingen.offerte_id`, `boekingen.payment_intent_id`,
   `boekingen.qr_code`, `boekingen.lat/lng`, `boekingen.ingecheckt_at`,
   `boekingen.bevestigd_at`, `boekingen.uitbetaald_at`, `reviews.reviewer_rol`,
   `reviews.opdracht_id`, Storage buckets `chat-fotos` + `opdracht-fotos` (public read).

**Acceptatie:** `npm run build` groen; geen `any` op DB-paden; tokens gebruikt in ≥1 pagina.

---

## FASE 1 — KRITIEKE BUGS (12)

| # | Bug | Fix | Acceptatie |
|---|---|---|---|
| 1 | Stem race condition `app/page.tsx` | `stemTekstRef` synchroon bijwerken in `onresult`, lezen in `onend` | Spraak →opdracht werkt 2× achter elkaar |
| 2 | Agenda ÷100 | Bedragen staan in euro's — overal consistent `€ X` via één util `formatEuro()` | Geen enkel bedrag ×100 te klein |
| 3 | Feed radius hardcoded | `radius_km` uit `vakmensen` laden; afstandsbadge per card; sort op afstand | Vakman met 10km ziet minder dan met 50km |
| 4 | Chat foto lokaal | Upload naar Storage `chat-fotos`, URL in `berichten.bijlage_url` | Foto zichtbaar voor beide partijen na refresh |
| 5 | Unread altijd 1 | Increment per bericht; reset bij openen door ontvanger | Teller klopt na 3 berichten |
| 6 | Home mock opdrachten | Echte query: eigen actieve opdrachten van klant | Klik gaat naar echt opdracht-ID |
| 7 | Home fake counts | Echte count per categorie binnen radius, of weglaten | Geen verzonnen getallen |
| 8 | Agenda knoppen dood | Chat → `/chat/{gesprek_id}`; Navigatie → Waze deeplink | Beide knoppen doen iets echts |
| 9 | Berichten archief | Archief-tab queryt `gearchiveerd=true`; archiveren werkt (kebab-menu in chat) | Archiveren + terugvinden werkt |
| 10 | Inchecken mock | Echte boekingen van vandaag; QR = `boeking.qr_code`; scan/code → status `ingecheckt` | Mock arrays volledig weg |
| 11 | PenSquare dood | Knop weg óf werkende "zoek persoon → start gesprek" | Geen dode knop |
| 12 | Search cat filter | `?cat=` filtert echt in de query | `/search?cat=loodgieter` toont alleen loodgieters |

**Edge cases fase 1:** geen GPS-permissie (toon banner + handmatige stad), Web Speech
niet beschikbaar (verberg mic), Storage upload faalt (bericht zonder foto + foutmelding),
0 opdrachten in radius (empty state met radius-vergroot-tip).

---

## FASE 2 — KLANT ↔ VAKMAN FLOW (de 3 grote blockers)

### 2a. `/opdracht/[id]` — volledig herbouwen op Supabase
- Laad opdracht via `id` uit `opdrachten` (+ klant-profiel join)
- Vakman-view: offerte-form schrijft echt naar `offertes` (hergebruik logica `/offerte/maak`
  of redirect ernaar), "Weigeren" = lokaal verbergen + niet meer tonen in feed (status per vakman niet nodig in MVP — gewoon client-side hide met localStorage)
- Klant-view (eigen opdracht): status, ontvangen offertes, annuleer-knop (status `geannuleerd`, alleen zolang niet betaald)
- Echte kaart niet nodig — adres + afstand + Waze-link volstaan

**Acceptatie:** opdracht-ID uit feed opent echte data; offerte verschijnt bij klant zonder refresh (realtime).

### 2b. `/offerte/[id]` — volledig herbouwen op Supabase
- Laad offerte + opdracht + vakman (rating!) via id
- Accepteren: `offertes.status=geaccepteerd`, andere offertes op dezelfde opdracht → `geweigerd`, `opdrachten.status=geaccepteerd`, maak `boekingen` rij (incl. `offerte_id`, `qr_code` = uuid), maak/vind `gesprekken` rij → redirect `/te-betalen?boeking={id}`
- Weigeren: `offertes.status=geweigerd` in DB + notificatie naar vakman

**Acceptatie:** accepteren werkt na refresh, dubbel-accepteren onmogelijk (check status vooraf), vakman ziet status-update realtime in `/offertes`.

### 2c. `/te-betalen` — stateless maken
- Bron = URL: `/te-betalen?boeking={id}` → alles uit Supabase laden
- Zustand `offerteStore` mag als cache blijven maar nooit als enige bron
- Stripe return_url = `/te-betalen?boeking={id}&betaald=1` → verifieer PaymentIntent status server-side vóór status-update
- Geen Stripe geconfigureerd → duidelijke "betalingen nog niet actief" melding, GEEN nep-bankkeuze

**Acceptatie:** refresh op elk punt verliest niets; betaald=1 met mislukte intent toont fout, geen valse succes-state.

### Edge cases fase 2
- Vakman zonder Stripe-account → offerte versturen geblokkeerd met CTA naar `/vakman-setup`
- Klant accepteert terwijl vakman offerte intrekt → status-check bij accept, toon "offerte niet meer beschikbaar"
- Twee klanten… n.v.t.; twee vakmensen zelfde opdracht → first-accept wint, rest auto-geweigerd
- Betaling halverwege afgebroken → boeking blijft `geaccepteerd`, betaalknop blijft
- Opdracht geannuleerd na offertes → notificatie naar alle vakmensen met openstaande offerte

---

## FASE 3 — STRIPE ESCROW

- `/api/stripe/intent` bestaat — pas fee aan naar −7% vakman, sla `payment_intent_id` op in boeking
- **Webhook**: `payment_intent.succeeded` → boeking `betaald` + notificaties; `payment_intent.payment_failed` → notificatie klant. Altijd signature-verificatie.
- **`/api/stripe/uitbetalen`**: alleen aanroepbaar als boeking `bevestigd`; Stripe Transfer naar `stripe_account` van vakman (bedrag −7%); status → `uitbetaald`; idempotent (check `uitbetaald_at`)
- **`/api/stripe/refund`**: volledige refund zolang niet `ingecheckt`; daarna → status `geschil` (admin handmatig via Stripe dashboard)

**Acceptatie:** testkaart 4242… doorloopt hele flow; webhook update status zonder client; dubbele uitbetaal-call betaalt niet dubbel uit.

---

## FASE 4 — VAKMAN AGENDA

- Dag-timeline 07:00–20:00, klusblokken met status-kleur (token-kleuren)
- Per blok: klantnaam, adres, bedrag-na-commissie, status badge, **Waze**, **Chat**, **QR incheck** (alleen vandaag), **Afgerond markeren**
- Dag- + week-inkomsten summary (som van `betaald`+ boekingen)
- Week-view: 7 kolommen, inkomsten per dag
- Sleep-to-reschedule en beschikbaarheids-slots: **uitgesteld naar v3** (niet E2E-kritisch)

**Acceptatie:** elke knop op elk blok doet iets echts; bedragen kloppen met commissie.

---

## FASE 5 — REVIEWS & TRUST

- Na `bevestigd`: klant moet reviewen vóór uitbetaling getriggerd wordt (verplicht), vakman mag reviewen
- `reviews` insert met `reviewer_rol` (`klant`|`vakman`), `boeking_id`, score 1-5 + tekst
- `/reviews` toont echte reviews (ontvangen + gegeven), mock volledig weg
- Rating-gemiddelde + count op feed cards en offerte-detail (uit `vakmensen.rating` — update via trigger of on-insert berekening)
- Badge "Top vakman" bij ≥4.8 én ≥10 klussen (berekend, niet opgeslagen)

**Acceptatie:** review-insert verschijnt direct op profiel; gemiddelde klopt; dubbel reviewen zelfde boeking onmogelijk.

---

## FASE 6 — NAVIGATIE

- **OS volledig uit de navbar** (apart desktop-product)
- Klant: Home · Opdrachten (`/mijn-opdrachten`) · Berichten (badge) · Profiel
- Vakman: Home (`/vakman`) · Agenda · Berichten (badge) · Profiel
- Feed bereikbaar via grote CTA op vakman-home (+ panic via home, niet via navbar)

**Acceptatie:** max 4 items, geen dode routes, badge klopt.

---

## FASE 7 — HOME PAGINA'S

**Klant home:** welkom + naam · grote CTA "Plaats een opdracht" · actieve opdrachten (max 3, echt) · recente berichten (max 2, echt) · 6 categorie-shortcuts. Alle mock/fake counts weg.

**Vakman home (nieuw):** welkom + rating · vandaag-agenda compact · nieuwe opdrachten in buurt (max 3, echt uit feed-query) · inkomsten deze week · beschikbaar-toggle (`vakmensen.beschikbaar`).

**Acceptatie:** nul hardcoded data; elke card klikt door naar echte detail.

---

## FASE 8 — DESIGN: "WARM BELGIAN CRAFT" (afwijking van v1 — bewust)

V1 stelde een blauw/amber SaaS-palet voor. **Beslissing: behouden en formaliseren van
het bestaande warme palet** — het is al consistent doorgevoerd, onderscheidend
(geen template-vibe) en past beter bij "Belgisch vakmanschap" dan generiek diepblauw.

```css
--bg:            #F5EFE5;  /* warm crème — app achtergrond */
--surface:       #FBF7F0;  /* card */
--surface-2:     #EDE4D2;  /* warm tan — secundaire vlakken */
--border:        #E5DDD0;
--ink:           #1A1D1A;  /* bijna-zwart */
--ink-2:         #5C5C56;
--muted:         #8A8A83;
--primary:       #2B4030;  /* diep groen — vertrouwen */
--primary-deep:  #1A2D22;
--accent:        #C97A4D;  /* koper — actie, spoed, CTA */
--success:       #16a34a;
--warning:       #d97706;
--danger:        #dc2626;
```

- Typografie blijft: **Source Serif 4** (display, italic accenten) + **Inter** (UI/body, tabular nums voor bedragen)
- Cards 12-16px radius, 0.5px borders, geen zware schaduwen
- Touch targets ≥44px, mobile-perfect op 390px
- Loading skeletons i.p.v. spinners; empty states met illustratie/emoji + CTA
- Lucide iconen; avatars = initialen-cirkels in token-kleuren (geen externe avatar-API)

---

## FASE 9 — PUSH NOTIFICATIES

- Nieuwe opdracht → alleen vakmensen binnen hun eigen `radius_km` (Haversine server-side in `/api/push/send`)
- Vakman: offerte geaccepteerd · betaling ontvangen · klant bevestigt · nieuwe review
- Klant: offerte ontvangen · vakman ingecheckt · klus afgerond
- In-app `notificaties` rij bij elk push-event (push kan falen, in-app niet)

---

## TESTMATRIX

| # | Scenario | Verwacht resultaat |
|---|---|---|
| T1 | Klant registreert, plaatst opdracht met GPS | Opdracht in DB met lat/lng, push naar vakmensen in radius |
| T2 | Opdracht zonder GPS-permissie | Handmatig adres, opdracht zonder lat/lng komt alleen in feeds zonder afstandsfilter-match → toon "geen locatie" badge |
| T3 | Vakman (radius 10km) opent feed, opdracht op 15km | Niet zichtbaar; op 8km wel + afstandsbadge |
| T4 | Vakman zonder Stripe stuurt offerte | Geblokkeerd met CTA naar vakman-setup |
| T5 | Vakman stuurt offerte | Rij in `offertes`, klant ziet hem realtime, notificatie |
| T6 | Klant accepteert offerte | Boeking aangemaakt, andere offertes geweigerd, redirect betalen |
| T7 | Klant refresht op /te-betalen | Alles nog zichtbaar (URL-param + Supabase) |
| T8 | Betaling met 4242-testkaart | Webhook → `betaald`, vakman-notificatie, agenda toont klus |
| T9 | Betaling afgebroken/faalt | Status blijft `geaccepteerd`, klant kan opnieuw |
| T10 | Vakman checkt in met QR/code op locatie | Status `ingecheckt`, klant ziet realtime update |
| T11 | Verkeerde QR-code | Foutmelding, geen status-wijziging |
| T12 | Vakman markeert afgerond, klant bevestigt | Status `bevestigd` → review-prompt klant |
| T13 | Klant geeft review | Uitbetaling getriggerd → Transfer −7% → `uitbetaald` |
| T14 | Klant bevestigt niet binnen 72u | (v3: auto-bevestiging; MVP: blijft `afgerond`, vakman kan reminder sturen via chat) |
| T15 | Annulatie vóór incheck | Refund 100%, status `geannuleerd`, beide partijen notificatie |
| T16 | Annulatie ná incheck | Status `geschil`, admin via Stripe dashboard |
| T17 | Dubbele accept (2 tabs) | Tweede accept faalt netjes op status-check |
| T18 | Dubbele uitbetaal-call | Idempotent — geen tweede Transfer |
| T19 | Chat foto + refresh beide kanten | Foto blijft zichtbaar (Storage URL) |
| T20 | Offline / Supabase down | Geen crash; foutmelding + retry mogelijk |
| T21 | Console op alle pagina's @390px | Nul errors, nul 404-links |

---

## EXTRA REGELS (ongewijzigd uit v1)

NL UI-teksten · mobile-first 390px · geen breaking changes op werkende routes ·
`NEXT_PUBLIC_*` voor client vars · RLS controleren per tabel · correcte TS types,
geen `any` · OS nooit in navbar.

Werk sequentieel FASE 0 → 9. Commit + push na elke fase.
