import type { AgentKey } from "./agentConfig";

export type ParsedMessage = {
  text: string;
  navigate?: string;
  highlight?: string;
  switchAgent?: AgentKey;
  // ASK_AGENT: CEO stuurt een vraag door naar een andere agent
  // Syntax: [ASK_AGENT: scout | Wat is het grootste marktgat?]
  askAgent?: { key: AgentKey; question: string };
  beslissing?: { question: string; optionA: string; optionB: string };
};

const VALID_AGENTS: AgentKey[] = ["ceo", "cto", "scout", "validator"];

export function parseStreamText(raw: string): ParsedMessage {
  let text = raw;
  const result: ParsedMessage = { text: "" };

  // NAVIGATE
  const navMatch = raw.match(/\[NAVIGATE:\s*([^\]]+)\]/);
  if (navMatch) result.navigate = navMatch[1].trim();

  // HIGHLIGHT
  const hlMatch = raw.match(/\[HIGHLIGHT:\s*([^\]]+)\]/);
  if (hlMatch) result.highlight = hlMatch[1].trim();

  // SWITCH_AGENT (passief — switcht zonder vraag te sturen)
  const swMatch = raw.match(/\[SWITCH_AGENT:\s*([^\]]+)\]/);
  if (swMatch) {
    const key = swMatch[1].trim().toLowerCase();
    if (VALID_AGENTS.includes(key as AgentKey)) {
      result.switchAgent = key as AgentKey;
    }
  }

  // ASK_AGENT (actief — switcht EN stuurt vraag automatisch door)
  // Syntax: [ASK_AGENT: scout | Wat is het grootste marktgat?]
  const askMatch = raw.match(/\[ASK_AGENT:\s*([^|]+)\|\s*([^\]]+)\]/);
  if (askMatch) {
    const key = askMatch[1].trim().toLowerCase();
    const question = askMatch[2].trim();
    if (VALID_AGENTS.includes(key as AgentKey) && question) {
      result.askAgent = { key: key as AgentKey, question };
    }
  }

  // BESLISSING
  const bMatch = raw.match(/\[BESLISSING:\s*([^|]+)\|\s*OPTIE_A:\s*([^|]+)\|\s*OPTIE_B:\s*([^\]]+)\]/);
  if (bMatch) {
    result.beslissing = {
      question: bMatch[1].trim(),
      optionA:  bMatch[2].trim(),
      optionB:  bMatch[3].trim(),
    };
  }

  // Strip alle speciale tags uit de weergegeven tekst
  text = text
    .replace(/\[NAVIGATE:[^\]]+\]/g, "")
    .replace(/\[HIGHLIGHT:[^\]]+\]/g, "")
    .replace(/\[SWITCH_AGENT:[^\]]+\]/g, "")
    .replace(/\[ASK_AGENT:[^\]]+\]/g, "")
    .replace(/\[BESLISSING:[^\]]+\]/g, "")
    .replace(/\[SHOW_SECTION:[^\]]+\]/g, "");

  result.text = text;
  return result;
}
