export type AgentKey =
  | "ceo" | "cto" | "scout" | "validator"
  | "marketing" | "data" | "finance" | "operations"
  | "trust" | "meta";

export type AgentConfig = {
  name: string;
  emoji: string;
  color: string;
  placeholder: string;
  description: string;
  tools: string[];
  platforms: string[];
  aiTools: string[];
  status: "LIVE" | "BUILDING" | "SCANNING" | "IDLE";
  currentTask: string;
  progress: number;
  logLine: string;
};

export const AGENTS: Record<AgentKey, AgentConfig> = {
  ceo: {
    name: "CEO",
    emoji: "🧠",
    color: "#9060ff",
    placeholder: "Ask the CEO anything about strategy, priorities, or the business...",
    description: "Strategy & decisions",
    tools: [], platforms: [], aiTools: [],
    status: "LIVE", currentTask: "Reviewing weekly KPIs + competitor report", progress: 82,
    logLine: "↳ synthesizing Intelligence + Finance brief",
  },
  cto: {
    name: "Product",
    emoji: "⚙️",
    color: "#00e096",
    placeholder: "Ask the CTO about code, architecture, bugs, or features...",
    description: "Code & infrastructure",
    tools: ["Claude Code", "Sentry"],
    platforms: ["GitHub", "Vercel", "Supabase"],
    aiTools: ["Claude Code", "Sentry"],
    status: "BUILDING", currentTask: "Deploying GPS tracking feature", progress: 67,
    logLine: "↳ deploying campaign #3",
  },
  scout: {
    name: "Intelligence",
    emoji: "🔍",
    color: "#00dcff",
    placeholder: "Ask Scout about competitors, market trends, or opportunities...",
    description: "Market intelligence",
    tools: ["Perplexity", "Brandwatch"],
    platforms: ["Twitter", "Reddit", "LinkedIn"],
    aiTools: ["Perplexity", "Brandwatch"],
    status: "SCANNING", currentTask: "Scanning Werkspot pricing changes", progress: 55,
    logLine: "↳ scanning 6 competitor sources",
  },
  validator: {
    name: "Validator",
    emoji: "✅",
    color: "#ff3c5a",
    placeholder: "Ask Validator to score a feature idea or stress-test a decision...",
    description: "Fit checks & RED TEAM",
    tools: [], platforms: [], aiTools: [],
    status: "IDLE", currentTask: "Awaiting next validation request", progress: 0,
    logLine: "↳ last: scored escrow 21/25",
  },
  marketing: {
    name: "Marketing",
    emoji: "📣",
    color: "#ff5faa",
    placeholder: "Ask Marketing about campaigns, creatives, or ad performance...",
    description: "Campaigns & growth",
    tools: ["Jasper", "AdCreative"],
    platforms: ["Facebook", "Instagram", "TikTok"],
    aiTools: ["Jasper", "AdCreative"],
    status: "LIVE", currentTask: "Auto-boosting TikTok video (2.4k views)", progress: 78,
    logLine: "↳ boosting reel — budget €50/day",
  },
  data: {
    name: "Data",
    emoji: "📊",
    color: "#9060ff",
    placeholder: "Ask Data about analytics, trends, or business metrics...",
    description: "Analytics & insights",
    tools: ["obviously.ai", "PostHog"],
    platforms: ["Supabase", "Stripe", "Mixpanel"],
    aiTools: ["obviously.ai", "PostHog"],
    status: "SCANNING", currentTask: "Running churn prediction model", progress: 44,
    logLine: "↳ churn risk: 3 users flagged",
  },
  finance: {
    name: "Finance",
    emoji: "💰",
    color: "#ffaa30",
    placeholder: "Ask Finance about revenue, costs, or financial health...",
    description: "Revenue & costs",
    tools: ["Vic.ai", "Runway"],
    platforms: ["Stripe", "Exact Online"],
    aiTools: ["Vic.ai", "Runway"],
    status: "LIVE", currentTask: "Processing Stripe webhooks + Exact sync", progress: 91,
    logLine: "↳ 14 invoices synced today",
  },
  operations: {
    name: "Operations",
    emoji: "🔧",
    color: "#4880ff",
    placeholder: "Ask Ops about infrastructure, health, or incidents...",
    description: "Infrastructure & health",
    tools: ["Datadog", "PagerDuty"],
    platforms: ["Vercel", "Supabase", "BetterUptime"],
    aiTools: ["Datadog", "PagerDuty"],
    status: "LIVE", currentTask: "Monitoring all systems (5m interval)", progress: 99,
    logLine: "↳ uptime 99.8% — no alerts",
  },
  trust: {
    name: "Trust & Safety",
    emoji: "🔒",
    color: "#ff3c5a",
    placeholder: "Ask Trust & Safety about fraud, safety, or compliance...",
    description: "Fraud & compliance",
    tools: ["Sardine", "Sift"],
    platforms: ["Stripe Radar", "Supabase"],
    aiTools: ["Sardine", "Sift"],
    status: "IDLE", currentTask: "No active alerts — monitoring passively", progress: 15,
    logLine: "↳ 0 suspicious transactions today",
  },
  meta: {
    name: "Meta",
    emoji: "🧬",
    color: "rgba(238,240,255,.6)",
    placeholder: "Ask Meta to improve agent prompts or review agent performance...",
    description: "Improves other agents",
    tools: [], platforms: [], aiTools: [],
    status: "IDLE", currentTask: "Scheduled: Sunday 20:00 — prompt review", progress: 0,
    logLine: "↳ last: improved Scout recall by 23%",
  },
};

export const AGENT_KEYS = Object.keys(AGENTS) as AgentKey[];
