import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireFounderApi } from "@/lib/os/requireFounderApi";

const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");

function safePath(file: string): string | null {
  // Prevent path traversal
  const resolved = path.resolve(KNOWLEDGE_ROOT, file);
  if (!resolved.startsWith(KNOWLEDGE_ROOT)) return null;
  return resolved;
}

// GET ?file=agents/cto/learnings.md
export async function GET(req: NextRequest) {
  const deny = await requireFounderApi();
  if (deny) return deny;

  const file = req.nextUrl.searchParams.get("file");
  if (!file) return NextResponse.json({ error: "file parameter required" }, { status: 400 });

  const filePath = safePath(file);
  if (!filePath) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "" });
  }
}

// GET all files list
export async function HEAD() {
  function listFiles(dir: string, base = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const e of entries) {
      const rel = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) files.push(...listFiles(path.join(dir, e.name), rel));
      else if (e.name.endsWith(".md")) files.push(rel);
    }
    return files;
  }
  const files = listFiles(KNOWLEDGE_ROOT);
  return NextResponse.json({ files });
}

// POST { file, content, append }
export async function POST(req: NextRequest) {
  const deny = await requireFounderApi();
  if (deny) return deny;

  try {
    const { file, content, append = true } = await req.json();
    if (!file || content === undefined) {
      return NextResponse.json({ error: "file and content required" }, { status: 400 });
    }

    const filePath = safePath(file);
    if (!filePath) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (append) {
      fs.appendFileSync(filePath, "\n" + content);
    } else {
      fs.writeFileSync(filePath, content);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
