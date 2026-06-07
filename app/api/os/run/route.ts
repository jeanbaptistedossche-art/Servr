import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function readFile(filename: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), filename), "utf-8");
  } catch {
    return `(${filename} niet gevonden)`;
  }
}

function buildSystemPrompt(ceoAgentMd: string, stateMd: string, backlogMd: string): string {
  // Strip frontmatter from agent definition
  const agentBody = ceoAgentMd.replace(/^---[\s\S]*?---\n/, "");

  return `${agentBody}

---

## HUIDIGE CONTEXT (automatisch geladen)

### STATE.md
\`\`\`
${stateMd}
\`\`\`

### BACKLOG.md
\`\`\`
${backlogMd}
\`\`\`

---

## INSTRUCTIE
Reageer als CEO van Servr. Verwerk het commando van Jean-Baptiste.
Gebruik het SITREP formaat wanneer relevant.
Schrijf in het Nederlands. Wees direct en concreet.
Vandaag is het ${new Date().toLocaleDateString("nl-BE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;
}

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();

    if (!command?.trim()) {
      return new Response("Geen commando meegegeven", { status: 400 });
    }

    const ceoAgentMd = readFile(".claude/agents/ceo-agent.md");
    const stateMd    = readFile("STATE.md");
    const backlogMd  = readFile("BACKLOG.md");

    const systemPrompt = buildSystemPrompt(ceoAgentMd, stateMd, backlogMd);

    // Stream response from Anthropic
    const stream = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: command }],
      stream: true,
    });

    // Pipe Anthropic stream to a ReadableStream for the browser
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onbekende fout";
    return new Response(`Fout: ${msg}`, { status: 500 });
  }
}
