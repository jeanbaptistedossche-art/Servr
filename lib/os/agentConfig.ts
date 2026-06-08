export type AgentKey =
  | "ceo"
  | "cto"
  | "scout"
  | "validator"
  | "cfo"
  | "ux"
  | "growth"
  | "legal"
  | "security"
  | "ops"
  | "dna"
  | "scenario"
  | "launch";

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
    placeholder: "Strategie, prioriteiten, beslissingen...",
    description: "Strategie & beslissingen",
  },
  cto: {
    name: "CTO",
    emoji: "⚙️",
    color: "#059669",
    placeholder: "Code, bugs, features, deployment...",
    description: "Code & infra",
  },
  scout: {
    name: "Scout",
    emoji: "🔍",
    color: "#d97706",
    placeholder: "Concurrenten, markttrends, kansen...",
    description: "Marktintelligentie",
  },
  validator: {
    name: "Validator",
    emoji: "✅",
    color: "#dc2626",
    placeholder: "Score een feature, RED TEAM, fit check...",
    description: "Fit checks & RED TEAM",
  },
  cfo: {
    name: "CFO",
    emoji: "💰",
    color: "#0ea5e9",
    placeholder: "Metrics, revenue, WAT, unit economics...",
    description: "Metrics & finance",
  },
  ux: {
    name: "UX",
    emoji: "🎨",
    color: "#ec4899",
    placeholder: "Friction, onboarding, gebruikerservaring...",
    description: "UX & friction",
  },
  growth: {
    name: "Growth",
    emoji: "📣",
    color: "#f59e0b",
    placeholder: "Acquisitie, kanalen, experimenten...",
    description: "Groei & acquisitie",
  },
  legal: {
    name: "Legal",
    emoji: "⚖️",
    color: "#6366f1",
    placeholder: "GDPR, voorwaarden, Belgisch recht...",
    description: "Legal & compliance",
  },
  security: {
    name: "Security",
    emoji: "🔐",
    color: "#ef4444",
    placeholder: "RLS, auth, Stripe security, vulnerabilities...",
    description: "Security & RLS",
  },
  ops: {
    name: "Ops",
    emoji: "🔧",
    color: "#14b8a6",
    placeholder: "Uptime, errors, Vercel logs, performance...",
    description: "Ops & monitoring",
  },
  dna: {
    name: "DNA",
    emoji: "🧬",
    color: "#a855f7",
    placeholder: "Analyseer mijn beslissingspatronen...",
    description: "Founder patronen",
  },
  scenario: {
    name: "Scenario",
    emoji: "🔮",
    color: "#64748b",
    placeholder: "Wat als Werkspot gratis wordt? Simuleer een crisis...",
    description: "Crisis simulaties",
  },
  launch: {
    name: "Launch",
    emoji: "🚀",
    color: "#22c55e",
    placeholder: "LAUNCH CHECK — ben ik klaar voor productie?",
    description: "Launch readiness",
  },
};

export const AGENT_KEYS = Object.keys(AGENTS) as AgentKey[];
