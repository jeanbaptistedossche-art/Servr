import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseMarkdownTable } from "@/lib/os/parseMarkdownTable";
import { requireFounderApi } from "@/lib/os/requireFounderApi";

const ROOT = process.cwd();
const STATE_PATH   = path.join(ROOT, "STATE.md");
const BACKLOG_PATH = path.join(ROOT, "BACKLOG.md");

function readSafe(p: string) {
  try { return fs.readFileSync(p, "utf-8"); } catch { return ""; }
}

function parseAgentActivity(stateMd: string) {
  const ts = new Date().toISOString();
  const blank = { lastActive: "—", lastAction: "—" };
  const ctoMatch = stateMd.match(/⚙️ CTO RAPPORT — ([^\n]+)/);
  return {
    ceo:       { ...blank, lastActive: ts },
    cto:       { lastActive: ctoMatch ? ctoMatch[1] : "—", lastAction: "—" },
    scout:     blank,
    validator: blank,
  };
}

export async function GET() {
  const deny = await requireFounderApi();
  if (deny) return deny;

  const stateMd   = readSafe(STATE_PATH);
  const backlogMd = readSafe(BACKLOG_PATH);

  const backlog = {
    sprintQueue:   parseMarkdownTable(backlogMd, "SPRINT_QUEUE"),
    approvedTasks: parseMarkdownTable(backlogMd, "APPROVED_TASKS"),
    marketSignals: parseMarkdownTable(backlogMd, "MARKET_SIGNALS"),
    inProgress:    parseMarkdownTable(backlogMd, "IN_PROGRESS"),
    done:          parseMarkdownTable(backlogMd, "DONE"),
  };

  return NextResponse.json({
    state: stateMd,
    backlog,
    agentActivity: parseAgentActivity(stateMd),
  });
}

export async function POST(req: NextRequest) {
  const deny = await requireFounderApi();
  if (deny) return deny;

  try {
    const { file, content } = await req.json() as { file: "STATE" | "BACKLOG"; content: string };
    const targetPath = file === "BACKLOG" ? BACKLOG_PATH : STATE_PATH;
    fs.writeFileSync(targetPath, content, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
