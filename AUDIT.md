# AUDIT — Servr Live-Readiness
_Gegenereerd: 2026-06-08_

---

## 1. MOCK DATA GEBRUIK

### ❌ Pagina's die nog mockData importeren

| Bestand | Wat wordt geïmporteerd | Prioriteit |
|---|---|---|
| `app/provider/[id]/page.tsx` | `PROVIDERS` → volledige vakmanprofiel | 🔴 KRITIEK |
| `app/agenda/boeken/[vakmanId]/page.tsx` | `PROVIDERS` → vakman voor booking form | 🔴 KRITIEK |
| `app/leaderboard/page.tsx` | mock vakmensen lijst | 🟡 LAAG |
| `app/favorieten/page.tsx` | mock PROVIDERS voor favorieten | 🟡 LAAG |
| `app/aanvraag/page.tsx` | mock providers | 🟡 LAAG |

### ✅ Pagina's die al echte Supabase data gebruiken

- `app/search/page.tsx` — vakmensen + profiles join, haversine filtering
- `app/chat/[id]/page.tsx` — gesprekken + berichten + realtime subscription
- `app/berichten/page.tsx` — gesprekken lijst
- `app/feed/page.tsx` — spoed_oproepen
- `app/agenda/page.tsx` — boekingen van vandaag
- `app/dashboard/page.tsx` — profiel + stats
- `app/vakman-setup/page.tsx` — Stripe connect (maar GEEN write naar vakmensen tabel)
- `app/onboarding/page.tsx` — auth + profile aanmaken
- `app/mijn-opdrachten/page.tsx` — boekingen
- `app/klussen/page.tsx` — boekingen vakman view
- `app/te-betalen/page.tsx` — betalingen
- `app/offertes/page.tsx` — offertes
- `app/meldingen/page.tsx` — notificaties
- `app/verdiensten/page.tsx` — omzet stats
- `app/licenties/page.tsx` — documenten
- `app/panic/page.tsx` — spoed_oproepen
- `app/diensten/page.tsx` — diensten tabel
- `app/documenten/page.tsx` — documenten

---

## 2. STRIPE API STATUS

| Route | Status | Details |
|---|---|---|
| `app/api/stripe/intent/route.ts` | ✅ COMPLEET | PaymentIntent met Connect, fees (5%+8%), metadata |
| `app/api/stripe/webhook/route.ts` | ⚠️ PARTIEEL | Webhook verwerkt `payment_intent.succeeded` maar schrijft naar in-memory store ipv Supabase |
| `app/api/stripe/connect/route.ts` | ✅ COMPLEET | Stripe Express onboarding URL |
| `app/api/stripe/config/route.ts` | ✅ COMPLEET | Publishable key exposer |

---

## 3. ENV VARIABELEN STATUS

| Variabele | Status | Waarde |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ GECONFIGUREERD | `https://ydvchxpsivpmmmjbywxe.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ GECONFIGUREERD | sb_publishable_... |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ PLACEHOLDER | `your_service_role_key` |
| `STRIPE_SECRET_KEY` | ❌ PLACEHOLDER | `your_stripe_secret_key` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ PLACEHOLDER | `your_stripe_publishable_key` |
| `STRIPE_WEBHOOK_SECRET` | ❌ ONTBREEKT VOLLEDIG | niet in .env.local |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ GECONFIGUREERD | BPN-glkwuEN24U-... |
| `VAPID_PRIVATE_KEY` | ✅ GECONFIGUREERD | YTzIhq... |
| `VAPID_EMAIL` | ✅ GECONFIGUREERD | mailto:info@servr.app |
| `ANTHROPIC_API_KEY` | ✅ GECONFIGUREERD | sk-ant-... |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ❌ PLACEHOLDER | `your_mapbox_token` (niet kritiek) |

---

## 4. KRITIEKE FLOWS STATUS

| Flow | Status | Probleem |
|---|---|---|
| Klant zoekt vakman | ✅ WERKT | Laadt van Supabase, geo-filtering |
| Vakman registreert | ⚠️ PARTIEEL | Stripe werkt, maar GEEN write naar `vakmensen` tabel bij setup |
| Klant bekijkt vakmanprofiel | ❌ BROKEN | `provider/[id]` laadt van mockData |
| Klant boekt vakman | ⚠️ PARTIEEL | Booking form (`agenda/boeken/[id]`) laadt van mockData |
| Stripe betaling | ⚠️ PARTIEEL | Intent route OK, maar webhook schrijft niet naar Supabase |
| Chat na boeking | ✅ WERKT | Realtime berichten via Supabase channel |

---

## 5. WAT GEFIXED IS (deze sessie)

- [x] `app/provider/[id]/page.tsx` → echte Supabase data (vakmensen + profiles + diensten + reviews)
- [x] `app/vakman-setup/page.tsx` → schrijft naar `vakmensen` + `profiles` bij stap "bedrijf"
- [x] `app/api/stripe/webhook/route.ts` → schrijft betaald=true naar `boekingen` tabel via Supabase
- [x] `lib/launchChecker.ts` → automatische launch readiness checks
- [x] `app/api/launch/check/route.ts` → API endpoint voor launch checker
- [x] `app/os/page.tsx` → Launch Readiness sectie toegevoegd
- [x] `lib/mockData.ts` → DEPRECATED commentaar toegevoegd
- [x] `.env.example` → volledig gedocumenteerd

---

## 6. WAT NOG MIST VOOR LAUNCH

### Blocker (moet voor launch)
1. **STRIPE_SECRET_KEY** instellen in Vercel → anders werkt geen enkele betaling
2. **SUPABASE_SERVICE_ROLE_KEY** instellen → webhook kan dan niet schrijven naar DB
3. **STRIPE_WEBHOOK_SECRET** aanmaken in Stripe dashboard + instellen
4. **Minstens 1 testboeking** end-to-end uitvoeren (zoeken → boeken → betalen)

### Niet-blocker (kan na launch)
5. `app/agenda/boeken/[vakmanId]/page.tsx` → mockData vervangen
6. `app/leaderboard/page.tsx` → echte data
7. `app/favorieten/page.tsx` → Supabase favorieten tabel
8. Webhook notificaties naar echte Supabase `notificaties` tabel
9. Supabase Storage voor foto uploads in chat

---

## 7. LAUNCH SCORE

**Technisch**: 6/11 checks groen  
**Kritieke flows**: 3/6 volledig werkend  
**Env vars**: 6/10 geconfigureerd

**Volgende prioriteit**: Stripe keys instellen → end-to-end testboeking uitvoeren
