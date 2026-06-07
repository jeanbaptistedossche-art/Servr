export type AgentKey = "ceo" | "cto" | "scout" | "validator";

export type AgentConfig = {
  name: string;
  emoji: string;
  color: string;
  placeholder: string;
  description: string;
};

export const AGENTS: Record<AgentKey, AgentConfig> = {
  ceo: {
    name: "CEO",
    emoji: "🧠",
    color: "#7c3aed",
    placeholder: "Ask the CEO anything about strategy, priorities, or the business...",
    description: "Strategy & decisions",
  },
  cto: {
    name: "CTO",
    emoji: "⚙️",
    color: "#059669",
    placeholder: "Ask the CTO about code, architecture, bugs, or features...",
    description: "Code & infrastructure",
  },
  scout: {
    name: "Scout",
    emoji: "🔍",
    color: "#d97706",
    placeholder: "Ask Scout about competitors, market trends, or opportunities...",
    description: "Market intelligence",
  },
  validator: {
    name: "Validator",
    emoji: "✅",
    color: "#dc2626",
    placeholder: "Ask Validator to score a feature idea or stress-test a decision...",
    description: "Fit checks & RED TEAM",
  },
};

export const AGENT_KEYS = Object.keys(AGENTS) as AgentKey[];
