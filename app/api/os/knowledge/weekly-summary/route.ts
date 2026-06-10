import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { requireFounderApi } from "@/lib/os/requireFounderApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");
const SESSIONS_DIR = path.join(KNOWLEDGE_ROOT, "sessions");

function getThisWeekSessions(): string {
  try {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith(".md"))
      .filter(f => {
        const stat = fs.statSync(path.join(SESSIONS_DIR, f));
        return stat.mtimeMs > oneWeekAgo;
      });

    return files
      .map(f => {
        try { return fs.readFileSync(path.join(SESSIONS_DIR, f), "utf-8"); }
        catch { return ""; }
      })
      .join("\n\n---\n\n")
      .slice(0, 12000); // limit context
  } catch {
    return "(Geen sessies gevonden)";
  }
}

export async function GET() {
  const deny = await requireFounderApi();
  if (deny) return deny;

  try {
    const sessions = getThisWeekSessions();
    const weekNum = Math.ceil((new Date().getDate()) / 7);
    const year = new Date().getFullYear();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: "Je bent de CEO van Servr. Schrijf een wekelijkse samenvatting van de agent sessies. Beknopt, in het Nederlands, in Markdown. Max 400 woorden.",
      messages: [{
        role: "user",
        content: `Hier zijn de agent sessies van deze week:\n\n${sessions}\n\nSchrijf een wekelijkse samenvatting met: wat er is gebeurd, beslissingen genomen, wat agents hebben geleerd, prioriteiten volgende week.`,
      }],
    });

    const summary = (message.content[0] as { type: string; text: string }).text;

    const fullContent = `# Wekelijkse Samenvatting — Week ${weekNum} ${year}\n\nGegenereerd: ${new Date().toLocaleDateString("nl-BE")}\n\n${summary}\n`;

    fs.writeFileSync(path.join(KNOWLEDGE_ROOT, "shared", "weekly-summary.md"), fullContent);

    return NextResponse.json({ success: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
