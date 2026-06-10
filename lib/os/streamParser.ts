import type { AgentKey } from "./agentConfig";
import { AGENT_KEYS } from "./agentConfig";

export type ParsedMessage = {
  text: string;
  navigate?: string;
  highlight?: string;
  switchAgent?: AgentKey;
  askAgent?: { key: AgentKey; question: string };
  beslissing?: { question: string; optionA: string; optionB: string };
  learns?: { file: string; content: string }[];
};

export function parseStreamText(raw: string): ParsedMessage {
  let text = raw;
  const result: ParsedMessage = { text: "" };

  // NAVIGATE
  const navMatch = raw.match(/\[NAVIGATE:\s*([^\]]+)\]/);
  if (navMatch) result.navigate = navMatch[1].trim();

  // HIGHLIGHT
  const hlMatch = raw.match(/\[HIGHLIGHT:\s*([^\]]+)\]/);
  if (hlMatch) result.highlight = hlMatch[1].trim();

  // SWITCH_AGENT
  const swMatch = raw.match(/\[SWITCH_AGENT:\s*([^\]]+)\]/);
  if (swMatch) {
    const key = swMatch[1].trim().toLowerCase();
    if (AGENT_KEYS.includes(key as AgentKey)) result.switchAgent = key as AgentKey;
  }

  // ASK_AGENT
  const askMatch = raw.match(/\[ASK_AGENT:\s*([^|]+)\|\s*([^\]]+)\]/);
  if (askMatch) {
    const key = askMatch[1].trim().toLowerCase();
    const question = askMatch[2].trim();
    if (AGENT_KEYS.includes(key as AgentKey) && question) {
      result.askAgent = { key: key as AgentKey, question };
    }
  }

  // BESLISSING
  const bMatch = raw.match(/\[BESLISSING:\s*([^|]+)\|\s*OPTIE_A:\s*([^|]+)\|\s*OPTIE_B:\s*([^\]]+)\]/);
  if (bMatch) {
    result.beslissing = {
      question: bMatch[1].trim(),
      optionA: bMatch[2].trim(),
      optionB: bMatch[3].trim(),
    };
  }

  // LEARN — [LEARN: agents/cto/learnings | inhoud van wat geleerd is]
  const learnMatches = [...raw.matchAll(/\[LEARN:\s*([^|]+)\|\s*([^\]]+)\]/g)];
  if (learnMatches.length > 0) {
    result.learns = learnMatches.map(m => ({
      file: m[1].trim(),
      content: m[2].trim(),
    }));
  }

  // Strip alle speciale tags
  text = text
    .replace(/\[NAVIGATE:[^\]]+\]/g, "")
    .replace(/\[HIGHLIGHT:[^\]]+\]/g, "")
    .replace(/\[SWITCH_AGENT:[^\]]+\]/g, "")
    .replace(/\[ASK_AGENT:[^\]]+\]/g, "")
    .replace(/\[BESLISSING:[^\]]+\]/g, "")
    .replace(/\[LEARN:[^\]]+\]/g, "")
    .replace(/\[SHOW_SECTION:[^\]]+\]/g, "");

  result.text = text;
  return result;
}
