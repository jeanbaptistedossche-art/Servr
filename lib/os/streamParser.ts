import type { AgentKey } from "./agentConfig";

export type ParsedMessage = {
  text: string;
  navigate?: string;
  highlight?: string;
  switchAgent?: AgentKey;
  beslissing?: { question: string; optionA: string; optionB: string };
};

const TAGS: [RegExp, keyof ParsedMessage][] = [
  [/\[NAVIGATE:\s*([^\]]+)\]/g,  "navigate"],
  [/\[HIGHLIGHT:\s*([^\]]+)\]/g, "highlight"],
  [/\[SWITCH_AGENT:\s*([^\]]+)\]/g, "switchAgent"],
];

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
    if (["ceo", "cto", "scout", "validator"].includes(key)) {
      result.switchAgent = key as AgentKey;
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

  // Strip all special tags from displayed text
  text = text
    .replace(/\[NAVIGATE:[^\]]+\]/g, "")
    .replace(/\[HIGHLIGHT:[^\]]+\]/g, "")
    .replace(/\[SWITCH_AGENT:[^\]]+\]/g, "")
    .replace(/\[BESLISSING:[^\]]+\]/g, "")
    .replace(/\[SHOW_SECTION:[^\]]+\]/g, "");

  result.text = text;
  return result;
}
