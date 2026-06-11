# BUGLOG — V3 polish ronde (11 juni 2026)

Elke gevonden bug: oorzaak → fix. Aangevuld tijdens de hele ronde.

## Deel 1 — Statussysteem

| # | Bug | Oorzaak | Fix |
|---|---|---|---|
| 1 | "Offerte is niet meer beschikbaar" bij geldige acceptatie | Update met `eq(status,'wachtend')` raakte 0 rijen (RLS-policy ontbrak zolang de migratie niet gedraaid was) en de code gaf één generieke melding voor élke 0-rijen-situatie | `lib/flow.ts` leest bij 0 rijen de échte status terug en geeft een precieze melding, incl. expliciete hint "draai migratie" wanneer de status wél `wachtend` is (= rechtenprobleem) |
| 2 | `offertes_status_check` in DB kende `ingetrokken` niet → vakman "offerte intrekken" crashte stil | Tabel live aangemaakt buiten schema.sql met een smallere constraint dan de code gebruikt | Migratie `20260611_v3_polish.sql` zet alle status-constraints exact op de TS-unions; bestaande afwijkende rijen worden genormaliseerd |
| 3 | Drie verschillende statuslabel-maps in componenten (home, opdracht-detail, offerte-detail) konden uit elkaar lopen | Copy-paste per pagina | `lib/status.ts` is de enige bron: unions + NL-labels + `wieAanZet()` + `statusKleur()`; componenten importeren |
| 4 | Vakman kon een offerte sturen op een al vergeven/betaalde klus | Geen status-check vóór insert in `/offerte/maak` | Status-check toegevoegd: alleen `open`/`offerte_ontvangen` accepteert nieuwe offertes |
| 5 | `lib/supabase.ts` en `lib/flow.ts` hadden elk hun eigen status-unions | Historisch gegroeid | `supabase.ts` re-exporteert nu uit `status.ts`; flow.ts gebruikt `satisfies OfferteStatus` op elke literal |
