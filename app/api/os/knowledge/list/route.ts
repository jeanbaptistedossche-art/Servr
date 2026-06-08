import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");

function listFiles(dir: string, base = ""): { path: string; mtime: number }[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: { path: string; mtime: number }[] = [];
    for (const e of entries) {
      const rel = base ? `${base}/${e.name}` : e.name;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        files.push(...listFiles(full, rel));
      } else if (e.name.endsWith(".md")) {
        const stat = fs.statSync(full);
        files.push({ path: rel, mtime: stat.mtimeMs });
      }
    }
    return files;
  } catch {
    return [];
  }
}

export async function GET() {
  const files = listFiles(KNOWLEDGE_ROOT);
  return NextResponse.json({ files });
}
