# Servr — CTO Backlog

## Hoe dit werkt
- Scout voegt toe onder MARKET_SIGNALS
- Validator vertaalt signals naar APPROVED_TASKS
- CEO prioriteert en zet in SPRINT_QUEUE
- CTO werkt SPRINT_QUEUE af van boven naar beneden, autonoom
- CTO verplaatst afgewerkte taken naar DONE met PR link

---

## SPRINT_QUEUE
| Prio | Taak | Aanvrager | Context | Acceptance criteria |
|------|------|-----------|---------|---------------------|
| 1 | Location-based filtering afwerken | Jean-Baptiste | Gebruikers moeten vakmensen zien op basis van hun locatie | Zoekresultaten gefilterd op postcode/gemeente, radius instelbaar |

---

## APPROVED_TASKS
| Taak | Score /25 | Validator verdict | Bron |
|------|-----------|-------------------|------|

---

## MARKET_SIGNALS
| Datum | Signaal | Ernst | Bron | Actie nodig? |
|-------|---------|-------|------|--------------|

---

## IN_PROGRESS
| Taak | Branch | Gestart | ETA |
|------|--------|---------|-----|

---

## DONE
| Taak | PR | Deploy | Datum |
|------|-----|--------|-------|

---

## TECH_DEBT
| Bestand/module | Probleem | Urgentie (1-5) |
|----------------|---------|----------------|
