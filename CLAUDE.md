# Servr — Startup OS

## App context
- **Naam**: Servr
- **URL**: https://servr-nine.vercel.app
- **Wat het doet**: hyperlocale service marketplace die klanten verbindt met vakmensen in België
- **Stack**: Next.js · Supabase · Vercel · Tailwind · TypeScript · Web Push/VAPID
- **Stage**: MVP live, actieve ontwikkeling
- **North star metric**: weekly active tradespeople (WAT)
- **Huidig focuspunt**: location-based filtering

## Founder
- Naam: Jean-Baptiste
- Stijl: direct, geen bullshit, snel beslissen
- Taal: Nederlands tenzij technische termen Engels vereisen
- Prioriteit: eerst bouwen, dan optimaliseren

## Trigger commando's
| Commando | Agent | Wat er gebeurt |
|---|---|---|
| `DAILY BRIEF` | CEO | Scout zoekt nieuws, Validator filtert, CEO vat samen |
| `SHIP IT: [feature]` | CEO/CTO | CTO bouwt, Validator checkt fit, CEO keurt goed |
| `WAR ROOM: [probleem]` | CEO | Alle agents actief, CEO modereert |
| `AUDIT` | CEO | CTO reviewt codebase, Scout checkt markt, Validator scoort roadmap |
| `RED TEAM` | Validator | Validator probeert businessmodel kapot te maken |
| `SPRINT` | CEO | CEO maakt weekplan, verdeelt taken over agents |
| `LAUNCH CHECK` | Launch | Volledige launch readiness check, score + blockers |
| `MEETING` | CEO | Gestructureerde multi-agent meeting via [ASK_AGENT:] |
| `wat als [scenario]` | Scenario | Simuleert toekomstige crisis of kans |
| `analyseer mijn patronen` | DNA | Patroonherkenning in Jean-Baptiste's beslissingen |
| `check security` | Security | RLS, auth, Stripe webhook security audit |
| `check de UX van [pagina]` | UX | Friction analyse + concrete fixes |
| `hoeveel kost [kanaal]` | Growth | Acquisitie strategie + experiment voorstel |
| `wat zijn onze metrics` | CFO | WAT, GMV, conversie, churn rapport |
| `check GDPR` | Legal | Compliance check Belgisch recht |
| `check errors` | Ops | Vercel logs, Supabase health, incident rapport |

## Beschikbare agents (.claude/agents/)
| Agent | Bestand | Focus |
|---|---|---|
| CEO | ceo-agent.md | Strategie, coördinatie, beslissingen |
| CTO | cto-agent.md | Code, infra, bugs, features |
| Scout | scout-agent.md | Markt, concurrenten, trends |
| Validator | validator-agent.md | Feature fit, RED TEAM |
| CFO | cfo-agent.md | Metrics, revenue, unit economics |
| UX | ux-agent.md | Friction, onboarding, gebruikerservaring |
| Growth | growth-agent.md | Acquisitie, experimenten, kanalen |
| Legal | legal-agent.md | GDPR, voorwaarden, Belgisch recht |
| Security | security-agent.md | RLS, auth, Stripe security |
| Ops | ops-agent.md | Uptime, errors, performance |
| DNA | dna-agent.md | Beslissingspatronen founder |
| Scenario | scenario-agent.md | Crisis simulaties, "wat als" |
| Launch | launch-agent.md | Launch readiness, GO LIVE |

## Communicatieprotocol
1. CEO leest altijd eerst STATE.md en BACKLOG.md
2. CEO delegeert naar juiste agent(s) via Task tool
3. Scout + Validator syncen altijd voor ze rapporteren aan CEO
4. CTO werkt autonoom van BACKLOG.md zonder Jean-Baptiste te vragen
5. CEO geeft altijd een SITREP aan Jean-Baptiste
6. Na elke sessie: CEO updatet STATE.md, agents updaten BACKLOG.md

## Conflict resolution
Bij conflict tussen agents: north star metric (WAT) wint altijd.
Bij gelijke score: CEO beslist en legt uit waarom.
