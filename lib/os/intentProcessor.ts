import type { AgentKey } from "./agentConfig";

export type Intent =
  | { type: "NAVIGATE"; payload: string }
  | { type: "SWITCH_AGENT"; payload: AgentKey }
  | { type: "OPEN_PREVIEW" }
  | { type: "NONE" };

const NAVIGATION_PATTERNS: [RegExp, string][] = [
  [/\b(ga naar|open|toon|laat zien|navigeer)\s+(de\s+)?(home|homepage|beginpagina|start)\b/i, "/"],
  [/\b(ga naar|open|toon)\s+(de\s+)?onboarding\b/i, "/onboarding"],
  [/\b(ga naar|open|toon)\s+(de\s+)?zoekpagina\b/i, "/search"],
  [/\bzoek\s+(naar\s+)?vakmensen\b/i, "/search"],
  [/\b(ga naar|open|toon)\s+(de\s+)?dashboard\b/i, "/dashboard"],
  [/\b(ga naar|open|toon)\s+(de\s+)?berichten\b/i, "/berichten"],
  [/\b(ga naar|open|toon)\s+(de\s+)?feed\b/i, "/feed"],
  [/\b(ga naar|open|toon)\s+(de\s+)?(profiel|profile)\b/i, "/profile"],
  [/\b(ga naar|open|toon)\s+(de\s+)?agenda\b/i, "/agenda"],
  [/\bspoed\b/i, "/panic"],
  [/\b(ga naar|open|toon)\s+(de\s+)?(klanten|klant)\b/i, "/klanten"],
  [/\b(ga naar|open|toon)\s+(de\s+)?klussen\b/i, "/klussen"],
  [/\b(ga naar|open|toon)\s+(de\s+)?instellingen\b/i, "/instellingen"],
];

const AGENT_SWITCH_PATTERNS: [RegExp, AgentKey][] = [
  [/\b(praat met|switch naar|ga naar|stuur door naar|vraag aan)\s+(de\s+)?cto\b/i, "cto"],
  [/\b(praat met|switch naar|ga naar|stuur door naar|vraag aan)\s+(de\s+)?ceo\b/i, "ceo"],
  [/\b(praat met|switch naar|ga naar|stuur door naar|vraag aan)\s+(de\s+)?scout\b/i, "scout"],
  [/\b(praat met|switch naar|ga naar|stuur door naar|vraag aan)\s+(de\s+)?validator\b/i, "validator"],
  [/\b(fix|repareer|herstel|debug)\s+.*(bug|fout|error|probleem)\b/i, "cto"],
  [/\b(analyseer|check)\s+(de\s+)?markt\b/i, "scout"],
];

export function processIntent(message: string): Intent[] {
  const intents: Intent[] = [];

  for (const [pattern, path] of NAVIGATION_PATTERNS) {
    if (pattern.test(message)) {
      intents.push({ type: "NAVIGATE", payload: path });
      break;
    }
  }

  for (const [pattern, agent] of AGENT_SWITCH_PATTERNS) {
    if (pattern.test(message)) {
      intents.push({ type: "SWITCH_AGENT", payload: agent });
      break;
    }
  }

  if (/\b(open|start|toon|laat zien)\s+(de\s+)?(servr\s+)?app\b/i.test(message)) {
    intents.push({ type: "OPEN_PREVIEW" });
  }

  return intents;
}
